import { defineProblems } from "./types";

/**
 * Runnable augmentations (Prompt 4): non-DSA problems made runnable with the
 * existing local runner. Deterministic scenarios + invariant tests; starter code
 * is intentionally buggy. Path/module/lesson/confidence mappings live in
 * learning-overrides.ts. python-only (asyncio / sqlite3).
 */
export const runnableSystemsProblems = defineProblems([
  {
    "slug": "async-worker-at-least-once",
    "title": "Make the Async Worker Lose Zero Jobs (Runnable)",
    "type": "debugging",
    "difficulty": "medium",
    "topics": [
      "async",
      "python",
      "queues",
      "at-least-once",
      "retry"
    ],
    "targetRoles": [
      "backend_swe",
      "mid_level_swe",
      "platform_engineer"
    ],
    "companyStyles": [
      "startup",
      "big_tech",
      "fintech"
    ],
    "estimatedMinutes": 20,
    "language": "python",
    "functionName": "run_worker",
    "testHarnessType": "function_call",
    "supportedLanguages": [
      "python"
    ],
    "prompt": "This is the runnable companion to \"The Async Worker That Loses Jobs Under Load.\" A thumbnail worker processes jobs, but ~0.5% vanish — no result, no retry. Here the loss is reproduced deterministically: some jobs (`flaky_ids`) raise a transient error on their FIRST attempt and succeed on a retry.\n\nThe starter `run_worker` catches the error and DROPS the job instead of retrying it, so every flaky job is silently lost. Fix it so the worker has proper at-least-once semantics: every job id must appear in the returned (sorted) list, retrying transient failures.\n\n```python\ntry:\n    await render(job)\n    completed.append(job[\"id\"])\nexcept Exception:\n    pass   # <-- the bug: logged/silent loss, no retry\n```\n\nRun the tests: the invariant is that no job is ever lost.",
    "context": "The full written-answer version (async-worker-drops-jobs) also covers the un-referenced create_task GC footgun, which is timing-dependent and not deterministically testable. This runnable sibling targets the at-least-once retry semantics, which are.",
    "constraints": "Return the sorted list of completed job ids. A flaky job succeeds on its second attempt, so a correct worker completes 100% of jobs. Do not drop a job on a transient failure; retry it (cap attempts to avoid an infinite loop on a truly permanent failure).",
    "starterCode": "import asyncio\n\nasync def render(job):\n    # A flaky job raises a transient error on its FIRST attempt only,\n    # then succeeds if retried. (Simulates an occasional RenderError.)\n    if job[\"flaky\"] and job[\"attempts\"] == 0:\n        job[\"attempts\"] += 1\n        raise RuntimeError(\"transient render error\")\n    return f\"thumb-{job['id']}\"\n\nasync def run_worker(job_ids: list[int], flaky_ids: list[int]) -> list[int]:\n    \"\"\"\n    Process EVERY job with at-least-once semantics and return the sorted list of\n    completed job ids. Jobs whose id is in flaky_ids raise once and must be retried.\n    \"\"\"\n    flaky = set(flaky_ids)\n    jobs = [{\"id\": j, \"flaky\": j in flaky, \"attempts\": 0} for j in job_ids]\n    completed: list[int] = []\n    for job in jobs:\n        # BUG: on failure the job is dropped instead of retried -> silent loss.\n        try:\n            await render(job)\n            completed.append(job[\"id\"])\n        except Exception:\n            pass  # <-- logged/silent loss, no retry: this is the bug to fix\n    return sorted(completed)\n",
    "tests": [
      {
        "name": "flaky jobs are retried, none lost",
        "input": "job_ids=[1,2,3,4,5], flaky_ids=[2,4]",
        "expected": "[1, 2, 3, 4, 5]",
        "args": [
          [
            1,
            2,
            3,
            4,
            5
          ],
          [
            2,
            4
          ]
        ],
        "expectedValue": [
          1,
          2,
          3,
          4,
          5
        ]
      },
      {
        "name": "no flaky jobs",
        "input": "job_ids=[1,2,3], flaky_ids=[]",
        "expected": "[1, 2, 3]",
        "args": [
          [
            1,
            2,
            3
          ],
          []
        ],
        "expectedValue": [
          1,
          2,
          3
        ],
        "hidden": true
      },
      {
        "name": "every job is flaky",
        "input": "job_ids=[1,2,3], flaky_ids=[1,2,3]",
        "expected": "[1, 2, 3]",
        "args": [
          [
            1,
            2,
            3
          ],
          [
            1,
            2,
            3
          ]
        ],
        "expectedValue": [
          1,
          2,
          3
        ],
        "hidden": true
      },
      {
        "name": "single flaky job",
        "input": "job_ids=[7], flaky_ids=[7]",
        "expected": "[7]",
        "args": [
          [
            7
          ],
          [
            7
          ]
        ],
        "expectedValue": [
          7
        ],
        "hidden": true
      }
    ],
    "hints": [
      "The bug is that a transient failure drops the job. At-least-once means: on failure, retry rather than move on.",
      "Wrap the render call in a retry loop; break out on success, and cap attempts so a truly permanent failure cannot loop forever.",
      "render() increments job['attempts'] when it fails, so a flaky job succeeds on the next call."
    ],
    "solutionOutline": "Replace the drop-on-failure try/except with a retry loop: for each job, loop calling render(job); on success append the id and break; on exception, retry while attempts < a small cap, otherwise give up (dead-letter). Because a flaky job succeeds on its second attempt, the retry loop completes every job, so the returned sorted list contains all ids — the at-least-once invariant. The cap prevents an infinite loop on a permanently failing job.",
    "fullSolution": "```python\nimport asyncio\n\nasync def render(job):\n    if job[\"flaky\"] and job[\"attempts\"] == 0:\n        job[\"attempts\"] += 1\n        raise RuntimeError(\"transient render error\")\n    return f\"thumb-{job['id']}\"\n\nasync def run_worker(job_ids, flaky_ids):\n    flaky = set(flaky_ids)\n    jobs = [{\"id\": j, \"flaky\": j in flaky, \"attempts\": 0} for j in job_ids]\n    completed = []\n    for job in jobs:\n        while True:                      # retry until success or attempts exhausted\n            try:\n                await render(job)\n                completed.append(job[\"id\"])\n                break\n            except Exception:\n                if job[\"attempts\"] < 3:\n                    continue             # transient -> retry (at-least-once)\n                break                    # permanent -> give up (would dead-letter)\n    return sorted(completed)\n```",
    "commonMistakes": [
      "Catching the exception and continuing (logging the loss) instead of retrying — still loses the job.",
      "Retrying with no attempt cap, which would loop forever on a permanent failure.",
      "Appending the id before render() actually succeeds, counting a failed job as done."
    ],
    "followUpQuestions": [
      "This models retry in-process. What changes about ack/retry when the queue is Redis or SQS (visibility timeout, redelivery)?",
      "How would you bound concurrency (a semaphore) while keeping at-least-once, and why does unbounded create_task trade loss for OOM?",
      "How would you make the un-referenced-create_task GC bug from the written-answer version deterministic in a test?"
    ],
    "rubric": [
      {
        "criterion": "At-least-once",
        "description": "Retries transient failures so every job id is completed; no silent drops."
      },
      {
        "criterion": "Termination",
        "description": "Caps retries so a permanent failure cannot loop forever."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "keyset-pagination-consistency",
    "title": "Stop Offset Pagination From Skipping and Duplicating Rows (Runnable)",
    "type": "write_code",
    "difficulty": "medium",
    "topics": [
      "databases",
      "pagination",
      "keyset",
      "cursors",
      "sql"
    ],
    "targetRoles": [
      "backend_swe",
      "mid_level_swe"
    ],
    "companyStyles": [
      "big_tech",
      "startup",
      "fintech"
    ],
    "estimatedMinutes": 25,
    "language": "python",
    "functionName": "paginate",
    "testHarnessType": "function_call",
    "supportedLanguages": [
      "python"
    ],
    "prompt": "An export endpoint orders an `events` table by `created_at DESC, id DESC` and pages with `LIMIT ? OFFSET ?`. During a long export, new (newer) rows are inserted concurrently — and rows start showing up **twice** or getting **skipped**, because every later OFFSET points into a window that shifted when rows were inserted at the front.\n\nThe runnable harness seeds an in-memory SQLite table and inserts newer rows between pages (`inserts_after_page[k]` after page k). The starter uses OFFSET and fails. Replace it with **keyset (cursor) pagination**: remember the last row's `(created_at, id)` and fetch strictly past it, so the scan is consistent regardless of concurrent inserts.\n\n```sql\n-- starter (buggy): window shifts under concurrent inserts\nSELECT id FROM events ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?;\n```\n\nReturn the flat list of ids the export yields. The invariant: every id present for the whole scan appears exactly once — no duplicates, no skips.",
    "context": "The consistency bug is the deterministic, testable core. The plan-cost problem (OFFSET does a full scan of skipped rows) is real too but is not visible in the output — it needs a plan-cost oracle (see Prompt 4).",
    "constraints": "Order by (created_at DESC, id DESC) and make the ordering deterministic when timestamps collide (that is why id is the tiebreaker). Concurrent inserts are always newer (larger created_at), so a consistent keyset scan visits exactly the rows present at the start, each once. Use a matching cursor comparison: (created_at < c) OR (created_at = c AND id < c_id).",
    "starterCode": "import sqlite3\n\ndef paginate(rows, inserts_after_page, page_size):\n    \"\"\"\n    rows: initial [created_at, id] pairs present when the export starts.\n    inserts_after_page[k]: rows inserted AFTER page k is fetched (concurrent inserts\n      during a long export). Every insert is a NEWER event (larger created_at).\n    Return the FLAT list of ids the export yields, in order (created_at DESC, id DESC).\n\n    A CONSISTENT export visits every id present for the whole scan exactly once:\n    no duplicates and no skips caused by the concurrent inserts.\n    \"\"\"\n    db = sqlite3.connect(\":memory:\")\n    db.execute(\"CREATE TABLE events (created_at INTEGER, id INTEGER)\")\n    db.executemany(\"INSERT INTO events VALUES (?, ?)\", rows)\n    db.commit()\n\n    out, page_index, offset = [], 0, 0\n    while True:\n        # BUG: OFFSET pagination. When newer rows are inserted at the front during\n        # the scan, every later OFFSET points to a shifted window -> duplicates/skips.\n        page = [r[0] for r in db.execute(\n            \"SELECT id FROM events ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?\",\n            (page_size, offset),\n        ).fetchall()]\n        if not page:\n            break\n        out.extend(page)\n        offset += page_size\n        if page_index < len(inserts_after_page):\n            db.executemany(\"INSERT INTO events VALUES (?, ?)\", inserts_after_page[page_index])\n            db.commit()\n        page_index += 1\n    return out\n",
    "tests": [
      {
        "name": "concurrent inserts must not duplicate rows",
        "input": "6 rows, insert 1 newer row after each of the first 2 pages, page_size=2",
        "expected": "[6, 5, 4, 3, 2, 1]",
        "args": [
          [
            [
              1,
              1
            ],
            [
              2,
              2
            ],
            [
              3,
              3
            ],
            [
              4,
              4
            ],
            [
              5,
              5
            ],
            [
              6,
              6
            ]
          ],
          [
            [
              [
                100,
                7
              ]
            ],
            [
              [
                101,
                8
              ]
            ]
          ],
          2
        ],
        "expectedValue": [
          6,
          5,
          4,
          3,
          2,
          1
        ]
      },
      {
        "name": "no concurrent inserts (offset would also pass)",
        "input": "4 rows, no inserts, page_size=2",
        "expected": "[4, 3, 2, 1]",
        "args": [
          [
            [
              1,
              1
            ],
            [
              2,
              2
            ],
            [
              3,
              3
            ],
            [
              4,
              4
            ]
          ],
          [],
          2
        ],
        "expectedValue": [
          4,
          3,
          2,
          1
        ],
        "hidden": true
      },
      {
        "name": "insert after the first page",
        "input": "4 rows, insert 1 newer row after page 0, page_size=2",
        "expected": "[4, 3, 2, 1]",
        "args": [
          [
            [
              1,
              1
            ],
            [
              2,
              2
            ],
            [
              3,
              3
            ],
            [
              4,
              4
            ]
          ],
          [
            [
              [
                100,
                5
              ]
            ]
          ],
          2
        ],
        "expectedValue": [
          4,
          3,
          2,
          1
        ],
        "hidden": true
      },
      {
        "name": "single page holds everything",
        "input": "3 rows, no inserts, page_size=10",
        "expected": "[3, 2, 1]",
        "args": [
          [
            [
              1,
              1
            ],
            [
              2,
              2
            ],
            [
              3,
              3
            ]
          ],
          [],
          10
        ],
        "expectedValue": [
          3,
          2,
          1
        ],
        "hidden": true
      }
    ],
    "hints": [
      "OFFSET counts rows from the top every query; if rows are inserted above your position, the same rows slide into a later OFFSET window (duplicates), or rows slide out (skips).",
      "Keyset pagination pins your position to the last row you saw: remember (created_at, id) and fetch WHERE the row sorts strictly after it.",
      "The tiebreaker matters: WHERE (created_at < c) OR (created_at = c AND id < c_id), ordered the same way, with LIMIT page_size."
    ],
    "solutionOutline": "Track the cursor (created_at, id) of the last row returned. The first page selects the top page_size rows by (created_at DESC, id DESC). Each subsequent page selects rows strictly past the cursor: WHERE (created_at < cursor_ca) OR (created_at = cursor_ca AND id < cursor_id), same ORDER BY and LIMIT. Because newer inserts have larger created_at, they sort ahead of the cursor and are never revisited, so the scan visits exactly the initial rows once — no duplicates, no skips. Keyset also fixes the plan cost (it seeks via the composite index instead of scanning and discarding OFFSET rows), though that is not visible in the returned ids.",
    "fullSolution": "```python\nimport sqlite3\n\ndef paginate(rows, inserts_after_page, page_size):\n    db = sqlite3.connect(\":memory:\")\n    db.execute(\"CREATE TABLE events (created_at INTEGER, id INTEGER)\")\n    db.executemany(\"INSERT INTO events VALUES (?, ?)\", rows)\n    db.commit()\n\n    out, page_index, cursor = [], 0, None\n    while True:\n        if cursor is None:                       # first page\n            page = db.execute(\n                \"SELECT created_at, id FROM events \"\n                \"ORDER BY created_at DESC, id DESC LIMIT ?\",\n                (page_size,),\n            ).fetchall()\n        else:                                    # keyset: strictly past the cursor\n            page = db.execute(\n                \"SELECT created_at, id FROM events \"\n                \"WHERE (created_at < ?) OR (created_at = ? AND id < ?) \"\n                \"ORDER BY created_at DESC, id DESC LIMIT ?\",\n                (cursor[0], cursor[0], cursor[1], page_size),\n            ).fetchall()\n        if not page:\n            break\n        out.extend([r[1] for r in page])\n        cursor = (page[-1][0], page[-1][1])      # remember the exact position\n        if page_index < len(inserts_after_page):\n            db.executemany(\"INSERT INTO events VALUES (?, ?)\", inserts_after_page[page_index])\n            db.commit()\n        page_index += 1\n    return out\n```",
    "commonMistakes": [
      "Keeping OFFSET and hoping a snapshot/transaction hides it — the window still shifts across separate page queries.",
      "Using only created_at in the cursor with no id tiebreaker, which duplicates or skips rows when timestamps collide.",
      "Using <= instead of < in the cursor comparison, re-returning the boundary row."
    ],
    "followUpQuestions": [
      "What composite index makes the keyset query a single index seek, and why does OFFSET not benefit from it?",
      "How do you expose the cursor to clients so it is opaque and cannot be forged or parsed?",
      "How would you test the plan-cost claim (OFFSET scans skipped rows) rather than just the consistency invariant?"
    ],
    "rubric": [
      {
        "criterion": "Consistent scan",
        "description": "Keyset cursor visits every start-of-scan row exactly once despite concurrent inserts — no duplicates or skips."
      },
      {
        "criterion": "Deterministic ordering",
        "description": "Uses the (created_at, id) tiebreaker and a strict cursor comparison."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "idempotent-charge-on-retry",
    "title": "Stop the Retry From Charging the Card Twice (Runnable)",
    "type": "debugging",
    "difficulty": "medium",
    "topics": [
      "idempotency",
      "payments",
      "retry",
      "python",
      "reliability"
    ],
    "targetRoles": [
      "backend_swe",
      "mid_level_swe",
      "quant_developer"
    ],
    "companyStyles": [
      "fintech",
      "big_tech",
      "startup"
    ],
    "estimatedMinutes": 20,
    "language": "python",
    "functionName": "process_charges",
    "testHarnessType": "function_call",
    "supportedLanguages": [
      "python"
    ],
    "prompt": "This is the runnable companion to \"The Timeout That Charges the Card Twice.\" A client posts a charge, the server processes it, but the response times out on the client side — so the client retries. The retry carries the SAME idempotency key, because it is the same logical charge.\n\nThe payment gateway here is deliberately dumb: `gateway.charge(key, amount)` charges whatever you hand it. Idempotency is the CLIENT's job. The starter charges on every delivery, so every retried request double-charges the customer.\n\n```python\nfor key, amount in requests:\n    gateway.charge(key, amount)   # <-- charges again on every retry\n```\n\nFix `process_charges` so each idempotency key is charged at most once, and return the total cents actually charged. The invariant: retries never move money twice.",
    "context": "The full written-answer version (timeout-double-charge) also covers server-side dedup tables and the window between charge and record. This runnable sibling isolates the client-side idempotency guard, which is deterministic and testable.",
    "constraints": "A retried request re-appears with the SAME idempotency key (the first attempt actually succeeded server-side; only the client's response timed out). Two DIFFERENT charges that happen to share an amount but have different keys must BOTH go through — dedupe on the key, never on the amount. Return the total cents charged.",
    "starterCode": "class _Gateway:\n    \"\"\"A dumb payment gateway: it charges whatever you tell it. It does NOT\n    dedupe — making the operation idempotent is the caller's responsibility.\"\"\"\n    def __init__(self):\n        self.total = 0\n\n    def charge(self, key, amount):\n        self.total += amount\n\n\ndef process_charges(requests):\n    \"\"\"\n    requests: list of [idempotency_key, amount_cents]. A retried request re-appears\n    with the SAME idempotency_key (its first attempt already succeeded server-side;\n    only the client's response timed out). Charge each idempotency_key at most once\n    and return the total cents actually charged.\n    \"\"\"\n    gateway = _Gateway()\n    for key, amount in requests:\n        # BUG: charges on every delivery, so a retried request double-charges.\n        gateway.charge(key, amount)\n    return gateway.total\n",
    "tests": [
      {
        "name": "a retried charge (same key) must not charge twice",
        "input": "[[a,100],[b,50],[a,100]]",
        "expected": "150",
        "args": [
          [
            [
              "a",
              100
            ],
            [
              "b",
              50
            ],
            [
              "a",
              100
            ]
          ]
        ],
        "expectedValue": 150
      },
      {
        "name": "three retries of one charge = one charge",
        "input": "[[a,100],[a,100],[a,100]]",
        "expected": "100",
        "args": [
          [
            [
              "a",
              100
            ],
            [
              "a",
              100
            ],
            [
              "a",
              100
            ]
          ]
        ],
        "expectedValue": 100,
        "hidden": true
      },
      {
        "name": "distinct keys with equal amounts all go through (no amount-dedup)",
        "input": "[[a,100],[b,100],[c,100]]",
        "expected": "300",
        "args": [
          [
            [
              "a",
              100
            ],
            [
              "b",
              100
            ],
            [
              "c",
              100
            ]
          ]
        ],
        "expectedValue": 300,
        "hidden": true
      },
      {
        "name": "no requests",
        "input": "[]",
        "expected": "0",
        "args": [
          []
        ],
        "expectedValue": 0,
        "hidden": true
      }
    ],
    "hints": [
      "The gateway does not dedupe. If you call charge() for every request, a retry with the same key moves money a second time.",
      "Track the idempotency keys you have already charged in a set; skip a request whose key you have seen before.",
      "Dedupe on the KEY, not the amount — two different charges can legitimately share an amount."
    ],
    "solutionOutline": "Maintain a set of already-charged idempotency keys. For each request, if the key is in the set, skip it (this is a retry of a charge that already succeeded); otherwise record the key and call gateway.charge. Because retries reuse the key, each logical charge moves money exactly once, so the returned total counts each distinct key's amount a single time. Deduping on the key (not the amount) preserves legitimate distinct charges that happen to share an amount. In production the seen-set is a persistent idempotency table and the check-then-charge must be atomic, but the guard is the same idea.",
    "fullSolution": "```python\nclass _Gateway:\n    def __init__(self):\n        self.total = 0\n\n    def charge(self, key, amount):\n        self.total += amount\n\n\ndef process_charges(requests):\n    gateway = _Gateway()\n    seen = set()                       # idempotency keys already charged\n    for key, amount in requests:\n        if key in seen:\n            continue                   # retry of an already-succeeded charge\n        seen.add(key)\n        gateway.charge(key, amount)\n    return gateway.total\n```",
    "commonMistakes": [
      "Deduping on the amount instead of the key, silently dropping two different charges that share a price.",
      "Charging first and recording the key after — in a real system a crash in that window re-charges on retry.",
      "Assuming the gateway is idempotent; here it explicitly is not, which is the realistic case for a raw charge API."
    ],
    "followUpQuestions": [
      "Where does the idempotency key come from, and why must the CLIENT generate it before the first attempt rather than the server?",
      "How do you make the check-then-charge atomic across two concurrent workers that both receive the retry?",
      "What is the difference between this client-side guard and the server storing {key -> result} and replaying the stored response?"
    ],
    "rubric": [
      {
        "criterion": "Idempotent charge",
        "description": "Each idempotency key moves money at most once; retries are no-ops."
      },
      {
        "criterion": "Correct dedup key",
        "description": "Dedupes on the idempotency key, not the amount."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "cache-invalidate-after-commit",
    "title": "Don't Cache a Value the Database Never Committed (Runnable)",
    "type": "debugging",
    "difficulty": "medium",
    "topics": [
      "caching",
      "consistency",
      "transactions",
      "python",
      "ordering"
    ],
    "targetRoles": [
      "backend_swe",
      "mid_level_swe",
      "platform_engineer"
    ],
    "companyStyles": [
      "big_tech",
      "startup",
      "fintech"
    ],
    "estimatedMinutes": 20,
    "language": "python",
    "functionName": "apply_ops",
    "testHarnessType": "function_call",
    "supportedLanguages": [
      "python"
    ],
    "prompt": "This is the runnable companion to \"The Cache That Serves Data the Database Rolled Back.\" Each write updates a value in the database and in a read-through cache. Some transactions roll back (a later constraint fails). The starter writes the cache FIRST, before the commit is known to succeed — so when a transaction rolls back, the database keeps the old value but the cache is left holding a phantom value that was never durably stored.\n\n```python\nstore.cache = new_value     # <-- written before we know the commit succeeds\nif commit:\n    store.db = new_value\n# rollback: db keeps old value, cache now holds a phantom\n```\n\nFix `apply_ops` so the cache can never serve a value the database did not commit. Return the value a fresh reader sees at the end (cache if present, else database). The invariant: a reader never observes an uncommitted value.",
    "context": "The written-answer version (cache-write-before-commit) also discusses dual-write races and TTL fallbacks. This runnable sibling isolates the ordering rule — source of truth commits first, cache after — which is deterministic and testable.",
    "constraints": "A committed op durably updates the database; a rolled-back op leaves the database unchanged. read() returns the cache when populated, otherwise the database. The correct value a reader sees must always equal the last committed database value. Commit the database before touching the cache; on rollback, do not modify the cache.",
    "starterCode": "class _Store:\n    def __init__(self, initial):\n        self.db = initial       # durable source of truth\n        self.cache = None       # None means empty; a read falls through to db\n\n    def read(self):\n        return self.cache if self.cache is not None else self.db\n\n\ndef apply_ops(initial, ops):\n    \"\"\"\n    initial: starting committed value in the database.\n    ops: list of [new_value, commit]. If commit is True the write commits durably;\n         if False the transaction rolls back and the database keeps its old value.\n    Return the value a fresh reader sees after all ops (cache if populated, else db).\n\n    A reader must never observe a value the database did not commit.\n    \"\"\"\n    store = _Store(initial)\n    for new_value, commit in ops:\n        # BUG: the cache is written before the commit is known to succeed.\n        store.cache = new_value\n        if commit:\n            store.db = new_value\n        # on rollback: db keeps the old value, but cache now holds a phantom value\n    return store.read()\n",
    "tests": [
      {
        "name": "rolled-back write must not linger in the cache",
        "input": "initial=1, ops=[[10,commit],[20,rollback]]",
        "expected": "10",
        "args": [
          1,
          [
            [
              10,
              true
            ],
            [
              20,
              false
            ]
          ]
        ],
        "expectedValue": 10
      },
      {
        "name": "single rollback leaves the original value",
        "input": "initial=5, ops=[[7,rollback]]",
        "expected": "5",
        "args": [
          5,
          [
            [
              7,
              false
            ]
          ]
        ],
        "expectedValue": 5,
        "hidden": true
      },
      {
        "name": "consecutive commits read the latest committed value",
        "input": "initial=0, ops=[[3,commit],[4,commit]]",
        "expected": "4",
        "args": [
          0,
          [
            [
              3,
              true
            ],
            [
              4,
              true
            ]
          ]
        ],
        "expectedValue": 4,
        "hidden": true
      },
      {
        "name": "commit then rollback reads the committed value",
        "input": "initial=1, ops=[[2,commit],[3,rollback]]",
        "expected": "2",
        "args": [
          1,
          [
            [
              2,
              true
            ],
            [
              3,
              false
            ]
          ]
        ],
        "expectedValue": 2,
        "hidden": true
      }
    ],
    "hints": [
      "The database is the source of truth. If the cache can hold a value the database never committed, a reader can observe data that does not exist.",
      "Reorder: only after a commit succeeds should you touch the cache. On rollback, leave the cache alone.",
      "The safe move after a committed write is to invalidate the cache (set it empty) so the next read falls through to the committed database value."
    ],
    "solutionOutline": "Flip the order: do nothing to the cache until the commit succeeds. On a committed op, update the database, then invalidate the cache (set it to empty) so the next read falls through to the freshly committed value — or write the committed value into the cache. On a rollback, touch neither the database nor the cache, so no phantom is ever cached. The reader then always observes the last committed value. Invalidate-after-commit is generally safer than write-after-commit because it avoids a second dual-write race, at the cost of one cache miss.",
    "fullSolution": "```python\nclass _Store:\n    def __init__(self, initial):\n        self.db = initial\n        self.cache = None\n\n    def read(self):\n        return self.cache if self.cache is not None else self.db\n\n\ndef apply_ops(initial, ops):\n    store = _Store(initial)\n    for new_value, commit in ops:\n        if commit:\n            store.db = new_value     # 1) commit the source of truth first\n            store.cache = None       # 2) then invalidate the cache\n        # rollback: touch nothing, so no phantom is ever cached\n    return store.read()\n```",
    "commonMistakes": [
      "Writing the cache before the commit, so a rollback leaves a value the database never stored.",
      "Updating the cache on rollback 'to be safe' — that is exactly what caches the phantom.",
      "Writing the new value into the cache after commit instead of invalidating, reopening a dual-write race under concurrency."
    ],
    "followUpQuestions": [
      "Why is invalidate-after-commit usually safer than write-after-commit under concurrent writers?",
      "Where does a TTL fit as a backstop if an invalidation is lost?",
      "How does this ordering rule generalize to publishing an event only after the transaction commits (the outbox pattern)?"
    ],
    "rubric": [
      {
        "criterion": "Commit-first ordering",
        "description": "The database commits before the cache is touched; rollback leaves the cache clean."
      },
      {
        "criterion": "No phantom reads",
        "description": "A reader always observes the last committed value."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "batch-merchant-enrichment",
    "title": "Enrich 40k Rows Without 40k API Calls (Runnable)",
    "type": "optimization",
    "difficulty": "medium",
    "topics": [
      "batching",
      "n-plus-one",
      "api-design",
      "python",
      "deduplication"
    ],
    "targetRoles": [
      "backend_swe",
      "fullstack_swe",
      "mid_level_swe"
    ],
    "companyStyles": [
      "startup",
      "big_tech"
    ],
    "estimatedMinutes": 20,
    "language": "python",
    "functionName": "enrich",
    "testHarnessType": "function_call",
    "supportedLanguages": [
      "python"
    ],
    "prompt": "This is the runnable companion to \"The Enrichment Loop Making 40,000 API Calls.\" A report enriches each transaction with merchant data from an internal service. The ids repeat heavily — thousands of transactions, only a handful of distinct merchants.\n\nThe `MerchantService` here enforces a small call budget: fetching one id per transaction blows it and raises. The starter does exactly that, so it fails as soon as the transaction count exceeds the budget.\n\n```python\nfor mid in merchant_ids:\n    out.append(service.get(mid))   # <-- one call per transaction; blows the budget\n```\n\nFix `enrich` to stay within the budget: dedupe to the distinct ids and fetch them with a single `service.get_batch(distinct_ids)` call. Return the list of merchant names, one per transaction, in order. The invariant this encodes: work should scale with distinct merchants, not with transactions.",
    "context": "The written-answer version (chatty-enrichment-loop) also covers bounded concurrency, batch-endpoint contracts, and neighborly rate discipline. This runnable sibling isolates the dedupe-and-batch move, made testable by a call budget the per-item approach cannot satisfy.",
    "constraints": "merchant_ids has one id per transaction (ids repeat). merchant_names is a list indexed by id (names[id] is the merchant name). The service allows only a few calls before raising, so a per-transaction fetch cannot pass; dedupe and issue a single batch call. Preserve output order: one name per transaction, in the original order.",
    "starterCode": "class MerchantService:\n    \"\"\"Internal merchant lookup with a small call budget. get() is one call;\n    get_batch() is also one call regardless of how many ids it fetches. Exceeding\n    the budget raises — the service team does not want to be your top caller.\"\"\"\n    def __init__(self, names, budget):\n        self._names = names\n        self._budget = budget\n        self.calls = 0\n\n    def _spend(self):\n        self.calls += 1\n        if self.calls > self._budget:\n            raise RuntimeError(\n                f\"merchant service call budget exceeded ({self.calls} > {self._budget})\"\n            )\n\n    def get(self, merchant_id):\n        self._spend()\n        return self._names[merchant_id]\n\n    def get_batch(self, ids):\n        self._spend()\n        return {i: self._names[i] for i in ids}\n\n\ndef enrich(merchant_ids, merchant_names):\n    \"\"\"\n    merchant_ids: one merchant id per transaction (ids repeat heavily).\n    merchant_names: list indexed by id -> merchant name.\n    Return the list of merchant NAMES, one per transaction, in order.\n\n    The MerchantService enforces a small call budget: fetching per transaction blows\n    it. Dedupe to the distinct ids and fetch them in a single batch call.\n    \"\"\"\n    service = MerchantService(merchant_names, budget=3)\n    out = []\n    for mid in merchant_ids:\n        # BUG: one call per transaction -> 40k transactions => 40k calls.\n        out.append(service.get(mid))\n    return out\n",
    "tests": [
      {
        "name": "eight transactions, three distinct merchants, one batch call",
        "input": "ids=[0,0,1,0,2,1,2,0], names=[A,B,C]",
        "expected": "[A, A, B, A, C, B, C, A]",
        "args": [
          [
            0,
            0,
            1,
            0,
            2,
            1,
            2,
            0
          ],
          [
            "A",
            "B",
            "C"
          ]
        ],
        "expectedValue": [
          "A",
          "A",
          "B",
          "A",
          "C",
          "B",
          "C",
          "A"
        ]
      },
      {
        "name": "ten transactions, five distinct merchants",
        "input": "ids=[0,1,2,3,4,0,1,2,3,4], names=[A,B,C,D,E]",
        "expected": "[A, B, C, D, E, A, B, C, D, E]",
        "args": [
          [
            0,
            1,
            2,
            3,
            4,
            0,
            1,
            2,
            3,
            4
          ],
          [
            "A",
            "B",
            "C",
            "D",
            "E"
          ]
        ],
        "expectedValue": [
          "A",
          "B",
          "C",
          "D",
          "E",
          "A",
          "B",
          "C",
          "D",
          "E"
        ],
        "hidden": true
      },
      {
        "name": "one merchant repeated many times",
        "input": "ids=[0,0,0,0,0], names=[Z]",
        "expected": "[Z, Z, Z, Z, Z]",
        "args": [
          [
            0,
            0,
            0,
            0,
            0
          ],
          [
            "Z"
          ]
        ],
        "expectedValue": [
          "Z",
          "Z",
          "Z",
          "Z",
          "Z"
        ],
        "hidden": true
      }
    ],
    "hints": [
      "The duplication factor is the whole problem: many transactions, few distinct ids. Fetch each distinct id once, not each transaction.",
      "Dedupe the ids (dict.fromkeys preserves order), call get_batch(distinct) once, then map each transaction back to its name.",
      "get_batch returns a dict id -> name; build the output by looking up each transaction's id in that dict."
    ],
    "solutionOutline": "Collect the distinct merchant ids (dict.fromkeys preserves first-seen order and dedupes), issue a single get_batch call for all of them, then build the per-transaction output by looking each id up in the returned map. This spends exactly one call regardless of transaction count, so it stays under the budget, and the work now scales with distinct merchants rather than transactions. Output order is preserved because the final list comprehension walks the original merchant_ids.",
    "fullSolution": "```python\nclass MerchantService:\n    def __init__(self, names, budget):\n        self._names = names\n        self._budget = budget\n        self.calls = 0\n\n    def _spend(self):\n        self.calls += 1\n        if self.calls > self._budget:\n            raise RuntimeError(\n                f\"merchant service call budget exceeded ({self.calls} > {self._budget})\"\n            )\n\n    def get(self, merchant_id):\n        self._spend()\n        return self._names[merchant_id]\n\n    def get_batch(self, ids):\n        self._spend()\n        return {i: self._names[i] for i in ids}\n\n\ndef enrich(merchant_ids, merchant_names):\n    service = MerchantService(merchant_names, budget=3)\n    distinct = list(dict.fromkeys(merchant_ids))   # dedupe, preserve order\n    fetched = service.get_batch(distinct)          # a single batch call\n    return [fetched[mid] for mid in merchant_ids]  # map back, in order\n```",
    "commonMistakes": [
      "Adding a per-id cache but still calling get() one id at a time on cache misses when a batch endpoint exists.",
      "Reaching for concurrency first — many parallel single calls is a self-inflicted DDoS, faster but ruder and still over budget.",
      "Losing output order by returning the deduped names instead of mapping each transaction back to its merchant."
    ],
    "followUpQuestions": [
      "The service has no batch endpoint. What is the next-best fix, and what rate discipline keeps you from hammering it?",
      "What should a batch endpoint's contract say about max ids per call, missing ids, and response shape (map vs array)?",
      "The merchant data changes rarely. How does a cross-run cache change the call count, and what does staleness cost the report?"
    ],
    "rubric": [
      {
        "criterion": "Dedupe + batch",
        "description": "Fetches distinct ids in a single batch call, staying within budget."
      },
      {
        "criterion": "Order preserved",
        "description": "Returns one name per transaction in the original order."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "dedup-redelivered-emails",
    "title": "One Email Per Message Under At-Least-Once Delivery (Runnable)",
    "type": "debugging",
    "difficulty": "medium",
    "topics": [
      "idempotency",
      "queues",
      "at-least-once",
      "python",
      "deduplication"
    ],
    "targetRoles": [
      "backend_swe",
      "mid_level_swe",
      "platform_engineer"
    ],
    "companyStyles": [
      "startup",
      "big_tech",
      "fintech"
    ],
    "estimatedMinutes": 20,
    "language": "python",
    "functionName": "send_emails",
    "testHarnessType": "function_call",
    "supportedLanguages": [
      "python"
    ],
    "prompt": "This is the runnable companion to \"The Queue Redelivery That Emails Customers Twice.\" The queue guarantees at-least-once delivery: when a worker does not ACK in time (a crash, a slow send), the message is redelivered. So the same message_id can arrive more than once.\n\nThe starter sends an email on every delivery, so a redelivered message emails the customer twice.\n\n```python\nfor message_id, recipient in deliveries:\n    service.send(message_id, recipient)   # <-- sends again on redelivery\n```\n\nFix `send_emails` so each message_id sends exactly one email, and return the sorted list of message_ids actually emailed. The invariant: at-least-once delivery plus an idempotent worker yields exactly-once effect.",
    "context": "The written-answer version (queue-redelivery-duplicate-emails) also covers the visibility-timeout window and where the dedup record must be written relative to the ACK. This runnable sibling isolates the idempotency check, which is deterministic and testable.",
    "constraints": "A redelivered message re-appears with the SAME message_id. Send exactly one email per distinct message_id, keeping the first delivery. Different messages to the same recipient are independent and must each send. Return the sorted list of emailed message_ids.",
    "starterCode": "class EmailService:\n    \"\"\"Records every email actually sent. It does not dedupe — the worker must.\"\"\"\n    def __init__(self):\n        self.sent = []\n\n    def send(self, message_id, recipient):\n        self.sent.append(message_id)\n\n\ndef send_emails(deliveries):\n    \"\"\"\n    deliveries: list of [message_id, recipient] events from an at-least-once queue.\n    A redelivered message re-appears with the SAME message_id. Send exactly one email\n    per message_id and return the sorted list of message_ids actually emailed.\n    \"\"\"\n    service = EmailService()\n    for message_id, recipient in deliveries:\n        # BUG: sends on every delivery, so a redelivered message emails twice.\n        service.send(message_id, recipient)\n    return sorted(service.sent)\n",
    "tests": [
      {
        "name": "a redelivered message must email only once",
        "input": "[[1,a],[2,b],[1,a]]",
        "expected": "[1, 2]",
        "args": [
          [
            [
              1,
              "a"
            ],
            [
              2,
              "b"
            ],
            [
              1,
              "a"
            ]
          ]
        ],
        "expectedValue": [
          1,
          2
        ]
      },
      {
        "name": "three redeliveries of one message = one email",
        "input": "[[5,x],[5,x],[5,x]]",
        "expected": "[5]",
        "args": [
          [
            [
              5,
              "x"
            ],
            [
              5,
              "x"
            ],
            [
              5,
              "x"
            ]
          ]
        ],
        "expectedValue": [
          5
        ],
        "hidden": true
      },
      {
        "name": "distinct messages all send",
        "input": "[[1,a],[2,b],[3,c]]",
        "expected": "[1, 2, 3]",
        "args": [
          [
            [
              1,
              "a"
            ],
            [
              2,
              "b"
            ],
            [
              3,
              "c"
            ]
          ]
        ],
        "expectedValue": [
          1,
          2,
          3
        ],
        "hidden": true
      },
      {
        "name": "no deliveries",
        "input": "[]",
        "expected": "[]",
        "args": [
          []
        ],
        "expectedValue": [],
        "hidden": true
      }
    ],
    "hints": [
      "At-least-once means the same message_id can arrive again. Sending on every delivery therefore double-sends.",
      "Keep a set of message_ids you have already processed; skip a delivery whose id you have seen.",
      "Dedupe on message_id, not recipient — two different messages to the same person must both send."
    ],
    "solutionOutline": "Keep a set of processed message_ids. For each delivery, if the id is already in the set, skip it (this is a redelivery of a message already handled); otherwise record the id and send the email. Because redeliveries reuse the message_id, each message sends exactly once, so the returned sorted list contains each id a single time. This is the idempotent-worker half of 'at-least-once delivery + idempotent worker = exactly-once effect.' In production the processed-set is a persistent table and the record must be written before the ACK, so a crash after sending still suppresses the redelivered duplicate.",
    "fullSolution": "```python\nclass EmailService:\n    def __init__(self):\n        self.sent = []\n\n    def send(self, message_id, recipient):\n        self.sent.append(message_id)\n\n\ndef send_emails(deliveries):\n    service = EmailService()\n    seen = set()                       # message_ids already processed\n    for message_id, recipient in deliveries:\n        if message_id in seen:\n            continue                   # redelivery of an already-sent message\n        seen.add(message_id)\n        service.send(message_id, recipient)\n    return sorted(service.sent)\n```",
    "commonMistakes": [
      "Deduping on recipient instead of message_id, dropping legitimate separate emails to the same person.",
      "Sending first and recording the id after — a crash in that window re-sends on redelivery in a real system.",
      "Assuming exactly-once delivery from the queue; at-least-once is the realistic guarantee and the worker must absorb duplicates."
    ],
    "followUpQuestions": [
      "In a real worker, should the dedup record be written before or after the ACK, and why does that ordering determine whether you can still double-send?",
      "How does the visibility timeout create the redelivery in the first place?",
      "How would you bound the size of the processed-id set over time (TTL, partition by day) without reintroducing duplicates?"
    ],
    "rubric": [
      {
        "criterion": "Idempotent send",
        "description": "Each message_id emails exactly once; redeliveries are suppressed."
      },
      {
        "criterion": "Correct dedup key",
        "description": "Dedupes on message_id, not recipient."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  }
]);
