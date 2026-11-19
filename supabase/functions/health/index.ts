// health: Liveness and dependency health check
// Zero secrets in output
import { createEdgeFunction } from '../_shared/handler.ts';
import { HealthResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';

export const handleHealth = async (_req: Request): Promise<Response> => {
  let dbStatus: 'connected' | 'degraded' | 'error' = 'connected';

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('interviewer_personas').select('id').limit(1);
    if (error) {
      dbStatus = 'degraded';
    }
  } catch (_e) {
    dbStatus = 'degraded';
  }

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStatus,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('health', handleHealth);
