import { describe, it, expect } from 'vitest';
import { mapAuthError, USER_ENUMERATION_SAFE_NOTICE } from '../src/shared/auth/authErrorMapper';

describe('Auth Error Mapper Unit Tests (Prompt 4 Security Rules)', () => {
  describe('User Enumeration Defense', () => {
    it('maps "Invalid login credentials" to a generic candidate-safe message', () => {
      const err = mapAuthError(new Error('Invalid login credentials'));
      expect(err.code).toBe('INVALID_CREDENTIALS');
      expect(err.message).toContain('Invalid email or password');
    });

    it('maps "User not found" to identical message as invalid password to prevent email enumeration', () => {
      const notFoundErr = mapAuthError(new Error('User not found'));
      const wrongPwdErr = mapAuthError(new Error('invalid credentials'));
      expect(notFoundErr.code).toBe('INVALID_CREDENTIALS');
      expect(notFoundErr.message).toBe(wrongPwdErr.message);
    });

    it('provides standardized password reset enumeration-safe notice', () => {
      expect(USER_ENUMERATION_SAFE_NOTICE).toContain('If an account exists with this email address');
      expect(USER_ENUMERATION_SAFE_NOTICE).not.toContain('not found');
    });
  });

  describe('Unverified Email Detection', () => {
    it('detects unverified email errors and flags isUnverified', () => {
      const err = mapAuthError(new Error('Email not confirmed'));
      expect(err.code).toBe('EMAIL_NOT_VERIFIED');
      expect(err.isUnverified).toBe(true);
      expect(err.message).toContain('confirmation link');
    });

    it('handles snake_case email_not_confirmed error strings', () => {
      const err = mapAuthError(new Error('error: email_not_confirmed'));
      expect(err.code).toBe('EMAIL_NOT_VERIFIED');
      expect(err.isUnverified).toBe(true);
    });
  });

  describe('Rate Limiting & Cooldown Parsing', () => {
    it('parses specific cooldown seconds from Supabase rate limit messages', () => {
      const err = mapAuthError(new Error('over_email_send_rate_limit: please wait 45 seconds before retrying'));
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.isRateLimit).toBe(true);
      expect(err.retryAfterSeconds).toBe(45);
      expect(err.message).toContain('45 seconds');
    });

    it('defaults to 30 seconds when cooldown duration is not specified', () => {
      const err = mapAuthError(new Error('HTTP 429 Too Many Requests'));
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.isRateLimit).toBe(true);
      expect(err.retryAfterSeconds).toBe(30);
      expect(err.message).toContain('30 seconds');
    });
  });

  describe('Password Policy & Compromised Passwords', () => {
    it('maps weak or short password errors', () => {
      const err = mapAuthError(new Error('Password should be at least 10 characters'));
      expect(err.code).toBe('WEAK_PASSWORD');
      expect(err.message).toContain('at least 10 characters long');
    });

    it('maps compromised/pwned password warnings without leaking vulnerability details', () => {
      const err = mapAuthError(new Error('Password was found in compromised pwned database'));
      expect(err.code).toBe('WEAK_PASSWORD');
      expect(err.message).toContain('commonly leaked passphrase');
    });
  });

  describe('Network and Gateway Failures', () => {
    it('maps network dropouts cleanly', () => {
      const err = mapAuthError(new Error('Failed to fetch'));
      expect(err.code).toBe('NETWORK_ERROR');
      expect(err.message).toContain('internet connection');
    });

    it('handles null/undefined error gracefully', () => {
      const err = mapAuthError(null);
      expect(err.code).toBe('UNKNOWN_ERROR');
      expect(err.message).toBeTruthy();
    });
  });
});
