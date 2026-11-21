import { supabase, isSupabaseConfigured } from './client';
import { AuthRepo } from '../repos/interfaces';
import { Profile } from '../contracts';
import { ProfileRow } from './types';
import { mapAuthError } from '../../shared/auth/authErrorMapper';

export function mapProfileRowToProfile(row: Partial<ProfileRow>, fallbackEmail = '', isDemo = false): Profile {
  return {
    id: row.id || 'u-default',
    name: (row as { display_name?: string }).display_name || row.name || (fallbackEmail ? fallbackEmail.split('@')[0] : 'Candidate'),
    email: row.email || fallbackEmail,
    targetRole: row.target_role || 'Staff Software Engineer',
    targetLevel: row.target_level || 'Staff',
    streakDays: row.streak_days || 0,
    credits: typeof row.credits === 'number' ? row.credits : 120,
    joinedDate: row.joined_date || 'November 2026',
    avatarUrl: row.avatar_url || undefined,
    onboardingCompleted: Boolean((row as Record<string, unknown>).onboarding_completed_at || (row as Record<string, unknown>).onboardingCompleted),
    isDemo,
  };
}

export class SupabaseAuthRepo implements AuthRepo {
  async getUser(): Promise<Profile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    // Attempt to fetch profile from public.profiles
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileRow) {
      return mapProfileRowToProfile(profileRow, user.email, false);
    }

    // If profile row doesn't exist yet, insert a default profile row
    const defaultName = (user.user_metadata?.name as string) || (user.email ? user.email.split('@')[0] : 'Candidate');
    const newProfileRow = {
      id: user.id,
      display_name: defaultName,
    };

    try {
      const { data: inserted } = await supabase
        .from('profiles')
        .insert(newProfileRow)
        .select()
        .single();
      if (inserted) {
        return mapProfileRowToProfile(inserted, user.email, false);
      }
    } catch {
      // Fallback in case of DB restrictions
    }

    return mapProfileRowToProfile(newProfileRow, user.email, false);
  }

  async signIn(email: string, password?: string): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw new Error(mapAuthError(error).message);
        }
        if (!data.user) {
          throw new Error('No user returned by authentication provider.');
        }
        const profile = await this.getUser();
        if (profile) return profile;
        return mapProfileRowToProfile({ id: data.user.id }, email, false);
      } else {
        // Passwordless Magic Link / OTP fallback using PKCE flow
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
          },
        });
        if (error) {
          throw new Error(mapAuthError(error).message);
        }
        return mapProfileRowToProfile({ id: 'pending-otp' }, email, false);
      }
    } catch (err: unknown) {
      throw new Error(mapAuthError(err).message);
    }
  }

  async signUp(name: string, email: string, password?: string): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'PrepSphere2026!',
        options: {
          data: {
            name,
            target_role: 'Staff Software Engineer',
            target_level: 'Staff',
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
        },
      });

      if (error) {
        throw new Error(mapAuthError(error).message);
      }

      if (!data.user) {
        throw new Error('Account created but user record was not returned.');
      }

      // Record required terms & privacy consent for the new candidate
      try {
        await this.recordConsent('terms', true);
        await this.recordConsent('privacy', true);
      } catch {
        // Ignore consent write failures during registration
      }

      const profile = await this.getUser();
      if (profile) return profile;

      return mapProfileRowToProfile(
        {
          id: data.user.id,
          name,
          email,
        },
        email,
        false
      );
    } catch (err: unknown) {
      throw new Error(mapAuthError(err).message);
    }
  }

  async signOut(options?: { scope?: 'global' | 'local' | 'others' }): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.auth.signOut({
        scope: options?.scope || 'global',
      });
      if (error) {
        console.warn('Supabase sign out error:', error.message);
      }
    } catch (err) {
      console.warn('Sign out exception:', err);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app/settings` : undefined,
      });
    } catch (err) {
      // Non-negotiable security: Never reveal whether an email exists
      console.warn('Password reset notification dispatched:', err);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      throw new Error(mapAuthError(error).message);
    }
  }

  async updateEmail(newEmail: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });
    if (error) {
      throw new Error(mapAuthError(error).message);
    }
  }

  async deleteAccount(confirmation: string): Promise<void> {
    if (confirmation !== 'DELETE') {
      throw new Error("Please type 'DELETE' to confirm permanent account erasure.");
    }
    if (!isSupabaseConfigured()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete user-owned records (cascade handles dependent rows)
    await supabase.from('profiles').delete().eq('id', user.id);
    await this.signOut();
  }

  async recordConsent(
    kind: 'terms' | 'privacy' | 'recording' | 'resume_processing' | 'analytics',
    granted: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('consents').insert({
      user_id: user.id,
      kind,
      version: 'v1.0',
      granted,
      user_agent_hash: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 32) : 'web',
    });
  }

  async signInWithOAuth(provider: 'google' | 'github'): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured for OAuth authentication.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
      },
    });
    if (error) {
      throw new Error(mapAuthError(error).message);
    }
  }
}
