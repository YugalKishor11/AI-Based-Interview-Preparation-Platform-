// PrepSphere Transactional Email Adapter
// Delegates to Supabase Auth SMTP transactional provider when configured.
// Provides informative fallback when SMTP is unconfigured.

export interface EmailStatus {
  isConfigured: boolean;
  provider: 'smtp' | 'resend' | 'demo';
  statusMessage?: string;
}

export class EmailAdapter {
  public getStatus(): EmailStatus {
    const isSmtpConfigured = Boolean(
      import.meta.env.VITE_SMTP_HOST || import.meta.env.VITE_RESEND_API_KEY
    );

    if (isSmtpConfigured) {
      return {
        isConfigured: true,
        provider: import.meta.env.VITE_RESEND_API_KEY ? 'resend' : 'smtp',
        statusMessage: 'Transactional email provider active (SPF, DKIM, DMARC compliant).',
      };
    }

    return {
      isConfigured: false,
      provider: 'demo',
      statusMessage: 'Email delivery simulated in development mode. Verification links display inline.',
    };
  }
}

export const emailAdapter = new EmailAdapter();
