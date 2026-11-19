import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  History,
  Settings,
} from 'lucide-react';
import { RgbBorder } from './RgbBorder';

interface DockItem {
  to: string;
  label: string;
  icon: React.ElementType;
  isHero?: boolean;
}

const DOCK_ITEMS: DockItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/practice', label: 'Practice', icon: Compass },
  { to: '/app/interview/new', label: 'New Interview', icon: Sparkles, isHero: true },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export const FloatingDock: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <>
      {/* Desktop Floating Dock */}
      <nav aria-label="Quick Navigation Dock" className="dock-container">
        <div className="dock">
          {DOCK_ITEMS.map((item, idx) => {
            const Icon = item.icon;

            // Magnification logic: target 1.25, neighbor 1.12
            let scale = 1;
            if (hoveredIdx !== null) {
              const dist = Math.abs(hoveredIdx - idx);
              if (dist === 0) scale = 1.22;
              else if (dist === 1) scale = 1.08;
            }

            if (item.isHero) {
              return (
                <RgbBorder key={item.to} className="rounded-full">
                  <NavLink
                    to={item.to}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={({ isActive }) =>
                      cn(
                        'dock-item group !w-12 !h-12 bg-primary/20 text-primary border border-primary/40',
                        isActive && 'active !text-white'
                      )
                    }
                    style={{ transform: `scale(${scale})` }}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 stroke-[2]" />
                    <span className="sr-only">{item.label}</span>
                  </NavLink>
                </RgbBorder>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={({ isActive }) =>
                  cn('dock-item group', isActive && 'active')
                }
                style={{ transform: `scale(${scale})` }}
                title={item.label}
              >
                <Icon className="w-5 h-5 stroke-[1.75]" />
                <span className="sr-only">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Safe Bottom Navigation (below 1024px) */}
      <nav aria-label="Mobile Navigation" className="mobile-nav">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                cn('mobile-nav-item', isActive && 'active')
              }
            >
              {item.isHero ? (
                <div className="w-8 h-8 rounded-full bg-primary/25 border border-primary/50 flex items-center justify-center text-primary">
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
              ) : (
                <Icon className="w-5 h-5 stroke-[1.75]" />
              )}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
