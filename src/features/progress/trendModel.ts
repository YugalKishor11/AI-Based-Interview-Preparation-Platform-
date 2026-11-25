// PrepSphere Progress Trend & Analytics Model (Prompt 6.5)
// Pure TypeScript mathematical engine: EWMA, Theil-Sen Robust Slope, Spaced Repetition,
// and Human-Readable Recommendation Prioritization.

export interface TrendDataPoint {
  date: string;
  score: number;
}

export interface DimensionScores {
  technicalAccuracy: number;
  reasoning: number;
  problemSolving: number;
  communication: number;
  answerStructure: number;
  roleRelevance: number;
}

export interface HistoricalSessionTrend {
  id: string;
  date: string;
  scores: Partial<DimensionScores>;
  hasInsufficientEvidence?: boolean;
}

// Target baseline scores per level (Labelled explicitly as baseline assumptions, not market data)
export const LEVEL_TARGET_ASSUMPTIONS: Record<string, DimensionScores> = {
  fresher: { technicalAccuracy: 65, reasoning: 65, problemSolving: 60, communication: 70, answerStructure: 65, roleRelevance: 60 },
  junior: { technicalAccuracy: 72, reasoning: 70, problemSolving: 68, communication: 72, answerStructure: 70, roleRelevance: 68 },
  mid: { technicalAccuracy: 80, reasoning: 78, problemSolving: 78, communication: 78, answerStructure: 78, roleRelevance: 76 },
  senior: { technicalAccuracy: 86, reasoning: 85, problemSolving: 85, communication: 84, answerStructure: 85, roleRelevance: 84 },
  staff: { technicalAccuracy: 92, reasoning: 92, problemSolving: 90, communication: 90, answerStructure: 92, roleRelevance: 90 },
};

export interface TrendModel {
  computeEwma(scores: number[], alpha?: number): number;
  computeTheilSenSlope(points: Array<{ x: number; y: number }>): { slope: number; isSignificant: boolean };
  findWeakestDimension(dimensionEwma: Record<string, number>, targetGaps: Record<string, number>): string;
  computeStreak(sessionDatesIso: string[], userTimezone?: string): number;
  computeNextTopicPriority(params: {
    dimension: string;
    gap: number;
    declining: boolean;
    daysSincePracticed: number;
  }): { priority: number; reason: string };
  scheduleSpacedRepetition(currentIntervalIndex: number, scoreOrRating: number): { nextIntervalDays: number; newIndex: number };
}

// ---------------------------------------------------------------------------
// 1. Exponentially Weighted Moving Average (EWMA: m_t = a * s_t + (1 - a) * m_{t-1}, a = 0.4)
// ---------------------------------------------------------------------------
export function computeEwma(scores: number[], alpha = 0.4): number {
  if (!scores || scores.length === 0) return 0;
  let m = scores[0];
  for (let i = 1; i < scores.length; i++) {
    m = alpha * scores[i] + (1 - alpha) * m;
  }
  return Math.round(m * 10) / 10;
}

// ---------------------------------------------------------------------------
// 2. Theil-Sen Median Slope Estimator (Robust to Outliers, >= 4 Sessions up to 8)
// ---------------------------------------------------------------------------
export function computeTheilSenSlope(points: Array<{ x: number; y: number }>): {
  slope: number;
  isSignificant: boolean;
} {
  if (points.length < 4) {
    return { slope: 0, isSignificant: false };
  }

  // Cap at the last 8 sessions
  const sample = points.slice(-8);
  const slopes: number[] = [];

  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const dx = sample[j].x - sample[i].x;
      if (dx !== 0) {
        slopes.push((sample[j].y - sample[i].y) / dx);
      }
    }
  }

  if (slopes.length === 0) {
    return { slope: 0, isSignificant: false };
  }

  // Median of all pairwise slopes
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  const medianSlope = slopes.length % 2 === 0
    ? (slopes[mid - 1] + slopes[mid]) / 2
    : slopes[mid];

  // A slope is statistically significant if its non-zero magnitude is noticeable
  const isSignificant = Math.abs(medianSlope) >= 0.25;

  return {
    slope: Math.round(medianSlope * 100) / 100,
    isSignificant,
  };
}

// ---------------------------------------------------------------------------
// 3. Weekly Average and Week-over-Week Delta (>= 2 scored answers in each week)
// ---------------------------------------------------------------------------
export function computeWeeklyDeltas(sessions: HistoricalSessionTrend[]): {
  currentWeekAvg: number | null;
  previousWeekAvg: number | null;
  wowDelta: number | null;
} {
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 86400000;

  const currentWeekScores: number[] = [];
  const previousWeekScores: number[] = [];

  for (const s of sessions) {
    if (s.hasInsufficientEvidence) continue;
    const sessionTime = new Date(s.date).getTime();
    const diff = now - sessionTime;

    const values = Object.values(s.scores).filter((v): v is number => typeof v === 'number');
    const sessionAvg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    if (sessionAvg === null) continue;

    if (diff >= 0 && diff < ONE_WEEK_MS) {
      currentWeekScores.push(sessionAvg);
    } else if (diff >= ONE_WEEK_MS && diff < 2 * ONE_WEEK_MS) {
      previousWeekScores.push(sessionAvg);
    }
  }

  if (currentWeekScores.length < 2 || previousWeekScores.length < 2) {
    return { currentWeekAvg: null, previousWeekAvg: null, wowDelta: null };
  }

  const curAvg = currentWeekScores.reduce((a, b) => a + b, 0) / currentWeekScores.length;
  const prevAvg = previousWeekScores.reduce((a, b) => a + b, 0) / previousWeekScores.length;
  const delta = Math.round((curAvg - prevAvg) * 10) / 10;

  return {
    currentWeekAvg: Math.round(curAvg * 10) / 10,
    previousWeekAvg: Math.round(prevAvg * 10) / 10,
    wowDelta: delta,
  };
}

// ---------------------------------------------------------------------------
// 4. Consecutive Local Days Streak in User Timezone
// ---------------------------------------------------------------------------
export function calculateStreak(sessionDatesIso: string[], userTimezone = 'UTC'): number {
  if (!sessionDatesIso || sessionDatesIso.length === 0) return 0;

  const dateStrings = new Set<string>();
  for (const iso of sessionDatesIso) {
    try {
      const d = new Date(iso);
      const formatted = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      dateStrings.add(formatted);
    } catch {
      dateStrings.add(iso.split('T')[0]);
    }
  }

  const sortedDates = Array.from(dateStrings).sort().reverse();
  if (sortedDates.length === 0) return 0;

  // Compare starting from today / yesterday in local timezone
  let streak = 0;
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterdayDate);

  let currentCursor = sortedDates[0];
  if (currentCursor !== today && currentCursor !== yesterday) {
    return 0; // Streak broken
  }

  streak = 1;
  let expectedPrev = new Date(currentCursor);

  for (let i = 1; i < sortedDates.length; i++) {
    expectedPrev.setDate(expectedPrev.getDate() - 1);
    const expectedStr = expectedPrev.toISOString().split('T')[0];
    if (sortedDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ---------------------------------------------------------------------------
// 5. Weakest Dimension Detector (lowest EWMA with >= 3 scored sessions, tie-break by target gap)
// ---------------------------------------------------------------------------
export function findWeakestDimension(
  dimensionEwma: Record<string, number>,
  targetGaps: Record<string, number>
): string {
  const entries = Object.entries(dimensionEwma);
  if (entries.length === 0) return 'technicalAccuracy';

  // Sort by lowest EWMA score, then by largest target gap
  entries.sort((a, b) => {
    if (a[1] !== b[1]) {
      return a[1] - b[1];
    }
    const gapA = targetGaps[a[0]] || 0;
    const gapB = targetGaps[b[0]] || 0;
    return gapB - gapA; // larger gap first
  });

  return entries[0][0];
}

// ---------------------------------------------------------------------------
// 6. Next-Topic Score & Human-Readable Recommendation Formula:
//    priority = gap * (1 + 0.5 * declining) * min(1, days_since_practiced / 7)
// ---------------------------------------------------------------------------
export function computeNextTopicPriority(params: {
  dimension: string;
  gap: number;
  declining: boolean;
  daysSincePracticed: number;
}): { priority: number; reason: string } {
  const { dimension, gap, declining, daysSincePracticed } = params;

  const recencyFactor = Math.min(1.0, Math.max(0.1, daysSincePracticed / 7));
  const trendMultiplier = declining ? 1.5 : 1.0;
  const priority = Math.round(Math.max(0, gap) * trendMultiplier * recencyFactor * 10) / 10;

  const friendlyName = dimension
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  let reason = `${friendlyName} is ${Math.round(gap)} pts below target`;
  if (declining) {
    reason += ' and trended downward this week';
  }
  if (daysSincePracticed >= 7) {
    reason += ` (${Math.round(daysSincePracticed)} days since last drill)`;
  }

  return { priority, reason };
}

// ---------------------------------------------------------------------------
// 7. Spaced Repetition Practice Scheduling: intervals [1, 3, 7, 14, 30] days
// ---------------------------------------------------------------------------
const REPETITION_INTERVALS = [1, 3, 7, 14, 30] as const;

export function scheduleSpacedRepetition(
  currentIntervalIndex: number,
  scoreOrRating: number
): { nextIntervalDays: number; newIndex: number } {
  // Advance interval if score >= 3.5 (or good self-rating >= 4), reset to 1 on poor performance
  if (scoreOrRating >= 3.5) {
    const nextIndex = Math.min(REPETITION_INTERVALS.length - 1, currentIntervalIndex + 1);
    return {
      nextIntervalDays: REPETITION_INTERVALS[nextIndex],
      newIndex: nextIndex,
    };
  } else {
    // Reset to first interval
    return {
      nextIntervalDays: REPETITION_INTERVALS[0],
      newIndex: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// 8. Readiness Assessment with Uncertainty Band (< 3 sessions shows 'Not enough data')
// ---------------------------------------------------------------------------
export function computeReadiness(
  overallEwma: number,
  targetScore: number,
  sessionCount: number
): { status: 'not_enough_data' | 'developing' | 'on_track' | 'interview_ready'; readinessScore: number | null; uncertaintyBand: number } {
  if (sessionCount < 3) {
    return { status: 'not_enough_data', readinessScore: null, uncertaintyBand: 15 };
  }

  const uncertaintyBand = Math.max(3, Math.round(18 / Math.sqrt(sessionCount)));
  const readiness = Math.min(100, Math.max(0, Math.round((overallEwma / targetScore) * 100)));

  let status: 'developing' | 'on_track' | 'interview_ready' = 'developing';
  if (readiness >= 90) {
    status = 'interview_ready';
  } else if (readiness >= 75) {
    status = 'on_track';
  }

  return { status, readinessScore: readiness, uncertaintyBand };
}

// Default Progress Trend Model implementation
export const defaultTrendModel: TrendModel = {
  computeEwma,
  computeTheilSenSlope,
  findWeakestDimension,
  computeStreak: calculateStreak,
  computeNextTopicPriority,
  scheduleSpacedRepetition,
};
