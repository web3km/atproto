import { FetchHandlerObject } from '@bluesky-social/xrpc'

export interface SessionManager extends FetchHandlerObject {
  readonly did?: string
}
