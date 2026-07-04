import type { SeedProblem } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

type LearningMetadata = Pick<
  SeedProblem,
  "pathIds" | "moduleIds" | "lessonIds" | "confidenceLevel"
>;

const path = learningPathId;
const moduleId = learningModuleId;

export const learningOverrides: Record<string, LearningMetadata> = {
  "clean-request-window": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("dsa-confidence-builder", "sliding-window-prefix-sums")],
    lessonIds: [lessonId(moduleId("dsa-confidence-builder", "sliding-window-prefix-sums"), "sliding-window-when-it-applies")],
    confidenceLevel: "core",
  },
  "maintenance-window-merge": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("dsa-confidence-builder", "arrays-hashmaps-two-pointers")],
    lessonIds: [],
    confidenceLevel: "warmup",
  },
  "top-k-failing-endpoints": {
    pathIds: [path("dsa-confidence-builder"), path("backend-swe")],
    moduleIds: [moduleId("dsa-confidence-builder", "stacks-queues-heaps")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "feature-rollout-reachability": {
    pathIds: [path("dsa-confidence-builder"), path("infrastructure-swe")],
    moduleIds: [moduleId("dsa-confidence-builder", "trees-graphs")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "migration-batch-sizing": {
    pathIds: [path("dsa-confidence-builder"), path("backend-swe")],
    moduleIds: [moduleId("dsa-confidence-builder", "dsa-to-real-systems"), moduleId("reliability-backpressure")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "token-bucket-limiter-spec": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("rate-limiting")],
    lessonIds: [lessonId(moduleId("rate-limiting"), "what-rate-limiter-does")],
    confidenceLevel: "core",
  },
  "sliding-window-rate-check": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("rate-limiting")],
    lessonIds: [lessonId(moduleId("rate-limiting"), "what-rate-limiter-does")],
    confidenceLevel: "challenge",
  },
  "missing-composite-index-orders": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("composite-indexes")],
    lessonIds: [lessonId(moduleId("composite-indexes"), "composite-indexes-query-shape")],
    confidenceLevel: "challenge",
  },
  "cache-stampede-product-page": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("caching-strategies")],
    lessonIds: [lessonId(moduleId("caching-strategies"), "cache-warming-stampedes")],
    confidenceLevel: "challenge",
  },
  "outbox-publisher-marks-before-send": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("queues-workers")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "cpp-moved-handle-double-close": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("raii-resource-ownership"), moduleId("move-semantics")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "multicast-gap-recovery-design": {
    pathIds: [path("quant-dev"), path("infrastructure-swe")],
    moduleIds: [moduleId("tcp-vs-udp"), moduleId("market-data-feeds")],
    lessonIds: [lessonId(moduleId("tcp-vs-udp"), "tcp-vs-udp-backend-quant")],
    confidenceLevel: "core",
  },
  "order-book-sequence-state-machine": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("order-books")],
    lessonIds: [lessonId(moduleId("tcp-vs-udp"), "tcp-vs-udp-backend-quant")],
    confidenceLevel: "challenge",
  },
  "lock-contention-session-map": {
    pathIds: [path("quant-dev"), path("infrastructure-swe")],
    moduleIds: [moduleId("concurrency-for-quant-dev"), moduleId("threading-synchronization")],
    lessonIds: [],
    confidenceLevel: "advanced",
  },
  "ai-token-efficient-repo-task": {
    pathIds: [path("ai-efficient-engineer")],
    moduleIds: [moduleId("ai-efficient-engineer", "token-efficient-prompting")],
    lessonIds: [lessonId(moduleId("ai-efficient-engineer", "token-efficient-prompting"), "token-efficient-debugging-prompts")],
    confidenceLevel: "core",
  },
  "ai-select-files-for-timeout-fix": {
    pathIds: [path("ai-efficient-engineer")],
    moduleIds: [moduleId("ai-efficient-engineer", "selecting-repo-context")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "ai-hallucinated-sdk-review": {
    pathIds: [path("ai-efficient-engineer")],
    moduleIds: [moduleId("ai-efficient-engineer", "reviewing-ai-code")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "ai-tests-before-acceptance": {
    pathIds: [path("ai-efficient-engineer")],
    moduleIds: [moduleId("ai-efficient-engineer", "testing-verification")],
    lessonIds: [],
    confidenceLevel: "core",
  },
};
