import { defineProblems, DOCS_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const BACKEND_PATH = learningPathId("backend-swe");
const SYSTEM_PATH = learningPathId("system-design");
const HTTP = learningModuleId("http-request-lifecycle");
const QUEUES = learningModuleId("queues-workers");
const HTTP_CONCEPT = lessonId(HTTP, "http-request-lifecycle-concept");
const HTTP_WALKTHROUGH = lessonId(HTTP, "http-request-walkthrough");
const QUEUES_CONCEPT = lessonId(QUEUES, "queues-workers-delivery-contract");

/**
 * Batch 9 of the curriculum plan: http-request-lifecycle and queues-workers.
 * Written-answer problems covering request tracing, timeouts, retries,
 * delivery guarantees, and dead-letter queue diagnosis.
 */
export const httpQueuesFoundationProblems = defineProblems([
  // ── http-request-lifecycle core ───────────────────────────────────────────

  {
    slug: "http-timeout-three-layers",
    title: "Which Timeout Fired? Diagnose Three Layers",
    type: "debugging",
    difficulty: "medium",
    topics: ["http", "timeouts", "connect-timeout", "read-timeout", "backend"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 25,
    pathIds: [BACKEND_PATH],
    moduleIds: [HTTP],
    lessonIds: [HTTP_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "A payments service calls an external provider over HTTPS. On Tuesday the on-call dashboard shows three distinct failure signatures, all logged as `TimeoutError`, but they have different latency histograms. Here are the three cases:\n\n**Case A** — connection timeout:\n```\n[ERROR] TimeoutError after 200ms\n  at socket.connect (net.js)\n  at TLSSocket._init\nlatency_histogram_ms: { p50: 200, p99: 201 }\n```\n\n**Case B** — read (response) timeout:\n```\n[ERROR] TimeoutError after 30000ms\n  at IncomingMessage.emit\nlatency_histogram_ms: { p50: 29980, p99: 30010 }\n```\n\n**Case C** — request queued behind slow pool connections:\n```\n[ERROR] TimeoutError after 5000ms\n  at ConnectionPool.acquire\nlatency_histogram_ms: { p50: 4990, p99: 5005 }\n```\n\nFor each case: (1) name the specific timeout that fired, (2) explain what was happening in the network during the latency, (3) give the configuration option that controls it in a typical HTTP client library. Then answer: if you could set only one timeout value when configuring a new HTTP client, which timeout is most dangerous to omit and why?",
    constraints:
      "Name the timeout by type (connect, read/response, pool-acquisition). For case C, explain why the error fires without any network call succeeding. For the 'most dangerous to omit' question, justify using the failure mode and blast radius, not just the name.",
    hints: [
      "A connect timeout fires if the TCP handshake (or TLS on top) does not complete within the deadline — the provider's IP may be unreachable.",
      "A read timeout fires after the connection is established but the server takes too long to send the first (or next) byte of the response.",
      "A pool timeout fires while waiting for a free connection slot — the network may be fine, but all connections are occupied by slow requests.",
    ],
    solutionOutline:
      "Case A — connect timeout fired. During the 200 ms, the TCP SYN was in flight (or the TLS handshake was running) and the remote end never completed the three-way handshake. Causes: host unreachable, firewall dropping packets, provider IP change. Configured as: `connectTimeout`, `connectionTimeout`, or `timeout.connect` depending on the library (e.g., `axios: {timeout: 200}` covers connect in some versions; in others a separate `socket.setTimeout` is used; in Go `&http.Client{Timeout: ...}` covers the full request but `net.Dialer{Timeout}` covers connect specifically).\n\nCase B — read (response) timeout fired. The connection was established; the provider accepted the request but took 30 seconds before sending a response body — processing overload, deadlock, or a hang. Configured as: `readTimeout`, `responseTimeout`, `socket.setTimeout`, or `timeout.response`.\n\nCase C — pool acquisition timeout fired. All pool connections are busy with slow requests (likely case B happening at scale); no network call began. Configured as: `poolTimeout`, `acquireTimeout`, or `maxWait` on the pool. This fires entirely inside the client process.\n\nMost dangerous to omit: the read/response timeout. Without it, a thread (or coroutine) waits indefinitely for a server that is stuck. Each occupied connection holds a pool slot; once all slots are occupied, every subsequent request queues then times out (case C) — a provider slowdown becomes a full service outage. Connect timeouts, by contrast, fire quickly (usually < 1 s) because the TCP handshake either completes or fails fast. Omitting the read timeout lets slow-provider failures compound silently into resource exhaustion.",
    commonMistakes: [
      "Treating all three as 'network errors' — case C never touches the network; it is a client-side resource contention problem.",
      "Setting only a global request timeout and assuming it covers all three cases — some libraries only apply it to the connect phase.",
      "Answering 'the connect timeout is most dangerous' because 'it fires first' — reads can hang minutes or hours; connects fail in seconds.",
    ],
    followUpQuestions: [
      "How does a circuit breaker complement timeouts, and at what failure rate would you open the circuit on the payments provider?",
      "If the provider imposes its own 60-second server-side timeout, what happens to a client with a 30-second read timeout? With a 120-second read timeout?",
    ],
    rubric: [
      { criterion: "Three cases correctly diagnosed", description: "Names connect, read/response, and pool-acquisition timeouts with the network activity (or absence) during each." },
      { criterion: "Most-dangerous rationale", description: "Names read/response timeout with the resource-exhaustion cascade as the reason, not just reciting the name." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.rfc-editor.org/rfc/rfc9110",
      "https://nodejs.org/api/http.html#httprequestoptions-callback",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "http-retry-safety-analysis",
    title: "Which Requests Are Safe to Retry?",
    type: "read_code",
    difficulty: "medium",
    topics: ["http", "idempotency", "safety", "retries", "http-methods"],
    targetRoles: ["backend_swe", "mid_level_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 22,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [HTTP],
    lessonIds: [HTTP_CONCEPT],
    confidenceLevel: "core",
    prompt:
      "A services team added this blanket retry wrapper to their HTTP client library:\n\n```python\ndef request_with_retry(method, url, **kw):\n    for attempt in range(3):\n        try:\n            resp = http.request(method, url, timeout=2, **kw)\n            if resp.status < 500:\n                return resp\n        except TimeoutError:\n            pass                       # retry on timeout — for ANY method\n        time.sleep(2 ** attempt)\n    raise RetryExhausted(url)\n```\n\nThe wrapper retries every request the same way — including on a timeout, where the client does not know whether the server already processed the request. Read the wrapper, then for each call below state: (a) whether it is safe to retry through this wrapper without coordination, (b) the HTTP property that determines this (safe, idempotent, or neither), and (c) the worst-case outcome if the server already processed the original but the client timed out and retried.\n\n1. `request_with_retry('GET', '/users/42')` — fetch user profile\n2. `request_with_retry('DELETE', '/sessions/abc123')` — log out a session\n3. `request_with_retry('PUT', '/users/42', json=full_user)` — replace user record\n4. `request_with_retry('POST', '/payments', json={'amount': 100})` — charge $100 to a card\n5. `request_with_retry('POST', '/payments', json={'amount': 100}, headers={'Idempotency-Key': 'req-9f2k-a3b1'})` — charge with a client key\n6. `request_with_retry('PATCH', '/counters/page-views')` where the server adds 1 to the count",
    constraints:
      "Use the HTTP standard definitions: safe = no server-side state change; idempotent = same effect no matter how many times applied. For requests 4 and 5, explain what mechanism changes the retry safety of 5, and what the server must store to honor it.",
    hints: [
      "Safe implies idempotent; idempotent does not imply safe (DELETE is idempotent but not safe).",
      "An idempotency key makes a non-idempotent operation idempotent by associating the client's request ID with the server's stored result.",
      "PATCH with relative changes (add 1) is not idempotent; PATCH with absolute values can be.",
    ],
    solutionOutline:
      "1. GET /users/42 — safe to retry, always. GET is defined as safe (no state change) and idempotent. Worst case on duplicate: two identical reads; no harm. 2. DELETE /sessions/abc123 — safe to retry. DELETE is idempotent: the first call removes the session; subsequent calls find it already gone and return 404 or 204 — no double-effect. Worst case: the 404 might confuse a poorly written caller that does not treat 404 as 'already done'. 3. PUT /users/42 (full replacement) — safe to retry. PUT is idempotent by definition: replacing with the same full body produces the same state. Worst case: a lost update if another writer changed the record between the original and the retry; use ETags / conditional PUT to guard. 4. POST /payments (no idempotency key) — NOT safe to retry without coordination. POST is neither safe nor idempotent. Worst case: double charge of $100. The client must either detect and de-duplicate server-side or accept at-most-once semantics with no retry. 5. POST /payments with Idempotency-Key — safe to retry after implementing server-side key storage. The server stores `{key: 'req-9f2k-a3b1', result: {charge_id, amount, status}}` atomically with the charge. On retry, it looks up the key and returns the stored result without re-executing. The server must store keys durably for at least the client's maximum retry window. 6. PATCH /counters/page-views (add-1) — NOT safe to retry. Each retry adds another 1; the operation is not idempotent. Worst case: count inflated by the number of retries. An idempotency key would help if the server can store 'this logical request already added 1', but relative mutations are harder to de-duplicate than absolute writes.",
    commonMistakes: [
      "Saying DELETE is safe (as in no-side-effect) — DELETE does change state (removes the resource); it is idempotent but not safe.",
      "Assuming POST with an idempotency key is automatically safe without server-side key storage — the key is meaningless unless the server records it alongside the result.",
      "Treating PUT as always safe to retry without mentioning the lost-update risk if another writer changed the resource.",
    ],
    followUpQuestions: [
      "How long should a server retain idempotency keys, and what happens if a client retries after the retention window expires?",
      "Under what conditions is a GET request NOT safe to retry? (Hint: think about side effects triggered by observation.)",
    ],
    rubric: [
      { criterion: "Safe vs idempotent distinction", description: "Correctly applies HTTP standard definitions to all six requests, including the safe→idempotent implication." },
      { criterion: "Idempotency key mechanism", description: "Explains server-side key storage requirement for request 5 and contrasts with request 4." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.rfc-editor.org/rfc/rfc9110#section-9.2",
      "https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── http-request-lifecycle challenge ──────────────────────────────────────

  {
    slug: "http-latency-waterfall-diagnosis",
    title: "Eight Seconds to the First Byte: Read the Waterfall",
    type: "debugging",
    difficulty: "hard",
    topics: ["http", "latency", "dns", "tls", "ttfb", "profiling", "performance"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 35,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [HTTP],
    lessonIds: [HTTP_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "An SRE reports that the checkout page p99 load time jumped from 400 ms to 8.2 s after a deployment. Using the browser DevTools waterfall for one representative slow request to `POST /checkout` (routed through Nginx → Node.js app → PostgreSQL), find the bottleneck and prescribe the fix:\n\n```\nPhase                  Duration\n────────────────────────────────\nDNS lookup             4 ms       (was 3 ms, unchanged)\nInitial connection     18 ms      (TCP handshake, unchanged)\nSSL                    32 ms      (TLS 1.3, unchanged)\nRequest sent           2 ms       (headers + body upload)\nWaiting (TTFB)         8 100 ms   ← !! (was 280 ms)\nContent download       11 ms\n────────────────────────────────\nTotal                  8 167 ms\n```\n\nAdditional context from Nginx access log:\n```\n127.0.0.1 - POST /checkout HTTP/1.1 8154ms upstream_response_time=8.150\n```\n\nNode.js app debug log (added after the spike was noticed):\n```\n[DEBUG] checkout handler entered\n[DEBUG] inventory check started\n[DEBUG] inventory check completed   elapsed=12ms\n[DEBUG] payment charge started\n[DEBUG] payment charge completed    elapsed=45ms\n[DEBUG] order INSERT started\n[DEBUG] order INSERT completed      elapsed=7905ms  ← !!\n[DEBUG] response sent\n```\n\nPostgreSQL slow query log (1-minute window during incident):\n```\nprocess 83714  acquired lock on relation \"orders\" after 7893.451 ms\n```\n\nThe deployment that preceded the spike added a background migration script to backfill a new column on the `orders` table.\n\nAnswer: (1) identify the bottleneck and the causal chain from deployment to TTFB spike, (2) explain why the DNS/TLS phases are innocent bystanders here, (3) propose the immediate mitigation and the correct long-term fix for running table migrations safely.",
    constraints:
      "Trace the causal chain: deployment → migration script action → lock type → INSERT behaviour → TTFB. For the mitigation, give a specific PostgreSQL command. For the long-term fix, describe the technique by name and explain why it avoids the lock.",
    hints: [
      "PostgreSQL's ALTER TABLE ... ADD COLUMN without a DEFAULT acquires an ACCESS EXCLUSIVE lock that blocks all reads and writes until it completes.",
      "The TTFB equals the Nginx upstream_response_time, which equals the app handler time, which equals the INSERT duration — the bottleneck is inside the database.",
      "Adding a column with a volatile DEFAULT (backfilling every row) takes a table-rewrite lock held for minutes on large tables.",
    ],
    solutionOutline:
      "Causal chain: The migration added a column with a DEFAULT value that required PostgreSQL to rewrite the entire `orders` table, holding an ACCESS EXCLUSIVE lock for ~8 seconds. Any transaction needing the table (including `INSERT INTO orders`) was queued behind the lock. The checkout handler's INSERT waited ~7.9 s for the lock to release, which maps directly to the TTFB spike (Nginx upstream_response_time = app handler time = INSERT wait time).\n\nWhy DNS/TLS are innocent: their durations (4, 18, 32 ms) are unchanged from baseline. The waterfall shows they completed in ~54 ms before the TTFB phase — entirely consistent with a network path that is fine. The bottleneck is inside the database transaction, not in the network.\n\nImmediate mitigation: terminate the migration session if it is still running: `SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%ALTER TABLE%'`. If the migration has completed, the lock is already released and the spike has self-resolved.\n\nLong-term fix — use a non-blocking column addition:\n1. `ALTER TABLE orders ADD COLUMN new_field text` (no DEFAULT) — PostgreSQL can add a nullable column with no default without rewriting the table (adds a null bitmap entry); the lock is held for milliseconds.\n2. Backfill in batches: `UPDATE orders SET new_field = value WHERE id BETWEEN 1 AND 10000` — each batch holds a row-level lock for a short time, avoiding table-wide lock.\n3. After backfill: `ALTER TABLE orders ALTER COLUMN new_field SET DEFAULT value` — sets the server-side default for future inserts without a table rewrite.\n4. Optionally: `ALTER TABLE orders ALTER COLUMN new_field SET NOT NULL` using a constraint with `NOT VALID` and a separate `VALIDATE CONSTRAINT` that uses a weaker lock.\n\nThis technique is called a zero-downtime (or online) schema migration.",
    commonMistakes: [
      "Blaming the TLS phase because 'TLS is slow' — the waterfall shows 32 ms for TLS, identical to baseline; the TTFB is 8 s, which TLS cannot cause.",
      "Proposing to increase the Nginx upstream timeout as a fix — this hides the symptom and would cause the spike to last until the migration finishes rather than returning an error.",
      "Missing that 'ALTER TABLE ... ADD COLUMN new_field text DEFAULT compute_value(other_col)' with a volatile default triggers a full table rewrite; a static default was made safe in PostgreSQL 11+.",
    ],
    followUpQuestions: [
      "How would you use `pg_stat_activity` and `pg_locks` to diagnose this lock contention in real time during the incident?",
      "What does the expand-then-contract pattern mean for a column rename migration, and why is renaming a column even more dangerous than adding one?",
    ],
    rubric: [
      { criterion: "Causal chain", description: "Traces deployment → migration lock type → INSERT queue → TTFB spike without skipping steps." },
      { criterion: "DNS/TLS exoneration", description: "Uses waterfall phase durations as evidence that network layers are unchanged." },
      { criterion: "Non-blocking migration technique", description: "Describes three-step add-then-backfill-then-default pattern, naming it an online or zero-downtime migration." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.postgresql.org/docs/current/sql-altertable.html",
      "https://www.postgresql.org/docs/current/explicit-locking.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── queues-workers warmups ─────────────────────────────────────────────────

  {
    slug: "queue-delivery-guarantee-classify",
    title: "Classify Four Queue Configurations by Delivery Guarantee",
    type: "read_code",
    difficulty: "easy",
    topics: ["queues", "delivery-guarantees", "at-least-once", "at-most-once", "idempotency"],
    targetRoles: ["backend_swe", "mid_level_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 15,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [QUEUES],
    lessonIds: [QUEUES_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "Read the four consumer implementations below. For each, classify the delivery guarantee as **at-most-once**, **at-least-once**, or **effectively-exactly-once** (at-least-once delivery + idempotent consumer), and explain the mechanism — trace what happens to a message if the worker crashes at the worst possible moment.\n\n**Config A — fire-and-forget UDP notification:**\n```python\ndef notify(event):\n    sock.sendto(event.encode(), (LOG_HOST, 514))  # UDP: no ACK, no retry, no persistence\n    # returns immediately; datagram may be dropped anywhere on the path\n```\n\n**Config B — SQS standard queue, visibility timeout 30 s:**\n```python\nwhile True:\n    msg = sqs.receive_message(QueueUrl=q, VisibilityTimeout=30)\n    if not msg: continue\n    process(msg)                       # <-- if the worker crashes HERE...\n    sqs.delete_message(msg.receipt)    # ...delete never runs; msg reappears after 30s\n```\n\n**Config C — SQS + idempotency key in worker:**\n```python\nwhile True:\n    msg = sqs.receive_message(QueueUrl=q, VisibilityTimeout=30)\n    if not msg: continue\n    if db.exists(\"processed\", msg.id):     # already handled on a prior delivery?\n        sqs.delete_message(msg.receipt); continue\n    with db.transaction():\n        process(msg)\n        db.insert(\"processed\", msg.id)     # effect + marker committed atomically\n    sqs.delete_message(msg.receipt)\n```\n\n**Config D — Kafka consumer, auto-commit offsets every 5 s:**\n```python\nconsumer = KafkaConsumer(topic, enable_auto_commit=True, auto_commit_interval_ms=5000)\nfor batch in consumer:\n    process(batch)   # offset auto-commits on a 5s timer, independent of processing\n                     # crash at second 4 after processing => resumes from last commit => reprocess\n```",
    constraints:
      "Use exactly one of: at-most-once, at-least-once, effectively-exactly-once. Explain the failure scenario that determines the guarantee: what happens to a message if the worker crashes at the worst possible moment?",
    hints: [
      "At-most-once: a message may be lost but will never be processed twice.",
      "At-least-once: a message will be processed at least once but may be processed more than once on crash/retry.",
      "Exactly-once requires transactional coordination between the queue and the consumer's output; most systems achieve 'effectively exactly-once' by combining at-least-once delivery with idempotent processing.",
    ],
    solutionOutline:
      "Config A — **at-most-once**. UDP has no acknowledgment; if the datagram is lost in transit or the aggregator is down, the message is silently dropped. No retry, no persistence. Worst-case crash: message never delivered.\n\nConfig B — **at-least-once**. The worker commits (deletes) only after processing. If the worker crashes between processing and deleting the message, the message reappears after 30 s and will be processed again by the same or another worker. Worst-case: double processing of the same job. At-least-once means the job runs ≥ 1 time.\n\nConfig C — **effectively-exactly-once**. The worker adds idempotency on top of at-least-once delivery. On redelivery, the database check finds the message ID already recorded and skips processing. The output from the job appears exactly once even though the message may be delivered more than once. This requires the ID-record and the job's side effects to be atomic (or the ID-check to happen before any non-idempotent effect).\n\nConfig D — **at-most-once**. Auto-commit at a 5-second interval means the offset may be committed before all messages in the batch are processed. If the consumer crashes at second 4 (offset committed at second 0), the committed offset includes messages processed in seconds 0–5 — actually wait: if the commit happens at t=5 and the crash happens at t=4, the last commit was at t=0, so messages processed at t=1–4 will be reprocessed. This is actually at-least-once. But if auto-commit fires before crash: if the commit fires at t=5 and the consumer had processed messages up to position N but crashes before calling its own downstream handler, offsets for N+1...N+k are committed (because auto-commit committed the batch offset) and those messages are permanently skipped. **Correction**: with auto-commit, the consumer's offset advances independent of whether processing succeeded — if crash happens after commit but before the consumer's side effect, messages are lost → at-most-once for those records. The guarantee is at-most-once for the 5-second window of messages whose offsets auto-committed before the crash completed their processing.",
    commonMistakes: [
      "Calling Config B 'exactly-once' — without idempotency on the consumer side, the duplicate delivery creates a duplicate side effect.",
      "Calling Config D 'at-least-once' without qualification — auto-commit moves the offset regardless of processing success, so messages whose offsets commit before their handlers complete will be lost.",
      "Saying Config C achieves true exactly-once — the idempotency check and the job's side effects must be atomic; if they are not, a crash between the check and the write still allows a duplicate effect.",
    ],
    followUpQuestions: [
      "Kafka offers `enable.auto.commit=false` — how does manual offset commit change Config D's guarantee?",
      "What does transactional Kafka (Kafka Transactions API) add beyond Config C's idempotency check, and when is the extra cost worth it?",
    ],
    rubric: [
      { criterion: "Correct classification", description: "All four configurations are labeled correctly with the mechanism and the worst-case crash scenario." },
      { criterion: "Exactly-once nuance", description: "Distinguishes at-least-once + idempotent consumer from true transactional exactly-once." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html",
      "https://kafka.apache.org/documentation/#semantics",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "dlq-stuck-message-diagnosis",
    title: "Why Is This Message Stuck in the Dead-Letter Queue?",
    type: "debugging",
    difficulty: "easy",
    topics: ["queues", "dead-letter-queue", "workers", "message-processing", "retries"],
    targetRoles: ["backend_swe", "mid_level_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 15,
    pathIds: [BACKEND_PATH],
    moduleIds: [QUEUES],
    lessonIds: [QUEUES_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "A payment-notification queue has a DLQ (dead-letter queue) with a maxReceiveCount of 5. A message has appeared in the DLQ. The worker logs show:\n\n```\n[ATTEMPT 1] message_id=msg-7f3d processing order_id=ORD-9918\n[ATTEMPT 1] FAILED: JSONDecodeError: Expecting value at line 1 col 1\n[ATTEMPT 2] message_id=msg-7f3d processing order_id=ORD-9918\n[ATTEMPT 2] FAILED: JSONDecodeError: Expecting value at line 1 col 1\n[ATTEMPT 3] message_id=msg-7f3d processing order_id=ORD-9918\n[ATTEMPT 3] FAILED: JSONDecodeError: Expecting value at line 1 col 1\n[ATTEMPT 4] message_id=msg-7f3d processing order_id=ORD-9918\n[ATTEMPT 4] FAILED: JSONDecodeError: Expecting value at line 1 col 1\n[ATTEMPT 5] message_id=msg-7f3d processing order_id=ORD-9918\n[ATTEMPT 5] FAILED: JSONDecodeError: Expecting value at line 1 col 1\n```\n\nFor each of the following questions, give a specific answer based on the evidence:\n1. Why did the message end up in the DLQ, and is the root cause transient or permanent?\n2. What is wrong with the current worker's retry strategy for this class of error?\n3. How would you handle this message, and what should the monitoring alert on to catch similar issues earlier?\n4. Who placed the malformed message in the queue, and where should the real fix be applied?",
    constraints:
      "For question 2, name the failure class (transient vs permanent) and explain why exponential backoff does not help here. For question 3, describe both the immediate action and an architectural change. For question 4, reason from the error — the worker could parse some fields (order_id) but failed on JSON decode.",
    hints: [
      "JSONDecodeError on col 1 means the entire message body is not valid JSON — not a missing field, but an encoding or serialization error.",
      "Retrying a message with a permanent structural defect will fail identically every time — no amount of waiting changes a malformed payload.",
      "The message's order_id was logged, suggesting the worker reads some metadata before attempting JSON decode of the body.",
    ],
    solutionOutline:
      "1. Root cause: the message body is malformed JSON (JSONDecodeError at column 1 means the body starts with something other than `{`, `[`, `\"`, or a number — possibly empty string, raw bytes, XML, or truncated data). The error is **permanent**: the message content cannot change between retries; every attempt will fail identically. It ended up in the DLQ after exhausting maxReceiveCount=5 retries.\n\n2. The retry strategy is wrong for this class of error. Exponential backoff and retries are appropriate for **transient** failures (network timeouts, temporary unavailability). A malformed payload is a **permanent** failure — the fifth retry is as guaranteed to fail as the first. Each retry consumes a receive-count and delays detection. The correct behaviour for a deserialization error is to move the message to the DLQ immediately without retrying, or to catch the specific exception and call `delete_message` after logging the dead letter manually.\n\n3. Immediate action: inspect the DLQ message body (`aws sqs receive-message --queue-url <dlq-url>`) to see the raw content, then manually requeue a corrected version if the data is recoverable. Architectural change: the worker should catch `JSONDecodeError` (and similar permanent schema errors) specifically, log the full raw body, increment a metric `queue.permanent_failures`, and call delete (or move-to-dlq) without consuming the maxReceiveCount — this preserves DLQ bandwidth for genuinely transient failures. Alert on: DLQ depth > 0 for more than 5 minutes, and the `queue.permanent_failures` counter.\n\n4. The producer (publisher) placed a malformed message. The worker successfully extracted `order_id` from metadata (likely from an SQS message attribute or envelope), so the envelope is intact but the body payload is broken. The real fix is in the producer: add serialization tests that verify the published JSON round-trips cleanly before enqueuing. A schema validator on the consumer side (reject at the boundary with immediate DLQ) adds defense in depth.",
    commonMistakes: [
      "Recommending increasing maxReceiveCount — this delays DLQ routing but does not fix a permanent error; each additional attempt is wasted work.",
      "Saying 'add retry with exponential backoff' — this is correct for transient errors; it is harmful for permanent parse errors because it delays detection and wastes visibility timeouts.",
      "Not identifying the producer as the fix site — consumers are the wrong place to fix malformed messages; the data must be correct at publication.",
    ],
    followUpQuestions: [
      "How would you design a schema registry or message contract validation so the producer cannot publish malformed payloads at all?",
      "If the DLQ holds 10,000 messages from a past incident, how do you replay them after fixing the producer, and how do you avoid processing them twice?",
    ],
    rubric: [
      { criterion: "Permanent vs transient classification", description: "Identifies JSONDecodeError as a permanent structural failure and explains why retrying is futile." },
      { criterion: "Immediate + architectural fix", description: "Suggests inspecting the raw body for immediate recovery, and distinguishes permanent-error handling from transient retry logic." },
      { criterion: "Producer fix", description: "Traces the defect to the publisher and recommends fixing at the source." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
]);
