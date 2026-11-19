import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/cn';

interface RgbBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  bloom?: boolean;
}

export const RgbBorder = React.forwardRef<HTMLDivElement, RgbBorderProps>(
  ({ bloom = false, className, children, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement | null>(null);

    // Pause animation offscreen using IntersectionObserver
    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.style.animationPlayState = 'running';
            } else {
              el.style.animationPlayState = 'paused';
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('rgb-trace', bloom && 'rgb-hero', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

RgbBorder.displayName = 'RgbBorder';
