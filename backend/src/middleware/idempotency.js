import crypto from 'node:crypto';

const recentSubmissions = new Map();

function gcRecent() {
  const now = Date.now();
  for (const [key, expiresAt] of recentSubmissions.entries()) {
    if (expiresAt <= now) recentSubmissions.delete(key);
  }
}

setInterval(gcRecent, 30_000).unref();

function stableBody(value) {
  if (!value || typeof value !== 'object') return String(value || '');
  if (Array.isArray(value)) return `[${value.map(stableBody).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableBody(value[key])}`).join(',')}}`;
}

export function preventDuplicateSubmissions({ windowMs = 15_000, keyPrefix = 'submission' } = {}) {
  return (req, res, next) => {
    const explicitKey = req.headers['idempotency-key'];
    const user = req.headers['x-user-id'] || req.ip || 'anon';
    const fingerprint = explicitKey || crypto
      .createHash('sha256')
      .update(`${req.method}:${req.originalUrl}:${user}:${stableBody(req.body)}`)
      .digest('hex');
    const key = `${keyPrefix}:${fingerprint}`;
    const now = Date.now();
    const existing = recentSubmissions.get(key);

    if (existing && existing > now) {
      return res.status(409).json({
        success: false,
        error: 'This submission was already received. Please wait before sending it again.',
        code: 'DUPLICATE_SUBMISSION',
        retryAfterSeconds: Math.ceil((existing - now) / 1000),
      });
    }

    recentSubmissions.set(key, now + windowMs);
    return next();
  };
}
