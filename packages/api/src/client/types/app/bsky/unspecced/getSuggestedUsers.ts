/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@bluesky-social/xrpc'
import { type ValidationResult, BlobRef } from '@bluesky-social/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'
import type * as AppBskyActorDefs from '../actor/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.bsky.unspecced.getSuggestedUsers'

export type QueryParams = {
  /** Category of users to get suggestions for. */
  category?: string
  limit?: number
}
export type InputSchema = undefined

export interface OutputSchema {
  actors: AppBskyActorDefs.ProfileView[]
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
