import { z } from 'zod';
import { getEnv } from '../supabaseClient.ts';

export const GeminiTurnDecisionSchema = z.object({
  decision: z.enum(['followup', 'next', 'wrap_up']),
  spoken_text: z.string(),
  reason_code: z.string(),
  referenced_phrase: z.string().default(''),
});
export type GeminiTurnDecision = z.infer<typeof GeminiTurnDecisionSchema>;

export interface GeminiLlmOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export class GeminiLlmClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetchFn: typeof fetch;

  constructor(customModel?: string, customApiKey?: string, customFetch?: typeof fetch) {
    // Secret name GEMINI_API_KEY, server-side only
    this.apiKey = customApiKey !== undefined ? customApiKey : getEnv('GEMINI_API_KEY', getEnv('AI_API_KEY', ''));
    this.model = customModel || getEnv('GEMINI_MODEL', getEnv('AI_MODEL', 'gemini-3.8-flash'));
    this.fetchFn = customFetch || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : (fetch as any));
  }

  public getModelName(): string {
    return this.model;
  }

  public async generateJson<T>(
    schema: z.ZodType<T>,
    prompt: string,
    opts: GeminiLlmOptions = {}
  ): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }> {
    const {
      systemInstruction = 'You are a Virtual AI Interviewer conducting a realistic technical interview. Respond strictly with valid JSON conforming to the requested schema. Do not output markdown code fences or conversational pleasantries outside the JSON.',
      temperature = 0.2,
      timeoutMs = 12000,
    } = opts;

    // In offline test environments or when no API key is provided, return deterministic mock matching schema
    if (!this.apiKey || this.apiKey === 'placeholder-key' || this.apiKey === 'mock') {
      return this.generateFallbackMock(schema);
    }

    // Exactly one retry on invalid JSON schema
    const maxAttempts = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => {
          try {
            controller.abort();
          } catch {
            // ignore
          }
        }, timeoutMs);

        const currentPrompt = attempt === 1
          ? prompt
          : `${prompt}\n\nIMPORTANT: Your previous output was not valid JSON conforming to the schema. Output ONLY raw JSON matching the schema, with no markdown code blocks or additional text.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await this.fetchFn(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: currentPrompt }],
              },
            ],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timer);

        if (!response.ok) {
          throw new Error(`Gemini API HTTP ${response.status}: ${await response.text()}`);
        }

        const json = await response.json();
        const parts = json.candidates?.[0]?.content?.parts || [];
        const rawText = parts.find((p: { text?: string; thought?: boolean }) => Boolean(p.text && !p.thought))?.text || parts[0]?.text || '{}';

        // Clean any accidental markdown code fences
        const cleanJsonStr = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();

        const parsedJson = JSON.parse(cleanJsonStr);
        const validated = schema.parse(parsedJson);

        const usage = {
          promptTokens: json.usageMetadata?.promptTokenCount || 150,
          completionTokens: json.usageMetadata?.candidatesTokenCount || 50,
        };

        return { data: validated, usage };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Retry exactly once on invalid JSON / parse failure
      }
    }

    throw new Error(`Gemini structured JSON generation failed after 2 attempts: ${lastError?.message}`);
  }

  private generateFallbackMock<T>(schema: z.ZodType<T>): { data: T } {
    // Provide deterministic structured data based on schema structure
    const fallbackData: Record<string, unknown> = {
      decision: 'followup',
      spoken_text: 'That is a solid foundation on partitioning. How does your cluster handle replica synchronization when network partitions occur?',
      reason_code: 'PROBE_CONSISTENCY_TRADEOFF',
      referenced_phrase: 'partitioning',
    };

    try {
      const validated = schema.parse(fallbackData);
      return { data: validated };
    } catch {
      // In case another schema was requested
      const emptyMock = {} as T;
      return { data: emptyMock };
    }
  }
}
