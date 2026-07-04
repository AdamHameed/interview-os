import { defineProblems, DOCS_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const BACKEND_PATH = learningPathId("backend-swe");
const SYSTEM_PATH = learningPathId("system-design");
const SQL_INDEXES = learningModuleId("sql-indexes");
const TXN_ISOLATION = learningModuleId("transactions-isolation");
const BTREE_LESSON = lessonId(SQL_INDEXES, "btree-index-mental-model");
const EXPLAIN_LESSON = lessonId(SQL_INDEXES, "reading-explain-before-indexing");
const ANOMALIES_LESSON = lessonId(TXN_ISOLATION, "isolation-levels-anomalies");
const LOST_UPDATE_LESSON = lessonId(TXN_ISOLATION, "lost-update-walkthrough");

/**
 * Batch 2 of the curriculum plan: sql-indexes and transactions-isolation.
 * Written-answer problems judged via self-review and Codex export.
 */
export const databasesFoundationProblems = defineProblems([
  {
    slug: "pick-index-for-login-lookup",
    title: "Pick the Index for a Login Lookup",
    type: "databases",
    difficulty: "easy",
    topics: ["indexes", "b-tree", "selectivity"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 12,
    pathIds: [BACKEND_PATH],
    moduleIds: [SQL_INDEXES],
    lessonIds: [BTREE_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "Every login runs `SELECT id, password_hash FROM users WHERE email = $1` against a users table with 4 million rows and no index besides the primary key on id. Logins take 900 ms and the database shows the query reading the whole table each time. State what access path the database is using now, which single index you would create, and why that index makes this query fast. Then answer the follow-on: a teammate proposes also indexing first_name, last_name, and created_at \"while we're at it\" — what do you tell them?",
    constraints:
      "Assume standard B-tree indexes. Your answer should mention the access path before and after, why email is highly selective, and the cost new indexes impose on writes.",
    hints: [
      "With no index on email, the only way to find matching rows is to read all of them.",
      "One equality predicate on a nearly unique column is the best case for a B-tree.",
    ],
    solutionOutline:
      "Currently a sequential scan reads all 4M rows per login. `CREATE UNIQUE INDEX users_email_key ON users (email)` lets the database descend a shallow B-tree to the single matching entry and fetch one row: a handful of page reads instead of the whole table. Email is effectively unique, so selectivity is ideal, and a unique index also enforces the business rule. The teammate's extra indexes serve no known query: each would slow every insert and update and consume cache while returning nothing until a real query shape needs them — index the workload, not the schema.",
    commonMistakes: [
      "Recommending a composite index like (email, password_hash) without explaining what it changes; a plain unique email index already reduces this to one row fetch.",
      "Not flagging that speculative indexes tax every write on a hot table.",
    ],
    followUpQuestions: [
      "Logins actually compare `lower(email)` — what happens to your index, and how do you fix it?",
      "Why might the unique index also be the right place to enforce the no-duplicate-accounts rule rather than application code?",
    ],
    rubric: [
      { criterion: "Access-path reasoning", description: "Names the sequential scan, the B-tree lookup that replaces it, and why selectivity makes the index effective." },
      { criterion: "Write-cost judgment", description: "Rejects the speculative indexes with a concrete cost argument, not just a rule of thumb." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/indexes-intro.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "wildcard-search-no-index",
    title: "The Index That a Wildcard Ignores",
    type: "databases",
    difficulty: "easy",
    topics: ["indexes", "b-tree", "pattern-matching"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 15,
    pathIds: [BACKEND_PATH],
    moduleIds: [SQL_INDEXES],
    lessonIds: [BTREE_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A support tool searches customers with `SELECT * FROM customers WHERE name LIKE '%son'` to find names ending in \"son\". After complaints about 30-second searches, a developer added `CREATE INDEX customers_name_idx ON customers (name)` — and nothing improved: the plan still scans the whole table. Explain precisely why a B-tree index on name cannot serve a leading-wildcard pattern, and describe two realistic ways to make suffix search fast, noting one tradeoff for each.",
    constraints:
      "The explanation must reference what B-tree order can and cannot do — 'the planner is bad at LIKE' is not an answer. Candidate fixes may include storing a reversed name with a prefix search, trigram indexing, or a full-text/search-engine approach.",
    hints: [
      "A B-tree can find every name starting with 'Ander' because they sort together. Where do names ending in 'son' sit in sorted order?",
      "If you reverse every name, a suffix of the original becomes a prefix of the reversed value.",
    ],
    solutionOutline:
      "B-tree entries are sorted by leading characters, so all names beginning 'Ander%' are contiguous and findable; names ending '%son' are scattered across the entire sort order, leaving no subrange to scan — the index cannot narrow anything, so the planner correctly scans the table. Fix 1: store or index `reverse(name)` (an expression index) and query `reverse(name) LIKE 'nos%'`; cheap and exact, but every suffix query must remember the rewrite. Fix 2: a trigram index (e.g., PostgreSQL pg_trgm GIN) serves arbitrary substring patterns; more flexible, but the index is larger and writes cost more. At larger scale, a dedicated text-search system handles fuzzy matching but adds an eventually consistent second store.",
    commonMistakes: [
      "Blaming statistics or planner settings when the access pattern is fundamentally unindexable by a plain B-tree.",
      "Proposing 'add an index with the column reversed' without explaining that the query must also be rewritten to a prefix form.",
    ],
    followUpQuestions: [
      "Why does `LIKE 'Ander%'` use the plain index in some databases only with a specific operator class or collation?",
      "When would you reject the trigram approach even though it answers the query?",
    ],
    rubric: [
      { criterion: "Order-based explanation", description: "Explains index unusability via sort order and scattering, not planner folklore." },
      { criterion: "Practical alternatives", description: "Gives two workable suffix-search designs with an honest tradeoff each." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/indexes-types.html", "https://www.postgresql.org/docs/current/pgtrgm.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "order-status-page-crawl",
    title: "The Pending-Orders Page That Crawls",
    type: "optimization",
    difficulty: "medium",
    topics: ["indexes", "selectivity", "partial-index", "query-plans"],
    targetRoles: ["backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 25,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [SQL_INDEXES],
    lessonIds: [EXPLAIN_LESSON],
    confidenceLevel: "core",
    prompt:
      "An operations dashboard runs `SELECT id, customer_id, created_at FROM orders WHERE status = 'pending' ORDER BY created_at LIMIT 50` on a 60M-row orders table. Orders are 97% 'completed', 2.9% 'cancelled', and about 0.1% 'pending' at any moment, but completed rows are never purged. There is already an index on (status). The query takes 4 seconds; the plan shows the index matching ~60,000 'pending' entries, fetching all their rows, sorting them by created_at, and keeping 50. Design the index change that makes this query cheap, explain what the new plan looks like, and quantify roughly why it wins.",
    context:
      "Current plan, abridged:\n\n```\nLimit (rows=50)\n  -> Sort (rows=61,204) key: created_at\n       -> Bitmap Heap Scan on orders (rows=61,204)\n            -> Bitmap Index Scan on orders_status_idx (rows=61,204)\n```",
    constraints:
      "Behavior must be identical: same 50 rows, same order. The table is insert-heavy, so avoid adding more total index maintenance than necessary — consider replacing the existing status index rather than stacking a new one beside it. State the plan shape you expect after the change.",
    hints: [
      "The sort of 61k rows exists because the index provides matching rows but not the requested order.",
      "Only one narrow slice of status values is ever queried this way — an index does not have to cover every row of the table.",
    ],
    solutionOutline:
      "Create a partial composite index: `CREATE INDEX orders_pending_created ON orders (created_at) WHERE status = 'pending'` (or a full composite (status, created_at) if other statuses are also queried ordered). The partial index contains only ~60k entries already sorted by created_at, so the plan becomes an index scan that emits rows in order and stops after 50 — no bitmap heap scan of 61k rows and no sort node. That replaces work proportional to the pending set with work proportional to the LIMIT. The old single-column status index can then be dropped if nothing else uses it, keeping net write amplification flat: completed-row churn never touches the partial index at all. Verify with EXPLAIN ANALYZE that the sort node is gone and rows examined ≈ 50.",
    commonMistakes: [
      "Adding (status, created_at) on all 60M rows and keeping the old status index too, doubling write cost when a partial index covering 0.1% of rows suffices.",
      "Proposing an index on created_at alone — the scan then walks global time order filtering for rare pending rows, which can read far more than 50 entries.",
      "Not stating the expected post-change plan, which is the actual check that the reasoning is right.",
    ],
    followUpQuestions: [
      "The dashboard adds a second tab for 'cancelled' orders with the same shape — does your partial index still work, and what would you change?",
      "Why might the planner still choose a sequential scan right after you create the index, and what do you run to fix that?",
    ],
    rubric: [
      { criterion: "Plan diagnosis", description: "Identifies the row-fetch plus sort of the whole pending set as the cost, not the index scan itself." },
      { criterion: "Index design", description: "Chooses a partial or composite index that serves filter and order together and lets LIMIT terminate the scan." },
      { criterion: "Write-cost accounting", description: "Handles the insert-heavy constraint by replacing rather than stacking indexes and says why the partial index is cheap to maintain." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/indexes-partial.html", "https://www.postgresql.org/docs/current/using-explain.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "covering-index-hot-endpoint",
    title: "Covering the Order-History Endpoint",
    type: "databases",
    difficulty: "medium",
    topics: ["indexes", "covering-index", "index-only-scan"],
    targetRoles: ["backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 25,
    pathIds: [BACKEND_PATH],
    moduleIds: [SQL_INDEXES],
    lessonIds: [EXPLAIN_LESSON],
    confidenceLevel: "core",
    prompt:
      "The hottest endpoint in a storefront runs `SELECT id, created_at, total_cents FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20` tens of thousands of times per minute. An index on (customer_id, created_at DESC) already exists and the plan uses it, but profiling shows most time goes to fetching the 20 table rows scattered across the heap, and cache pressure from those random reads hurts everything else. Explain what a covering index is, design one for this query, and explain the conditions under which the database can answer entirely from the index without touching the table.",
    constraints:
      "Name the mechanism (index-only scan or equivalent) and what invalidates it — in PostgreSQL, discuss visibility checks at a high level; in general terms, explain why the index must contain every referenced column. Note the storage/write tradeoff of the wider index.",
    hints: [
      "The current index finds the right 20 entries instantly — the remaining cost is going to the table for columns the index does not hold.",
      "What if the index itself carried id and total_cents alongside the sort key?",
    ],
    solutionOutline:
      "A covering index contains every column the query reads, so the scan never visits the table. Either extend the key — (customer_id, created_at DESC, id, total_cents) — or better, keep the key narrow and add non-key columns: `CREATE INDEX orders_cust_created_inc ON orders (customer_id, created_at DESC) INCLUDE (id, total_cents)`. The plan becomes an index-only scan: descend to the customer's newest entries, read 20 index tuples, done — no random heap fetches. In PostgreSQL the executor must still confirm tuple visibility; pages marked all-visible in the visibility map skip the heap check, so tables with heavy churn see fewer pure index-only wins until vacuum catches up. Cost: the wider index takes more space and each order write maintains it, which is usually a good trade for a read-dominant hot path.",
    commonMistakes: [
      "Putting total_cents into the key columns where it changes ordering semantics and bloats internal pages, instead of using INCLUDE/non-key storage.",
      "Claiming index-only scans never touch the table in PostgreSQL — visibility checks can still require heap visits on recently modified pages.",
      "Ignoring that SELECT * would silently defeat the covering property if the endpoint later adds a column.",
    ],
    followUpQuestions: [
      "The team adds a `status` filter to the query — what happens to your covering index and how do you evolve it?",
      "How would you detect in production that the index-only scan has degraded into heap fetches?",
    ],
    rubric: [
      { criterion: "Mechanism accuracy", description: "Defines covering/index-only scans correctly, including the visibility caveat rather than an absolute claim." },
      { criterion: "Design quality", description: "Keeps key columns for search/order and carries payload columns as non-key, with the write/storage tradeoff stated." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/indexes-index-only-scans.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "write-amplification-index-audit",
    title: "Nine Indexes and a Sinking Insert Rate",
    type: "optimization",
    difficulty: "hard",
    topics: ["indexes", "write-amplification", "index-audit", "operations"],
    targetRoles: ["backend_swe", "mid_level_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "fintech", "infra_heavy"],
    estimatedMinutes: 35,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [SQL_INDEXES],
    lessonIds: [EXPLAIN_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "An events table ingests 8,000 inserts/second and p99 insert latency has tripled over six months while nine indexes accumulated. Using the index list and workload below, produce an audit: which indexes to drop, which to merge, which to keep, and the expected effect. Preserve every query in the workload — none may lose its index support. Explain how you would confirm an index is unused in production before dropping it, and how you would stage the change safely.",
    context:
      "Indexes:\n\n```\ni1: (id) PRIMARY KEY\ni2: (tenant_id)\ni3: (tenant_id, created_at)\ni4: (tenant_id, created_at, event_type)\ni5: (event_type)\ni6: (created_at)\ni7: (payload_hash)\ni8: (tenant_id, event_type)\ni9: (user_agent)\n```\n\nWorkload:\n\n- Q1: `WHERE tenant_id = ? AND created_at >= ? ORDER BY created_at` (dashboard, constant)\n- Q2: `WHERE tenant_id = ? AND event_type = ? AND created_at >= ?` (alerting, constant)\n- Q3: `WHERE payload_hash = ?` (dedup check on ingest, every insert)\n- Q4: `WHERE created_at < ?` (nightly retention delete)\n- Q5: rare ad-hoc analyst queries by event_type alone (weekly, latency-insensitive)",
    constraints:
      "Every insert currently maintains nine trees. Target: the smallest index set that still serves Q1–Q4 well; Q5 may degrade to a scan or use whatever remains. State expected insert-path savings and which drop is riskiest.",
    hints: [
      "An index whose columns are a leading prefix of another index is usually redundant — which pairs here have that relationship?",
      "Match each query's equality columns first, then range/order columns, to the minimal composite that serves it.",
      "Databases expose per-index usage counters; dropping should follow evidence, not inference alone.",
    ],
    solutionOutline:
      "i2 is a leading prefix of i3/i4 — drop. i3 is a prefix of i4; Q1 (tenant_id equality + created_at range/order) is served by i4's (tenant_id, created_at, …) prefix — drop i3. Q2 wants equality on tenant_id and event_type then a created_at range: i4 orders created_at before event_type, so Q2 range-scans more than needed; the better single index for Q1+Q2 is replacing i4 and i8 with (tenant_id, event_type, created_at) only if Q1 still gets order — it does not (event_type sits between), so keep i4 for Q1 and rebuild i8 as (tenant_id, event_type, created_at) for Q2, dropping the old i8. i5 serves only weekly ad-hoc Q5 — drop and let Q5 scan or use i8's prefix (it cannot; tenant_id leads) — accept the scan per the constraint. i6 serves the retention delete Q4; keep (a delete scanning by time needs it). i7 serves the per-insert dedup check; keep. i9 serves nothing in the workload — drop after usage counters confirm. End state: PK, i4, i8'(tenant_id, event_type, created_at), i6, i7 — five trees instead of nine, roughly a 45% cut in per-insert index maintenance. Confirm with index-usage statistics over a full business cycle (weekly and monthly jobs), stage by making candidates invisible or dropping in one replica-tested migration at a time, and watch p99 insert latency and Q1–Q4 plans after each step. Riskiest drop: i5 — the only support for ad-hoc event_type queries; the workload contract explicitly permits it.",
    commonMistakes: [
      "Dropping a prefix index while missing that some query relied on its narrower width or its role in constraint enforcement.",
      "Reordering composite columns without rechecking which queries lose their ORDER BY support — equality columns first, then the range/sort column, is query-shape dependent, not a universal rule.",
      "Dropping everything in one migration with no usage evidence and no rollback plan.",
    ],
    followUpQuestions: [
      "How do monthly billing jobs complicate 'this index is unused' conclusions drawn from two weeks of counters?",
      "When is keeping a technically redundant index the right operational call?",
      "How would table partitioning by created_at change this audit, especially the retention delete?",
    ],
    rubric: [
      { criterion: "Redundancy analysis", description: "Finds the prefix-redundant pairs and reasons about column order per query shape rather than by rote." },
      { criterion: "Workload preservation", description: "Maps every Q1–Q4 to a surviving index and consciously accepts the permitted Q5 regression." },
      { criterion: "Operational discipline", description: "Uses usage statistics over a full cycle, staged drops, and measurable success criteria." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/indexes-multicolumn.html", "https://www.postgresql.org/docs/current/monitoring-stats.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "read-committed-status-check",
    title: "What Does the Second Read See?",
    type: "databases",
    difficulty: "easy",
    topics: ["transactions", "isolation", "read-committed"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 12,
    pathIds: [BACKEND_PATH],
    moduleIds: [TXN_ISOLATION],
    lessonIds: [ANOMALIES_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "Two sessions talk to a PostgreSQL database at the default read committed level. Session A begins a transaction and runs `UPDATE jobs SET status = 'done' WHERE id = 7` but has not committed. Session B, in its own transaction, runs `SELECT status FROM jobs WHERE id = 7` — twice: once while A is still open, and once just after A commits. For each of B's two reads, state exactly what status is returned and name the isolation rule that produces that result. Then state what would change if B's transaction ran at repeatable read.",
    constraints:
      "The job's status was 'running' before A's update. Answer with the two concrete values and the anomaly vocabulary from the lesson (dirty read, non-repeatable read), not just intuition.",
    hints: [
      "No PostgreSQL isolation level ever shows another transaction's uncommitted write.",
      "Read committed takes a fresh snapshot per statement; repeatable read takes one per transaction.",
    ],
    solutionOutline:
      "First read: 'running' — showing A's uncommitted 'done' would be a dirty read, which read committed forbids. Second read: 'done' — each read committed statement sees everything committed before it began, so B observes the change within one transaction: a non-repeatable read, which read committed permits. At repeatable read, B's whole transaction reads the snapshot taken at its first query, so both reads return 'running', and B only sees 'done' after starting a new transaction.",
    commonMistakes: [
      "Answering 'done' for the first read on the theory that the write is already in the database — visibility, not storage, is what isolation controls.",
      "Calling the changed second read a dirty read; the value B saw was committed, making it a non-repeatable read.",
    ],
    followUpQuestions: [
      "B re-runs a query like `SELECT count(*) FROM jobs WHERE status = 'running'` — which different anomaly can appear at read committed, and what is it called?",
      "Why is per-statement snapshotting usually the right default for OLTP workloads?",
    ],
    rubric: [
      { criterion: "Correct values", description: "Gives 'running' then 'done', with repeatable read pinning both to 'running'." },
      { criterion: "Vocabulary precision", description: "Uses dirty read and non-repeatable read for the right phenomena." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/transaction-iso.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "double-click-refund",
    title: "The Double-Click That Refunded Twice",
    type: "databases",
    difficulty: "easy",
    topics: ["transactions", "lost-update", "atomicity"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "fintech"],
    estimatedMinutes: 15,
    pathIds: [BACKEND_PATH],
    moduleIds: [TXN_ISOLATION],
    lessonIds: [LOST_UPDATE_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A support tool's refund handler runs, inside a transaction: (1) `SELECT refunded FROM orders WHERE id = $1`; (2) if refunded is false, call the payment provider to send the refund; (3) `UPDATE orders SET refunded = true WHERE id = $1`; commit. A support agent double-clicked the button, both requests ran concurrently, and the customer was refunded twice. Walk through the interleaving that produces the double refund, explain why wrapping the steps in a transaction did not prevent it, and repair the handler so a double-click refunds at most once.",
    constraints:
      "The database runs at read committed. The payment call cannot be moved inside a database lock's critical section blindly — say what you do about the external side effect. A single guarded UPDATE with a checked row count is an acceptable core of the fix.",
    hints: [
      "Both transactions can run step 1 before either runs step 3 — what does each one see?",
      "Flip the order: claim the refund in the database first, and only call the provider if your claim won.",
    ],
    solutionOutline:
      "Interleaving: request 1 reads refunded=false; request 2 reads refunded=false; both pass the check, both call the provider (two real refunds), both set the flag. Transactions did not help because each statement was individually consistent — the check-then-act gap is a lost-update/race the isolation level permits. Fix: claim first with one atomic statement — `UPDATE orders SET refunded = true WHERE id = $1 AND refunded = false` — and inspect the affected-row count: exactly one request wins (1 row), the loser gets 0 rows and returns 'already refunded' without calling the provider. Call the payment provider only after winning the claim, and record the provider's refund id; if the provider call fails after claiming, the transaction rolls the claim back (or a compensating job retries), which is why the claim and the side effect should live in a small state machine (claimed → provider_confirmed) rather than one boolean when reliability matters.",
    commonMistakes: [
      "Concluding the transaction should have prevented it — atomicity does not close a read-then-act race between two transactions.",
      "Fixing the flag but still calling the provider before the claim, leaving the double side effect.",
      "Disabling the button in the UI as the whole fix; retries and multiple agents reproduce the race without a double-click.",
    ],
    followUpQuestions: [
      "The payment provider offers an idempotency key on its refund API — how does that change your design?",
      "What does the handler do when the provider call times out and you cannot tell whether the refund happened?",
    ],
    rubric: [
      { criterion: "Race trace", description: "Shows both requests passing the check before either write, and names the check-then-act gap." },
      { criterion: "Claim-first repair", description: "Uses an atomic guarded update with row-count check, sequencing the external call after the claim." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "inventory-oversell-checkout",
    title: "Overselling the Last Unit",
    type: "databases",
    difficulty: "medium",
    topics: ["transactions", "lost-update", "locking", "optimistic-concurrency"],
    targetRoles: ["backend_swe", "mid_level_swe"],
    companyStyles: ["startup", "big_tech", "fintech"],
    estimatedMinutes: 25,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [TXN_ISOLATION],
    lessonIds: [LOST_UPDATE_LESSON],
    confidenceLevel: "core",
    prompt:
      "A checkout service decrements stock with: `SELECT quantity FROM inventory WHERE sku = $1`, an application check `quantity >= requested`, then `UPDATE inventory SET quantity = quantity_read - requested WHERE sku = $1`. During a flash sale, a SKU with 1 unit sold 3 times. Reconstruct the interleaving, then present three fixes — a single guarded atomic UPDATE, pessimistic locking with SELECT FOR UPDATE, and an optimistic version check — and recommend one for a flash-sale workload with a clear argument about contention behavior.",
    constraints:
      "Read committed isolation. For each fix, state its behavior when 500 concurrent checkouts hit one SKU: who waits, who retries, who fails fast. The recommendation must follow from that analysis, not taste.",
    hints: [
      "All three buyers can read quantity=1 before any UPDATE commits — write the schedule down.",
      "Under a hot row, compare a lock convoy (everyone queues) against optimistic retries (most retries lose again) against a guarded UPDATE (losers fail in one statement).",
    ],
    solutionOutline:
      "Schedule: T1, T2, T3 each read quantity=1; each passes the check; each writes 1-1=0 (the write uses the stale read), and three orders succeed for one unit — a lost update from check-then-act on a stale value. Fix 1 (guarded atomic): `UPDATE inventory SET quantity = quantity - $2 WHERE sku = $1 AND quantity >= $2`; affected-rows 0 means sold out. Under 500 concurrent buyers, row-level locking serializes the updates briefly; 499 fail fast with no retry loop — predictable and simple. Fix 2 (FOR UPDATE): correctness is fine, but 500 transactions queue on the row lock while each holds it across the application round-trip: a convoy that inflates tail latency and connection usage. Fix 3 (optimistic version): `UPDATE … WHERE sku = $1 AND version = $v`; under this contention nearly every retry loses again — wasted round-trips and thundering retries. Recommendation: the guarded atomic UPDATE — it makes the invariant part of the write, minimizes lock hold time, and gives losers an immediate, truthful 'sold out'. Note the UI/API consequence: checkout must handle the zero-rows outcome as a first-class result.",
    commonMistakes: [
      "Computing the new quantity in application code (quantity_read - requested) even inside the fixed version, which silently reintroduces the stale write.",
      "Recommending FOR UPDATE while ignoring that the lock is held across an application round-trip during a flash sale.",
      "Treating repeatable read as the fix; snapshot isolation aborts one same-row update but converts the race into retries you still must design for.",
    ],
    followUpQuestions: [
      "Inventory now spans warehouses in two rows — which of your three fixes survives, and what new anomaly appears?",
      "How would you reserve stock for 10 minutes during checkout instead of decrementing immediately?",
    ],
    rubric: [
      { criterion: "Interleaving reconstruction", description: "Writes the concrete schedule showing three stale reads preceding all writes." },
      { criterion: "Contention analysis", description: "Correctly characterizes convoying, retry storms, and fail-fast behavior for the three fixes at 500-way contention." },
      { criterion: "Justified recommendation", description: "Recommendation follows from the contention analysis and addresses the sold-out result contract." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/explicit-locking.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "report-snapshot-consistency",
    title: "A Financial Report That Must Not Contradict Itself",
    type: "databases",
    difficulty: "medium",
    topics: ["transactions", "isolation", "mvcc", "snapshots", "operations"],
    targetRoles: ["backend_swe", "mid_level_swe", "infrastructure_swe"],
    companyStyles: ["fintech", "big_tech"],
    estimatedMinutes: 30,
    pathIds: [BACKEND_PATH, SYSTEM_PATH],
    moduleIds: [TXN_ISOLATION],
    lessonIds: [ANOMALIES_LESSON],
    confidenceLevel: "advanced",
    prompt:
      "A nightly finance job runs ~40 SELECTs over 20 minutes to build a revenue report: totals by region, then by product, then a grand total, while order writes continue at full rate. At read committed, the sections are internally correct but mutually inconsistent — regions summed at 02:00 disagree with the grand total computed at 02:18 because writes landed in between. Explain why read committed produces sections that cannot reconcile, design the fix using transaction-level snapshots, and analyze the operational cost of holding a 20-minute snapshot on a busy MVCC database — including what you would monitor and one mitigation if the cost becomes unacceptable.",
    constraints:
      "The report is read-only. The fix must not block writers. Address MVCC mechanics: what the database must retain while an old snapshot stays open, and the effect on vacuum/garbage collection and table bloat.",
    hints: [
      "Each read committed statement sees a different committed state — 40 statements means up to 40 different worlds.",
      "A repeatable read (snapshot) transaction gives every statement the same consistent view without locking writers.",
      "What can vacuum not clean up while your snapshot can still see old row versions?",
    ],
    solutionOutline:
      "At read committed every statement snapshots independently, so section queries observe different committed states; any cross-section identity (sum of regions = grand total) can fail even though each query was correct in isolation. Fix: run the whole job in one transaction at repeatable read — `BEGIN ISOLATION LEVEL REPEATABLE READ; SET TRANSACTION READ ONLY;` — so all 40 queries read the same MVCC snapshot; writers proceed untouched because readers never block writers under MVCC. Cost: while the snapshot is open, vacuum cannot remove row versions it might still need, so 20 minutes of full-rate churn accumulates dead tuples — table and index bloat, longer scans for everyone, and on standbys the analogous query-conflict/feedback tradeoffs. Monitor: transaction age/duration alarms, dead-tuple and bloat metrics, vacuum progress. Mitigations if 20 minutes is too long: make the report read from a snapshot boundary marker (e.g., compute as-of a watermark such as 'orders with id <= X' or 'created_at < cutoff') so plain read committed queries become reproducible; export the tables once into a scratch schema and compute from the copy; or run the job on a replica where its snapshot cannot bloat the primary. The watermark approach is often best: it removes the long transaction entirely and makes the report re-runnable.",
    commonMistakes: [
      "Reaching for serializable — the job is read-only; repeatable read already gives a consistent snapshot without abort/retry machinery.",
      "Claiming the long reader blocks writers; under MVCC the cost is retained old versions and delayed cleanup, not lock contention.",
      "Fixing consistency but ignoring the bloat/vacuum consequence entirely, which is the part that pages the on-call.",
    ],
    followUpQuestions: [
      "How does hot_standby_feedback change where the cost of the long snapshot lands when the report runs on a replica?",
      "The finance team wants the report re-runnable with identical numbers a week later — which of the mitigations survives that requirement?",
    ],
    rubric: [
      { criterion: "Anomaly explanation", description: "Attributes the irreconcilable sections to per-statement snapshots, with a concrete two-section example." },
      { criterion: "Snapshot fix", description: "Uses a read-only repeatable read transaction and explains why writers are unaffected." },
      { criterion: "Operational analysis", description: "Names version retention, vacuum interference, and bloat, with monitoring and at least one credible mitigation." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.postgresql.org/docs/current/mvcc-intro.html", "https://www.postgresql.org/docs/current/routine-vacuuming.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
