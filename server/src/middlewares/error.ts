import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../config/env.js';

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? 'Internal server error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors ?? {}).map(
      (val) => (val as { message?: string }).message ?? 'Validation error'
    );
    message = `Validation error: ${messages.join(', ')}`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  if (!(err instanceof AppError) || statusCode >= 500) {
    logger.error({ err }, message);
  }

  // Never leak internals (driver/db messages) on unexpected 5xx in production.
  // AppError messages are authored for clients and are kept.
  if (isProd && statusCode >= 500 && !(err instanceof AppError)) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};
