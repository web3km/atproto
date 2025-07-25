import { Selectable } from 'kysely'

export interface JwtAccount {
  did: string
  externalId: string // external jwt id
  externalProvider: string // external jwt provider
  createdAt: string
}

export type JwtAccountEntry = Selectable<JwtAccount>

export const tableName = 'jwt_account'
export type PartialDB = { [tableName]: JwtAccount }
