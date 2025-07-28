import * as bsky from '@bluesky-social/bsky'
import * as bsync from '@bluesky-social/bsync'
import { ExportableKeypair, Keypair } from '@bluesky-social/crypto'
import * as ozone from '@bluesky-social/ozone'
import * as pds from '@bluesky-social/pds'

export type IntrospectConfig = {
  port?: number
}

export type PlcConfig = {
  port?: number
  version?: string
}

export type PdsConfig = Partial<pds.ServerEnvironment> & {
  didPlcUrl: string
  migration?: string
}

export type BskyConfig = Partial<bsky.ServerConfig> & {
  plcUrl: string
  repoProvider: string
  dbPostgresUrl: string
  dbPostgresSchema: string
  redisHost: string
  pdsPort: number
  migration?: string
}

export type BsyncConfig = Partial<bsync.ServerEnvironment> & {
  dbUrl: string
}

export type OzoneConfig = Partial<ozone.OzoneEnvironment> & {
  plcUrl: string
  appviewUrl: string
  appviewDid: string
  dbPostgresUrl: string
  migration?: string
  signingKey?: ExportableKeypair
  imgInvalidator?: ozone.ImageInvalidator
}

export type TestServerParams = {
  dbPostgresUrl: string
  dbPostgresSchema: string
  pds: Partial<PdsConfig>
  plc: Partial<PlcConfig>
  bsky: Partial<BskyConfig>
  ozone: Partial<OzoneConfig>
  introspect: Partial<IntrospectConfig>
}

export type DidAndKey = {
  did: string
  key: Keypair
}
