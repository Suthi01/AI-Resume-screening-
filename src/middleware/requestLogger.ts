import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/LoggingService';

/**
 * Structured access logger.
 * Logs on response finish so `statusCode` and `durationMs` are accurate.
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - req.startTime);

    logger.info({
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      contentLength: res.getHeader('content-length'),
      userAgent: req.headers['user-agent'],
      componentTimings: req.componentTimings,
    }, `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });

  next();
}
