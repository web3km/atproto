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
import type * as ToolsOzoneModerationDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'tools.ozone.moderation.queryStatuses'

export type QueryParams = {
  /** Number of queues being used by moderators. Subjects will be split among all queues. */
  queueCount?: number
  /** Index of the queue to fetch subjects from. Works only when queueCount value is specified. */
  queueIndex?: number
  /** A seeder to shuffle/balance the queue items. */
  queueSeed?: string
  /** All subjects, or subjects from given 'collections' param, belonging to the account specified in the 'subject' param will be returned. */
  includeAllUserRecords?: boolean
  /** The subject to get the status for. */
  subject?: string
  /** Search subjects by keyword from comments */
  comment?: string
  /** Search subjects reported after a given timestamp */
  reportedAfter?: string
  /** Search subjects reported before a given timestamp */
  reportedBefore?: string
  /** Search subjects reviewed after a given timestamp */
  reviewedAfter?: string
  /** Search subjects where the associated record/account was deleted after a given timestamp */
  hostingDeletedAfter?: string
  /** Search subjects where the associated record/account was deleted before a given timestamp */
  hostingDeletedBefore?: string
  /** Search subjects where the associated record/account was updated after a given timestamp */
  hostingUpdatedAfter?: string
  /** Search subjects where the associated record/account was updated before a given timestamp */
  hostingUpdatedBefore?: string
  /** Search subjects by the status of the associated record/account */
  hostingStatuses?: string[]
  /** Search subjects reviewed before a given timestamp */
  reviewedBefore?: string
  /** By default, we don't include muted subjects in the results. Set this to true to include them. */
  includeMuted?: boolean
  /** When set to true, only muted subjects and reporters will be returned. */
  onlyMuted?: boolean
  /** Specify when fetching subjects in a certain state */
  reviewState?: string
  ignoreSubjects?: string[]
  /** Get all subject statuses that were reviewed by a specific moderator */
  lastReviewedBy?: string
  sortField?:
    | 'lastReviewedAt'
    | 'lastReportedAt'
    | 'reportedRecordsCount'
    | 'takendownRecordsCount'
    | 'priorityScore'
  sortDirection?: 'asc' | 'desc'
  /** Get subjects that were taken down */
  takendown?: boolean
  /** Get subjects in unresolved appealed status */
  appealed?: boolean
  limit?: number
  tags?: string[]
  excludeTags?: string[]
  cursor?: string
  /** If specified, subjects belonging to the given collections will be returned. When subjectType is set to 'account', this will be ignored. */
  collections?: string[]
  /** If specified, subjects of the given type (account or record) will be returned. When this is set to 'account' the 'collections' parameter will be ignored. When includeAllUserRecords or subject is set, this will be ignored. */
  subjectType?: 'account' | 'record' | (string & {})
  /** If specified, only subjects that belong to an account that has at least this many suspensions will be returned. */
  minAccountSuspendCount?: number
  /** If specified, only subjects that belong to an account that has at least this many reported records will be returned. */
  minReportedRecordsCount?: number
  /** If specified, only subjects that belong to an account that has at least this many taken down records will be returned. */
  minTakendownRecordsCount?: number
  /** If specified, only subjects that have priority score value above the given value will be returned. */
  minPriorityScore?: number
  /** If specified, only subjects with the given age assurance state will be returned. */
  ageAssuranceState?:
    | 'pending'
    | 'assured'
    | 'unknown'
    | 'reset'
    | 'blocked'
    | (string & {})
}
export type InputSchema = undefined

export interface OutputSchema {
  cursor?: string
  subjectStatuses: ToolsOzoneModerationDefs.SubjectStatusView[]
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
