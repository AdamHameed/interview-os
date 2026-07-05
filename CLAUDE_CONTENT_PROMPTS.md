# Claude Content Expansion Prompts

Use these prompts sequentially. Small, reviewed batches should produce a more coherent curriculum than asking Claude to fill every module at once.

## Prompt 1 — Research and curriculum planning

```text
You are taking over the Interview OS repository.

Goal:
Research and plan the next content expansion without generating the entire curriculum yet.

First read:
- README.md
- PROGRESS.md
- LESSON_AUTHORING_STANDARD.md
- prisma/schema.prisma
- prisma/seed-data/learning.ts
- prisma/seed-data/learning-overrides.ts
- prisma/seed-data/types.ts
- scripts/validate-seed.ts
- existing problem seed files

Preserve:
- all existing problems and lessons
- standalone modules
- reusable path/module relationships
- local submissions and judging
- Codex review export/import
- existing working routes and APIs

Before editing, run:
- git status
- npm run validate:seed
- npm run lint
- npm run typecheck
- npm test
- npm run build

Curriculum requirements:
Interview OS must support both:
1. Guided paths whose lessons and problems flow naturally.
2. Standalone modules for targeted interview preparation.

Create or update a curriculum coverage plan in PROGRESS.md. For every module, record:
- the plain-language module motivation: why it exists, the real problem it solves, interview relevance, and learner outcome
- intended learner level
- prerequisites
- lesson sequence
- missing warmup problems
- missing core problems
- missing challenge problems
- missing advanced/applied problems
- interview formats covered
- research sources still needed

Prioritize:
1. DSA Confidence Builder
2. Backend SWE
3. Operating systems and networking
4. Databases
5. C++
6. System design
7. Quant Dev
8. Docker and Kubernetes
9. AI-efficient engineering

DSA requirements:
The DSA path must eventually provide broad original coverage comparable to a high-quality “150-style” interview roadmap without copying LeetCode, NeetCode, or paid platforms.

Cover:
- arrays and hashing
- two pointers
- sliding window
- stacks
- binary search
- linked lists
- trees and BSTs
- tries
- heaps
- backtracking
- graphs
- advanced graphs
- 1-D dynamic programming
- 2-D dynamic programming
- greedy algorithms
- intervals
- bit manipulation
- math and geometry

Learning-flow requirements:
Each topic should normally progress through:
1. concise concept lesson
2. worked example or walkthrough
3. genuinely easy warmup
4. standard interview-level core problem
5. harder variation
6. applied backend, infrastructure, or quant variant where appropriate
7. self-review using the rubric

Do not confuse “warmup” with a disguised medium problem. Easy problems should:
- isolate one main idea
- use small, clear contracts
- avoid unnecessary tricks
- usually take 10–20 minutes
- build confidence for the next lesson or problem

Research requirements:
- Prefer official documentation, standards, textbooks, reputable university material, and public engineering references.
- Use primary sources where practical.
- Record source URLs.
- Do not copy proprietary problem statements.
- Clearly distinguish researched facts from original interview exercises.

Do not add a large content batch in this pass. Improve the coverage plan, identify the next three bounded implementation batches, update PROGRESS.md, and commit the planning work only if files changed.
```

## Prompt 2 — Expand one coherent lesson/problem batch

```text
Continue from the current Interview OS repository state.

Goal:
Fully develop one coherent module batch so its lessons and problems form a smooth interview-preparation progression.

Read README.md, PROGRESS.md, and LESSON_AUTHORING_STANDARD.md first. Follow the curriculum coverage plan. Do not restart or re-architect the application.

Choose:
- no more than two closely related modules
- preferably modules identified as the highest-priority incomplete batch
- at least one module with beginner-accessible material

For each selected module, create:
- one concise concept lesson
- one worked-example or pattern lesson
- one optional interview checkpoint lesson
- 2 genuinely easy warmup problems
- 2 standard core problems
- 1 challenge problem
- at most 1 advanced or applied problem

Required flow:
concept → worked example → easy warmup → second warmup → core → core variation → challenge → self-review

Every new ready lesson must be fully authored in the exact workflow from LESSON_AUTHORING_STANDARD.md. Do not rely on legacy lesson normalization to repair short notes. Required content order:
- Goal
- Why This Matters, connected to a real engineering problem
- The Simple Mental Model in 3–6 plain-language sentences
- progressive concept sections that teach one idea at a time
- at least one fenced diagram, trace, code sample, query plan, protocol exchange, or configuration artifact
- complete step-by-step flow
- Worked Example with real values and normal plus boundary/failure cases
- Interview Value
- at least three topic-specific Common Interview Questions with substantive answers
- at least three numbered, topic-specific Common Mistakes
- at least three Quick Check questions with explicit Answer sections
- Key Takeaway as the final level-two section

Lesson quality rules:
- Usually write 900–1600 words and meet at least max(900, estimatedMinutes × 30) words.
- Define terms before using them heavily and introduce no more than 3–5 new terms before returning to an example.
- For Lesson 1, prioritize motivation, the simplest useful model, one end-to-end example, minimum vocabulary, and beginner misconceptions. Move secondary components and advanced implementation details to later lessons.
- Use public primary or high-quality educational sources.
- Teach every concept required by the linked warmup.
- Link lessons to a genuinely easy warmup before core or challenge work.
- Do not use generic generated questions such as “What is the central model?” New questions must be specific to the lesson topic.
- Do not add new slugs to LEGACY_LESSON_SLUGS. That set exists only for lessons authored before this standard.

Every new module must also provide a plain-language `motivation` on its `ModuleSpec`; it is stored as `motivationMarkdown` and must explain why the topic exists, the real-system problem it solves, why interviewers care, and what the learner should explain after finishing.

Every problem must include:
- title
- realistic original prompt
- type and calibrated difficulty
- topics and target roles
- estimated time
- confidence level
- module and lesson links
- constraints
- hints
- solution outline
- common mistakes
- follow-up questions
- concrete rubric
- source URLs or original-content license note

Problem formats must match the skill:
- DSA/implementation: starter code, function contract, examples, public and hidden tests where supported.
- Optimization: provide correct but inefficient code, SQL, query plan, or design to improve. State baseline complexity/performance, target, constraints, and behavior to preserve.
- Debugging/read-code: provide code, logs, traces, symptoms, or failing tests.
- System design: use an open-ended descriptive scenario with requirements, scale, ambiguity, tradeoffs, rubric, and follow-ups. Do not force it into a code harness.
- OS/networking/C++/database/quant: use the realistic mix of implementation, diagnosis, explanation, and design found in interviews.

Difficulty calibration:
- Warmups must test one main idea and should not require an obscure trick.
- Core problems should resemble realistic standard interview questions.
- Challenges should combine concepts or introduce meaningful constraints.
- Advanced problems should test tradeoffs, performance, or system application.
- Do not generate mostly medium and hard problems.

Bidirectional linking:
- Lessons must link their problem slugs.
- Problems must link the correct path/module/lesson IDs.
- Problems should appear under the correct confidence-level section.
- The final lesson should explain what the learner should study next.

Research:
Use primary or high-quality public sources. Do not copy LeetCode, NeetCode, paid courses, company interview banks, or proprietary statements. All exercises must be original.

After implementation run:
- npx prisma generate
- npx prisma db push
- npm run validate:seed
- npm run seed
- npm run lint
- npm run typecheck
- npm test
- npm run build

Manually verify:
- standalone module page
- relevant learning-path page
- lesson navigation
- problem links
- runnable test cases, if added
- warmup → core → challenge ordering

Update README.md and PROGRESS.md with:
- lessons added
- problems added by difficulty
- sources used
- remaining gaps
- next recommended batch

Commit only this bounded batch with a descriptive commit message.
```

## Prompt 3 — Build out the DSA roadmap

```text
Continue developing Interview OS.

Goal:
Expand the DSA Confidence Builder into a strong original algorithms-and-data-structures curriculum comparable in breadth—not copied content—to a “150-style” interview roadmap.

Do not attempt the entire roadmap in one run.

First:
- Read README.md, PROGRESS.md, and LESSON_AUTHORING_STANDARD.md.
- Audit existing DSA modules, lessons, problems, and runnable tests.
- Select the next two adjacent incomplete DSA topics.
- Preserve all existing content and application behavior.

For this batch:
- scaffold missing global modules if necessary
- fully develop no more than two modules
- add a clear prerequisite relationship
- add concise lessons and a worked example
- add exactly:
  - 4 easy warmups total
  - 3 medium/core problems total
  - 1 hard/challenge problem total
  - optionally 1 applied backend or quant variation

The path must feel cumulative:
- lessons teach the technique before problems require it
- the first warmup isolates the basic operation
- the second warmup introduces recognition
- core problems require choosing and implementing the pattern
- the challenge combines the pattern with another idea
- the applied problem connects DSA to realistic engineering

Every lesson must be authored in the full LESSON_AUTHORING_STANDARD.md format, including Why This Matters, The Simple Mental Model, topic-specific interview Q&A, numbered mistakes, quick checks with answers, a fenced trace/code artifact, and Key Takeaway as the final section. Do not use the legacy-normalization allowlist for new lessons. Lesson 1 must introduce at most 3–5 essential terms before returning to a concrete example.

For coding problems:
- use original scenarios and wording
- provide starter code
- support Python, JavaScript, and TypeScript where compatible
- include public and hidden tests
- cover empty, minimal, duplicate, boundary, and performance-relevant cases
- ensure the reference solution satisfies the tests
- keep expected function names and test metadata valid

Do not neglect easy problems. At least half of the problems in this batch must be genuinely accessible to learners who just completed the lesson.

Maintain long-term coverage across:
arrays/hashing, two pointers, sliding window, stacks, binary search, linked lists, trees/BSTs, tries, heaps, backtracking, graphs, advanced graphs, 1-D/2-D DP, greedy, intervals, bit manipulation, and math/geometry.

Run all validation, update README.md and PROGRESS.md, document the next two DSA topics, and commit the completed batch.
```

Prompt 2 is the reusable default. Run it repeatedly for different module batches instead of asking Claude to generate the entire curriculum in one pass.

## Prompt 4 — Augment non-DSA problems with runnable tests and starter code

Many high-value problems are currently written-answer only (databases, debugging, concurrency, systems, quant). A large fraction can be made **runnable** — starter code the learner edits plus tests that pass/fail — without any new runner infrastructure, because `src/lib/local-runner.ts` is a generic Python/JS/TS executor that already:

- calls any entry function by name with JSON args and compares results by **JSON-normalized deep equality** (sets are compared order-insensitively);
- **awaits coroutines** (`asyncio.run`), so async problems run as-is;
- runs anything in the Python/Node stdlib inside the submission — including `sqlite3` (in-memory), `threading`, `asyncio`, `json`, `re`.

### The augmentation pattern

1. **Ship the broken or slow code as `starterCode`** (a real, editable entry function), not just prose.
2. **Expose a deterministic scenario entry point** that returns JSON-compatible data (ids processed, pages produced, allowed requests) — the "function under test" does not have to be a pure algorithm.
3. **Encode the lesson as an invariant** the test checks: at-least-once (no id lost), consistency (no duplicate/skipped rows), idempotency, determinism under key collision. Use a fixed scenario so the correct output is deterministic, and design the buggy starter to fail that invariant **deterministically** (do not rely on GC/thread timing — the test must be reproducible).

### Faithful vs testable

Some bugs are inherently non-deterministic (an un-referenced `asyncio.create_task` that is GC'd; a thread race). Do **not** force these into a flaky judge. Instead:

- keep the deep, non-deterministic version as the **written-answer** problem (rubric-graded), and
- add a **runnable sibling** in the same module that targets the deterministic, testable core of the same lesson (e.g. at-least-once retry semantics), cross-referenced in the prompt.

### Making an *optimization* testable: the budgeted-stub trick

Optimization problems are the hard case: the starter is **correct but slow**, so a correctness test passes on both the slow and the fast version and cannot distinguish them. Two options that keep it in the existing `function_call` runner without a real profiler:

1. **Budgeted stub dependency (preferred).** Put the expensive resource (an API client, a DB, a rate-limited service) behind a small in-scenario class that counts calls and **raises when the budget is exceeded**. Ship the class in `starterCode`. The slow per-item version blows the budget and errors (test fails); the batched/deduped/cached version stays under budget and returns the correct result (test passes). The `expectedValue` stays the clean result — the budget does the discriminating. This makes an *efficiency* property (calls scale with distinct inputs, not with rows) directly testable. See `batch-merchant-enrichment`.
2. **Return the efficiency metric.** Have the entry point return a value that encodes the cost (e.g. the call count, or `(result, calls)`), and pin the expected low value. Use only when the efficient strategy has a single unambiguous cost; otherwise the budgeted stub is less brittle because any under-budget strategy passes.

Include the stub class in `fullSolution` too, so the displayed reference is itself runnable standalone (the runner executes the pasted code with no other context).

### Harness fields to set

`functionName`, `testHarnessType: "function_call"`, `supportedLanguages` (use `["python"]` for `sqlite3`/`asyncio` problems), `starterCode` (the buggy/slow entry), and `tests` (each needs `name`, a display `expected` string, plus `args` and `expectedValue` — the runnable data). Verify every problem end-to-end with `runLocalTests` from `src/lib/local-runner.ts`: the correct reference solution must pass and the shipped starter must fail.

### Plan-cost oracle (built — `testHarnessType: "sql_plan"`)

Index-selection problems produce the same rows whether the query is fast or slow, so a value check cannot grade them. Use the SQL-plan harness (`src/lib/sql-plan-runner.ts`, `runSqlPlanTests`): the candidate writes SQL (`language: "sql"`, usually a `CREATE INDEX`), and each test carries a `sqlPlan: { setup, query, assert }` where `setup` seeds an in-memory SQLite schema, `query` is the fixed graded query, and `assert` checks plan SHAPE:

- `usesIndex` — plan must be `SEARCH ... USING INDEX` (not a full `SCAN`).
- `covering` — plan must be `USING COVERING INDEX` (index-only, no table lookup).
- `noTempSort` — the `ORDER BY` must be served by the index (no `USE TEMP B-TREE`). This is what distinguishes a correct composite index from a naive single-column one.
- `forbidFullScanOf: [table]`, `resultEquals: rows`, `maxStatements`.

SQLite plans from schema+indexes (no ANALYZE), so signals are deterministic and independent of row count. Ship a starter that is a wrong/insufficient index (empty, single-column, or non-covering) so the plan fails, and verify with `runSqlPlanTests` that starter fails and the reference index passes. See `prisma/seed-data/sql-plan.ts`. This is an approximation of Postgres `EXPLAIN ANALYZE`, not a replacement.

### What still needs new infrastructure (do not fake it)

- **Query-count oracle for N+1 in real SQL:** the budgeted-stub trick (a query-counting stub that raises past N) already makes N+1 testable without real SQL (see `orm-n-plus-one-query-count`). A `sqlite3` `set_trace_callback` statement count is wired into the SQL-plan runner (`maxStatements`) if you want to assert query counts against a real DB.
- **Compiled languages (C++):** the runner only spawns `python3`/`node`. C++ lifetime/UB problems stay read-and-reason (or add a "predict the output / identify the UB line" structured check) until a compiled sandbox exists.

Prefer this augmentation on debugging, optimization, databases, concurrency, and systems problems whose lesson is an invariant. Update PROGRESS.md and run the full validation suite (`validate:seed`, `lint`, `typecheck`, `test`, `build`) after each batch.
