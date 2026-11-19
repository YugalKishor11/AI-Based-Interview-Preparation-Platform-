// Standard Edge Function execution wrapper
import { getCorsHeaders, handleCors } from './cors.ts';
import { formatErrorResponse } from './error.ts';
import { createRequestLogger } from './logger.ts';
import { FunctionContext } from './types.ts';

export function createEdgeFunction(
  functionName: string,
  handler: (req: Request, ctx: FunctionContext) => Promise<Response>
) {
  const edgeHandler = async (req: Request): Promise<Response> => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
    const startTime = Date.now();
    const logger = createRequestLogger(requestId, functionName);

    try {
      const response = await handler(req, {
        requestId,
        startTime,
        functionName,
      });

      const headers = new Headers(response.headers);
      const cors = getCorsHeaders(req);
      for (const [k, v] of Object.entries(cors)) {
        if (!headers.has(k)) headers.set(k, v);
      }
      headers.set('x-request-id', requestId);

      const durationMs = Date.now() - startTime;
      logger.info(`Request completed with status ${response.status} in ${durationMs}ms`);

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error(`Request failed in ${durationMs}ms: ${err instanceof Error ? err.message : String(err)}`);
      return formatErrorResponse(err, requestId, req);
    }
  };

  // If in Deno environment, register with Deno.serve
  // @ts-ignore: Deno global
  if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
    // @ts-ignore: Deno global
    Deno.serve(edgeHandler);
  }

  return edgeHandler;
}
