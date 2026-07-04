import {
  learningModuleId,
  learningPathId,
  lessonId,
  type LearningPathSeed,
  type LessonSeed,
} from "../../src/lib/learning";
import type { Role } from "../../src/lib/enums";

type PathSpec = {
  slug: string;
  title: string;
  description: string;
  targetRoles: Role[];
  difficulty: string;
  estimatedHours: number;
  modules: { slug: string; title: string }[];
};

const PATH_SPECS: PathSpec[] = [
  {
    slug: "dsa-confidence-builder",
    title: "DSA Confidence Builder",
    description: "Start with approachable LeetCode-style fundamentals, then branch into interview patterns and applied backend or quant variants without jumping straight to hard problems.",
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer", "mid_level_swe"],
    difficulty: "beginner-to-advanced",
    estimatedHours: 28,
    modules: [
      { slug: "arrays-hashmaps-two-pointers", title: "Arrays, Hashmaps, and Two-Pointers" },
      { slug: "sliding-window-prefix-sums", title: "Sliding Window and Prefix Sums" },
      { slug: "stacks-queues-heaps", title: "Stacks, Queues, and Heaps" },
      { slug: "trees-graphs", title: "Trees and Graphs" },
      { slug: "dynamic-programming-basics", title: "Dynamic Programming Basics" },
      { slug: "dsa-to-real-systems", title: "From DSA to Real Systems" },
    ],
  },
  {
    slug: "backend-swe",
    title: "Backend SWE Path",
    description: "Build the interview vocabulary and practical reasoning needed for backend coding, data, reliability, debugging, and system-design rounds.",
    targetRoles: ["backend_swe", "mid_level_swe", "fullstack_swe"],
    difficulty: "beginner-to-advanced",
    estimatedHours: 32,
    modules: [
      { slug: "http-apis-request-flow", title: "HTTP APIs and Request Flow" },
      { slug: "caching-redis", title: "Caching and Redis" },
      { slug: "databases-indexes", title: "Databases and Indexes" },
      { slug: "queues-background-jobs", title: "Queues and Background Jobs" },
      { slug: "observability-debugging", title: "Observability and Debugging" },
      { slug: "scaling-backend-services", title: "Scaling Backend Services" },
    ],
  },
  {
    slug: "infrastructure-swe",
    title: "Infrastructure SWE Path",
    description: "A scaffold for operating-system, networking, concurrency, observability, distributed-systems, and reliability knowledge expected in infrastructure interviews.",
    targetRoles: ["infrastructure_swe", "platform_engineer", "distributed_systems_engineer"],
    difficulty: "intermediate-to-advanced",
    estimatedHours: 34,
    modules: [
      { slug: "linux-process-fundamentals", title: "Linux and Process Fundamentals" },
      { slug: "networking-traffic-flow", title: "Networking and Traffic Flow" },
      { slug: "concurrency-synchronization", title: "Concurrency and Synchronization" },
      { slug: "distributed-systems-foundations", title: "Distributed Systems Foundations" },
      { slug: "observability-incident-response", title: "Observability and Incident Response" },
      { slug: "reliability-capacity", title: "Reliability and Capacity Engineering" },
    ],
  },
  {
    slug: "system-design",
    title: "System Design Path",
    description: "Learn a repeatable interview structure, then add capacity, data, caching, messaging, reliability, and tradeoff analysis one layer at a time.",
    targetRoles: ["backend_swe", "infrastructure_swe", "distributed_systems_engineer", "mid_level_swe"],
    difficulty: "intermediate-to-advanced",
    estimatedHours: 30,
    modules: [
      { slug: "approach-any-system-design", title: "How to Approach Any System Design Interview" },
      { slug: "apis-load-capacity", title: "APIs, Load, and Capacity Estimates" },
      { slug: "caching-rate-limiting", title: "Caching and Rate Limiting" },
      { slug: "queues-streams-workers", title: "Queues, Streams, and Workers" },
      { slug: "databases-replication-sharding", title: "Databases, Replication, and Sharding" },
      { slug: "observability-reliability-tradeoffs", title: "Observability, Reliability, and Tradeoffs" },
    ],
  },
  {
    slug: "quant-dev",
    title: "Quant Dev Path",
    description: "Progress from language and systems fundamentals into low-latency reasoning, market data, order books, performance work, and realistic technical rounds.",
    targetRoles: ["quant_developer", "hft_swe"],
    difficulty: "intermediate-to-advanced",
    estimatedHours: 36,
    modules: [
      { slug: "python-cpp-knowledge", title: "Python and C++ Interview Knowledge" },
      { slug: "linux-os-networking", title: "Linux, OS, and Networking" },
      { slug: "concurrency-low-latency", title: "Concurrency and Low-Latency Thinking" },
      { slug: "market-data-order-books", title: "Market Data and Order Books" },
      { slug: "performance-optimization", title: "Performance Optimization" },
      { slug: "quant-mock-rounds", title: "Quant Dev Mock Rounds" },
    ],
  },
  {
    slug: "ai-efficient-engineer",
    title: "AI-Efficient Engineer Path",
    description: "Use coding agents with disciplined context selection, token-efficient prompts, independent review, tests, and interview-appropriate boundaries.",
    targetRoles: ["backend_swe", "platform_engineer", "infrastructure_swe", "new_grad_swe"],
    difficulty: "beginner-to-intermediate",
    estimatedHours: 16,
    modules: [
      { slug: "good-ai-usage-principles", title: "Good AI Usage Principles" },
      { slug: "token-efficient-prompting", title: "Token-Efficient Prompting" },
      { slug: "selecting-repo-context", title: "Selecting Repo Context" },
      { slug: "reviewing-ai-code", title: "Reviewing AI Code" },
      { slug: "testing-verification", title: "Testing and Verification" },
      { slug: "ai-interview-prep-boundaries", title: "AI in Interview Prep Without Dependency" },
    ],
  },
];

const REAL_LESSONS: Record<string, Omit<LessonSeed, "id" | "order">[]> = {
  "dsa-confidence-builder/arrays-hashmaps-two-pointers": [
    {
      slug: "two-sum-hashmap-pattern",
      title: "Two Sum as a Hashmap Pattern",
      lessonType: "pattern",
      difficulty: "easy",
      estimatedMinutes: 15,
      contentMarkdown: "## The idea\n\nWhen a pair must satisfy `a + b = target`, each value tells you exactly which complement is missing. A hashmap turns the question from ‘search every pair’ into ‘have I already seen the complement?’ Scan once, check before inserting, and return the two indices.\n\n## Why interviews test it\n\nIt reveals whether you can trade memory for time, state an invariant, and handle duplicates without accidental self-matching. The same complement-index pattern appears in deduplication, joins, and streaming correlation.\n\n## Common mistakes\n\n- Inserting before checking and matching an element with itself.\n- Returning values when the contract asks for indices.\n- Ignoring duplicate values such as `[3, 3]`.\n\n## Next steps\n\nSolve the warmup, then explain how the design changes for sorted input, all matching pairs, or an unbounded stream.",
      keyTakeaways: ["Store previously seen values by the information needed for the answer.", "State the one-pass invariant before coding.", "Check duplicate and no-solution behavior explicitly."],
      examples: ["For `[2, 7, 11, 15]` and target 9, value 7 finds complement 2 at index 0."],
      linkedProblemSlugs: ["pair-sum-request-ids", "quadratic-settlement-matcher"],
      sourceUrls: ["https://docs.python.org/3/tutorial/datastructures.html#dictionaries"],
      isPlaceholder: false,
    },
  ],
  "dsa-confidence-builder/sliding-window-prefix-sums": [
    {
      slug: "sliding-window-when-it-applies",
      title: "Sliding Window: When It Applies",
      lessonType: "pattern",
      difficulty: "easy",
      estimatedMinutes: 18,
      contentMarkdown: "## Recognize the shape\n\nA sliding window is useful when the answer concerns a **contiguous** region and the validity condition changes predictably as the left or right boundary moves. Expand the right edge, update compact state, and shrink the left edge until the invariant is restored.\n\n## Why interviews test it\n\nThe pattern tests invariant design more than memorization. You must identify exactly what state enters and leaves the window and prove each element is processed a constant number of times.\n\n## Common mistakes\n\n- Applying a window to non-contiguous choices.\n- Shrinking only once instead of until the window is valid.\n- Forgetting to decrement counts when the left edge moves.\n\n## Next steps\n\nStart with a simple distinct-value window, then move to retry-aware request windows and time-based streaming variants.",
      keyTakeaways: ["Contiguity and a maintainable invariant are the key signals.", "Each boundary should move monotonically for the usual linear-time proof.", "Window state must support symmetric add and remove operations."],
      examples: ["Longest subarray with no repeated client IDs uses a count map and two monotonic pointers."],
      linkedProblemSlugs: ["longest-unique-session-streak", "clean-request-window", "sliding-window-rate-check"],
      sourceUrls: ["https://www.techinterviewhandbook.org/algorithms/array/"],
      isPlaceholder: false,
    },
  ],
  "backend-swe/http-apis-request-flow": [
    {
      slug: "what-rate-limiter-does",
      title: "What a Rate Limiter Actually Does",
      lessonType: "concept",
      difficulty: "easy",
      estimatedMinutes: 18,
      contentMarkdown: "## Purpose\n\nA rate limiter protects a constrained resource by deciding whether work may enter now. It is not merely a request counter: it defines a key, a time model, burst policy, storage location, and behavior when capacity is exhausted.\n\n## Why interviews test it\n\nRate limiting connects API semantics to distributed state and overload control. Interviewers expect you to distinguish token bucket bursts, fixed-window boundary spikes, and sliding-window accuracy.\n\n## Common mistakes\n\n- Choosing a global key when limits are per user or endpoint.\n- Failing open or closed without stating the product consequence.\n- Ignoring atomic updates across multiple servers.\n\n## Next steps\n\nImplement a local counter warmup, then compare token bucket and sliding-window designs before discussing Redis-backed distributed limits.",
      keyTakeaways: ["Define the protected resource and key before the algorithm.", "Burst allowance and sustained rate are separate controls.", "Distributed limiters need atomic shared-state updates or deliberate approximation."],
      examples: ["A 10-token bucket refilling at 2 tokens/second allows a short burst while bounding the long-term rate."],
      linkedProblemSlugs: ["token-bucket-limiter-spec", "sliding-window-rate-check"],
      sourceUrls: ["https://datatracker.ietf.org/doc/html/rfc6585#section-4"],
      isPlaceholder: false,
    },
  ],
  "backend-swe/caching-redis": [
    {
      slug: "cache-warming-stampedes",
      title: "Cache Warming and Cache Stampedes",
      lessonType: "concept",
      difficulty: "medium",
      estimatedMinutes: 20,
      contentMarkdown: "## Two different concerns\n\nCache warming fills likely-hot keys before user traffic needs them. Stampede protection controls what happens when many callers miss the same key simultaneously. Warming can reduce cold misses, but it does not replace single-flight, stale-while-revalidate, or bounded refresh concurrency.\n\n## Why interviews test it\n\nThe topic exposes whether you can reason through a time-based failure rather than simply say ‘add Redis.’ A strong answer follows requests through expiry and quantifies duplicate backend work.\n\n## Common mistakes\n\n- Treating TTL jitter as a full fix for one extremely hot key.\n- Using a lock with no expiry or serving stale data without a freshness bound.\n- Warming every possible key and moving the overload earlier.\n\n## Next steps\n\nTrace a stampede timeline, choose a staleness policy, and add monitoring for refresh age and origin load.",
      keyTakeaways: ["Warming reduces cold starts; single-flight controls concurrent misses.", "Stale-while-revalidate trades freshness for stable latency.", "Every refresh path needs failure and freshness monitoring."],
      examples: ["At 2,000 reads/second with a four-second rebuild, one expiry can create thousands of duplicate computations."],
      linkedProblemSlugs: ["cache-write-before-commit", "cache-stampede-product-page"],
      sourceUrls: ["https://en.wikipedia.org/wiki/Cache_stampede"],
      isPlaceholder: false,
    },
  ],
  "backend-swe/databases-indexes": [
    {
      slug: "composite-indexes-query-shape",
      title: "Composite Indexes and Query Shape",
      lessonType: "optimization",
      difficulty: "easy",
      estimatedMinutes: 20,
      contentMarkdown: "## Start from the query\n\nA useful composite index follows the predicates and ordering the database must satisfy. Equality columns usually form the leading prefix, followed by range or sort columns. The goal is not to index every referenced column; it is to let the engine visit a small, already useful slice of the index.\n\n## Why interviews test it\n\nIndex questions test whether you can read access patterns rather than repeat ‘indexes make reads faster.’ You should explain which rows are located, which sort disappears, and what writes now cost.\n\n## Common mistakes\n\n- Reversing column order without considering the leftmost prefix.\n- Adding separate single-column indexes and assuming they preserve required ordering.\n- Ignoring write amplification and storage.\n\n## Next steps\n\nUse the warmup to select a two-column index, then inspect the full query-plan optimization problem.",
      keyTakeaways: ["Index order follows equality, range, and ordering requirements.", "Verify with an actual query plan rather than intuition.", "Every index has write, storage, and maintenance cost."],
      examples: ["`WHERE customer_id = ? ORDER BY created_at DESC` commonly benefits from `(customer_id, created_at DESC)`."],
      linkedProblemSlugs: ["recent-orders-index-warmup", "missing-composite-index-orders"],
      sourceUrls: ["https://www.postgresql.org/docs/current/indexes-multicolumn.html"],
      isPlaceholder: false,
    },
  ],
  "system-design/approach-any-system-design": [
    {
      slug: "structure-system-design-answer",
      title: "How to Structure a System Design Answer",
      lessonType: "system_design",
      difficulty: "easy",
      estimatedMinutes: 22,
      contentMarkdown: "## A repeatable sequence\n\nStart by clarifying users, core operations, scale, and the reliability or consistency constraints that change the design. Define a small API and data model, draw the high-level request flow, then deepen the bottlenecks one at a time. End with failure modes, observability, and tradeoffs.\n\n## Why interviews test it\n\nThe interview is deliberately underspecified. Structure shows that you can reduce ambiguity, prioritize, and communicate while making engineering decisions. A diagram with many technologies but no requirements is not a design.\n\n## Common mistakes\n\n- Capacity math before clarifying the workload.\n- Naming products without explaining the property they provide.\n- Spending the entire session on one component and skipping failures.\n\n## Next steps\n\nPractice a 45-minute outline: five minutes of requirements, five of estimates/API, twenty of architecture and deep dives, then reliability and recap.",
      keyTakeaways: ["Requirements and constraints determine which tradeoffs matter.", "Move from API and data flow to targeted deep dives.", "Reserve time for failures, observability, and a clear recap."],
      examples: ["For a notification system, clarify delivery channels, acceptable delay, ordering, retries, and user preferences before choosing queues."],
      linkedProblemSlugs: ["cache-stampede-product-page", "outbox-publisher-marks-before-send"],
      sourceUrls: ["https://sre.google/sre-book/table-of-contents/"],
      isPlaceholder: false,
    },
  ],
  "quant-dev/linux-os-networking": [
    {
      slug: "tcp-vs-udp-quant",
      title: "TCP vs UDP for Quant Dev",
      lessonType: "concept",
      difficulty: "medium",
      estimatedMinutes: 20,
      contentMarkdown: "## Choose properties, not slogans\n\nTCP provides an ordered reliable byte stream, congestion control, and retransmission, but a lost segment delays later bytes on that connection. UDP preserves message boundaries and supports multicast, but applications must detect loss, ordering issues, and duplicates themselves. Market-data systems often use UDP multicast for fanout plus a separate recovery channel.\n\n## Why interviews test it\n\nThe question checks networking fundamentals and whether you can connect transport behavior to latency, fanout, and recovery requirements. ‘UDP is faster’ is not enough.\n\n## Common mistakes\n\n- Claiming UDP cannot be reliable at the application layer.\n- Ignoring sequence numbers, snapshots, replay, and kernel drops.\n- Assuming TCP removes every ordering problem across multiple connections.\n\n## Next steps\n\nTrace a missing market-data sequence through stale marking, replay, and return to live processing.",
      keyTakeaways: ["TCP is an ordered byte stream; UDP is message-oriented and may lose or reorder datagrams.", "Multicast fanout and application recovery often work together.", "Transport choice follows latency, fanout, and correctness requirements."],
      examples: ["Sequence 4102 arriving after 4100 should mark the book stale and trigger replay for 4101."],
      linkedProblemSlugs: ["multicast-gap-recovery-design", "order-book-sequence-state-machine"],
      sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9293", "https://www.rfc-editor.org/rfc/rfc768"],
      isPlaceholder: false,
    },
  ],
  "ai-efficient-engineer/token-efficient-prompting": [
    {
      slug: "token-efficient-debugging-prompts",
      title: "Token-Efficient Debugging Prompts",
      lessonType: "ai_usage",
      difficulty: "easy",
      estimatedMinutes: 16,
      contentMarkdown: "## Give the dependency path, not the whole repository\n\nA strong debugging prompt states the observed failure, expected behavior, constraints, likely entrypoint, relevant contract, and validation command. Let the agent search for call sites and request more context after inspection instead of pasting unrelated code.\n\n## Why interviews and real work test it\n\nEfficient context selection shows that you understand the system well enough to define evidence and boundaries. It also makes generated changes easier to review.\n\n## Common mistakes\n\n- Providing only an error message with no expected behavior.\n- Dumping secrets, full logs, or generated files.\n- Asking for a fix before asking the agent to verify the hypothesis.\n\n## Next steps\n\nPractice turning a vague timeout report into a five-part prompt: outcome, evidence, inspect-first files, constraints, and acceptance checks.",
      keyTakeaways: ["Lead with observable behavior and a validation target.", "Use progressive disclosure of repository context.", "Require the agent to separate observed facts from assumptions."],
      examples: ["Provide the handler, client wrapper, timeout config, focused test, and a targeted call-site search—not the entire service."],
      linkedProblemSlugs: ["ai-debug-prompt-warmup", "ai-token-efficient-repo-task", "ai-select-files-for-timeout-fix"],
      sourceUrls: ["https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot"],
      isPlaceholder: false,
    },
  ],
};

function placeholderLessons(
  pathSlug: string,
  moduleSlug: string,
  moduleTitle: string,
  startOrder: number
): LessonSeed[] {
  const moduleId = learningModuleId(pathSlug, moduleSlug);
  return [
    {
      id: lessonId(moduleId, `${moduleSlug}-foundations`),
      slug: `${pathSlug}-${moduleSlug}-foundations`,
      title: `${moduleTitle}: Foundations`,
      lessonType: "concept",
      difficulty: "easy",
      estimatedMinutes: 20,
      contentMarkdown: `> **Content scaffold**\n\nThis lesson will introduce the vocabulary, mental models, and interview signals for **${moduleTitle}**. Claude should add a concise explanation, one worked example, common mistakes, and a short checkpoint before this lesson is published as complete.`,
      keyTakeaways: [`Explain the core vocabulary of ${moduleTitle}.`, "Recognize the first interview pattern in this topic."],
      examples: ["Add one small worked example and one boundary case."],
      linkedProblemSlugs: [],
      sourceUrls: [],
      order: startOrder,
      isPlaceholder: true,
    },
    {
      id: lessonId(moduleId, `${moduleSlug}-applied-checkpoint`),
      slug: `${pathSlug}-${moduleSlug}-applied-checkpoint`,
      title: `${moduleTitle}: Applied Checkpoint`,
      lessonType: "walkthrough",
      difficulty: "medium",
      estimatedMinutes: 25,
      contentMarkdown: `> **Content scaffold**\n\nThis checkpoint will connect **${moduleTitle}** to a realistic interview scenario. Claude should add a step-by-step walkthrough, warmup/core/challenge links, tradeoff questions, and a self-review checklist.`,
      keyTakeaways: [`Apply ${moduleTitle} to a realistic scenario.`, "Explain one tradeoff without relying on memorized product names."],
      examples: ["Add one interview-style scenario with an explicit reasoning sequence."],
      linkedProblemSlugs: [],
      sourceUrls: [],
      order: startOrder + 1,
      isPlaceholder: true,
    },
  ];
}

export const learningPaths: LearningPathSeed[] = PATH_SPECS.map((path, pathIndex) => ({
  id: learningPathId(path.slug),
  slug: path.slug,
  title: path.title,
  description: path.description,
  targetRoles: path.targetRoles,
  difficulty: path.difficulty,
  estimatedHours: path.estimatedHours,
  order: pathIndex + 1,
  isPublished: true,
  modules: path.modules.map((module, moduleIndex) => {
    const moduleId = learningModuleId(path.slug, module.slug);
    const realLessons = (REAL_LESSONS[`${path.slug}/${module.slug}`] ?? []).map(
      (lesson, lessonIndex): LessonSeed => ({
        ...lesson,
        id: lessonId(moduleId, lesson.slug),
        order: lessonIndex + 1,
      })
    );
    return {
      id: moduleId,
      slug: module.slug,
      title: module.title,
      description: `A guided module for building practical interview fluency in ${module.title.toLowerCase()}.`,
      order: moduleIndex + 1,
      estimatedHours: Math.max(2, Math.round(path.estimatedHours / path.modules.length)),
      prerequisites: moduleIndex === 0 ? [] : [path.modules[moduleIndex - 1].title],
      outcomes: [
        `Explain the core ideas behind ${module.title}.`,
        "Complete a warmup-to-challenge practice sequence and self-review the result.",
      ],
      lessons: [
        ...realLessons,
        ...placeholderLessons(
          path.slug,
          module.slug,
          module.title,
          realLessons.length + 1
        ),
      ],
    };
  }),
}));
