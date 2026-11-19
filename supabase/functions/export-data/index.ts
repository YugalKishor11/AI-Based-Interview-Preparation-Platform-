// export-data: Comprehensive GDPR-compliant JSON data export
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireUserAuth } from '../_shared/auth.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';
import { ExportDataRequestSchema, ExportDataResponseSchema, ExportDataResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';

export const handleExportData = async (req: Request): Promise<Response> => {
  const user = await requireUserAuth(req);

  // Rate limit: max 2 exports per day per user
  await enforceRateLimit({
    key: `export-data:${user.id}`,
    capacity: 2,
    refillRatePerSec: 2 / 86400,
  });

  const body = await req.json().catch(() => ({}));
  const parsed = ExportDataRequestSchema.safeParse(body);
  const format = parsed.success ? parsed.data.format : 'json';

  const admin = createSupabaseAdminClient();
  const [
    profileRes,
    sessionsRes,
    reportsRes,
    drillPlansRes,
    consentsRes,
    creditsRes,
  ] = await Promise.allSettled([
    admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    admin.from('interview_sessions').select('*').eq('user_id', user.id),
    admin.from('reports').select('*').eq('user_id', user.id),
    admin.from('drill_plans').select('*').eq('user_id', user.id),
    admin.from('consents').select('*').eq('user_id', user.id),
    admin.from('usage_credits').select('*').eq('user_id', user.id),
  ]);

  const candidateData = {
    exportedAt: new Date().toISOString(),
    format,
    profile: profileRes.status === 'fulfilled' ? profileRes.value.data : null,
    sessions: sessionsRes.status === 'fulfilled' ? sessionsRes.value.data : [],
    reports: reportsRes.status === 'fulfilled' ? reportsRes.value.data : [],
    drillPlans: drillPlansRes.status === 'fulfilled' ? drillPlansRes.value.data : [],
    consents: consentsRes.status === 'fulfilled' ? consentsRes.value.data : [],
    creditTransactions: creditsRes.status === 'fulfilled' ? creditsRes.value.data : [],
  };

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const responsePayload: ExportDataResponse = {
    payload: candidateData,
    expiresAt,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('export-data', handleExportData);
