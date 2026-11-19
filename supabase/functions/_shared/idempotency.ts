// Idempotency middleware for create and report mutations
import { createSupabaseAdminClient } from './supabaseClient.ts';
import { getCorsHeaders } from './cors.ts';

const localIdempotencyCache = new Map<string, { userId: string; status: number; body: unknown; expiresAt: number }>();

export interface IdempotencyCheckResult {
  isCached: boolean;
  response?: Response;
}

export async function checkIdempotency(
  key: string | null,
  userId: string,
  requestId: string,
  req?: Request
): Promise<IdempotencyCheckResult> {
  if (!key) {
    return { isCached: false };
  }

  const now = Date.now();

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('idempotency_keys')
      .select('response_status, response_body, expires_at')
      .eq('key', key)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data && new Date(data.expires_at).getTime() > now) {
      const headers = {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        'Idempotent-Replay': 'true',
      };
      return {
        isCached: true,
        response: new Response(JSON.stringify(data.response_body), {
          status: data.response_status,
          headers,
        }),
      };
    }
  } catch (_err) {
    // Fallback to local memory cache
    const cached = localIdempotencyCache.get(key);
    if (cached && cached.userId === userId && cached.expiresAt > now) {
      const headers = {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        'Idempotent-Replay': 'true',
      };
      return {
        isCached: true,
        response: new Response(JSON.stringify(cached.body), {
          status: cached.status,
          headers,
        }),
      };
    }
  }

  return { isCached: false };
}

export async function saveIdempotencyRecord(
  key: string | null,
  userId: string,
  status: number,
  body: unknown
): Promise<void> {
  if (!key) return;

  const now = Date.now();
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();

  try {
    const admin = createSupabaseAdminClient();
    await admin.from('idempotency_keys').upsert({
      key,
      user_id: userId,
      response_status: status,
      response_body: body,
      expires_at: expiresAt,
    });
  } catch (_err) {
    localIdempotencyCache.set(key, {
      userId,
      status,
      body,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });
  }
}
