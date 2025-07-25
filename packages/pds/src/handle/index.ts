import {
  InvalidHandleError,
  normalizeAndEnsureValidHandle,
} from '@bluesky-social/syntax'
import { InvalidRequestError } from '@bluesky-social/xrpc-server'
import { reservedSubdomains } from './reserved'

export const baseNormalizeAndValidate = (handle: string) => {
  try {
    return normalizeAndEnsureValidHandle(handle)
  } catch (err) {
    if (err instanceof InvalidHandleError) {
      throw new InvalidRequestError(err.message, 'InvalidHandle')
    }
    throw err
  }
}

export const isServiceDomain = (
  handle: string,
  availableUserDomains: string[],
): boolean => {
  return availableUserDomains.some((domain) => handle.endsWith(domain))
}

export const ensureHandleServiceConstraints = (
  handle: string,
  availableUserDomains: string[],
  allowReserved = false,
): void => {
  const supportedDomain =
    availableUserDomains.find((domain) => handle.endsWith(domain)) ?? ''
  const front = handle.slice(0, handle.length - supportedDomain.length)
  // 新增：禁止以bs.<hostname>为前缀的handle被普通用户注册
  for (const domain of availableUserDomains) {
    const reservedPrefix = `bs.${domain}`
    if (handle.endsWith(domain) && handle.startsWith(reservedPrefix)) {
      throw new InvalidRequestError(
        `Handles starting with 'bs.' + hostname are reserved for system use`,
        'HandleNotAvailable',
      )
    }
  }
  if (front.includes('.')) {
    throw new InvalidRequestError(
      'Invalid characters in handle',
      'InvalidHandle',
    )
  }
  if (front.length < 3) {
    throw new InvalidRequestError('Handle too short', 'InvalidHandle')
  }
  if (front.length > 18) {
    throw new InvalidRequestError('Handle too long', 'InvalidHandle')
  }
  if (!allowReserved && reservedSubdomains[front]) {
    throw new InvalidRequestError('Reserved handle', 'HandleNotAvailable')
  }
}
