# Interview OS — Progress and Handoff

Last updated: 2026-07-03 on branch `codex-stabilize`.

## Current platform

Interview OS is a local-first Next.js 15 study platform using React 19, TypeScript, Tailwind CSS 4, Prisma 6, SQLite, Zod, Monaco, and the existing shadcn/Base UI components.

Working routes now include:

- `/dashboard`
- `/paths`
- `/paths/[slug]`
- `/paths/[slug]/modules/[moduleSlug]`
- `/lessons/[slug]`
- `/problems` and `/problems/[id]`
- `/practice`
- `/ai-usage`
- local submission/save/run/export/import API routes

Existing coding submissions, Python/JavaScript/TypeScript local judging, written-answer storage, and Codex review export/import remain intact.

## Learning-path scaffold

### Data model

- `LearningPath`: stable ID, slug, description, target roles, difficulty, estimated hours, ordering, and publication status.
- `LearningModule`: ordered path relation, prerequisites, outcomes, description, and estimated hours.
- `Lesson`: type, difficulty, duration, Markdown, takeaways, examples, linked problem IDs, public sources, order, and explicit placeholder status.
- `Problem`: optional JSON path/module/lesson IDs plus `warmup | core | challenge | advanced` confidence level.

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

- 36 ordered modules;
- 80 lesson records;
- exactly eight real mini-lessons;
- 72 explicit placeholder lesson briefs (two per module).

The eight real mini-lessons are:

1. Two Sum as a Hashmap Pattern
2. Sliding Window: When It Applies
3. What a Rate Limiter Actually Does
4. Cache Warming and Cache Stampedes
5. How to Structure a System Design Answer
6. Composite Indexes and Query Shape
7. TCP vs UDP for Quant Dev
8. Token-Efficient Debugging Prompts

Placeholder lessons are not disguised as complete content. The UI labels them **Content scaffold**, and each brief tells the next content agent what instructional, example, progression links, and review checklist to add.

### Guided UX

- `/paths` shows role, level, estimated hours, ready-lesson count, linked problems, and derived progress.
- Path pages show module order, “You are here,” start/continue action, weekly plan, and warmup/core/challenge/advanced counts.
- Module pages show prerequisites, outcomes, lesson readiness, ordered study steps, and confidence-graded linked practice.
- Lesson pages render Markdown, takeaways, examples, sources, previous/next navigation, linked practice, and a clear placeholder warning.
- Dashboard includes Continue Learning, active/inferred paths, next lesson, and the existing next-problem recommendations.
- Problem bank filters now include path, module, and confidence level; problem cards and detail pages show their guided placement.
- Practice includes Practice by Path and a dedicated Confidence Builder progression.

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
- path/module/lesson schemas and stable unique IDs;
- unique ordering inside paths and modules;
- either zero placeholders for a completed module or two to three for an incomplete module;
- preservation of at least the eight foundational real mini-lessons;
- linked lesson problem slugs;
- every problem path/module/lesson ID reference.

`prisma/seed.ts` upserts problems first, then paths/modules, resolves lesson problem slugs to database IDs, and upserts lessons without deleting attempts, submissions, or unrelated records.

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

Runtime smoke tests returned HTTP 200 for the path catalog, DSA path, module, real lesson, new runnable warmup, filtered problem bank, dashboard, and practice page. The new pair-sum warmup also passed all public and hidden tests through the existing local runner; its smoke-test submission was removed afterward.

## Known limitations

- Lesson completion and active-path enrollment are derived rather than explicitly stored.
- Most modules intentionally contain only placeholder lesson briefs.
- Several scaffold modules have no linked problem progression yet; the UI states this directly.
- The runner remains unsafe for public/untrusted execution. See `README.md` before changing it.
- Only function-call judging exists; stdin/stdout and custom harness types remain reserved.
- Interviews, resources, and admin sidebar destinations remain unimplemented.
- Prisma still emits the existing `package.json#prisma` deprecation warning.

## What Claude Fable 5 should generate next

Work one module at a time. The best next slice is the first System Design module, **How to Approach Any System Design Interview**:

1. Keep the existing real overview lesson.
2. Replace its two placeholder briefs with reviewed lessons on requirements clarification and interview-time allocation/diagramming.
3. Add three original problems graded warmup, core, and challenge.
4. Link every new problem bidirectionally through lesson slugs and path/module/lesson IDs.
5. Cite public primary or high-quality educational sources.
6. Run every validation command and stop after that single module.

After that, complete the DSA Confidence Builder modules in order, preserving the easy → core → applied-system branch rather than bulk-generating hard problems.

## Recommended next prompt for Claude Fable 5 / Codex

> Read `README.md`, `PROGRESS.md`, `prisma/seed-data/learning.ts`, and `prisma/seed-data/learning-overrides.ts` before editing. Preserve all 92 problems, submissions, local judging, and Codex review flows. Expand exactly one module: `system-design/approach-any-system-design`. Keep the existing real overview lesson; replace that module's two placeholder briefs with concise reviewed lessons on requirements clarification and interview-time allocation/diagramming, then add exactly three original system-design exercises graded warmup/core/challenge and link them to the path, module, and lessons. Do not expand any other module. Use public sources, update documentation/counts, run Prisma generation/push, seed validation, seed, lint, typecheck, tests, and build, then commit only that slice.
