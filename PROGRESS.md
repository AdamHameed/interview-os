# Interview OS — Progress and Handoff

Last updated: 2026-07-03 on branch `codex-stabilize`.

## Current platform

Interview OS is a local-first Next.js 15 study platform using React 19, TypeScript, Tailwind CSS 4, Prisma 6, SQLite, Zod, Monaco, and the existing shadcn/Base UI components.

Working routes now include:

- `/dashboard`
- `/paths`
- `/paths/[slug]`
- `/modules`
- `/modules/[slug]`
- `/paths/[slug]/modules/[moduleSlug]` (compatibility redirect)
- `/lessons/[slug]`
- `/problems` and `/problems/[id]`
- `/practice`
- `/ai-usage`
- local submission/save/run/export/import API routes

Existing coding submissions, Python/JavaScript/TypeScript local judging, written-answer storage, and Codex review export/import remain intact.

## Modular curriculum scaffold

### Data model

- `LearningPath`: stable ID, slug, description, target roles, difficulty, estimated hours, ordering, and publication status.
- `LearningModule`: first-class global topic with a unique slug, category, difficulty, prerequisites by module slug, outcomes, sources, publication status, and explicit placeholder status.
- `LearningPathModule`: reusable many-to-many path membership with path-specific order, required/optional status, and a progression label.
- `Lesson`: type, difficulty, duration, Markdown, takeaways, examples, linked problem IDs, public sources, order, and explicit placeholder status.
- `Problem`: optional JSON path/global-module/lesson IDs plus `warmup | core | challenge | advanced` confidence level.

Paths are curated collections rather than ownership boundaries. A module may be shared by Backend, Infrastructure, Quant, or System Design paths, and every published module remains directly accessible through `/modules/[slug]`.

No user/enrollment model was added. Progress is currently derived from solved attempts and passed/reviewed submissions against problems linked to a path. This preserves the existing single-user local architecture and leaves lesson-completion persistence for a later focused slice.

### Seeded structure

Six published paths are available:

1. DSA Confidence Builder
2. Backend SWE Path
3. Infrastructure SWE Path
4. System Design Path
5. Quant Dev Path
6. AI-Efficient Engineer Path

Together they contain:

- 69 standalone modules across DSA, Docker, Kubernetes, operating systems, networking, C++, Python, databases, caching, backend/system design, quant development, and AI usage;
- 53 ordered path memberships, including modules reused across multiple paths;
- 151 lesson records;
- 13 real mini-lessons;
- 138 explicit placeholder lesson briefs.

This pass added six requested ready module topics while preserving the previous useful instructionals:

1. Docker Image Layers and Why They Matter
2. Kubernetes Pods vs Deployments vs Services
3. Processes vs Threads
4. Page Tables and Virtual Memory
5. C++ RAII in Interviews
6. TCP vs UDP for Backend and Quant Dev

Placeholder lessons are not disguised as complete content. The UI labels them **Content scaffold**, and each brief tells the next content agent what instructional, example, progression links, and review checklist to add.

### Guided and direct-access UX

- `/paths` shows role, level, estimated hours, ready-lesson count, linked problems, and derived progress.
- Path pages show reusable module cards in curated order; every card links to the standalone module page.
- `/modules` provides search and filters for category, difficulty, target role, estimated time, and ready/scaffold content.
- Standalone module pages show prerequisites, outcomes, ordered lessons, confidence-grouped problems, paths that reuse the module, related modules, sources, and an interview-cram checklist.
- Lesson pages render Markdown, takeaways, examples, sources, previous/next navigation, linked practice, and a clear placeholder warning.
- Dashboard includes Continue Learning, a Browse Modules entry point, and quick interview-cram cards for Kubernetes, Docker, threading, C++, databases, system design, quant, and AI usage.
- Problem bank filters now include path, module, and confidence level; problem cards and detail pages show their guided placement.
- Practice includes Practice by Path, Practice by Module, and the dedicated Confidence Builder progression.

## Confidence-building problems

The bank now contains 92 validated problems: the previous 80 plus exactly 12 original easy warmups.

- Four runnable DSA warmups: pair sum, unique sliding window, balanced brackets, and graph reachability.
- Two debugging warmups: boolean environment parsing and missing `await`.
- Two optimization warmups: set membership and HTTP client reuse.
- Two database warmups: composite index selection and uniqueness races.
- Two AI-usage warmups: debugging prompt structure and hallucinated configuration verification.

The four DSA warmups support Python, JavaScript, and TypeScript with public and hidden tests. Combined with the existing eight runnable overlays, 12 coding problems now support local function-call judging.

Existing higher-level problems receive learning metadata through `prisma/seed-data/learning-overrides.ts`; their authored problem content was not overwritten.

## Seed integrity

`npm run validate:seed` now checks:

- all existing problem schema, provenance, duplicate-slug, placeholder, and runnable-test rules;
- standalone module, path-membership, and lesson schemas with stable unique IDs;
- unique ordering and module membership inside each path;
- prerequisite module slugs and path references;
- either zero placeholders for a completed module or two to three for an incomplete module;
- preservation of at least the eight foundational real mini-lessons;
- linked lesson problem slugs;
- every problem path/module/lesson ID reference.

`prisma/seed.ts` upserts problems first, rebuilds only the curated path/module membership scaffold, resolves lesson problem slugs to database IDs, and upserts lessons. Existing submissions were preserved through the schema change.

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

Runtime smoke tests returned HTTP 200 for the module catalog, all six new real-lesson module pages, Backend and Quant path pages, dashboard, practice, and the problem bank. The legacy nested path/module URL returned a 307 redirect to its standalone module URL.

## Known limitations

- Lesson completion and active-path enrollment are derived rather than explicitly stored.
- Most modules intentionally contain only placeholder lesson briefs.
- Many new standalone modules have no linked problem progression yet; confidence-level slots make this content gap explicit.
- Module target-role filtering is derived from the published paths that include a module; standalone-only role metadata is not modeled yet.
- The runner remains unsafe for public/untrusted execution. See `README.md` before changing it.
- Only function-call judging exists; stdin/stdout and custom harness types remain reserved.
- Interviews, resources, and admin sidebar destinations remain unimplemented.
- Prisma still emits the existing `package.json#prisma` deprecation warning.

## What Claude Fable 5 should generate next

Expand content in small, reviewed batches while maintaining a curriculum coverage matrix. The long-term curriculum must include varied difficulties and problem formats across DSA, backend, infrastructure, databases, debugging, optimization, system design, quant development, networking/OS/concurrency, and effective AI usage.

The DSA Confidence Builder must remain a complete standalone interview path, not merely an introduction to systems topics. Its target breadth should be comparable to a strong "150"-style algorithms roadmap while using entirely original prompts. Cover arrays and hashing, two pointers, sliding windows, stacks, binary search, linked lists, trees/BSTs, tries, heaps/priority queues, backtracking, graphs, advanced graphs, one- and two-dimensional dynamic programming, greedy algorithms, intervals, bit manipulation, and math/geometry. Scaffold missing modules before filling them, and give each major pattern a warmup entry point followed by core, challenge, and applied variants.

Problem format should follow the skill being trained:

- DSA and implementation problems: clear signatures, constraints, examples, starter code, and public/hidden tests when supported.
- Optimization problems: usually provide working but inefficient code, SQL, query plans, or system behavior for the learner to improve, including the baseline, target, constraints, and behavior that must be preserved.
- Debugging and read-code problems: provide realistic code, failing tests, logs, traces, or symptoms to diagnose and fix.
- System-design problems: provide an open-ended scenario, requirements, traffic/scale assumptions, ambiguities, rubric, trade-off prompts, and follow-ups; do not force them into an artificial code harness.
- Database, quant, backend, infrastructure, and AI-usage problems: mix implementation, analysis, debugging, and design formats according to realistic interviews.

Every problem should strengthen interview performance rather than add trivia. State why the skill is tested, make evaluation criteria concrete, include common mistakes and follow-ups, and support a timed practice flow. Keep easy problems genuinely easy so learners can build confidence, while retaining meaningful medium, hard, and advanced work.

For the next implementation slice, first audit the DSA module coverage and add only the missing module scaffolds. Then deepen no more than two related DSA modules and one applied module, using a balanced warmup → core → challenge progression. Do not attempt the entire roadmap in one generation pass.

## Recommended next prompt for Claude Fable 5 / Codex

> Read `README.md`, `PROGRESS.md`, `prisma/schema.prisma`, `prisma/seed-data/learning.ts`, `prisma/seed-data/learning-overrides.ts`, and the existing problem seed files before editing. Preserve all existing problems, learning paths, submissions, local judging, and Codex review flows. Do not restart or broadly re-architect the app.
>
> Build Interview OS into a rigorous interview-preparation curriculum with varied difficulty, topic coverage, and exercise formats. DSA must remain a strong standalone path comparable in breadth and progression to a high-quality "150"-style algorithms roadmap, while every prompt and explanation must be original: do not copy or closely paraphrase LeetCode, NeetCode, paid courses, or proprietary interview banks. Ensure the roadmap covers arrays/hashing, two pointers, sliding windows, stacks, binary search, linked lists, trees/BSTs, tries, heaps, backtracking, graphs and advanced graphs, 1-D and 2-D dynamic programming, greedy algorithms, intervals, bit manipulation, and math/geometry. Add genuinely easy confidence-building entry problems as well as medium, hard, and advanced variants; do not let systems content displace algorithm practice.
>
> Use the exercise format that best matches the interview skill. DSA and implementation exercises should have clear function contracts, constraints, starter code, and runnable public/hidden tests where the current local harness supports them. Optimization exercises should often give the learner correct but inefficient code, SQL, a query plan, or a bottlenecked design to improve; specify the baseline complexity or behavior, the required target, constraints, and behavior that must remain unchanged. Debugging and read-code exercises should include realistic code, logs, traces, symptoms, or failing tests. System-design exercises should be descriptive, open-ended scenarios with functional and non-functional requirements, scale assumptions, ambiguity to clarify, rubrics, trade-off questions, and follow-ups rather than artificial test cases. Database, backend, infrastructure, quant, networking/OS/concurrency, and AI-usage exercises should mix implementation, diagnosis, analysis, and design in ways that resemble real interviews.
>
> Every new problem must have a clear interview purpose, realistic constraints, calibrated difficulty, estimated time, useful hints, a solution outline, common mistakes, follow-up questions, a concrete rubric, and public primary or high-quality educational sources or an original-content note. Prefer depth and reviewability over volume. Maintain warmup → core → challenge → advanced progressions and show how algorithm skills branch into backend, quant, optimization, and system-design applications.
>
> For this pass only: audit the DSA path against the topic list above; scaffold missing modules and placeholder lessons without writing the entire curriculum; then fully improve no more than two related DSA modules and one applied module. Add a small, balanced set of original problems across multiple difficulties and at least three exercise formats. Do not generate the full roadmap or a huge problem batch. Link problems bidirectionally through path/module/lesson metadata, update README and PROGRESS coverage notes and counts, run Prisma generation/database push, seed validation, seed, lint, typecheck, tests, and build, and commit only this bounded slice. Document exactly which topics and difficulty levels remain for later passes.
