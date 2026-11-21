import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { useAuth } from './AuthContext';
import { Mail, Lock, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { mapAuthError } from '../../shared/auth/authErrorMapper';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const { signIn, signInWithOAuth, isSupabase } = useAuth();
  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('alex.chen@example.com');
  const [password, setPassword] = useState('StaffMastery2026!');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Rate limit countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMagicLinkSent(false);

    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    if (authMode === 'password' && !password) {
      setError('Please provide your password.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'password') {
        await signIn(email, password);
        const destination = redirectTo ? decodeURIComponent(redirectTo) : '/app';
        navigate(destination);
      } else {
        // Magic link passwordless OTP flow
        await signIn(email);
        setMagicLinkSent(true);
      }
    } catch (err: unknown) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
      if (mapped.retryAfterSeconds) {
        setCooldown(mapped.retryAfterSeconds);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      await signInWithOAuth('google');
    } catch (err: unknown) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
      setOauthLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your PrepSphere workspace"
    >
      {/* Backend Status Pill */}
      <div className="mb-4 flex items-center justify-between p-2.5 rounded-xl bg-surface/70 border border-border/20 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-primary'}`} />
          <span className="text-txt-2 font-mono text-[11px]">
            {isSupabase ? 'Supabase Auth Active' : 'Local Sandbox Demo'}
          </span>
        </div>
        <Badge variant={isSupabase ? 'success' : 'demo'} className="text-[10px] py-0">
          {isSupabase ? 'Supabase' : 'Demo'}
        </Badge>
      </div>

      {/* Auth Mode Tabs (Password vs Magic Link) */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-4 rounded-xl bg-surface/80 border border-border/20 text-xs">
        <button
          type="button"
          onClick={() => { setAuthMode('password'); setError(null); }}
          className={`py-1.5 px-3 rounded-lg font-medium transition-colors ${
            authMode === 'password' ? 'bg-primary text-white shadow-sm' : 'text-txt-muted hover:text-txt'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('magic-link'); setError(null); }}
          className={`py-1.5 px-3 rounded-lg font-medium transition-colors ${
            authMode === 'magic-link' ? 'bg-primary text-white shadow-sm' : 'text-txt-muted hover:text-txt'
          }`}
        >
          Magic Link (Passwordless)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {magicLinkSent && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Magic Link Dispatched</strong>
              <span>Check your inbox for a one-click login link. No password required.</span>
            </div>
          </div>
        )}

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

        {authMode === 'password' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-txt">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
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
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={cooldown > 0}
          disabledReason={cooldown > 0 ? `Wait ${cooldown}s before retrying` : undefined}
          className="w-full mt-2"
        >
          {authMode === 'magic-link'
            ? 'Send Magic Login Link'
            : isSupabase
            ? 'Sign In'
            : 'Sign In (Demo Mode)'}
        </Button>

        {/* OAuth Separator */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/20" />
          </div>
          <span className="relative bg-surface px-2 text-[10px] uppercase text-txt-muted">
            Or continue with
          </span>
        </div>

        {/* Google OAuth Button */}
        {isSupabase ? (
          <Button
            type="button"
            variant="secondary"
            loading={oauthLoading}
            onClick={handleGoogleOAuth}
            className="w-full text-xs text-txt hover:bg-elevated"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled
            disabledReason="Supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google OAuth"
            className="w-full text-xs text-txt-muted"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google (Configure Supabase)
          </Button>
        )}

        <p className="text-center text-xs text-txt-2 pt-2">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Sign up
          </Link>
        </p>

        <div className="pt-3 border-t border-border/20 text-center">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('prepsphere_guest_mode', 'true');
              navigate('/app');
            }}
            className="text-xs font-semibold text-secondary hover:text-secondary/80 inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Continue to Workspace in Demo Mode &rarr;
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
