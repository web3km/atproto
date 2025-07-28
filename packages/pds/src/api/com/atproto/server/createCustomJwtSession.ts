import * as plc from '@did-plc/lib'
import { DidDocument, MINUTE, check } from '@bluesky-social/common'
import { ExportableKeypair, Keypair, Secp256k1Keypair } from '@bluesky-social/crypto'
import { AtprotoData, ensureAtpDocument } from '@bluesky-social/identity'
import { AuthRequiredError, InvalidRequestError } from '@bluesky-social/xrpc-server'
import {
  AccountStatus,
  formatAccountStatus,
} from '../../../../account-manager/account-manager'
import { JwtVerifier } from '../../../../auth/jwt-verifier'
import { AppContext } from '../../../../context'
import { softDeleted } from '../../../../db/util'
import { baseNormalizeAndValidate } from '../../../../handle'
import { Server } from '../../../../lexicon'
import { InputSchema as CreateCustomJwtSessionInput } from '../../../../lexicon/types/com/atproto/server/createCustomJwtSession'
import { syncEvtDataFromCommit } from '../../../../sequencer'
import { didDocForSession, safeResolveDidDoc } from './util'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.server.createCustomJwtSession({
    rateLimit: {
      durationMs: 5 * MINUTE,
      points: 100,
    },
    handler: async ({ input, req }) => {
      const jwtVerifier = new JwtVerifier({
        jwkEndpoint: ctx.cfg.jwksConfig?.jwksEndpoint || '',
        jwtVerifierId: ctx.cfg.jwksConfig?.jwtVerifierId || '',
      })
      const decodedJwt = await jwtVerifier.verifyJwt(
        input.body.options.id_token,
      )
      input.body.handle =
        decodedJwt.verifierId.split(':')[0].replace(/^@/, '') +
        'bs.' +
        ctx.cfg.service.hostname // 或 decodedJwt.claims.user_id
      const user = await ctx.accountManager.getAccount(input.body.handle)
      if (user) {
        const isSoftDeleted = softDeleted(user)
        const [{ accessJwt, refreshJwt }, didDoc] = await Promise.all([
          ctx.accountManager.createSession(user.did, null, isSoftDeleted),
          didDocForSession(ctx, user.did),
        ])
        const { status, active } = formatAccountStatus(user)
        return {
          encoding: 'application/json',
          body: {
            did: user.did,
            didDoc,
            handle: user.handle ?? '',
            accessJwt,
            refreshJwt,
            active,
            status,
          },
        }
      }

      const { did, handle, signingKey, plcOp, deactivated } = ctx.entrywayAgent
        ? await validateInputsForEntrywayPds(ctx, input.body)
        : await validateInputsForLocalPds(
            ctx,
            input.body,
            input.body.did || null,
          )

      let didDoc: DidDocument | undefined
      let creds: { accessJwt: string; refreshJwt: string }
      await ctx.actorStore.create(did, signingKey)
      try {
        const commit = await ctx.actorStore.transact(did, (actorTxn) =>
          actorTxn.repo.createRepo([]),
        )

        // Generate a real did with PLC
        if (plcOp) {
          try {
            await ctx.plcClient.sendOperation(did, plcOp)
          } catch (err) {
            req.log.error(
              { didKey: ctx.plcRotationKey.did(), handle },
              'failed to create did:plc',
            )
            throw err
          }
        }

        didDoc = await safeResolveDidDoc(ctx, did, true)

        creds = await ctx.accountManager.createCustomJwtSession({
          did,
          handle,
          repoCid: commit.cid,
          repoRev: commit.rev,
          externalId: decodedJwt.verifierId,
          externalProvider: 'custom_jwt',
        })
        console.log('creds:', creds)

        if (!deactivated) {
          await ctx.sequencer.sequenceIdentityEvt(did, handle)
          await ctx.sequencer.sequenceAccountEvt(did, AccountStatus.Active)
          await ctx.sequencer.sequenceCommit(did, commit)
          await ctx.sequencer.sequenceSyncEvt(
            did,
            syncEvtDataFromCommit(commit),
          )
        }
        await ctx.accountManager.updateRepoRoot(did, commit.cid, commit.rev)
        await ctx.actorStore.clearReservedKeypair(signingKey.did(), did)
      } catch (err) {
        // this will only be reached if the actor store _did not_ exist before
        await ctx.actorStore.destroy(did)
        throw err
      }
      const account = await ctx.accountManager.getAccount(handle)
      const { status, active } = formatAccountStatus(account)

      return {
        encoding: 'application/json',
        body: {
          handle,
          did: did,
          didDoc,
          accessJwt: creds.accessJwt,
          refreshJwt: creds.refreshJwt,
          active,
          status,
        },
      }
    },
  })
}

const validateInputsForEntrywayPds = async (
  ctx: AppContext,
  input: CreateCustomJwtSessionInput,
) => {
  const { did, plcOp } = input
  const handle = baseNormalizeAndValidate(input.handle || '')
  if (!did || !input.plcOp) {
    throw new InvalidRequestError(
      'non-entryway pds requires bringing a DID and plcOp',
    )
  }
  if (!check.is(plcOp, plc.def.operation)) {
    throw new InvalidRequestError('invalid plc operation', 'IncompatibleDidDoc')
  }
  const plcRotationKey = ctx.cfg.entryway?.plcRotationKey
  if (!plcRotationKey || !plcOp.rotationKeys.includes(plcRotationKey)) {
    throw new InvalidRequestError(
      'PLC DID does not include service rotation key',
      'IncompatibleDidDoc',
    )
  }
  try {
    await plc.assureValidOp(plcOp)
    await plc.assureValidSig([plcRotationKey], plcOp)
  } catch (err) {
    throw new InvalidRequestError('invalid plc operation', 'IncompatibleDidDoc')
  }
  const doc = plc.formatDidDoc({ did, ...plcOp })
  const data = ensureAtpDocument(doc)

  let signingKey: ExportableKeypair | undefined
  if (input.did) {
    signingKey = await ctx.actorStore.getReservedKeypair(input.did)
  }
  if (!signingKey) {
    signingKey = await ctx.actorStore.getReservedKeypair(data.signingKey)
  }
  if (!signingKey) {
    throw new InvalidRequestError('reserved signing key does not exist')
  }

  validateAtprotoData(data, {
    handle,
    pds: ctx.cfg.service.publicUrl,
    signingKey: signingKey.did(),
  })

  return {
    did,
    handle,
    email: undefined,
    password: undefined,
    inviteCode: undefined,
    signingKey,
    plcOp,
    deactivated: false,
  }
}

const validateInputsForLocalPds = async (
  ctx: AppContext,
  input: CreateCustomJwtSessionInput,
  requester: string | null,
) => {
  if (input.plcOp) {
    throw new InvalidRequestError('Unsupported input: "plcOp"')
  }

  const signingKey = await Secp256k1Keypair.create({ exportable: true })

  let did: string
  let plcOp: plc.Operation | null
  let deactivated = false
  if (input.did) {
    if (input.did !== requester) {
      throw new AuthRequiredError(
        `Missing auth to create account with did: ${input.did}`,
      )
    }
    did = input.did
    plcOp = null
    deactivated = true
  } else {
    const formatted = await formatDidAndPlcOp(
      ctx,
      input.handle || '',
      input,
      signingKey,
    )
    did = formatted.did
    plcOp = formatted.plcOp
  }

  return {
    did,
    handle: input.handle || '',
    signingKey,
    plcOp,
    deactivated,
  }
}

const formatDidAndPlcOp = async (
  ctx: AppContext,
  handle: string,
  input: CreateCustomJwtSessionInput,
  signingKey: Keypair,
): Promise<{
  did: string
  plcOp: plc.Operation | null
}> => {
  // if the user is not bringing a DID, then we format a create op for PLC
  const rotationKeys = [ctx.plcRotationKey.did()]
  if (ctx.cfg.identity.recoveryDidKey) {
    rotationKeys.unshift(ctx.cfg.identity.recoveryDidKey)
  }

  const plcCreate = await plc.createOp({
    signingKey: signingKey.did(),
    rotationKeys,
    handle,
    pds: ctx.cfg.service.publicUrl,
    signer: ctx.plcRotationKey,
  })
  return {
    did: plcCreate.did,
    plcOp: plcCreate.op,
  }
}
const validateAtprotoData = (
  data: AtprotoData,
  expected: {
    handle: string
    pds: string
    signingKey: string
  },
) => {
  // if the user is bringing their own did:
  // resolve the user's did doc data, including rotationKeys if did:plc
  // determine if we have the capability to make changes to their DID
  if (data.handle !== expected.handle) {
    throw new InvalidRequestError(
      'provided handle does not match DID document handle',
      'IncompatibleDidDoc',
    )
  } else if (data.pds !== expected.pds) {
    throw new InvalidRequestError(
      'DID document pds endpoint does not match service endpoint',
      'IncompatibleDidDoc',
    )
  } else if (data.signingKey !== expected.signingKey) {
    throw new InvalidRequestError(
      'DID document signing key does not match service signing key',
      'IncompatibleDidDoc',
    )
  }
}
