import { logger } from '../utils/logger.js';
import { isOperationalError } from '../utils/apiError.js';

const databaseErrorCodes = new Set(['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isDatabaseError = databaseErrorCodes.has(err?.code);
  const statusCode = isDatabaseError ? 503 : err.statusCode || 500;
  const operational = isOperationalError(err) || isDatabaseError;
  const message = isDatabaseError
    ? 'Database is temporarily unavailable. Please try again shortly.'
    : operational
      ? err.message
      : 'Internal server error';

  logger.error(operational ? 'Request failed' : 'Unhandled request error', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    code: err.code,
    statusCode,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  return res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code,
    details: err.details,
  });
}
