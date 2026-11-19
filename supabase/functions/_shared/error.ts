// Uniform error envelope and custom application errors
import { getCorsHeaders } from './cors.ts';
import { ErrorEnvelope } from './contracts/index.ts';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly retryAfter?: number;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', retryAfter?: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(message = 'Insufficient practice credits. Please replenish credits to proceed.') {
    super(message, 402, 'INSUFFICIENT_CREDITS');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number, message = 'Rate limit exceeded. Please wait before retrying.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', retryAfterSeconds);
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(message = 'Concurrent request in progress for this idempotency key.') {
    super(message, 409, 'IDEMPOTENCY_CONFLICT');
  }
}

export function formatErrorResponse(
  error: unknown,
  requestId: string,
  req?: Request
): Response {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred.';
  let retryAfter: number | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    retryAfter = error.retryAfter;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const envelope: ErrorEnvelope = {
    error: {
      code,
      message,
      requestId,
      ...(retryAfter ? { retryAfter } : {}),
    },
  };

  const headers: Record<string, string> = {
    ...getCorsHeaders(req),
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  };

  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter);
  }

  return new Response(JSON.stringify(envelope), {
    status: statusCode,
    headers,
  });
}
