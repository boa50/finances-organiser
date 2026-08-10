import crypto from 'crypto';

/**
 * Perform constant-time string comparison to mitigate timing side-channel attacks.
 */
export function safeComparePasswords(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validate password requirements (non-empty string check).
 */
export function isValidPasswordInput(password: string): boolean {
  return typeof password === 'string' && password.trim().length > 0;
}
