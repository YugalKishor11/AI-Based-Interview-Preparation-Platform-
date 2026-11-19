import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { VoiceOrb } from '../../shared/ui/VoiceOrb';
import { PersonaArt } from '../../shared/ui/PersonaArt';
import { ScoreRing } from '../../shared/ui/ScoreRing';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Sparkline } from '../../shared/charts/Sparkline';
import { AreaChart } from '../../shared/charts/AreaChart';
import { RadarChart, RadarMetric } from '../../shared/charts/RadarChart';
import { StreakHeatmap } from '../../shared/charts/StreakHeatmap';
import {
  SEED_PROFILE,
  SEED_PERSONAS,
  SEED_SESSIONS,
  SEED_PROGRESS_SNAPSHOTS,
} from '../../data/mock/seed';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Activity,
  Layers,
  ChevronRight,
  Bookmark,
  Compass,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

const RADAR_METRICS: RadarMetric[] = [
  { label: 'Technical Depth', actual: 4.5, target: 4.6 },
  { label: 'Trade-offs', actual: 4.2, target: 4.4 },
  { label: 'Problem Solving', actual: 4.3, target: 4.2 },
  { label: 'Clarity', actual: 4.0, target: 4.0 },
  { label: 'Structure', actual: 3.6, target: 4.2 },
  { label: 'Staff Scope', actual: 4.4, target: 4.5 },
];

const RECOMMENDATIONS = [
  {
    id: 'rec-1',
    topic: 'System Design',
    title: 'Sliding Window Counters & Redis Rate Limiting',
    reason: 'Gaps identified in recent session s-101',
    difficulty: 'Hard',
    duration: '25m',
  },
  {
    id: 'rec-2',
    topic: 'Behavioral',
    title: 'STAR Structuring without Conversational Drift',
    reason: 'Improve Answer Structure dimension (3.6/5.0)',
    difficulty: 'Medium',
    duration: '20m',
  },
  {
    id: 'rec-3',
    topic: 'Concurrency',
    title: 'CAS Primitives & Tagged Pointers ABA Elimination',
    reason: 'Frequent Staff follow-up topic',
    difficulty: 'Hard',
    duration: '30m',
  },
];

export const DashboardPage: React.FC = () => {
  const profile = SEED_PROFILE;
  const recentSessions = SEED_SESSIONS.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Row 1: Header Greeting, Date, & Demo Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
              Good morning, {profile.name.split(' ')[0]}
            </h1>
            <Badge variant="demo">Demo Data</Badge>
          </div>
          <p className="text-xs text-txt-2">
            Targeting <strong>{profile.targetRole}</strong> · 12 sessions completed across 6 weeks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-txt">Placement Season 2026</div>
            <div className="text-[11px] text-txt-muted">November 19, 2026</div>
          </div>
          <Link to="/app/interview/new" className="btn btn-primary text-xs py-2 px-4 gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Start New Simulation
          </Link>
        </div>
      </div>

      {/* Row 2 (Bento): Start Interview Hero Card (span 8) + Streak Heatmap (span 4) */}
      <div className="bento">
        {/* Start Interview Hero Card */}
        <div className="span-8">
          <RgbBorder bloom className="rounded-2xl h-full">
            <GlassCard tier="gcard" className="h-full flex flex-col justify-between p-7 border border-white/20">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Ready For Simulation
                    </span>
                  </div>
                  <Badge variant="ai">Next Simulation</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <h2 className="font-head text-2xl font-bold text-txt">
                      Staff Distributed Systems & Concurrency
                    </h2>
                    <p className="text-xs text-txt-2 leading-relaxed">
                      Practice multi-region rate limiting, atomic Redis Lua scripts, and high-frequency edge caching with Principal Architect Daniel Brooks.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-elevated text-xs font-mono font-semibold text-txt-2">
                        ⏱ 45 Minutes
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-elevated text-xs font-semibold text-txt-2">
                        👤 Daniel Brooks
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-elevated text-xs font-semibold text-txt-2">
                        🎯 Hard Difficulty
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-center">
                    <VoiceOrb state="idle" size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-6 mt-6 border-t border-border/15 gap-4">
                <div className="flex items-center gap-3">
                  <Link to="/app/interview/new" className="btn btn-primary text-xs py-2.5 px-5">
                    Launch Voice Interview <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  <Link to="/app/interview/check" className="btn btn-secondary text-xs py-2.5 px-4">
                    Test Mic & Audio
                  </Link>
                </div>
                <span className="text-xs text-txt-muted font-mono">Cost: 15 Credits</span>
              </div>
            </GlassCard>
          </RgbBorder>
        </div>

        {/* Streak Heatmap Card */}
        <div className="span-4">
          <GlassCard tier="gcard" className="h-full p-6 flex flex-col justify-between">
            <StreakHeatmap currentStreakDays={profile.streakDays} />
          </GlassCard>
        </div>
      </div>

      {/* Row 3: Four KPI Tiles with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <GlassCard tier="1" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-txt-muted text-xs font-semibold mb-2">
            <span>Total Sessions</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="kpi-value text-txt">12</span>
            <span className="kpi-delta text-emerald-400 font-semibold">+3 this week</span>
          </div>
          <Sparkline data={[4, 6, 8, 9, 11, 12]} height={36} color="#8b5cf6" />
        </GlassCard>

        {/* KPI 2 */}
        <GlassCard tier="1" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-txt-muted text-xs font-semibold mb-2">
            <span>Practice Time</span>
            <Clock className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="kpi-value text-txt">410 <span className="text-sm text-txt-muted font-normal">mins</span></span>
            <span className="kpi-delta text-emerald-400 font-semibold">+45m today</span>
          </div>
          <Sparkline data={[120, 180, 240, 310, 365, 410]} height={36} color="#38bdf8" />
        </GlassCard>

        {/* KPI 3 */}
        <GlassCard tier="1" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-txt-muted text-xs font-semibold mb-2">
            <span>Score Estimate</span>
            <Award className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="kpi-value text-txt">84 <span className="text-xs text-txt-muted font-normal">/ 100</span></span>
            <span className="kpi-delta text-emerald-400 font-semibold">+16 overall</span>
          </div>
          <Sparkline data={[68, 70, 74, 77, 81, 84]} height={36} color="#34d399" />
        </GlassCard>

        {/* KPI 4 */}
        <GlassCard tier="1" className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-txt-muted text-xs font-semibold mb-2">
            <span>Delivery Pace</span>
            <Activity className="w-4 h-4 text-pink" />
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="kpi-value text-txt">138 <span className="text-xs text-txt-muted font-normal">WPM</span></span>
            <span className="kpi-delta text-emerald-400 font-semibold">Optimal</span>
          </div>
          <Sparkline data={[162, 154, 148, 142, 139, 138]} height={36} color="#f472b6" />
        </GlassCard>
      </div>

      {/* Row 4: Rubric Progression Area Chart (span 8) + Readiness Radar (span 4) */}
      <div className="bento">
        <GlassCard tier="gcard" className="span-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-head text-base font-bold text-txt">
                Rubric Progression Over Time
              </h3>
              <p className="text-xs text-txt-2">
                Multidimensional competency trajectory across 6 historical milestones
              </p>
            </div>
            <Badge variant="estimate">AI Estimate</Badge>
          </div>
          <AreaChart data={SEED_PROGRESS_SNAPSHOTS} />
        </GlassCard>

        <GlassCard tier="gcard" className="span-4 p-6 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-head text-base font-bold text-txt">
              Staff Readiness Radar
            </h3>
            <p className="text-xs text-txt-2">
              Current competency vs Staff Software Engineer benchmarks
            </p>
          </div>
          <RadarChart metrics={RADAR_METRICS} size={250} />
        </GlassCard>
      </div>

      {/* Row 5: Recent Sessions with Score Rings (span 8) + Recommended Practice (span 4) */}
      <div className="bento">
        <GlassCard tier="gcard" className="span-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-head text-base font-bold text-txt">Recent Sessions</h3>
            <Link to="/app/history" className="text-xs text-primary font-semibold hover:underline flex items-center">
              View all 12 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-xl bg-surface/70 hover:bg-elevated/80 border border-border/15 flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <ScoreRing score={session.score} size={48} strokeWidth={5} showEstimateBadge={false} label="" />
                  <div>
                    <h4 className="text-xs font-bold text-txt">{session.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-txt-muted mt-0.5">
                      <span className="font-semibold text-secondary">{session.type}</span>
                      <span>·</span>
                      <span>{session.durationMins} mins</span>
                      <span>·</span>
                      <span>{session.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {session.reportId ? (
                    <Link
                      to={`/app/reports/${session.reportId}`}
                      className="btn btn-secondary text-xs py-1.5 px-3"
                    >
                      View Report
                    </Link>
                  ) : (
                    <span className="text-xs text-txt-muted font-mono">Complete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recommended Practice Cards with Reason Chips (span 4) */}
        <GlassCard tier="gcard" className="span-4 p-6 flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-head text-base font-bold text-txt">Recommended Drills</h3>
              <Compass className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-txt-2">Synthesized from your weakest rubric scores</p>
          </div>

          <div className="space-y-3">
            {RECOMMENDATIONS.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl bg-surface/80 border border-border/20 text-left space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    {rec.topic}
                  </span>
                  <span className="text-[10px] text-txt-muted font-mono">{rec.duration}</span>
                </div>
                <h5 className="text-xs font-bold text-txt leading-snug">{rec.title}</h5>
                <div className="pt-1">
                  <span className="inline-block text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    💡 {rec.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link to="/app/practice" className="btn btn-secondary text-xs py-2 mt-4 text-center justify-center">
            Open Full Practice Question Bank (60)
          </Link>
        </GlassCard>
      </div>

      {/* Row 6: Interviewer Quick-Pick Strip */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-head text-lg font-bold text-txt">Virtual AI Interviewers</h3>
            <p className="text-xs text-txt-2">Select a virtual interviewer to start an immediate custom mock</p>
          </div>
          <Link to="/app/interview/new/interviewer" className="text-xs text-primary font-semibold hover:underline flex items-center">
            Compare all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEED_PERSONAS.map((persona) => (
            <PersonaArt
              key={persona.id}
              persona={persona}
              onSelect={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
