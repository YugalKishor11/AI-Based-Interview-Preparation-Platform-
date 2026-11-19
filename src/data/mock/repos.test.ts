import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockSessionsRepo,
  MockReportsRepo,
  MockQuestionsRepo,
  MockProfileRepo,
  store,
} from './index';

describe('Mock Repositories', () => {
  let sessionsRepo: MockSessionsRepo;
  let reportsRepo: MockReportsRepo;
  let questionsRepo: MockQuestionsRepo;
  let profileRepo: MockProfileRepo;

  beforeEach(() => {
    store.resetAll();
    sessionsRepo = new MockSessionsRepo();
    reportsRepo = new MockReportsRepo();
    questionsRepo = new MockQuestionsRepo();
    profileRepo = new MockProfileRepo();
  });

  it('lists sessions with filtering', async () => {
    const all = await sessionsRepo.list();
    expect(all.length).toBeGreaterThanOrEqual(12);

    const systemDesign = await sessionsRepo.list({ type: 'System Design' });
    expect(systemDesign.every((s) => s.type.includes('System Design'))).toBe(true);
  });

  it('gets a report by id with evidence and rubric', async () => {
    const report = await reportsRepo.get('rep-101');
    expect(report).toBeDefined();
    expect(report.overallScore).toBe(84);
    expect(report.rubric.length).toBeGreaterThan(0);
    expect(report.isDemo).toBe(true);
  });

  it('searches and filters practice questions and toggles save state', async () => {
    const res = await questionsRepo.search({ topic: 'System Design' });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((q) => q.topic === 'System Design')).toBe(true);

    const firstId = res[0].id;
    const initialSaved = res[0].saved;
    const toggled = await questionsRepo.toggleSave(firstId);
    expect(toggled).toBe(!initialSaved);
  });

  it('updates profile and exports data', async () => {
    const profile = await profileRepo.get();
    expect(profile.name).toBe('Alex Chen');

    await profileRepo.update({ targetRole: 'Principal Architect' });
    const updated = await profileRepo.get();
    expect(updated.targetRole).toBe('Principal Architect');

    const json = await profileRepo.exportData();
    expect(json).toContain('Principal Architect');
  });
});
