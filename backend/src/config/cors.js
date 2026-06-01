import cors from 'cors';
import { env } from './env.js';

export function createCorsMiddleware() {
  const configuredOrigins = env.corsOrigins;

  return cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-User-Id',
      'X-User-Role',
      'X-User-Component',
      'X-User-Municipalities',
      'X-Active-Municipality',
    ],
    maxAge: 600,
  });
}
