/**
 * Error middlewares
 * -----------------
 * notFound     -> any unknown route becomes a 404 ApiError
 * errorHandler -> the ONE place that converts errors into JSON responses
 */
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Express recognises an error handler by its 4 arguments.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let { message } = err;

  // Mongoose schema validation failed (e.g. username too short)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // MongoDB unique index violation (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409;
    message = `${Object.keys(err.keyValue).join(', ')} already in use`;
  }

  if (statusCode >= 500) logger.error(err);

  res.status(statusCode).json({
    message: statusCode >= 500 && env.IS_PROD ? 'Internal server error' : message,
  });
};
