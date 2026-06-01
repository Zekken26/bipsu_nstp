import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function requestTimeout(timeoutMs = env.requestTimeoutMs) {
  return (req, res, next) => {
    req.timedOut = false;
    req.deadlineAt = Date.now() + timeoutMs;
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = (body) => {
      if (req.timedOut && res.headersSent) return res;
      return originalJson(body);
    };
    res.send = (body) => {
      if (req.timedOut && res.headersSent) return res;
      return originalSend(body);
    };

    const timer = setTimeout(() => {
      req.timedOut = true;
      if (!res.headersSent) {
        logger.warn('Request timeout guard returned early', {
          method: req.method,
          path: req.originalUrl,
          timeoutMs,
          serverlessFunctionTimeoutMs: env.serverlessFunctionTimeoutMs,
        });
        res.status(503).json({
          success: false,
          error: 'This request is taking longer than expected. Please retry in a moment.',
          code: 'REQUEST_TIMEOUT',
          retryable: true,
        });
      }
    }, timeoutMs);

    timer.unref();

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    return next();
  };
}

export function remainingRequestTime(req) {
  return Math.max(0, Number(req.deadlineAt || 0) - Date.now());
}
