import { env } from '../config/env.js';

const buckets = new Map();

function gcBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

setInterval(gcBuckets, 30_000).unref();

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const user = req.headers['x-user-id'];
  return `${user || 'anon'}:${ip?.trim() || req.ip || req.socket?.remoteAddress || 'unknown'}`;
}

export function createRateLimiter({ limit, windowMs, keyPrefix, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = `${keyPrefix}:${clientKey(req)}`;
    const existing = buckets.get(bucketKey);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      buckets.set(bucketKey, { count: 1, resetAt });
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - 1)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
      return next();
    }

    existing.count += 1;
    const remaining = Math.max(0, limit - existing.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)));

    if (existing.count > limit) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: message || 'Too many requests. Please slow down and try again shortly.',
        code: 'RATE_LIMITED',
        retryAfterSeconds,
      });
    }

    return next();
  };
}

export const softReadLimiter = createRateLimiter({
  keyPrefix: 'read',
  limit: env.rateLimit.maxRequests,
  windowMs: env.rateLimit.windowMs,
  message: 'Too many API requests. Please wait a moment before refreshing again.',
});

export const strictWriteLimiter = createRateLimiter({
  keyPrefix: 'write',
  limit: Math.min(80, env.rateLimit.maxRequests),
  windowMs: env.rateLimit.windowMs,
  message: 'Too many changes were submitted too quickly. Please wait and try again.',
});

export const authLimiter = createRateLimiter({
  keyPrefix: 'auth',
  limit: env.rateLimit.authMaxRequests,
  windowMs: env.rateLimit.authWindowMs,
  message: 'Too many login attempts. Please wait before trying again.',
});

export const registrationLimiter = createRateLimiter({
  keyPrefix: 'registration',
  limit: env.rateLimit.registrationMaxRequests,
  windowMs: env.rateLimit.registrationWindowMs,
  message: 'Too many registration attempts. Please wait before submitting another request.',
});

export const uploadLimiter = createRateLimiter({
  keyPrefix: 'upload',
  limit: env.rateLimit.uploadMaxRequests,
  windowMs: env.rateLimit.uploadWindowMs,
  message: 'Uploads are being submitted too quickly. Please wait before uploading again.',
});

export const assessmentSubmissionLimiter = createRateLimiter({
  keyPrefix: 'assessment',
  limit: env.rateLimit.assessmentMaxRequests,
  windowMs: env.rateLimit.assessmentWindowMs,
  message: 'Assessment submissions are being sent too quickly. Please wait and try again.',
});

export const dashboardLimiter = createRateLimiter({
  keyPrefix: 'dashboard',
  limit: env.rateLimit.dashboardMaxRequests,
  windowMs: env.rateLimit.dashboardWindowMs,
  message: 'Dashboard refreshes are happening too quickly. Please wait a moment.',
});

export const exportLimiter = createRateLimiter({
  keyPrefix: 'export',
  limit: env.rateLimit.exportMaxRequests,
  windowMs: env.rateLimit.exportWindowMs,
  message: 'Export requests are being generated too quickly. Please wait before exporting again.',
});
