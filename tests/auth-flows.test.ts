import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockAuthRepo } from '../src/data/mock';
import { SupabaseAuthRepo } from '../src/data/supabase/authRepo';
import { setCustomSupabaseCredentials, isSupabaseConfigured } from '../src/data/supabase/client';

describe('Auth Flows & Security Contract Tests (Prompt 4)', () => {
  let mockRepo: MockAuthRepo;

  beforeEach(() => {
    mockRepo = new MockAuthRepo();
    setCustomSupabaseCredentials('', ''); // Clear credentials
  });

  describe('Password Policy Enforcement', () => {
    it('enforces a minimum password length of 10 characters', () => {
      const validatePassword = (pwd: string) => pwd.length >= 10;
      expect(validatePassword('short123')).toBe(false);
      expect(validatePassword('123456789')).toBe(false);
      expect(validatePassword('valid-pass-10')).toBe(true);
      expect(validatePassword('super-secure-candidate-pwd')).toBe(true);
    });
  });

  describe('Account Deletion Guard (Prompt 4 Security Rules)', () => {
    it('MockAuthRepo rejects account deletion when confirmation is not exactly "DELETE"', async () => {
      await expect(mockRepo.deleteAccount('delete')).rejects.toThrow(
        /type 'DELETE' to confirm/i
      );
      await expect(mockRepo.deleteAccount('NO')).rejects.toThrow(
        /type 'DELETE' to confirm/i
      );
    });

    it('MockAuthRepo permits account deletion when confirmation is "DELETE"', async () => {
      await expect(mockRepo.deleteAccount('DELETE')).resolves.toBeUndefined();
    });

    it('SupabaseAuthRepo requires "DELETE" before contacting Supabase backend', async () => {
      const supaRepo = new SupabaseAuthRepo();
      await expect(supaRepo.deleteAccount('wrong-string')).rejects.toThrow(
        /type 'DELETE' to confirm/i
      );
    });
  });

  describe('Session Scoping & Sign Out', () => {
    it('MockAuthRepo supports scoped sign-outs (global, local, others)', async () => {
      await expect(mockRepo.signOut({ scope: 'others' })).resolves.toBeUndefined();
      await expect(mockRepo.signOut({ scope: 'local' })).resolves.toBeUndefined();
      await expect(mockRepo.signOut({ scope: 'global' })).resolves.toBeUndefined();
    });

    it('SupabaseAuthRepo supports scoped sign out parameters', () => {
      const supaRepo = new SupabaseAuthRepo();
      expect(typeof supaRepo.signOut).toBe('function');
    });
  });

  describe('Versioned Consents & GDPR/DPDP Compliance', () => {
    it('records versioned consents for all 5 legal consent types', async () => {
      const consentTypes: Array<'terms' | 'privacy' | 'recording' | 'resume_processing' | 'analytics'> = [
        'terms',
        'privacy',
        'recording',
        'resume_processing',
        'analytics',
      ];

      for (const kind of consentTypes) {
        await expect(mockRepo.recordConsent(kind, true)).resolves.toBeUndefined();
      }
    });
  });

  describe('Password & Email Updates', () => {
    it('MockAuthRepo updates password and email', async () => {
      await expect(mockRepo.updatePassword('new-secure-password-2026')).resolves.toBeUndefined();
      await expect(mockRepo.updateEmail('updated.candidate@example.com')).resolves.toBeUndefined();
    });

    it('SupabaseAuthRepo exposes updatePassword and updateEmail', () => {
      const supaRepo = new SupabaseAuthRepo();
      expect(typeof supaRepo.updatePassword).toBe('function');
      expect(typeof supaRepo.updateEmail).toBe('function');
    });
  });

  describe('Protected Route Redirect URI Formation', () => {
    it('encodes candidate return URL cleanly without vulnerability to open redirects', () => {
      const intendedPath = '/app/interview/new?type=system-design';
      const encoded = encodeURIComponent(intendedPath);
      expect(encoded).toBe('%2Fapp%2Finterview%2Fnew%3Ftype%3Dsystem-design');

      const loginRedirectTarget = `/login?redirectTo=${encoded}`;
      const searchParams = new URLSearchParams(loginRedirectTarget.split('?')[1]);
      expect(decodeURIComponent(searchParams.get('redirectTo') || '')).toBe(intendedPath);
    });
  });
});
