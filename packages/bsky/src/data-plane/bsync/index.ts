import assert from 'node:assert'
import events from 'node:events'
import http from 'node:http'
import { ConnectRouter } from '@connectrpc/connect'
import { expressConnectMiddleware } from '@connectrpc/connect-express'
import express from 'express'
import { TID } from '@bluesky-social/common'
import { jsonStringToLex } from '@bluesky-social/lexicon'
import { AtUri } from '@bluesky-social/syntax'
import { ids } from '../../lexicon/lexicons'
import { SubjectActivitySubscription } from '../../lexicon/types/app/bsky/notification/defs'
import { AgeAssuranceEvent } from '../../lexicon/types/app/bsky/unspecced/defs'
import { httpLogger } from '../../logger'
import { Service } from '../../proto/bsync_connect'
import {
  Method,
  MuteOperation_Type,
  PutOperationRequest,
} from '../../proto/bsync_pb'
import { Namespaces } from '../../stash'
import { Database } from '../server/db'
import { excluded } from '../server/db/util'

export class MockBsync {
  constructor(public server: http.Server) {}

  static async create(db: Database, port: number) {
    const app = express()
    const routes = createRoutes(db)
    app.use(expressConnectMiddleware({ routes }))
    const server = app.listen(port)
    await events.once(server, 'listening')
    return new MockBsync(server)
  }

  async destroy() {
    return new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

const createRoutes = (db: Database) => (router: ConnectRouter) =>
  router.service(Service, {
    async addMuteOperation(req) {
      const { type, actorDid, subject } = req
      if (type === MuteOperation_Type.ADD) {
        if (subject.startsWith('did:')) {
          assert(actorDid !== subject, 'cannot mute yourself') // @TODO pass message through in http error
          await db.db
            .insertInto('mute')
            .values({
              mutedByDid: actorDid,
              subjectDid: subject,
              createdAt: new Date().toISOString(),
            })
            .onConflict((oc) => oc.doNothing())
            .execute()
        } else {
          const uri = new AtUri(subject)
          if (uri.collection === ids.AppBskyGraphList) {
            await db.db
              .insertInto('list_mute')
              .values({
                mutedByDid: actorDid,
                listUri: subject,
                createdAt: new Date().toISOString(),
              })
              .onConflict((oc) => oc.doNothing())
              .execute()
          } else {
            await db.db
              .insertInto('thread_mute')
              .values({
                mutedByDid: actorDid,
                rootUri: subject,
                createdAt: new Date().toISOString(),
              })
              .onConflict((oc) => oc.doNothing())
              .execute()
          }
        }
      } else if (type === MuteOperation_Type.REMOVE) {
        if (subject.startsWith('did:')) {
          await db.db
            .deleteFrom('mute')
            .where('mutedByDid', '=', actorDid)
            .where('subjectDid', '=', subject)
            .execute()
        } else {
          const uri = new AtUri(subject)
          if (uri.collection === ids.AppBskyGraphList) {
            await db.db
              .deleteFrom('list_mute')
              .where('mutedByDid', '=', actorDid)
              .where('listUri', '=', subject)
              .execute()
          } else {
            await db.db
              .deleteFrom('thread_mute')
              .where('mutedByDid', '=', actorDid)
              .where('rootUri', '=', subject)
              .execute()
          }
        }
      } else if (type === MuteOperation_Type.CLEAR) {
        await db.db
          .deleteFrom('mute')
          .where('mutedByDid', '=', actorDid)
          .execute()
        await db.db
          .deleteFrom('list_mute')
          .where('mutedByDid', '=', actorDid)
          .execute()
      }

      return {}
    },

    async scanMuteOperations() {
      throw new Error('not implemented')
    },

    async addNotifOperation(req) {
      const { actorDid, priority } = req
      if (priority !== undefined) {
        await db.db
          .insertInto('actor_state')
          .values({
            did: actorDid,
            priorityNotifs: priority,
            lastSeenNotifs: new Date().toISOString(),
          })
          .onConflict((oc) =>
            oc.column('did').doUpdateSet({ priorityNotifs: priority }),
          )
          .execute()
      }
      return {}
    },

    async scanNotifOperations() {
      throw new Error('not implemented')
    },

    async putOperation(req) {
      const { actorDid, namespace, key, method, payload } = req
      assert(
        method === Method.CREATE ||
          method === Method.UPDATE ||
          method === Method.DELETE,
        `Unsupported method: ${method}`,
      )

      const now = new Date().toISOString()

      // Index all items into private_data.
      await handleGenericOperation(db, req, now)

      // Maintain bespoke indexes for certain namespaces.
      if (
        namespace ===
        Namespaces.AppBskyNotificationDefsSubjectActivitySubscription
      ) {
        await handleSubjectActivitySubscriptionOperation(db, req, now).catch(
          (err: unknown) =>
            httpLogger.warn(
              { err, namespace },
              'mock bsync put operation failed',
            ),
        )
      } else if (
        namespace === Namespaces.AppBskyUnspeccedDefsAgeAssuranceEvent
      ) {
        await handleAgeAssuranceEventOperation(db, req, now).catch(
          (err: unknown) =>
            httpLogger.warn(
              { err, namespace },
              'mock bsync put operation failed',
            ),
        )
      }

      return {
        operation: {
          id: TID.nextStr(),
          actorDid,
          namespace,
          key,
          method,
          payload,
        },
      }
    },

    async scanOperations() {
      throw new Error('not implemented')
    },

    async ping() {
      return {}
    },
  })

// upsert into or remove from private_data
const handleGenericOperation = async (
  db: Database,
  req: PutOperationRequest,
  now: string,
) => {
  const { actorDid, namespace, key, method, payload } = req
  if (method === Method.CREATE || method === Method.UPDATE) {
    await db.db
      .insertInto('private_data')
      .values({
        actorDid,
        namespace,
        key,
        payload: Buffer.from(payload).toString('utf8'),
        indexedAt: now,
        updatedAt: now,
      })
      .onConflict((oc) =>
        oc.columns(['actorDid', 'namespace', 'key']).doUpdateSet({
          payload: excluded(db.db, 'payload'),
          updatedAt: excluded(db.db, 'updatedAt'),
        }),
      )
      .execute()
  } else if (method === Method.DELETE) {
    await db.db
      .deleteFrom('private_data')
      .where('actorDid', '=', actorDid)
      .where('namespace', '=', namespace)
      .where('key', '=', key)
      .execute()
  } else {
    assert.fail(`unexpected method ${method}`)
  }
}

const handleSubjectActivitySubscriptionOperation = async (
  db: Database,
  req: PutOperationRequest,
  now: string,
) => {
  const { actorDid, key, method, payload } = req

  if (method === Method.DELETE) {
    return db.db
      .deleteFrom('activity_subscription')
      .where('creator', '=', actorDid)
      .where('key', '=', key)
      .execute()
  }

  const parsed = jsonStringToLex(
    Buffer.from(payload).toString('utf8'),
  ) as SubjectActivitySubscription
  const {
    subject,
    activitySubscription: { post, reply },
  } = parsed

  if (method === Method.CREATE) {
    return db.db
      .insertInto('activity_subscription')
      .values({
        creator: actorDid,
        subjectDid: subject,
        key,
        indexedAt: now,
        post,
        reply,
      })
      .execute()
  }

  return db.db
    .updateTable('activity_subscription')
    .where('creator', '=', actorDid)
    .where('key', '=', key)
    .set({
      indexedAt: now,
      post,
      reply,
    })
    .execute()
}

const handleAgeAssuranceEventOperation = async (
  db: Database,
  req: PutOperationRequest,
  _now: string,
) => {
  const { actorDid, method, payload } = req
  if (method !== Method.CREATE) return

  const parsed = jsonStringToLex(
    Buffer.from(payload).toString('utf8'),
  ) as AgeAssuranceEvent
  const { status, createdAt } = parsed

  const update = {
    ageAssuranceStatus: status,
    ageAssuranceLastInitiatedAt: status === 'pending' ? createdAt : undefined,
  }

  return db.db
    .updateTable('actor')
    .set(update)
    .where('did', '=', actorDid)
    .execute()
}
