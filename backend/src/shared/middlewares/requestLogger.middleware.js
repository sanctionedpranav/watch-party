/**
 * requestLogger
 * -------------
 * Logs every HTTP request once the response has been sent, e.g.
 *   "POST /api/auth/login 200 - 34ms"
 */
import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
};
