import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../types/common.types';
import { logger } from '../services/LoggingService';
import { config } from '../config';

/**
 * Global error handler — catches all thrown and unhandled errors.
 * Maps AppError to structured JSON; hides internals for non-operational errors.
 */
export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── AppError (expected, operational) ──────────────────────────
  if (err instanceof AppError) {
    logger.warn({
      requestId: req.requestId,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      message: err.message,
    }, `Operational error: ${err.message}`);

    const body: ErrorResponse = {
      status: 'error',
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unexpected / programmer error ─────────────────────────────
  logger.error({
    requestId: req.requestId,
    err,
    stack: err.stack,
  }, `Unexpected error: ${err.message}`);

  const isProduction = config.nodeEnv === 'production';

  const body: ErrorResponse = {
    status: 'error',
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: isProduction ? 'An unexpected error occurred' : err.message,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(body);
}
