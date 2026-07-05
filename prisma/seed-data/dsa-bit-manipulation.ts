import { defineProblems, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const DSA_PATH = learningPathId("dsa-confidence-builder");
const BITS = learningModuleId("bit-manipulation");
const BITS_CONCEPT = lessonId(BITS, "bit-manipulation-concept");
const BITS_WALKTHROUGH = lessonId(BITS, "bit-manipulation-walkthrough");

const LANGUAGES = ["python", "javascript", "typescript"] as const;

/**
 * Batch 16: bit-manipulation runnable DSA problems. Global (non-path-scoped)
 * module ID so they appear on the standalone module page and in the DSA path.
 * All test values stay within the signed 32-bit range so JS/TS bitwise
 * operators behave identically to Python.
 */
export const dsaBitManipulationProblems = defineProblems([
  // ─── bit-manipulation warmup 1 ────────────────────────────────────────────
  {
    slug: "bits-single-number",
    title: "Single Number: Find the Unpaired Element With XOR",
    type: "dsa",
    difficulty: "easy",
    topics: ["bit-manipulation", "xor", "arrays"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "single_number",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BITS],
    lessonIds: [BITS_CONCEPT, BITS_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Every element in the list appears exactly twice except for one element that appears once. Find and return that single element.\n\nExample: [4,1,2,1,2] → 4 (every other value cancels its pair).",
    constraints:
      "1 ≤ len(nums) ≤ 10^5, exactly one element appears once and all others exactly twice, values are non-negative and fit in 31 bits. Target O(n) time and O(1) extra space — the hashmap approach works but misses the point of this module.",
    starterCode:
      "def single_number(nums: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "unpaired 1",
        input: "nums=[2,2,1]",
        expected: "1",
        args: [[2, 2, 1]],
        expectedValue: 1,
      },
      {
        name: "unpaired 4",
        input: "nums=[4,1,2,1,2]",
        expected: "4",
        args: [[4, 1, 2, 1, 2]],
        expectedValue: 4,
      },
      {
        name: "single element",
        input: "nums=[7]",
        expected: "7",
        args: [[7]],
        expectedValue: 7,
        hidden: true,
      },
    ],
    hints: [
      "XOR has two magic properties: x ^ x = 0 (a value cancels itself) and x ^ 0 = x (0 is the identity).",
      "XOR is also commutative and associative, so the order you combine the numbers does not matter.",
      "XOR every element together — the paired values cancel to 0, leaving only the unpaired one.",
    ],
    solutionOutline:
      "Fold XOR across the whole list starting from 0: result ^= x for each x. Because x ^ x = 0 and XOR is commutative/associative, every value that appears twice cancels itself out, and 0 ^ (the single value) leaves exactly that value. O(n) time, O(1) space — no hashmap needed. This is the canonical 'XOR cancels pairs' trick.",
    commonMistakes: [
      "Reaching for a hashmap or sorting — correct, but O(n) space or O(n log n), missing the XOR insight.",
      "Initializing the accumulator to nums[0] and re-XORing it (double-counting) instead of starting from 0.",
      "Assuming the input must be sorted — XOR does not care about order.",
    ],
    followUpQuestions: [
      "Which two XOR identities make this work, and why does order not matter?",
      "How would you find the single element if every other element appeared three times instead of twice?",
    ],
    rubric: [
      { criterion: "XOR insight", description: "Uses x^x=0 and x^0=x to cancel pairs in one pass, O(1) space." },
      { criterion: "Correctness", description: "Returns the unpaired element regardless of order or size." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── bit-manipulation warmup 2 ────────────────────────────────────────────
  {
    slug: "bits-count-set-bits",
    title: "Count Set Bits With Brian Kernighan's Trick",
    type: "dsa",
    difficulty: "easy",
    topics: ["bit-manipulation", "counting"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 12,
    language: "python",
    functionName: "count_set_bits",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BITS],
    lessonIds: [BITS_CONCEPT, BITS_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Return the number of 1 bits (set bits) in the binary representation of a non-negative integer n — also called its Hamming weight or popcount.\n\nExample: n=11 (binary 1011) → 3.",
    constraints:
      "0 ≤ n ≤ 10^9 (fits in 30 bits, so signed 32-bit bitwise operators behave the same across languages). Brian Kernighan's trick runs in O(number of set bits), faster than checking all 32 positions.",
    starterCode:
      "def count_set_bits(n: int) -> int:\n    ...\n",
    tests: [
      {
        name: "1011 has three ones",
        input: "n=11",
        expected: "3",
        args: [11],
        expectedValue: 3,
      },
      {
        name: "zero",
        input: "n=0",
        expected: "0",
        args: [0],
        expectedValue: 0,
      },
      {
        name: "byte of all ones",
        input: "n=255",
        expected: "8",
        args: [255],
        expectedValue: 8,
        hidden: true,
      },
      {
        name: "ten ones (1023)",
        input: "n=1023",
        expected: "10",
        args: [1023],
        expectedValue: 10,
        hidden: true,
      },
    ],
    hints: [
      "The expression n & (n - 1) clears the lowest set bit of n — for example 1100 & 1011 = 1000.",
      "Repeatedly apply n = n & (n - 1), counting each step, until n becomes 0.",
      "This loops exactly as many times as there are set bits, not 32 times.",
    ],
    solutionOutline:
      "Brian Kernighan's algorithm: while n != 0, do n = n & (n - 1) and increment a counter. Subtracting 1 flips the lowest set bit to 0 and all lower 0s to 1; ANDing with n therefore clears exactly that lowest set bit. So each iteration removes one set bit, and the loop runs once per set bit — O(popcount) rather than O(bit width). Return the counter.",
    commonMistakes: [
      "Right-shifting and testing the low bit 32 times — correct but always 32 iterations, versus popcount iterations for Kernighan.",
      "Using n & (n - 1) but forgetting it clears the LOWEST set bit (not the highest).",
      "Off-by-one by counting before the AND on a zero input.",
    ],
    followUpQuestions: [
      "Why does n & (n - 1) clear exactly the lowest set bit?",
      "How would you use this to check whether n is a power of two in one expression?",
    ],
    rubric: [
      { criterion: "Kernighan's trick", description: "Uses n & (n-1) to clear the lowest set bit, iterating popcount times." },
      { criterion: "Edge handling", description: "Returns 0 for n=0 and correct counts across the range." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── bit-manipulation core 1 ──────────────────────────────────────────────
  {
    slug: "bits-counting-bits-dp",
    title: "Counting Bits From 0 to n in Linear Time",
    type: "dsa",
    difficulty: "medium",
    topics: ["bit-manipulation", "dynamic-programming"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 18,
    language: "python",
    functionName: "counting_bits",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BITS],
    lessonIds: [BITS_CONCEPT, BITS_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Given a non-negative integer n, return a list of length n+1 where the i-th element is the number of set bits in i, for every i from 0 to n.\n\nExample: n=5 → [0,1,1,2,1,2] (counts for 0,1,2,3,4,5).",
    constraints:
      "0 ≤ n ≤ 10^5. The naive approach calls popcount n+1 times (O(n log n)); the intended solution is O(n) using a DP recurrence that reuses already-computed counts.",
    starterCode:
      "def counting_bits(n: int) -> list[int]:\n    ...\n",
    tests: [
      {
        name: "0 through 5",
        input: "n=5",
        expected: "[0,1,1,2,1,2]",
        args: [5],
        expectedValue: [0, 1, 1, 2, 1, 2],
      },
      {
        name: "just zero",
        input: "n=0",
        expected: "[0]",
        args: [0],
        expectedValue: [0],
      },
      {
        name: "0 through 2",
        input: "n=2",
        expected: "[0,1,1]",
        args: [2],
        expectedValue: [0, 1, 1],
        hidden: true,
      },
    ],
    hints: [
      "Relate the bit count of i to a smaller, already-solved number.",
      "i >> 1 drops i's lowest bit, so bits(i) = bits(i >> 1) + (the lowest bit of i).",
      "The lowest bit of i is i & 1. So dp[i] = dp[i >> 1] + (i & 1).",
    ],
    solutionOutline:
      "Dynamic programming over bits. dp[0] = 0. For i from 1 to n: dp[i] = dp[i >> 1] + (i & 1). Reasoning: i >> 1 is i with its least significant bit removed, and it is a smaller index whose count is already computed; adding back i & 1 (0 or 1, the bit we dropped) gives i's count. Each entry is O(1), so the whole array is O(n) — strictly better than calling popcount on each number. Return dp.",
    commonMistakes: [
      "Calling a popcount routine for each i (O(n log n)) instead of the O(n) DP recurrence.",
      "Using dp[i-1] instead of dp[i >> 1] — the recurrence must reference the number with the low bit removed.",
      "Off-by-one on the array length (it must be n+1 to include index n).",
    ],
    followUpQuestions: [
      "Why is dp[i >> 1] + (i & 1) correct, and why is i >> 1 always already computed when you reach i?",
      "There is an alternative recurrence dp[i] = dp[i & (i-1)] + 1 — how does it relate to Kernighan's trick?",
    ],
    rubric: [
      { criterion: "DP recurrence", description: "Uses dp[i] = dp[i>>1] + (i&1) to build all counts in O(n)." },
      { criterion: "Array shape", description: "Returns a length n+1 list including index n." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── bit-manipulation core 2 ──────────────────────────────────────────────
  {
    slug: "bits-hamming-distance",
    title: "Hamming Distance Between Two Integers",
    type: "dsa",
    difficulty: "medium",
    topics: ["bit-manipulation", "xor", "counting"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "hamming_distance",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BITS],
    lessonIds: [BITS_CONCEPT, BITS_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "The Hamming distance between two integers is the number of bit positions at which their binary representations differ. Given two non-negative integers x and y, return their Hamming distance.\n\nExample: x=1 (0001), y=4 (0100) → 2 (they differ in two positions).",
    constraints:
      "0 ≤ x, y ≤ 10^9 (fit in 30 bits, so signed 32-bit bitwise operators match across languages). Combine two ideas from this module: XOR to isolate the differing bits, then popcount.",
    starterCode:
      "def hamming_distance(x: int, y: int) -> int:\n    ...\n",
    tests: [
      {
        name: "differ in two positions",
        input: "x=1, y=4",
        expected: "2",
        args: [1, 4],
        expectedValue: 2,
      },
      {
        name: "differ in one position",
        input: "x=3, y=1",
        expected: "1",
        args: [3, 1],
        expectedValue: 1,
      },
      {
        name: "identical numbers",
        input: "x=0, y=0",
        expected: "0",
        args: [0, 0],
        expectedValue: 0,
        hidden: true,
      },
      {
        name: "larger values",
        input: "x=93, y=73",
        expected: "2",
        args: [93, 73],
        expectedValue: 2,
        hidden: true,
      },
    ],
    hints: [
      "x ^ y has a 1 in exactly the positions where x and y differ.",
      "So the Hamming distance is the number of set bits in x ^ y.",
      "Reuse the popcount technique: count the set bits of the XOR with Brian Kernighan's trick.",
    ],
    solutionOutline:
      "Compute z = x ^ y — every 1 bit in z marks a position where x and y disagree. The Hamming distance is therefore popcount(z). Count z's set bits with Kernighan's trick (while z: z &= z - 1; count += 1). This composes the two core ideas of the module — XOR to isolate differences, popcount to count them — in two lines. O(number of differing bits).",
    commonMistakes: [
      "Comparing decimal digits or string characters instead of bits.",
      "Converting to binary strings and diffing — works but ignores the clean XOR-then-popcount approach.",
      "Counting bits of x and y separately instead of their XOR.",
    ],
    followUpQuestions: [
      "Why does x ^ y mark exactly the differing bit positions?",
      "How would you compute the total Hamming distance over all pairs in an array efficiently?",
    ],
    rubric: [
      { criterion: "XOR + popcount composition", description: "Isolates differing bits with XOR and counts them via popcount." },
      { criterion: "Correctness", description: "Returns 0 for equal inputs and correct counts otherwise." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── bit-manipulation challenge ───────────────────────────────────────────
  {
    slug: "bits-single-number-three-times",
    title: "Single Number When Others Appear Three Times",
    type: "dsa",
    difficulty: "hard",
    topics: ["bit-manipulation", "bit-counting", "state-machine"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 28,
    language: "python",
    functionName: "single_number_three_times",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BITS],
    lessonIds: [BITS_CONCEPT, BITS_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "Every element in the list appears exactly three times except for one element that appears exactly once. Find and return that single element, using O(1) extra space.\n\nExample: [0,1,0,1,0,1,99] → 99.\n\nNote: plain XOR does not work here — XOR cancels pairs, not triples.",
    constraints:
      "1 ≤ len(nums) ≤ 3×10^4, every element appears three times except one that appears once, values are non-negative and fit in 31 bits. O(n) time, O(1) space. Two approaches: count each bit position modulo 3, or a two-variable bitwise state machine.",
    starterCode:
      "def single_number_three_times(nums: list[int]) -> int:\n    ...\n",
    tests: [
      {
        name: "99 stands alone",
        input: "nums=[0,1,0,1,0,1,99]",
        expected: "99",
        args: [[0, 1, 0, 1, 0, 1, 99]],
        expectedValue: 99,
      },
      {
        name: "3 appears once",
        input: "nums=[2,2,3,2]",
        expected: "3",
        args: [[2, 2, 3, 2]],
        expectedValue: 3,
      },
      {
        name: "single element",
        input: "nums=[5]",
        expected: "5",
        args: [[5]],
        expectedValue: 5,
        hidden: true,
      },
      {
        name: "single value among triples",
        input: "nums=[7,7,7,42]",
        expected: "42",
        args: [[7, 7, 7, 42]],
        expectedValue: 42,
        hidden: true,
      },
    ],
    hints: [
      "Approach A (intuitive): for each of the 31 bit positions, sum that bit across all numbers. Since triples contribute a multiple of 3, the bit's sum mod 3 is exactly the single number's bit at that position.",
      "Approach B (elegant): a two-variable state machine. Keep `ones` and `twos` tracking bits seen once and twice (mod 3); a bit that reaches three times is cleared from both.",
      "For approach B: ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones. After processing all numbers, `ones` holds the answer.",
    ],
    solutionOutline:
      "Bit-count-mod-3 (approach A): for each bit position b in 0..30, count how many numbers have bit b set; that count mod 3 is the single number's bit b (triples contribute 0 mod 3). Assemble the answer from those bits. O(31n). Two-variable automaton (approach B): maintain ones and twos where bit p of ones/twos means that bit has been seen 1/2 times so far modulo 3. For each x: ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones. When a bit appears a third time it is cleared from both. After the pass, ones is the element seen exactly once. O(n) time, O(1) space.",
    commonMistakes: [
      "Using plain XOR — it cancels pairs, so with triples every value (including the single one, an odd count) survives incorrectly mixed.",
      "In approach A, forgetting to take the per-bit sum modulo 3, or iterating the wrong number of bit positions.",
      "In approach B, swapping the update order of ones and twos (twos must use the just-updated ones).",
    ],
    followUpQuestions: [
      "Generalize: if every element appeared k times except one, how does the bit-count-mod-k approach adapt?",
      "Walk through why the ones/twos automaton clears a bit exactly on its third occurrence.",
    ],
    rubric: [
      { criterion: "Beyond XOR", description: "Recognizes XOR fails for triples and uses bit-count-mod-3 or the ones/twos automaton." },
      { criterion: "Space bound", description: "Achieves O(1) extra space and correct results across the cases." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
