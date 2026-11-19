import React from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { CreditCard, Sparkles, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { store } from '../../data/mock';

export const CreditsPage: React.FC = () => {
  const credits = store.profile.credits;

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-4xl mx-auto text-left">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="demo">Demo Tier</Badge>
          <span className="text-xs text-txt-muted">Simulation usage & credit allocation</span>
        </div>
        <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
          Credits & Allocation
        </h1>
        <p className="text-xs text-txt-2 mt-1">
          PrepSphere operates on transparent session credits. No subscriptions or hidden rebilling.
        </p>
      </div>

      {/* Credit Balance Meter Card */}
      <GlassCard tier="gcard" className="p-8 border border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Current Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-head font-extrabold text-emerald-400 tabular-nums">
                {credits}
              </span>
              <span className="text-sm font-semibold text-txt-muted">Credits</span>
            </div>
            <p className="text-xs text-txt-2">
              Enough for approximately <strong>8 complete mock interviews</strong> with full audio analysis.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="primary" disabled disabledReason="Payment billing is disabled during Phase A frontend demonstration">
              Add Credits (Coming Soon)
            </Button>
            <span className="text-[10px] text-txt-muted text-center">
              Complimentary demo replenishment active
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Cost Breakdown Reference */}
      <div className="space-y-4">
        <h3 className="font-head font-bold text-sm text-txt uppercase tracking-wider">
          Standard Credit Consumption Model
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-border/20 space-y-1">
            <span className="text-xs font-bold text-txt">Quick Verbal Drill (10m)</span>
            <div className="text-lg font-mono font-bold text-primary">5 Credits</div>
            <p className="text-[11px] text-txt-muted">1 question + instant rubric feedback</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border/20 space-y-1">
            <span className="text-xs font-bold text-txt">Standard Technical (30m)</span>
            <div className="text-lg font-mono font-bold text-primary">12 Credits</div>
            <p className="text-[11px] text-txt-muted">3-5 questions + follow-ups + drill plan</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border/20 space-y-1">
            <span className="text-xs font-bold text-txt">Staff Comprehensive (45m+)</span>
            <div className="text-lg font-mono font-bold text-primary">15 Credits</div>
            <p className="text-[11px] text-txt-muted">Deep probing + code sandbox + full report</p>
          </div>
        </div>
      </div>

      {/* Placeholder Plan Tiers (Coming soon) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-head font-bold text-sm text-txt uppercase tracking-wider">
            Future Candidate Plans
          </h3>
          <Badge variant="preview">Coming Soon</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Placement Sprint', credits: 150, price: '$29', desc: 'Ideal for 2-week active campus or onsite sprint' },
            { name: 'Staff Calibration', credits: 400, price: '$69', desc: 'Deep system design practice with all 4 personas' },
            { name: 'Lifetime Season Pass', credits: 1000, price: '$149', desc: 'Continuous career progression and promotions' },
          ].map((plan) => (
            <div key={plan.name} className="p-6 rounded-2xl bg-surface/80 border border-border/20 flex flex-col justify-between opacity-80">
              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-secondary uppercase">{plan.name}</span>
                <div className="text-2xl font-head font-extrabold text-txt">{plan.price}</div>
                <div className="text-xs text-primary font-mono font-semibold">{plan.credits} Credits</div>
                <p className="text-xs text-txt-2 leading-relaxed">{plan.desc}</p>
              </div>
              <Button variant="secondary" size="sm" disabled disabledReason="Payments out of scope for Phase A">
                Coming Soon
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
