import { defineProblems, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const DSA_PATH = learningPathId("dsa-confidence-builder");
const TRIES = learningModuleId("tries");
const BACKTRACKING = learningModuleId("backtracking");
const TRIES_CONCEPT = lessonId(TRIES, "tries-concept");
const TRIES_WALKTHROUGH = lessonId(TRIES, "tries-walkthrough");
const BT_CONCEPT = lessonId(BACKTRACKING, "backtracking-concept");
const BT_WALKTHROUGH = lessonId(BACKTRACKING, "backtracking-walkthrough");

const LANGUAGES = ["python", "javascript", "typescript"] as const;

/**
 * Batch 13: tries and backtracking runnable DSA problems.
 * Global (non-path-scoped) module IDs so they appear on the standalone
 * module pages and in the DSA path. Outputs are canonicalized (sorted)
 * so the function_call harness can compare them deterministically.
 */
export const dsaTriesBacktrackingProblems = defineProblems([
  // ─── tries warmup 1 ───────────────────────────────────────────────────────
  {
    slug: "trie-prefix-count",
    title: "Prefix Counter: How Many Words Start With Each Prefix",
    type: "dsa",
    difficulty: "easy",
    topics: ["trie", "strings", "prefix"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "count_prefixes",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TRIES],
    lessonIds: [TRIES_CONCEPT, TRIES_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Given a list of words, answer a batch of prefix queries. For each query string, return how many of the words have that query as a prefix (a word is a prefix of itself).\n\nReturn a list of integers, one per query, in the same order as the queries.",
    constraints:
      "1 ≤ len(words) ≤ 10^4, 1 ≤ len(queries) ≤ 10^4, word/query length ≤ 50, lowercase letters only. Building a trie once and counting words through each node makes every query O(len(query)); repeatedly scanning all words per query is O(len(words) × len(query)) and is the anti-pattern this problem targets.",
    starterCode:
      "def count_prefixes(words: list[str], queries: list[str]) -> list[int]:\n    ...\n",
    tests: [
      {
        name: "mixed prefixes",
        input: "words=['apple','app','apricot','banana'], queries=['app','ap','b','c']",
        expected: "[2, 3, 1, 0]",
        args: [
          ["apple", "app", "apricot", "banana"],
          ["app", "ap", "b", "c"],
        ],
        expectedValue: [2, 3, 1, 0],
      },
      {
        name: "word is a prefix of itself",
        input: "words=['car','card','care'], queries=['car','card','ca']",
        expected: "[3, 1, 3]",
        args: [
          ["car", "card", "care"],
          ["car", "card", "ca"],
        ],
        expectedValue: [3, 1, 3],
      },
      {
        name: "single word, several prefix queries",
        input: "words=['dog'], queries=['cat','do','dog','dogs']",
        expected: "[0, 1, 1, 0]",
        args: [["dog"], ["cat", "do", "dog", "dogs"]],
        expectedValue: [0, 1, 1, 0],
        hidden: true,
      },
      {
        name: "duplicate words counted separately",
        input: "words=['ab','ab','abc'], queries=['ab','abc','abcd']",
        expected: "[3, 1, 0]",
        args: [
          ["ab", "ab", "abc"],
          ["ab", "abc", "abcd"],
        ],
        expectedValue: [3, 1, 0],
        hidden: true,
      },
    ],
    hints: [
      "Build one trie. As you insert each word, increment a `passes` counter on every node the word travels through (including the root's children down to the last letter).",
      "A query's answer is the `passes` count at the node you reach after walking the query's letters — or 0 if the path falls off the trie.",
    ],
    solutionOutline:
      "Insert every word into a trie; at each node along a word's path, increment a counter `passes` that records how many words pass through this node. That counter equals the number of stored words having the path-to-this-node as a prefix. For each query, walk its characters from the root; if a character is missing, the answer is 0; otherwise the answer is the `passes` counter at the final node. Build is O(total word length); each query is O(len(query)).",
    commonMistakes: [
      "Re-scanning all words for each query (O(words × query length)) instead of building the trie once.",
      "Incrementing the counter only at terminal nodes — then you count exact words, not prefixes.",
      "Returning 0 vs falling off the trie inconsistently: a missing character mid-walk means 0 matches.",
    ],
    followUpQuestions: [
      "How would you also support counting exact words (not prefixes) with the same trie?",
      "If words could be deleted, what would you change so `passes` stays correct?",
    ],
    rubric: [
      { criterion: "Trie construction", description: "Builds one trie and maintains a per-node prefix count during insertion." },
      { criterion: "Query efficiency", description: "Each query is O(len(query)) by reading the node counter, not by rescanning words." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── tries warmup 2 ───────────────────────────────────────────────────────
  {
    slug: "trie-exact-word-search",
    title: "Word vs Prefix: The End-of-Word Flag",
    type: "dsa",
    difficulty: "easy",
    topics: ["trie", "strings", "design"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "words_present",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TRIES],
    lessonIds: [TRIES_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "Insert a set of words into a trie, then answer a batch of membership queries. For each query, return True only if it was inserted as a complete word — not merely present as a prefix of some longer word.\n\nReturn a list of booleans, one per query, in query order.",
    constraints:
      "1 ≤ len(words) ≤ 10^4, 1 ≤ len(queries) ≤ 10^4, length ≤ 50, lowercase letters. The whole point is the distinction between a stored word and a prefix, which a trie encodes with an end-of-word marker on the terminal node.",
    starterCode:
      "def words_present(words: list[str], queries: list[str]) -> list[bool]:\n    ...\n",
    tests: [
      {
        name: "prefix is not a word",
        input: "words=['cat','car','card'], queries=['car','ca','card','care']",
        expected: "[True, False, True, False]",
        args: [
          ["cat", "car", "card"],
          ["car", "ca", "card", "care"],
        ],
        expectedValue: [true, false, true, false],
      },
      {
        name: "exact match required",
        input: "words=['a','ab'], queries=['a','ab','abc','b']",
        expected: "[True, True, False, False]",
        args: [
          ["a", "ab"],
          ["a", "ab", "abc", "b"],
        ],
        expectedValue: [true, true, false, false],
      },
      {
        name: "empty query set of matches",
        input: "words=['hello'], queries=['hell','hello','helloo']",
        expected: "[False, True, False]",
        args: [["hello"], ["hell", "hello", "helloo"]],
        expectedValue: [false, true, false],
        hidden: true,
      },
    ],
    hints: [
      "Each trie node needs a boolean `is_word` set True only on the node reached by the last character of an inserted word.",
      "A query is present only if you can walk all its characters AND the final node has `is_word == True`.",
    ],
    solutionOutline:
      "Insert each word character by character; on the node reached after the final character, set `is_word = True`. For a query, walk from the root: if any character is missing, return False; after consuming all characters, return the final node's `is_word` flag. This distinguishes 'car' (a stored word) from 'ca' (only an internal node on the path to 'car'/'card'), which is the defining feature of a trie versus a plain prefix set.",
    commonMistakes: [
      "Returning True whenever the path exists — that reports prefixes as words.",
      "Forgetting to set `is_word` on the terminal node during insertion.",
      "Not handling a query that falls off the trie (missing character) — it should be False.",
    ],
    followUpQuestions: [
      "How does this structure let you answer both 'is this a word?' and 'is this a prefix of some word?' in one trie?",
      "What changes if words can be removed — when is it safe to delete a node?",
    ],
    rubric: [
      { criterion: "End-of-word semantics", description: "Uses an is_word flag on terminal nodes to distinguish stored words from prefixes." },
      { criterion: "Walk correctness", description: "Returns False for a missing path and honors the terminal flag for exact matches." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── tries core ───────────────────────────────────────────────────────────
  {
    slug: "trie-replace-with-roots",
    title: "Replace Words With Their Shortest Root",
    type: "dsa",
    difficulty: "medium",
    topics: ["trie", "strings", "prefix-matching"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 20,
    language: "python",
    functionName: "replace_words",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TRIES],
    lessonIds: [TRIES_CONCEPT, TRIES_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "You are given a dictionary of root words and a sentence of space-separated words. If a word in the sentence has a root in the dictionary as a prefix, replace the word with the shortest such root. If a word has multiple roots as prefixes, use the shortest one. If it has none, leave it unchanged.\n\nReturn the transformed sentence as a single space-separated string.",
    constraints:
      "1 ≤ len(roots) ≤ 10^4, root length ≤ 50; sentence has ≤ 10^4 words, each ≤ 50 characters, lowercase letters, single spaces. A trie lets you find the shortest matching root while walking each sentence word once — O(len(word)) per word — by stopping at the first end-of-root node.",
    starterCode:
      "def replace_words(roots: list[str], sentence: str) -> str:\n    ...\n",
    tests: [
      {
        name: "classic replacement",
        input: "roots=['cat','bat','rat'], sentence='the cattle was rattled by the battery'",
        expected: "'the cat was rat by the bat'",
        args: [
          ["cat", "bat", "rat"],
          "the cattle was rattled by the battery",
        ],
        expectedValue: "the cat was rat by the bat",
      },
      {
        name: "shortest root wins",
        input: "roots=['a','aa','aaa'], sentence='aaaa a aaa a9'",
        expected: "'a a a a'",
        args: [["a", "aa", "aaa"], "aaaa a aaa a9"],
        expectedValue: "a a a a",
      },
      {
        name: "no matching root keeps the word",
        input: "roots=['cat'], sentence='the dog ran'",
        expected: "'the dog ran'",
        args: [["cat"], "the dog ran"],
        expectedValue: "the dog ran",
        hidden: true,
      },
      {
        name: "prefer shorter of two roots",
        input: "roots=['catt','cat'], sentence='the cattle'",
        expected: "'the cat'",
        args: [["catt", "cat"], "the cattle"],
        expectedValue: "the cat",
        hidden: true,
      },
    ],
    hints: [
      "Insert every root into a trie, marking the end-of-root node.",
      "For each sentence word, walk the trie character by character; the FIRST time you land on an end-of-root node, that root (the characters walked so far) is the shortest matching root — stop and use it.",
      "If you run out of trie path (missing character) before hitting any end-of-root node, keep the original word.",
    ],
    solutionOutline:
      "Build a trie of roots with an is_root flag on terminal nodes. For each word in the sentence, walk from the root accumulating characters; the moment you reach a node with is_root == True, the accumulated prefix is the shortest root (shortest because you stop at the first terminal encountered while descending) — replace the word with it. If a character is missing before any is_root node, the word has no root prefix and stays. Join the transformed words with spaces. O(total sentence length + total root length).",
    commonMistakes: [
      "Continuing past the first end-of-root node and picking a longer root — the shortest root is the first terminal you hit.",
      "Comparing each word against every root (O(roots × word length)) instead of one trie walk per word.",
      "Losing words that have no root — they must pass through unchanged.",
    ],
    followUpQuestions: [
      "Why does stopping at the first end-of-root node during descent guarantee the shortest root?",
      "How would you handle uppercase, punctuation, or multi-space separators robustly?",
    ],
    rubric: [
      { criterion: "Shortest-root logic", description: "Stops at the first end-of-root node during descent to select the shortest matching root." },
      { criterion: "Fallthrough handling", description: "Words with no root prefix are preserved; output is correctly space-joined." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── tries challenge ──────────────────────────────────────────────────────
  {
    slug: "trie-wildcard-search",
    title: "Wildcard Word Search With '.' Matching Any Letter",
    type: "dsa",
    difficulty: "hard",
    topics: ["trie", "strings", "dfs", "backtracking"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 28,
    language: "python",
    functionName: "wildcard_search",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [TRIES],
    lessonIds: [TRIES_CONCEPT, TRIES_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "Build a dictionary from a list of words, then answer a batch of search queries. A query is present if it exactly matches a stored word, where the character '.' in a query matches any single letter. Matching is by exact length — '.' consumes exactly one character.\n\nReturn a list of booleans, one per query, in query order.",
    constraints:
      "1 ≤ len(words) ≤ 10^4, word length ≤ 25, lowercase letters. Queries may contain '.' and lowercase letters, length ≤ 25, up to 10^4 queries. At a '.', you must try every child of the current trie node — this is a DFS over the trie with branching only at wildcards.",
    starterCode:
      "def wildcard_search(words: list[str], queries: list[str]) -> list[bool]:\n    ...\n",
    tests: [
      {
        name: "wildcards and exact",
        input: "words=['bad','dad','mad'], queries=['pad','bad','.ad','b..']",
        expected: "[False, True, True, True]",
        args: [
          ["bad", "dad", "mad"],
          ["pad", "bad", ".ad", "b.."],
        ],
        expectedValue: [false, true, true, true],
      },
      {
        name: "length must match",
        input: "words=['bad'], queries=['ba','bad.','.a.']",
        expected: "[False, False, True]",
        args: [["bad"], ["ba", "bad.", ".a."]],
        expectedValue: [false, false, true],
      },
      {
        name: "all wildcards",
        input: "words=['ab','cd','abc'], queries=['..','...','.']",
        expected: "[True, True, False]",
        args: [
          ["ab", "cd", "abc"],
          ["..", "...", "."],
        ],
        expectedValue: [true, true, false],
        hidden: true,
      },
      {
        name: "wildcard with no matching branch",
        input: "words=['aaa','aba'], queries=['a.a','a..','.b.']",
        expected: "[True, True, True]",
        args: [
          ["aaa", "aba"],
          ["a.a", "a..", ".b."],
        ],
        expectedValue: [true, true, true],
        hidden: true,
      },
    ],
    hints: [
      "Insert all words into a trie with an is_word flag. For a plain letter in the query, follow that single child.",
      "For a '.', recurse into EVERY existing child and succeed if any branch matches the rest of the query.",
      "You match only when you have consumed the entire query AND landed on a node with is_word == True — length must line up exactly.",
    ],
    solutionOutline:
      "Build a trie of the words with is_word markers. Search(query) is a DFS over (node, index): if index == len(query), return node.is_word. If query[index] is a letter, descend to that specific child if it exists and recurse at index+1, else fail. If query[index] == '.', recurse into every child; return True if any child's DFS succeeds. Each query is O(26^(number of dots) × path) in the worst case but typically far less because the trie prunes non-existent branches. Answer each query independently and collect the booleans.",
    commonMistakes: [
      "Treating '.' as 'skip a character' rather than 'match exactly one child' — length must still match.",
      "On a '.', returning after the first child instead of trying all children (backtracking over branches).",
      "Reporting a match at a node that is on a path but not is_word (a prefix, not a full word).",
    ],
    followUpQuestions: [
      "What is the worst-case cost of a query that is all dots, and how does the trie's sparsity help in practice?",
      "How would you extend '.' to a '*' that matches zero or more characters, and why is that materially harder?",
    ],
    rubric: [
      { criterion: "Wildcard DFS", description: "At '.', branches into all children and succeeds if any path matches; letters follow a single child." },
      { criterion: "Exact-length match", description: "Reports True only when the full query is consumed and the terminal node is a complete word." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── backtracking warmup 1 ────────────────────────────────────────────────
  {
    slug: "backtracking-all-subsets",
    title: "Generate All Subsets (The Power Set)",
    type: "dsa",
    difficulty: "easy",
    topics: ["backtracking", "recursion", "subsets"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    language: "python",
    functionName: "subsets",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BACKTRACKING],
    lessonIds: [BT_CONCEPT, BT_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Given a list of distinct integers, return all possible subsets (the power set), including the empty subset and the full set.\n\nTo make the output deterministic: sort each subset in ascending order, and return the overall list of subsets sorted (Python's default list ordering — the empty subset comes first).",
    constraints:
      "0 ≤ len(nums) ≤ 12, integers are distinct. There are 2^n subsets. The canonical output ordering is `sorted(subset for each)` then `sorted(list_of_subsets)`; produce exactly that so results compare deterministically.",
    starterCode:
      "def subsets(nums: list[int]) -> list[list[int]]:\n    ...\n",
    tests: [
      {
        name: "three elements",
        input: "nums=[1,2,3]",
        expected: "[[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]",
        args: [[1, 2, 3]],
        expectedValue: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]],
      },
      {
        name: "empty input",
        input: "nums=[]",
        expected: "[[]]",
        args: [[]],
        expectedValue: [[]],
      },
      {
        name: "single element",
        input: "nums=[1]",
        expected: "[[], [1]]",
        args: [[1]],
        expectedValue: [[], [1]],
        hidden: true,
      },
      {
        name: "unsorted input is canonicalized",
        input: "nums=[3,1]",
        expected: "[[], [1], [1,3], [3]]",
        args: [[3, 1]],
        expectedValue: [[], [1], [1, 3], [3]],
        hidden: true,
      },
    ],
    hints: [
      "The choose/explore/unchoose template: at each index, either include nums[index] or skip it, then recurse on index+1.",
      "When index reaches the end, record a copy of the current partial subset.",
      "Sort the input first (or sort each subset before returning) and sort the final list to match the canonical ordering.",
    ],
    solutionOutline:
      "Sort nums. Depth-first over a start index: maintain a `path`; at each call, record a copy of `path`, then for each index from `start` to the end, append nums[index], recurse with start = index+1, and pop (the unchoose step). This 'start index' pattern generates each subset exactly once. Collect all paths, then return `sorted(result)` (each path already ascending because nums is sorted). 2^n subsets; O(n·2^n) total work to copy them.",
    commonMistakes: [
      "Appending the `path` list itself instead of a copy — every recorded subset then reflects later mutations.",
      "Forgetting the unchoose (pop) step, corrupting the shared path across branches.",
      "Not canonicalizing (sorting) the output, so a correct set of subsets fails an exact-order comparison.",
    ],
    followUpQuestions: [
      "How does the recursion tree have exactly 2^n leaves, and where does each subset get recorded?",
      "If nums could contain duplicates, how would you avoid duplicate subsets?",
    ],
    rubric: [
      { criterion: "Backtracking template", description: "Uses choose/explore/unchoose (or start-index recursion) to enumerate all 2^n subsets exactly once." },
      { criterion: "Copy discipline", description: "Records copies of the path and canonicalizes the output as specified." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── backtracking warmup 2 ────────────────────────────────────────────────
  {
    slug: "backtracking-permutations",
    title: "Generate All Permutations",
    type: "dsa",
    difficulty: "easy",
    topics: ["backtracking", "recursion", "permutations"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 16,
    language: "python",
    functionName: "permutations",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BACKTRACKING],
    lessonIds: [BT_CONCEPT, BT_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "Given a list of distinct integers, return all possible orderings (permutations) of the list.\n\nTo make the output deterministic: return the list of permutations sorted (Python's default list ordering, i.e., lexicographic by element).",
    constraints:
      "1 ≤ len(nums) ≤ 8, integers are distinct. There are n! permutations. Return `sorted(all_permutations)` so results compare deterministically.",
    starterCode:
      "def permutations(nums: list[int]) -> list[list[int]]:\n    ...\n",
    tests: [
      {
        name: "three elements",
        input: "nums=[1,2,3]",
        expected: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
        args: [[1, 2, 3]],
        expectedValue: [
          [1, 2, 3],
          [1, 3, 2],
          [2, 1, 3],
          [2, 3, 1],
          [3, 1, 2],
          [3, 2, 1],
        ],
      },
      {
        name: "single element",
        input: "nums=[1]",
        expected: "[[1]]",
        args: [[1]],
        expectedValue: [[1]],
      },
      {
        name: "two elements",
        input: "nums=[2,1]",
        expected: "[[1,2],[2,1]]",
        args: [[2, 1]],
        expectedValue: [
          [1, 2],
          [2, 1],
        ],
        hidden: true,
      },
    ],
    hints: [
      "Track which indices are already used (a boolean array or a set). At each depth, try every unused element as the next choice.",
      "When the path length equals len(nums), record a copy — that path is a complete permutation.",
      "Sort nums first and sort the final list so the output matches the canonical lexicographic ordering.",
    ],
    solutionOutline:
      "Sort nums for deterministic order. Recurse with a `path` and a `used` boolean array: if len(path) == n, record a copy of path; otherwise, for each index i where used[i] is False, mark used[i] = True, append nums[i], recurse, then pop and set used[i] = False (unchoose). This yields all n! permutations. Return `sorted(result)`. Work is O(n·n!) to build and copy them.",
    commonMistakes: [
      "Reusing an element by not tracking `used`, producing invalid orderings like [1,1,2].",
      "Recording the path reference rather than a copy.",
      "Forgetting to reset `used[i]` on the unchoose step, blocking later branches.",
    ],
    followUpQuestions: [
      "Why is the recursion tree n! leaves, and how does `used` prune to exactly the valid branches?",
      "How would you generate permutations in-place by swapping instead of using a `used` array?",
    ],
    rubric: [
      { criterion: "Used-set tracking", description: "Tracks used elements so each permutation uses every element exactly once." },
      { criterion: "Enumeration completeness", description: "Produces all n! permutations with correct copy discipline and canonical ordering." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── backtracking core 1 ──────────────────────────────────────────────────
  {
    slug: "backtracking-combination-sum",
    title: "Combination Sum With Reusable Numbers",
    type: "dsa",
    difficulty: "medium",
    topics: ["backtracking", "recursion", "combinations", "pruning"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 22,
    language: "python",
    functionName: "combination_sum",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BACKTRACKING],
    lessonIds: [BT_CONCEPT, BT_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Given a list of distinct positive integers `candidates` and a target integer, return all unique combinations of candidates that sum to the target. The same candidate may be used any number of times. Two combinations are the same if they contain the same numbers with the same multiplicities (order does not matter).\n\nTo make the output deterministic: sort each combination in ascending order, and return the overall list of combinations sorted.",
    constraints:
      "1 ≤ len(candidates) ≤ 30, distinct, 1 ≤ candidate ≤ 40, 1 ≤ target ≤ 40. Sort candidates and use a start index so each combination is generated once; prune a branch as soon as the running sum exceeds the target.",
    starterCode:
      "def combination_sum(candidates: list[int], target: int) -> list[list[int]]:\n    ...\n",
    tests: [
      {
        name: "reuse and single",
        input: "candidates=[2,3,6,7], target=7",
        expected: "[[2,2,3],[7]]",
        args: [[2, 3, 6, 7], 7],
        expectedValue: [
          [2, 2, 3],
          [7],
        ],
      },
      {
        name: "multiple reuse depths",
        input: "candidates=[2,3,5], target=8",
        expected: "[[2,2,2,2],[2,3,3],[3,5]]",
        args: [[2, 3, 5], 8],
        expectedValue: [
          [2, 2, 2, 2],
          [2, 3, 3],
          [3, 5],
        ],
      },
      {
        name: "no combination",
        input: "candidates=[2], target=1",
        expected: "[]",
        args: [[2], 1],
        expectedValue: [],
        hidden: true,
      },
      {
        name: "single candidate repeated",
        input: "candidates=[3], target=9",
        expected: "[[3,3,3]]",
        args: [[3], 9],
        expectedValue: [[3, 3, 3]],
        hidden: true,
      },
    ],
    hints: [
      "Sort candidates. Recurse with (start_index, remaining_target). Trying candidates only from `start_index` onward prevents permutations of the same combination.",
      "Because numbers are reusable, when you pick candidates[i] you recurse with the SAME start index i (not i+1).",
      "Prune: if candidates[i] > remaining, stop — since the array is sorted, all later candidates are also too big.",
    ],
    solutionOutline:
      "Sort candidates. DFS(start, remaining, path): if remaining == 0, record a copy of path. Otherwise for i from start to end: if candidates[i] > remaining, break (sorted-array pruning); else append candidates[i], recurse DFS(i, remaining - candidates[i], path) — same i allows reuse — then pop. The start index enforces non-decreasing picks so each multiset is produced once. Return sorted(result). Pruning on the sorted array keeps the search tight.",
    commonMistakes: [
      "Recursing with i+1 instead of i, which forbids reuse and misses combinations like [2,2,3].",
      "Recursing from index 0 each time, generating permutations and hence duplicate combinations.",
      "Skipping the sorted-array prune (`> remaining` → break), doing far more work than needed.",
    ],
    followUpQuestions: [
      "How does the start index eliminate duplicate combinations without a separate dedup pass?",
      "How would the recursion change if each candidate could be used at most once (Combination Sum II)?",
    ],
    rubric: [
      { criterion: "Reuse via start index", description: "Recurses with the same index to allow reuse and uses a non-decreasing start index to avoid duplicate combinations." },
      { criterion: "Pruning", description: "Prunes branches once a candidate exceeds the remaining target on the sorted array." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── backtracking core 2 ──────────────────────────────────────────────────
  {
    slug: "backtracking-generate-parentheses",
    title: "Generate All Valid Parentheses",
    type: "dsa",
    difficulty: "medium",
    topics: ["backtracking", "recursion", "constraints"],
    targetRoles: ["new_grad_swe", "backend_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 20,
    language: "python",
    functionName: "generate_parentheses",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BACKTRACKING],
    lessonIds: [BT_CONCEPT, BT_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "Given n pairs of parentheses, generate all combinations of well-formed (balanced) parentheses using exactly n opening and n closing brackets.\n\nTo make the output deterministic: return the list of strings sorted (Python's default string ordering — '(' sorts before ')').",
    constraints:
      "1 ≤ n ≤ 8. The number of valid strings is the n-th Catalan number. The key is to prune invalid branches DURING construction using two counters rather than generating all 2^(2n) strings and filtering.",
    starterCode:
      "def generate_parentheses(n: int) -> list[str]:\n    ...\n",
    tests: [
      {
        name: "one pair",
        input: "n=1",
        expected: "['()']",
        args: [1],
        expectedValue: ["()"],
      },
      {
        name: "two pairs",
        input: "n=2",
        expected: "['(())', '()()']",
        args: [2],
        expectedValue: ["(())", "()()"],
      },
      {
        name: "three pairs",
        input: "n=3",
        expected: "['((()))','(()())','(())()','()(())','()()()']",
        args: [3],
        expectedValue: ["((()))", "(()())", "(())()", "()(())", "()()()"],
        hidden: true,
      },
      {
        name: "four pairs count",
        input: "n=4 (14 valid strings)",
        expected: "14 strings, sorted",
        args: [4],
        expectedValue: [
          "(((())))",
          "((()()))",
          "((())())",
          "((()))()",
          "(()(()))",
          "(()()())",
          "(()())()",
          "(())(())",
          "(())()()",
          "()((()))",
          "()(()())",
          "()(())()",
          "()()(())",
          "()()()()",
        ],
        hidden: true,
      },
    ],
    hints: [
      "Track two counters: how many '(' and ')' you have placed so far.",
      "You may add '(' while open_count < n. You may add ')' only while close_count < open_count (otherwise the string becomes invalid).",
      "When the string reaches length 2n it is guaranteed balanced — record it.",
    ],
    solutionOutline:
      "DFS(current, open_count, close_count): if len(current) == 2n, record current. Otherwise: if open_count < n, recurse with current + '(' and open_count+1; if close_count < open_count, recurse with current + ')' and close_count+1. The two guards (open < n, close < open) prune every branch that could not extend to a valid string, so you only ever build valid prefixes — far cheaper than generating all 2^(2n) strings and validating. Return sorted(result).",
    commonMistakes: [
      "Generating all 2^(2n) bracket strings and filtering — exponentially more work than pruned construction.",
      "Allowing a ')' when close_count >= open_count, producing invalid strings like '())('.",
      "Adding '(' when open_count == n, exceeding the allowed count.",
    ],
    followUpQuestions: [
      "Why do the two counter guards guarantee every generated string is valid without a separate check?",
      "The count of results is the Catalan number C(n); can you explain the correspondence?",
    ],
    rubric: [
      { criterion: "Constraint pruning", description: "Uses open/close counters to only ever extend valid prefixes, never generating-then-filtering." },
      { criterion: "Correct guards", description: "Adds '(' only while open < n and ')' only while close < open." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── backtracking challenge ───────────────────────────────────────────────
  {
    slug: "backtracking-n-queens-count",
    title: "N-Queens: Count the Distinct Solutions",
    type: "dsa",
    difficulty: "hard",
    topics: ["backtracking", "recursion", "pruning", "constraints"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 30,
    language: "python",
    functionName: "count_n_queens",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    pathIds: [DSA_PATH],
    moduleIds: [BACKTRACKING],
    lessonIds: [BT_CONCEPT, BT_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "The N-Queens puzzle places n queens on an n×n chessboard so that no two queens attack each other — no two share a row, a column, or a diagonal. Given n, return the number of distinct valid placements.",
    constraints:
      "1 ≤ n ≤ 9. Place one queen per row and backtrack column by column, tracking used columns and both diagonal directions in O(1) sets so each placement check is constant time. Brute-forcing all C(n²,n) placements is infeasible; constraint propagation is the point.",
    starterCode:
      "def count_n_queens(n: int) -> int:\n    ...\n",
    tests: [
      {
        name: "n=1",
        input: "n=1",
        expected: "1",
        args: [1],
        expectedValue: 1,
      },
      {
        name: "n=2 (impossible)",
        input: "n=2",
        expected: "0",
        args: [2],
        expectedValue: 0,
      },
      {
        name: "n=4 (two solutions)",
        input: "n=4",
        expected: "2",
        args: [4],
        expectedValue: 2,
      },
      {
        name: "n=6",
        input: "n=6",
        expected: "4",
        args: [6],
        expectedValue: 4,
        hidden: true,
      },
      {
        name: "n=8 (the classic 92)",
        input: "n=8",
        expected: "92",
        args: [8],
        expectedValue: 92,
        hidden: true,
      },
    ],
    hints: [
      "Place exactly one queen per row, so you only choose a column for each row — this bakes in the no-two-in-a-row rule for free.",
      "A queen at (row, col) attacks along the diagonal where (row - col) is constant and the anti-diagonal where (row + col) is constant. Track three sets: used columns, used (row - col), used (row + col).",
      "For each row, try each column not in any of the three sets; add to the sets, recurse to the next row, then remove (unchoose).",
    ],
    solutionOutline:
      "Recurse row by row. Maintain sets cols, diag (row - col), anti (row + col). place(row): if row == n, increment the solution count and return; else for col in 0..n-1, if col not in cols and (row-col) not in diag and (row+col) not in anti, add all three, recurse place(row+1), then remove all three (unchoose). One queen per row removes the row constraint; the three sets make each safety check O(1). n up to 9 is tractable; the diagonal keys are the crux most candidates miss.",
    commonMistakes: [
      "Checking diagonals with an O(n) scan of placed queens each time instead of O(1) with (row±col) sets.",
      "Using one diagonal set instead of two (main diagonal row-col AND anti-diagonal row+col).",
      "Forgetting to unchoose (remove from the sets) after recursion, corrupting sibling branches.",
    ],
    followUpQuestions: [
      "Why does (row - col) identify one diagonal and (row + col) the other?",
      "How would you return the actual board configurations instead of just the count, and what changes in cost?",
    ],
    rubric: [
      { criterion: "Diagonal encoding", description: "Tracks columns and both diagonals via (row-col) and (row+col) sets for O(1) safety checks." },
      { criterion: "Backtracking correctness", description: "Places one queen per row and correctly unchooses, counting all distinct solutions." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
