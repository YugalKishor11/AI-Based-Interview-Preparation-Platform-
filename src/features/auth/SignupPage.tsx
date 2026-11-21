import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { useAuth } from './AuthContext';
import { Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { mapAuthError } from '../../shared/auth/authErrorMapper';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isSupabase } = useAuth();
  const [name, setName] = useState('Alex Chen');
  const [email, setEmail] = useState('alex.chen@example.com');
  const [password, setPassword] = useState('StaffMastery2026!');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [consent, setConsent] = useState(true);
  const [aiConsent, setAiConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Password strength calculation enforcing minimum 10 characters (Prompt 4.2)
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Too short (<10 chars)', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-danger', 'bg-warning', 'bg-secondary', 'bg-success'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!ageConfirmed) {
      setError('You must confirm that you are at least 18 years of age.');
      return;
    }
    if (!consent) {
      setError('You must accept the Terms of Service and Privacy Policy.');
      return;
    }
    if (password.length < 10) {
      setError('Password policy requires at least 10 characters (no composition theatrics).');
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
      if (isSupabase) {
        setSuccessNotice('Account registered! Redirecting to candidate onboarding...');
        setTimeout(() => navigate('/onboarding'), 1000);
      } else {
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Candidate Account"
      subtitle="Start voice interview simulations with 120 practice credits"
    >
      {/* Backend Status Pill */}
      <div className="mb-4 flex items-center justify-between p-2.5 rounded-xl bg-surface/70 border border-border/20 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-primary'}`} />
          <span className="text-txt-2 font-mono text-[11px]">
            {isSupabase ? 'Supabase Database Integration' : 'Local Sandbox Demo'}
          </span>
        </div>
        <Badge variant={isSupabase ? 'success' : 'demo'} className="text-[10px] py-0">
          {isSupabase ? 'Supabase' : 'Demo'}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-txt mb-1">Full Name</label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input pl-10"
              placeholder="Alex Chen"
              required
            />
            <User className="w-4 h-4 text-txt-muted absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-txt mb-1">Email Address</label>
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

        <div>
          <label className="block text-xs font-semibold text-txt mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
              placeholder="••••••••••••"
              required
            />
            <Lock className="w-4 h-4 text-txt-muted absolute left-3 top-3" />
          </div>

          {/* Password Strength Meter */}
          <div className="mt-2 space-y-1">
            <div className="flex gap-1.5 h-1.5">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 rounded-full transition-colors ${
                    strength > step ? strengthColors[strength - 1] : 'bg-elevated'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-txt-muted">
              <span>Security strength</span>
              <span className="font-semibold text-txt">{strengthLabels[strength - 1] || 'Too short'}</span>
            </div>
          </div>
        </div>

        {/* Age Declaration (18+ requirement per Prompt 4.2) */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="age"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-1 rounded border-border"
          />
          <label htmlFor="age" className="text-xs text-txt-2 leading-relaxed">
            I declare that I am 18 years of age or older.
          </label>
        </div>

        {/* Consent Checkboxes */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 rounded border-border"
          />
          <label htmlFor="terms" className="text-xs text-txt-2 leading-relaxed">
            I agree to the <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service (v1.0)</Link> and <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy (v1.0)</Link>.
          </label>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="aiconsent"
            checked={aiConsent}
            onChange={(e) => setAiConsent(e.target.checked)}
            className="mt-1 rounded border-border"
          />
          <label htmlFor="aiconsent" className="text-xs text-txt-2 leading-relaxed">
            I consent to AI-based voice and resume evaluation. I understand that all scoring is an AI estimate and does not score accent, gender, or appearance.
          </label>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
          {isSupabase ? 'Register & Begin Onboarding' : 'Create Demo Account'}
        </Button>

        <p className="text-center text-xs text-txt-2 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
