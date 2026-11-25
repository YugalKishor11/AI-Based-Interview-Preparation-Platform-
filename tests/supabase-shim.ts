// Supabase client in-memory stateful shim for Vitest backend and contract test suites

export const inMemoryDb: Record<string, Map<string, any>> = {
  rate_limits: new Map(),
  idempotency_keys: new Map(),
  profiles: new Map(),
  interview_plans: new Map(),
  interview_sessions: new Map(),
  answers: new Map(),
  rubric_scores: new Map(),
  reports: new Map(),
  drill_plans: new Map(),
  consents: new Map(),
  feedback_disputes: new Map(),
  resumes: new Map(),
  audit_logs: new Map(),
  questions: new Map(),
  saved_questions: new Map(),
  progress_snapshots: new Map(),
  deletion_audit: new Map(),
};

export function resetShimDb() {
  for (const table of Object.keys(inMemoryDb)) {
    inMemoryDb[table].clear();
  }

  // Seed profiles
  inMemoryDb.profiles.set('usr-alex-chen-01', {
    id: 'usr-alex-chen-01',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    target_role: 'Staff Software Engineer',
    target_level: 'Staff',
    credits: 120,
    streak_days: 6,
    avatar_url: null,
    joined_date: 'October 2026',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed sessions
  const sessions = [
    {
      id: 's-101',
      user_id: 'usr-alex-chen-01',
      title: 'System Design: Distributed Cache',
      type: 'System Design',
      persona_id: 'p4',
      score: 84,
      duration_mins: 45,
      session_date: '2 hours ago',
      state: 'completed',
      resumable_state: {},
      provider: 'supabase',
      demo_mode: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 's-102',
      user_id: 'usr-alex-chen-01',
      title: 'Coding: Concurrency in Go',
      type: 'Coding',
      persona_id: 'p1',
      score: 79,
      duration_mins: 30,
      session_date: 'Yesterday',
      state: 'completed',
      resumable_state: {},
      provider: 'supabase',
      demo_mode: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 's-103',
      user_id: 'usr-alex-chen-01',
      title: 'System Design: Video Streaming',
      type: 'System Design',
      persona_id: 'p4',
      score: 88,
      duration_mins: 60,
      session_date: '3 days ago',
      state: 'completed',
      resumable_state: {},
      provider: 'supabase',
      demo_mode: false,
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
  ];

  for (const s of sessions) {
    inMemoryDb.interview_sessions.set(s.id, s);
  }

  // Seed reports
  inMemoryDb.reports.set('rep-101', {
    id: 'rep-101',
    session_id: 's-101',
    user_id: 'usr-alex-chen-01',
    title: 'System Design: Distributed Cache',
    type: 'System Design',
    persona_id: 'p4',
    report_date: '2 hours ago',
    duration: '45 mins',
    overall_score: 84,
    label: 'Strong Hire',
    confidence: 'High',
    score_delta: '+4 pts',
    summary: 'Candidate demonstrated exemplary architectural trade-off reasoning.',
    rubric: [
      { name: 'System Architecture', score: 88, weight: 0.35, feedback: 'Strong modular design' },
      { name: 'Fault Tolerance & HA', score: 82, weight: 0.35, feedback: 'Good partition recovery' },
      { name: 'Communication', score: 82, weight: 0.30, feedback: 'Clear structured delivery' },
    ],
    delivery: {
      pace: 138,
      clarity: 88,
      fillerWordsPerMin: 1.1,
      pausesCount: 4,
      volumeStability: 85,
    },
    questions_feedback: [],
    drill_plan: [],
    disclaimer: 'PrepSphere practice simulation evaluation.',
    is_demo: false,
    created_at: new Date().toISOString(),
  });

  // Seed questions
  const questions = [
    {
      id: 'q-sys-1',
      topic: 'System Design',
      level: 'Hard',
      title: 'Design a Globally Distributed Rate Limiter',
      tags: ['Distributed Systems', 'Caching', 'Redis'],
      hint1: 'Consider sliding window logs vs counters.',
      hint2: 'Think about cross-region synchronization latency.',
      explanation: 'Use Redis cluster with local memory caching.',
      is_demo: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-dsa-1',
      topic: 'DSA',
      level: 'Medium',
      title: 'Implement an LRU Cache with O(1) Operations',
      tags: ['Data Structures', 'Hash Map', 'Doubly Linked List'],
      hint1: 'Hash map for lookup, doubly linked list for order.',
      hint2: 'Update head on access, evict tail on capacity.',
      explanation: 'Classic doubly linked list with hash table.',
      is_demo: false,
      created_at: new Date().toISOString(),
    },
  ];

  for (const q of questions) {
    inMemoryDb.questions.set(q.id, q);
  }

  // Seed progress snapshots
  inMemoryDb.progress_snapshots.set('snap-1', {
    id: 'snap-1',
    user_id: 'usr-alex-chen-01',
    snapshot_date: '2026-10-01',
    overall_score: 75,
    technical_score: 74,
    reasoning_score: 76,
    communication_score: 78,
    problem_solving_score: 72,
    created_at: new Date('2026-10-01').toISOString(),
  });
  inMemoryDb.progress_snapshots.set('snap-2', {
    id: 'snap-2',
    user_id: 'usr-alex-chen-01',
    snapshot_date: '2026-10-15',
    overall_score: 82,
    technical_score: 84,
    reasoning_score: 81,
    communication_score: 83,
    problem_solving_score: 80,
    created_at: new Date('2026-10-15').toISOString(),
  });
}

// Initial seed
resetShimDb();

export interface SupabaseClient {
  from: (table: string) => QueryBuilder;
  storage: {
    from: (bucket: string) => any;
    listBuckets: () => Promise<any>;
  };
  auth: {
    getUser: (token?: string) => Promise<any>;
    admin: {
      deleteUser: (id: string) => Promise<any>;
    };
  };
  rpc: (fn: string, params: any) => Promise<any>;
}

export class QueryBuilder {
  private filters: Array<{ col: string; val: any; op: string }> = [];
  private orderCol?: string;
  private orderAsc: boolean = true;
  private limitN?: number;
  private isInsert: boolean = false;
  private insertedItems: any[] = [];
  private updateValues?: any;
  private isDelete: boolean = false;

  constructor(private table: string) {
    if (!inMemoryDb[table]) {
      inMemoryDb[table] = new Map();
    }
  }

  select(_cols?: string) {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val, op: 'eq' });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ col, val, op: 'gte' });
    return this;
  }

  lt(col: string, val: any) {
    this.filters.push({ col, val, op: 'lt' });
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push({ col, val: vals, op: 'in' });
    return this;
  }

  ilike(col: string, pattern: string) {
    const clean = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push({ col, val: clean, op: 'ilike' });
    return this;
  }

  or(clause: string) {
    this.filters.push({ col: '*', val: clause, op: 'or' });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  insert(values: any | any[]) {
    this.isInsert = true;
    const store = inMemoryDb[this.table];
    const items = Array.isArray(values) ? values : [values];
    for (const item of items) {
      const id = item.key || item.id || crypto.randomUUID();
      const saved = { ...item, id };
      store.set(String(id), saved);
      this.insertedItems.push(saved);
    }
    return this;
  }

  upsert(values: any | any[]) {
    return this.insert(values);
  }

  update(values: any) {
    this.updateValues = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  private filterRows(): any[] {
    const store = inMemoryDb[this.table];
    let rows = Array.from(store.values());

    for (const f of this.filters) {
      if (f.op === 'eq') {
        rows = rows.filter((r) => r[f.col] === f.val);
      } else if (f.op === 'gte') {
        rows = rows.filter((r) => r[f.col] >= f.val);
      } else if (f.op === 'lt') {
        rows = rows.filter((r) => r[f.col] < f.val);
      } else if (f.op === 'in') {
        rows = rows.filter((r) => Array.isArray(f.val) && f.val.includes(r[f.col]));
      } else if (f.op === 'ilike') {
        rows = rows.filter((r) => String(r[f.col] || '').toLowerCase().includes(f.val));
      } else if (f.op === 'or') {
        // Simple search query match
        rows = rows.filter((r) =>
          Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(f.val.toLowerCase()))
        );
      }
    }

    if (this.orderCol) {
      rows.sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderAsc ? -1 : 1;
        if (valA > valB) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }

    if (this.limitN) {
      rows = rows.slice(0, this.limitN);
    }
    return rows;
  }

  private executeModifications(rows: any[]) {
    const store = inMemoryDb[this.table];
    if (this.updateValues) {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const id = r.key || r.id;
        if (id) {
          const updated = { ...r, ...this.updateValues };
          store.set(String(id), updated);
          rows[i] = updated;
        }
      }
    } else if (this.isDelete) {
      for (const r of rows) {
        const id = r.key || r.id;
        if (id) {
          store.delete(String(id));
        }
      }
    }
  }

  async single() {
    if (this.isInsert && this.insertedItems.length > 0) {
      return { data: this.insertedItems[0], error: null };
    }
    const rows = this.filterRows();
    this.executeModifications(rows);
    return {
      data: rows.length > 0 ? rows[0] : null,
      error: rows.length === 0 ? { message: 'Row not found', code: 'PGRST116' } : null,
    };
  }

  async maybeSingle() {
    if (this.isInsert && this.insertedItems.length > 0) {
      return { data: this.insertedItems[0], error: null };
    }
    const rows = this.filterRows();
    this.executeModifications(rows);
    return { data: rows.length > 0 ? rows[0] : null, error: null };
  }

  then(resolve: (val: any) => void) {
    if (this.isInsert) {
      resolve({ data: this.insertedItems, error: null });
      return;
    }
    const rows = this.filterRows();
    this.executeModifications(rows);
    resolve({ data: rows, error: null });
  }
}

export function createClient(_url: string, _key: string, _opts?: any): SupabaseClient {
  return {
    from: (table: string) => new QueryBuilder(table),
    storage: {
      from: (_bucket: string) => ({
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: [], error: null }),
        upload: () => Promise.resolve({ data: { path: 'test.pdf' }, error: null }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://storage/signed/test.pdf' }, error: null }),
      }),
      listBuckets: () => Promise.resolve({ data: [{ name: 'recordings' }, { name: 'resumes' }], error: null }),
    },
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'usr-alex-chen-01',
            email: 'alex.chen@example.com',
            role: 'authenticated',
          },
        },
        error: null,
      }),
      admin: {
        deleteUser: async () => ({ data: {}, error: null }),
      },
    },
    rpc: async (_fn: string, params: any) => {
      const amount = params?.p_amount || 0;
      return { data: Math.max(0, 120 - amount), error: null };
    },
  };
}
