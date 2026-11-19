// Supabase client factory for Edge Functions
// Provides scoped user client (RLS enforced) and admin client (service-role only)
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export function getEnv(key: string, defaultValue = ''): string {
  // @ts-ignore: Deno global
  if (typeof Deno !== 'undefined' && Deno?.env?.get) {
    // @ts-ignore: Deno global
    return Deno.env.get(key) ?? defaultValue;
  }
  return typeof process !== 'undefined' && process.env?.[key] ? process.env[key]! : defaultValue;
}

export function createSupabaseUserClient(authHeader: string): SupabaseClient {
  const supabaseUrl = getEnv('SUPABASE_URL', 'http://127.0.0.1:54321');
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', '');

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getEnv('SUPABASE_URL', 'http://127.0.0.1:54321');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY', '');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
