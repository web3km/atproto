import { subsystemLogger } from '@bluesky-social/common'

export const logger: ReturnType<typeof subsystemLogger> =
  subsystemLogger('xrpc-stream')

export default logger
