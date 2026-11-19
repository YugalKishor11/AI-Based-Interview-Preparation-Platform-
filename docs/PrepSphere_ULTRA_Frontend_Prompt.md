# PREPSPHERE — ULTRA PRO MAX FRONTEND BUILD PROMPT
**One self-contained prompt. Paste everything between `BEGIN PROMPT` and `END PROMPT` into a brand-new AI coding agent (Claude Code, Cursor, Windsurf, Codex, Lovable, Bolt, etc.). It needs no other file.**

**Human notes (not part of the prompt)**
- Scope: the **complete frontend only**, running on realistic **mock data**, with real browser microphone access. No backend, no auth server, no paid APIs. A later phase swaps the mock data layer for Supabase without rewriting screens.
- Best results: use an agent that can run shell commands, a dev server and Playwright screenshots. If your tool is a plain chat window, the prompt includes a "continue" protocol for splitting output across messages.
- After it finishes, run `npm run build && npm run preview` to judge the visuals (the dev server is slower and makes animation look worse).

---

<!-- ===================== BEGIN PROMPT ===================== -->

# ROLE

You are a principal product designer, design-systems engineer and senior React/TypeScript engineer with a decade of experience shipping premium SaaS interfaces (the polish level of Linear, Vercel, Stripe, Raycast and Arc). You obsess over visual hierarchy, depth, motion quality, accessibility and performance. You do not produce generic admin-template UIs.

# MISSION

Build **PrepSphere**, a premium AI Interview Preparation Platform, as a **complete, fully clickable, production-quality frontend** for web (and later Android WebView via Capacitor). Candidates practice job interviews by voice with a **virtual AI interviewer**, then read an evidence-linked report and follow a targeted drill plan.

**This phase is FRONTEND ONLY.** Everything runs in the browser on realistic mock data behind a repository layer, so a backend (Supabase) can be added later without rewriting any screen. The result must look so good that the product owner is excited at first glance: cinematic dark theme AND a refined light theme, liquid-glass surfaces, moving ambient lights, and revolving RGB-light borders, all performance- and accessibility-safe.

# 1. NON-NEGOTIABLE RULES

1. **Frontend only.** No backend, no auth service, no paid API keys, no network calls to third-party AI. Mock data only (through repositories, see §9).
2. **Honesty.** Every mock record has `isDemo: true`. Show `Demo`, `Sample` or `Preview` badges wherever mock content appears. Never present mock scores, transcripts or audio as real evaluation. Virtual interviewers are always labelled **"Virtual AI interviewer"**; never imply a real person or recruiter. Never claim live lip-sync; the interviewer visual is a state-driven animated orb/portrait. No fake customer logos, testimonials, user counts or awards anywhere.
3. **Real audio only.** The device check and live room use the real browser microphone (`getUserMedia`) and a real `AnalyserNode` for level meters and waveform. If there is no audio the waveform is flat. Never fake audio activity.
4. **Every visible button works** or is `disabled` with an explanation (tooltip/helper text). Every form validates (Zod). Every data screen has loading (skeleton), empty, error (with retry), and success states.
5. **Visual quality is a hard requirement**, not a nice-to-have. A screen that looks flat, sparse, or like a generic admin template FAILS (see §14 rubric). Do not use plain solid cards for hero/feature content.
6. **Accessibility:** WCAG AA contrast in both themes (including text over glass on top of glowing orbs), full keyboard operation, visible focus rings, ARIA labels/live regions, 44px+ touch targets, 200% text zoom.
7. **Performance:** LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (p75 targets). Route-level code splitting, lazy below-the-fold sections, transform/opacity-only animation, no layout shift from fonts/images.
8. **Reduced motion is NOT "no visuals".** `prefers-reduced-motion` stops *animation* only (orbs and borders freeze in an attractive static pose; glass, gradients and colors stay). A separate user setting, **Reduce effects**, swaps glass and lights for solid surfaces. Never let a system motion setting make the product look flat.
9. **No secrets, no `localStorage` of sensitive data.** Only theme, effects mode, drafts and demo state are stored locally.
10. **Do not stop early.** Complete every milestone in §3, run the checks, fix failures, and finish with the report in §16.

# 2. OPERATING PROTOCOL

- First, inspect the working directory. If a project exists, do not overwrite working code blindly; adapt. If empty, scaffold.
- Work milestone by milestone (§3). After each milestone: run `typecheck`, `lint`, `test`, `build`; fix everything; then do a **visual self-review** (§14.3) and fix until the rubric passes.
- Keep a running `/docs/BUILD_LOG.md` (what was built, decisions, deviations, known gaps).
- If you are a chat-only model with no file system: output files in order, each under a header `### FILE: path/to/file`, and when you reach your output limit end with `⟶ CONTINUE (next: <file or milestone>)` and wait for the user to say "continue". Never skip or summarize files with "…rest unchanged".
- Prefer writing complete files over fragments. No placeholder comments like `// TODO implement`.
- Use latest stable, mutually compatible versions of dependencies (check with `npm view`); record pinned versions in the README.

# 3. MILESTONES (do in order)

| # | Milestone | Done when |
|---|---|---|
| M0 | Scaffold, tooling, fonts, folder layout | App boots; scripts run |
| M1 | Design system CSS, theme + effects providers, primitives | Showcase renders in both themes |
| M2 | Component library + `/dev/showcase` | Every component and state visible |
| ★ | **Visual checkpoint A**: showcase must already look premium (rubric ≥ 4/5) | Screenshot taken and reviewed |
| M3 | App shell, navigation, routing, system states, dev tools | All routes resolve |
| M4 | Data layer, contracts, mock repos, seed data, query hooks | Unit tests pass |
| M5 | Landing page | Rubric pass |
| M6 | Auth screens + onboarding (mock) | Flow works |
| M7 | Dashboard | Dense, premium, no empty zones |
| M8 | Interview setup + interviewer selection | Wizard works |
| M9 | Device check (real mic) | Meters work |
| M10 | Live interview room (demo engine) | Full demo interview completes |
| M11 | Report | Evidence + drawer work |
| M12 | Practice, History, Settings, Credits | All controls functional |
| M13 | QA: tests, screenshots, axe, Lighthouse, polish | §14 all green |

# 4. PRODUCT CONTEXT

**Core loop:** Setup → Interviewer → Device check → Live voice interview → Evidence-based report → Targeted drills → Re-interview → Progress comparison.

**Differentiators to express in UI and copy:** evidence-linked scoring (every score cites transcript quotes with a confidence level and a "report an error" action); content vs delivery scored separately; one voice flow for technical, HR, behavioral, DSA, system design, coding and resume-based interviews; 7-day drill plan after each report; before/after progress; privacy and fairness (no scoring of accent, gender, appearance or disability; no facial-emotion or personality claims; recordings off by default; easy deletion); transparent credits.

**Non-goals:** no "live interview copilot" that feeds answers during real interviews (practice only); no payments; no real AI in this phase.

**Voice of the brand:** confident, calm, precise, encouraging, never hypey. Short sentences.

**Demo user:** Alex Chen, targeting "Staff Engineer", 4-day streak, 120 credits.

# 5. TECH STACK AND PROJECT STRUCTURE

**Stack:** Vite + React + TypeScript (strict), Tailwind CSS (latest stable; CSS-variable driven, see §6.10), shadcn/ui *only* as accessible unstyled-ish primitives (Dialog, Sheet, Tabs, Accordion, Select, Tooltip, Popover, DropdownMenu, Switch, Slider) restyled to the tokens below, Lucide React, Motion for React (`import { motion } from "motion/react"`), React Router (latest stable), TanStack Query, Zod, Vitest + Testing Library, Playwright, `@axe-core/playwright`. Self-host fonts with `@fontsource-variable/manrope`, `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`. Charts: **hand-written SVG components** (no heavy chart library). Code editor: lightweight styled textarea with line-number gutter (or CodeMirror 6, lazy-loaded). No Monaco.

**Scripts:** `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `e2e`, `screenshots`.

**Structure:**
```text
src/
  app/            router.tsx, providers.tsx, layouts/{PublicLayout,AppLayout,RoomLayout}
  features/
    landing/ auth/ onboarding/ dashboard/ setup/ interviewers/ device/
    room/ report/ practice/ history/ settings/ credits/ showcase/
  shared/
    ui/           Button, Input, Select, Slider, Switch, Chip, Badge, Tabs, Dialog, Sheet, Toast, Tooltip,
                  Skeleton, Progress, Stepper, Dropzone, EmptyState, ErrorState, GlassCard, RgbBorder,
                  AmbientLights, PersonaArt, AiOrb, ScoreRing, Sparkline, AreaChart, RadarChart, Waveform
    theme/        ThemeProvider.tsx (theme + effects)
    motion/       variants.ts
    hooks/        useSpotlight, useKeyboardInset, useOnline, useAudioLevel, useInViewPause, useCountUp
    lib/          cn.ts, format.ts, a11y.ts
  data/
    contracts/    Zod schemas + inferred types (single source of truth)
    repos/        interfaces.ts
    mock/         repos + seed.ts (in-memory + localStorage persistence of user-changed state)
    index.ts      exports repos chosen by import.meta.env.VITE_DATA_SOURCE (default "mock")
  styles/         tokens.css base.css effects.css components.css layout.css interview.css report.css index.css
```
`.env.example`: `VITE_DATA_SOURCE=mock` and `VITE_SHOW_DEV=true` (dev tools and `/dev/showcase` are visible when `import.meta.env.DEV` or `VITE_SHOW_DEV==="true"`).

# 6. DESIGN SYSTEM (implement exactly; this is the visual source of truth)

## 6.1 Principles and effect budget
Cinematic, confident, calm. **Depth through layers:** mesh-gradient page background → drifting orbs → glass surfaces with gradient hairlines → content. Glass needs colorful content behind it; therefore orbs are clearly visible (not faint).

| Effect | Limit per viewport (desktop) |
|---|---|
| Glass surfaces with `backdrop-filter` | 6 on app screens, 8 on landing; 3 on mobile |
| Animated RGB border | 3 (hero card, selected item, primary CTA); hover bloom extra |
| Orbs | 4 + mesh gradient, one layer per layout |
Never apply glass, glow or animated borders to: long text blocks, tables, report body, list rows, code editor.

## 6.2 `tokens.css`
```css
:root, :root[data-theme="dark"] {
  color-scheme: dark;
  --c-bg: 9 14 27;  --c-surface: 17 24 42;  --c-elevated: 25 35 58;  --c-overlay: 5 8 16;
  --c-primary: 139 92 246;  --c-primary-hover: 124 77 232;
  --c-secondary: 34 211 238; --c-success: 52 211 153; --c-warning: 251 191 36;
  --c-danger: 248 113 113;   --c-accent-pink: 244 114 182;
  --c-text: 241 245 249; --c-text-2: 165 180 204; --c-text-3: 125 140 168; --c-on-primary: 255 255 255;
  --c-border: 165 180 204; --border-a: .14; --border-strong-a: .26;
  --glass-bg: rgb(25 35 58 / .55); --glass-bg-strong: rgb(25 35 58 / .80);
  --glass-border: rgb(255 255 255 / .10); --glass-highlight: rgb(255 255 255 / .16);
  --glass-shadow: 0 12px 40px rgb(0 0 0 / .35);
  --orb-violet: rgb(139 92 246 / .55); --orb-cyan: rgb(34 211 238 / .38);
  --orb-green: rgb(52 211 153 / .22);  --orb-pink: rgb(244 114 182 / .20);
  --shadow-1: 0 1px 2px rgb(0 0 0 / .30); --shadow-2: 0 6px 20px rgb(0 0 0 / .30); --shadow-3: 0 18px 48px rgb(0 0 0 / .42);
  --ring: 0 0 0 3px rgb(139 92 246 / .45);
}
:root[data-theme="light"] {
  color-scheme: light;
  --c-bg: 245 247 252; --c-surface: 255 255 255; --c-elevated: 237 241 250; --c-overlay: 15 23 42;
  --c-primary: 124 58 237; --c-primary-hover: 109 40 217;
  --c-secondary: 8 145 178; --c-success: 5 150 105; --c-warning: 180 83 9;
  --c-danger: 220 38 38;    --c-accent-pink: 219 39 119;
  --c-text: 11 18 32; --c-text-2: 71 85 105; --c-text-3: 100 116 139; --c-on-primary: 255 255 255;
  --c-border: 15 23 42; --border-a: .10; --border-strong-a: .22;
  --glass-bg: rgb(255 255 255 / .62); --glass-bg-strong: rgb(255 255 255 / .86);
  --glass-border: rgb(255 255 255 / .85); --glass-highlight: rgb(255 255 255 / .95);
  --glass-shadow: 0 12px 40px rgb(15 23 42 / .10);
  --orb-violet: rgb(124 58 237 / .30); --orb-cyan: rgb(8 145 178 / .24);
  --orb-green: rgb(5 150 105 / .14);   --orb-pink: rgb(219 39 119 / .12);
  --shadow-1: 0 1px 2px rgb(15 23 42 / .08); --shadow-2: 0 6px 20px rgb(15 23 42 / .10); --shadow-3: 0 18px 48px rgb(15 23 42 / .16);
  --ring: 0 0 0 3px rgb(124 58 237 / .35);
}
:root {
  --font-head: "Manrope Variable", "Manrope", system-ui, sans-serif;
  --font-ui: "Inter Variable", "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace;
  --fs-xs: .75rem; --fs-sm: .875rem; --fs-md: 1rem; --fs-lg: 1.125rem; --fs-xl: 1.375rem; --fs-2xl: 1.75rem;
  --fs-3xl: clamp(2rem, 1.4rem + 2vw, 2.75rem);
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 40px; --sp-8: 48px; --sp-9: 64px; --sp-10: 80px; --sp-11: 96px;
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 18px; --r-pill: 999px;
  --dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 280ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1); --ease-in-out: cubic-bezier(.65, 0, .35, 1);
  --sidebar-w: 264px; --sidebar-w-collapsed: 76px; --topbar-h: 64px; --bottomnav-h: 64px; --content-max: 1400px;
  --safe-t: env(safe-area-inset-top, 0px); --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px); --safe-r: env(safe-area-inset-right, 0px); --kb: 0px;
  --z-bg: -1; --z-nav: 40; --z-sheet: 60; --z-dialog: 70; --z-toast: 80;
}
```

## 6.3 `base.css`
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; height: 100%; }
body { margin: 0; min-height: 100%; color: rgb(var(--c-text)); font-family: var(--font-ui); font-size: 1rem; line-height: 1.55;
  -webkit-font-smoothing: antialiased; overflow-x: hidden;
  background:
    radial-gradient(1200px 640px at 12% -8%, rgb(var(--c-primary) / .20), transparent 62%),
    radial-gradient(900px 520px at 100% 8%, rgb(var(--c-secondary) / .14), transparent 62%),
    radial-gradient(800px 480px at 50% 110%, rgb(var(--c-success) / .08), transparent 62%),
    rgb(var(--c-bg));
  background-attachment: fixed; }
h1,h2,h3,h4 { font-family: var(--font-head); margin: 0; line-height: 1.15; font-weight: 700; letter-spacing: -.015em; }
h1 { font-size: var(--fs-3xl); } h2 { font-size: var(--fs-2xl); } h3 { font-size: var(--fs-xl); } h4 { font-size: var(--fs-lg); }
.hero-title { font-size: clamp(2.6rem, 1.5rem + 4.6vw, 5rem); line-height: 1.04; letter-spacing: -.025em; font-weight: 800; text-wrap: balance; }
.eyebrow { font-size: var(--fs-xs); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgb(var(--c-secondary)); }
.lead { font-size: clamp(1.05rem, .95rem + .5vw, 1.25rem); line-height: 1.6; max-width: 62ch; }
p { margin: 0; color: rgb(var(--c-text-2)); }
code, pre, kbd, .mono { font-family: var(--font-mono); font-size: .92em; }
img, svg, video, canvas { max-width: 100%; display: block; }
button, input, select, textarea { font: inherit; color: inherit; }
a { color: rgb(var(--c-secondary)); text-underline-offset: 3px; }
:focus { outline: none; }
:focus-visible { outline: 2px solid rgb(var(--c-primary)); outline-offset: 2px; box-shadow: var(--ring); border-radius: var(--r-sm); }
.skip-link { position: absolute; left: 8px; top: -48px; z-index: 100; background: rgb(var(--c-primary)); color: #fff; padding: 8px 16px; border-radius: var(--r-md); }
.skip-link:focus { top: calc(8px + var(--safe-t)); }
* { scrollbar-width: thin; scrollbar-color: rgb(var(--c-border) / .35) transparent; }
::selection { background: rgb(var(--c-primary) / .35); }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.tabular { font-variant-numeric: tabular-nums; }
.text-gradient { background: linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-secondary)), rgb(var(--c-success)));
  -webkit-background-clip: text; background-clip: text; color: transparent; }
/* Reduced motion: stop transitions/animations only; visuals stay (see rule 8). */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
```

## 6.4 `effects.css` (glass, RGB borders, ambient lights)
```css
@property --angle { syntax: "<angle>"; initial-value: 40deg; inherits: false; }
@keyframes rgb-spin { to { --angle: 400deg; } }

/* ---------- Liquid glass ---------- */
.glass { position: relative; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--r-xl);
  backdrop-filter: blur(20px) saturate(165%); -webkit-backdrop-filter: blur(20px) saturate(165%);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--glass-shadow); }
.glass-strong { background: var(--glass-bg-strong); backdrop-filter: blur(28px) saturate(180%); -webkit-backdrop-filter: blur(28px) saturate(180%); }

/* Premium glass card: gradient face, cursor spotlight, hairline highlight. Use for hero/feature/stat cards. */
.gcard { position: relative; overflow: hidden; border-radius: var(--r-xl); padding: var(--sp-5);
  background: linear-gradient(180deg, rgb(255 255 255 / .08), rgb(255 255 255 / .02)), var(--glass-bg);
  backdrop-filter: blur(22px) saturate(175%); -webkit-backdrop-filter: blur(22px) saturate(175%);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 1px rgb(255 255 255 / .03), var(--glass-shadow);
  transition: transform var(--dur-base) var(--ease-out), border-color var(--dur-base), box-shadow var(--dur-base); }
:root[data-theme="light"] .gcard { background: linear-gradient(180deg, rgb(255 255 255 / .92), rgb(255 255 255 / .62)); box-shadow: inset 0 1px 0 #fff, var(--glass-shadow); }
.gcard::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .25s;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgb(var(--c-primary) / .22), transparent 62%); }
.gcard::after { content: ""; position: absolute; left: 12%; right: 12%; top: 0; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgb(var(--c-secondary) / .7), rgb(var(--c-primary) / .7), transparent); }
.gcard:hover::before { opacity: 1; }
.gcard.is-interactive:hover { transform: translateY(-2px); border-color: rgb(var(--c-primary) / .5); }

/* Crisp tall container (persona cards, feature columns) */
.glass-crisp { background: linear-gradient(180deg, rgb(var(--c-elevated) / .85), rgb(var(--c-surface) / .92));
  border: 1px solid rgb(var(--c-border) / var(--border-a)); border-radius: var(--r-xl); box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-2); overflow: hidden; }

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .glass, .glass-strong, .gcard { background: rgb(var(--c-elevated)); } }
:root[data-effects="reduced"] .glass, :root[data-effects="reduced"] .glass-strong, :root[data-effects="reduced"] .gcard {
  backdrop-filter: none; -webkit-backdrop-filter: none; background: rgb(var(--c-elevated)); }
:root[data-effects="reduced"] .gcard::before { display: none; }
@media (prefers-reduced-transparency: reduce) { .glass, .glass-strong, .gcard { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgb(var(--c-elevated)); } }

/* ---------- Revolving RGB border ---------- */
.rgb-ring, .rgb-trace { position: relative; isolation: isolate; border-radius: var(--r-xl); }
.rgb-ring::before { content: ""; position: absolute; inset: 0; padding: 2px; border-radius: inherit; z-index: -1;
  background: conic-gradient(from var(--angle), rgb(var(--c-primary)), rgb(var(--c-secondary)), rgb(var(--c-success)), rgb(var(--c-accent-pink)), rgb(var(--c-primary)));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
  animation: rgb-spin 6s linear infinite; }
/* Default premium style: one bright light travelling around a faint static border */
.rgb-trace::before { content: ""; position: absolute; inset: 0; padding: 2px; border-radius: inherit; z-index: -1;
  background:
    conic-gradient(from var(--angle), transparent 0 52%, rgb(var(--c-primary)) 66%, rgb(var(--c-secondary)) 78%, rgb(var(--c-success)) 88%, rgb(var(--c-accent-pink)) 95%, transparent 100%),
    linear-gradient(rgb(var(--c-border) / .30), rgb(var(--c-border) / .30));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
  animation: rgb-spin 4.5s linear infinite; }
/* Soft bloom: always on for the ONE hero card per screen (.rgb-hero), hover/active for others */
.rgb-hero::after, .rgb-trace.is-active::after, .rgb-trace.is-bloom:hover::after {
  content: ""; position: absolute; inset: -3px; border-radius: inherit; z-index: -2; pointer-events: none; opacity: .5;
  background: conic-gradient(from var(--angle), transparent 0 52%, rgb(var(--c-primary) / .9) 66%, rgb(var(--c-secondary) / .9) 80%, transparent 100%);
  filter: blur(18px); animation: rgb-spin 4.5s linear infinite; }
:root[data-theme="light"] .rgb-hero::after { opacity: .35; }
.rgb-slow::before, .rgb-slow::after { animation-duration: 9s; } .rgb-fast::before, .rgb-fast::after { animation-duration: 3s; }
.rgb-paused::before, .rgb-paused::after { animation-play-state: paused; }
@supports not (background: conic-gradient(from 0deg, red, blue)) {
  .rgb-ring::before, .rgb-trace::before { background: linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); animation: none; } }
:root[data-effects="reduced"] .rgb-ring::before, :root[data-effects="reduced"] .rgb-trace::before { animation: none; }
:root[data-effects="reduced"] .rgb-hero::after, :root[data-effects="reduced"] .rgb-trace::after { display: none; }
@media (prefers-reduced-motion: reduce) { .rgb-ring::before, .rgb-trace::before, .rgb-hero::after { animation: none; } } /* static pose (--angle: 40deg), still visible */

/* ---------- Ambient lights ---------- */
.ambient { position: fixed; inset: 0; z-index: var(--z-bg); overflow: hidden; pointer-events: none; contain: strict; }
.ambient .orb { position: absolute; border-radius: 50%; will-change: transform; }
.ambient .orb-1 { width: 70vmax; height: 70vmax; left: -20vmax; top: -24vmax; background: radial-gradient(circle, var(--orb-violet), transparent 62%); animation: drift-1 32s var(--ease-in-out) infinite alternate; }
.ambient .orb-2 { width: 62vmax; height: 62vmax; right: -18vmax; top: 4vmax; background: radial-gradient(circle, var(--orb-cyan), transparent 62%); animation: drift-2 38s var(--ease-in-out) infinite alternate; }
.ambient .orb-3 { width: 52vmax; height: 52vmax; left: 22vmax; bottom: -26vmax; background: radial-gradient(circle, var(--orb-green), transparent 62%); animation: drift-3 44s var(--ease-in-out) infinite alternate; }
.ambient .orb-4 { width: 40vmax; height: 40vmax; right: 18vmax; bottom: -10vmax; background: radial-gradient(circle, var(--orb-pink), transparent 62%); animation: drift-2 48s var(--ease-in-out) infinite alternate-reverse; }
.ambient::after { content: ""; position: absolute; inset: 0;
  background-image: linear-gradient(rgb(var(--c-border) / .05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-border) / .05) 1px, transparent 1px);
  background-size: 48px 48px; mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%); -webkit-mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%); }
@keyframes drift-1 { to { transform: translate3d(10vmax, 8vmax, 0) scale(1.08); } }
@keyframes drift-2 { to { transform: translate3d(-12vmax, 10vmax, 0) scale(1.12); } }
@keyframes drift-3 { to { transform: translate3d(8vmax, -9vmax, 0) scale(1.06); } }
.ambient.is-paused .orb { animation-play-state: paused; }
:root[data-effects="reduced"] .ambient .orb { animation: none; opacity: .5; }
@media (prefers-reduced-motion: reduce) { .ambient .orb { animation: none; } } /* orbs stay visible, just still */
```

## 6.5 `components.css`
```css
/* Buttons */
.btn { --h: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: var(--h); padding: 0 20px;
  border-radius: var(--r-md); border: 1px solid transparent; font-weight: 600; font-size: var(--fs-sm); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast), opacity var(--dur-fast); }
.btn:active:not(:disabled) { transform: scale(.97); } .btn:disabled, .btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
.btn-lg { --h: 52px; padding: 0 28px; font-size: 1rem; border-radius: var(--r-lg); } .btn-sm { --h: 36px; padding: 0 14px; font-size: var(--fs-xs); } .btn-icon { width: var(--h); padding: 0; }
.btn-primary { background: linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary-hover))); color: #fff; box-shadow: 0 6px 18px rgb(var(--c-primary) / .30), inset 0 1px 0 rgb(255 255 255 / .22); }
.btn-primary:hover:not(:disabled) { box-shadow: 0 8px 26px rgb(var(--c-primary) / .45), inset 0 1px 0 rgb(255 255 255 / .28); }
.btn-secondary { background: rgb(var(--c-elevated)); border-color: rgb(var(--c-border) / var(--border-a)); }
.btn-secondary:hover:not(:disabled) { border-color: rgb(var(--c-border) / var(--border-strong-a)); }
.btn-ghost { background: transparent; color: rgb(var(--c-text-2)); } .btn-ghost:hover:not(:disabled) { background: rgb(var(--c-border) / .10); color: rgb(var(--c-text)); }
.btn-danger { background: rgb(var(--c-danger) / .14); color: rgb(var(--c-danger)); border-color: rgb(var(--c-danger) / .35); }
.btn-success { background: rgb(var(--c-success) / .16); color: rgb(var(--c-success)); border-color: rgb(var(--c-success) / .35); }
.spinner { width: 16px; height: 16px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }

/* Forms */
.field { display: grid; gap: 6px; } .label { font-size: var(--fs-sm); font-weight: 600; } .hint { font-size: var(--fs-xs); color: rgb(var(--c-text-3)); }
.input, .select, .textarea { width: 100%; min-height: 48px; padding: 0 14px; border-radius: var(--r-md); background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-strong-a)); font-size: 16px;
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast); }
.textarea { padding: 12px 14px; min-height: 120px; resize: vertical; } .input::placeholder, .textarea::placeholder { color: rgb(var(--c-text-3)); }
.input:focus-visible, .select:focus-visible, .textarea:focus-visible { border-color: rgb(var(--c-primary)); box-shadow: var(--ring); outline: none; }
.input[aria-invalid="true"] { border-color: rgb(var(--c-danger)); } .error-text { font-size: var(--fs-xs); color: rgb(var(--c-danger)); display: flex; gap: 6px; align-items: center; }
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: var(--r-pill); background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); color: rgb(var(--c-text-2)); font-size: var(--fs-sm); font-weight: 500; cursor: pointer; transition: all var(--dur-fast); }
.chip:hover { color: rgb(var(--c-text)); border-color: rgb(var(--c-border) / var(--border-strong-a)); }
.chip[aria-pressed="true"], .chip[aria-checked="true"] { background: rgb(var(--c-primary) / .16); color: rgb(var(--c-text)); border-color: rgb(var(--c-primary) / .6); }
.switch { position: relative; width: 48px; height: 28px; border-radius: 999px; background: rgb(var(--c-border) / .3); border: 0; cursor: pointer; transition: background var(--dur-base); }
.switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: var(--shadow-1); transition: transform var(--dur-base) var(--ease-out); }
.switch[aria-checked="true"] { background: rgb(var(--c-primary)); } .switch[aria-checked="true"]::after { transform: translateX(20px); }
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: linear-gradient(90deg, rgb(var(--c-primary)) var(--fill, 50%), rgb(var(--c-border) / .25) var(--fill, 50%)); }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid rgb(var(--c-primary)); box-shadow: var(--shadow-2); cursor: pointer; }
.slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid rgb(var(--c-primary)); cursor: pointer; }
.dropzone { display: grid; place-items: center; gap: 8px; text-align: center; padding: 32px; min-height: 160px; border: 1.5px dashed rgb(var(--c-border) / .35); border-radius: var(--r-lg); background: rgb(var(--c-surface) / .6); transition: all var(--dur-base); }
.dropzone[data-drag="true"] { border-color: rgb(var(--c-secondary)); background: rgb(var(--c-secondary) / .08); }

/* Cards, badges */
.card { background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); border-radius: var(--r-lg); padding: var(--sp-5); box-shadow: var(--shadow-1); } /* dense rows only */
.badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 600; background: rgb(var(--c-border) / .14); color: rgb(var(--c-text-2)); }
.badge-primary { background: rgb(var(--c-primary) / .16); color: rgb(var(--c-primary)); } .badge-cyan { background: rgb(var(--c-secondary) / .14); color: rgb(var(--c-secondary)); }
.badge-success { background: rgb(var(--c-success) / .14); color: rgb(var(--c-success)); } .badge-warning { background: rgb(var(--c-warning) / .14); color: rgb(var(--c-warning)); } .badge-danger { background: rgb(var(--c-danger) / .14); color: rgb(var(--c-danger)); }
.badge-demo { background: repeating-linear-gradient(45deg, rgb(var(--c-warning) / .18) 0 8px, rgb(var(--c-warning) / .08) 8px 16px); color: rgb(var(--c-warning)); border: 1px dashed rgb(var(--c-warning) / .5); }
.badge-ai { background: rgb(var(--c-secondary) / .12); color: rgb(var(--c-secondary)); border: 1px solid rgb(var(--c-secondary) / .35); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

/* Tabs / overlays / toast */
.tabs { display: inline-flex; padding: 4px; gap: 4px; border-radius: var(--r-md); background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); }
.tab { min-height: 36px; padding: 0 14px; border-radius: 9px; border: 0; background: transparent; color: rgb(var(--c-text-2)); font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
.tab[aria-selected="true"], .tab[data-state="active"] { background: rgb(var(--c-elevated)); color: rgb(var(--c-text)); box-shadow: var(--shadow-1); }
.scrim { position: fixed; inset: 0; background: rgb(var(--c-overlay) / .6); z-index: var(--z-dialog); }
.dialog { position: fixed; z-index: calc(var(--z-dialog) + 1); left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(92vw, 520px); max-height: 88dvh; overflow: auto; padding: var(--sp-6); }
.sheet { position: fixed; z-index: var(--z-sheet); left: 0; right: 0; bottom: 0; border-radius: var(--r-xl) var(--r-xl) 0 0; max-height: 88dvh; overflow: auto; padding: var(--sp-5) var(--sp-5) calc(var(--sp-5) + var(--safe-b)); }
.sheet::before { content: ""; display: block; width: 40px; height: 4px; border-radius: 999px; background: rgb(var(--c-border) / .4); margin: 0 auto var(--sp-4); }
.toast-region { position: fixed; z-index: var(--z-toast); right: 16px; bottom: calc(16px + var(--safe-b)); display: grid; gap: 8px; width: min(92vw, 380px); }
.toast { display: flex; gap: 12px; padding: 14px 16px; border-radius: var(--r-md); background: rgb(var(--c-elevated)); border: 1px solid rgb(var(--c-border) / var(--border-strong-a)); box-shadow: var(--shadow-3); }
.toast[data-kind="success"] { border-color: rgb(var(--c-success) / .5); } .toast[data-kind="error"] { border-color: rgb(var(--c-danger) / .5); }
@media (max-width: 1023px) { .toast-region { bottom: calc(var(--bottomnav-h) + var(--safe-b) + 12px); left: 50%; right: auto; transform: translateX(-50%); } }

/* Skeleton, progress, empty/error */
.skeleton { position: relative; overflow: hidden; border-radius: var(--r-md); background: rgb(var(--c-border) / .12); }
.skeleton::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(var(--c-border) / .16), transparent); animation: shimmer 1.4s infinite; } @keyframes shimmer { to { transform: translateX(100%); } }
.progress { height: 8px; border-radius: 999px; background: rgb(var(--c-border) / .18); overflow: hidden; }
.progress > span { display: block; height: 100%; width: var(--value, 0%); border-radius: inherit; background: linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); transition: width var(--dur-slow) var(--ease-out); }
.stepper { display: flex; gap: 8px; } .stepper .step { flex: 1; height: 4px; border-radius: 999px; background: rgb(var(--c-border) / .2); } .stepper .step[data-done="true"] { background: rgb(var(--c-primary)); }
.empty, .error-state { display: grid; justify-items: center; gap: 12px; text-align: center; padding: var(--sp-8) var(--sp-5); border: 1px dashed rgb(var(--c-border) / .25); border-radius: var(--r-lg); }
.empty .icon, .error-state .icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 16px; background: rgb(var(--c-primary) / .12); color: rgb(var(--c-primary)); } .error-state .icon { background: rgb(var(--c-danger) / .12); color: rgb(var(--c-danger)); }
.banner { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--r-md); font-size: var(--fs-sm); }
.banner-offline { background: rgb(var(--c-warning) / .14); border: 1px solid rgb(var(--c-warning) / .4); }

/* KPI, sparkline, bento, persona art, AI orb */
.kpi { display: grid; gap: 6px; } .kpi-value { font-family: var(--font-head); font-size: 2.25rem; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.kpi-label { font-size: var(--fs-xs); color: rgb(var(--c-text-3)); text-transform: uppercase; letter-spacing: .08em; } .kpi-delta { font-size: var(--fs-xs); font-weight: 700; color: rgb(var(--c-success)); }
.spark { height: 44px; width: 100%; } .spark .line { stroke: rgb(var(--c-secondary)); stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; } .spark .area { opacity: .35; }
.bento { display: grid; gap: var(--sp-4); grid-template-columns: repeat(12, 1fr); }
.bento > .span-4 { grid-column: span 4; } .bento > .span-6 { grid-column: span 6; } .bento > .span-8 { grid-column: span 8; } .bento > .span-12 { grid-column: span 12; }
@media (max-width: 1023px) { .bento > * { grid-column: 1 / -1 !important; } }
.persona-art { position: relative; aspect-ratio: 3 / 4; border-radius: var(--r-xl); overflow: hidden;
  background: radial-gradient(80% 60% at 50% 18%, var(--p1, rgb(139 92 246 / .85)), transparent 70%), radial-gradient(70% 55% at 80% 85%, var(--p2, rgb(34 211 238 / .65)), transparent 70%), linear-gradient(180deg, rgb(var(--c-elevated)), rgb(var(--c-bg))); }
.persona-art::before { content: attr(data-initials); position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--font-head); font-weight: 800; font-size: clamp(3rem, 8vw, 5.5rem); color: rgb(255 255 255 / .92); text-shadow: 0 6px 30px rgb(0 0 0 / .35); }
.persona-art::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .12), inset 0 -80px 80px -40px rgb(0 0 0 / .55); }
.ai-orb { width: 168px; height: 168px; border-radius: 50%; background: radial-gradient(circle at 30% 28%, #fff 0, rgb(var(--c-secondary)) 18%, rgb(var(--c-primary)) 55%, rgb(var(--c-bg)) 100%); box-shadow: 0 0 60px rgb(var(--c-primary) / .5), inset 0 0 40px rgb(255 255 255 / .18); transition: box-shadow var(--dur-slow); }
.ai-orb[data-state="speaking"] { animation: orb-pulse 1.1s ease-in-out infinite; } .ai-orb[data-state="listening"] { box-shadow: 0 0 60px rgb(var(--c-success) / .55), inset 0 0 40px rgb(255 255 255 / .18); }
.ai-orb[data-state="processing"] { box-shadow: 0 0 60px rgb(var(--c-primary) / .7), inset 0 0 40px rgb(255 255 255 / .18); } .ai-orb[data-state="reconnecting"] { box-shadow: 0 0 60px rgb(var(--c-warning) / .55); filter: saturate(.6); }
@keyframes orb-pulse { 50% { transform: scale(1.05); } }
```

## 6.6 `layout.css`
```css
.app { display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); min-height: 100dvh; transition: grid-template-columns var(--dur-slow) var(--ease-out); }
.app[data-collapsed="true"] { grid-template-columns: var(--sidebar-w-collapsed) minmax(0, 1fr); }
.app[data-mode="room"] { grid-template-columns: 1fr; } .app[data-mode="room"] .sidebar, .app[data-mode="room"] .topbar, .app[data-mode="room"] .bottomnav { display: none; }
.sidebar { position: sticky; top: 0; height: 100dvh; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid rgb(var(--c-border) / var(--border-a));
  background: linear-gradient(180deg, rgb(var(--c-surface) / .72), rgb(var(--c-bg) / .55)); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); }
.brand { display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-family: var(--font-head); font-weight: 800; font-size: 1.15rem; }
.nav-section { padding: 16px 12px 6px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgb(var(--c-text-3)); }
.nav-item { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border-radius: var(--r-md); color: rgb(var(--c-text-2)); font-weight: 600; font-size: var(--fs-sm); text-decoration: none; transition: background var(--dur-fast), color var(--dur-fast); }
.nav-item:hover { background: rgb(var(--c-border) / .10); color: rgb(var(--c-text)); }
.nav-item[aria-current="page"] { background: linear-gradient(90deg, rgb(var(--c-primary) / .30), rgb(var(--c-primary) / .06)); box-shadow: inset 0 0 0 1px rgb(var(--c-primary) / .45), 0 0 28px rgb(var(--c-primary) / .22); color: rgb(var(--c-text)); }
.app[data-collapsed="true"] .nav-label, .app[data-collapsed="true"] .brand-text, .app[data-collapsed="true"] .nav-section { display: none; }
.user-card { margin-top: auto; padding: 12px; border-radius: var(--r-lg); display: flex; gap: 12px; align-items: center; }
.topbar { position: sticky; top: 0; z-index: var(--z-nav); height: calc(var(--topbar-h) + var(--safe-t)); padding: var(--safe-t) var(--sp-5) 0; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--glass-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); border-bottom: 1px solid rgb(var(--c-border) / var(--border-a)); }
.main { padding: var(--sp-6) var(--sp-5) var(--sp-10); } .container { width: 100%; max-width: var(--content-max); margin-inline: auto; }
.grid-cards { display: grid; gap: var(--sp-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
.scroll-x { overflow-x: auto; max-width: 100%; }
.bottomnav { display: none; }
@media (max-width: 1023px) {
  .app { grid-template-columns: 1fr; } .sidebar { display: none; }
  .main { padding: var(--sp-5) 16px calc(var(--bottomnav-h) + var(--safe-b) + var(--sp-6)); }
  .bottomnav { display: grid; grid-template-columns: repeat(5, 1fr); position: fixed; z-index: var(--z-nav); left: 0; right: 0; bottom: 0; height: calc(var(--bottomnav-h) + var(--safe-b)); padding: 6px 8px var(--safe-b);
    background: var(--glass-bg-strong); backdrop-filter: blur(24px) saturate(170%); -webkit-backdrop-filter: blur(24px) saturate(170%); border-top: 1px solid rgb(var(--c-border) / var(--border-a)); }
  .bottomnav a { display: grid; place-items: center; gap: 2px; min-height: 48px; font-size: 11px; font-weight: 600; color: rgb(var(--c-text-3)); text-decoration: none; border-radius: 12px; }
  .bottomnav a[aria-current="page"] { color: rgb(var(--c-primary)); background: rgb(var(--c-primary) / .10); } }
.section { padding: var(--sp-11) var(--sp-5); } .hero { position: relative; padding: calc(var(--sp-11) + var(--safe-t)) var(--sp-5) var(--sp-10); text-align: center; }
.cta-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px; }
@media (max-width: 640px) { .section { padding: var(--sp-9) 16px; } .cta-row .btn { width: 100%; } }
```

## 6.7 `interview.css`
```css
.room { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr); gap: var(--sp-5);
  padding: calc(var(--sp-4) + var(--safe-t)) calc(var(--sp-5) + var(--safe-r)) calc(var(--sp-4) + var(--safe-b)) calc(var(--sp-5) + var(--safe-l)); }
.room-topbar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.room-stage { display: grid; grid-template-rows: 1fr auto; gap: var(--sp-4); min-height: 0; } .room-side { display: grid; grid-template-rows: auto 1fr auto; gap: var(--sp-4); min-height: 0; }
.stage { position: relative; border-radius: var(--r-xl); overflow: hidden; min-height: 360px; display: grid; place-items: center;
  background: radial-gradient(120% 90% at 50% 0%, rgb(var(--c-primary) / .24), transparent 60%), rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border) / var(--border-a)); }
.stage[data-state="speaking"] { --state-c: var(--c-secondary); } .stage[data-state="listening"] { --state-c: var(--c-success); } .stage[data-state="processing"] { --state-c: var(--c-primary); } .stage[data-state="reconnecting"] { --state-c: var(--c-warning); }
.stage::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: inset 0 0 0 2px rgb(var(--state-c, var(--c-border)) / .55); transition: box-shadow var(--dur-slow); }
.stage-meta { position: absolute; left: 20px; right: 20px; bottom: 20px; display: flex; align-items: end; justify-content: space-between; gap: 12px; }
.thinking-dots span { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: currentColor; animation: dots 1.2s infinite ease-in-out both; }
.thinking-dots span:nth-child(2) { animation-delay: .15s; } .thinking-dots span:nth-child(3) { animation-delay: .3s; } @keyframes dots { 0%,80%,100% { transform: scale(.5); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
.question-card { padding: var(--sp-5); } .question-text { font-family: var(--font-head); font-size: var(--fs-xl); line-height: 1.3; font-weight: 700; margin-top: 8px; }
.transcript { overflow-y: auto; display: grid; align-content: start; gap: 12px; padding: var(--sp-4); max-height: 100%; overscroll-behavior: contain; }
.turn { display: grid; gap: 4px; max-width: 92%; } .turn-who { font-size: var(--fs-xs); font-weight: 700; color: rgb(var(--c-text-3)); text-transform: uppercase; letter-spacing: .08em; }
.turn-text { padding: 10px 14px; border-radius: 14px; background: rgb(var(--c-elevated)); font-size: var(--fs-sm); color: rgb(var(--c-text)); }
.turn[data-role="candidate"] { justify-self: end; } .turn[data-role="candidate"] .turn-text { background: rgb(var(--c-primary) / .16); } .turn[data-partial="true"] .turn-text { opacity: .7; font-style: italic; }
.captions { text-align: center; font-size: var(--fs-lg); line-height: 1.4; padding: 12px 16px; border-radius: var(--r-md); background: rgb(var(--c-bg) / .72); }
.dock { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; border-radius: var(--r-xl); }
.ctl { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; border: 1px solid rgb(var(--c-border) / var(--border-strong-a)); background: rgb(var(--c-elevated)); color: rgb(var(--c-text)); transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast); }
.ctl:active { transform: scale(.94); } .ctl[aria-pressed="true"] { background: rgb(var(--c-danger) / .16); color: rgb(var(--c-danger)); border-color: rgb(var(--c-danger) / .5); }
.ctl-mic { width: 72px; height: 72px; background: linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); color: #fff; border: 0; }
.ctl-end { width: auto; padding: 0 20px; border-radius: 999px; background: rgb(var(--c-danger)); color: #fff; border: 0; font-weight: 700; }
.composer { display: flex; gap: 8px; align-items: flex-end; padding: 8px; border-radius: var(--r-lg); } .composer textarea { flex: 1; min-height: 48px; max-height: 140px; border: 0; background: transparent; resize: none; padding: 12px; font-size: 16px; }
.timer { font-family: var(--font-mono); font-variant-numeric: tabular-nums; } .wave { width: 100%; height: 56px; } .wave[data-idle="true"] { opacity: .35; }
.code-panel { display: grid; grid-template-rows: auto 1fr auto; border-radius: var(--r-lg); overflow: hidden; border: 1px solid rgb(var(--c-border) / var(--border-a)); background: rgb(var(--c-surface)); min-height: 320px; }
.code-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgb(var(--c-border) / var(--border-a)); }
.code-editor { font-family: var(--font-mono); font-size: 13.5px; line-height: 1.6; } .tests { padding: 8px 12px; border-top: 1px solid rgb(var(--c-border) / var(--border-a)); display: grid; gap: 6px; }
@media (max-width: 1023px) { .room { grid-template-columns: 1fr; padding: calc(8px + var(--safe-t)) 12px 0; gap: 12px; } .stage { min-height: 38dvh; }
  .dock-fixed { position: sticky; bottom: 0; padding-bottom: calc(8px + var(--safe-b)); transform: translateY(calc(var(--kb) * -1)); transition: transform var(--dur-base) var(--ease-out); } }
```

## 6.8 `report.css`
```css
.score-ring { --size: 168px; --pct: 0; position: relative; width: var(--size); height: var(--size); } .score-ring svg { transform: rotate(-90deg); }
.score-ring circle { fill: none; stroke-width: 10; stroke-linecap: round; } .score-ring .track { stroke: rgb(var(--c-border) / .18); }
.score-ring .bar { stroke: url(#ring-grad); stroke-dasharray: 440; stroke-dashoffset: calc(440 - (440 * var(--pct) / 100)); transition: stroke-dashoffset 900ms var(--ease-out); }
.score-ring .value { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; } .score-ring .value b { font-family: var(--font-head); font-size: 2.5rem; font-weight: 800; line-height: 1; }
.estimate-note { display: flex; gap: 8px; font-size: var(--fs-xs); color: rgb(var(--c-text-2)); padding: 10px 12px; border-radius: var(--r-md); background: rgb(var(--c-secondary) / .08); border: 1px solid rgb(var(--c-secondary) / .25); }
.rubric { display: grid; gap: 14px; } .rubric-row { display: grid; grid-template-columns: 160px 1fr 56px auto; gap: 12px; align-items: center; }
.rubric-bar { height: 8px; border-radius: 999px; background: rgb(var(--c-border) / .18); overflow: hidden; } .rubric-bar > span { display: block; height: 100%; width: var(--value); border-radius: inherit; background: linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-secondary))); }
.rubric-bar[data-level="low"] > span { background: rgb(var(--c-warning)); } .confidence { font-size: var(--fs-xs); font-weight: 600; } .confidence[data-c="low"] { color: rgb(var(--c-warning)); } .confidence[data-c="high"] { color: rgb(var(--c-success)); }
@media (max-width: 640px) { .rubric-row { grid-template-columns: 1fr auto; } .rubric-bar { grid-column: 1 / -1; order: 3; } }
.qfeed { border: 1px solid rgb(var(--c-border) / var(--border-a)); border-radius: var(--r-lg); background: rgb(var(--c-surface)); } .qfeed summary { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; cursor: pointer; list-style: none; font-weight: 600; }
.qfeed[open] summary { border-bottom: 1px solid rgb(var(--c-border) / var(--border-a)); } .qfeed-body { padding: 16px 20px; display: grid; gap: 16px; }
.evidence { border-left: 3px solid rgb(var(--c-secondary)); padding: 8px 12px; background: rgb(var(--c-secondary) / .07); border-radius: 0 10px 10px 0; font-size: var(--fs-sm); color: rgb(var(--c-text)); }
.evidence cite { display: block; margin-top: 4px; font-style: normal; font-size: var(--fs-xs); color: rgb(var(--c-text-3)); }
.strength { border-left: 3px solid rgb(var(--c-success)); } .improve { border-left: 3px solid rgb(var(--c-warning)); }
.model-answer { font-size: var(--fs-sm); padding: 14px; border-radius: var(--r-md); background: rgb(var(--c-elevated)); border: 1px dashed rgb(var(--c-border) / .3); }
@media print { .ambient, .sidebar, .topbar, .bottomnav { display: none !important; } body { background: #fff; color: #000; } }
```

## 6.9 `index.css`
Imports tokens → base → effects → components → layout → interview → report, after the Tailwind entry.

## 6.10 Tailwind mapping
Map Tailwind theme colors to the CSS variables using `rgb(var(--c-x) / <alpha-value>)` (`bg`, `surface`, `elevated`, `primary`, `secondary`, `success`, `warning`, `danger`, `fg`, `fg-2`, `fg-3`); fonts to `--font-head/ui/mono`; radii 8/12/16/18; max-width `content: 1400px`; `darkMode` via `[data-theme="dark"]` selector. Use Tailwind for layout and spacing; use the component classes above for the signature surfaces (glass, gcard, rgb borders, ambient).

# 7. CORE REACT PRIMITIVES AND HOOKS (implement)

**Pre-hydration script in `index.html` `<head>` (no theme flash):**
```html
<script>
try {
  var t = localStorage.getItem("theme") || "system";
  var d = t === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
  document.documentElement.dataset.theme = d;
  var e = localStorage.getItem("effects") || "auto";
  var lowMem = navigator.deviceMemory && navigator.deviceMemory <= 2;
  var saveData = navigator.connection && navigator.connection.saveData;
  document.documentElement.dataset.effects = (e === "reduced" || (e === "auto" && (lowMem || saveData))) ? "reduced" : "full";
} catch (_) { document.documentElement.dataset.theme = "dark"; document.documentElement.dataset.effects = "full"; }
</script>
<meta name="theme-color" content="#090E1B" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```
Note: **`prefers-reduced-motion` must NOT set `data-effects="reduced"`.** Only the user setting, low memory, or data saver do.

**ThemeProvider:** state `theme: "dark"|"light"|"system"`, `effects: "auto"|"full"|"reduced"`; applies `data-theme`/`data-effects`, updates `<meta name="theme-color">`, persists to `localStorage`, listens to system theme changes. Expose `useTheme()`. Theme toggle in top bar and Settings; **Reduce effects** switch in Settings and top-bar overflow menu.

**GlassCard:** `<GlassCard variant="card|strong|crisp" interactive onPointerMove={spotlight}>` renders `.gcard`/`.glass`/`.glass-crisp`.

**useSpotlight:** `onPointerMove` sets `--mx`/`--my` on the element (no animation loop).

**RgbBorder:** wrapper `<RgbBorder variant="trace|ring" hero active speed>` adds classes `rgb-trace|rgb-ring`, `rgb-hero`, `is-active`, `rgb-slow|rgb-fast`; an `IntersectionObserver` plus `visibilitychange` toggles `rgb-paused` when off-screen or tab hidden. The inner card supplies its own background and `overflow: hidden`; the wrapper must not clip the bloom.

**AmbientLights:** `<div className="ambient" aria-hidden><i className="orb orb-1"/>…<i className="orb orb-4"/></div>`; paused when tab hidden. Mount once per layout (public, auth, app, room), never per card.

**Waveform:** canvas drawn with `requestAnimationFrame` from `AnalyserNode.getByteFrequencyData` (48 rounded bars, `--c-secondary`); flat line with `data-idle="true"` when no real audio; stops on `visibilitychange`; has `role="img"` and an accurate `aria-label`.

**useAudioLevel(stream):** creates `AudioContext` + `AnalyserNode`, returns smoothed RMS level and the analyser; cleans up streams/contexts on unmount.

**ScoreRing / Sparkline / AreaChart / RadarChart / PersonaArt / AiOrb:** hand-written SVG/CSS components. `ScoreRing` includes the `ring-grad` `<linearGradient>` (primary→secondary), role="img", label "Overall score N out of 100, AI estimate", animates stroke-dashoffset on mount. `Sparkline` takes `number[]`, renders smooth path + gradient area. `AreaChart` supports multi-series toggles (six rubric dimensions) with axis labels and an accessible data table fallback (`sr-only`). `RadarChart` renders six rubric axes. `PersonaArt` takes initials + two gradient colors via `--p1/--p2` and shows the **Virtual AI interviewer** badge. `AiOrb` takes `state` (idle|speaking|listening|processing|reconnecting); speaking pulse must be tied to the actual speech-synthesis `speaking` state or typed-script playback, otherwise still.

**useCountUp:** animates KPI numbers on first view (skipped under reduced motion).

**useKeyboardInset:** uses `window.visualViewport` to set `--kb` for keyboard-safe composers (mobile).

# 8. MOTION (Motion for React)

Wrap the app in `<MotionConfig reducedMotion="user">`. Variants: page `{opacity 0→1, y 8→0, 200ms}`; dialog `{opacity, scale .96→1, y 8→0, 280ms}`; sheet `{y 100%→0, 280ms}`; list stagger `.04s` (first screenful only); tap `scale .97` in 120ms; ease `[0.22, 1, 0.36, 1]`. Animate only `opacity` and `transform`. Success feedback: checkmark draw plus toast under 400ms. Never block input during transitions. Count-ups, score-ring fill, progress bar fills and chart line draw-ins are the only "showy" motion; everything else is subtle.

# 9. DATA LAYER AND MOCK DATA

## 9.1 Rules
- Zod schemas in `data/contracts` are the single source of truth for types.
- Interfaces in `data/repos/interfaces.ts`: `AuthRepo`, `ProfileRepo`, `PersonasRepo`, `SessionsRepo`, `ReportsRepo`, `QuestionsRepo`, `ProgressRepo`, `CreditsRepo`. Screens call **TanStack Query hooks** only; a lint rule/test must fail if any component imports from `data/mock` directly.
- Mock repos use in-memory state hydrated from `seed.ts`, persisting user changes (saved questions, settings, new sessions) to `localStorage` under a versioned key; simulate **latency 200–600ms**.
- A dev-tools panel (§11.15) can force: failure, slow network, offline, rate limit (429 with countdown), session expiry.
- Every record includes `isDemo: true`. Dates in seed are **relative to today** so data always looks fresh.

## 9.2 Seed data
**User:** Alex Chen, "Staff Engineer" target, language English, streak 4, credits 120, `isDemo`.

**Personas (fictional; initials-gradient art, no real photos):**
| id | Name | Presentation | Title | Style | Languages | p1 → p2 |
|---|---|---|---|---|---|---|
| p1 | Aanya Rao | Female | Senior Engineering Manager | Warm, structured, probing follow-ups | English, Hindi | violet → pink |
| p2 | Meera Kapoor | Female | HR Business Partner | Calm, conversational, behavioral focus | English, Hindi | cyan → emerald |
| p3 | Rohan Mehta | Male | Staff Software Engineer | Direct, technical, fast-paced | English, Hindi | cyan → violet |
| p4 | Daniel Brooks | Male | Principal Architect | Thoughtful, system-design depth | English | violet → cyan |
Each has: personality blurb, difficulty style (Supportive / Balanced / Challenging), a voice-preview line (spoken via `speechSynthesis`; if unavailable the button is disabled with reason "Voice preview not supported in this browser"), `isVirtual: true`.

**Interview types (7):** Technical, HR, Behavioral, DSA, System Design, Coding, Resume-based, each with icon, one-line description, typical duration and sample topics.

**Sessions (12; days ago · type · title · persona · score · minutes):**
0 · System Design · Distributed Rate Limiter & Concurrency · p4 · 84 · 38
2 · Behavioral · Staff Leadership & Cross-Functional Conflict · p2 · 79 · 42
4 · System Design · High-Throughput WebSocket Gateway · p4 · 86 · 45
6 · Technical · React Performance & Rendering · p3 · 77 · 30
9 · DSA · Graphs & Shortest Paths · p3 · 72 · 35
11 · HR · Career Story & Motivation · p2 · 81 · 20
14 · Coding · LRU Cache with TTL · p3 · 74 · 40
17 · Resume-based · Platform Migration Deep-Dive · p1 · 78 · 35
21 · System Design · URL Shortener at Scale · p4 · 70 · 45
25 · Behavioral · Conflict & Ownership · p1 · 69 · 30
30 · Technical · Node.js Concurrency · p3 · 66 · 30
35 · HR · Salary & Expectations · p2 · 68 · 15
Each session has six rubric dimension scores (0–5 with decimals) that average to its overall (÷5×100), a confidence level, 3–5 questions, delivery metrics (pace wpm, filler words/min, avg pause s). Never hardcode dashboard averages; **compute** them from sessions (last-5 average, weekly trend, weakest dimension, top dimension). Make trends believable: gradual improvement with small dips; weakest dimension "answer structure", strongest "technical accuracy" (adjust so computed numbers agree).

**Rubric dimensions:** Technical accuracy, Reasoning, Problem solving, Communication, Answer structure, Role relevance (0–5 each, confidence low/medium/high, evidence quotes, missing points, suggestion).

**Full demo report (session 0, "Distributed Rate Limiter & Concurrency", overall 84):** write complete realistic content in this shape: summary (3 sentences); dimension scores (Technical accuracy 4.5 high, Reasoning 4.2 high, Problem solving 4.3 medium, Communication 4.0 medium, Answer structure 3.6 medium, Role relevance 4.4 high); **4 questions**, each with question text, 80–140-word candidate transcript, 1–2 **evidence quotes** copied *verbatim* from that transcript with a one-line reason, covered points, missing points, one actionable suggestion, and a 60–100-word model answer; strengths (3), improvement areas (3); suggested topics (4); a 7-day drill plan (day, focus, 2–3 tasks each with minutes); delivery metrics (pace 138 wpm, 4.1 fillers/min, avg pause 0.9s) shown separately from content scores. Questions: (1) design a distributed rate limiter, (2) token bucket vs sliding window trade-offs, (3) handling clock skew and hot keys across regions, (4) failure modes when Redis is unavailable.
**Second report** (Behavioral, 79): same shape, 3 questions. **Third report (low confidence):** mostly short typed answers, so many scores show confidence "low" and "Insufficient evidence" states, with a prominent note explaining why.

**Question bank (60):** 8 topics (JavaScript/React, System Design, DSA, Behavioral, HR, Databases/SQL, OS/Networking, Cloud/DevOps), difficulty Easy/Medium/Hard, each with hint (2-step reveal), explanation, tags, `saved` flag (12 pre-saved). Write them all out with genuinely good content; no lorem ipsum.

# 10. ROUTES AND LAYOUTS

```text
/                          Landing (PublicLayout)
/login /signup /forgot-password /verify-email    (AuthLayout: ambient + centered glass card)
/onboarding                3 steps
/app                       Dashboard (AppLayout)
/app/interview/new         Setup
/app/interview/new/interviewer
/app/interview/check       Device check
/app/interview/:id/live    Live room (RoomLayout: all global nav hidden)
/app/reports/:id           Report
/app/practice  /app/history  /app/credits  /app/settings
/dev/showcase              Design showcase (dev only)
*                          404 (designed, with CTA)
```
All route components lazy-loaded with a skeleton `Suspense` fallback; error boundary per layout; focus moved to `<h1>` on route change; `document.title` per route; protected routes redirect to `/login` when mock session is absent (preserve intended path).

**App shell:** collapsible glass sidebar (brand with logo mark + gradient wordmark, sections "Practice" / "Insights" / "Account" with labels, nav items with Lucide icons, user card at bottom with avatar, plan, credits meter), compact top bar (page title, Demo badge, credits pill, theme toggle, effects toggle, profile menu), content max 1400px. Mobile: bottom nav with **Home, Practice, Interview (center, prominent gradient button), History, Profile**.

# 11. SCREEN SPECIFICATIONS

General page pattern: page header (icon tile, h1, subtitle, Demo badge) → content on bento grid → each data block has skeleton/empty/error. Ambient background visible on landing, auth, dashboard, room. **Every screen must fill the viewport with intent; no large empty regions at 1920×1080.**

## 11.1 Landing `/`
1. **Sticky glass nav:** logo, links (Features, Interviewers, How it works, Compare, FAQ), theme toggle, Log in, Get started (primary).
2. **Hero** (ambient lights, mesh): eyebrow pill "Voice-first interview practice", 3-line headline *"Practice the interview. Hear the follow-ups. See the evidence."* (gradient on a key phrase), `.lead` subcopy, two CTAs (**Start practicing** with `rgb-trace`, **Explore the demo**), trust line "Practice only · No answer-feeding tools · AI scores are estimates". **Right/below: product mock** (a `gcard rgb-hero` labelled **Preview** showing the live room: AI orb, question text, waveform, mic dock, floating chips "Follow-up generated", "Evidence linked", "Pace 138 wpm").
3. **Interviewer strip:** 4 tall `persona-art` cards (hover lift + spotlight), names, titles, "Virtual AI interviewer" badge, "Play voice preview" button.
4. **Bento features** (6 `gcard`s with tiny live visuals): Voice-first practice (mini waveform), Evidence-linked scoring (quote chip + confidence), Closed learning loop (7-day mini calendar), Coding & system design (mini editor + tests), Progress trend (sparkline), Privacy & fairness (shield, bullet list).
5. **How it works:** 3 numbered steps connected by a gradient line (Set up → Talk → Improve).
6. **Interview categories:** 7 pill/cards with icons linking to setup preselected.
7. **Sample report** (`gcard`, labelled **Sample**): score ring, rubric bars with confidence, evidence quote, "Why this score?" teaser.
8. **How we compare:** neutral table (PrepSphere vs "Typical AI mock interview tools") using **only** verifiable, non-disparaging, generic claims; no competitor names or logos.
9. **Privacy & fairness** panel: what we don't score, recordings off by default, delete anytime.
10. **Credits teaser** (labelled placeholder, no payments), **FAQ** (accordion, 8 real questions), **final CTA band** over orb background, footer (links, theme toggle, © line).
First viewport must show a product visual, not only text.

## 11.2 Auth + Onboarding
Split layout: left brand panel (gradient mesh, value bullets, **Demo** note) + right `glass-strong` form (stacked on mobile). Login, Signup (name, email, password with strength meter, terms/consent checkbox), Forgot password (sent state), Verify email (resend with 30s countdown). Zod validation, inline accessible errors (`aria-describedby`, focus first error), loading button, server-error and rate-limit states. Mock sign-in succeeds for any valid input and shows a **Demo sign-in** badge. Google button visible but disabled with the reason "Available after backend setup". Onboarding: 3 animated steps (goal & target role, language & interview defaults, consent for recording/resume processing, with recording OFF by default), progress stepper, skip allowed.

## 11.3 Dashboard `/app`
Bento (compose to fill ≥ one 1080p viewport):
- Header: "Good morning, Alex" (time-aware) + date + Demo badge.
- **Start Interview hero** (span-8, `gcard` + `RgbBorder hero`): suggested next session (from weakest dimension), persona art or AI orb, meta chips (45 min · Daniel Brooks · System Design), primary **Start interview**, secondary **Check mic & audio**.
- **Streak card** (span-4): 4-day streak, 7-day dots, encouragement line.
- **KPI row:** 4 tiles with count-up numbers + sparklines: Average estimate (last 5), Sessions this month, Practice minutes, Questions answered.
- **Progress area chart** (span-8) with dimension toggles + **Skills radar/bars** (span-4) highlighting weakest dimension.
- **Recent sessions** (span-8): rows with score ring, title, persona avatar, type chip, date, duration, "View report".
- **Recommended practice** (span-4): 3 cards with reason chips ("Weakest: Answer structure"), start buttons.
- **Interviewer quick-pick strip** and **Resume last session** card (shown when an unfinished mock session exists in storage).
New-user variant (toggle in dev tools): beautiful empty states with a single obvious CTA.

## 11.4 Interview setup `/app/interview/new`
5-step wizard with stepper and a **sticky summary rail** (desktop) / bottom summary sheet (mobile): **1 Type** (7 large selectable cards, icon, description, selected state with accent border + check, never color-only) → **2 Role & level** (role combobox with suggestions, experience Fresher/Junior/Mid/Senior chips, difficulty Easy/Medium/Hard segmented) → **3 Format** (duration slider 10–60 min, question count slider 3–15, language select, optional "Include follow-ups" switch) → **4 Resume** (shown/required only for Resume-based; dropzone with type/size validation, **simulated** upload progress with retry, labelled "Demo upload, nothing leaves your device") → **5 Review & consent** (summary, estimated credits, recording OFF switch, consent checkbox required). Per-step validation, Back/Next, draft autosave, confirm on leave with unsaved changes.

## 11.5 Interviewer selection `/app/interview/new/interviewer`
Grid of 4 tall persona cards (`glass-crisp` + `PersonaArt`): name, title, personality, languages, difficulty style chip, **Virtual AI interviewer** badge, "Preview voice" button, select button. Selected card gets `RgbBorder` trace + check badge + `aria-checked` (radio-group semantics, arrow-key navigation). Filter chips (All / Female / Male / Supportive / Challenging). Sticky footer CTA "Continue to device check" disabled until selection (with reason). Disclaimer line: "Virtual AI interviewers are simulated characters, not real recruiters."

## 11.6 Device check `/app/interview/check`
Checklist card with live status per item: **Microphone** (permission button; granted/denied/no device/device lost; denied state shows browser-specific recovery steps), **Input device** select, **Live level meter** (real AnalyserNode), **Speaker test** (plays a short tone via WebAudio with volume slider), **Camera** (optional switch, local preview only, "never recorded or uploaded"), **Connection** (online/offline indicator), **Troubleshooting** accordion, prominent **"Continue with typed answers"** fallback. "Start interview" enabled when mic OK or typed mode chosen. Stop all tracks on unmount/route change.

## 11.7 Live interview room `/app/interview/:id/live`
RoomLayout (no global nav, ambient dimmed). Desktop two columns; mobile stacked with keyboard-safe dock.
- **Top bar:** exit (confirm), interview title, **Demo mode** banner chip ("Scripted interviewer, no AI"), progress "Question 2 of 5" + progress bar, timer (mono), connection chip, settings button.
- **Stage** (glass-crisp): persona art or `AiOrb`, name + "Virtual AI interviewer", **state chip** (Idle / Speaking / Listening / Thinking / Reconnecting) with matching ring color, live captions bar (`aria-live="polite"`).
- **Side:** **Question card** (`gcard` + `RgbBorder`), transcript list (scrollable, partial turns italic, auto-scroll with "jump to latest"), **Waveform** (real mic).
- **Dock:** Mic (hold-to-talk or toggle), Mute, Camera (optional), Type answer (opens composer), Settings (voice, speech speed, caption size, captions on/off), **End interview** (confirmation dialog explaining the report will be generated from answers so far).
- **Coding variant** (Coding/DSA types): split view with problem statement, **editor panel** (language select, line gutter, mono, theme-aware), test-cases list, Run button **disabled with reason** "Code execution requires the backend sandbox (later phase)", and a "Submit approach as text" path.
- **Reconnect UX:** on `offline` or dev-tools trigger, stage ring turns amber, banner "Connection lost. Your progress is saved. Reconnecting…", auto-retry countdown, manual Retry, resume at the same question.
- **Keyboard:** Space toggles mic, M mute, T type, Esc opens end dialog; all discoverable via a `?` shortcuts popover.
- On end: summary dialog → creates a mock session + report → navigates to the report.

## 11.8 Report `/app/reports/:id`
Hero summary glass card: **score ring** labelled **AI estimate**, type/date/duration, persona, delta vs previous session, Demo badge, actions (Print/Export PDF via `window.print()` styles, Share disabled with reason, Practice weak areas). **Estimate & limitations note** (always visible). Tabs: **Overview** (rubric bars with confidence + tooltip, content vs **delivery metrics shown separately**, strengths, improvements, suggested topics chips, **7-day drill plan** timeline, next-practice CTA), **Questions** (accordion per question: transcript, **evidence quotes** with reason, covered/missing points, suggestion, model answer, "Why this score?" and "Report an error" actions), **Transcript** (searchable with highlight, timestamps). **"Why this score?" drawer/sheet:** dimension, score, confidence, the evidence quotes, what would raise the score, and limitations. "Report an error" opens a dialog (reason textarea) and succeeds with a toast (mock). Low-confidence report shows "Insufficient evidence" treatment. No glass/animated borders inside the report body (only the summary hero).

## 11.9 Practice `/app/practice`
Header search + topic chips (8) + difficulty filter + Saved toggle (compact filter sheet on mobile). Question cards grid (topic, difficulty chip, tags, save star). Click opens a **detail drawer**: question, answer textarea with word count, **2-step hint reveal**, "Show explanation" after answering, mark done, save. Progress ring per topic. Skeleton/empty ("No questions match") /error states.

## 11.10 History `/app/history`
KPI row with sparklines (Total sessions, Average estimate, Top dimension, Trend vs baseline), **trend chart** with dimension toggles and type filter, **filter bar** (search, type, date range, score range, persona), session list (rows on desktop, cards on mobile) with score ring, persona avatar, type chip, **compare checkbox** (max 2) → **Compare drawer** showing side-by-side radar + per-dimension deltas, "View report". Sort control. Pagination or "Load more". Empty state variant.

## 11.11 Settings `/app/settings`
Left sub-nav (top tabs on mobile): **Profile** (name, career goal, target roles tag-input), **Preferences** (language, default interview settings), **Audio** (input/output device, TTS voice select with preview, speed slider), **Appearance** (theme Dark/Light/System cards with mini previews, **Reduce effects** switch with explanation, caption size), **Privacy** (consents list with toggles, recording default OFF, retention selectors, **Export my data** → downloads a JSON of mock data, **Delete all my data** and **Delete account** with typed-confirmation dialogs, logout), **Account** (email, logout). Saves show success toasts; destructive actions confirm.

## 11.12 Credits `/app/credits`
Credits meter, usage history list (mock), plan cards labelled **Coming soon** with disabled CTAs and explanation. No payments.

## 11.13 System states (reusable, consistent, in both themes)
Skeleton sets per screen (dashboard, list, report, settings), empty states with illustrations built from CSS/SVG, error state with Retry, offline banner (`role="status"`), permission-denied guide, rate-limit notice with countdown, session-expired dialog (returns to the same route after mock re-login), upload progress/failure/retry, success toasts, Demo-mode banner, designed 404.

## 11.14 Design showcase `/dev/showcase` (dev only)
Every component and state, both themes side by side; the three RGB border variants; glass levels over the ambient background; orbs; typography scale; color tokens with live contrast ratios; the motion variants; sample charts. This page must itself look premium.

## 11.15 Dev tools panel (dev only)
Floating panel: force API failure, latency slider, go offline, trigger 429, expire session, toggle new-user variant, toggle effects mode, reset demo data.

# 12. DEMO INTERVIEW ENGINE (no AI)

**State machine** (typed reducer, discriminated union, unit-tested for all valid/invalid transitions): `setup → device_check → ready → interviewer_speaking ⇄ listening ⇄ candidate_answering → processing → … → completed | cancelled`; `reconnecting` reachable from any live state and returns to the previous state. Persist resumable state to `localStorage` after each answer ("Resume last session" on dashboard).

**VoiceProvider interface** (so a real provider can be dropped in later): `connect, disconnect, speak(text), interrupt(), sendText(text), onTranscriptPartial, onTranscriptFinal, onAudioState, getConnectionState`. Implement **DemoProvider**: reads scripted questions with `speechSynthesis` (falls back to text-only), candidate answers by typing and/or optional `SpeechRecognition` where supported (label **"Browser recognition, demo quality"**; hide if unsupported), scripted follow-up chosen from a small per-question pool by simple keyword presence (clearly demo). Provide scripts for each of the 7 interview types (4–5 questions each, 1–2 follow-ups per question) with natural spoken wording; System Design script follows the rate-limiter report questions.

**Honesty:** show "Demo mode: scripted interviewer, no AI" in the room; the generated report for a newly completed demo interview is assembled from the user's real typed/recognized answers with deterministic, clearly-labelled **demo scoring** (word-count/keyword heuristics) and a banner "Demo scoring, not an AI evaluation".

# 13. ACCESSIBILITY, RESPONSIVE, PERFORMANCE

- Contrast AA for all token pairs in both themes; verify text over glass on top of the brightest orb region (use `--glass-bg-strong` for text-heavy glass if needed). Show ratios on the showcase page.
- Keyboard: logical tab order, visible focus, skip link, `Esc` closes overlays, focus trap + restore in dialogs/sheets, arrow-key radio groups.
- ARIA: icon buttons labelled; captions `aria-live="polite"`; errors `role="alert"`; connection `role="status"`; tabs/accordions per WAI-ARIA; charts have text alternatives.
- Touch targets ≥ 44px (48px on mobile where possible); forms use 16px inputs (no mobile zoom).
- Responsive: 360 → 1920px; no horizontal overflow; bottom nav + sheets on mobile; safe-area insets on all fixed UI.
- Performance: lazy routes, lazy below-fold landing sections, AVIF/WebP assets with explicit dimensions, fonts self-hosted with `font-display: swap` and preload for headings, no animated `filter`/layout properties, `IntersectionObserver` pauses for off-screen animation, glass count within §6.1 limits, test on 4× CPU throttle.
- Text zoom 200% without clipping.

# 14. QA AND VISUAL ACCEPTANCE

## 14.1 Automated
Unit tests: state machine, each mock repo, Zod contracts, score/trend calculations, format helpers. Component tests: forms validation, wizard navigation, dialogs focus management. Playwright: full journey landing → signup → onboarding → dashboard → setup → interviewer → device check (fake media stream flags) → demo interview (typed answers) → report → history compare → settings (theme, effects, delete data) in dark and light; plus forced-failure, offline and session-expiry flows. `@axe-core/playwright` on every route: **zero critical/serious violations**. Lighthouse (mobile) on landing and dashboard.

## 14.2 Screenshots
Script `screenshots` captures every route in dark and light at 360, 768, 1024, 1440 px, plus live-room states (speaking, listening, thinking, reconnecting) into `/docs/screenshots/<route>-<theme>-<width>.png`.

## 14.3 Visual self-review loop (mandatory after every screen milestone)
Score the screen 1–5 on each criterion; **fix and re-shoot until all ≥ 4**:
1. **Depth:** layered background, visible orbs, glass with gradient hairlines, believable shadows.
2. **Hierarchy:** one clear focal point; strong type scale; generous whitespace without empty zones.
3. **Density:** at 1920×1080 the screen is purposefully filled (charts, cards, content), never mostly blank.
4. **Color:** violet/cyan/green used with intent; no muddy grays; both themes feel designed, not inverted.
5. **Signature effects:** traveling RGB light clearly visible on the hero element; spotlight hover works; ambient lights noticeable but never hurt legibility.
6. **Polish:** consistent radii/spacing, aligned baselines, no orphaned elements, crisp icons, smooth motion.
7. **Not template-like:** would sit beside Linear/Stripe/Vercel without looking cheap or like a generic admin kit.

## 14.4 Final acceptance checklist
- [ ] All routes render in dark and light at all widths, no horizontal overflow, zero console errors/warnings
- [ ] Theme + Reduce-effects switches work instantly, no theme flash, effects stay attractive under `prefers-reduced-motion`
- [ ] RGB traveling light, glass, spotlight and ambient lights match §6 and respect the budget
- [ ] Complete mock journey works end to end, including a finished demo interview and generated report
- [ ] Mic permission, level meter and waveform use real audio; flat when silent
- [ ] Every button works or is disabled with a reason; every form validates
- [ ] Loading, empty, error+retry, offline, rate-limit, session-expiry, permission-denied states reachable via dev tools
- [ ] Demo/Sample/Preview labels present; no fake logos/testimonials/stats; personas labelled virtual AI
- [ ] Typecheck, lint, tests, production build pass; axe clean; Lighthouse targets met on landing
- [ ] Mock-import lint rule passes (screens never import `data/mock`)

# 15. BACKEND-READINESS (do now, implement later)

Keep all data access behind the repo interfaces and TanStack Query hooks so a later phase can add `data/supabase/*` implementations selected by `VITE_DATA_SOURCE=supabase` with **zero screen changes**. Mirror the future tables in the Zod contracts: `profiles, interviewer_personas, interview_plans, interview_sessions, questions, answers, rubric_scores, reports, saved_questions, progress_snapshots, drill_plans, resumes, consents, feedback_disputes, usage_credits`. Do not build any server code now. Document in the README exactly where auth, storage, voice provider, and AI evaluation will plug in (`AuthRepo`, resume upload hook, `VoiceProvider`, `InterviewEngine`).

# 16. FINAL DELIVERABLES AND REPORT

1. Complete, runnable repository (`npm install && npm run dev`; `npm run build && npm run preview`).
2. `README.md`: setup, scripts, pinned versions, architecture, how to view the showcase, how dev tools work, how to switch effects, where the backend plugs in.
3. `/docs/BUILD_LOG.md`, `/docs/screenshots/*`, `/docs/QA_REPORT.md` (test results, axe, Lighthouse numbers, remaining issues).
4. A final message stating **exactly**: what works, what is demo-only, what is not built (backend, real auth, real AI/voice, code sandbox, payments), and the commands to run and preview. Do not claim anything works that you have not run.

Begin now with M0: inspect the directory, then scaffold. Proceed through every milestone without waiting for approval, except to report at the ★ visual checkpoint.

<!-- ====================== END PROMPT ====================== -->
