import { z } from 'zod';

// PrepSphere Boot-time Environment Schema & Fast-Fail Validator
export const EnvSchema = z.object({
  VITE_DATA_SOURCE: z.enum(['mock', 'supabase']).default('mock'),
  VITE_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  VITE_SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  VITE_GEMINI_API_KEY: z.string().optional().or(z.literal('')),
  VITE_GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  VITE_SHOW_DEV: z.enum(['true', 'false']).default('false'),
  VITE_SENTRY_DSN: z.string().optional().or(z.literal('')),
  VITE_PLAUSIBLE_DOMAIN: z.string().optional().or(z.literal('')),
  VITE_CODE_SANDBOX_URL: z.string().optional().or(z.literal('')),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

let cachedEnv: ValidatedEnv | null = null;

export function validateEnv(): ValidatedEnv {
  if (cachedEnv) return cachedEnv;

  const rawEnv = {
    VITE_DATA_SOURCE: import.meta.env.VITE_DATA_SOURCE || 'mock',
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
    VITE_GEMINI_MODEL: import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash',
    VITE_SHOW_DEV: import.meta.env.VITE_SHOW_DEV || 'false',
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
    VITE_PLAUSIBLE_DOMAIN: import.meta.env.VITE_PLAUSIBLE_DOMAIN || '',
    VITE_CODE_SANDBOX_URL: import.meta.env.VITE_CODE_SANDBOX_URL || '',
  };

  const result = EnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(
      `%c[PrepSphere Environment Validation Error]%c\nInvalid client environment configuration:\n${errorMessages}`,
      'color: #ef4444; font-weight: bold; font-size: 14px;',
      'color: inherit;'
    );
    throw new Error(`Invalid environment configuration:\n${errorMessages}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
