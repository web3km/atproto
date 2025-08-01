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
import type * as ChatBskyConvoDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'chat.bsky.convo.getLog'

export type QueryParams = {
  cursor?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  cursor?: string
  logs: (
    | $Typed<ChatBskyConvoDefs.LogBeginConvo>
    | $Typed<ChatBskyConvoDefs.LogAcceptConvo>
    | $Typed<ChatBskyConvoDefs.LogLeaveConvo>
    | $Typed<ChatBskyConvoDefs.LogMuteConvo>
    | $Typed<ChatBskyConvoDefs.LogUnmuteConvo>
    | $Typed<ChatBskyConvoDefs.LogCreateMessage>
    | $Typed<ChatBskyConvoDefs.LogDeleteMessage>
    | $Typed<ChatBskyConvoDefs.LogReadMessage>
    | $Typed<ChatBskyConvoDefs.LogAddReaction>
    | $Typed<ChatBskyConvoDefs.LogRemoveReaction>
    | { $type: string }
  )[]
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
