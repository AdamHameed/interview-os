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
    moduleIds: [moduleId("dsa-confidence-builder", "dsa-to-real-systems"), moduleId("backend-swe", "scaling-backend-services")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "token-bucket-limiter-spec": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("backend-swe", "http-apis-request-flow"), moduleId("system-design", "caching-rate-limiting")],
    lessonIds: [lessonId(moduleId("backend-swe", "http-apis-request-flow"), "what-rate-limiter-does")],
    confidenceLevel: "core",
  },
  "sliding-window-rate-check": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("backend-swe", "http-apis-request-flow"), moduleId("system-design", "caching-rate-limiting")],
    lessonIds: [lessonId(moduleId("backend-swe", "http-apis-request-flow"), "what-rate-limiter-does")],
    confidenceLevel: "challenge",
  },
  "missing-composite-index-orders": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("backend-swe", "databases-indexes"), moduleId("system-design", "databases-replication-sharding")],
    lessonIds: [lessonId(moduleId("backend-swe", "databases-indexes"), "composite-indexes-query-shape")],
    confidenceLevel: "challenge",
  },
  "cache-stampede-product-page": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("backend-swe", "caching-redis"), moduleId("system-design", "caching-rate-limiting")],
    lessonIds: [lessonId(moduleId("backend-swe", "caching-redis"), "cache-warming-stampedes")],
    confidenceLevel: "challenge",
  },
  "outbox-publisher-marks-before-send": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("backend-swe", "queues-background-jobs"), moduleId("system-design", "queues-streams-workers")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "cpp-moved-handle-double-close": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("quant-dev", "python-cpp-knowledge")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "multicast-gap-recovery-design": {
    pathIds: [path("quant-dev"), path("infrastructure-swe")],
    moduleIds: [moduleId("quant-dev", "linux-os-networking"), moduleId("quant-dev", "market-data-order-books")],
    lessonIds: [lessonId(moduleId("quant-dev", "linux-os-networking"), "tcp-vs-udp-quant")],
    confidenceLevel: "core",
  },
  "order-book-sequence-state-machine": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("quant-dev", "market-data-order-books")],
    lessonIds: [lessonId(moduleId("quant-dev", "linux-os-networking"), "tcp-vs-udp-quant")],
    confidenceLevel: "challenge",
  },
  "lock-contention-session-map": {
    pathIds: [path("quant-dev"), path("infrastructure-swe")],
    moduleIds: [moduleId("quant-dev", "concurrency-low-latency"), moduleId("infrastructure-swe", "concurrency-synchronization")],
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
