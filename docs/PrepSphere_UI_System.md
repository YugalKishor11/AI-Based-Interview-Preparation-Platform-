# PrepSphere — UI System
### Complete CSS, components, layouts and motion spec
*Companion to `PrepSphere_PRD_Prompt_Chain.md`. Built on the design brief in your PRD (Manrope / Inter / JetBrains Mono, 8px scale, 12–18px radii, violet + cyan on deep navy) and extended with light mode, liquid glass, ambient lights and revolving RGB borders.*

**Stack assumed:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Lucide React, Motion for React. Pin current versions at install time. Every snippet below is plain CSS or TSX that works with either Tailwind v3 or v4.

---

## Table of contents
1. Design principles and effect budget
2. File structure
3. `tokens.css` — colors, type, spacing, radii, shadows, motion
4. `base.css` — reset, typography, focus, scrollbar
5. `effects.css` — liquid glass, RGB borders, ambient lights
6. `components.css` — buttons, inputs, cards, badges, tabs, nav, dialogs, sheets, toasts, skeletons, progress
7. `interview.css` — interviewer stage, question card, transcript, mic control, waveform, code panel
8. `report.css` — score ring, rubric bars, evidence drawer, charts
9. `layout.css` — app shell, sidebar, top bar, bottom nav, safe areas, keyboard-safe
10. Tailwind config mapping
11. React components (ThemeProvider, GlassCard, RgbBorder, AmbientLights, Waveform, ScoreRing, useKeyboardInset)
12. Motion spec (Motion for React)
13. Screen-by-screen UI map (all 12 PRD screens)
14. Component inventory and states checklist
15. Accessibility, performance and Android rules

---

## 1. Design principles and effect budget

**Personality:** cinematic, confident, calm. Premium career-tech, not a chatbot template.

**Effect budget (hard rules)**

| Effect | Allowed | Max per viewport |
|---|---|---|
| Liquid glass (`backdrop-filter`) | Shell chrome, hero cards, interviewer card, dialogs, sheets | 4 |
| Animated RGB border | Primary CTA, selected interviewer, live question card, active mic, Start Interview card | 2 |
| Ambient moving lights | Landing hero, auth, dashboard backdrop, interview room backdrop | 1 layer |
| Glow (box-shadow color bloom) | Hover or active state only | 1 |

Never use glass, glow or animated borders on: long text, tables, report body, code editor, list rows. A global **Reduce effects** switch (also auto-enabled by `prefers-reduced-motion`, `prefers-reduced-transparency`, or low `deviceMemory`) swaps all of the above for solid surfaces and static borders.

---

## 2. File structure

```text
src/styles/
  tokens.css        design tokens (both themes)
  base.css          reset, typography, focus, scrollbars
  effects.css       glass, rgb borders, ambient lights
  components.css    primitives
  interview.css     live-room components
  report.css        report components
  layout.css        shell, nav, safe areas
  index.css         imports everything in order
src/shared/ui/      React primitives (GlassCard, RgbBorder, ...)
src/shared/theme/   ThemeProvider, useEffectsMode
```

`index.css`:
```css
@import "./tokens.css";
@import "./base.css";
@import "./effects.css";
@import "./components.css";
@import "./interview.css";
@import "./report.css";
@import "./layout.css";
/* Tailwind directives (v3) or @import "tailwindcss" (v4) go before these imports */
```

---

## 3. `tokens.css`

Colors are stored as space-separated RGB channels so Tailwind opacity modifiers (`bg-primary/20`) and `rgb(var(--x) / .4)` both work.

```css
:root,
:root[data-theme="dark"] {
  color-scheme: dark;

  /* Surfaces */
  --c-bg: 9 14 27;            /* #090E1B */
  --c-surface: 17 24 42;      /* #11182A */
  --c-elevated: 25 35 58;     /* #19233A */
  --c-overlay: 5 8 16;

  /* Brand */
  --c-primary: 139 92 246;    /* #8B5CF6 */
  --c-primary-hover: 124 77 232;
  --c-secondary: 34 211 238;  /* #22D3EE */
  --c-success: 52 211 153;    /* #34D399 */
  --c-warning: 251 191 36;
  --c-danger: 248 113 113;
  --c-accent-pink: 244 114 182;

  /* Text */
  --c-text: 241 245 249;      /* #F1F5F9 */
  --c-text-2: 165 180 204;    /* #A5B4CC */
  --c-text-3: 115 130 158;
  --c-on-primary: 255 255 255;

  /* Lines */
  --c-border: 165 180 204;    /* use with alpha: rgb(var(--c-border) / .14) */
  --border-a: .14;
  --border-strong-a: .26;

  /* Glass */
  --glass-bg: rgb(25 35 58 / .55);
  --glass-bg-strong: rgb(25 35 58 / .78);
  --glass-border: rgb(255 255 255 / .10);
  --glass-highlight: rgb(255 255 255 / .16);
  --glass-shadow: 0 8px 32px rgb(0 0 0 / .28);

  /* Ambient */
  --orb-violet: rgb(139 92 246 / .28);
  --orb-cyan: rgb(34 211 238 / .20);
  --orb-green: rgb(52 211 153 / .12);

  /* Elevation */
  --shadow-1: 0 1px 2px rgb(0 0 0 / .30);
  --shadow-2: 0 6px 20px rgb(0 0 0 / .30);
  --shadow-3: 0 18px 48px rgb(0 0 0 / .42);
  --ring: 0 0 0 3px rgb(139 92 246 / .45);
}

:root[data-theme="light"] {
  color-scheme: light;

  --c-bg: 245 247 252;        /* #F5F7FC */
  --c-surface: 255 255 255;
  --c-elevated: 237 241 250;
  --c-overlay: 15 23 42;

  --c-primary: 124 58 237;    /* #7C3AED, AA on white */
  --c-primary-hover: 109 40 217;
  --c-secondary: 8 145 178;   /* #0891B2 */
  --c-success: 5 150 105;
  --c-warning: 180 83 9;
  --c-danger: 220 38 38;
  --c-accent-pink: 219 39 119;

  --c-text: 11 18 32;
  --c-text-2: 71 85 105;
  --c-text-3: 100 116 139;
  --c-on-primary: 255 255 255;

  --c-border: 15 23 42;
  --border-a: .10;
  --border-strong-a: .22;

  --glass-bg: rgb(255 255 255 / .62);
  --glass-bg-strong: rgb(255 255 255 / .86);
  --glass-border: rgb(255 255 255 / .85);
  --glass-highlight: rgb(255 255 255 / .95);
  --glass-shadow: 0 8px 32px rgb(15 23 42 / .10);

  --orb-violet: rgb(124 58 237 / .16);
  --orb-cyan: rgb(8 145 178 / .14);
  --orb-green: rgb(5 150 105 / .08);

  --shadow-1: 0 1px 2px rgb(15 23 42 / .08);
  --shadow-2: 0 6px 20px rgb(15 23 42 / .10);
  --shadow-3: 0 18px 48px rgb(15 23 42 / .16);
  --ring: 0 0 0 3px rgb(124 58 237 / .35);
}

:root {
  /* Typography */
  --font-head: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-ui: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --fs-xs: .75rem;   --fs-sm: .875rem;  --fs-md: 1rem;
  --fs-lg: 1.125rem; --fs-xl: 1.375rem; --fs-2xl: 1.75rem;
  --fs-3xl: clamp(2rem, 1.4rem + 2vw, 2.75rem);
  --fs-hero: clamp(2.5rem, 1.6rem + 4vw, 4.5rem);

  /* 8px spacing scale */
  --sp-1: 4px;  --sp-2: 8px;   --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px;  --sp-7: 40px; --sp-8: 48px;
  --sp-9: 64px; --sp-10: 80px; --sp-11: 96px;

  /* Radii (12–18px as per PRD) */
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 18px; --r-pill: 999px;

  /* Motion */
  --dur-fast: 120ms;   /* button feedback 100–150ms */
  --dur-base: 200ms;
  --dur-slow: 280ms;   /* dialogs 200–280ms */
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-in-out: cubic-bezier(.65, 0, .35, 1);

  /* Layout */
  --sidebar-w: 264px; --sidebar-w-collapsed: 76px;
  --topbar-h: 64px;   --bottomnav-h: 64px;
  --content-max: 1400px;

  /* Safe areas (zero on desktop) */
  --safe-t: env(safe-area-inset-top, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
  --kb: 0px; /* set by useKeyboardInset() */

  /* Z layers */
  --z-bg: -1; --z-base: 0; --z-nav: 40; --z-sheet: 60; --z-dialog: 70; --z-toast: 80;
}
```

---

## 4. `base.css`

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; height: 100%; }
body {
  margin: 0; min-height: 100%;
  background: rgb(var(--c-bg));
  color: rgb(var(--c-text));
  font-family: var(--font-ui);
  font-size: var(--fs-md); line-height: 1.55;
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  overflow-x: hidden;
}
h1, h2, h3, h4 { font-family: var(--font-head); line-height: 1.15; letter-spacing: -.02em; margin: 0; font-weight: 700; }
h1 { font-size: var(--fs-3xl); } h2 { font-size: var(--fs-2xl); }
h3 { font-size: var(--fs-xl); }  h4 { font-size: var(--fs-lg); }
.hero-title { font-size: var(--fs-hero); font-weight: 800; letter-spacing: -.035em; }
p { margin: 0; color: rgb(var(--c-text-2)); }
code, pre, kbd, .mono { font-family: var(--font-mono); font-size: .92em; }
img, svg, video, canvas { max-width: 100%; display: block; }
button, input, select, textarea { font: inherit; color: inherit; }
a { color: rgb(var(--c-secondary)); text-underline-offset: 3px; }

/* Visible focus for keyboard users only */
:focus { outline: none; }
:focus-visible { outline: 2px solid rgb(var(--c-primary)); outline-offset: 2px; box-shadow: var(--ring); border-radius: var(--r-sm); }

/* Skip link */
.skip-link { position: absolute; left: 8px; top: -48px; z-index: 100;
  background: rgb(var(--c-primary)); color: rgb(var(--c-on-primary));
  padding: 8px 16px; border-radius: var(--r-md); transition: top var(--dur-fast); }
.skip-link:focus { top: calc(8px + var(--safe-t)); }

/* Scrollbars */
* { scrollbar-width: thin; scrollbar-color: rgb(var(--c-border) / .35) transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: rgb(var(--c-border) / .30); border-radius: 999px; border: 3px solid transparent; background-clip: content-box; }

::selection { background: rgb(var(--c-primary) / .35); }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.tabular { font-variant-numeric: tabular-nums; }
.text-gradient { background: linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-secondary)));
  -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Reduced motion: collapse all animation and transition */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important;
    transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
```

---

## 5. `effects.css` — liquid glass, RGB borders, ambient lights

### 5.1 Liquid glass
Three levels: `glass` (default), `glass-strong` (dialogs, sheets), `glass-crisp` (tall feature cards with a sharper edge).

```css
.glass {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(165%);
  -webkit-backdrop-filter: blur(20px) saturate(165%);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-xl);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--glass-shadow);
}
/* Soft specular sheen across the top-left, no animation (cheap) */
.glass::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(135deg, rgb(255 255 255 / .10), transparent 38%);
  mix-blend-mode: soft-light;
}
.glass-strong { background: var(--glass-bg-strong); backdrop-filter: blur(28px) saturate(180%); -webkit-backdrop-filter: blur(28px) saturate(180%); }

/* Crisp, tall container: for interviewer portraits and feature cards */
.glass-crisp {
  background: linear-gradient(180deg, rgb(var(--c-elevated) / .85), rgb(var(--c-surface) / .92));
  border: 1px solid rgb(var(--c-border) / var(--border-a));
  border-radius: var(--r-xl);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-2);
  aspect-ratio: 3 / 4; /* tall */
  overflow: hidden;
}

/* Fallback when blur is unsupported or effects are reduced */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass, .glass-strong { background: rgb(var(--c-elevated)); }
}
:root[data-effects="reduced"] .glass,
:root[data-effects="reduced"] .glass-strong {
  backdrop-filter: none; -webkit-backdrop-filter: none; background: rgb(var(--c-elevated));
}
:root[data-effects="reduced"] .glass::after { display: none; }
@media (prefers-reduced-transparency: reduce) {
  .glass, .glass-strong { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgb(var(--c-elevated)); }
}
```

### 5.2 RGB border (revolving light)

```css
@property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }

.rgb-ring, .rgb-trace { position: relative; isolation: isolate; border-radius: var(--r-xl); }

/* A) Full rainbow ring that rotates */
.rgb-ring::before {
  content: ""; position: absolute; inset: 0; padding: 1.5px; border-radius: inherit; z-index: -1;
  background: conic-gradient(from var(--angle),
    rgb(var(--c-primary)), rgb(var(--c-secondary)), rgb(var(--c-success)),
    rgb(var(--c-accent-pink)), rgb(var(--c-primary)));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: rgb-spin 6s linear infinite;
}

/* B) Single light that travels around a faint static border (more refined, default for premium) */
.rgb-trace::before {
  content: ""; position: absolute; inset: 0; padding: 1.5px; border-radius: inherit; z-index: -1;
  background:
    conic-gradient(from var(--angle), transparent 0 62%,
      rgb(var(--c-primary)) 74%, rgb(var(--c-secondary)) 86%, rgb(var(--c-success)) 93%, transparent 100%),
    linear-gradient(rgb(var(--c-border) / .22), rgb(var(--c-border) / .22));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: rgb-spin 5s linear infinite;
}

/* Optional soft bloom, active/hover only, never constant */
.rgb-ring.is-active::after, .rgb-trace.is-active::after,
.rgb-ring:hover::after, .rgb-trace:hover::after {
  content: ""; position: absolute; inset: -2px; border-radius: inherit; z-index: -2; pointer-events: none;
  background: conic-gradient(from var(--angle), rgb(var(--c-primary) / .5), rgb(var(--c-secondary) / .5), rgb(var(--c-success) / .4), rgb(var(--c-primary) / .5));
  filter: blur(14px); opacity: .55; animation: rgb-spin 6s linear infinite;
}

@keyframes rgb-spin { to { --angle: 360deg; } }

/* Speed modifiers */
.rgb-slow::before, .rgb-slow::after { animation-duration: 10s; }
.rgb-fast::before, .rgb-fast::after { animation-duration: 3s; }

/* Pause when offscreen/hidden (toggled by useInViewPause) */
.rgb-paused::before, .rgb-paused::after { animation-play-state: paused; }

/* Fallbacks: no @property support (older WebView) -> static gradient ring */
@supports not (background: conic-gradient(from 0deg, red, blue)) {
  .rgb-ring::before, .rgb-trace::before { background: linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); animation: none; }
}
:root[data-effects="reduced"] .rgb-ring::before,
:root[data-effects="reduced"] .rgb-trace::before { animation: none; --angle: 45deg; }
:root[data-effects="reduced"] .rgb-ring::after,
:root[data-effects="reduced"] .rgb-trace::after { display: none; }
@media (prefers-reduced-motion: reduce) {
  .rgb-ring::before, .rgb-trace::before { animation: none; --angle: 45deg; }
  .rgb-ring::after, .rgb-trace::after { animation: none; }
}
```

### 5.3 Ambient moving lights
Transform-only animation on pre-blurred radial gradients (no `filter: blur` animation, GPU-friendly).

```css
.ambient { position: fixed; inset: 0; z-index: var(--z-bg); overflow: hidden; pointer-events: none; contain: strict; }
.ambient .orb { position: absolute; border-radius: 50%; will-change: transform; opacity: 1; }
.ambient .orb-1 { width: 62vmax; height: 62vmax; left: -18vmax; top: -22vmax;
  background: radial-gradient(circle at 50% 50%, var(--orb-violet), transparent 62%);
  animation: drift-1 32s var(--ease-in-out) infinite alternate; }
.ambient .orb-2 { width: 54vmax; height: 54vmax; right: -16vmax; top: 6vmax;
  background: radial-gradient(circle at 50% 50%, var(--orb-cyan), transparent 62%);
  animation: drift-2 38s var(--ease-in-out) infinite alternate; }
.ambient .orb-3 { width: 44vmax; height: 44vmax; left: 22vmax; bottom: -24vmax;
  background: radial-gradient(circle at 50% 50%, var(--orb-green), transparent 62%);
  animation: drift-3 44s var(--ease-in-out) infinite alternate; }
/* Subtle grain/grid overlay for depth (static, no cost) */
.ambient::after { content: ""; position: absolute; inset: 0;
  background-image: linear-gradient(rgb(var(--c-border) / .05) 1px, transparent 1px),
                    linear-gradient(90deg, rgb(var(--c-border) / .05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%); }

@keyframes drift-1 { to { transform: translate3d(10vmax, 8vmax, 0) scale(1.08); } }
@keyframes drift-2 { to { transform: translate3d(-12vmax, 10vmax, 0) scale(1.12); } }
@keyframes drift-3 { to { transform: translate3d(8vmax, -9vmax, 0) scale(1.06); } }

.ambient.is-paused .orb { animation-play-state: paused; }
:root[data-effects="reduced"] .ambient .orb { animation: none; }
@media (prefers-reduced-motion: reduce) { .ambient .orb { animation: none; } }
```

---

## 6. `components.css`

### 6.1 Buttons
```css
.btn {
  --btn-h: 44px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: var(--btn-h); padding: 0 20px; border-radius: var(--r-md);
  border: 1px solid transparent; font-weight: 600; font-size: var(--fs-sm); cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast), opacity var(--dur-fast);
  -webkit-tap-highlight-color: transparent; user-select: none;
}
.btn:active:not(:disabled) { transform: scale(.97); }
.btn:disabled, .btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
.btn-lg { --btn-h: 52px; padding: 0 28px; font-size: var(--fs-md); border-radius: var(--r-lg); }
.btn-sm { --btn-h: 36px; padding: 0 14px; font-size: var(--fs-xs); }
.btn-icon { width: var(--btn-h); padding: 0; }

.btn-primary {
  background: linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary-hover)));
  color: rgb(var(--c-on-primary)); box-shadow: 0 6px 18px rgb(var(--c-primary) / .30), inset 0 1px 0 rgb(255 255 255 / .22);
}
.btn-primary:hover:not(:disabled) { box-shadow: 0 8px 24px rgb(var(--c-primary) / .42), inset 0 1px 0 rgb(255 255 255 / .28); }
.btn-secondary { background: rgb(var(--c-elevated)); color: rgb(var(--c-text)); border-color: rgb(var(--c-border) / var(--border-a)); }
.btn-secondary:hover:not(:disabled) { border-color: rgb(var(--c-border) / var(--border-strong-a)); }
.btn-ghost { background: transparent; color: rgb(var(--c-text-2)); }
.btn-ghost:hover:not(:disabled) { background: rgb(var(--c-border) / .10); color: rgb(var(--c-text)); }
.btn-danger { background: rgb(var(--c-danger) / .14); color: rgb(var(--c-danger)); border-color: rgb(var(--c-danger) / .35); }
.btn-success { background: rgb(var(--c-success) / .16); color: rgb(var(--c-success)); border-color: rgb(var(--c-success) / .35); }
.btn[data-loading="true"] { pointer-events: none; }
.btn .spinner { width: 16px; height: 16px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
```

### 6.2 Inputs and forms
```css
.field { display: grid; gap: 6px; }
.label { font-size: var(--fs-sm); font-weight: 600; color: rgb(var(--c-text)); }
.hint { font-size: var(--fs-xs); color: rgb(var(--c-text-3)); }
.input, .select, .textarea {
  width: 100%; min-height: 48px; padding: 0 14px; border-radius: var(--r-md);
  background: rgb(var(--c-surface)); color: rgb(var(--c-text));
  border: 1px solid rgb(var(--c-border) / var(--border-strong-a));
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast), background var(--dur-fast);
  font-size: 16px; /* prevents iOS/Android zoom on focus */
}
.textarea { padding: 12px 14px; min-height: 120px; resize: vertical; }
.input::placeholder, .textarea::placeholder { color: rgb(var(--c-text-3)); }
.input:hover { border-color: rgb(var(--c-border) / .4); }
.input:focus-visible, .select:focus-visible, .textarea:focus-visible { border-color: rgb(var(--c-primary)); box-shadow: var(--ring); outline: none; }
.input[aria-invalid="true"] { border-color: rgb(var(--c-danger)); }
.error-text { font-size: var(--fs-xs); color: rgb(var(--c-danger)); display: flex; gap: 6px; align-items: center; }

/* Segmented control / chips */
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: var(--r-pill);
  background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); color: rgb(var(--c-text-2));
  font-size: var(--fs-sm); font-weight: 500; cursor: pointer; transition: all var(--dur-fast); }
.chip:hover { color: rgb(var(--c-text)); border-color: rgb(var(--c-border) / var(--border-strong-a)); }
.chip[aria-pressed="true"], .chip[aria-checked="true"] { background: rgb(var(--c-primary) / .16); color: rgb(var(--c-text)); border-color: rgb(var(--c-primary) / .6); }

/* Switch */
.switch { position: relative; width: 48px; height: 28px; border-radius: 999px; background: rgb(var(--c-border) / .3); border: 0; cursor: pointer; transition: background var(--dur-base); }
.switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: var(--shadow-1); transition: transform var(--dur-base) var(--ease-out); }
.switch[aria-checked="true"] { background: rgb(var(--c-primary)); }
.switch[aria-checked="true"]::after { transform: translateX(20px); }

/* Slider (duration, question count) */
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px;
  background: linear-gradient(90deg, rgb(var(--c-primary)) var(--fill, 50%), rgb(var(--c-border) / .25) var(--fill, 50%)); }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid rgb(var(--c-primary)); box-shadow: var(--shadow-2); cursor: pointer; }
.slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid rgb(var(--c-primary)); cursor: pointer; }

/* Upload dropzone */
.dropzone { display: grid; place-items: center; gap: 8px; text-align: center; padding: 32px; min-height: 160px;
  border: 1.5px dashed rgb(var(--c-border) / .35); border-radius: var(--r-lg); background: rgb(var(--c-surface) / .6); transition: all var(--dur-base); }
.dropzone[data-drag="true"] { border-color: rgb(var(--c-secondary)); background: rgb(var(--c-secondary) / .08); }
```

### 6.3 Cards, badges, tags
```css
.card { background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); border-radius: var(--r-lg); padding: var(--sp-5); box-shadow: var(--shadow-1); }
.card-interactive { cursor: pointer; transition: transform var(--dur-base) var(--ease-out), border-color var(--dur-base), box-shadow var(--dur-base); }
.card-interactive:hover { transform: translateY(-2px); border-color: rgb(var(--c-primary) / .45); box-shadow: var(--shadow-2); }
.card-elevated { background: rgb(var(--c-elevated)); }
.stat { display: grid; gap: 4px; }
.stat-value { font-family: var(--font-head); font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -.02em; }
.stat-label { font-size: var(--fs-xs); color: rgb(var(--c-text-3)); text-transform: uppercase; letter-spacing: .08em; }

.badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 600;
  background: rgb(var(--c-border) / .14); color: rgb(var(--c-text-2)); }
.badge-primary { background: rgb(var(--c-primary) / .16); color: rgb(var(--c-primary)); }
.badge-cyan { background: rgb(var(--c-secondary) / .14); color: rgb(var(--c-secondary)); }
.badge-success { background: rgb(var(--c-success) / .14); color: rgb(var(--c-success)); }
.badge-warning { background: rgb(var(--c-warning) / .14); color: rgb(var(--c-warning)); }
.badge-danger { background: rgb(var(--c-danger) / .14); color: rgb(var(--c-danger)); }
.badge-demo { background: repeating-linear-gradient(45deg, rgb(var(--c-warning) / .18) 0 8px, rgb(var(--c-warning) / .08) 8px 16px); color: rgb(var(--c-warning)); border: 1px dashed rgb(var(--c-warning) / .5); }
.badge-ai { background: rgb(var(--c-secondary) / .12); color: rgb(var(--c-secondary)); border: 1px solid rgb(var(--c-secondary) / .35); } /* "Virtual AI interviewer" label */
.dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.dot-live { animation: pulse 1.6s ease-out infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 currentColor; } 70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
```

### 6.4 Tabs, dialog, bottom sheet, toast, tooltip
```css
.tabs { display: inline-flex; padding: 4px; gap: 4px; border-radius: var(--r-md); background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); }
.tab { min-height: 36px; padding: 0 14px; border-radius: 9px; border: 0; background: transparent; color: rgb(var(--c-text-2)); font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
.tab[aria-selected="true"] { background: rgb(var(--c-elevated)); color: rgb(var(--c-text)); box-shadow: var(--shadow-1); }

.scrim { position: fixed; inset: 0; background: rgb(var(--c-overlay) / .6); z-index: var(--z-dialog); }
.dialog { position: fixed; z-index: calc(var(--z-dialog) + 1); left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(92vw, 520px); max-height: 88dvh; overflow: auto; padding: var(--sp-6); }
.sheet { position: fixed; z-index: var(--z-sheet); left: 0; right: 0; bottom: 0;
  border-radius: var(--r-xl) var(--r-xl) 0 0; max-height: 88dvh; overflow: auto;
  padding: var(--sp-5) var(--sp-5) calc(var(--sp-5) + var(--safe-b)); }
.sheet::before { content: ""; display: block; width: 40px; height: 4px; border-radius: 999px; background: rgb(var(--c-border) / .4); margin: 0 auto var(--sp-4); }

.toast-region { position: fixed; z-index: var(--z-toast); right: 16px; bottom: calc(16px + var(--safe-b)); display: grid; gap: 8px; width: min(92vw, 380px); }
.toast { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: var(--r-md);
  background: rgb(var(--c-elevated)); border: 1px solid rgb(var(--c-border) / var(--border-strong-a)); box-shadow: var(--shadow-3); }
.toast[data-kind="success"] { border-color: rgb(var(--c-success) / .5); }
.toast[data-kind="error"] { border-color: rgb(var(--c-danger) / .5); }
@media (max-width: 1023px) { .toast-region { bottom: calc(var(--bottomnav-h) + var(--safe-b) + 12px); left: 50%; right: auto; transform: translateX(-50%); } }

.tooltip { padding: 6px 10px; border-radius: 8px; font-size: var(--fs-xs); background: rgb(var(--c-text)); color: rgb(var(--c-bg)); }
```

### 6.5 Skeleton, progress, empty and error states
```css
.skeleton { position: relative; overflow: hidden; border-radius: var(--r-md); background: rgb(var(--c-border) / .12); }
.skeleton::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(var(--c-border) / .16), transparent); animation: shimmer 1.4s infinite; }
@keyframes shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .skeleton::after { animation: none; } }

.progress { height: 8px; border-radius: 999px; background: rgb(var(--c-border) / .18); overflow: hidden; }
.progress > span { display: block; height: 100%; width: var(--value, 0%); border-radius: inherit;
  background: linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); transition: width var(--dur-slow) var(--ease-out); }
.stepper { display: flex; gap: 8px; } .stepper .step { flex: 1; height: 4px; border-radius: 999px; background: rgb(var(--c-border) / .2); }
.stepper .step[data-done="true"] { background: rgb(var(--c-primary)); }

.empty, .error-state { display: grid; justify-items: center; gap: 12px; text-align: center; padding: var(--sp-8) var(--sp-5); border: 1px dashed rgb(var(--c-border) / .25); border-radius: var(--r-lg); }
.empty .icon, .error-state .icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 16px; background: rgb(var(--c-primary) / .12); color: rgb(var(--c-primary)); }
.error-state .icon { background: rgb(var(--c-danger) / .12); color: rgb(var(--c-danger)); }
.banner { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--r-md); font-size: var(--fs-sm); }
.banner-offline { background: rgb(var(--c-warning) / .14); border: 1px solid rgb(var(--c-warning) / .4); color: rgb(var(--c-text)); }
```

---

## 7. `interview.css` — live room

```css
/* Room shell: hides global nav; two columns on desktop, stacked on mobile */
.room { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr); gap: var(--sp-5);
  padding: calc(var(--sp-4) + var(--safe-t)) calc(var(--sp-5) + var(--safe-r)) calc(var(--sp-4) + var(--safe-b)) calc(var(--sp-5) + var(--safe-l)); }
.room-topbar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.room-stage { display: grid; grid-template-rows: 1fr auto; gap: var(--sp-4); min-height: 0; }
.room-side { display: grid; grid-template-rows: auto 1fr auto; gap: var(--sp-4); min-height: 0; }

/* Interviewer stage (honest avatar: states, not fake lip-sync) */
.stage { position: relative; border-radius: var(--r-xl); overflow: hidden; min-height: 360px;
  background: radial-gradient(120% 90% at 50% 0%, rgb(var(--c-primary) / .20), transparent 60%), rgb(var(--c-surface));
  border: 1px solid rgb(var(--c-border) / var(--border-a)); }
.stage-portrait { position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%; }
.stage-vignette { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgb(var(--c-bg) / .88)); }
.stage-meta { position: absolute; left: 20px; bottom: 20px; right: 20px; display: flex; align-items: end; justify-content: space-between; gap: 12px; }
.stage-name { font-family: var(--font-head); font-weight: 700; font-size: var(--fs-lg); }
.stage-status { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 600; }

/* Avatar state ring: driven by data-state, honest to the interview state machine */
.stage[data-state="speaking"]  { --state-c: var(--c-secondary); }
.stage[data-state="listening"] { --state-c: var(--c-success); }
.stage[data-state="processing"]{ --state-c: var(--c-primary); }
.stage[data-state="reconnecting"] { --state-c: var(--c-warning); }
.stage::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: inset 0 0 0 2px rgb(var(--state-c, var(--c-border)) / .55); transition: box-shadow var(--dur-slow); }
.thinking-dots span { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: currentColor; animation: dots 1.2s infinite ease-in-out both; }
.thinking-dots span:nth-child(2) { animation-delay: .15s; } .thinking-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes dots { 0%, 80%, 100% { transform: scale(.5); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }

/* Question card */
.question-card { padding: var(--sp-5); }
.question-eyebrow { font-size: var(--fs-xs); letter-spacing: .1em; text-transform: uppercase; color: rgb(var(--c-secondary)); font-weight: 700; }
.question-text { font-family: var(--font-head); font-size: var(--fs-xl); line-height: 1.3; font-weight: 700; margin-top: 8px; }

/* Transcript / captions */
.transcript { overflow-y: auto; display: grid; align-content: start; gap: 12px; padding: var(--sp-4); max-height: 100%; overscroll-behavior: contain; }
.turn { display: grid; gap: 4px; max-width: 92%; }
.turn-who { font-size: var(--fs-xs); font-weight: 700; color: rgb(var(--c-text-3)); text-transform: uppercase; letter-spacing: .08em; }
.turn-text { padding: 10px 14px; border-radius: 14px; background: rgb(var(--c-elevated)); font-size: var(--fs-sm); color: rgb(var(--c-text)); }
.turn[data-role="candidate"] { justify-self: end; }
.turn[data-role="candidate"] .turn-text { background: rgb(var(--c-primary) / .16); }
.turn[data-partial="true"] .turn-text { opacity: .7; font-style: italic; }
.captions { text-align: center; font-size: var(--fs-lg); line-height: 1.4; padding: 12px 16px; border-radius: var(--r-md); background: rgb(var(--c-bg) / .72); }

/* Controls dock */
.dock { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; border-radius: var(--r-xl); }
.ctl { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; border: 1px solid rgb(var(--c-border) / var(--border-strong-a));
  background: rgb(var(--c-elevated)); color: rgb(var(--c-text)); transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast); }
.ctl:active { transform: scale(.94); }
.ctl[aria-pressed="true"] { background: rgb(var(--c-danger) / .16); color: rgb(var(--c-danger)); border-color: rgb(var(--c-danger) / .5); } /* muted */
.ctl-mic { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); color: #fff; border: 0; }
.ctl-end { background: rgb(var(--c-danger)); color: #fff; border: 0; width: auto; padding: 0 20px; border-radius: 999px; font-weight: 700; }

/* Type-answer composer: stays above keyboard */
.composer { display: flex; gap: 8px; align-items: flex-end; padding: 8px; border-radius: var(--r-lg); }
.composer textarea { flex: 1; min-height: 48px; max-height: 140px; border: 0; background: transparent; resize: none; padding: 12px; font-size: 16px; }

/* Interview progress */
.room-progress { display: flex; align-items: center; gap: 12px; font-size: var(--fs-sm); color: rgb(var(--c-text-2)); }
.timer { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

/* Waveform (canvas drawn from a real AnalyserNode; see Waveform component) */
.wave { width: 100%; height: 56px; }
.wave[data-idle="true"] { opacity: .35; } /* flat line when no audio, never fake motion */

/* Code interview panel */
.code-panel { display: grid; grid-template-rows: auto 1fr auto; border-radius: var(--r-lg); overflow: hidden; border: 1px solid rgb(var(--c-border) / var(--border-a)); background: rgb(var(--c-surface)); min-height: 320px; }
.code-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgb(var(--c-border) / var(--border-a)); }
.code-editor { font-family: var(--font-mono); font-size: 13.5px; line-height: 1.6; }
.tests { padding: 8px 12px; border-top: 1px solid rgb(var(--c-border) / var(--border-a)); display: grid; gap: 6px; }
.test { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 12.5px; }
.test[data-status="pass"] { color: rgb(var(--c-success)); } .test[data-status="fail"] { color: rgb(var(--c-danger)); }

/* Mobile room */
@media (max-width: 1023px) {
  .room { grid-template-columns: 1fr; padding: calc(8px + var(--safe-t)) 12px 0; gap: 12px; }
  .stage { min-height: 38dvh; }
  .room-side { grid-template-rows: auto 1fr; }
  /* Dock/composer pinned above keyboard */
  .dock-fixed { position: sticky; bottom: 0; padding-bottom: calc(8px + var(--safe-b)); transform: translateY(calc(var(--kb) * -1)); transition: transform var(--dur-base) var(--ease-out); }
}
```

---

## 8. `report.css`

```css
.score-ring { --size: 168px; --pct: 0; position: relative; width: var(--size); height: var(--size); }
.score-ring svg { transform: rotate(-90deg); }
.score-ring circle { fill: none; stroke-width: 10; stroke-linecap: round; }
.score-ring .track { stroke: rgb(var(--c-border) / .18); }
.score-ring .bar { stroke: url(#ring-grad); stroke-dasharray: 440; stroke-dashoffset: calc(440 - (440 * var(--pct) / 100)); transition: stroke-dashoffset 900ms var(--ease-out); }
.score-ring .value { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.score-ring .value b { font-family: var(--font-head); font-size: 2.5rem; font-weight: 800; line-height: 1; }

.estimate-note { display: flex; gap: 8px; align-items: flex-start; font-size: var(--fs-xs); color: rgb(var(--c-text-2)); padding: 10px 12px; border-radius: var(--r-md); background: rgb(var(--c-secondary) / .08); border: 1px solid rgb(var(--c-secondary) / .25); }

.rubric { display: grid; gap: 14px; }
.rubric-row { display: grid; grid-template-columns: 160px 1fr 56px auto; gap: 12px; align-items: center; }
.rubric-bar { height: 8px; border-radius: 999px; background: rgb(var(--c-border) / .18); overflow: hidden; }
.rubric-bar > span { display: block; height: 100%; width: var(--value); border-radius: inherit; background: linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); }
.rubric-bar[data-level="low"] > span { background: rgb(var(--c-warning)); }
.confidence { font-size: var(--fs-xs); font-weight: 600; } .confidence[data-c="low"] { color: rgb(var(--c-warning)); } .confidence[data-c="high"] { color: rgb(var(--c-success)); }
@media (max-width: 640px) { .rubric-row { grid-template-columns: 1fr auto; } .rubric-bar { grid-column: 1 / -1; order: 3; } }

/* Per-question feedback accordion */
.qfeed { border: 1px solid rgb(var(--c-border) / var(--border-a)); border-radius: var(--r-lg); background: rgb(var(--c-surface)); }
.qfeed summary { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; cursor: pointer; list-style: none; font-weight: 600; }
.qfeed[open] summary { border-bottom: 1px solid rgb(var(--c-border) / var(--border-a)); }
.qfeed-body { padding: 16px 20px; display: grid; gap: 16px; }

/* Evidence quote (links a score to transcript text) */
.evidence { border-left: 3px solid rgb(var(--c-secondary)); padding: 8px 12px; background: rgb(var(--c-secondary) / .07); border-radius: 0 10px 10px 0; font-size: var(--fs-sm); color: rgb(var(--c-text)); }
.evidence cite { display: block; margin-top: 4px; font-style: normal; font-size: var(--fs-xs); color: rgb(var(--c-text-3)); }

.strength { border-left: 3px solid rgb(var(--c-success)); } .improve { border-left: 3px solid rgb(var(--c-warning)); }
.model-answer { font-size: var(--fs-sm); padding: 14px; border-radius: var(--r-md); background: rgb(var(--c-elevated)); border: 1px dashed rgb(var(--c-border) / .3); }

/* Trend chart container (use Recharts or lightweight SVG) */
.chart { height: 220px; } .chart-grid line { stroke: rgb(var(--c-border) / .14); } .chart-line { stroke: rgb(var(--c-primary)); stroke-width: 2.5; fill: none; }
.chart-area { fill: url(#area-grad); } .chart-dot { fill: rgb(var(--c-bg)); stroke: rgb(var(--c-primary)); stroke-width: 2; }
```

---

## 9. `layout.css`

```css
.app { display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); min-height: 100dvh; transition: grid-template-columns var(--dur-slow) var(--ease-out); }
.app[data-collapsed="true"] { grid-template-columns: var(--sidebar-w-collapsed) minmax(0, 1fr); }
.app[data-mode="room"] { grid-template-columns: 1fr; } /* hide global nav during live interview */
.app[data-mode="room"] .sidebar, .app[data-mode="room"] .topbar, .app[data-mode="room"] .bottomnav { display: none; }

.sidebar { position: sticky; top: 0; height: 100dvh; padding: 16px 12px; display: flex; flex-direction: column; gap: 8px;
  border-right: 1px solid rgb(var(--c-border) / var(--border-a)); background: var(--glass-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); }
.brand { display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-family: var(--font-head); font-weight: 800; font-size: 1.15rem; }
.nav-item { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border-radius: var(--r-md); color: rgb(var(--c-text-2)); font-weight: 600; font-size: var(--fs-sm); text-decoration: none; transition: background var(--dur-fast), color var(--dur-fast); }
.nav-item:hover { background: rgb(var(--c-border) / .10); color: rgb(var(--c-text)); }
.nav-item[aria-current="page"] { background: rgb(var(--c-primary) / .16); color: rgb(var(--c-text)); box-shadow: inset 3px 0 0 rgb(var(--c-primary)); }
.app[data-collapsed="true"] .nav-label, .app[data-collapsed="true"] .brand-text { display: none; }

.topbar { position: sticky; top: 0; z-index: var(--z-nav); height: calc(var(--topbar-h) + var(--safe-t)); padding: var(--safe-t) var(--sp-5) 0;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--glass-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
  border-bottom: 1px solid rgb(var(--c-border) / var(--border-a)); }
.main { padding: var(--sp-6) var(--sp-5) var(--sp-10); }
.container { width: 100%; max-width: var(--content-max); margin-inline: auto; }
.grid-cards { display: grid; gap: var(--sp-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
.grid-12 { display: grid; gap: var(--sp-5); grid-template-columns: repeat(12, minmax(0, 1fr)); }

/* Bottom navigation (mobile, 4–5 items) */
.bottomnav { display: none; }
@media (max-width: 1023px) {
  .app { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .main { padding: var(--sp-5) 16px calc(var(--bottomnav-h) + var(--safe-b) + var(--sp-6)); }
  .bottomnav { display: grid; grid-template-columns: repeat(5, 1fr); position: fixed; z-index: var(--z-nav); left: 0; right: 0; bottom: 0;
    height: calc(var(--bottomnav-h) + var(--safe-b)); padding: 6px 8px var(--safe-b);
    background: var(--glass-bg-strong); backdrop-filter: blur(24px) saturate(170%); -webkit-backdrop-filter: blur(24px) saturate(170%);
    border-top: 1px solid rgb(var(--c-border) / var(--border-a)); }
  .bottomnav a { display: grid; place-items: center; gap: 2px; min-height: 48px; font-size: 11px; font-weight: 600; color: rgb(var(--c-text-3)); text-decoration: none; border-radius: 12px; }
  .bottomnav a[aria-current="page"] { color: rgb(var(--c-primary)); background: rgb(var(--c-primary) / .10); }
}

/* Landing sections */
.section { padding: var(--sp-11) var(--sp-5); }
.hero { position: relative; padding: calc(var(--sp-11) + var(--safe-t)) var(--sp-5) var(--sp-10); text-align: center; }
.hero p { max-width: 640px; margin: 20px auto 0; font-size: var(--fs-lg); }
.cta-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px; }
@media (max-width: 640px) { .section { padding: var(--sp-9) 16px; } .cta-row .btn { width: 100%; } }

/* Prevent horizontal overflow from wide content */
.scroll-x { overflow-x: auto; max-width: 100%; }
```

---

## 10. Tailwind mapping

Works with Tailwind v3 `tailwind.config.ts`. For v4, put the same values in an `@theme` block.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
const c = (v: string) => `rgb(var(--c-${v}) / <alpha-value>)`;

export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("bg"), surface: c("surface"), elevated: c("elevated"),
        primary: { DEFAULT: c("primary"), hover: c("primary-hover") },
        secondary: c("secondary"), success: c("success"), warning: c("warning"), danger: c("danger"),
        fg: { DEFAULT: c("text"), 2: c("text-2"), 3: c("text-3") },
      },
      fontFamily: { head: ["var(--font-head)"], ui: ["var(--font-ui)"], mono: ["var(--font-mono)"] },
      borderRadius: { sm: "8px", md: "12px", lg: "16px", xl: "18px" },
      spacing: { 18: "72px", 22: "88px" },
      transitionDuration: { fast: "120ms", base: "200ms", slow: "280ms" },
      maxWidth: { content: "1400px" },
    },
  },
} satisfies Config;
```

Load fonts with `<link rel="preconnect">` and `font-display: swap`, or self-host Manrope, Inter and JetBrains Mono (preferred, avoids a third-party request and layout shift).

---

## 11. React components

### 11.1 ThemeProvider + effects mode
Prevent theme flash with an inline script in `index.html` `<head>`:
```html
<script>
  try {
    var t = localStorage.getItem("theme") || "system";
    var d = t === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
    document.documentElement.dataset.theme = d;
    var e = localStorage.getItem("effects") || "auto";
    var low = (navigator.deviceMemory && navigator.deviceMemory <= 2) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.effects = e === "reduced" || (e === "auto" && low) ? "reduced" : "full";
  } catch (_) {}
</script>
```
```tsx
// shared/theme/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type Theme = "dark" | "light" | "system";
type Effects = "auto" | "full" | "reduced";
const Ctx = createContext<{ theme: Theme; setTheme(t: Theme): void; effects: Effects; setEffects(e: Effects): void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "system");
  const [effects, setEffects] = useState<Effects>(() => (localStorage.getItem("effects") as Effects) || "auto");

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (mq.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#090E1B" : "#F5F7FC");
    };
    apply(); localStorage.setItem("theme", theme);
    mq.addEventListener("change", apply); return () => mq.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    const low = (navigator as any).deviceMemory <= 2 || matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.effects = effects === "reduced" || (effects === "auto" && low) ? "reduced" : "full";
    localStorage.setItem("effects", effects);
  }, [effects]);

  return <Ctx.Provider value={{ theme, setTheme, effects, setEffects }}>{children}</Ctx.Provider>;
}
export const useTheme = () => { const v = useContext(Ctx); if (!v) throw new Error("ThemeProvider missing"); return v; };
```

### 11.2 GlassCard and RgbBorder
```tsx
// shared/ui/GlassCard.tsx
import { forwardRef, type HTMLAttributes } from "react";
type Props = HTMLAttributes<HTMLDivElement> & { strong?: boolean };
export const GlassCard = forwardRef<HTMLDivElement, Props>(({ strong, className = "", ...p }, ref) =>
  <div ref={ref} className={`${strong ? "glass glass-strong" : "glass"} ${className}`} {...p} />);
```
```tsx
// shared/ui/RgbBorder.tsx  (pauses animation when offscreen or tab hidden)
import { useEffect, useRef, type ReactNode } from "react";
type Props = { children: ReactNode; variant?: "trace" | "ring"; active?: boolean; speed?: "slow" | "base" | "fast"; className?: string };

export function RgbBorder({ children, variant = "trace", active, speed = "base", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("rgb-paused", !e.isIntersecting || document.hidden));
    const vis = () => el.classList.toggle("rgb-paused", document.hidden);
    io.observe(el); document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  const cls = [variant === "ring" ? "rgb-ring" : "rgb-trace", active && "is-active", speed === "slow" && "rgb-slow", speed === "fast" && "rgb-fast", className].filter(Boolean).join(" ");
  return <div ref={ref} className={cls}>{children}</div>;
}
```
Usage: `<RgbBorder active={selected}><InterviewerCard .../></RgbBorder>`. The child supplies its own background and radius (`border-radius: inherit` is handled by the wrapper).

### 11.3 AmbientLights
```tsx
export function AmbientLights() {
  return (<div className="ambient" aria-hidden="true"><i className="orb orb-1" /><i className="orb orb-2" /><i className="orb orb-3" /></div>);
}
```
Mount once per layout (landing, auth, dashboard, room), not per card.

### 11.4 Waveform (driven by a real AnalyserNode, no fake motion)
```tsx
import { useEffect, useRef } from "react";

export function Waveform({ analyser, active }: { analyser: AnalyserNode | null; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!; const dpr = devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const color = `rgb(${css.getPropertyValue("--c-secondary")})`;
    const bars = 48, data = new Uint8Array(analyser?.frequencyBinCount ?? 0);
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (analyser && active) analyser.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / bars)), bw = w / bars;
      ctx.fillStyle = color;
      for (let i = 0; i < bars; i++) {
        const v = analyser && active ? data[i * step] / 255 : 0;   // flat when no real audio
        const bh = Math.max(2, v * h);
        ctx.beginPath(); ctx.roundRect(i * bw + 1, (h - bh) / 2, bw - 3, bh, 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) draw(); };
    document.addEventListener("visibilitychange", onVis); draw();
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); };
  }, [analyser, active]);
  return <canvas ref={ref} className="wave" data-idle={!active} role="img" aria-label={active ? "Audio level" : "No audio detected"} />;
}
```

### 11.5 ScoreRing
```tsx
export function ScoreRing({ value, label = "AI estimate" }: { value: number; label?: string }) {
  return (
    <div className="score-ring" style={{ ["--pct" as any]: value }} role="img" aria-label={`Overall score ${value} out of 100, ${label}`}>
      <svg viewBox="0 0 160 160" width="100%" height="100%">
        <defs><linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--c-primary))" /><stop offset="1" stopColor="rgb(var(--c-secondary))" /></linearGradient></defs>
        <circle className="track" cx="80" cy="80" r="70" /><circle className="bar" cx="80" cy="80" r="70" />
      </svg>
      <div className="value"><b className="tabular">{value}</b><span className="hint">{label}</span></div>
    </div>
  );
}
```

### 11.6 Keyboard-safe layout hook (web and Capacitor)
```tsx
import { useEffect } from "react";
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport; if (!vv) return;
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb", `${kb}px`);
    };
    vv.addEventListener("resize", update); vv.addEventListener("scroll", update); update();
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); document.documentElement.style.setProperty("--kb", "0px"); };
  }, []);
}
```
On Android, also set the Capacitor Keyboard plugin's `resize` mode to `"body"` or `"native"` and test on a real device; behaviour varies by WebView version.

---

## 12. Motion spec (Motion for React)

```ts
// shared/motion/variants.ts
export const ease = [0.22, 1, 0.36, 1] as const;
export const dur = { fast: 0.12, base: 0.2, slow: 0.28 };

export const pageVariants = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: { duration: dur.base, ease } }, exit: { opacity: 0, transition: { duration: dur.fast } } };
export const dialogVariants = { initial: { opacity: 0, scale: .96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.slow, ease } }, exit: { opacity: 0, scale: .98, transition: { duration: dur.base } } };
export const sheetVariants = { initial: { y: "100%" }, animate: { y: 0, transition: { duration: dur.slow, ease } }, exit: { y: "100%", transition: { duration: dur.base } } };
export const listStagger = { animate: { transition: { staggerChildren: .04 } } };
export const itemVariants = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0, transition: { duration: dur.base, ease } } };
export const tap = { scale: .97, transition: { duration: dur.fast } };
```
Wrap the app in `<MotionConfig reducedMotion="user">` so Motion respects `prefers-reduced-motion` automatically. Rules: stagger only the first screenful of a list; animate `opacity` and `transform` only; never block input during a transition; no scroll-jacking; success feedback = a checkmark morph plus a toast, under 400ms total.

---

## 13. Screen-by-screen UI map

| # | Screen | Layout | Key components | Effects used |
|---|---|---|---|---|
| 1 | **Landing** | Full-bleed hero, then 8 stacked sections | Hero with `hero-title`, CTA row, product demo card (labelled demo), interviewer preview carousel, 3-step how-it-works, category grid, sample report (labelled sample), privacy panel, FAQ accordion, footer | AmbientLights; one `rgb-trace` on the primary CTA; glass on nav and hero card |
| 2 | **Auth** | Centered split: brand panel + form (stacked on mobile) | Inputs, OAuth button, inline errors, password strength, verify-email state, reset flow, loading button | AmbientLights; glass-strong form card |
| 3 | **Dashboard** | 12-col grid: greeting + Start Interview hero (8) / streak + stats (4); recent sessions; progress chart; recommended practice; resume-last-session card | Stat cards, progress chart, session list rows, recommendation cards, skeletons | `rgb-trace` on the Start Interview card only; ambient backdrop |
| 4 | **Interview setup** | Stepper wizard, summary rail on desktop | Category cards (7 types), selects, chips, sliders (duration, question count), resume dropzone with progress, consent checkbox | Active category gets accent border (no animation) |
| 5 | **Interviewer selection** | Grid of tall crisp cards | `glass-crisp` portrait card, "Virtual AI interviewer" `badge-ai`, personality, languages, difficulty style, voice preview button, selected check | Selected card wrapped in `rgb-trace` |
| 6 | **Device check** | Centered checklist with live meters | Mic permission card, input picker, level meter, speaker test button, camera preview toggle, connection status, troubleshooting accordion, "Use typed answers" link | None (utility screen) |
| 7 | **Live room** | 2-col desktop (stage + side); mobile stacked; nav hidden | Stage with state ring, question card, captions, transcript, waveform, dock (mute, mic, camera, type, settings, end), composer, progress + timer, reconnect banner, end-confirm dialog, code panel for coding | `rgb-trace` on the question card and the active mic only; ambient backdrop dimmed |
| 8 | **Report** | Hero summary row, then tabs: Overview / Questions / Transcript | Score ring, estimate note, rubric bars with confidence, strengths/improvements, per-question accordion with evidence, model answers, "Why this score?" drawer, dispute button, drill plan, next-practice CTA | No glass or borders animation in the body (readability) |
| 9 | **Practice** | Filter bar + results grid + side drawer | Topic chips, difficulty filter, saved toggle, question cards, answer textarea, hint reveal, explanation panel | None |
| 10 | **History** | Search + filter row, table (desktop) / cards (mobile), comparison chart | Search input, filter sheet, session rows, trend chart, compare-two-sessions view | None |
| 11 | **Profile/Settings** | Left sub-nav + sections (single column on mobile) | Goals, target roles tag input, language, audio settings, theme switcher (Dark/Light/System), Reduce-effects switch, privacy and retention controls, export, delete account dialog, logout | None |
| 12 | **System states** | Reusable | Skeleton sets per screen, `empty`, `error-state` with Retry, offline banner, permission-denied guide, rate-limit notice with countdown, session-expiry dialog, upload progress, success toast | None |

**Mobile nav items (5):** Home, Practice, Interview (center, prominent), History, Profile. Settings reachable from Profile.

---

## 14. Component inventory and required states

Every component below must be implemented with **default, hover, focus-visible, active, disabled, loading, error** where applicable, in **both themes**.

**Primitives:** Button (primary, secondary, ghost, danger, success, icon, loading) · Input · Textarea · Select · Slider · Switch · Checkbox · Radio · Chip · Tabs · Badge (incl. Demo, AI) · Tooltip · Avatar · Progress · Stepper · Skeleton · Spinner · Divider · Kbd

**Containers:** Card · GlassCard · CrispCard · RgbBorder · Accordion · Dialog · Drawer · BottomSheet · Popover · Dropdown · Toast

**Navigation:** Sidebar (expanded/collapsed) · TopBar · BottomNav · Breadcrumb · SkipLink · Pagination

**Feature components:** InterviewerCard · CategoryCard · SessionRow · StatCard · StreakCard · RecommendationCard · QuestionCard · TranscriptTurn · CaptionBar · Waveform · MicControl · DeviceMeter · ConnectionIndicator · AvatarStage · CodePanel · TestCaseList · ScoreRing · RubricRow · EvidenceQuote · FeedbackAccordion · ModelAnswer · TrendChart · DropzoneUpload · ConsentPanel · ThemeSwitch · EffectsSwitch

**State components:** EmptyState · ErrorState · OfflineBanner · PermissionDenied · RateLimitNotice · SessionExpiredDialog · UploadProgress · SuccessToast · DemoModeBanner

---

## 15. Accessibility, performance and Android rules

**Accessibility**
- Contrast: body text 4.5:1, large text and UI boundaries 3:1 in both themes. Test glass surfaces against the *worst-case* background (an orb behind them), not the average.
- Every interactive element is keyboard reachable; focus ring is always visible (`:focus-visible`).
- Captions use `aria-live="polite"`; connection and error banners use `role="status"` / `role="alert"`.
- Icon-only buttons need `aria-label`; the waveform has a text alternative; state is never conveyed by color alone (icons and text accompany color).
- Forms: labels tied to inputs, errors linked with `aria-describedby`, focus moved to the first error on submit.
- Text zoom to 200% without clipping; touch targets at least 44px (48px on mobile where possible).

**Performance**
- Backdrop blur on at most 4 elements at once; no blur on scrolling lists or large full-screen layers other than the nav chrome.
- Animate only `transform` and `opacity` (the revolving border animates a registered custom property on a small pseudo-element, so keep it to 2 per viewport).
- Pause all decorative animation when the tab is hidden or the element is offscreen. Lazy-load below-the-fold landing sections; use AVIF/WebP portraits with explicit `width`/`height` to prevent layout shift.
- Targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75. Profile the live room on a mid-range Android phone with effects on and off.

**Android WebView (Capacitor)**
- Add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and use the `--safe-*` variables everywhere fixed UI touches an edge.
- Older WebViews may lack `@property` or `backdrop-filter`; the `@supports` fallbacks in `effects.css` provide a static gradient ring and a solid surface. Test on a real device.
- Use `100dvh` for full-height layouts; test rotation and keyboard resize on the room and auth screens.
- Style status and navigation bars to match the active theme and update them when the theme changes.

**Honesty rules for the UI**
- Persona cards always show "Virtual AI interviewer".
- The stage never claims lip-sync unless a real avatar service is configured; otherwise it shows state-driven animation (idle, listening, thinking, speaking).
- Scores are labelled "AI estimate" with a limitations link; seed and sample content carries the `badge-demo` label.
- Disabled controls always explain why (tooltip or helper text).
