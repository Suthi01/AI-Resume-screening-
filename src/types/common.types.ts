

// ─── Custom Error ────────────────────────────────────────────────

/**
 * Application-level error with HTTP status code and machine-readable error code.
 * `isOperational` distinguishes expected errors (bad input, upstream failures)
 * from programmer bugs.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Extended Request ────────────────────────────────────────────

/**
 * Express Request augmented with per-request tracking fields.
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      componentTimings?: ComponentTimings;
    }
  }
}

// ─── Timing ──────────────────────────────────────────────────────

/**
 * Per-component latency breakdown (milliseconds).
 */
export interface ComponentTimings {
  embeddingMs?: number;
  bm25Ms?: number;
  vectorMs?: number;
  rerankMs?: number;
  summarizeMs?: number;
}

// ─── Standard API Response Envelope ──────────────────────────────

/**
 * Uniform JSON error response shape.
 */
export interface ErrorResponse {
  status: 'error';
  statusCode: number;
  errorCode: string;
  message: string;
  requestId?: string;
  timestamp: string;
}

/**
 * Uniform JSON success response shape (generic payload).
 */
export interface SuccessResponse<T> {
  status: 'ok';
  data: T;
  requestId?: string;
  timestamp: string;
}
