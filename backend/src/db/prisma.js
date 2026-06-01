import { PrismaClient } from '@prisma/client';
import { buildPooledDatabaseUrl, getDatabasePoolConfig } from '../config/database.js';

// Reuse one PrismaClient instance for the whole API process.
// This avoids opening a new database connection on every request.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: process.env.DATABASE_URL
    ? {
      db: {
        url: buildPooledDatabaseUrl(process.env.DATABASE_URL),
      },
    }
    : undefined,
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function isPostgresReady() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export function getPrismaPoolConfig() {
  return getDatabasePoolConfig();
}

export default prisma;
