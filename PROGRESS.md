# Interview OS — Stabilization Handoff

Last stabilized: 2026-07-03 on branch `codex-stabilize`.

## What exists

- Next.js 15 App Router project with React 19, TypeScript, Tailwind CSS 4, and shadcn/Base UI components.
- A shared app shell in `src/app/layout.tsx`: theme provider, responsive sidebar, top bar, command palette, and toast provider.
- Prisma 6 with a SQLite schema for problems, attempts, resources, and mock interviews.
- Zod write-boundary schemas plus enum definitions and JSON serialization helpers in `src/lib`.
- Pure helpers for problem filtering/hydration, interview selection, dashboard statistics, readiness, review queues, and recommendations.
- 56 authored seed problems. The bank intentionally remains partial:
  - 16 DSA
  - 10 read-code
  - 10 write-code
  - 10 debugging
  - 10 optimization
- Shared UI primitives and app-level components under `src/components`.

## What was fixed during stabilization

- Added the missing `prisma/seed.ts` runner. It validates every problem with Zod, serializes array/object fields for SQLite, and uses slug-based upserts so rerunning it does not delete attempts or unrelated database records.
- Added `prisma/seed-data/index.ts` as the explicit source of truth for included seed modules.
- Added `scripts/validate-seed.ts`. It checks Zod validity, duplicate slugs, and obvious unfinished placeholder text, and prints a per-type inventory.
- Added the required `seed` package script and retained `db:seed` as a compatible alias.
- Removed an unused seed-data import that caused the only lint warning.
- Inspected the app layout, pages, components, schema, library modules, and all seed modules. No remaining interrupted TypeScript/JSX syntax or broken imports were found.
- Kept the existing 56-problem bank unchanged; no new problem content was generated.

## Validation results

The following commands pass:

```bash
npx prisma generate
npm run validate:seed
npm run seed
npm run lint
npm run typecheck
npm run build
```

`npm run validate:seed` reports all 56 records valid. `npm run seed` successfully upserts all 56 records. The production build completes successfully.

`npm install` was not rerun during stabilization because `node_modules` and the lockfile were already present and usable.

## What is still incomplete or failing

- `npm test` exits with code 1 because there are no test files yet. Vitest itself starts correctly.
- Only `/` exists, and it redirects to `/dashboard`; `/dashboard` has not been implemented. The production build passes, but visiting the app currently lands on a 404 after that redirect.
- Sidebar and command-menu destinations are planned links only. Dashboard, problem list/detail, practice, interviews, resources, AI usage, and admin routes are not implemented.
- There are no server actions/API handlers or CRUD forms wired to Prisma yet.
- Seven planned problem types have no seed modules yet: system design, low-level design, quant dev, databases, OS/networking/concurrency, AI usage, and behavioral. Do not expand toward 120 problems until the core UI flow is working and tested.
- Prisma prints a deprecation warning for the `package.json#prisma` seed configuration. It still works in Prisma 6; migration to `prisma.config.ts` can wait until a deliberate Prisma 7 upgrade.
- `README.md` is still the generic create-next-app README.

## Exact next steps

1. Add focused unit tests for `src/lib/interview-select.ts`, `src/lib/stats.ts`, and seed validation. Make `npm test` pass with real tests rather than suppressing the no-tests exit.
2. Implement `/dashboard` first so the existing `/` redirect has a valid destination. Use the existing stats helpers; do not invent a second scoring model in the page.
3. Implement `/problems` and `/problems/[slug]` using `hydrateProblem`, then verify the 56 seeded records can be browsed end to end.
4. Add attempt creation/update as the first write flow. Preserve Zod validation at the write boundary.
5. Implement remaining routes incrementally, running lint, typecheck, tests, and build after each coherent slice.
6. Only after the browse/practice/attempt flows are stable, add the remaining problem categories and expand the bank toward 120.
7. Replace the generic README with setup and architecture notes once the first end-to-end flow exists.

Fresh local setup:

```bash
npm install
npx prisma generate
npx prisma db push
npm run validate:seed
npm run seed
npm run dev
```

Before every handoff:

```bash
npm run validate:seed
npm run lint
npm run typecheck
npm test
npm run build
```

## Recommended next prompt for Claude/Codex

> Continue from the current Interview OS repository and read `PROGRESS.md` first. Do not restart or rewrite the app, and do not expand the problem bank. Implement the next narrow vertical slice: add real unit tests for the existing pure helpers, then build a `/dashboard` page backed by Prisma and the existing `src/lib/stats.ts` functions so the `/` redirect no longer lands on a 404. Preserve the current schema, seed runner, validator, app shell, and useful components. Run `npm run validate:seed`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; document any remaining failures and commit only that slice.
