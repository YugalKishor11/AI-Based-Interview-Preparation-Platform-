// Supabase client in-memory stateful shim for Vitest backend test suite

const inMemoryDb: Record<string, Map<string, any>> = {
  rate_limits: new Map(),
  idempotency_keys: new Map(),
  profiles: new Map([
    ['usr-alex-chen-01', { id: 'usr-alex-chen-01', credits: 120, streak_days: 6 }],
  ]),
  interview_plans: new Map(),
  interview_sessions: new Map(),
  answers: new Map(),
  rubric_scores: new Map(),
  reports: new Map(),
  drill_plans: new Map(),
  consents: new Map([
    ['usr-alex-chen-01:audioAnalysis', { user_id: 'usr-alex-chen-01', consent_type: 'audioAnalysis', granted: true }],
    ['usr-alex-chen-01:dataProcessing', { user_id: 'usr-alex-chen-01', consent_type: 'dataProcessing', granted: true }],
  ]),
  feedback_disputes: new Map(),
  resumes: new Map(),
  audit_logs: new Map(),
};

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

class QueryBuilder {
  private filters: Array<{ col: string; val: any; op: string }> = [];
  private orderCol?: string;
  private limitN?: number;

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

  order(col: string, _opts?: any) {
    this.orderCol = col;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
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
      }
    }

    if (this.limitN) {
      rows = rows.slice(0, this.limitN);
    }
    return rows;
  }

  async maybeSingle() {
    const rows = this.filterRows();
    return { data: rows.length > 0 ? rows[0] : null, error: null };
  }

  async insert(values: any | any[]) {
    const store = inMemoryDb[this.table];
    const items = Array.isArray(values) ? values : [values];
    for (const item of items) {
      const id = item.key || item.id || crypto.randomUUID();
      store.set(String(id), { ...item });
    }
    return { data: values, error: null };
  }

  async upsert(values: any | any[]) {
    return this.insert(values);
  }

  async update(values: any) {
    const rows = this.filterRows();
    const store = inMemoryDb[this.table];
    for (const r of rows) {
      const id = r.key || r.id;
      if (id) {
        store.set(String(id), { ...r, ...values });
      }
    }
    return { data: rows, error: null };
  }

  async delete() {
    const rows = this.filterRows();
    const store = inMemoryDb[this.table];
    for (const r of rows) {
      const id = r.key || r.id;
      if (id) {
        store.delete(String(id));
      }
    }
    return { data: rows, error: null };
  }

  then(resolve: (val: any) => void) {
    const rows = this.filterRows();
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
