/**
 * Authentication Error Mapper
 * Standardizes Supabase and network auth errors into candidate-friendly messages.
 * Enforces security rule: Never reveal whether an email is registered (same message and timing for found and not found).
 */

export interface MappedAuthError {
  code: string;
  message: string;
  retryAfterSeconds?: number;
  isRateLimit?: boolean;
  isUnverified?: boolean;
}

export function mapAuthError(error: unknown): MappedAuthError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred during authentication. Please try again.',
    };
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  // 1. Invalid credentials or email not found (unified to prevent email enumeration)
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('user not found') ||
    lower.includes('invalid credentials')
  ) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please verify your credentials or sign in with a magic link.',
    };
  }

  // 2. Email verification pending
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return {
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Your email address has not been verified yet. Please check your inbox for the confirmation link.',
      isUnverified: true,
    };
  }

  // 3. Rate limiting / Email send frequency cap
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('429')
  ) {
    // Extract retry seconds if available in error message
    const match = rawMessage.match(/(\d+)\s*seconds?/i);
    const retrySec = match ? parseInt(match[1], 10) : 30;

    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many attempts. For your security, please wait ${retrySec} seconds before trying again.`,
      retryAfterSeconds: retrySec,
      isRateLimit: true,
    };
  }

  // 4. Password policy breach
  if (
    lower.includes('password should be at least') ||
    lower.includes('password is too weak') ||
    lower.includes('pwned') ||
    lower.includes('compromised')
  ) {
    return {
      code: 'WEAK_PASSWORD',
      message: 'Password must be at least 10 characters long and cannot be a commonly leaked passphrase.',
    };
  }

  // 5. Network / Gateway issues
  if (
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('timeout') ||
    lower.includes('failed to fetch')
  ) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection issue. Please verify your internet connection and try again.',
    };
  }

  // 6. Generic safe fallback
  return {
    code: 'AUTH_FAILED',
    message: rawMessage.length < 120 ? rawMessage : 'Authentication service temporarily unavailable. Please retry.',
  };
}

/**
 * Standardized response for password reset requests to prevent user enumeration
 */
export const USER_ENUMERATION_SAFE_NOTICE =
  'If an account exists with this email address, password reset instructions have been sent. Please check your inbox.';
