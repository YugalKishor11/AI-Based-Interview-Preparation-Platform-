import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Mic, MicOff, Volume2, Video, VideoOff, Play, Pause, Square, Sparkles, CheckCircle2,
  AlertCircle, Shield, Award, BarChart3, TrendingUp, Calendar, Clock, Terminal,
  Code2, ArrowRight, ArrowLeft, RefreshCw, Layers, Sliders, Settings, User,
  FileText, ExternalLink, ChevronRight, ChevronDown, Bookmark, Star, Zap,
  Sun, Moon, Laptop, Eye, HelpCircle, Check, Search, Filter, Share2, Printer,
  Info, AlertTriangle, X, VolumeX, FastForward, Disc, Activity, Lock, Radio,
  Compass, Cpu, Command, MoreHorizontal, Bell, Maximize2
} from "lucide-react";

// ==========================================
// 1. DATA CONTRACTS & SEED MOCK DATA
// ==========================================

const INTERVIEW_TYPES = [
  { id: "system-design", label: "System Design", icon: Layers, desc: "Distributed architectures, scalability, trade-offs & bottlenecks", duration: "45m" },
  { id: "coding", label: "Live Coding", icon: Code2, desc: "Algorithms, data structures, clean code, edge cases & complexity", duration: "40m" },
  { id: "behavioral", label: "Behavioral & Leadership", icon: User, desc: "STAR framework, stakeholder conflict, team leadership & mentorship", duration: "35m" },
  { id: "technical", label: "Deep-Dive Technical", icon: Terminal, desc: "Language internals, concurrency, memory, DB indexing & networking", duration: "30m" },
  { id: "hr", label: "HR & Culture Alignment", icon: Award, desc: "Motivation, compensation expectations, work philosophy & remote dynamics", duration: "20m" },
  { id: "dsa", label: "DSA Problem Solving", icon: Activity, desc: "Trees, graphs, dynamic programming & optimal space-time trade-offs", duration: "45m" },
  { id: "resume", label: "Resume & Project Defense", icon: FileText, desc: "Deep drill into past architectural decisions, metrics & impact", duration: "35m" },
];

const PERSONAS = [
  {
    id: "p1",
    name: "Aanya Rao",
    title: "Senior Engineering Manager",
    style: "Supportive",
    description: "Warm, structured, probing follow-ups on engineering management and system resilience.",
    languages: "English, Hindi",
    voiceGender: "female",
    sampleLine: "Welcome Alex. Let's walk through how you balance architectural purity with rapid delivery deadlines.",
    p1: "rgba(139, 92, 246, 0.9)",
    p2: "rgba(244, 114, 182, 0.7)",
  },
  {
    id: "p2",
    name: "Meera Kapoor",
    title: "HR Business Partner",
    style: "Balanced",
    description: "Calm, conversational, highly focused on leadership principles, EQ, and stakeholder consensus.",
    languages: "English, Hindi",
    voiceGender: "female",
    sampleLine: "Hi Alex. I'd love to hear about a critical instance where team priorities clashed with company goals.",
    p1: "rgba(34, 211, 238, 0.9)",
    p2: "rgba(52, 211, 153, 0.7)",
  },
  {
    id: "p3",
    name: "Rohan Mehta",
    title: "Staff Software Engineer",
    style: "Challenging",
    description: "Direct, fast-paced, relentless on concurrency race conditions, memory safety, and edge-cases.",
    languages: "English, Hindi",
    voiceGender: "male",
    sampleLine: "Let's dig in. If your Redis cluster experiences a split-brain under peak load, what fails first and why?",
    p1: "rgba(34, 211, 238, 0.9)",
    p2: "rgba(139, 92, 246, 0.8)",
  },
  {
    id: "p4",
    name: "Daniel Brooks",
    title: "Principal Infrastructure Architect",
    style: "Challenging",
    description: "Thoughtful, deep system architecture focus, probing CAP theorem compromises and distributed clock skews.",
    languages: "English",
    voiceGender: "male",
    sampleLine: "Good day Alex. Let's examine how you ensure sliding-window rate limiting consistency across multi-region edge caches.",
    p1: "rgba(139, 92, 246, 0.9)",
    p2: "rgba(34, 211, 238, 0.8)",
  },
];

const MOCK_PAST_SESSIONS = [
  { id: "s-101", title: "Distributed Rate Limiter & Concurrency", type: "System Design", personaId: "p4", score: 84, durationMins: 38, daysAgo: 0, date: "Today", isDemo: true },
  { id: "s-102", title: "Staff Leadership & Cross-Functional Conflict", type: "Behavioral", personaId: "p2", score: 79, durationMins: 42, daysAgo: 2, date: "2 days ago", isDemo: true },
  { id: "s-103", title: "High-Throughput WebSocket Gateway", type: "System Design", personaId: "p4", score: 86, durationMins: 45, daysAgo: 4, date: "4 days ago", isDemo: true },
  { id: "s-104", title: "React Rendering Internals & Profiling", type: "Technical", personaId: "p3", score: 77, durationMins: 30, daysAgo: 6, date: "6 days ago", isDemo: true },
  { id: "s-105", title: "Graphs, Shortest Paths & Cycle Detection", type: "DSA", personaId: "p3", score: 72, durationMins: 35, daysAgo: 9, date: "9 days ago", isDemo: true },
  { id: "s-106", title: "Career Arc & Executive Stakeholder Influence", type: "HR", personaId: "p2", score: 81, durationMins: 20, daysAgo: 11, date: "11 days ago", isDemo: true },
];

const MOCK_REPORT_DATA = {
  sessionId: "s-101",
  title: "Distributed Rate Limiter & Concurrency",
  type: "System Design",
  interviewer: PERSONAS[3],
  date: "November 18, 2026",
  duration: "38 mins",
  overallScore: 84,
  confidence: "High (0.91)",
  scoreDelta: "+6 vs 30-day baseline",
  summary: "Alex displayed robust mastery of distributed token bucket architectures, multi-region edge synchronization, and fallback degraded states. Explanations on Redis cluster failovers and atomic Lua scripts were exceptionally rigorous, though backpressure feedback mechanisms could have been addressed earlier in the framing.",
  rubric: [
    { dimension: "Technical Accuracy", score: 4.5, max: 5.0, confidence: "High", quote: "We encapsulate token incrementation and TTL expiration inside an atomic Redis Lua script to eliminate concurrency race conditions.", why: "Accurately identified read-modify-write hazard in distributed caches." },
    { dimension: "Reasoning & Trade-offs", score: 4.2, max: 5.0, confidence: "High", quote: "A sliding log provides exact window guarantees but incurs prohibitive O(N) memory under sudden DDoS spikes compared to sliding window counters.", why: "Strong comparative trade-off analysis between memory footprint and precision." },
    { dimension: "Problem Solving & Scale", score: 4.3, max: 5.0, confidence: "Medium", quote: "We establish a local in-memory token cache fallback inside Envoy reverse proxies whenever the remote Redis latency exceeds 15ms.", why: "Resilient architectural fallback when central dependency degrades." },
    { dimension: "Communication Clarity", score: 4.0, max: 5.0, confidence: "Medium", quote: "Let's first clarify requirements: are we throttling by client IP, authenticated user token, or API route?", why: "Clean clarifying cadence at start of problem." },
    { dimension: "Answer Structure", score: 3.6, max: 5.0, confidence: "Medium", quote: "To handle multi-region replication, we could use CRDTs... or maybe eventual consistency with regional gossip...", why: "Hesitant structural pivoting between conflicting distributed approaches." },
    { dimension: "Role Relevance (Staff+)", score: 4.4, max: 5.0, confidence: "High", quote: "I'd delegate circuit breaking tuning to the platform team while providing a unified SDK middleware for client teams.", why: "Demonstrated organizational boundary insight suited for Staff level." },
  ],
  delivery: {
    wpm: 138,
    wpmStatus: "Optimal (120-150 WPM)",
    fillersPerMin: 4.1,
    fillersStatus: "Low (Target < 5)",
    avgPauseSeconds: 0.9,
    pauseStatus: "Thoughtful Cadence",
  },
  questionsFeedback: [
    {
      qIndex: 1,
      qText: "Design a high-throughput, multi-tenant distributed rate limiter supporting 500,000 req/sec across global regions.",
      candidateTranscript: "To handle 500,000 req/sec globally, we cannot rely on a single database. I recommend deploying Envoy proxies at the regional edges with localized Redis Sentinel clusters. We encapsulate token incrementation inside an atomic Redis Lua script to eliminate concurrency race conditions. If the regional Redis becomes unreachable, the proxy gracefully falls back to a coarse in-memory leaky bucket to avoid catastrophic API outages.",
      evidence: "We encapsulate token incrementation inside an atomic Redis Lua script to eliminate concurrency race conditions.",
      evidenceReason: "Demonstrated deep knowledge of atomicity without requiring heavy two-phase commit distributed locks.",
      strengths: ["Atomic Lua scripting eliminates distributed locks", "Edge-tier fallback mitigates central cache failure"],
      gaps: ["Did not explicitly state how client tokens are synchronized across geographical zones."],
      modelAnswer: "A production-grade design utilizes two tiers: Envoy proxies running local Token Bucket algorithms with periodic batch synchronization against regional Redis clusters. Atomic increments with Lua or Redis Cell module provide sub-millisecond guarantees, with local fallback buffers on network partition."
    },
    {
      qIndex: 2,
      qText: "How do you handle clock skew and synchronized time windows across geographically dispersed nodes?",
      candidateTranscript: "Clock skew is a fundamental problem with NTP synchronization across AWS availability zones. Instead of relying on system wall-clock timestamps for window boundaries, we can either leverage Google TrueTime API style GPS/atomic clock bounds or use logical sequence timestamps combined with relative monotonically increasing clocks like clock_gettime(CLOCK_MONOTONIC).",
      evidence: "Instead of relying on system wall-clock timestamps, use monotonically increasing clocks and logical counters.",
      evidenceReason: "Directly circumvented unpredictable network time protocol drift.",
      strengths: ["Acknowledged NTP limitations at millisecond thresholds", "Suggested logical clocks over absolute wall timestamps"],
      gaps: ["Could have explained sliding window counters with relative offsets in greater detail."],
      modelAnswer: "Avoid relying on absolute synchronized wall-clock time for micro-windows. Instead, segment rate limits into small relative sub-buckets (e.g. 1-second chunks) and track expiration using local monotonic time relative to the node, synchronizing delta counts rather than timestamps."
    }
  ],
  drillPlan: [
    { day: "Day 1-2", focus: "Answer Structure & Framing", minutes: 30, task: "Practice the 4-part STAR-System hybrid framing for open-ended trade-offs without conversational drifting." },
    { day: "Day 3-4", focus: "CRDTs & Multi-Region Sync", minutes: 45, task: "Solve 2 distributed state synchronization questions focusing on Conflict-Free Replicated Data Types vs Gossip protocols." },
    { day: "Day 5-6", focus: "Backpressure & Circuit Breakers", minutes: 40, task: "Mock drill on catastrophic failure cascades and adaptive throttling thresholds under degraded downstream latency." },
    { day: "Day 7", focus: "Full Re-interview Simulation", minutes: 45, task: "Re-take the Staff Distributed Systems simulation with Daniel Brooks to measure rubric delta." }
  ]
};

const PRACTICE_BANK = [
  { id: "qb-1", topic: "System Design", level: "Hard", title: "Design a Global Distributed Rate Limiter", tags: ["Redis", "Concurrency", "Lua"], saved: true, hint1: "Consider atomic operations in memory caches like Redis.", hint2: "Sliding window log vs sliding window counter: balance memory vs precision." },
  { id: "qb-2", topic: "React / Frontend", level: "Medium", title: "Explain Fiber Reconciliation and Concurrent Mode", tags: ["React", "DOM", "Scheduling"], saved: true, hint1: "Think about cooperative multitasking and message loops.", hint2: "requestIdleCallback and time-slicing prioritization." },
  { id: "qb-3", topic: "Behavioral", level: "Hard", title: "Handling Critical Technical Disagreement with Principal Engineers", tags: ["Conflict", "Staff+", "Influence"], saved: false, hint1: "Focus on empirical data and prototyping rather than seniority.", hint2: "Demonstrate 'Disagree and Commit' with clear success criteria." },
  { id: "qb-4", topic: "DSA", level: "Hard", title: "LRU Cache with Time-to-Live (TTL) Eviction", tags: ["Hash Map", "Doubly-Linked List", "Heaps"], saved: true, hint1: "Pair a standard LRU doubly linked list with a min-heap for expiration timestamps.", hint2: "Lazy eviction on get() vs background cleanup worker trade-offs." },
  { id: "qb-5", topic: "Database", level: "Medium", title: "B-Tree vs LSM-Tree Storage Engines for Write-Heavy Loads", tags: ["PostgreSQL", "Cassandra", "I/O"], saved: false, hint1: "Sequential I/O vs random page updates.", hint2: "Write amplification vs read compaction overhead." },
  { id: "qb-6", topic: "System Design", level: "Hard", title: "Real-time Collaborative Document Editing (OT vs CRDT)", tags: ["WebSockets", "CRDT", "State"], saved: false, hint1: "Operational Transformation requires central sequencer; CRDTs converge peer-to-peer.", hint2: "Tombstones, memory bloat, and causal consistency." },
  { id: "qb-7", topic: "Behavioral", level: "Medium", title: "Navigating Unrealistic Deadlines Imposed by Executives", tags: ["Expectations", "Trade-offs", "Communication"], saved: true, hint1: "Never just say 'no'; present scoped trade-offs with risk assessments.", hint2: "Demonstrate phased delivery with an MVP cutline." },
  { id: "qb-8", topic: "Coding", level: "Medium", title: "Implement a Promise.allSettled Polyfill with Concurrency Limit", tags: ["Async", "JavaScript", "Promises"], saved: false, hint1: "Track pending count, fulfilled array, and loop through indexed tasks.", hint2: "Handle immediate reject safety and clean closure states." },
];

// ==========================================
// 2. MACOS & VISIONOS LIQUID GLASS ENGINE
// ==========================================

const GLOBAL_STYLES = `
:root, [data-theme="dark"] {
  --c-bg: 7 11 20;
  --c-surface: 15 22 38;
  --c-elevated: 22 32 54;
  --c-primary: 139 92 246;
  --c-primary-hover: 124 77 232;
  --c-secondary: 56 189 248;
  --c-success: 52 211 153;
  --c-warning: 251 191 36;
  --c-danger: 248 113 113;
  --c-text: 248 250 252;
  --c-text-muted: 148 163 184;

  /* Liquid Glass Specular Tokens */
  --liquid-glass-bg: rgba(22, 32, 54, 0.45);
  --liquid-glass-strong: rgba(15, 23, 42, 0.75);
  --liquid-specular-top: rgba(255, 255, 255, 0.45);
  --liquid-specular-inner: inset 0 1px 1px 0 rgba(255, 255, 255, 0.42), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  --liquid-outer-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.55), 0 8px 16px -4px rgba(0, 0, 0, 0.35);
  --dock-glass: rgba(15, 23, 42, 0.55);
}

[data-theme="light"] {
  --c-bg: 241 245 251;
  --c-surface: 255 255 255;
  --c-elevated: 236 242 250;
  --c-primary: 124 58 237;
  --c-primary-hover: 109 40 217;
  --c-secondary: 2 132 199;
  --c-success: 16 185 129;
  --c-warning: 217 119 6;
  --c-danger: 225 29 72;
  --c-text: 15 23 42;
  --c-text-muted: 100 116 139;

  /* Liquid Glass Light Tokens */
  --liquid-glass-bg: rgba(255, 255, 255, 0.65);
  --liquid-glass-strong: rgba(255, 255, 255, 0.88);
  --liquid-specular-top: rgba(255, 255, 255, 0.95);
  --liquid-specular-inner: inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  --liquid-outer-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06);
  --dock-glass: rgba(255, 255, 255, 0.72);
}

@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes liquid-spin {
  to { --angle: 360deg; }
}

@keyframes liquid-drift-1 {
  0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  50% { transform: translate3d(7vw, 9vh, 0) scale(1.15) rotate(15deg); }
  100% { transform: translate3d(-4vw, 5vh, 0) scale(0.95) rotate(-10deg); }
}

@keyframes liquid-drift-2 {
  0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  50% { transform: translate3d(-9vw, 6vh, 0) scale(0.92) rotate(-18deg); }
  100% { transform: translate3d(6vw, -8vh, 0) scale(1.1) rotate(12deg); }
}

@keyframes liquid-pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.8; filter: blur(50px); }
  50% { transform: scale(1.12); opacity: 1; filter: blur(65px); }
}

/* Authentic visionOS Liquid Glass Surface */
.liquid-glass {
  background: var(--liquid-glass-bg);
  backdrop-filter: blur(44px) saturate(210%);
  -webkit-backdrop-filter: blur(44px) saturate(210%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: var(--liquid-specular-inner), var(--liquid-outer-shadow);
  position: relative;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease;
}

.liquid-glass-strong {
  background: var(--liquid-glass-strong);
  backdrop-filter: blur(56px) saturate(220%);
  -webkit-backdrop-filter: blur(56px) saturate(220%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: var(--liquid-specular-inner), var(--liquid-outer-shadow);
}

/* Interactive 3D Cursor Specular Sheen */
.liquid-sheen-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  background: var(--liquid-glass-bg);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: var(--liquid-specular-inner), var(--liquid-outer-shadow);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transform-style: preserve-3d;
}

.liquid-sheen-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.18), transparent 70%);
  z-index: 1;
}

.liquid-sheen-card:hover::before {
  opacity: 1;
}

.liquid-sheen-card:hover {
  transform: translateY(-3px) scale(1.006);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: var(--liquid-specular-inner), 0 30px 60px -15px rgba(0, 0, 0, 0.65);
}

/* Chromatic Caustic Edge */
.chromatic-border {
  position: relative;
  isolation: isolate;
  border-radius: 24px;
}

.chromatic-border::before {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  z-index: -1;
  background: conic-gradient(from var(--angle), transparent 0% 45%, rgba(139, 92, 246, 0.9) 60%, rgba(56, 189, 248, 0.9) 75%, rgba(52, 211, 153, 0.9) 88%, transparent 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1.5px;
  animation: liquid-spin 6s linear infinite;
}

.chromatic-hero::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: inherit;
  z-index: -2;
  pointer-events: none;
  opacity: 0.45;
  filter: blur(28px);
  background: conic-gradient(from var(--angle), transparent 0% 45%, rgba(139, 92, 246, 0.7) 60%, rgba(56, 189, 248, 0.7) 80%, transparent 100%);
  animation: liquid-spin 6s linear infinite;
}

/* macOS Floating Dock */
.macos-dock {
  background: var(--dock-glass);
  backdrop-filter: blur(48px) saturate(210%);
  -webkit-backdrop-filter: blur(48px) saturate(210%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.45), 0 20px 48px -10px rgba(0, 0, 0, 0.55);
}

/* Ambient Bokeh Layers */
.ambient-bokeh-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.bokeh-orb {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: screen;
  filter: blur(95px);
  will-change: transform;
}

.bokeh-violet {
  width: 55vw; height: 55vw;
  left: -12vw; top: -15vh;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(109, 40, 217, 0.2) 50%, transparent 75%);
  animation: liquid-drift-1 30s ease-in-out infinite alternate;
}

.bokeh-cyan {
  width: 50vw; height: 50vw;
  right: -10vw; top: 15vh;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.38) 0%, rgba(14, 165, 233, 0.15) 55%, transparent 75%);
  animation: liquid-drift-2 34s ease-in-out infinite alternate;
}

.bokeh-pink {
  width: 42vw; height: 42vw;
  right: 18vw; bottom: -8vh;
  background: radial-gradient(circle, rgba(244, 114, 182, 0.3) 0%, rgba(219, 39, 119, 0.12) 55%, transparent 75%);
  animation: liquid-drift-1 38s ease-in-out infinite alternate-reverse;
}

.bokeh-emerald {
  width: 40vw; height: 40vw;
  left: 20vw; bottom: -12vh;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(5, 150, 105, 0.08) 55%, transparent 75%);
  animation: liquid-drift-2 42s ease-in-out infinite alternate;
}

/* Reduced Effects Mode */
[data-effects="reduced"] .bokeh-orb {
  animation: none !important;
  opacity: 0.15 !important;
}
[data-effects="reduced"] .chromatic-border::before,
[data-effects="reduced"] .chromatic-hero::after {
  animation: none !important;
  background: rgba(139, 92, 246, 0.35) !important;
}
[data-effects="reduced"] .liquid-glass,
[data-effects="reduced"] .liquid-sheen-card {
  backdrop-filter: none !important;
  background: rgb(var(--c-surface)) !important;
}
`;

// ==========================================
// 3. SOUND SYNTHESIS & VOICE HELPERS
// ==========================================

function playAudioTone(freq = 440, type = "sine", duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("WebAudio context not permitted yet", err);
  }
}

function speakWithWebSpeech(text, voiceGender = "female", onEndCallback = null) {
  if (!("speechSynthesis" in window)) {
    if (onEndCallback) setTimeout(onEndCallback, 1500);
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = voiceGender === "female" ? 1.15 : 0.95;

  const voices = window.speechSynthesis.getVoices();
  const matched = voices.find(v =>
    voiceGender === "female"
      ? (v.name.includes("Samantha") || v.name.includes("Zira") || v.name.includes("Google UK English Female") || v.name.includes("Female"))
      : (v.name.includes("David") || v.name.includes("Mark") || v.name.includes("Google UK English Male") || v.name.includes("Male"))
  );
  if (matched) utterance.voice = matched;

  if (onEndCallback) {
    utterance.onend = () => onEndCallback();
    utterance.onerror = () => onEndCallback();
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

// ==========================================
// 4. APPLE-GRADE REUSABLE COMPONENTS
// ==========================================

const LiquidCard = ({ children, className = "", isInteractive = true, style = {}, onClick }) => {
  const cardRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!cardRef.current || !isInteractive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mx", `${x}px`);
    cardRef.current.style.setProperty("--my", `${y}px`);

    // Subtle 3D card tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = (y - centerY) / 28;
    const tiltY = -(x - centerX) / 28;
    cardRef.current.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
  };

  const handlePointerLeave = () => {
    if (!cardRef.current || !isInteractive) return;
    cardRef.current.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={style}
      className={`liquid-sheen-card ${isInteractive ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

const DemoBadge = ({ text = "Demo", variant = "warning" }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase border border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
    <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
    {text}
  </span>
);

const PersonaAvatar = ({ initials, p1, p2, size = "md", isVirtual = true }) => {
  const sizeClasses = {
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-xl font-bold",
    xl: "w-28 h-28 text-3xl font-extrabold",
  };

  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center font-bold text-white shadow-xl overflow-hidden flex-shrink-0 ${sizeClasses[size]}`}
      style={{
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${p1} 45%, ${p2} 100%)`,
        boxShadow: "inset 0 1px 1px 0 rgba(255,255,255,0.6), 0 8px 20px -4px rgba(0,0,0,0.4)"
      }}
    >
      <span className="drop-shadow-md z-10">{initials}</span>
      <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
      {isVirtual && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-400/90 shadow-[0_0_8px_#22d3ee]" title="Virtual AI Avatar" />
      )}
    </div>
  );
};

const LiquidSiriOrb = ({ state = "idle", size = 160 }) => {
  // state: "idle" | "speaking" | "listening" | "processing"
  const stateGlow = {
    idle: "from-violet-500/80 via-indigo-600/70 to-sky-400/80 shadow-violet-500/40",
    speaking: "from-sky-400 via-violet-500 to-pink-500 shadow-sky-400/60",
    listening: "from-emerald-400 via-teal-500 to-sky-400 shadow-emerald-400/60",
    processing: "from-amber-400 via-purple-600 to-indigo-600 shadow-purple-500/50",
  }[state];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Dynamic blurred specular aura */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${stateGlow} blur-2xl opacity-75 transition-all duration-700 animate-pulse`}
      />
      {/* Morphing glass orb */}
      <div
        className={`w-full h-full rounded-full bg-gradient-to-tr ${stateGlow} p-[2px] shadow-2xl transition-all duration-500`}
        style={{
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.6), 0 16px 36px rgba(0,0,0,0.5)"
        }}
      >
        <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center relative overflow-hidden">
          {/* Specular glass arc highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 via-white/5 to-transparent rounded-t-full pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <Sparkles className="w-7 h-7 text-white/90 animate-pulse" />
            <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase mt-1">visionOS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreRingSvg = ({ score = 84, size = 130, stroke = 9, label = "AI Estimate" }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#appleHealthGradient)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="appleHealthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold tracking-tight drop-shadow-sm">{score}</span>
        {label && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>}
      </div>
    </div>
  );
};

// ==========================================
// 5. APPLE SIRI FLUID SINUSOIDAL WAVEFORM
// ==========================================

const FluidSiriWaveCanvas = ({ analyserNode, isRecording = false }) => {
  const canvasRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dataArray = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let amplitude = 4;
      if (analyserNode && isRecording && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, v) => acc + v, 0);
        const avg = sum / dataArray.length;
        amplitude = Math.max(4, (avg / 255) * (height / 2.2));
      }

      phaseRef.current += isRecording ? 0.08 : 0.02;

      // Draw 3 layered fluid sinusoidal waves with chromatic dispersion
      const waves = [
        { stroke: "rgba(56, 189, 248, 0.85)", freq: 0.024, speed: 1.0, ampMult: 1.0 },
        { stroke: "rgba(139, 92, 246, 0.75)", freq: 0.032, speed: -0.8, ampMult: 0.75 },
        { stroke: "rgba(52, 211, 153, 0.65)", freq: 0.018, speed: 1.3, ampMult: 0.55 },
      ];

      waves.forEach(w => {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = w.stroke;
        ctx.lineCap = "round";

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * w.freq + phaseRef.current * w.speed) * amplitude * w.ampMult;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [analyserNode, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={460}
      height={64}
      className="w-full h-14 rounded-2xl bg-black/25 backdrop-blur-md px-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
    />
  );
};

// ==========================================
// 6. MAIN APPLICATION COMPONENT
// ==========================================

export default function App() {
  // Navigation State
  // routes: 'landing' | 'dashboard' | 'setup' | 'device-check' | 'live-room' | 'report' | 'practice' | 'history' | 'settings'
  const [currentRoute, setCurrentRoute] = useState("landing");
  const [selectedReportId, setSelectedReportId] = useState("s-101");
  const [theme, setTheme] = useState("dark");
  const [reducedEffects, setReducedEffects] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // System Time for Menu Bar
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [setupConfig, setSetupConfig] = useState({
    type: "system-design",
    role: "Staff Software Engineer",
    level: "Senior / Staff",
    difficulty: "Challenging",
    duration: 35,
    questionCount: 4,
    personaId: "p4",
    allowFollowUps: true,
    recordSession: false,
    consentAgreed: true,
  });

  // Audio & Mic Stream State
  const [micGranted, setMicGranted] = useState(false);
  const [micAudioContext, setMicAudioContext] = useState(null);
  const [micAnalyser, setMicAnalyser] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [speakerTested, setSpeakerTested] = useState(false);
  const videoPreviewRef = useRef(null);

  // Live Interview Room State
  const [interviewStatus, setInterviewStatus] = useState("idle"); // idle | speaking | listening | processing | finished
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [candidateInputText, setCandidateInputText] = useState("");
  const [liveTranscript, setLiveTranscript] = useState([
    {
      role: "interviewer",
      name: "Daniel Brooks",
      text: "Hello Alex. Let's start with your high-level approach for a multi-region distributed rate limiter handling 500,000 req/sec.",
      time: "00:05",
    },
  ]);
  const [codeEditorText, setCodeEditorText] = useState(
`// Candidate Code Sandbox (DSA / Coding Drill)
class DistributedRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    this.buckets = new Map();
  }

  allowRequest(clientId, timestamp) {
    // Atomic Token Bucket check
    return true;
  }
}`
  );
  const [connectionQuality, setConnectionQuality] = useState("Ultra HD 4K");
  const [simulatedReconnecting, setSimulatedReconnecting] = useState(false);
  const [whyDrawerDimension, setWhyDrawerDimension] = useState(null);

  // Practice bank saved state
  const [practiceQuestions, setPracticeQuestions] = useState(PRACTICE_BANK);
  const [practiceSearch, setPracticeSearch] = useState("");
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState("All");
  const [activePracticeDrawer, setActivePracticeDrawer] = useState(null);
  const [practiceHintStep, setPracticeHintStep] = useState(0);

  // History Comparison state
  const [comparedSessionIds, setComparedSessionIds] = useState([]);
  const [comparisonDrawerOpen, setComparisonDrawerOpen] = useState(false);

  // Inject CSS Tokens
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-effects", reducedEffects ? "reduced" : "full");
  }, [theme, reducedEffects]);

  // Live Room Timer
  useEffect(() => {
    let interval;
    if (currentRoute === "live-room" && interviewStatus !== "finished") {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentRoute, interviewStatus]);

  // Stop media on leaving room or check
  const stopAllMediaTracks = useCallback(() => {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (micAudioContext && micAudioContext.state !== "closed") {
      micAudioContext.close();
      setMicAudioContext(null);
      setMicAnalyser(null);
    }
    setMicGranted(false);
    setCameraActive(false);
  }, [micStream, cameraStream, micAudioContext]);

  // Request actual browser microphone
  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicStream(stream);
      setMicAudioContext(audioCtx);
      setMicAnalyser(analyser);
      setMicGranted(true);
      playAudioTone(580, "sine", 0.2);
    } catch (err) {
      console.warn("Microphone permission denied or not found:", err);
      setMicGranted(false);
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (cameraActive) {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        setCameraStream(stream);
        setCameraActive(true);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (e) {
        console.warn("Camera access denied or unavailable", e);
        setCameraActive(false);
      }
    }
  };

  // Live Interview Script Progression
  const handleCandidateSubmitAnswer = () => {
    if (!candidateInputText.trim()) return;

    const currentText = candidateInputText;
    setCandidateInputText("");
    const timestamp = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

    // Add candidate turn
    setLiveTranscript(prev => [
      ...prev,
      { role: "candidate", name: "Alex Chen (You)", text: currentText, time: timestamp }
    ]);

    setInterviewStatus("processing");

    // Simulated AI follow-up response
    setTimeout(() => {
      let followUp = "Understood. Now how would you handle cross-region clock drift and catastrophic Redis replication lag?";
      if (currentQuestionIndex === 1) {
        followUp = "Excellent point on Lua scripting. In the event that Envoy proxy loses network connection to the local Redis Sentinel, what degraded mode do you enforce?";
      } else if (currentQuestionIndex >= 2) {
        followUp = "Good breakdown. Let's conclude the interview and move directly to the evidence rubric synthesis.";
      }

      setLiveTranscript(prev => [
        ...prev,
        {
          role: "interviewer",
          name: PERSONAS.find(p => p.id === setupConfig.personaId)?.name || "Daniel Brooks",
          text: followUp,
          time: `${String(Math.floor((timerSeconds + 4) / 60)).padStart(2, "0")}:${String((timerSeconds + 4) % 60).padStart(2, "0")}`
        }
      ]);

      setInterviewStatus("speaking");
      const currentPersona = PERSONAS.find(p => p.id === setupConfig.personaId);
      speakWithWebSpeech(followUp, currentPersona?.voiceGender, () => {
        setInterviewStatus("listening");
      });

      setCurrentQuestionIndex(prev => prev + 1);
    }, 1800);
  };

  const handleFinishInterview = () => {
    stopAllMediaTracks();
    setInterviewStatus("finished");
    setCurrentRoute("report");
    setSelectedReportId("s-101");
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Toggle Bookmark
  const toggleSaveQuestion = (id) => {
    setPracticeQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, saved: !q.saved } : q))
    );
  };

  // ==========================================
  // NAVIGATION & SHELL WRAPPER
  // ==========================================

  return (
    <div className={`min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-white transition-colors duration-300 ${theme === "light" ? "text-slate-900 bg-slate-100" : "bg-[#070B14]"}`}>
      {/* Specular Ambient Bokeh Mesh */}
      <div className="ambient-bokeh-grid" aria-hidden="true">
        <div className="bokeh-orb bokeh-violet" />
        <div className="bokeh-orb bokeh-cyan" />
        <div className="bokeh-orb bokeh-pink" />
        <div className="bokeh-orb bokeh-emerald" />
      </div>

      {/* macOS Style Frosted Glass Top Menu Bar */}
      {currentRoute !== "live-room" && (
        <header className="sticky top-0 z-40 w-full bg-slate-950/40 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 h-14 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-4">
            {/* macOS Window Controls */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/90 shadow-[0_0_6px_#f43f5e] cursor-pointer hover:opacity-80 transition-opacity" />
              <span className="w-3 h-3 rounded-full bg-amber-400/90 shadow-[0_0_6px_#fbbf24] cursor-pointer hover:opacity-80 transition-opacity" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-[0_0_6px_#34d399] cursor-pointer hover:opacity-80 transition-opacity" />
            </div>

            <div className="h-4 w-[1px] bg-white/15 mx-1" />

            {/* Brand Title */}
            <button
              onClick={() => setCurrentRoute("landing")}
              className="flex items-center gap-2.5 font-bold text-sm tracking-tight group focus:outline-none"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 via-sky-400 to-emerald-400 p-[1px] shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                <div className="w-full h-full bg-[#070B14] rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                </div>
              </div>
              <span className="bg-gradient-to-r from-white via-slate-200 to-sky-300 bg-clip-text text-transparent font-extrabold text-sm tracking-wide">
                PrepSphere
              </span>
            </button>

            {/* macOS Menu bar links */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 font-medium ml-4">
              <button onClick={() => setCurrentRoute("dashboard")} className="hover:text-white transition-colors">Candidate</button>
              <button onClick={() => setCurrentRoute("practice")} className="hover:text-white transition-colors">Drill Bank</button>
              <button onClick={() => setCurrentRoute("report")} className="hover:text-white transition-colors">Evidence</button>
              <button onClick={() => setDevToolsOpen(true)} className="hover:text-white transition-colors">Diagnostics</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DemoBadge text="macOS Demo Mode" />

            {/* Apple style Credits badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-400/30 text-violet-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>120 Credits</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-600" />}
            </button>

            {/* macOS Clock Time */}
            <div className="text-xs font-mono text-slate-300 font-medium pl-1">
              {currentTime}
            </div>

            {/* Settings button */}
            <button
              onClick={() => setCurrentRoute("settings")}
              className={`p-1.5 rounded-lg transition-colors ${currentRoute === "settings" ? "bg-white/20 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: LANDING PAGE                                      */}
      {/* ========================================================= */}
      {currentRoute === "landing" && (
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-32 space-y-24">
          {/* Hero Section */}
          <section className="text-center space-y-6 pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-400/30 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(14,165,233,0.25)]">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              visionOS Liquid Glass UI · Voice-First AI Interview Engine
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.06] text-balance">
              Practice the interview. <br />
              <span className="bg-gradient-to-r from-violet-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Hear the follow-ups.
              </span>{" "}
              See the evidence.
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed text-balance">
              Experience ultra-crisp liquid glass containers, dynamic chromatic light borders, and real Web Audio analysis with domain-expert virtual interviewers.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setWizardStep(1);
                  setCurrentRoute("setup");
                }}
                className="chromatic-border chromatic-hero px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 text-white shadow-2xl hover:brightness-110 transition-all flex items-center gap-2 group"
              >
                <span>Start Practicing Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setCurrentRoute("dashboard")}
                className="px-6 py-4 rounded-2xl font-semibold text-sm liquid-glass hover:bg-white/10 transition-all flex items-center gap-2 border border-white/20"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Explore Candidate Dashboard</span>
              </button>
            </div>
          </section>

          {/* Interactive Live Room Stage Preview Card */}
          <section className="relative">
            <div className="text-center mb-3">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">visionOS Liquid Glass Stage</span>
            </div>
            <div className="chromatic-border chromatic-hero rounded-3xl p-[2px]">
              <LiquidCard className="p-6 sm:p-10 rounded-3xl" isInteractive={false}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
                    <LiquidSiriOrb state="speaking" size={170} />
                    <div>
                      <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                        Daniel Brooks
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-400/30">
                          Virtual AI Interviewer
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Principal Infrastructure Architect</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakWithWebSpeech(PERSONAS[3].sampleLine, "male")}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/40 hover:bg-violet-600/50 flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Voice Preview</span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-5 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-8 pt-6 lg:pt-0">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Live Multi-Turn Question 1 of 4
                      </span>
                      <span className="font-mono text-sky-300">03:42</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Current Prompt</span>
                      <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                        "Alex, walk me through how your rate-limiting architecture prevents race conditions during token increments when 50 concurrent requests arrive at the same millisecond."
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Fluid Waveform Spectrum</span>
                        <span className="text-sky-400 font-mono">Ultra-Harmonic</span>
                      </div>
                      <FluidSiriWaveCanvas isRecording={true} />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                          Pace: 138 WPM
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/30 font-medium">
                          Confidence: High
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSetupConfig(prev => ({ ...prev, personaId: "p4", type: "system-design" }));
                          setCurrentRoute("device-check");
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950 transition-colors flex items-center gap-1.5 shadow-[0_4px_16px_rgba(56,189,248,0.4)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch Simulation</span>
                      </button>
                    </div>
                  </div>
                </div>
              </LiquidCard>
            </div>
          </section>

          {/* Virtual AI Interviewer Showcase */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-sky-400 font-bold">Domain Specialists</span>
              <h2 className="text-3xl font-extrabold tracking-tight">Select Your Virtual Interviewer</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Calibrated evaluation strictness, natural synthesized voices, and adaptive multi-turn questioning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PERSONAS.map(p => (
                <LiquidCard key={p.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <PersonaAvatar initials={p.name.split(" ").map(n => n[0]).join("")} p1={p.p1} p2={p.p2} size="lg" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        p.style === "Supportive"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : p.style === "Balanced"
                          ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                          : "bg-pink-500/10 text-pink-300 border-pink-500/30"
                      }`}>
                        {p.style}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-base flex items-center gap-1.5">{p.name}</h4>
                      <p className="text-xs font-medium text-sky-400">{p.title}</p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="text-[11px] text-slate-400">
                      Languages: <span className="text-slate-200 font-medium">{p.languages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWithWebSpeech(p.sampleLine, p.voiceGender);
                        }}
                        className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Voice</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSetupConfig(prev => ({ ...prev, personaId: p.id }));
                          setWizardStep(1);
                          setCurrentRoute("setup");
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-md"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </LiquidCard>
              ))}
            </div>
          </section>

          {/* 7 Core Interview Domains */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-violet-400 font-bold">Domain Coverage</span>
              <h2 className="text-3xl font-extrabold tracking-tight">Tailored to Every Seniority Level</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {INTERVIEW_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSetupConfig(prev => ({ ...prev, type: type.id }));
                    setWizardStep(1);
                    setCurrentRoute("setup");
                  }}
                  className="p-4 rounded-2xl liquid-glass hover:bg-white/15 border border-white/15 flex flex-col items-center text-center gap-2 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-sky-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <type.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold group-hover:text-sky-300 transition-colors">{type.label}</span>
                  <span className="text-[10px] text-slate-400">{type.duration}</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: CANDIDATE DASHBOARD                               */}
      {/* ========================================================= */}
      {currentRoute === "dashboard" && (
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Good morning, Alex</h1>
                <DemoBadge text="Candidate Alex Chen" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Targeting: <span className="text-sky-300 font-semibold">Staff Software Engineer</span> · 4-Day Active Practice Streak
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSetupConfig(prev => ({ ...prev, personaId: "p4", type: "system-design" }));
                  setCurrentRoute("device-check");
                }}
                className="chromatic-border px-5 py-2.5 rounded-2xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-xl flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Target Drill</span>
              </button>
            </div>
          </div>

          {/* Top Bento Row: Hero Next Session + Streak */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Hero Recommended Card (8 cols) */}
            <LiquidCard className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6 chromatic-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-sky-400 tracking-wider uppercase">
                    Recommended Next Session
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Distributed Rate Limiter & Concurrency
                  </h3>
                  <p className="text-xs text-slate-400">
                    System Design · 45 mins · Address identified deficit in <em>Answer Structure</em>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <PersonaAvatar initials="DB" p1="rgba(139, 92, 246, 0.9)" p2="rgba(34, 211, 238, 0.8)" size="md" />
                  <div className="text-xs">
                    <p className="font-semibold">Daniel Brooks</p>
                    <p className="text-slate-400 text-[10px]">Virtual Architect</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/25 border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Predicted Score</span>
                    <span className="font-bold text-emerald-400 text-sm">84 - 88 pts</span>
                  </div>
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Focus Dimension</span>
                    <span className="font-bold text-violet-300 text-sm">Answer Structure</span>
                  </div>
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Credit Cost</span>
                    <span className="font-bold text-amber-300 text-sm">15 credits</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSetupConfig(prev => ({ ...prev, personaId: "p4", type: "system-design" }));
                    setCurrentRoute("device-check");
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-sky-400 hover:bg-sky-300 text-slate-950 transition-colors flex items-center gap-1.5 shadow-[0_4px_16px_rgba(56,189,248,0.4)]"
                >
                  <span>Launch Live Simulation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </LiquidCard>

            {/* Streak Tracker Card (4 cols) */}
            <LiquidCard className="lg:col-span-4 p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base">Practice Streak</h4>
                  <p className="text-xs text-slate-400">Consistent daily execution</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold shadow-inner">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
              </div>

              <div className="text-center py-2">
                <span className="text-4xl font-extrabold text-amber-400 tracking-tight">4 Days</span>
                <p className="text-xs text-slate-400 mt-1">Keep it going to unlock Level 5 Rubric Drill</p>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                        i < 4
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm"
                          : "bg-white/5 text-slate-500"
                      }`}
                    >
                      {i < 4 ? <Check className="w-3.5 h-3.5" /> : day}
                    </div>
                    <span className="text-[9px] text-slate-500">{day}</span>
                  </div>
                ))}
              </div>
            </LiquidCard>
          </div>

          {/* 4 Metric Cards with Sparklines */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "30-Day Avg Score", value: "81.5", delta: "+4.2 pts", color: "emerald", data: [72, 74, 76, 75, 78, 81.5] },
              { label: "Completed Sessions", value: "12", delta: "+3 this wk", color: "sky", data: [4, 6, 8, 9, 11, 12] },
              { label: "Spoken Practice", value: "385m", delta: "6.4 hrs tot", color: "violet", data: [120, 180, 240, 310, 350, 385] },
              { label: "Questions Defended", value: "48", delta: "92% answered", color: "amber", data: [15, 24, 32, 38, 44, 48] },
            ].map((stat, i) => (
              <LiquidCard key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${stat.color}-500/10 text-${stat.color}-400`}>
                    {stat.delta}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{stat.value}</span>
                  <svg className="w-20 h-7 overflow-visible">
                    <polyline
                      fill="none"
                      stroke={stat.color === "emerald" ? "#34D399" : stat.color === "sky" ? "#38BDF8" : stat.color === "violet" ? "#8B5CF6" : "#F59E0B"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={stat.data.map((d, idx) => `${idx * 16},${24 - ((d - Math.min(...stat.data)) / (Math.max(...stat.data) - Math.min(...stat.data) || 1)) * 20}`).join(" ")}
                    />
                  </svg>
                </div>
              </LiquidCard>
            ))}
          </div>

          {/* Performance Trend Area Chart & Radar Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Area Chart: Progression over last 6 sessions (8 cols) */}
            <LiquidCard className="lg:col-span-8 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Rubric Dimension Progression</h3>
                  <p className="text-xs text-slate-400">Score trends across recent sessions</p>
                </div>
                <span className="text-xs font-semibold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-400/30">
                  Last 6 Mock Sessions
                </span>
              </div>

              <div className="h-56 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-white/10">
                {MOCK_PAST_SESSIONS.map((session, idx) => (
                  <div key={session.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {session.score}
                    </span>
                    <div
                      className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-violet-600 via-sky-400 to-emerald-400 group-hover:brightness-125 transition-all shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                      style={{ height: `${(session.score / 100) * 100}%` }}
                    />
                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">
                      {session.type.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Baseline: 66 pts</span>
                <span className="font-bold text-emerald-400">Current Peak: 86 pts (+20 delta)</span>
              </div>
            </LiquidCard>

            {/* Radar / Rubric Overview Breakdown (4 cols) */}
            <LiquidCard className="lg:col-span-4 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-base">Staff Level Dimension Readiness</h3>
                <p className="text-xs text-slate-400">Weighted against Staff Engineer standard</p>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { name: "Technical Accuracy", score: 90, color: "bg-emerald-400" },
                  { name: "Reasoning & Trade-offs", score: 84, color: "bg-sky-400" },
                  { name: "Problem Solving Scale", score: 86, color: "bg-violet-400" },
                  { name: "Communication Clarity", score: 80, color: "bg-indigo-400" },
                  { name: "Answer Structure", score: 72, color: "bg-amber-400" },
                ].map((dim, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{dim.name}</span>
                      <span className="font-mono font-bold text-slate-200">{dim.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${dim.color} rounded-full`} style={{ width: `${dim.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Answer Structure (72%)</strong> is currently dragging your total average down. Focus on top-down STAR-architecture framing.
                </span>
              </div>
            </LiquidCard>
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: INTERVIEW SETUP WIZARD                            */}
      {/* ========================================================= */}
      {currentRoute === "setup" && (
        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-32 space-y-8">
          <div className="space-y-2 text-center">
            <DemoBadge text="Interview Configuration Wizard" />
            <h1 className="text-3xl font-extrabold tracking-tight">Configure Your Practice Session</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Customize format, difficulty, role expectations, and select your AI interviewer.
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between max-w-xl mx-auto px-4">
            {[
              { step: 1, label: "Type" },
              { step: 2, label: "Role & Level" },
              { step: 3, label: "Format" },
              { step: 4, label: "Persona" },
              { step: 5, label: "Review" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    wizardStep === s.step
                      ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)] scale-110"
                      : wizardStep > s.step
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-white/5 text-slate-500 border border-white/10"
                  }`}
                >
                  {wizardStep > s.step ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: Select Type */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Step 1: Choose Interview Domain</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INTERVIEW_TYPES.map(type => (
                  <LiquidCard
                    key={type.id}
                    onClick={() => setSetupConfig(prev => ({ ...prev, type: type.id }))}
                    className={`p-5 cursor-pointer border transition-all ${
                      setupConfig.type === type.id
                        ? "border-violet-500 bg-violet-950/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${setupConfig.type === type.id ? "bg-violet-600 text-white" : "bg-white/5 text-slate-300"}`}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-100">{type.label}</h4>
                          <span className="text-[11px] text-slate-400">{type.duration}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{type.desc}</p>
                      </div>
                    </div>
                  </LiquidCard>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Role & Level */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Step 2: Role & Seniority Target</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Job Title</label>
                  <input
                    type="text"
                    value={setupConfig.role}
                    onChange={e => setSetupConfig(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/20 text-sm focus:outline-none focus:border-violet-500 shadow-inner"
                    placeholder="e.g. Staff Software Engineer, Senior Backend Dev"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Seniority Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["Junior", "Mid-Level", "Senior", "Staff / Principal"].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSetupConfig(prev => ({ ...prev, level: lvl }))}
                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                          setupConfig.level === lvl
                            ? "bg-violet-600 text-white border-violet-500 shadow-md"
                            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Format */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Step 3: Duration & Questions</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Session Length</span>
                    <span className="font-mono text-sky-400 font-bold">{setupConfig.duration} minutes</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={setupConfig.duration}
                    onChange={e => setSetupConfig(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Questions Count</span>
                    <span className="font-mono text-sky-400 font-bold">{setupConfig.questionCount} core questions</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={setupConfig.questionCount}
                    onChange={e => setSetupConfig(prev => ({ ...prev, questionCount: Number(e.target.value) }))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Choose Persona */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Step 4: Select Virtual AI Interviewer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PERSONAS.map(p => (
                  <LiquidCard
                    key={p.id}
                    onClick={() => setSetupConfig(prev => ({ ...prev, personaId: p.id }))}
                    className={`p-4 cursor-pointer border transition-all ${
                      setupConfig.personaId === p.id
                        ? "border-sky-400 bg-sky-950/20 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <PersonaAvatar initials={p.name.split(" ").map(n => n[0]).join("")} p1={p.p1} p2={p.p2} size="md" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-100">{p.name}</h4>
                          <span className="text-[10px] font-semibold text-sky-400 px-2 py-0.5 rounded-full bg-sky-500/10">
                            {p.style}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{p.title}</p>
                      </div>
                    </div>
                  </LiquidCard>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Consent */}
          {wizardStep === 5 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Step 5: Review & Transparency Consent</h3>

              <div className="p-6 rounded-3xl liquid-glass space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Type</span>
                    <span className="font-bold text-slate-100 capitalize">{setupConfig.type.replace("-", " ")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Role / Level</span>
                    <span className="font-bold text-slate-100">{setupConfig.role} ({setupConfig.level})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="font-bold text-slate-100">{setupConfig.duration}m ({setupConfig.questionCount} Qs)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Interviewer</span>
                    <span className="font-bold text-sky-300">{PERSONAS.find(p => p.id === setupConfig.personaId)?.name}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-200 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Notice:</strong> Virtual AI interviewers are simulated characters. Browser microphone audio is analyzed locally for frequency meters and transcription.
                    </span>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setupConfig.consentAgreed}
                      onChange={e => setSetupConfig(prev => ({ ...prev, consentAgreed: e.target.checked }))}
                      className="w-4 h-4 accent-violet-500 rounded"
                    />
                    <span>I understand this is a simulated demo drill and ratings represent AI estimates.</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => {
                if (wizardStep === 1) setCurrentRoute("dashboard");
                else setWizardStep(s => s - 1);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {wizardStep < 5 ? (
              <button
                onClick={() => setWizardStep(s => s + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg flex items-center gap-1.5 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                disabled={!setupConfig.consentAgreed}
                onClick={() => setCurrentRoute("device-check")}
                className={`chromatic-border px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                  setupConfig.consentAgreed
                    ? "bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-xl"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Proceed to Device Check</span>
              </button>
            )}
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: DEVICE CHECK & CALIBRATION                         */}
      {/* ========================================================= */}
      {currentRoute === "device-check" && (
        <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-32 space-y-6">
          <div className="space-y-1 text-center">
            <DemoBadge text="Real Web Audio Verification" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Audio & Device Calibration</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Ensure your browser microphone and speakers function properly before starting the simulation.
            </p>
          </div>

          <LiquidCard className="p-6 sm:p-8 space-y-6" isInteractive={false}>
            {/* 1. Microphone Input Check */}
            <div className="space-y-3 pb-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-2xl ${micGranted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400"}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">Microphone Input</h4>
                    <p className="text-xs text-slate-400">
                      {micGranted ? "Microphone active & receiving live stream" : "Browser permission required"}
                    </p>
                  </div>
                </div>

                {!micGranted ? (
                  <button
                    onClick={requestMicrophoneAccess}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-md"
                  >
                    Enable Microphone
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                )}
              </div>

              {/* Real canvas visualizer */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Fluid Sinusoidal Harmonics</span>
                  <span>{micGranted ? "Listening for speech..." : "Microphone offline"}</span>
                </div>
                <FluidSiriWaveCanvas analyserNode={micAnalyser} isRecording={micGranted} />
              </div>
            </div>

            {/* 2. Audio Speaker Check */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${speakerTested ? "bg-sky-500/20 text-sky-400" : "bg-white/10 text-slate-400"}`}>
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Audio Playback</h4>
                  <p className="text-xs text-slate-400">Verify your speaker or headphones</p>
                </div>
              </div>

              <button
                onClick={() => {
                  playAudioTone(520, "sine", 0.4);
                  setSpeakerTested(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Play Test Chime</span>
              </button>
            </div>

            {/* 3. Optional Camera Toggle */}
            <div className="space-y-3 pb-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-2xl ${cameraActive ? "bg-violet-500/20 text-violet-400" : "bg-white/10 text-slate-400"}`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">Video Preview (Optional)</h4>
                    <p className="text-xs text-slate-400">Local mirror only; never transmitted</p>
                  </div>
                </div>

                <button
                  onClick={toggleCamera}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    cameraActive
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {cameraActive ? "Disable Camera" : "Preview Camera"}
                </button>
              </div>

              {cameraActive && (
                <div className="w-full h-40 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                  <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Start Live Room */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentRoute("setup")}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Change Settings
              </button>

              <button
                onClick={() => {
                  setInterviewStatus("listening");
                  setTimerSeconds(0);
                  setCurrentRoute("live-room");
                }}
                className="chromatic-border px-7 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-xl flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Live Stage Room</span>
              </button>
            </div>
          </LiquidCard>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 5: LIVE INTERVIEW ROOM (MINIMAL DISTRACTION)        */}
      {/* ========================================================= */}
      {currentRoute === "live-room" && (
        <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
          {/* Subtle Ambient Orb */}
          <div className="ambient-bokeh-grid" aria-hidden="true">
            <div className="bokeh-orb bokeh-violet opacity-30" />
            <div className="bokeh-orb bokeh-cyan opacity-25" />
          </div>

          {/* Top Stage Bar */}
          <header className="relative z-20 flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={handleFinishInterview}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit & View Report</span>
              </button>
              <div>
                <h2 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  Distributed Rate Limiter
                  <DemoBadge text="Scripted Simulation" />
                </h2>
                <span className="text-[11px] text-slate-400">
                  Question {Math.min(currentQuestionIndex + 1, 4)} of 4 · System Design
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className={`w-2 h-2 rounded-full ${simulatedReconnecting ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                <span className="hidden sm:inline">{simulatedReconnecting ? "Reconnecting..." : connectionQuality}</span>
              </div>

              <div className="px-3.5 py-1 rounded-xl bg-white/5 border border-white/10 font-mono text-xs font-bold text-sky-300">
                {formatTimer(timerSeconds)}
              </div>
            </div>
          </header>

          {/* Main Stage Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-4 items-stretch">
            {/* Left Column: Virtual Interviewer Orb (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl liquid-glass-strong space-y-6 text-center">
              <LiquidSiriOrb state={interviewStatus} size={180} />

              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center justify-center gap-2">
                  Daniel Brooks
                  <span className="text-[10px] font-semibold text-sky-400 px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-400/30">
                    Virtual AI Interviewer
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Principal Infrastructure Architect</p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${
                  interviewStatus === "speaking" ? "bg-sky-400 animate-pulse" :
                  interviewStatus === "listening" ? "bg-emerald-400 animate-ping" :
                  interviewStatus === "processing" ? "bg-violet-400 animate-spin" : "bg-slate-400"
                }`} />
                <span className="capitalize">{interviewStatus === "speaking" ? "Interviewer Speaking..." : interviewStatus === "listening" ? "Listening to Your Answer..." : "Synthesizing Rubric..."}</span>
              </div>

              <div className="w-full max-w-xs space-y-1">
                <FluidSiriWaveCanvas analyserNode={micAnalyser} isRecording={!isMicMuted && interviewStatus === "listening"} />
              </div>
            </div>

            {/* Right Column: Dynamic Transcript Stream & Code Workspace (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 rounded-3xl liquid-glass-strong p-5 max-h-[520px] overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 pb-1 border-b border-white/5">
                  Live Spoken Transcript
                </div>

                {liveTranscript.map((turn, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                      turn.role === "candidate"
                        ? "bg-violet-950/40 border border-violet-500/30 ml-6"
                        : "bg-white/5 border border-white/10 mr-6"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-sky-300">{turn.name}</span>
                      <span>{turn.time}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{turn.text}</p>
                  </div>
                ))}
              </div>

              {/* Candidate Typed Answer Composer */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidateInputText}
                    onChange={e => setCandidateInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCandidateSubmitAnswer()}
                    placeholder="Speak into microphone or type your response here..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-violet-500 shadow-inner"
                  />
                  <button
                    onClick={handleCandidateSubmitAnswer}
                    className="px-5 py-3 rounded-2xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-md"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stage Control Dock */}
          <footer className="relative z-20 flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMicMuted(m => !m)}
                className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold transition-colors ${
                  isMicMuted
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-white/10 hover:bg-white/15 text-slate-200"
                }`}
                title="Mute / Unmute Mic"
              >
                {isMicMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline">{isMicMuted ? "Mic Muted" : "Mic Live"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFinishInterview}
                className="px-6 py-3 rounded-2xl text-xs font-bold bg-red-600/90 hover:bg-red-500 text-white shadow-xl transition-all flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Simulation & Generate Report</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 6: EVIDENCE-LINKED REPORT VIEW                       */}
      {/* ========================================================= */}
      {currentRoute === "report" && (
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-32 space-y-8">
          <div className="chromatic-border chromatic-hero rounded-3xl p-[2px] shadow-2xl">
            <LiquidCard className="p-6 sm:p-10 rounded-3xl space-y-6" isInteractive={false}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-6">
                  <ScoreRingSvg score={MOCK_REPORT_DATA.overallScore} size={135} stroke={10} label="AI Estimate" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                        {MOCK_REPORT_DATA.type} · Staff Standard
                      </span>
                      <DemoBadge text="Verified Session" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {MOCK_REPORT_DATA.title}
                    </h1>
                    <p className="text-xs text-slate-400">
                      Evaluated by <strong>{MOCK_REPORT_DATA.interviewer.name}</strong> ({MOCK_REPORT_DATA.interviewer.title}) · {MOCK_REPORT_DATA.duration}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-2xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    <span>Print PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      setSetupConfig(prev => ({ ...prev, personaId: "p4", type: "system-design" }));
                      setCurrentRoute("device-check");
                    }}
                    className="chromatic-border px-5 py-2.5 rounded-2xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-xl flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Session</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-1 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <span className="font-bold text-violet-400 text-xs uppercase tracking-wider block">Synthesis Summary</span>
                <p>{MOCK_REPORT_DATA.summary}</p>
              </div>

              {/* Delivery vs Content Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Spoken Pace</span>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">{MOCK_REPORT_DATA.delivery.wpm} WPM</div>
                  <span className="text-[10px] text-slate-400">{MOCK_REPORT_DATA.delivery.wpmStatus}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Filler Word Density</span>
                  <div className="text-xl font-extrabold text-sky-400 mt-1">{MOCK_REPORT_DATA.delivery.fillersPerMin} / min</div>
                  <span className="text-[10px] text-slate-400">{MOCK_REPORT_DATA.delivery.fillersStatus}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Average Pause Cadence</span>
                  <div className="text-xl font-extrabold text-violet-400 mt-1">{MOCK_REPORT_DATA.delivery.avgPauseSeconds}s</div>
                  <span className="text-[10px] text-slate-400">{MOCK_REPORT_DATA.delivery.pauseStatus}</span>
                </div>
              </div>
            </LiquidCard>
          </div>

          {/* Rubric Dimension Breakdown */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight">Rubric Dimension Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_REPORT_DATA.rubric.map((item, idx) => (
                <LiquidCard
                  key={idx}
                  onClick={() => setWhyDrawerDimension(item)}
                  className="p-5 cursor-pointer hover:border-violet-500/50 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{item.dimension}</h4>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Confidence: <strong className="text-sky-400">{item.confidence}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-slate-100">{item.score}</span>
                      <span className="text-xs text-slate-400"> / {item.max}</span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-sky-400 rounded-full"
                      style={{ width: `${(item.score / item.max) * 100}%` }}
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300 italic border-l-2 border-l-sky-400">
                    "{item.quote}"
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-sky-400 pt-1 font-semibold">
                    <span>Inspect Why This Score</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </LiquidCard>
              ))}
            </div>
          </div>

          {/* "Why This Score?" Verbatim Citation Drawer */}
          {whyDrawerDimension && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-end">
              <div className="w-full max-w-md h-full bg-[#070B14] border-l border-white/10 p-6 flex flex-col justify-between space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="font-bold text-lg text-slate-100">Dimension Evidence Citation</h3>
                    <button
                      onClick={() => setWhyDrawerDimension(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Rubric Dimension</span>
                    <h4 className="text-xl font-extrabold text-sky-300">{whyDrawerDimension.dimension}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Assigned Score:</span>
                      <strong className="text-emerald-400 font-bold">{whyDrawerDimension.score} / {whyDrawerDimension.max}</strong>
                      <span>· Confidence: {whyDrawerDimension.confidence}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <span className="font-bold text-violet-400 block uppercase tracking-wider text-[10px]">
                      Verbatim Transcript Match
                    </span>
                    <p className="text-slate-200 leading-relaxed italic border-l-2 border-violet-500 pl-3">
                      "{whyDrawerDimension.quote}"
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-300 block">Evaluator Justification</span>
                    <p className="text-slate-400 leading-relaxed">{whyDrawerDimension.why}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => setWhyDrawerDimension(null)}
                    className="w-full py-3 rounded-2xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    Close Evidence Inspector
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 7: PRACTICE QUESTION BANK                            */}
      {/* ========================================================= */}
      {currentRoute === "practice" && (
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Question Practice Bank</h1>
                <DemoBadge text="60+ Curated Questions" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Self-paced drills with 2-step hint reveals and Staff-level model solutions.
              </p>
            </div>
          </div>

          {/* Search & Topic Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={practiceSearch}
                onChange={e => setPracticeSearch(e.target.value)}
                placeholder="Search across questions, tags, topics (e.g. Redis, CRDT, Concurrency)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/30 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-violet-500 shadow-inner"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["All", "System Design", "React / Frontend", "DSA", "Behavioral", "Database", "Coding"].map(topic => (
                <button
                  key={topic}
                  onClick={() => setSelectedPracticeTopic(topic)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedPracticeTopic === topic
                      ? "bg-violet-600 text-white border-violet-500 shadow-md"
                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Question Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practiceQuestions
              .filter(q => selectedPracticeTopic === "All" || q.topic.includes(selectedPracticeTopic))
              .filter(q => practiceSearch === "" || q.title.toLowerCase().includes(practiceSearch.toLowerCase()) || q.tags.some(t => t.toLowerCase().includes(practiceSearch.toLowerCase())))
              .map(q => (
                <LiquidCard key={q.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                          {q.topic}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          q.level === "Hard"
                            ? "bg-red-500/10 text-red-300 border border-red-500/30"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        }`}>
                          {q.level}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleSaveQuestion(q.id)}
                        className="text-slate-400 hover:text-amber-400 transition-colors"
                        title="Bookmark question"
                      >
                        <Bookmark className={`w-4 h-4 ${q.saved ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100">{q.title}</h3>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {q.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">2 Hints Available</span>
                    <button
                      onClick={() => {
                        setActivePracticeDrawer(q);
                        setPracticeHintStep(0);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/40 hover:bg-violet-600/50 transition-colors flex items-center gap-1.5"
                    >
                      <span>Practice Drill</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </LiquidCard>
              ))}
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 8: SESSION HISTORY                                   */}
      {/* ========================================================= */}
      {currentRoute === "history" && (
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Verified Session History</h1>
                <DemoBadge text="12 Sessions Logged" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Track long-term score trends across your interview preparation journey.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_PAST_SESSIONS.map(session => {
              const persona = PERSONAS.find(p => p.id === session.personaId);
              return (
                <LiquidCard
                  key={session.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <ScoreRingSvg score={session.score} size={54} stroke={5} label="" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{session.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
                          {session.type}
                        </span>
                        <span>•</span>
                        <span>Interviewer: {persona?.name}</span>
                        <span>•</span>
                        <span>{session.durationMins}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{session.date}</span>
                    <button
                      onClick={() => {
                        setSelectedReportId(session.id);
                        setCurrentRoute("report");
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/40 hover:bg-violet-600/50 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </div>
                </LiquidCard>
              );
            })}
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW 9: SETTINGS                                          */}
      {/* ========================================================= */}
      {currentRoute === "settings" && (
        <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-32 space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Platform Settings</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage theme tokens, rendering performance, and simulated candidate profile.
            </p>
          </div>

          <LiquidCard className="p-6 sm:p-8 space-y-6" isInteractive={false}>
            <div className="space-y-4 pb-6 border-b border-white/10">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Sun className="w-4 h-4 text-sky-400" />
                <span>Visual Appearance & Lighting</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === "dark" ? "bg-violet-950/40 border-violet-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"
                  }`}
                >
                  <Moon className="w-5 h-5 text-violet-400" />
                  <span className="text-xs font-bold">Cinematic Dark</span>
                </button>

                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === "light" ? "bg-violet-950/40 border-violet-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold">Refined Light</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Reduce Effects & Ambient Orbs</h4>
                  <p className="text-[11px] text-slate-400">Disables RGB border animations and reduces blur filter load.</p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedEffects}
                  onChange={e => setReducedEffects(e.target.checked)}
                  className="w-4 h-4 accent-violet-500 rounded"
                />
              </div>
            </div>
          </LiquidCard>
        </main>
      )}

      {/* ========================================================= */}
      {/* MACOS FLOATING DOCK NAVIGATION (ACTIVE ON ALL APP SCREENS) */}
      {/* ========================================================= */}
      {currentRoute !== "live-room" && (
        <aside className="fixed bottom-5 inset-x-0 z-50 flex justify-center pointer-events-none">
          <nav
            aria-label="macOS Navigation Dock"
            className="macos-dock pointer-events-auto px-4 py-2.5 rounded-3xl flex items-center gap-2 sm:gap-3 transition-transform duration-300 hover:scale-[1.02]"
          >
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "practice", label: "Practice", icon: Terminal },
              { id: "setup", label: "New Interview", icon: Mic, isPrimary: true },
              { id: "history", label: "History", icon: Calendar },
              { id: "report", label: "Report", icon: FileText },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  stopAllMediaTracks();
                  if (item.id === "setup") setWizardStep(1);
                  setCurrentRoute(item.id);
                }}
                className={`relative px-3.5 py-2 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 group ${
                  item.isPrimary
                    ? "bg-gradient-to-tr from-violet-600 via-sky-500 to-emerald-400 text-white shadow-[0_4px_16px_rgba(139,92,246,0.5)] scale-105"
                    : currentRoute === item.id
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/10"
                }`}
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
                {currentRoute === item.id && !item.isPrimary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 absolute -bottom-1" />
                )}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* ========================================================= */}
      {/* DEV TOOLS DRAWER                                          */}
      {/* ========================================================= */}
      {devToolsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-sm h-full bg-[#070B14] border-l border-white/10 p-6 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-sm text-sky-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> PrepSphere Diagnostics
                </h3>
                <button
                  onClick={() => setDevToolsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="font-bold text-slate-200 block">Direct View Switcher</span>
                  <div className="grid grid-cols-2 gap-2">
                    {["landing", "dashboard", "setup", "device-check", "live-room", "report", "practice", "history"].map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          stopAllMediaTracks();
                          setCurrentRoute(r);
                          setDevToolsOpen(false);
                        }}
                        className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 capitalize truncate"
                      >
                        {r.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDevToolsOpen(false)}
              className="w-full py-3 rounded-2xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white"
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}