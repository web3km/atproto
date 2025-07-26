// NOTE: this file should be imported first, particularly before `@bluesky-social/common` (for logging), to ensure that environment variables are respected in library code
import dotenv from 'dotenv'

const env = process.env.ENV
if (env) {
  dotenv.config({ path: `./.${env}.env` })
} else {
  dotenv.config()
}
