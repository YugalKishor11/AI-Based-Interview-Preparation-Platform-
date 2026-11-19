import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TopBar } from './TopBar';
import { AmbientLights } from '../../shared/ui/AmbientLights';
import { CommandPalette } from '../../shared/ui/CommandPalette';
import { Sparkles, Shield, Heart } from 'lucide-react';
import { Badge } from '../../shared/ui/Badge';

export const PublicLayout: React.FC = () => {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="public-layout">
      <AmbientLights />
      <TopBar isPublic onOpenCommand={() => setCommandOpen(true)} />

      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="relative z-10 border-t border-border/15 bg-surface/80 backdrop-blur-md py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-head font-extrabold text-base text-txt">PrepSphere</span>
              <Badge variant="demo">Demo Edition</Badge>
            </div>
            <p className="text-xs text-txt-muted text-center md:text-left max-w-sm">
              Practice only. AI scores are estimates with limitations. We never score accent, gender, or appearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-txt-2">
            <Link to="/legal/privacy" className="hover:text-txt transition-colors">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-txt transition-colors">Terms of Service</Link>
            <Link to="/dev/showcase" className="hover:text-txt transition-colors">Design Showcase</Link>
            <Link to="/login" className="hover:text-txt transition-colors">Candidate Sign In</Link>
          </div>

          <div className="text-xs text-txt-muted text-center md:text-right">
            © {new Date().getFullYear()} PrepSphere. All mock data for demonstration.
          </div>
        </div>
      </footer>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
};
