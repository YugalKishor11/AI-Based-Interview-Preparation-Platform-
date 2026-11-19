import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../shared/ui/Button';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = () => {
    setCooldown(60);
  };

  return (
    <AuthLayout
      title="Verify Email Address"
      subtitle="Confirm your identity to unlock simulated interview recording"
    >
      <div className="text-center py-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6" />
        </div>
        <p className="text-xs text-txt-2 max-w-sm mx-auto leading-relaxed">
          We sent a verification confirmation to your email. Click the link in that message to verify your demo account.
        </p>

        <div className="pt-2 flex flex-col gap-3 max-w-xs mx-auto">
          <Button
            variant="primary"
            onClick={() => navigate('/onboarding')}
            className="w-full"
          >
            I've Verified My Email (Continue)
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={cooldown > 0}
            disabledReason={cooldown > 0 ? `Please wait ${cooldown}s before resending` : undefined}
            onClick={handleResend}
            className="w-full text-xs text-txt-muted"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};
