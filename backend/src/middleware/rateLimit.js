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

export function createRateLimiter({ limit, windowMs, keyPrefix }) {
  return (req, res, next) => {
    const now = Date.now();
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const bucketKey = `${keyPrefix}:${clientId}`;
    const existing = buckets.get(bucketKey);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      buckets.set(bucketKey, { count: 1, resetAt });
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(limit - 1));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
      return next();
    }

    existing.count += 1;
    const remaining = Math.max(0, limit - existing.count);

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)));

    if (existing.count > limit) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
      });
    }

    return next();
  };
}

export const softReadLimiter = createRateLimiter({
  keyPrefix: 'read',
  limit: 300,
  windowMs: 60_000,
});

export const strictWriteLimiter = createRateLimiter({
  keyPrefix: 'write',
  limit: 80,
  windowMs: 60_000,
});
