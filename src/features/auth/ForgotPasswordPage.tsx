import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../shared/ui/Button';
import { authRepo } from '../../data';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authRepo.resetPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Dispatches a secure password recovery authorization link"
    >
      {sent ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-head text-base font-bold text-txt">Recovery Link Dispatched</h3>
          <p className="text-xs text-txt-2 max-w-sm mx-auto leading-relaxed">
            If an account matching <strong>{email}</strong> exists, instructions to set a new password have been sent. Check your inbox and spam folder.
          </p>
          <Link to="/login" className="btn btn-secondary text-xs inline-flex items-center gap-1.5 mt-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-txt mb-1">Account Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="candidate@example.com"
                required
              />
              <Mail className="w-4 h-4 text-txt-muted absolute left-3 top-3" />
            </div>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Send Recovery Email
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-txt-2 hover:text-txt inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
