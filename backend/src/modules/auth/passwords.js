export const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

export function assertPlaintextPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    const error = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    error.statusCode = 400;
    throw error;
  }
  if (BCRYPT_HASH.test(password)) {
    const error = new Error('Password hashes are not accepted from clients.');
    error.statusCode = 400;
    throw error;
  }
}
