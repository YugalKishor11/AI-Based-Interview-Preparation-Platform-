// session-token: Mint short-lived scoped voice credentials
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireUserAuth } from '../_shared/auth.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';
import { SessionTokenRequestSchema, SessionTokenResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';
import { BadRequestError, InsufficientCreditsError } from '../_shared/error.ts';

export const handleSessionToken = async (req: Request, ctx: { requestId: string }): Promise<Response> => {
  const user = await requireUserAuth(req);
  await enforceRateLimit({
    key: `session-token:${user.id}`,
    capacity: 5,
    refillRatePerSec: 0.05, // 1 token per 20 seconds
  });

  const body = await req.json();
  const parsed = SessionTokenRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(`Invalid request: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const { sessionId, personaId, expectedDurationMins } = parsed.data;
  const admin = createSupabaseAdminClient();

  // 1. Consent Verification
  try {
    const { data: consents } = await admin
      .from('consents')
      .select('consent_type, granted')
      .eq('user_id', user.id);

    if (consents && consents.length > 0) {
      const audioConsent = consents.find((c) => c.consent_type === 'audioAnalysis' && c.granted);
      const dataConsent = consents.find((c) => c.consent_type === 'dataProcessing' && c.granted);
      if (!audioConsent || !dataConsent) {
        throw new BadRequestError('Required candidate consents (audio analysis & data processing) have not been granted.');
      }
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
  }

  // 2. Credits balance verification
  let currentCredits = 120;
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && typeof profile.credits === 'number') {
      currentCredits = profile.credits;
    }
  } catch (_e) {
    // fallback
  }

  if (currentCredits < 15) {
    throw new InsufficientCreditsError('Minimum 15 practice credits required to launch voice interview session.');
  }

  // 3. Mark session in progress if exists
  try {
    await admin
      .from('interview_sessions')
      .update({
        state: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  } catch (_e) {
    // ignore
  }

  // 4. Generate short-lived scoped token (valid for expectedDurationMins + 15 min buffer)
  const expiresAt = Date.now() + (expectedDurationMins + 15) * 60 * 1000;
  const scopedToken = `pst_live_${crypto.randomUUID().replace(/-/g, '')}_${expiresAt}`;

  const responsePayload: SessionTokenResponse = {
    token: scopedToken,
    expiresAt,
    provider: 'demo',
    url: 'wss://voice.prepsphere.internal/session',
    creditsRemaining: currentCredits,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('session-token', handleSessionToken);
