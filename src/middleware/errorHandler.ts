import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError, ApiResponse } from '@/utils/ApiResponse';
import { env } from '@/config/env';

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Express identifies this as an error-handling middleware because it has
// exactly 4 parameters: (err, req, res, next).
// Register this LAST in app.ts, after all routes.
//
// Error classification:
//   AppError             → operational error thrown intentionally (4xx)
//   Mongoose Validation  → schema field validation failed → 400
//   Mongoose CastError   → invalid ObjectId in URL param  → 400
//   JWT errors           → invalid / expired token        → 401
//   Everything else      → unexpected crash               → 500
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Always log the full error server-side for observability.
  console.error('[errorHandler]', err);

  // ── Intentional operational error ──────────────────────────────────────────
  if (err instanceof AppError) {
    ApiResponse.error(res, err.statusCode, err.message);
    return;
  }

  // ── Mongoose document validation failure ───────────────────────────────────
  // e.g. required field missing, enum value invalid
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    ApiResponse.error(res, 400, 'Validation failed', messages);
    return;
  }

  // ── Mongoose invalid ObjectId in URL (e.g. /users/not-a-valid-id) ──────────
  if (err instanceof mongoose.Error.CastError) {
    ApiResponse.error(res, 400, `Invalid value for field: ${err.path}`);
    return;
  }

  // ── Mongoose duplicate key (unique constraint violation) ───────────────────
  // MongoServerError code 11000
  if ((err as NodeJS.ErrnoException).name === 'MongoServerError') {
    const mongoErr = err as Error & { code?: number; keyValue?: Record<string, unknown> };
    if (mongoErr.code === 11000) {
      const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? 'field';
      ApiResponse.error(res, 409, `${field} already exists`);
      return;
    }
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.error(res, 401, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ApiResponse.error(res, 401, 'Token expired');
    return;
  }

  // ── Unknown / programmer error ─────────────────────────────────────────────
  // In production, hide internal details from the client.
  const message = env.isProduction ? 'Internal server error' : err.message;
  ApiResponse.error(res, 500, message);
}
