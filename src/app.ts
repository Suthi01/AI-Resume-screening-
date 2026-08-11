import express, { Request, Response } from 'express';
import { config } from './config';
import { routes } from './routes';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { sizeLimitMiddleware } from './middleware/sizeLimit';
import { errorHandlerMiddleware } from './middleware/errorHandler';
import { AppError } from './types/common.types';
import { API_VERSION } from './config/constants';
import ingestionRoutes from './routes/ingestionRoutes';
import { uploadRoutes } from './routes/upload.routes';

/**
 * Express application factory.
 * Applies middleware in the correct order, mounts versioned routes,
 * and attaches the global error handler.
 */
export function createApp(): express.Application {
  const app = express();

  // ── Pre-route middleware (order matters) ──────────────────────

  // 1. Request ID + start time
  app.use(requestIdMiddleware);

  // 2. Structured access log (registers on 'finish' event)
  app.use(requestLoggerMiddleware);

  // 3. Payload size guard (before body parsing)
  app.use(sizeLimitMiddleware);

  // 4. Body parsers
  app.use(express.json({ limit: `${config.maxPayloadBytes}b` }));
  app.use(express.urlencoded({ extended: true, limit: `${config.maxPayloadBytes}b` }));

  // ── Routes ────────────────────────────────────────────────────

  app.use(`/${API_VERSION}`, routes);
app.use(`/${API_VERSION}`, ingestionRoutes);
app.use(`/${API_VERSION}`, uploadRoutes);

  // ── 404 catch-all ─────────────────────────────────────────────

  app.use((_req: Request, _res: Response) => {
    throw new AppError(
      `Route not found: ${_req.method} ${_req.originalUrl}`,
      404,
      'NOT_FOUND'
    );
  });

  // ── Global error handler (must be last) ───────────────────────

  app.use(errorHandlerMiddleware);

  return app;
}
