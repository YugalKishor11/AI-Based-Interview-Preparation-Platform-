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
  signIn: (email: string, password?: string) => Promise<Profile>;
  signUp: (name: string, email: string, password?: string) => Promise<Profile>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isSupabase = dataSource === 'supabase' && isSupabaseConfigured();

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

  const signOut = async (): Promise<void> => {
    await authRepo.signOut();
    setUser(null);
    setSession(null);
    if (isSupabase) {
      setProfile(null);
    } else {
      // In demo mode, reset to seed
      await refreshProfile();
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authRepo.resetPassword(email);
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
        signIn,
        signUp,
        signInWithOAuth,
        signOut,
        resetPassword,
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
