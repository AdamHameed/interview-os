import { defineProblems, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE, ORIGINAL_NOTE, OSS_INSPIRED_NOTE } from "./types";

export const writeCodeProblems = defineProblems([
  {
    slug: "ttl-kv-store-spec",
    title: "In-Memory KV Store with TTL — Exact Spec",
    type: "write_code",
    difficulty: "easy",
    topics: ["caching", "design", "python", "testing"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "Implement \`TTLStore\` to this exact contract:\n\n- \`set(key, value, ttl_s: float | None = None)\` — \`None\` means no expiry; \`ttl_s <= 0\` raises \`ValueError\`; overwriting replaces both value and expiry (a later set with no TTL clears a previous expiry).\n- \`get(key, default=None)\` — expired or missing → default. Must not extend or refresh expiry.\n- \`delete(key) -> bool\` — True iff a live (non-expired) entry was removed.\n- \`__len__\` — count of live entries only.\n- \`compact() -> int\` — physically remove expired entries, return count removed.\n\nUse the injected \`clock\` for all time. Expiry boundary: an entry with ttl 5 set at t=10 is live at t<15 and expired at t≥15.",
    context:
      "Write-from-spec rounds grade fidelity: every clause above is a test the interviewer will run. The half-open expiry boundary and the delete-returns-what question are where submissions diverge.",
    constraints:
      "- O(1) get/set/delete; compact may be O(n)\n- No background threads\n- len() must be correct even if compact() was never called — think about what that implies",
    starterCode:
      "import time\n\nclass TTLStore:\n    def __init__(self, clock=time.monotonic) -> None:\n        self._clock = clock\n        ...\n\n    def set(self, key, value, ttl_s: float | None = None) -> None: ...\n    def get(self, key, default=None): ...\n    def delete(self, key) -> bool: ...\n    def __len__(self) -> int: ...\n    def compact(self) -> int: ...\n",
    tests: [
      { name: "boundary", input: "t=10: set(k,v,5); t=14.999: get(k)", expected: "v" },
      { name: "boundary exact", input: "t=15: get(k)", expected: "None (default)" },
      { name: "overwrite clears ttl", input: "set(k,v,5); set(k,v2); t=+100; get(k)", expected: "v2" },
      { name: "delete expired", input: "set(k,v,1); t=+2; delete(k)", expected: "False" },
      { name: "len skips expired", input: "set(a,1,1); set(b,2); t=+5; len(store)", expected: "1" },
      { name: "ttl zero", input: "set(k,v,0)", expected: "ValueError" },
    ],
    hints: [
      "Store (value, expires_at | None) per key. Every read path asks one question: is expires_at is None or clock() < expires_at?",
      "len() can't just return len(dict) — either lazily purge as you count, or accept O(n) len; the spec's O(1) list doesn't include __len__, so decide and defend.",
      "delete on an expired key: the entry isn't 'live', so return False — but should it physically remove the corpse? (Yes — free the memory while you're there.)",
    ],
    solutionOutline:
      "Dict key → (value, expires_at). Helper \`_live(entry) = entry.expires_at is None or clock() < expires_at\` centralizes the boundary (strict <, matching 'expired at t≥15'). get: fetch, if dead → optionally purge, return default. set: validate ttl > 0 (None allowed), store fresh tuple — overwrite semantics fall out naturally. delete: pop; if it was dead, return False (and keep it popped). __len__: sum of live entries — O(n); note the alternative (maintain a live-count + expiry heap) if O(1) len were required. compact: iterate, collect dead keys, delete, return count — snapshot the keys first to avoid mutating during iteration.",
    fullSolution:
      "\`\`\`python\nimport time\n\nclass TTLStore:\n    def __init__(self, clock=time.monotonic):\n        self._clock = clock\n        self._data: dict = {}\n\n    def _expired(self, expires_at) -> bool:\n        return expires_at is not None and self._clock() >= expires_at\n\n    def set(self, key, value, ttl_s=None) -> None:\n        if ttl_s is not None and ttl_s <= 0:\n            raise ValueError('ttl_s must be positive or None')\n        expires_at = None if ttl_s is None else self._clock() + ttl_s\n        self._data[key] = (value, expires_at)\n\n    def get(self, key, default=None):\n        entry = self._data.get(key)\n        if entry is None:\n            return default\n        value, expires_at = entry\n        if self._expired(expires_at):\n            del self._data[key]   # opportunistic purge; get stays amortized O(1)\n            return default\n        return value\n\n    def delete(self, key) -> bool:\n        entry = self._data.pop(key, None)\n        if entry is None:\n            return False\n        return not self._expired(entry[1])\n\n    def __len__(self) -> int:\n        return sum(1 for _, exp in self._data.values() if not self._expired(exp))\n\n    def compact(self) -> int:\n        dead = [k for k, (_, exp) in self._data.items() if self._expired(exp)]\n        for k in dead:\n            del self._data[k]\n        return len(dead)\n\`\`\`",
    commonMistakes: [
      "Boundary inverted: using > instead of >= for expiry (the spec says expired AT t=15).",
      "Overwrite keeping the old expiry when the new set has ttl=None — re-read the spec clause.",
      "get() refreshing TTL (that's a different cache policy; the spec forbids it).",
      "Iterating and deleting from the dict simultaneously in compact() — RuntimeError.",
      "Validating ttl_s=None through the \`<= 0\` check and crashing on comparison.",
    ],
    followUpQuestions: [
      "Add \`set_many\` atomically — all-or-nothing on validation errors. What does 'atomic' mean without threads?",
      "Now O(1) __len__ is required. What bookkeeping do you add and where can it go stale?",
      "Make it safe for concurrent readers/one writer — what's the minimal locking, and what Python-specific caveat applies (GIL vs compound operations)?",
    ],
    rubric: [
      { criterion: "Spec fidelity", description: "Every clause implemented exactly — boundary, overwrite, delete semantics, ValueError." },
      { criterion: "Centralized time logic", description: "One expiry predicate; injected clock used everywhere (no time.time())." },
      { criterion: "Purge strategy", description: "Understands lazy vs explicit cleanup and the len() implication." },
      { criterion: "Tests-first instinct", description: "Derives test cases from spec clauses before/while coding." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "token-bucket-limiter-spec",
    title: "Token Bucket Rate Limiter from Spec",
    type: "write_code",
    difficulty: "medium",
    topics: ["rate-limiting", "algorithms", "python", "concurrency"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "fintech", "infra_heavy"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "Implement a token-bucket limiter:\n\n- \`TokenBucket(capacity: float, refill_rate: float, clock)\` — starts **full**; refill_rate is tokens/second, accruing continuously (not in ticks).\n- \`try_acquire(n: float = 1.0) -> bool\` — take n tokens if available, else take nothing.\n- \`wait_time(n: float = 1.0) -> float\` — seconds until n tokens *would* be available (0.0 if now); must not mutate state.\n- Tokens never exceed capacity. \`n > capacity\` on either method raises \`ValueError\`.\n\nLazy refill only: no timers, no threads — tokens materialize arithmetically on access.",
    context:
      "The most-assigned rate limiter in real interviews. Continuous (float) refill plus the read-only wait_time is what separates it from the blog-post version; both are also exactly what an SDK client limiter needs.",
    constraints:
      "- O(1) per operation, no allocation growth\n- Monotonic clock injected; never call it more than once per public method (why? torn reads between two now() calls)\n- Burst semantics: after idle, a full-capacity burst is allowed by design — be ready to defend or bound it",
    starterCode:
      "import time\n\nclass TokenBucket:\n    def __init__(self, capacity: float, refill_rate: float, clock=time.monotonic) -> None:\n        ...\n\n    def try_acquire(self, n: float = 1.0) -> bool: ...\n    def wait_time(self, n: float = 1.0) -> float: ...\n",
    tests: [
      { name: "burst then deny", input: "cap=3, rate=1; acquire x3 → True x3; acquire", expected: "False" },
      { name: "refill", input: "…then advance clock 1.0s; try_acquire()", expected: "True" },
      { name: "wait_time exact", input: "cap=3 rate=2, empty; wait_time(1)", expected: "0.5" },
      { name: "wait_time pure", input: "call wait_time twice, no time passing", expected: "same value; state unchanged" },
      { name: "cap clamp", input: "idle 1000s on cap=3; acquire(3); acquire(1)", expected: "True then False" },
      { name: "n too big", input: "acquire(4) on cap=3", expected: "ValueError" },
    ],
    hints: [
      "State is just (tokens, last_refill_ts). On access: tokens = min(capacity, tokens + (now − last) × rate); last = now.",
      "wait_time must compute the refreshed token count *without writing it back* — or write it back but not consume; either is fine if you can justify that refill is idempotent. Deficit / rate is the answer.",
      "Read the clock once per method into \`now\` — two reads can disagree and produce negative elapsed under NTP-free monotonic? (Monotonic won't go back, but the two-read version still computes with inconsistent 'now's.)",
    ],
    solutionOutline:
      "Keep (tokens, last_ts). Private \`_refill(now)\`: tokens = min(cap, tokens + (now−last)·rate); last = now. try_acquire: validate n ≤ cap; refill; if tokens ≥ n → subtract, True; else False. wait_time: validate; compute current tokens *locally* (peek — don't commit, or commit the refill but not a consume; refill commits are harmless because refill is idempotent w.r.t. observable behavior); deficit = n − tokens; return max(0, deficit / rate). Float comparison: use a tiny epsilon or accept exact float math (document choice — with monotonic floats, 2.9999999996 < 3 denies a legitimate acquire; epsilon = 1e-9 is the pragmatic answer).",
    fullSolution:
      "\`\`\`python\nimport time\n\nclass TokenBucket:\n    _EPS = 1e-9\n\n    def __init__(self, capacity: float, refill_rate: float, clock=time.monotonic):\n        if capacity <= 0 or refill_rate <= 0:\n            raise ValueError('capacity and refill_rate must be positive')\n        self.capacity = capacity\n        self.rate = refill_rate\n        self._clock = clock\n        self._tokens = capacity\n        self._last = clock()\n\n    def _refreshed(self, now: float) -> float:\n        return min(self.capacity, self._tokens + (now - self._last) * self.rate)\n\n    def try_acquire(self, n: float = 1.0) -> bool:\n        if n > self.capacity:\n            raise ValueError('n exceeds capacity')\n        now = self._clock()\n        tokens = self._refreshed(now)\n        self._last = now\n        if tokens + self._EPS >= n:\n            self._tokens = tokens - n\n            return True\n        self._tokens = tokens\n        return False\n\n    def wait_time(self, n: float = 1.0) -> float:\n        if n > self.capacity:\n            raise ValueError('n exceeds capacity')\n        tokens = self._refreshed(self._clock())\n        deficit = n - tokens\n        return 0.0 if deficit <= 0 else deficit / self.rate\n\`\`\`\n\nDesign conversation the code should trigger: token bucket allows bursts up to capacity (good for clients, sometimes bad for servers); leaky bucket / GCRA smooths instead. Knowing which knob (capacity) controls burst and which (rate) controls sustained throughput is the practical takeaway.",
    commonMistakes: [
      "Tick-based refill (adding whole tokens per second boundary) — fails the wait_time(1) == 0.5 test.",
      "wait_time mutating token state or, worse, consuming tokens.",
      "Forgetting the min(capacity, …) clamp — idle buckets accumulate unbounded burst.",
      "Reading the clock twice in one method and computing with inconsistent nows.",
      "Strict float ≥ comparisons denying acquires that are mathematically valid (no epsilon policy).",
    ],
    followUpQuestions: [
      "Make it thread-safe with minimal contention. Why is a plain lock fine here, and when would you shard buckets?",
      "Implement acquire-with-blocking on top of wait_time — what's wrong with sleep(wait_time(n)) then acquire in a loop, and why is a loop still the answer?",
      "Compare with GCRA: what does GCRA store per key and why do Redis-backed limiters prefer it?",
    ],
    rubric: [
      { criterion: "Continuous refill math", description: "Float-rate accrual with capacity clamp; passes the fractional wait test." },
      { criterion: "Purity of wait_time", description: "Read-only observable behavior, justified." },
      { criterion: "Numeric care", description: "Epsilon policy (or explicit defense of exact floats); single clock read." },
      { criterion: "Semantics fluency", description: "Can explain burst vs sustained-rate knobs and the leaky-bucket contrast." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.wikipedia.org/wiki/Token_bucket",
      "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "retry-backoff-wrapper-spec",
    title: "Retry Wrapper with Exponential Backoff and Full Jitter",
    type: "write_code",
    difficulty: "medium",
    topics: ["retries", "backoff", "reliability", "python", "decorators"],
    targetRoles: ["backend_swe", "platform_engineer", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "Write \`retry(...)\` returning a decorator:\n\n\`\`\`text\nretry(max_attempts=4, base_delay=0.1, max_delay=5.0,\n      retry_on=(TimeoutError,), sleep=time.sleep, rng=random.random)\n\`\`\`\n\nSemantics:\n- Attempt the function up to \`max_attempts\` times total (first call counts as attempt 1).\n- Between attempt k and k+1, sleep \`rng() × min(max_delay, base_delay × 2^(k−1))\` — full jitter.\n- Retry only exceptions matching \`retry_on\` (isinstance semantics); anything else propagates immediately.\n- If the final attempt fails with a retryable error, re-raise **that exception** (not a new one), preserving traceback.\n- The wrapper must preserve the function's name/docstring and pass through args/kwargs and the return value.",
    context:
      "Every SDK and platform team owns one of these. The spec encodes the AWS-endorsed full-jitter algorithm; the injectable sleep/rng make it testable — deterministic tests are half the grade.",
    constraints:
      "- No real sleeping in tests — everything injected\n- No retrying on success, obviously — but also no sleep *after* the final failure\n- functools.wraps required; decorator must work with and without arguments? No — args-required form only (keep the spec tight)",
    starterCode:
      "import functools\nimport random\nimport time\n\ndef retry(max_attempts=4, base_delay=0.1, max_delay=5.0,\n          retry_on=(Exception,), sleep=time.sleep, rng=random.random):\n    def decorator(fn):\n        ...\n    return decorator\n",
    tests: [
      { name: "success no retry", input: "fn succeeds; call", expected: "1 call, 0 sleeps" },
      { name: "retry then success", input: "fn: [Timeout, Timeout, ok]; rng=1.0", expected: "3 calls; sleeps [0.1, 0.2]" },
      { name: "cap respected", input: "base=1, max_delay=2, 4 attempts all fail; rng=1.0", expected: "sleeps [1, 2, 2]" },
      { name: "non-retryable", input: "fn raises KeyError", expected: "KeyError immediately, 1 call" },
      { name: "final re-raise", input: "all attempts Timeout", expected: "the last TimeoutError instance propagates; no sleep after it" },
      { name: "jitter", input: "rng=0.5, base=0.1", expected: "first sleep 0.05" },
    ],
    hints: [
      "Loop attempt = 1..max_attempts; on retryable failure, if attempt == max_attempts → raise; else compute delay and sleep.",
      "Full jitter means the delay is uniform in [0, cap] — multiply the whole capped exponential by rng(), don't add jitter on top.",
      "Bare \`raise\` inside the except block re-raises with the original traceback — that's the mechanism the spec is testing.",
    ],
    solutionOutline:
      "functools.wraps(fn) wrapper; for attempt in range(1, max_attempts+1): try return fn(*a, **kw); except retry_on as e: if attempt == max_attempts: raise (bare — preserves the active exception and traceback); delay = rng() * min(max_delay, base_delay * 2**(attempt-1)); sleep(delay). Everything else propagates naturally because only retry_on is caught. Tests build a stub fn with a scripted list of outcomes and record sleeps; rng=lambda:1.0 makes delays deterministic. Discussion the interviewer wants: why full jitter beats plain exponential (decorrelates synchronized clients after an outage — the thundering-herd graph in the AWS post), and why callers of non-idempotent operations must not blindly wrap POSTs.",
    fullSolution:
      "\`\`\`python\nimport functools\nimport random\nimport time\n\ndef retry(max_attempts=4, base_delay=0.1, max_delay=5.0,\n          retry_on=(Exception,), sleep=time.sleep, rng=random.random):\n    if max_attempts < 1:\n        raise ValueError('max_attempts must be >= 1')\n\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            for attempt in range(1, max_attempts + 1):\n                try:\n                    return fn(*args, **kwargs)\n                except retry_on:\n                    if attempt == max_attempts:\n                        raise\n                    delay = rng() * min(max_delay, base_delay * (2 ** (attempt - 1)))\n                    sleep(delay)\n            raise AssertionError('unreachable')\n        return wrapper\n    return decorator\n\`\`\`\n\nDeterministic test skeleton worth writing in the interview:\n\n\`\`\`python\ndef test_retry_then_success():\n    calls, sleeps = [], []\n    outcomes = [TimeoutError(), TimeoutError(), 'ok']\n    @retry(max_attempts=4, base_delay=0.1, retry_on=(TimeoutError,),\n           sleep=sleeps.append, rng=lambda: 1.0)\n    def flaky():\n        calls.append(1)\n        result = outcomes[len(calls) - 1]\n        if isinstance(result, Exception):\n            raise result\n        return result\n    assert flaky() == 'ok'\n    assert len(calls) == 3\n    assert sleeps == [0.1, 0.2]\n\`\`\`",
    commonMistakes: [
      "Sleeping after the final failed attempt (burns the caller's latency budget for nothing).",
      "\`raise e\` instead of bare \`raise\` — resets context in subtle ways; also constructing a new RetryError loses the original type the spec demands.",
      "Jitter added as ±10% instead of full jitter — different algorithm with materially worse herd behavior.",
      "Catching Exception and re-checking isinstance manually when except retry_on already does tuple matching.",
      "Off-by-one: max_attempts=4 means 4 calls and at most 3 sleeps.",
    ],
    followUpQuestions: [
      "Add a total deadline (retry budget) — how do you interact with the per-attempt delays, and what do you do mid-sleep at deadline?",
      "The wrapped call is a non-idempotent payment POST. What has to exist before retrying is safe, and where does it live in the request?",
      "How would you surface retry metrics (attempts histogram, final-failure rate) without changing every call site?",
    ],
    rubric: [
      { criterion: "Algorithm fidelity", description: "Capped exponential with full jitter, exact off-by-one behavior." },
      { criterion: "Exception discipline", description: "Selective catch, bare re-raise on final, non-retryables propagate untouched." },
      { criterion: "Testability", description: "Injected sleep/rng used to write deterministic tests on the spot." },
      { criterion: "Judgment", description: "Raises idempotency and herd-behavior concerns unprompted." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
      "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "idempotency-key-handler-spec",
    title: "Idempotency-Key Handler for a Payments Endpoint",
    type: "write_code",
    difficulty: "hard",
    topics: ["idempotency", "api-design", "concurrency", "python", "fintech"],
    targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"],
    companyStyles: ["fintech", "big_tech", "startup"],
    estimatedMinutes: 45,
    language: "python",
    prompt:
      "Implement the idempotency layer that wraps a charge handler:\n\n- \`process(key: str, payload: dict) -> Response\` where Response is \`(status: int, body: dict)\`.\n- First call with a key: execute \`handler(payload)\`, persist the response, return it.\n- Repeat call, same key, **same payload**: return the stored response without executing.\n- Same key, **different payload**: return \`(422, {'error': 'payload_mismatch'})\`, never execute.\n- Concurrent duplicate (same key while the first is still executing): do NOT execute twice; return \`(409, {'error': 'in_flight'})\` (polling is the client's job).\n- Handler exceptions: propagate to the caller, and the key becomes reusable (failed executions are not memoized).\n\nThe store starts as a dict; design so a Redis/SQL store could replace it. Payload comparison must be order-insensitive for dict keys.",
    context:
      "Modeled on how Stripe-style APIs behave. The four-state machine (new / in-flight / done / failed) and the payload-fingerprint check are the substance; a dict-with-if version that ignores concurrency fails the round.",
    constraints:
      "- Single process, multi-threaded: guard state transitions with a lock, but NEVER hold the lock during handler execution\n- Fingerprint payloads (canonical JSON → hash); store fingerprint + response, not raw payloads (why? PII minimization)\n- No TTL required, but say where it would go",
    starterCode:
      "import hashlib\nimport json\nimport threading\n\nclass IdempotencyLayer:\n    def __init__(self, handler) -> None:\n        self._handler = handler\n        ...\n\n    def process(self, key: str, payload: dict) -> tuple[int, dict]:\n        ...\n",
    tests: [
      { name: "first executes", input: "process(k1, {a:1})", expected: "handler runs once; its response returned" },
      { name: "replay returns stored", input: "process(k1, {a:1}) again", expected: "same response, handler NOT run again" },
      { name: "key reuse conflict", input: "process(k1, {a:2})", expected: "(422, payload_mismatch)" },
      { name: "dict order insensitive", input: "process(k2, {a:1,b:2}) then {b:2,a:1}", expected: "replay, not mismatch" },
      { name: "concurrent duplicate", input: "t1 in handler; t2 process(k3, same)", expected: "(409, in_flight); handler ran once" },
      { name: "failure not memoized", input: "handler raises; process(k4, p) again", expected: "handler runs again" },
    ],
    hints: [
      "Per-key record: state ∈ {IN_FLIGHT, DONE} plus fingerprint plus response. Absence = NEW. Failed = record removed.",
      "The check-and-set of the record must be atomic (lock), then release the lock and run the handler, then re-acquire to finalize. Sketch what happens if you hold the lock through the handler.",
      "Canonical fingerprint: json.dumps(payload, sort_keys=True, separators=(',',':')) then sha256. What payload types break this, and is rejecting them acceptable?",
    ],
    solutionOutline:
      "State machine per key. process(): fingerprint payload; with lock: look up record — NEW → insert {IN_FLIGHT, fp} ; IN_FLIGHT → fp mismatch ? 422 : 409 ; DONE → fp mismatch ? 422 : stored response. If we inserted IN_FLIGHT: release lock, run handler in try/except; on success re-acquire lock, write {DONE, fp, response}, return it; on exception re-acquire, delete the record (key reusable), re-raise. Lock is held only for dict transitions → handler concurrency for *different* keys unaffected. Swappable store: the record operations are get/set-if-absent/replace/delete — an interface a Redis implementation satisfies with SETNX/WATCH or Lua; note that the in-memory lock must become a store-level atomic (that's why the code should funnel all transitions through 3-4 store methods).",
    fullSolution:
      "\`\`\`python\nimport hashlib\nimport json\nimport threading\n\n_IN_FLIGHT = 'in_flight'\n_DONE = 'done'\n\ndef _fingerprint(payload: dict) -> str:\n    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))\n    return hashlib.sha256(canonical.encode()).hexdigest()\n\nclass IdempotencyLayer:\n    def __init__(self, handler):\n        self._handler = handler\n        self._records: dict[str, dict] = {}\n        self._lock = threading.Lock()\n\n    def process(self, key: str, payload: dict) -> tuple[int, dict]:\n        fp = _fingerprint(payload)\n        with self._lock:\n            rec = self._records.get(key)\n            if rec is None:\n                self._records[key] = {'state': _IN_FLIGHT, 'fp': fp}\n            elif rec['fp'] != fp:\n                return (422, {'error': 'payload_mismatch'})\n            elif rec['state'] == _IN_FLIGHT:\n                return (409, {'error': 'in_flight'})\n            else:\n                return rec['response']\n        try:\n            response = self._handler(payload)\n        except Exception:\n            with self._lock:\n                self._records.pop(key, None)\n            raise\n        with self._lock:\n            self._records[key] = {'state': _DONE, 'fp': fp, 'response': response}\n        return response\n\`\`\`\n\nWhere TTL goes: on DONE records (bound storage; Stripe uses 24 h) and on IN_FLIGHT records (crash recovery — an orphaned in-flight record without TTL bricks the key forever; that observation is senior-level).",
    commonMistakes: [
      "Holding the lock during handler execution — serializes ALL payments through one mutex; the concurrent test exposes it if written honestly.",
      "Memoizing failures — a transient 500 becomes permanently replayed; the spec says failures free the key.",
      "Comparing raw payload dicts (order-sensitive JSON strings) or storing raw payloads (PII).",
      "Returning the in-flight request's *eventual* response by blocking — spec says 409; blocking couples client latency to a stranger's request.",
      "No plan for orphaned IN_FLIGHT records after a crash (the TTL discussion)."
    ],
    followUpQuestions: [
      "Two app servers, shared Redis: rewrite the three state transitions as atomic Redis operations. Where do you need Lua or WATCH/MULTI?",
      "Client retries a request whose first execution is still running 30 s later. Walk the UX and API options beyond 409.",
      "Why does the payload-mismatch case return 422 and not execute — what fraud/bug scenario is that clause protecting against?",
    ],
    rubric: [
      { criterion: "State machine completeness", description: "All five spec behaviors implemented; absence/failed states handled." },
      { criterion: "Concurrency correctness", description: "Atomic check-and-set; lock never held across the handler; can explain why." },
      { criterion: "Fingerprint design", description: "Canonical JSON + hash; PII rationale; knows what inputs break canonicalization." },
      { criterion: "Operational maturity", description: "TTLs for DONE and orphaned IN_FLIGHT raised unprompted." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://stripe.com/blog/idempotency",
      "https://brandur.org/idempotency-keys",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "job-scheduler-spec",
    title: "Deadline Job Scheduler with Priorities and Cancellation",
    type: "write_code",
    difficulty: "medium",
    topics: ["scheduling", "heap", "design", "python"],
    targetRoles: ["backend_swe", "platform_engineer", "new_grad_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Implement a single-threaded job scheduler:\n\n- \`schedule(fn, run_at: float, priority: int = 0) -> int\` — returns a job id.\n- \`cancel(job_id) -> bool\` — True iff the job existed and hadn't run.\n- \`run_due(now: float) -> list[int]\` — run every job with \`run_at <= now\`, in order: earliest run_at first; ties by higher priority; further ties by schedule order. Returns executed job ids. Jobs scheduled *by other jobs* during run_due are eligible in the same call if due.\n- Exceptions from a job must not stop the batch; failed ids still count as executed.",
    context:
      "A distilled cron/queue core. The three-level ordering, cancellation without O(n) heap surgery, and the reentrancy clause (jobs scheduling jobs) are the specified teeth.",
    constraints:
      "- O(log n) schedule/cancel; run_due O(k log n) for k executed\n- No threads, no sleeping — run_due is called by an external loop\n- Job ids monotonically increasing ints",
    starterCode:
      "import heapq\nimport itertools\n\nclass Scheduler:\n    def __init__(self) -> None:\n        ...\n\n    def schedule(self, fn, run_at: float, priority: int = 0) -> int: ...\n    def cancel(self, job_id: int) -> bool: ...\n    def run_due(self, now: float) -> list[int]: ...\n",
    tests: [
      { name: "ordering", input: "A(t=1,p=0), B(t=1,p=5), C(t=0,p=0); run_due(1)", expected: "[C, B, A]" },
      { name: "cancel", input: "schedule A; cancel(A); run_due", expected: "A not run; cancel→True; second cancel→False" },
      { name: "reentrant", input: "job X (t=0) schedules Y at t=0; run_due(0)", expected: "[X, Y] — Y runs in the same batch" },
      { name: "exception isolation", input: "A raises; B due after A", expected: "[A, B]; B still ran" },
      { name: "not due", input: "A at t=5; run_due(4)", expected: "[] and A still scheduled" },
    ],
    hints: [
      "Heap key: (run_at, -priority, seq). The seq counter does double duty: FIFO tie-break AND job id.",
      "Cancellation: tombstone set (or entry-marked-invalid pattern from the heapq docs) — pop-and-skip at run time.",
      "Reentrancy is free if your loop re-examines the heap top after each job instead of snapshotting due jobs up front. Snapshotting is the bug the test hunts.",
    ],
    solutionOutline:
      "Heap of (run_at, -priority, job_id); id from itertools.count; alive = {id: fn} dict (doubles as tombstone check — cancel = pop from dict). run_due: loop while heap and heap[0].run_at <= now: pop; if id not in alive → skip (canceled); else remove from alive, call fn in try/except, append id. Because each iteration re-reads the live heap, jobs scheduled during execution are naturally considered — including ones due *now* (they were pushed with run_at ≤ now). Careful: a job scheduling an *earlier* job than the current heap top is fine — next loop iteration pops the true minimum. Return executed ids in execution order.",
    fullSolution:
      "\`\`\`python\nimport heapq\nimport itertools\n\nclass Scheduler:\n    def __init__(self):\n        self._heap: list[tuple[float, int, int]] = []\n        self._alive: dict[int, object] = {}\n        self._ids = itertools.count(1)\n\n    def schedule(self, fn, run_at: float, priority: int = 0) -> int:\n        job_id = next(self._ids)\n        self._alive[job_id] = fn\n        heapq.heappush(self._heap, (run_at, -priority, job_id))\n        return job_id\n\n    def cancel(self, job_id: int) -> bool:\n        return self._alive.pop(job_id, None) is not None\n\n    def run_due(self, now: float) -> list[int]:\n        executed = []\n        while self._heap and self._heap[0][0] <= now:\n            _, _, job_id = heapq.heappop(self._heap)\n            fn = self._alive.pop(job_id, None)\n            if fn is None:\n                continue  # canceled tombstone\n            try:\n                fn()\n            except Exception:\n                pass  # spec: isolate failures; production would log\n            executed.append(job_id)\n        return executed\n\`\`\`\n\nSubtlety worth voicing: the tie-break triple works only because job ids are assigned in schedule order — if cancel-and-reschedule must keep the original position, id-as-seq breaks and you need a separate seq. Spec doesn't require it; saying so shows you read specs for what they *don't* promise.",
    commonMistakes: [
      "Snapshotting due jobs before running them — fails the reentrancy test.",
      "Priority sign error (heapq is a min-heap; higher priority must sort smaller).",
      "cancel() doing an O(n) heap scan/rebuild instead of tombstoning.",
      "Letting one job's exception abort the batch, or swallowing it *and* dropping the id from the result.",
      "Using wall-clock time inside the class instead of the now parameter (untestable, and double-clocking).",
    ],
    followUpQuestions: [
      "Add recurring jobs (every N seconds). Where does drift come from — reschedule-from-run_at vs reschedule-from-now — and which does cron do?",
      "Make run_due respect a time budget (stop after 10 ms). What starvation risk appears and how would you mitigate?",
      "Persist the schedule across restarts. What exactly must be durable, and when do you fsync?",
    ],
    rubric: [
      { criterion: "Ordering exactness", description: "(run_at, -priority, seq) or equivalent; all three levels tested." },
      { criterion: "Cancellation design", description: "O(log n)-compatible tombstoning; correct double-cancel semantics." },
      { criterion: "Reentrancy", description: "Heap re-examined per iteration; same-batch execution of newly-due jobs." },
      { criterion: "Failure isolation", description: "Batch continues; ids reported per spec." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/library/heapq.html#priority-queue-implementation-notes",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "orderbook-level-aggregator-spec",
    title: "Order Book Level Aggregator (L3 → L2)",
    type: "write_code",
    difficulty: "hard",
    topics: ["order-book", "market-data", "design", "python", "streaming"],
    targetRoles: ["quant_developer", "hft_swe"],
    companyStyles: ["hft", "quant_fund"],
    estimatedMinutes: 45,
    language: "python",
    prompt:
      "An exchange feed sends per-order (L3) events. Build the L2 aggregation:\n\n- \`on_add(order_id, side, price, qty)\`\n- \`on_modify(order_id, new_qty)\` — qty change only; a modify to qty 0 is a remove\n- \`on_delete(order_id)\`\n- \`top(side, n) -> list[(price, total_qty, order_count)]\` — best-first (bids descending, asks ascending), only levels with qty > 0\n\nEvents can be hostile: add for an existing id, modify/delete for unknown ids, negative qty. Policy: **ignore and count** — expose \`stats()\` with a per-anomaly-type counter. Feed handlers must never throw on bad input.",
    context:
      "The exact shape of a feed-handler interview at trading firms. Grading concentrates on bookkeeping exactness (level totals must never drift from order truth) and the hostile-input policy.",
    constraints:
      "- ≤ 10^6 events; O(1) add/modify/delete; top(n) may be O(L log L) but discuss the sorted-structure alternative\n- A level's (total_qty, order_count) must exactly equal the sum over live orders at that price at all times — drift is an automatic fail\n- Python dict/sorted list fine; discuss what changes in C++",
    starterCode:
      "class BookAggregator:\n    def __init__(self) -> None:\n        ...\n\n    def on_add(self, order_id: str, side: str, price: int, qty: int) -> None: ...\n    def on_modify(self, order_id: str, new_qty: int) -> None: ...\n    def on_delete(self, order_id: str) -> None: ...\n    def top(self, side: str, n: int) -> list[tuple[int, int, int]]: ...\n    def stats(self) -> dict: ...\n",
    tests: [
      { name: "aggregate adds", input: "add(o1,B,100,5); add(o2,B,100,3); top(B,1)", expected: "[(100, 8, 2)]" },
      { name: "modify adjusts delta", input: "modify(o1, 2); top(B,1)", expected: "[(100, 5, 2)]" },
      { name: "modify to zero removes", input: "modify(o2, 0); top(B,1)", expected: "[(100, 2, 1)]" },
      { name: "level vanishes", input: "delete(o1); top(B,1)", expected: "[]" },
      { name: "hostile inputs", input: "delete(ghost); add(o1 twice); modify(ghost, 5)", expected: "book unchanged; stats counters incremented" },
      { name: "bid/ask ordering", input: "asks at 101,102; bids at 99,98; top each side 2", expected: "asks ascending, bids descending" },
    ],
    hints: [
      "Two maps: orders (id → side, price, qty) and levels[side] (price → [total_qty, order_count]). Every mutation updates both, from the *order's stored state*, never from event arguments alone.",
      "on_modify only carries the id — the price and old qty come from your order map. Apply the delta to the level.",
      "Duplicate add: if you applied it, totals would double-count an id you can no longer distinguish. Ignore-and-count is not laziness; it's the only consistent option for this event vocabulary.",
    ],
    solutionOutline:
      "orders: dict id → (side, price, qty). levels: {side: dict price → [qty_sum, count]}. add: reject if id exists or qty ≤ 0 (count anomaly); else record order and fold into level (creating it). modify: look up order; unknown/negative → count; delta = new − old; qty 0 → treat as delete; else update order qty and level qty_sum. delete: pop order; decrement level; when count hits 0, remove the price key (empty levels must not linger — the 'level vanishes' test). top: sort the side's prices (desc for bids), take n, emit tuples. Sorting per query is O(L log L) with L = live levels (usually small); the alternative — a sorted container maintained incrementally — pays log per event to make top O(n); which wins depends on event:query ratio (same read/write asymmetry conversation as dashboards, opposite conclusion for a feed at 10^6 events/s). C++: flat maps / price-indexed arrays around a known tick range, intrusive structures, no per-event allocation.",
    fullSolution:
      "\`\`\`python\nfrom collections import defaultdict\n\nclass BookAggregator:\n    def __init__(self):\n        self._orders: dict[str, tuple[str, int, int]] = {}\n        self._levels = {'B': {}, 'S': {}}\n        self._stats = defaultdict(int)\n\n    def _level_apply(self, side, price, dqty, dcount):\n        lvl = self._levels[side].get(price)\n        if lvl is None:\n            lvl = [0, 0]\n            self._levels[side][price] = lvl\n        lvl[0] += dqty\n        lvl[1] += dcount\n        if lvl[1] <= 0:\n            del self._levels[side][price]\n\n    def on_add(self, order_id, side, price, qty):\n        if order_id in self._orders:\n            self._stats['duplicate_add'] += 1\n            return\n        if qty <= 0 or side not in ('B', 'S'):\n            self._stats['invalid_add'] += 1\n            return\n        self._orders[order_id] = (side, price, qty)\n        self._level_apply(side, price, qty, 1)\n\n    def on_modify(self, order_id, new_qty):\n        order = self._orders.get(order_id)\n        if order is None:\n            self._stats['modify_unknown'] += 1\n            return\n        if new_qty < 0:\n            self._stats['invalid_modify'] += 1\n            return\n        if new_qty == 0:\n            self.on_delete(order_id)\n            return\n        side, price, qty = order\n        self._orders[order_id] = (side, price, new_qty)\n        self._level_apply(side, price, new_qty - qty, 0)\n\n    def on_delete(self, order_id):\n        order = self._orders.pop(order_id, None)\n        if order is None:\n            self._stats['delete_unknown'] += 1\n            return\n        side, price, qty = order\n        self._level_apply(side, price, -qty, -1)\n\n    def top(self, side, n):\n        prices = sorted(self._levels[side], reverse=(side == 'B'))[:n]\n        return [(p, self._levels[side][p][0], self._levels[side][p][1]) for p in prices]\n\n    def stats(self):\n        return dict(self._stats)\n\`\`\`",
    commonMistakes: [
      "Trusting on_modify's event data for price (it doesn't carry one) or recomputing levels from scratch per event.",
      "Leaving zero-qty/zero-count level entries in the map — top() then reports ghost levels or needs filtering everywhere.",
      "Throwing on unknown ids — feed handlers that throw on hostile input die mid-session; the spec makes the policy explicit.",
      "Bid/ask sort direction flipped (the single most common demo-time failure).",
      "Applying duplicate adds 'defensively' — corrupts totals in a way no later event can repair.",
    ],
    followUpQuestions: [
      "The feed has sequence numbers and can gap. What do you do at a gap — and what does 'snapshot + incremental recovery' require of this class's API?",
      "Maintain best-bid/ask in O(1) per event instead of sorting in top(). What structure and what's the cost on level-creation events?",
      "In C++, how do you make on_modify allocation-free, and why does that matter at 10^6 events/s (hint: allocator jitter → latency tails)?",
    ],
    rubric: [
      { criterion: "Dual-map bookkeeping", description: "Order truth and level aggregates stay exactly consistent through all six event paths." },
      { criterion: "Hostile-input policy", description: "Ignore-and-count implemented uniformly; no code path throws." },
      { criterion: "Level lifecycle", description: "Levels created and destroyed correctly; no ghost levels." },
      { criterion: "Performance conversation", description: "Sort-per-query vs sorted-structure trade-off argued with the event:query ratio." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "logfmt-parser-spec",
    title: "Tolerant logfmt Parser",
    type: "write_code",
    difficulty: "medium",
    topics: ["parsing", "strings", "logging", "python", "state-machines"],
    targetRoles: ["backend_swe", "platform_engineer", "infrastructure_swe"],
    companyStyles: ["infra_heavy", "startup", "big_tech"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Parse logfmt lines into dicts:\n\n\`level=info msg=\"user logged in\" user_id=42 latency_ms=3.5 cached\`\n\nRules:\n- \`key=value\` pairs separated by whitespace; bare keys (no \`=\`) get value \`True\`.\n- Quoted values may contain spaces and escaped quotes (\`\\\\\"\`) and escaped backslashes.\n- Values that look like ints/floats become int/float; \`true\`/\`false\` become bools; everything else stays str.\n- Malformed input (unterminated quote, empty key like \`=5\`) must not raise: return what parsed cleanly plus a \`_parse_errors\` list describing each problem.\n- Duplicate keys: last one wins, but record a note in \`_parse_errors\`.",
    context:
      "Every platform team writes one of these for log pipelines. It grades hand-rolled lexing (a small state machine), escape handling, and the production posture that parsers of dirty input must degrade, not die.",
    constraints:
      "- Single pass, O(len(line)); no regex for the tokenizer (use it for number detection if you like — but be able to lex by hand)\n- The escape rules are exactly two: \\\\\" → \" and \\\\\\\\ → \\\\ inside quotes; any other backslash is literal\n- Type coercion happens only on unquoted values — \`msg=\"42\"\` stays the string \"42\"",
    starterCode:
      "def parse_logfmt(line: str) -> dict:\n    \"\"\"Parse one logfmt line. Never raises on malformed input;\n    problems are reported under the '_parse_errors' key.\"\"\"\n    ...\n",
    tests: [
      { name: "basic types", input: "a=1 b=2.5 c=true d=hello", expected: "{a:1, b:2.5, c:True, d:'hello'}" },
      { name: "quoted", input: 'msg="user logged in" x=1', expected: "msg='user logged in', x=1" },
      { name: "escapes", input: 'msg="she said \\\\\"hi\\\\\"" p="a\\\\\\\\b"', expected: "msg='she said \"hi\"', p='a\\\\b'" },
      { name: "bare key", input: "cached level=info", expected: "cached=True, level='info'" },
      { name: "quoted number stays str", input: 'v="42"', expected: "v == '42' (str)" },
      { name: "unterminated", input: 'a=1 msg="oops', expected: "a=1 plus _parse_errors entry; no exception" },
      { name: "duplicate", input: "x=1 x=2", expected: "x=2 with duplicate noted" },
    ],
    hints: [
      "States: BETWEEN, KEY, VALUE_START (decides quoted/unquoted), UNQUOTED_VALUE, QUOTED_VALUE, QUOTED_ESCAPE. Draw it before coding.",
      "Track whether the value was quoted — coercion is gated on it. A parallel 'was_quoted' flag at commit time is enough.",
      "Coercion order matters: try int before float ('42' must be int), and check the exact strings 'true'/'false' before numeric parsing.",
    ],
    solutionOutline:
      "Hand-rolled scanner over the line with an index. Loop: skip whitespace; read key until \`=\` or whitespace/end (whitespace/end → bare key True; empty key → error entry, resync by skipping to next whitespace); on \`=\`, peek for quote. Unquoted: read to next whitespace, coerce (true/false → bool; int(); float(); else str). Quoted: consume until closing quote handling the two escapes via a small escape state; EOF before close → record 'unterminated quote' error, keep the partial? Cleanest spec-compliant choice: discard the partial value, record error (state the choice). Commit each pair into the result; duplicates overwrite + append note. Attach _parse_errors only when non-empty (or always — pick and document; tests here assume only-when-non-empty... actually always attaching complicates the 'basic' expected dicts, so: only when non-empty). Resynchronization after errors — skip to next whitespace — is what makes the parser tolerant instead of cascading.",
    fullSolution:
      "\`\`\`python\ndef _coerce(raw: str):\n    if raw == 'true':\n        return True\n    if raw == 'false':\n        return False\n    try:\n        return int(raw)\n    except ValueError:\n        pass\n    try:\n        return float(raw)\n    except ValueError:\n        return raw\n\ndef parse_logfmt(line: str) -> dict:\n    out: dict = {}\n    errors: list[str] = []\n    i, n = 0, len(line)\n\n    def put(key, value):\n        if key in out:\n            errors.append(f'duplicate key: {key}')\n        out[key] = value\n\n    while i < n:\n        while i < n and line[i].isspace():\n            i += 1\n        if i >= n:\n            break\n        key_start = i\n        while i < n and not line[i].isspace() and line[i] != '=':\n            i += 1\n        key = line[key_start:i]\n        if i >= n or line[i].isspace():\n            if key:\n                put(key, True)\n            continue\n        i += 1  # consume '='\n        if not key:\n            errors.append(f'empty key at column {key_start}')\n            while i < n and not line[i].isspace():\n                i += 1\n            continue\n        if i < n and line[i] == '\"':\n            i += 1\n            buf = []\n            closed = False\n            while i < n:\n                ch = line[i]\n                if ch == '\\\\' and i + 1 < n and line[i + 1] in ('\"', '\\\\'):\n                    buf.append(line[i + 1])\n                    i += 2\n                    continue\n                if ch == '\"':\n                    closed = True\n                    i += 1\n                    break\n                buf.append(ch)\n                i += 1\n            if closed:\n                put(key, ''.join(buf))\n            else:\n                errors.append(f'unterminated quote for key: {key}')\n        else:\n            val_start = i\n            while i < n and not line[i].isspace():\n                i += 1\n            put(key, _coerce(line[val_start:i]))\n    if errors:\n        out['_parse_errors'] = errors\n    return out\n\`\`\`",
    commonMistakes: [
      "Splitting on spaces first — quoted values with spaces shatter; the whole problem is that you can't pre-split.",
      "Coercing quoted values (\`\"42\"\` → 42) — the spec gates coercion on quoting.",
      "Escape handling that processes \\\\\\\\ then re-scans the produced \\\\ as an escape (double-processing).",
      "Raising on malformed input, or worse: silently dropping it with no _parse_errors trail.",
      "float('1e3') surprises: '1e3' coerces to 1000.0 — decide if that's desired; tests should pin it.",
    ],
    followUpQuestions: [
      "Extend to a streaming API fed in chunks that may split mid-token. Which parser states must become resumable object state?",
      "The pipeline parses 500k lines/s. Name three Python-level optimizations and the point at which you'd rewrite in Rust/Go.",
      "Why did logfmt win in ops tooling vs JSON logs, and when is it the wrong choice?",
    ],
    rubric: [
      { criterion: "Lexer structure", description: "Clean state machine with explicit states; no split-then-fix hacks." },
      { criterion: "Escape correctness", description: "Both escapes exact; no double-processing; literal backslash preserved otherwise." },
      { criterion: "Degradation policy", description: "Never raises; errors recorded with useful positions; resync logic sound." },
      { criterion: "Coercion rules", description: "Quoting gates coercion; int-before-float; true/false handled." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://brandur.org/logfmt"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "cursor-pagination-helper-spec",
    title: "Opaque Cursor Pagination Helper",
    type: "write_code",
    difficulty: "medium",
    topics: ["pagination", "api-design", "databases", "python", "encoding"],
    targetRoles: ["backend_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Build the cursor layer for \`GET /events?limit=N&cursor=...\` over rows sorted by \`(created_at DESC, id DESC)\`:\n\n- \`encode_cursor(created_at: int, id: str) -> str\` — opaque, URL-safe\n- \`decode_cursor(cursor: str) -> (int, str)\` — raises \`InvalidCursor\` on anything malformed or tampered\n- \`paginate(rows, limit, cursor | None) -> (page, next_cursor | None)\` where rows is the full sorted list (stand-in for the DB) — return rows strictly *after* the cursor position; next_cursor only when more rows remain\n\nThe cursor must encode position, not offset — inserting new rows must never shift or duplicate results for a client mid-pagination. Include an HMAC so clients can't forge cursors.",
    context:
      "Cursor-vs-offset is a staple API-design interview. The composite tie-break (created_at alone is not unique!) and the exactly-one-more-row trick for has-more are the graded details.",
    constraints:
      "- Cursor: base64url(JSON payload + HMAC-SHA256 tag); constant-time tag comparison\n- 'After the cursor' under (created_at DESC, id DESC) means: created_at < c.created_at OR (== AND id < c.id) — get the composite comparison right\n- limit 1..100 enforced; fetching limit+1 rows is the has-more idiom (write it even though rows is in memory)",
    starterCode:
      "import base64\nimport hashlib\nimport hmac\nimport json\n\nSECRET = b'rotate-me'\n\nclass InvalidCursor(Exception):\n    pass\n\ndef encode_cursor(created_at: int, id: str) -> str: ...\ndef decode_cursor(cursor: str) -> tuple[int, str]: ...\n\ndef paginate(rows: list[dict], limit: int, cursor: str | None):\n    \"\"\"rows sorted by (created_at DESC, id DESC). Returns (page, next_cursor).\"\"\"\n    ...\n",
    tests: [
      { name: "first page", input: "10 rows, limit 3, no cursor", expected: "rows 0-2 + cursor" },
      { name: "follow cursor", input: "cursor from page 1", expected: "rows 3-5, no overlap/skip" },
      { name: "tie on created_at", input: "rows sharing created_at, paginate across the tie", expected: "no dupes, no skips (id tie-break)" },
      { name: "insert during pagination", input: "new row added at top after page 1", expected: "page 2 unaffected" },
      { name: "last page", input: "final rows", expected: "next_cursor is None" },
      { name: "tampered", input: "flip one char in cursor", expected: "InvalidCursor" },
    ],
    hints: [
      "Payload {'t': created_at, 'i': id}; tag = HMAC(secret, payload_bytes); cursor = b64url(payload_bytes || tag). Decode = split, recompute, hmac.compare_digest.",
      "The 'after' predicate is lexicographic on the DESC-DESC sort: strictly-less on the tuple (t, i) when both are compared descending.",
      "Fetch limit+1: if you got the extra row, there's a next page and the cursor points at the last *returned* row (not the extra one).",
    ],
    solutionOutline:
      "encode: canonical JSON bytes, HMAC-SHA256 tag, concatenate with a separator that can't appear in b64 (or fixed-length tag — 32 bytes — so no separator needed), base64url. decode: b64-decode (errors → InvalidCursor), split fixed-length tag, recompute, compare_digest, parse JSON, validate field types. paginate: validate limit; if cursor, filter rows to those with (t, i) strictly after under DESC ordering: (row.t < t) or (row.t == t and row.id < id); take limit+1; page = first limit; next_cursor = encode(last of page) iff extra row existed. In SQL this predicate is exactly \`WHERE (created_at, id) < (:t, :i) ORDER BY created_at DESC, id DESC LIMIT :n+1\` (row-value comparison) — writing that down closes the loop between helper and query, and is why the cursor must contain every sort key.",
    fullSolution:
      "\`\`\`python\nimport base64\nimport hmac\nimport hashlib\nimport json\n\nSECRET = b'rotate-me'\n_TAG_LEN = 32\n\nclass InvalidCursor(Exception):\n    pass\n\ndef encode_cursor(created_at: int, id: str) -> str:\n    payload = json.dumps({'t': created_at, 'i': id}, separators=(',', ':')).encode()\n    tag = hmac.new(SECRET, payload, hashlib.sha256).digest()\n    return base64.urlsafe_b64encode(payload + tag).decode()\n\ndef decode_cursor(cursor: str) -> tuple[int, str]:\n    try:\n        raw = base64.urlsafe_b64decode(cursor.encode())\n    except Exception as exc:\n        raise InvalidCursor('bad encoding') from exc\n    if len(raw) <= _TAG_LEN:\n        raise InvalidCursor('too short')\n    payload, tag = raw[:-_TAG_LEN], raw[-_TAG_LEN:]\n    expected = hmac.new(SECRET, payload, hashlib.sha256).digest()\n    if not hmac.compare_digest(tag, expected):\n        raise InvalidCursor('bad signature')\n    try:\n        data = json.loads(payload)\n        return int(data['t']), str(data['i'])\n    except (ValueError, KeyError, TypeError) as exc:\n        raise InvalidCursor('bad payload') from exc\n\ndef paginate(rows, limit, cursor=None):\n    if not 1 <= limit <= 100:\n        raise ValueError('limit must be in 1..100')\n    if cursor is not None:\n        t, i = decode_cursor(cursor)\n        rows = [r for r in rows\n                if r['created_at'] < t or (r['created_at'] == t and r['id'] < i)]\n    window = rows[: limit + 1]\n    page = window[:limit]\n    next_cursor = None\n    if len(window) > limit and page:\n        last = page[-1]\n        next_cursor = encode_cursor(last['created_at'], last['id'])\n    return page, next_cursor\n\`\`\`",
    commonMistakes: [
      "Cursor = offset in base64 — decodes to the same instability offset pagination has; the insert-during-pagination test fails.",
      "created_at alone in the cursor — ties duplicate or skip rows; the composite key is the point.",
      "Comparison direction flipped for DESC ordering (getting rows *before* the cursor).",
      "String equality for the HMAC tag (timing side channel) instead of compare_digest.",
      "next_cursor pointing at the limit+1 probe row, skipping it forever.",
    ],
    followUpQuestions: [
      "Support backward pagination (prev_cursor) — what extra state or query shape do you need?",
      "The sort becomes (score DESC, created_at DESC, id DESC) where score updates live. What guarantees survive, and what do you tell API consumers?",
      "Why do public APIs prefer opaque signed cursors over transparent ones — name two operational reasons beyond forgery.",
    ],
    rubric: [
      { criterion: "Keyset correctness", description: "Composite (t, id) predicate exact under DESC-DESC; tie test passes." },
      { criterion: "Opaque + authenticated", description: "b64url + HMAC with constant-time compare; robust decode error taxonomy." },
      { criterion: "Has-more idiom", description: "limit+1 probe; cursor anchored to last returned row." },
      { criterion: "SQL mapping", description: "Can write the row-value WHERE clause the helper corresponds to." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://use-the-index-luke.com/no-offset",
      "https://slack.engineering/evolving-api-pagination-at-slack/",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "feature-flag-evaluator-spec",
    title: "Feature Flag Evaluator with Deterministic Rollouts",
    type: "write_code",
    difficulty: "medium",
    topics: ["feature-flags", "hashing", "design", "python"],
    targetRoles: ["backend_swe", "fullstack_swe", "platform_engineer"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Implement \`evaluate(flag: dict, ctx: dict) -> bool\` for this flag schema:\n\n\`\`\`text\n{\n  'key': 'new-checkout',\n  'enabled': True,                  # kill switch: False → always False\n  'rules': [                        # first matching rule wins\n    {'type': 'allowlist', 'values': ['user-1']},\n    {'type': 'attribute', 'attr': 'plan', 'op': 'in', 'values': ['pro']},\n    {'type': 'rollout',   'percent': 25},\n  ],\n  'default': False,                 # no rule matched\n}\n\`\`\`\n\nRules:\n- allowlist matches when \`ctx['user_id']\` is in values → True\n- attribute supports ops \`in\`, \`eq\`, \`gt\` (numeric) on \`ctx[attr]\`; missing attr → rule does not match (fall through, not False)\n- rollout: deterministic — the same (flag key, user_id) must always land the same side; changing percent from 25→50 must keep the original 25% enabled (monotone expansion)\n- Malformed rules: skip and continue (collect into an \`errors\` list if you expose one)",
    context:
      "The heart of LaunchDarkly/Unleash-style SDKs. Deterministic bucketing via hashing — not random() — and the monotone-expansion property are what interviewers check; both have caused real incidents when done wrong.",
    constraints:
      "- Bucket = int(sha256(f'{flag_key}:{user_id}')…) % 10000 compared against percent×100 — per-flag salting so users don't get correlated experiences across flags\n- No global state; pure function of (flag, ctx)\n- Think stampedes: why must percent bumps not reshuffle already-enabled users?",
    starterCode:
      "import hashlib\n\ndef evaluate(flag: dict, ctx: dict) -> bool:\n    ...\n",
    tests: [
      { name: "kill switch", input: "enabled=False, allowlisted user", expected: "False" },
      { name: "allowlist", input: "user-1", expected: "True (first rule)" },
      { name: "attribute in", input: "plan=pro", expected: "True" },
      { name: "missing attr falls through", input: "no plan attr, 25% rollout", expected: "rollout decides, not False" },
      { name: "rollout deterministic", input: "same user evaluated twice", expected: "same result" },
      { name: "monotone expansion", input: "user enabled at 25%; percent→50", expected: "still enabled" },
      { name: "default", input: "percent=0, nothing matches", expected: "default (False)" },
    ],
    hints: [
      "First-match-wins means each rule returns True (matched-enable), or 'no match' — model that as True | None, with rollout returning True when in-bucket and None when out? Careful: read the schema — does an out-of-bucket rollout fall through or end evaluation? Define it: fall through to remaining rules / default.",
      "Bucketing: hash → uniform int in [0, 10000); user is enabled iff bucket < percent*100. Monotone expansion is then automatic — that's WHY the comparison is < against a threshold.",
      "sha256 over f'{flag_key}:{user_id}', take the first 8 hex chars → int. Any stable slice works; document it because changing it later reshuffles every user.",
    ],
    solutionOutline:
      "Guard: not flag['enabled'] → False. For each rule (in order, inside try/except for malformed): allowlist → True if user_id in values else None; attribute → None if attr missing; apply op (in/eq/gt with numeric coercion for gt) → True if match else None; rollout → bucket(flag_key, user_id) < percent*100 → True else None. First non-None True ends evaluation; all None → default. The chosen fall-through semantics (out-of-bucket rollout falls through) must be stated — the schema's example only works sensibly if rules are enable-gates. Bucket function: sha256, slice 8 hex → int, % 10000. Threshold comparison gives monotone expansion for free; random() or unsalted hashing are the two classic incident-causing mistakes (flicker per request; correlated cohorts across flags).",
    fullSolution:
      "\`\`\`python\nimport hashlib\n\ndef _bucket(flag_key: str, user_id: str) -> int:\n    h = hashlib.sha256(f'{flag_key}:{user_id}'.encode()).hexdigest()\n    return int(h[:8], 16) % 10000\n\ndef _match(rule: dict, flag_key: str, ctx: dict) -> bool | None:\n    kind = rule.get('type')\n    if kind == 'allowlist':\n        return True if ctx.get('user_id') in rule['values'] else None\n    if kind == 'attribute':\n        if rule['attr'] not in ctx:\n            return None\n        val = ctx[rule['attr']]\n        op = rule['op']\n        if op == 'in':\n            return True if val in rule['values'] else None\n        if op == 'eq':\n            return True if val == rule['values'][0] else None\n        if op == 'gt':\n            return True if float(val) > float(rule['values'][0]) else None\n        raise ValueError(f'unknown op {op}')\n    if kind == 'rollout':\n        user_id = ctx.get('user_id')\n        if user_id is None:\n            return None\n        return True if _bucket(flag_key, user_id) < rule['percent'] * 100 else None\n    raise ValueError(f'unknown rule type {kind}')\n\ndef evaluate(flag: dict, ctx: dict) -> bool:\n    if not flag.get('enabled', False):\n        return False\n    for rule in flag.get('rules', []):\n        try:\n            if _match(rule, flag['key'], ctx) is True:\n                return True\n        except (KeyError, ValueError, TypeError):\n            continue  # malformed rule: skip per spec\n    return bool(flag.get('default', False))\n\`\`\`",
    commonMistakes: [
      "random() for rollout — users flicker in and out per request; the determinism test catches it.",
      "Unsalted hash (user_id only) — the same 25% of users get every experiment; per-flag salt is the fix.",
      "Missing attribute treated as rule-returns-False, ending evaluation — the spec says fall through.",
      "Bucket via hash % 100 == threshold-style equality or range reshuffling on percent change — breaks monotone expansion.",
      "Letting one malformed rule throw and kill evaluation of the whole flag.",
    ],
    followUpQuestions: [
      "Add variant support (A/B/C at 50/30/20). How does bucketing generalize, and what must stay stable when weights change?",
      "Flags now update live from a control plane. Sketch the SDK architecture: polling vs streaming, local evaluation vs remote, and what happens during a control-plane outage.",
      "How do you test a rollout rule's distribution? Write the property-based test in words.",
    ],
    rubric: [
      { criterion: "Deterministic bucketing", description: "Salted stable hash with threshold comparison; can explain monotone expansion." },
      { criterion: "Rule semantics", description: "First-match-wins with correct fall-through for missing attrs and out-of-bucket." },
      { criterion: "Robustness", description: "Malformed rules skipped; kill switch absolute; pure function." },
      { criterion: "Ecosystem awareness", description: "Relates choices to real SDK behavior (flicker, correlated cohorts, variants)." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://martinfowler.com/articles/feature-toggles.html",
      "https://github.com/Unleash/unleash",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "labeled-metrics-counter-spec",
    title: "Labeled Metrics Counter with Cardinality Protection",
    type: "write_code",
    difficulty: "medium",
    topics: ["metrics", "observability", "hash-map", "python", "api-design"],
    targetRoles: ["backend_swe", "platform_engineer", "infrastructure_swe"],
    companyStyles: ["infra_heavy", "big_tech"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "Implement a Prometheus-style counter:\n\n- \`Counter(name, label_names: list[str], max_series: int = 1000)\`\n- \`inc(labels: dict, amount: float = 1.0)\` — amount must be > 0 (counters only go up); labels must exactly match label_names (no extras, no missing); label *values* must be strings\n- \`get(labels) -> float\`\n- \`collect() -> list[(sorted_label_tuple, value)]\` — deterministic order for scraping\n- Cardinality protection: once \`max_series\` distinct label combinations exist, new combinations go to a synthetic overflow series \`{'<overflow>': 'true'}\`-style bucket instead of creating new series; existing series keep working.",
    context:
      "Cardinality explosions (user_id as a label…) are among the most common observability outages. This spec bakes the defense into the client library, which is where real SDKs are heading.",
    constraints:
      "- inc/get O(1); collect O(series log series)\n- Series identity: tuple of label values in label_names order — normalize once, no dict-order dependence\n- Validation errors raise ValueError with a message naming the offending label",
    starterCode:
      "class Counter:\n    def __init__(self, name: str, label_names: list[str], max_series: int = 1000) -> None:\n        ...\n\n    def inc(self, labels: dict, amount: float = 1.0) -> None: ...\n    def get(self, labels: dict) -> float: ...\n    def collect(self) -> list: ...\n",
    tests: [
      { name: "basic", input: "inc({method:'GET', code:'200'}); get(same)", expected: "1.0" },
      { name: "label mismatch", input: "inc({method:'GET'}) with label_names [method, code]", expected: "ValueError naming 'code'" },
      { name: "negative amount", input: "inc(labels, -1)", expected: "ValueError" },
      { name: "non-string value", input: "inc({method:'GET', code:200})", expected: "ValueError naming 'code'" },
      { name: "overflow", input: "max_series=2; three distinct label sets", expected: "third lands in overflow series; first two unaffected" },
      { name: "deterministic collect", input: "several series", expected: "stable sorted output" },
    ],
    hints: [
      "Normalize labels → tuple(labels[name] for name in label_names) after validating keys exactly equal label_names as a set.",
      "The overflow decision happens only for NEW series keys: len(series) >= max_series and key not in series → route to the sentinel key.",
      "Reserve the sentinel so a real series can't collide with it — that's part of why label values are validated as strings and the sentinel isn't a valid value tuple.",
    ],
    solutionOutline:
      "Validate at inc/get: set(labels) == set(label_names) (report missing/extra by name), all values str (report offender), amount > 0. Key = tuple in declared order → dict lookup. inc: existing key → add; new key → if under limit create, else add to _OVERFLOW sentinel key (a unique object() or reserved tuple — unrepresentable as user input since values must be str and the sentinel isn't a str tuple of the right arity... simplest: a module-level object() sentinel). get on unknown key → 0.0 (Prometheus semantics: absent = 0; state the choice). collect: sorted series by label tuple, overflow reported with a synthetic label set; document that overflow makes totals correct but per-label attribution lossy — the operator sees the explosion instead of the TSDB dying.",
    fullSolution:
      "\`\`\`python\n_OVERFLOW = object()\n\nclass Counter:\n    def __init__(self, name: str, label_names: list[str], max_series: int = 1000):\n        self.name = name\n        self._names = list(label_names)\n        self._max = max_series\n        self._series: dict = {}\n\n    def _key(self, labels: dict) -> tuple:\n        given, expected = set(labels), set(self._names)\n        missing = expected - given\n        extra = given - expected\n        if missing:\n            raise ValueError(f'missing label: {sorted(missing)[0]}')\n        if extra:\n            raise ValueError(f'unexpected label: {sorted(extra)[0]}')\n        for name in self._names:\n            if not isinstance(labels[name], str):\n                raise ValueError(f'label value must be str: {name}')\n        return tuple(labels[name] for name in self._names)\n\n    def inc(self, labels: dict, amount: float = 1.0) -> None:\n        if amount <= 0:\n            raise ValueError('counter increments must be > 0')\n        key = self._key(labels)\n        if key not in self._series and len(self._series) >= self._max:\n            key = _OVERFLOW\n        self._series[key] = self._series.get(key, 0.0) + amount\n\n    def get(self, labels: dict) -> float:\n        return self._series.get(self._key(labels), 0.0)\n\n    def collect(self) -> list:\n        out = []\n        for key, value in self._series.items():\n            if key is _OVERFLOW:\n                label_view = tuple(('<overflow>', 'true'),)\n            else:\n                label_view = tuple(zip(self._names, key))\n            out.append((label_view, value))\n        return sorted(out, key=lambda kv: (kv[0] == (('<overflow>', 'true'),), kv[0]))\n    \n\`\`\`\n\nNote the overflow-check ordering in inc(): the existing-key check comes first so established series never get rerouted — the 'existing series keep working' clause. Swapping those two conditions is the subtle bug this spec plants.",
    commonMistakes: [
      "Keying series by frozenset(labels.items()) or the dict repr — order-dependent or collision-prone identity.",
      "Overflow check before the existing-key check — established series suddenly route to overflow once the limit is hit.",
      "Allowing amount ≤ 0 (a counter that can go down is a gauge; rate() over it produces garbage).",
      "Validation errors that don't name the offending label (the spec's operability clause).",
      "Unbounded label cardinality accepted silently — the entire point of the exercise.",
    ],
    followUpQuestions: [
      "Add histogram support: what changes about the series model, and why are buckets just labeled counters (le=...)?",
      "Thread safety at 1M inc/s: one lock, striped locks, or per-thread shards aggregated at collect — trade-offs?",
      "The overflow series is growing fast in production. What's your runbook — how do you find *which* label is exploding?",
    ],
    rubric: [
      { criterion: "Series identity", description: "Ordered value tuple after exact-set validation; deterministic collect." },
      { criterion: "Cardinality defense", description: "Overflow routing with existing-series protection; correct check ordering." },
      { criterion: "Counter semantics", description: "Monotonic-only enforced; absent-equals-zero stated." },
      { criterion: "Operability", description: "Error messages name labels; overflow visible to operators." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://prometheus.io/docs/concepts/data_model/",
      "https://prometheus.io/docs/practices/naming/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
]);
