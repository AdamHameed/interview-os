import {
  learningModuleId,
  learningPathId,
  lessonId,
  type LearningPathSeed,
  type LessonSeed,
  type ModuleSeed,
  type MODULE_CATEGORIES,
  type MODULE_DIFFICULTIES,
} from "../../src/lib/learning";
import type { Role } from "../../src/lib/enums";

type Category = (typeof MODULE_CATEGORIES)[number];
type ModuleDifficulty = (typeof MODULE_DIFFICULTIES)[number];
type ModuleSpec = {
  slug: string;
  title: string;
  category: Category;
  difficulty?: ModuleDifficulty;
  hours?: number;
  prerequisites?: string[];
};

// This seed-only factory intentionally uses the curriculum noun "module".
// eslint-disable-next-line @next/next/no-assign-module-variable
const module = (
  slug: string,
  title: string,
  category: Category,
  difficulty: ModuleDifficulty = "intermediate",
  prerequisites: string[] = []
): ModuleSpec => ({ slug, title, category, difficulty, prerequisites, hours: difficulty === "advanced" ? 5 : 3 });

const MODULE_SPECS: ModuleSpec[] = [
  // DSA confidence roadmap
  module("arrays-hashmaps-two-pointers", "Arrays, Hashmaps, and Two-Pointers", "dsa", "beginner"),
  module("sliding-window-prefix-sums", "Sliding Window and Prefix Sums", "dsa", "beginner", ["arrays-hashmaps-two-pointers"]),
  module("stacks-queues-heaps", "Stacks, Queues, and Heaps", "dsa", "intermediate", ["arrays-hashmaps-two-pointers"]),
  module("trees-graphs", "Trees and Graphs", "dsa", "intermediate", ["stacks-queues-heaps"]),
  module("dynamic-programming-basics", "Dynamic Programming Basics", "dsa", "intermediate", ["arrays-hashmaps-two-pointers"]),
  module("dsa-to-real-systems", "From DSA to Real Systems", "dsa", "advanced", ["trees-graphs", "dynamic-programming-basics"]),

  // DevOps / infrastructure
  module("docker-fundamentals", "Docker Fundamentals", "docker", "beginner"),
  module("dockerfiles-image-layers", "Dockerfiles and Image Layers", "docker", "intermediate", ["docker-fundamentals"]),
  module("docker-compose", "Docker Compose", "docker", "beginner", ["docker-fundamentals"]),
  module("kubernetes-fundamentals", "Kubernetes Fundamentals", "kubernetes", "beginner", ["docker-fundamentals"]),
  module("pods-deployments-services", "Pods, Deployments, and Services", "kubernetes", "beginner", ["kubernetes-fundamentals"]),
  module("kubernetes-configmaps-secrets", "Kubernetes ConfigMaps and Secrets", "kubernetes", "intermediate", ["pods-deployments-services"]),
  module("kubernetes-networking-ingress", "Kubernetes Networking and Ingress", "kubernetes", "advanced", ["pods-deployments-services", "tcp-vs-udp"]),
  module("kubernetes-scheduling-resource-limits", "Kubernetes Scheduling and Resource Limits", "kubernetes", "advanced", ["pods-deployments-services", "scheduling-context-switching"]),

  // Operating systems
  module("processes-vs-threads", "Processes vs Threads", "operating_systems", "beginner"),
  module("threading-synchronization", "Threading and Synchronization", "concurrency", "intermediate", ["processes-vs-threads"]),
  module("mutexes-semaphores-condition-variables", "Mutexes, Semaphores, and Condition Variables", "concurrency", "intermediate", ["threading-synchronization"]),
  module("deadlocks-starvation", "Deadlocks and Starvation", "concurrency", "advanced", ["mutexes-semaphores-condition-variables"]),
  module("virtual-memory-page-tables", "Virtual Memory and Page Tables", "operating_systems", "intermediate", ["processes-vs-threads"]),
  module("scheduling-context-switching", "Scheduling and Context Switching", "operating_systems", "intermediate", ["processes-vs-threads"]),
  module("filesystems-file-descriptors", "Filesystems and File Descriptors", "operating_systems", "intermediate", ["processes-vs-threads"]),

  // Networking
  module("tcp-vs-udp", "TCP vs UDP", "networking", "beginner"),
  module("sockets-connection-lifecycle", "Sockets and Connection Lifecycle", "networking", "intermediate", ["tcp-vs-udp"]),
  module("http-request-lifecycle", "HTTP Request Lifecycle", "backend", "beginner", ["tcp-vs-udp"]),
  module("load-balancing", "Load Balancing", "infrastructure", "intermediate", ["http-request-lifecycle"]),
  module("dns-fundamentals", "DNS Fundamentals", "networking", "beginner"),
  module("tls-basics", "TLS Basics", "networking", "intermediate", ["tcp-vs-udp"]),
  module("websockets-streaming", "WebSockets and Streaming", "networking", "intermediate", ["http-request-lifecycle"]),

  // C++
  module("raii-resource-ownership", "C++ RAII and Resource Ownership", "cpp", "beginner"),
  module("move-semantics", "C++ Move Semantics", "cpp", "intermediate", ["raii-resource-ownership"]),
  module("references-pointers-lifetimes", "C++ References, Pointers, and Lifetimes", "cpp", "intermediate", ["raii-resource-ownership"]),
  module("stl-containers-iterators", "C++ STL Containers and Iterators", "cpp", "intermediate"),
  module("unordered-map-hashing-collisions", "C++ unordered_map Hashing and Collisions", "cpp", "intermediate", ["stl-containers-iterators"]),
  module("cpp-templates-basics", "C++ Templates Basics", "cpp", "intermediate"),
  module("concurrency-in-cpp", "Concurrency in C++", "cpp", "advanced", ["threading-synchronization", "raii-resource-ownership"]),

  // Python
  module("python-mutability-identity", "Python Mutability and Identity", "python", "beginner"),
  module("python-generators-iterators", "Python Generators and Iterators", "python", "intermediate"),
  module("python-decorators-closures", "Python Decorators and Closures", "python", "intermediate"),
  module("python-gil-concurrency", "Python GIL and Concurrency", "python", "advanced", ["threading-synchronization"]),
  module("python-hashing-equality", "Python Hashing and Equality", "python", "intermediate"),
  module("python-memory-object-model", "Python Memory and Object Model", "python", "advanced", ["python-mutability-identity"]),

  // Databases and caching
  module("sql-indexes", "SQL Indexes", "databases", "beginner"),
  module("composite-indexes", "Composite Indexes", "databases", "intermediate", ["sql-indexes"]),
  module("transactions-isolation", "Transactions and Isolation", "databases", "intermediate"),
  module("query-plans", "Query Plans", "databases", "intermediate", ["sql-indexes"]),
  module("n-plus-one-queries", "N+1 Queries", "databases", "beginner"),
  module("cursor-pagination", "Cursor Pagination", "databases", "intermediate", ["sql-indexes"]),
  module("database-deadlocks-idempotency", "Database Deadlocks and Idempotency", "databases", "advanced", ["transactions-isolation"]),
  module("redis-caching", "Redis and Caching", "caching", "beginner"),

  // System design and backend
  module("system-design-interview-framework", "System Design Interview Framework", "system_design", "beginner"),
  module("apis-requirements", "APIs and Requirements", "system_design", "beginner", ["http-request-lifecycle"]),
  module("rate-limiting", "Rate Limiting", "system_design", "intermediate", ["apis-requirements"]),
  module("caching-strategies", "Caching Strategies", "caching", "intermediate", ["redis-caching"]),
  module("queues-workers", "Queues and Workers", "distributed_systems", "intermediate"),
  module("replication-sharding", "Replication and Sharding", "distributed_systems", "advanced", ["transactions-isolation"]),
  module("observability", "Observability", "infrastructure", "intermediate"),
  module("reliability-backpressure", "Reliability and Backpressure", "distributed_systems", "advanced", ["queues-workers", "observability"]),

  // Quant dev
  module("market-data-feeds", "Market Data Feeds", "quant_dev", "intermediate", ["tcp-vs-udp"]),
  module("order-books", "Order Books", "quant_dev", "intermediate", ["market-data-feeds"]),
  module("latency-cache-locality", "Latency and Cache Locality", "quant_dev", "advanced", ["raii-resource-ownership"]),
  module("linux-for-quant-dev", "Linux for Quant Dev", "quant_dev", "intermediate", ["processes-vs-threads"]),
  module("networking-for-quant-dev", "Networking for Quant Dev", "quant_dev", "advanced", ["tcp-vs-udp", "sockets-connection-lifecycle"]),
  module("concurrency-for-quant-dev", "Concurrency for Quant Dev", "quant_dev", "advanced", ["threading-synchronization"]),

  // AI usage
  module("good-ai-usage-principles", "Good AI Usage Principles", "ai_usage", "beginner"),
  module("token-efficient-prompting", "Token-Efficient Prompting", "ai_usage", "beginner", ["good-ai-usage-principles"]),
  module("selecting-repo-context", "Selecting Repo Context", "ai_usage", "beginner", ["good-ai-usage-principles"]),
  module("reviewing-ai-code", "Reviewing AI Code", "ai_usage", "intermediate", ["selecting-repo-context"]),
  module("hallucination-detection", "Hallucination Detection", "ai_usage", "intermediate", ["reviewing-ai-code"]),
  module("testing-verification", "Test-First AI Workflows", "ai_usage", "intermediate", ["reviewing-ai-code"]),
];

type RealLesson = Omit<LessonSeed, "id" | "order">;
const real = (input: RealLesson): RealLesson => input;

const REAL_LESSONS: Record<string, RealLesson[]> = {
  "arrays-hashmaps-two-pointers": [real({ slug: "two-sum-hashmap-pattern", title: "Two Sum as a Hashmap Pattern", lessonType: "pattern", difficulty: "easy", estimatedMinutes: 15, contentMarkdown: "## Core pattern\n\nFor a pair satisfying `a + b = target`, each value reveals the complement to seek. Scan once, check a hashmap before inserting, and keep the invariant that the map contains only earlier values.\n\n## Interview value\n\nThis tests time-space tradeoffs, duplicate handling, and whether you can explain why one pass is correct.\n\n## Common mistakes\n\nInserting before checking can self-match; returning values instead of indices violates many contracts.\n\n## Next step\n\nCompare the hashmap solution with two pointers on sorted input.", keyTakeaways: ["Use complements to replace pair enumeration with lookup.", "State the one-pass invariant before coding."], examples: ["For `[2, 7, 11]` and target 9, value 7 finds the earlier complement 2."], linkedProblemSlugs: ["pair-sum-request-ids", "quadratic-settlement-matcher"], sourceUrls: ["https://docs.python.org/3/tutorial/datastructures.html#dictionaries"], isPlaceholder: false })],
  "sliding-window-prefix-sums": [real({ slug: "sliding-window-when-it-applies", title: "Sliding Window: When It Applies", lessonType: "pattern", difficulty: "easy", estimatedMinutes: 18, contentMarkdown: "## Recognition\n\nSliding windows fit contiguous ranges whose validity can be maintained as boundaries move. Expand right, update compact state, then shrink left until the invariant is restored.\n\n## Interview value\n\nThe pattern tests invariant design rather than memorization.\n\n## Common mistakes\n\nDo not use it for non-contiguous choices, and remember to remove state when the left edge advances.", keyTakeaways: ["Contiguity and a maintainable invariant are the main signals.", "Monotonic boundaries give the usual linear-time proof."], examples: ["A distinct-client window tracks counts while both pointers move only forward."], linkedProblemSlugs: ["longest-unique-session-streak", "clean-request-window", "sliding-window-rate-check"], sourceUrls: ["https://www.techinterviewhandbook.org/algorithms/array/"], isPlaceholder: false })],
  "dockerfiles-image-layers": [real({ slug: "docker-image-layers-why-they-matter", title: "Docker Image Layers and Why They Matter", lessonType: "concept", difficulty: "easy", estimatedMinutes: 18, contentMarkdown: "## Mental model\n\nEach Dockerfile instruction contributes an immutable layer. Reusable earlier layers improve build caching, while frequently changing inputs should usually be copied later. Multi-stage builds keep compilers and intermediate artifacts out of the runtime image.\n\n## Interview value\n\nInterviewers use layer questions to test reproducibility, cache reasoning, image size, and supply-chain awareness.\n\n## Common mistakes\n\nCopying the whole repository before dependency installation invalidates caches; deleting files in a later layer does not erase bytes from earlier layers.", keyTakeaways: ["Order Dockerfile instructions by stability to preserve cache reuse.", "Use multi-stage builds to separate build and runtime contents."], examples: ["Copy lockfiles, install dependencies, then copy changing application source."], linkedProblemSlugs: [], sourceUrls: ["https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/"], isPlaceholder: false })],
  "pods-deployments-services": [real({ slug: "kubernetes-pods-deployments-services", title: "Kubernetes Pods vs Deployments vs Services", lessonType: "concept", difficulty: "easy", estimatedMinutes: 20, contentMarkdown: "## Three responsibilities\n\nA Pod is a scheduling unit for tightly coupled containers. A Deployment declares and rolls out a desired replica set. A Service provides a stable discovery and traffic endpoint for a changing set of selected Pods.\n\n## Interview value\n\nThe distinction tests whether you can separate workload lifecycle from networking and discovery.\n\n## Common mistakes\n\nDo not treat a Pod as durable, or a Service as the controller that creates replicas.", keyTakeaways: ["Pods run containers; Deployments manage replica rollout; Services provide stable reachability.", "Selectors connect controllers and traffic to matching Pods."], examples: ["A Deployment replaces a failed web Pod while a Service keeps the client endpoint stable."], linkedProblemSlugs: [], sourceUrls: ["https://kubernetes.io/docs/concepts/workloads/pods/", "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/", "https://kubernetes.io/docs/concepts/services-networking/service/"], isPlaceholder: false })],
  "processes-vs-threads": [real({ slug: "processes-vs-threads-interview-model", title: "Processes vs Threads", lessonType: "concept", difficulty: "easy", estimatedMinutes: 18, contentMarkdown: "## Isolation and sharing\n\nProcesses normally have separate virtual address spaces and explicit IPC boundaries. Threads within one process share memory and resources but retain independent stacks and scheduling state.\n\n## Interview value\n\nThis is the foundation for reasoning about isolation, synchronization, context switching, and failure containment.\n\n## Common mistakes\n\nShared memory is not automatically safe, and process isolation is not absolute without operating-system controls.", keyTakeaways: ["Processes emphasize isolation; threads emphasize shared in-process state.", "Sharing reduces communication overhead but creates synchronization obligations."], examples: ["A thread can pass an object reference directly; separate processes generally need IPC or shared-memory coordination."], linkedProblemSlugs: [], sourceUrls: ["https://man7.org/linux/man-pages/man7/pthreads.7.html"], isPlaceholder: false })],
  "virtual-memory-page-tables": [real({ slug: "page-tables-virtual-memory", title: "Page Tables and Virtual Memory", lessonType: "concept", difficulty: "medium", estimatedMinutes: 22, contentMarkdown: "## Translation\n\nVirtual memory gives each process an address space whose virtual pages map through page tables to physical frames or to non-resident state. The TLB caches recent translations; a page fault transfers control to the kernel when a mapping is absent or disallowed.\n\n## Interview value\n\nThe topic connects memory isolation, allocation, cache behavior, and performance.\n\n## Common mistakes\n\nA TLB miss is not necessarily a page fault, and a page fault is not always disk I/O.", keyTakeaways: ["Page tables encode virtual-to-physical mappings and permissions.", "The TLB accelerates translation; faults let the kernel resolve missing or invalid access."], examples: ["A copy-on-write write fault can allocate a private frame without reading from disk."], linkedProblemSlugs: [], sourceUrls: ["https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf"], isPlaceholder: false })],
  "raii-resource-ownership": [real({ slug: "cpp-raii-in-interviews", title: "C++ RAII in Interviews", lessonType: "concept", difficulty: "easy", estimatedMinutes: 20, contentMarkdown: "## Ownership through lifetime\n\nRAII binds resource acquisition to object construction and cleanup to deterministic destruction. It applies to memory, file descriptors, locks, sockets, and transactions—not only smart pointers.\n\n## Interview value\n\nRAII questions reveal whether code remains correct across early returns, exceptions, moves, and partial construction.\n\n## Common mistakes\n\nA moved-from object must remain valid, and raw ownership without a documented owner invites double release or leaks.", keyTakeaways: ["Express one clear owner and let scope drive cleanup.", "Design move and copy behavior to match the resource semantics."], examples: ["A lock guard releases a mutex on every scope exit, including exceptions."], linkedProblemSlugs: ["cpp-moved-handle-double-close"], sourceUrls: ["https://en.cppreference.com/w/cpp/language/raii.html"], isPlaceholder: false })],
  "tcp-vs-udp": [real({ slug: "tcp-vs-udp-backend-quant", title: "TCP vs UDP for Backend and Quant Dev", lessonType: "concept", difficulty: "medium", estimatedMinutes: 20, contentMarkdown: "## Choose transport properties\n\nTCP is an ordered reliable byte stream with congestion control; loss can delay later bytes on that connection. UDP preserves datagram boundaries and supports multicast but leaves loss, reordering, and recovery to the application.\n\n## Interview value\n\nA strong answer connects transport behavior to latency, fanout, correctness, and recovery instead of saying only that UDP is faster.\n\n## Common mistakes\n\nDo not assume UDP cannot be made reliable at the application layer or that TCP orders data across separate connections.", keyTakeaways: ["Transport choice follows correctness, latency, and fanout needs.", "UDP market-data feeds commonly pair sequence detection with a recovery channel."], examples: ["A missing sequence marks an order book stale until replay or snapshot recovery completes."], linkedProblemSlugs: ["multicast-gap-recovery-design", "order-book-sequence-state-machine"], sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9293", "https://www.rfc-editor.org/rfc/rfc768"], isPlaceholder: false })],
  "rate-limiting": [real({ slug: "what-rate-limiter-does", title: "What a Rate Limiter Actually Does", lessonType: "concept", difficulty: "easy", estimatedMinutes: 18, contentMarkdown: "## Purpose\n\nA rate limiter protects a constrained resource by defining a key, time model, burst policy, storage location, and rejection behavior.\n\n## Interview value\n\nThe topic connects API semantics with distributed state and overload control.\n\n## Common mistakes\n\nAvoid choosing a global key for per-user limits or ignoring atomic updates across servers.", keyTakeaways: ["Define the protected resource and key before choosing an algorithm.", "Burst allowance and sustained rate are separate controls."], examples: ["A token bucket allows a short burst while bounding long-run admission."], linkedProblemSlugs: ["token-bucket-limiter-spec", "sliding-window-rate-check"], sourceUrls: ["https://datatracker.ietf.org/doc/html/rfc6585#section-4"], isPlaceholder: false })],
  "caching-strategies": [real({ slug: "cache-warming-stampedes", title: "Cache Warming and Cache Stampedes", lessonType: "concept", difficulty: "medium", estimatedMinutes: 20, contentMarkdown: "## Separate concerns\n\nWarming preloads likely-hot keys; stampede protection controls concurrent misses. Single-flight, stale-while-revalidate, and bounded refresh concurrency address the latter.\n\n## Interview value\n\nThis tests time-based failure reasoning beyond simply naming Redis.\n\n## Common mistakes\n\nTTL jitter does not solve every hot-key stampede, and locks need expiry and failure handling.", keyTakeaways: ["Warming reduces cold starts; single-flight controls duplicate refresh work.", "Staleness policies need explicit freshness bounds."], examples: ["Thousands of reads during one rebuild can duplicate origin work without coordination."], linkedProblemSlugs: ["cache-write-before-commit", "cache-stampede-product-page"], sourceUrls: ["https://en.wikipedia.org/wiki/Cache_stampede"], isPlaceholder: false })],
  "composite-indexes": [real({ slug: "composite-indexes-query-shape", title: "Composite Indexes and Query Shape", lessonType: "optimization", difficulty: "easy", estimatedMinutes: 20, contentMarkdown: "## Start from the query\n\nA composite index follows predicates and ordering. Equality columns usually lead, followed by range or sort columns.\n\n## Interview value\n\nIndex questions test whether you can explain the visited rows, avoided sort, and write cost.\n\n## Common mistakes\n\nSeparate single-column indexes do not automatically preserve a required composite ordering.", keyTakeaways: ["Index order follows equality, range, and ordering needs.", "Verify choices with an actual query plan."], examples: ["`WHERE customer_id = ? ORDER BY created_at DESC` often benefits from `(customer_id, created_at DESC)`."], linkedProblemSlugs: ["recent-orders-index-warmup", "missing-composite-index-orders"], sourceUrls: ["https://www.postgresql.org/docs/current/indexes-multicolumn.html"], isPlaceholder: false })],
  "system-design-interview-framework": [real({ slug: "structure-system-design-answer", title: "How to Structure a System Design Answer", lessonType: "system_design", difficulty: "easy", estimatedMinutes: 22, contentMarkdown: "## Repeatable sequence\n\nClarify users, operations, scale, reliability, and consistency. Define a small API and data model, draw the request flow, deepen bottlenecks, and end with failures, observability, and tradeoffs.\n\n## Interview value\n\nStructure demonstrates prioritization under ambiguity.\n\n## Common mistakes\n\nDo not start capacity math before the workload or name products without explaining the property they provide.", keyTakeaways: ["Requirements determine which tradeoffs matter.", "Reserve time for failures, observability, and recap."], examples: ["Clarify notification channels, delay, ordering, retries, and preferences before selecting queues."], linkedProblemSlugs: ["cache-stampede-product-page", "outbox-publisher-marks-before-send"], sourceUrls: ["https://sre.google/sre-book/table-of-contents/"], isPlaceholder: false })],
  "token-efficient-prompting": [real({ slug: "token-efficient-debugging-prompts", title: "Token-Efficient Debugging Prompts", lessonType: "ai_usage", difficulty: "easy", estimatedMinutes: 16, contentMarkdown: "## Relevant context only\n\nState the observed failure, expected behavior, constraints, entrypoint, relevant contract, and validation command. Let the agent search call sites before pasting unrelated files.\n\n## Interview and work value\n\nGood context selection demonstrates system understanding and produces changes that are easier to review.\n\n## Common mistakes\n\nDo not dump secrets or ask for a fix before requiring evidence for the hypothesis.", keyTakeaways: ["Lead with observable behavior and acceptance checks.", "Use progressive disclosure of repository context."], examples: ["Provide the handler, client wrapper, timeout configuration, focused test, and a call-site search."], linkedProblemSlugs: ["ai-debug-prompt-warmup", "ai-token-efficient-repo-task", "ai-select-files-for-timeout-fix"], sourceUrls: ["https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot"], isPlaceholder: false })],
};

function placeholderLessons(spec: ModuleSpec, startOrder: number): LessonSeed[] {
  const moduleId = learningModuleId(spec.slug);
  return ["foundations", "applied-checkpoint"].map((suffix, index) => ({
    id: lessonId(moduleId, `${spec.slug}-${suffix}`),
    slug: `${spec.slug}-${suffix}`,
    title: `${spec.title}: ${index === 0 ? "Foundations" : "Applied Checkpoint"}`,
    lessonType: index === 0 ? "concept" : "walkthrough",
    difficulty: index === 0 ? "easy" : "medium",
    estimatedMinutes: index === 0 ? 20 : 25,
    contentMarkdown: `> **Content scaffold**\n\nExpand this ${index === 0 ? "instructional" : "interview checkpoint"} for **${spec.title}** with a concise mental model, realistic example, common mistakes, and self-review questions.`,
    keyTakeaways: [`Explain the core interview vocabulary for ${spec.title}.`, "Apply the idea to one realistic scenario."],
    examples: ["Add one small worked example and one boundary case."],
    linkedProblemSlugs: [],
    sourceUrls: [],
    order: startOrder + index,
    isPlaceholder: true,
  }));
}

export const learningModules: ModuleSeed[] = MODULE_SPECS.map((spec) => {
  const moduleId = learningModuleId(spec.slug);
  const authored = (REAL_LESSONS[spec.slug] ?? []).map((lesson, index): LessonSeed => ({
    ...lesson,
    id: lessonId(moduleId, lesson.slug),
    order: index + 1,
  }));
  return {
    id: moduleId,
    slug: spec.slug,
    title: spec.title,
    description: `A standalone interview module covering the mental models, tradeoffs, and practice expected for ${spec.title.toLowerCase()}.`,
    category: spec.category,
    difficulty: spec.difficulty ?? "intermediate",
    estimatedHours: spec.hours ?? 3,
    prerequisites: spec.prerequisites ?? [],
    outcomes: [`Explain the core ideas behind ${spec.title}.`, "Apply the topic in a realistic interview scenario."],
    sourceUrls: authored.flatMap((lesson) => lesson.sourceUrls),
    isPublished: true,
    isPlaceholder: authored.length === 0,
    lessons: [...authored, ...placeholderLessons(spec, authored.length + 1)],
  };
});

type PathSpec = {
  slug: string;
  title: string;
  description: string;
  targetRoles: Role[];
  difficulty: string;
  estimatedHours: number;
  modules: string[];
};

const PATHS: PathSpec[] = [
  { slug: "dsa-confidence-builder", title: "DSA Confidence Builder", description: "Build confidence from easy algorithm fundamentals into core patterns and applied interview variants.", targetRoles: ["new_grad_swe", "backend_swe", "quant_developer", "mid_level_swe"], difficulty: "beginner-to-advanced", estimatedHours: 28, modules: ["arrays-hashmaps-two-pointers", "sliding-window-prefix-sums", "stacks-queues-heaps", "trees-graphs", "dynamic-programming-basics", "dsa-to-real-systems"] },
  { slug: "backend-swe", title: "Backend SWE Path", description: "A curated route through HTTP, data, caching, queues, observability, and reliable service design.", targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"], difficulty: "beginner-to-advanced", estimatedHours: 34, modules: ["http-request-lifecycle", "apis-requirements", "sql-indexes", "composite-indexes", "transactions-isolation", "redis-caching", "caching-strategies", "queues-workers", "rate-limiting", "observability", "reliability-backpressure"] },
  { slug: "infrastructure-swe", title: "Infrastructure SWE Path", description: "A systems route through processes, memory, networking, containers, Kubernetes, concurrency, and reliability.", targetRoles: ["infrastructure_swe", "platform_engineer", "distributed_systems_engineer"], difficulty: "intermediate-to-advanced", estimatedHours: 40, modules: ["processes-vs-threads", "virtual-memory-page-tables", "tcp-vs-udp", "sockets-connection-lifecycle", "docker-fundamentals", "dockerfiles-image-layers", "kubernetes-fundamentals", "pods-deployments-services", "threading-synchronization", "observability", "reliability-backpressure"] },
  { slug: "system-design", title: "System Design Path", description: "Use a repeatable design framework, then deepen APIs, caching, messaging, data distribution, and reliability.", targetRoles: ["backend_swe", "infrastructure_swe", "distributed_systems_engineer", "mid_level_swe"], difficulty: "intermediate-to-advanced", estimatedHours: 30, modules: ["system-design-interview-framework", "apis-requirements", "rate-limiting", "caching-strategies", "queues-workers", "replication-sharding", "observability", "reliability-backpressure"] },
  { slug: "quant-dev", title: "Quant Dev Path", description: "Connect C++, operating systems, networking, concurrency, performance, and market-data mechanics.", targetRoles: ["quant_developer", "hft_swe"], difficulty: "intermediate-to-advanced", estimatedHours: 38, modules: ["raii-resource-ownership", "move-semantics", "stl-containers-iterators", "processes-vs-threads", "tcp-vs-udp", "linux-for-quant-dev", "networking-for-quant-dev", "concurrency-for-quant-dev", "latency-cache-locality", "market-data-feeds", "order-books"] },
  { slug: "ai-efficient-engineer", title: "AI-Efficient Engineer Path", description: "Use coding agents with disciplined context selection, review, tests, and interview-appropriate boundaries.", targetRoles: ["backend_swe", "platform_engineer", "infrastructure_swe", "new_grad_swe"], difficulty: "beginner-to-intermediate", estimatedHours: 16, modules: ["good-ai-usage-principles", "token-efficient-prompting", "selecting-repo-context", "reviewing-ai-code", "hallucination-detection", "testing-verification"] },
];

export const learningPaths: LearningPathSeed[] = PATHS.map((path, pathIndex) => ({
  id: learningPathId(path.slug),
  slug: path.slug,
  title: path.title,
  description: path.description,
  targetRoles: path.targetRoles,
  difficulty: path.difficulty,
  estimatedHours: path.estimatedHours,
  order: pathIndex + 1,
  isPublished: true,
  modules: path.modules.map((moduleSlug, index) => ({
    moduleSlug,
    order: index + 1,
    isRequired: index < Math.ceil(path.modules.length * 0.75),
    label: index === 0 ? "warmup" : index >= Math.ceil(path.modules.length * 0.75) ? "advanced" : "core",
  })),
}));
