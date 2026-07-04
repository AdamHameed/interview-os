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
    moduleIds: [moduleId("dsa-confidence-builder", "arrays-hashmaps-two-pointers"), moduleId("intervals")],
    lessonIds: [],
    confidenceLevel: "warmup",
  },
  "rolling-window-max-latency": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("stacks-queues-heaps")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "cooldown-task-scheduler": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("stacks-queues-heaps")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "log-topk-full-sort": {
    pathIds: [path("dsa-confidence-builder"), path("backend-swe")],
    moduleIds: [moduleId("stacks-queues-heaps"), moduleId("observability")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "account-merge-shared-emails": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("trees-graphs")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "surge-aware-shortest-path": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("advanced-graphs")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "cli-autocomplete-trie": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("tries")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "oncall-coverage-bitmask": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("bit-manipulation"), moduleId("dynamic-programming-basics")],
    lessonIds: [],
    confidenceLevel: "advanced",
  },
  "ttl-lru-session-cache": {
    pathIds: [path("dsa-confidence-builder"), path("backend-swe")],
    moduleIds: [moduleId("dsa-to-real-systems")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "log-template-dedup": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("dsa-to-real-systems")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "mini-matching-engine": {
    pathIds: [path("dsa-confidence-builder"), path("quant-dev")],
    moduleIds: [moduleId("dsa-to-real-systems"), moduleId("order-books")],
    lessonIds: [],
    confidenceLevel: "advanced",
  },
  "order-book-imbalance-window": {
    pathIds: [path("dsa-confidence-builder"), path("quant-dev")],
    moduleIds: [moduleId("dsa-to-real-systems"), moduleId("order-books")],
    lessonIds: [],
    confidenceLevel: "core",
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
  "cancelled-request-connection-leak": {
    pathIds: [path("infrastructure-swe"), path("backend-swe")],
    moduleIds: [moduleId("sockets-connection-lifecycle")],
    lessonIds: [lessonId(moduleId("sockets-connection-lifecycle"), "where-connections-leak")],
    confidenceLevel: "core",
  },
  "shared-counter-undercounts": {
    pathIds: [path("infrastructure-swe")],
    moduleIds: [moduleId("threading-synchronization")],
    lessonIds: [lessonId(moduleId("threading-synchronization"), "lost-increment-walkthrough")],
    confidenceLevel: "warmup",
  },
  "flaky-test-global-state": {
    pathIds: [path("infrastructure-swe")],
    moduleIds: [moduleId("threading-synchronization")],
    lessonIds: [lessonId(moduleId("threading-synchronization"), "lost-increment-walkthrough")],
    confidenceLevel: "core",
  },
  "sql-lost-update-balance": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("transactions-isolation")],
    lessonIds: [lessonId(moduleId("transactions-isolation"), "lost-update-walkthrough")],
    confidenceLevel: "core",
  },
  "snapshot-isolation-write-skew-oncall": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("transactions-isolation")],
    lessonIds: [lessonId(moduleId("transactions-isolation"), "isolation-levels-anomalies")],
    confidenceLevel: "challenge",
  },
  "account-transfer-deadlock-order": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("transactions-isolation"), moduleId("database-deadlocks-idempotency")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "webhook-idempotency-transaction-boundary": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("database-deadlocks-idempotency")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "long-snapshot-vacuum-bloat": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("transactions-isolation"), moduleId("query-plans")],
    lessonIds: [],
    confidenceLevel: "advanced",
  },
  "timeout-double-charge": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("database-deadlocks-idempotency")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "idempotency-key-handler-spec": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("database-deadlocks-idempotency")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "orm-n-plus-one-dashboard": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("n-plus-one-queries")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "chatty-enrichment-loop": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("n-plus-one-queries")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "deep-offset-audit-pagination": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("cursor-pagination"), moduleId("query-plans")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "cursor-pagination-helper-spec": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("cursor-pagination")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "pagination-deletes-skip-rows": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("cursor-pagination")],
    lessonIds: [],
    confidenceLevel: "core",
  },
  "read-through-cache-stale-forever": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("redis-caching")],
    lessonIds: [],
    confidenceLevel: "challenge",
  },
  "cache-write-before-commit": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("redis-caching"), moduleId("caching-strategies")],
    lessonIds: [lessonId(moduleId("caching-strategies"), "cache-warming-stampedes")],
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
