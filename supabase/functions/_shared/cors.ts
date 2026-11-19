// CORS middleware with environment-aware origin validation
import { securityHeaders } from './securityHeaders.ts';

function getEnv(key: string, defaultValue = ''): string {
  // @ts-ignore: Deno global
  if (typeof Deno !== 'undefined' && Deno?.env?.get) {
    // @ts-ignore: Deno global
    return Deno.env.get(key) ?? defaultValue;
  }
  return typeof process !== 'undefined' && process.env?.[key] ? process.env[key]! : defaultValue;
}

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') ?? '';
  const environment = getEnv('ENVIRONMENT', 'development');
  const allowedOriginsStr = getEnv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:4173');
  const allowedOrigins = allowedOriginsStr.split(',').map((o) => o.trim()).filter(Boolean);

  let allowOrigin = '*';

  if (environment === 'production') {
    // Strict origin validation in production (never allow wildcard)
    if (origin && allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (allowedOrigins.length > 0) {
      allowOrigin = allowedOrigins[0];
    } else {
      allowOrigin = 'null';
    }
  } else {
    // In dev / preview, allow requesting origin if provided, otherwise wildcard
    allowOrigin = origin || '*';
  }

  return {
    ...securityHeaders,
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, Idempotency-Key, x-request-id',
    'Access-Control-Expose-Headers': 'x-request-id, Retry-After',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: getCorsHeaders(req),
    });
  }
  return null;
}
