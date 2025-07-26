import { InvalidRequestError } from '@bluesky-social/xrpc-server'
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'

export default function (server: Server, _ctx: AppContext) {
  server.com.atproto.temp.fetchLabels(async (_reqCtx) => {
    throw new InvalidRequestError('not implemented on dataplane')
  })
}
