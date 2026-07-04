import { debuggingProblems } from "./debugging";
import { dsaProblems } from "./dsa";
import { confidenceWarmupProblems } from "./starter-confidence";
import { learningOverrides } from "./learning-overrides";
export { learningPaths } from "./learning";
import { optimizationProblems } from "./optimization";
import { readCodeProblems } from "./read-code";
import { runnableOverrides } from "./runnable-overrides";
import { starterAiUsageProblems } from "./starter-ai-usage";
import { starterDatabaseProblems } from "./starter-databases";
import { starterDebuggingProblems } from "./starter-debugging";
import { starterOptimizationProblems } from "./starter-optimization";
import { starterQuantDevProblems } from "./starter-quant-dev";
import { starterReadCodeProblems } from "./starter-read-code";
import type { SeedProblem } from "./types";
import { writeCodeProblems } from "./write-code";

/**
 * The complete seed bank currently checked into the repository.
 * Keep this explicit so a missing seed module is visible in review.
 */
const authoredProblems: SeedProblem[] = [
  ...dsaProblems,
  ...readCodeProblems,
  ...writeCodeProblems,
  ...debuggingProblems,
  ...optimizationProblems,
  ...starterReadCodeProblems,
  ...starterDebuggingProblems,
  ...starterOptimizationProblems,
  ...starterQuantDevProblems,
  ...starterDatabaseProblems,
  ...starterAiUsageProblems,
  ...confidenceWarmupProblems,
];

export const allProblems: SeedProblem[] = authoredProblems.map((problem) => ({
  ...problem,
  ...runnableOverrides[problem.slug],
  ...learningOverrides[problem.slug],
}));
