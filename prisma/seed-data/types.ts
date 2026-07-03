import type { ProblemInput, ResourceInput } from "../../src/lib/schemas";

/**
 * Seed problems are authored as plain TypeScript objects so they are easy to
 * edit, diff, and validate. `SeedProblem` is exactly the shape the Zod schema
 * (and the admin JSON import) accepts — arrays stay arrays here; serialization
 * to SQLite JSON strings happens in prisma/seed.ts.
 */
export type SeedProblem = ProblemInput;
export type SeedResource = ResourceInput;

/** Identity helpers that give full type inference + autocomplete in seed files. */
export function defineProblems(problems: SeedProblem[]): SeedProblem[] {
  return problems;
}

export function defineResources(resources: SeedResource[]): SeedResource[] {
  return resources;
}

export const ORIGINAL_NOTE =
  "Original problem written for Interview OS. Concept-based; no text copied from any external source.";

export const DOCS_INSPIRED_NOTE =
  "Original scenario and wording. Source links reference the underlying public documentation for learning only.";

export const EDU_INSPIRED_NOTE =
  "Original scenario and wording. Source links reference public educational material for learning only.";

export const OSS_INSPIRED_NOTE =
  "Original scenario and wording, inspired by patterns visible in public open-source code. No code copied.";
