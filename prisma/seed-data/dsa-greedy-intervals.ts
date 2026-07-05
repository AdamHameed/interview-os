import { defineProblems, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const DSA_PATH = learningPathId("dsa-confidence-builder");
const GREEDY = learningModuleId("greedy");
const INTERVALS = learningModuleId("intervals");
const GREEDY_CONCEPT = lessonId(GREEDY, "greedy-concept");
const GREEDY_WALKTHROUGH = lessonId(GREEDY, "greedy-walkthrough");
const INTERVALS_CONCEPT = lessonId(INTERVALS, "intervals-concept");
const INTERVALS_WALKTHROUGH = lessonId(INTERVALS, "intervals-walkthrough");

const LANGUAGES = ["python", "javascript", "typescript"] as const;

/**
 * Batch 14: greedy and intervals runnable DSA problems.
 * Global (non-path-scoped) module IDs so they appear on the standalone
 * module pages and in the DSA path.
 */
export const dsaGreedyIntervalsProblems = defineProblems([
  // ─── greedy warmup 1 ──────────────────────────────────────────────────────
  {
    slug: "greedy-assign-cookies",
    title: "Assign Cookies: Satisfy the Most Children",
    type: "dsa",
    difficulty: "easy",
    topics: ["greedy", "sorting", "two-pointers"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 14,
    language: "python",
    functionName: "max_content_children",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [GREEDY],
    lessonIds: [GREEDY_CONCEPT, GREEDY_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Each child has a greed factor — the minimum cookie size that will satisfy them. Each cookie has a size. A cookie can satisfy at most one child, and satisfies them only if the cookie's size is at least the child's greed factor.\n\nGiven the list of greed factors and the list of cookie sizes, return the maximum number of children you can satisfy.",
    constraints:
      "0 ≤ len(greed), len(sizes) ≤ 10^5, values are positive integers. The greedy choice — give the smallest sufficient cookie to the least greedy unsatisfied child — is optimal. O(n log n) for the sorts.",
    starterCode:
      "def max_content_children(greed: list[int], sizes: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "one cookie too small",
        input: "greed=[1,2,3], sizes=[1,1]",
        expected: "1",
        args: [[1, 2, 3], [1, 1]],
        expectedValue: 1,
      },
      {
        name: "enough cookies",
        input: "greed=[1,2], sizes=[1,2,3]",
        expected: "2",
        args: [[1, 2], [1, 2, 3]],
        expectedValue: 2,
      },
      {
        name: "larger cookies satisfy greedier kids",
        input: "greed=[10,9,8,7], sizes=[5,6,7,8]",
        expected: "2",
        args: [[10, 9, 8, 7], [5, 6, 7, 8]],
        expectedValue: 2,
        hidden: true,
      },
      {
        name: "no cookies",
        input: "greed=[1,2], sizes=[]",
        expected: "0",
        args: [[1, 2], []],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "Sort both lists. Walk the smallest cookies against the least greedy children.",
      "If the current cookie satisfies the current child, advance both pointers; otherwise the cookie is too small for anyone remaining — advance only the cookie pointer.",
    ],
    solutionOutline:
      "Sort greed and sizes ascending. Two pointers i (children) and j (cookies): if sizes[j] >= greed[i], this cookie satisfies child i — advance both; else the cookie is too small for the least greedy remaining child, so it is useless — advance j only. The count of satisfied children is i when either list is exhausted. The exchange argument: giving a child any larger cookie than necessary can only waste capacity, so the smallest sufficient cookie is always the right local choice.",
    commonMistakes: [
      "Not sorting, so the greedy pairing is not meaningful.",
      "Advancing the child pointer when the cookie is too small — that skips a child who might be served by a later, bigger cookie.",
      "Assuming the biggest cookies should go to the greediest children first (works, but only after sorting both ways consistently).",
    ],
    followUpQuestions: [
      "State the exchange argument: why can the smallest sufficient cookie never be the wrong choice?",
      "How would you adapt this if a child could be satisfied by two smaller cookies combined?",
    ],
    rubric: [
      { criterion: "Greedy pairing", description: "Sorts both lists and pairs the smallest sufficient cookie with the least greedy child." },
      { criterion: "Pointer discipline", description: "Advances the cookie pointer alone when a cookie is too small; both when it satisfies." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── greedy warmup 2 ──────────────────────────────────────────────────────
  {
    slug: "greedy-stock-profit-unlimited",
    title: "Best Time to Trade: Unlimited Transactions",
    type: "dsa",
    difficulty: "easy",
    topics: ["greedy", "arrays"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 14,
    language: "python",
    functionName: "max_profit",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [GREEDY],
    lessonIds: [GREEDY_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "You are given daily prices of an asset. You may buy and sell any number of times (but you must sell before buying again — you hold at most one unit). Return the maximum total profit you can achieve.\n\nExample: prices [7,1,5,3,6,4] → buy at 1 sell at 5 (+4), buy at 3 sell at 6 (+3) = 7.",
    constraints:
      "1 ≤ len(prices) ≤ 10^5, prices are non-negative integers. The optimal strategy is greedy: capture every upward day-to-day move. O(n) time, O(1) space.",
    starterCode:
      "def max_profit(prices: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "two profitable runs",
        input: "prices=[7,1,5,3,6,4]",
        expected: "7",
        args: [[7, 1, 5, 3, 6, 4]],
        expectedValue: 7,
      },
      {
        name: "monotonically increasing",
        input: "prices=[1,2,3,4,5]",
        expected: "4",
        args: [[1, 2, 3, 4, 5]],
        expectedValue: 4,
      },
      {
        name: "monotonically decreasing",
        input: "prices=[7,6,4,3,1]",
        expected: "0",
        args: [[7, 6, 4, 3, 1]],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "single day",
        input: "prices=[5]",
        expected: "0",
        args: [[5]],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "You do not need to find the actual buy/sell days — only the total profit.",
      "Every time tomorrow's price is higher than today's, that gain is capturable; sum all positive consecutive differences.",
    ],
    solutionOutline:
      "Sum max(0, prices[i+1] - prices[i]) over all consecutive pairs. Why greedy works: any profitable multi-day hold from a low to a high equals the sum of the consecutive positive steps in between (telescoping), and the negative steps you simply skip by not holding. So capturing every up-move is both achievable (sell each evening, rebuy each morning across a rising run) and optimal. O(n), O(1).",
    commonMistakes: [
      "Trying to find one global min and max (that solves the single-transaction variant, not this one).",
      "Adding negative differences, which corresponds to holding through a loss.",
      "Overcomplicating with DP when the greedy sum of positive deltas is provably optimal here.",
    ],
    followUpQuestions: [
      "Why does summing consecutive positive deltas equal the best achievable profit (telescoping argument)?",
      "How does the problem change if you may hold at most one transaction total?",
    ],
    rubric: [
      { criterion: "Greedy insight", description: "Recognizes total profit = sum of positive consecutive deltas and justifies it." },
      { criterion: "Efficiency", description: "Single pass, O(1) extra space, no unnecessary DP." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── greedy core 1 ────────────────────────────────────────────────────────
  {
    slug: "greedy-min-jumps",
    title: "Minimum Jumps to Reach the End",
    type: "dsa",
    difficulty: "medium",
    topics: ["greedy", "arrays", "intervals"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 22,
    language: "python",
    functionName: "min_jumps",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [GREEDY],
    lessonIds: [GREEDY_CONCEPT, GREEDY_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "You are given an array where each element is the maximum forward jump length from that position. Starting at index 0, return the minimum number of jumps needed to reach the last index. Assume the last index is always reachable.\n\nExample: [2,3,1,1,4] → jump from index 0 to index 1 (value 3), then from index 1 to index 4 = 2 jumps.",
    constraints:
      "1 ≤ len(nums) ≤ 10^4, 0 ≤ nums[i] ≤ 1000. The last index is always reachable. Target O(n): treat each jump as covering a contiguous window of reachable indices and greedily extend the window.",
    starterCode:
      "def min_jumps(nums: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "classic",
        input: "nums=[2,3,1,1,4]",
        expected: "2",
        args: [[2, 3, 1, 1, 4]],
        expectedValue: 2,
      },
      {
        name: "another two-jump path",
        input: "nums=[2,3,0,1,4]",
        expected: "2",
        args: [[2, 3, 0, 1, 4]],
        expectedValue: 2,
      },
      {
        name: "already at end",
        input: "nums=[0]",
        expected: "0",
        args: [[0]],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "one jump suffices",
        input: "nums=[1,2]",
        expected: "1",
        args: [[1, 2]],
        expectedValue: 1,
        hidden: true,
      },
      {
        name: "step by step",
        input: "nums=[1,1,1,1]",
        expected: "3",
        args: [[1, 1, 1, 1]],
        expectedValue: 3,
        hidden: true,
      },
    ],
    hints: [
      "Think in terms of the current jump's reachable window [start, cur_end]. Within that window, find the farthest index you could reach with one more jump.",
      "When you finish scanning the current window (i reaches cur_end), you must take a jump — bump the jump count and set cur_end to the farthest reach found so far.",
      "You never need to scan the last index itself; stopping at len(nums)-1 avoids an extra phantom jump.",
    ],
    solutionOutline:
      "Greedy 'implicit BFS by levels': maintain jumps=0, cur_end=0 (the end of the range reachable with the current number of jumps), and farthest=0. Iterate i from 0 to n-2: farthest = max(farthest, i + nums[i]); when i == cur_end, you have exhausted the current jump's window, so jumps += 1 and cur_end = farthest. Return jumps. Each index belongs to exactly one 'level', so this is O(n). The greedy choice — extend to the farthest reachable index each level — is optimal because reaching farther can never require more jumps than reaching nearer.",
    commonMistakes: [
      "Looping to the last index instead of n-2, adding a phantom extra jump when i lands exactly on the end.",
      "Greedily jumping to the position with the largest value rather than the largest reach (index + value).",
      "Falling back to O(n²) DP when the level-window greedy is O(n).",
    ],
    followUpQuestions: [
      "Why is 'extend to the farthest reachable index this level' optimal (no exchange can do better)?",
      "How does this relate to BFS layers on an implicit graph of reachable positions?",
    ],
    rubric: [
      { criterion: "Window greedy", description: "Uses the current-reach window and farthest-reach to count jumps in O(n)." },
      { criterion: "Boundary handling", description: "Stops before the last index to avoid an off-by-one extra jump." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── greedy core 2 ────────────────────────────────────────────────────────
  {
    slug: "greedy-gas-station",
    title: "Gas Station: Find the Starting Point",
    type: "dsa",
    difficulty: "medium",
    topics: ["greedy", "arrays", "prefix-sums"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 22,
    language: "python",
    functionName: "gas_station_start",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [GREEDY],
    lessonIds: [GREEDY_CONCEPT, GREEDY_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "There are n gas stations arranged in a circle. At station i you can acquire gas[i] units of fuel, and it costs cost[i] units to travel from station i to station i+1 (wrapping around). You begin with an empty tank at some station and must complete the full circle in the clockwise direction.\n\nReturn the index of the starting station that lets you complete the circuit, or -1 if it is impossible. A valid answer is guaranteed to be unique when it exists.\n\nExample: gas=[1,2,3,4,5], cost=[3,4,5,1,2] → start at index 3.",
    constraints:
      "1 ≤ len(gas) == len(cost) ≤ 10^5, values are non-negative integers. Target O(n) single pass. Two facts drive the greedy: if total gas < total cost, no start works; and if you run dry traveling from a working start s to station i, no station between s and i can be a valid start either.",
    starterCode:
      "def gas_station_start(gas: list[int], cost: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "start at index 3",
        input: "gas=[1,2,3,4,5], cost=[3,4,5,1,2]",
        expected: "3",
        args: [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]],
        expectedValue: 3,
      },
      {
        name: "impossible circuit",
        input: "gas=[2,3,4], cost=[3,4,3]",
        expected: "-1",
        args: [[2, 3, 4], [3, 4, 3]],
        expectedValue: -1,
      },
      {
        name: "start at index 4",
        input: "gas=[5,1,2,3,4], cost=[4,4,1,5,1]",
        expected: "4",
        args: [[5, 1, 2, 3, 4], [4, 4, 1, 5, 1]],
        expectedValue: 4,
        hidden: true,
      },
      {
        name: "single station that works",
        input: "gas=[5], cost=[4]",
        expected: "0",
        args: [[5], [4]],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "Feasibility first: if sum(gas) < sum(cost), return -1 — no start can work.",
      "Track a running tank as you sweep. Whenever the tank goes negative at station i, no start in [current_start .. i] can complete the loop, so reset the candidate start to i+1 and zero the tank.",
      "If total gas ≥ total cost, the last candidate start you settled on is the unique answer.",
    ],
    solutionOutline:
      "If sum(gas) < sum(cost), return -1. Otherwise sweep once: keep start=0 and tank=0; for each i, tank += gas[i] - cost[i]; if tank < 0, set start = i+1 and tank = 0. Return start. Correctness: a negative tank at i proves every station from the current candidate start through i fails (each prefix from start was non-negative until i, so starting later within that range only removes gas), so the next possible start is i+1; and when the global surplus is non-negative, exactly one such start survives. O(n) time, O(1) space.",
    commonMistakes: [
      "O(n²) brute force trying every start — unnecessary given the surplus argument.",
      "Resetting start to i instead of i+1 (station i itself is proven infeasible as a start).",
      "Forgetting the global feasibility check, then returning a start that cannot actually complete the loop.",
    ],
    followUpQuestions: [
      "Why does a dry-out at i eliminate every candidate start between the current start and i?",
      "Why is the surviving start unique when total gas ≥ total cost?",
    ],
    rubric: [
      { criterion: "Feasibility + reset logic", description: "Checks total surplus and resets the candidate start to i+1 on a dry-out." },
      { criterion: "Single pass", description: "Solves in O(n) with O(1) space, not by trying every start." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── greedy challenge ─────────────────────────────────────────────────────
  {
    slug: "greedy-candy-distribution",
    title: "Candy: Reward Neighbors Fairly at Minimum Cost",
    type: "dsa",
    difficulty: "hard",
    topics: ["greedy", "arrays", "two-pass"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 26,
    language: "python",
    functionName: "min_candies",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [GREEDY],
    lessonIds: [GREEDY_CONCEPT, GREEDY_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "Children stand in a line, each with a rating. You distribute candies so that: (1) every child gets at least one candy, and (2) any child with a strictly higher rating than an adjacent neighbor gets strictly more candies than that neighbor. Return the minimum total number of candies.\n\nExample: ratings [1,0,2] → give [2,1,2] = 5 candies.",
    constraints:
      "1 ≤ len(ratings) ≤ 10^5, ratings are integers. Equal adjacent ratings impose no constraint between those two children. Target O(n) time with two passes.",
    starterCode:
      "def min_candies(ratings: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "valley in the middle",
        input: "ratings=[1,0,2]",
        expected: "5",
        args: [[1, 0, 2]],
        expectedValue: 5,
      },
      {
        name: "equal neighbors need no ordering",
        input: "ratings=[1,2,2]",
        expected: "4",
        args: [[1, 2, 2]],
        expectedValue: 4,
      },
      {
        name: "peak and plateau",
        input: "ratings=[1,3,2,2,1]",
        expected: "7",
        args: [[1, 3, 2, 2, 1]],
        expectedValue: 7,
        hidden: true,
      },
      {
        name: "single child",
        input: "ratings=[5]",
        expected: "1",
        args: [[5]],
        expectedValue: 1,
        hidden: true,
      },
    ],
    hints: [
      "The two neighbor constraints (left and right) pull in different directions; satisfy them with two separate passes and combine.",
      "Left-to-right pass: if ratings[i] > ratings[i-1], candies[i] = candies[i-1] + 1, else 1.",
      "Right-to-left pass: if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1). The max keeps both constraints satisfied.",
    ],
    solutionOutline:
      "Initialize candies = [1]*n. Left pass (i from 1): if ratings[i] > ratings[i-1], candies[i] = candies[i-1] + 1 — this satisfies every 'greater than left neighbor' constraint. Right pass (i from n-2 down): if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1) — the max preserves what the left pass established while also satisfying 'greater than right neighbor'. Sum candies. Why two passes and a max: a child on a descending slope needs more than its right neighbor, and a child on an ascending slope needs more than its left; taking the max at each index is the minimal value satisfying both local constraints simultaneously. O(n) time, O(n) space.",
    commonMistakes: [
      "Using a single pass — it cannot satisfy both the left and right constraints at peaks and valleys.",
      "Overwriting instead of taking the max in the right pass, breaking the left-pass guarantee.",
      "Treating equal adjacent ratings as requiring an ordering (they do not).",
    ],
    followUpQuestions: [
      "Why does taking the max of the two passes give the minimum feasible allocation at every index?",
      "Can you achieve O(1) extra space by counting up-slopes and down-slopes instead of storing an array?",
    ],
    rubric: [
      { criterion: "Two-pass decomposition", description: "Separates left and right neighbor constraints into two passes and combines with a max." },
      { criterion: "Correctness at peaks/valleys", description: "Handles ascending/descending runs and equal ratings correctly for the minimum total." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── intervals warmup (second; maintenance-window-merge is the first) ─────
  {
    slug: "intervals-can-attend-meetings",
    title: "Can One Person Attend All Meetings?",
    type: "dsa",
    difficulty: "easy",
    topics: ["intervals", "sorting"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "can_attend_all_meetings",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [INTERVALS],
    lessonIds: [INTERVALS_CONCEPT, INTERVALS_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "You are given a list of meeting time intervals `[start, end)` (half-open — a meeting ending at time t and another starting at t do NOT conflict). Determine whether a single person could attend every meeting, i.e., whether no two meetings overlap.\n\nReturn True if there are no overlaps, False otherwise.",
    constraints:
      "0 ≤ len(intervals) ≤ 10^4, 0 ≤ start < end ≤ 10^9. Sort by start, then a single adjacent-pair scan decides it. O(n log n).",
    starterCode:
      "def can_attend_all_meetings(intervals: list[list[int]]) -> bool:\n    ...\n",
    tests: [
      {
        name: "overlapping meetings",
        input: "[[0,30],[5,10],[15,20]]",
        expected: "False",
        args: [[[0, 30], [5, 10], [15, 20]]],
        expectedValue: false,
      },
      {
        name: "no overlap",
        input: "[[7,10],[2,4]]",
        expected: "True",
        args: [[[7, 10], [2, 4]]],
        expectedValue: true,
      },
      {
        name: "touching is allowed (half-open)",
        input: "[[1,2],[2,3]]",
        expected: "True",
        args: [[[1, 2], [2, 3]]],
        expectedValue: true,
        hidden: true,
      },
      {
        name: "empty schedule",
        input: "[]",
        expected: "True",
        args: [[]],
        expectedValue: true,
        hidden: true,
      },
    ],
    hints: [
      "Sort the intervals by start time.",
      "After sorting, an overlap exists iff some meeting starts before the previous one ends: intervals[i][0] < intervals[i-1][1].",
      "Because intervals are half-open, use strict '<' — equality (touching) is not an overlap.",
    ],
    solutionOutline:
      "Sort intervals by start. Scan adjacent pairs: if intervals[i].start < intervals[i-1].end, they overlap → return False. If no pair overlaps, return True. Sorting brings potentially-conflicting meetings next to each other, so a single linear scan after the sort suffices. Half-open semantics mean a meeting ending exactly when the next begins is fine — hence strict inequality. O(n log n) time.",
    commonMistakes: [
      "Comparing unsorted intervals, missing overlaps that are not adjacent in input order.",
      "Using '<=' and reporting touching meetings as conflicts under half-open semantics.",
      "Comparing only against the first interval rather than the previous one in sorted order.",
    ],
    followUpQuestions: [
      "If meetings were closed intervals [start, end], how would the comparison change?",
      "How would you also return the first conflicting pair, not just a boolean?",
    ],
    rubric: [
      { criterion: "Sort-then-scan", description: "Sorts by start and checks adjacent pairs for overlap in one pass." },
      { criterion: "Half-open semantics", description: "Uses strict inequality so touching intervals are not flagged as conflicts." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── intervals core 1 ─────────────────────────────────────────────────────
  {
    slug: "intervals-min-meeting-rooms",
    title: "Minimum Meeting Rooms",
    type: "dsa",
    difficulty: "medium",
    topics: ["intervals", "heap", "sweep-line"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 22,
    language: "python",
    functionName: "min_meeting_rooms",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [INTERVALS],
    lessonIds: [INTERVALS_CONCEPT, INTERVALS_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Given a list of meeting time intervals `[start, end)`, return the minimum number of meeting rooms required so that no two meetings share a room at the same time. This equals the maximum number of meetings that are ever in progress simultaneously.\n\nExample: [[0,30],[5,10],[15,20]] → 2 (the [0,30] meeting overlaps each of the others).",
    constraints:
      "0 ≤ len(intervals) ≤ 10^5, 0 ≤ start < end ≤ 10^9, half-open (a meeting ending at t frees the room for one starting at t). Target O(n log n) via a min-heap of end times or a sweep line.",
    starterCode:
      "import heapq\n\ndef min_meeting_rooms(intervals: list[list[int]]) -> int:\n    ...\n",
    tests: [
      {
        name: "one meeting spans the others",
        input: "[[0,30],[5,10],[15,20]]",
        expected: "2",
        args: [[[0, 30], [5, 10], [15, 20]]],
        expectedValue: 2,
      },
      {
        name: "no concurrency",
        input: "[[7,10],[2,4]]",
        expected: "1",
        args: [[[7, 10], [2, 4]]],
        expectedValue: 1,
      },
      {
        name: "all three overlap",
        input: "[[1,5],[2,6],[3,7]]",
        expected: "3",
        args: [[[1, 5], [2, 6], [3, 7]]],
        expectedValue: 3,
        hidden: true,
      },
      {
        name: "empty",
        input: "[]",
        expected: "0",
        args: [[]],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "Sort meetings by start time. Keep a min-heap of end times for meetings currently occupying a room.",
      "Before assigning a room to the next meeting, pop every meeting whose end time is <= this meeting's start (those rooms have freed up under half-open semantics).",
      "The answer is the largest the heap ever grows to — that is the peak concurrency.",
    ],
    solutionOutline:
      "Sort by start. Maintain a min-heap of end times of in-progress meetings. For each meeting (s, e) in start order: if the heap's smallest end time <= s, pop it (that room is free). Push e. The heap size after processing all meetings' pushes tracks concurrency; the maximum heap size reached is the answer (equivalently, since each meeting pushes once, the final heap size equals the peak because we only ever pop rooms that are free). Alternative: a sweep line with +1 at each start and -1 at each end, processing ends before starts at equal times, and tracking the running max. Both are O(n log n).",
    commonMistakes: [
      "Popping with '<' instead of '<=', keeping a room occupied that a touching meeting could reuse.",
      "Sorting starts and ends together without the correct tie rule (ends before starts) in the sweep-line variant.",
      "Returning the final concurrency rather than the peak concurrency (they coincide with the heap approach but not if you decrement mid-stream incorrectly).",
    ],
    followUpQuestions: [
      "Show the sweep-line formulation and why ends must be processed before starts at equal timestamps.",
      "How would you also return which meetings share each room?",
    ],
    rubric: [
      { criterion: "Concurrency model", description: "Computes peak overlap via a min-heap of end times or a correct sweep line." },
      { criterion: "Half-open handling", description: "Frees a room when its end time equals the next start (<=)." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── intervals core 2 ─────────────────────────────────────────────────────
  {
    slug: "intervals-erase-overlaps",
    title: "Remove Fewest Intervals to Eliminate Overlaps",
    type: "dsa",
    difficulty: "medium",
    topics: ["intervals", "greedy", "sorting"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 22,
    language: "python",
    functionName: "erase_overlap_intervals",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [INTERVALS],
    lessonIds: [INTERVALS_CONCEPT, INTERVALS_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Given a list of intervals `[start, end)`, return the minimum number of intervals you must remove so that the remaining intervals are pairwise non-overlapping. Touching intervals (one ends where the next starts) do not count as overlapping.\n\nExample: [[1,2],[2,3],[3,4],[1,3]] → remove [1,3] (1 removal) leaves [1,2],[2,3],[3,4] non-overlapping.",
    constraints:
      "0 ≤ len(intervals) ≤ 10^5, 0 ≤ start < end ≤ 10^9, half-open. The greedy insight: sort by END time and always keep the interval that finishes earliest, because it leaves the most room for the rest. O(n log n).",
    starterCode:
      "def erase_overlap_intervals(intervals: list[list[int]]) -> int:\n    ...\n",
    tests: [
      {
        name: "remove the long overlapper",
        input: "[[1,2],[2,3],[3,4],[1,3]]",
        expected: "1",
        args: [[[1, 2], [2, 3], [3, 4], [1, 3]]],
        expectedValue: 1,
      },
      {
        name: "three identical intervals",
        input: "[[1,2],[1,2],[1,2]]",
        expected: "2",
        args: [[[1, 2], [1, 2], [1, 2]]],
        expectedValue: 2,
      },
      {
        name: "already non-overlapping (touching)",
        input: "[[1,2],[2,3]]",
        expected: "0",
        args: [[[1, 2], [2, 3]]],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "empty",
        input: "[]",
        expected: "0",
        args: [[]],
        expectedValue: 0,
        hidden: true,
      },
    ],
    hints: [
      "This is the classic activity-selection greedy in disguise: keep the maximum number of non-overlapping intervals, and the removals are everything else.",
      "Sort by END time. Track the end of the last interval you kept; keep the next interval only if its start >= that end.",
      "Every interval you cannot keep is one removal. Removals = total - kept.",
    ],
    solutionOutline:
      "Sort intervals by end time. Greedily select a maximal set of non-overlapping intervals: track prev_end = -infinity; for each (s, e) in end order, if s >= prev_end, keep it and set prev_end = e; otherwise it overlaps the last kept interval and must be removed (count += 1). Return the removal count. Why sort by end: the interval finishing earliest leaves the most remaining room, so keeping it is never worse than keeping any conflicting alternative (the exchange argument behind activity selection). O(n log n) time.",
    commonMistakes: [
      "Sorting by start instead of end — the greedy 'keep earliest finisher' argument needs end-time order.",
      "Using '>' instead of '>=' for the keep condition, wrongly discarding a touching interval.",
      "Counting kept intervals but returning that instead of the removals (total - kept).",
    ],
    followUpQuestions: [
      "State the exchange argument for why keeping the earliest-ending interval is optimal.",
      "How does this connect to the maximum set of non-overlapping intervals (activity selection)?",
    ],
    rubric: [
      { criterion: "Sort-by-end greedy", description: "Sorts by end time and keeps intervals whose start clears the last kept end." },
      { criterion: "Removal counting", description: "Correctly returns removals (total minus the maximal non-overlapping set)." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── intervals challenge ──────────────────────────────────────────────────
  {
    slug: "intervals-insert-interval",
    title: "Insert an Interval and Merge",
    type: "dsa",
    difficulty: "hard",
    topics: ["intervals", "merging", "arrays"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 26,
    language: "python",
    functionName: "insert_interval",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [INTERVALS],
    lessonIds: [INTERVALS_CONCEPT, INTERVALS_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "You are given a list of non-overlapping intervals `[start, end]` sorted by start time, and a new interval. Insert the new interval so the result remains sorted and non-overlapping, merging any intervals it overlaps or touches. Return the updated list.\n\nExample: intervals [[1,3],[6,9]], new [2,5] → [[1,5],[6,9]].",
    constraints:
      "0 ≤ len(intervals) ≤ 10^5, intervals are sorted by start and pairwise non-overlapping; new interval start ≤ end. Target O(n) single pass in three phases (before, overlapping, after) — no full re-sort needed since the input is already sorted.",
    starterCode:
      "def insert_interval(intervals: list[list[int]], new_interval: list[int]) -> list[list[int]]:\n    ...\n",
    tests: [
      {
        name: "merge one interval",
        input: "intervals=[[1,3],[6,9]], new=[2,5]",
        expected: "[[1,5],[6,9]]",
        args: [
          [[1, 3], [6, 9]],
          [2, 5],
        ],
        expectedValue: [[1, 5], [6, 9]],
      },
      {
        name: "merge several",
        input: "intervals=[[1,2],[3,5],[6,7],[8,10],[12,16]], new=[4,8]",
        expected: "[[1,2],[3,10],[12,16]]",
        args: [
          [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]],
          [4, 8],
        ],
        expectedValue: [
          [1, 2],
          [3, 10],
          [12, 16],
        ],
      },
      {
        name: "insert into empty",
        input: "intervals=[], new=[5,7]",
        expected: "[[5,7]]",
        args: [[], [5, 7]],
        expectedValue: [[5, 7]],
        hidden: true,
      },
      {
        name: "new interval at the front",
        input: "intervals=[[3,5],[7,9]], new=[1,2]",
        expected: "[[1,2],[3,5],[7,9]]",
        args: [
          [[3, 5], [7, 9]],
          [1, 2],
        ],
        expectedValue: [
          [1, 2],
          [3, 5],
          [7, 9],
        ],
        hidden: true,
      },
    ],
    hints: [
      "Three phases: (1) copy all intervals that end before the new interval starts, (2) merge every interval that overlaps the new one by expanding the new interval, (3) copy the rest.",
      "Two intervals [a,b] and [c,d] overlap-or-touch when a <= d and c <= b; since input is sorted you can process left to right.",
      "In the merge phase, new = [min(new.start, cur.start), max(new.end, cur.end)] for each overlapping interval, then append the expanded new interval once.",
    ],
    solutionOutline:
      "Walk the sorted intervals with an index i. Phase 1: while intervals[i].end < new.start, append intervals[i] unchanged (they are entirely left of the new interval). Phase 2: while i < n and intervals[i].start <= new.end, the interval overlaps or touches the new one — absorb it: new = [min(new.start, intervals[i].start), max(new.end, intervals[i].end)]; advance i. Append the fully-expanded new interval once. Phase 3: append the remaining intervals[i:]. Because the input is pre-sorted and non-overlapping, one left-to-right pass places the new interval correctly and merges exactly the intervals it touches. O(n) time.",
    commonMistakes: [
      "Re-sorting the whole list after appending — unnecessary and O(n log n) when the input is already sorted.",
      "Using '<' for the overlap test and failing to merge exactly-touching intervals.",
      "Appending the new interval inside the merge loop repeatedly instead of once after fully expanding it.",
    ],
    followUpQuestions: [
      "Why does the pre-sorted, non-overlapping input let you solve this in one pass instead of a full merge-intervals?",
      "How would you handle the case where the new interval must split across a gap (it cannot here — why)?",
    ],
    rubric: [
      { criterion: "Three-phase pass", description: "Handles before / overlapping-merge / after in a single O(n) sweep over sorted input." },
      { criterion: "Merge correctness", description: "Expands the new interval over all touching/overlapping intervals and inserts it once." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
