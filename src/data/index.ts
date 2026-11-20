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
import {
  SupabaseSessionsRepo,
  SupabaseReportsRepo,
  SupabaseQuestionsRepo,
  SupabaseProfileRepo,
  SupabaseAuthRepo,
  SupabaseProgressRepo,
  SupabaseInterviewEngine,
  isSupabaseConfigured,
  supabase,
} from './supabase';

const envSource = import.meta.env.VITE_DATA_SOURCE;
const localSource = typeof window !== 'undefined' ? localStorage.getItem('prepsphere_data_source') : null;

// Determine active data source
export const isLiveBackend = ((localSource || envSource) === 'supabase') && isSupabaseConfigured();
export const dataSource: 'mock' | 'supabase' = isLiveBackend ? 'supabase' : 'mock';

// Repositories automatically wire to Supabase when enabled and configured,
// or gracefully default to the realistic local mock store.
export const sessionsRepo: SessionsRepo = isLiveBackend ? new SupabaseSessionsRepo() : new MockSessionsRepo();
export const reportsRepo: ReportsRepo = isLiveBackend ? new SupabaseReportsRepo() : new MockReportsRepo();
export const questionsRepo: QuestionsRepo = isLiveBackend ? new SupabaseQuestionsRepo() : new MockQuestionsRepo();
export const profileRepo: ProfileRepo = isLiveBackend ? new SupabaseProfileRepo() : new MockProfileRepo();
export const authRepo: AuthRepo = isLiveBackend ? new SupabaseAuthRepo() : new MockAuthRepo();
export const progressRepo: ProgressRepo = isLiveBackend ? new SupabaseProgressRepo() : new MockProgressRepo();
export const interviewEngine: InterviewEngine = isLiveBackend ? new SupabaseInterviewEngine() : new MockInterviewEngine();

export { isSupabaseConfigured, supabase };
