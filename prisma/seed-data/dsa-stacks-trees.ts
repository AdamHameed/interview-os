import { defineProblems, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const DSA_PATH = learningPathId("dsa-confidence-builder");
const STACKS = learningModuleId("stacks-queues-heaps");
const TREES = learningModuleId("trees-graphs");
const STACKS_CONCEPT = lessonId(STACKS, "stacks-queues-heaps-concept");
const STACKS_WALKTHROUGH = lessonId(STACKS, "stacks-queues-heaps-walkthrough");
const TREES_CONCEPT = lessonId(TREES, "trees-graphs-concept");
const TREES_WALKTHROUGH = lessonId(TREES, "trees-graphs-walkthrough");

const LANGUAGES = ["python", "javascript", "typescript"] as const;

/**
 * Batch 11: stacks-queues-heaps and trees-graphs runnable DSA problems.
 * All problems use the global (non-path-scoped) module IDs so they appear
 * on the standalone module pages and in the DSA path.
 */
export const dsaStacksTreesProblems = defineProblems([
  // ─── stacks-queues-heaps warmup 1 ─────────────────────────────────────────
  {
    slug: "heap-task-processing-order",
    title: "Priority Queue: Process Tasks Highest-First",
    type: "dsa",
    difficulty: "easy",
    topics: ["heap", "priority-queue", "greedy"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "process_by_priority",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [STACKS],
    lessonIds: [STACKS_CONCEPT, STACKS_WALKTHROUGH],
    confidenceLevel: "warmup",
    licenseNote: ORIGINAL_NOTE,
    sourceType: "original",
    sourceUrls: [],
    qualityScore: 4,
    rubric: [
      { criterion: "Data structure choice", description: "Uses a heap (not sort) with clear justification of the O(n log n) vs O(n log n) tradeoff and why heaps generalize to streaming." },
      { criterion: "Correctness", description: "Highest priority processed first; all tasks included in output." },
    ],
    prompt:
      "A job queue holds tasks with integer priorities. Process every task, highest priority first. When two tasks share the same priority, process them in the order they were originally given (stable by arrival index).\n\nGiven a list of priorities and a corresponding list of task names, return the task names in the order they should be processed.",
    constraints:
      "1 ≤ len(priorities) == len(names) ≤ 10^5. Priorities are distinct integers — you do not need a tiebreaker. Aim for O(n log n) time.",
    starterCode:
      "import heapq\n\ndef process_by_priority(priorities: list[int], names: list[str]) -> list[str]:\n    ...\n",
    tests: [
      {
        name: "three tasks, distinct priorities",
        input: "priorities=[3,1,2], names=['indexer','logger','monitor']",
        expected: "['indexer', 'monitor', 'logger']",
        args: [[3, 1, 2], ["indexer", "logger", "monitor"]],
        expectedValue: ["indexer", "monitor", "logger"],
      },
      {
        name: "single task",
        input: "priorities=[7], names=['deploy']",
        expected: "['deploy']",
        args: [[7], ["deploy"]],
        expectedValue: ["deploy"],
        hidden: true,
      },
      {
        name: "five tasks sorted descending",
        input: "priorities=[5,3,4,2,1], names=['a','b','c','d','e']",
        expected: "['a', 'c', 'b', 'd', 'e']",
        args: [[5, 3, 4, 2, 1], ["a", "b", "c", "d", "e"]],
        expectedValue: ["a", "c", "b", "d", "e"],
        hidden: true,
      },
      {
        name: "priorities already ascending (worst-case order of input)",
        input: "priorities=[1,2,3,4,5], names=['low','mid','high','urgent','critical']",
        expected: "['critical', 'urgent', 'high', 'mid', 'low']",
        args: [
          [1, 2, 3, 4, 5],
          ["low", "mid", "high", "urgent", "critical"],
        ],
        expectedValue: ["critical", "urgent", "high", "mid", "low"],
        hidden: true,
      },
    ],
    hints: [
      "Push (-priority, name) onto a min-heap. Negating the priority turns the min-heap into a max-heap.",
      "heapq.heapify on the full list is O(n); then n heappops each take O(log n).",
    ],
    solutionOutline:
      "Build a list of (-priority, name) tuples and heapify in O(n). Pop all n elements: each heappop returns the task whose negated priority is smallest (i.e., highest real priority). Collect names in pop order. Total: O(n log n) time, O(n) space.",
    commonMistakes: [
      "Forgetting to negate — heapq is always a min-heap, so without negation the lowest priority processes first.",
      "Using sorted() — O(n log n) but does not illustrate heap mechanics. In a streaming setting (tasks arriving over time) sorted() would not work; the heap pattern generalizes.",
    ],
    followUpQuestions: [
      "If new tasks can arrive mid-processing, how does the heap approach adapt?",
      "How would you implement a stable priority queue when multiple tasks can share a priority?",
    ],
  },

  // ─── stacks-queues-heaps warmup 2 ─────────────────────────────────────────
  {
    slug: "min-stack-simulate",
    title: "Min-Stack: O(1) get_min After Any push or pop",
    type: "dsa",
    difficulty: "easy",
    topics: ["stack", "design", "invariant-maintenance"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "simulate_min_stack",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [STACKS],
    lessonIds: [STACKS_CONCEPT, STACKS_WALKTHROUGH],
    confidenceLevel: "warmup",
    licenseNote: ORIGINAL_NOTE,
    sourceType: "original",
    sourceUrls: [],
    qualityScore: 4,
    rubric: [
      { criterion: "Auxiliary invariant", description: "Maintains a paired running-minimum (secondary stack or value pairs) so get_min is O(1), not a per-call scan." },
      { criterion: "Correctness under pop", description: "get_min stays correct after the current minimum is popped; both stacks stay in lockstep." },
    ],
    prompt:
      "Simulate a min-stack: a stack that supports push, pop, and get_min in O(1) per operation. get_min returns the minimum value currently in the stack without removing it.\n\nYou are given a list of operations as strings:\n- `\"push:N\"` — push the integer N.\n- `\"pop\"` — remove the top element (the stack is always non-empty when pop is called).\n- `\"get_min\"` — record the current minimum.\n\nReturn a list containing the result of every `get_min` operation in order.",
    constraints:
      "1 ≤ len(ops) ≤ 10^4. Push values fit in a 32-bit signed integer. get_min and pop are only called when the stack is non-empty.",
    starterCode:
      "def simulate_min_stack(ops: list[str]) -> list[int]:\n    ...\n",
    tests: [
      {
        name: "push 3 1 4, get_min, pop, get_min",
        input: "ops=['push:3','push:1','push:4','get_min','pop','get_min']",
        expected: "[1, 1]",
        args: [["push:3", "push:1", "push:4", "get_min", "pop", "get_min"]],
        expectedValue: [1, 1],
      },
      {
        name: "push ascending then check as we pop",
        input: "ops=['push:5','push:3','get_min','push:2','get_min','pop','get_min']",
        expected: "[3, 2, 3]",
        args: [
          [
            "push:5",
            "push:3",
            "get_min",
            "push:2",
            "get_min",
            "pop",
            "get_min",
          ],
        ],
        expectedValue: [3, 2, 3],
      },
      {
        name: "duplicate values",
        input: "ops=['push:10','push:10','get_min','pop','get_min']",
        expected: "[10, 10]",
        args: [["push:10", "push:10", "get_min", "pop", "get_min"]],
        expectedValue: [10, 10],
        hidden: true,
      },
      {
        name: "min stays after larger push",
        input: "ops=['push:1','get_min','push:2','get_min']",
        expected: "[1, 1]",
        args: [["push:1", "get_min", "push:2", "get_min"]],
        expectedValue: [1, 1],
        hidden: true,
      },
      {
        name: "negative values",
        input: "ops=['push:-3','push:-1','get_min','pop','get_min']",
        expected: "[-3, -3]",
        args: [["push:-3", "push:-1", "get_min", "pop", "get_min"]],
        expectedValue: [-3, -3],
        hidden: true,
      },
    ],
    hints: [
      "Maintain a secondary 'min stack'. When pushing, push min(value, min_stack[-1]) onto the min stack. When popping, pop from both stacks simultaneously.",
      "Each position in the main stack has a paired running-minimum in the secondary stack. get_min is then just min_stack[-1] — O(1).",
    ],
    solutionOutline:
      "Use two lists: stack (the main stack) and min_stack (tracking the running minimum at each depth). push(v): min_stack.append(min(v, min_stack[-1] if min_stack else v)); stack.append(v). pop(): stack.pop(); min_stack.pop(). get_min(): return min_stack[-1]. All operations O(1). Parse ops by checking the prefix.",
    commonMistakes: [
      "Storing only one global minimum — it breaks when the minimum element is popped.",
      "Recomputing min over the entire stack on get_min — O(n) per call, defeating the purpose.",
      "Forgetting to pop from both stacks on pop() — the min_stack grows without bound.",
    ],
    followUpQuestions: [
      "Can you do this with O(1) extra space by storing (value, min_at_this_level) pairs in a single stack?",
      "How would you add a max_stack in the same structure?",
    ],
  },

  // ─── trees-graphs warmup ──────────────────────────────────────────────────
  {
    slug: "tree-bfs-level-means",
    title: "Binary-Tree BFS: Average Value at Each Depth Level",
    type: "dsa",
    difficulty: "easy",
    topics: ["trees", "bfs", "level-order-traversal"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "level_means",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TREES],
    lessonIds: [TREES_CONCEPT, TREES_WALKTHROUGH],
    confidenceLevel: "warmup",
    licenseNote: ORIGINAL_NOTE,
    sourceType: "original",
    sourceUrls: [],
    qualityScore: 4,
    rubric: [
      { criterion: "Level isolation", description: "Snapshots level_size = len(queue) before the inner loop so children of the current level do not bleed into the current depth's count." },
      { criterion: "Traversal efficiency", description: "Uses a deque with popleft (O(1)), not list.pop(0); O(n) overall." },
    ],
    prompt:
      "You are given a rooted tree with n nodes numbered 0 to n-1. Node 0 is the root. The tree is described by a list of directed edges [parent, child]. Each node also has an integer value at index i in the values list.\n\nReturn a list of floats where the i-th element is the mean value of all nodes at depth i (the root is depth 0).",
    constraints:
      "1 ≤ n ≤ 10^4. The edges describe a valid rooted tree (no cycles, no duplicate edges). Node 0 is always the root. Return exact floating-point averages — all test inputs produce values representable without rounding error.",
    starterCode:
      "from collections import deque\n\ndef level_means(values: list[int], edges: list[list[int]]) -> list[float]:\n    ...\n",
    tests: [
      {
        name: "two-level tree",
        input: "values=[3,9,20,15,7], edges=[[0,1],[0,2],[2,3],[2,4]]",
        expected: "[3.0, 14.5, 11.0]",
        args: [
          [3, 9, 20, 15, 7],
          [
            [0, 1],
            [0, 2],
            [2, 3],
            [2, 4],
          ],
        ],
        expectedValue: [3.0, 14.5, 11.0],
      },
      {
        name: "single node",
        input: "values=[42], edges=[]",
        expected: "[42.0]",
        args: [[42], []],
        expectedValue: [42.0],
      },
      {
        name: "complete binary tree",
        input: "values=[1,2,3,4,5,6,7], edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]",
        expected: "[1.0, 2.5, 5.5]",
        args: [
          [1, 2, 3, 4, 5, 6, 7],
          [
            [0, 1],
            [0, 2],
            [1, 3],
            [1, 4],
            [2, 5],
            [2, 6],
          ],
        ],
        expectedValue: [1.0, 2.5, 5.5],
        hidden: true,
      },
      {
        name: "linear chain (path graph)",
        input: "values=[10,4,6,2,8], edges=[[0,1],[0,2],[1,3],[2,4]]",
        expected: "[10.0, 5.0, 5.0]",
        args: [
          [10, 4, 6, 2, 8],
          [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 4],
          ],
        ],
        expectedValue: [10.0, 5.0, 5.0],
        hidden: true,
      },
    ],
    hints: [
      "BFS with a deque. At the start of each iteration, len(queue) tells you exactly how many nodes are at the current depth level.",
      "Process that many nodes in the inner loop, accumulate their values, then divide by the count before moving to the next level.",
    ],
    solutionOutline:
      "Build a children adjacency list from the edges. BFS: start with deque([0]). Each outer iteration: snapshot level_size = len(queue), sum values for level_size nodes popped from the front, enqueue their children. Append level_sum / level_size to result. Repeat until queue is empty. O(n) time and space.",
    commonMistakes: [
      "Not snapshotting level_size before the inner loop — if you check len(queue) dynamically, newly added children inflate the count and mix levels.",
      "Calling list.pop(0) instead of deque.popleft() — O(n) per pop makes BFS O(n²).",
    ],
    followUpQuestions: [
      "How would you return the maximum value per level instead of the average?",
      "How would you collect all node values per level (not just the average)?",
    ],
  },

  // ─── trees-graphs core ────────────────────────────────────────────────────
  {
    slug: "graph-min-edge-path",
    title: "Undirected Graph: Minimum Hops Between Two Nodes",
    type: "dsa",
    difficulty: "medium",
    topics: ["graphs", "bfs", "shortest-path"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 18,
    language: "python",
    functionName: "min_edge_path",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TREES],
    lessonIds: [TREES_CONCEPT, TREES_WALKTHROUGH],
    confidenceLevel: "core",
    licenseNote: ORIGINAL_NOTE,
    sourceType: "original",
    sourceUrls: [],
    qualityScore: 4,
    rubric: [
      { criterion: "Shortest-path justification", description: "Explains why BFS's first arrival at dst is minimal, and marks nodes visited on enqueue (not pop) to preserve that guarantee." },
      { criterion: "Edge cases", description: "Handles src == dst (return 0) and unreachable dst (return -1) explicitly." },
    ],
    prompt:
      "You are given an undirected unweighted graph with n nodes (numbered 0 to n-1) and a list of edges. Find the minimum number of edges (hops) needed to travel from node src to node dst.\n\nReturn the minimum number of hops, or -1 if dst is unreachable from src.",
    constraints:
      "1 ≤ n ≤ 10^4. 0 ≤ len(edges) ≤ 5×10^4. All edge pairs are distinct; no self-loops. 0 ≤ src, dst < n. O(n + E) time expected.",
    starterCode:
      "from collections import deque\n\ndef min_edge_path(n: int, edges: list[list[int]], src: int, dst: int) -> int:\n    ...\n",
    tests: [
      {
        name: "chain of 6 nodes",
        input: "n=6, edges=[[0,1],[1,2],[2,3],[3,4],[4,5]], src=0, dst=5",
        expected: "5",
        args: [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], 0, 5],
        expectedValue: 5,
      },
      {
        name: "diamond graph — two paths both length 2",
        input: "n=4, edges=[[0,1],[0,2],[1,3],[2,3]], src=0, dst=3",
        expected: "2",
        args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]], 0, 3],
        expectedValue: 2,
      },
      {
        name: "dst unreachable (disconnected graph)",
        input: "n=5, edges=[[0,1],[1,2]], src=0, dst=4",
        expected: "-1",
        args: [5, [[0, 1], [1, 2]], 0, 4],
        expectedValue: -1,
        hidden: true,
      },
      {
        name: "src equals dst",
        input: "n=3, edges=[[0,1],[1,2]], src=1, dst=1",
        expected: "0",
        args: [3, [[0, 1], [1, 2]], 1, 1],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "two separate components",
        input: "n=6, edges=[[0,1],[1,2],[3,4],[4,5]], src=0, dst=5",
        expected: "-1",
        args: [6, [[0, 1], [1, 2], [3, 4], [4, 5]], 0, 5],
        expectedValue: -1,
        hidden: true,
      },
    ],
    hints: [
      "BFS guarantees that the first time you reach dst, the distance is minimal in an unweighted graph.",
      "Mark nodes as visited the moment you add them to the queue — not when you pop them. This prevents the same node from being enqueued multiple times at different distances.",
      "Handle src == dst as an immediate return 0 before starting BFS.",
    ],
    solutionOutline:
      "If src == dst, return 0. Build an undirected adjacency list. BFS: start with deque([(src, 0)]) and visited={src}. Pop (node, dist). For each neighbor: if neighbor == dst, return dist+1. If not visited, add to visited and enqueue (neighbor, dist+1). Return -1 if queue empties. O(n+E) time.",
    commonMistakes: [
      "Marking visited when popping (instead of when enqueuing) — nodes can be re-enqueued at larger distances, breaking the distance count.",
      "Forgetting to add both directions for undirected edges: adj[u].append(v) and adj[v].append(u).",
      "Not handling the src==dst early return — the BFS loop never enqueues dst as a neighbor of itself.",
    ],
    followUpQuestions: [
      "If the graph were weighted, what algorithm would you use instead?",
      "How would you reconstruct the actual path (not just its length)?",
    ],
  },

  // ─── trees-graphs core 2 ─────────────────────────────────────────────────
  {
    slug: "graph-bipartite-coloring",
    title: "Graph Coloring: Can the Graph Be Split Into Two Groups?",
    type: "dsa",
    difficulty: "medium",
    topics: ["graphs", "bfs", "bipartite", "coloring"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 20,
    language: "python",
    functionName: "is_bipartite",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TREES],
    lessonIds: [TREES_CONCEPT],
    confidenceLevel: "core",
    licenseNote: ORIGINAL_NOTE,
    sourceType: "original",
    sourceUrls: [],
    qualityScore: 4,
    rubric: [
      { criterion: "Two-coloring logic", description: "Assigns alternating colors during traversal and reports failure when adjacent nodes share a color (an odd cycle)." },
      { criterion: "All components covered", description: "Loops over every node to seed a fresh BFS/DFS so disconnected components are all checked." },
    ],
    prompt:
      "A graph is bipartite if every node can be assigned one of two colors such that no two adjacent nodes share the same color. Equivalently, a graph is bipartite if and only if it contains no odd-length cycle.\n\nGiven an undirected graph with n nodes (0 to n-1) and a list of edges, determine whether the graph is bipartite. The graph may be disconnected — all components must be bipartite for the answer to be True.",
    constraints:
      "1 ≤ n ≤ 10^4. 0 ≤ len(edges) ≤ 5×10^4. No self-loops, no duplicate edges. O(n + E) expected.",
    starterCode:
      "from collections import deque\n\ndef is_bipartite(n: int, edges: list[list[int]]) -> bool:\n    ...\n",
    tests: [
      {
        name: "4-cycle (bipartite: alternating colors)",
        input: "n=4, edges=[[0,1],[0,3],[1,2],[2,3]]",
        expected: "True",
        args: [4, [[0, 1], [0, 3], [1, 2], [2, 3]]],
        expectedValue: true,
      },
      {
        name: "triangle (odd cycle — not bipartite)",
        input: "n=3, edges=[[0,1],[1,2],[0,2]]",
        expected: "False",
        args: [3, [[0, 1], [1, 2], [0, 2]]],
        expectedValue: false,
      },
      {
        name: "disconnected: one edge plus a triangle",
        input: "n=5, edges=[[0,1],[2,3],[3,4],[4,2]]",
        expected: "False",
        args: [5, [[0, 1], [2, 3], [3, 4], [4, 2]]],
        expectedValue: false,
        hidden: true,
      },
      {
        name: "disconnected: two disjoint edges (both bipartite)",
        input: "n=4, edges=[[0,1],[2,3]]",
        expected: "True",
        args: [4, [[0, 1], [2, 3]]],
        expectedValue: true,
        hidden: true,
      },
      {
        name: "5-cycle (odd — not bipartite)",
        input: "n=5, edges=[[0,1],[1,2],[2,3],[3,4],[4,0]]",
        expected: "False",
        args: [5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]],
        expectedValue: false,
        hidden: true,
      },
    ],
    hints: [
      "BFS from each unvisited node. Assign it color 0. For each neighbor, assign the opposite color (1 - current_color). If a neighbor already has the same color as the current node, the graph is not bipartite.",
      "The graph may be disconnected — loop over all nodes and start a BFS from any that haven't been colored yet.",
    ],
    solutionOutline:
      "Build undirected adjacency list. Maintain a color array initialized to -1 (uncolored). For each node 0..n-1: if not colored, BFS from it with color 0. For each neighbor: if uncolored, assign opposite color and enqueue. If already colored the same as current node, return False. If all components pass, return True. O(n+E).",
    commonMistakes: [
      "Only BFS-ing from node 0 — disconnected components are skipped and a non-bipartite component in a disconnected graph is missed.",
      "Using DFS without careful visited tracking, revisiting the parent node and falsely detecting a conflict.",
    ],
    followUpQuestions: [
      "What does bipartiteness mean for matching problems (e.g., job assignments)?",
      "If the graph is bipartite, how would you reconstruct the two color groups?",
    ],
  },

  // ─── trees-graphs challenge ───────────────────────────────────────────────
  {
    slug: "build-order-topo-sort",
    title: "Dependency Resolution: Find the Lexicographically Smallest Build Order",
    type: "dsa",
    difficulty: "hard",
    topics: ["graphs", "topological-sort", "cycle-detection", "dag"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 25,
    language: "python",
    functionName: "build_order",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TREES],
    lessonIds: [TREES_CONCEPT, TREES_WALKTHROUGH],
    confidenceLevel: "challenge",
    licenseNote: ORIGINAL_NOTE,
    sourceType: "original",
    sourceUrls: [],
    qualityScore: 4,
    rubric: [
      { criterion: "Topological correctness", description: "Builds edges in the correct direction (prerequisite → dependent) and uses a min-heap of zero-in-degree nodes for the lexicographically smallest order." },
      { criterion: "Cycle detection", description: "Returns [] when the result length is less than n, correctly identifying an impossible ordering." },
    ],
    prompt:
      "You are managing n packages numbered 0 to n-1. A dependency list contains pairs [a, b] meaning 'package a depends on package b' — b must be installed before a.\n\nReturn the lexicographically smallest valid installation order (i.e., when multiple packages are ready to install, always pick the lowest-numbered one first).\n\nIf the dependencies form a cycle (making a valid order impossible), return an empty list [].",
    constraints:
      "1 ≤ n ≤ 2000. 0 ≤ len(deps) ≤ 10^4. Each [a, b] pair is distinct. Self-dependencies do not appear. O(n + E) time, O(n) space.",
    starterCode:
      "import heapq\n\ndef build_order(n: int, deps: list[list[int]]) -> list[int]:\n    ...\n",
    tests: [
      {
        name: "linear chain: 1 needs 0, 2 needs 1, 3 needs 2",
        input: "n=4, deps=[[1,0],[2,1],[3,2]]",
        expected: "[0, 1, 2, 3]",
        args: [4, [[1, 0], [2, 1], [3, 2]]],
        expectedValue: [0, 1, 2, 3],
      },
      {
        name: "cycle (0 needs 1 and 1 needs 0)",
        input: "n=2, deps=[[0,1],[1,0]]",
        expected: "[]",
        args: [2, [[0, 1], [1, 0]]],
        expectedValue: [],
      },
      {
        name: "fan-in: 3 depends on all of 0, 1, 2",
        input: "n=4, deps=[[3,0],[3,1],[3,2]]",
        expected: "[0, 1, 2, 3]",
        args: [4, [[3, 0], [3, 1], [3, 2]]],
        expectedValue: [0, 1, 2, 3],
        hidden: true,
      },
      {
        name: "shared prerequisite: both 0 and 1 need 2",
        input: "n=3, deps=[[0,2],[1,2]]",
        expected: "[2, 0, 1]",
        args: [3, [[0, 2], [1, 2]]],
        expectedValue: [2, 0, 1],
        hidden: true,
      },
      {
        name: "no dependencies (all free)",
        input: "n=3, deps=[]",
        expected: "[0, 1, 2]",
        args: [3, []],
        expectedValue: [0, 1, 2],
        hidden: true,
      },
    ],
    hints: [
      "Build a directed graph: for dep [a, b] (a needs b), add edge b → a and increment in_degree[a]. Nodes with in_degree 0 are ready to install.",
      "Use a min-heap instead of a plain queue. Each time you pop a package, decrement the in_degree of its dependents and push any that reach 0.",
      "If the result list contains fewer than n packages at the end, some packages were in a cycle and could never reach in_degree 0 — return [] for the cycle case.",
    ],
    solutionOutline:
      "Compute in_degree[0..n-1] and build adj[b] = [packages that need b]. Min-heap initialized with all packages where in_degree == 0. Kahn's algorithm: heappop a package, append to result, for each dependent decrement in_degree and heappush if it reaches 0. If len(result) == n, return result; else return [] (cycle detected). The min-heap ensures lexicographically smallest order when multiple packages are simultaneously installable.",
    commonMistakes: [
      "Using a regular FIFO queue instead of a min-heap — produces a valid topological order but not necessarily the lexicographically smallest one.",
      "Building adj[a] = [b] (wrong direction) — this reverses the graph and produces a reversed order or misses the cycle.",
      "Not checking len(result) == n at the end — the cycle case silently returns a partial result instead of [].",
    ],
    followUpQuestions: [
      "How would you detect and report which packages form the cycle?",
      "If packages have estimated install times, how would you minimize the total build time using parallel installs?",
    ],
  },
]);
