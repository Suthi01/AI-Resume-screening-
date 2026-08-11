import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Assigns a unique UUID to every incoming request.
 * Sets the `X-Request-Id` response header so clients can correlate logs.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = performance.now();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
