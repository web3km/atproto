# @bluesky-social/xrpc-server

## 0.9.0

### Minor Changes

- [#3999](https://github.com/bluesky-social/atproto/pull/3999) [`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Reorganize naming of exported types

- [#3999](https://github.com/bluesky-social/atproto/pull/3999) [`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Allow stronger typing of `auth` result in method and stream handlers

### Patch Changes

- [#4027](https://github.com/bluesky-social/atproto/pull/4027) [`5ed4a8859`](https://github.com/bluesky-social/atproto/commit/5ed4a885963f082a642e2cfb2fcc824e708fff90) Thanks [@devinivy](https://github.com/devinivy)! - Fix json and text uploads: don't parse bodies with input encoding of _/_.

- [#3999](https://github.com/bluesky-social/atproto/pull/3999) [`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Use a generic to type RateLimiter's context

- [#3999](https://github.com/bluesky-social/atproto/pull/3999) [`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Ignore `__proto__` in query string params.

- [#3999](https://github.com/bluesky-social/atproto/pull/3999) [`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20) Thanks [@matthieusieben](https://github.com/matthieusieben)! - `catchall` handler will not be triggered if the XRPC method is not a valid NSID

- [#3999](https://github.com/bluesky-social/atproto/pull/3999) [`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Make (typed) `params` available during auth

- Updated dependencies [[`8ef976d38`](https://github.com/bluesky-social/atproto/commit/8ef976d3852df4bfa376e515e131cc0810a42f20)]:
  - @bluesky-social/lexicon@0.4.12
  - @bluesky-social/xrpc@0.7.1

## 0.8.0

### Minor Changes

- [#3886](https://github.com/bluesky-social/atproto/pull/3886) [`0286f7ee3`](https://github.com/bluesky-social/atproto/commit/0286f7ee3d56ae50cfe0b70add60cf4785587b3c) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Remove `bypassSecret` and `bypassIps` from rate limiter options.

- [#3886](https://github.com/bluesky-social/atproto/pull/3886) [`0286f7ee3`](https://github.com/bluesky-social/atproto/commit/0286f7ee3d56ae50cfe0b70add60cf4785587b3c) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Now applies global rate limiter to every single route. Previously, the global rate limiter was not applied if a route defined a local rate limit option.

### Patch Changes

- [#3884](https://github.com/bluesky-social/atproto/pull/3884) [`b675fbbf1`](https://github.com/bluesky-social/atproto/commit/b675fbbf17e000fad2b38a52db550702830a807d) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Return an error if the wrong HTTP verb is used for a known XRPC method, even when a `catchall` is provided.

- [#3886](https://github.com/bluesky-social/atproto/pull/3886) [`0286f7ee3`](https://github.com/bluesky-social/atproto/commit/0286f7ee3d56ae50cfe0b70add60cf4785587b3c) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Add optional `bypass` callback to global rate limits options

- [#3886](https://github.com/bluesky-social/atproto/pull/3886) [`0286f7ee3`](https://github.com/bluesky-social/atproto/commit/0286f7ee3d56ae50cfe0b70add60cf4785587b3c) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Refactor route rate limiter builder

- [#3886](https://github.com/bluesky-social/atproto/pull/3886) [`0286f7ee3`](https://github.com/bluesky-social/atproto/commit/0286f7ee3d56ae50cfe0b70add60cf4785587b3c) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Performance improvement: avoid computing rate limit bypass multiple times per request

## 0.7.19

### Patch Changes

- [#3699](https://github.com/bluesky-social/atproto/pull/3699) [`9214bd017`](https://github.com/bluesky-social/atproto/commit/9214bd01705381aed6b5bde2900d6dc5486b6e9f) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Improve logging of XRPC errors

## 0.7.18

### Patch Changes

- [#3700](https://github.com/bluesky-social/atproto/pull/3700) [`b5afb723b`](https://github.com/bluesky-social/atproto/commit/b5afb723be392d236799bbcb6a55956bd12316ba) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Consistenlty log errors

- Updated dependencies [[`f36ab48d9`](https://github.com/bluesky-social/atproto/commit/f36ab48d910fc4a3afcd22138ba014c814beb93b), [`f36ab48d9`](https://github.com/bluesky-social/atproto/commit/f36ab48d910fc4a3afcd22138ba014c814beb93b), [`f36ab48d9`](https://github.com/bluesky-social/atproto/commit/f36ab48d910fc4a3afcd22138ba014c814beb93b), [`cc485d296`](https://github.com/bluesky-social/atproto/commit/cc485d29638488928b5efec3d4b0627040589812)]:
  - @bluesky-social/xrpc@0.7.0
  - @bluesky-social/lexicon@0.4.11
  - @bluesky-social/common@0.4.11
  - @bluesky-social/crypto@0.4.4

## 0.7.17

### Patch Changes

- [#3765](https://github.com/bluesky-social/atproto/pull/3765) [`45354c84f`](https://github.com/bluesky-social/atproto/commit/45354c84f898d79f58c14b5c0da3661beb7353f9) Thanks [@foysalit](https://github.com/foysalit)! - Expose WebSocketKeepAlive from xrpc-server package

## 0.7.16

### Patch Changes

- [#3789](https://github.com/bluesky-social/atproto/pull/3789) [`da168588d`](https://github.com/bluesky-social/atproto/commit/da168588de59e5048d255866205bd16c5ab5f95c) Thanks [@rafaelbsky](https://github.com/rafaelbsky)! - Ensure safe HTTP code in error middleware

## 0.7.15

### Patch Changes

- Updated dependencies [[`4db923ca1`](https://github.com/bluesky-social/atproto/commit/4db923ca1c4fadd31d41c851933659e5186ee144)]:
  - @bluesky-social/common@0.4.10
  - @bluesky-social/lexicon@0.4.10
  - @bluesky-social/crypto@0.4.4
  - @bluesky-social/xrpc@0.6.12

## 0.7.14

### Patch Changes

- Updated dependencies [[`bdbd3c3e3`](https://github.com/bluesky-social/atproto/commit/bdbd3c3e3f8fe8476a3fecac73810554846c938f)]:
  - @bluesky-social/common@0.4.9
  - @bluesky-social/crypto@0.4.4

## 0.7.13

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/lexicon@0.4.9
  - @bluesky-social/xrpc@0.6.11

## 0.7.12

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/lexicon@0.4.8
  - @bluesky-social/xrpc@0.6.10

## 0.7.11

### Patch Changes

- Updated dependencies [[`c53d943c8`](https://github.com/bluesky-social/atproto/commit/c53d943c8be5b8886254e020970a68c0f745b14c), [`c53d943c8`](https://github.com/bluesky-social/atproto/commit/c53d943c8be5b8886254e020970a68c0f745b14c)]:
  - @bluesky-social/lexicon@0.4.7
  - @bluesky-social/xrpc@0.6.9

## 0.7.10

### Patch Changes

- [#3220](https://github.com/bluesky-social/atproto/pull/3220) [`61dc0d60e`](https://github.com/bluesky-social/atproto/commit/61dc0d60e19b88c6427a54c6d95a391b5f4da7bd) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Apply new linting rules regarding import order

- [#3220](https://github.com/bluesky-social/atproto/pull/3220) [`61dc0d60e`](https://github.com/bluesky-social/atproto/commit/61dc0d60e19b88c6427a54c6d95a391b5f4da7bd) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Update NodeJS engine requirement to >=18.7.0

- Updated dependencies [[`61dc0d60e`](https://github.com/bluesky-social/atproto/commit/61dc0d60e19b88c6427a54c6d95a391b5f4da7bd), [`61dc0d60e`](https://github.com/bluesky-social/atproto/commit/61dc0d60e19b88c6427a54c6d95a391b5f4da7bd)]:
  - @bluesky-social/lexicon@0.4.6
  - @bluesky-social/common@0.4.8
  - @bluesky-social/crypto@0.4.4
  - @bluesky-social/xrpc@0.6.8

## 0.7.9

### Patch Changes

- [#3439](https://github.com/bluesky-social/atproto/pull/3439) [`4f2841efe`](https://github.com/bluesky-social/atproto/commit/4f2841efeb410e710e0c8da7c9204468f6256a75) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Export the `ResponseType` type used in the `XRPCError` constructor

- [#3439](https://github.com/bluesky-social/atproto/pull/3439) [`4f2841efe`](https://github.com/bluesky-social/atproto/commit/4f2841efeb410e710e0c8da7c9204468f6256a75) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Allow providing a custom `errorParser` option to XRPCServer

- Updated dependencies [[`fb64d50ee`](https://github.com/bluesky-social/atproto/commit/fb64d50ee220316b9f1183e5c3259629489734c9), [`52c687a05`](https://github.com/bluesky-social/atproto/commit/52c687a05c70d5660fae1de9e1bbc6297f37f1f4)]:
  - @bluesky-social/xrpc@0.6.7
  - @bluesky-social/common@0.4.7
  - @bluesky-social/crypto@0.4.3

## 0.7.8

### Patch Changes

- [#3422](https://github.com/bluesky-social/atproto/pull/3422) [`1015d9692`](https://github.com/bluesky-social/atproto/commit/1015d96925898149cc60b434561e19730a1bea12) Thanks [@rafaelbsky](https://github.com/rafaelbsky)! - Fix rate limit reset binding

## 0.7.7

### Patch Changes

- [#3348](https://github.com/bluesky-social/atproto/pull/3348) [`0832a377d`](https://github.com/bluesky-social/atproto/commit/0832a377d269584a906d5062ebb5e2e6307f9c61) Thanks [@rafaelbsky](https://github.com/rafaelbsky)! - Add resetRouteRateLimits to req context

## 0.7.6

### Patch Changes

- Updated dependencies [[`1abfd74ec`](https://github.com/bluesky-social/atproto/commit/1abfd74ec7114e5d8e2411f7a4fa10bdce97e277)]:
  - @bluesky-social/crypto@0.4.3

## 0.7.5

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/common@0.4.6
  - @bluesky-social/lexicon@0.4.5
  - @bluesky-social/crypto@0.4.2
  - @bluesky-social/xrpc@0.6.6

## 0.7.4

### Patch Changes

- Updated dependencies [[`588baae12`](https://github.com/bluesky-social/atproto/commit/588baae1212a3cba3bf0d95d2f268e80513fd9c4), [`9fd65ba0f`](https://github.com/bluesky-social/atproto/commit/9fd65ba0fa4caca59fd0e6156145e4c2618e3a95)]:
  - @bluesky-social/common@0.4.5
  - @bluesky-social/lexicon@0.4.4
  - @bluesky-social/crypto@0.4.2
  - @bluesky-social/xrpc@0.6.5

## 0.7.3

### Patch Changes

- Updated dependencies [[`bac9be2d3`](https://github.com/bluesky-social/atproto/commit/bac9be2d3ec904d1f984a871f43cf89aca17289d)]:
  - @bluesky-social/lexicon@0.4.3
  - @bluesky-social/xrpc@0.6.4

## 0.7.2

### Patch Changes

- [#2936](https://github.com/bluesky-social/atproto/pull/2936) [`1982693e3`](https://github.com/bluesky-social/atproto/commit/1982693e3ea1fef4db76ac9aca3db8dc5ebf3fe0) Thanks [@rafaelbsky](https://github.com/rafaelbsky)! - Accept a custom verifySignatureWithKey in verifyJwt

- Updated dependencies [[`1982693e3`](https://github.com/bluesky-social/atproto/commit/1982693e3ea1fef4db76ac9aca3db8dc5ebf3fe0)]:
  - @bluesky-social/crypto@0.4.2

## 0.7.1

### Patch Changes

- Updated dependencies [[`4098d9890`](https://github.com/bluesky-social/atproto/commit/4098d9890173f4d6c6512f2d8994eebbf12b5e13)]:
  - @bluesky-social/common@0.4.4
  - @bluesky-social/crypto@0.4.1

## 0.7.0

### Minor Changes

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Use Buffer instead of ArrayBuffer in pipe through handler result

### Patch Changes

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Allow HandlerPipeThrough to be used with streams

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Add ErrorOptions support to XRPCError and sub-classes

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Expose parseContentEncoding() util

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Properly decompress requests with more than one content encoding

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Improve detection, and logging, of 500 server errors.

- [#2770](https://github.com/bluesky-social/atproto/pull/2770) [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Optimize extraction of NSID from url

- Updated dependencies [[`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3), [`87a1f2426`](https://github.com/bluesky-social/atproto/commit/87a1f24262e0e644b6cf31cc7a0446d9127ffa94), [`a07b21151`](https://github.com/bluesky-social/atproto/commit/a07b21151f1850340c4b7797ebb11521b1a6cdf3)]:
  - @bluesky-social/xrpc@0.6.3
  - @bluesky-social/lexicon@0.4.2
  - @bluesky-social/common@0.4.3
  - @bluesky-social/crypto@0.4.1

## 0.6.4

### Patch Changes

- [#2464](https://github.com/bluesky-social/atproto/pull/2464) [`98711a147`](https://github.com/bluesky-social/atproto/commit/98711a147a8674337f605c6368f39fc10c2fae93) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Properly decode request body encoding

- Updated dependencies [[`98711a147`](https://github.com/bluesky-social/atproto/commit/98711a147a8674337f605c6368f39fc10c2fae93), [`98711a147`](https://github.com/bluesky-social/atproto/commit/98711a147a8674337f605c6368f39fc10c2fae93)]:
  - @bluesky-social/common@0.4.2
  - @bluesky-social/xrpc@0.6.2
  - @bluesky-social/crypto@0.4.1

## 0.6.3

### Patch Changes

- [#2743](https://github.com/bluesky-social/atproto/pull/2743) [`ebb318325`](https://github.com/bluesky-social/atproto/commit/ebb318325b6e80c4ea1a93a617569da2698afe31) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Add `iat` claim to service JWTs

- [#2743](https://github.com/bluesky-social/atproto/pull/2743) [`ebb318325`](https://github.com/bluesky-social/atproto/commit/ebb318325b6e80c4ea1a93a617569da2698afe31) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Ensure that service auth JWT headers contain an `alg` claim, and ensure that `typ`, if present, is not an unexpected type (e.g. not an access or DPoP token).

- Updated dependencies [[`d9ffa3c46`](https://github.com/bluesky-social/atproto/commit/d9ffa3c460924010d7002b616cb7a0c66111cc6c), [`ebb318325`](https://github.com/bluesky-social/atproto/commit/ebb318325b6e80c4ea1a93a617569da2698afe31), [`d9ffa3c46`](https://github.com/bluesky-social/atproto/commit/d9ffa3c460924010d7002b616cb7a0c66111cc6c), [`d9ffa3c46`](https://github.com/bluesky-social/atproto/commit/d9ffa3c460924010d7002b616cb7a0c66111cc6c)]:
  - @bluesky-social/xrpc@0.6.1
  - @bluesky-social/crypto@0.4.1

## 0.6.2

### Patch Changes

- [#2711](https://github.com/bluesky-social/atproto/pull/2711) [`acbacbbd5`](https://github.com/bluesky-social/atproto/commit/acbacbbd5621473b14ee7a6a3132f675806d23b1) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Expose the request context for AuthVerifier and StreamAuthVerifier as distinct types

- [#2663](https://github.com/bluesky-social/atproto/pull/2663) [`50c0ec176`](https://github.com/bluesky-social/atproto/commit/50c0ec176c223c90e7c86e1e0c059455fecfa9ae) Thanks [@dholms](https://github.com/dholms)! - Update lxm check error name to BadJwtLexiconMethod

- [#2663](https://github.com/bluesky-social/atproto/pull/2663) [`50c0ec176`](https://github.com/bluesky-social/atproto/commit/50c0ec176c223c90e7c86e1e0c059455fecfa9ae) Thanks [@dholms](https://github.com/dholms)! - Support http.IncomingMessage input to parseReqNsid()

## 0.6.1

### Patch Changes

- Updated dependencies [[`b934b396b`](https://github.com/bluesky-social/atproto/commit/b934b396b13ba32bf2bf7e75ecdf6871e5f310dd), [`2bdf75d7a`](https://github.com/bluesky-social/atproto/commit/2bdf75d7a63924c10e7a311f16cb447d595b933e), [`b934b396b`](https://github.com/bluesky-social/atproto/commit/b934b396b13ba32bf2bf7e75ecdf6871e5f310dd), [`b934b396b`](https://github.com/bluesky-social/atproto/commit/b934b396b13ba32bf2bf7e75ecdf6871e5f310dd)]:
  - @bluesky-social/lexicon@0.4.1
  - @bluesky-social/xrpc@0.6.0

## 0.6.0

### Minor Changes

- [#2668](https://github.com/bluesky-social/atproto/pull/2668) [`dc471da26`](https://github.com/bluesky-social/atproto/commit/dc471da267955d0962a8affaf983df60d962d97c) Thanks [@dholms](https://github.com/dholms)! - Add lxm and nonce to signed service auth tokens.

## 0.5.3

### Patch Changes

- Updated dependencies [[`acc9093d2`](https://github.com/bluesky-social/atproto/commit/acc9093d2845eba02b68fb2f9db33e4f1b59bb10)]:
  - @bluesky-social/common@0.4.1
  - @bluesky-social/crypto@0.4.0

## 0.5.2

### Patch Changes

- [`615a96ddc`](https://github.com/bluesky-social/atproto/commit/615a96ddc2965251cfab060dfc43fc1a51ef4bff) Thanks [@devinivy](https://github.com/devinivy)! - Adjust detection of lexrpc body presence, support 0-byte bodies.

## 0.5.1

### Patch Changes

- [#2384](https://github.com/bluesky-social/atproto/pull/2384) [`cd4fcc709`](https://github.com/bluesky-social/atproto/commit/cd4fcc709fe8d725a4af769ce21f53711fe5622a) Thanks [@dholms](https://github.com/dholms)! - Add configurable catchall

## 0.5.0

### Minor Changes

- [#2169](https://github.com/bluesky-social/atproto/pull/2169) [`f689bd51a`](https://github.com/bluesky-social/atproto/commit/f689bd51a2f4e02d4eca40eb2568a1fcb95494e9) Thanks [@matthieusieben](https://github.com/matthieusieben)! - Build system rework, stop bundling dependencies.

### Patch Changes

- Updated dependencies [[`f689bd51a`](https://github.com/bluesky-social/atproto/commit/f689bd51a2f4e02d4eca40eb2568a1fcb95494e9)]:
  - @bluesky-social/lexicon@0.4.0
  - @bluesky-social/common@0.4.0
  - @bluesky-social/crypto@0.4.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/common@0.3.4
  - @bluesky-social/lexicon@0.3.3
  - @bluesky-social/crypto@0.3.0

## 0.4.3

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/lexicon@0.3.2

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/lexicon@0.3.1

## 0.4.1

### Patch Changes

- [#1839](https://github.com/bluesky-social/atproto/pull/1839) [`e1b5f253`](https://github.com/bluesky-social/atproto/commit/e1b5f2537a5ba4d8b951a741269b604856028ae5) Thanks [@dholms](https://github.com/dholms)! - Prevent signature malleability through DER-encoded signatures

- Updated dependencies [[`e1b5f253`](https://github.com/bluesky-social/atproto/commit/e1b5f2537a5ba4d8b951a741269b604856028ae5)]:
  - @bluesky-social/crypto@0.3.0

## 0.4.0

### Minor Changes

- [#1801](https://github.com/bluesky-social/atproto/pull/1801) [`ce49743d`](https://github.com/bluesky-social/atproto/commit/ce49743d7f8800d33116b88001d7b512553c2c89) Thanks [@gaearon](https://github.com/gaearon)! - Methods that accepts lexicons now take `LexiconDoc` type instead of `unknown`

### Patch Changes

- [#1788](https://github.com/bluesky-social/atproto/pull/1788) [`84e2d4d2`](https://github.com/bluesky-social/atproto/commit/84e2d4d2b6694f344d80c18672c78b650189d423) Thanks [@bnewbold](https://github.com/bnewbold)! - update license to "MIT or Apache2"

- Updated dependencies [[`ce49743d`](https://github.com/bluesky-social/atproto/commit/ce49743d7f8800d33116b88001d7b512553c2c89), [`84e2d4d2`](https://github.com/bluesky-social/atproto/commit/84e2d4d2b6694f344d80c18672c78b650189d423)]:
  - @bluesky-social/lexicon@0.3.0
  - @bluesky-social/common@0.3.3
  - @bluesky-social/crypto@0.2.3

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/common@0.3.2
  - @bluesky-social/lexicon@0.2.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/common@0.3.1
  - @bluesky-social/lexicon@0.2.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @bluesky-social/lexicon@0.2.1
