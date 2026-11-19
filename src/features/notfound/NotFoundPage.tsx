import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { ArrowLeft, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <GlassCard tier="2" className="max-w-md p-10 flex flex-col items-center">
        <div className="w-28 h-28 text-primary/40 mb-6">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
            <path
              d="M35 50L45 60L65 40"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="50" r="12" fill="currentColor" opacity="0.3" />
          </svg>
        </div>

        <span className="font-mono text-xs font-bold text-secondary uppercase tracking-widest mb-1">
          404 Error · Route Not Found
        </span>
        <h1 className="font-head text-2xl font-bold text-txt mb-2">
          Lost in Simulation Space
        </h1>
        <p className="text-xs text-txt-2 leading-relaxed mb-6">
          The requested page or interview report could not be found. Check the URL or return to your candidate dashboard.
        </p>

        <Link to="/app" className="btn btn-primary text-xs py-2.5 px-5 gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </GlassCard>
    </div>
  );
};
