import { AccountDb } from '../db'
import { JwtAccountEntry, tableName } from '../db/schema/jwt_login'

export type ActorJwtLogin = JwtAccountEntry & {
  externalId: string
  externalProvider: string
  did: string
}

export async function findJwtLogin(
  db: AccountDb,
  externalId: string,
  externalProvider: string,
): Promise<JwtAccountEntry | undefined> {
  return db.db
    .selectFrom(tableName)
    .selectAll()
    .where('externalId', '=', externalId)
    .where('externalProvider', '=', externalProvider)
    .executeTakeFirst()
}

export async function createJwtLogin(
  db: AccountDb,
  did: string,
  externalId: string,
  externalProvider: string,
): Promise<void> {
  try {
    const existing = await db.db
      .selectFrom(tableName)
      .selectAll()
      .where('did', '=', did)
      .where('externalId', '=', externalId)
      .where('externalProvider', '=', externalProvider)
      .executeTakeFirst()

    if (existing) {
      throw new Error('JWT account already exists')
    }

    await db.db
      .insertInto(tableName)
      .values({
        did,
        externalId,
        externalProvider,
        createdAt: new Date().toISOString(),
      })
      .execute()
    return
  } catch (e) {
    if (e instanceof Error && e.message.includes('duplicate key value')) {
      throw new Error('JWT account already exists')
    }
    throw e
  }
}
