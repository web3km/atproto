import { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('jwt_account')
    .ifNotExists()
    .addColumn('did', 'varchar', (col) => col.notNull())
    .addColumn('externalId', 'varchar', (col) => col.notNull())
    .addColumn('externalProvider', 'varchar', (col) => col.notNull())
    .addColumn('createdAt', 'varchar', (col) => col.notNull())
    .addPrimaryKeyConstraint('jwt_account_pkey', ['did'])
    .execute()

  await db.schema
    .createIndex('jwt_account_external_unique')
    .ifNotExists()
    .unique()
    .on('jwt_account')
    .columns(['externalId', 'externalProvider'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('jwt_account').execute()
}
