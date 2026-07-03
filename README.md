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

Eight existing problems currently have runnable function-call tests. Their executable metadata is isolated in `prisma/seed-data/runnable-overrides.ts`.

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
