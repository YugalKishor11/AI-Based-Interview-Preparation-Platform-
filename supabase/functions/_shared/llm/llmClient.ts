// Multi-vendor LLM Client with schema-enforced JSON generation,
// retry backoff, token ledger recording (zero content logged), and spend cap kill switch.
import { z } from 'zod';
import { createSupabaseAdminClient, getEnv } from '../supabaseClient.ts';
import { AppError } from '../error.ts';
import { LLMUsage } from '../types.ts';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  systemPrompt?: string;
  userId?: string;
  functionName?: string;
}

export interface ModelPricing {
  inputPerMillion: number;  // in USD
  outputPerMillion: number; // in USD
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  'mock-deterministic': { inputPerMillion: 0, outputPerMillion: 0 },
};

export class LlmClient {
  private readonly provider: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor() {
    this.provider = getEnv('AI_PROVIDER', 'gemini').toLowerCase();
    this.model = getEnv('AI_MODEL', this.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');
    this.apiKey = getEnv('AI_API_KEY', getEnv('GEMINI_API_KEY', getEnv('OPENAI_API_KEY', '')));
  }

  public getModelName(): string {
    return this.model;
  }

  public getProviderName(): string {
    return this.provider;
  }

  private calculateCostCents(promptTokens: number, completionTokens: number, model: string): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-1.5-flash'];
    const inputCost = (promptTokens / 1_000_000) * pricing.inputPerMillion;
    const outputCost = (completionTokens / 1_000_000) * pricing.outputPerMillion;
    return Number(((inputCost + outputCost) * 100).toFixed(4));
  }

  private async checkSpendCap(userId?: string): Promise<void> {
    const globalKillSwitch = getEnv('GLOBAL_AI_KILL_SWITCH', 'false');
    if (globalKillSwitch === 'true') {
      throw new AppError('AI services temporarily halted by emergency kill switch.', 503, 'AI_KILL_SWITCH_ACTIVE');
    }

    if (!userId) return;

    try {
      const admin = createSupabaseAdminClient();
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const { data, error } = await admin
        .from('ai_usage_ledger')
        .select('cost_cents')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      if (!error && data) {
        const totalCents = data.reduce((sum, row) => sum + (Number(row.cost_cents) || 0), 0);
        // Per-user daily spend cap: 500 cents ($5.00)
        if (totalCents > 500) {
          throw new AppError('Daily AI usage cap exceeded for this account.', 429, 'USER_AI_SPEND_CAP_EXCEEDED');
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Allow fallback if DB connection fails
    }
  }

  private async recordUsage(
    usage: LLMUsage,
    functionName: string,
    userId?: string
  ): Promise<void> {
    try {
      const admin = createSupabaseAdminClient();
      // SECURITY NON-NEGOTIABLE: Zero prompt or completion content recorded
      await admin.from('ai_usage_ledger').insert({
        user_id: userId || null,
        function_name: functionName,
        provider: this.provider,
        model: this.model,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        total_tokens: usage.totalTokens,
        cost_cents: usage.costCents,
      });
    } catch (_err) {
      // Do not block execution if logging fails
    }
  }

  public async generateJson<T>(
    schema: z.ZodType<T>,
    prompt: string,
    opts: LLMOptions = {}
  ): Promise<{ data: T; usage: LLMUsage }> {
    const {
      temperature = 0.2, // Low temperature for high evaluation consistency
      maxRetries = 2,
      timeoutMs = 12000,
      systemPrompt = 'You are a senior technical interviewer and rigorous evaluator. Respond strictly in valid JSON matching the provided schema. Do not include markdown code fence formatting.',
      userId,
      functionName = 'unknown',
    } = opts;

    await this.checkSpendCap(userId);

    // If API key is not present or mock provider configured, return deterministic mock data matching schema
    if (!this.apiKey || this.provider === 'mock') {
      return this.generateMockResponse(schema, functionName, userId);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        let rawResponseText = '';
        let promptTokens = 0;
        let completionTokens = 0;

        if (this.provider === 'openai') {
          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.model,
              temperature,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
              ],
              response_format: { type: 'json_object' },
            }),
          });

          clearTimeout(timer);
          if (!resp.ok) {
            throw new Error(`OpenAI HTTP ${resp.status}: ${await resp.text()}`);
          }
          const json = await resp.json();
          rawResponseText = json.choices?.[0]?.message?.content || '{}';
          promptTokens = json.usage?.prompt_tokens || 100;
          completionTokens = json.usage?.completion_tokens || 100;
        } else {
          // Default: Gemini API
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
          const resp = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
              generationConfig: {
                temperature,
                responseMimeType: 'application/json',
              },
            }),
          });

          clearTimeout(timer);
          if (!resp.ok) {
            throw new Error(`Gemini HTTP ${resp.status}: ${await resp.text()}`);
          }
          const json = await resp.json();
          rawResponseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          promptTokens = json.usageMetadata?.promptTokenCount || 100;
          completionTokens = json.usageMetadata?.candidatesTokenCount || 100;
        }

        // Clean any residual code fences
        const cleanJsonStr = rawResponseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleanJsonStr);
        const validated = schema.parse(parsed);

        const totalTokens = promptTokens + completionTokens;
        const costCents = this.calculateCostCents(promptTokens, completionTokens, this.model);
        const usage: LLMUsage = { promptTokens, completionTokens, totalTokens, costCents };

        await this.recordUsage(usage, functionName, userId);
        return { data: validated, usage };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          // Exponential backoff: 500ms, 1000ms
          await new Promise((r) => setTimeout(r, (attempt + 1) * 500));
        }
      }
    }

    throw new AppError(
      `LLM generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      502,
      'LLM_PROVIDER_ERROR'
    );
  }

  // Deterministic mock generation when external provider is unavailable or in offline tests
  private generateMockResponse<T>(
    schema: z.ZodType<T>,
    functionName: string,
    userId?: string
  ): { data: T; usage: LLMUsage } {
    const usage: LLMUsage = {
      promptTokens: 120,
      completionTokens: 85,
      totalTokens: 205,
      costCents: 0.002,
    };

    // Construct mock payload according to schema
    const mockData = this.buildMockPayload(functionName);
    const validated = schema.parse(mockData);
    this.recordUsage(usage, functionName, userId).catch(() => {});
    return { data: validated, usage };
  }

  private buildMockPayload(functionName: string): unknown {
    switch (functionName) {
      case 'plan-interview':
        return {
          planId: 'plan-gen-mock-01',
          sessionId: 'sess-gen-mock-01',
          title: 'Senior Distributed Systems Architecture',
          questions: [
            {
              index: 0,
              category: 'Architecture & Partitioning',
              questionText: 'How would you design a globally distributed real-time chat sync engine capable of handling 50M concurrent connections?',
              coreConcepts: ['WebSockets', 'Geo-replication', 'CRDTs', 'Consensus'],
              anticipatedDepth: 'Deep-dive into conflict resolution and backpressure mechanisms.',
            },
            {
              index: 1,
              category: 'Storage & Failure Recovery',
              questionText: 'When a network partition isolates a regional cluster, what consensus protocol or state synchronization strategy would you apply to prevent split-brain?',
              coreConcepts: ['Raft/Paxos', 'Quorum reads/writes', 'Split-brain mitigation'],
              anticipatedDepth: 'Trade-offs between CP and AP in CAP theorem.',
            },
            {
              index: 2,
              category: 'Rate Limiting & Resilience',
              questionText: 'Design a distributed rate limiter that enforces strict per-tenant token buckets without causing cache hot-spotting.',
              coreConcepts: ['Redis sliding window', 'Token bucket', 'Distributed locking'],
              anticipatedDepth: 'Batching tokens and handling Redis node failures.',
            },
          ],
          estimatedCredits: 15,
        };

      case 'next-turn':
        return {
          action: 'probe_deeper',
          spokenText: 'That touches on the storage layer, but how would you guarantee message ordering across asynchronous multi-region writes?',
          reason: 'Candidate provided high-level overview; probing for edge cases and ordering guarantees.',
          nextQuestionIndex: 0,
          timeRemainingSeconds: 1500,
        };

      case 'evaluate-answer':
        return {
          questionIndex: 0,
          rubricScores: [
            {
              dimension: 'Technical Architecture',
              score: 4.5,
              max: 5,
              confidence: 'High',
              quote: 'we partitioned the message bus using a consistent hashing ring on conversation ID',
              why: 'Accurately recognized horizontal scaling and partition key distribution across nodes.',
              missingPoints: 'Did not address virtual node rebalancing during cluster scale-up.',
              suggestion: 'Detail bounded load consistent hashing or virtual nodes.',
              isDemo: true,
            },
            {
              dimension: 'Communication & Structure',
              score: 4.2,
              max: 5,
              confidence: 'High',
              quote: 'first I will define the non-functional SLAs, then design the data pipeline',
              why: 'Exemplary top-down structure and crisp technical vocabulary.',
              suggestion: 'Keep pause intervals between sections slightly shorter.',
              isDemo: true,
            },
          ],
          strengths: [
            'Immediate framing of latency and consistency bounds before proposing storage engines.',
            'Direct verbatim reference to partition keying and replication topology.',
          ],
          gaps: [
            'Briefly overlooked backpressure signaling when subscriber clients disconnect unexpectedly.',
          ],
          modelAnswer: 'A staff-level answer establishes WebSocket edge gateways with Envoy, Redis Streams / Kafka partitioned by channel ID, and Vector Clocks for cross-region causality.',
          quoteVerified: true,
        };

      case 'parse-resume':
        return {
          sanitizedSummary: 'Senior Systems Engineer with 8+ years experience designing high-throughput distributed microservices in Go, Rust, and TypeScript.',
          keyTechnologies: ['Distributed Systems', 'Go', 'Kubernetes', 'PostgreSQL', 'Kafka', 'Redis'],
          notableProjects: ['Global Event Bus processing 100k msg/sec', 'Zero-downtime database migration tool'],
          suggestedFocusAreas: ['Distributed Transactions', 'Fault Tolerance', 'System Observability'],
        };

      default:
        return {};
    }
  }
}
