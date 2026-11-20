import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { VoiceOrb } from '../../shared/ui/VoiceOrb';
import { FluidWave } from '../../shared/ui/FluidWave';
import { PersonaArt } from '../../shared/ui/PersonaArt';
import { ScoreRing } from '../../shared/ui/ScoreRing';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Sparkline } from '../../shared/charts/Sparkline';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../shared/ui/Accordion';
import { SEED_PERSONAS } from '../../data/mock/seed';
import { ttsService } from '../../shared/audio/ttsService';
import { getVoiceConfig, SAMPLE_PREVIEW_TEXT } from '../../shared/audio/voiceRegistry';
import {
  Mic,
  Shield,
  Layers,
  Code2,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  Award,
  User,
  FileText,
  Volume2,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'system-design', title: 'System Design', icon: Layers, desc: 'Distributed caches, replication, CAP trade-offs, rate limiters, and sharding.', duration: '45m' },
  { id: 'coding', title: 'Live Coding', icon: Code2, desc: 'Algorithms, memory efficiency, edge-cases, and clean idiomatic code.', duration: '40m' },
  { id: 'behavioral', title: 'Behavioral & Leadership', icon: User, desc: 'STAR structure, cross-functional conflicts, and engineering mentorship.', duration: '35m' },
  { id: 'technical', title: 'Deep-Dive Technical', icon: Terminal, desc: 'Runtime internals, database indexing, thread concurrency, and network protocols.', duration: '30m' },
  { id: 'hr', title: 'HR & Culture Alignment', icon: Award, desc: 'Growth philosophy, career trajectories, remote teamwork, and compensation.', duration: '20m' },
  { id: 'dsa', title: 'DSA Problem Solving', icon: Activity, desc: 'Graphs, binary trees, dynamic programming, and space-time complexity analysis.', duration: '45m' },
  { id: 'resume', title: 'Resume & Project Defense', icon: FileText, desc: 'Rigorous interrogation of your past architecture decisions and production impact.', duration: '35m' },
];

const FAQS = [
  {
    q: 'How does voice practice work with the virtual interviewer?',
    a: 'You speak naturally using your real browser microphone. The virtual AI interviewer listens, evaluates your responses, and asks contextual follow-up questions tailored to your experience level.',
  },
  {
    q: 'Are the interviewers real people or AI avatars?',
    a: 'Every interviewer on PrepSphere is a specialized Virtual AI interviewer with distinct styles (e.g. supportive engineering managers, rigorous staff engineers). They are explicitly labelled and never impersonate real people.',
  },
  {
    q: 'How is evidence-linked scoring generated?',
    a: 'Every rubric score requires direct verbatim quotations from your interview transcript. If a topic was not covered in sufficient depth, it is honestly marked as "Insufficient Evidence" with a lower confidence rating.',
  },
  {
    q: 'Do you evaluate accents, video appearance, or physical traits?',
    a: 'Strictly no. PrepSphere never scores accent, gender, race, disability, or physical appearance. Camera feeds are purely optional, local-only, and are never transmitted or analyzed for emotional inference.',
  },
  {
    q: 'What is the 7-day drill plan?',
    a: 'Following every completed session, our evaluator synthesizes your specific structural gaps and generates a prioritized, day-by-day practice roadmap before you re-take the simulation.',
  },
  {
    q: 'Is my resume and audio data kept private?',
    a: 'Yes. Audio recordings are disabled by default. Transcripts and uploaded drafts can be exported or permanently deleted at any time with a single click from your privacy settings.',
  },
  {
    q: 'Can PrepSphere be used as a real-time copilot during real interviews?',
    a: 'No. PrepSphere is exclusively a practice and preparation simulator. We do not support, build, or permit stealth real-time answering aids.',
  },
  {
    q: 'How do usage credits work?',
    a: 'New demo candidates receive 120 complementary credits. Each simulated interview session estimates its credit cost upfront before you begin.',
  },
];

export const LandingPage: React.FC = () => {
  const [voicePreviewText, setVoicePreviewText] = useState<string | null>(null);

  const handlePlayVoice = async (persona: typeof SEED_PERSONAS[0]) => {
    const voice = getVoiceConfig(persona.id);
    setVoicePreviewText(`Playing ${persona.name} (${voice.styleDescription}): "${SAMPLE_PREVIEW_TEXT}"`);
    try {
      await ttsService.previewVoice(persona.id);
    } catch (err) {
      console.warn('Voice preview error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-24 py-8">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 border border-primary/30 mb-8 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="eyebrow !text-txt text-[11px]">The Gold Standard In AI Mock Interviews</span>
          <Badge variant="demo">Preview</Badge>
        </div>

        <h1 className="hero-title max-w-4xl text-txt mb-6">
          Practice the interview. <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-success bg-clip-text text-transparent">
            Hear the follow-ups.
          </span> <br />
          See the evidence.
        </h1>

        <p className="lead mb-8 text-txt-2 text-center">
          Practice voice job interviews with specialized virtual AI interviewers.
          Receive inspectable, evidence-linked evaluations and targeted 7-day drill plans.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <RgbBorder className="rounded-xl">
            <Link to="/app/interview/new" className="btn btn-primary px-8 py-3.5 text-base">
              Start Free Voice Session <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </RgbBorder>
          <Link to="/app" className="btn btn-secondary px-6 py-3.5 text-base">
            Explore Demo Dashboard
          </Link>
        </div>

        <p className="text-xs text-txt-muted flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary" />
          <span>Practice only. No cheating tools. AI scores are estimates with limitations.</span>
        </p>

        {/* Live Room Product Mockup Preview */}
        <div className="w-full max-w-5xl mt-14">
          <RgbBorder bloom className="rounded-2xl">
            <GlassCard tier="2" className="p-5 sm:p-8 text-left border border-white/20">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-txt">
                    Live Room Simulation
                  </span>
                  <Badge variant="preview">Preview</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-txt-muted">Session: s-101</span>
                  <Badge variant="ai">Daniel Brooks (Virtual AI)</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8 items-center">
                {/* Voice Orb & Fluid Wave Stage */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-elevated/40 border border-border/20">
                  <VoiceOrb state="speaking" size="lg" />
                  <div className="w-full mt-4">
                    <FluidWave audioLevel={0.45} height={60} />
                  </div>
                </div>

                {/* Question & Live Evidence Chips */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-surface/80 border border-primary/30">
                    <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                      Question 1 of 5 · Staff System Design
                    </span>
                    <h3 className="text-base font-bold text-txt mt-1 leading-snug">
                      "Design a high-throughput, multi-tenant distributed rate limiter supporting 500,000 req/sec across global regions."
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Follow-up Generated
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Linked
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-secondary/15 border border-secondary/30 text-xs font-semibold text-secondary flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> 138 WPM Delivery
                    </div>
                  </div>

                  <p className="text-xs text-txt-2 leading-relaxed italic bg-elevated/50 p-3 rounded-lg border-l-2 border-primary">
                    "We encapsulate token incrementation and TTL expiration inside an atomic Redis Lua script to eliminate concurrency race conditions..."
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border/15 text-xs text-txt-muted">
                <span>Hold Spacebar or Click Mic to Answer</span>
                <span className="text-emerald-400 font-mono">Audio Stream: Connected (DPR 2.0 Canvas)</span>
              </div>
            </GlassCard>
          </RgbBorder>
        </div>
      </section>

      {/* 2. Virtual Interviewer Strip */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow mb-2 block">Specialized AI Personas</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Choose Your Virtual Interviewer
          </h2>
          <p className="text-sm text-txt-2">
            Every persona embodies distinct interview styles, seniority depths, and probing techniques.
          </p>
          {voicePreviewText && (
            <div className="mt-4 p-2 rounded-lg bg-primary/20 text-xs font-semibold text-primary animate-pulse">
              {voicePreviewText}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SEED_PERSONAS.map((persona) => (
            <PersonaArt
              key={persona.id}
              persona={persona}
              onPreviewVoice={() => handlePlayVoice(persona)}
            />
          ))}
        </div>
      </section>

      {/* 3. Bento Features Grid (6 Tiles) */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow mb-2 block">Engineered For Mastery</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Not Another Generic AI Question List
          </h2>
          <p className="text-sm text-txt-2">
            Engineered with deep rubric models, real browser audio, and transparent feedback.
          </p>
        </div>

        <div className="bento">
          {/* Tile 1: Voice-First (Span 6) */}
          <GlassCard tier="gcard" className="span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-secondary">
                <Mic className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Voice-First Practice</span>
              </div>
              <h3 className="font-head text-xl font-bold text-txt mb-2">
                Real Microphone DSP Analysis
              </h3>
              <p className="text-xs text-txt-2 leading-relaxed">
                Practice answering aloud under natural pressure. Real-time AnalyserNode evaluates cadence, fillers, and thoughtful pauses without faking waveforms.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/15">
              <FluidWave audioLevel={0.35} height={50} />
            </div>
          </GlassCard>

          {/* Tile 2: Evidence-Linked Scoring (Span 6) */}
          <GlassCard tier="gcard" className="span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Evidence-Linked Scoring</span>
              </div>
              <h3 className="font-head text-xl font-bold text-txt mb-2">
                Inspectable Transcript Citations
              </h3>
              <p className="text-xs text-txt-2 leading-relaxed">
                No black-box scores. Every rubric point cites verbatim transcript proof with confidence levels and full dispute capabilities.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-lg bg-elevated/80 border border-primary/30 text-xs text-txt-2 italic">
              "Direct Quote: Explanations on Redis failover Lua scripts eliminated race conditions."
            </div>
          </GlassCard>

          {/* Tile 3: Closed Learning Loop (Span 4) */}
          <GlassCard tier="gcard" className="span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-success">
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Closed Loop</span>
              </div>
              <h3 className="font-head text-lg font-bold text-txt mb-2">7-Day Drill Plan</h3>
              <p className="text-xs text-txt-2 leading-relaxed">
                Targeted practice schedule targeting your weakest rubric dimensions before re-interviewing.
              </p>
            </div>
            <div className="mt-4 flex gap-1 justify-between">
              {['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].map((d) => (
                <div key={d} className="px-2 py-1 rounded bg-elevated text-[10px] font-mono font-bold text-txt-muted text-center">
                  {d}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Tile 4: Coding & System Design (Span 4) */}
          <GlassCard tier="gcard" className="span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-amber-400">
                <Code2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">In-Room Coding</span>
              </div>
              <h3 className="font-head text-lg font-bold text-txt mb-2">Code & System Whiteboard</h3>
              <p className="text-xs text-txt-2 leading-relaxed">
                Live editor with syntax highlighting and structured test cases for real-time technical defense.
              </p>
            </div>
            <div className="mt-4 p-2.5 rounded bg-surface border border-border/20 font-mono text-[11px] text-primary">
              const redis = new Cluster();
            </div>
          </GlassCard>

          {/* Tile 5: Progress Trend (Span 4) */}
          <GlassCard tier="gcard" className="span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-pink">
                <Activity className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Progress Trends</span>
              </div>
              <h3 className="font-head text-lg font-bold text-txt mb-2">Readiness Radar</h3>
              <p className="text-xs text-txt-2 leading-relaxed">
                Track multidimensional skill trajectories against real target career benchmarks.
              </p>
            </div>
            <div className="mt-4">
              <Sparkline data={[68, 70, 74, 77, 81, 84]} height={45} />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 4. How It Works (3 Steps) */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="eyebrow mb-2 block">Systematic Preparation</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Three Steps to Interview Confidence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              num: '01',
              title: 'Configure Your Simulation',
              desc: 'Select interview type (System Design, Coding, Behavioral), target seniority level, and select your Virtual AI interviewer.',
            },
            {
              num: '02',
              title: 'Live Voice Interview',
              desc: 'Speak naturally into your microphone. The interviewer asks adaptive, probing follow-up questions tailored to your responses.',
            },
            {
              num: '03',
              title: 'Inspect & Drill',
              desc: 'Review your evidence-linked score breakdown, learn from model answers, and follow your customized 7-day practice plan.',
            },
          ].map((step, idx) => (
            <GlassCard key={idx} tier="gcard" className="relative text-left">
              <div className="text-4xl font-head font-extrabold text-primary/30 mb-4 tabular-nums">
                {step.num}
              </div>
              <h3 className="text-lg font-bold font-head text-txt mb-2">{step.title}</h3>
              <p className="text-xs text-txt-2 leading-relaxed">{step.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 5. Interview Categories */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow mb-2 block">Comprehensive Coverage</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Seven Interview Tracks
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <GlassCard key={cat.id} tier="1" className="p-5 text-left flex flex-col justify-between hover:border-primary/50 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-head font-bold text-sm text-txt mb-1">{cat.title}</h3>
                  <p className="text-xs text-txt-2 line-clamp-3 leading-relaxed mb-4">{cat.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/15 text-[11px] text-txt-muted">
                  <span>Standard Duration</span>
                  <span className="font-mono font-bold text-txt">{cat.duration}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* 6. Sample Report Showcase */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow mb-2 block">Evidence-Linked Evaluation</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Sample Interview Feedback Report
          </h2>
          <p className="text-sm text-txt-2">
            Every evaluation separates content mastery from delivery pacing.
          </p>
        </div>

        <GlassCard tier="2" className="p-8 max-w-4xl mx-auto text-left border border-white/20">
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-border/20 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="sample">Sample Report</Badge>
                <span className="text-xs text-txt-muted">Distributed Rate Limiter & Concurrency</span>
              </div>
              <h3 className="font-head text-xl font-bold text-txt">
                Candidate: Alex Chen · Staff Candidate
              </h3>
            </div>
            <ScoreRing score={84} size={90} strokeWidth={8} showEstimateBadge={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-xl bg-elevated/60 border border-border/15">
              <span className="text-[11px] text-txt-muted">Pacing</span>
              <div className="text-base font-bold text-txt font-mono">138 WPM</div>
              <span className="text-[10px] text-emerald-400">Optimal Range (120-150)</span>
            </div>
            <div className="p-4 rounded-xl bg-elevated/60 border border-border/15">
              <span className="text-[11px] text-txt-muted">Fillers</span>
              <div className="text-base font-bold text-txt font-mono">4.1 / min</div>
              <span className="text-[10px] text-emerald-400">Low Frequency</span>
            </div>
            <div className="p-4 rounded-xl bg-elevated/60 border border-border/15">
              <span className="text-[11px] text-txt-muted">Confidence Index</span>
              <div className="text-base font-bold text-txt font-mono">High (0.91)</div>
              <span className="text-[10px] text-secondary">Verifiable Quotes</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface/90 border border-primary/30">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Transcript Evidence Quote
            </h4>
            <p className="text-xs text-txt-2 italic leading-relaxed">
              "We encapsulate token incrementation and TTL expiration inside an atomic Redis Lua script to eliminate concurrency race conditions."
            </p>
          </div>
        </GlassCard>
      </section>

      {/* 7. Neutral Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow mb-2 block">Honest Comparison</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Why PrepSphere is Different
          </h2>
        </div>

        <div className="w-full max-w-full overflow-x-auto min-w-0">
          <table className="min-w-[560px] w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/20 text-txt-muted">
                <th className="py-3 px-4 font-bold uppercase">Capability</th>
                <th className="py-3 px-4 font-bold uppercase text-primary">PrepSphere</th>
                <th className="py-3 px-4 font-bold uppercase">Generic AI Mocks</th>
                <th className="py-3 px-4 font-bold uppercase">Human Mocks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/15 text-txt-2">
              <tr>
                <td className="py-3 px-4 font-semibold text-txt">Real Microphone AnalyserNode</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (DSP smoothed)</td>
                <td className="py-3 px-4">Often text-only or simulated</td>
                <td className="py-3 px-4">Yes (human call)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-txt">Evidence-Linked Transcript Citations</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (every score cited)</td>
                <td className="py-3 px-4">Generic summaries</td>
                <td className="py-3 px-4">Varies by interviewer</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-txt">Content Scored Separately from Accent/Video</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (strict fairness)</td>
                <td className="py-3 px-4">Often conflated</td>
                <td className="py-3 px-4">Subject to human bias</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-txt">7-Day Targeted Drill Plan</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (automated)</td>
                <td className="py-3 px-4">No follow-up plan</td>
                <td className="py-3 px-4">Manual notes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-txt">Session Cost</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Included in credits</td>
                <td className="py-3 px-4">$25 - $45 / mo</td>
                <td className="py-3 px-4">$150 - $250 / session</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow mb-2 block">Common Questions</span>
          <h2 className="text-3xl font-bold font-head text-txt mb-3">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 9. Final CTA Band */}
      <section className="max-w-7xl mx-auto px-6 w-full pb-12">
        <RgbBorder bloom className="rounded-3xl">
          <GlassCard tier="3" className="p-6 sm:p-12 text-center border border-white/20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-head font-extrabold text-txt mb-4">
              Ready to Master Your Next Technical Interview?
            </h2>
            <p className="text-xs sm:text-sm text-txt-2 max-w-xl mx-auto mb-8">
              Join thousands of engineers practicing with honest, evidence-linked voice simulations.
            </p>
            <div className="flex justify-center">
              <Link to="/signup" className="btn btn-primary px-6 sm:px-8 py-3.5 text-sm sm:text-base text-center max-w-full">
                Get Started with 120 Demo Credits
              </Link>
            </div>
          </GlassCard>
        </RgbBorder>
      </section>
    </div>
  );
};
