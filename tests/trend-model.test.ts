import { describe, it, expect } from 'vitest';
import {
  computeEwma,
  computeTheilSenSlope,
  computeWeeklyDeltas,
  calculateStreak,
  findWeakestDimension,
  computeNextTopicPriority,
  scheduleSpacedRepetition,
  computeReadiness,
  LEVEL_TARGET_ASSUMPTIONS,
} from '../src/features/progress/trendModel';

describe('Progress Trend Model & Analytics Suite (Prompt 6.5)', () => {
  describe('Exponentially Weighted Moving Average (EWMA)', () => {
    it('calculates EWMA with alpha = 0.4 correctly', () => {
      // s_0 = 70 -> m_0 = 70
      // s_1 = 80 -> m_1 = 0.4*80 + 0.6*70 = 32 + 42 = 74
      // s_2 = 90 -> m_2 = 0.4*90 + 0.6*74 = 36 + 44.4 = 80.4
      const result = computeEwma([70, 80, 90], 0.4);
      expect(result).toBe(80.4);
    });

    it('returns single score when array has one item', () => {
      expect(computeEwma([82])).toBe(82);
    });

    it('returns 0 for empty score list', () => {
      expect(computeEwma([])).toBe(0);
    });
  });

  describe('Theil-Sen Robust Slope Estimator', () => {
    it('returns 0 and isSignificant: false for fewer than 4 sessions', () => {
      const points = [
        { x: 1, y: 70 },
        { x: 2, y: 72 },
        { x: 3, y: 75 },
      ];
      const result = computeTheilSenSlope(points);
      expect(result.slope).toBe(0);
      expect(result.isSignificant).toBe(false);
    });

    it('computes robust median slope for linear progression over 5 sessions', () => {
      const points = [
        { x: 1, y: 70 },
        { x: 2, y: 74 },
        { x: 3, y: 78 },
        { x: 4, y: 82 },
        { x: 5, y: 86 },
      ];
      const result = computeTheilSenSlope(points);
      expect(result.slope).toBe(4);
      expect(result.isSignificant).toBe(true);
    });

    it('is robust against single outlier sessions', () => {
      // Outlier drop at session 3
      const points = [
        { x: 1, y: 70 },
        { x: 2, y: 73 },
        { x: 3, y: 40 }, // outlier (e.g. mic disconnect)
        { x: 4, y: 79 },
        { x: 5, y: 82 },
      ];
      const result = computeTheilSenSlope(points);
      expect(result.slope).toBeGreaterThan(2); // Still positive upward trend
    });
  });

  describe('Weekly Average and Week-over-Week Delta', () => {
    it('returns null when a week has fewer than 2 scored sessions', () => {
      const sessions = [
        { id: '1', date: new Date().toISOString(), scores: { technicalAccuracy: 80 } },
      ];
      const result = computeWeeklyDeltas(sessions);
      expect(result.wowDelta).toBeNull();
      expect(result.currentWeekAvg).toBeNull();
    });

    it('computes WoW delta when both current and previous weeks have >= 2 sessions', () => {
      const now = Date.now();
      const sessions = [
        // Current week (2 sessions)
        { id: '1', date: new Date(now - 1 * 86400000).toISOString(), scores: { technicalAccuracy: 86, reasoning: 84 } },
        { id: '2', date: new Date(now - 3 * 86400000).toISOString(), scores: { technicalAccuracy: 84, reasoning: 86 } },
        // Previous week (2 sessions)
        { id: '3', date: new Date(now - 8 * 86400000).toISOString(), scores: { technicalAccuracy: 78, reasoning: 80 } },
        { id: '4', date: new Date(now - 10 * 86400000).toISOString(), scores: { technicalAccuracy: 80, reasoning: 78 } },
      ];

      const result = computeWeeklyDeltas(sessions);
      expect(result.currentWeekAvg).toBe(85);
      expect(result.previousWeekAvg).toBe(79);
      expect(result.wowDelta).toBe(6);
    });
  });

  describe('Consecutive Days Streak Calculation in Timezone', () => {
    it('computes 0 streak if user has no recent sessions', () => {
      const oldDates = ['2026-01-01T10:00:00Z', '2026-01-02T10:00:00Z'];
      expect(calculateStreak(oldDates, 'UTC')).toBe(0);
    });

    it('computes active streak for sessions completed today and consecutive prior days', () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

      const streak = calculateStreak([today, yesterday, twoDaysAgo], 'UTC');
      expect(streak).toBe(3);
    });
  });

  describe('Weakest Dimension & Next-Topic Prioritization', () => {
    it('identifies weakest dimension by lowest EWMA and tie-breaks by target gap', () => {
      const dimensionEwma = {
        technicalAccuracy: 84,
        systemArchitecture: 72,
        communication: 79,
      };
      const targetGaps = {
        technicalAccuracy: 6,
        systemArchitecture: 18,
        communication: 5,
      };

      const weakest = findWeakestDimension(dimensionEwma, targetGaps);
      expect(weakest).toBe('systemArchitecture');
    });

    it('computes next-topic priority formula with human-readable rationale', () => {
      const priority = computeNextTopicPriority({
        dimension: 'systemArchitecture',
        gap: 12,
        declining: true,
        daysSincePracticed: 7,
      });

      // Priority = gap(12) * trendMultiplier(1.5) * recency(1.0) = 18.0
      expect(priority.priority).toBe(18);
      expect(priority.reason).toContain('System Architecture is 12 pts below target');
      expect(priority.reason).toContain('trended downward');
    });
  });

  describe('Spaced Repetition Practice Intervals', () => {
    it('advances repetition interval on good score >= 3.5', () => {
      const next = scheduleSpacedRepetition(0, 4.2);
      expect(next.nextIntervalDays).toBe(3); // Moves from 1 day to 3 days
      expect(next.newIndex).toBe(1);

      const next2 = scheduleSpacedRepetition(1, 4.5);
      expect(next2.nextIntervalDays).toBe(7); // Moves from 3 days to 7 days
    });

    it('resets interval back to 1 day on poor performance (< 3.5)', () => {
      const next = scheduleSpacedRepetition(3, 2.8);
      expect(next.nextIntervalDays).toBe(1);
      expect(next.newIndex).toBe(0);
    });
  });

  describe('Readiness Assessment with Uncertainty Band', () => {
    it('shows not_enough_data when fewer than 3 sessions exist', () => {
      const readiness = computeReadiness(85, 90, 2);
      expect(readiness.status).toBe('not_enough_data');
      expect(readiness.readinessScore).toBeNull();
    });

    it('computes readiness score and narrowing uncertainty band as sessions increase', () => {
      const readiness4 = computeReadiness(82, 90, 4);
      expect(readiness4.status).toBe('interview_ready');
      expect(readiness4.readinessScore).toBe(91);
      expect(readiness4.uncertaintyBand).toBe(9);

      const readiness9 = computeReadiness(82, 90, 9);
      expect(readiness9.uncertaintyBand).toBe(6); // Band narrows with more evidence
    });
  });

  describe('Level Target Assumptions', () => {
    it('contains baseline targets for all 5 seniority levels', () => {
      expect(LEVEL_TARGET_ASSUMPTIONS.fresher).toBeDefined();
      expect(LEVEL_TARGET_ASSUMPTIONS.junior).toBeDefined();
      expect(LEVEL_TARGET_ASSUMPTIONS.mid).toBeDefined();
      expect(LEVEL_TARGET_ASSUMPTIONS.senior).toBeDefined();
      expect(LEVEL_TARGET_ASSUMPTIONS.staff).toBeDefined();
      expect(LEVEL_TARGET_ASSUMPTIONS.staff.technicalAccuracy).toBe(92);
    });
  });
});
