// Shared types for Supabase Edge Functions
import { z } from 'zod';
import { ErrorEnvelope } from './contracts/index.ts';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export interface FunctionContext {
  requestId: string;
  user?: AuthUser;
  startTime: number;
  functionName: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds?: number;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
}
