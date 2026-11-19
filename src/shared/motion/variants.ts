export const TRANSITIONS = {
  tap: { type: 'spring', stiffness: 420, damping: 34 },
  dock: { type: 'spring', stiffness: 420, damping: 34 },
  layout: { type: 'spring', stiffness: 220, damping: 26 },
  fade: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  slide: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};
