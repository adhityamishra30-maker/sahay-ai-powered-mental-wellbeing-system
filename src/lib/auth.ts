import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';

/**
 * Generates a cryptographic 32-byte salt
 */
export function generateSalt(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512 and 100,000 iterations
 */
export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
}

/**
 * Secure, constant-time verification of a password against stored salt and hash.
 * Resistant to timing analysis attacks.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }
    return timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates an anonymous pseudonym session ID (e.g. for DPDP Guest sessions)
 */
export function generateSessionId(prefix: string = 'SESSION'): string {
  const rand = randomBytes(8).toString('hex');
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}
