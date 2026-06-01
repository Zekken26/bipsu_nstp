import { createApp } from './app.js';
import { env, validateEnv } from './config/env.js';
import prisma from './db/prisma.js';
import { logger } from './utils/logger.js';

validateEnv();

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`NSTP backend listening on http://localhost:${env.port}`);
});

server.requestTimeout = env.serverlessFunctionTimeoutMs;
server.headersTimeout = env.serverlessFunctionTimeoutMs + 5_000;

async function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down backend.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
