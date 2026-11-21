import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Spinner } from '../ui/Spinner';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isSupabase, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-txt-muted font-mono tracking-wider uppercase">Authenticating Candidate...</span>
      </div>
    );
  }

  // Check if candidate is accessing in guest / demo mode or completed onboarding
  const isGuestMode = typeof window !== 'undefined' && (
    localStorage.getItem('prepsphere_guest_mode') === 'true' ||
    localStorage.getItem('prepsphere_onboarding_completed') === 'true' ||
    localStorage.getItem('prepsphere_data_source') === 'mock'
  );

  // If live Supabase backend is active and user is unauthenticated, redirect to login with return path unless guest mode is active
  if (isSupabase && !isAuthenticated && !isGuestMode) {
    const intended = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${intended}`} replace state={{ from: location }} />;
  }

  // Onboarding gate: redirect new authenticated users to onboarding only if not completed
  const onboardingCompleted = profile?.onboardingCompleted || (typeof window !== 'undefined' && localStorage.getItem('prepsphere_onboarding_completed') === 'true');
  if (isSupabase && isAuthenticated && !onboardingCompleted && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
