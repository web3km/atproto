/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atproto.server.createCustomJwtSession'

export type QueryParams = {}

export interface InputSchema {
  /** The verifier identifier for authentication. */
  verifier: string
  options: JwtOptions
  /** Requested handle for the account. */
  handle?: string
  /** Pre-existing atproto DID, being imported to a new account. */
  did?: string
  /** A signed DID PLC operation to be submitted as part of importing an existing account to this instance. NOTE: this optional field may be updated when full account migration is implemented. */
  plcOp?: { [_ in string]: unknown }
}

/** Account login session returned on successful account creation. */
export interface OutputSchema {
  accessJwt: string
  refreshJwt: string
  handle: string
  /** The DID of the new account. */
  did: string
  /** Complete DID document. */
  didDoc?: { [_ in string]: unknown }
}

export interface HandlerInput {
  encoding: 'application/json'
  body: InputSchema
}

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
  error?:
    | 'InvalidJwtToken'
    | 'HandleNotAvailable'
    | 'UnsupportedDomain'
    | 'UnresolvableDid'
    | 'IncompatibleDidDoc'
}

export type HandlerOutput = HandlerError | HandlerSuccess

export interface JwtOptions {
  $type?: 'com.atproto.server.createCustomJwtSession#jwtOptions'
  /** The JWT ID token to be verified and used for authentication. */
  id_token: string
}

const hashJwtOptions = 'jwtOptions'

export function isJwtOptions<V>(v: V) {
  return is$typed(v, id, hashJwtOptions)
}

export function validateJwtOptions<V>(v: V) {
  return validate<JwtOptions & V>(v, id, hashJwtOptions)
}
