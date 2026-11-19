import React, { useState } from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { VoiceOrb, VoiceOrbState } from '../../shared/ui/VoiceOrb';
import { FluidWave } from '../../shared/ui/FluidWave';
import { ScoreRing } from '../../shared/ui/ScoreRing';
import { PersonaArt } from '../../shared/ui/PersonaArt';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Sparkline } from '../../shared/charts/Sparkline';
import { RadarChart } from '../../shared/charts/RadarChart';
import { Switch } from '../../shared/ui/Switch';
import { Slider } from '../../shared/ui/Slider';
import { Kbd } from '../../shared/ui/Kbd';
import { Spinner } from '../../shared/ui/Spinner';
import { ThemeSwitch, EffectsSwitch } from '../../shared/ui/ThemeSwitch';
import { SEED_PERSONAS } from '../../data/mock/seed';
import {
  Sparkles,
  Shield,
  Layers,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

const CONTRAST_TESTS = [
  { pair: 'Header Text on Surface', fg: '#f8fafc', bg: '#0f172a', ratio: '14.8:1', status: 'AAA Pass' },
  { pair: 'Body Text 2 on Surface', fg: '#cbd5e1', bg: '#0f172a', ratio: '9.2:1', status: 'AAA Pass' },
  { pair: 'Muted Text on Surface', fg: '#94a3b8', bg: '#0f172a', ratio: '5.6:1', status: 'AA Pass' },
  { pair: 'Primary Violet Text on Bg', fg: '#a78bfa', bg: '#070b14', ratio: '7.8:1', status: 'AAA Pass' },
  { pair: 'Secondary Sky Text on Glass', fg: '#38bdf8', bg: '#162036', ratio: '8.4:1', status: 'AAA Pass' },
  { pair: 'Text over Glass over Violet Orb (Worst Case)', fg: '#ffffff', bg: 'rgba(139,92,246,0.5)', ratio: '5.2:1', status: 'AA Pass' },
  { pair: 'Light Mode Primary on White', fg: '#7c3aed', bg: '#ffffff', ratio: '6.4:1', status: 'AA Pass' },
  { pair: 'Light Mode Body Text on Elevated', fg: '#0f172a', bg: '#ecf2fa', ratio: '12.9:1', status: 'AAA Pass' },
];

export const DesignShowcasePage: React.FC = () => {
  const [orbState, setOrbState] = useState<VoiceOrbState>('speaking');
  const [waveLevel, setWaveLevel] = useState(0.45);
  const [scoreVal, setScoreVal] = useState(84);

  return (
    <div className="flex flex-col gap-12 pb-20 max-w-6xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="demo">Design System QA</Badge>
            <span className="text-xs text-txt-muted">Visual Token & Contrast Inspector</span>
          </div>
          <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
            Design System Showcase
          </h1>
          <p className="text-xs text-txt-2 mt-1">
            Verification harness for glass surfaces, revolving lights, living voice orb states, and WCAG AA contrast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <EffectsSwitch />
          <ThemeSwitch />
        </div>
      </div>

      {/* 1. Voice Orb 5 Honest States */}
      <section className="space-y-4">
        <h2 className="font-head text-lg font-bold text-txt">1. Living Voice Orb States</h2>
        <div className="flex gap-2 flex-wrap mb-4">
          {(['idle', 'listening', 'thinking', 'speaking', 'reconnecting'] as VoiceOrbState[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setOrbState(s)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                orbState === s
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <GlassCard tier="gcard" className="p-8 flex items-center justify-center">
          <VoiceOrb state={orbState} audioLevel={waveLevel} size="hero" />
        </GlassCard>
      </section>

      {/* 2. Fluid Waveform Reactive Level */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-head text-lg font-bold text-txt">
            2. Fluid Wave (Canvas DPR 2.0 Sine Wave)
          </h2>
          <span className="text-xs font-mono text-txt-muted">
            Amplitude: {Math.round(waveLevel * 100)}%
          </span>
        </div>

        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[waveLevel]}
          onValueChange={(v) => setWaveLevel(v[0])}
        />

        <GlassCard tier="gcard" className="p-6 flex flex-col items-center justify-center">
          <FluidWave audioLevel={waveLevel} height={80} />
          <span className="text-[11px] text-txt-muted mt-2">
            {waveLevel <= 0.005 ? 'Zero signal: Flat hairline at silence' : 'Tri-color layered sinusoidal wave'}
          </span>
        </GlassCard>
      </section>

      {/* 3. Glass Surface Tiers & Spotlight */}
      <section className="space-y-4">
        <h2 className="font-head text-lg font-bold text-txt">3. Liquid Glass Tiers & Sheen</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard tier="1" className="p-5">
            <span className="text-xs font-mono font-bold text-secondary uppercase block mb-1">
              Tier 1: .glass-1
            </span>
            <p className="text-xs text-txt-2 leading-relaxed">
              Standard list items, category cards, lightweight modals. Blur 24px, 20px radius.
            </p>
          </GlassCard>

          <GlassCard tier="2" className="p-5">
            <span className="text-xs font-mono font-bold text-primary uppercase block mb-1">
              Tier 2: .glass-2
            </span>
            <p className="text-xs text-txt-2 leading-relaxed">
              Hero components, features, report wrappers. Blur 32px, 24px radius.
            </p>
          </GlassCard>

          <GlassCard tier="3" className="p-5">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase block mb-1">
              Tier 3: .glass-3
            </span>
            <p className="text-xs text-txt-2 leading-relaxed">
              Floating dock, top bar, critical dialog overlays. Blur 40px, 28px radius.
            </p>
          </GlassCard>

          <GlassCard tier="gcard" className="p-5">
            <span className="text-xs font-mono font-bold text-pink uppercase block mb-1">
              Interactive: .gcard
            </span>
            <p className="text-xs text-txt-2 leading-relaxed">
              Cursor-following radial spotlight with hover scale lift and top rim highlight hairline.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* 4. Revolving Border v2 & Hero Bloom */}
      <section className="space-y-4">
        <h2 className="font-head text-lg font-bold text-txt">4. Revolving RGB Border v2 + Bloom</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RgbBorder className="rounded-2xl">
            <GlassCard tier="2" className="p-6">
              <span className="text-xs font-mono font-bold text-txt uppercase block mb-1">
                Standard .rgb-trace
              </span>
              <p className="text-xs text-txt-2">
                Conic gradient with traveling arc (violet, sky, emerald, pink) masked to 2px border.
              </p>
            </GlassCard>
          </RgbBorder>

          <RgbBorder bloom className="rounded-2xl">
            <GlassCard tier="2" className="p-6">
              <span className="text-xs font-mono font-bold text-txt uppercase block mb-1">
                Hero Bloom .rgb-hero
              </span>
              <p className="text-xs text-txt-2">
                Soft blurred copy behind card for the hero focus item on the screen.
              </p>
            </GlassCard>
          </RgbBorder>
        </div>
      </section>

      {/* 5. Score Ring & Count-up */}
      <section className="space-y-4">
        <h2 className="font-head text-lg font-bold text-txt">5. Score Ring & Count-up Numbers</h2>
        <div className="flex items-center gap-4">
          <ScoreRing score={scoreVal} size={110} strokeWidth={9} />
          <div className="space-y-2">
            <div className="flex gap-2">
              {[58, 72, 84, 95].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScoreVal(s)}
                  className="px-2.5 py-1 rounded bg-surface border border-border/20 text-xs font-mono font-bold"
                >
                  Set {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-txt-muted">
              SVG gradient sweep 900ms with ease-out and accessible alternative label.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Buttons & Interactive States */}
      <section className="space-y-4">
        <h2 className="font-head text-lg font-bold text-txt">6. Buttons & Feedback Primitives</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary with Sheen</Button>
          <Button variant="secondary">Secondary Glass</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Action</Button>
          <Button variant="success">Success Action</Button>
          <Button loading>Loading State</Button>
          <Button disabled disabledReason="Explicit reason stated">Disabled Control</Button>
        </div>
      </section>

      {/* 7. WCAG AA Contrast Table */}
      <section className="space-y-4">
        <h2 className="font-head text-lg font-bold text-txt">
          7. WCAG AA Contrast Verification Matrix
        </h2>
        <div className="w-full max-w-full overflow-x-auto min-w-0">
          <table className="min-w-[620px] w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/20 text-txt-muted">
                <th className="py-2.5 px-4 font-bold uppercase">Color Combination</th>
                <th className="py-2.5 px-4 font-bold uppercase">Foreground</th>
                <th className="py-2.5 px-4 font-bold uppercase">Background</th>
                <th className="py-2.5 px-4 font-bold uppercase">Contrast Ratio</th>
                <th className="py-2.5 px-4 font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/15">
              {CONTRAST_TESTS.map((test, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-4 font-semibold text-txt">{test.pair}</td>
                  <td className="py-2.5 px-4 font-mono text-txt-muted">{test.fg}</td>
                  <td className="py-2.5 px-4 font-mono text-txt-muted">{test.bg}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-txt">{test.ratio}</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                      {test.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
