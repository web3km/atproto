import { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('repo_seq')
    .ifNotExists()
    .addColumn('seq', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('did', 'varchar', (col) => col.notNull())
    .addColumn('eventType', 'varchar', (col) => col.notNull())
    .addColumn('event', 'blob', (col) => col.notNull())
    .addColumn('invalidated', 'int2', (col) => col.notNull().defaultTo(0))
    .addColumn('sequencedAt', 'varchar', (col) => col.notNull())
    .execute()

  // for filtering seqs based on did
  try {
    await db.schema
      .createIndex('repo_seq_did_idx')
      .on('repo_seq')
      .column('did')
      .execute()
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      throw err
    }
  }

  // for filtering seqs based on event type
  try {
    await db.schema
      .createIndex('repo_seq_event_type_idx')
      .on('repo_seq')
      .column('eventType')
      .execute()
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      throw err
    }
  }

  // for entering into the seq stream at a particular time
  try {
    await db.schema
      .createIndex('repo_seq_sequenced_at_index')
      .on('repo_seq')
      .column('sequencedAt')
      .execute()
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      throw err
    }
  }
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('repo_seq').execute()
}
