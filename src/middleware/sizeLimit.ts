import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AppError } from '../types/common.types';

/**
 * Rejects requests whose Content-Length exceeds the configured maximum.
 * Returns 413 Payload Too Large before the body is fully parsed.
 */
export function sizeLimitMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);

  if (contentLength > config.maxPayloadBytes) {
    throw new AppError(
      `Payload too large. Maximum allowed: ${config.maxPayloadBytes} bytes, received: ${contentLength} bytes`,
      413,
      'PAYLOAD_TOO_LARGE'
    );
  }

  next();
}
