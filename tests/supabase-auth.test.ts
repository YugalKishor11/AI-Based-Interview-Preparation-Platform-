import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  mapProfileRowToProfile,
  SupabaseAuthRepo,
} from '../src/data/supabase';
import { authRepo, profileRepo, dataSource } from '../src/data';

describe('Supabase Client & Auth Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Configuration & Credentials', () => {
    it('detects placeholder or missing credentials as not configured', () => {
      setCustomSupabaseCredentials('', '');
      // When placeholders are supplied
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('detects valid custom credentials when provided', () => {
      setCustomSupabaseCredentials('https://myapp.supabase.co', 'custom-anon-jwt-token-12345');
      expect(isSupabaseConfigured()).toBe(true);
      const creds = getSupabaseCredentials();
      expect(creds.url).toBe('https://myapp.supabase.co');
      expect(creds.anonKey).toBe('custom-anon-jwt-token-12345');
    });

    it('rejects invalid URL protocols', () => {
      setCustomSupabaseCredentials('not-a-valid-url', 'some-key');
      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe('Profile Mapping', () => {
    it('maps database snake_case row to camelCase Profile schema', () => {
      const row = {
        id: 'usr-123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        target_role: 'Engineering Manager',
        target_level: 'Senior',
        streak_days: 7,
        credits: 90,
        joined_date: 'October 2026',
        avatar_url: 'https://example.com/avatar.png',
      };

      const profile = mapProfileRowToProfile(row, 'jane@example.com', false);
      expect(profile.id).toBe('usr-123');
      expect(profile.name).toBe('Jane Doe');
      expect(profile.email).toBe('jane@example.com');
      expect(profile.targetRole).toBe('Engineering Manager');
      expect(profile.targetLevel).toBe('Senior');
      expect(profile.streakDays).toBe(7);
      expect(profile.credits).toBe(90);
      expect(profile.isDemo).toBe(false);
    });

    it('fills sensible defaults when optional database fields are omitted', () => {
      const profile = mapProfileRowToProfile({}, 'candidate@test.com', true);
      expect(profile.name).toBe('candidate');
      expect(profile.targetRole).toBe('Staff Software Engineer');
      expect(profile.credits).toBe(120);
      expect(profile.streakDays).toBe(0);
    });
  });

  describe('Auth Repository Interface Compliance', () => {
    it('SupabaseAuthRepo implements all AuthRepo methods', () => {
      const repo = new SupabaseAuthRepo();
      expect(typeof repo.getUser).toBe('function');
      expect(typeof repo.signIn).toBe('function');
      expect(typeof repo.signUp).toBe('function');
      expect(typeof repo.signOut).toBe('function');
      expect(typeof repo.resetPassword).toBe('function');
      expect(typeof repo.signInWithOAuth).toBe('function');
    });

    it('gracefully informs user when attempting Supabase sign in without configuration', async () => {
      setCustomSupabaseCredentials('', '');
      const repo = new SupabaseAuthRepo();
      await expect(repo.signIn('test@example.com', 'password')).rejects.toThrow(
        /Supabase is not configured/
      );
    });

    it('gracefully informs user when attempting Supabase sign up without configuration', async () => {
      setCustomSupabaseCredentials('', '');
      const repo = new SupabaseAuthRepo();
      await expect(repo.signUp('Test User', 'test@example.com', 'password')).rejects.toThrow(
        /Supabase is not configured/
      );
    });

    it('demo fallback authRepo works smoothly in mock mode', async () => {
      const user = await authRepo.getUser();
      expect(user).not.toBeNull();
      expect(user?.email).toBeDefined();

      const signedIn = await authRepo.signIn('demo.user@example.com');
      expect(signedIn.email).toBe('demo.user@example.com');
    });
  });
});
