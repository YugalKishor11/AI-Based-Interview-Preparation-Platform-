import React from 'react';

export const handleSpotlight = (e: React.PointerEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
};

export function useSpotlight() {
  return {
    onPointerMove: handleSpotlight,
  };
}
