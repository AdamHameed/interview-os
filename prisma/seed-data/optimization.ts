import { defineProblems, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE, ORIGINAL_NOTE, OSS_INSPIRED_NOTE } from "./types";

export const optimizationProblems = defineProblems([
  {
    slug: "quadratic-settlement-matcher",
    title: "The Settlement Matcher That Melts at Month-End",
    type: "optimization",
    difficulty: "easy",
    topics: ["complexity", "hash-map", "python", "profiling"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["fintech", "quant_fund", "big_tech"],
    estimatedMinutes: 20,
    language: "python",
    prompt:
      "The nightly settlement job matches internal trades against custodian confirmations. At 10k records it takes seconds; at month-end (600k records) it ran for 9 hours and missed the settlement window.\n\n1. Diagnose the complexity and show the math for why 60× the data became ~3600× the time.\n2. Rewrite to O(n) with identical matching semantics — including the subtle duplicate-handling behavior the current code has.\n3. What would you measure before and after? Name the profiling tool and the number you'd put in the postmortem.",
    starterCode:
      "def match_settlements(trades: list[dict], confirms: list[dict]) -> list[tuple]:\n    matched = []\n    used = set()\n    for t in trades:\n        for i, c in enumerate(confirms):\n            if i in used:\n                continue\n            if (c['isin'] == t['isin'] and c['qty'] == t['qty']\n                    and c['side'] == t['side']):\n                matched.append((t['id'], c['id']))\n                used.add(i)\n                break   # first unused confirm wins\n    return matched\n",
    hints: [
      "The inner loop scans confirms for every trade: O(n·m). What lookup structure answers 'first unused confirm with this (isin, qty, side)' in O(1)?",
      "The semantics to preserve: each confirm is used at most once, and ties go to the *earliest* confirm in list order. A dict of deques keyed by the match tuple preserves both.",
      "Duplicates matter: two identical trades must consume two identical confirms in order. Test that case explicitly.",
    ],
    solutionOutline:
      "Current: for each of n trades, scan up to m confirms → O(n·m); 60× data → 3600× work (quadratic signature: the 9-hour month-end run is 10 s × 3600). Rewrite: bucket confirms into \`dict[(isin, qty, side)] -> deque of confirm ids\` in input order (O(m)); for each trade, popleft from its bucket if non-empty (O(1)) → O(n + m) total, preserving first-unused-wins and duplicate consumption exactly. Measurement discipline: before — cProfile/py-spy confirming ~100% time in the inner loop, plus a timing curve at 1k/10k/100k showing the quadratic slope; after — same curve linear; postmortem number: month-end runtime 9 h → ~40 s. The interview point is not the dict — it's demonstrating the habit: complexity diagnosis from production symptoms, semantic-preserving rewrite, and a measured claim.",
    fullSolution:
      "\`\`\`python\nfrom collections import defaultdict, deque\n\ndef match_settlements(trades, confirms):\n    buckets: dict[tuple, deque] = defaultdict(deque)\n    for c in confirms:                       # O(m), preserves list order\n        buckets[(c['isin'], c['qty'], c['side'])].append(c['id'])\n    matched = []\n    for t in trades:                          # O(n)\n        bucket = buckets.get((t['isin'], t['qty'], t['side']))\n        if bucket:\n            matched.append((t['id'], bucket.popleft()))\n    return matched\n\`\`\`\n\nSemantics check against the original: same key equality, each confirm consumed once, earliest confirm wins, trades processed in order — a table-driven test with duplicated trades/confirms pins all four.",
    commonMistakes: [
      "Building the dict keyed by isin only and re-scanning within — still quadratic for hot ISINs (which is exactly month-end).",
      "Using a set of confirm tuples and losing duplicate multiplicity (two identical confirms collapse to one).",
      "Losing first-wins ordering by bucketing into unordered structures then sorting 'later'.",
      "Claiming victory without a before/after measurement, or profiling with wall-clock print statements around the whole job.",
    ],
    followUpQuestions: [
      "Matching now allows qty tolerance ±1%. Which part of the O(n) design breaks, and what's the next-best structure?",
      "The job is still too slow because loading 600k rows takes 20 minutes. Where did the bottleneck move, and what does that teach about optimization order?",
      "When is the O(n·m) version actually fine to ship? Give the engineering-judgment answer.",
    ],
    rubric: [
      { criterion: "Complexity diagnosis", description: "Reads the quadratic from the symptom scaling, not just the code." },
      { criterion: "Semantic preservation", description: "Duplicate multiplicity and first-wins order survive the rewrite, with tests." },
      { criterion: "Measurement habit", description: "Names tools and the exact numbers to report." },
      { criterion: "Judgment", description: "Knows when quadratic is acceptable and what changes the answer." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "orm-n-plus-one-dashboard",
    title: "The Team Dashboard Making 1,201 Queries",
    type: "optimization",
    difficulty: "medium",
    topics: ["databases", "orm", "n-plus-one", "sql", "python"],
    targetRoles: ["backend_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "APM shows the /teams dashboard endpoint at p50 = 2.4 s, with a waterfall of 1,201 nearly-identical sub-millisecond queries. The handler is below (SQLAlchemy-style ORM).\n\n1. Account for the exact number 1,201 (there are 200 teams).\n2. Fix it three ways: eager loading, explicit joins with aggregation, and batched IN-queries — show the resulting query count for each.\n3. Why does this class of bug pass code review and testing so reliably? What guardrail catches it?",
    starterCode:
      "@app.get('/teams')\ndef teams_dashboard():\n    teams = db.query(Team).all()                    # 1 query\n    out = []\n    for team in teams:                               # 200 teams\n        members = team.members                       # lazy-load per team\n        lead = team.lead                             # lazy-load per team\n        open_tickets = sum(1 for m in members\n                           for t in m.tickets        # lazy-load per member!\n                           if t.status == 'open')\n        out.append({'name': team.name,\n                    'lead': lead.name,\n                    'member_count': len(members),\n                    'open_tickets': open_tickets})\n    return out\n",
    hints: [
      "Count the lazy loads: 1 (teams) + 200 (members) + 200 (lead) + one per *member* for tickets. What member count makes the total 1,201?",
      "Eager loading: selectinload(Team.members).selectinload(Member.tickets) + joinedload(Team.lead) — how many queries does selectin batching issue?",
      "The aggregation fix: you don't need ticket *rows* at all — a GROUP BY with a filtered count returns 200 numbers in one query. Push computation to the database.",
    ],
    solutionOutline:
      "1,201 = 1 (teams) + 200 (members per team) + 200 (lead per team) + 800 (tickets per member: 200 teams × 4 members avg). Fixes: (a) Eager loading: \`selectinload\` for members and their tickets (2 batched IN queries) + \`joinedload\` for lead (folded into the base query) → 3 queries; still ships ticket rows to Python just to count them. (b) The right fix for this endpoint: one aggregate query — join teams→members→tickets with \`count(*) FILTER (WHERE status='open')\`, GROUP BY team → 1 query, constant payload; compute nothing in Python. (c) Manual batching: collect team ids → one IN query for members, one for leads, one for open-ticket counts grouped by team → 4 queries; the pattern that generalizes when the ORM's loaders don't fit (and essentially what DataLoader does in GraphQL). Why it survives review: lazy loading makes attribute access *look* free — the cost is invisible at the call site; dev datasets (3 teams) keep it fast; tests assert correctness, not query counts. Guardrails: query-count assertions in tests (e.g., a context manager asserting ≤ N queries), APM alerts on queries-per-request, and ORM strict/raise-on-lazy-load modes in CI.",
    fullSolution:
      "\`\`\`python\n# Fix (b): push the aggregation down — 1 query\nrows = db.execute(\n    select(Team.name,\n           Lead.name.label('lead'),\n           func.count(func.distinct(Member.id)).label('member_count'),\n           func.count(Ticket.id).filter(Ticket.status == 'open').label('open_tickets'))\n    .join(Lead, Team.lead_id == Lead.id)\n    .outerjoin(Member, Member.team_id == Team.id)\n    .outerjoin(Ticket, Ticket.member_id == Member.id)\n    .group_by(Team.id, Lead.name)\n).all()\nreturn [dict(r._mapping) for r in rows]\n\`\`\`\n\nCareful detail worth saying: the double outer-join fans out rows (members × tickets), which is why member_count needs \`distinct\` — candidates who write the join and get member_count = ticket_count have rediscovered join fan-out; fixing it with distinct (or two lateral/sub-queries) is part of the exercise. Also note outerjoin so teams with zero members still appear.",
    commonMistakes: [
      "Fixing members and lead but leaving the per-member tickets loop (the 800 queries — the biggest term).",
      "joinedload for the *collections* (members × tickets cartesian fan-out in one giant result set) where selectinload batching is the right loader.",
      "The aggregate join without distinct — member_count silently multiplied by ticket fan-out.",
      "Inner joins dropping empty teams from the dashboard.",
      "Proposing caching before fixing the query pattern (caching a 1,201-query endpoint is embalming the bug).",
    ],
    followUpQuestions: [
      "How does the GraphQL DataLoader pattern relate to fix (c), and why does GraphQL make N+1 endemic?",
      "The aggregate query is now slow at 10k teams. Read its EXPLAIN — what index makes the filtered count cheap?",
      "Write the test guardrail: how do you assert query counts without making tests brittle to legitimate query changes?",
    ],
    rubric: [
      { criterion: "Exact accounting", description: "Derives 1 + 200 + 200 + 800 from the code and data shape." },
      { criterion: "Fix spectrum", description: "Loader-based, aggregate-pushdown, and manual batching — with query counts for each." },
      { criterion: "Fan-out awareness", description: "Handles the join-multiplication trap (distinct / subqueries) and empty-team outer joins." },
      { criterion: "Prevention", description: "Query-count assertions or lazy-load-raises guardrails; explains why review misses this." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html",
      "https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "missing-composite-index-orders",
    title: "The Order History Query Doing 4 Million Row Reads",
    type: "optimization",
    difficulty: "medium",
    topics: ["databases", "indexing", "query-plans", "sql", "postgres"],
    targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"],
    companyStyles: ["big_tech", "fintech", "startup"],
    estimatedMinutes: 30,
    language: "sql",
    prompt:
      "This query runs 40×/s and p99 = 1.8 s:\n\n\`\`\`sql\nSELECT id, status, total_cents, created_at\nFROM orders\nWHERE customer_id = $1 AND status = 'shipped'\nORDER BY created_at DESC\nLIMIT 20;\n\`\`\`\n\nEXPLAIN ANALYZE (abridged):\n\`\`\`text\nLimit (actual time=1795.001..1795.004 rows=20)\n  -> Sort (actual time=1794.999..1795.001 rows=20)\n       Sort Key: created_at DESC   Sort Method: top-N heapsort\n       -> Bitmap Heap Scan on orders (actual rows=48211)\n            Recheck Cond: (customer_id = $1)\n            Filter: (status = 'shipped')  Rows Removed by Filter: 3951789\n            -> Bitmap Index Scan on idx_orders_customer (actual rows=4000000)\n\`\`\`\n\nExisting index: \`(customer_id)\`. This is a big B2B customer with 4M orders, 48k shipped.\n\n1. Read the plan: where do the 1.8 s go?\n2. Design the ideal index. Justify the column order and whether \`created_at\` belongs in the key.\n3. Estimate the new plan shape and cost. What are the write-side and storage costs of your index?",
    hints: [
      "The plan fetches 4M heap rows for one customer, filters 3.95M away, then top-N sorts 48k. Three separate wastes — name them.",
      "Index column order rule: equality predicates first (customer_id, status), then the ORDER BY column as the final key part (created_at DESC) — so the index *is* the sort order and LIMIT 20 stops after 20 entries.",
      "Would (status, customer_id, created_at) be equally good? What about a partial index WHERE status = 'shipped'?",
    ],
    solutionOutline:
      "Plan reading: (1) the single-column index matches 4M entries (whole customer); (2) each requires a heap visit — the Bitmap Heap Scan with 3.95M rows removed by filter is the bulk of the time (random-ish I/O + filtering); (3) then a top-N sort of the 48k survivors. Ideal index: \`(customer_id, status, created_at DESC)\` — equality columns first (order between the two equalities doesn't matter much for THIS query; customer_id first is more reusable for other queries on customer alone), then the sort column so the index scan emits rows already in ORDER BY order → the plan becomes a backward/forward Index Scan producing 20 rows and stopping: 'Limit → Index Scan using idx..., rows=20' with no Sort node at all. Expect single-digit ms. Even better for this workload if 'shipped' queries dominate: a partial index \`(customer_id, created_at DESC) WHERE status = 'shipped'\` — smaller, hotter in cache, cheaper to maintain for rows that never ship. Costs to state: every additional index taxes INSERT/UPDATE (extra B-tree maintenance, potential HOT-update loss in Postgres when indexed columns change — status changes hit exactly this index), storage, and vacuum. Including the covering columns (INCLUDE (total_cents, id)) turns it index-only if heap visits still dominate — measure via 'Heap Fetches'.",
    fullSolution:
      "\`\`\`sql\nCREATE INDEX CONCURRENTLY idx_orders_cust_status_created\n  ON orders (customer_id, status, created_at DESC);\n\n-- or, if shipped-history is the overwhelming pattern:\nCREATE INDEX CONCURRENTLY idx_orders_cust_shipped_created\n  ON orders (customer_id, created_at DESC)\n  WHERE status = 'shipped';\n\`\`\`\n\nExpected plan after:\n\n\`\`\`text\nLimit (rows=20)\n  -> Index Scan using idx_orders_cust_status_created on orders (rows=20)\n       Index Cond: (customer_id = $1 AND status = 'shipped')\n\`\`\`\n\nNo Sort node (the index provides the order), ~20 index entries + ≤20 heap fetches. Operational notes that separate seniors: CREATE INDEX CONCURRENTLY (no write lock; can't run in a transaction), verify with EXPLAIN (ANALYZE, BUFFERS) and compare shared-read counts, and check pg_stat_user_indexes a week later to confirm the old index is now redundant before dropping it.",
    commonMistakes: [
      "Index (created_at, customer_id, status) 'because we sort by created_at' — sort column first destroys the equality prefix; the index is nearly useless.",
      "Adding separate single-column indexes on status and created_at expecting Postgres to combine them into ordered output (BitmapAnd can't preserve order; the sort survives).",
      "Ignoring the DESC/scan-direction detail entirely (Postgres can scan backward, but declaring intent matters for mixed-direction sorts).",
      "No mention of write amplification or the status-update/HOT interaction — indexes are not free.",
      "Skipping verification: no before/after EXPLAIN ANALYZE with buffer counts.",
    ],
    followUpQuestions: [
      "Add a second query: all shipped orders across customers in the last hour. Does your index serve it? What serves both cheaply?",
      "The customer now filters by status IN ('shipped','delivered'). How does the composite index behave, and when does the planner flip strategies?",
      "Why might the planner ignore your perfect index for a customer with 12 orders? What statistics drive that choice?",
    ],
    rubric: [
      { criterion: "Plan literacy", description: "Decomposes the 1.8 s into heap fetches, filter waste, and sort; reads rows-removed correctly." },
      { criterion: "Index design", description: "Equality-prefix-then-sort-column order with justification; considers partial and covering variants." },
      { criterion: "Cost honesty", description: "Write amplification, HOT updates, storage, and CONCURRENTLY deployment." },
      { criterion: "Verification", description: "Before/after EXPLAIN (ANALYZE, BUFFERS) as the acceptance test." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys",
      "https://www.postgresql.org/docs/current/using-explain.html",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "cache-stampede-product-page",
    title: "The Cache Expiry That DDoSes Your Own Database",
    type: "optimization",
    difficulty: "hard",
    topics: ["caching", "cache-stampede", "concurrency", "distributed-systems"],
    targetRoles: ["backend_swe", "infrastructure_swe", "distributed_systems_engineer"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Every hour, on the hour, the database CPU spikes to 100% for ~40 s and p99 latency goes vertical. The graph shows the spike aligns with the TTL of the homepage product-ranking cache entry (computed by a 4 s query, cached for 3600 s, read 2,000×/s).\n\n1. Explain the mechanism — walk the 4 seconds after expiry at 2,000 reads/s.\n2. Present four mitigations (TTL jitter, single-flight/locking, stale-while-revalidate, external refresh) — the mechanism, what each does to worst-case latency and staleness, and what each fails to fix.\n3. Choose a combination for this workload and justify it.",
    starterCode:
      "def get_homepage_ranking():\n    data = cache.get('homepage:ranking')\n    if data is None:                       # expired for EVERYONE at once\n        data = db.run_expensive_ranking()   # 4 seconds\n        cache.set('homepage:ranking', data, ttl=3600)\n    return data\n",
    hints: [
      "At expiry+0ms, every request misses. How many concurrent copies of the 4 s query start in the first second? What does that do to a DB already sized for steady-state?",
      "Single-flight: first miss takes a lock and recomputes; everyone else… does what? (Wait vs serve-stale — this fork is the whole design question.)",
      "TTL jitter decorrelates *multiple keys* expiring together. Does it help this single hot key at all?",
    ],
    solutionOutline:
      "Mechanism: at TTL expiry the hot key misses for all 2,000 req/s simultaneously; each miss launches the 4 s query; in 4 s that's up to 8,000 concurrent executions of a query the DB can run a handful of at a time → connection pool exhaustion, CPU saturation, the 40 s recovery tail as the herd drains (longer than 4 s because contention slows every copy). This is a cache stampede / dogpile. Mitigations: (1) TTL jitter (ttl + rand) — decorrelates *many keys* expiring in sync; does nothing for one hot key (this incident) but include it as hygiene. (2) Single-flight (per-key mutex/Redis SETNX lock): exactly one recomputes; others either block (worst-case latency = 4 s for everyone during refresh — still a latency cliff, but the DB is safe) or get a miss-response. (3) Stale-while-revalidate: store (value, soft_deadline, hard_ttl); after soft expiry, serve the stale value while ONE request (single-flight again) refreshes → worst-case user latency stays ~cache-hit, staleness bounded by refresh time; fails only when the value must never be stale or on cold start (no stale value exists). (4) External refresh: a cron/worker recomputes every 50 min and *overwrites* the key which never expires organically; requests never recompute → no stampede possible; fails open if the refresher breaks (data ages silently — needs freshness monitoring), and cold start still needs a path. For this workload (homepage ranking: staleness-tolerant, extremely hot): external refresh as primary + stale-while-revalidate + single-flight as the belt-and-suspenders read path, TTL jitter globally as hygiene. Probabilistic early expiration (XFetch) is the literature answer to mention by name.",
    fullSolution:
      "\`\`\`python\nSOFT_TTL = 3300   # serve-stale threshold\nHARD_TTL = 86400  # never organically expire in practice\n\ndef get_homepage_ranking():\n    entry = cache.get('homepage:ranking')          # (value, computed_at)\n    if entry is None:                               # cold start only\n        return _refresh(block=True)\n    value, computed_at = entry\n    if time.time() - computed_at > SOFT_TTL:\n        _maybe_refresh_async()                      # single-flight guarded\n    return value                                     # always fast\n\ndef _maybe_refresh_async():\n    if cache.set('homepage:ranking:lock', '1', ttl=30, nx=True):  # one winner\n        background.submit(_refresh)\n\ndef _refresh(block=False):\n    data = db.run_expensive_ranking()\n    cache.set('homepage:ranking', (data, time.time()), ttl=HARD_TTL)\n    cache.delete('homepage:ranking:lock')\n    return data\n\`\`\`\n\nDetails that earn senior marks: the lock has a TTL (a crashed refresher must not deadlock the key — and note the crash-before-delete case is *why* the TTL exists); the hard TTL is long so organic expiry can't stampede; cold start still single-flights with blocking; and freshness needs an alert (age of computed_at) because serve-stale systems fail *silently* when refresh breaks.",
    commonMistakes: [
      "Proposing TTL jitter as the fix for a single hot key (it addresses correlated expiry of many keys — wrong failure mode).",
      "Single-flight where waiters block with no timeout: you've moved the pileup from the DB to the app tier's threads/connections.",
      "Stale-while-revalidate with the refresh NOT single-flighted (every soft-expired read triggers a refresh — a slower stampede).",
      "Lock without TTL (crashed worker = key never refreshes again) or refresh path without cold-start handling.",
      "Not asking whether staleness is acceptable — the entire design hinges on that product question.",
    ],
    followUpQuestions: [
      "Now it's 5M keys with a power-law access distribution, not one key. Which mitigations generalize, and what does XFetch (probabilistic early expiration) add?",
      "The ranking must reflect a manual takedown within 60 s (legal). How does that constraint reshape your design?",
      "How do memcached leases unify stampede protection with the stale-set problem from the invalidation race?",
    ],
    rubric: [
      { criterion: "Mechanism math", description: "Herd size arithmetic (req/s × recompute time) and why recovery exceeds one recompute duration." },
      { criterion: "Mitigation taxonomy", description: "All four with mechanism, latency/staleness effects, and what each fails to fix — especially jitter's irrelevance here." },
      { criterion: "Composition", description: "Combines refresh-ahead + serve-stale + single-flight coherently for the stated workload." },
      { criterion: "Failure hygiene", description: "Lock TTLs, cold start, freshness alerting on silent-staleness." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.wikipedia.org/wiki/Cache_stampede",
      "https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "lock-contention-session-map",
    title: "64 Cores, 4% CPU, Falling Over",
    type: "optimization",
    difficulty: "hard",
    topics: ["concurrency", "locks", "contention", "profiling", "cpp"],
    targetRoles: ["backend_swe", "hft_swe", "quant_developer", "infrastructure_swe"],
    companyStyles: ["hft", "big_tech", "infra_heavy"],
    estimatedMinutes: 35,
    language: "cpp",
    prompt:
      "A session-token validation service caps out at 80k req/s on a 64-core box — at 4% total CPU. Adding cores made it *slower*. Every request takes/releases one global mutex around an unordered_map for a sub-microsecond lookup (reads outnumber writes 500:1).\n\n1. Explain how a service can be slow at 4% CPU — what are the cores actually doing?\n2. Why did MORE cores make it worse? (Name the cache-line mechanism.)\n3. Propose three designs in increasing sophistication — sharded locks, reader-writer, read-mostly structures (RCU/hazard-pointer-style snapshots) — and pick one with the read:write ratio in mind.",
    starterCode:
      "class SessionStore {\n    std::mutex mu_;\n    std::unordered_map<std::string, Session> sessions_;\npublic:\n    bool validate(const std::string& token) {\n        std::lock_guard<std::mutex> lock(mu_);       // global lock\n        auto it = sessions_.find(token);\n        return it != sessions_.end() && !it->second.expired();\n    }\n    void insert(const std::string& token, Session s) {\n        std::lock_guard<std::mutex> lock(mu_);\n        sessions_.emplace(token, std::move(s));\n    }\n};\n",
    hints: [
      "Low CPU + low throughput = threads parked, not computing. Where do they park, and what does the scheduler do with a thread that fails to acquire a mutex?",
      "The mutex's internal state is one cache line. 64 cores doing compare-and-swap on it: what does the cache-coherence protocol do to that line, and why does the cost *grow* with core count?",
      "500:1 reads. What structure lets readers proceed with zero shared writes? (Hint: even a rwlock's reader count is a shared write.)",
    ],
    solutionOutline:
      "(1) 4% CPU because threads are blocked in futex_wait, not working — the bottleneck is serialization, not computation; the lock admits one core at a time so 63 cores idle/park, and each handoff costs syscalls and context switches that dwarf the sub-microsecond critical section. (2) More cores worsen it via cache-line ping-pong: every lock/unlock is an atomic RMW on the mutex's line; the coherence protocol bounces that line's exclusive ownership between cores, and contention on the atomic grows super-linearly with waiters (plus futex thundering on unlock). (3) Designs: (a) Shard by hash(token) into 64+ independent (mutex, map) shards — contention drops ~N×; simple, keeps mutation semantics; still pays one atomic per read and cross-core line movement per shard. (b) shared_mutex (rwlock): readers coexist — but every reader increments a shared reader count: the *same* ping-pong on a different line; at 500:1 with tiny critical sections, rwlocks often measure WORSE than plain mutexes; knowing this is the senior tell. (c) Read-mostly: publish an immutable snapshot via atomic<shared_ptr> (or folly::hazptr/RCU): readers do one atomic load, zero shared stores, scale linearly; writers copy-and-swap (or apply an epoch scheme); staleness window = snapshot refresh period — fine for session validation where a just-inserted token retrying 10 ms later is acceptable, but note atomic<shared_ptr> refcount can itself become a hot line → per-thread hazard pointers or RCU epochs are the real answer at this scale. Pick (c) for 500:1, with (a) as the pragmatic first ship. Measure with perf: expect futex time and cache-miss counters to collapse.",
    fullSolution:
      "\`\`\`cpp\n// Read-mostly design: immutable snapshot + copy-on-write publisher\nclass SessionStore {\n    std::shared_ptr<const Map> current_ = std::make_shared<Map>();\n    std::mutex write_mu_;                     // writers only\npublic:\n    bool validate(const std::string& token) const {\n        auto snap = std::atomic_load(&current_);   // one atomic load, no shared store*\n        auto it = snap->find(token);\n        return it != snap->end() && !it->second.expired();\n    }\n    void insert(const std::string& token, Session s) {\n        std::lock_guard<std::mutex> lock(write_mu_);\n        auto next = std::make_shared<Map>(*current_);   // copy\n        next->emplace(token, std::move(s));\n        std::atomic_store(&current_, std::shared_ptr<const Map>(std::move(next)));\n    }\n};\n// *honest caveat: shared_ptr refcounting writes a shared control block; at extreme\n// read rates use hazard pointers / RCU / folly::atomic_shared_ptr equivalents.\n\`\`\`\n\nWrite cost is now O(map) per insert — batch writes or use a persistent/HAMT structure if write rate matters. The diagnostic narrative to rehearse: low CPU + poor scaling ⇒ contention; perf shows futex + coherence misses ⇒ shared-line serialization; read:write ratio ⇒ snapshot design. Numbers people quote: uncontended atomic ~nanoseconds; contended cross-core line transfer ~40–100 ns each way, times millions per second, times 64 cores — the arithmetic explains 'slower with more cores' without hand-waving.",
    commonMistakes: [
      "Prescribing rwlock for read-heavy without knowing the reader-count line is itself contended — the textbook answer that measures worse.",
      "Explaining slowness as 'lock overhead' generically instead of parked threads + line ping-pong (mechanism matters at this level).",
      "Sharding by first-byte-of-token (skewed) instead of a hash; or sharding to exactly num_cores and colliding with unrelated hot shards.",
      "Copy-on-write with unbounded write amplification and no plan for write bursts (session floods at login storms).",
      "No measurement plan — perf/futex counters before and after is the acceptance test.",
    ],
    followUpQuestions: [
      "Sessions expire — the map needs pruning. How does eviction interact with snapshot readers, and what's a tombstone-free design?",
      "Same service in Go or Java: what are the idiomatic equivalents (sync.Map? RWMutex pitfalls? VarHandle acquire loads?)?",
      "At what point does the answer become 'don't share: partition sessions per core / per NUMA node and route'? What does that cost the LB layer?",
    ],
    rubric: [
      { criterion: "Contention model", description: "Parked threads at low CPU; futex costs; coherence ping-pong scaling with cores." },
      { criterion: "RWLock skepticism", description: "Knows reader-count contention makes rwlocks a trap for tiny hot critical sections." },
      { criterion: "Design ladder", description: "Sharding → snapshots/RCU with the read:write ratio driving the pick; staleness trade-off stated." },
      { criterion: "Verification", description: "perf-level evidence plan; can quote order-of-magnitude line-transfer costs." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://preshing.com/20111118/locks-arent-slow-lock-contention-is/",
      "https://www.kernel.org/doc/html/latest/RCU/whatisRCU.html",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "memory-hungry-export-job",
    title: "The 32 GB Export Job That OOMs at 3 A.M.",
    type: "optimization",
    difficulty: "medium",
    topics: ["memory", "streaming", "batch-processing", "python", "generators"],
    targetRoles: ["backend_swe", "platform_engineer", "mid_level_swe"],
    companyStyles: ["startup", "big_tech", "infra_heavy"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "The nightly CSV export OOMs on a 32 GB box now that the events table hit 80M rows. Read the job and:\n\n1. Inventory every place the full dataset is materialized (there are four).\n2. Rewrite as a constant-memory streaming pipeline — DB cursor to gzip file — and state the new peak memory.\n3. The consumer team says 'we need the row count in the file header'. That requirement fights streaming — give two honest resolutions.",
    starterCode:
      "import csv, gzip, json\n\ndef export_events(day):\n    rows = db.query('SELECT * FROM events WHERE day = %s', (day,))   # (1) all rows\n    dicts = [dict(r) for r in rows]                                    # (2) copy as dicts\n    for d in dicts:\n        d['payload'] = json.dumps(d['payload'])                        # mutate in place\n    body = '\\n'.join(csv_line(d) for d in dicts)                      # (3) giant string\n    with gzip.open(f'/exports/{day}.csv.gz', 'wt') as f:\n        f.write(f'# count={len(dicts)}\\n' + body)                     # (4) header needs count\n",
    hints: [
      "Materializations: the driver buffering the full result set client-side, the dict copy, the joined string, and the header-count coupling. Each independently exceeds RAM at 80M rows.",
      "Server-side/named cursors (or itersize) let the DB stream chunks. From there: generator → csv.writer writing directly into the gzip file handle, row by row.",
      "For the count-in-header: you can't know it before streaming… unless the DB tells you (a COUNT(*) first — costs one scan) or you write it at the END (footer / sidecar manifest / rewrite-first-bytes trick with fixed-width field).",
    ],
    solutionOutline:
      "Four materializations: (1) client-buffered result set (default DBAPI fetch pulls everything); (2) list-of-dicts copy (~2-3× row overhead in Python objects); (3) the '\\n'.join giant string (the whole file in RAM, again); (4) len(dicts) forcing (2) to exist. Streaming rewrite: server-side cursor (name= in psycopg / stream_results in SQLAlchemy) with itersize ~10k; iterate rows, transform one at a time, csv.writer straight into gzip.open handle. Peak memory = one batch of rows + gzip buffers ≈ tens of MB, independent of table size. The count requirement: (a) precompute with SELECT COUNT(*) — one extra (index-only, likely cheap) scan, header stays; correct unless data changes between count and scan → run both in one REPEATABLE READ transaction for a consistent snapshot; (b) change the contract: write count in a footer line or a sidecar manifest (.manifest.json with count + checksum) — consumers that need the count before processing read the manifest first; this is what data pipelines actually converge on (manifests also carry schema versions and checksums). Fixed-width placeholder rewriting (seek to byte 8, patch count) does not work through gzip streams — knowing WHY (compressed output is not seekable-writable) is a nice flourish.",
    fullSolution:
      "\`\`\`python\nimport csv, gzip, json\n\nBATCH = 10_000\n\ndef export_events(day):\n    count = 0\n    with gzip.open(f'/exports/{day}.csv.gz.tmp', 'wt', newline='') as f:\n        writer = csv.writer(f)\n        writer.writerow(HEADER_COLUMNS)\n        with db.server_side_cursor(\n                'SELECT * FROM events WHERE day = %s', (day,),\n                itersize=BATCH) as cur:\n            for row in cur:                       # driver streams batches\n                writer.writerow(transform(row))    # one row in memory at a time\n                count += 1\n    manifest = {'day': day, 'count': count, 'schema': 2}\n    atomic_write(f'/exports/{day}.manifest.json', json.dumps(manifest))\n    os.rename(f'/exports/{day}.csv.gz.tmp', f'/exports/{day}.csv.gz')\n\`\`\`\n\nOperational touches included deliberately: write to .tmp and rename (consumers never see partial files), manifest carries the count and schema version, and the rename-after-manifest ordering means a manifest always describes a complete file. Peak RSS goes from >32 GB to ~50 MB; runtime usually *improves* too (no GC pressure, no 80M-object allocation).",
    commonMistakes: [
      "Fixing one materialization and declaring victory while three others still buffer the world (each alone OOMs).",
      "Using a client-side cursor with fetchall semantics and believing 'iterating' streams it (driver default buffering — know your driver).",
      "COUNT(*) and the export in separate transactions — count drifts from content under concurrent writes.",
      "chunksize-style batching that still appends every chunk to one list ('streaming theater').",
      "No partial-file protection — consumers ingest truncated CSVs after a crash.",
    ],
    followUpQuestions: [
      "The transform now needs a join against a 2M-row dimension table. Stream-join options: preload the small side as a dict vs push the join into SQL — how do you decide?",
      "Export time is now dominated by gzip CPU. Options? (Compression level, zstd, parallel pigz-style chunks, compress-on-consumer.)",
      "How would you make this job resumable after a crash at row 60M without reprocessing from zero?",
    ],
    rubric: [
      { criterion: "Materialization inventory", description: "Finds all four buffering points including the driver default and the count coupling." },
      { criterion: "True streaming", description: "Server-side cursor → row-wise transform → direct compressed write; constant-memory claim quantified." },
      { criterion: "Contract negotiation", description: "Handles the header-count requirement with snapshot-consistent precount or manifest redesign — and can argue trade-offs." },
      { criterion: "Operational safety", description: "Atomic rename, manifests, partial-file protection." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.psycopg.org/docs/usage.html#server-side-cursors",
      "https://docs.python.org/3/library/csv.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "slow-json-serialization-feed",
    title: "60% of CPU Is json.dumps",
    type: "optimization",
    difficulty: "medium",
    topics: ["serialization", "profiling", "python", "api-design", "caching"],
    targetRoles: ["backend_swe", "fullstack_swe", "platform_engineer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "py-spy on the activity-feed API shows 60% of CPU inside json.dumps (and datetime.isoformat under it). The endpoint returns 200-item feeds at 3k req/s. Response p50 is 90 ms; the DB part is 8 ms.\n\n1. Order the optimization options by expected win and by risk: faster serializer, smaller payload, serialize-once caching, pagination default change.\n2. The response includes full nested user objects on every item — 85% of bytes. Walk the payload-shape fix and its API-compat strategy.\n3. When is 'rewrite the endpoint in Go/Rust' the wrong answer, and what would make it right?",
    starterCode:
      "@app.get('/feed')\ndef feed(user_id: int):\n    items = load_feed_items(user_id, limit=200)      # 8ms, fine\n    return json_response([\n        {\n            'id': i.id,\n            'verb': i.verb,\n            'created_at': i.created_at,               # datetime -> isoformat, per item\n            'actor': serialize_user(i.actor),          # full nested user, ~40 fields\n            'target': serialize_user(i.target),        # again\n            'payload': i.payload,\n        }\n        for i in items\n    ])\n",
    hints: [
      "Biggest wins usually come from *serializing less*, not serializing faster: 200 items × 2 × 40-field users is the multiplier to attack.",
      "Users repeat across a feed (the same 5 friends appear in most items). Normalize: an 'actors' map keyed by id + id references in items — payload shrinks and so does serialization work.",
      "orjson serializes datetimes natively in C — a drop-in ~5-10× on the remaining bytes. And: are 200 default items even read? Product data first.",
    ],
    solutionOutline:
      "Ranking by win/risk: (1) Payload shape — normalize repeated users into a side map with id refs, trim user objects to the fields the feed actually renders (40 → ~6): cuts bytes AND CPU by the same 80%+; risk = API change → version it or add ?shape=v2 (see below). (2) Default page size — if clients render 20 items before scrolling, default limit 200 → 25 with cursor pagination: 8× less work, product-level decision, low code risk, needs client coordination. (3) Faster serializer — orjson (C, native datetime/dataclass) as a drop-in: honest 3-8× on serialization CPU, near-zero risk, but it optimizes waste if done first — do it after shrinking. (4) Serialize-once caching — cache the serialized *bytes* of hot sub-objects (user cards) or whole cold feeds; wins when feeds overlap across users (celebrity fan-out); adds invalidation complexity — last. Compat strategy for the shape change: additive versioning (Accept header or query param, deprecate v1 with metrics on remaining callers), or GraphQL-style field selection if that direction already exists. The Go/Rust rewrite is wrong while the payload is 85% redundant — you'd port the waste; it becomes right when the payload is already minimal, the serializer is already native-speed, and the remaining cost is genuinely language overhead at scale that matters (then measure a spike first).",
    fullSolution:
      "\`\`\`python\nimport orjson\n\n@app.get('/feed')\ndef feed(user_id: int, limit: int = 25, cursor: str | None = None):\n    items = load_feed_items(user_id, limit=limit, cursor=cursor)\n    users = {}\n    for i in items:\n        for u in (i.actor, i.target):\n            if u.id not in users:\n                users[u.id] = {'id': u.id, 'name': u.name,\n                               'avatar': u.avatar_url, 'verified': u.verified}\n    body = orjson.dumps({\n        'items': [\n            {'id': i.id, 'verb': i.verb, 'created_at': i.created_at,  # orjson: native\n             'actor_id': i.actor.id, 'target_id': i.target.id,\n             'payload': i.payload}\n            for i in items\n        ],\n        'users': users,\n        'next_cursor': items.next_cursor,\n    })\n    return Response(body, media_type='application/json')\n\`\`\`\n\nExpected arithmetic to present: bytes/request 260 KB → ~30 KB (normalization + field trim + limit 25), serialization CPU roughly proportional → the 60% flame collapses to a few percent; p50 90 ms → ~15 ms. Then the profile decides what's next — it may now be load_feed_items. Optimization is a loop, not a list.",
    commonMistakes: [
      "Grabbing orjson first and calling it done — 5× faster at serializing 85% redundant bytes is still 85% waste.",
      "Normalizing users but leaving created_at Python-side isoformat in a comprehension (let the serializer do datetimes natively).",
      "Breaking API compatibility without a versioning/deprecation path.",
      "Caching serialized feeds per-user for personalized feeds (near-zero hit rate) instead of shared fragments.",
      "Skipping the 'do clients even use 200 items?' product question — the cheapest CPU is work not done.",
    ],
    followUpQuestions: [
      "The mobile team wants *more* fields, web wants fewer. Field-selection param vs BFF split vs GraphQL — how do you choose here?",
      "How do you cache serialized user-card bytes and compose them into responses without deserializing? What invalidates them?",
      "What does the flame graph look like after your fix if gzip becomes the top consumer — and is that a problem?",
    ],
    rubric: [
      { criterion: "Waste-first ordering", description: "Attacks payload shape and page size before serializer speed; can defend the order." },
      { criterion: "Normalization design", description: "Side-map users with id refs; field trimming tied to actual rendering needs." },
      { criterion: "Compat discipline", description: "Concrete versioning/deprecation path for the shape change." },
      { criterion: "Rewrite judgment", description: "Articulates when a language port is premature vs warranted." },
    ],
    sourceType: "open_source_inspired",
    sourceUrls: [
      "https://github.com/ijl/orjson",
      "https://github.com/benfred/py-spy",
    ],
    licenseNote: OSS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "unbounded-queue-oom",
    title: "The Queue That Ate 60 GB Before Dying",
    type: "optimization",
    difficulty: "hard",
    topics: ["backpressure", "queues", "reliability", "python", "load-shedding"],
    targetRoles: ["backend_swe", "infrastructure_swe", "distributed_systems_engineer", "platform_engineer"],
    companyStyles: ["infra_heavy", "big_tech"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "An ingest service accepts webhooks, queues them in-process, and a pool of workers posts them to a partner API. During a partner slowdown (their p99 went 200 ms → 8 s), your service's memory climbed for 40 minutes, OOM-killed, and dropped everything in the queue — turning THEIR slowdown into YOUR data loss.\n\n1. Do the arithmetic: 2k webhooks/s in, workers×(1/8s) out. Quantify queue growth and time-to-OOM at ~2 KB/message and 60 GB available.\n2. 'Make the queue bounded' — then what? Walk the three choices at a full queue (block, shed, spill) and their system-wide consequences.\n3. Design the full backpressure story: what does each layer (HTTP handler, queue, workers, partner client) do when the partner is slow?",
    starterCode:
      "queue = asyncio.Queue()          # unbounded\n\n@app.post('/webhook')\nasync def receive(payload: dict):\n    await queue.put(payload)          # never blocks (unbounded)\n    return {'accepted': True}         # 202, always\n\nasync def worker():\n    while True:\n        payload = await queue.get()\n        await partner_client.post(payload, timeout=10)   # p99 now 8s\n        queue.task_done()\n",
    hints: [
      "Throughput out = workers / avg_latency. With 32 workers at 8 s each: 4 msg/s out vs 2,000/s in. The queue grows at ~2,000/s × 2 KB — plot it against 60 GB.",
      "A bounded queue converts the memory problem into a decision problem: when full, the handler must block (backpressure to the caller), reject (shed load — 429/503 + Retry-After), or spill (durable buffer). Each moves the pain somewhere — say where.",
      "The real fix bundle: bounded queue + reject-with-retry-after + circuit breaker on the partner + durable spill for must-not-lose events + concurrency limits and timeouts tuned so out-throughput is honest. Webhooks specifically: the SENDER retries — leaning on that is the design.",
    ],
    solutionOutline:
      "Arithmetic: out-throughput = 32 workers / 8 s = 4/s; net growth ≈ 1,996 msg/s ≈ 4 MB/s ≈ 240 MB/min → 60 GB in ~4.2 hours... but memory pressure kills earlier via GC thrash and the 40-minute observation implies bigger effective message cost (Python object overhead ~5-10× raw payload — a teaching moment: 2 KB JSON becomes 10-20 KB of dicts). The lesson: an unbounded queue is a decision to OOM, deferred. Bounded-queue choices: (1) Block the producer (await put on full queue) — backpressure propagates to the HTTP handler, requests slow, LB health checks eventually fail you out — honest but converts overload into unavailability for ALL callers; (2) Shed — return 429/503 + Retry-After immediately when full: callers with retry (webhook senders retry by contract!) redeliver later; protects memory and latency; requires idempotent processing since retries duplicate; (3) Spill to durable storage (disk log, Redis stream, SQS) — absorbs long outages without loss, adds an ops surface and ordering questions. Full story: HTTP layer — accept fast but honestly (202 only if buffered durably or queue has room; else 429 + Retry-After); queue — bounded, sized for burst-absorption (e.g., 60 s of input), metrics + alerts on depth; workers — bounded concurrency, per-request timeout, exponential backoff; partner client — circuit breaker (fail fast when partner is down instead of 8 s×timeout burns), token-bucket rate match to partner's real capacity; plus DLQ for poison messages. Key principle: **every queue must be bounded, and 'full' must have a designed answer; otherwise the answer is OOM.**",
    fullSolution:
      "\`\`\`python\nqueue: asyncio.Queue = asyncio.Queue(maxsize=120_000)   # ≈60s of input\n\n@app.post('/webhook')\nasync def receive(payload: dict, response: Response):\n    try:\n        queue.put_nowait(payload)\n    except asyncio.QueueFull:\n        response.status_code = 429\n        response.headers['Retry-After'] = '30'\n        shed_counter.inc()\n        return {'accepted': False}\n    return {'accepted': True}\n\nasync def worker():\n    while True:\n        payload = await queue.get()\n        try:\n            if breaker.is_open():                    # partner known-bad: fail fast\n                await spill_to_disk(payload)          # durable parking lot\n            else:\n                await partner_client.post(payload, timeout=2.0)  # honest timeout\n        except (Timeout, PartnerError) as e:\n            breaker.record_failure()\n            await spill_to_disk(payload)\n        else:\n            breaker.record_success()\n        finally:\n            queue.task_done()\n\`\`\`\n\nSizing logic to present: maxsize = acceptable_burst_seconds × inflow; worker timeout cut from 10 s to 2 s (workers×(1/2s) = 16/s ceiling is still too low — which *proves* shedding/spilling is mandatory during this incident, no tuning escapes the arithmetic). Dashboards: queue depth, shed rate, breaker state, spill backlog age — the four numbers that describe this system's health.",
    commonMistakes: [
      "Bounding the queue and blocking producers without realizing that inverts into full-service unavailability behind a load balancer.",
      "Shedding without Retry-After or without knowing webhook senders' retry contracts (silent data loss by another route).",
      "Sizing the queue by 'big number' instead of burst-seconds arithmetic.",
      "No circuit breaker: 32 workers × 10 s timeouts = capacity burned proving the partner is down, repeatedly.",
      "Forgetting Python object overhead when estimating memory (raw payload size × 5-10 is the honest multiplier).",
    ],
    followUpQuestions: [
      "The partner recovers. What does draining the spill safely look like — rate, ordering, duplicate handling, and how do you avoid re-triggering the breaker?",
      "Kafka/SQS in front instead of in-process queueing: what problems dissolve, which remain, and what new ones appear?",
      "How does this map to TCP's flow control vs congestion control — which layer of your design is which?",
    ],
    rubric: [
      { criterion: "Capacity arithmetic", description: "Inflow/outflow/growth computed; time-to-OOM estimated with object-overhead honesty." },
      { criterion: "Full-queue taxonomy", description: "Block vs shed vs spill with system-wide consequences of each." },
      { criterion: "Layered design", description: "Bounded queue + shedding + breaker + spill + timeouts composed coherently; sender-retry contract exploited." },
      { criterion: "Operability", description: "The four health metrics; sizing formula; drain plan awareness." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/",
      "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "chatty-enrichment-loop",
    title: "The Enrichment Loop Making 40,000 API Calls",
    type: "optimization",
    difficulty: "medium",
    topics: ["api-design", "batching", "caching", "concurrency", "python"],
    targetRoles: ["backend_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "A report generator enriches 40k transactions with merchant data from an internal service (p50 = 25 ms). It runs serially: 40,000 × 25 ms ≈ 17 minutes, and the merchant service team is asking why you're their top caller (they see 40k req/run, for ~800 distinct merchants).\n\n1. Three independent fixes: dedupe/cache, batch endpoint, bounded concurrency. Quantify each alone and combined.\n2. The merchant service has no batch endpoint. Make the case for one — what should its contract look like (limits, partial failures, ordering)?\n3. What client-side discipline prevents you from DDoSing them once you add concurrency?",
    starterCode:
      "def enrich(transactions):\n    out = []\n    for tx in transactions:                     # 40,000 iterations\n        merchant = merchant_api.get(tx.merchant_id)    # 25ms each, mostly repeats\n        out.append({**tx.as_dict(), 'merchant': merchant})\n    return out\n",
    hints: [
      "40k calls for 800 distinct ids: the duplication factor is 50×. What's the simplest possible fix, and why does it also help the merchant team's cache hit rate… or does it?",
      "Batch endpoint: GET /merchants?ids=… or POST with a body; page the id list into chunks of ~100. 800 ids → 8 calls.",
      "Concurrency without a batch endpoint: a semaphore-bounded pool at, say, 20 in flight. Compute the runtime — and then compute the req/s you're now sending them. That number is why you ask before you turn it on.",
    ],
    solutionOutline:
      "Fix 1 — dedupe first (one dict): fetch each distinct id once → 800 calls ≈ 20 s serial. Trivial, no API changes, biggest single win (50×). Fix 2 — batch endpoint: 800 ids in pages of 100 → 8 calls ≈ fractions of a second plus server-side fan-out; also collapses *their* per-request overhead (auth, routing, connection). Contract for the batch API: explicit max ids per call (documented, enforced with 413/422), response as a map id→merchant (never order-dependent arrays), missing ids reported per-id (partial success; a 404-able id must not fail the batch), per-id error entries, and idempotent GET-or-POST-with-body semantics + cacheability headers. Fix 3 — bounded concurrency (when batch isn't available): semaphore of 20 → 800 × 25 ms / 20 ≈ 1 s; BUT that's 800 req/s at their service — coordinate rate limits before deploying (top-caller complaint says they're capacity-sensitive). Combined ideal: dedupe → batch pages of 100 → 4-8 concurrent batch calls ≈ sub-second end-to-end and ~8 requests on their side. Client discipline: rate limiter matched to their published quota, timeout + jittered retries with a retry budget, circuit breaker, and a User-Agent/team header so they can attribute traffic (the social layer of distributed systems). If the report tolerates staleness, a short-TTL local cache across runs drops steady-state calls to near zero.",
    fullSolution:
      "\`\`\`python\nimport asyncio\n\nBATCH_SIZE = 100\nMAX_CONCURRENT = 5\n\nasync def enrich(transactions):\n    distinct = {tx.merchant_id for tx in transactions}          # 800 ids\n    merchants: dict = {}\n    sem = asyncio.Semaphore(MAX_CONCURRENT)\n\n    async def fetch_page(ids):\n        async with sem:\n            resp = await merchant_api.get_batch(ids)             # map id -> merchant\n            merchants.update(resp['found'])\n            for mid in resp['missing']:\n                merchants[mid] = None                            # explicit absence\n\n    ids = list(distinct)\n    pages = [ids[i:i + BATCH_SIZE] for i in range(0, len(ids), BATCH_SIZE)]\n    await asyncio.gather(*(fetch_page(p) for p in pages))\n\n    return [{**tx.as_dict(), 'merchant': merchants[tx.merchant_id]}\n            for tx in transactions]\n\`\`\`\n\nRuntime math to narrate: 17 min → 20 s (dedupe) → ~1-2 s (batch+concurrency); their load: 40,000 → 8 requests. The best optimizations here were relational, not technical: knowing your duplication factor and negotiating a batch contract.",
    commonMistakes: [
      "Reaching for concurrency first: 40k calls at 50 in flight is a 1,250 req/s self-inflicted DDoS of an internal service — faster AND worse.",
      "Dedupe with a per-loop cache but still calling inside the loop for cache misses one at a time when batching exists.",
      "Batch API designed as ordered arrays (breaks on missing ids) or all-or-nothing failure semantics.",
      "No cap negotiation: client-side concurrency and their rate limits set independently.",
      "Ignoring explicit absence — merchants that 404 must be distinguishable from 'not fetched'.",
    ],
    followUpQuestions: [
      "The merchant data changes rarely. Design the cross-run cache: TTL, invalidation signal, and what staleness does to the report's correctness contract.",
      "Their batch endpoint occasionally returns 429 mid-run. What's your partial-progress story — checkpoint and resume, or all-or-nothing?",
      "Generalize: what three questions do you ask before adding client-side concurrency against ANY internal service?",
    ],
    rubric: [
      { criterion: "Fix ordering", description: "Dedupe → batch → concurrency, quantified individually and combined." },
      { criterion: "Batch contract design", description: "Limits, map-shaped responses, per-id partial failures, explicit absence." },
      { criterion: "Neighborly discipline", description: "Rate coordination, retry budgets, breaker, attribution headers." },
      { criterion: "Quantification", description: "Runtime and load numbers at each step, both sides of the API." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "log-topk-full-sort",
    title: "Top 100 Error Signatures Without Sorting 2 TB",
    type: "optimization",
    difficulty: "medium",
    topics: ["streaming", "heap", "top-k", "logging", "memory"],
    targetRoles: ["backend_swe", "infrastructure_swe", "platform_engineer"],
    companyStyles: ["infra_heavy", "big_tech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "A daily job finds the top 100 error signatures across ~2 TB of gzipped logs (≈6B lines, ~40M distinct signatures). Current approach: parse everything into a list, sort by count, take 100. It needs a 900 GB high-mem instance and 7 hours.\n\n1. Separate the two problems hiding in here: exact counting at 40M cardinality, and top-k selection. Which one actually needs the memory?\n2. Rewrite with (a) exact counting + heap selection and (b) bounded-memory approximate counting (describe Count-Min Sketch / space-saving conceptually). When is approximate acceptable?\n3. This runs on one machine. At what point do you shard, and what's the merge step for both exact and approximate variants?",
    starterCode:
      "def top_errors(log_files):\n    entries = []\n    for f in log_files:\n        for line in gzip_lines(f):\n            sig = signature(line)          # template-normalize\n            entries.append(sig)             # 6B strings in a list!\n    counts = {}\n    for sig in entries:\n        counts[sig] = counts.get(sig, 0) + 1\n    ranked = sorted(counts.items(), key=lambda kv: -kv[1])   # 40M-item sort\n    return ranked[:100]\n",
    hints: [
      "The 6-billion-entry list exists only to be counted — count while streaming and it disappears. What's left is 40M counter entries: estimate that memory honestly (~4-6 GB with Python overhead; fine on a normal box).",
      "Sorting 40M items to take 100 is O(n log n) for an O(n log k) job: heapq.nlargest(100, counts.items(), key=...) never holds more than 100 candidates.",
      "If even 40M counters won't fit (say cardinality explodes): Count-Min Sketch gives overestimates with bounded error; Space-Saving/Misra-Gries tracks a fixed number of candidates with provable top-k guarantees under skew. Log error distributions are heavily skewed — which is exactly when these work well.",
    ],
    solutionOutline:
      "Decompose: (1) The list of 6B raw entries is pure waste — stream lines through the counter without materializing (memory drops from ~900 GB to the counter's size). (2) Exact counting at 40M distinct sigs: a dict of str→int at ~100-150 B/entry ≈ 4-6 GB — fits on a standard instance; use collections.Counter. (3) Selection: heapq.nlargest(100, ...) = O(n log 100) instead of full sort. Also parallelize decompression/parsing across files with multiprocessing (gzip is CPU-bound; the 7 hours is mostly gunzip+regex — measure!). Approximate option when cardinality is unbounded: Space-Saving with ~10k slots — maintains candidate top items with guaranteed inclusion of anything above n/slots frequency; Count-Min Sketch + heap: CMS answers frequency estimates (always ≥ true), heap keeps the running top-100 by estimated count. Acceptable when: ranking stability matters more than exact counts (ops triage), error is bounded and stated, and the tail (rank 90-100 fuzziness) doesn't drive decisions. Sharding: shard by *signature hash* (not by file!) so each signature's total lives on one worker → each worker's local top-100 is globally correct for its shard; merge = union of shard top-100s, take top 100 (exact). If sharded by file instead, local top-100s are NOT sufficient (a signature can be #101 everywhere yet global #1) — the classic distributed top-k trap; fixing it requires sending full counters or a second pass with candidate sets. CMS variant merges by summing sketches (they're linear) — the property that makes sketches distributed-friendly.",
    fullSolution:
      "\`\`\`python\nimport heapq\nfrom collections import Counter\nfrom multiprocessing import Pool\n\ndef count_file(path) -> Counter:\n    counts = Counter()\n    for line in gzip_lines(path):\n        counts[signature(line)] += 1\n    return counts\n\ndef top_errors(log_files, k=100):\n    totals = Counter()\n    with Pool() as pool:                       # parallel gunzip+parse\n        for partial in pool.imap_unordered(count_file, log_files):\n            totals.update(partial)              # merge exact counters\n    return heapq.nlargest(k, totals.items(), key=lambda kv: kv[1])\n\`\`\`\n\nExpected: memory ~6 GB, runtime dominated by parallel decompression (7 h → well under 1 h on 16 cores). The distributed-top-k trap deserves restating in review: **per-file top-k lists cannot be merged into a correct global top-k; per-signature-shard ones can.** That single sentence is the difference between a right and subtly-wrong pipeline.",
    commonMistakes: [
      "Materializing raw entries (the 900 GB) — counting is a streaming operation.",
      "Full sort for top-100 (n log n vs n log k — at 40M items it's real time, not pedantry).",
      "Sharding by file and merging local top-100s — the subtly-wrong distributed algorithm.",
      "Reaching for approximate sketches when exact fits in 6 GB (complexity without need); or using CMS without reporting its error bound.",
      "Not profiling: assuming counting is the bottleneck when gunzip+regex parsing usually is.",
    ],
    followUpQuestions: [
      "Make it incremental: logs arrive hourly and the daily job should reuse hourly work. What's the aggregation hierarchy and what breaks for top-k?",
      "Explain Space-Saving's guarantee precisely: when is an item *guaranteed* to be in the summary?",
      "The same requirement but as a live dashboard (top errors, last 5 min, updated every second). What changes end-to-end?",
    ],
    rubric: [
      { criterion: "Problem decomposition", description: "Separates streaming-count from top-k selection; kills the materialization." },
      { criterion: "Memory arithmetic", description: "Estimates counter memory credibly; knows exact fits here." },
      { criterion: "Approximate literacy", description: "CMS/Space-Saving mechanics, error character, and when they're warranted." },
      { criterion: "Distributed correctness", description: "Shard-by-key vs shard-by-file merge semantics — states the trap." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/library/heapq.html",
      "https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
]);
