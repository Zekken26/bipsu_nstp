import cors from 'cors';

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function createCorsMiddleware() {
  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigins;

  return cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  });
}
