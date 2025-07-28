import { subsystemLogger } from '@bluesky-social/common'

export const logger: ReturnType<typeof subsystemLogger> =
  subsystemLogger('repo')

export default logger
