import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HotkeysProps {
  onOpenCommand: () => void;
  onOpenHelp: () => void;
}

export function useGlobalHotkeys({ onOpenCommand, onOpenHelp }: HotkeysProps) {
  const navigate = useNavigate();

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommand();
        return;
      }

      // Help: '?'
      if (e.key === '?') {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      // 'n' for new interview
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/app/interview/new');
        return;
      }

      // Multi-key sequences: 'g' then 'd', 'p', or 'h'
      const now = performance.now();
      if (lastKey === 'g' && now - lastKeyTime < 800) {
        if (e.key === 'd') {
          e.preventDefault();
          navigate('/app');
        } else if (e.key === 'p') {
          e.preventDefault();
          navigate('/app/practice');
        } else if (e.key === 'h') {
          e.preventDefault();
          navigate('/app/history');
        }
        lastKey = '';
        return;
      }

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        lastKey = 'g';
        lastKeyTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onOpenCommand, onOpenHelp]);
}
