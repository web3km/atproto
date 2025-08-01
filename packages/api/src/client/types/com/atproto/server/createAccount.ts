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

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atproto.server.createAccount'

export type QueryParams = {}

export interface InputSchema {
  email?: string
  /** Requested handle for the account. */
  handle: string
  /** Pre-existing atproto DID, being imported to a new account. */
  did?: string
  inviteCode?: string
  verificationCode?: string
  verificationPhone?: string
  /** Initial account password. May need to meet instance-specific password strength requirements. */
  password?: string
  /** DID PLC rotation key (aka, recovery key) to be included in PLC creation operation. */
  recoveryKey?: string
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

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/json'
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export class InvalidHandleError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class InvalidPasswordError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class InvalidInviteCodeError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class HandleNotAvailableError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class UnsupportedDomainError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class UnresolvableDidError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class IncompatibleDidDocError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
    if (e.error === 'InvalidHandle') return new InvalidHandleError(e)
    if (e.error === 'InvalidPassword') return new InvalidPasswordError(e)
    if (e.error === 'InvalidInviteCode') return new InvalidInviteCodeError(e)
    if (e.error === 'HandleNotAvailable') return new HandleNotAvailableError(e)
    if (e.error === 'UnsupportedDomain') return new UnsupportedDomainError(e)
    if (e.error === 'UnresolvableDid') return new UnresolvableDidError(e)
    if (e.error === 'IncompatibleDidDoc') return new IncompatibleDidDocError(e)
  }

  return e
}
