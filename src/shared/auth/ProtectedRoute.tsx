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

  // If live Supabase backend is active and user is unauthenticated, redirect to login with return path
  if (isSupabase && !isAuthenticated) {
    const intended = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${intended}`} replace state={{ from: location }} />;
  }

  // Onboarding gate: redirect new users to onboarding until completed
  if (isSupabase && isAuthenticated && profile && profile.onboardingCompleted === false && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
