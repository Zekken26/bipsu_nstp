import crypto from 'node:crypto';
import { env } from '../config/env.js';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function signJwt(payload, expiresInSeconds = env.jwtExpiresInSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  });
  const signature = crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}
