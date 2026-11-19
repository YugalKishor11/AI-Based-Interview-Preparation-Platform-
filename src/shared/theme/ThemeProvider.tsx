import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type EffectsMode = 'full' | 'lite' | 'reduced' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
  effects: EffectsMode;
  resolvedEffects: 'full' | 'lite' | 'reduced';
  setEffects: (e: EffectsMode) => void;
  toggleTheme: () => void;
  toggleEffects: () => void;
  governorDowngraded: boolean;
  undoGovernorDowngrade: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const LS_THEME_KEY = 'prepsphere_theme';
const LS_EFFECTS_KEY = 'prepsphere_effects';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(LS_THEME_KEY) as Theme) || 'dark';
  });

  const [effects, setEffectsState] = useState<EffectsMode>(() => {
    return (localStorage.getItem(LS_EFFECTS_KEY) as EffectsMode) || 'full';
  });

  const [governorDowngraded, setGovernorDowngraded] = useState(false);
  const [previousEffects, setPreviousEffects] = useState<'full' | 'lite'>('full');

  // Resolve active theme
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    let effective: 'dark' | 'light' = 'dark';

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      effective = mql.matches ? 'dark' : 'light';
      const handler = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        root.setAttribute('data-theme', newTheme);
      };
      mql.addEventListener('change', handler);
      setResolvedTheme(effective);
      root.setAttribute('data-theme', effective);
      return () => mql.removeEventListener('change', handler);
    } else {
      effective = theme;
      setResolvedTheme(effective);
      root.setAttribute('data-theme', effective);
    }

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', effective === 'dark' ? '#070b14' : '#f1f5fb');
    }
  }, [theme]);

  // Resolve active effects
  const [resolvedEffects, setResolvedEffects] = useState<'full' | 'lite' | 'reduced'>('full');

  useEffect(() => {
    const root = document.documentElement;
    let targetEffects: 'full' | 'lite' | 'reduced' = 'full';

    if (effects === 'auto') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
      // Low-spec hardware detection
      const nav = navigator as unknown as { deviceMemory?: number; hardwareConcurrency?: number; connection?: { saveData?: boolean } };
      const isLowSpec =
        (nav.deviceMemory && nav.deviceMemory <= 4) ||
        (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
        (nav.connection && nav.connection.saveData);

      if (prefersReducedTransparency) {
        targetEffects = 'reduced';
      } else if (isLowSpec) {
        targetEffects = 'lite';
      } else if (prefersReducedMotion) {
        // Keeps glass & light, freezes motion only
        targetEffects = 'full';
      } else {
        targetEffects = 'full';
      }
    } else {
      targetEffects = effects;
    }

    setResolvedEffects(targetEffects);
    root.setAttribute('data-effects', targetEffects);
  }, [effects]);

  // Frame-time probe for automatic degradation if median frame time > 24ms
  useEffect(() => {
    if (resolvedEffects === 'reduced') return;

    let frames: number[] = [];
    let lastTime = performance.now();
    let animId: number;
    const probeDuration = 3000; // 3 seconds
    const startTime = performance.now();

    const checkFrame = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      frames.push(delta);

      if (time - startTime < probeDuration) {
        animId = requestAnimationFrame(checkFrame);
      } else {
        // Calculate median frame time
        frames.sort((a, b) => a - b);
        const median = frames[Math.floor(frames.length / 2)] || 16;
        if (median > 24) {
          // Downgrade one level
          const next = resolvedEffects === 'full' ? 'lite' : 'reduced';
          setPreviousEffects(resolvedEffects as 'full' | 'lite');
          setEffectsState(next);
          setGovernorDowngraded(true);
        }
      }
    };

    animId = requestAnimationFrame(checkFrame);
    return () => cancelAnimationFrame(animId);
  }, [resolvedEffects]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(LS_THEME_KEY, t);
    setThemeState(t);
  };

  const setEffects = (e: EffectsMode) => {
    localStorage.setItem(LS_EFFECTS_KEY, e);
    setEffectsState(e);
    setGovernorDowngraded(false);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleEffects = () => {
    const next = resolvedEffects === 'reduced' ? 'full' : 'reduced';
    setEffects(next);
  };

  const undoGovernorDowngrade = () => {
    setEffects(previousEffects);
    setGovernorDowngraded(false);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        effects,
        resolvedEffects,
        setEffects,
        toggleTheme,
        toggleEffects,
        governorDowngraded,
        undoGovernorDowngrade,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
