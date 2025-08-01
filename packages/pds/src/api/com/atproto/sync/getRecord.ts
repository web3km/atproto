import stream from 'node:stream'
import { byteIterableToStream } from '@bluesky-social/common'
import * as repo from '@bluesky-social/repo'
import { InvalidRequestError } from '@bluesky-social/xrpc-server'
import { SqlRepoReader } from '../../../../actor-store/repo/sql-repo-reader'
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import { assertRepoAvailability } from './util'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.sync.getRecord({
    auth: ctx.authVerifier.optionalAccessOrAdminToken(),
    handler: async ({ params, auth }) => {
      const { did, collection, rkey } = params
      await assertRepoAvailability(
        ctx,
        did,
        ctx.authVerifier.isUserOrAdmin(auth, did),
      )

      // must open up the db outside of store interface so that we can close the file handle after finished streaming
      const actorDb = await ctx.actorStore.openDb(did)

      let carStream: stream.Readable
      try {
        const storage = new SqlRepoReader(actorDb)
        const commit = await storage.getRoot()

        if (!commit) {
          throw new InvalidRequestError(`Could not find repo for DID: ${did}`)
        }
        const carIter = repo.getRecords(storage, commit, [{ collection, rkey }])
        carStream = byteIterableToStream(carIter)
      } catch (err) {
        actorDb.close()
        throw err
      }
      const closeDb = () => actorDb.close()
      carStream.on('error', closeDb)
      carStream.on('close', closeDb)

      return {
        encoding: 'application/vnd.ipld.car',
        body: carStream,
      }
    },
  })
}
