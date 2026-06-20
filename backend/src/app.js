import express from 'express';
import helmet from 'helmet';
import { createCorsMiddleware } from './config/cors.js';
import { isPostgresReady } from './db/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '1mb' }));

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
