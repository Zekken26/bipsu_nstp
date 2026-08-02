import cors from 'cors';

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function getAllowedOrigins() {
  return process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigins;
}

export function createCorsMiddleware() {
  const configuredOrigins = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS blocked origin'));
    },
    credentials: true,
  });
}

export function validateCookieRequestOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.headers.cookie?.includes('nstp_auth=')) return next();
  const origin = req.get('origin');
  if (!origin || !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ success: false, error: 'Invalid request origin.' });
  }
  return next();
}
