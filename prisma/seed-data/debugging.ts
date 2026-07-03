import { defineProblems, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";

export const debuggingProblems = defineProblems([
  {
    slug: "async-worker-drops-jobs",
    title: "The Async Worker That Loses Jobs Under Load",
    type: "debugging",
    difficulty: "medium",
    topics: ["async", "python", "queues", "error-handling"],
    targetRoles: ["backend_swe", "mid_level_swe", "platform_engineer"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "Ops reports: ~0.5% of thumbnail jobs vanish — no result, no error log, no retry. It gets worse under load. Find **both** bugs in this worker and explain the exact loss mechanisms.\n\nThen fix it with proper at-least-once semantics.",
    context:
      "Two real asyncio failure modes hide here. One is an ordering decision, one is a genuine Python footgun that bites even senior engineers.",
    starterCode:
      "import asyncio\n\nasync def worker(queue: asyncio.Queue):\n    while True:\n        job = await queue.get()\n        queue.task_done()                    # (1) ack\n        asyncio.create_task(process(job))    # (2) fire and forget\n\nasync def process(job):\n    data = await download(job['url'])\n    thumb = await render(data)               # occasionally raises RenderError\n    await upload(thumb)\n\nasync def main():\n    queue = asyncio.Queue()\n    await fill(queue)\n    workers = [asyncio.create_task(worker(queue)) for _ in range(4)]\n    await queue.join()                        # returns when all task_done() called\n",
    hints: [
      "Bug 1 is ordering: task_done() is called when? What does queue.join() actually wait for, given that?",
      "Bug 2 is documented in the asyncio docs for create_task: what happens to a task if you don't keep a reference to it? What does the event loop hold weakly?",
      "Where do RenderError exceptions go? Who awaits the fire-and-forget task, and what does asyncio do with an exception nobody retrieves?",
    ],
    solutionOutline:
      "Bug 1: acking (task_done) before processing means queue.join() returns when jobs have been *dequeued*, not completed — main() can exit while processing is mid-flight; process shutdown cancels everything in flight → silent loss that scales with load. Bug 2: asyncio.create_task returns a Task the event loop holds only weakly; with no strong reference kept, the task can be garbage-collected mid-execution (the docs explicitly warn to save references) — vanishing without a trace. Compounding: exceptions in unawaited tasks surface only as 'Task exception was never retrieved' at GC time, if at all — hence no error logs. Fix: process the job *then* ack in a finally-guarded structure with explicit error handling and retry/requeue; bound concurrency with a semaphore instead of unbounded create_task; if background tasks are truly needed, keep them in a set with done-callbacks that log exceptions and discard.",
    fullSolution:
      "\`\`\`python\nimport asyncio\nimport logging\n\nasync def worker(queue: asyncio.Queue):\n    while True:\n        job = await queue.get()\n        try:\n            await process(job)                       # complete BEFORE ack\n        except Exception:\n            logging.exception('job failed: %s', job['id'])\n            if job['attempts'] < 3:\n                job['attempts'] += 1\n                await queue.put(job)                  # requeue = retry\n            else:\n                await dead_letter(job)\n        finally:\n            queue.task_done()                         # ack exactly once, after outcome\n\`\`\`\n\nConcurrency now comes from running N workers (already the design), not from unbounded fire-and-forget. If fire-and-forget were genuinely required:\n\n\`\`\`python\nbackground: set[asyncio.Task] = set()\n\ndef spawn(coro):\n    t = asyncio.create_task(coro)\n    background.add(t)\n    t.add_done_callback(background.discard)\n    return t\n\`\`\`\n\nDebugging narrative for the interview: the 0.5%-and-worse-under-load shape says 'timing window', the no-logs shape says 'exceptions are being dropped, not raised' — those two observations should steer you to the ack ordering and the unawaited tasks before reading a line of implementation.",
    commonMistakes: [
      "Finding the ack-ordering bug and stopping — the GC'd-task bug is independent and the docs-documented one.",
      "Fixing by awaiting process(job) inline but keeping task_done() before it (join still lies).",
      "Adding try/except that logs but still acks failed jobs with no retry path (silent loss becomes logged loss — better, not fixed).",
      "Unbounded create_task with references kept: no longer GC'd, but memory and concurrency now unbounded — trading loss for OOM.",
    ],
    followUpQuestions: [
      "This queue is in-process. What loss modes remain even after your fix, and what does moving to Redis/SQS change about ack semantics?",
      "How would you write a regression test for the GC'd-task bug? (It's timing-dependent — what makes it deterministic?)",
      "What does structured concurrency (asyncio.TaskGroup, trio nurseries) make impossible-by-construction here?",
    ],
    rubric: [
      { criterion: "Both root causes", description: "Ack-before-process AND weakly-referenced task GC — with the docs-level explanation of each." },
      { criterion: "Symptom reasoning", description: "Connects 'worse under load, no logs' to the mechanisms before diving into code." },
      { criterion: "Correct fix", description: "Process-then-ack with bounded retries and a dead-letter path; no unbounded task spawning." },
      { criterion: "Semantics vocabulary", description: "Uses at-least-once/at-most-once precisely when describing before/after behavior." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/library/asyncio-task.html#asyncio.create_task",
      "https://docs.python.org/3/library/asyncio-queue.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "cache-write-before-commit",
    title: "Users See Data That Was Never Saved",
    type: "debugging",
    difficulty: "medium",
    topics: ["caching", "transactions", "consistency", "python"],
    targetRoles: ["backend_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["startup", "fintech", "big_tech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "Support tickets: users edit their display name, see the new name, then hours later the OLD name comes back. Database shows the old name. There was a spike of these during yesterday's incident when the DB was throwing intermittent errors.\n\nFind the bug, explain why the symptom is delayed by hours, and fix the write path.",
    starterCode:
      "def update_profile(user_id: int, name: str):\n    with db.transaction() as tx:\n        tx.execute(\n            'UPDATE users SET name = %s WHERE id = %s', (name, user_id))\n        cache.set(f'user:{user_id}', {'name': name}, ttl=6 * 3600)  # keep cache warm\n        tx.execute(\n            'INSERT INTO audit_log (user_id, field) VALUES (%s, %s)',\n            (user_id, 'name'))\n    # transaction commits on context exit; rolls back on exception\n\ndef get_profile(user_id: int):\n    cached = cache.get(f'user:{user_id}')\n    if cached is not None:\n        return cached\n    row = db.query('SELECT name FROM users WHERE id = %s', (user_id,))\n    cache.set(f'user:{user_id}', row, ttl=6 * 3600)\n    return row\n",
    hints: [
      "The cache.set happens *inside* the transaction block. What has the database promised at that point? What happens if the audit INSERT fails?",
      "Trace yesterday's incident: UPDATE succeeds, cache.set succeeds, audit INSERT throws, transaction rolls back. What does each store now believe?",
      "Why hours? What eventually evicts the phantom value, and what does the user see right after?",
    ],
    solutionOutline:
      "The cache is populated with uncommitted data. When the audit insert fails (yesterday's DB errors), the transaction rolls back the UPDATE — but cache.set is not transactional and has already published the new name. Users read the phantom from cache (see new name) until the 6 h TTL evicts it; then get_profile re-reads the DB (old name) and re-caches it → 'the old name came back hours later'. The delay IS the TTL. Fix: never publish to cache inside an open transaction. Move cache work after successful commit — and prefer *invalidation* (delete) over set-after-commit, because set-after-commit still races concurrent writers (two commits can set out of order). Best shape: commit; then cache.delete(key). Mention transactional outbox / commit hooks for when cache updates must be reliable, and that reading your own write can be served from the DB or a set-with-version.",
    fullSolution:
      "\`\`\`python\ndef update_profile(user_id: int, name: str):\n    with db.transaction() as tx:\n        tx.execute('UPDATE users SET name = %s WHERE id = %s', (name, user_id))\n        tx.execute('INSERT INTO audit_log (user_id, field) VALUES (%s, %s)',\n                   (user_id, 'name'))\n    # only after a successful commit:\n    cache.delete(f'user:{user_id}')\n\`\`\`\n\nWhy delete instead of set: set-after-commit can interleave (writer A commits then stalls; writer B commits and sets; A's older set lands last → stale again). Delete converts the race into a cache miss, which read-through repairs. If the framework supports it, an on-commit hook (\`tx.on_commit(lambda: cache.delete(...))\`) keeps call sites honest. The incident correlation is the diagnostic gift: cache-vs-DB divergence that appears when *part* of a transaction fails is the signature of non-transactional side effects inside transactions — the same class as sending emails or publishing events pre-commit.",
    commonMistakes: [
      "Fixing by reordering statements inside the transaction (audit first) — shrinks the window, doesn't remove the class; ANY later failure including commit itself still poisons the cache.",
      "Set-after-commit without recognizing the concurrent-writer reordering race that invalidation avoids.",
      "Blaming cache TTL length and 'fixing' by shortening it — treats the symptom's duration, not the phantom write.",
      "Missing why the incident correlated: no mental model that partial-transaction-failure is what exposes pre-commit side effects.",
    ],
    followUpQuestions: [
      "The product now requires read-your-own-writes immediately after edit. Delete-on-commit gives a miss — where do you serve the fresh value from, and what session stickiness does it imply?",
      "Emails are also sent inside transactions in this codebase. Same bug class — what's the transactional-outbox pattern and what does it cost?",
      "How would you write a lint/CI check that flags cache/network calls inside open transactions?",
    ],
    rubric: [
      { criterion: "Root cause", description: "Non-transactional side effect published before commit; rollback divergence." },
      { criterion: "Timeline explanation", description: "Accounts for the hours-later reversal via TTL and the incident correlation." },
      { criterion: "Fix quality", description: "Post-commit invalidation (not set), with the writer-race rationale." },
      { criterion: "Class generalization", description: "Extends the rule to emails/events; mentions outbox or commit hooks." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "shared-counter-undercounts",
    title: "The Request Counter That Undercounts by 3%",
    type: "debugging",
    difficulty: "easy",
    topics: ["concurrency", "threads", "race-conditions", "python", "gil"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "quant_fund", "startup"],
    estimatedMinutes: 20,
    language: "python",
    prompt:
      "A billing counter in a threaded Python API undercounts requests by ~3% under load — money is being left on the table. A teammate insists it can't be a race 'because of the GIL'. Prove them wrong:\n\n1. Explain exactly how \`self.count += amount\` loses updates despite the GIL.\n2. Why ~3% and only under load?\n3. Fix it three ways and rank them (lock, atomic alternative, redesign).",
    starterCode:
      "import threading\n\nclass UsageCounter:\n    def __init__(self):\n        self.count = 0\n\n    def record(self, amount: int = 1):\n        self.count += amount        # 'atomic because GIL', says the comment\n\ncounter = UsageCounter()\n\ndef handle_request():\n    # ... serve request ...\n    counter.record()\n",
    hints: [
      "Disassemble it mentally: \`+=\` on an attribute is LOAD_ATTR, LOAD, ADD, STORE_ATTR — the GIL guarantees each *bytecode* runs atomically, not the sequence.",
      "Two threads both LOAD count=100, both ADD 1, both STORE 101. Where did the increment go? When can a thread switch happen between those bytecodes?",
      "Also worth knowing: since Python 3.10+, the interpreter can switch between adjacent bytecodes more readily than folklore assumes, and free-threaded builds (PEP 703) remove the GIL entirely — 'GIL makes it safe' is doubly wrong going forward.",
    ],
    solutionOutline:
      "The GIL serializes bytecode execution, but \`self.count += amount\` compiles to a read-modify-write across several bytecodes; a preemption between the read and the write lets another thread's update be overwritten (lost update — same anomaly as the SQL version, in-process). Under load, more concurrent threads → more preemptions landing inside the window → measurable loss; 3% is just the collision rate for their traffic. Fixes: (1) threading.Lock around the mutation — correct, simple, contention cost at extreme rates; (2) itertools.count() consumed with next() is documented-atomic for counting-by-one... but reading it requires care — better 'atomic alternative' in stdlib Python: per-thread counters aggregated on read (no shared write at all); (3) redesign: don't count in-process — emit to a metrics pipeline / Redis INCR (actually atomic server-side) so billing doesn't depend on process memory. Ranking for billing: (3) > (1) > per-thread shards, because billing counts must survive process death anyway — the race is real but the architecture is the deeper bug.",
    fullSolution:
      "\`\`\`python\n# Fix 1: lock (correct, boring, fine)\nclass UsageCounter:\n    def __init__(self):\n        self._count = 0\n        self._lock = threading.Lock()\n    def record(self, amount: int = 1):\n        with self._lock:\n            self._count += amount\n\n# Fix 2: shard per thread, aggregate on read (no write contention)\nclass ShardedCounter:\n    def __init__(self):\n        self._local = threading.local()\n        self._shards = []\n        self._reg = threading.Lock()\n    def record(self, amount: int = 1):\n        shard = getattr(self._local, 'shard', None)\n        if shard is None:\n            shard = self._local.shard = [0]\n            with self._reg:\n                self._shards.append(shard)\n        shard[0] += amount   # single-writer per shard\n    def value(self) -> int:\n        return sum(s[0] for s in self._shards)\n\`\`\`\n\nDemonstration script for the skeptical teammate: two threads doing 1M unlocked increments reliably lose thousands of updates — the fastest way to end a GIL argument is to run it.",
    commonMistakes: [
      "Believing += is atomic under the GIL (the bug itself) — or overcorrecting into 'nothing is atomic' (dict get/set of a single key effectively is; know the difference between implementation detail and contract).",
      "Fixing with a lock but taking it around the whole request handler (contention explosion).",
      "Proposing multiprocessing 'because threads are broken' — changes the problem, shared count now needs IPC.",
      "Not knowing free-threaded Python (PEP 703) exists and makes GIL-folklore code concretely wrong.",
    ],
    followUpQuestions: [
      "Same bug in Go/Java/C++ terms: what's the memory-model name for this (data race), and what tools detect it in each?",
      "The counter now needs to be read 1000×/s for a live dashboard while written 100k×/s. Which fix wins and why?",
      "Why is Redis INCR atomic without a client-side lock — what's doing the serialization?",
    ],
    rubric: [
      { criterion: "Mechanism precision", description: "Read-modify-write across bytecodes; GIL scope stated correctly." },
      { criterion: "Load correlation", description: "Explains why frequency scales with concurrency." },
      { criterion: "Fix ranking", description: "Three fixes with a workload-based ranking, including the architectural one for billing." },
      { criterion: "Myth handling", description: "Can correct the GIL folklore without overcorrecting." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/library/threading.html",
      "https://docs.python.org/3/glossary.html#term-global-interpreter-lock",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "timeout-double-charge",
    title: "One Click, Two Charges",
    type: "debugging",
    difficulty: "hard",
    topics: ["idempotency", "retries", "distributed-systems", "transactions", "http"],
    targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"],
    companyStyles: ["fintech", "big_tech", "startup"],
    estimatedMinutes: 35,
    language: "python",
    prompt:
      "Finance reports duplicate charges: same user, same amount, seconds apart, correlated with p99 latency spikes. The client code and server code are below. Nobody sees an error in server logs — every charge 'succeeded'.\n\n1. Reconstruct the exact end-to-end timeline that double-charges.\n2. Point to the false assumption baked into the client retry logic.\n3. Fix it at the right layer(s) — and explain why fixing only the client is insufficient.",
    starterCode:
      "# client (mobile BFF)\ndef charge_with_retry(user_id, amount_cents):\n    for attempt in range(3):\n        try:\n            return http.post('/api/charge',\n                             json={'user_id': user_id, 'amount': amount_cents},\n                             timeout=2.0)\n        except http.Timeout:\n            continue            # 'timed out means it failed, so retry is safe'\n    raise PaymentError\n\n# server\n@app.post('/api/charge')\ndef charge(req):\n    with db.transaction() as tx:\n        tx.execute('INSERT INTO charges (user_id, amount) VALUES (%s, %s)',\n                   (req['user_id'], req['amount']))\n        psp_ref = payment_provider.charge(req['user_id'], req['amount'])  # 1.9s p99!\n        tx.execute('UPDATE charges SET psp_ref = %s WHERE id = %s',\n                   (psp_ref, tx.lastrowid))\n    return {'ok': True}\n",
    hints: [
      "A 2.0 s client timeout against a 1.9 s p99 provider call: what fraction of *successful* requests does the client abandon mid-flight?",
      "'Timed out' tells you nothing about server-side outcome — the request is in an unknown state. What are the three possible server states at client-timeout time?",
      "The fix needs a key that survives retries. Who generates it, what makes two requests 'the same', and where is it checked? Also: what is that payment_provider.charge call doing inside an open DB transaction?",
    ],
    solutionOutline:
      "Timeline: client posts; server inserts charge row, calls provider (takes 1.95 s); client times out at 2.0 s and retries; the first request *completes successfully* moments later; the retry runs the whole path again → second provider charge. No server errors because both executions succeeded. False assumption: timeout ⇒ failure. A timeout means unknown outcome — the request may be in-flight, completed, or failed. Fixes, layered: (1) client generates an idempotency key per *user intent* (per checkout click, not per HTTP attempt) and sends it on every retry; (2) server deduplicates on that key (unique constraint + the in-flight/done state machine) so re-execution returns the first outcome; (3) reconcile with the provider using their idempotency mechanism too — the same unknown-outcome problem exists between server and PSP. Fixing only the client (e.g., 'don't retry on timeout') trades duplicates for dropped payments and still leaves other retry sources (LB retries, user double-click, app restart). Also flag the secondary defect: a 1.9 s external call inside an open DB transaction (long transactions, lock hold time, connection pool exhaustion during provider incidents) — the charge row + outbox or state-machine pattern fixes that.",
    fullSolution:
      "\`\`\`python\n# client\ndef charge_with_retry(user_id, amount_cents):\n    idem_key = new_uuid()          # per user intent, OUTSIDE the retry loop\n    for attempt in range(3):\n        try:\n            return http.post('/api/charge',\n                             json={'user_id': user_id, 'amount': amount_cents},\n                             headers={'Idempotency-Key': idem_key},\n                             timeout=2.0)\n        except http.Timeout:\n            continue\n    raise PaymentUnknown('outcome unknown — do not tell the user it failed')\n\n# server (sketch)\n@app.post('/api/charge')\ndef charge(req):\n    key = req.headers['Idempotency-Key']\n    existing = idempotency.check_or_begin(key, fingerprint(req))   # unique constraint\n    if existing.done:\n        return existing.response\n    if existing.in_flight:\n        return 409, {'status': 'processing'}\n    # state row committed BEFORE the provider call; provider called OUTSIDE any open tx\n    psp_ref = payment_provider.charge(req['user_id'], req['amount'],\n                                      idempotency_key=key)          # PSP-level dedupe too\n    idempotency.complete(key, {'ok': True, 'psp_ref': psp_ref})\n    return {'ok': True}\n\`\`\`\n\nThe interview-grade insight: **retries are safe only against idempotent operations; timeouts create unknown outcomes; therefore the system must convert 'charge' into an idempotent operation before anyone is allowed to retry it.** Also note the UX detail — after exhausted retries the truthful state is 'unknown', and the client copy/reconciliation flow must handle it.",
    commonMistakes: [
      "Generating the idempotency key inside the retry loop (new key per attempt = no dedupe).",
      "Fixing by lengthening the client timeout — reduces frequency, leaves the class; timeouts can't be eliminated.",
      "Not noticing the external call inside the DB transaction (the latency spike and the double charge share a root in that design).",
      "Treating provider-level duplication as impossible — the server↔PSP hop has the same unknown-outcome structure.",
      "Returning 'payment failed' to the user after timeouts (it may have succeeded — reconciliation nightmare).",
    ],
    followUpQuestions: [
      "Where do idempotency records live and for how long? What happens when a record TTLs out and a very late retry arrives?",
      "The provider offers webhooks. Redesign the flow to be asynchronous — what does the client poll, and what's now idempotent by construction?",
      "How do you *detect* this class in production before finance does — what metric or invariant check?",
    ],
    rubric: [
      { criterion: "Timeline reconstruction", description: "Names the in-flight-success-plus-retry schedule precisely, including why logs look clean." },
      { criterion: "Timeout epistemology", description: "Articulates timeout = unknown outcome, three possible states." },
      { criterion: "Layered fix", description: "Intent-scoped key, server dedupe, PSP-level idempotency; explains insufficiency of client-only." },
      { criterion: "Secondary defect", description: "Flags the external call inside the transaction and its incident coupling." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://stripe.com/blog/idempotency",
      "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "pagination-deletes-skip-rows",
    title: "The Cleanup Job That Skips Half Its Targets",
    type: "debugging",
    difficulty: "medium",
    topics: ["pagination", "databases", "sql", "batch-processing"],
    targetRoles: ["backend_swe", "new_grad_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 20,
    language: "python",
    prompt:
      "A GDPR-deletion job reports success but compliance audits find ~half the flagged rows still present after each run. Repeated runs eventually clear them. Read the job:\n\n1. Explain the exact mechanism (draw the row windows).\n2. Why 'about half'? What determines the exact fraction?\n3. Fix it two ways and state which you'd ship.",
    starterCode:
      "BATCH = 1000\n\ndef purge_flagged():\n    offset = 0\n    while True:\n        rows = db.query(\n            'SELECT id FROM users WHERE flagged = true '\n            'ORDER BY id LIMIT %s OFFSET %s', (BATCH, offset))\n        if not rows:\n            break\n        db.execute('DELETE FROM users WHERE id = ANY(%s)', ([r.id for r in rows],))\n        offset += BATCH    # next page\n",
    hints: [
      "After deleting the first 1000 flagged rows, what row is now at offset 0 of the *same* query? Where does OFFSET 1000 land?",
      "The result set shifts left by BATCH every iteration while the cursor moves right by BATCH — which rows fall in the gap?",
      "Fix A: don't advance the offset (why is that correct once you're deleting?). Fix B: keyset — WHERE id > last_seen. Which survives 'some rows fail to delete'?",
    ],
    solutionOutline:
      "Each DELETE removes the current page from the *filtered set*, shifting every remaining flagged row down by BATCH positions; advancing OFFSET by BATCH then jumps over the BATCH rows that slid into the just-processed window. Net effect: process 1000, skip ~1000, repeat → about half missed (exactly: it alternates process/skip windows, so the surviving fraction ≈ 1/2, modulo the final partial page). Repeated runs halve the remainder — matching the audit observation. Fix A: keep \`offset = 0\` forever — since processed rows leave the result set, the 'first page' is always the next unprocessed page. Correct *only if* every selected row is really removed (or un-flagged); a row that fails deletion re-appears on page one forever → infinite loop on poison rows. Fix B (ship this): keyset pagination — \`WHERE flagged AND id > :last ORDER BY id LIMIT :batch\`, advancing \`last\` to the max id seen. Progress is guaranteed even when some deletions fail, it's index-friendly, and it composes with resumability (persist \`last\`). Also mention doing SELECT+DELETE in one statement (\`DELETE ... WHERE id IN (SELECT ... LIMIT ...) RETURNING id\`) to close the select-then-delete race with concurrent flaggers.",
    fullSolution:
      "\`\`\`python\ndef purge_flagged():\n    last_id = 0\n    while True:\n        rows = db.query(\n            'SELECT id FROM users WHERE flagged = true AND id > %s '\n            'ORDER BY id LIMIT %s', (last_id, BATCH))\n        if not rows:\n            break\n        db.execute('DELETE FROM users WHERE id = ANY(%s)', ([r.id for r in rows],))\n        last_id = rows[-1].id      # progress independent of deletion success\n\`\`\`\n\nThe general law to state: **never paginate with OFFSET over a result set you are mutating** (deleting from, or updating such that rows leave the filter). The same bug appears with 'process unsent emails', 'migrate unmigrated rows', and API pagination during concurrent writes — it's a class, not an instance.",
    commonMistakes: [
      "Diagnosing it as a transaction/visibility problem rather than window arithmetic.",
      "Fix A without the poison-row caveat (a single undeletable row = hot infinite loop at full query cost).",
      "Keyset fix that advances last_id only on successful delete (reintroduces the poison-row loop).",
      "Not closing the select-then-delete race when other writers flag rows concurrently (fine here since new rows have higher ids — but say why).",
    ],
    followUpQuestions: [
      "The table's PK is a UUID (unordered). What do you key the pagination on instead?",
      "How do you make this job resumable across restarts and safe to run from two schedulers at once?",
      "Same bug shape in an HTTP API consumed by clients during writes — how do cursor tokens fix it and what did OFFSET cost you?",
    ],
    rubric: [
      { criterion: "Window mechanics", description: "Explains the shift-left/jump-right interaction producing ~50% skips." },
      { criterion: "Fraction reasoning", description: "Why half, and why repeated runs converge." },
      { criterion: "Fix judgment", description: "Keyset chosen with the poison-row argument; offset-zero variant understood with its failure mode." },
      { criterion: "Class recognition", description: "Names the general never-OFFSET-a-mutating-set rule." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://use-the-index-luke.com/no-offset"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "react-stale-submit-race",
    title: "The Form That Submits Yesterday's Data",
    type: "debugging",
    difficulty: "medium",
    topics: ["react", "closures", "async", "state"],
    targetRoles: ["fullstack_swe", "new_grad_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 25,
    language: "typescript",
    prompt:
      "QA: 'If you edit the amount field and hit Send quickly, the server receives the OLD amount. Waiting a second before clicking works fine.' Also, a saved-draft toast sometimes shows the wrong values. Read the component and:\n\n1. Explain the fast-click bug precisely (which render's state does the handler see?).\n2. Explain why the async validation makes it worse.\n3. Fix it without breaking controlled inputs — two approaches.",
    starterCode:
      "function PaymentForm() {\n  const [amount, setAmount] = useState('');\n  const [valid, setValid] = useState(false);\n\n  const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {\n    setAmount(e.target.value);\n    validateRemote(e.target.value).then((ok) => setValid(ok)); // 300ms API\n  };\n\n  const onSubmit = async () => {\n    if (!valid) return;                 // gate on validation\n    await api.send({ amount });          // <-- stale?\n    toast(\`Sent \${amount}\`);\n  };\n\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>\n      <input value={amount} onChange={onAmountChange} />\n      <button type=\"submit\">Send</button>\n    </form>\n  );\n}\n",
    hints: [
      "Event handlers close over the state of the render in which they were created. If the click happens before React re-renders with the new amount... which handler instance runs?",
      "Actually trace the fast-click: keystroke → setAmount schedules re-render → click lands on the OLD render's onSubmit → it reads old amount AND old valid. What are the four interleavings of (re-render, validation resolve, click)?",
      "Fix families: read the source of truth at submit time (form data / ref mirror), or make submission go through state that's guaranteed current (disable submit until validation for the *current* value resolves — version the validation)."
    ],
    solutionOutline:
      "Handlers are recreated per render and close over that render's state (state-as-snapshot). A click that fires before the re-render commits runs the previous render's onSubmit → old amount. The async validation compounds it: \`valid\` corresponds to *whatever value finished validating last*, not the current text — fast typing means valid=true (for the old value) gates submission of the old amount, or out-of-order resolution (300 ms responses racing) sets valid from a stale response. Fixes: (1) Read at submit time from the authoritative source: FormData (\`new FormData(e.currentTarget).get('amount')\`) or a ref mirror kept in sync in onChange — the submit handler no longer depends on closure state. (2) Version the validation: keep \`{value, status}\` together; a validation response only applies if its input still equals the current value (or use an incrementing request id, ignore stale resolutions); disable the button unless status is 'valid-for-current-value'. Shipping answer: both — submit reads current data AND server re-validates (client validation is UX, never a security boundary; say it).",
    fullSolution:
      "\`\`\`tsx\nfunction PaymentForm() {\n  const [amount, setAmount] = useState('');\n  const [validation, setValidation] = useState<{ for: string; ok: boolean } | null>(null);\n  const requestId = useRef(0);\n\n  const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {\n    const value = e.target.value;\n    setAmount(value);\n    setValidation(null);                    // value changed → prior result is void\n    const id = ++requestId.current;\n    validateRemote(value).then((ok) => {\n      if (id === requestId.current) setValidation({ for: value, ok });\n    });\n  };\n\n  const canSubmit = validation?.ok && validation.for === amount;\n\n  const onSubmit = (e: FormEvent<HTMLFormElement>) => {\n    e.preventDefault();\n    const current = String(new FormData(e.currentTarget).get('amount'));\n    api.send({ amount: current }).then(() => toast(\`Sent \${current}\`));\n  };\n\n  return (\n    <form onSubmit={onSubmit}>\n      <input name=\"amount\" value={amount} onChange={onAmountChange} />\n      <button type=\"submit\" disabled={!canSubmit}>Send</button>\n    </form>\n  );\n}\n\`\`\`\n\nThree independent defenses landed: FormData reads the DOM truth at submit; the request-id guard drops out-of-order validation responses; the \`for\`-field ties validity to the exact value it validated. In an interview, naming the *last-write-wins race on validation responses* is the differentiator — most candidates stop at the closure explanation.",
    commonMistakes: [
      "Explaining 'setState is async' vaguely instead of the render-snapshot model (setState isn't a promise; the handler identity is the issue).",
      "Fixing with a useRef mirror for everything and abandoning React state semantics wholesale.",
      "Ignoring the out-of-order validation race (two in-flight validations resolving in reverse).",
      "Gating on \`valid\` without tying validity to the value it validated.",
      "Treating client-side validation as the security boundary.",
    ],
    followUpQuestions: [
      "How does this change with an uncontrolled form + FormData as the primary pattern (as React docs now encourage for simple forms)?",
      "Add debouncing to the remote validation — where does the debounce interact with the request-id guard?",
      "Same class of bug server-side: a request handler reads config into a closure at startup. What's the equivalent fix?",
    ],
    rubric: [
      { criterion: "Snapshot model", description: "Correctly identifies which render's handler and state run on fast click." },
      { criterion: "Race enumeration", description: "Sees the validation-response ordering race, not just the closure staleness." },
      { criterion: "Fix architecture", description: "Submit-time truth + versioned validation; button gating tied to value." },
      { criterion: "Boundary judgment", description: "States that server-side validation is the real gate." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://react.dev/learn/state-as-a-snapshot",
      "https://react.dev/learn/queueing-a-series-of-state-updates",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "dst-daily-report-gap",
    title: "The Daily Report That Breaks Twice a Year",
    type: "debugging",
    difficulty: "medium",
    topics: ["python", "timezones", "datetime", "scheduling"],
    targetRoles: ["backend_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["fintech", "big_tech", "startup"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "Twice a year, the finance daily report double-counts an hour of transactions or misses one entirely — most recently, the March run missed 01:00–02:00 of New York data and a *different* November run counted 01:00–02:00 twice. Read the code:\n\n1. Identify every timezone bug (there are three distinct ones).\n2. Explain which bug produces which seasonal symptom.\n3. Rewrite the window computation correctly with \`zoneinfo\`.",
    starterCode:
      "from datetime import datetime, timedelta\n\ndef report_window(run_date_str: str):\n    # runs at 06:00 UTC daily; reports on the previous NY business day\n    run = datetime.strptime(run_date_str, '%Y-%m-%d')\n    ny_offset = timedelta(hours=-5)                 # New York is UTC-5\n    day_start_ny = run.replace(hour=0, minute=0) + timedelta(days=-1)\n    start_utc = day_start_ny - ny_offset            # convert NY -> UTC\n    end_utc = start_utc + timedelta(hours=24)       # a day is 24 hours\n    return start_utc, end_utc\n\ndef fetch_rows(start_utc, end_utc):\n    return db.query('SELECT * FROM tx WHERE ts >= %s AND ts < %s',\n                    (start_utc, end_utc))\n",
    hints: [
      "Bug 1: the hardcoded -5. When is New York not UTC-5, and what does the window boundary do to the 19:00/20:00 ET line?",
      "Bug 2: \`+ timedelta(hours=24)\`. How long is the NY day on the spring-forward date? On fall-back?",
      "Bug 3 is quieter: naive datetimes throughout — nothing in the type system marks which zone any value is in; strptime gives you a naive value that only means what the caller hopes.",
    ],
    solutionOutline:
      "Bug 1: fixed UTC-5 offset — New York is UTC-4 during daylight time (mid-March to early November), so for ~8 months every window is shifted by an hour: transactions between the true and assumed midnight land in the wrong day (systematic, but consistent — which is why nobody noticed until DST *transitions* made it visible). Bug 2: adding 24 h — the local NY day is 23 h on spring-forward and 25 h on fall-back; a 24 h window misses an hour in November (the extra hour) — wait, work it carefully: fall-back day is 25 h, so a 24 h window *misses* the last hour; spring-forward is 23 h, so 24 h *overlaps* an hour into the next day → the seasonal double-count. The March 'missed 01:00–02:00' is different: that hour doesn't exist in NY local time (clocks jump 02:00→03:00); code that builds local timestamps naively can synthesize a nonexistent hour or skip data bucketed around it. Bug 3: everything is naive — no value carries its zone, so review can't even see the errors; the fix must move to aware datetimes. Correct version: build midnight in America/New_York with ZoneInfo for both the day and the *next calendar day*, convert each to UTC, query [start, end) — day length falls out automatically (fold/gap handled by the zone database). Never add 24 h to cross days in local time; add days=1 in *calendar* space then localize.",
    fullSolution:
      "\`\`\`python\nfrom datetime import datetime, timedelta, timezone\nfrom zoneinfo import ZoneInfo\n\nNY = ZoneInfo('America/New_York')\n\ndef report_window(run_date_str: str):\n    run = datetime.strptime(run_date_str, '%Y-%m-%d').date()\n    report_day = run - timedelta(days=1)\n    start_ny = datetime(report_day.year, report_day.month, report_day.day, tzinfo=NY)\n    next_day = report_day + timedelta(days=1)\n    end_ny = datetime(next_day.year, next_day.month, next_day.day, tzinfo=NY)\n    return start_ny.astimezone(timezone.utc), end_ny.astimezone(timezone.utc)\n\`\`\`\n\nOn spring-forward this yields a 23 h window, on fall-back 25 h — matching reality, which is the point: **the day is defined by local calendar boundaries, not by 24 hours.** Storage rule that prevents the whole class: persist UTC (or instants), convert at the edges, and let the IANA zone database own every offset — the moment a human types \`-5\`, the bug exists; it just hasn't been observed yet.",
    commonMistakes: [
      "Finding the DST offset bug but keeping \`+ timedelta(hours=24)\` (the window is still wrong twice a year).",
      "Confusing which transition double-counts and which misses — being able to walk the 23 h/25 h arithmetic matters in fintech interviews.",
      "Fixing with pytz's localize in modern code, or worse, manual offset tables — zoneinfo is stdlib since 3.9.",
      "Not flagging naive datetimes as the enabling defect (types that don't say what they mean).",
      "Suggesting 'run everything in UTC' as a complete fix while the business day is defined in NY local time — the *requirement* is zone-full; only the storage should be UTC.",
    ],
    followUpQuestions: [
      "A user in Phoenix (no DST) and one in Sydney (southern-hemisphere DST) want the same report. What's the general design?",
      "The tx table stores naive local timestamps from a legacy system. Migration options and their failure modes during the ambiguous fall-back hour?",
      "What does the \`fold\` attribute on datetime do, and exactly when do you need it?",
    ],
    rubric: [
      { criterion: "All three bugs", description: "Hardcoded offset, 24 h day assumption, naive datetimes — separated cleanly." },
      { criterion: "Symptom mapping", description: "Correct 23 h/25 h reasoning tied to double-count vs miss." },
      { criterion: "Correct rewrite", description: "Calendar-space day arithmetic localized via zoneinfo; half-open UTC query." },
      { criterion: "Prevention rule", description: "States the store-UTC/convert-at-edges/IANA-owns-offsets discipline." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/library/zoneinfo.html",
      "https://docs.python.org/3/library/datetime.html#datetime.datetime.fold",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "cpp-callback-vector-realloc",
    title: "The Order Router That Corrupts Its Own Callbacks",
    type: "debugging",
    difficulty: "hard",
    topics: ["cpp", "memory", "lifetimes", "undefined-behavior", "vectors"],
    targetRoles: ["quant_developer", "hft_swe"],
    companyStyles: ["hft", "quant_fund"],
    estimatedMinutes: 35,
    language: "cpp",
    prompt:
      "An order router crashes rarely — always deep in a fill callback, always after a busy open. ASan (enabled in staging, where it never crashes… until today) finally produced: \`heap-use-after-free … READ of size 8 … in OrderRouter::on_fill\`. Read the code:\n\n1. Find the bug and the exact sequence that frees the memory being read.\n2. Explain why it only crashes 'after a busy open'.\n3. Fix it three ways with trade-offs (index-based, stable container, redesign of ownership) — and say what a use-after-**move** version of this bug would look like instead.",
    starterCode:
      "#include <functional>\n#include <string>\n#include <vector>\n\nstruct Order {\n    std::string id;\n    int qty;\n    std::function<void(int)> on_partial_fill;\n};\n\nclass OrderRouter {\n    std::vector<Order> live_;\npublic:\n    void submit(Order o) {\n        live_.push_back(std::move(o));\n        Order& placed = live_.back();\n        // register with the venue: callback captures a pointer to OUR order\n        venue_register(placed.id, [ord = &placed](int filled) {\n            ord->qty -= filled;                 // (A)\n            if (ord->on_partial_fill) ord->on_partial_fill(filled);\n        });\n    }\n\n    void on_fill(const std::string& id, int filled);  // venue thread calls the lambda\n};\n",
    hints: [
      "\`&placed\` points into the vector's heap buffer. What operation does every subsequent submit() potentially perform on that buffer?",
      "vector::push_back invalidates all references/pointers/iterators when size exceeds capacity (reallocation). When is reallocation frequent? (Growth phase — e.g., the market open when live orders ramp from 0 to thousands.)",
      "Fix directions: stable identity (map keyed by id / index + generation), stable addresses (std::deque never invalidates references on push_back at the ends... check that claim! — or list/unique_ptr), or invert ownership (registry owns orders; callbacks capture the id and look up).",
    ],
    solutionOutline:
      "The lambda captures a raw pointer to an element of \`live_\`. Any later push_back that exceeds capacity reallocates the buffer, copying/moving elements to a new allocation and freeing the old one — the captured pointer now dangles; the next fill callback reads freed memory (A). 'Busy open' = the growth phase where capacity doubles repeatedly, so reallocation (and armed dangling pointers) is common; quiet periods run inside reserved capacity, hiding the bug — and staging never had enough order flow until today. Fixes: (1) capture the order *id* and look up in an unordered_map<string, Order> owned by the router — stable identity, hash cost per fill, needs synchronization for the venue thread (the code has a threading problem too: venue thread mutating qty while the submit thread mutates the container — flag it). (2) Store std::unique_ptr<Order> in the vector (or an std::deque + never erase from the middle) so element *addresses* are stable across container growth; capture Order* — fast, but lifetime still ends at erase → must unregister callbacks before removal (ordering discipline). (3) Index+generation handles: capture {slot, gen}; a freed slot bumps gen; callbacks validate before touching — the trading-systems answer (object pools, no allocation, ABA-safe). Use-after-move contrast: if someone later did \`Order o2 = std::move(live_[i])\`, the moved-from string id would be valid-but-unspecified and callbacks would misbehave *without* ASan firing — UAF reads freed memory; use-after-move reads a live object in a drained state; different detectors (ASan vs clang-tidy bugprone-use-after-move).",
    fullSolution:
      "\`\`\`cpp\n// Fix 3 sketch: pool + generation handles (the low-latency answer)\nstruct Handle { uint32_t slot; uint32_t gen; };\n\nclass OrderRouter {\n    struct Slot { Order order; uint32_t gen = 0; bool live = false; };\n    std::vector<Slot> pool_;             // reserved up-front; never reallocates\n    std::vector<uint32_t> free_list_;\npublic:\n    OrderRouter() { pool_.reserve(MAX_LIVE); pool_.resize(MAX_LIVE); }\n\n    Handle submit(Order o) {\n        uint32_t slot = alloc_slot();\n        pool_[slot].order = std::move(o);\n        pool_[slot].live = true;\n        Handle h{slot, pool_[slot].gen};\n        venue_register(pool_[slot].order.id, [this, h](int filled) {\n            Slot& s = pool_[h.slot];\n            if (!s.live || s.gen != h.gen) return;   // stale callback: ignore\n            s.order.qty -= filled;\n        });\n        return h;\n    }\n\n    void retire(Handle h) {\n        Slot& s = pool_[h.slot];\n        s.live = false;\n        ++s.gen;                                      // invalidates outstanding handles\n        free_list_.push_back(h.slot);\n    }\n};\n\`\`\`\n\nStill to fix for real: cross-thread access to qty (atomic or single-writer queueing of fills onto the router thread — the idiomatic trading answer is the latter: one thread owns the book, fills arrive via an SPSC queue). The bug taxonomy sentence that impresses: *pointer stability, object lifetime, and thread ownership are three separate contracts; this code violated the first, and fixing it exposes the third.*",
    commonMistakes: [
      "Blaming std::move in submit (that part is fine) instead of pointer invalidation by container growth.",
      "Fixing with live_.reserve(BIG) — hides the bug until BIG+1 orders; capacity is not a lifetime contract.",
      "Switching to std::deque for 'stable iterators' — deque preserves *references* on push_back at ends but not iterators; and erase still invalidates; imprecision here is exactly what the interviewer probes.",
      "Ignoring the venue-thread/router-thread data race that the ownership redesign surfaces.",
      "Conflating use-after-free with use-after-move when asked the contrast question.",
    ],
    followUpQuestions: [
      "Why do trading systems preallocate pools and forbid steady-state allocation — name the latency mechanism (allocator locks, page faults, cache misses)?",
      "How does ASan actually detect this read — what's shadow memory and what's the slowdown; why can't you run it in prod?",
      "Redesign the venue callback interface so this bug class is unrepresentable (hint: callbacks deliver ids; state lives in one thread).",
    ],
    rubric: [
      { criterion: "Invalidation mechanics", description: "push_back reallocation → dangling captured pointer; exact free-then-read sequence." },
      { criterion: "Phase reasoning", description: "Growth-phase frequency explains busy-open correlation and staging silence." },
      { criterion: "Fix spectrum", description: "Identity lookup vs stable addresses vs pool+generation, with costs; picks per context." },
      { criterion: "Hidden second bug", description: "Names the cross-thread mutation and the single-writer redesign." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/container/vector/push_back",
      "https://clang.llvm.org/docs/AddressSanitizer.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "flaky-test-global-state",
    title: "The Test That Only Fails on Tuesdays (and in CI)",
    type: "debugging",
    difficulty: "medium",
    topics: ["testing", "global-state", "python", "flaky-tests"],
    targetRoles: ["backend_swe", "new_grad_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "\`test_premium_discount\` passes alone (\`pytest test_pricing.py::test_premium_discount\`) but fails in the full suite — and only *sometimes*. The team has been retrying CI for weeks. The modules are below.\n\n1. Find all three isolation defects.\n2. Explain the 'passes alone, fails in suite, sometimes' signature for each.\n3. Fix the code and the tests, and state the general rules that keep suites deterministic.",
    starterCode:
      "# pricing.py\nimport random\nfrom datetime import date\n\n_rules_cache: dict | None = None\n\ndef get_rules():\n    global _rules_cache\n    if _rules_cache is None:\n        _rules_cache = load_rules_from_db()\n    return _rules_cache\n\ndef quote(user, base_price):\n    rules = get_rules()\n    price = base_price * rules['multiplier']\n    if user.is_premium and date.today().weekday() < 5:   # weekday discount\n        price *= 0.9\n    if rules.get('ab_test') and random.random() < 0.5:\n        price *= 0.95\n    return round(price, 2)\n\n# test_admin.py (runs earlier in the suite, alphabetically)\ndef test_admin_override():\n    rules = get_rules()\n    rules['multiplier'] = 99          # mutates the cached dict!\n    assert quote(admin_user, 1) == 99 * 1\n\n# test_pricing.py\ndef test_premium_discount():\n    assert quote(premium_user, 100.0) == 90.0\n",
    hints: [
      "Defect 1: what does test_admin_override do to every test that runs after it? Who owns the dict returned by get_rules()?",
      "Defect 2: date.today() inside logic — what happens when CI runs on a weekend? ('Only fails on Tuesdays' was a lie the team told themselves; check what days it *can* pass.)",
      "Defect 3: random.random() in the quote path with no seeded/injected source — even with clean caches and frozen time, what's the failure probability per run if ab_test is on?",
    ],
    solutionOutline:
      "Three defects: (1) Shared mutable cache: get_rules() hands out the cached dict itself; test_admin_override mutates it in place, poisoning every later test in the process → order-dependent failure (passes alone; fails after admin test; 'sometimes' because pytest ordering can vary with -p randomly / test selection). (2) Hidden clock dependency: the weekday discount makes expected values day-dependent — weekend CI runs fail legitimately; local runs (weekdays) pass. (3) Hidden randomness: the A/B branch applies 5% off with p=0.5 whenever rules enable ab_test — nondeterministic failures uncorrelated with anything. Fixes — code: return copies (or immutable Mapping) from get_rules, or better provide reset_rules_cache() for tests and never share mutable module state; inject clock and rng (parameters with defaults, or a context object) so logic is deterministic under test; tests: fixture that resets module caches around each test (autouse), freeze time (injected clock, not sleep/monkeypatch-of-datetime-if-avoidable), seed/inject rng, and make the admin test use its own fixture data instead of mutating shared state. General rules: no test mutates shared state it didn't create; all nondeterminism (time, rng, env, network) enters through injectable seams; suites must pass under random test order (pytest-randomly) as the enforcement mechanism.",
    fullSolution:
      "\`\`\`python\n# pricing.py — determinism via injection, isolation via copies\nimport random\nfrom datetime import date\n\n_rules_cache: dict | None = None\n\ndef get_rules() -> dict:\n    global _rules_cache\n    if _rules_cache is None:\n        _rules_cache = load_rules_from_db()\n    return dict(_rules_cache)          # callers can't poison the cache\n\ndef reset_rules_cache() -> None:      # explicit seam for tests\n    global _rules_cache\n    _rules_cache = None\n\ndef quote(user, base_price, *, today=None, rng=random.random):\n    rules = get_rules()\n    today = today or date.today()\n    price = base_price * rules['multiplier']\n    if user.is_premium and today.weekday() < 5:\n        price *= 0.9\n    if rules.get('ab_test') and rng() < 0.5:\n        price *= 0.95\n    return round(price, 2)\n\n# conftest.py\nimport pytest\n\n@pytest.fixture(autouse=True)\ndef clean_rules():\n    reset_rules_cache()\n    yield\n    reset_rules_cache()\n\n# test_pricing.py\ndef test_premium_discount():\n    assert quote(premium_user, 100.0,\n                 today=date(2026, 7, 1),      # a Wednesday, pinned\n                 rng=lambda: 1.0) == 90.0      # A/B branch off\n\`\`\`\n\nThe meta-lesson to say out loud: *flaky tests are not a testing problem; they're the product code confessing its hidden inputs.* Every flake here mapped to an unowned dependency — shared state, wall clock, global rng.",
    commonMistakes: [
      "Fixing only the cache and declaring victory — the time and rng defects independently produce flakes.",
      "'Fixing' with retries or test re-ordering (rerunfailures) — institutionalizes the nondeterminism.",
      "Monkeypatching datetime.today globally instead of adding an injectable seam (works, but couples tests to implementation and breaks under parallelism).",
      "Making get_rules return deepcopies everywhere without measuring — a shallow copy suffices for this shape; know what you're paying for.",
      "Blaming pytest/CI infrastructure before reading the code.",
    ],
    followUpQuestions: [
      "How do you *find* order-dependent tests in a 10k-test suite systematically? (Random orders, bisection — pytest-randomly + pytest-bisect workflows.)",
      "When is module-level caching in production code legitimate, and what's the standard test seam for it?",
      "What CI policies actually reduce flake debt — quarantine lanes, flake budgets, auto-filed tickets? What are the failure modes of quarantine?",
    ],
    rubric: [
      { criterion: "All three defects", description: "Shared mutable cache, clock dependency, unseeded randomness — each with its flake signature." },
      { criterion: "Signature reasoning", description: "Maps 'alone vs suite vs sometimes' to order-dependence vs day-dependence vs probability." },
      { criterion: "Seam-based fixes", description: "Injection for time/rng; cache isolation + reset fixture; no retry band-aids." },
      { criterion: "Enforcement", description: "Random-order CI (or equivalent) as the regression backstop." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://docs.pytest.org/en/stable/how-to/fixtures.html"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "queue-redelivery-duplicate-emails",
    title: "Customers Got the Invoice Email Three Times",
    type: "debugging",
    difficulty: "medium",
    topics: ["message-queues", "idempotency", "distributed-systems", "at-least-once"],
    targetRoles: ["backend_swe", "distributed_systems_engineer", "platform_engineer"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 30,
    language: "python",
    prompt:
      "After a deploy that 'just added PDF rendering' to the invoice consumer, some customers received the same invoice email 2–3 times. Queue: SQS-style, visibility timeout 30 s. The consumer is below.\n\n1. Explain the full redelivery mechanism — why did adding PDF rendering *cause* this?\n2. Why 2–3 times and only for *some* customers?\n3. Fix it properly. 'Increase the visibility timeout' is on the table — is it a fix?",
    starterCode:
      "VISIBILITY_TIMEOUT = 30  # seconds, queue-side\n\ndef consume_loop():\n    while True:\n        msg = queue.receive(visibility_timeout=VISIBILITY_TIMEOUT)\n        if msg is None:\n            continue\n        invoice = load_invoice(msg.body['invoice_id'])\n        pdf = render_pdf(invoice)          # NEW: 5-40s depending on size\n        send_email(invoice.email, pdf)     # external ESP call\n        mark_sent(invoice.id)\n        queue.ack(msg)                     # delete message\n",
    hints: [
      "Walk the clock: receive at t=0 (invisible until t=30). render_pdf takes 35 s for a big invoice. What does the queue do at t=30, while worker A is still rendering?",
      "Worker B receives the redelivered message at t=30 and starts the same invoice. Both eventually send_email and ack. Which sends happened? Which acks succeeded?",
      "At-least-once delivery is the queue's contract, not a bug. Where must exactly-once *effects* be manufactured, and what two mechanisms does that require here (dedupe key on the effect, and/or visibility heartbeat)?",
    ],
    solutionOutline:
      "Mechanism: the deploy pushed processing time past the visibility timeout for large invoices. Worker A receives at t=0; at t=30 the message becomes visible again (A hasn't acked); worker B receives the same message; both send the email; both acks 'succeed' (deleting an already-redelivered/re-received message is not an error in SQS semantics). Very large invoices can exceed 60 s → third delivery → 3 emails. 'Some customers' = those with PDFs slow enough to breach 30 s. Why the queue behaves this way: visibility timeout is crash detection — the queue can't distinguish 'slow' from 'dead', so at-least-once redelivery is the contract; any consumer with side effects must be idempotent. Fixes, in order of correctness: (1) idempotent effect — mark_sent BEFORE send? No: crash between mark and send loses the email (at-most-once). Correct shape: dedupe on a durable key around the *email send* — e.g., conditional insert of (invoice_id, 'email_sent') into a table with a unique constraint before sending; if the insert conflicts, skip; if crash after insert before send, need a reconciler or an ESP-level idempotency key (many ESPs accept one) — combine both: ESP idempotency key = invoice_id makes the send itself idempotent, which is the real fix. (2) visibility heartbeat: extend the timeout periodically while working (ChangeMessageVisibility) — reduces spurious redelivery for slow-but-alive workers; still not sufficient alone (crashes still redeliver). (3) Raising the static timeout to 120 s: reduces frequency, adds 120 s of latency to *crash* recovery, and any future slowdown re-breaks it — a tuning knob, not a fix. State the law: **at-least-once delivery + non-idempotent side effect = duplicates; the fix is always idempotence at the effect, everything else is frequency management.**",
    fullSolution:
      "\`\`\`python\ndef consume_loop():\n    while True:\n        msg = queue.receive(visibility_timeout=60)\n        if msg is None:\n            continue\n        invoice_id = msg.body['invoice_id']\n        with heartbeat(queue, msg, every=20):        # extend visibility while alive\n            claimed = db.execute(\n                'INSERT INTO email_sends (invoice_id) VALUES (%s) '\n                'ON CONFLICT DO NOTHING', (invoice_id,)).rowcount == 1\n            if claimed:\n                invoice = load_invoice(invoice_id)\n                pdf = render_pdf(invoice)\n                send_email(invoice.email, pdf,\n                           idempotency_key=f'invoice-{invoice_id}')  # ESP-side dedupe\n                mark_sent(invoice_id)\n        queue.ack(msg)\n\`\`\`\n\nRemaining window to acknowledge honestly: crash after the conditional insert but before the ESP call → that invoice's email is never sent unless a reconciler sweeps \`email_sends\` rows without \`mark_sent\`. With the ESP idempotency key, an alternative is to *not* pre-claim and let the ESP dedupe — pick based on whether your ESP's idempotency window is trustworthy. Duplicates and drops are the two ditches; you steer with idempotent effects plus reconciliation, not with timeout tuning.",
    commonMistakes: [
      "Calling the queue buggy — at-least-once redelivery on visibility expiry is the documented contract.",
      "Fixing with a longer static timeout only (latency on crash recovery, re-breaks on next slowdown).",
      "mark_sent-before-send as 'idempotency' — converts duplicates into silent drops (at-most-once).",
      "In-memory dedupe set in the consumer — multiple workers/pods defeat it by construction.",
      "Not knowing acks of expired/redelivered messages don't error — both workers believe they won.",
    ],
    followUpQuestions: [
      "FIFO queues with deduplication ids: what exactly do they dedupe, over what window, and why doesn't that replace effect-level idempotency?",
      "Design the reconciler for the claim-then-crash window. What invariant does it enforce and how often does it run?",
      "The PDF render itself is expensive to duplicate. Do you also make *it* idempotent (artifact store keyed by invoice), and when is duplicate compute acceptable?",
    ],
    rubric: [
      { criterion: "Redelivery mechanics", description: "Visibility-timeout expiry during slow processing → concurrent duplicate consumers; ack semantics understood." },
      { criterion: "Deploy correlation", description: "Ties the new rendering latency distribution to which customers got duplicates." },
      { criterion: "Idempotence at the effect", description: "Durable claim + ESP idempotency key; rejects timeout tuning and mark-before-send." },
      { criterion: "Honest windows", description: "Names the residual claim-then-crash gap and the reconciler." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
