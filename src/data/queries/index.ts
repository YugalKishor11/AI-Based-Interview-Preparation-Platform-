// PrepSphere TanStack Query Architecture
// Provides stable query keys, optimistic updates with rollback, prefetching, and realtime cross-device sync.

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  sessionsRepo,
  reportsRepo,
  questionsRepo,
  profileRepo,
  progressRepo,
  isSupabaseConfigured,
  supabase,
} from '../index';
import {
  Profile,
  Session,
  Report,
  Question,
  ProgressSnapshot,
  InterviewPlan,
} from '../contracts';
import { useEffect } from 'react';

// ==========================================
// 1. Stable Query Keys Factory
// ==========================================
export const queryKeys = {
  profile: () => ['profile'] as const,
  sessions: (params?: { q?: string; type?: string; limit?: number }) => ['sessions', params] as const,
  session: (id: string) => ['session', id] as const,
  report: (id: string) => ['report', id] as const,
  questions: (params?: { query?: string; topic?: string; level?: string; savedOnly?: boolean }) =>
    ['questions', params] as const,
  question: (id: string) => ['question', id] as const,
  progress: () => ['progress'] as const,
};

// ==========================================
// 2. Profile Queries & Optimistic Mutations
// ==========================================
export function useProfileQuery(): UseQueryResult<Profile, Error> {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => profileRepo.get(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useUpdateProfileMutation(): UseMutationResult<
  Profile,
  Error,
  Partial<Profile>,
  { previousProfile?: Profile }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) => profileRepo.update(updates),
    onMutate: async (updates) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.profile() });
      const previousProfile = queryClient.getQueryData<Profile>(queryKeys.profile());

      if (previousProfile) {
        queryClient.setQueryData<Profile>(queryKeys.profile(), {
          ...previousProfile,
          ...updates,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.profile(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
  });
}

// ==========================================
// 3. Sessions Queries & Realtime Sync
// ==========================================
export function useSessionsQuery(params?: {
  q?: string;
  type?: string;
  limit?: number;
}): UseQueryResult<Session[], Error> {
  const queryClient = useQueryClient();

  // Optional cross-device realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('public:interview_sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interview_sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.sessions(params),
    queryFn: () => sessionsRepo.list(params),
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 2,
  });
}

export function useSessionQuery(id: string): UseQueryResult<Session, Error> {
  return useQuery({
    queryKey: queryKeys.session(id),
    queryFn: () => sessionsRepo.get(id),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(id),
  });
}

export function useCreateSessionMutation(): UseMutationResult<
  Session,
  Error,
  { plan: InterviewPlan; personaId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plan, personaId }) => sessionsRepo.create(plan, personaId),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.setQueryData(queryKeys.session(newSession.id), newSession);
    },
  });
}

// ==========================================
// 4. Reports Queries
// ==========================================
export function useReportQuery(id: string): UseQueryResult<Report, Error> {
  return useQuery({
    queryKey: queryKeys.report(id),
    queryFn: () => reportsRepo.get(id),
    staleTime: 1000 * 60 * 10, // 10 minutes (reports are immutable once finalized)
    enabled: Boolean(id),
  });
}

// ==========================================
// 5. Questions Queries & Optimistic Bookmark Toggle
// ==========================================
export function useQuestionsQuery(params?: {
  query?: string;
  topic?: string;
  level?: string;
  savedOnly?: boolean;
}): UseQueryResult<Question[], Error> {
  return useQuery({
    queryKey: queryKeys.questions(params),
    queryFn: () => questionsRepo.search(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useToggleSaveQuestionMutation(): UseMutationResult<
  boolean,
  Error,
  string,
  { previousQueries: [readonly unknown[], Question[] | undefined][] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => questionsRepo.toggleSave(questionId),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });

      // Find all questions queries currently in cache and apply optimistic bookmark toggle
      const queries = queryClient.getQueriesData<Question[]>({ queryKey: ['questions'] });
      const previousQueries: [readonly unknown[], Question[] | undefined][] = [];

      for (const [key, data] of queries) {
        previousQueries.push([key, data]);
        if (data) {
          queryClient.setQueryData<Question[]>(
            key,
            data.map((q) => (q.id === questionId ? { ...q, saved: !q.saved } : q))
          );
        }
      }

      return { previousQueries };
    },
    onError: (_err, _questionId, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useToggleCompleteQuestionMutation(): UseMutationResult<boolean, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => questionsRepo.toggleComplete(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

// ==========================================
// 6. Progress Analytics Query
// ==========================================
export function useProgressQuery(): UseQueryResult<ProgressSnapshot[], Error> {
  return useQuery({
    queryKey: queryKeys.progress(),
    queryFn: () => progressRepo.getSnapshots(),
    staleTime: 1000 * 60 * 5,
  });
}

// ==========================================
// 7. Route Prefetcher for Dock & Navigation Hover
// ==========================================
export async function prefetchRoute(queryClient: QueryClient, route: string): Promise<void> {
  try {
    if (route === '/app' || route === '/app/dashboard') {
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: queryKeys.profile(), queryFn: () => profileRepo.get(), staleTime: 1000 * 60 * 5 }),
        queryClient.prefetchQuery({ queryKey: queryKeys.sessions(), queryFn: () => sessionsRepo.list(), staleTime: 1000 * 60 * 1 }),
        queryClient.prefetchQuery({ queryKey: queryKeys.progress(), queryFn: () => progressRepo.getSnapshots(), staleTime: 1000 * 60 * 5 }),
      ]);
    } else if (route === '/app/practice') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.questions(),
        queryFn: () => questionsRepo.search(),
        staleTime: 1000 * 60 * 5,
      });
    } else if (route === '/app/history') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.sessions(),
        queryFn: () => sessionsRepo.list(),
        staleTime: 1000 * 60 * 1,
      });
    } else if (route === '/app/settings') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.profile(),
        queryFn: () => profileRepo.get(),
        staleTime: 1000 * 60 * 5,
      });
    }
  } catch {
    // Prefetching is purely speculative and must never throw
  }
}
