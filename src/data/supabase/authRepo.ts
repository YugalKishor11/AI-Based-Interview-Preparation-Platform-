import { supabase, isSupabaseConfigured } from './client';
import { AuthRepo } from '../repos/interfaces';
import { Profile } from '../contracts';
import { ProfileRow } from './types';

export function mapProfileRowToProfile(row: Partial<ProfileRow>, fallbackEmail = '', isDemo = false): Profile {
  return {
    id: row.id || 'u-default',
    name: row.name || (fallbackEmail ? fallbackEmail.split('@')[0] : 'Candidate'),
    email: row.email || fallbackEmail,
    targetRole: row.target_role || 'Staff Software Engineer',
    targetLevel: row.target_level || 'Staff',
    streakDays: row.streak_days || 0,
    credits: typeof row.credits === 'number' ? row.credits : 120,
    joinedDate: row.joined_date || 'November 2026',
    avatarUrl: row.avatar_url || undefined,
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
    const newProfileRow: Partial<ProfileRow> = {
      id: user.id,
      name: defaultName,
      email: user.email || '',
      target_role: (user.user_metadata?.target_role as string) || 'Staff Software Engineer',
      target_level: (user.user_metadata?.target_level as string) || 'Staff',
      streak_days: 0,
      credits: 120,
      joined_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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

    if (password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message || 'Authentication failed. Please verify your credentials.');
      }
      if (!data.user) {
        throw new Error('No user returned by authentication provider.');
      }
      const profile = await this.getUser();
      if (profile) return profile;
      return mapProfileRowToProfile({ id: data.user.id }, email, false);
    } else {
      // Passwordless Magic Link / OTP fallback
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
        },
      });
      if (error) {
        throw new Error(error.message || 'Failed to send login confirmation link.');
      }
      return mapProfileRowToProfile({ id: 'pending-otp' }, email, false);
    }
  }

  async signUp(name: string, email: string, password?: string): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

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
      throw new Error(error.message || 'Unable to register candidate account with Supabase.');
    }

    if (!data.user) {
      throw new Error('Account created but user record was not returned.');
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
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase sign out error:', error.message);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app/settings` : undefined,
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
      throw new Error(error.message || `Failed to sign in with ${provider}.`);
    }
  }
}
