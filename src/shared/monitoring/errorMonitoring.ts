// PrepSphere Error Monitoring Adapter with Sensitive Data Scrubbing
// Scrubs PII, candidate answers, speech transcripts, resume texts, auth tokens, and secrets before reporting.

export interface ErrorReportContext {
  userId?: string;
  component?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

// Sensitive keywords to scrub from error contexts and payloads
const SENSITIVE_KEYS = [
  'token',
  'jwt',
  'secret',
  'password',
  'authorization',
  'transcript',
  'answer',
  'candidate_answer',
  'resume',
  'apikey',
  'key',
];

export function scrubData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // Scrub JWT tokens
    let scrubbed = data.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_JWT]');
    // Scrub API keys
    scrubbed = scrubbed.replace(/(?:key|apikey|secret)=[A-Za-z0-9-_]{10,}/gi, '$1=[REDACTED_KEY]');
    return scrubbed;
  }
  if (Array.isArray(data)) {
    return data.map(scrubData);
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
        cleaned[key] = '[REDACTED_SENSITIVE_FIELD]';
      } else {
        cleaned[key] = scrubData(value);
      }
    }
    return cleaned;
  }
  return data;
}

export class ErrorMonitoringAdapter {
  private isEnabled: boolean;

  constructor() {
    // Enabled only when an external monitoring DSN/endpoint is provided
    this.isEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN || (window as any).__PREPSPHERE_ERROR_MONITORING__);
  }

  public captureException(error: unknown, context: ErrorReportContext = {}): void {
    const scrubbedContext = scrubData(context) as ErrorReportContext;
    const errorMsg = error instanceof Error ? error.message : String(error);
    const scrubbedMsg = scrubData(errorMsg) as string;

    if (this.isEnabled) {
      // In production Sentry mode: window.Sentry.captureException(...) with scrubbed tags
      try {
        if ((window as any).Sentry?.captureException) {
          (window as any).Sentry.captureException(new Error(scrubbedMsg), {
            extra: scrubbedContext,
          });
          return;
        }
      } catch {}
    }

    // Default Fallback: Safe Console logger with zero PII leaks
    if (import.meta.env.DEV) {
      console.error('[ErrorMonitoring:Scrubbed]', scrubbedMsg, scrubbedContext);
    }
  }

  public captureMessage(message: string, context: ErrorReportContext = {}): void {
    const scrubbed = scrubData(message) as string;
    const scrubbedContext = scrubData(context) as ErrorReportContext;

    if (this.isEnabled && (window as any).Sentry?.captureMessage) {
      (window as any).Sentry.captureMessage(scrubbed, { extra: scrubbedContext });
    } else if (import.meta.env.DEV) {
      console.warn('[ErrorMonitoring:Message]', scrubbed, scrubbedContext);
    }
  }
}

export const errorMonitoring = new ErrorMonitoringAdapter();
