import { DAY } from '@bluesky-social/common'
import { UpstreamTimeoutError } from '@bluesky-social/xrpc-server'
import { BlobMetadata } from '../../../../actor-store/blob/transactor'
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.repo.uploadBlob({
    auth: ctx.authVerifier.accessOrUserServiceAuth({
      checkTakedown: true,
    }),
    rateLimit: {
      durationMs: DAY,
      points: 1000,
    },
    handler: async ({ auth, input }) => {
      const requester = auth.credentials.did

      const blob = await ctx.actorStore.writeNoTransaction(
        requester,
        async (store) => {
          let metadata: BlobMetadata
          try {
            metadata = await store.repo.blob.uploadBlobAndGetMetadata(
              input.encoding,
              input.body,
            )
          } catch (err) {
            if (err?.['name'] === 'AbortError') {
              throw new UpstreamTimeoutError(
                'Upload timed out, please try again.',
              )
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

      console.log('blob:', blob)

      return {
        encoding: 'application/json',
        body: {
          blob,
        },
      }
    },
  })
}
