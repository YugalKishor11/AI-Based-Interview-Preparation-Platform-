import {
  SessionsRepo,
  ReportsRepo,
  QuestionsRepo,
  ProfileRepo,
  AuthRepo,
  ProgressRepo,
  InterviewEngine,
} from './repos/interfaces';
import {
  MockSessionsRepo,
  MockReportsRepo,
  MockQuestionsRepo,
  MockProfileRepo,
  MockAuthRepo,
  MockProgressRepo,
  MockInterviewEngine,
} from './mock';

const dataSource = import.meta.env.VITE_DATA_SOURCE || 'mock';

// Phase A uses Mock implementations.
// Phase D switches to Supabase implementations without rewriting any screens.
export const sessionsRepo: SessionsRepo = new MockSessionsRepo();
export const reportsRepo: ReportsRepo = new MockReportsRepo();
export const questionsRepo: QuestionsRepo = new MockQuestionsRepo();
export const profileRepo: ProfileRepo = new MockProfileRepo();
export const authRepo: AuthRepo = new MockAuthRepo();
export const progressRepo: ProgressRepo = new MockProgressRepo();
export const interviewEngine: InterviewEngine = new MockInterviewEngine();

export { dataSource };
