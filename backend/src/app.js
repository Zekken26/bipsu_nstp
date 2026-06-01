import express from 'express';
import { createCorsMiddleware } from './config/cors.js';
import { getPrismaPoolConfig, isPostgresReady } from './db/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestTimeout } from './middleware/requestTimeout.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestTimeout());

  app.get('/health', async (req, res) => {
    res.json({
      ok: true,
      service: 'nstp-express-api',
      database: {
        provider: 'postgresql',
        ready: await isPostgresReady(),
        pool: getPrismaPoolConfig(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
