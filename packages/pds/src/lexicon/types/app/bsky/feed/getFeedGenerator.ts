/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@bluesky-social/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'
import type * as AppBskyFeedDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.bsky.feed.getFeedGenerator'

export type QueryParams = {
  /** AT-URI of the feed generator record. */
  feed: string
}
export type InputSchema = undefined

export interface OutputSchema {
  view: AppBskyFeedDefs.GeneratorView
  /** Indicates whether the feed generator service has been online recently, or else seems to be inactive. */
  isOnline: boolean
  /** Indicates whether the feed generator service is compatible with the record declaration. */
  isValid: boolean
}

export type HandlerInput = void

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess
