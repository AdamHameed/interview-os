# Interview OS

Interview OS is a local-first technical interview practice application. It combines a curated problem bank, progress tracking, local coding submissions, and a file-based Codex review workflow for written system-design, debugging, optimization, database, quant, and AI-usage answers.

## Local setup

Requirements:

- Node.js 20 or newer
- npm
- Python 3 available as `python3` for Python submissions
- Codex CLI only if you want hybrid review of written submissions

```bash
npm install
npx prisma generate
npx prisma db push
npm run validate:seed
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Modular curriculum

Interview OS supports two complementary study modes:

- `/paths` provides optional, role-oriented guidance such as Backend SWE, Infrastructure SWE, Quant Dev, System Design, and DSA Confidence Builder.
- `/modules` is a standalone knowledge base for direct interview cramming. A user can jump into Kubernetes, Docker, OS threading, page tables, TCP, C++, Redis, SQL indexes, order books, or AI workflows without following a path.

Paths do not own modules. `LearningPathModule` is an ordered join with `isRequired` and a `warmup | core | advanced | optional | interview_cram` label, so the same module can appear in several paths. Lessons belong to standalone modules. Problems may link to multiple module IDs and carry a `warmup | core | challenge | advanced` confidence level.

The current scaffold contains six paths, 79 standalone modules, 63 path memberships, 190 lessons, and 32 reviewed mini-lessons. The remaining 158 lesson briefs are visibly marked scaffolds for later content work. The DSA Confidence Builder now spans 16 modules covering the full roadmap topic list; binary search and linked lists are fully developed with lessons and runnable problems.

### Add a standalone module

1. Add a `ModuleSpec` to `MODULE_SPECS` in `prisma/seed-data/learning.ts` with a unique slug, title, category, difficulty, prerequisites by module slug, and estimated hours.
2. The generator creates a stable `learningModuleId(moduleSlug)`, outcomes, and two placeholder lesson briefs.
3. Add the module slug to one or more entries in `PATHS` only when it belongs in a guided sequence. Standalone-only modules are valid.

### Add or change a path

1. Add or edit a path in `PATHS` in `prisma/seed-data/learning.ts`.
2. List existing global module slugs in curated order. Do not duplicate module definitions inside paths.
3. `learningPathId(slug)` and `learningPathModuleId(pathSlug, moduleSlug)` provide stable IDs.

### Add or complete a lesson

1. Add a lesson to `REAL_LESSONS[moduleSlug]` in `prisma/seed-data/learning.ts`.
2. Include reviewed Markdown, takeaways, examples, public sources, and linked problem slugs.
3. Set `isPlaceholder: false` only after the instructional is genuinely useful.
4. Keep scaffold lessons until their replacements are reviewed; the UI clearly distinguishes ready content from placeholders.

### Link lessons and problems

- New problems can declare `pathIds`, global `moduleIds`, `lessonIds`, and `confidenceLevel` directly.
- Existing problems receive non-destructive metadata in `prisma/seed-data/learning-overrides.ts`.
- Lessons use `linkedProblemSlugs`; `prisma/seed.ts` resolves them after problem upserts.
- Run `npm run validate:seed` to catch unknown prerequisites, memberships, path/module/lesson IDs, duplicate ordering, and missing linked problems.

Future content passes should remain bounded, but the overall curriculum must be broad. Treat DSA as a first-class path with original interview problems covering the major pattern families found in a rigorous "150"-style roadmap: arrays and hashing, two pointers, sliding windows, stacks, binary search, linked lists, trees and tries, heaps, backtracking, graphs, dynamic programming, greedy algorithms, intervals, bit manipulation, and math/geometry. Do not copy LeetCode, NeetCode, or paid-platform statements.

Use the format that matches the interview skill. Coding problems should include starter code and runnable tests where the local harness supports them. Optimization exercises should often provide correct but inefficient code, SQL, or a design that the learner must improve while preserving behavior. Debugging and read-code exercises should provide concrete artifacts such as code, logs, traces, or failing tests. System-design exercises should remain open-ended scenarios with scale, constraints, rubrics, and follow-ups rather than being forced into a code runner.

Each content pass should add a deliberate mix of warmup, core, challenge, and advanced work, with genuinely accessible entry points. Work in small reviewed batches, update the coverage notes in `PROGRESS.md`, validate sources and links, and avoid bulk-generating every lesson in one pass.

## Coding submissions

Problems configured with a `function_call` harness show a Monaco workspace. Select Python, JavaScript, or TypeScript, define the function named in the workspace, and choose **Run tests** or **Submit**.

The local runner:

- creates a private temporary directory;
- writes the answer and generated test harness there;
- starts a fresh local child process for each test;
- stops each test after three seconds;
- caps captured process output and truncates displayed stdout/stderr;
- compares normalized JSON-compatible results to expected values;
- removes temporary files after the run;
- stores the submission and per-test results in local SQLite.

Public tests show expected and actual values. Hidden tests report pass/fail without returning those values. Hidden tests are a practice affordance, not a security boundary: this is a local database and the seed source is available on disk.

Thirty problems currently have runnable function-call tests: eight existing problems overlaid via `prisma/seed-data/runnable-overrides.ts`, four DSA confidence warmups, nine binary-search/linked-list problems in `prisma/seed-data/dsa-search-lists.ts`, and nine dynamic-programming problems in `prisma/seed-data/dsa-dynamic-programming.ts`; the newer problems carry their executable metadata directly.

### Local runner security warning

The runner is for one trusted person on their own machine. A timeout, temporary working directory, and output cap do **not** make a secure sandbox. Submitted code runs with the operating-system permissions of the Interview OS process and can access the network, filesystem, environment, or spawn other processes.

Do not expose `/api/submissions/run` to untrusted users or deploy it as a public code-execution endpoint.

If Interview OS is deployed later, choose one of these deliberately:

- disable code execution and retain answer storage only;
- run each submission inside a locked-down disposable Docker/VM sandbox with resource and network controls;
- integrate a separately operated Judge0 or Piston service;
- use another purpose-built isolated runner.

Judge0 and Piston are future deployment options, not current dependencies. The app does not call a hosted runner or paid AI API.

## Written submissions and Codex review

Non-coding problems provide a Markdown answer workspace.

1. Write an answer and choose **Save draft** or **Submit**.
2. After submission, choose **Export for Codex Review**.
3. Interview OS writes `.codex-reviews/submission-<id>.md` and displays a command such as:

   ```bash
   codex "Review .codex-reviews/submission-<id>.md and write feedback to .codex-reviews/submission-<id>-feedback.md"
   ```

4. Run that command from the repository root.
5. Return to the problem and choose **Import Codex Feedback**.

The review bundle contains the prompt, constraints, rubric, solution outline, common mistakes, follow-ups, answer, and judging instructions. Import reads only the expected feedback filename and stores its Markdown in the local `Submission.reviewFeedback` field. `.codex-reviews/` is gitignored.

This workflow invokes no AI API from the application. You control the local CLI command and can inspect both exchange files.

## Validation

```bash
npx prisma generate
npx prisma db push
npm run validate:seed
npm run lint
npm run typecheck
npm test
npm run build
```

See `PROGRESS.md` for current scope, validated behavior, known limitations, and the recommended next development slice.
