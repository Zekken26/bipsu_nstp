import crypto from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt';
const keyLength = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(String(password), salt, keyLength).toString('base64url');
  return `${SCRYPT_PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const value = String(storedHash);

  if (!value.startsWith(`${SCRYPT_PREFIX}:`)) {
    return String(password) === value;
  }

  const [, salt, expected] = value.split(':');
  if (!salt || !expected) return false;

  const actual = crypto.scryptSync(String(password), salt, keyLength).toString('base64url');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function needsPasswordRehash(storedHash) {
  return !String(storedHash || '').startsWith(`${SCRYPT_PREFIX}:`);
}
