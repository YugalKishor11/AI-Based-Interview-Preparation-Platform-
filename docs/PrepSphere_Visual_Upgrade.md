# PrepSphere — Visual Upgrade Pack (V-pass)
**Fixes the "flat / cheap" look after A03.** Overrides parts of `PrepSphere_UI_System.md`. Where this file and UI.md disagree, **this file wins**.

---

## 1. Diagnosis (from your three screenshots)

| What you see | Why it looks cheap |
|---|---|
| Landing hero is only text and three flat boxes | No product visual. Nothing shows the product (interviewer, live room, report), so there is nothing to sell visually. |
| Cards are solid dark rectangles | The agent used the plain `.card` class for almost everything. Glass was only applied to the sidebar and top bar, where there is nothing colorful behind it to blur, so glass looks like a flat panel. |
| Background lights barely visible | My orb opacities (0.28 / 0.20 / 0.12) on a near-black background are too faint to notice. |
| RGB border is hardly visible on the dashboard hero | It is 1.5px, only a short arc, and low alpha. At that size it reads as a faint glow, not a revolving light. |
| Dashboard is about 60% empty space | One session, two stat tiles, no chart, no interviewer, no recommendations. Premium dashboards are dense with layered content. |
| History says "Trends" but shows no chart | Plain text list, no visuals, no filters. |
| Hero headline letters look cramped | `letter-spacing: -.035em` is too tight at this size with Manrope 800. |
| No imagery anywhere | No interviewer portraits, no illustrations, no product mockups. |

### Root causes
1. **My spec was too timid.** The effect budget (max 4 glass, 2 animated borders) plus the word "restrained" made the agent play safe everywhere. Faint orbs and a thin border follow my own numbers.
2. **The prompts checked function, not beauty.** A01 to A03 acceptance was contrast, fallbacks and routing. Nothing said "must look comparable to Linear or Stripe", and nothing required a visual comparison.
3. **Thin mock data and no assets.** Three sessions and no images make any layout look empty.
4. **Possible: effects are auto-reduced on your machine.** If Windows has *Settings → Accessibility → Visual effects → Animation effects* turned off, `prefers-reduced-motion` is true. UI.md then switches off orbs, glass and border animation. Check this first (Section 2).

---

## 2. Quick checks before changing code (2 minutes)
1. Open DevTools → Console and run: `document.documentElement.dataset.effects`. If it says `"reduced"`, effects are switched off.
2. Fix it with: `localStorage.setItem("effects","full"); location.reload()`.
3. Also check Windows: Settings → Accessibility → Visual effects → Animation effects **On**. Battery saver can also reduce effects.
4. Judge visuals with `npm run build && npm run preview`, not the dev server.

If effects were reduced, you will already see a difference. The rest of this file still applies, because the look needs more than effects.

---

## 3. Revised rules (replace UI.md section 1)

| Effect | New limit per viewport |
|---|---|
| Glass surfaces (`backdrop-filter`) | **6** on app screens, **8** on landing (desktop). Auto-drop to 3 on mobile and on Reduce effects. |
| Animated RGB border | **3** (hero card, selected item, primary CTA). Hover bloom is extra. |
| Background lights | 4 orbs plus mesh gradient, always on for landing, auth, dashboard, room |
| Hero cards | Must have glass + spotlight + gradient edge. Plain `.card` is only for list rows and dense data. |

Visual benchmark: the finished product should sit comfortably beside **Linear, Vercel, Raycast, Stripe and Arc** in visual polish. If a screen looks like a generic admin template, it fails.

---

## 4. CSS overrides (append to `effects.css`, overriding earlier rules)

### 4.1 Stronger ambient lights and mesh background
```css
:root[data-theme="dark"] {
  --orb-violet: rgb(139 92 246 / .55);
  --orb-cyan:   rgb(34 211 238 / .38);
  --orb-green:  rgb(52 211 153 / .22);
  --orb-pink:   rgb(244 114 182 / .20);
}
:root[data-theme="light"] {
  --orb-violet: rgb(124 58 237 / .30);
  --orb-cyan:   rgb(8 145 178 / .24);
  --orb-green:  rgb(5 150 105 / .14);
  --orb-pink:   rgb(219 39 119 / .12);
}

body {
  background:
    radial-gradient(1200px 640px at 12% -8%, rgb(var(--c-primary) / .20), transparent 62%),
    radial-gradient(900px 520px at 100% 8%,  rgb(var(--c-secondary) / .14), transparent 62%),
    radial-gradient(800px 480px at 50% 110%, rgb(var(--c-success) / .08),  transparent 62%),
    rgb(var(--c-bg));
  background-attachment: fixed;
}

.ambient .orb-1 { width: 70vmax; height: 70vmax; }
.ambient .orb-2 { width: 62vmax; height: 62vmax; }
.ambient .orb-3 { width: 52vmax; height: 52vmax; }
.ambient .orb-4 { position: absolute; width: 40vmax; height: 40vmax; right: 18vmax; bottom: -10vmax; border-radius: 50%;
  background: radial-gradient(circle, var(--orb-pink), transparent 62%); animation: drift-2 48s var(--ease-in-out) infinite alternate reverse; }
```
Add `<i className="orb orb-4" />` to `AmbientLights`.

### 4.2 Premium glass card with spotlight (use for hero and feature cards)
```css
.gcard {
  position: relative; overflow: hidden; border-radius: var(--r-xl); padding: var(--sp-5);
  background:
    linear-gradient(180deg, rgb(255 255 255 / .08), rgb(255 255 255 / .02)),
    var(--glass-bg);
  backdrop-filter: blur(22px) saturate(175%);
  -webkit-backdrop-filter: blur(22px) saturate(175%);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 1px rgb(255 255 255 / .03), 0 12px 40px rgb(0 0 0 / .35);
  transition: transform var(--dur-base) var(--ease-out), border-color var(--dur-base), box-shadow var(--dur-base);
}
:root[data-theme="light"] .gcard {
  background: linear-gradient(180deg, rgb(255 255 255 / .92), rgb(255 255 255 / .62));
  box-shadow: inset 0 1px 0 #fff, 0 12px 40px rgb(15 23 42 / .10);
}
/* Cursor spotlight, cheap, no JS animation loop (JS only sets --mx/--my on pointermove) */
.gcard::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .25s;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgb(var(--c-primary) / .22), transparent 62%);
}
.gcard:hover::before { opacity: 1; }
.gcard:hover { transform: translateY(-2px); border-color: rgb(var(--c-primary) / .5); }
/* gradient hairline on top edge */
.gcard::after {
  content: ""; position: absolute; left: 12%; right: 12%; top: 0; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgb(var(--c-secondary) / .7), rgb(var(--c-primary) / .7), transparent);
}
:root[data-effects="reduced"] .gcard { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgb(var(--c-elevated)); }
:root[data-effects="reduced"] .gcard::before { display: none; }
```
```tsx
// shared/hooks/useSpotlight.ts
export const spotlight = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
// <div className="gcard" onPointerMove={spotlight}>...</div>
```

### 4.3 RGB traveling border v2 (clearly visible) + hero bloom
```css
.rgb-trace::before {
  padding: 2px;
  background:
    conic-gradient(from var(--angle), transparent 0 52%,
      rgb(var(--c-primary)) 66%, rgb(var(--c-secondary)) 78%,
      rgb(var(--c-success)) 88%, rgb(var(--c-accent-pink)) 95%, transparent 100%),
    linear-gradient(rgb(var(--c-border) / .30), rgb(var(--c-border) / .30));
  animation-duration: 4.5s;
}
/* Always-on soft bloom for the ONE hero card per screen */
.rgb-hero::after {
  content: ""; position: absolute; inset: -3px; border-radius: inherit; z-index: -2; pointer-events: none; opacity: .5;
  background: conic-gradient(from var(--angle), transparent 0 52%, rgb(var(--c-primary) / .9) 66%, rgb(var(--c-secondary) / .9) 80%, transparent 100%);
  filter: blur(18px); animation: rgb-spin 4.5s linear infinite;
}
:root[data-theme="light"] .rgb-hero::after { opacity: .35; }
:root[data-effects="reduced"] .rgb-hero::after { display: none; }
```
The wrapper must NOT have `overflow: hidden` (it would clip the bloom). Put `overflow: hidden` on the inner card.

### 4.4 Typography fix
```css
.hero-title { font-size: clamp(2.6rem, 1.5rem + 4.6vw, 5rem); line-height: 1.04; letter-spacing: -.025em; font-weight: 800; text-wrap: balance; }
h1, h2 { letter-spacing: -.015em; }
.eyebrow { font-size: var(--fs-xs); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgb(var(--c-secondary)); }
.lead { font-size: clamp(1.05rem, .95rem + .5vw, 1.25rem); line-height: 1.6; max-width: 62ch; }
```

### 4.5 Sidebar and nav polish
```css
.sidebar { background: linear-gradient(180deg, rgb(var(--c-surface) / .72), rgb(var(--c-bg) / .55)); }
.nav-item[aria-current="page"] {
  background: linear-gradient(90deg, rgb(var(--c-primary) / .30), rgb(var(--c-primary) / .06));
  box-shadow: inset 0 0 0 1px rgb(var(--c-primary) / .45), 0 0 28px rgb(var(--c-primary) / .22);
  color: rgb(var(--c-text));
}
.nav-section { padding: 16px 12px 6px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgb(var(--c-text-3)); }
.user-card { margin-top: auto; padding: 12px; border-radius: var(--r-lg); display: flex; gap: 12px; align-items: center; }
```

### 4.6 KPI tile with sparkline, bento grid, persona art
```css
.kpi { display: grid; gap: 6px; }
.kpi-value { font-family: var(--font-head); font-size: 2.25rem; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.kpi-delta { font-size: var(--fs-xs); font-weight: 700; color: rgb(var(--c-success)); }
.spark { height: 44px; width: 100%; }
.spark path.line { stroke: rgb(var(--c-secondary)); stroke-width: 2; fill: none; stroke-linecap: round; }
.spark path.area { fill: url(#spark-grad); opacity: .35; }

.bento { display: grid; gap: var(--sp-4); grid-template-columns: repeat(12, 1fr); }
.bento > .span-4 { grid-column: span 4; } .bento > .span-6 { grid-column: span 6; }
.bento > .span-8 { grid-column: span 8; } .bento > .span-12 { grid-column: span 12; }
@media (max-width: 1023px) { .bento > * { grid-column: 1 / -1 !important; } }

/* Persona art: gradient mesh + initials + rim light (replaces flat placeholder portraits) */
.persona-art { position: relative; aspect-ratio: 3 / 4; border-radius: var(--r-xl); overflow: hidden;
  background:
    radial-gradient(80% 60% at 50% 18%, var(--p1, rgb(139 92 246 / .85)), transparent 70%),
    radial-gradient(70% 55% at 80% 85%, var(--p2, rgb(34 211 238 / .65)), transparent 70%),
    linear-gradient(180deg, rgb(var(--c-elevated)), rgb(var(--c-bg))); }
.persona-art::before { content: attr(data-initials); position: absolute; inset: 0; display: grid; place-items: center;
  font-family: var(--font-head); font-weight: 800; font-size: clamp(3rem, 8vw, 5.5rem); color: rgb(255 255 255 / .92);
  text-shadow: 0 6px 30px rgb(0 0 0 / .35); }
.persona-art::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .12), inset 0 -80px 80px -40px rgb(0 0 0 / .55); }
.persona-art .ai-tag { position: absolute; left: 12px; top: 12px; z-index: 1; }

/* AI orb avatar for the live-room stage when no portrait service exists */
.ai-orb { width: 168px; height: 168px; border-radius: 50%; position: relative;
  background: radial-gradient(circle at 30% 28%, #fff 0, rgb(var(--c-secondary)) 18%, rgb(var(--c-primary)) 55%, rgb(var(--c-bg)) 100%);
  box-shadow: 0 0 60px rgb(var(--c-primary) / .5), inset 0 0 40px rgb(255 255 255 / .18); }
.ai-orb[data-state="speaking"]   { animation: orb-pulse 1.1s ease-in-out infinite; }
.ai-orb[data-state="listening"]  { box-shadow: 0 0 60px rgb(var(--c-success) / .55), inset 0 0 40px rgb(255 255 255 / .18); }
@keyframes orb-pulse { 50% { transform: scale(1.05); } }
@media (prefers-reduced-motion: reduce) { .ai-orb { animation: none !important; } }
```
Note on the orb: its "speaking" pulse should be driven by the real TTS or audio state. If no audio is playing it must be still.

---

## 5. Required screen compositions (what "not cheap" means)

### Landing (`/`)
1. **Hero:** eyebrow pill, 3-line headline, lead text, two CTAs (primary with `rgb-trace`), trust line ("Practice only. No cheating tools. AI scores are estimates."). Right or below: a **product mock** (glass card showing the live room: AI orb, question text, waveform, mic dock, floating chips like "Follow-up generated", "Evidence linked") with `rgb-hero`. Mark it "Preview".
2. **Interviewer strip:** 4 `persona-art` cards (tall), with "Virtual AI interviewer" badge, name, style.
3. **Bento features** (6 tiles, `gcard`): Voice-first practice (mini waveform), Evidence-linked scoring (quote chip), Closed learning loop (7-day mini calendar), Coding + system design (mini editor), Progress trend (sparkline), Privacy and fairness (shield).
4. **How it works:** 3 numbered steps with connecting gradient line.
5. **Sample report:** large `gcard` with score ring, rubric bars, an evidence quote. Label "Sample".
6. **Categories marquee/grid:** 7 pill cards with icons.
7. **Compare table (neutral), FAQ, final CTA band** with orb background, footer.

### Dashboard
Row 1: greeting + date + Demo badge. Row 2 (bento): **Start Interview hero** (`gcard rgb-trace rgb-hero`, span-8) containing persona art or AI orb, title, meta chips (45 min, Daniel Brooks), 2 CTAs; **Streak card** (span-4) with 7-day dots; Row 3: 3-4 **KPI tiles with sparklines**; Row 4: **Progress area chart** (span-8) + **Skills radar or bars** (span-4); Row 5: **Recent sessions** with score rings (span-8) + **Recommended practice** cards with reason chips (span-4); Row 6: **Interviewer quick-pick strip**. Content must fill at least a full viewport height on 1080p.

### History
KPI row with sparklines, **trend chart** with dimension toggles, filter bar (search, type, date, score), sessions as rows with score ring, tags, persona avatar, compare checkbox, and a **compare drawer**. 8+ demo sessions.

### All app screens
Page header with icon tile and Demo badge, sidebar with section labels and user card, subtle ambient background visible behind content.

---

## 6. PASTE-READY PROMPTS

### V1 — Visual upgrade of the foundation
```text
The current build looks flat and cheap. Read /docs/PrepSphere_Visual_Upgrade.md. It overrides
UI.md where they disagree. First run the effects check in section 2 and report what
document.documentElement.dataset.effects shows on first load; make "full" the default unless the
user chose reduced, and make Reduce effects visible in the top bar.
Then:
1. Add all CSS from section 4 (tokens, mesh background, 4 orbs, .gcard with spotlight, rgb-trace v2,
   .rgb-hero bloom, typography fix, sidebar polish, KPI/sparkline, bento, persona-art, ai-orb).
2. Add a spotlight pointer hook and update GlassCard/AmbientLights accordingly.
3. Convert all hero/feature/stat cards from .card to .gcard. Keep .card only for dense list rows.
4. Update /dev/showcase to show every new style in dark and light.
5. Before and after: capture screenshots of landing, dashboard and history at 1440x900 in
   /docs/screenshots/before-v1 and /docs/screenshots/after-v1.
Acceptance: the traveling RGB light is clearly visible on the hero card from normal viewing
distance; orbs are visible but do not hurt text contrast (re-run AA checks over glass on orbs);
Reduce effects still produces a clean solid fallback; no performance regression on a throttled CPU.
Write /docs/handoff/V1.md.
```

### V2 — Dashboard and shell
```text
Read V1 handoff. Rebuild the dashboard exactly per section 5 of /docs/PrepSphere_Visual_Upgrade.md
(bento layout, hero with persona art or AI orb, KPI tiles with real SVG sparklines from mock data,
progress area chart, skills bars or radar, recent sessions with score rings, recommended practice
with reason chips, interviewer quick-pick strip). Expand mock data to 12 sessions across 6 weeks.
Upgrade the sidebar (section labels, glowing active item, user card), top bar and page headers.
Acceptance: at 1920x1080 the dashboard has no large empty regions; at 360px it stacks cleanly;
max 3 animated borders in view; before/after screenshots committed.
```

### V3 — Landing page
```text
Read V2 handoff. Rebuild the landing page per section 5 (hero with live-room product mock, interviewer
strip with persona-art, bento features with tiny live visuals, how it works, sample report,
categories, neutral compare, FAQ, CTA band). Use only claims that are true; label mocks "Preview"
and samples "Sample". Fix the hero typography spacing. Lazy-load below the fold.
Acceptance: first viewport shows a product visual, not only text; LCP <= 2.5s on throttled mobile;
before/after screenshots committed.
```

### V4 — Remaining screens
```text
Read V3 handoff. Apply the same visual language to History (trend chart, filters, compare drawer),
interviewer selection (persona-art cards, rgb-trace on selected), setup wizard, device check,
live room (ai-orb stage, glass dock, rgb-trace on the question card and active mic), report, practice
and settings. Expand mock data where screens look sparse. Keep long text areas, tables, report body
and the code editor free of glass and animated borders.
Acceptance: every screen passes the "would this sit next to Linear or Stripe" check; screenshots of all
routes in dark and light at 1440 and 390 widths committed; axe and Lighthouse re-run.
```

---

## 7. Changes to the main prompt chain
- Add to **A01, A05, A07 acceptance:** "A reviewer comparing screenshots with Linear/Stripe-quality references would not call this flat or template-like. Attach before/after screenshots."
- Add to the **Master Prompt rule 8:** replace the effect budget with section 3 of this file.
- Insert **V1 to V4 after A14** (or run V1 immediately, then continue A04 onward with the new look). Recommended: run **V1 now** because every later screen inherits the look.
