import { debuggingProblems } from "./debugging";
import { dsaProblems } from "./dsa";
import { optimizationProblems } from "./optimization";
import { readCodeProblems } from "./read-code";
import type { SeedProblem } from "./types";
import { writeCodeProblems } from "./write-code";

/**
 * The complete seed bank currently checked into the repository.
 * Keep this explicit so a missing seed module is visible in review.
 */
export const allProblems: SeedProblem[] = [
  ...dsaProblems,
  ...readCodeProblems,
  ...writeCodeProblems,
  ...debuggingProblems,
  ...optimizationProblems,
];
