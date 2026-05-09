import { Response } from 'express';

// ─── AppError ─────────────────────────────────────────────────────────────────
// A typed error subclass that carries an HTTP status code.
// Throw this anywhere in the application — the centralized error handler
// in middleware/errorHandler.ts will catch it and respond appropriately.
//
// Usage:
//   throw new AppError('User not found', 404);
//   throw new AppError('Invalid credentials', 401);
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // isOperational = true means we caused this error intentionally (e.g. 404,
    // 401). isOperational = false (default Error) means it's a programming bug
    // or unexpected crash — the error handler will treat those differently.
    this.isOperational = true;

    // Restore the correct prototype chain so instanceof checks work.
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Response shape types ──────────────────────────────────────────────────────
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

// ─── ApiResponse ──────────────────────────────────────────────────────────────
// Static helper used in every controller to send uniform JSON responses.
//
// Success usage:
//   return ApiResponse.success(res, 201, 'User created', { user });
//
// Error usage:
//   return ApiResponse.error(res, 400, 'Validation failed', ['Email is required']);
export class ApiResponse {
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T,
    meta?: Record<string, unknown>,
  ): Response<SuccessResponse<T>> {
    const body: SuccessResponse<T> = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static error(
    res: Response,
    statusCode: number,
    message: string,
    errors?: string[],
  ): Response<ErrorResponse> {
    const body: ErrorResponse = { success: false, message };
    if (errors?.length) body.errors = errors;
    return res.status(statusCode).json(body);
  }
}
