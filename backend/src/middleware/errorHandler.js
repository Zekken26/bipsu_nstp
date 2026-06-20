import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  logger.error('Unhandled request error', {
    message: err.message,
    path: req.originalUrl,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.statusCode ? err.message : 'Internal server error',
  });
}
