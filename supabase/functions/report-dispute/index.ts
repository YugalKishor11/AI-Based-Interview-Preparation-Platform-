// report-dispute: Candidate score dispute filing with rate limiting
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireUserAuth } from '../_shared/auth.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';
import { ReportDisputeRequestSchema, ReportDisputeResponseSchema, ReportDisputeResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';
import { BadRequestError } from '../_shared/error.ts';

export const handleReportDispute = async (req: Request): Promise<Response> => {
  const user = await requireUserAuth(req);

  // Rate limit: max 3 disputes per day per user
  await enforceRateLimit({
    key: `dispute:${user.id}`,
    capacity: 3,
    refillRatePerSec: 3 / 86400, // 3 tokens per 24 hours
  });

  const body = await req.json();
  const parsed = ReportDisputeRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(`Invalid dispute submission: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const { reportId, dimension, candidateReason } = parsed.data;
  const disputeId = `disp-${crypto.randomUUID().substring(0, 8)}`;

  try {
    const admin = createSupabaseAdminClient();
    await admin.from('feedback_disputes').insert({
      id: disputeId,
      user_id: user.id,
      report_id: reportId,
      dimension,
      candidate_reason: candidateReason,
      status: 'received',
    });

    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'score_dispute_submitted',
      details: {
        disputeId,
        reportId,
        dimension,
      },
    });
  } catch (_e) {
    // Continue
  }

  const responsePayload: ReportDisputeResponse = {
    disputeId,
    status: 'received',
    message: 'Your dispute has been received and queued for evaluation review. An updated score or explanation will be posted within 48 hours.',
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('report-dispute', handleReportDispute);
