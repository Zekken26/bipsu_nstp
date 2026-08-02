import express from 'express';
import helmet from 'helmet';
import { createCorsMiddleware, validateCookieRequestOrigin } from './config/cors.js';
import { isPostgresReady } from './db/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { assertRateLimitConfiguration } from './middleware/rateLimit.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();

  const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? (process.env.NODE_ENV === 'production' ? '1' : '0'));
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 0 || trustedProxyHops > 2) throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 2.');
  assertRateLimitConfiguration();
  app.set('trust proxy', trustedProxyHops);
  app.use(helmet());
  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', validateCookieRequestOrigin);

  app.get('/health', async (req, res) => {
    res.json({
      ok: true,
      service: 'nstp-express-api',
      database: {
        provider: 'postgresql',
        ready: await isPostgresReady(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
