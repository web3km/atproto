import { JWK, importJWK, jwtVerify } from 'jose'
import { AuthRequiredError } from '@bluesky-social/xrpc-server'

export interface JwtVerifierConfig {
  jwkEndpoint: string
  jwtVerifierId: string
}

export interface JwtVerificationResult {
  verifierId: string
  claims: Record<string, any>
}

export class JwtVerifier {
  private config: JwtVerifierConfig

  constructor(config: JwtVerifierConfig) {
    this.config = config
  }

  async fetchJwks(): Promise<{ keys: JWK[] }> {
    const res = await fetch(this.config.jwkEndpoint)
    if (!res.ok) {
      throw new AuthRequiredError('Failed to fetch JWKS', 'InvalidJwtToken')
    }
    const data: any = await res.json()
    if (!data.keys || !Array.isArray(data.keys)) {
      throw new AuthRequiredError('Invalid JWKS format', 'InvalidJwtToken')
    }
    console.log('jwks data:', data)
    return data as { keys: JWK[] }
  }

  async verifyJwt(jwtToken: string): Promise<JwtVerificationResult> {
    try {
      // 1. 解析 JWT header，拿到 kid 和 alg
      const [headerB64] = jwtToken.split('.')
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString())
      const { kid, alg } = header

      // 2. 拉取 JWKS
      const jwks = await this.fetchJwks()
      console.log('jwks:', jwks)
      const jwk = jwks.keys.find((k) => k.kid === kid && k.alg === alg)
      if (!jwk) {
        throw new AuthRequiredError('No matching JWK found', 'InvalidJwtToken')
      }

      // 3. 导入 JWK
      const key = await importJWK(jwk, alg)
      console.log('key:', key)

      // 4. 校验 JWT
      const { payload } = await jwtVerify(jwtToken, key, { algorithms: [alg] })

      // 5. 检查必需的 claim
      const verifierId = payload[this.config.jwtVerifierId]
      if (!verifierId || typeof verifierId !== 'string') {
        throw new AuthRequiredError(
          `Invalid JWT token: ${this.config.jwtVerifierId} claim not found or invalid`,
          'InvalidJwtToken',
        )
      }

      return {
        verifierId,
        claims: payload as Record<string, any>,
      }
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        throw error
      }
      if (error instanceof Error) {
        throw new AuthRequiredError(
          `JWT verification failed: ${error.message}`,
          'InvalidJwtToken',
        )
      }
      throw new AuthRequiredError('JWT verification failed', 'InvalidJwtToken')
    }
  }
}

// 验证器配置映射
export interface VerifierConfig {
  id: string
  jwkEndpoint: string
  jwtVerifierId: string
  provider: string
  appId: string
}

export class VerifierManager {
  private verifiers = new Map<string, VerifierConfig>()

  constructor(verifiers: VerifierConfig[]) {
    for (const verifier of verifiers) {
      this.verifiers.set(verifier.id, verifier)
    }
  }

  getVerifier(verifierId: string): VerifierConfig | null {
    return this.verifiers.get(verifierId) || null
  }

  createJwtVerifier(verifierId: string): JwtVerifier | null {
    const verifier = this.getVerifier(verifierId)
    if (!verifier) {
      return null
    }

    return new JwtVerifier({
      jwkEndpoint: verifier.jwkEndpoint,
      jwtVerifierId: verifier.jwtVerifierId,
    })
  }
}
