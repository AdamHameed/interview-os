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
    lessonIds: [lessonId(moduleId("intervals"), "intervals-walkthrough")],
    confidenceLevel: "warmup",
  },
  "rolling-window-max-latency": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("stacks-queues-heaps")],
    lessonIds: [lessonId(moduleId("stacks-queues-heaps"), "stacks-queues-heaps-walkthrough")],
    confidenceLevel: "core",
  },
  "cooldown-task-scheduler": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("stacks-queues-heaps")],
    lessonIds: [lessonId(moduleId("stacks-queues-heaps"), "stacks-queues-heaps-concept")],
    confidenceLevel: "challenge",
  },
  "log-topk-full-sort": {
    pathIds: [path("dsa-confidence-builder"), path("backend-swe")],
    moduleIds: [moduleId("stacks-queues-heaps"), moduleId("observability")],
    lessonIds: [lessonId(moduleId("stacks-queues-heaps"), "stacks-queues-heaps-concept")],
    confidenceLevel: "core",
  },
  "account-merge-shared-emails": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("trees-graphs")],
    lessonIds: [lessonId(moduleId("trees-graphs"), "trees-graphs-concept")],
    confidenceLevel: "core",
  },
  "surge-aware-shortest-path": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("advanced-graphs")],
    lessonIds: [lessonId(moduleId("advanced-graphs"), "advanced-graphs-walkthrough")],
    confidenceLevel: "challenge",
  },
  "cli-autocomplete-trie": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("tries")],
    lessonIds: [lessonId(moduleId("tries"), "tries-walkthrough")],
    confidenceLevel: "core",
  },
  "oncall-coverage-bitmask": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("bit-manipulation"), moduleId("dynamic-programming-basics")],
    lessonIds: [lessonId(moduleId("bit-manipulation"), "bit-manipulation-walkthrough")],
    confidenceLevel: "advanced",
  },
  "ttl-lru-session-cache": {
    pathIds: [path("dsa-confidence-builder"), path("backend-swe")],
    moduleIds: [moduleId("dsa-to-real-systems")],
    lessonIds: [lessonId(moduleId("dsa-to-real-systems"), "dsa-to-real-systems-concept")],
    confidenceLevel: "core",
  },
  "log-template-dedup": {
    pathIds: [path("dsa-confidence-builder")],
    moduleIds: [moduleId("dsa-to-real-systems")],
    lessonIds: [lessonId(moduleId("dsa-to-real-systems"), "dsa-to-real-systems-concept")],
    confidenceLevel: "core",
  },
  "mini-matching-engine": {
    pathIds: [path("dsa-confidence-builder"), path("quant-dev")],
    moduleIds: [moduleId("dsa-to-real-systems"), moduleId("order-books")],
    lessonIds: [
      lessonId(moduleId("dsa-to-real-systems"), "dsa-to-real-systems-walkthrough"),
      lessonId(moduleId("order-books"), "order-books-concept"),
    ],
    confidenceLevel: "advanced",
  },
  "order-book-imbalance-window": {
    pathIds: [path("dsa-confidence-builder"), path("quant-dev")],
    moduleIds: [moduleId("dsa-to-real-systems"), moduleId("order-books")],
    lessonIds: [
      lessonId(moduleId("dsa-to-real-systems"), "dsa-to-real-systems-concept"),
      lessonId(moduleId("order-books"), "order-books-concept"),
    ],
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
    lessonIds: [
      lessonId(moduleId("tcp-vs-udp"), "tcp-vs-udp-backend-quant"),
      lessonId(moduleId("market-data-feeds"), "market-data-feeds-walkthrough"),
    ],
    confidenceLevel: "core",
  },
  "order-book-sequence-state-machine": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("order-books")],
    lessonIds: [lessonId(moduleId("order-books"), "order-books-walkthrough")],
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
  // http-request-lifecycle: link existing warmups to new concept lesson
  "missing-await-save-warmup": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("http-request-lifecycle")],
    lessonIds: [lessonId(moduleId("http-request-lifecycle"), "http-request-lifecycle-concept")],
    confidenceLevel: "warmup",
  },
  "client-per-row-warmup": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("http-request-lifecycle")],
    lessonIds: [lessonId(moduleId("http-request-lifecycle"), "http-request-lifecycle-concept")],
    confidenceLevel: "warmup",
  },
  // queues-workers: map orphan problems to the module
  "async-worker-drops-jobs": {
    pathIds: [path("backend-swe")],
    moduleIds: [moduleId("queues-workers")],
    lessonIds: [lessonId(moduleId("queues-workers"), "queues-workers-job-lifecycle")],
    confidenceLevel: "core",
  },
  "queue-redelivery-duplicate-emails": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("queues-workers")],
    lessonIds: [lessonId(moduleId("queues-workers"), "queues-workers-delivery-contract")],
    confidenceLevel: "core",
  },
  "job-scheduler-spec": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("queues-workers")],
    lessonIds: [lessonId(moduleId("queues-workers"), "queues-workers-job-lifecycle")],
    confidenceLevel: "core",
  },
  "batcher-throughput-latency-trap": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("queues-workers")],
    lessonIds: [lessonId(moduleId("queues-workers"), "queues-workers-job-lifecycle")],
    confidenceLevel: "challenge",
  },
  "unbounded-queue-oom": {
    pathIds: [path("backend-swe"), path("system-design")],
    moduleIds: [moduleId("queues-workers")],
    lessonIds: [lessonId(moduleId("queues-workers"), "queues-workers-delivery-contract")],
    confidenceLevel: "challenge",
  },
  // Batch 12: market-data-feeds new problems
  "mdf-sequence-number-basics": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("market-data-feeds")],
    lessonIds: [lessonId(moduleId("market-data-feeds"), "market-data-feeds-concept")],
    confidenceLevel: "warmup",
  },
  "mdf-ab-feed-arbitration": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("market-data-feeds")],
    lessonIds: [lessonId(moduleId("market-data-feeds"), "market-data-feeds-concept")],
    confidenceLevel: "warmup",
  },
  "mdf-snapshot-incremental-join": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("market-data-feeds")],
    lessonIds: [lessonId(moduleId("market-data-feeds"), "market-data-feeds-walkthrough")],
    confidenceLevel: "core",
  },
  "mdf-slow-consumer-conflation": {
    pathIds: [path("quant-dev"), path("infrastructure-swe")],
    moduleIds: [moduleId("market-data-feeds")],
    lessonIds: [lessonId(moduleId("market-data-feeds"), "market-data-feeds-walkthrough")],
    confidenceLevel: "challenge",
  },
  // Batch 12: order-books new problems
  "ob-book-levels-l1-l2-l3": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("order-books")],
    lessonIds: [lessonId(moduleId("order-books"), "order-books-concept")],
    confidenceLevel: "warmup",
  },
  "ob-best-bid-ask-crossed": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("order-books")],
    lessonIds: [lessonId(moduleId("order-books"), "order-books-concept")],
    confidenceLevel: "warmup",
  },
  "ob-data-structure-choice": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("order-books")],
    lessonIds: [lessonId(moduleId("order-books"), "order-books-walkthrough")],
    confidenceLevel: "core",
  },
  // Batch 12: link existing order-book aggregator orphan
  "orderbook-level-aggregator-spec": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("order-books")],
    lessonIds: [lessonId(moduleId("order-books"), "order-books-walkthrough")],
    confidenceLevel: "challenge",
  },
  // Batch 17: stl-containers-iterators
  "stl-container-choice-classify": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("stl-containers-iterators")],
    lessonIds: [lessonId(moduleId("stl-containers-iterators"), "stl-containers-concept")],
    confidenceLevel: "warmup",
  },
  "stl-iterator-invalidation-predict": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("stl-containers-iterators")],
    lessonIds: [lessonId(moduleId("stl-containers-iterators"), "stl-containers-concept")],
    confidenceLevel: "warmup",
  },
  "stl-vector-vs-list-hot-loop": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("stl-containers-iterators"), moduleId("latency-cache-locality")],
    lessonIds: [lessonId(moduleId("stl-containers-iterators"), "stl-iterators-walkthrough")],
    confidenceLevel: "core",
  },
  "stl-erase-in-loop-bug": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("stl-containers-iterators")],
    lessonIds: [lessonId(moduleId("stl-containers-iterators"), "stl-iterators-walkthrough")],
    confidenceLevel: "core",
  },
  "stl-lowlatency-container-design": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("stl-containers-iterators"), moduleId("latency-cache-locality")],
    lessonIds: [lessonId(moduleId("stl-containers-iterators"), "stl-iterators-walkthrough")],
    confidenceLevel: "challenge",
  },
  // Batch 17: latency-cache-locality
  "cache-latency-numbers-rank": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("latency-cache-locality")],
    lessonIds: [lessonId(moduleId("latency-cache-locality"), "latency-cache-concept")],
    confidenceLevel: "warmup",
  },
  "cache-row-vs-column-traversal": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("latency-cache-locality")],
    lessonIds: [lessonId(moduleId("latency-cache-locality"), "latency-cache-concept")],
    confidenceLevel: "warmup",
  },
  "cache-aos-vs-soa": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("latency-cache-locality")],
    lessonIds: [lessonId(moduleId("latency-cache-locality"), "latency-cache-walkthrough")],
    confidenceLevel: "core",
  },
  "cache-false-sharing-counters": {
    pathIds: [path("quant-dev"), path("infrastructure-swe")],
    moduleIds: [moduleId("latency-cache-locality"), moduleId("threading-synchronization")],
    lessonIds: [lessonId(moduleId("latency-cache-locality"), "latency-cache-walkthrough")],
    confidenceLevel: "core",
  },
  "cache-marketdata-hot-path-layout": {
    pathIds: [path("quant-dev")],
    moduleIds: [moduleId("latency-cache-locality"), moduleId("market-data-feeds")],
    lessonIds: [lessonId(moduleId("latency-cache-locality"), "latency-cache-walkthrough")],
    confidenceLevel: "challenge",
  },
};
