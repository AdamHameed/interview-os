import { defineProblems, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const DSA_PATH = learningPathId("dsa-confidence-builder");
const BACKEND_PATH = learningPathId("backend-swe");
const BINARY_SEARCH = learningModuleId("binary-search");
const LINKED_LISTS = learningModuleId("linked-lists");
const HEAPS = learningModuleId("stacks-queues-heaps");
const OBSERVABILITY = learningModuleId("observability");
const INVARIANT_LESSON = lessonId(BINARY_SEARCH, "binary-search-invariant");
const ANSWER_SPACE_LESSON = lessonId(BINARY_SEARCH, "binary-search-on-answers");
const POINTER_LESSON = lessonId(LINKED_LISTS, "linked-list-pointer-discipline");
const SLOW_FAST_LESSON = lessonId(LINKED_LISTS, "slow-fast-pointer-walkthrough");

const LANGUAGES = ["python", "javascript", "typescript"] as const;

const LIST_HELPERS = `class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

def build_chain(values):
    head = None
    for value in reversed(values):
        head = Node(value, head)
    return head

def to_list(head):
    out = []
    while head is not None:
        out.append(head.value)
        head = head.next
    return out

`;

/**
 * Batch 1 of the DSA roadmap: binary search and linked lists.
 * 4 warmups, 3 core, 1 challenge, 1 applied variant — all runnable.
 */
export const dsaSearchListProblems = defineProblems([
  {
    slug: "sorted-build-id-lookup",
    title: "Find a Build in a Sorted Manifest",
    type: "dsa",
    difficulty: "easy",
    topics: ["binary-search", "sorted-arrays"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "find_build",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BINARY_SEARCH],
    lessonIds: [INVARIANT_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A release manifest lists build IDs in strictly increasing order. Given the manifest and a target build ID, return the index where the target appears, or -1 if it is not in the manifest. The manifest can hold millions of entries, so a full scan is too slow for the release dashboard.",
    constraints:
      "Build IDs are unique and sorted ascending. Aim for O(log n) time and O(1) extra space using the bracket invariant from the lesson. The manifest may be empty.",
    starterCode: "def find_build(build_ids: list[int], target: int) -> int:\n    ...\n",
    tests: [
      { name: "target in the middle", input: "[103, 205, 311, 480, 512], 311", expected: "2", args: [[103, 205, 311, 480, 512], 311], expectedValue: 2 },
      { name: "target absent", input: "[103, 205, 311, 480, 512], 400", expected: "-1", args: [[103, 205, 311, 480, 512], 400], expectedValue: -1 },
      { name: "single-entry manifest", input: "[7], 7", expected: "0", args: [[7], 7], expectedValue: 0 },
      { name: "empty manifest", input: "[], 42", expected: "-1", args: [[], 42], expectedValue: -1, hidden: true },
      { name: "first entry", input: "target equals the smallest ID", expected: "0", args: [[103, 205, 311, 480, 512], 103], expectedValue: 0, hidden: true },
      { name: "last entry", input: "target equals the largest ID", expected: "4", args: [[103, 205, 311, 480, 512], 512], expectedValue: 4, hidden: true },
    ],
    hints: [
      "Keep lo and hi so that the target, if present, always lies inside [lo, hi]; stop when the bracket empties.",
      "Compare the middle element once per iteration and discard the half that cannot contain the target.",
    ],
    solutionOutline:
      "Initialize lo = 0, hi = len - 1. While lo <= hi, compute mid = lo + (hi - lo) // 2. If build_ids[mid] equals the target return mid; if it is smaller, set lo = mid + 1; otherwise hi = mid - 1. Return -1 when the loop exits. Each iteration halves the bracket, giving O(log n) time and O(1) space.",
    commonMistakes: [
      "Using while lo < hi with hi = len - 1, which skips the final one-element bracket and misses targets at the edges.",
      "Forgetting the empty-manifest case and indexing into an empty list.",
    ],
    followUpQuestions: [
      "How would you change the loop to return the insertion point for a missing build instead of -1?",
      "What breaks if the manifest contains duplicate build IDs, and which index should you return then?",
    ],
    rubric: [
      { criterion: "Invariant correctness", description: "Maintains a shrinking bracket that provably contains the target and terminates on all inputs." },
      { criterion: "Edge handling", description: "Returns -1 for the empty manifest and finds targets at both ends." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "first-failing-canary",
    title: "First Failing Canary Check",
    type: "dsa",
    difficulty: "easy",
    topics: ["binary-search", "boundary-search"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "first_failure",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BINARY_SEARCH],
    lessonIds: [INVARIANT_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A canary pipeline runs the same health check against an ordered sequence of deployments. Once one deployment fails, every later deployment also fails, so the results look like some passes followed by some failures. Given the list of results (true = passed, false = failed), return the index of the first failing deployment, or -1 if every deployment passed. Each check is expensive to re-run, so inspect as few entries as you can.",
    constraints:
      "Results are monotone: no true appears after a false. Aim for O(log n) inspections. The list may be empty (return -1) or all failures (return 0).",
    starterCode: "def first_failure(results: list[bool]) -> int:\n    ...\n",
    tests: [
      { name: "passes then failures", input: "[true, true, false, false]", expected: "2", args: [[true, true, false, false]], expectedValue: 2 },
      { name: "all passed", input: "[true, true, true]", expected: "-1", args: [[true, true, true]], expectedValue: -1 },
      { name: "no deployments", input: "[]", expected: "-1", args: [[]], expectedValue: -1 },
      { name: "all failed", input: "[false, false]", expected: "0", args: [[false, false]], expectedValue: 0, hidden: true },
      { name: "single failure at the end", input: "[true, false]", expected: "1", args: [[true, false]], expectedValue: 1, hidden: true },
    ],
    hints: [
      "This is a first-true search over the predicate \"deployment i failed\": everything left of the answer is false, everything from the answer on is true.",
      "Keep hi parked on a known failure (or one past the end) and lo on the first still-possible index, and loop while lo < hi.",
    ],
    solutionOutline:
      "Search for the boundary with lo = 0, hi = len(results). While lo < hi, take mid; if results[mid] is false (a failure), the first failure is at mid or earlier, so hi = mid; otherwise lo = mid + 1. Afterwards lo is the first failing index, or len(results) when everything passed — map that to -1. This is the first-true shape from the lesson and never re-runs a check twice.",
    commonMistakes: [
      "Writing lo = mid instead of lo = mid + 1 in the pass branch, which loops forever on a two-element bracket.",
      "Returning lo without mapping the all-passed case (lo == len) to -1.",
    ],
    followUpQuestions: [
      "How does this compare to git bisect, and how many checks does it need for one million deployments?",
      "What would you do if a flaky check could report a false failure once?",
    ],
    rubric: [
      { criterion: "Boundary framing", description: "Recognizes the monotone predicate and searches for the first-true boundary rather than an exact match." },
      { criterion: "Termination and edges", description: "Loop provably terminates and the empty and all-passed cases return -1." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "error-code-range-scan",
    title: "Range of an Error Code in Sorted Logs",
    type: "dsa",
    difficulty: "medium",
    topics: ["binary-search", "sorted-arrays", "boundary-search"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 25,
    language: "python",
    functionName: "code_range",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BINARY_SEARCH],
    lessonIds: [INVARIANT_LESSON],
    confidenceLevel: "core",
    prompt:
      "An incident tool stores the day's HTTP status codes sorted ascending. To size an incident, it needs the span of one code: given the sorted codes and a target code, return [first_index, last_index] of the target's occurrences, or [-1, -1] if the code never appears. The log can be huge and one code can dominate it, so counting matches linearly is not acceptable.",
    constraints:
      "Codes are sorted ascending with duplicates. Required: O(log n) time via two boundary searches, O(1) extra space. Do not scan outward from a found match — a code repeated a million times makes that linear.",
    starterCode: "def code_range(codes: list[int], target: int) -> list[int]:\n    ...\n",
    tests: [
      { name: "run in the middle", input: "[400, 404, 404, 404, 500, 503], 404", expected: "[1, 3]", args: [[400, 404, 404, 404, 500, 503], 404], expectedValue: [1, 3] },
      { name: "code absent", input: "[400, 404, 500], 503", expected: "[-1, -1]", args: [[400, 404, 500], 503], expectedValue: [-1, -1] },
      { name: "single occurrence", input: "[500], 500", expected: "[0, 0]", args: [[500], 500], expectedValue: [0, 0] },
      { name: "empty log", input: "[], 404", expected: "[-1, -1]", args: [[], 404], expectedValue: [-1, -1], hidden: true },
      { name: "entire log is one code", input: "[404, 404, 404, 404], 404", expected: "[0, 3]", args: [[404, 404, 404, 404], 404], expectedValue: [0, 3], hidden: true },
      { name: "absent but between neighbors", input: "[400, 500], 450", expected: "[-1, -1]", args: [[400, 500], 450], expectedValue: [-1, -1], hidden: true },
    ],
    hints: [
      "Run two separate boundary searches: the first index with code >= target, and the first index with code > target.",
      "If the lower boundary lands out of range or on a different code, the target is absent.",
    ],
    solutionOutline:
      "Implement lower_bound(target) as a first-true search on codes[i] >= target and upper_bound as first-true on codes[i] > target. The range is [lower, upper - 1]. If lower == len(codes) or codes[lower] != target, return [-1, -1]. Two O(log n) searches, no outward scanning, so a dominant code costs the same as a rare one.",
    commonMistakes: [
      "Finding one match and expanding left/right linearly, which degenerates to O(n) on long runs.",
      "Off-by-one between the two boundaries: upper_bound points one past the last occurrence, so the answer is upper - 1, not upper.",
    ],
    followUpQuestions: [
      "How would you return the count of occurrences instead, and why is it upper - lower?",
      "How does this map onto bisect_left and bisect_right in Python's standard library?",
    ],
    rubric: [
      { criterion: "Two-boundary decomposition", description: "Solves the range as two independent monotone boundary searches rather than one exact match plus scanning." },
      { criterion: "Complexity", description: "Stays O(log n) even when the target fills the whole array, and handles absent and empty cases." },
    ],
    sourceType: "original",
    sourceUrls: ["https://docs.python.org/3/library/bisect.html"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "backup-bandwidth-planner",
    title: "Minimum Nightly Bandwidth for a Backup Window",
    type: "dsa",
    difficulty: "medium",
    topics: ["binary-search", "search-on-answer", "greedy-feasibility"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 30,
    language: "python",
    functionName: "min_nightly_capacity",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BINARY_SEARCH],
    lessonIds: [ANSWER_SPACE_LESSON],
    confidenceLevel: "core",
    prompt:
      "A backup service must upload a list of archive sizes (in GB) in their given order. Each night it uploads a contiguous run of archives whose total size may not exceed the nightly capacity, and every archive must ship whole in one night. Given the archive sizes and the number of nights available, return the smallest nightly capacity that finishes all uploads within the allowed nights.",
    constraints:
      "Sizes is non-empty; nights >= 1. Order is fixed and archives cannot be split. Target O(n log S) where S is the sum of sizes: a greedy O(n) feasibility check inside a binary search over candidate capacities.",
    starterCode: "def min_nightly_capacity(sizes: list[int], nights: int) -> int:\n    ...\n",
    tests: [
      { name: "three nights", input: "[6, 3, 5, 5], 3", expected: "8", args: [[6, 3, 5, 5], 3], expectedValue: 8 },
      { name: "one night takes everything", input: "[10, 4, 6], 1", expected: "20", args: [[10, 4, 6], 1], expectedValue: 20 },
      { name: "a night per archive", input: "[10, 4, 6], 3", expected: "10", args: [[10, 4, 6], 3], expectedValue: 10 },
      { name: "even split", input: "[5, 5, 5, 5], 2", expected: "10", args: [[5, 5, 5, 5], 2], expectedValue: 10, hidden: true },
      { name: "increasing sizes", input: "[1..9], 3 nights", expected: "17", args: [[1, 2, 3, 4, 5, 6, 7, 8, 9], 3], expectedValue: 17, hidden: true },
      { name: "more nights than archives", input: "[8], 4", expected: "8", args: [[8], 4], expectedValue: 8, hidden: true },
    ],
    hints: [
      "For a fixed capacity, counting the nights needed is a simple greedy scan — write that check first.",
      "Feasibility is monotone in capacity, so the smallest workable capacity is a first-true boundary between max(sizes) and sum(sizes).",
    ],
    solutionOutline:
      "Write nights_needed(c): walk the sizes, packing archives into the current night while the running total stays <= c, starting a new night otherwise. Then binary search c over [max(sizes), sum(sizes)]: if nights_needed(mid) <= nights, the answer is mid or smaller (hi = mid), else lo = mid + 1. The greedy check is optimal for a fixed capacity because delaying a split can only push more volume into later nights.",
    commonMistakes: [
      "Starting the search at lo = 0 or lo = 1, which can return a capacity smaller than the largest single archive.",
      "Reordering or splitting archives — the contract fixes the order and shipping whole archives.",
      "An infeasible loop update (hi = mid - 1 on the feasible branch) that skips the true boundary.",
    ],
    followUpQuestions: [
      "How would the check change if the service could reorder archives freely, and why does the problem become harder?",
      "How do you adapt this to return the actual night-by-night plan, not just the capacity?",
    ],
    rubric: [
      { criterion: "Monotonicity argument", description: "States why feasibility is monotone in capacity before searching, and derives tight lo/hi bounds." },
      { criterion: "Feasibility check", description: "Greedy nights count is correct, O(n), and separated cleanly from the search loop." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "stale-metric-lookup",
    title: "Nearest Sample at or Before Each Query",
    type: "dsa",
    difficulty: "medium",
    topics: ["binary-search", "time-series", "observability"],
    targetRoles: ["backend_swe", "infrastructure_swe", "new_grad_swe"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 25,
    language: "python",
    functionName: "latest_samples",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH, BACKEND_PATH],
    moduleIds: [BINARY_SEARCH, OBSERVABILITY],
    lessonIds: [ANSWER_SPACE_LESSON],
    confidenceLevel: "advanced",
    prompt:
      "A metrics dashboard renders sparse gauges: a metric reports at irregular times, and each chart pixel must show the latest sample at or before that pixel's timestamp. Given the sorted sample timestamps and a list of query timestamps (in any order), return, for each query, the largest sample timestamp that is <= the query, or -1 when no sample exists that early. Dashboards issue thousands of queries per refresh against long sample histories, so each lookup must be logarithmic.",
    constraints:
      "Samples are sorted ascending and may contain duplicates; queries are arbitrary. Required: O(log n) per query — an O(n) scan per query makes the dashboard refresh quadratic overall.",
    starterCode: "def latest_samples(samples: list[int], queries: list[int]) -> list[int]:\n    ...\n",
    tests: [
      { name: "mixed queries", input: "[10, 20, 30], [25, 5, 30]", expected: "[20, -1, 30]", args: [[10, 20, 30], [25, 5, 30]], expectedValue: [20, -1, 30] },
      { name: "query after the last sample", input: "[10, 20, 30], [35]", expected: "[30]", args: [[10, 20, 30], [35]], expectedValue: [30] },
      { name: "boundary hits", input: "[100], [99, 100, 101]", expected: "[-1, 100, 100]", args: [[100], [99, 100, 101]], expectedValue: [-1, 100, 100] },
      { name: "metric never reported", input: "[], [10, 20]", expected: "[-1, -1]", args: [[], [10, 20]], expectedValue: [-1, -1], hidden: true },
      { name: "duplicate samples", input: "[15, 15, 40], [15, 39, 14]", expected: "[15, 15, -1]", args: [[15, 15, 40], [15, 39, 14]], expectedValue: [15, 15, -1], hidden: true },
    ],
    hints: [
      "This is the mirror image of first-true: you want the last index with sample <= query.",
      "Find the first index with sample > query, then step back one; index 0 means no sample qualifies.",
    ],
    solutionOutline:
      "For each query, binary search the first index whose sample is strictly greater than the query (upper bound). If that index is 0, answer -1; otherwise answer samples[index - 1]. Duplicates are harmless because any copy of the same timestamp yields the same value. Total cost O(q log n), which keeps large dashboard refreshes linearithmic. In production this is exactly how sparse time-series stores align samples to render buckets.",
    commonMistakes: [
      "Using a lower bound (first sample >= query) and returning a sample later than the query.",
      "Scanning backwards from the end for each query, which turns a refresh into an O(n * q) hot loop.",
      "Mishandling a query exactly equal to a sample — <= means the sample itself is the answer.",
    ],
    followUpQuestions: [
      "If queries arrive sorted, how do you answer all of them in O(n + q) with a single merge walk instead?",
      "How would you extend this to return the sample's value and flag results older than a staleness budget?",
    ],
    rubric: [
      { criterion: "Boundary choice", description: "Picks the upper-bound formulation and correctly steps back one index, including the no-sample case." },
      { criterion: "Applied framing", description: "Explains the per-query complexity budget and why the linear scan fails at dashboard scale." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "reverse-approval-chain",
    title: "Reverse an Approval Chain In Place",
    type: "dsa",
    difficulty: "easy",
    topics: ["linked-lists", "pointer-manipulation"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "reverse_chain",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [LINKED_LISTS],
    lessonIds: [POINTER_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A document approval workflow stores approver IDs as a singly linked chain in signing order. Compliance now requires processing approvals in reverse. Build the chain from the input values with the provided helpers, reverse it by re-pointing the nodes (no new nodes, no collecting values into an array and reversing that), and return the reversed chain serialized back to a list.",
    constraints:
      "Reverse by redirecting next pointers in one pass: O(n) time, O(1) extra space. The chain may be empty or hold a single approver. The test harness only sees the serialized list, but practice the pointer version — that is what interviews check.",
    starterCode:
      LIST_HELPERS +
      "def reverse_chain(values: list[int]) -> list[int]:\n    head = build_chain(values)\n    # Reverse the chain by re-pointing nodes, then serialize the new head.\n    ...\n",
    tests: [
      { name: "three approvers", input: "[4, 8, 15]", expected: "[15, 8, 4]", args: [[4, 8, 15]], expectedValue: [15, 8, 4] },
      { name: "empty chain", input: "[]", expected: "[]", args: [[]], expectedValue: [] },
      { name: "single approver", input: "[7]", expected: "[7]", args: [[7]], expectedValue: [7] },
      { name: "duplicate approvers", input: "[2, 2, 9, 2]", expected: "[2, 9, 2, 2]", args: [[2, 2, 9, 2]], expectedValue: [2, 9, 2, 2], hidden: true },
      { name: "longer chain", input: "[1, 2, 3, 4, 5, 6]", expected: "[6, 5, 4, 3, 2, 1]", args: [[1, 2, 3, 4, 5, 6]], expectedValue: [6, 5, 4, 3, 2, 1], hidden: true },
    ],
    hints: [
      "Walk with prev and curr; before redirecting curr.next to prev, save curr.next in a temporary.",
      "When curr runs off the end, prev is the new head.",
    ],
    solutionOutline:
      "Set prev = None, curr = head. Each step: save nxt = curr.next, point curr.next at prev, advance prev = curr, curr = nxt. When curr is None, prev heads the reversed chain; serialize it with to_list. Empty and single-node chains fall out of the same loop with zero or one iteration.",
    commonMistakes: [
      "Overwriting curr.next before saving it, which loses the rest of the chain.",
      "Returning head (now the tail) instead of prev after the loop.",
      "Cheating by reversing the Python list — it passes the tests but defeats the exercise and will not survive a follow-up.",
    ],
    followUpQuestions: [
      "How would you reverse only the first k approvers and leave the rest attached?",
      "Can you write the recursive version, and what does it cost in stack space?",
    ],
    rubric: [
      { criterion: "Pointer sequencing", description: "Saves next before overwriting and finishes with a correctly terminated reversed chain." },
      { criterion: "Edge cases", description: "Empty and single-node chains work without special-case branches." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "middle-of-release-queue",
    title: "Middle of the Release Queue",
    type: "dsa",
    difficulty: "easy",
    topics: ["linked-lists", "slow-fast-pointers"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "middle_release",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [LINKED_LISTS],
    lessonIds: [SLOW_FAST_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A deploy tool keeps pending releases in a singly linked queue and wants to show the release at the middle of the queue as a progress marker. Build the chain from the input values with the provided helpers and return the value of the middle node using one pass with slow and fast pointers — the queue object exposes no length. When the queue length is even, return the second of the two middle releases.",
    constraints:
      "The queue is non-empty. One traversal, O(1) extra space: no counting pass, no copying values into an array. Even lengths return the second middle.",
    starterCode:
      LIST_HELPERS +
      "def middle_release(values: list[int]) -> int:\n    head = build_chain(values)\n    # One pass, slow/fast pointers; return the middle node's value.\n    ...\n",
    tests: [
      { name: "odd-length queue", input: "[3, 9, 4, 7, 5]", expected: "4", args: [[3, 9, 4, 7, 5]], expectedValue: 4 },
      { name: "even length returns second middle", input: "[3, 9, 4, 7]", expected: "4", args: [[3, 9, 4, 7]], expectedValue: 4 },
      { name: "single release", input: "[12]", expected: "12", args: [[12]], expectedValue: 12 },
      { name: "two releases", input: "[5, 6]", expected: "6", args: [[5, 6]], expectedValue: 6, hidden: true },
      { name: "eight releases", input: "[1..8]", expected: "5", args: [[1, 2, 3, 4, 5, 6, 7, 8]], expectedValue: 5, hidden: true },
    ],
    hints: [
      "Advance slow one node and fast two nodes per iteration; when fast falls off, slow is at the middle.",
      "Check fast and fast.next before stepping twice, or the even-length case dereferences None.",
    ],
    solutionOutline:
      "Set slow = fast = head. While fast is not None and fast.next is not None: slow = slow.next, fast = fast.next.next. Return slow.value. For even lengths this loop leaves slow on the second middle, which matches the contract; verify by hand on a two-node queue.",
    commonMistakes: [
      "Stepping fast twice without checking fast.next, crashing on even-length queues.",
      "Returning the first middle for even lengths when the contract asks for the second.",
      "Running a counting pass first — it is correct but fails the one-pass requirement interviewers add.",
    ],
    followUpQuestions: [
      "How does the same two-speed walk detect a cycle in a corrupted queue?",
      "How would you return the node just before the middle for an insertion, not the middle itself?",
    ],
    rubric: [
      { criterion: "Loop guard", description: "Checks both fast and fast.next so odd and even lengths terminate safely." },
      { criterion: "Contract precision", description: "Returns the second middle for even lengths and works for a single-node queue." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "drop-stale-checkpoint",
    title: "Drop the kth Checkpoint from the End",
    type: "dsa",
    difficulty: "medium",
    topics: ["linked-lists", "two-pointers", "dummy-head"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 25,
    language: "python",
    functionName: "drop_kth_from_end",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [LINKED_LISTS],
    lessonIds: [SLOW_FAST_LESSON],
    confidenceLevel: "core",
    prompt:
      "A training job keeps model checkpoints as a singly linked chain from oldest to newest. A retention rule deletes the checkpoint that is k positions from the end (k = 1 is the newest). Build the chain from the input values, remove the kth node from the end in a single pass using two offset pointers and a dummy head, and return the remaining chain serialized to a list.",
    constraints:
      "1 <= k <= chain length. One traversal, O(1) extra space: no length-counting first pass, no array of nodes. Removing the oldest checkpoint (k = length) must not special-case the head — use a dummy node.",
    starterCode:
      LIST_HELPERS +
      "def drop_kth_from_end(values: list[int], k: int) -> list[int]:\n    head = build_chain(values)\n    # One pass with a dummy head and two offset pointers.\n    ...\n",
    tests: [
      { name: "drop second from end", input: "[10, 20, 30, 40], 2", expected: "[10, 20, 40]", args: [[10, 20, 30, 40], 2], expectedValue: [10, 20, 40] },
      { name: "drop the oldest (head)", input: "[10, 20, 30], 3", expected: "[20, 30]", args: [[10, 20, 30], 3], expectedValue: [20, 30] },
      { name: "drop the newest (tail)", input: "[10, 20, 30], 1", expected: "[10, 20]", args: [[10, 20, 30], 1], expectedValue: [10, 20] },
      { name: "only checkpoint removed", input: "[42], 1", expected: "[]", args: [[42], 1], expectedValue: [], hidden: true },
      { name: "duplicate values", input: "[7, 7, 7, 8], 2", expected: "[7, 7, 8]", args: [[7, 7, 7, 8], 2], expectedValue: [7, 7, 8], hidden: true },
    ],
    hints: [
      "Start both pointers at a dummy node in front of the head, then advance the lead pointer k steps.",
      "Move both pointers together until the lead reaches the last node; the trailing pointer now sits just before the victim.",
    ],
    solutionOutline:
      "Create dummy with dummy.next = head; set lead = trail = dummy. Advance lead k times, then advance both until lead.next is None. Now trail.next is the kth node from the end: unlink it with trail.next = trail.next.next and return to_list(dummy.next). The dummy head makes k == length (removing the first node) the same code path, and the single-node case returns the empty chain.",
    commonMistakes: [
      "Positioning the trailing pointer on the victim instead of one node before it, making the unlink impossible.",
      "Special-casing head removal instead of starting from a dummy node.",
      "An off-by-one in the initial k-step advance — verify on a two-node chain with k = 2.",
    ],
    followUpQuestions: [
      "How would you delete all checkpoints beyond the newest k in the same pass?",
      "What changes if the chain is doubly linked — do you still need the offset walk?",
    ],
    rubric: [
      { criterion: "Offset-pointer placement", description: "Lead/trail gap is exactly k with the trail landing one node before the target." },
      { criterion: "Uniform head handling", description: "Dummy head removes the head case without branches, including the single-node chain." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "merge-alert-feeds",
    title: "Merge k Sorted Alert Feeds",
    type: "dsa",
    difficulty: "hard",
    topics: ["linked-lists", "heaps", "k-way-merge"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "hft", "infra_heavy"],
    estimatedMinutes: 40,
    language: "python",
    functionName: "merge_feeds",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [LINKED_LISTS, HEAPS],
    lessonIds: [POINTER_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "An alerting gateway receives k regional feeds, each already sorted by alert timestamp, and must emit one globally sorted stream. Given the feeds as lists of integer timestamps, merge them into a single sorted list. Feeds may be empty, timestamps may repeat across feeds, and k can be large while individual feeds stay short — so repeatedly concatenating and sorting everything, and likewise merging feed 1 with feed 2, then that result with feed 3, and so on, are both too slow.",
    constraints:
      "Let N be the total number of alerts. Required: O(N log k), via a min-heap of the current head of each feed (or pairwise merging in rounds). Sequentially folding feeds one into another is O(N * k) and rejected in the follow-up; conceptually treat each feed as a chain you splice from the front.",
    starterCode:
      "import heapq\n\ndef merge_feeds(feeds: list[list[int]]) -> list[int]:\n    # Min-heap of (timestamp, feed_index, position) or pairwise merge rounds.\n    ...\n",
    tests: [
      { name: "three feeds", input: "[[1, 4, 9], [2, 3, 10], [6]]", expected: "[1, 2, 3, 4, 6, 9, 10]", args: [[[1, 4, 9], [2, 3, 10], [6]]], expectedValue: [1, 2, 3, 4, 6, 9, 10] },
      { name: "empty feeds among inputs", input: "[[], [5], []]", expected: "[5]", args: [[[], [5], []]], expectedValue: [5] },
      { name: "no feeds", input: "[]", expected: "[]", args: [[]], expectedValue: [] },
      { name: "duplicates across feeds", input: "[[1, 1], [1]]", expected: "[1, 1, 1]", args: [[[1, 1], [1]]], expectedValue: [1, 1, 1], hidden: true },
      { name: "many single-alert feeds", input: "[[3], [2], [1], [0]]", expected: "[0, 1, 2, 3]", args: [[[3], [2], [1], [0]]], expectedValue: [0, 1, 2, 3], hidden: true },
      { name: "interleaved long feeds", input: "evens and odds", expected: "[0..9]", args: [[[0, 2, 4, 6, 8], [1, 3, 5, 7, 9]]], expectedValue: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], hidden: true },
    ],
    hints: [
      "Seed a min-heap with the first alert of every non-empty feed, tagged with which feed it came from.",
      "Each pop emits one alert and pushes that feed's next alert, so the heap never holds more than k entries.",
      "In languages without a heap library, merging feeds pairwise in rounds (1&2, 3&4, then the halves) also achieves O(N log k).",
    ],
    solutionOutline:
      "Push (feeds[i][0], i, 0) for every non-empty feed onto a min-heap. Loop: pop the smallest (t, i, j), append t to the output, and push (feeds[i][j+1], i, j+1) when it exists. Every alert enters and leaves a heap of size <= k exactly once: O(N log k). The (timestamp, feed, position) tuple keeps comparisons total even with duplicate timestamps. The pairwise-rounds alternative gives the same bound and is the standard answer where no heap primitive exists.",
    commonMistakes: [
      "Folding feeds sequentially (merge into an accumulator), which is O(N * k) when k is large.",
      "Seeding the heap with every alert from every feed — correct but O(N log N) and misses the point of the streaming merge.",
      "Crashing on empty feeds when seeding the heap, or dropping duplicate timestamps instead of emitting all of them.",
    ],
    followUpQuestions: [
      "The real feeds are unbounded streams, not lists — what does the heap loop look like when feeds block on their next alert?",
      "How does this generalize to merging k sorted runs on disk in external sorting?",
      "If one feed lags far behind, what does the gateway do: stall the merged stream or emit and re-order later?",
    ],
    rubric: [
      { criterion: "Complexity", description: "Achieves O(N log k) with a bounded heap or pairwise rounds, and can say why sequential folding is worse." },
      { criterion: "Stream correctness", description: "Handles empty feeds, duplicate timestamps, and exhausted feeds without losing or reordering alerts." },
      { criterion: "Systems connection", description: "Relates the pattern to log/stream aggregation or external sort when prompted." },
    ],
    sourceType: "original",
    sourceUrls: ["https://docs.python.org/3/library/heapq.html"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
]);
