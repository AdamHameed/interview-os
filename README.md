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

## Learning paths and lessons

Interview OS organizes study into `LearningPath → LearningModule → Lesson → Problem` progressions. Visit `/paths` to choose a role-oriented sequence, then move through ready mini-lessons and explicitly marked lesson scaffolds. Problems may belong to multiple paths and carry a confidence level: `warmup`, `core`, `challenge`, or `advanced`.

The initial scaffold contains six paths, 36 modules, eight real mini-lessons, and two placeholder lesson briefs per module. Placeholder content is intentionally visible as a scaffold; it should be expanded and reviewed before being marked complete.

### Add a path

1. Add a path specification to `PATH_SPECS` in `prisma/seed-data/learning.ts`.
2. Use a unique kebab-case slug, supported target roles from `src/lib/enums.ts`, ordered module specifications, and a realistic estimated-hour total.
3. `learningPathId(slug)` creates the stable database ID used by problem metadata.

### Add a module

1. Add its slug and title to the parent path's `modules` array in `prisma/seed-data/learning.ts`.
2. The scaffold generator supplies stable IDs, order, prerequisite chaining, outcomes, and two placeholder lessons.
3. Use `learningModuleId(pathSlug, moduleSlug)` when linking problems.

### Add or complete a lesson

1. Add a real lesson to `REAL_LESSONS` under the key `path-slug/module-slug`.
2. Include concise Markdown, takeaways, examples, public sources, and linked problem slugs.
3. Set `isPlaceholder: false` only after the instructional is genuinely useful and reviewed.
4. Leave generated placeholder records intact until their replacements exist; the seed validator accepts two or three briefs for an incomplete module and zero for a completed module.

### Link lessons and problems

- New problems can declare `pathIds`, `moduleIds`, `lessonIds`, and `confidenceLevel` directly.
- Existing problems receive non-destructive metadata in `prisma/seed-data/learning-overrides.ts`.
- Lesson records use `linkedProblemSlugs`; `prisma/seed.ts` resolves those slugs to real problem IDs after problem upserts.
- Run `npm run validate:seed` to catch unknown IDs, missing linked problems, duplicate lesson/module ordering, or removal of the foundational real-lesson set.

The next content-generation pass should deepen one module at a time: replace its two placeholder briefs with reviewed instructionals, add or link one warmup/core/challenge sequence, validate sources, and stop before moving to another module. Do not bulk-generate every lesson in one pass.

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

Eight existing problems plus four new DSA confidence warmups currently have runnable function-call tests. Existing executable metadata is isolated in `prisma/seed-data/runnable-overrides.ts`; the new warmups carry their metadata directly.

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
