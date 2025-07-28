import { Lexicons } from '@bluesky-social/lexicon'
import { lexicons as internalLexicons } from './client/lexicons'

export { AtUri } from '@bluesky-social/syntax'
export {
  BlobRef,
  jsonStringToLex,
  jsonToLex,
  lexToJson,
  stringifyLex,
} from '@bluesky-social/lexicon'
export { parseLanguage } from '@bluesky-social/common-web'
export * from './types'
export * from './const'
export * from './util'
export * from './client'
export { schemas } from './client/lexicons'
export type { $Typed, Un$Typed } from './client/util'
export { asPredicate } from './client/util'
export * from './rich-text/rich-text'
export * from './rich-text/sanitization'
export * from './rich-text/unicode'
export * from './rich-text/util'
export * from './moderation'
export * from './moderation/types'
export * from './mocker'
export { DEFAULT_LABEL_SETTINGS, LABELS } from './moderation/const/labels'
export { Agent } from './agent'

export { AtpAgent, type AtpAgentOptions } from './atp-agent'
export { CredentialSession } from './atp-agent'
export { BskyAgent } from './bsky-agent'

export {
  /** @deprecated */
  AtpAgent as default,
} from './atp-agent'

// Expose a copy to prevent alteration of the internal Lexicon instance used by
// the AtpBaseClient class.
export const lexicons = new Lexicons(internalLexicons)
