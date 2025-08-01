import { KeyObject, createPublicKey, createSecretKey } from 'node:crypto'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Request } from 'express'
import * as jose from 'jose'
import KeyEncoder from 'key-encoder'
import { getVerificationMaterial } from '@bluesky-social/common'
import { IdResolver, getDidKeyFromMultibase } from '@bluesky-social/identity'
import {
  OAuthError,
  OAuthVerifier,
  WWWAuthenticateError,
} from '@bluesky-social/oauth-provider'
import {
  AuthRequiredError,
  ForbiddenError,
  InvalidRequestError,
  XRPCError,
  parseReqNsid,
  verifyJwt as verifyServiceJwt,
} from '@bluesky-social/xrpc-server'
import { AccountManager } from './account-manager/account-manager'
import { softDeleted } from './db'
import { oauthLogger } from './logger'

type ReqCtx = { req: IncomingMessage; res?: ServerResponse }

// @TODO sync-up with current method names, consider backwards compat.
export enum AuthScope {
  Access = 'com.atproto.access',
  Refresh = 'com.atproto.refresh',
  AppPass = 'com.atproto.appPass',
  AppPassPrivileged = 'com.atproto.appPassPrivileged',
  SignupQueued = 'com.atproto.signupQueued',
  Takendown = 'com.atproto.takendown',
}

export type AccessOpts = {
  additional: AuthScope[]
  checkTakedown: boolean
  checkDeactivated: boolean
}

export enum RoleStatus {
  Valid,
  Invalid,
  Missing,
}

export type NullOutput = {
  credentials: null
}

export type AdminTokenOutput = {
  credentials: {
    type: 'admin_token'
  }
}

export type ModServiceOutput = {
  credentials: {
    type: 'mod_service'
    aud: string
    iss: string
  }
}

export type AccessOutput = {
  credentials: {
    type: 'access'
    did: string
    scope: AuthScope
    isPrivileged: boolean
  }
}

export type OAuthOutput = {
  credentials: {
    type: 'oauth'
    did: string
    scope: AuthScope
    isPrivileged: boolean
    oauthScopes: Set<string>
  }
}

export type RefreshOutput = {
  credentials: {
    type: 'refresh'
    did: string
    scope: AuthScope
    tokenId: string
  }
}

export type UserServiceAuthOutput = {
  credentials: {
    type: 'user_service_auth'
    aud: string
    did: string
  }
}

type ValidatedBearer = {
  did: string
  scope: AuthScope
  token: string
  payload: jose.JWTPayload
  audience: string | undefined
}

type ValidatedRefreshBearer = ValidatedBearer & {
  tokenId: string
}

export type AuthVerifierOpts = {
  publicUrl: string
  jwtKey: KeyObject
  adminPass: string
  dids: {
    pds: string
    entryway?: string
    modService?: string
  }
}

export class AuthVerifier {
  private _publicUrl: string
  private _jwtKey: KeyObject
  private _adminPass: string
  public dids: AuthVerifierOpts['dids']

  constructor(
    public accountManager: AccountManager,
    public idResolver: IdResolver,
    public oauthVerifier: OAuthVerifier,
    opts: AuthVerifierOpts,
  ) {
    this._publicUrl = opts.publicUrl
    this._jwtKey = opts.jwtKey
    this._adminPass = opts.adminPass
    this.dids = opts.dids
  }

  // verifiers (arrow fns to preserve scope)

  accessStandard =
    (opts: Partial<AccessOpts> = {}) =>
    async (ctx: ReqCtx): Promise<AccessOutput | OAuthOutput> => {
      return this.validateAccessToken(
        ctx,
        [
          AuthScope.Access,
          AuthScope.AppPassPrivileged,
          AuthScope.AppPass,
          ...(opts.additional ?? []),
        ],
        opts,
      )
    }

  accessFull =
    (opts: Partial<AccessOpts> = {}) =>
    (ctx: ReqCtx): Promise<AccessOutput | OAuthOutput> => {
      return this.validateAccessToken(
        ctx,
        [AuthScope.Access, ...(opts.additional ?? [])],
        opts,
      )
    }

  accessPrivileged =
    (opts: Partial<AccessOpts> = {}) =>
    (ctx: ReqCtx): Promise<AccessOutput | OAuthOutput> => {
      return this.validateAccessToken(ctx, [
        AuthScope.Access,
        AuthScope.AppPassPrivileged,
        ...(opts.additional ?? []),
      ])
    }

  refresh = async (ctx: ReqCtx): Promise<RefreshOutput> => {
    const { did, scope, tokenId } = await this.validateRefreshToken(ctx)

    return {
      credentials: {
        type: 'refresh',
        did,
        scope,
        tokenId,
      },
    }
  }

  refreshExpired = async (ctx: ReqCtx): Promise<RefreshOutput> => {
    const { did, scope, tokenId } = await this.validateRefreshToken(ctx, {
      clockTolerance: Infinity,
    })

    return {
      credentials: {
        type: 'refresh',
        did,
        scope,
        tokenId,
      },
    }
  }

  adminToken = async (ctx: ReqCtx): Promise<AdminTokenOutput> => {
    this.setAuthHeaders(ctx)
    return this.validateAdminToken(ctx)
  }

  optionalAccessOrAdminToken =
    (opts: Partial<AccessOpts> = {}) =>
    async (
      ctx: ReqCtx,
    ): Promise<AccessOutput | OAuthOutput | AdminTokenOutput | NullOutput> => {
      if (isAccessToken(ctx.req)) {
        return await this.accessStandard(opts)(ctx)
      } else if (isBasicToken(ctx.req)) {
        return await this.adminToken(ctx)
      } else {
        return this.null(ctx)
      }
    }

  userServiceAuth = async (ctx: ReqCtx): Promise<UserServiceAuthOutput> => {
    const payload = await this.verifyServiceJwt(ctx, {
      aud: null,
      iss: null,
    })
    if (
      payload.aud !== this.dids.pds &&
      (!this.dids.entryway || payload.aud !== this.dids.entryway)
    ) {
      throw new AuthRequiredError(
        'jwt audience does not match service did',
        'BadJwtAudience',
      )
    }
    return {
      credentials: {
        type: 'user_service_auth',
        aud: payload.aud,
        did: payload.iss,
      },
    }
  }

  userServiceAuthOptional = async (
    ctx: ReqCtx,
  ): Promise<UserServiceAuthOutput | NullOutput> => {
    if (isBearerToken(ctx.req)) {
      return await this.userServiceAuth(ctx)
    } else {
      return this.null(ctx)
    }
  }

  accessOrUserServiceAuth =
    (opts: Partial<AccessOpts> = {}) =>
    async (
      ctx: ReqCtx,
    ): Promise<UserServiceAuthOutput | AccessOutput | OAuthOutput> => {
      const token = bearerTokenFromReq(ctx.req)
      if (token) {
        const payload = jose.decodeJwt(token)
        if (payload['lxm']) {
          return this.userServiceAuth(ctx)
        }
      }
      return this.accessStandard(opts)(ctx)
    }

  modService = async (ctx: ReqCtx): Promise<ModServiceOutput> => {
    if (!this.dids.modService) {
      throw new AuthRequiredError('Untrusted issuer', 'UntrustedIss')
    }
    const payload = await this.verifyServiceJwt(ctx, {
      aud: null,
      iss: [this.dids.modService, `${this.dids.modService}#atproto_labeler`],
    })
    if (
      payload.aud !== this.dids.pds &&
      (!this.dids.entryway || payload.aud !== this.dids.entryway)
    ) {
      throw new AuthRequiredError(
        'jwt audience does not match service did',
        'BadJwtAudience',
      )
    }
    return {
      credentials: {
        type: 'mod_service',
        aud: payload.aud,
        iss: payload.iss,
      },
    }
  }

  moderator = async (
    ctx: ReqCtx,
  ): Promise<AdminTokenOutput | ModServiceOutput> => {
    if (isBearerToken(ctx.req)) {
      return this.modService(ctx)
    } else {
      return this.adminToken(ctx)
    }
  }

  protected async validateAdminToken({
    req,
  }: ReqCtx): Promise<AdminTokenOutput> {
    const parsed = parseBasicAuth(req.headers.authorization)
    if (!parsed) {
      throw new AuthRequiredError()
    }
    const { username, password } = parsed
    if (username !== 'admin' || password !== this._adminPass) {
      throw new AuthRequiredError()
    }

    return { credentials: { type: 'admin_token' } }
  }

  protected async validateRefreshToken(
    ctx: ReqCtx,
    verifyOptions?: Omit<jose.JWTVerifyOptions, 'audience' | 'typ'>,
  ): Promise<ValidatedRefreshBearer> {
    const result = await this.validateBearerToken(ctx, [AuthScope.Refresh], {
      ...verifyOptions,
      typ: 'refresh+jwt',
      // when using entryway, proxying refresh credentials
      audience: this.dids.entryway ? this.dids.entryway : this.dids.pds,
    })
    const tokenId = result.payload.jti
    if (!tokenId) {
      throw new AuthRequiredError(
        'Unexpected missing refresh token id',
        'MissingTokenId',
      )
    }
    return { ...result, tokenId }
  }

  protected async validateBearerToken(
    ctx: ReqCtx,
    scopes: AuthScope[],
    verifyOptions: jose.JWTVerifyOptions &
      Required<Pick<jose.JWTVerifyOptions, 'audience' | 'typ'>>,
  ): Promise<ValidatedBearer> {
    this.setAuthHeaders(ctx)

    const token = bearerTokenFromReq(ctx.req)
    if (!token) {
      throw new AuthRequiredError(undefined, 'AuthMissing')
    }

    const { payload, protectedHeader } = await this.jwtVerify(
      token,
      // @TODO: Once all access & refresh tokens have a "typ" claim (i.e. 90
      // days after this code was deployed), replace the following line with
      // "verifyOptions," (to re-enable the verification of the "typ" property
      // from verifyJwt()). Once the change is made, the "if" block below that
      // checks for "typ" can be removed.
      {
        ...verifyOptions,
        typ: undefined,
      },
    )

    // @TODO: remove the next check once all access & refresh tokens have "typ"
    // Note: when removing the check, make sure that the "verifyOptions"
    // contains the "typ" property, so that the token is verified correctly by
    // this.verifyJwt()
    if (protectedHeader.typ && verifyOptions.typ !== protectedHeader.typ) {
      // Temporarily allow historical tokens without "typ" to pass through. See:
      // createAccessToken() and createRefreshToken() in
      // src/account-manager/helpers/auth.ts
      throw new InvalidRequestError('Invalid token type', 'InvalidToken')
    }

    const { sub, aud, scope } = payload
    if (typeof sub !== 'string' || !sub.startsWith('did:')) {
      throw new InvalidRequestError('Malformed token', 'InvalidToken')
    }
    if (
      aud !== undefined &&
      (typeof aud !== 'string' || !aud.startsWith('did:'))
    ) {
      throw new InvalidRequestError('Malformed token', 'InvalidToken')
    }
    if (payload['cnf'] !== undefined) {
      // Proof-of-Possession (PoP) tokens are not allowed here
      // https://www.rfc-editor.org/rfc/rfc7800.html
      throw new InvalidRequestError('Malformed token', 'InvalidToken')
    }
    if (!isAuthScope(scope) || (scopes.length > 0 && !scopes.includes(scope))) {
      throw new InvalidRequestError('Bad token scope', 'InvalidToken')
    }
    return {
      did: sub,
      scope,
      audience: aud,
      token,
      payload,
    }
  }

  protected async validateAccessToken(
    ctx: ReqCtx,
    scopes: AuthScope[],
    {
      checkTakedown = false,
      checkDeactivated = false,
    }: { checkTakedown?: boolean; checkDeactivated?: boolean } = {},
  ): Promise<AccessOutput | OAuthOutput> {
    this.setAuthHeaders(ctx)

    let accessOutput: AccessOutput | OAuthOutput

    const [type] = parseAuthorizationHeader(ctx.req.headers.authorization)
    switch (type) {
      case AuthType.BEARER: {
        accessOutput = await this.validateBearerAccessToken(ctx, scopes)
        break
      }
      case AuthType.DPOP: {
        accessOutput = await this.validateDpopAccessToken(ctx, scopes)
        break
      }
      case null:
        throw new AuthRequiredError(undefined, 'AuthMissing')
      default:
        throw new InvalidRequestError(
          'Unexpected authorization type',
          'InvalidToken',
        )
    }

    if (checkTakedown || checkDeactivated) {
      const found = await this.accountManager.getAccount(
        accessOutput.credentials.did,
        {
          includeDeactivated: true,
          includeTakenDown: true,
        },
      )
      if (!found) {
        // will be turned into ExpiredToken for the client if proxied by entryway
        throw new ForbiddenError('Account not found', 'AccountNotFound')
      }
      if (checkTakedown && softDeleted(found)) {
        throw new AuthRequiredError(
          'Account has been taken down',
          'AccountTakedown',
        )
      }
      if (checkDeactivated && found.deactivatedAt) {
        throw new AuthRequiredError(
          'Account is deactivated',
          'AccountDeactivated',
        )
      }
    }

    return accessOutput
  }

  protected async validateDpopAccessToken(
    ctx: ReqCtx,
    scopes: AuthScope[],
  ): Promise<OAuthOutput> {
    this.setAuthHeaders(ctx)

    const { req } = ctx
    const res = 'res' in ctx ? ctx.res : null

    // https://datatracker.ietf.org/doc/html/rfc9449#section-8.2
    if (res) {
      const dpopNonce = this.oauthVerifier.nextDpopNonce()
      if (dpopNonce) {
        res.setHeader('DPoP-Nonce', dpopNonce)
        res.appendHeader('Access-Control-Expose-Headers', 'DPoP-Nonce')
      }
    }

    try {
      const originalUrl =
        ('originalUrl' in req && (req as Request).originalUrl) || req.url || '/'
      const url = new URL(originalUrl, this._publicUrl)
      const { tokenClaims, dpopProof } =
        await this.oauthVerifier.authenticateRequest(
          req.method || 'GET',
          url,
          req.headers,
          { audience: [this.dids.pds] },
        )

      // @TODO drop this once oauth provider no longer accepts DPoP proof with
      // query or fragment in "htu" claim.
      if (dpopProof?.htu.match(/[?#]/)) {
        oauthLogger.info(
          {
            client_id: tokenClaims.client_id,
            htu: dpopProof.htu,
          },
          'DPoP proof "htu" contains query or fragment',
        )
      }

      const { sub } = tokenClaims
      if (typeof sub !== 'string' || !sub.startsWith('did:')) {
        throw new InvalidRequestError('Malformed token', 'InvalidToken')
      }

      const oauthScopes = new Set(tokenClaims.scope?.split(' '))

      if (!oauthScopes.has('transition:generic')) {
        throw new AuthRequiredError(
          'Missing required scope: transition:generic',
          'InvalidToken',
        )
      }

      const scopeEquivalent: AuthScope = oauthScopes.has('transition:chat.bsky')
        ? AuthScope.AppPassPrivileged
        : AuthScope.AppPass

      if (!scopes.includes(scopeEquivalent)) {
        // AppPassPrivileged is sufficient but was not provided "transition:chat.bsky"
        if (scopes.includes(AuthScope.AppPassPrivileged)) {
          throw new InvalidRequestError(
            'Missing required scope: transition:chat.bsky',
            'InvalidToken',
          )
        }

        // AuthScope.Access and AuthScope.SignupQueued do not have an OAuth
        // scope equivalent.
        throw new InvalidRequestError(
          'DPoP access token cannot be used for this request',
          'InvalidToken',
        )
      }

      return {
        credentials: {
          type: 'oauth',
          did: tokenClaims.sub,
          scope: scopeEquivalent,
          oauthScopes,
          isPrivileged: scopeEquivalent === AuthScope.AppPassPrivileged,
        },
      }
    } catch (err) {
      // Make sure to include any WWW-Authenticate header in the response
      // (particularly useful for DPoP's "use_dpop_nonce" error)
      if (res && err instanceof WWWAuthenticateError) {
        res.setHeader('WWW-Authenticate', err.wwwAuthenticateHeader)
        res.appendHeader('Access-Control-Expose-Headers', 'WWW-Authenticate')
      }

      if (err instanceof OAuthError) {
        throw new XRPCError(err.status, err.error_description, err.error)
      }

      throw err
    }
  }

  protected async validateBearerAccessToken(
    ctx: ReqCtx,
    scopes: AuthScope[],
  ): Promise<AccessOutput> {
    const { did, scope } = await this.validateBearerToken(ctx, scopes, {
      audience: this.dids.pds,
      typ: 'at+jwt',
    })

    const isPrivileged =
      scope === AuthScope.Access || scope === AuthScope.AppPassPrivileged

    return {
      credentials: {
        type: 'access',
        did,
        scope,
        isPrivileged,
      },
    }
  }

  protected async verifyServiceJwt(
    ctx: ReqCtx,
    opts: { aud: string | null; iss: string[] | null },
  ) {
    this.setAuthHeaders(ctx)

    const getSigningKey = async (
      iss: string,
      forceRefresh: boolean,
    ): Promise<string> => {
      if (opts.iss !== null && !opts.iss.includes(iss)) {
        throw new AuthRequiredError('Untrusted issuer', 'UntrustedIss')
      }
      const [did, serviceId] = iss.split('#')
      const keyId =
        serviceId === 'atproto_labeler' ? 'atproto_label' : 'atproto'
      const didDoc = await this.idResolver.did.resolve(did, forceRefresh)
      if (!didDoc) {
        throw new AuthRequiredError('could not resolve iss did')
      }
      const parsedKey = getVerificationMaterial(didDoc, keyId)
      if (!parsedKey) {
        throw new AuthRequiredError('missing or bad key in did doc')
      }
      const didKey = getDidKeyFromMultibase(parsedKey)
      if (!didKey) {
        throw new AuthRequiredError('missing or bad key in did doc')
      }
      return didKey
    }

    const jwtStr = bearerTokenFromReq(ctx.req)
    if (!jwtStr) {
      throw new AuthRequiredError('missing jwt', 'MissingJwt')
    }
    const nsid = parseReqNsid(ctx.req)
    const payload = await verifyServiceJwt(
      jwtStr,
      opts.aud,
      nsid,
      getSigningKey,
    )
    return { iss: payload.iss, aud: payload.aud }
  }

  protected null(ctx: ReqCtx): NullOutput {
    this.setAuthHeaders(ctx)
    return {
      credentials: null,
    }
  }

  isUserOrAdmin(
    auth: AccessOutput | OAuthOutput | AdminTokenOutput | NullOutput,
    did: string,
  ): boolean {
    if (!auth.credentials) {
      return false
    } else if (auth.credentials.type === 'admin_token') {
      return true
    } else {
      return auth.credentials.did === did
    }
  }

  protected async jwtVerify(
    token: string,
    verifyOptions?: jose.JWTVerifyOptions,
  ) {
    try {
      return await jose.jwtVerify(token, this._jwtKey, verifyOptions)
    } catch (err) {
      if (err?.['code'] === 'ERR_JWT_EXPIRED') {
        throw new InvalidRequestError('Token has expired', 'ExpiredToken')
      }
      throw new InvalidRequestError(
        'Token could not be verified',
        'InvalidToken',
      )
    }
  }

  protected setAuthHeaders(ctx: ReqCtx) {
    const res = 'res' in ctx ? ctx.res : null
    if (res) {
      res.setHeader('Cache-Control', 'private')
      vary(res, 'Authorization')
    }
  }
}

// HELPERS
// ---------

enum AuthType {
  BASIC = 'Basic',
  BEARER = 'Bearer',
  DPOP = 'DPoP',
}

export const parseAuthorizationHeader = (
  authorization?: string,
): [type: null] | [type: AuthType, token: string] => {
  if (!authorization) return [null]

  const result = authorization.split(' ')
  if (result.length !== 2) {
    throw new InvalidRequestError(
      'Malformed authorization header',
      'InvalidToken',
    )
  }

  // authorization type is case-insensitive
  const authType = result[0].toUpperCase()

  const type = Object.hasOwn(AuthType, authType) ? AuthType[authType] : null
  if (type) return [type, result[1]]

  throw new InvalidRequestError(
    `Unsupported authorization type: ${result[0]}`,
    'InvalidToken',
  )
}

const isAccessToken = (req: IncomingMessage): boolean => {
  const [type] = parseAuthorizationHeader(req.headers.authorization)
  return type === AuthType.BEARER || type === AuthType.DPOP
}

const isBearerToken = (req: IncomingMessage): boolean => {
  const [type] = parseAuthorizationHeader(req.headers.authorization)
  return type === AuthType.BEARER
}

const isBasicToken = (req: IncomingMessage): boolean => {
  const [type] = parseAuthorizationHeader(req.headers.authorization)
  return type === AuthType.BASIC
}

const bearerTokenFromReq = (req: IncomingMessage) => {
  const [type, token] = parseAuthorizationHeader(req.headers.authorization)
  return type === AuthType.BEARER ? token : null
}

export const parseBasicAuth = (
  authorizationHeader?: string,
): { username: string; password: string } | null => {
  try {
    const [type, b64] = parseAuthorizationHeader(authorizationHeader)
    if (type !== AuthType.BASIC) return null
    const decoded = Buffer.from(b64, 'base64').toString('utf8')
    // We must not use split(':') because the password can contain colons
    const colon = decoded.indexOf(':')
    if (colon === -1) return null
    const username = decoded.slice(0, colon)
    const password = decoded.slice(colon + 1)
    return { username, password }
  } catch (err) {
    return null
  }
}

const authScopes = new Set(Object.values(AuthScope))
const isAuthScope = (val: unknown): val is AuthScope => {
  return authScopes.has(val as any)
}

export const createSecretKeyObject = (secret: string): KeyObject => {
  return createSecretKey(Buffer.from(secret))
}

export const createPublicKeyObject = (publicKeyHex: string): KeyObject => {
  const key = keyEncoder.encodePublic(publicKeyHex, 'raw', 'pem')
  return createPublicKey({ format: 'pem', key })
}

const keyEncoder = new KeyEncoder('secp256k1')

function vary(res: ServerResponse, value: string) {
  const current = res.getHeader('Vary')
  if (current == null || typeof current === 'number') {
    res.setHeader('Vary', value)
  } else {
    const alreadyIncluded = Array.isArray(current)
      ? current.some((value) => value.includes(value))
      : current.includes(value)
    if (!alreadyIncluded) {
      res.appendHeader('Vary', value)
    }
  }
}
