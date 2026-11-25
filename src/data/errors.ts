// PrepSphere Unified Error Mapping System
// Standardizes all wire, auth, network, and database failures into actionable UI states.

export interface AppUiError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  status?: number;
  retryAfterSeconds?: number;
  isRetryable: boolean;
  action?: 'sign_in' | 'retry' | 'refresh' | 'replenish_credits' | 'dismiss';
}

export class UnifiedAppError extends Error implements AppUiError {
  public readonly code: string;
  public readonly userFriendlyMessage: string;
  public readonly status?: number;
  public readonly retryAfterSeconds?: number;
  public readonly isRetryable: boolean;
  public readonly action?: 'sign_in' | 'retry' | 'refresh' | 'replenish_credits' | 'dismiss';

  constructor(opts: AppUiError) {
    super(opts.message);
    this.name = 'UnifiedAppError';
    this.code = opts.code;
    this.userFriendlyMessage = opts.userFriendlyMessage;
    this.status = opts.status;
    this.retryAfterSeconds = opts.retryAfterSeconds;
    this.isRetryable = opts.isRetryable;
    this.action = opts.action;
  }
}

/**
 * Maps any unknown error, HTTP response, or exception into a uniform AppUiError.
 */
export function mapError(error: unknown): AppUiError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred.',
      userFriendlyMessage: 'An unexpected issue occurred. Please try again.',
      isRetryable: true,
      action: 'retry',
    };
  }

  // If already mapped
  if (typeof error === 'object' && error !== null && 'userFriendlyMessage' in error && 'code' in error) {
    return error as AppUiError;
  }

  const errObj = error as Record<string, unknown>;
  const status = typeof errObj.status === 'number' ? errObj.status : undefined;
  const rawMsg = String(errObj.message || errObj.error_description || error || '');
  const rawCode = String(errObj.code || '');

  // 1. Session Expired / Unauthorized (401)
  if (
    status === 401 ||
    rawCode === 'UNAUTHORIZED' ||
    rawCode === 'session_expired' ||
    rawMsg.toLowerCase().includes('jwt expired') ||
    rawMsg.toLowerCase().includes('not authenticated') ||
    rawMsg.toLowerCase().includes('invalid token')
  ) {
    return {
      code: 'SESSION_EXPIRED',
      status: 401,
      message: rawMsg || 'Authentication required or token expired.',
      userFriendlyMessage: 'Your session has expired. Please sign in again to continue.',
      isRetryable: false,
      action: 'sign_in',
    };
  }

  // 2. Rate Limit Exceeded (429)
  if (
    status === 429 ||
    rawCode === 'RATE_LIMIT_EXCEEDED' ||
    rawCode === 'over_email_send_rate_limit' ||
    rawMsg.toLowerCase().includes('rate limit')
  ) {
    const retryHeader = errObj.retryAfter || errObj.retryAfterSeconds;
    let retrySec = typeof retryHeader === 'number' ? retryHeader : 60;
    const match = rawMsg.match(/(\d+)\s*(?:seconds?|s)/i);
    if (match && match[1]) {
      retrySec = parseInt(match[1], 10);
    }

    return {
      code: 'RATE_LIMITED',
      status: 429,
      retryAfterSeconds: retrySec,
      message: rawMsg || 'Rate limit exceeded.',
      userFriendlyMessage: `Too many requests. Please wait ${retrySec} seconds before trying again.`,
      isRetryable: true,
      action: 'retry',
    };
  }

  // 3. Insufficient Practice Credits (402)
  if (status === 402 || rawCode === 'INSUFFICIENT_CREDITS' || rawMsg.toLowerCase().includes('insufficient credits')) {
    return {
      code: 'INSUFFICIENT_CREDITS',
      status: 402,
      message: rawMsg || 'Insufficient practice credits.',
      userFriendlyMessage: 'You do not have enough practice credits to start this session. Please top up your balance.',
      isRetryable: false,
      action: 'replenish_credits',
    };
  }

  // 4. Resource Not Found (404)
  if (status === 404 || rawCode === 'NOT_FOUND' || rawMsg.toLowerCase().includes('not found')) {
    return {
      code: 'NOT_FOUND',
      status: 404,
      message: rawMsg || 'Resource not found.',
      userFriendlyMessage: 'The requested interview, report, or question could not be found.',
      isRetryable: false,
      action: 'dismiss',
    };
  }

  // 5. Concurrency / Turn Conflict (409)
  if (status === 409 || rawCode === 'STALE_TURN_SEQ' || rawCode === 'IDEMPOTENCY_CONFLICT') {
    return {
      code: 'CONFLICT',
      status: 409,
      message: rawMsg || 'Resource or turn sequence conflict.',
      userFriendlyMessage: 'A turn sequence synchronization conflict occurred. Please refresh to synchronize state.',
      isRetryable: true,
      action: 'refresh',
    };
  }

  // 6. Network / Offline Failure
  if (
    rawMsg.toLowerCase().includes('failed to fetch') ||
    rawMsg.toLowerCase().includes('networkerror') ||
    rawMsg.toLowerCase().includes('network error') ||
    rawMsg.toLowerCase().includes('network request failed')
  ) {
    return {
      code: 'NETWORK_ERROR',
      message: rawMsg,
      userFriendlyMessage: 'Network connection lost. Please check your internet connection.',
      isRetryable: true,
      action: 'retry',
    };
  }

  // 7. Zod / Schema Validation Failure
  if (rawCode === 'VALIDATION_ERROR' || rawMsg.toLowerCase().includes('validation') || 'issues' in errObj) {
    return {
      code: 'VALIDATION_ERROR',
      status: 400,
      message: rawMsg,
      userFriendlyMessage: 'Data format validation failed. Please check your inputs.',
      isRetryable: false,
      action: 'dismiss',
    };
  }

  // 8. Generic Server Error (500+)
  return {
    code: 'SERVER_ERROR',
    status: status || 500,
    message: rawMsg || 'Internal server error.',
    userFriendlyMessage: 'A server error occurred while processing your request. Please try again shortly.',
    isRetryable: true,
    action: 'retry',
  };
}
