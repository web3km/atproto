import { subsystemLogger } from '@bluesky-social/common'

export const logger: ReturnType<typeof subsystemLogger> =
  subsystemLogger('bsky:image')

export default logger
