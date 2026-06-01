import 'dotenv/config';

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const toCsv = (value, fallback) => {
  const source = value || fallback;
  return source.split(',').map((item) => item.trim()).filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigins: toCsv(process.env.CORS_ORIGIN, 'http://localhost:5173,http://127.0.0.1:5173'),
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
    authWindowMs: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000),
    authMaxRequests: toNumber(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10),
    registrationWindowMs: toNumber(process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS, 60 * 60_000),
    registrationMaxRequests: toNumber(process.env.REGISTRATION_RATE_LIMIT_MAX_REQUESTS, 5),
    uploadWindowMs: toNumber(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
    uploadMaxRequests: toNumber(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS, 20),
    assessmentWindowMs: toNumber(process.env.ASSESSMENT_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
    assessmentMaxRequests: toNumber(process.env.ASSESSMENT_RATE_LIMIT_MAX_REQUESTS, 30),
    dashboardWindowMs: toNumber(process.env.DASHBOARD_RATE_LIMIT_WINDOW_MS, 60_000),
    dashboardMaxRequests: toNumber(process.env.DASHBOARD_RATE_LIMIT_MAX_REQUESTS, 120),
    exportWindowMs: toNumber(process.env.EXPORT_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
    exportMaxRequests: toNumber(process.env.EXPORT_RATE_LIMIT_MAX_REQUESTS, 15),
  },
  upload: {
    maxSizeBytes: toNumber(process.env.UPLOAD_SIZE_LIMIT_BYTES, 10 * 1024 * 1024),
    allowedMimeTypes: toCsv(
      process.env.UPLOAD_ALLOWED_MIME_TYPES,
      'application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'
    ),
  },
  databasePool: {
    min: toNumber(process.env.DB_POOL_MIN, 1),
    max: toNumber(process.env.DB_POOL_MAX, 10),
    idleTimeoutMs: toNumber(process.env.DB_IDLE_TIMEOUT_MS, 30_000),
    connectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 10_000),
  },
  queue: {
    maxConcurrent: toNumber(process.env.QUEUE_MAX_CONCURRENT, 2),
    maxPending: toNumber(process.env.QUEUE_MAX_PENDING, 100),
    acquireTimeoutMs: toNumber(process.env.QUEUE_ACQUIRE_TIMEOUT_MS, 15_000),
    jobTimeoutMs: toNumber(process.env.QUEUE_JOB_TIMEOUT_MS, 25_000),
  },
  requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 25_000),
  serverlessFunctionTimeoutMs: toNumber(process.env.SERVERLESS_FUNCTION_TIMEOUT_MS, 30_000),
};

export function validateEnv() {
  const missing = [];

  if (!env.databaseUrl) missing.push('DATABASE_URL');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (env.nodeEnv === 'production' && !process.env.CORS_ORIGIN) missing.push('CORS_ORIGIN');

  if (missing.length > 0) {
    const message = `Missing environment variables: ${missing.join(', ')}`;
    if (env.nodeEnv === 'production') {
      throw new Error(message);
    }
    console.warn(`${message}. Some features may not work until they are configured.`);
  }

  if (env.nodeEnv === 'production') {
    if (String(env.jwtSecret || '').length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }
    if (env.corsOrigins.some((origin) => origin === '*')) {
      throw new Error('CORS_ORIGIN cannot be "*" in production.');
    }
    if (env.databasePool.max < 1 || env.databasePool.max > 50) {
      throw new Error('DB_POOL_MAX must be between 1 and 50 in production.');
    }
    if (env.requestTimeoutMs >= env.serverlessFunctionTimeoutMs) {
      throw new Error('REQUEST_TIMEOUT_MS must be lower than SERVERLESS_FUNCTION_TIMEOUT_MS.');
    }
  }
}
