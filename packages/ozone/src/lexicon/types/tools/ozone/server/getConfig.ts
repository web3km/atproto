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

const is$typed = _is$typed,
  validate = _validate
const id = 'tools.ozone.server.getConfig'

export type QueryParams = {}
export type InputSchema = undefined

export interface OutputSchema {
  appview?: ServiceConfig
  pds?: ServiceConfig
  blobDivert?: ServiceConfig
  chat?: ServiceConfig
  viewer?: ViewerConfig
  /** The did of the verifier used for verification. */
  verifierDid?: string
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

export interface ServiceConfig {
  $type?: 'tools.ozone.server.getConfig#serviceConfig'
  url?: string
}

const hashServiceConfig = 'serviceConfig'

export function isServiceConfig<V>(v: V) {
  return is$typed(v, id, hashServiceConfig)
}

export function validateServiceConfig<V>(v: V) {
  return validate<ServiceConfig & V>(v, id, hashServiceConfig)
}

export interface ViewerConfig {
  $type?: 'tools.ozone.server.getConfig#viewerConfig'
  role?:
    | 'tools.ozone.team.defs#roleAdmin'
    | 'tools.ozone.team.defs#roleModerator'
    | 'tools.ozone.team.defs#roleTriage'
    | 'tools.ozone.team.defs#roleVerifier'
    | (string & {})
}

const hashViewerConfig = 'viewerConfig'

export function isViewerConfig<V>(v: V) {
  return is$typed(v, id, hashViewerConfig)
}

export function validateViewerConfig<V>(v: V) {
  return validate<ViewerConfig & V>(v, id, hashViewerConfig)
}
