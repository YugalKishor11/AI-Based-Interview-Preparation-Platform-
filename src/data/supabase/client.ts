import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'prepsphere_supabase_url';
const STORAGE_KEY_ANON = 'prepsphere_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // Check localStorage overrides first, then environment variables
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = (localUrl !== null ? localUrl : (import.meta.env.VITE_SUPABASE_URL || '')).trim();
  const anonKey = (localAnon !== null ? localAnon : (import.meta.env.VITE_SUPABASE_ANON_KEY || '')).trim();

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return false;
  if (url === 'https://your-project.supabase.co' || anonKey === 'your-anon-key-here') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function setCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  }
}

const { url, anonKey } = getSupabaseCredentials();

// Initialize the Supabase client safely
export const supabase: SupabaseClient = createClient(
  url && isSupabaseConfigured() ? url : 'https://placeholder.supabase.co',
  anonKey && isSupabaseConfigured() ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);
