import { BlobStore } from '@bluesky-social/repo'
import { BackgroundQueue } from '../background'

export type ActorStoreResources = {
  blobstore: (did: string) => BlobStore
  backgroundQueue: BackgroundQueue
  reservedKeyDir?: string
}
