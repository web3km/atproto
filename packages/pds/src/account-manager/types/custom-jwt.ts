export interface CustomJwtPayload {
  did: string
  jti: string // JWT ID
  iss: string // Issuer
  sub: string // Subject
  iat?: number // Issued at
  exp?: number // Expiration time
  [key: string]: any // 其他可能的字段
}

export interface CustomJwtConfig {
  key: string
  issuer: string
  algorithm?: string
}
