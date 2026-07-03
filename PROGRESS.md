# Interview OS — Progress and Handoff

Last updated: 2026-07-03 on branch `codex-stabilize`.

## Current state

Interview OS is a Next.js 15 App Router application using React 19, TypeScript, Tailwind CSS 4, Prisma 6, SQLite, Zod, and the existing shadcn/Base UI component set. The repository keeps enum-like values in `src/lib/enums.ts`, validates write input with `src/lib/schemas.ts`, and serializes SQLite JSON columns at the Prisma boundary.

The application now has working routes for:

- `/dashboard`
- `/problems`
- `/problems/[id]` (accepts either a database ID or problem slug)
- `/practice`
- `/ai-usage`

The existing sidebar also links to interviews, resources, and admin routes that are not implemented yet.

## UX improvements completed

### Dashboard

- Shows total, attempted, solved, and needs-review counts.
- Shows bank and solved coverage by populated interview format.
- Uses existing stats helpers for weak topics, review counts, and next-problem recommendations.
- Recommends practice modes with the lowest solved coverage.
- Provides quick tracks for Backend SWE, Infrastructure SWE, Quant Dev, and AI Usage.

### Problem bank

- Search covers title, slug, topics, and prompt text.
- Shareable URL filters cover type, difficulty, target role, topic, attempt status, and maximum duration.
- Cards show type and difficulty badges, estimated time, topic tags, target roles, source provenance, quality score, and attempt status.
- Empty results have a clear recovery state.

### Problem detail

- Separates prompt, constraints, starter code, hints, solution outline, mistakes, follow-ups, rubric, topics, attempt status, and provenance.
- Hints reveal independently with native accessible disclosure controls.
- Solution outlines are hidden until explicitly revealed.
- Displays latest attempt status and notes when an attempt exists. Editing is intentionally deferred because no attempt write flow existed before this slice.
- Source links open directly, and original-content license notes remain visible.

### Practice and AI usage

- Practice cards cover DSA, read-code, debugging, optimization, system design, quant-dev, and AI-usage rounds, with live problem counts and filtered-bank links.
- AI Usage is now a structured guide to token-efficient prompting, repository context selection, code review, hallucination detection, test-first acceptance, and interview-rule boundaries.

## Problem bank

The bank contains 80 validated problems: the original 56 plus exactly 24 new starter problems. Existing seed records were not rewritten.

New additions are isolated in six auditable modules:

- `starter-read-code.ts`: 4
- `starter-debugging.ts`: 4
- `starter-optimization.ts`: 4
- `starter-quant-dev.ts`: 4
- `starter-databases.ts`: 4
- `starter-ai-usage.ts`: 4

The new scenarios use original wording and public concepts. They cover language semantics, resource ownership, delivery guarantees, leases, streaming proxies, regex complexity, pagination, fanout, batching, hashing, RAII, market-data recovery, transaction anomalies, deadlocks, idempotency, MVCC, context selection, hallucinated APIs, and test-driven AI review. No proprietary or paid-platform problem statements were used.

Current totals by type:

- DSA: 16
- Read code: 14
- Write code: 10
- Debugging: 14
- Optimization: 14
- Quant dev: 4
- Databases: 4
- AI usage: 4

Do not expand to the full 120-problem target yet.

## Validation status

These commands pass:

```bash
npm run validate:seed
npm run seed
npm run lint
npm run typecheck
npm run build
```

Seed validation reports 80 valid, uniquely slugged problems. A local development-server smoke test returned HTTP 200 for the dashboard, filtered problem bank, a seeded problem detail, practice, and AI usage routes.

`npm test` still exits with code 1 because the repository has no test files. This is the most important remaining stability gap; do not hide it with a pass-with-no-tests flag.

Prisma 6 also prints a non-blocking deprecation warning for `package.json#prisma`. Migrate to `prisma.config.ts` only as part of a deliberate Prisma upgrade.

## Recommended next steps

1. Add focused unit tests for `src/lib/interview-select.ts`, `src/lib/stats.ts`, filtering/hydration, and seed validation.
2. Add a narrow attempt write flow for status, notes, score, and time spent, validated with the existing Zod schema. Then connect it to the detail page.
3. Add an error boundary/loading states for dynamic Prisma routes.
4. Implement mock interviews and resources as separate vertical slices; do not build all remaining sidebar destinations at once.
5. Add system-design content only after the attempt workflow and tests are stable.
6. Replace the generic create-next-app README with local setup and architecture notes.

Fresh setup:

```bash
npm install
npx prisma generate
npx prisma db push
npm run validate:seed
npm run seed
npm run dev
```

Before handoff:

```bash
npm run validate:seed
npm run lint
npm run typecheck
npm test
npm run build
```

## Recommended next prompt for Claude Fable 5 / Codex

> Continue from the current Interview OS repository and read `PROGRESS.md` before editing. Preserve the existing architecture, 80 validated seed problems, seed validator, and completed dashboard/problem/practice/AI routes. Do not restart the project and do not expand toward 120 problems. Implement one narrow reliability slice: add real unit tests for the existing pure stats, interview-selection, problem-filtering, and seed-validation logic, then add a Zod-validated attempt status/notes/self-score write flow to `/problems/[id]`. Reuse the current Prisma model and UI components. Run seed validation, lint, typecheck, tests, and production build; document remaining failures and commit only that slice.
