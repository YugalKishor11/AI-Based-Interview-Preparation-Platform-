// Token bucket rate limiter with Retry-After calculation
import { createSupabaseAdminClient } from './supabaseClient.ts';
import { RateLimitError } from './error.ts';
import { RateLimitResult } from './types.ts';

// In-memory fallback bucket for local testing / offline execution
const localBuckets = new Map<string, { tokens: number; lastRefill: number }>();

export interface RateLimitConfig {
  key: string;
  capacity?: number; // max burst capacity
  refillRatePerSec?: number; // tokens replenished per second
  cost?: number; // tokens consumed per call
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const {
    key,
    capacity = 10,
    refillRatePerSec = 0.5, // 1 token every 2 seconds
    cost = 1,
  } = config;

  const now = Date.now();

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('rate_limits')
      .select('tokens, last_refill')
      .eq('key', key)
      .maybeSingle();

    if (!error && data) {
      const lastRefill = new Date(data.last_refill).getTime();
      const elapsedSec = Math.max(0, (now - lastRefill) / 1000);
      const currentTokens = Math.min(capacity, Number(data.tokens) + elapsedSec * refillRatePerSec);

      if (currentTokens >= cost) {
        const remaining = currentTokens - cost;
        await admin
          .from('rate_limits')
          .update({ tokens: remaining, last_refill: new Date(now).toISOString() })
          .eq('key', key);
        return { allowed: true, remainingTokens: Math.floor(remaining) };
      } else {
        const missing = cost - currentTokens;
        const retryAfterSeconds = Math.max(1, Math.ceil(missing / refillRatePerSec));
        return { allowed: false, remainingTokens: 0, retryAfterSeconds };
      }
    } else {
      // First request or row not found
      const remaining = capacity - cost;
      await admin.from('rate_limits').upsert({
        key,
        tokens: remaining,
        last_refill: new Date(now).toISOString(),
      });
      return { allowed: true, remainingTokens: Math.floor(remaining) };
    }
  } catch (_dbError) {
    // Graceful fallback to local in-memory token bucket if DB connection is unavailable
    let entry = localBuckets.get(key);
    if (!entry) {
      entry = { tokens: capacity, lastRefill: now };
      localBuckets.set(key, entry);
    }

    const elapsedSec = (now - entry.lastRefill) / 1000;
    const currentTokens = Math.min(capacity, entry.tokens + elapsedSec * refillRatePerSec);

    if (currentTokens >= cost) {
      entry.tokens = currentTokens - cost;
      entry.lastRefill = now;
      return { allowed: true, remainingTokens: Math.floor(entry.tokens) };
    } else {
      const missing = cost - currentTokens;
      const retryAfterSeconds = Math.max(1, Math.ceil(missing / refillRatePerSec));
      return { allowed: false, remainingTokens: 0, retryAfterSeconds };
    }
  }
}

export async function enforceRateLimit(config: RateLimitConfig): Promise<void> {
  const result = await checkRateLimit(config);
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds ?? 1);
  }
}
