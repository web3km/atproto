import { Readable } from 'node:stream'
import { DidDocument, MINUTE, check } from '@bluesky-social/common'
import {
  ExportableKeypair,
  Keypair,
  Secp256k1Keypair,
} from '@bluesky-social/crypto'
import { AtprotoData, ensureAtpDocument } from '@bluesky-social/identity'
import {
  AuthRequiredError,
  InvalidRequestError,
} from '@bluesky-social/xrpc-server'
import * as plc from '@did-plc/lib'
import {
  AccountStatus,
  formatAccountStatus,
} from '../../../../account-manager/account-manager'
import { JwtVerifier } from '../../../../auth/jwt-verifier'
import { AppContext } from '../../../../context'
import { softDeleted } from '../../../../db/util'
import { baseNormalizeAndValidate } from '../../../../handle'
import { Server } from '../../../../lexicon'
import { ids } from '../../../../lexicon/lexicons'
import { InputSchema as CreateCustomJwtSessionInput } from '../../../../lexicon/types/com/atproto/server/createCustomJwtSession'
import { syncEvtDataFromCommit } from '../../../../sequencer'
import { didDocForSession, safeResolveDidDoc } from './util'

// 从URL获取图片并转换为流
const fetchImageAsStream = async (
  imageUrl: string,
): Promise<{ stream: Readable; mimeType: string }> => {
  try {
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`)
    }

    // 将Response转换为Node.js Readable流
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const stream = Readable.from(buffer)

    return {
      stream,
      mimeType: contentType,
    }
  } catch (err) {
    throw new Error(
      `Failed to fetch image from URL: ${err instanceof Error ? err.message : 'Unknown error'}`,
    )
  }
}

// 从 JWT 中提取 username 和 photo_url 并创建或更新 profile 记录
const createProfileFromJwt = async (
  ctx: AppContext,
  did: string,
  display_name: string,
  photo_url: string | undefined,
  req: any,
) => {
  if (!display_name || typeof display_name !== 'string') {
    return
  }

  try {
    const { prepareCreate, prepareUpdate } = await import('../../../../repo')

    // 检查是否已存在 profile 记录
    const existingRecord = await ctx.actorStore
      .read(did, async (store) => {
        const { AtUri } = await import('@bluesky-social/syntax')
        const uri = AtUri.make(did, ids.AppBskyActorProfile, 'self')
        return store.record.getRecord(uri, null, true)
      })
      .catch(() => null)

    let avatarBlobRef: any = undefined

    // 如果有photo_url，尝试获取并上传头像
    if (photo_url && typeof photo_url === 'string') {
      try {
        req.log.info({ did, photo_url }, 'fetching avatar from photo_url')

        // 获取图片流
        const { stream, mimeType } = await fetchImageAsStream(photo_url)

        // 上传图片到blob存储
        const blob = await ctx.actorStore.writeNoTransaction(
          did,
          async (store) => {
            let metadata: any
            try {
              metadata = await store.repo.blob.uploadBlobAndGetMetadata(
                mimeType,
                stream,
              )
            } catch (err) {
              if (err?.['name'] === 'AbortError') {
                throw new Error('Upload timed out, please try again.')
              }
              throw err
            }

            return store.transact(async (actorTxn) => {
              const blobRef =
                await actorTxn.repo.blob.trackUntetheredBlob(metadata)

              // make the blob permanent if an associated record is already indexed
              const recordsForBlob = await actorTxn.repo.blob.getRecordsForBlob(
                blobRef.ref,
              )
              if (recordsForBlob.length > 0) {
                await actorTxn.repo.blob.verifyBlobAndMakePermanent({
                  cid: blobRef.ref,
                  mimeType: blobRef.mimeType,
                  size: blobRef.size,
                  constraints: {},
                })
              }

              return blobRef
            })
          },
        )

        avatarBlobRef = blob
        req.log.info(
          { did, photo_url, blobRef: blob.ref.toString() },
          'successfully uploaded avatar from photo_url',
        )
      } catch (err) {
        req.log.error(
          { did, photo_url, err },
          'failed to fetch and upload avatar from photo_url',
        )
        // 不抛出错误，因为头像上传失败不应该影响整个profile创建流程
      }
    }

    let profileWrite
    if (existingRecord) {
      // 如果 profile 已存在，更新 displayName 和 avatar
      const { CID } = await import('multiformats/cid')
      const updatedRecord: any = {
        ...existingRecord.value,
        displayName: display_name,
      }

      // 如果有新的头像，添加到更新中
      if (avatarBlobRef) {
        updatedRecord.avatar = avatarBlobRef
      }

      profileWrite = await prepareUpdate({
        did,
        collection: ids.AppBskyActorProfile,
        rkey: 'self',
        record: updatedRecord,
        swapCid: CID.parse(existingRecord.cid),
      })
    } else {
      // 如果 profile 不存在，创建新的
      const newRecord: any = {
        $type: ids.AppBskyActorProfile,
        displayName: display_name,
        createdAt: new Date().toISOString(),
      }

      // 如果有头像，添加到新记录中
      if (avatarBlobRef) {
        newRecord.avatar = avatarBlobRef
      }

      profileWrite = await prepareCreate({
        did,
        collection: ids.AppBskyActorProfile,
        rkey: 'self',
        record: newRecord,
      })
    }

    const profileCommit = await ctx.actorStore.transact(
      did,
      async (actorTxn) => {
        return await actorTxn.repo.processWrites([profileWrite])
      },
    )

    // 序列化 profile 更新
    await ctx.sequencer.sequenceCommit(did, profileCommit)

    req.log.info(
      {
        did,
        display_name,
        hasAvatar: !!avatarBlobRef,
        action: existingRecord ? 'updated' : 'created',
      },
      'successfully created/updated profile with displayName and avatar from JWT',
    )
  } catch (err) {
    req.log.error(
      { did, display_name, photo_url, err },
      'failed to create/update profile with displayName and avatar from JWT',
    )
    // 不抛出错误，因为账户创建已经成功，profile 创建失败不应该影响整个流程
  }
}

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

      const email =
        decodedJwt.verifierId.split(':')[0].replace(/^@/, '') +
        '@' +
        ctx.cfg.service.hostname

      // 从 JWT claims 中提取 username 和 photo_url
      const display_name =
        decodedJwt.claims.display_name ||
        decodedJwt.verifierId.split(':')[0].replace(/^@/, '')

      const photo_url = decodedJwt.claims.photo_url

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

        // 为已有账号创建或更新 profile
        await createProfileFromJwt(ctx, user.did, display_name, photo_url, req)

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
          email: email,
          password: decodedJwt.verifierId + Date.now().toString(),
          repoCid: commit.cid,
          repoRev: commit.rev,
          externalId: decodedJwt.verifierId,
          externalProvider: 'custom_jwt',
        })

        // 为新账号创建 profile 记录
        await createProfileFromJwt(ctx, did, display_name, photo_url, req)

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
      await ctx.accountManager.updateEmail({
        did,
        email: email,
      })

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
