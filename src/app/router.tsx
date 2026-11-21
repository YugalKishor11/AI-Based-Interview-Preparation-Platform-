import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { RoomLayout } from './layouts/RoomLayout';
import { ProtectedRoute } from '../shared/auth/ProtectedRoute';
import { Spinner } from '../shared/ui/Spinner';

// Route Fallback Loader
const RouteLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <Spinner size="lg" />
    <span className="text-xs text-txt-muted font-mono tracking-wider uppercase">Loading Workspace...</span>
  </div>
);

// Lazy Loaded Feature Routes
const LandingPage = lazy(() => import('../features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../features/auth/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const VerifyEmailPage = lazy(() => import('../features/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const OnboardingPage = lazy(() => import('../features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SetupWizardPage = lazy(() => import('../features/setup/SetupWizardPage').then(m => ({ default: m.SetupWizardPage })));
const InterviewerSelectPage = lazy(() => import('../features/interviewers/InterviewerSelectPage').then(m => ({ default: m.InterviewerSelectPage })));
const DeviceCheckPage = lazy(() => import('../features/device/DeviceCheckPage').then(m => ({ default: m.DeviceCheckPage })));
const LiveRoomPage = lazy(() => import('../features/room/LiveRoomPage').then(m => ({ default: m.LiveRoomPage })));
const ReportPage = lazy(() => import('../features/report/ReportPage').then(m => ({ default: m.ReportPage })));
const PracticePage = lazy(() => import('../features/practice/PracticePage').then(m => ({ default: m.PracticePage })));
const HistoryPage = lazy(() => import('../features/history/HistoryPage').then(m => ({ default: m.HistoryPage })));
const CreditsPage = lazy(() => import('../features/credits/CreditsPage').then(m => ({ default: m.CreditsPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

const DesignShowcasePage = lazy(() => import('../features/showcase/DesignShowcasePage').then(m => ({ default: m.DesignShowcasePage })));
const PrivacyPage = lazy(() => import('../features/legal/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('../features/legal/TermsPage').then(m => ({ default: m.TermsPage })));
const NotFoundPage = lazy(() => import('../features/notfound/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export const router = createBrowserRouter([
  // Public Routes (PublicLayout)
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <LandingPage />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'signup',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <SignupPage />
          </Suspense>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <VerifyEmailPage />
          </Suspense>
        ),
      },
      {
        path: 'onboarding',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <OnboardingPage />
          </Suspense>
        ),
      },
      {
        path: 'legal/privacy',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <PrivacyPage />
          </Suspense>
        ),
      },
      {
        path: 'legal/terms',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <TermsPage />
          </Suspense>
        ),
      },
      {
        path: 'dev/showcase',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <DesignShowcasePage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },

  // App Routes (AppLayout with TopBar, Dock, Page Container)
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'interview/new',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <SetupWizardPage />
          </Suspense>
        ),
      },
      {
        path: 'interview/new/interviewer',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <InterviewerSelectPage />
          </Suspense>
        ),
      },
      {
        path: 'interview/check',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <DeviceCheckPage />
          </Suspense>
        ),
      },
      {
        path: 'reports/:id',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ReportPage />
          </Suspense>
        ),
      },
      {
        path: 'practice',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <PracticePage />
          </Suspense>
        ),
      },
      {
        path: 'history',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <HistoryPage />
          </Suspense>
        ),
      },
      {
        path: 'credits',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <CreditsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },

  // Live Interview Room (RoomLayout: Full Bleed, No Global Nav)
  {
    path: '/app/interview/:id/live',
    element: (
      <ProtectedRoute>
        <RoomLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <LiveRoomPage />
          </Suspense>
        ),
      },
    ],
  },
]);
