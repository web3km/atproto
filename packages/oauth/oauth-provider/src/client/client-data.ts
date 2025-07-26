import { Jwks } from '@bluesky-social/jwk'
import { OAuthClientMetadata } from '@bluesky-social/oauth-types'

export type { OAuthClientMetadata }

export type ClientData = {
  metadata: OAuthClientMetadata
  jwks?: Jwks
}
