// next-turn: P3 Follow-up and turn progression decision engine
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireUserAuth } from '../_shared/auth.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';
import { NextTurnRequestSchema, NextTurnResponseSchema, NextTurnResponse } from '../_shared/contracts/index.ts';
import { LlmClient } from '../_shared/llm/llmClient.ts';
import { BadRequestError } from '../_shared/error.ts';

export const handleNextTurn = async (req: Request, ctx: { requestId: string }): Promise<Response> => {
  const user = await requireUserAuth(req);

  await enforceRateLimit({
    key: `next-turn:${user.id}`,
    capacity: 20,
    refillRatePerSec: 0.5,
  });

  const body = await req.json();
  const parsed = NextTurnRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(`Invalid turn request: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const {
    sessionId,
    currentQuestionIndex,
    elapsedSeconds,
    totalDurationSeconds,
    lastCandidateAnswer,
    dialogueHistory,
  } = parsed.data;

  const timeRemainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  // Time guard: If less than 90 seconds remain, gracefully conclude the session
  if (timeRemainingSeconds < 90) {
    const wrapUpResponse: NextTurnResponse = {
      action: 'conclude_session',
      spokenText: 'Thank you for walking me through your architecture and reasoning. We are at time for today, and I have gathered plenty of signal. Let us wrap up here so you can review your feedback report.',
      reason: 'Session allocated duration reached threshold; concluding interview gracefully.',
      nextQuestionIndex: currentQuestionIndex,
      timeRemainingSeconds,
    };
    return new Response(JSON.stringify(wrapUpResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prompt = `
You are the voice interviewer conducting a high-stakes technical session.
Current Question Index: ${currentQuestionIndex}
Time Remaining: ${Math.floor(timeRemainingSeconds / 60)} minutes (${timeRemainingSeconds} seconds).
Candidate's Latest Spoken Answer: "${lastCandidateAnswer}"

Evaluate whether to:
1. 'probe_deeper': If candidate mentioned a concept but skipped trade-offs, failure modes, or specific numbers.
2. 'advance_question': If the candidate delivered a solid, comprehensive answer.
3. 'pivot_topic': If the candidate is stuck and needs guidance.
4. 'conclude_session': If all questions are finished or time is up.

Produce a natural, spoken interviewer response (1-2 crisp sentences, no bullet points, no markdown formatting).
`;

  const llm = new LlmClient();
  const { data: turnDecision } = await llm.generateJson(NextTurnResponseSchema, prompt, {
    functionName: 'next-turn',
    userId: user.id,
    temperature: 0.2,
  });

  const finalResponse: NextTurnResponse = {
    ...turnDecision,
    timeRemainingSeconds,
  };

  return new Response(JSON.stringify(finalResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('next-turn', handleNextTurn);
