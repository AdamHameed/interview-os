import { debuggingProblems } from "./debugging";
import { dsaProblems } from "./dsa";
import { concurrencyFoundationProblems } from "./concurrency-foundations";
import { cppFoundationProblems } from "./cpp-foundations";
import { cppPerformanceFoundationProblems } from "./cpp-performance-foundations";
import { databasesFoundationProblems } from "./databases-foundations";
import { dockerFoundationProblems } from "./docker-foundations";
import { httpQueuesFoundationProblems } from "./http-queues-foundations";
import { kubernetesFoundationProblems } from "./kubernetes-foundations";
import { dsaDynamicProgrammingProblems } from "./dsa-dynamic-programming";
import { dsaSearchListProblems } from "./dsa-search-lists";
import { dsaStacksTreesProblems } from "./dsa-stacks-trees";
import { dsaTriesBacktrackingProblems } from "./dsa-tries-backtracking";
import { dsaGreedyIntervalsProblems } from "./dsa-greedy-intervals";
import { dsaAdvancedGraphsMathProblems } from "./dsa-advanced-graphs-math";
import { dsaBitManipulationProblems } from "./dsa-bit-manipulation";
import { confidenceWarmupProblems } from "./starter-confidence";
import { learningOverrides } from "./learning-overrides";
import { networkingFoundationProblems } from "./networking-foundations";
import { quantDevFoundationProblems } from "./quant-dev-foundations";
export { learningModules, learningPaths } from "./learning";
import { optimizationProblems } from "./optimization";
import { readCodeProblems } from "./read-code";
import { runnableSystemsProblems } from "./runnable-systems";
import { runnableOverrides } from "./runnable-overrides";
import { starterAiUsageProblems } from "./starter-ai-usage";
import { systemDesignFoundationProblems } from "./system-design-foundations";
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
  ...dsaSearchListProblems,
  ...dsaDynamicProgrammingProblems,
  ...dsaStacksTreesProblems,
  ...dsaTriesBacktrackingProblems,
  ...dsaGreedyIntervalsProblems,
  ...dsaAdvancedGraphsMathProblems,
  ...dsaBitManipulationProblems,
  ...databasesFoundationProblems,
  ...concurrencyFoundationProblems,
  ...networkingFoundationProblems,
  ...systemDesignFoundationProblems,
  ...cppFoundationProblems,
  ...cppPerformanceFoundationProblems,
  ...dockerFoundationProblems,
  ...httpQueuesFoundationProblems,
  ...kubernetesFoundationProblems,
  ...quantDevFoundationProblems,
  ...readCodeProblems,
  ...runnableSystemsProblems,
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
