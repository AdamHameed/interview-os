import { defineProblems, ORIGINAL_NOTE, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE, OSS_INSPIRED_NOTE } from "./types";

export const dsaProblems = defineProblems([
  {
    slug: "clean-request-window",
    title: "Longest Clean Request Window",
    type: "dsa",
    difficulty: "medium",
    topics: ["sliding-window", "hash-map", "streaming"],
    targetRoles: ["backend_swe", "new_grad_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "You are auditing an API gateway log. Each entry is \`(timestamp, client_id, idempotency_key)\`, already sorted by timestamp.\n\nA window of consecutive entries is **clean** if no client appears twice within it — *except* that entries sharing the same \`(client_id, idempotency_key)\` pair are retries of one logical request and together count as a single appearance.\n\nReturn the length (in entries) of the longest clean window.",
    context:
      "This is the classic 'longest substring without repeating characters' pattern, but the deduplication rule is what interviewers use to separate people who memorized the pattern from people who can adapt it.",
    constraints:
      "- 1 ≤ n ≤ 10^6 entries\n- Timestamps are non-decreasing\n- Target O(n) time, O(k) space where k = distinct clients in the window\n- A client may retry with the same idempotency key many times, then later send a *different* key — the different key is a second appearance.",
    starterCode:
      "def longest_clean_window(entries: list[tuple[int, str, str]]) -> int:\n    \"\"\"entries: (timestamp, client_id, idempotency_key), sorted by timestamp.\n\n    Returns the length of the longest clean window (see problem statement).\n    \"\"\"\n    ...\n",
    tests: [
      { name: "no duplicates", input: "[(1,'a','k1'), (2,'b','k2'), (3,'c','k3')]", expected: "3" },
      {
        name: "retries collapse",
        input: "[(1,'a','k1'), (2,'a','k1'), (3,'b','k2')]",
        expected: "3",
        note: "Both 'a' entries share an idempotency key, so the whole log is clean.",
      },
      {
        name: "same client, new key breaks window",
        input: "[(1,'a','k1'), (2,'a','k2'), (3,'b','k3')]",
        expected: "2",
      },
      {
        name: "retry then new key",
        input: "[(1,'a','k1'), (2,'a','k1'), (3,'a','k2'), (4,'b','k9')]",
        expected: "2",
        note: "Any window containing both an a-k1 entry and the a-k2 entry has two logical 'a' requests → dirty. Best clean windows: entries 1–2 (retries collapse) or entries 3–4. A retry does not extend a window across a key change.",
      },
    ],
    hints: [
      "Start from the standard two-pointer sliding window for 'no repeated element'. What exactly is the 'element' here — the client, or something finer-grained?",
      "Track, per client inside the window, the *set of distinct idempotency keys* (or just: the last key and a count of distinct keys). The window is dirty when some client has ≥ 2 distinct keys in it.",
      "When you shrink from the left, you must know whether removing one entry removes a whole logical request. A per-client counter of entries *per key* lets you decrement correctly.",
    ],
    solutionOutline:
      "Two pointers \`left\`/\`right\`. Maintain \`entries_per_key[(client, key)]\` counts and \`distinct_keys[client]\` counts, plus \`dirty_clients\` = number of clients with ≥2 distinct keys in the window. Advancing \`right\`: increment the entry count; if a (client, key) pair appears for the first time, increment that client's distinct-key count; if that count hits 2, increment \`dirty_clients\`. While \`dirty_clients > 0\`, advance \`left\` symmetrically (when a pair's entry count hits 0, decrement the client's distinct-key count; when it drops to 1, decrement \`dirty_clients\`). Answer is the max \`right - left + 1\` observed while clean. Every entry enters and leaves the window once → O(n).",
    fullSolution:
      "\`\`\`python\nfrom collections import defaultdict\n\ndef longest_clean_window(entries):\n    entries_per_key = defaultdict(int)   # (client, key) -> count in window\n    distinct_keys = defaultdict(int)     # client -> distinct keys in window\n    dirty_clients = 0\n    best = 0\n    left = 0\n    for right, (_, client, key) in enumerate(entries):\n        pair = (client, key)\n        entries_per_key[pair] += 1\n        if entries_per_key[pair] == 1:\n            distinct_keys[client] += 1\n            if distinct_keys[client] == 2:\n                dirty_clients += 1\n        while dirty_clients > 0:\n            _, lc, lk = entries[left]\n            lpair = (lc, lk)\n            entries_per_key[lpair] -= 1\n            if entries_per_key[lpair] == 0:\n                del entries_per_key[lpair]\n                distinct_keys[lc] -= 1\n                if distinct_keys[lc] == 1:\n                    dirty_clients -= 1\n                if distinct_keys[lc] == 0:\n                    del distinct_keys[lc]\n            left += 1\n        best = max(best, right - left + 1)\n    return best\n\`\`\`\n\nWalking the fourth test case: after entry 3 (\`a,k2\`) the window \`[a-k1, a-k1, a-k2]\` has client \`a\` with 2 distinct keys → shrink until one key's entries are fully evicted (both \`k1\` entries leave), leaving \`[a-k2]\`, then extend with \`b\` → clean window length 2. The longest clean window overall is 2 from entries (1,2) — retries collapsing — and 2 from (3,4). This is precisely the subtlety: a retry does **not** extend a window across a key change.",
    commonMistakes: [
      "Treating any repeat of the client as a violation — that fails the retry test and is the memorized-pattern trap.",
      "Deduplicating by (client, key) globally instead of within the current window, which corrupts counts after the left pointer moves.",
      "Decrementing the distinct-key count on every left-pointer move instead of only when the last entry of that (client, key) pair leaves the window.",
      "Using nested loops to re-scan the window on each violation, degrading to O(n²) on adversarial input.",
    ],
    followUpQuestions: [
      "The log is now a stream that never ends and you must report the longest clean window over the trailing 5 minutes. What changes?",
      "Memory is capped and client cardinality is huge. Which structure would you accept becoming approximate, and what does that do to correctness guarantees?",
      "How would you unit-test this? Name the three test cases you would write first.",
    ],
    rubric: [
      { criterion: "Pattern adaptation", description: "Recognizes the base sliding-window pattern quickly, then adapts the invariant to (client, key) semantics instead of forcing the memorized version." },
      { criterion: "Invariant correctness", description: "Maintains window state that is provably correct under shrink (counts decremented at the right granularity)." },
      { criterion: "Complexity", description: "Achieves O(n) with each pointer moving at most n times, and can argue why." },
      { criterion: "Edge cases", description: "Handles retry-then-new-key, all-same-client, and empty input without prompting." },
      { criterion: "Communication", description: "States the clean-window invariant out loud before coding; walks a trap test case." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/",
      "https://docs.python.org/3/library/collections.html#collections.defaultdict",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "top-k-failing-endpoints",
    title: "Top-K Failing Endpoints from an Error Stream",
    type: "dsa",
    difficulty: "medium",
    topics: ["heap", "hash-map", "streaming", "top-k"],
    targetRoles: ["backend_swe", "infrastructure_swe", "new_grad_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "Error events stream in as \`(endpoint, count)\` increments. Implement:\n\n- \`record(endpoint: str, count: int)\` — add \`count\` errors to an endpoint\n- \`top_k(k: int) -> list[tuple[str, int]]\` — the k endpoints with the most total errors, ties broken alphabetically\n\n\`record\` is called ~10^6 times per minute; \`top_k\` a few times per second with small k (≤ 20). Optimize for that ratio.",
    context:
      "Dashboards and alerting systems do exactly this. The interviewer wants you to notice the asymmetry between write volume and read volume and choose where the work happens.",
    constraints:
      "- Endpoint cardinality can reach 10^6\n- \`record\` should be O(1)\n- \`top_k\` may be O(m) or better where m = distinct endpoints, but discuss the trade-offs\n- Single process; concurrency is a follow-up, not a requirement",
    starterCode:
      "class ErrorTracker:\n    def __init__(self) -> None:\n        ...\n\n    def record(self, endpoint: str, count: int) -> None:\n        ...\n\n    def top_k(self, k: int) -> list[tuple[str, int]]:\n        ...\n",
    tests: [
      { name: "basic", input: "record('/a',3); record('/b',5); top_k(1)", expected: "[('/b', 5)]" },
      { name: "tie alphabetical", input: "record('/b',2); record('/a',2); top_k(2)", expected: "[('/a', 2), ('/b', 2)]" },
      { name: "k larger than endpoints", input: "record('/a',1); top_k(5)", expected: "[('/a', 1)]" },
    ],
    hints: [
      "With 10^6 records/min and a handful of reads/sec, which operation can afford to do real work?",
      "A dict of counts makes record O(1). For top_k, \`heapq.nsmallest\` with a composite key gives k·log m-ish behavior without sorting everything.",
      "Watch the tie-break direction: you want max count but min alphabetical — negate one component or build a key tuple carefully.",
    ],
    solutionOutline:
      "Keep \`counts: dict[str, int]\`. \`record\` is a dict increment — O(1). \`top_k\` uses \`heapq.nsmallest(k, counts.items(), key=lambda kv: (-kv[1], kv[0]))\`, which is O(m log k) and allocates only k slots. Discuss the alternative — maintaining a continuously-sorted structure on every write — and why it loses here: you'd pay log m a million times a minute to save work a few times a second. If top_k had to be O(k) at very high read rates, mention bucketed counts or a periodically rebuilt snapshot instead.",
    fullSolution:
      "\`\`\`python\nimport heapq\nfrom collections import defaultdict\n\nclass ErrorTracker:\n    def __init__(self):\n        self._counts: dict[str, int] = defaultdict(int)\n\n    def record(self, endpoint: str, count: int) -> None:\n        self._counts[endpoint] += count\n\n    def top_k(self, k: int) -> list[tuple[str, int]]:\n        return heapq.nsmallest(\n            k,\n            self._counts.items(),\n            key=lambda kv: (-kv[1], kv[0]),\n        )\n\`\`\`\n\nWhy \`nsmallest\` with a negated count instead of \`nlargest\`: \`nlargest\` on \`(count, name)\` would break ties by *reverse* alphabetical order. Encoding the exact ordering into one key tuple keeps the tie-break correct and is the detail most candidates fumble.",
    commonMistakes: [
      "Maintaining a heap of all endpoints updated on every record — heaps don't support decrease/increase-key cleanly and the write path becomes the hot path.",
      "Sorting the entire dict on every top_k call: O(m log m) with m = 10^6 endpoints for k = 5 results.",
      "Getting the tie-break backwards by using nlargest on (count, name) tuples.",
      "Forgetting that k may exceed the number of distinct endpoints.",
    ],
    followUpQuestions: [
      "Now make it top-k over the trailing 5 minutes only. What structure tracks expiry without unbounded memory?",
      "Memory is capped at a few MB but endpoint cardinality is 10^8. What approximate structure would you reach for, and what error does it introduce?",
      "Two threads call record concurrently. What is the smallest change that keeps counts correct, and what does it cost?",
    ],
    rubric: [
      { criterion: "Workload analysis", description: "Explicitly reasons about write-heavy/read-light asymmetry before choosing a structure." },
      { criterion: "Correct top-k", description: "Produces correct results including the alphabetical tie-break." },
      { criterion: "Complexity trade-offs", description: "Can state costs of at least two designs and why the chosen one fits the workload." },
      { criterion: "API hygiene", description: "Handles k > m, zero counts, and repeated endpoints cleanly." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://docs.python.org/3/library/heapq.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "feature-rollout-reachability",
    title: "Feature Rollout Reachability with Version Gates",
    type: "dsa",
    difficulty: "medium",
    topics: ["graphs", "bfs", "dependency-resolution"],
    targetRoles: ["backend_swe", "infrastructure_swe", "platform_engineer", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "A platform has services connected by directed call edges. Each edge \`(u, v, min_version)\` means: a request can flow from \`u\` to \`v\` only if \`u\` is running at least \`min_version\`.\n\nGiven the current \`version[service]\` map, the edge list, and a start service, return the set of services reachable from the start under the version gates.\n\nThen answer part two: given a target service T that must become reachable, return the *minimum single-service version upgrade* (service, new_version) that achieves it, or None if no single upgrade suffices.",
    context:
      "Part one is a BFS warm-up. Part two is where the signal is: candidates must realize the search space is small enough to try candidate upgrades, but only upgrades that are 'on the frontier' matter.",
    constraints:
      "- ≤ 10^4 services, ≤ 10^5 edges\n- Versions are integers\n- Part two: exactly one service may be upgraded, to the smallest version that works\n- Prefer clarity over cleverness; part two may reuse part one",
    starterCode:
      "def reachable(versions: dict[str, int], edges: list[tuple[str, str, int]], start: str) -> set[str]:\n    ...\n\ndef min_single_upgrade(\n    versions: dict[str, int],\n    edges: list[tuple[str, str, int]],\n    start: str,\n    target: str,\n) -> tuple[str, int] | None:\n    ...\n",
    tests: [
      {
        name: "gated edge blocks",
        input: "versions={'a':1,'b':1}, edges=[('a','b',2)], start='a'",
        expected: "reachable == {'a'}",
      },
      {
        name: "upgrade frontier service",
        input: "same graph, target='b'",
        expected: "min_single_upgrade == ('a', 2)",
      },
    ],
    hints: [
      "Part one: plain BFS, but the edge relaxation condition checks the *source* service's version against the edge gate.",
      "Part two: only services already reachable can be usefully upgraded (upgrading an unreachable service changes nothing about edges out of it that you can reach). Which of their outgoing edges are currently blocked?",
      "For each blocked edge (u, v, g) with u reachable, upgrading u to g might unlock a whole new region. Re-run reachability per candidate, but dedupe candidates: for a given u, only the smallest gate that leads somewhere new matters first.",
    ],
    solutionOutline:
      "Part 1: BFS from start; traverse edge (u,v,g) iff versions[u] ≥ g. O(V+E).\n\nPart 2: compute R = reachable(start). If target ∈ R, no upgrade needed (return None or (any, current) per spec — state your assumption). Collect candidate upgrades: for each edge (u,v,g) with u ∈ R and versions[u] < g, candidate is (u, g). Sort candidates by version delta (g - versions[u]) or by g — clarify with the interviewer what 'minimum upgrade' means; here: smallest new_version, tie-broken by service name. For each candidate in order, run reachability with the patched version and check target. With ≤10^5 edges and candidates bounded by blocked frontier edges, worst case is O(C·(V+E)); note it and mention memoization or reverse-reachability pruning (only candidates whose unlocked edge leads into the reverse-reachable set of T can work) as the optimization.",
    fullSolution:
      "\`\`\`python\nfrom collections import defaultdict, deque\n\ndef _bfs(adj, versions, start):\n    seen = {start}\n    q = deque([start])\n    while q:\n        u = q.popleft()\n        for v, gate in adj[u]:\n            if versions[u] >= gate and v not in seen:\n                seen.add(v)\n                q.append(v)\n    return seen\n\ndef reachable(versions, edges, start):\n    adj = defaultdict(list)\n    for u, v, g in edges:\n        adj[u].append((v, g))\n    return _bfs(adj, versions, start)\n\ndef min_single_upgrade(versions, edges, start, target):\n    adj = defaultdict(list)\n    for u, v, g in edges:\n        adj[u].append((v, g))\n    base = _bfs(adj, versions, start)\n    if target in base:\n        return None  # already reachable; stated assumption\n    # Reverse-reachability prune: which nodes can reach target at all (ignoring gates)?\n    radj = defaultdict(list)\n    for u, v, _ in edges:\n        radj[v].append(u)\n    can_reach_target = _bfs(radj, defaultdict(lambda: 10**18), target)\n    candidates = sorted(\n        {(g, u) for u in base for v, g in adj[u]\n         if versions[u] < g and v in can_reach_target},\n    )\n    for g, u in candidates:\n        patched = dict(versions)\n        patched[u] = g\n        if target in _bfs(adj, patched, start):\n            return (u, g)\n    return None\n\`\`\`\n\nThe reverse-reachability prune reuses \`_bfs\` with gates disabled (every version 'infinite'). Stating that reuse out loud is a strong signal.",
    commonMistakes: [
      "Checking the *destination* service's version against the gate — read the edge semantics carefully.",
      "In part two, trying to upgrade every service to every possible version instead of restricting to blocked frontier edges.",
      "Forgetting that upgrading u may unlock several edges from u at once (patch the version map, don't just add one edge).",
      "Not clarifying what 'minimum upgrade' means (smallest delta? smallest resulting version?) before coding.",
    ],
    followUpQuestions: [
      "Allow upgrading up to two services. Does your approach survive? What's the complexity?",
      "Edges now also require the *destination* to be at least some version. What changes?",
      "How would you expose this as an internal tool — what's the API and what do you precompute?",
    ],
    rubric: [
      { criterion: "Graph modeling", description: "Translates the version-gate rule into a correct edge relaxation condition." },
      { criterion: "Search-space insight", description: "Identifies that only reachable-frontier blocked edges are candidate upgrades." },
      { criterion: "Pruning", description: "Mentions or implements reverse-reachability (or equivalent) to cut candidates." },
      { criterion: "Assumption management", description: "Surfaces ambiguity ('minimum upgrade', target already reachable) instead of silently deciding." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://cp-algorithms.com/graph/breadth-first-search.html"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "maintenance-window-merge",
    title: "Merge Maintenance Windows Across Teams",
    type: "dsa",
    difficulty: "easy",
    topics: ["intervals", "sorting"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 20,
    language: "python",
    prompt:
      "Each team submits maintenance windows as \`(start_minute, end_minute)\` half-open intervals \`[start, end)\`. Produce the merged list of blackout windows, where windows that overlap **or touch exactly** (one ends at minute t, another starts at minute t) merge into one.\n\nAlso return the maximum number of teams simultaneously in maintenance at any minute.",
    context:
      "Interval merging is a filter question: fast to state, and the edge cases (touching intervals, half-open semantics, duplicates) show whether you think in invariants or in examples.",
    constraints:
      "- ≤ 10^5 windows, minutes fit in 32-bit ints\n- Input is unsorted and may contain duplicate or zero-length windows (start == end) — define and defend your handling\n- O(n log n) expected",
    starterCode:
      "def merge_windows(windows: list[tuple[int, int]]) -> tuple[list[tuple[int, int]], int]:\n    \"\"\"Returns (merged_windows, max_concurrent_teams).\"\"\"\n    ...\n",
    tests: [
      { name: "touching merge", input: "[(0,10),(10,20)]", expected: "([(0,20)], 1)" },
      { name: "overlap", input: "[(0,10),(5,15),(20,25)]", expected: "([(0,15),(20,25)], 2)" },
      { name: "zero-length dropped", input: "[(5,5),(1,2)]", expected: "([(1,2)], 1)" },
    ],
    hints: [
      "Sort by start. When does the next window extend the current merged one, given half-open semantics and the 'touching merges' rule?",
      "Max concurrency is a different computation from merging — think sweep line: +1 at each start, -1 at each end, sorted with a careful tie rule.",
      "With half-open intervals, an end at t and a start at t do NOT overlap for concurrency purposes — process ends before starts at the same minute.",
    ],
    solutionOutline:
      "Merging: drop zero-length windows (or keep them — state the choice), sort by start, then fold: extend the current window when \`next.start <= current.end\` (the ≤ implements touch-merging under half-open semantics). Concurrency: build events (+1 at start, −1 at end), sort by (minute, delta) so −1 sorts before +1 at the same minute, sweep and track the running max. Both O(n log n). The subtle point candidates miss: the merge rule uses ≤ while the concurrency tie rule treats the same minute as non-overlapping — same timestamps, two different semantics, both correct for their purpose.",
    fullSolution:
      "\`\`\`python\ndef merge_windows(windows):\n    real = [(s, e) for s, e in windows if e > s]\n    real.sort()\n    merged = []\n    for s, e in real:\n        if merged and s <= merged[-1][1]:\n            merged[-1] = (merged[-1][0], max(merged[-1][1], e))\n        else:\n            merged.append((s, e))\n\n    events = []\n    for s, e in real:\n        events.append((s, 1))\n        events.append((e, -1))\n    events.sort(key=lambda t: (t[0], t[1]))  # ends (-1) before starts (+1)\n    cur = best = 0\n    for _, delta in events:\n        cur += delta\n        best = max(best, cur)\n    return merged, best\n\`\`\`",
    commonMistakes: [
      "Using < instead of ≤ in the merge condition, so touching windows don't merge.",
      "Sorting concurrency events with starts before ends at the same minute, over-counting by 1 at boundaries.",
      "Mutating tuples or forgetting max() when the next interval is fully contained in the current one.",
      "Silently keeping zero-length windows and letting them distort concurrency counts.",
    ],
    followUpQuestions: [
      "Windows now arrive online, one at a time, and you must answer 'merged view' queries between insertions. What structure keeps that efficient?",
      "Windows carry a team id, and touching windows only merge if they belong to the same team. What changes?",
      "How does this generalize to calendar bookings where you must *reject* an insert that would exceed k concurrent windows?",
    ],
    rubric: [
      { criterion: "Boundary semantics", description: "Handles half-open intervals and the touch-merge rule with the correct comparison operators." },
      { criterion: "Sweep-line correctness", description: "Gets the event tie-breaking right and can explain why." },
      { criterion: "Degenerate input", description: "Makes an explicit, defended decision about zero-length and duplicate windows." },
      { criterion: "Clean fold", description: "Merging loop is a simple fold without index gymnastics." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://www.techinterviewhandbook.org/algorithms/interval/"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "cooldown-task-scheduler",
    title: "Priority Scheduler with Per-Type Cooldowns",
    type: "dsa",
    difficulty: "medium",
    topics: ["heap", "scheduling", "simulation", "greedy"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "A single worker executes tasks. Each task has \`(task_id, type, priority)\`. Rules:\n\n1. Higher priority runs first; ties by insertion order (FIFO).\n2. After a task of type T finishes, no task of type T may start for the next \`cooldown[T]\` ticks. Each task takes exactly 1 tick.\n3. If every pending task is cooling down, the worker idles for a tick.\n\nGiven the initial task list and the cooldown table, return the execution timeline: a list where index i is the task_id run at tick i, or \`None\` for idle ticks.",
    context:
      "This is a simulation-with-two-heaps problem dressed as an infra scheduler. It resembles rate-limited job runners: highest-priority work that is currently throttled must *not* block eligible lower-priority work.",
    constraints:
      "- ≤ 10^5 tasks, ≤ 100 types\n- Aim for O(n log n); an O(n · types) scan per tick is acceptable to start but discuss its limits\n- Clarify: a cooling-down high-priority task does NOT block others — the worker picks the best *eligible* task",
    starterCode:
      "def schedule(tasks: list[tuple[str, str, int]], cooldown: dict[str, int]) -> list[str | None]:\n    \"\"\"tasks: (task_id, type, priority) in insertion order. 1 task = 1 tick.\"\"\"\n    ...\n",
    tests: [
      {
        name: "cooldown forces interleave",
        input: "tasks=[('t1','A',9),('t2','A',8),('t3','B',1)], cooldown={'A':2,'B':0}",
        expected: "['t1', 't3', None, 't2']",
      },
      { name: "no cooldown", input: "tasks=[('a','X',1),('b','X',2)], cooldown={'X':0}", expected: "['b', 'a']" },
    ],
    hints: [
      "Two pools: eligible tasks (a max-heap by priority, then insertion index) and cooling types (a min-heap by wake-up tick, or a per-type wake tick map).",
      "At each tick, first move every type whose cooldown expired back to eligible, then pop the best eligible task whose type is not cooling.",
      "If the best task's type is cooling but others are eligible, you must skip *only* that type — a heap keyed by priority alone forces pop-and-stash: pop blocked tasks into a side list, run the first eligible, push the stash back (or keep per-type queues + a heap of type-heads).",
    ],
    solutionOutline:
      "Cleanest structure: one FIFO priority list per type (types are ≤100), plus a max-heap of type *heads*: (−priority, insertion_index, type). A type is in the head-heap only when it is not cooling and has pending tasks. Tick loop: (1) wake any types whose cooldown expired (their wake tick ≤ now) and push their heads; (2) if head-heap empty → idle tick; else pop the best head, emit its task, set the type's wake tick = now + cooldown + 1, and do not re-add the type until it wakes. When a type wakes, push its *current* head (priority may differ from the task just run). Each task is pushed/popped O(1) times → O(n log types). The trap: after running a task of type T, T's next task must not re-enter the heap until the cooldown expires, even if it's the global max priority.",
    fullSolution:
      "\`\`\`python\nimport heapq\nfrom collections import defaultdict, deque\n\ndef schedule(tasks, cooldown):\n    per_type = defaultdict(deque)  # type -> deque of (-prio, idx, task_id)\n    for idx, (tid, ttype, prio) in enumerate(tasks):\n        per_type[ttype].append((-prio, idx, tid))\n    for q in per_type.values():\n        q_sorted = sorted(q)          # priority order within type, FIFO ties\n        q.clear(); q.extend(q_sorted)\n\n    ready = []  # heap of (best_prio_neg, idx, type)\n    for ttype, q in per_type.items():\n        p, i, _ = q[0]\n        heapq.heappush(ready, (p, i, ttype))\n    sleeping = []  # heap of (wake_tick, type)\n    timeline = []\n    remaining = len(tasks)\n    tick = 0\n    while remaining:\n        while sleeping and sleeping[0][0] <= tick:\n            _, ttype = heapq.heappop(sleeping)\n            if per_type[ttype]:\n                p, i, _ = per_type[ttype][0]\n                heapq.heappush(ready, (p, i, ttype))\n        if not ready:\n            timeline.append(None)\n            tick += 1\n            continue\n        p, i, ttype = heapq.heappop(ready)\n        head = per_type[ttype][0]\n        if (head[0], head[1]) != (p, i):\n            # stale heap entry; push the real head and retry this tick\n            heapq.heappush(ready, (head[0], head[1], ttype))\n            continue\n        _, _, tid = per_type[ttype].popleft()\n        timeline.append(tid)\n        remaining -= 1\n        cd = cooldown.get(ttype, 0)\n        if per_type[ttype]:\n            if cd > 0:\n                heapq.heappush(sleeping, (tick + cd + 1, ttype))\n            else:\n                np, ni, _ = per_type[ttype][0]\n                heapq.heappush(ready, (np, ni, ttype))\n        tick += 1\n    return timeline\n\`\`\`\n\nNote the pre-sort inside each type queue: the spec says priority-then-FIFO globally, so within a type the same order applies. Idle ticks only advance time; the sleeping heap wakes types lazily.",
    commonMistakes: [
      "Letting a cooling type's task sit in the main heap and block the worker — the spec says pick the best *eligible* task.",
      "Off-by-one on the cooldown: 'no start for the next c ticks' after finishing at tick t means next start ≥ t + c + 1.",
      "Forgetting FIFO tie-break on equal priorities (heap needs the insertion index).",
      "Simulating minute-by-minute even across long idle gaps instead of jumping to the next wake tick (fine here since tasks are 1 tick, but candidates should notice it)."
    ],
    followUpQuestions: [
      "Tasks now have durations. Which parts of your design survive, and where does 'cooldown starts at finish' bite?",
      "Add N parallel workers. What breaks first — the heap, the cooldown bookkeeping, or the FIFO guarantee?",
      "How would you test the tie-break and off-by-one behavior? Write the two table-driven cases you'd start with.",
    ],
    rubric: [
      { criterion: "State decomposition", description: "Separates 'eligible' from 'cooling' cleanly rather than one overloaded heap." },
      { criterion: "Off-by-one rigor", description: "Gets the wake tick arithmetic right and tests it." },
      { criterion: "Eligibility semantics", description: "Cooling high-priority work never blocks eligible work." },
      { criterion: "Complexity", description: "Avoids per-tick full scans; can state the O(n log types) bound." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://docs.python.org/3/library/heapq.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "rolling-window-max-latency",
    title: "Rolling Maximum Latency with a Monotonic Deque",
    type: "dsa",
    difficulty: "medium",
    topics: ["deque", "sliding-window", "monotonic-queue", "streaming"],
    targetRoles: ["backend_swe", "quant_developer", "hft_swe", "new_grad_swe"],
    companyStyles: ["hft", "quant_fund", "big_tech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "Latency samples arrive as \`(timestamp_ms, latency_us)\` with non-decreasing timestamps. Implement:\n\n- \`add(ts_ms: int, latency_us: int) -> None\`\n- \`window_max() -> int\` — max latency among samples in the trailing \`W\` milliseconds (relative to the latest timestamp seen)\n\nBoth must run in **amortized O(1)**. This is the primitive behind 'max latency over the last second' gauges on trading and serving systems.",
    context:
      "The count-based version of this is textbook; the time-based window plus amortized-O(1) requirement forces the real monotonic-deque insight rather than a heap crutch.",
    constraints:
      "- Timestamps non-decreasing; multiple samples may share a timestamp\n- W up to 60_000 ms; sample rate up to 10^5/s — memory must be O(samples in window) worst case, but strictly less when values are monotone\n- No heap: pop-stale-from-heap-top is O(log n) per op and is the 'almost' answer",
    starterCode:
      "class RollingMax:\n    def __init__(self, window_ms: int) -> None:\n        ...\n\n    def add(self, ts_ms: int, latency_us: int) -> None:\n        ...\n\n    def window_max(self) -> int:\n        \"\"\"Max latency in (latest_ts - window_ms, latest_ts]. Raises if empty.\"\"\"\n        ...\n",
    tests: [
      {
        name: "old max expires",
        input: "W=100; add(0,500); add(50,200); add(120,300); window_max()",
        expected: "300",
        note: "The 500 at t=0 is outside (20, 120].",
      },
      { name: "equal values kept", input: "W=100; add(0,200); add(10,200); add(105,50); window_max()", expected: "200" },
    ],
    hints: [
      "Keep a deque of (timestamp, value) where values are strictly decreasing from front to back. Why does an older, smaller value never matter again?",
      "On add: pop from the back every entry with value ≤ the new one (careful: ≤ vs < interacts with expiry — if you drop equal values, the survivor must be the *newest* so it expires last).",
      "On add and on read: pop from the front while the front timestamp is outside the window relative to the latest timestamp.",
    ],
    solutionOutline:
      "Monotonic deque. Invariant: values strictly decreasing front→back; front is the window max. \`add\`: pop back while back.value ≤ new value (using ≤ and keeping the newest equal value is what makes the 'equal values kept' test pass after partial expiry), append, then evict front entries with ts ≤ latest − W. Each sample is appended once and popped at most once → amortized O(1). \`window_max\`: evict stale front (using the latest timestamp seen), return front value. Contrast with the heap approach: lazy-deletion heap gives O(log n) adds and unbounded stale entries; the deque is both faster and naturally bounded.",
    fullSolution:
      "\`\`\`python\nfrom collections import deque\n\nclass RollingMax:\n    def __init__(self, window_ms: int):\n        self.w = window_ms\n        self.dq: deque[tuple[int, int]] = deque()  # (ts, value), values strictly decreasing\n        self.latest = None\n\n    def _evict(self):\n        cutoff = self.latest - self.w\n        while self.dq and self.dq[0][0] <= cutoff:\n            self.dq.popleft()\n\n    def add(self, ts_ms: int, latency_us: int) -> None:\n        self.latest = ts_ms\n        while self.dq and self.dq[-1][1] <= latency_us:\n            self.dq.pop()\n        self.dq.append((ts_ms, latency_us))\n        self._evict()\n    def window_max(self) -> int:\n        if self.latest is None:\n            raise ValueError('no samples')\n        self._evict()\n        if not self.dq:\n            raise ValueError('window empty')\n        return self.dq[0][1]\n\`\`\`",
    commonMistakes: [
      "Reaching for a max-heap with lazy deletion — passes correctness, fails the amortized O(1) requirement and grows unboundedly on decreasing inputs.",
      "Popping equal values from the back but keeping the *old* timestamp, so the max expires earlier than it should.",
      "Evicting the front using the queried time instead of the latest sample time (or vice versa) — pick one definition and apply it consistently.",
      "Using strict > when popping the back, which keeps duplicate values and is fine — but candidates who mix that with dropping-equals eviction get subtle bugs; the invariant must be stated, not vibed.",
    ],
    followUpQuestions: [
      "Also support window_min and window_avg with the same complexity budget. What changes?",
      "Samples can now arrive slightly out of order (bounded skew of 5 ms). What breaks, and what's the cheapest fix?",
      "Same problem in C++ on the hot path: what allocation behavior would you want from the deque, and why does std::deque's chunked layout help or hurt?",
    ],
    rubric: [
      { criterion: "Invariant statement", description: "Can state the deque invariant precisely (strictly decreasing values, front = max) before coding." },
      { criterion: "Amortized argument", description: "Explains why each element is pushed and popped at most once." },
      { criterion: "Equal-value handling", description: "Keeps the newest of equal values so expiry is correct." },
      { criterion: "Time semantics", description: "Consistent definition of the window relative to the latest timestamp." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://cp-algorithms.com/data_structures/stack_queue_modification.html"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "account-merge-shared-emails",
    title: "Merge Customer Accounts by Shared Contact Points",
    type: "dsa",
    difficulty: "medium",
    topics: ["union-find", "graphs", "hash-map"],
    targetRoles: ["backend_swe", "fullstack_swe", "new_grad_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "fintech", "startup"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "After an acquisition you must merge two customer databases. Each record is \`(record_id, emails: list[str], phones: list[str])\`. Two records belong to the same customer if they share **any** email OR **any** phone (transitively).\n\nReturn the merged customers: for each, the sorted list of record_ids, the union of emails, and the union of phones. Output sorted by the smallest record_id in each group.",
    context:
      "Union-find dressed in the single most common real-world costume it has: entity resolution. The transitivity is the point — A shares an email with B, B shares a phone with C, so A and C merge.",
    constraints:
      "- ≤ 10^5 records; emails+phones total ≤ 10^6\n- Near-linear expected: union-find with path compression + union by size\n- Emails and phones live in separate namespaces (an email string never equals a phone string collision-wise — but defend how you'd guarantee that)",
    starterCode:
      "def merge_accounts(records: list[tuple[str, list[str], list[str]]]) -> list[dict]:\n    \"\"\"Returns [{'ids': [...], 'emails': [...], 'phones': [...]}, ...]\"\"\"\n    ...\n",
    tests: [
      {
        name: "transitive via mixed contact types",
        input: "r1(emails=[a@x], phones=[111]), r2(emails=[a@x]), r3(phones=[111])",
        expected: "one merged customer {r1, r2, r3}",
      },
      { name: "disjoint stay apart", input: "r1(emails=[a@x]), r2(emails=[b@y])", expected: "two customers" },
    ],
    hints: [
      "Union record ids, not contact strings — contacts are just the evidence that two records connect.",
      "Map each contact point to the first record that presented it; every later record with that contact unions with the stored one.",
      "Prefix the namespace ('email:' / 'phone:') when keying contacts so the two spaces can never collide.",
    ],
    solutionOutline:
      "DSU over record ids with path compression + union by size. Single pass: for each record, for each contact key (namespaced), if the key is new, map it → record_id; else union(record_id, owner[key]). Second pass: group records by find(root), union their contact sets, sort ids/emails/phones, sort groups by min id. Complexity O(α(n) · total_contacts). The namespacing detail matters in production entity resolution: an email column and a phone column with overlapping raw strings (bad data) would silently over-merge without it.",
    fullSolution:
      "\`\`\`python\ndef merge_accounts(records):\n    parent, size = {}, {}\n\n    def find(x):\n        root = x\n        while parent[root] != root:\n            root = parent[root]\n        while parent[x] != root:\n            parent[x], x = root, parent[x]\n        return root\n\n    def union(a, b):\n        ra, rb = find(a), find(b)\n        if ra == rb:\n            return\n        if size[ra] < size[rb]:\n            ra, rb = rb, ra\n        parent[rb] = ra\n        size[ra] += size[rb]\n\n    owner = {}\n    for rid, emails, phones in records:\n        parent.setdefault(rid, rid)\n        size.setdefault(rid, 1)\n        for key in [f'email:{e}' for e in emails] + [f'phone:{p}' for p in phones]:\n            if key in owner:\n                union(rid, owner[key])\n            else:\n                owner[key] = rid\n\n    groups = {}\n    by_id = {rid: (emails, phones) for rid, emails, phones in records}\n    for rid in by_id:\n        groups.setdefault(find(rid), []).append(rid)\n\n    out = []\n    for members in groups.values():\n        emails = sorted({e for m in members for e in by_id[m][0]})\n        phones = sorted({p for m in members for p in by_id[m][1]})\n        out.append({'ids': sorted(members), 'emails': emails, 'phones': phones})\n    return sorted(out, key=lambda g: g['ids'][0])\n\`\`\`",
    commonMistakes: [
      "Unioning contact strings with each other and losing track of which records they belong to.",
      "Building an explicit graph and DFS-ing — correct, but O(edges) memory where edges can be quadratic when many records share one contact (star via owner-map avoids this).",
      "Skipping path compression / union by size and accepting degenerate O(n) finds.",
      "Forgetting duplicate emails within a single record, or records with no contacts at all (they form singleton customers).",
    ],
    followUpQuestions: [
      "Records stream in continuously and merges must be queryable at any time. Does DSU still work? What about *un*-merging after a support ticket says two customers were wrongly joined?",
      "Contacts are now weighted by confidence (shared email = strong, shared device fingerprint = weak). How does the model change?",
      "How would you shard this across machines for 10^9 records?",
    ],
    rubric: [
      { criterion: "Model choice", description: "Chooses DSU over record ids with a contact→owner map (star pattern), avoiding quadratic edges." },
      { criterion: "DSU hygiene", description: "Implements path compression and union by size/rank correctly." },
      { criterion: "Namespace safety", description: "Keys contacts so email/phone spaces cannot collide." },
      { criterion: "Output discipline", description: "Sorting and grouping requirements met exactly." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://cp-algorithms.com/data_structures/disjoint_set_union.html"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "migration-batch-sizing",
    title: "Minimum Batch Size for a Timed Data Migration",
    type: "dsa",
    difficulty: "medium",
    topics: ["binary-search", "greedy", "math"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy", "fintech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "You must migrate tables during a maintenance window of \`H\` hours. Table i has \`rows[i]\` rows. You pick one global batch size \`B\` (rows per batch). Rules per table:\n\n- Each batch takes 1 minute regardless of size (fixed overhead dominates).\n- A table must be migrated in contiguous batches: \`ceil(rows[i] / B)\` minutes.\n- Tables migrate sequentially on one worker.\n\nFind the **minimum B** such that total time ≤ H hours. Return -1 if impossible even with unlimited B.",
    context:
      "'Binary search on the answer' — the same shape as Koko-style textbook problems, reframed as capacity planning you'd actually do before a cutover. The signal is recognizing monotonicity and proving it, not the code.",
    constraints:
      "- ≤ 10^5 tables, rows[i] up to 10^9\n- Note the trap: total time in *minutes* is Σ ceil(rows[i]/B); H is in hours\n- With unlimited B each table still costs ≥ 1 minute — hence the -1 case when len(tables) > H*60",
    starterCode:
      "import math\n\ndef min_batch_size(rows: list[int], hours: int) -> int:\n    ...\n",
    tests: [
      { name: "simple", input: "rows=[100, 100], hours=1 (60 min)", expected: "4", note: "B=4 → 25+25 = 50 ≤ 60; B=3 → 34+34 = 68 > 60." },
      { name: "impossible", input: "rows=[1]*61, hours=1", expected: "-1" },
      { name: "single huge table", input: "rows=[10**9], hours=1", expected: "16666667", note: "ceil(1e9/B) ≤ 60" },
    ],
    hints: [
      "If batch size B works, does every B' > B also work? Prove it — that monotonicity is what licenses binary search.",
      "Search space: low=1, high=max(rows). The predicate is 'total_minutes(B) ≤ H*60'.",
      "The impossible case falls out naturally: even at high=max(rows), each table costs 1 minute.",
    ],
    solutionOutline:
      "Define feasible(B) = Σ ceil(rows[i]/B) ≤ 60H. ceil(r/B) is non-increasing in B, so a sum of them is too → feasible is monotone → binary search the smallest feasible B in [1, max(rows)]. If feasible(max(rows)) is false (i.e., n > 60H), return -1. O(n log max_rows). Mention the integer-ceil idiom (r + B - 1) // B and why floating-point ceil invites precision bugs at 1e9 scale.",
    fullSolution:
      "\`\`\`python\ndef min_batch_size(rows, hours):\n    budget = hours * 60\n    if len(rows) > budget:\n        return -1\n\n    def minutes(b):\n        return sum((r + b - 1) // b for r in rows)\n\n    lo, hi = 1, max(rows)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if minutes(mid) <= budget:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo\n\`\`\`",
    commonMistakes: [
      "Forgetting the hours→minutes conversion (the stated trap; tests catch it immediately).",
      "Using math.ceil(r / b) with float division — precision is fine below 2^53 but the integer idiom removes the question entirely; interviewers probe this.",
      "Binary searching with lo=0 (division by zero) or returning hi without verifying feasibility when the impossible case wasn't pre-checked.",
      "Claiming monotonicity without being able to justify it when pushed.",
    ],
    followUpQuestions: [
      "Now there are k parallel workers and tables are assigned greedily longest-first. Is the predicate still monotone in B? How would you check feasibility per candidate B?",
      "Batch time is now 1 + B/50_000 minutes (size matters). Does binary search on B survive? What breaks if the cost function is not monotone?",
      "How would you pick the search bounds if rows[i] could be zero?",
    ],
    rubric: [
      { criterion: "Monotonicity proof", description: "Articulates *why* feasibility is monotone in B, not just that it is." },
      { criterion: "Predicate isolation", description: "Writes a clean feasible(B) helper; binary search skeleton is bug-free (lo<hi, mid bias)." },
      { criterion: "Unit discipline", description: "Handles hours vs minutes and integer ceiling correctly." },
      { criterion: "Impossibility reasoning", description: "Derives the -1 condition rather than special-casing after a wrong answer." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://cp-algorithms.com/num_methods/binary_search.html"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "oncall-coverage-bitmask",
    title: "Minimum-Fatigue On-Call Assignment (Bitmask DP)",
    type: "dsa",
    difficulty: "hard",
    topics: ["dynamic-programming", "bitmask", "state-compression", "combinatorics"],
    targetRoles: ["backend_swe", "quant_developer", "mid_level_swe"],
    companyStyles: ["big_tech", "quant_fund"],
    estimatedMinutes: 45,
    language: "python",
    prompt:
      "You have \`n ≤ 16\` services and \`k\` engineers. \`cost[e][s]\` is the fatigue cost of engineer \`e\` covering service \`s\` (based on familiarity). Every service needs exactly one engineer; an engineer may cover **at most 2** services.\n\nReturn the minimum total fatigue, or -1 if coverage is impossible (k engineers × 2 < n).\n\nThen: reconstruct one optimal assignment.",
    context:
      "State-compression DP with a twist: the at-most-2 constraint means engineers consume *subsets of size ≤ 2*, which candidates must encode into the transition rather than the state.",
    constraints:
      "- n ≤ 16 services, k ≤ 16 engineers\n- Target O(k · 3^n) or O(k · 2^n · n²); brute force k^n is out\n- Reconstruction must not blow the memory budget: parent pointers or re-derivation both fine",
    starterCode:
      "def min_fatigue(cost: list[list[int]], n_services: int) -> tuple[int, list[list[int]]]:\n    \"\"\"cost[e][s]; returns (total, assignment) where assignment[e] = list of services.\n    Return (-1, []) if impossible.\"\"\"\n    ...\n",
    tests: [
      {
        name: "forced pairing",
        input: "2 engineers, 3 services, costs favor e0 on {0,1}, e1 on {2}",
        expected: "e0 takes two services, e1 one",
      },
      { name: "impossible", input: "1 engineer, 3 services", expected: "(-1, [])" },
    ],
    hints: [
      "State: dp[e][mask] = min cost to cover exactly the services in \`mask\` using the first e engineers. What can engineer e take? Nothing, one service from mask, or a pair from mask.",
      "Transition over subsets of size ≤ 2 keeps it O(k · 2^n · n²) — you don't need full submask enumeration for this constraint.",
      "For reconstruction, store choice[e][mask] = the subset engineer e took; walk backwards from dp[k][full].",
    ],
    solutionOutline:
      "dp[e][mask] = min fatigue covering service-set \`mask\` with engineers 0..e−1. Transition: engineer e takes ∅, {s}, or {s1,s2} ⊆ mask: dp[e+1][mask] = min(dp[e][mask], dp[e][mask − {s}] + cost[e][s], dp[e][mask − {s1,s2}] + cost[e][s1] + cost[e][s2]). Answer dp[k][(1<<n)−1]. Complexity O(k·2^n·n²) ≈ 16·65536·256 ≈ 2.7·10^8 raw — tight in Python, so either precompute pair costs per engineer or iterate s1 = lowest set bit of the taken subset to halve constants; both worth saying aloud. Feasibility pre-check 2k ≥ n avoids scanning for -1. Reconstruction via a parallel choice table.",
    fullSolution:
      "\`\`\`python\ndef min_fatigue(cost, n):\n    k = len(cost)\n    if 2 * k < n:\n        return -1, []\n    full = (1 << n) - 1\n    INF = float('inf')\n    dp = [INF] * (full + 1)\n    dp[0] = 0\n    choice = [[0] * (full + 1) for _ in range(k)]  # subset engineer e took\n    for e in range(k):\n        ndp = dp[:]  # engineer e takes nothing\n        for mask in range(full + 1):\n            if dp[mask] == INF:\n                continue\n            avail = full & ~mask\n            s = avail\n            while s:\n                b1 = s & -s\n                i = b1.bit_length() - 1\n                one = dp[mask] + cost[e][i]\n                if one < ndp[mask | b1]:\n                    ndp[mask | b1] = one\n                    choice[e][mask | b1] = b1\n                rest = avail & ~((b1 << 1) - 1)  # bits above b1 only: unordered pairs\n                t = rest\n                while t:\n                    b2 = t & -t\n                    j = b2.bit_length() - 1\n                    two = one + cost[e][j]\n                    nm = mask | b1 | b2\n                    if two < ndp[nm]:\n                        ndp[nm] = two\n                        choice[e][nm] = b1 | b2\n                    t &= t - 1\n                s &= s - 1\n        dp = ndp\n    if dp[full] == INF:\n        return -1, []\n    # reconstruct\n    assignment = [[] for _ in range(k)]\n    mask = full\n    for e in range(k - 1, -1, -1):\n        taken = choice[e][mask]\n        # choice may be stale if engineer e took nothing on the optimal path;\n        # verify by re-checking the dp recurrence — simplest robust approach:\n        # recompute forward tables per engineer (omitted for brevity in interview).\n        for i in range(n):\n            if taken >> i & 1:\n                assignment[e].append(i)\n        mask &= ~taken\n    return dp[full], assignment\n\`\`\`\n\nInterview note: flawless reconstruction under the rolling-array optimization requires either storing per-engineer dp layers (k·2^n ints — fine at these sizes) or accepting the memory and skipping the rolling array. Saying 'I'll keep all k layers because n ≤ 16 makes that 1M ints' is the mature move — the code above sketches the fast version and flags the subtlety.",
    commonMistakes: [
      "Encoding engineer load into the mask (impossible — the mask is services) or trying dp over engineer-capacity vectors (state explosion).",
      "Enumerating ordered pairs (s1, s2) and (s2, s1), doubling work and sometimes double-counting cost.",
      "Using full submask enumeration O(3^n) when subsets are capped at size 2 — correct but wasteful, and in Python the difference is pass/fail.",
      "Rolling-array dp plus naive parent pointers — the pointers go stale; candidates should either keep layers or re-derive.",
    ],
    followUpQuestions: [
      "Engineers now have individual capacity c[e] ∈ {1,2,3}. Where does your encoding strain, and at what n/k does this stop being bitmask territory?",
      "This is also an assignment-problem instance — when would you switch to min-cost matching / Hungarian algorithm, and what does the ≤2 constraint become there?",
      "What changes if costs can be negative (an engineer *wants* a service)?",
    ],
    rubric: [
      { criterion: "State design", description: "dp over (engineers processed, service mask) with capacity folded into transitions, not state." },
      { criterion: "Transition completeness", description: "Covers take-0/1/2 without ordered-pair duplication." },
      { criterion: "Complexity honesty", description: "Estimates the operation count numerically and adapts for Python constants." },
      { criterion: "Reconstruction", description: "Produces a valid optimal assignment and understands the rolling-array staleness trap." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://usaco.guide/gold/dp-bitmasks"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "cli-autocomplete-trie",
    title: "CLI Autocomplete with Frequency and Recency",
    type: "dsa",
    difficulty: "medium",
    topics: ["trie", "strings", "heap", "design"],
    targetRoles: ["backend_swe", "fullstack_swe", "new_grad_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Build the completion engine for an internal CLI:\n\n- \`record(command: str)\` — the user executed this command\n- \`complete(prefix: str, k: int) -> list[str]\` — top k completions for the prefix, ranked by execution count desc, then most-recent execution desc, then lexicographic\n\nDesign for interactive latency: \`complete\` is called on every keystroke.",
    context:
      "A trie question that stays honest about product constraints: ranking is composite, and per-keystroke latency pushes you to think about what to precompute versus compute per query.",
    constraints:
      "- ≤ 10^5 distinct commands, length ≤ 100\n- complete() target: O(len(prefix) + subtree) worst case is acceptable to start; discuss caching top-k per node as the upgrade\n- record() may be slower than complete() — say why that's the right trade for a CLI",
    starterCode:
      "class Autocomplete:\n    def __init__(self) -> None:\n        ...\n\n    def record(self, command: str) -> None:\n        ...\n\n    def complete(self, prefix: str, k: int) -> list[str]:\n        ...\n",
    tests: [
      {
        name: "frequency wins",
        input: "record('git status') x3; record('git stash') x1; complete('git st', 2)",
        expected: "['git status', 'git stash']",
      },
      {
        name: "recency breaks ties",
        input: "record('ls -la'); record('ls -lh'); complete('ls', 2)",
        expected: "['ls -lh', 'ls -la']",
        note: "Equal counts; -lh executed more recently.",
      },
    ],
    hints: [
      "A trie node needs children plus a way to find complete-able commands below it. Storing the full command at terminal nodes avoids rebuilding strings during DFS.",
      "Composite ranking key: (-count, -last_seen_seq, command). A global monotonically increasing sequence number is simpler and safer than wall-clock timestamps.",
      "Per-keystroke latency: cache the top-k list at each node and update caches along the path on record() — record touches len(command) nodes; complete becomes O(len(prefix) + k).",
    ],
    solutionOutline:
      "Baseline: trie with children dicts; terminal nodes hold (command, count, last_seq). complete() walks the prefix then DFSes the subtree collecting candidates into heapq.nsmallest(k, ..., key=(-count, -seq, cmd)). Upgrade (the actual answer for 'every keystroke'): each node caches its top-k (k bounded, say ≤ 10) as a small sorted list; record(cmd) increments the terminal's stats then re-merges that command into the cached lists of the ~len(cmd) ancestor nodes — O(len · k). complete(prefix) walks the prefix and returns the cache. This is the read/write work-shifting trade again, in the opposite direction from the top-k streaming problem: here reads dominate, so writes pay.",
    fullSolution:
      "\`\`\`python\nimport itertools\n\nclass _Node:\n    __slots__ = ('children', 'entry', 'top')\n    def __init__(self):\n        self.children = {}\n        self.entry = None        # [count, seq, command] for terminal nodes\n        self.top = []            # cached list of entry refs, ranked\n\nclass Autocomplete:\n    K_CACHE = 10\n    def __init__(self):\n        self.root = _Node()\n        self.seq = itertools.count()\n        self.terminals = {}\n\n    @staticmethod\n    def _key(entry):\n        count, seq, cmd = entry\n        return (-count, -seq, cmd)\n\n    def record(self, command: str) -> None:\n        node = self.root\n        path = [node]\n        for ch in command:\n            node = node.children.setdefault(ch, _Node())\n            path.append(node)\n        if node.entry is None:\n            node.entry = [0, 0, command]\n            self.terminals[command] = node.entry\n        node.entry[0] += 1\n        node.entry[1] = next(self.seq)\n        entry = node.entry\n        for n in path:\n            cached = [e for e in n.top if e is not entry]\n            cached.append(entry)\n            cached.sort(key=self._key)\n            n.top = cached[: self.K_CACHE]\n\n    def complete(self, prefix: str, k: int) -> list[str]:\n        node = self.root\n        for ch in prefix:\n            node = node.children.get(ch)\n            if node is None:\n                return []\n        return [e[2] for e in node.top[:k]]\n\`\`\`\n\nHonest caveat to raise unprompted: the cache holds only K_CACHE entries, so a command that falls out of a node's top-10 and later climbs back via increments on a *different* branch is fine (its own record() re-inserts it), but k > K_CACHE queries need the DFS fallback — mention it, or make K_CACHE a constructor arg.",
    commonMistakes: [
      "Rebuilding candidate strings character-by-character during DFS instead of storing the command at terminals.",
      "Using wall-clock time for recency and getting nondeterministic tie-breaks in tests.",
      "Caching top-k per node but forgetting to update ancestors on record(), serving stale rankings.",
      "Ignoring the k > cache-size case entirely rather than acknowledging the fallback.",
    ],
    followUpQuestions: [
      "Memory is now the constraint (embedded device). Which of trie compression (radix tree), cache elimination, or count quantization do you reach for first?",
      "How does fuzzy matching ('gti sttus') change the data structure conversation?",
      "Multi-user: rankings should blend global popularity with this user's history. Sketch the scoring function and where each part lives.",
    ],
    rubric: [
      { criterion: "Structure fit", description: "Trie chosen for shared-prefix traversal with a defensible node design (__slots__, terminal entries)." },
      { criterion: "Ranking correctness", description: "Composite key implemented exactly (count desc, recency desc, lex asc) with deterministic recency." },
      { criterion: "Latency engineering", description: "Identifies the per-keystroke read pattern and shifts work to record() via per-node caches." },
      { criterion: "Cache honesty", description: "Knows the cached-top-k limitations and states them unprompted." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://en.wikipedia.org/wiki/Trie"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "ttl-lru-session-cache",
    title: "LRU Session Cache with Per-Entry TTL",
    type: "dsa",
    difficulty: "medium",
    topics: ["caching", "hash-map", "linked-list", "design"],
    targetRoles: ["backend_swe", "fullstack_swe", "new_grad_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 40,
    language: "python",
    prompt:
      "Implement a session cache:\n\n- \`get(key) -> value | None\`\n- \`put(key, value, ttl_seconds)\`\n- Capacity-bounded: when full, evict the **least recently used non-expired** entry — but expired entries are evicted first regardless of recency.\n- \`get\` on an expired key returns None (and should clean it up).\n\nAll operations amortized O(1) except where you can argue a small log factor is justified. Use an injectable clock for testability.",
    context:
      "The LRU half is a warm-up every candidate has seen; the TTL interaction ('expired first, regardless of recency') is where design decisions and trade-offs actually show up.",
    constraints:
      "- Single-threaded; thread safety is a follow-up\n- No background threads — expiry must be handled lazily and/or opportunistically on access\n- The 'evict expired first' rule cannot cost O(n) scans on every put — that's the crux; discuss what you'd accept",
    starterCode:
      "import time\n\nclass SessionCache:\n    def __init__(self, capacity: int, clock=time.monotonic) -> None:\n        ...\n\n    def get(self, key: str):\n        ...\n\n    def put(self, key: str, value, ttl_seconds: float) -> None:\n        ...\n",
    tests: [
      { name: "lru evicts", input: "cap=2; put(a); put(b); get(a); put(c)", expected: "b evicted" },
      { name: "expired first", input: "cap=2; put(a, ttl=1); put(b, ttl=100); t+=2; put(c)", expected: "a evicted (expired) even though b is older by recency" },
      { name: "expired get", input: "put(a, ttl=1); t+=2; get(a)", expected: "None" },
    ],
    hints: [
      "Base: OrderedDict (or dict+doubly-linked list) gives LRU in O(1). Where does TTL state live?",
      "For 'evict expired first' without scanning: keep a min-heap of (expiry_time, key, version). Lazy-invalidate stale heap entries with a version/pointer check — entries whose key was overwritten since push are skipped.",
      "On put when full: pop expired from the heap top first (verifying versions); only if none are truly expired, evict LRU tail.",
    ],
    solutionOutline:
      "dict → node {value, expiry, version} + OrderedDict for recency + min-heap of (expiry, version, key) as an *expiry index*. get: check expiry (lazy delete if past), else move_to_end. put: overwrite bumps version and pushes a fresh heap entry (old ones become stale). Eviction on full: pop heap while top is stale (version mismatch or key gone); if top is genuinely expired, delete it — done; otherwise no expired entries exist → evict LRU head. Heap entries are each pushed once and popped once → amortized O(log n) on put, O(1) get; argue that's the justified log factor. Alternative worth naming: timer wheels (kernel-style) get O(1) with coarse buckets; Redis-style random sampling gives probabilistic expiry — both real systems' answers to the same tension.",
    fullSolution:
      "\`\`\`python\nimport heapq\nimport time\nfrom collections import OrderedDict\n\nclass SessionCache:\n    def __init__(self, capacity: int, clock=time.monotonic):\n        self.cap = capacity\n        self.clock = clock\n        self.data: OrderedDict[str, list] = OrderedDict()  # key -> [value, expiry, version]\n        self.expiry_heap: list[tuple[float, int, str]] = []\n        self._version = 0\n\n    def get(self, key):\n        node = self.data.get(key)\n        if node is None:\n            return None\n        value, expiry, _ = node\n        if expiry <= self.clock():\n            del self.data[key]\n            return None\n        self.data.move_to_end(key)\n        return value\n\n    def _evict_one(self):\n        now = self.clock()\n        while self.expiry_heap:\n            expiry, version, key = self.expiry_heap[0]\n            node = self.data.get(key)\n            if node is None or node[2] != version:\n                heapq.heappop(self.expiry_heap)   # stale\n                continue\n            if expiry <= now:\n                heapq.heappop(self.expiry_heap)\n                del self.data[key]                 # expired: evict regardless of recency\n                return\n            break                                   # freshest deadline not yet due\n        self.data.popitem(last=False)               # LRU eviction\n\n    def put(self, key, value, ttl_seconds):\n        if key in self.data:\n            del self.data[key]\n        elif len(self.data) >= self.cap:\n            self._evict_one()\n        self._version += 1\n        expiry = self.clock() + ttl_seconds\n        self.data[key] = [value, expiry, self._version]\n        heapq.heappush(self.expiry_heap, (expiry, self._version, key))\n\`\`\`\n\nThe version field is the load-bearing trick: overwriting a key strands the old heap entry, and versions let eviction skip strays in O(1) amortized instead of O(n) heap surgery.",
    commonMistakes: [
      "Scanning the whole cache for expired entries on every put — correct but O(n), and exactly what the constraints forbid.",
      "Deleting/re-inserting heap entries eagerly on overwrite (heapq can't remove arbitrary items; lazy invalidation is the idiom).",
      "Using time.time() directly, making tests flaky — the injectable clock is in the signature for a reason.",
      "Forgetting that get() on an expired key must not refresh recency or resurrect the entry.",
      "Confusing LRU (recency) with LFU (frequency) when explaining the follow-up.",
    ],
    followUpQuestions: [
      "Extend to LFU with the same TTL rule — what does O(1) LFU require (frequency buckets), and where does TTL hook in?",
      "Make it thread-safe: one big lock vs sharded locks vs lock-free reads — costs of each for a read-heavy session workload?",
      "Redis expires keys with probabilistic sampling plus lazy checks. Why might they have rejected the exact-heap design you just wrote?",
    ],
    rubric: [
      { criterion: "Core LRU mechanics", description: "O(1) get/put recency maintenance without a library crutch they can't explain." },
      { criterion: "Expiry index design", description: "Heap + version lazy invalidation (or equivalent) instead of O(n) scans." },
      { criterion: "Semantics precision", description: "Expired-first eviction, no recency refresh on expired get, correct overwrite behavior." },
      { criterion: "Testability", description: "Uses the injected clock; can list the deterministic tests they'd write." },
      { criterion: "Systems perspective", description: "Can relate the design to real cache expiry strategies (Redis sampling, timer wheels)." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/library/collections.html#collections.OrderedDict",
      "https://en.wikipedia.org/wiki/Cache_replacement_policies",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "sliding-window-rate-check",
    title: "Per-Key Sliding Window Rate Check",
    type: "dsa",
    difficulty: "easy",
    topics: ["sliding-window", "hash-map", "rate-limiting", "queues"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech", "fintech"],
    estimatedMinutes: 20,
    language: "python",
    prompt:
      "Implement \`allow(key: str, ts_ms: int) -> bool\`: the request is allowed iff fewer than \`limit\` requests for that key were allowed in the trailing \`window_ms\` milliseconds (denied requests do NOT count toward the limit — justify why that matters).\n\nTimestamps per key are non-decreasing. Memory must not grow unboundedly for idle keys.",
    context:
      "The single most common warm-up at fintech and infra companies. Easy to pass, easy to reveal sloppiness: what counts toward the window, boundary inclusivity, and idle-key cleanup are the differentiators.",
    constraints:
      "- limit ≤ 10^4 per key; keys up to 10^6\n- O(1) amortized per call\n- Define the boundary: a request at exactly ts - window_ms is OUTSIDE the window (strictly greater than cutoff counts)",
    starterCode:
      "from collections import deque\n\nclass RateCheck:\n    def __init__(self, limit: int, window_ms: int) -> None:\n        ...\n\n    def allow(self, key: str, ts_ms: int) -> bool:\n        ...\n",
    tests: [
      { name: "boundary exclusive", input: "limit=1, window=1000; allow(k,0)→True; allow(k,1000)", expected: "True", note: "t=0 is exactly window_ms old → outside." },
      { name: "denied don't count", input: "limit=1, window=1000; allow(k,0)→True; allow(k,10)→False; allow(k,20)", expected: "False", note: "Still only one *allowed* request in window; the t=10 denial must not extend the lockout." },
    ],
    hints: [
      "Per-key deque of allowed-request timestamps. Evict from the front while front ≤ ts − window.",
      "Only append when you allow — read the denied-don't-count rule again; it changes retry behavior under load.",
      "Idle keys: drop the deque when it empties, or run periodic cleanup keyed by last activity.",
    ],
    solutionOutline:
      "Per key keep a deque of timestamps of *allowed* requests. allow(key, ts): evict front while front ≤ ts − window; allowed = len(deque) < limit; if allowed, append ts; if deque becomes empty and not allowed... (it can't — eviction happens first); delete empty deques to bound memory. Each timestamp enters/leaves once → amortized O(1). Why denied requests don't count: if they did, a client hammering during lockout would extend its own lockout forever (livelock under retry storms); counting only allowed requests makes the limiter self-stabilizing. That one paragraph is what separates a pass from a strong pass.",
    fullSolution:
      "\`\`\`python\nfrom collections import deque\n\nclass RateCheck:\n    def __init__(self, limit: int, window_ms: int):\n        self.limit = limit\n        self.window = window_ms\n        self.hits: dict[str, deque[int]] = {}\n\n    def allow(self, key: str, ts_ms: int) -> bool:\n        dq = self.hits.get(key)\n        if dq is None:\n            dq = deque()\n            self.hits[key] = dq\n        cutoff = ts_ms - self.window\n        while dq and dq[0] <= cutoff:\n            dq.popleft()\n        if len(dq) < self.limit:\n            dq.append(ts_ms)\n            return True\n        if not dq:\n            del self.hits[key]\n        return False\n\`\`\`",
    commonMistakes: [
      "Counting denied requests, which livelocks aggressive retriers (and is a real production incident pattern).",
      "Boundary off-by-one: using < cutoff instead of ≤ cutoff (or an inconsistent mix).",
      "Never deleting empty deques — memory grows with total distinct keys ever seen.",
      "Storing counts per fixed bucket and calling it a sliding window (that's a different algorithm with different burst behavior — fine, but name it)."
    ],
    followUpQuestions: [
      "Memory for limit=10^4 timestamps per hot key is too much. What does the sliding-window-counter approximation (two buckets, weighted) trade away exactly?",
      "Now the checker runs on 20 API servers. Why does per-node state under-limit or over-limit, and what are the coordination options?",
      "How would you expose the 'time until next allowed' to callers for Retry-After headers?",
    ],
    rubric: [
      { criterion: "Window semantics", description: "Consistent, stated boundary rule; passes the exact-boundary test." },
      { criterion: "Denied-request insight", description: "Explains why only allowed requests count, unprompted or with minimal nudging." },
      { criterion: "Memory hygiene", description: "Cleans up idle keys; can bound worst-case memory." },
      { criterion: "Approximation literacy", description: "Knows fixed-bucket and two-bucket-weighted variants and their burst-behavior trade-offs." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://blog.cloudflare.com/counting-things-a-lot-of-different-things/"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "mini-matching-engine",
    title: "Mini Matching Engine: Price-Time Priority",
    type: "dsa",
    difficulty: "hard",
    topics: ["order-book", "heap", "matching-engine", "design", "market-microstructure"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "fintech"],
    estimatedMinutes: 60,
    language: "python",
    prompt:
      "Implement the core of a limit-order matching engine for one instrument:\n\n- \`submit(order_id, side, price, qty) -> list[Fill]\` — match against resting orders (price-time priority), rest any remainder\n- \`cancel(order_id) -> bool\`\n- \`best_bid() / best_ask() -> (price, total_qty) | None\`\n\nMatching rules: an incoming buy matches asks with price ≤ its limit, best (lowest) price first, oldest first within a price level; sells mirror. Fills execute at the **resting** order's price. Partial fills rest the remainder.",
    context:
      "The canonical quant-dev take-home/onsite problem shape. Interviewers look for level-organized book structure, correct priority, exact fill accounting, and O(log L + fills) complexity — not a toy list scan.",
    constraints:
      "- ≤ 10^6 operations; cancel must be O(1) amortized (lazy) or O(log L)\n- Prices are integer ticks; quantities are positive ints\n- No self-trade prevention needed (follow-up)\n- Fill = (maker_order_id, taker_order_id, price, qty)",
    starterCode:
      "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass Fill:\n    maker_id: str\n    taker_id: str\n    price: int\n    qty: int\n\nclass MatchingEngine:\n    def submit(self, order_id: str, side: str, price: int, qty: int) -> list[Fill]:\n        ...\n\n    def cancel(self, order_id: str) -> bool:\n        ...\n\n    def best_bid(self) -> tuple[int, int] | None: ...\n    def best_ask(self) -> tuple[int, int] | None: ...\n",
    tests: [
      {
        name: "price-time priority",
        input: "submit(a1, sell, 100, 5); submit(a2, sell, 100, 5); submit(b1, buy, 100, 7)",
        expected: "fills: (a1,b1,100,5) then (a2,b1,100,2); a2 keeps 3 remaining resting on the ask at 100",
      },
      {
        name: "price improvement to maker price",
        input: "submit(a1, sell, 99, 5); submit(b1, buy, 101, 5)",
        expected: "fill at 99 (resting price), not 101",
      },
      { name: "cancel then match", input: "submit(a1, sell, 100, 5); cancel(a1); submit(b1, buy, 100, 5)", expected: "no fills; b1 rests" },
    ],
    hints: [
      "Organize by price level: dict price → FIFO deque of orders, plus a heap of active prices per side (min-heap asks, max-heap bids via negation). Lazy-delete empty levels from the heap.",
      "Cancel without scanning: an order registry id → order object with a live/canceled flag and remaining qty; skip dead orders when they surface at the front of a level.",
      "The matching loop's exit conditions are exactly three: taker exhausted, book side empty, or best price no longer crosses. Get all three right and the engine is mostly done.",
    ],
    solutionOutline:
      "Two sides, each: levels = dict[price, deque[Order]], price_heap (lazy). Registry: id → Order{side, price, qty_remaining, alive}. submit: loop while qty > 0 and best opposite level crosses the limit — front order of that level fills min(qty, front.remaining) at the *resting* price, emit Fill, pop when exhausted; skip !alive orders (physical removal happens lazily). If qty remains, create Order, append to own level (creating it and pushing price if new). cancel: registry lookup, mark !alive, decrement the level's cached total (if you cache totals — needed for best_bid quantity in O(1); otherwise compute lazily and mind dead orders). best_bid/ask: peek heap, popping prices whose level is empty-or-all-dead. Complexity: each order is appended once and removed once; heap ops amortize to O(log L). Cross-checks: fills at maker price (price improvement to taker); FIFO within level; a2's remainder in test 1 rests at its own price.",
    fullSolution:
      "\`\`\`python\nimport heapq\nfrom collections import deque\nfrom dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass Fill:\n    maker_id: str\n    taker_id: str\n    price: int\n    qty: int\n\nclass _Order:\n    __slots__ = ('id', 'side', 'price', 'qty', 'alive')\n    def __init__(self, oid, side, price, qty):\n        self.id, self.side, self.price, self.qty = oid, side, price, qty\n        self.alive = True\n\nclass MatchingEngine:\n    def __init__(self):\n        self.levels = {'buy': {}, 'sell': {}}   # price -> deque[_Order]\n        self.heaps = {'buy': [], 'sell': []}     # buy: -price, sell: +price\n        self.registry: dict[str, _Order] = {}\n\n    def _best_price(self, side):\n        heap, levels = self.heaps[side], self.levels[side]\n        sign = -1 if side == 'buy' else 1\n        while heap:\n            price = sign * heap[0]\n            level = levels.get(price)\n            while level and not level[0].alive:\n                level.popleft()\n            if level:\n                return price\n            levels.pop(price, None)\n            heapq.heappop(heap)\n        return None\n\n    def _level_qty(self, side, price):\n        return sum(o.qty for o in self.levels[side][price] if o.alive)\n\n    def submit(self, order_id, side, price, qty):\n        fills = []\n        other = 'sell' if side == 'buy' else 'buy'\n        crosses = (lambda p: p <= price) if side == 'buy' else (lambda p: p >= price)\n        while qty > 0:\n            best = self._best_price(other)\n            if best is None or not crosses(best):\n                break\n            level = self.levels[other][best]\n            maker = level[0]\n            traded = min(qty, maker.qty)\n            fills.append(Fill(maker.id, order_id, best, traded))\n            maker.qty -= traded\n            qty -= traded\n            if maker.qty == 0:\n                maker.alive = False\n                level.popleft()\n        if qty > 0:\n            order = _Order(order_id, side, price, qty)\n            self.registry[order_id] = order\n            level = self.levels[side].setdefault(price, deque())\n            if not level:\n                heapq.heappush(self.heaps[side], -price if side == 'buy' else price)\n            level.append(order)\n        return fills\n\n    def cancel(self, order_id):\n        order = self.registry.get(order_id)\n        if order is None or not order.alive:\n            return False\n        order.alive = False\n        return True\n\n    def best_bid(self):\n        p = self._best_price('buy')\n        return None if p is None else (p, self._level_qty('buy', p))\n\n    def best_ask(self):\n        p = self._best_price('sell')\n        return None if p is None else (p, self._level_qty('sell', p))\n\`\`\`\n\nProduction deltas to name in the follow-up discussion: cached level quantities (the _level_qty scan is O(level) — fine here, not in prod), intrusive doubly-linked lists per level for O(1) physical cancel, integer price ticks (already done — floats in a matching engine is an instant red flag), and sequence numbers on fills for downstream determinism.",
    commonMistakes: [
      "Filling at the taker's limit price instead of the resting order's price — the single most common correctness error.",
      "Scanning a list of all orders per submit (O(n) matching) instead of level-organized structure.",
      "Cancel by removing from the middle of a deque (O(n)) instead of tombstoning + lazy cleanup, or forgetting to skip tombstones in _best_price.",
      "Heap price entries duplicated when a level empties and re-fills — either guard the push (level was empty) or dedupe lazily; mixing both causes ghost levels.",
      "Using floats for prices and comparing with tolerance — matching engines use integer ticks, full stop.",
    ],
    followUpQuestions: [
      "Add order types: IOC (immediate-or-cancel) and post-only. Which parts of submit() change and which are untouched?",
      "Add self-trade prevention (cancel-newest). Where is the check and what's its cost?",
      "The exchange feed needs level-2 snapshots (top 10 levels each side) after every operation. What incremental bookkeeping makes that O(1)?",
      "Same engine in C++ for sub-microsecond latency: what replaces the dict-of-deques, and why does pointer chasing dominate?",
    ],
    rubric: [
      { criterion: "Book structure", description: "Price-level organization (levels + best-price index), not a flat order list." },
      { criterion: "Matching correctness", description: "Price-time priority, maker-price execution, partial fills, and remainder resting all exact." },
      { criterion: "Cancel design", description: "O(1)/O(log) cancel via tombstones or intrusive lists, with lazy cleanup handled everywhere it surfaces." },
      { criterion: "Loop discipline", description: "The three matching-loop exit conditions are explicit and tested." },
      { criterion: "Production awareness", description: "Names integer ticks, cached level totals, and determinism concerns without prompting." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.wikipedia.org/wiki/Order_matching_system",
      "https://en.wikipedia.org/wiki/Central_limit_order_book",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "log-template-dedup",
    title: "Streaming Log Deduplication by Template",
    type: "dsa",
    difficulty: "medium",
    topics: ["hashing", "strings", "streaming", "sliding-window", "logging"],
    targetRoles: ["backend_swe", "infrastructure_swe", "platform_engineer"],
    companyStyles: ["infra_heavy", "big_tech", "startup"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "An ingestion pipeline receives log lines \`(ts_ms, line)\` in timestamp order. Lines that share a **template** — the line with numbers, UUIDs, and hex ids replaced by placeholders — are duplicates when they occur within \`window_ms\` of the last *emitted* line of that template.\n\nImplement \`process(ts_ms, line) -> str | None\`: return the line augmented with a suppressed-count (\`\"<line> [suppressed N]\"\` where N counts since last emission, 0 for first) when it should be emitted, else None.\n\nNormalization rules: integers, 0x-hex tokens, and UUID-shaped tokens become \`<num>\`, \`<hex>\`, \`<uuid>\`.",
    context:
      "Log dedup/collapsing is real infra (syslog's 'last message repeated N times', log template mining). The algorithmic core is windowed dedup keyed by a normalized hash; the engineering core is defining normalization precisely.",
    constraints:
      "- Millions of lines; template cardinality ~10^5\n- O(len(line)) per call; regex is fine if you can reason about its cost\n- Memory: state per template must be evictable — templates idle for > window_ms can be dropped (say how)\n- Emission resets the window and the counter for that template",
    starterCode:
      "import re\n\nclass LogDeduper:\n    def __init__(self, window_ms: int) -> None:\n        ...\n\n    def process(self, ts_ms: int, line: str) -> str | None:\n        ...\n",
    tests: [
      {
        name: "suppress within window",
        input: "w=1000; process(0,'conn 123 reset'); process(500,'conn 999 reset'); process(1600,'conn 7 reset')",
        expected: "emit 'conn 123 reset [suppressed 0]'; None; emit 'conn 7 reset [suppressed 1]'",
      },
      { name: "different template not suppressed", input: "process(0,'user 1 login'); process(10,'user 1 logout')", expected: "both emitted" },
    ],
    hints: [
      "Normalize first, then key state by the normalized template (or its hash). Order the substitutions so UUIDs aren't shredded into <num>s by an earlier integer pass.",
      "Per-template state: last_emit_ts and suppressed_count. When now − last_emit > window → emit with the count, reset both.",
      "Eviction: since timestamps are monotonic, an OrderedDict by last-touch (move_to_end on access, pop stale from the front) gives O(1) amortized cleanup — the LRU trick reused for expiry.",
    ],
    solutionOutline:
      "Compile one regex pass with alternation ordered UUID → hex → number (longest/most-specific first — a UUID contains hex runs and digits, so ordering is correctness, not style). process(): template = normalize(line); look up state; if absent or ts − last_emit > window → emit f-string with suppressed count (0 if new), set last_emit=ts, count=0, move key to OrderedDict end; else count += 1, return None. Opportunistic eviction: pop from the front of the OrderedDict while last_touch < ts − window (those templates can never suppress again). Everything O(len(line)) + amortized O(1).",
    fullSolution:
      "\`\`\`python\nimport re\nfrom collections import OrderedDict\n\n_UUID = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'\n_TOKEN = re.compile(rf'({_UUID})|(0x[0-9a-fA-F]+)|(\\d+)')\n\ndef _normalize(line: str) -> str:\n    def repl(m: re.Match) -> str:\n        if m.group(1):\n            return '<uuid>'\n        if m.group(2):\n            return '<hex>'\n        return '<num>'\n    return _TOKEN.sub(repl, line)\n\nclass LogDeduper:\n    def __init__(self, window_ms: int):\n        self.window = window_ms\n        # template -> [last_emit_ts, suppressed_count, last_touch_ts]\n        self.state: OrderedDict[str, list] = OrderedDict()\n\n    def _evict(self, now: int) -> None:\n        cutoff = now - self.window\n        while self.state:\n            key, (_, _, touched) = next(iter(self.state.items()))\n            if touched >= cutoff:\n                break\n            self.state.popitem(last=False)\n\n    def process(self, ts_ms: int, line: str) -> str | None:\n        self._evict(ts_ms)\n        template = _normalize(line)\n        entry = self.state.get(template)\n        if entry is None or ts_ms - entry[0] > self.window:\n            suppressed = entry[1] if entry else 0\n            self.state[template] = [ts_ms, 0, ts_ms]\n            self.state.move_to_end(template)\n            return f'{line} [suppressed {suppressed}]'\n        entry[1] += 1\n        entry[2] = ts_ms\n        self.state.move_to_end(template)\n        return None\n\`\`\`\n\nDesign discussion worth having: hashing the template (e.g., blake2) shrinks memory at 10^5+ cardinality but loses the ability to debug what a state entry was; production systems (Drain-style template miners) go further and learn templates instead of regex-normalizing.",
    commonMistakes: [
      "Substitution order shredding UUIDs (integer pass first turns each UUID segment into <num>-<num>-… and templates explode in cardinality).",
      "Windowing against the last *seen* instead of last *emitted* line, which suppresses forever under a constant stream.",
      "Unbounded state map — no eviction means every template ever seen stays resident.",
      "Losing the suppressed count on emission (it must be reported with the *next* emission, then reset).",
    ],
    followUpQuestions: [
      "Lines can arrive up to 2 s out of order from multiple shippers. Which guarantees break, and what buffering fixes them at what latency cost?",
      "Templates should be *learned* (variable positions inferred from examples) rather than regex-defined. Sketch how Drain-style prefix-tree mining works.",
      "The suppressed count must survive process restarts. What's the cheapest durable design?",
    ],
    rubric: [
      { criterion: "Normalization rigor", description: "Ordered, justified substitution rules; understands cardinality explosion when order is wrong." },
      { criterion: "Window semantics", description: "Keys the window off last emission, resets counters correctly." },
      { criterion: "Memory bounds", description: "Concrete eviction mechanism with an argument for amortized O(1)." },
      { criterion: "Systems context", description: "Can position this against syslog collapsing and template-mining approaches." },
    ],
    sourceType: "open_source_inspired",
    sourceUrls: ["https://github.com/logpai/Drain3"],
    licenseNote: OSS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "surge-aware-shortest-path",
    title: "Cheapest Path with Time-Varying Edge Costs",
    type: "dsa",
    difficulty: "hard",
    topics: ["graphs", "dijkstra", "shortest-path", "heap"],
    targetRoles: ["backend_swe", "quant_developer", "distributed_systems_engineer", "mid_level_swe"],
    companyStyles: ["big_tech", "quant_fund"],
    estimatedMinutes: 45,
    language: "python",
    prompt:
      "A courier network has nodes and directed edges. Edge \`(u, v)\` has base travel time \`base[u][v]\` minutes, but during surge windows its cost changes: each edge has a list of \`(start, end, multiplier)\` windows (non-overlapping, sorted). The multiplier applies if you **depart** u within \`[start, end)\`.\n\nGiven a start node, start time t0, and destination, return the minimum arrival time. Waiting at a node is allowed (you may deliberately depart later to dodge a surge).",
    context:
      "Dijkstra with time-dependent weights. The two deep questions: does Dijkstra's greedy argument still hold, and how does 'waiting is allowed' change the relaxation? This is a real routing/scheduling shape (and an SRE traffic-shifting shape).",
    constraints:
      "- ≤ 10^4 nodes, 10^5 edges, ≤ 20 windows per edge; multipliers ≥ 1\n- Key property to state: with multipliers ≥ 1 and waiting allowed, earlier arrival at a node is never worse (FIFO-ish property restored by waiting) — this is what keeps Dijkstra valid\n- Departure cost function per edge: given departure time t, cost = base × multiplier(t); you may also wait until any t' ≥ t",
    starterCode:
      "def earliest_arrival(\n    n: int,\n    edges: list[tuple[int, int, float, list[tuple[float, float, float]]]],\n    start: int,\n    t0: float,\n    dest: int,\n) -> float:\n    \"\"\"edges: (u, v, base_minutes, [(surge_start, surge_end, multiplier), ...]).\n    Returns earliest arrival time at dest, or float('inf').\"\"\"\n    ...\n",
    tests: [
      {
        name: "waiting beats surging",
        input: "edge u→v base 10, surge (0, 100, 5); t0=95",
        expected: "depart at 100 → arrive 110 (waiting 5), not depart at 95 → arrive 145",
      },
      { name: "no surge", input: "plain two-edge path", expected: "sum of bases" },
    ],
    hints: [
      "Replace 'edge weight' with a function best_departure(u→v, arrival_at_u) → earliest arrival at v, minimizing over 'depart now' and 'wait until each future window boundary'.",
      "Only window boundaries matter as candidate departure times — between boundaries the multiplier is constant, so departing earlier within the same regime is never worse.",
      "Prove the Dijkstra invariant: since waiting is allowed and multipliers ≥ 1, arrival_at_v is a non-decreasing function of arrival_at_u — so settling nodes in arrival-time order stays correct.",
    ],
    solutionOutline:
      "For an edge with sorted windows, define f(t) = min over candidate departure times d ∈ {t} ∪ {window starts > t, window ends > t} of d + base·mult(d), where mult(d) is 1 outside windows. Candidates are O(windows). Because mult ≥ 1 and waiting is free, f is non-decreasing in t — that monotonicity is exactly the condition under which time-dependent Dijkstra remains correct (state it; many candidates just assume). Then run standard Dijkstra keyed by arrival time, relaxing with f. Complexity O((E·W + V) log V) with W ≤ 20. Counterexample to offer if asked: multipliers < 1 (discounts) with no waiting allowed breaks monotonicity → need label-correcting (Bellman-Ford-style) algorithms.",
    fullSolution:
      "\`\`\`python\nimport heapq\n\ndef _traverse(base, windows, t):\n    # cost departing exactly at time d\n    def cost_at(d):\n        for s, e, m in windows:\n            if s <= d < e:\n                return base * m\n        return base\n    best = t + cost_at(t)\n    for s, e, _ in windows:\n        for d in (s, e):\n            if d > t:\n                best = min(best, d + cost_at(d))\n    return best\n\ndef earliest_arrival(n, edges, start, t0, dest):\n    adj = [[] for _ in range(n)]\n    for u, v, base, windows in edges:\n        adj[u].append((v, base, windows))\n    dist = [float('inf')] * n\n    dist[start] = t0\n    pq = [(t0, start)]\n    while pq:\n        t, u = heapq.heappop(pq)\n        if t > dist[u]:\n            continue\n        if u == dest:\n            return t\n        for v, base, windows in adj[u]:\n            arrival = _traverse(base, windows, t)\n            if arrival < dist[v]:\n                dist[v] = arrival\n                heapq.heappush(pq, (arrival, v))\n    return dist[dest]\n\`\`\`\n\nNote _traverse checks both window starts (surge might *end* — wait for e) and starts of *cheaper* regimes; with multipliers ≥ 1 the useful candidates are actually window *ends* plus t itself, but checking both boundaries is O(W) and immune to off-by-one debates. Binary-searching the window list turns the linear scan into O(log W) if W were large.",
    commonMistakes: [
      "Running vanilla Dijkstra on base costs and applying multipliers as an afterthought during path reconstruction.",
      "Not allowing waiting, or allowing it but only checking 'depart now' — missing the dodge-the-surge optimum entirely.",
      "Assuming Dijkstra works without stating the monotonicity condition (interviewer: 'what if surge multiplier were 0.5 and waiting forbidden?').",
      "Applying the multiplier based on *arrival* time at v instead of departure time from u.",
    ],
    followUpQuestions: [
      "Multipliers can now be < 1 (off-peak discounts) but waiting is forbidden. What breaks, and which algorithm family handles it?",
      "You need the k cheapest departure-time schedules, not one. How does the state space change?",
      "Surge windows arrive as live updates. Do you recompute, or is there an incremental structure worth the complexity?",
    ],
    rubric: [
      { criterion: "Correctness condition", description: "Explicitly states why Dijkstra remains valid (monotone arrival function via waiting + mult ≥ 1)." },
      { criterion: "Edge cost function", description: "Reduces departure choice to O(W) window-boundary candidates with a why." },
      { criterion: "Implementation", description: "Clean Dijkstra with stale-entry skip; multiplier applied at departure." },
      { criterion: "Boundary analysis", description: "Half-open window semantics handled consistently." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://cp-algorithms.com/graph/dijkstra_sparse.html"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "order-book-imbalance-window",
    title: "Order Flow Imbalance over a Tick Window",
    type: "dsa",
    difficulty: "medium",
    topics: ["streaming", "sliding-window", "market-data", "prefix-sums"],
    targetRoles: ["quant_developer", "hft_swe"],
    companyStyles: ["hft", "quant_fund"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "Trade prints stream in as \`(seq, side, qty)\` where side ∈ {B, S} (aggressor side) and seq is a gapless increasing sequence number. Implement:\n\n- \`on_trade(seq, side, qty)\`\n- \`imbalance(n) -> float\` — over the last n trades: (buy_qty − sell_qty) / (buy_qty + sell_qty), or 0.0 if no trades\n\n\`imbalance\` is called with **many different n values** (n ≤ 10^5) per second, so per-call O(n) scans are unacceptable.",
    context:
      "A simple signal-desk primitive. The interesting move is recognizing that many different lookback lengths turn 'sliding window' into 'prefix sums over a ring buffer'.",
    constraints:
      "- Keep only the last N_max = 10^5 trades of state\n- imbalance(n) must be O(1)\n- on_trade must be O(1); no per-call allocation in the steady state (motivate why that matters on a hot path, even in Python)",
    starterCode:
      "class ImbalanceTracker:\n    def __init__(self, n_max: int = 100_000) -> None:\n        ...\n\n    def on_trade(self, seq: int, side: str, qty: int) -> None:\n        ...\n\n    def imbalance(self, n: int) -> float:\n        ...\n",
    tests: [
      { name: "basic", input: "B5, S3, B2; imbalance(3)", expected: "(7-3)/10 = 0.4" },
      { name: "shorter lookback", input: "same; imbalance(1)", expected: "(2-0)/2 = 1.0" },
      { name: "empty", input: "imbalance(5) before any trade", expected: "0.0" },
    ],
    hints: [
      "One sliding window per n is dead on arrival when n varies per call. What structure answers 'sum of the last n' for any n in O(1)?",
      "Ring buffer of size N_max storing signed qty (+buy/−sell) and absolute qty, with running prefix sums stored *at each slot*: prefix[i] = total up to the i-th trade. Last-n sum = prefix[latest] − prefix[latest − n].",
      "Prefix sums grow forever but Python ints don't overflow; in C++ you'd reason about 64-bit headroom — say so.",
    ],
    solutionOutline:
      "Preallocate two arrays of size N_max+1 as circular prefix-sum tapes: signed[i] and total[i] hold cumulative sums at logical trade count i, stored at i mod (N_max+1). on_trade appends the new cumulative values (O(1), no allocation). imbalance(n): clamp n to trades seen (and to N_max); take cur = count, base = count − n; both cumulative values still live in the ring because n ≤ N_max; numerator = signed[cur] − signed[base], denominator = total[cur] − total[base]; return 0.0 when denominator is 0. Every query O(1) regardless of n. The ring-of-prefix-sums trick is the whole problem; the rest is boundary bookkeeping.",
    fullSolution:
      "\`\`\`python\nclass ImbalanceTracker:\n    def __init__(self, n_max: int = 100_000):\n        self.cap = n_max + 1\n        self.signed = [0] * self.cap\n        self.total = [0] * self.cap\n        self.count = 0\n\n    def on_trade(self, seq: int, side: str, qty: int) -> None:\n        s = qty if side == 'B' else -qty\n        prev = self.count % self.cap\n        cur = (self.count + 1) % self.cap\n        self.signed[cur] = self.signed[prev] + s\n        self.total[cur] = self.total[prev] + qty\n        self.count += 1\n\n    def imbalance(self, n: int) -> float:\n        if self.count == 0:\n            return 0.0\n        n = min(n, self.count, self.cap - 1)\n        cur = self.count % self.cap\n        base = (self.count - n) % self.cap\n        denom = self.total[cur] - self.total[base]\n        if denom == 0:\n            return 0.0\n        return (self.signed[cur] - self.signed[base]) / denom\n\`\`\`",
    commonMistakes: [
      "Maintaining one deque per possible n, or rescanning the last n trades per call — the stated workload forbids both.",
      "Off-by-one in the ring: capacity must be N_max + 1 because you need n = N_max lookback (base and cur must coexist).",
      "Forgetting the all-zero-quantity or empty cases and dividing by zero.",
      "Storing per-trade values and summing on demand 'because Python is slow anyway' — the point is recognizing the O(1) structure exists.",
    ],
    followUpQuestions: [
      "Now the lookback is time-based ('last 500 ms') with irregular trade arrival. What replaces the pure ring index math?",
      "Sequence numbers can gap (dropped packets). What should imbalance() do during a gap — and what would a real feed handler do?",
      "In C++, how would you lay this out to be cache-friendly and lock-free for one writer + many readers (hint: seqlock or double-buffered snapshots)?",
    ],
    rubric: [
      { criterion: "Structure insight", description: "Arrives at prefix sums over a ring buffer (or equivalent O(1)-per-query design)." },
      { criterion: "Boundary correctness", description: "Ring capacity, clamping, and zero-denominator cases exact." },
      { criterion: "Hot-path awareness", description: "No steady-state allocation; can articulate overflow reasoning for a C++ port." },
      { criterion: "Workload literacy", description: "Understands why many-n queries change the problem class." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
]);
