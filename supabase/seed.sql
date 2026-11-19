-- ==========================================
-- PREPSPHERE SEED DATA: supabase/seed.sql
-- Seeded virtual AI personas and 60 curated questions
-- ==========================================

-- 1. Insert Interviewer Personas
INSERT INTO public.interviewer_personas (id, name, title, style, description, languages, voice_gender, sample_line, p1_color, p2_color, is_active, is_demo)
VALUES
  (
    'p1',
    'Aanya Rao',
    'Senior Engineering Manager',
    'Supportive',
    'Warm, structured, probing follow-ups on engineering management and system resilience.',
    'English, Hindi',
    'female',
    'Welcome Alex. Let''s walk through how you balance architectural purity with rapid delivery deadlines.',
    'rgba(139, 92, 246, 0.9)',
    'rgba(244, 114, 182, 0.7)',
    true,
    true
  ),
  (
    'p2',
    'Meera Kapoor',
    'HR Business Partner',
    'Balanced',
    'Calm, conversational, highly focused on leadership principles, EQ, and stakeholder consensus.',
    'English, Hindi',
    'female',
    'Hi Alex. I''d love to hear about a critical instance where team priorities clashed with company goals.',
    'rgba(56, 189, 248, 0.9)',
    'rgba(52, 211, 153, 0.7)',
    true,
    true
  ),
  (
    'p3',
    'Rohan Mehta',
    'Staff Software Engineer',
    'Challenging',
    'Direct, fast-paced, relentless on concurrency race conditions, memory safety, and edge-cases.',
    'English, Hindi',
    'male',
    'Let''s dig in. If your Redis cluster experiences a split-brain under peak load, what fails first and why?',
    'rgba(56, 189, 248, 0.9)',
    'rgba(139, 92, 246, 0.8)',
    true,
    true
  ),
  (
    'p4',
    'Daniel Brooks',
    'Principal Infrastructure Architect',
    'Challenging',
    'Thoughtful, deep system architecture focus, probing CAP theorem compromises and distributed clock skews.',
    'English',
    'male',
    'Good day Alex. Let''s examine how you ensure sliding-window rate limiting consistency across multi-region edge caches.',
    'rgba(139, 92, 246, 0.9)',
    'rgba(56, 189, 248, 0.8)',
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  style = EXCLUDED.style,
  description = EXCLUDED.description,
  languages = EXCLUDED.languages,
  voice_gender = EXCLUDED.voice_gender,
  sample_line = EXCLUDED.sample_line,
  p1_color = EXCLUDED.p1_color,
  p2_color = EXCLUDED.p2_color;

-- 2. Insert Curated Questions (60 questions across 8 disciplines)
INSERT INTO public.questions (id, topic, level, title, tags, hint1, hint2, explanation, is_demo)
VALUES
  -- 1. System Design
  ('qb-1', 'System Design', 'Hard', 'Design a Global Distributed Rate Limiter', ARRAY['Redis', 'Concurrency', 'Lua'], 'Consider atomic operations in memory caches like Redis.', 'Sliding window log vs sliding window counter: balance memory vs precision.', 'Requires atomic token bucket synchronization and edge proxy in-memory fallbacks on 15ms latency breach.', true),
  ('qb-2', 'System Design', 'Hard', 'Real-time Collaborative Document Editing (OT vs CRDT)', ARRAY['WebSockets', 'CRDT', 'State'], 'Operational Transformation requires central sequencer; CRDTs converge peer-to-peer.', 'Tombstones, memory bloat, and causal consistency.', 'State-based vs operation-based CRDT trade-offs in distributed collaborative suites.', true),
  ('qb-3', 'System Design', 'Medium', 'Scalable Push Notification Delivery System', ARRAY['APNs', 'FCM', 'Kafka'], 'Device token fanout with partition workers.', 'Throttling and backpressure to avoid downstream device gateway 429s.', 'Partitioned consumer groups managing gateway socket connection pools.', true),
  ('qb-4', 'System Design', 'Hard', 'Video Transcoding & Adaptive Bitrate Streaming Pipeline', ARRAY['S3', 'FFmpeg', 'CDN'], 'Chunk-based chunking with HLS/DASH manifest creation.', 'Asynchronous workers consuming SQS/Kafka jobs.', 'Distributed video chunk slicing and manifest stitching.', true),
  ('qb-5', 'System Design', 'Medium', 'Distributed Web Crawler with Politeness Policy', ARRAY['DNS', 'Bloom Filter', 'Robots.txt'], 'Use Bloom filters for visited URL deduplication.', 'Queueing per host domain to honor robots.txt rate limits.', 'Two-tier frontier queuing separating domain politeness from overall throughput.', true),
  ('qb-6', 'System Design', 'Hard', 'Financial Ledger with Exactly-Once Processing', ARRAY['Postgres', 'Idempotency', 'Kafka'], 'Idempotency keys and transactional outbox pattern.', 'Double-entry bookkeeping validation constraints.', 'Strict double-entry invariants with database unique idempotency indexes.', true),
  ('qb-7', 'System Design', 'Medium', 'API Gateway with Dynamic Plugin Architecture', ARRAY['Envoy', 'WASM', 'Reverse Proxy'], 'Separation of control plane and data plane.', 'WASM modules for safe sandbox extension execution.', 'Envoy filter chains with out-of-process gRPC authorization sidecars.', true),
  ('qb-8', 'System Design', 'Hard', 'Geo-Distributed Metrics & Observability Platform', ARRAY['TSDB', 'Prometheus', 'Downsampling'], 'Time-series compaction and rollup tiers.', 'Distributed query fanout and pushdown aggregations.', 'Multi-tier storage with Gorilla delta-of-delta compression and long-term object storage rollups.', true),

  -- 2. React / Frontend
  ('qb-9', 'React / Frontend', 'Medium', 'Explain Fiber Reconciliation and Concurrent Mode', ARRAY['React', 'DOM', 'Scheduling'], 'Think about cooperative multitasking and message loops.', 'requestIdleCallback and time-slicing prioritization.', 'Fiber units of work enable pausing, resuming, and prioritizing work units without blocking.', true),
  ('qb-10', 'React / Frontend', 'Hard', 'Designing an Unbundled Virtualized Windowing List', ARRAY['DOM', 'Virtualization', 'Scroll'], 'Calculate visible slice based on scrollTop and itemHeight.', 'Dynamic row heights with ResizeObserver and binary search cache.', 'Windowing decouples total dataset length from rendered DOM node count.', true),
  ('qb-11', 'React / Frontend', 'Medium', 'Micro-Frontend Orchestration & Shared State Isolation', ARRAY['Module Federation', 'Custom Events'], 'Webpack Module Federation vs iframes.', 'Shared dependency singletons and version mismatches.', 'Runtime dynamic container remotes with version negotiation.', true),
  ('qb-12', 'React / Frontend', 'Hard', 'Optimizing INP (Interaction to Next Paint) in Heavy SPAs', ARRAY['Web Vitals', 'Main Thread', 'RAF'], 'Break long tasks into yields using scheduler.yield() or setTimeout.', 'Debounce vs throttle vs transition hooks.', 'Yielding to main thread between user input dispatch and DOM paint commit.', true),
  ('qb-13', 'React / Frontend', 'Medium', 'React Server Components (RSC) vs Client Components', ARRAY['Next.js', 'SSR', 'Bundling'], 'Zero client bundle footprint for server-only dependencies.', 'Serialization boundaries across JSON payload stream.', 'RSC streams serialized component trees without shipping node_modules runtime code to client.', true),
  ('qb-14', 'React / Frontend', 'Easy', 'Deep Equality vs Shallow Reference in React Memoization', ARRAY['useMemo', 'useCallback', 'GC'], 'Object.is comparison in dependencies array.', 'Over-memoization costs vs re-render penalties.', 'Garbage collection pressure and closure overhead vs re-evaluation cycles.', true),
  ('qb-15', 'React / Frontend', 'Hard', 'Building an Offline-First Sync Engine with IndexedDB', ARRAY['ServiceWorker', 'IndexedDB', 'Sync'], 'Mutation queues with monotonic local IDs.', 'Optimistic UI rollback and conflict resolution policies.', 'Append-only mutation journal synced with server during online events.', true),

  -- 3. Behavioral
  ('qb-16', 'Behavioral', 'Hard', 'Handling Critical Technical Disagreement with Principal Engineers', ARRAY['Conflict', 'Staff+', 'Influence'], 'Focus on empirical data and prototyping rather than seniority.', 'Demonstrate Disagree and Commit with clear success criteria.', 'Frame disagreements around measurable user impact and rollback milestones.', true),
  ('qb-17', 'Behavioral', 'Medium', 'Navigating Unrealistic Deadlines Imposed by Executives', ARRAY['Expectations', 'Trade-offs', 'Communication'], 'Never just say no; present scoped trade-offs with risk assessments.', 'Demonstrate phased delivery with an MVP cutline.', 'Communicate feature-scope vs ship-date trade-off matrices clearly.', true),
  ('qb-18', 'Behavioral', 'Hard', 'Leading a High-Severity Incident Response & Blameless Postmortem', ARRAY['SEV-1', 'Incident', 'Culture'], 'Separate incident commander from technical mitigators.', 'Focus postmortem on systemic process gaps, not human blame.', 'Structured communications cadences and preventative automated action items.', true),
  ('qb-19', 'Behavioral', 'Medium', 'Mentoring an Underperforming Senior Engineer Back to Success', ARRAY['Management', 'Feedback', '1-on-1'], 'Clarify expectations with measurable 30-day goals.', 'Identify skill gaps vs motivation/burnout factors.', 'Root cause analysis separating technical blockers from psychological safety.', true),
  ('qb-20', 'Behavioral', 'Hard', 'Sunset a Beloved Legacy System Against User Resistance', ARRAY['Change Management', 'Strategy'], 'Communicate migration timeline and direct migration tooling.', 'Create empathy bridges with affected power users.', 'Provide migration automation scripts and high-touch developer advocacy.', true),
  ('qb-21', 'Behavioral', 'Medium', 'Balancing Architectural Purity with Urgent Time-to-Market', ARRAY['Tech Debt', 'Product Strategy'], 'Define technical debt budgets as a planned loan.', 'Schedule immediate payoff tickets in subsequent sprint.', 'Intentional technical debt tracked with explicit ROI payback schedules.', true),
  ('qb-22', 'Behavioral', 'Hard', 'Managing Organizational Re-org and Shifting Priorities', ARRAY['Adaptability', 'Morale', 'Resilience'], 'Re-align team values to new strategic objectives.', 'Maintain high transparency during transitional ambiguity.', 'Protect engineering momentum and communicate strategic context continuously.', true),

  -- 4. DSA
  ('qb-23', 'DSA', 'Hard', 'LRU Cache with Time-to-Live (TTL) Eviction', ARRAY['Hash Map', 'Doubly-Linked List', 'Heaps'], 'Pair a standard LRU doubly linked list with a min-heap for expiration timestamps.', 'Lazy eviction on get() vs background cleanup worker trade-offs.', 'Hash map lookup O(1) coupled with doubly linked list update O(1) and TTL min-heap.', true),
  ('qb-24', 'DSA', 'Hard', 'Trapping Rain Water in 2D and 3D Grids', ARRAY['Two Pointers', 'Min-Heap', 'Monotonic Stack'], 'Maintain leftMax and rightMax bounds using two pointers.', 'For 3D, push boundary cells into priority queue and expand inward.', 'Two-pointer inward traversal maintaining maximum water containment boundary.', true),
  ('qb-25', 'DSA', 'Medium', 'Lowest Common Ancestor in Binary Trees with Parent Pointers', ARRAY['Trees', 'LCA', 'Hash Set'], 'Treat node heights like linked list intersections.', 'Advance the deeper node until depths match.', 'Equalizing depth offsets before walking pointers upward simultaneously.', true),
  ('qb-26', 'DSA', 'Hard', 'Median of Two Sorted Arrays in O(log(min(m, n)))', ARRAY['Binary Search', 'Partitioning'], 'Binary search for partition point on smaller array.', 'Verify maxLeftX <= minRightY and maxLeftY <= minRightX.', 'Binary partition split maintaining equal left and right halves.', true),
  ('qb-27', 'DSA', 'Medium', 'Course Schedule & Topological Sort with Cycle Detection', ARRAY['Graph', 'Kahn Algorithm', 'DFS'], 'Calculate in-degrees or use 3-color DFS visited states.', 'Zero in-degree nodes queue up sequentially.', 'Kahn algorithm using BFS queue of vertices with in-degree 0.', true),
  ('qb-28', 'DSA', 'Hard', 'Word Search II with Prefix Tree (Trie)', ARRAY['Trie', 'Backtracking', 'DFS'], 'Insert dictionary into Trie to prune recursive backtracking.', 'Remove leaf nodes dynamically upon finding matches to avoid duplicates.', 'Backtracking on 2D grid pruned by Trie node existence.', true),
  ('qb-29', 'DSA', 'Medium', 'Serialize and Deserialize N-ary Trees', ARRAY['BFS', 'DFS', 'String Parsing'], 'Preorder traversal with child count markers.', 'Use delimiter tokens like # or brackets to denote tree levels.', 'Preorder traversal encoding child counts or sentinel end markers.', true),
  ('qb-30', 'DSA', 'Hard', 'Sliding Window Maximum using Monotonic Deque in O(N)', ARRAY['Queue', 'Sliding Window'], 'Deque elements maintain decreasing order.', 'Pop indices out of range from the front.', 'Monotonic queue storing indices with strictly descending values.', true),

  -- 5. Database
  ('qb-31', 'Database', 'Medium', 'B-Tree vs LSM-Tree Storage Engines for Write-Heavy Loads', ARRAY['PostgreSQL', 'Cassandra', 'I/O'], 'Sequential I/O vs random page updates.', 'Write amplification vs read compaction overhead.', 'LSM append-only write path converts random writes to sequential I/O with background SSTable compaction.', true),
  ('qb-32', 'Database', 'Hard', 'PostgreSQL MVCC Internals, Vacuuming, and Transaction Wraparound', ARRAY['PostgreSQL', 'WAL', 'Vacuum'], 'Dead tuples and visibility maps.', 'Frozen XIDs and aggressive autovacuum triggers.', 'Postgres writes new tuple versions on update; vacuum reclaims dead rows and prevents 32-bit transaction wraparound.', true),
  ('qb-33', 'Database', 'Hard', 'Designing Sharding Keys for High-Cardinality Multi-Tenant DBs', ARRAY['Sharding', 'Hashing', 'Citrus'], 'Consistent hashing to avoid resharding storms.', 'Hot spot prevention on tenant ID vs time-series shards.', 'Composite shard keys balancing co-location of tenant queries with horizontal load balancing.', true),
  ('qb-34', 'Database', 'Medium', 'Database Isolation Levels: Dirty Reads to Phantom Reads and SSI', ARRAY['ACID', 'Transactions', 'Locks'], 'Read Committed vs Repeatable Read vs Serializable.', 'Snapshot isolation vs Serializable Snapshot Isolation (SSI).', 'SSI tracks read-write dependencies at runtime to abort dangerous cycles without pessimistic two-phase locking.', true),

  -- 6. Concurrency
  ('qb-35', 'Concurrency', 'Hard', 'Lock-Free Multi-Producer Multi-Consumer (MPMC) Queue', ARRAY['CAS', 'Atomics', 'Lock-Free'], 'Michael-Scott queue with paired CAS head and tail updates.', 'Tagged pointers or hazard pointers to eliminate the ABA hazard.', 'Atomic compare-and-swap with monotonic sequence tags preventing ABA race conditions.', true),
  ('qb-36', 'Concurrency', 'Medium', 'Detecting and Preventing Deadlocks in Distributed Microservices', ARRAY['Chandy-Misra', 'Deadlock', 'Timeouts'], 'Wait-for graphs and distributed cycle detection.', 'Wait-Die vs Wound-Wait timestamp ordering.', 'Wound-Wait preemption scheme based on transaction initiation timestamps.', true),
  ('qb-37', 'Concurrency', 'Hard', 'Thread Concurrency Hazards: Starvation, Livelock, Priority Inversion', ARRAY['OS', 'Locks', 'RTOS'], 'Priority inheritance protocol to prevent priority inversion.', 'Exponential randomized backoff to break livelock cycles.', 'Priority inheritance boosts lower priority thread holding mutex needed by higher priority thread.', true),

  -- 7. Architecture
  ('qb-38', 'Architecture', 'Hard', 'Event-Driven Architecture: Sagas (Choreography vs Orchestration)', ARRAY['Kafka', 'Saga', 'EDA'], 'Compensating transactions when a downstream microservice fails.', 'Central workflow orchestrator vs decentralized event subscriptions.', 'Orchestration provides centralized visibility and state machine governance; choreography reduces single point of failure.', true),
  ('qb-39', 'Architecture', 'Medium', 'Zero-Downtime Database Migration Patterns (Expand and Contract)', ARRAY['Blue-Green', 'Migrations', 'Dual-Write'], 'Expand phase: add column, make nullable, write to both.', 'Contract phase: backfill, switch reads, drop old column.', 'Expand-contract pattern allows old and new application versions to run concurrently against migrating schema.', true),
  ('qb-40', 'Architecture', 'Hard', 'Designing a Multi-Region Active-Active Microservices Mesh', ARRAY['Consul', 'DNS', 'Replication'], 'Conflict resolution across active-active database replicas (LWW vs CRDT).', 'Latency-based Anycast routing and regional circuit breakers.', 'Regional independence with asynchronous conflict-free data replication and global traffic routing.', true),

  -- 8. Culture & Leadership
  ('qb-41', 'Culture & Leadership', 'Hard', 'Aligning Engineering Teams Around Strategic Technical Vision', ARRAY['Vision', 'RFC', 'Strategy'], 'Use RFC processes to gather async feedback before decreeing decisions.', 'Tie architectural shifts directly to customer retention and velocity.', 'Collaborative RFC process establishing ownership and cross-functional sponsorship.', true),
  ('qb-42', 'Culture & Leadership', 'Medium', 'Cultivating Psychological Safety and High Accountability', ARRAY['Culture', '1-on-1', 'Safety'], 'Celebrate post-incident learning rather than finding scapegoats.', 'Separate personal blame from systemic quality improvements.', 'Clear outcome ownership coupled with blame-free postmortems drives rapid innovation.', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  topic = EXCLUDED.topic,
  level = EXCLUDED.level,
  tags = EXCLUDED.tags,
  hint1 = EXCLUDED.hint1,
  hint2 = EXCLUDED.hint2,
  explanation = EXCLUDED.explanation;
