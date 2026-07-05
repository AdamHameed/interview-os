import { defineProblems, DOCS_INSPIRED_NOTE } from "./types";

/**
 * SQL plan-cost problems (Prompt 4 / sql_plan harness). The candidate writes SQL —
 * typically a CREATE INDEX — and is graded on the EXPLAIN QUERY PLAN of a fixed query,
 * not on the result value (which is identical fast or slow). See src/lib/sql-plan-runner.ts.
 */

const USERS_SETUP = `
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT, created_at INTEGER);
INSERT INTO users VALUES
 (1,'ana@x.com','Ana',100),
 (2,'ben@x.com','Ben',101),
 (3,'cira@x.com','Cira',102),
 (4,'dan@x.com','Dan',103);
`;

const ORDERS_SETUP = `
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  status TEXT,
  created_at INTEGER,
  total_cents INTEGER
);
INSERT INTO orders VALUES
 (1,7,'shipped',100,5000),
 (2,7,'pending',101,6000),
 (3,7,'shipped',102,7000),
 (4,8,'shipped',103,8000),
 (5,7,'shipped',104,9000),
 (6,7,'cancelled',105,1000),
 (7,7,'shipped',106,3000);
`;

export const sqlPlanProblems = defineProblems([
  {
    slug: "index-the-login-lookup",
    title: "Give the Login Lookup an Index (SQL Plan)",
    type: "optimization",
    difficulty: "easy",
    topics: ["databases", "indexing", "query-plans", "sql"],
    targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech", "fintech"],
    estimatedMinutes: 12,
    language: "sql",
    testHarnessType: "sql_plan",
    supportedLanguages: ["sql"],
    prompt:
      "Every login runs `SELECT id, name FROM users WHERE email = ?`. On the `users` table there is no index on `email`, so the database reads every row and compares it — a full table scan that gets slower as the table grows.\n\nThe grader runs `EXPLAIN QUERY PLAN` on the query in a local SQLite sandbox and checks the plan SHAPE, because the returned rows are the same whether the query is fast or slow. Right now the plan is `SCAN users` (a full scan). Write the `CREATE INDEX` statement that turns it into an index search (`SEARCH users USING INDEX ...`).\n\nWrite only SQL. Your statement runs before the query is explained.",
    context:
      "This is the runnable, plan-graded companion to the index-selection problems. SQLite chooses its plan from the schema and available indexes (no ANALYZE), so the plan shape is deterministic and independent of row count — the same signal a Postgres EXPLAIN would give at scale.",
    constraints:
      "Submit a CREATE INDEX statement (you may submit more than one statement). The query — `SELECT id, name FROM users WHERE email = ?` — is fixed and graded by its plan: it must use an index (no full scan of `users`) and still return the correct row.",
    starterCode:
      "-- The users table has no index on `email`, so this query full-scans:\n--   SELECT id, name FROM users WHERE email = 'ben@x.com';\n-- Add the index that makes it an index search:\n\n",
    tests: [
      {
        name: "email lookup uses an index, not a full scan",
        expected: "SEARCH users USING INDEX on email; no SCAN users",
        sqlPlan: {
          setup: USERS_SETUP,
          query: "SELECT id, name FROM users WHERE email = 'ben@x.com'",
          assert: {
            usesIndex: true,
            forbidFullScanOf: ["users"],
            resultEquals: [[2, "Ben"]],
          },
        },
      },
      {
        name: "the index serves other email values too",
        expected: "index search for a different email",
        hidden: true,
        sqlPlan: {
          setup: USERS_SETUP,
          query: "SELECT id, name FROM users WHERE email = 'dan@x.com'",
          assert: { usesIndex: true, forbidFullScanOf: ["users"], resultEquals: [[4, "Dan"]] },
        },
      },
    ],
    hints: [
      "A WHERE equality on an unindexed column forces the database to look at every row. Index the column it filters on.",
      "The statement is `CREATE INDEX idx_name ON users(email);`.",
      "After the index exists the plan becomes `SEARCH users USING INDEX ... (email=?)` instead of `SCAN users`.",
    ],
    solutionOutline:
      "Create a B-tree index on the filtered column: `CREATE INDEX idx_users_email ON users(email);`. The equality predicate `email = ?` can then be answered by descending the index to the matching key instead of scanning every row, so the plan changes from `SCAN users` to `SEARCH users USING INDEX idx_users_email (email=?)`. The result is unchanged — the point is the plan. The cost side to mention in an interview: the index adds write amplification on inserts/updates and storage, which is why you index the columns you actually filter on, not every column.",
    fullSolution: "```sql\nCREATE INDEX idx_users_email ON users(email);\n```",
    commonMistakes: [
      "Indexing `id` or `name` instead of the column in the WHERE clause.",
      "Assuming the primary key helps — it indexes `id`, not `email`.",
      "Believing an index is free; every index taxes writes and storage.",
    ],
    followUpQuestions: [
      "How does this change when logins also filter by `AND active = 1`? Does a single-column email index still suffice?",
      "When would the planner ignore your index and scan anyway (very small tables, low selectivity)?",
      "What is the write-side cost of this index on a high-insert `users` table?",
    ],
    rubric: [
      { criterion: "Index the predicate", description: "Creates an index on the filtered column (email)." },
      { criterion: "Plan shape", description: "The query uses an index search with no full table scan, and returns the correct row." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.sqlite.org/queryplanner.html",
      "https://www.postgresql.org/docs/current/indexes-intro.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "composite-index-filter-and-order",
    title: "One Index for the Filter AND the Sort (SQL Plan)",
    type: "optimization",
    difficulty: "medium",
    topics: ["databases", "indexing", "composite-index", "query-plans", "sql"],
    targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"],
    companyStyles: ["big_tech", "fintech", "startup"],
    estimatedMinutes: 20,
    language: "sql",
    testHarnessType: "sql_plan",
    supportedLanguages: ["sql"],
    prompt:
      "The order-history endpoint runs:\n\n```sql\nSELECT id, total_cents FROM orders\nWHERE customer_id = ? AND status = 'shipped'\nORDER BY created_at DESC\nLIMIT 20;\n```\n\nThe starter ships a single-column index on `customer_id`. That helps the filter, but the plan still contains `USE TEMP B-TREE FOR ORDER BY` — the database gathers the matching rows and sorts them on every request, and `LIMIT 20` cannot stop early because the rows do not arrive in order.\n\nReplace it with a composite index so the SAME index satisfies both equality predicates AND provides the `created_at` order — no temp sort. The grader checks the plan uses an index, has no temp B-tree sort, and does not full-scan `orders`.\n\nWrite only SQL (drop the starter index if you like, or just add the better one).",
    context:
      "This is the runnable, plan-graded companion to the composite-index problems. The key signal — whether the ORDER BY needs a `USE TEMP B-TREE FOR ORDER BY` step — is exactly what tells you the index provides the sort order, and it is deterministic in SQLite regardless of row count.",
    constraints:
      "Submit SQL (CREATE INDEX, optionally DROP INDEX). The query is fixed. Its plan must: use an index (no `SCAN orders`), have NO temp B-tree sort (the index must supply the `created_at` order), and return the correct top-20 rows. Column order in the index matters: equality columns first, then the ORDER BY column.",
    starterCode:
      "-- Starter: a single-column index. It helps the filter but the plan still shows\n-- USE TEMP B-TREE FOR ORDER BY, so LIMIT 20 cannot stop early.\nCREATE INDEX idx_orders_customer ON orders(customer_id);\n\n-- Replace it with a composite index that also provides the created_at order:\n",
    tests: [
      {
        name: "composite index serves the filter and the sort with no temp B-tree",
        expected: "SEARCH orders USING INDEX (customer_id, status, created_at); no temp sort",
        sqlPlan: {
          setup: ORDERS_SETUP,
          query:
            "SELECT id, total_cents FROM orders WHERE customer_id = 7 AND status = 'shipped' ORDER BY created_at DESC LIMIT 20",
          assert: {
            usesIndex: true,
            noTempSort: true,
            forbidFullScanOf: ["orders"],
            resultEquals: [
              [7, 3000],
              [5, 9000],
              [3, 7000],
              [1, 5000],
            ],
          },
        },
      },
    ],
    hints: [
      "A single-column index on customer_id leaves status filtering and the sort to the engine — hence the temp B-tree.",
      "Put the equality columns first, then the ORDER BY column: `(customer_id, status, created_at)`.",
      "Once created_at is the trailing key after the two equalities, the index yields rows already in created_at order (SQLite can scan it backward for DESC), so no temp sort is needed.",
    ],
    solutionOutline:
      "Build a composite index `(customer_id, status, created_at)`. The two equality predicates pin the leading columns, so within that slice the index is ordered by `created_at`; the planner walks it in reverse for `ORDER BY created_at DESC` and stops after 20 rows, eliminating the `USE TEMP B-TREE FOR ORDER BY` step. The column order is the whole lesson: equality columns first (their order between each other barely matters here), then the sort column last so the index physically provides the ordering. A single-column index on `customer_id` cannot do this — it still sorts. Optionally drop the starter single-column index once the composite covers its uses.",
    fullSolution:
      "```sql\nDROP INDEX IF EXISTS idx_orders_customer;\nCREATE INDEX idx_orders_cust_status_created\n  ON orders(customer_id, status, created_at);\n```",
    commonMistakes: [
      "Putting the sort column first — `(created_at, customer_id, status)` breaks the equality prefix and the index is nearly useless for this query.",
      "Adding separate single-column indexes and expecting the planner to combine them into ordered output (a bitmap AND cannot preserve order).",
      "Stopping at `(customer_id, status)` — the filter is served but the ORDER BY still needs a temp sort.",
    ],
    followUpQuestions: [
      "Would a partial index `... WHERE status = 'shipped'` be even better here, and what does it trade?",
      "The query adds `SELECT ... total_cents` — how would you make it index-only (covering)?",
      "Why does putting the ORDER BY column before the equality columns destroy the plan?",
    ],
    rubric: [
      { criterion: "Composite ordering", description: "Index puts equality columns before the ORDER BY column so one index serves filter and sort." },
      { criterion: "No temp sort", description: "The plan uses the index, has no temp B-tree sort, does not scan orders, and returns the right rows." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.sqlite.org/queryplanner.html",
      "https://www.postgresql.org/docs/current/indexes-ordering.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "covering-index-avoids-table-lookup",
    title: "Make the Query Index-Only (SQL Plan)",
    type: "optimization",
    difficulty: "medium",
    topics: ["databases", "indexing", "covering-index", "query-plans", "sql"],
    targetRoles: ["backend_swe", "mid_level_swe", "platform_engineer"],
    companyStyles: ["big_tech", "fintech", "startup"],
    estimatedMinutes: 18,
    language: "sql",
    testHarnessType: "sql_plan",
    supportedLanguages: ["sql"],
    prompt:
      "A hot reporting query runs `SELECT total_cents FROM orders WHERE customer_id = ?` millions of times. The starter index on `customer_id` already turns the filter into an index search — but for every matching entry the database still hops from the index back to the table (a heap lookup) just to read `total_cents`.\n\nYou can avoid the table entirely: if the index also contains `total_cents`, the query is answered from the index alone — an index-only (covering) read, shown in the plan as `USING COVERING INDEX`. The grader requires the plan to be covering.\n\nWrite the index (SQL only).",
    context:
      "This is the runnable, plan-graded companion to the covering-index concept. `USING COVERING INDEX` vs plain `USING INDEX` is the deterministic SQLite signal for an index-only scan — the same idea as a Postgres index-only scan / INCLUDE column.",
    constraints:
      "Submit SQL. The query `SELECT total_cents FROM orders WHERE customer_id = ?` is fixed. Its plan must be a COVERING index scan (index-only — no table lookup) and return the correct values. To cover it, the index must contain both the filtered column and the selected column.",
    starterCode:
      "-- Starter: filters via an index but still reads the table for total_cents\n-- (plan: SEARCH orders USING INDEX ... — not covering).\nCREATE INDEX idx_orders_customer ON orders(customer_id);\n\n-- Make the read index-only (USING COVERING INDEX):\n",
    tests: [
      {
        name: "the read is served index-only (covering)",
        expected: "SEARCH orders USING COVERING INDEX (customer_id, total_cents)",
        sqlPlan: {
          setup: ORDERS_SETUP,
          query: "SELECT total_cents FROM orders WHERE customer_id = 7 ORDER BY total_cents",
          assert: {
            covering: true,
            forbidFullScanOf: ["orders"],
            resultEquals: [[1000], [3000], [5000], [6000], [7000], [9000]],
          },
        },
      },
    ],
    hints: [
      "A plain index on customer_id finds the rows but must visit the table to read total_cents. Put total_cents in the index too.",
      "`CREATE INDEX idx ON orders(customer_id, total_cents);` — now every column the query needs is in the index.",
      "The plan changes from `USING INDEX` to `USING COVERING INDEX`, meaning no table (heap) lookup at all.",
    ],
    solutionOutline:
      "Add the selected column to the index so it contains every column the query touches: `CREATE INDEX idx_orders_customer_total ON orders(customer_id, total_cents);`. Now the filter (`customer_id = ?`) descends the index and the projected value (`total_cents`) is read straight from the index entry — the plan reports `USING COVERING INDEX` and no table lookup happens. Ordering by `total_cents` is also free since it trails `customer_id` in the index. The trade-off: a wider index costs more storage and write maintenance, so you cover the hot, high-volume queries rather than everything. In Postgres the same effect uses a composite index or `INCLUDE (total_cents)`.",
    fullSolution:
      "```sql\nCREATE INDEX idx_orders_customer_total\n  ON orders(customer_id, total_cents);\n```",
    commonMistakes: [
      "Indexing only customer_id — the filter is fast but the table lookup for total_cents remains (not covering).",
      "Adding total_cents as the leading column, which breaks the customer_id equality prefix.",
      "Covering a rarely-run query and paying the wider-index write cost for no benefit.",
    ],
    followUpQuestions: [
      "When is a covering index NOT worth it, given the write and storage cost of the extra column?",
      "How does Postgres `INCLUDE (total_cents)` differ from putting the column in the key?",
      "If the query also selected `status`, how would the covering index change?",
    ],
    rubric: [
      { criterion: "Covering columns", description: "Index contains both the filtered and the selected column so the read is index-only." },
      { criterion: "Plan shape", description: "The plan reports USING COVERING INDEX with no table scan and returns the correct values." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.sqlite.org/queryplanner.html#covidx",
      "https://www.postgresql.org/docs/current/indexes-index-only-scans.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
