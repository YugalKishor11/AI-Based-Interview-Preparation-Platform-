// PrepSphere Billing Provider Interface & Stub
// Out of scope for v1: preserves credits ledger and provides interface stub with "Coming Soon" fallback.

export interface BillingPlan {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  interval?: 'one_time' | 'month';
}

export interface CheckoutSessionResult {
  url?: string;
  comingSoon: boolean;
  message: string;
}

export interface BillingProvider {
  getAvailablePlans(): Promise<BillingPlan[]>;
  createCheckoutSession(planId: string): Promise<CheckoutSessionResult>;
  getCustomerPortalUrl?(): Promise<string>;
}

export class StubBillingProvider implements BillingProvider {
  async getAvailablePlans(): Promise<BillingPlan[]> {
    return [
      { id: 'starter', name: 'Starter Pack', credits: 150, priceUsd: 15, interval: 'one_time' },
      { id: 'pro', name: 'Pro Interviewer', credits: 500, priceUsd: 39, interval: 'one_time' },
      { id: 'unlimited', name: 'Staff Calibration Pass', credits: 1500, priceUsd: 89, interval: 'one_time' },
    ];
  }

  async createCheckoutSession(planId: string): Promise<CheckoutSessionResult> {
    return {
      comingSoon: true,
      message: `Direct payments for plan "${planId}" will launch in v2. Practice credits are automatically replenished during the demo trial period.`,
    };
  }

  async getCustomerPortalUrl(): Promise<string> {
    return '/app/credits';
  }
}

export const billingProvider: BillingProvider = new StubBillingProvider();
