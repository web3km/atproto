// @NOTE keep in sync with same interface in bsky/src/image/invalidator.ts
// this is separate to avoid the dependency on @bluesky-social/bsky.
export interface ImageInvalidator {
  invalidate(subject: string, paths: string[]): Promise<void>
}
