# Interview OS — Progress and Handoff

Last updated: 2026-07-03 on branch `codex-stabilize`.

## Current application

Interview OS is a local-first Next.js 15 application using React 19, TypeScript, Tailwind CSS 4, Prisma 6, SQLite, Zod, Monaco, and the existing shadcn/Base UI components.

Working user routes:

- `/dashboard`
- `/problems`
- `/problems/[id]` (database ID or slug)
- `/practice`
- `/ai-usage`

The bank remains at 80 validated problems. The prior 56-problem bank and 24-problem starter expansion are preserved; no new problem statements were added in the submission/judging slice.

## Submission and judging support

### Data model

- Added `Submission` with answer text, optional language, lifecycle status, JSON test results, self-score, review feedback, timestamps, and a cascading relation to `Problem`.
- Added optional `functionName`, `testHarnessType`, and JSON `supportedLanguages` metadata to `Problem`.
- Extended the authored test-case shape with optional JSON-compatible `args`, `expectedValue`, and `hidden` fields while preserving existing display-only tests.
- Added submission status constants for draft, submitted, passed, failed, reviewed, and needs-retry states.
- SQLite was updated with `npx prisma db push`; no migration history has been introduced yet.

### Problem workspace

- Coding problems show Monaco, Python/JavaScript/TypeScript selection, Run Tests, Save Draft, and Submit actions.
- Test results show pass/fail, public expected and actual values, runtime, stdout, stderr, and errors. Hidden tests redact expected and actual values in the response/UI.
- Written problems show a Markdown textarea, local draft/submit actions, self-score, rubric, post-submission solution reveal, Codex review export/import, and imported feedback.
- The latest local submission is restored when returning to a problem.

### Local runner

- `POST /api/submissions/run` validates input, loads the problem harness, executes each test in a fresh child process, stores results, and returns a submission ID.
- Python uses a generated import/call harness. JavaScript and TypeScript use TypeScript transpilation to CommonJS followed by a generated function-call harness.
- Each test has a three-second timeout, 64 KiB process-output cap, 8,000-character display cap, private temporary working directory, and cleanup in `finally`.
- Python tuples/sets and JavaScript sets are normalized into JSON-compatible output before comparison.
- This is process isolation for trusted local use, not a security sandbox. Submitted code retains the app process's OS permissions and can access the machine or network.

### Codex hybrid review

- `POST /api/submissions/export-review` writes `.codex-reviews/submission-<id>.md` with the problem, rubric, reference material, answer, and judging instructions.
- The UI displays the exact local `codex` command for producing the expected feedback file.
- `POST /api/submissions/import-feedback` reads only `.codex-reviews/submission-<id>-feedback.md`, stores it in `reviewFeedback`, and marks the submission reviewed.
- `.codex-reviews/` is gitignored. The app invokes no AI API and no hosted code runner.

## Runnable seed problems

Eight existing original problems now have executable function-call metadata, with public and hidden tests:

- `clean-request-window`
- `feature-rollout-reachability`
- `maintenance-window-merge`
- `cooldown-task-scheduler`
- `account-merge-shared-emails`
- `migration-batch-sizing`
- `logfmt-parser-spec`
- `feature-flag-evaluator-spec`

Their prompts remain in the original seed modules. Runnable metadata is isolated in `prisma/seed-data/runnable-overrides.ts`. Seed validation now requires every function-call problem to provide a function name, supported languages, structured tests, at least one public test, and at least one hidden test.

## Validation status

The following pass:

```bash
npx prisma generate
npx prisma db push
npm run validate:seed
npm run seed
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` contains four local-runner tests covering Python, captured JavaScript output, TypeScript transpilation, and three-second timeout termination.

Manual API smoke tests also passed for:

- Python, JavaScript, and TypeScript submissions against the same seeded problem;
- persisted pass/fail results;
- written submission creation;
- Codex review bundle export;
- feedback file import and persistence.

## Known limitations and safety boundary

- The runner is unsafe for untrusted or public use. It does not block filesystem, environment, network, subprocess, or system-call access.
- A deployed version must disable execution or use a separately secured Docker/VM sandbox, Judge0, Piston, or another purpose-built runner.
- Hidden tests are not secret from a local repository owner; they are only hidden in normal result presentation.
- Only `function_call` harnesses are implemented. Schema values for `stdin_stdout` and `custom` are reserved for later work.
- Every run currently creates a new submission record. Draft/submit updates reuse the current submission selected in the workspace.
- Import marks feedback as reviewed but does not parse a Codex verdict into `needs_retry` or a numeric score.
- Prisma still emits the existing `package.json#prisma` deprecation warning.
- Interviews, resources, and admin sidebar destinations remain unimplemented.

## Recommended next steps

1. Add tests for submission route validation, review path handling, and database persistence using a disposable test database.
2. Add a submission-history view and allow selecting prior runs/drafts instead of restoring only the latest.
3. Decide whether Codex feedback should use a small machine-readable frontmatter block for verdict and score import.
4. Add abort controls and stronger process-tree cleanup before expanding runner usage.
5. Implement `stdin_stdout` only when a concrete problem requires it; do not add generic harness complexity speculatively.
6. Keep code execution disabled in any public deployment until a real sandbox is designed and threat-modeled.

## Recommended next prompt for Claude Fable 5 / Codex

> Continue from the current Interview OS repository and read `README.md` and `PROGRESS.md` before editing. Preserve the 80-problem bank, Submission schema, local runner APIs, Codex file review workflow, and eight runnable problem overlays. Do not add paid APIs, hosted runners, more problem content, or a public execution path. Implement one narrow reliability slice: add API/database tests for submission save/run/export/import using a disposable SQLite database, add a submission-history panel on `/problems/[id]`, and improve child-process-tree cancellation without claiming the runner is a secure sandbox. Run Prisma generation, seed validation, lint, typecheck, tests, and build; document and commit only that slice.
