import { InvalidRequestError } from '@bluesky-social/xrpc-server'
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import { formatAccountInfo } from './util'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.admin.getAccountInfo({
    auth: ctx.authVerifier.moderator,
    handler: async ({ params }) => {
      const [account, invites, invitedBy] = await Promise.all([
        ctx.accountManager.getAccount(params.did, {
          includeDeactivated: true,
          includeTakenDown: true,
        }),
        ctx.accountManager.getAccountInvitesCodes(params.did),
        ctx.accountManager.getInvitedByForAccounts([params.did]),
      ])
      if (!account) {
        throw new InvalidRequestError('Account not found', 'NotFound')
      }
      const managesOwnInvites = !ctx.cfg.entryway
      return {
        encoding: 'application/json',
        body: formatAccountInfo(account, {
          managesOwnInvites,
          invitedBy,
          invites,
        }),
      }
    },
  })
}
