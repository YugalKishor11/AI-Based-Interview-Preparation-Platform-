import { z } from 'zod';
import { supabase, isSupabaseConfigured, getSupabaseCredentials } from './client';
import { mapError, AppUiError, UnifiedAppError } from '../errors';

export interface CallFnOptions {
  idempotencyKey?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface CallFnResult<T> {
  data: T;
  requestId: string;
  retryAfter?: number;
  cached?: boolean;
}

/**
 * Universal client wrapper for Supabase Edge Functions.
 * Enforces:
 * 1. Automatic JWT attachment
 * 2. Strict request ID & Idempotency-Key headers
 * 3. Zod schema validation for all returned data (never trust the wire)
 * 4. Transparent Retry-After extraction and uniform error mapping
 */
export async function callFn<TReq, TRes>(
  functionName: string,
  payload: TReq,
  responseSchema: z.ZodType<TRes>,
  options: CallFnOptions = {}
): Promise<CallFnResult<TRes>> {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const idempotencyKey = options.idempotencyKey || `${functionName}:${requestId}`;
  const timeoutMs = options.timeoutMs || 25000;

  // 1. Retrieve session JWT if authenticated
  let token: string | undefined;
  if (isSupabaseConfigured()) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch {}
  }

  const { url, anonKey } = getSupabaseCredentials();
  const functionUrl = `${url}/functions/v1/${functionName}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-request-id': requestId,
    'Idempotency-Key': idempotencyKey,
    apikey: anonKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, timeoutMs);

  try {
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    // Extract Retry-After if provided
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

    if (!res.ok) {
      let errorBody: any = null;
      try {
        errorBody = await res.json();
      } catch {}

      const mapped = mapError({
        status: res.status,
        code: errorBody?.error?.code,
        message: errorBody?.error?.message || `Edge Function ${functionName} returned HTTP ${res.status}`,
        retryAfter: errorBody?.error?.retryAfter || retryAfter,
      });

      throw new UnifiedAppError(mapped);
    }

    const rawJson = await res.json();

    // 2. Validate response with Zod: Never trust the wire!
    const validatedData = responseSchema.parse(rawJson);

    return {
      data: validatedData,
      requestId,
      retryAfter,
      cached: res.headers.get('x-idempotent-cached') === 'true',
    };
  } catch (err: unknown) {
    clearTimeout(timeoutTimer);
    if (err instanceof UnifiedAppError) throw err;
    const mapped = mapError(err);
    throw new UnifiedAppError(mapped);
  }
}
