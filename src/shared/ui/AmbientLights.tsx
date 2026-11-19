import React, { useEffect, useRef } from 'react';

export const AmbientLights: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (!containerRef.current) return;
      if (document.hidden) {
        containerRef.current.style.animationPlayState = 'paused';
      } else {
        containerRef.current.style.animationPlayState = 'running';
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <div ref={containerRef} className="ambient" aria-hidden="true">
      <i className="orb orb-1" />
      <i className="orb orb-2" />
      <i className="orb orb-3" />
      <i className="orb orb-4" />
    </div>
  );
};
