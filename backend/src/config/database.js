import { env } from './env.js';

function secondsFromMs(value) {
  return Math.max(1, Math.ceil(value / 1000));
}

export function buildPooledDatabaseUrl(databaseUrl = env.databaseUrl) {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    const maxPool = Math.max(1, env.databasePool.max);
    const connectTimeoutSeconds = secondsFromMs(env.databasePool.connectionTimeoutMs);
    const idleTimeoutMs = Math.max(1_000, env.databasePool.idleTimeoutMs);

    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', String(maxPool));
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', String(connectTimeoutSeconds));
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', String(connectTimeoutSeconds));
    }
    if (!url.searchParams.has('application_name')) {
      url.searchParams.set('application_name', 'bipsu_nstp_api');
    }
    if (!url.searchParams.has('options')) {
      url.searchParams.set('options', `-c idle_in_transaction_session_timeout=${idleTimeoutMs}`);
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export function getDatabasePoolConfig() {
  return {
    min: env.databasePool.min,
    max: env.databasePool.max,
    idleTimeoutMs: env.databasePool.idleTimeoutMs,
    connectionTimeoutMs: env.databasePool.connectionTimeoutMs,
    prismaConnectionLimit: env.databasePool.max,
    note: 'Prisma opens PostgreSQL connections lazily; DB_POOL_MIN is exposed for hosting/PgBouncer parity.',
  };
}
