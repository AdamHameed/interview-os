import { defineProblems, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const DSA_PATH = learningPathId("dsa-confidence-builder");
const ADV_GRAPHS = learningModuleId("advanced-graphs");
const MATH_GEO = learningModuleId("math-geometry");
const ADV_CONCEPT = lessonId(ADV_GRAPHS, "advanced-graphs-concept");
const ADV_WALKTHROUGH = lessonId(ADV_GRAPHS, "advanced-graphs-walkthrough");
const MATH_CONCEPT = lessonId(MATH_GEO, "math-geometry-concept");
const MATH_WALKTHROUGH = lessonId(MATH_GEO, "math-geometry-walkthrough");

const LANGUAGES = ["python", "javascript", "typescript"] as const;

/**
 * Batch 15: advanced-graphs (weighted shortest paths + MST) and
 * math-geometry runnable DSA problems. Global (non-path-scoped) module
 * IDs so they appear on the standalone module pages and in the DSA path.
 */
export const dsaAdvancedGraphsMathProblems = defineProblems([
  // ─── advanced-graphs warmup 1 ─────────────────────────────────────────────
  {
    slug: "adv-dijkstra-shortest-path",
    title: "Dijkstra: Shortest Path on a Weighted Graph",
    type: "dsa",
    difficulty: "easy",
    topics: ["graphs", "dijkstra", "shortest-path", "heap"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 20,
    language: "python",
    functionName: "dijkstra_shortest_path",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [ADV_GRAPHS],
    lessonIds: [ADV_CONCEPT, ADV_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "You are given a directed weighted graph with n nodes (0 to n-1) as a list of edges [u, v, w] meaning a directed edge from u to v with non-negative weight w. Return the length of the shortest path from src to dst, or -1 if dst is unreachable.\n\nExample: n=5, edges=[[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5]], src=0, dst=3 → 4 (path 0→2→1→3 costs 1+2+1).",
    constraints:
      "1 ≤ n ≤ 10^4, 0 ≤ edges ≤ 5×10^4, 0 ≤ w ≤ 10^6 (non-negative — that is what makes Dijkstra valid). Use a min-heap keyed by distance for O((V+E) log V).",
    starterCode:
      "import heapq\n\ndef dijkstra_shortest_path(n: int, edges: list[list[int]], src: int, dst: int) -> int:\n    ...\n",
    tests: [
      {
        name: "cheaper indirect path wins",
        input: "n=5, edges=[[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5]], src=0, dst=3",
        expected: "4",
        args: [5, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5]], 0, 3],
        expectedValue: 4,
      },
      {
        name: "unreachable destination",
        input: "n=3, edges=[[0,1,1]], src=0, dst=2",
        expected: "-1",
        args: [3, [[0, 1, 1]], 0, 2],
        expectedValue: -1,
      },
      {
        name: "src equals dst",
        input: "n=1, edges=[], src=0, dst=0",
        expected: "0",
        args: [1, [], 0, 0],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "direct edge is not always best",
        input: "n=3, edges=[[0,2,10],[0,1,1],[1,2,2]], src=0, dst=2",
        expected: "3",
        args: [3, [[0, 2, 10], [0, 1, 1], [1, 2, 2]], 0, 2],
        expectedValue: 3,
        hidden: true,
      },
    ],
    hints: [
      "Maintain a dist[] array (all infinity except dist[src]=0) and a min-heap of (distance, node).",
      "Pop the closest unsettled node; if its popped distance is stale (greater than dist[node]), skip it. Otherwise relax each outgoing edge.",
      "The first time you pop a node, its distance is final — that is Dijkstra's greedy invariant, valid only because weights are non-negative.",
    ],
    solutionOutline:
      "Build an adjacency list. dist = [inf]*n, dist[src] = 0, heap = [(0, src)]. While the heap is non-empty: pop (d, u); if d > dist[u], skip (a stale entry). Otherwise for each edge (u→v, w): if d + w < dist[v], set dist[v] = d + w and push (dist[v], v). Return dist[dst] or -1 if still infinite. Non-negative weights guarantee that the first pop of a node is its final shortest distance. O((V+E) log V).",
    commonMistakes: [
      "Marking a node settled when you push it instead of when you pop it — a shorter path found later would then be ignored.",
      "Not skipping stale heap entries (d > dist[u]), doing redundant relaxations (still correct but slower).",
      "Applying Dijkstra with negative edges — the greedy invariant breaks; use Bellman-Ford instead.",
    ],
    followUpQuestions: [
      "Why does a negative edge weight break Dijkstra's 'first pop is final' guarantee?",
      "How would you reconstruct the actual path, not just its length?",
    ],
    rubric: [
      { criterion: "Dijkstra invariant", description: "Settles nodes on pop, relaxes non-negative edges, and skips stale heap entries." },
      { criterion: "Unreachable handling", description: "Returns -1 when the destination stays at infinity." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── advanced-graphs warmup 2 ─────────────────────────────────────────────
  {
    slug: "adv-network-delay-time",
    title: "Network Delay: When Does the Signal Reach Everyone?",
    type: "dsa",
    difficulty: "easy",
    topics: ["graphs", "dijkstra", "shortest-path"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 18,
    language: "python",
    functionName: "network_delay_time",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [ADV_GRAPHS],
    lessonIds: [ADV_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "A signal is sent from a source node through a directed weighted network of n nodes (numbered 1 to n). Each edge [u, v, w] means a signal takes w time to travel from u to v. Return the minimum time for ALL nodes to receive the signal, or -1 if some node can never receive it.\n\nThe answer is the maximum over all nodes of the shortest travel time from the source.\n\nExample: n=4, times=[[2,1,1],[2,3,1],[3,4,1]], src=2 → 2 (node 4 receives last, at time 2).",
    constraints:
      "1 ≤ n ≤ 100, 1 ≤ len(times) ≤ 6000, 1 ≤ w ≤ 100, nodes are 1-indexed. Run Dijkstra from the source; the answer is the largest finite distance, or -1 if any node is unreachable.",
    starterCode:
      "import heapq\n\ndef network_delay_time(n: int, times: list[list[int]], src: int) -> int:\n    ...\n",
    tests: [
      {
        name: "chain from source",
        input: "n=4, times=[[2,1,1],[2,3,1],[3,4,1]], src=2",
        expected: "2",
        args: [4, [[2, 1, 1], [2, 3, 1], [3, 4, 1]], 2],
        expectedValue: 2,
      },
      {
        name: "single hop reaches all",
        input: "n=2, times=[[1,2,1]], src=1",
        expected: "1",
        args: [2, [[1, 2, 1]], 1],
        expectedValue: 1,
      },
      {
        name: "a node is unreachable",
        input: "n=2, times=[[1,2,1]], src=2",
        expected: "-1",
        args: [2, [[1, 2, 1]], 2],
        expectedValue: -1,
        hidden: true,
      },
    ],
    hints: [
      "This is Dijkstra plus one aggregation step: compute the shortest time to every node, then take the maximum.",
      "Nodes are 1-indexed — size your structures accordingly (or offset).",
      "If any node's shortest time is still infinity after Dijkstra, that node is unreachable → return -1.",
    ],
    solutionOutline:
      "Run Dijkstra from src to get the shortest arrival time at every node. 'All nodes received the signal' happens at the moment the last (farthest) node receives it, which is max(dist over all n nodes). If fewer than n nodes are reachable (some dist is infinite), return -1; otherwise return the maximum finite distance. O((V+E) log V).",
    commonMistakes: [
      "Returning the sum or the source-to-one-node distance instead of the max over all nodes.",
      "Off-by-one errors from 1-indexed nodes.",
      "Forgetting the reachability check — an unreachable node must produce -1, not a partial max.",
    ],
    followUpQuestions: [
      "Why is the 'all nodes received' time the maximum of the individual shortest times, not the sum?",
      "How would you identify which node is the bottleneck (last to receive)?",
    ],
    rubric: [
      { criterion: "Dijkstra + aggregation", description: "Computes single-source shortest times and returns their maximum." },
      { criterion: "Reachability", description: "Returns -1 when any node is unreachable." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── advanced-graphs core 1 ───────────────────────────────────────────────
  {
    slug: "adv-min-cost-connect-points",
    title: "Minimum Spanning Tree: Connect All Points Cheaply",
    type: "dsa",
    difficulty: "medium",
    topics: ["graphs", "mst", "prim", "kruskal"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 24,
    language: "python",
    functionName: "min_cost_connect_points",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [ADV_GRAPHS],
    lessonIds: [ADV_CONCEPT, ADV_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "You are given n points on a 2D plane. The cost to connect two points is the Manhattan distance between them: |x1 - x2| + |y1 - y2|. Return the minimum total cost to connect all points so that there is exactly one path between any two points (a spanning tree).\n\nExample: points=[[0,0],[2,2],[3,10],[5,2],[7,0]] → 20.",
    constraints:
      "1 ≤ n ≤ 1000, coordinates fit in 32-bit ints. The graph is complete (every pair is connectable), so a dense-graph MST (Prim with an O(n²) or heap approach) fits. Return 0 for a single point.",
    starterCode:
      "import heapq\n\ndef min_cost_connect_points(points: list[list[int]]) -> int:\n    ...\n",
    tests: [
      {
        name: "five points",
        input: "points=[[0,0],[2,2],[3,10],[5,2],[7,0]]",
        expected: "20",
        args: [[[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]],
        expectedValue: 20,
      },
      {
        name: "two points",
        input: "points=[[0,0],[1,1]]",
        expected: "2",
        args: [[[0, 0], [1, 1]]],
        expectedValue: 2,
      },
      {
        name: "single point needs no edges",
        input: "points=[[0,0]]",
        expected: "0",
        args: [[[0, 0]]],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "A minimum spanning tree connects all n nodes with n-1 edges at minimum total weight.",
      "Prim's algorithm: start from any point, repeatedly add the cheapest edge from the connected set to a not-yet-connected point.",
      "Use a min-heap of (distance, point); each time you pop a fresh point, add its weight and push distances to all remaining points.",
    ],
    solutionOutline:
      "Prim's MST. Maintain a set of connected points and a min-heap of (edge_cost, point). Start by pushing (0, 0). Repeatedly pop the cheapest (w, u); if u is already connected, skip; else mark u connected, add w to the total, and for every not-yet-connected point v push (manhattan(u, v), v). Stop when all n points are connected. Return the total. Because the graph is complete, Prim naturally considers the cheapest crossing edge at each step. O(n² log n) with a heap; an O(n²) array-based Prim also works well for dense graphs.",
    commonMistakes: [
      "Adding an edge to an already-connected point (creating a cycle) — always skip points already in the tree.",
      "Building all O(n²) edges explicitly and sorting for Kruskal when n is large — Prim on the implicit complete graph is cleaner here.",
      "Using Euclidean instead of Manhattan distance.",
    ],
    followUpQuestions: [
      "How would Kruskal's algorithm with union-find solve the same problem, and when is it preferable?",
      "Why does the greedy 'cheapest crossing edge' choice (the cut property) yield a globally minimum tree?",
    ],
    rubric: [
      { criterion: "MST construction", description: "Uses Prim (or Kruskal) to add cheapest crossing edges without forming cycles." },
      { criterion: "Termination", description: "Connects all n points with n-1 edges and returns the minimum total cost." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── advanced-graphs core 2 ───────────────────────────────────────────────
  {
    slug: "adv-cheapest-flights-k-stops",
    title: "Cheapest Flight Within K Stops",
    type: "dsa",
    difficulty: "medium",
    topics: ["graphs", "bellman-ford", "shortest-path", "bounded-hops"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 26,
    language: "python",
    functionName: "cheapest_flights_k_stops",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [ADV_GRAPHS],
    lessonIds: [ADV_CONCEPT, ADV_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "There are n cities (0 to n-1) connected by directed flights [u, v, price]. Find the cheapest price from src to dst using at most k stops (k intermediate cities, i.e., at most k+1 flights). Return -1 if there is no such route.\n\nExample: n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1 → 700 (0→1→3; the cheaper 0→1→2→3=400 uses 2 stops, exceeding k=1).",
    constraints:
      "1 ≤ n ≤ 100, 0 ≤ len(flights) ≤ n×(n-1), 1 ≤ price ≤ 10^4, 0 ≤ k < n. The stop limit makes plain Dijkstra unsafe (the cheapest path may exceed k stops); use Bellman-Ford relaxed exactly k+1 times over a snapshot of distances.",
    starterCode:
      "def cheapest_flights_k_stops(n: int, flights: list[list[int]], src: int, dst: int, k: int) -> int:\n    ...\n",
    tests: [
      {
        name: "stop limit forbids the cheaper 2-stop route",
        input: "n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1",
        expected: "700",
        args: [
          4,
          [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]],
          0,
          3,
          1,
        ],
        expectedValue: 700,
      },
      {
        name: "one stop allowed, indirect is cheaper",
        input: "n=3, flights=[[0,1,100],[1,2,100],[0,2,500]], src=0, dst=2, k=1",
        expected: "200",
        args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1],
        expectedValue: 200,
      },
      {
        name: "zero stops forces the direct flight",
        input: "n=3, flights=[[0,1,100],[1,2,100],[0,2,500]], src=0, dst=2, k=0",
        expected: "500",
        args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0],
        expectedValue: 500,
        hidden: true,
      },
    ],
    hints: [
      "Bellman-Ford relaxes all edges in rounds; after r rounds, dist[] holds the cheapest cost using at most r edges.",
      "Run exactly k+1 rounds (k stops = k+1 edges). Relax against a SNAPSHOT of the previous round's distances so a single round cannot chain multiple flights.",
      "The snapshot is the crucial detail — relaxing in place would let one round use more than one new edge, violating the stop limit.",
    ],
    solutionOutline:
      "Initialize dist = [inf]*n, dist[src] = 0. Repeat k+1 times: copy dist into a fresh array nd; for each flight (u, v, p), if dist[u] + p < nd[v], set nd[v] = dist[u] + p; then dist = nd. After k+1 rounds, dist[dst] is the cheapest cost using at most k+1 flights (k stops), or -1 if still infinite. The per-round snapshot ensures each round adds at most one edge to any path — this is what enforces the hop bound and distinguishes this from plain shortest path. O(k × E).",
    commonMistakes: [
      "Relaxing in place (without the snapshot), letting one round traverse multiple flights and undercounting stops.",
      "Running k rounds instead of k+1 (k stops means k+1 flights).",
      "Using plain Dijkstra and returning a path that violates the stop limit because it was cheaper.",
    ],
    followUpQuestions: [
      "Why does the per-round snapshot guarantee at most one additional edge per round?",
      "How would a modified Dijkstra that tracks (cost, stops) states compare in complexity?",
    ],
    rubric: [
      { criterion: "Bounded relaxation", description: "Runs k+1 Bellman-Ford rounds against a per-round snapshot to enforce the stop limit." },
      { criterion: "Correct bound", description: "Maps k stops to k+1 edges and returns -1 when unreachable within the limit." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── math-geometry warmup 1 ───────────────────────────────────────────────
  {
    slug: "math-gcd-of-array",
    title: "GCD of an Array via the Euclidean Algorithm",
    type: "dsa",
    difficulty: "easy",
    topics: ["math", "gcd", "number-theory"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "gcd_of_array",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [MATH_GEO],
    lessonIds: [MATH_CONCEPT, MATH_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Given a list of positive integers, return the greatest common divisor (GCD) of all of them — the largest integer that divides every element.\n\nExample: [12, 18, 24] → 6.",
    constraints:
      "1 ≤ len(nums) ≤ 10^5, 1 ≤ nums[i] ≤ 10^9. Use the Euclidean algorithm: gcd(a, b) = gcd(b, a mod b). Fold it across the array; O(n log(max value)).",
    starterCode:
      "def gcd_of_array(nums: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "common factor 6",
        input: "nums=[12,18,24]",
        expected: "6",
        args: [[12, 18, 24]],
        expectedValue: 6,
      },
      {
        name: "single element",
        input: "nums=[7]",
        expected: "7",
        args: [[7]],
        expectedValue: 7,
      },
      {
        name: "all multiples of 5",
        input: "nums=[5,10,15,20]",
        expected: "5",
        args: [[5, 10, 15, 20]],
        expectedValue: 5,
        hidden: true,
      },
      {
        name: "coprime pair",
        input: "nums=[17,5]",
        expected: "1",
        args: [[17, 5]],
        expectedValue: 1,
        hidden: true,
      },
    ],
    hints: [
      "The Euclidean algorithm: gcd(a, b) = gcd(b, a mod b), terminating when b becomes 0 (then a is the gcd).",
      "gcd is associative: gcd(a, b, c) = gcd(gcd(a, b), c). Fold the pairwise gcd across the array.",
      "An early exit: once the running gcd reaches 1, it can never decrease further — you may stop.",
    ],
    solutionOutline:
      "Define gcd(a, b) via Euclid: while b: a, b = b, a % b; return a. Fold it: start with result = nums[0], then result = gcd(result, nums[i]) for each subsequent element. gcd is associative so the order does not matter. Optionally short-circuit when result == 1. Each gcd is O(log(min)) by Euclid, so the whole thing is O(n log(max value)).",
    commonMistakes: [
      "Recomputing prime factorizations instead of using the far faster Euclidean algorithm.",
      "Infinite loop from swapping incorrectly in the Euclid step (get the a, b = b, a % b order right).",
      "Assuming gcd needs sorted input — it does not.",
    ],
    followUpQuestions: [
      "How would you compute the LCM of the array from the GCD, and what overflow risk appears?",
      "Why does the Euclidean algorithm terminate in O(log(min(a,b))) steps?",
    ],
    rubric: [
      { criterion: "Euclidean algorithm", description: "Implements gcd(a,b)=gcd(b,a mod b) correctly and folds it across the array." },
      { criterion: "Edge handling", description: "Handles a single element and coprime inputs (gcd 1)." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── math-geometry warmup 2 ───────────────────────────────────────────────
  {
    slug: "math-factorial-trailing-zeroes",
    title: "Trailing Zeroes in n Factorial",
    type: "dsa",
    difficulty: "easy",
    topics: ["math", "number-theory", "counting"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "factorial_trailing_zeroes",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [MATH_GEO],
    lessonIds: [MATH_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "Return the number of trailing zeroes in n! (n factorial). Do NOT compute the factorial itself — n can be large.\n\nExample: 25! ends in 6 zeroes.",
    constraints:
      "0 ≤ n ≤ 10^9. A trailing zero comes from a factor of 10 = 2×5, and 5s are scarcer than 2s, so the answer is the number of factor-5s in n!. Count them with the Legendre formula: floor(n/5) + floor(n/25) + floor(n/125) + …; O(log n).",
    starterCode:
      "def factorial_trailing_zeroes(n: int) -> int:\n    ...\n",
    tests: [
      {
        name: "5! = 120",
        input: "n=5",
        expected: "1",
        args: [5],
        expectedValue: 1,
      },
      {
        name: "10!",
        input: "n=10",
        expected: "2",
        args: [10],
        expectedValue: 2,
      },
      {
        name: "25! (an extra 5 from 25)",
        input: "n=25",
        expected: "6",
        args: [25],
        expectedValue: 6,
        hidden: true,
      },
      {
        name: "0! = 1",
        input: "n=0",
        expected: "0",
        args: [0],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "100!",
        input: "n=100",
        expected: "24",
        args: [100],
        expectedValue: 24,
        hidden: true,
      },
    ],
    hints: [
      "A trailing zero is a factor of 10 = 2 × 5. In n!, factors of 2 are far more common than factors of 5, so the count of 5s is the bottleneck.",
      "Count multiples of 5 (n//5), then multiples of 25 contribute an extra 5 each (n//25), then 125 (n//125), and so on.",
      "Sum floor(n / 5^i) for i = 1, 2, 3, … until 5^i exceeds n.",
    ],
    solutionOutline:
      "The number of trailing zeroes equals the exponent of 5 in the prime factorization of n! (since 2s are always more plentiful). By Legendre's formula that exponent is sum over i≥1 of floor(n / 5^i): floor(n/5) counts numbers contributing at least one 5, floor(n/25) the extra 5 from multiples of 25, etc. Loop: power = 5; count = 0; while power <= n: count += n // power; power *= 5. Return count. O(log_5 n).",
    commonMistakes: [
      "Computing n! directly — it overflows and is infeasible for large n.",
      "Only counting floor(n/5) and missing the extra 5s from 25, 125, … (e.g., 25! has 6, not 5).",
      "Counting factors of 2 or 10 instead of 5.",
    ],
    followUpQuestions: [
      "Why are factors of 5 always the limiting resource versus factors of 2?",
      "How would you count trailing zeroes of n! in base 12 instead of base 10?",
    ],
    rubric: [
      { criterion: "Legendre insight", description: "Counts factor-5s via floor(n/5)+floor(n/25)+… rather than computing the factorial." },
      { criterion: "Higher powers", description: "Includes the extra 5s from 25, 125, … (correct on n=25)." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── math-geometry core 1 ─────────────────────────────────────────────────
  {
    slug: "math-count-primes-sieve",
    title: "Count Primes Below n With the Sieve of Eratosthenes",
    type: "dsa",
    difficulty: "medium",
    topics: ["math", "primes", "sieve", "number-theory"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 20,
    language: "python",
    functionName: "count_primes",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [MATH_GEO],
    lessonIds: [MATH_CONCEPT, MATH_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Return the number of prime numbers strictly less than n.\n\nExample: n=10 → 4 (the primes below 10 are 2, 3, 5, 7).",
    constraints:
      "0 ≤ n ≤ 5×10^6. Trial-dividing each number is too slow near the upper bound; use the Sieve of Eratosthenes: O(n log log n) time, O(n) space. Note the boundary — count primes strictly less than n.",
    starterCode:
      "def count_primes(n: int) -> int:\n    ...\n",
    tests: [
      {
        name: "primes below 10",
        input: "n=10",
        expected: "4",
        args: [10],
        expectedValue: 4,
      },
      {
        name: "no primes below 2",
        input: "n=2",
        expected: "0",
        args: [2],
        expectedValue: 0,
      },
      {
        name: "primes below 20",
        input: "n=20",
        expected: "8",
        args: [20],
        expectedValue: 8,
        hidden: true,
      },
      {
        name: "edge n=0",
        input: "n=0",
        expected: "0",
        args: [0],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "edge n=1",
        input: "n=1",
        expected: "0",
        args: [1],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "Create a boolean array is_prime of size n, all True except indices 0 and 1.",
      "For each i from 2 up to sqrt(n): if is_prime[i], mark all multiples of i (starting at i*i) as not prime.",
      "Starting the inner loop at i*i (not 2*i) avoids redundant work — smaller multiples were already marked by smaller primes.",
    ],
    solutionOutline:
      "If n < 3, return 0. Allocate sieve = [True]*n; set sieve[0] = sieve[1] = False. For i from 2 to floor(sqrt(n-1)): if sieve[i], mark sieve[i*i], sieve[i*i+i], … up to n-1 as False. The count of remaining True entries is the number of primes below n. Starting the marking at i*i is the standard optimization (all smaller multiples of i already carry a smaller prime factor). O(n log log n) time.",
    commonMistakes: [
      "Trial division per number (O(n√n)) which times out near n = 5×10^6.",
      "Off-by-one on the boundary — the problem counts primes strictly less than n (sieve size n, indices 0..n-1).",
      "Starting multiple-marking at 2*i instead of i*i, doing extra redundant work.",
    ],
    followUpQuestions: [
      "Why can the outer loop stop at sqrt(n), and why start marking at i*i?",
      "How would a segmented sieve reduce memory for very large n?",
    ],
    rubric: [
      { criterion: "Sieve correctness", description: "Marks composites via the Sieve of Eratosthenes and counts primes strictly below n." },
      { criterion: "Optimizations", description: "Outer loop to sqrt(n), inner marking from i*i, correct boundary handling." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── math-geometry core 2 ─────────────────────────────────────────────────
  {
    slug: "math-modular-exponentiation",
    title: "Fast Modular Exponentiation",
    type: "dsa",
    difficulty: "medium",
    topics: ["math", "modular-arithmetic", "binary-exponentiation"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup", "hft"],
    estimatedMinutes: 20,
    language: "python",
    functionName: "mod_pow",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [MATH_GEO],
    lessonIds: [MATH_CONCEPT, MATH_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Compute (base ^ exponent) mod modulus efficiently, without ever forming the astronomically large intermediate power.\n\nExample: mod_pow(2, 100, 1000000007) → 976371285.",
    constraints:
      "0 ≤ base ≤ 10^9, 0 ≤ exponent ≤ 10^9, 1 ≤ modulus ≤ 10^9. Use binary (fast) exponentiation: square the base and halve the exponent, multiplying the result in whenever the current bit is 1. O(log exponent) multiplications, taking the modulus at every step.",
    starterCode:
      "def mod_pow(base: int, exponent: int, modulus: int) -> int:\n    ...\n",
    tests: [
      {
        name: "2^10 mod 1000",
        input: "base=2, exponent=10, modulus=1000",
        expected: "24",
        args: [2, 10, 1000],
        expectedValue: 24,
      },
      {
        name: "anything^0 is 1",
        input: "base=3, exponent=0, modulus=5",
        expected: "1",
        args: [3, 0, 5],
        expectedValue: 1,
      },
      {
        name: "large exponent with prime modulus",
        input: "base=2, exponent=100, modulus=1000000007",
        expected: "976371285",
        args: [2, 100, 1000000007],
        expectedValue: 976371285,
        hidden: true,
      },
      {
        name: "5^3 mod 13",
        input: "base=5, exponent=3, modulus=13",
        expected: "8",
        args: [5, 3, 13],
        expectedValue: 8,
        hidden: true,
      },
      {
        name: "modulus 1 collapses everything",
        input: "base=7, exponent=256, modulus=13",
        expected: "9",
        args: [7, 256, 13],
        expectedValue: 9,
        hidden: true,
      },
    ],
    hints: [
      "Halving trick: x^e = (x^2)^(e/2) when e is even, and x·x^(e-1) when e is odd.",
      "Iterate over the bits of the exponent: keep a running result; when the low bit is 1, multiply result by the current base; then square the base and shift the exponent right.",
      "Take mod after every multiplication to keep numbers small and avoid overflow in fixed-width languages.",
    ],
    solutionOutline:
      "Binary exponentiation. result = 1; base %= modulus; while exponent > 0: if exponent is odd, result = result * base % modulus; base = base * base % modulus; exponent >>= 1. Return result. This processes each bit of the exponent once — O(log exponent) multiplications — and taking the modulus at every step keeps operands bounded, which is essential in languages with fixed-width integers (and standard practice everywhere).",
    commonMistakes: [
      "Computing base ** exponent then taking the modulus — the intermediate value is astronomically large (and overflows outside Python).",
      "Forgetting the modulus on the squaring step, letting the base grow unbounded.",
      "Mishandling exponent 0 (must return 1 mod modulus, which is 0 when modulus is 1).",
    ],
    followUpQuestions: [
      "How does modular exponentiation enable modular inverses via Fermat's little theorem?",
      "Where does fast exponentiation appear in cryptography (RSA) and hashing?",
    ],
    rubric: [
      { criterion: "Binary exponentiation", description: "Squares the base and halves the exponent, multiplying on set bits — O(log exponent)." },
      { criterion: "Modulus discipline", description: "Reduces mod at every step to keep operands bounded; handles exponent 0 and modulus 1." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── math-geometry challenge ──────────────────────────────────────────────
  {
    slug: "math-max-points-on-a-line",
    title: "Maximum Points on a Straight Line",
    type: "dsa",
    difficulty: "hard",
    topics: ["math", "geometry", "hashing", "gcd"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 30,
    language: "python",
    functionName: "max_points_on_line",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [MATH_GEO],
    lessonIds: [MATH_CONCEPT, MATH_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "Given n distinct points on a 2D plane, return the maximum number of points that lie on the same straight line.\n\nExample: points=[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]] → 4.",
    constraints:
      "1 ≤ n ≤ 300, coordinates fit in 32-bit ints, all points are distinct. For each anchor point, group the others by the slope of the line to the anchor; the largest group + the anchor is a candidate. Represent slope EXACTLY as a reduced (dy, dx) pair — never a float — to avoid precision errors. O(n²).",
    starterCode:
      "from math import gcd\n\ndef max_points_on_line(points: list[list[int]]) -> int:\n    ...\n",
    tests: [
      {
        name: "four collinear among six",
        input: "points=[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]",
        expected: "4",
        args: [
          [[1, 1], [3, 2], [5, 3], [4, 1], [2, 3], [1, 4]],
        ],
        expectedValue: 4,
      },
      {
        name: "perfect diagonal",
        input: "points=[[1,1],[2,2],[3,3]]",
        expected: "3",
        args: [[[1, 1], [2, 2], [3, 3]]],
        expectedValue: 3,
      },
      {
        name: "single point",
        input: "points=[[0,0]]",
        expected: "1",
        args: [[[0, 0]]],
        expectedValue: 1,
        hidden: true,
      },
      {
        name: "two points",
        input: "points=[[1,2],[3,4]]",
        expected: "2",
        args: [[[1, 2], [3, 4]]],
        expectedValue: 2,
        hidden: true,
      },
      {
        name: "diagonal with an outlier",
        input: "points=[[1,1],[2,2],[3,3],[4,1],[5,5]]",
        expected: "4",
        args: [
          [[1, 1], [2, 2], [3, 3], [4, 1], [5, 5]],
        ],
        expectedValue: 4,
        hidden: true,
      },
    ],
    hints: [
      "Fix each point as an anchor. Every other point defines a slope with the anchor; points sharing a slope are collinear with it.",
      "Represent slope as the reduced integer pair (dy/g, dx/g) where g = gcd(dy, dx). Normalize the sign (e.g., force dx > 0, or dx == 0 → dy > 0) so opposite directions map to the same key.",
      "For each anchor, the answer contribution is 1 (the anchor) + the largest count among its slope buckets.",
    ],
    solutionOutline:
      "For n ≤ 2 return n. For each anchor i, build a dict mapping a normalized slope key to a count. For every other point j: dx = xj - xi, dy = yj - yi; g = gcd(dx, dy) (guard g == 0 → 1); key = (dx//g, dy//g); normalize the sign so (dx, dy) and (-dx, -dy) share a key (e.g., if dx < 0 or (dx == 0 and dy < 0), negate both). Increment the bucket; track the running max group size, and the best answer is that max + 1 (for the anchor). Using the exact reduced integer pair as the key avoids all floating-point slope precision problems. O(n²) time.",
    commonMistakes: [
      "Using a floating-point slope dy/dx — precision errors merge or split lines incorrectly, and vertical lines divide by zero.",
      "Not normalizing the slope sign, so points on opposite sides of the anchor land in different buckets.",
      "Forgetting to add 1 for the anchor itself when reporting a bucket's line size.",
    ],
    followUpQuestions: [
      "Why does the exact reduced (dy, dx) pair avoid the precision pitfalls of a float slope?",
      "If duplicate points were allowed, how would you fold their counts into every line through the anchor?",
    ],
    rubric: [
      { criterion: "Exact slope keys", description: "Groups points by a reduced, sign-normalized integer slope pair (no floats)." },
      { criterion: "Anchor sweep", description: "Iterates anchors, counts the largest collinear group, and adds the anchor for the O(n²) answer." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
