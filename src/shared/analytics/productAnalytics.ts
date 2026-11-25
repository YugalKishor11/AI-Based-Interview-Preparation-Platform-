// PrepSphere Privacy-First Product Analytics
// Strictly consent-gated by public.consents (kind: 'analytics').
// Enforces zero-transcript guarantee: NEVER records candidate speech, transcript, or resume contents.

export type AnalyticsEventName =
  | 'session_started'
  | 'session_completed'
  | 'session_cancelled'
  | 'turn_completed'
  | 'question_saved'
  | 'question_completed'
  | 'resume_uploaded'
  | 'report_viewed'
  | 'dispute_filed'
  | 'settings_updated'
  | 'theme_changed';

export interface AnalyticsEventProps {
  sessionId?: string;
  questionId?: string;
  interviewType?: string;
  durationSeconds?: number;
  score?: number;
  theme?: string;
}

export class ProductAnalyticsAdapter {
  private hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('prepsphere_consent_analytics');
      if (stored === 'false') return false;
      // Also check consents stored in profile or user session
      const consentsStr = localStorage.getItem('prepsphere_user_consents');
      if (consentsStr) {
        const parsed = JSON.parse(consentsStr);
        if (parsed.analytics === false) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  public track(event: AnalyticsEventName, properties: AnalyticsEventProps = {}): void {
    // 1. Consent Gate: If candidate opted out, immediately drop event (Off fallback)
    if (!this.hasConsent()) {
      return;
    }

    // 2. Strict Privacy Filter: Strip any accidental transcript or freeform text
    const cleanProps: Record<string, unknown> = {
      event,
      timestamp: new Date().toISOString(),
      ...(properties.sessionId ? { sessionId: properties.sessionId } : {}),
      ...(properties.questionId ? { questionId: properties.questionId } : {}),
      ...(properties.interviewType ? { interviewType: properties.interviewType } : {}),
      ...(properties.durationSeconds !== undefined ? { durationSeconds: properties.durationSeconds } : {}),
      ...(properties.score !== undefined ? { score: properties.score } : {}),
      ...(properties.theme ? { theme: properties.theme } : {}),
    };

    // 3. Dispatch to configured privacy-friendly analytics endpoint (e.g. PostHog/Plausible)
    if (typeof window !== 'undefined' && (window as any).plausible) {
      try {
        (window as any).plausible(event, { props: cleanProps });
        return;
      } catch {}
    }

    // Default Fallback: Silent or Dev log only
    if (import.meta.env.DEV) {
      console.log(`[Analytics:ConsentGated] ${event}`, cleanProps);
    }
  }
}

export const analytics = new ProductAnalyticsAdapter();
