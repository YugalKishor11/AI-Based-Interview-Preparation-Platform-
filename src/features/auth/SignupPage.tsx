import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../shared/ui/Button';
import { authRepo } from '../../data';
import { Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('Alex Chen');
  const [email, setEmail] = useState('alex.chen@example.com');
  const [password, setPassword] = useState('StaffMastery2026!');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-danger', 'bg-warning', 'bg-secondary', 'bg-success'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError('You must accept the practice terms and consent.');
      return;
    }
    if (strength < 2) {
      setError('Please use a stronger password with at least 8 characters and numbers.');
      return;
    }

    setLoading(true);
    try {
      await authRepo.signUp(name, email);
      navigate('/onboarding');
    } catch {
      setError('Failed to create demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Candidate Account"
      subtitle="Start voice interview simulations with 120 demo credits"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
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

        {/* Consent Checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 rounded border-border"
          />
          <label htmlFor="terms" className="text-xs text-txt-2 leading-relaxed">
            I agree to the practice terms. I understand that all scoring is an AI estimate and does not score accent or appearance.
          </label>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
          Create Account & Start Onboarding
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
