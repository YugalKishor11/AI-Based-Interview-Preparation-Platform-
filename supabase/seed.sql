-- ==========================================
-- PREPSPHERE SEED DATA: supabase/seed.sql
-- Inserts 4 Personas and 60 Curated Practice Questions (marked DEMO)
-- ==========================================

-- 1. Insert 4 Interviewer Personas
insert into public.interviewer_personas (
  id,
  slug,
  name,
  title,
  presentation,
  personality,
  difficulty_style,
  languages,
  sample_line,
  palette,
  voice_ref,
  is_demo,
  active
)
values
  (
    'p0000001-0000-0000-0000-000000000001'::uuid,
    'aanya-rao',
    'Aanya Rao',
    'Senior Engineering Manager',
    'female',
    'Warm, structured, empathetic mentor focusing on leadership, architecture, and team velocity.',
    'Supportive',
    array['en', 'hi'],
    'Welcome! Let us examine how you balance architectural purity with rapid delivery deadlines.',
    '{"p1": "rgba(139, 92, 246, 0.9)", "p2": "rgba(244, 114, 182, 0.7)"}'::jsonb,
    'voice-aanya-supportive',
    true,
    true
  ),
  (
    'p0000002-0000-0000-0000-000000000002'::uuid,
    'meera-kapoor',
    'Meera Kapoor',
    'HR Business Partner',
    'female',
    'Calm, conversational, highly focused on leadership principles, EQ, and stakeholder consensus.',
    'Balanced',
    array['en', 'hi'],
    'Hi there! I would love to hear about a critical instance where team priorities clashed with company goals.',
    '{"p1": "rgba(56, 189, 248, 0.9)", "p2": "rgba(52, 211, 153, 0.7)"}'::jsonb,
    'voice-meera-balanced',
    true,
    true
  ),
  (
    'p0000003-0000-0000-0000-000000000003'::uuid,
    'rohan-mehta',
    'Rohan Mehta',
    'Staff Software Engineer',
    'male',
    'Direct, fast-paced, relentless on concurrency race conditions, memory safety, and edge-cases.',
    'Challenging',
    array['en', 'hi'],
    'Let us dig in. If your distributed cache cluster experiences a partition under peak load, what fails first?',
    '{"p1": "rgba(56, 189, 248, 0.9)", "p2": "rgba(139, 92, 246, 0.8)"}'::jsonb,
    'voice-rohan-challenging',
    true,
    true
  ),
  (
    'p0000004-0000-0000-0000-000000000004'::uuid,
    'daniel-brooks',
    'Daniel Brooks',
    'Principal Infrastructure Architect',
    'male',
    'Authoritative, systems architecture focus, probing CAP theorem compromises and distributed invariants.',
    'Challenging',
    array['en'],
    'Good day. Let us analyze how you reconcile multi-region consistency across edge data caches.',
    '{"p1": "rgba(139, 92, 246, 0.9)", "p2": "rgba(56, 189, 248, 0.8)"}'::jsonb,
    'voice-daniel-architect',
    true,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  title = excluded.title,
  presentation = excluded.presentation,
  personality = excluded.personality,
  difficulty_style = excluded.difficulty_style,
  languages = excluded.languages,
  sample_line = excluded.sample_line,
  palette = excluded.palette,
  voice_ref = excluded.voice_ref,
  active = excluded.active;

-- 2. Insert 60 Curated Practice Questions (All tagged is_demo=true and marked [DEMO])
insert into public.questions (
  id, topic, title, body, level, difficulty, tags, hint1, hint2, explanation, is_demo
)
values
  -- 1-10: System Design
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'System Design', '[DEMO] Design a Global Distributed Rate Limiter', 'Design a scalable multi-region rate limiting service that enforces tier-based rate limits with sub-10ms p99 latency.', 'staff', 'hard', array['redis', 'concurrency', 'lua'], 'Consider atomic operations in memory caches like Redis.', 'Sliding window log vs sliding window counter trade-offs.', 'Requires atomic token bucket synchronization and edge proxy in-memory fallbacks.', true),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'System Design', '[DEMO] Real-Time Collaborative Document Editing', 'Design a distributed document editor supporting simultaneous character edits by thousands of concurrent users.', 'staff', 'hard', array['websockets', 'crdt', 'state'], 'Operational Transformation requires central sequencer; CRDTs converge peer-to-peer.', 'Tombstones, memory bloat, and causal consistency.', 'State-based vs operation-based CRDT trade-offs in distributed collaborative suites.', true),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'System Design', '[DEMO] Scalable Push Notification Delivery System', 'Design an infrastructure delivering 100M notifications per hour across mobile APNs and FCM gateways.', 'senior', 'medium', array['apns', 'fcm', 'kafka'], 'Device token fanout with partition workers.', 'Throttling and backpressure to avoid downstream device gateway 429s.', 'Partitioned consumer groups managing gateway socket connection pools.', true),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'System Design', '[DEMO] Video Transcoding & Adaptive Streaming Pipeline', 'Design an ingestion and transcoding pipeline converting raw uploads into multi-bitrate HLS segments.', 'senior', 'hard', array['s3', 'ffmpeg', 'cdn'], 'Chunk-based chunking with HLS/DASH manifest creation.', 'Asynchronous workers consuming SQS/Kafka jobs.', 'Distributed video chunk slicing and manifest stitching.', true),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'System Design', '[DEMO] Distributed Web Crawler with Politeness Policy', 'Architect a distributed web crawler processing 1B pages monthly while respecting robots.txt per host.', 'mid', 'medium', array['dns', 'bloom-filter', 'crawler'], 'Use Bloom filters for visited URL deduplication.', 'Queueing per host domain to honor robots.txt rate limits.', 'Two-tier frontier queuing separating domain politeness from overall throughput.', true),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'System Design', '[DEMO] Financial Ledger with Exactly-Once Processing', 'Design a double-entry accounting ledger system guaranteeing zero double-spending under network partitions.', 'staff', 'hard', array['postgres', 'idempotency', 'ledger'], 'Idempotency keys and transactional outbox pattern.', 'Double-entry bookkeeping validation constraints.', 'Strict double-entry invariants with database unique idempotency indexes.', true),
  ('a0000000-0000-0000-0000-000000000007'::uuid, 'System Design', '[DEMO] API Gateway with Dynamic Plugin Architecture', 'Design an API Gateway routing traffic with hot-reloadable authentication and transformation plugins.', 'senior', 'medium', array['envoy', 'wasm', 'gateway'], 'Separation of control plane and data plane.', 'WASM modules for safe sandbox extension execution.', 'Envoy filter chains with out-of-process gRPC authorization sidecars.', true),
  ('a0000000-0000-0000-0000-000000000008'::uuid, 'System Design', '[DEMO] Geo-Distributed Metrics Observability Platform', 'Design a multi-region time-series ingestion and query platform handling 50M metric samples per second.', 'staff', 'hard', array['tsdb', 'prometheus', 'observability'], 'Time-series compaction and rollup tiers.', 'Distributed query fanout and pushdown aggregations.', 'Multi-tier storage with Gorilla delta-of-delta compression and long-term object storage rollups.', true),
  ('a0000000-0000-0000-0000-000000000009'::uuid, 'System Design', '[DEMO] High-Throughput URL Shortener', 'Design a URL shortener processing 100k writes/sec and 2M reads/sec with custom slug reservation.', 'junior', 'easy', array['base62', 'cache', 'keygen'], 'Base62 encoding with pre-generated range tokens.', 'Cache hot redirects with Redis and write-through DB.', 'Pre-allocated key generator instances eliminate range collisions.', true),
  ('a0000000-0000-0000-0000-000000000010'::uuid, 'System Design', '[DEMO] Proximity Service (Nearby Places / Geo-Search)', 'Design a geolocation query service returning places of interest within 5km radius with dynamic spatial updates.', 'senior', 'medium', array['geohash', 'quadtree', 'gis'], 'Geohash vs Quadtree vs Uber H3 hexagonal indexing.', 'Spatial indexing and boundary edge queries.', 'Quadtree memory indices coupled with GeoHash prefix caching.', true),

  -- 11-20: Frontend & Architecture
  ('a0000000-0000-0000-0000-000000000011'::uuid, 'React / Frontend', '[DEMO] Fiber Reconciliation & Concurrent Rendering', 'Explain the internal architecture of React Fiber, time-slicing work units, and interruption mechanics.', 'senior', 'medium', array['react', 'dom', 'scheduling'], 'Think about cooperative multitasking and message loops.', 'requestIdleCallback and time-slicing prioritization.', 'Fiber units of work enable pausing, resuming, and prioritizing work units without blocking.', true),
  ('a0000000-0000-0000-0000-000000000012'::uuid, 'React / Frontend', '[DEMO] Virtualized Windowing List with Dynamic Heights', 'Design a zero-dependency DOM virtualizer rendering 100,000 variable-height rows at 60fps.', 'staff', 'hard', array['dom', 'virtualization', 'scroll'], 'Calculate visible slice based on scrollTop and itemHeight.', 'Dynamic row heights with ResizeObserver and binary search cache.', 'Windowing decouples total dataset length from rendered DOM node count.', true),
  ('a0000000-0000-0000-0000-000000000013'::uuid, 'React / Frontend', '[DEMO] Micro-Frontend Orchestration & State Isolation', 'Architect a micro-frontend shell hosting independently deployed apps with shared token authentication.', 'senior', 'medium', array['module-federation', 'custom-events'], 'Webpack Module Federation vs iframes.', 'Shared dependency singletons and version mismatches.', 'Runtime dynamic container remotes with version negotiation.', true),
  ('a0000000-0000-0000-0000-000000000014'::uuid, 'React / Frontend', '[DEMO] Optimizing INP (Interaction to Next Paint)', 'Diagnose and remediate long input delays exceeding 200ms in complex interactive data tables.', 'senior', 'hard', array['web-vitals', 'main-thread', 'raf'], 'Break long tasks into yields using scheduler.yield() or setTimeout.', 'Debounce vs throttle vs transition hooks.', 'Yielding to main thread between user input dispatch and DOM paint commit.', true),
  ('a0000000-0000-0000-0000-000000000015'::uuid, 'React / Frontend', '[DEMO] React Server Components vs Client Boundaries', 'Describe serialization protocol, RSC payloads, and trade-offs of server-only modules.', 'mid', 'medium', array['nextjs', 'ssr', 'bundling'], 'Zero client bundle footprint for server-only dependencies.', 'Serialization boundaries across JSON payload stream.', 'RSC streams serialized component trees without shipping node_modules runtime code to client.', true),
  ('a0000000-0000-0000-0000-000000000016'::uuid, 'React / Frontend', '[DEMO] Deep Equality vs Reference Checks in Memoization', 'Explain JavaScript reference identity in hooks dependencies and costs of over-memoization.', 'junior', 'easy', array['usememo', 'usecallback', 'gc'], 'Object.is comparison in dependencies array.', 'Over-memoization costs vs re-render penalties.', 'Garbage collection pressure and closure overhead vs re-evaluation cycles.', true),
  ('a0000000-0000-0000-0000-000000000017'::uuid, 'React / Frontend', '[DEMO] Offline-First Sync Engine with IndexedDB', 'Design an offline persistence client that queues mutations and merges server deltas upon reconnect.', 'staff', 'hard', array['serviceworker', 'indexeddb', 'sync'], 'Mutation queues with monotonic local IDs.', 'Optimistic UI rollback and conflict resolution policies.', 'Append-only mutation journal synced with server during online events.', true),
  ('a0000000-0000-0000-0000-000000000018'::uuid, 'React / Frontend', '[DEMO] Web Worker Audio Analyser Pipeline', 'Implement continuous FFT frequency data extraction in a DedicatedWorker without main-thread jank.', 'senior', 'medium', array['web-audio', 'workers', 'fft'], 'AudioWorklet vs Web Workers for real-time DSP.', 'SharedArrayBuffer and Atomics vs postMessage.', 'AudioWorklet processor feeds ring buffer read by UI visualizer.', true),
  ('a0000000-0000-0000-0000-000000000019'::uuid, 'React / Frontend', '[DEMO] State Machines in Complex Interview Navigation', 'Model an interview session flow using a hierarchical state machine with recovery states.', 'mid', 'medium', array['xstate', 'state-machine', 'reducer'], 'Discriminated union events with exhaustive matchers.', 'Deterministic state transitions prevent illegal screen jumps.', 'Typed state machine guards against network drops and out-of-order events.', true),
  ('a0000000-0000-0000-0000-000000000020'::uuid, 'React / Frontend', '[DEMO] Accessible Modal Dialog and Focus Trapping', 'Implement a fully accessible WCAG AA modal component with keyboard trapping and aria attributes.', 'junior', 'easy', array['a11y', 'dialog', 'aria'], 'Save activeElement before opening; restore focus on close.', 'Trap Tab key within first and last focusable elements.', 'ARIA modal attribute, role="dialog", and Esc key listener.', true),

  -- 21-30: Behavioral & Leadership
  ('a0000000-0000-0000-0000-000000000021'::uuid, 'Behavioral', '[DEMO] Resolving Architectural Disagreements with Principals', 'Describe a situation where you had a sharp technical disagreement with a higher-level engineer.', 'staff', 'hard', array['conflict', 'staff-plus', 'influence'], 'Focus on empirical data and prototyping rather than seniority.', 'Demonstrate Disagree and Commit with clear success criteria.', 'Frame disagreements around measurable user impact and rollback milestones.', true),
  ('a0000000-0000-0000-0000-000000000022'::uuid, 'Behavioral', '[DEMO] Navigating Unrealistic Executive Deadlines', 'How do you negotiate scope when executives mandate a launch date that threatens quality?', 'senior', 'medium', array['expectations', 'trade-offs', 'scope'], 'Never just say no; present scoped trade-offs with risk assessments.', 'Demonstrate phased delivery with an MVP cutline.', 'Communicate feature-scope vs ship-date trade-off matrices clearly.', true),
  ('a0000000-0000-0000-0000-000000000023'::uuid, 'Behavioral', '[DEMO] Leading a High-Severity Outage & Blameless Postmortem', 'Walk through your command during a SEV-1 production failure affecting customer transactions.', 'senior', 'hard', array['sev-1', 'incident', 'culture'], 'Separate incident commander from technical mitigators.', 'Focus postmortem on systemic process gaps, not human blame.', 'Structured communications cadences and preventative automated action items.', true),
  ('a0000000-0000-0000-0000-000000000024'::uuid, 'Behavioral', '[DEMO] Mentoring an Underperforming Colleague', 'How do you diagnose performance issues and establish actionable growth milestones in 1-on-1s?', 'mid', 'medium', array['management', 'feedback', 'coaching'], 'Clarify expectations with measurable 30-day goals.', 'Identify skill gaps vs motivation/burnout factors.', 'Root cause analysis separating technical blockers from psychological safety.', true),
  ('a0000000-0000-0000-0000-000000000025'::uuid, 'Behavioral', '[DEMO] Sunsetting a Beloved Legacy System', 'How do you convince internal users to migrate off an established service with minimal friction?', 'senior', 'hard', array['migration', 'change-management'], 'Communicate migration timeline and direct migration tooling.', 'Create empathy bridges with affected power users.', 'Provide migration automation scripts and high-touch developer advocacy.', true),
  ('a0000000-0000-0000-0000-000000000026'::uuid, 'Behavioral', '[DEMO] Balancing Technical Debt with Feature Delivery', 'When product pressure is overwhelming, how do you safeguard code hygiene and refactoring budgets?', 'mid', 'medium', array['tech-debt', 'product-strategy'], 'Define technical debt budgets as a planned loan.', 'Schedule immediate payoff tickets in subsequent sprint.', 'Intentional technical debt tracked with explicit ROI payback schedules.', true),
  ('a0000000-0000-0000-0000-000000000027'::uuid, 'Behavioral', '[DEMO] Handling Major Organizational Re-Organization', 'Describe guiding your team through strategic shifts, leadership turnover, and restructured goals.', 'senior', 'hard', array['adaptability', 'morale', 'leadership'], 'Re-align team values to new strategic objectives.', 'Maintain high transparency during transitional ambiguity.', 'Protect engineering momentum and communicate strategic context continuously.', true),
  ('a0000000-0000-0000-0000-000000000028'::uuid, 'Behavioral', '[DEMO] Introducing Controversial Best Practices', 'How did you introduce automated integration testing or CI/CD gates to an unmotivated team?', 'junior', 'easy', array['evangelism', 'testing', 'quality'], 'Demonstrate personal pain relief with small pilot projects.', 'Show test metrics preventing weekend regression outages.', 'Incremental voluntary adoption wins hearts over top-down mandates.', true),
  ('a0000000-0000-0000-0000-000000000029'::uuid, 'Behavioral', '[DEMO] Managing Burnout and Toxic Team Dynamics', 'How do you restore psychological safety and constructive communication in a fractured team?', 'staff', 'hard', array['culture', 'retention', 'empathy'], 'Identify individual pain points through confidential active listening.', 'Establish explicit team working norms and boundaries.', 'Rebuild trust through transparent decision-making criteria.', true),
  ('a0000000-0000-0000-0000-000000000030'::uuid, 'Behavioral', '[DEMO] Prioritizing Feature Roadmaps Across Competing Stakeholders', 'How do you arbitrate conflicting priorities between Sales, Engineering, and Compliance?', 'senior', 'medium', array['prioritization', 'stakeholders', 'okrs'], 'Score features using RICE (Reach, Impact, Confidence, Effort).', 'Involve stakeholders in joint evaluation workshops.', 'Alignment against company-level quarterly OKR impact.', true),

  -- 31-40: DSA & Algorithms
  ('a0000000-0000-0000-0000-000000000031'::uuid, 'DSA', '[DEMO] LRU Cache with TTL Expiration', 'Design an in-memory cache supporting O(1) get/put operations and periodic expiration eviction.', 'senior', 'hard', array['hashmap', 'linked-list', 'heaps'], 'Pair a standard LRU doubly linked list with a min-heap for expiration timestamps.', 'Lazy eviction on get() vs background cleanup worker trade-offs.', 'Hash map lookup O(1) coupled with doubly linked list update O(1) and TTL min-heap.', true),
  ('a0000000-0000-0000-0000-000000000032'::uuid, 'DSA', '[DEMO] Trapping Rain Water in 2D and 3D Grids', 'Compute the total volume of water retained after rainfall across elevation elevation profiles.', 'senior', 'hard', array['two-pointers', 'min-heap', 'monotonic-stack'], 'Maintain leftMax and rightMax bounds using two pointers.', 'For 3D, push boundary cells into priority queue and expand inward.', 'Two-pointer inward traversal maintaining maximum water containment boundary.', true),
  ('a0000000-0000-0000-0000-000000000033'::uuid, 'DSA', '[DEMO] Lowest Common Ancestor in Binary Trees', 'Find the lowest common ancestor node of two given nodes in a tree structure.', 'mid', 'medium', array['trees', 'lca', 'recursion'], 'Treat node heights like linked list intersections.', 'Advance the deeper node until depths match.', 'Equalizing depth offsets before walking pointers upward simultaneously.', true),
  ('a0000000-0000-0000-0000-000000000034'::uuid, 'DSA', '[DEMO] Median of Two Sorted Arrays in O(log(min(m, n)))', 'Find the median element of two sorted arrays with sublinear time complexity.', 'staff', 'hard', array['binary-search', 'partitioning'], 'Binary search for partition point on smaller array.', 'Verify maxLeftX <= minRightY and maxLeftY <= minRightX.', 'Binary partition split maintaining equal left and right halves.', true),
  ('a0000000-0000-0000-0000-000000000035'::uuid, 'DSA', '[DEMO] Course Schedule & Cycle Detection in Directed Graphs', 'Determine if all courses can be completed given prerequisites and output topological ordering.', 'mid', 'medium', array['graph', 'kahn-algorithm', 'bfs'], 'Calculate in-degrees or use 3-color DFS visited states.', 'Zero in-degree nodes queue up sequentially.', 'Kahn algorithm using BFS queue of vertices with in-degree 0.', true),
  ('a0000000-0000-0000-0000-000000000036'::uuid, 'DSA', '[DEMO] Word Search II with Trie & Backtracking', 'Given an m x n board of characters and list of words, return all words present on board.', 'senior', 'hard', array['trie', 'backtracking', 'dfs'], 'Insert dictionary into Trie to prune recursive backtracking.', 'Remove leaf nodes dynamically upon finding matches to avoid duplicates.', 'Backtracking on 2D grid pruned by Trie node existence.', true),
  ('a0000000-0000-0000-0000-000000000037'::uuid, 'DSA', '[DEMO] Serialize and Deserialize N-ary Trees', 'Design an algorithm to encode and decode arbitrary N-ary hierarchical structures.', 'mid', 'medium', array['bfs', 'dfs', 'parsing'], 'Preorder traversal with child count markers.', 'Use delimiter tokens like # or brackets to denote tree levels.', 'Preorder traversal encoding child counts or sentinel end markers.', true),
  ('a0000000-0000-0000-0000-000000000038'::uuid, 'DSA', '[DEMO] Sliding Window Maximum in O(N)', 'Return the maximum element in every sliding window of size k using monotonic deques.', 'senior', 'hard', array['queue', 'sliding-window', 'deque'], 'Deque elements maintain decreasing order.', 'Pop indices out of range from the front.', 'Monotonic queue storing indices with strictly descending values.', true),
  ('a0000000-0000-0000-0000-000000000039'::uuid, 'DSA', '[DEMO] Merge K Sorted Linked Lists', 'Merge k sorted linked lists and return the unified sorted list with optimal complexity.', 'junior', 'easy', array['heap', 'linked-list', 'merge'], 'Insert head nodes into a min-heap of size k.', 'Extract min and advance pointer to next list node.', 'Priority queue guarantees O(N log k) total runtime.', true),
  ('a0000000-0000-0000-0000-000000000040'::uuid, 'DSA', '[DEMO] Longest Substring Without Repeating Characters', 'Find the length of the longest substring containing unique characters in a given string.', 'fresher', 'easy', array['sliding-window', 'hashmap', 'strings'], 'Expand right pointer; shrink left pointer when collision occurs.', 'Store last seen index of each character.', 'Two pointers sliding window tracks maximum window length.', true),

  -- 41-50: Databases & Storage Internals
  ('a0000000-0000-0000-0000-000000000041'::uuid, 'Database', '[DEMO] B-Tree vs LSM-Tree Engines in Write-Heavy Systems', 'Compare random page writes vs sequential append log commits across database storage engines.', 'senior', 'medium', array['postgresql', 'cassandra', 'io'], 'Sequential I/O vs random page updates.', 'Write amplification vs read compaction overhead.', 'LSM append-only write path converts random writes to sequential I/O with background SSTable compaction.', true),
  ('a0000000-0000-0000-0000-000000000042'::uuid, 'Database', '[DEMO] Postgres MVCC, Dead Tuples, and Vacuuming', 'Explain multiversion concurrency control, write amplification, and transaction ID wraparound in Postgres.', 'staff', 'hard', array['postgresql', 'wal', 'vacuum'], 'Dead tuples and visibility maps.', 'Frozen XIDs and aggressive autovacuum triggers.', 'Postgres writes new tuple versions on update; vacuum reclaims dead rows and prevents 32-bit transaction wraparound.', true),
  ('a0000000-0000-0000-0000-000000000043'::uuid, 'Database', '[DEMO] Designing Sharding Keys for Multi-Tenant Databases', 'Architect horizontal database sharding keys that prevent hot spots and cross-shard transactions.', 'staff', 'hard', array['sharding', 'hashing', 'citus'], 'Consistent hashing to avoid resharding storms.', 'Hot spot prevention on tenant ID vs time-series shards.', 'Composite shard keys balancing co-location of tenant queries with horizontal load balancing.', true),
  ('a0000000-0000-0000-0000-000000000044'::uuid, 'Database', '[DEMO] Transaction Isolation Anomalies: Dirty to Phantom Reads', 'Walk through ANSI SQL isolation levels and how Snapshot Isolation avoids locking read paths.', 'senior', 'medium', array['acid', 'transactions', 'locks'], 'Read Committed vs Repeatable Read vs Serializable.', 'Snapshot isolation vs Serializable Snapshot Isolation (SSI).', 'SSI tracks read-write dependencies at runtime to abort dangerous cycles without pessimistic two-phase locking.', true),
  ('a0000000-0000-0000-0000-000000000045'::uuid, 'Database', '[DEMO] Write-Ahead Logging (WAL) and Crash Recovery', 'How do databases ensure ACID durability across power loss using WAL flush checkpoints?', 'mid', 'medium', array['wal', 'durability', 'storage'], 'Fsync disk flush boundaries and group commit.', 'ARIES recovery algorithm: Analysis, Redo, Undo.', 'Sequential WAL append with checkpoint dirty page flushing.', true),
  ('a0000000-0000-0000-0000-000000000046'::uuid, 'Database', '[DEMO] Indexing Strategies: B-Tree, Hash, GIN, and GiST', 'When should a data engineer select GIN or GiST indexes over traditional B-Tree structures?', 'junior', 'easy', array['indexes', 'gin', 'btree'], 'B-Tree handles equality and ranges; GIN handles composite elements.', 'GIN index maps individual array/jsonb items to row pointers.', 'GIN enables inverted indexing for arrays, JSONB, and full-text search.', true),
  ('a0000000-0000-0000-0000-000000000047'::uuid, 'Database', '[DEMO] Database Replication: Synchronous vs Semi-Sync vs Async', 'Analyze replication lag, failover split-brain hazards, and read-replica stale data trade-offs.', 'senior', 'medium', array['replication', 'ha', 'consensus'], 'Raft/Paxos consensus vs streaming replication.', 'Read-your-own-writes consistency models.', 'Routing sticky user writes to primary while serving delayed reads from read replicas.', true),
  ('a0000000-0000-0000-0000-000000000048'::uuid, 'Database', '[DEMO] Optimistic vs Pessimistic Concurrency Controls', 'Compare SELECT FOR UPDATE row locks vs version/timestamp checking in high-contention checkouts.', 'junior', 'easy', array['locking', 'concurrency', 'transactions'], 'Pessimistic locks acquire lock upfront; optimistic checks version at commit.', 'High collision rate degrades optimistic retry loops.', 'Optimistic locking minimizes lock wait duration when collision probability is low.', true),
  ('a0000000-0000-0000-0000-000000000049'::uuid, 'Database', '[DEMO] Connection Pooling Mechanics and Thundering Herds', 'Why do direct database connections exhaust memory under traffic spikes, and how does PgBouncer help?', 'mid', 'medium', array['pgbouncer', 'connection-pooling', 'postgres'], 'Process-per-connection overhead in Postgres.', 'Session pooling vs transaction pooling modes.', 'Transaction pooling multiplexes thousands of client connections onto a small worker pool.', true),
  ('a0000000-0000-0000-0000-000000000050'::uuid, 'Database', '[DEMO] Zero-Downtime Schema Migrations (Expand/Contract)', 'Safely rename a high-traffic column without acquiring exclusive table locks or dropping user queries.', 'senior', 'medium', array['migrations', 'blue-green', 'zero-downtime'], 'Expand phase: add new column, trigger dual write.', 'Backfill historical data in chunked background transactions.', 'Contract phase: switch reads, deprecate old column, drop safely.', true),

  -- 51-60: Concurrency, Architecture & Cloud
  ('a0000000-0000-0000-0000-000000000051'::uuid, 'Concurrency', '[DEMO] Lock-Free MPMC Queue with CAS Primitives', 'Design a thread-safe multi-producer multi-consumer queue using atomic compare-and-swap instructions.', 'staff', 'hard', array['cas', 'atomics', 'lock-free'], 'Michael-Scott queue with paired CAS head and tail updates.', 'Tagged pointers or hazard pointers to eliminate the ABA hazard.', 'Atomic compare-and-swap with monotonic sequence tags preventing ABA race conditions.', true),
  ('a0000000-0000-0000-0000-000000000052'::uuid, 'Concurrency', '[DEMO] Distributed Deadlock Detection & Prevention', 'How do distributed lock managers detect cyclic wait dependencies across microservice boundaries?', 'staff', 'hard', array['deadlock', 'chandy-misra', 'distributed-systems'], 'Wait-for graphs and distributed cycle detection.', 'Wait-Die vs Wound-Wait timestamp ordering.', 'Wound-Wait preemption scheme based on transaction initiation timestamps.', true),
  ('a0000000-0000-0000-0000-000000000053'::uuid, 'Concurrency', '[DEMO] Priority Inversion, Starvation, and Livelock', 'Explain how lower priority threads can block critical real-time threads and how priority inheritance fixes it.', 'senior', 'hard', array['rtos', 'locks', 'priority-inversion'], 'Priority inheritance protocol to prevent priority inversion.', 'Exponential randomized backoff to break livelock cycles.', 'Priority inheritance boosts lower priority thread holding mutex needed by higher priority thread.', true),
  ('a0000000-0000-0000-0000-000000000054'::uuid, 'Concurrency', '[DEMO] Actor Model vs Communicating Sequential Processes (CSP)', 'Compare Erlang/Akka mailboxes with Go channels regarding shared memory and message passing.', 'mid', 'medium', array['actor-model', 'csp', 'golang'], 'Actors have addressed identities and mailboxes; CSP uses anonymous channels.', 'Backpressure handling across bounded channel buffers.', 'CSP synchronizes over channels; Actors encapsulate state behind asynchronous addressable queues.', true),
  ('a0000000-0000-0000-0000-000000000055'::uuid, 'Concurrency', '[DEMO] Memory Barriers, Volatile Keywords, and CPU Caches', 'Explain hardware store buffers, cache coherence (MESI), and out-of-order execution in multi-core CPUs.', 'staff', 'hard', array['cpu-caches', 'memory-barriers', 'mesi'], 'Hardware store buffers and memory visibility delays.', 'Acquire and Release memory semantics.', 'Memory fences prevent processor compiler and CPU reordering across thread boundaries.', true),
  ('a0000000-0000-0000-0000-000000000056'::uuid, 'Architecture', '[DEMO] Distributed Sagas: Orchestration vs Choreography', 'Compare central orchestrators against reactive event-driven sagas with compensating transactions.', 'senior', 'hard', array['saga', 'kafka', 'microservices'], 'Compensating transactions when a downstream microservice fails.', 'Central workflow orchestrator vs decentralized event subscriptions.', 'Orchestration provides centralized visibility; choreography reduces single orchestrator bottleneck.', true),
  ('a0000000-0000-0000-0000-000000000057'::uuid, 'Architecture', '[DEMO] Multi-Region Active-Active Replication Invariants', 'How do you prevent data divergence when two independent cloud regions mutate the same record simultaneously?', 'staff', 'hard', array['active-active', 'crdt', 'multi-region'], 'Conflict resolution across active-active database replicas (LWW vs CRDT).', 'Latency-based Anycast routing and regional circuit breakers.', 'Regional independence with asynchronous conflict-free data replication and global traffic routing.', true),
  ('a0000000-0000-0000-0000-000000000058'::uuid, 'Architecture', '[DEMO] Event Sourcing & CQRS (Command Query Responsibility)', 'When is event sourcing superior to mutable relational state, and how do projection workers handle lag?', 'senior', 'medium', array['cqrs', 'event-sourcing', 'kafka'], 'Append-only event log as the source of truth.', 'Eventual consistency on read projections.', 'Command side handles business invariants; query side rebuilds specialized read views.', true),
  ('a0000000-0000-0000-0000-000000000059'::uuid, 'Architecture', '[DEMO] Resilient Circuit Breakers & Fallback Cascades', 'Design client-side circuit breakers with half-open probing to prevent catastrophic cascading failures.', 'mid', 'medium', array['resilience', 'circuit-breaker', 'reliability'], 'Closed, Open, and Half-Open state transitions.', 'Sliding error window rate thresholds and timeout backoffs.', 'Circuit breakers fail fast immediately to allow struggling downstream dependencies to recover.', true),
  ('a0000000-0000-0000-0000-000000000060'::uuid, 'Architecture', '[DEMO] Zero-Trust Service-to-Service mTLS Mesh', 'How do sidecars handle mutual TLS identity verification, short-lived certificates, and SPIFFE IDs?', 'staff', 'hard', array['spiffe', 'mtls', 'envoy'], 'X.509 certificate rotation without connection termination.', 'Cryptographic identity attestation per service workload.', 'mTLS sidecars terminate TLS and validate SAN SPIFFE identities automatically.', true)
on conflict (id) do update set
  topic = excluded.topic,
  title = excluded.title,
  body = excluded.body,
  level = excluded.level,
  difficulty = excluded.difficulty,
  tags = excluded.tags,
  hint1 = excluded.hint1,
  hint2 = excluded.hint2,
  explanation = excluded.explanation,
  is_demo = excluded.is_demo;
