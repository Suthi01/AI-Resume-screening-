import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../types/common.types';

/**
 * Factory that returns middleware to validate `req.body` against a Zod schema.
 * On failure, returns 400 with detailed per-field errors.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));

        throw new AppError(
          `Validation failed: ${fieldErrors.map((f) => `${f.field} — ${f.message}`).join('; ')}`,
          400,
          'VALIDATION_ERROR'
        );
      }
      throw err;
    }
  };
}
