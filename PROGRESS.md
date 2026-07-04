# Interview OS — Progress and Handoff

Last updated: 2026-07-04 on branch `codex-stabilize` (Batches 9 and 10 complete; 174 problems, 47 real lessons).

## Current platform

Interview OS is a local-first Next.js 15 study platform using React 19, TypeScript, Tailwind CSS 4, Prisma 6, SQLite, Zod, Monaco, and the existing shadcn/Base UI components.

Working routes now include:

- `/dashboard`
- `/paths`
- `/paths/[slug]`
- `/modules`
- `/modules/[slug]`
- `/paths/[slug]/modules/[moduleSlug]` (compatibility redirect)
- `/lessons/[slug]`
- `/problems` and `/problems/[id]`
- `/practice`
- `/ai-usage`
- local submission/save/run/export/import API routes

Existing coding submissions, Python/JavaScript/TypeScript local judging, written-answer storage, and Codex review export/import remain intact.

## Modular curriculum scaffold

### Data model

- `LearningPath`: stable ID, slug, description, target roles, difficulty, estimated hours, ordering, and publication status.
- `LearningModule`: first-class global topic with a unique slug, category, difficulty, prerequisites by module slug, outcomes, sources, publication status, and explicit placeholder status.
- `LearningPathModule`: reusable many-to-many path membership with path-specific order, required/optional status, and a progression label.
- `Lesson`: type, difficulty, duration, Markdown, takeaways, examples, linked problem IDs, public sources, order, and explicit placeholder status.
- `Problem`: optional JSON path/global-module/lesson IDs plus `warmup | core | challenge | advanced` confidence level.

Paths are curated collections rather than ownership boundaries. A module may be shared by Backend, Infrastructure, Quant, or System Design paths, and every published module remains directly accessible through `/modules/[slug]`.

No user/enrollment model was added. Progress is currently derived from solved attempts and passed/reviewed submissions against problems linked to a path. This preserves the existing single-user local architecture and leaves lesson-completion persistence for a later focused slice.

### Seeded structure

Six published paths are available:

1. DSA Confidence Builder
2. Backend SWE Path
3. Infrastructure SWE Path
4. System Design Path
5. Quant Dev Path
6. AI-Efficient Engineer Path

Together they contain:

- 79 standalone modules across DSA, Docker, Kubernetes, operating systems, networking, C++, Python, databases, caching, backend/system design, quant development, and AI usage;
- 63 ordered path memberships, including modules reused across multiple paths;
- 193 lesson records;
- 35 real mini-lessons;
- 158 explicit placeholder lesson briefs.

The 2026-07-04 DSA batch extended the DSA Confidence Builder to 16 ordered modules covering the full roadmap topic list (arrays/hashing through math/geometry), added four real lessons (binary-search invariants, search-on-answers, linked-list pointer discipline, slow/fast pointers), and mapped twelve previously orphaned problems into modules.

This pass added six requested ready module topics while preserving the previous useful instructionals:

1. Docker Image Layers and Why They Matter
2. Kubernetes Pods vs Deployments vs Services
3. Processes vs Threads
4. Page Tables and Virtual Memory
5. C++ RAII in Interviews
6. TCP vs UDP for Backend and Quant Dev

Placeholder lessons are not disguised as complete content. The UI labels them **Content scaffold**, and each brief tells the next content agent what instructional, example, progression links, and review checklist to add.

### Guided and direct-access UX

- `/paths` shows role, level, estimated hours, ready-lesson count, linked problems, and derived progress.
- Path pages show reusable module cards in curated order; every card links to the standalone module page.
- `/modules` provides search and filters for category, difficulty, target role, estimated time, and ready/scaffold content.
- Standalone module pages show prerequisites, outcomes, ordered lessons, confidence-grouped problems, paths that reuse the module, related modules, sources, and an interview-cram checklist.
- Lesson pages render Markdown, takeaways, examples, sources, previous/next navigation, linked practice, and a clear placeholder warning.
- Dashboard includes Continue Learning, a Browse Modules entry point, and quick interview-cram cards for Kubernetes, Docker, threading, C++, databases, system design, quant, and AI usage.
- The problem bank uses a calm single-column result list. Search, format, and difficulty stay visible while less-common filters are grouped under **More filters**.
- Problem detail pages use a responsive split workspace: statement, constraints, and hints remain visible in a sticky left pane while the Monaco editor or written-answer workspace occupies the right pane. Review material is collapsed until needed.
- Practice includes Practice by Path, Practice by Module, and the dedicated Confidence Builder progression.

## Confidence-building problems

The bank now contains 143 validated problems: 80 originals, 12 easy warmups, 9 binary-search/linked-list problems, 9 written database problems, 8 written concurrency problems, 9 runnable dynamic-programming problems, 8 written networking problems, and 8 system-design scenarios — the last six batches added 2026-07-04, each with a warmup → core → challenge → applied mix. From the networking batch onward, every problem statement embeds a concrete example artifact (traces, tool output, sample exchanges, incident reports).

- Four runnable DSA warmups: pair sum, unique sliding window, balanced brackets, and graph reachability.
- Two debugging warmups: boolean environment parsing and missing `await`.
- Two optimization warmups: set membership and HTTP client reuse.
- Two database warmups: composite index selection and uniqueness races.
- Two AI-usage warmups: debugging prompt structure and hallucinated configuration verification.

The four DSA warmups, the nine binary-search/linked-list problems, and the nine dynamic-programming problems support Python, JavaScript, and TypeScript with public and hidden tests. Combined with the existing eight runnable overlays, 30 coding problems now support local function-call judging.

Existing higher-level problems receive learning metadata through `prisma/seed-data/learning-overrides.ts`; their authored problem content was not overwritten.

## Seed integrity

`npm run validate:seed` now checks:

- all existing problem schema, provenance, duplicate-slug, placeholder, and runnable-test rules;
- standalone module, path-membership, and lesson schemas with stable unique IDs;
- unique ordering and module membership inside each path;
- prerequisite module slugs and path references;
- either zero placeholders for a completed module or two to three for an incomplete module;
- preservation of at least the eight foundational real mini-lessons;
- linked lesson problem slugs;
- every problem path/module/lesson ID reference.

`prisma/seed.ts` upserts problems first, rebuilds only the curated path/module membership scaffold, resolves lesson problem slugs to database IDs, and upserts lessons. Existing submissions were preserved through the schema change.

## Validation status

The following pass:

```bash
npx prisma generate
npx prisma db push
npm run validate:seed
npm run seed
npm run lint
npm run typecheck
npm test
npm run build
```

Runtime smoke tests covered every published path, all 79 published modules, all 183 lessons, all 118 problems, filtered bank views, dashboard, practice, and AI usage. Every content route returned HTTP 200; `/` correctly redirects to the dashboard. The local-runner suite passed on rerun after one load-related Python startup timeout at the exact three-second boundary.

## Known limitations

- Lesson completion and active-path enrollment are derived rather than explicitly stored.
- Most modules intentionally contain only placeholder lesson briefs.
- Many new standalone modules have no linked problem progression yet; confidence-level slots make this content gap explicit.
- Module target-role filtering is derived from the published paths that include a module; standalone-only role metadata is not modeled yet.
- The runner remains unsafe for public/untrusted execution. See `README.md` before changing it.
- Only function-call judging exists; stdin/stdout and custom harness types remain reserved.
- Mock interviews, resources, and admin tooling remain future features; their dead sidebar links were removed so the visible navigation contains only working pages.
- Prisma still emits the existing `package.json#prisma` deprecation warning.

## Curriculum coverage plan (2026-07-04)

This plan was produced by auditing every module against the current 92-problem bank, the 13 ready lessons, and the problem→module links in `prisma/seed-data/learning-overrides.ts` plus the direct metadata in `prisma/seed-data/starter-confidence.ts`. All validation (`validate:seed`, lint, typecheck, tests, build) passed on the audited state.

### How to read the tables

- **Level** is the intended learner level (module `difficulty`).
- **Lessons** counts ready (non-placeholder) lessons over total. Every incomplete module carries the same scaffold sequence — *Foundations* (concept) → *Applied Checkpoint* (walkthrough) — so the lesson-sequence column lists only ready lessons; the target sequence for every module is: concept lesson → worked example/walkthrough → optional interview checkpoint.
- **W/C/Ch/A** counts problems currently linked at each confidence level (warmup/core/challenge/advanced). A problem shared by two modules is counted in both. `→` marks *unlinked candidates*: existing problems that fit the module but lack `learning-overrides` metadata — linking them is a zero-content-risk win.
- **Missing** lists the empty problem tiers after counting candidates.
- **Formats** lists interview formats currently exercised by linked problems (coding = runnable function-call).
- **Sources** lists research still needed before authoring lessons (primary/public material only; problems themselves stay original).

### Global gaps (highest leverage first)

1. ~~40 authored problems with no module/path metadata~~ — **28 mapped across Batches 1–3**; remaining orphans are mostly read-code language problems (Python/Go/Java/JS/React), queues-workers candidates, and quant specs. Mapping them stays the cheapest coverage win (remaining candidates are marked `→` below).
2. ~~Zero `system_design`-type problems~~ — **done 2026-07-04**; the first eight open-ended scenario problems (no code harness) landed with the system-design batch, covering requirement clarification, capacity estimation, two full design scenarios, and API-contract design.
3. ~~10 missing DSA module scaffolds~~ — **done 2026-07-04**; all 18 roadmap families now have modules in the 16-module path.
4. ~~`dynamic-programming-basics` empty~~ — **done 2026-07-04**; both DP modules now carry full lesson + warmup→applied ladders with runnable tests.
5. **48 of 79 modules still have only scaffold lessons.** Docker/K8s, C++, Python, quant, and the remaining OS/networking modules are lesson-free.
6. ~~No `os_networking_concurrency`-type problems~~ — the first six landed with the concurrency batch; OS/networking modules should continue this format mix.

### DSA Confidence Builder (priority 1)

All 16 roadmap modules are now scaffolded and ordered in the path: arrays → sliding window/prefix sums → binary search → linked lists → stacks/queues/heaps → trees/graphs → tries → backtracking → greedy → intervals → 1-D DP → 2-D DP → advanced graphs → bit manipulation → math/geometry → DSA-to-real-systems. The 2026-07-04 batch fully developed binary-search and linked-lists and applied all orphan-problem mappings.

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| arrays-hashmaps-two-pointers | beginner | — | Two Sum as a Hashmap Pattern | 3/0/0/0 (→ quadratic-settlement-matcher C) | core, challenge, advanced | coding, optimization | none (covered) |
| sliding-window-prefix-sums | beginner | arrays | Sliding Window: When It Applies | 1/1/0/0 | challenge, advanced; prefix sums entirely untaught | coding | prefix-sum references (CLRS/uni notes) |
| binary-search | beginner | arrays | Invariant Game; Searching the Answer Space | 2/2/0/1 | challenge | coding (all runnable) | none (covered) |
| linked-lists | beginner | — | Pointer Discipline; Slow/Fast Pointers | 2/1/1/0 | advanced | coding (all runnable) | none (covered) |
| stacks-queues-heaps | intermediate | arrays | — | 1/3/1/0 | concept lesson, advanced | coding, optimization | heap/deque references |
| trees-graphs | intermediate | stacks-queues-heaps | — | 1/2/0/0 | concept lesson, challenge, advanced | coding | BST/traversal/union-find references |
| tries | intermediate | trees-graphs | — | 0/1/0/0 | lessons, warmup, challenge, advanced | coding | trie references |
| backtracking | intermediate | trees-graphs | — | 0/0/0/0 | all | — | pruning/state-space references |
| greedy | intermediate | arrays | — | 0/0/0/0 | all | — | exchange-argument references |
| intervals | intermediate | greedy | — | 1/0/0/0 | lessons, core, challenge, advanced | coding | sweep-line references |
| dynamic-programming-basics | intermediate | arrays | State & Recurrence; 1-D Walkthrough | 2/2/0/1 | challenge | coding (all runnable) | none (covered) |
| dp-grids-strings | advanced | dp-basics | Grid Tables; String Alignment | 2/1/1/1 | — (full ladder) | coding (all runnable) | none (covered) |
| advanced-graphs | advanced | trees-graphs | — | 0/0/1/0 | lessons, warmup, core, advanced | coding | Dijkstra/topo-sort/MST references |
| bit-manipulation | intermediate | arrays | — | 0/0/0/1 | lessons, warmup, core, challenge | coding | two's-complement/mask references |
| math-geometry | intermediate | arrays | — | 0/0/0/0 | all | — | modular arithmetic/geometry basics |
| dsa-to-real-systems | advanced | trees-graphs, dp-basics | — | 0/4/0/1 | lessons, warmup, challenge | coding | none (applied original) |

### Backend SWE (priority 2)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| http-request-lifecycle | beginner | tcp-vs-udp | How an HTTP Request Travels (concept); Tracing One POST Through Nginx (walkthrough) | 2/2/1/0 | advanced | debugging, optimization, read-code | RFC 9110–9112 (cited) |
| apis-requirements | beginner | http-request-lifecycle | API Contracts; Designing One Endpoint Well | 2/1/0/1 | challenge | system_design scenarios | none (covered) |
| sql-indexes | beginner | — | B-Tree Mental Model; Reading EXPLAIN | 2/2/1/0 | advanced | databases, optimization | none (covered) |
| composite-indexes | intermediate | sql-indexes | Composite Indexes and Query Shape | 2/0/1/0 | core, advanced | databases, optimization | PostgreSQL multicolumn-index docs (cited) |
| transactions-isolation | intermediate | — | Isolation Levels & Anomalies; Lost Update Walkthrough | 2/3/1/2 | — (full ladder) | databases, read-code | none (covered) |
| redis-caching | beginner | — | — | 0/1/1/0 | lessons, warmup, advanced | debugging, read-code | redis.io docs |
| caching-strategies | intermediate | redis-caching | Cache Warming and Cache Stampedes | 0/0/1/0 | warmup, core, advanced | optimization | none (covered) |
| queues-workers | intermediate | — | The Queue-Worker Contract (concept); Designing a Job Queue That Survives Restarts (walkthrough) | 2/3/3/0 | advanced | debugging, write-code, optimization, read-code | SQS/Kafka docs (cited) |
| rate-limiting | intermediate | apis-requirements | What a Rate Limiter Actually Does | 0/1/1/0 | warmup, advanced | write-code, coding | none (covered) |
| observability | intermediate | — | — | 1/0/0/0 | lessons, core, challenge, advanced | optimization | Google SRE book, OpenTelemetry docs |
| reliability-backpressure | advanced | queues-workers, observability | — | 0/1/0/0 (→ retry-backoff-wrapper-spec C, unbounded-queue-oom Ch, lease-clock-skew-split-brain A) | lessons, warmup | coding, write-code | SRE book overload chapters |

### Operating systems, concurrency, and networking (priority 3)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| processes-vs-threads | beginner | — | Processes vs Threads | 0/0/0/0 | all problems | — | OSTEP ch. 4–6/26, man7 (cited) |
| virtual-memory-page-tables | intermediate | processes-vs-threads | Page Tables and Virtual Memory | 0/0/0/0 | all problems | — | OSTEP VM chapters (cited) |
| scheduling-context-switching | intermediate | processes-vs-threads | — | 0/0/0/0 | all | — | OSTEP scheduling chapters |
| filesystems-file-descriptors | intermediate | processes-vs-threads | — | 0/0/0/0 | all | — | OSTEP files chapters, man7 open/dup |
| threading-synchronization | intermediate | processes-vs-threads | Data Races & Critical Sections; Lost Increment | 3/2/0/1 | challenge | os/concurrency, debugging, optimization | none (covered) |
| mutexes-semaphores-condition-variables | intermediate | threading-synchronization | Synchronization Toolbox; Bounded Buffer | 2/1/1/1 | — (full ladder) | os/concurrency, debugging | none (covered) |
| deadlocks-starvation | advanced | mutexes-… | — | 0/0/0/0 (→ account-transfer-deadlock-order C) | lessons, warmup, challenge, advanced | databases | OSTEP ch. 32 |
| tcp-vs-udp | beginner | — | TCP vs UDP Concept; Reliability Traced Packet by Packet | 2/2/1/0 | advanced | os/concurrency, debugging, quant-design | none (covered) |
| sockets-connection-lifecycle | intermediate | tcp-vs-udp | Lifecycle in Syscalls and States; Where Connections Leak | 2/2/0/1 | challenge | os/concurrency, debugging | none (covered) |
| dns-fundamentals | beginner | — | — | 0/0/0/0 | all | — | RFC 1034/1035 |
| tls-basics | intermediate | tcp-vs-udp | — | 0/0/0/0 | all | — | RFC 8446 |
| websockets-streaming | intermediate | http-request-lifecycle | — | 0/0/0/0 (→ reverse-proxy-buffers-event-stream C) | lessons, warmup, challenge, advanced | debugging | RFC 6455, WHATWG streams |
| load-balancing | intermediate | http-request-lifecycle | — | 0/0/0/0 | all | — | Envoy/NGINX public docs, SRE book |

### Databases beyond Backend path (priority 4)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| query-plans | intermediate | sql-indexes | — | 0/1/0/1 | lessons, warmup, challenge | optimization, databases | PostgreSQL EXPLAIN docs |
| n-plus-one-queries | beginner | — | — | 0/2/0/0 | lessons, warmup, challenge, advanced | optimization | ORM lazy-loading docs (Prisma/Hibernate public) |
| cursor-pagination | intermediate | sql-indexes | — | 0/3/0/0 | lessons, warmup, challenge, advanced | write-code, debugging, optimization | keyset-pagination references |
| database-deadlocks-idempotency | advanced | transactions-isolation | — | 0/2/2/0 | lessons, warmup, advanced | databases, write-code, debugging | PostgreSQL lock docs |

### C++ and Python (priority 5)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| raii-resource-ownership | beginner | — | C++ RAII in Interviews; Scope Exit Walkthrough | 2/1/1/0 | advanced | quant-debugging | cppreference (cited), Core Guidelines |
| move-semantics | intermediate | raii | Value Categories; noexcept Walkthrough | 2/1/1/0 | advanced | quant-debugging | cppreference move/value categories |
| references-pointers-lifetimes | intermediate | raii | — | 0/0/0/0 (→ cpp-dangling-view-config Ch, cpp-callback-vector-realloc Ch) | lessons, warmup, core, advanced | read-code, debugging | cppreference lifetime rules |
| stl-containers-iterators | intermediate | — | — | 0/0/0/0 | all | — | cppreference containers, iterator invalidation |
| unordered-map-hashing-collisions | intermediate | stl-containers | — | 0/0/0/0 | all | — | cppreference unordered_map |
| cpp-templates-basics | intermediate | — | — | 0/0/0/0 | all | — | cppreference templates |
| concurrency-in-cpp | advanced | threading-sync, raii | — | 0/0/0/0 | all | — | cppreference atomics/threads |
| python-mutability-identity | beginner | — | — | 0/0/0/0 (→ py-mutable-default-report W, py-identity-vs-equality-dedupe C, python-list-mutation-skips-orders C) | lessons, challenge, advanced | read-code | docs.python.org data model |
| python-generators-iterators | intermediate | — | — | 0/0/0/0 (→ py-generator-exhaustion-metrics W) | lessons, core, challenge, advanced | read-code | docs.python.org generators |
| python-decorators-closures | intermediate | — | — | 0/0/0/0 | all | — | docs.python.org functional docs |
| python-gil-concurrency | advanced | threading-sync | — | 0/0/0/0 | all | — | docs.python.org threading/GIL notes |
| python-hashing-equality | intermediate | — | — | 0/0/0/0 (→ python-hash-randomized-sharding C, java-hashset-mutable-key analog) | lessons, warmup, challenge | quant, read-code | docs.python.org __hash__ docs |
| python-memory-object-model | advanced | mutability-identity | — | 0/0/0/0 | all | — | docs.python.org memory model, CPython devguide |

### System design (priority 6)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| system-design-interview-framework | beginner | — | Structure an Answer; Webhook Delivery Walkthrough | 2/1/1/0 | advanced | system_design scenarios | none (covered) |
| apis-requirements | beginner | http-request-lifecycle | API Contracts; Designing One Endpoint Well | 2/1/0/1 | challenge | system_design scenarios | none (covered) |
| replication-sharding | advanced | transactions-isolation | — | 0/0/0/0 | all | — | database replication docs (PostgreSQL), DDIA-adjacent public material |

(`apis-requirements`, `rate-limiting`, `caching-strategies`, `queues-workers`, `observability`, `reliability-backpressure` are shared with Backend above.)

### Quant Dev (priority 7)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| market-data-feeds | intermediate | tcp-vs-udp | — | 0/1/0/0 (shares multicast-gap-recovery-design) | lessons, warmup, challenge, advanced | quant-design | public exchange feed specs (Nasdaq ITCH, CME MDP public pages) |
| order-books | intermediate | market-data-feeds | — | 0/0/1/0 (→ orderbook-level-aggregator-spec Ch, mini-matching-engine A, order-book-imbalance-window C) | lessons, warmup, core | write-code, coding | public matching-engine explainers |
| latency-cache-locality | advanced | raii | — | 0/0/0/0 | all | — | Agner Fog guides, public perf references |
| linux-for-quant-dev | intermediate | processes-vs-threads | — | 0/0/0/0 | all | — | man7, kernel docs |
| networking-for-quant-dev | advanced | tcp-vs-udp, sockets | — | 0/0/0/0 | all | — | kernel networking docs, public HFT engineering posts |
| concurrency-for-quant-dev | advanced | threading-sync | — | 0/0/0/1 | lessons, warmup, core, challenge | optimization | lock-free/memory-order public references |

### Docker and Kubernetes (priority 8)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| docker-fundamentals | beginner | — | Containers Mental Model; docker run Walkthrough | 2/2/1/0 | advanced | debugging, os/networking | docs.docker.com (cited), kernel namespaces docs |
| dockerfiles-image-layers | intermediate | docker-fundamentals | Docker Image Layers; Cache Optimization Walkthrough | 2/2/1/0 | advanced | optimization, write-code, debugging | docs.docker.com build cache (cited) |
| docker-compose | beginner | docker-fundamentals | — | 0/0/0/0 | all | — | compose docs |
| kubernetes-fundamentals | beginner | docker-fundamentals | Kubernetes Core Concepts: Desired-State Loop (concept); What Happens When kubectl apply Creates a Deployment (walkthrough) | 2/2/1/0 | advanced | read-code, debugging, write-code | kubernetes.io concepts/architecture (cited) |
| pods-deployments-services | beginner | k8s-fundamentals | Pods vs Deployments vs Services (concept); Tracing Traffic from Service to Pod (walkthrough) | 2/2/1/0 | advanced | read-code, write-code, debugging | kubernetes.io workloads/services (cited) |
| kubernetes-configmaps-secrets | intermediate | pods-deployments-services | — | 0/0/0/0 | all | — | kubernetes.io config docs |
| kubernetes-networking-ingress | advanced | pods…, tcp-vs-udp | — | 0/0/0/0 | all | — | kubernetes.io networking/ingress |
| kubernetes-scheduling-resource-limits | advanced | pods…, scheduling | — | 0/0/0/0 | all | — | kubernetes.io scheduler/resources |

### AI-efficient engineering (priority 9)

| Module | Level | Prereqs | Ready lessons | W/C/Ch/A | Missing | Formats | Sources |
|---|---|---|---|---|---|---|---|
| good-ai-usage-principles | beginner | — | — | 0/0/0/0 | all | — | vendor agent docs (Anthropic/GitHub public) |
| token-efficient-prompting | beginner | principles | Token-Efficient Debugging Prompts | 1/1/0/0 | challenge, advanced | ai_usage | none (covered) |
| selecting-repo-context | beginner | principles | — | 0/1/0/0 | lessons, warmup, challenge, advanced | ai_usage | none needed |
| reviewing-ai-code | intermediate | selecting-repo-context | — | 1/0/1/0 | lessons, core, advanced | ai_usage | none needed |
| hallucination-detection | intermediate | reviewing-ai-code | — | 0/0/0/0 | all | — | none needed |
| testing-verification | intermediate | reviewing-ai-code | — | 0/1/0/0 | lessons, warmup, challenge, advanced | ai_usage | none needed |

## Next three implementation batches

Each batch is bounded, independently committable, and ends with the full validation suite plus manual route checks. Batches 2–3 follow the Prompt 2 shape in `CLAUDE_CONTENT_PROMPTS.md`; Batch 1 follows Prompt 3.

### Batch 1 — DSA roadmap scaffolds + binary search & linked lists — DONE 2026-07-04

Completed: 10 DSA module scaffolds added, path extended to 16 ordered modules, 12 orphan problems mapped via `learning-overrides.ts`, and binary-search + linked-lists fully developed (4 lessons; 9 runnable problems in `prisma/seed-data/dsa-search-lists.ts`: sorted-build-id-lookup, first-failing-canary, error-code-range-scan, backup-bandwidth-planner, stale-metric-lookup, reverse-approval-chain, middle-of-release-queue, drop-stale-checkpoint, merge-alert-feeds). All reference solutions verified against the seeded tests.

### Batch 2 — Databases entry point: sql-indexes + transactions-isolation — DONE 2026-07-04

Completed: 14 orphan database problems mapped via `learning-overrides.ts` (transactions-isolation, database-deadlocks-idempotency, query-plans, n-plus-one-queries, cursor-pagination, redis-caching, caching-strategies). sql-indexes and transactions-isolation fully developed: four real lessons (B-tree mental model, reading EXPLAIN, isolation levels and anomalies, lost-update walkthrough) and nine written problems in `prisma/seed-data/databases-foundations.ts` (pick-index-for-login-lookup, wildcard-search-no-index, order-status-page-crawl, covering-index-hot-endpoint, write-amplification-index-audit, read-committed-status-check, double-click-refund, inventory-oversell-checkout, report-snapshot-consistency) — 4 warmups, 3 core, 1 challenge, 1 advanced across databases and optimization formats, sourced from PostgreSQL documentation.

### Batch 3 — Concurrency entry point: threading-synchronization + mutexes-semaphores-condition-variables — DONE 2026-07-04

Completed: shared-counter-undercounts (warmup) and flaky-test-global-state (core) mapped into threading-synchronization. Both modules fully developed: four real lessons (data races and critical sections, lost-increment walkthrough, the synchronization toolbox, bounded-buffer walkthrough) and eight written problems in `prisma/seed-data/concurrency-foundations.ts` (is-it-a-data-race, shared-cache-dict-race, metrics-flush-torn-read, pick-the-primitive, condvar-if-instead-of-while, bounded-queue-two-condvars, shutdown-deadlock-workers, connection-pool-semaphore) — 4 warmups, 3 core, 1 challenge, 1 applied across os/concurrency and debugging formats, introducing the first `os_networking_concurrency`-type problems. Sources: OSTEP concurrency chapters, man7, Python threading docs.

### Batch 6 — System design: system-design-interview-framework + apis-requirements — DONE 2026-07-04

Completed: three real lessons (a full 45-minute webhook-delivery design walkthrough with timeboxing; from vague ask to API contract; designing one endpoint well) and the bank's **first eight `system_design`-type problems** in `prisma/seed-data/system-design-foundations.ts` (clarify-notification-requirements, envelope-math-image-uploads, design-status-page-service, design-flash-sale-checkout, fix-this-api-contract, choose-the-status-code, money-transfer-api-contract, api-field-versioning-migration) — 4 warmups, 2 core, 1 challenge, 1 advanced. All are open-ended written scenarios with requirements, scale assumptions, deliberate ambiguity, rubrics, and follow-ups; every statement embeds a concrete example artifact (traffic timelines, incident reports, partner code, naive API specs). Sources: RFC 9110/6585/8594, Google SRE book.

### Batch 5 — Networking: tcp-vs-udp + sockets-connection-lifecycle — DONE 2026-07-04

Completed: three real lessons (TCP reliability traced packet by packet; a connection's life in syscalls and states; following one request until something leaks) joining the existing TCP-vs-UDP concept lesson, and eight written problems in `prisma/seed-data/networking-foundations.ts` (pick-transport-for-three-services, udp-message-boundary-bug, tcp-retransmission-latency-spike, reliable-udp-telemetry-design, map-syscalls-to-handshake, close-wait-pileup, listen-backlog-refused, ephemeral-port-exhaustion-proxy) — 4 warmups, 2 core, 1 challenge, 1 advanced. Every statement embeds a concrete example artifact (packet captures, `ss`/`nstat` output, failing traces, outage timelines) per the content style rule. cancelled-request-connection-leak mapped into sockets-connection-lifecycle. Sources: RFC 9293/768/6298, man7 pages.

### Batch 4 — Dynamic programming: dynamic-programming-basics + dp-grids-strings — DONE 2026-07-04

Completed: four real lessons (DP as a state definition, deriving a 1-D DP end to end, grid tables, string alignment with edit distance and LCS) and nine original runnable problems in `prisma/seed-data/dsa-dynamic-programming.ts` (release-train-hops, cheapest-retry-ladder, ad-slot-revenue-plan, fewest-batches-exact-total, warehouse-robot-routes, ordered-log-subsequence, cheapest-rack-cabling, config-drift-distance, shared-history-length) — 4 warmups, 3 core, 1 challenge, 1 applied, all with Python/JavaScript/TypeScript public and hidden tests including greedy-refuting and performance cases. Reference solutions verified against all 52 seeded tests. This closes the last empty priority-1 gap: every DSA module the path marks core now has at least a warmup entry point.

### Batch 9 — Backend: http-request-lifecycle + queues-workers — DONE 2026-07-04

Completed: two concept lessons (HTTP request lifecycle; the queue-worker delivery contract) and two walkthrough lessons (tracing one POST through Nginx/app/DB; designing a job queue that survives restarts). Five new problems in `prisma/seed-data/http-queues-foundations.ts`:
- http-timeout-three-layers (core, debugging): diagnose connect / read / pool-acquisition timeout from logs
- http-retry-safety-analysis (core, read_code): classify six HTTP operations as safe/idempotent with worst-case retry analysis
- http-latency-waterfall-diagnosis (challenge, debugging): waterfall shows 8s TTFB; trace to PostgreSQL ALTER TABLE lock and prescribe non-blocking migration
- queue-delivery-guarantee-classify (warmup, read_code): classify four queue configurations as at-most-once / at-least-once / effectively-exactly-once
- dlq-stuck-message-diagnosis (warmup, debugging): JSONDecodeError in DLQ; diagnose permanent vs transient failure class, fix retry strategy, identify producer as fix site

Five orphan problems mapped via `learning-overrides.ts` to queues-workers (async-worker-drops-jobs, queue-redelivery-duplicate-emails, job-scheduler-spec as core; batcher-throughput-latency-trap, unbounded-queue-oom as challenge). Two existing http-request-lifecycle warmups linked to the new concept lesson. Sources: RFC 9110, SQS/Kafka docs.

### Batch 10 — Kubernetes: kubernetes-fundamentals + pods-deployments-services — DONE 2026-07-04

Completed: two concept lessons and one new walkthrough lesson. kubernetes-fundamentals: the desired-state reconciliation loop (concept) and the full kubectl-apply six-step chain (walkthrough). pods-deployments-services: traffic-tracing walkthrough (Service → Endpoints → label selector → readiness probe → container) added alongside the existing concept lesson. Ten new problems in `prisma/seed-data/kubernetes-foundations.ts`:
- k8s-control-plane-components (warmup, read_code): match five components to responsibilities + failure modes
- kubectl-apply-trace (warmup, read_code): order six events from kubectl apply to Running pod
- k8s-crashloopbackoff-diagnosis (core, debugging): 2-second lifetime, missing DATABASE_URL, Secret-based fix
- k8s-resource-requests-limits (core, write_code): configure requests/limits for Node.js; distinguish OOMKilled (exit 137) from CPU throttling; name QoS classes
- k8s-cluster-dns-failure (challenge, debugging): pods can't reach each other by name; diagnose NodeLocal DNSCache DaemonSet failure on one node
- k8s-workload-type-selection (warmup, read_code): choose Deployment / StatefulSet / Job / CronJob / Pod for five scenarios
- k8s-service-type-selection (warmup, read_code): choose ClusterIP / LoadBalancer / Headless / NodePort for four scenarios including Headless DNS A-record behavior
- k8s-deployment-rollout-strategy (core, write_code): configure maxUnavailable=1/maxSurge=2 for ≥5/6 always-ready; trace two rollout waves; distinguish readiness from liveness probes
- k8s-service-selector-mismatch (core, debugging): version=v2 in pod labels vs version=stable in Service selector; two fixes (selector patch vs Deployment rollout) with tradeoffs
- k8s-pod-stuck-pending (challenge, debugging): diagnose three distinct Pending causes from kubectl describe: CPU exhaustion, taint+nodeSelector conflict, PVC not bound
Sources: kubernetes.io concepts, scheduling, storage, networking documentation.

### Batch 7 — C++: raii-resource-ownership + move-semantics — DONE 2026-07-04

Completed: one new walkthrough lesson for raii-resource-ownership (tracing resource lifetime through every exit path, RAII chaining via LIFO scope order) and two new lessons for move-semantics (value categories concept; why noexcept is not optional for move constructors, walkthrough). Six written problems in `prisma/seed-data/cpp-foundations.ts`:
- cpp-raii-owner-identification (warmup, read_code): classify ownership in four code snippets
- cpp-transaction-missing-rollback (warmup, debugging): RAII transaction guard for exception-safe cleanup
- cpp-raii-two-phase-cleanup (challenge, quant_dev): Rule-of-Five wrapper for a resource needing ordered teardown
- cpp-move-value-categories (warmup, read_code): classify lvalue/prvalue/xvalue in five expressions
- cpp-noexcept-move-vector (warmup, debugging): why std::vector copies instead of moves and the noexcept fix
- cpp-pipeline-move-optimization (challenge, quant_dev): identify all copies in a three-stage pipeline, redesign for ownership propagation
Sources: cppreference, C++ Core Guidelines (isocpp).

### Batch 8 — Docker: docker-fundamentals + dockerfiles-image-layers — DONE 2026-07-04

Completed: two new lessons for docker-fundamentals (namespaces/cgroups/overlayfs concept; tracing docker run from command line to process) and one new lesson for dockerfiles-image-layers (cache-friendly Dockerfile rewriting walkthrough with BuildKit cache mounts). Ten written/write-code problems in `prisma/seed-data/docker-foundations.ts`:
- container-vs-vm-comparison (warmup, read_code): classify five statements about containers vs VMs
- docker-run-exit-code-debug (warmup, debugging): diagnose three exit code scenarios with investigation commands
- docker-network-container-discovery (core, debugging): fix container-to-container DNS on the default bridge network
- docker-resource-limits-oom (core, os_networking_concurrency): OOM killer victim selection, cgroup limits, oom_score_adj, exit code 137 detection
- docker-entrypoint-design (challenge, write_code): design exec-form ENTRYPOINT + init.sh with correct signal routing
- dockerfile-layer-order-fix (warmup, optimization): reorder Node.js Dockerfile to cache npm ci
- dockerfile-cache-invalidation-trace (warmup, debugging): predict which layers hit cache across four change scenarios
- dockerfile-multi-stage-conversion (core, write_code): convert a 1.2 GB Go Dockerfile to multi-stage under 25 MB
- dockerfile-image-size-diagnosis (core, debugging): identify three size contributors in a 2.3 GB ML image
- dockerfile-build-reproducibility (challenge, write_code): fix four non-determinism sources and explain reproducibility for supply-chain security
Sources: Docker documentation, Linux kernel cgroup/namespace man pages.

**Queued** (in priority order): market-data-feeds + order-books; stacks-queues-heaps + trees-graphs concept lessons; remaining Python/C++/AI modules.

## Long-term generation guidance

Expand content in small, reviewed batches while maintaining the coverage matrix above (`CLAUDE_CONTENT_PROMPTS.md` Prompt 2 is the reusable batch prompt). The long-term curriculum must include varied difficulties and problem formats across DSA, backend, infrastructure, databases, debugging, optimization, system design, quant development, networking/OS/concurrency, and effective AI usage.

The DSA Confidence Builder must remain a complete standalone interview path, not merely an introduction to systems topics. Its target breadth should be comparable to a strong "150"-style algorithms roadmap while using entirely original prompts. Cover arrays and hashing, two pointers, sliding windows, stacks, binary search, linked lists, trees/BSTs, tries, heaps/priority queues, backtracking, graphs, advanced graphs, one- and two-dimensional dynamic programming, greedy algorithms, intervals, bit manipulation, and math/geometry. Scaffold missing modules before filling them, and give each major pattern a warmup entry point followed by core, challenge, and applied variants.

Problem format should follow the skill being trained:

- DSA and implementation problems: clear signatures, constraints, examples, starter code, and public/hidden tests when supported.
- Optimization problems: usually provide working but inefficient code, SQL, query plans, or system behavior for the learner to improve, including the baseline, target, constraints, and behavior that must be preserved.
- Debugging and read-code problems: provide realistic code, failing tests, logs, traces, or symptoms to diagnose and fix.
- System-design problems: provide an open-ended scenario, requirements, traffic/scale assumptions, ambiguities, rubric, trade-off prompts, and follow-ups; do not force them into an artificial code harness.
- Database, quant, backend, infrastructure, and AI-usage problems: mix implementation, analysis, debugging, and design formats according to realistic interviews.

Every problem should strengthen interview performance rather than add trivia. State why the skill is tested, make evaluation criteria concrete, include common mistakes and follow-ups, and support a timed practice flow. Keep easy problems genuinely easy so learners can build confidence, while retaining meaningful medium, hard, and advanced work.

Keep easy problems genuinely easy: a warmup isolates one main idea, uses a small clear contract, avoids tricks, and takes 10–20 minutes. Every topic should normally progress concept lesson → worked example → easy warmup → core problem → harder variation → applied variant → rubric self-review.

## Recommended next prompt

Run **Prompt 2** in `CLAUDE_CONTENT_PROMPTS.md` for the next queued batch: `market-data-feeds` + `order-books` (Quant Dev path — orphan candidates: multicast-gap-recovery-design, order-book-sequence-state-machine, orderbook-level-aggregator-spec, mini-matching-engine) or `stacks-queues-heaps` + `trees-graphs` (DSA Confidence Builder — concept lessons needed, orphan candidates available). Keep the batch bounded, include genuinely easy warmups, embed a concrete example artifact in every problem statement, and update the coverage tables afterward.
