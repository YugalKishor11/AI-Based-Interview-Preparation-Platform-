import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session as SupabaseSession } from '@supabase/supabase-js';
import { authRepo, profileRepo, isSupabaseConfigured, dataSource, supabase } from '../../data';
import { Profile } from '../../data/contracts';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  isSupabase: boolean;
  loading: boolean;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  signIn: (email: string, password?: string) => Promise<Profile>;
  signUp: (name: string, email: string, password?: string) => Promise<Profile>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  recordConsent: (kind: 'terms' | 'privacy' | 'recording' | 'resume_processing' | 'analytics', granted: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isSupabase = dataSource === 'supabase' && isSupabaseConfigured();

  const dismissSessionExpired = () => setSessionExpired(false);

  const refreshProfile = useCallback(async () => {
    try {
      if (isSupabase) {
        const p = await authRepo.getUser();
        setProfile(p);
      } else {
        const p = await profileRepo.get();
        setProfile(p);
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  }, [isSupabase]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setLoading(true);
      if (isSupabase) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
              const p = await authRepo.getUser();
              if (mounted) setProfile(p);
            }
          }
        } catch (err) {
          console.warn('Supabase auth initialization error:', err);
        }
      } else {
        try {
          const p = await profileRepo.get();
          if (mounted) {
            setProfile(p);
          }
        } catch (err) {
          console.warn('Mock profile load error:', err);
        }
      }
      if (mounted) setLoading(false);
    }

    initAuth();

    if (isSupabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const p = await authRepo.getUser();
          if (mounted) setProfile(p);
        } else {
          setProfile(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isSupabase]);

  const signIn = async (email: string, password?: string): Promise<Profile> => {
    const res = await authRepo.signIn(email, password);
    await refreshProfile();
    return res;
  };

  const signUp = async (name: string, email: string, password?: string): Promise<Profile> => {
    const res = await authRepo.signUp(name, email, password);
    await refreshProfile();
    return res;
  };

  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<void> => {
    if (authRepo.signInWithOAuth) {
      await authRepo.signInWithOAuth(provider);
    } else {
      throw new Error(`OAuth login for ${provider} is not supported in current mode.`);
    }
  };

  const signOut = async (options?: { scope?: 'global' | 'local' | 'others' }): Promise<void> => {
    await authRepo.signOut(options);
    if (!options || options.scope !== 'others') {
      setUser(null);
      setSession(null);
      if (isSupabase) {
        setProfile(null);
      } else {
        await refreshProfile();
      }
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authRepo.resetPassword(email);
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (authRepo.updatePassword) {
      await authRepo.updatePassword(newPassword);
    }
  };

  const updateEmail = async (newEmail: string): Promise<void> => {
    if (authRepo.updateEmail) {
      await authRepo.updateEmail(newEmail);
      await refreshProfile();
    }
  };

  const deleteAccount = async (confirmation: string): Promise<void> => {
    if (authRepo.deleteAccount) {
      await authRepo.deleteAccount(confirmation);
      await signOut();
    }
  };

  const recordConsent = async (
    kind: 'terms' | 'privacy' | 'recording' | 'resume_processing' | 'analytics',
    granted: boolean
  ): Promise<void> => {
    if (authRepo.recordConsent) {
      await authRepo.recordConsent(kind, granted);
    }
  };

  const isAuthenticated = isSupabase ? !!user : !!profile;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated,
        isSupabase,
        loading,
        sessionExpired,
        dismissSessionExpired,
        signIn,
        signUp,
        signInWithOAuth,
        signOut,
        resetPassword,
        updatePassword,
        updateEmail,
        deleteAccount,
        recordConsent,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
