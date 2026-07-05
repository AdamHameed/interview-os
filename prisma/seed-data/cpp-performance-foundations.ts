import { defineProblems } from "./types";

/**
 * Batch 17: C++ STL containers/iterators and latency/cache-locality problems.
 * Written-answer (read_code / optimization / debugging / quant_dev) problems with
 * embedded C++ code artifacts. Path/module/lesson/confidence mappings live in
 * learning-overrides.ts (consistent with the other quant_dev problems).
 */
export const cppPerformanceFoundationProblems = defineProblems([
  {
    "slug": "stl-container-choice-classify",
    "title": "Pick the Right STL Container for Each Access Pattern",
    "type": "read_code",
    "difficulty": "easy",
    "topics": [
      "cpp",
      "stl",
      "containers",
      "complexity"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 15,
    "language": "cpp",
    "prompt": "Read the four access patterns below. For each, choose the single best STL container from **vector, deque, list, map, unordered_map** and justify from its layout and complexity.\n\n```cpp\n// A) Look up an Order by integer id as fast as possible; never iterate in order.\n//    lookup(id) called millions of times/sec.\n????? <int, Order> a;\na.find(id);\n\n// B) Keep prices sorted; frequently ask \"all orders with price in [lo, hi]\".\n????? <int, Order> b;   // needs ordered range queries\n\n// C) Append at the back and pop from the FRONT (a work queue), O(1) both ends.\n????? <Task> c;\nc.push_back(t); c.pop_front();\n\n// D) Store a few hundred rarely-changing ids and SCAN all of them every tick.\n????? <int> d;\nfor (int id : d) total += weight(id);   // full scan each tick\n```",
    "constraints": "Choose exactly one container per case. Justify with the dominant operation AND the memory-access pattern (contiguous vs node-based), not just one line of big-O.",
    "hints": [
      "A: fastest average lookup with no ordering need -> hash table.",
      "B: sorted keys and range queries -> the ordered tree container.",
      "C: O(1) at BOTH ends -> not vector (O(n) pop_front).",
      "D: a full contiguous scan every tick favors cache locality over node-based storage."
    ],
    "solutionOutline": "A) unordered_map<int, Order> — average O(1) find, no ordering required. B) map<int, Order> — a red-black tree keeps keys sorted, so lower_bound/upper_bound give O(log n) range queries; unordered_map cannot. C) deque<Task> — O(1) push_back and pop_front; a vector's pop_front is O(n) (shifts everything). D) vector<int> — a few hundred ids scanned every tick want contiguous memory so the scan stays in cache and prefetches; a node-based set/list would miss per element. The through-line: match the container to the dominant operation and the access pattern.",
    "commonMistakes": [
      "Choosing vector for case C (pop_front is O(n)).",
      "Choosing unordered_map for case B (no ordering, so no range queries).",
      "Choosing a node-based set for case D and losing the cache-friendly scan."
    ],
    "followUpQuestions": [
      "For case D, when would a sorted vector with binary search beat unordered_map even for lookups?",
      "How does reserve() change the cost profile of the vector choice?"
    ],
    "rubric": [
      {
        "criterion": "Correct containers",
        "description": "unordered_map / map / deque / vector for A-D respectively."
      },
      {
        "criterion": "Layout reasoning",
        "description": "Justifies each from dominant operation and contiguous-vs-node layout, not one big-O."
      }
    ],
    "sourceType": "educational_inspired",
    "sourceUrls": [
      "https://en.cppreference.com/w/cpp/container"
    ],
    "licenseNote": "Original scenario and wording. Source links reference public educational material for learning only.",
    "qualityScore": 4
  },
  {
    "slug": "stl-iterator-invalidation-predict",
    "title": "Predict Iterator, Reference, and Pointer Invalidation",
    "type": "read_code",
    "difficulty": "easy",
    "topics": [
      "cpp",
      "stl",
      "iterator-invalidation"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 16,
    "language": "cpp",
    "prompt": "For each numbered operation, state whether the named iterator/pointer is still valid afterward, and why.\n\n```cpp\nstd::vector<int> v = {1, 2, 3};       // size 3, capacity 3\nauto it = v.begin();                  // (points at v[0])\nint* p  = &v[1];\n\nv.push_back(4);   // (1) capacity was full -> ? is 'it' still valid? is 'p'?\n\nstd::map<int, int> m = {{1,10}, {2,20}, {3,30}};\nauto mit = m.find(2);\nm.insert({4, 40});   // (2) is 'mit' still valid?\nm.erase(1);          // (3) is 'mit' still valid?\n\nstd::unordered_map<int, int> u = {{1,10}, {2,20}};\nauto uit = u.find(1);\nu.insert({3, 30});   // (4) may trigger a rehash -> is 'uit' valid? is a REFERENCE to u[1] valid?\n```",
    "constraints": "For each of (1)-(4) answer valid / invalid and give the one-sentence reason grounded in the container's layout.",
    "hints": [
      "(1) push_back on a full vector reallocates -> the whole block moves.",
      "(2)(3) map is node-based; insert never invalidates, erase invalidates only the erased node.",
      "(4) unordered_map rehash invalidates ITERATORS but not references/pointers to elements."
    ],
    "solutionOutline": "(1) Both 'it' and 'p' are INVALID — the vector was at capacity, so push_back reallocated and moved the entire block; all iterators, references, and pointers dangle. (2) 'mit' is VALID — map insert never invalidates existing iterators (separate tree nodes). (3) 'mit' is VALID — erase(1) removes a different node; erase invalidates only the erased element's iterator. (4) 'uit' is INVALID if a rehash occurred (rehash invalidates all iterators), but a REFERENCE/pointer to u[1] stays VALID — rehash moves the bucket structure, not the elements.",
    "commonMistakes": [
      "Assuming a vector push_back always invalidates (only when it reallocates) or never does.",
      "Thinking map insert/erase invalidates unrelated iterators (it does not).",
      "Conflating unordered_map iterator invalidation (yes on rehash) with reference invalidation (no)."
    ],
    "followUpQuestions": [
      "How does reserve() change answer (1)?",
      "Why do node-based containers keep references stable while vectors do not?"
    ],
    "rubric": [
      {
        "criterion": "Correct verdicts",
        "description": "(1) both invalid, (2) valid, (3) valid, (4) iterator invalid but reference valid."
      },
      {
        "criterion": "Layout-grounded reasons",
        "description": "Explains each from reallocation / node stability / rehash semantics."
      }
    ],
    "sourceType": "educational_inspired",
    "sourceUrls": [
      "https://en.cppreference.com/w/cpp/container/vector",
      "https://en.cppreference.com/w/cpp/container/unordered_map"
    ],
    "licenseNote": "Original scenario and wording. Source links reference public educational material for learning only.",
    "qualityScore": 5
  },
  {
    "slug": "stl-vector-vs-list-hot-loop",
    "title": "Speed Up a Hot Loop by Fixing the Container",
    "type": "optimization",
    "difficulty": "medium",
    "topics": [
      "cpp",
      "stl",
      "cache-locality",
      "performance"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 20,
    "language": "cpp",
    "prompt": "This hot loop runs every tick over ~1,000,000 elements and profiles as the bottleneck. It uses `std::list`. Rewrite it for cache locality and explain the expected speedup.\n\n```cpp\nstd::list<double> prices;      // built once, then scanned every tick\n// ... millions of doubles pushed ...\n\ndouble sum_prices() {\n    double s = 0;\n    for (double x : prices)    // walks node -> node across the heap\n        s += x;\n    return s;\n}\n```\n\nState: (a) the rewrite, (b) why it is faster in terms of cache lines and prefetching, and (c) a rough speedup factor.",
    "constraints": "Preserve the behavior (sum all prices). The data is built once and scanned many times, so build cost is amortized. Assume a 64-byte cache line (8 doubles) and ~100 ns per cache miss.",
    "hints": [
      "std::list scatters each double in its own heap node -> a cache miss per element.",
      "std::vector<double> stores all doubles contiguously -> ~8 per cache line, plus hardware prefetch.",
      "Estimate misses: list ~1 per element; vector ~1 per 8 elements (most hidden by prefetch)."
    ],
    "solutionOutline": "(a) Store the data in std::vector<double> instead of std::list<double>; the loop body is unchanged (range-for sum). (b) The list allocates each double as a separate node scattered across the heap, so traversal chases pointers and pays a cache miss (~100 ns) per element, and the prefetcher cannot predict the next node's address. The vector packs 8 doubles per 64-byte cache line, so a scan misses only ~once per 8 elements and the hardware prefetcher streams ahead, hiding most of those. (c) Roughly an order of magnitude: list ~1M misses vs vector ~125K (mostly prefetched), so ~8-15x faster for the same O(n) sum. If elements are inserted/removed mid-stream, still prefer vector unless you hold the iterator and splice frequently.",
    "commonMistakes": [
      "Keeping std::list and micro-optimizing the loop body — the container layout is the problem.",
      "Assuming O(n) == O(n), ignoring the ~100x cache-miss penalty per node.",
      "Switching to std::deque without noting it is chunked, not fully contiguous."
    ],
    "followUpQuestions": [
      "If prices are appended continuously, does reserve() help the vector, and how?",
      "When would std::deque be an acceptable middle ground?"
    ],
    "rubric": [
      {
        "criterion": "Correct rewrite",
        "description": "Replaces list with a contiguous vector, preserving behavior."
      },
      {
        "criterion": "Cache reasoning",
        "description": "Explains misses per cache line and prefetching, with a plausible speedup estimate."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [
      "https://en.cppreference.com/w/cpp/container/vector"
    ],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "stl-erase-in-loop-bug",
    "title": "Fix the Erase-While-Iterating Bug",
    "type": "debugging",
    "difficulty": "medium",
    "topics": [
      "cpp",
      "stl",
      "iterator-invalidation",
      "bugs"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 20,
    "language": "cpp",
    "prompt": "Both loops below crash intermittently or skip elements. Explain the undefined behavior in each and give the correct fix.\n\n```cpp\n// Bug 1: remove even numbers from a vector\nstd::vector<int> v = {1, 2, 3, 4, 5, 6};\nfor (auto it = v.begin(); it != v.end(); ++it)\n    if (*it % 2 == 0)\n        v.erase(it);            // <-- ?\n\n// Bug 2: drop expired entries from a map\nstd::map<int, Session> m = load();\nfor (auto it = m.begin(); it != m.end(); ++it)\n    if (it->second.expired)\n        m.erase(it);            // <-- ?\n```",
    "constraints": "Explain the specific UB for each container, then give an idiomatic fix. For the vector, give the O(n) fix (not the O(n^2) one-at-a-time loop if avoidable).",
    "hints": [
      "erase returns an iterator to the element after the removed one; the old iterator is invalid.",
      "For a vector, erase shifts the tail and invalidates it and everything after; the erase-remove idiom is O(n).",
      "For a map, only the erased node's iterator dies; capture erase's return value."
    ],
    "solutionOutline": "Bug 1: erase(it) invalidates 'it' (and shifts/invalidates the tail); the loop's ++it then operates on an invalid iterator -> UB, skipped elements. Idiomatic O(n) fix is the erase-remove idiom: v.erase(std::remove_if(v.begin(), v.end(), [](int x){ return x % 2 == 0; }), v.end()); (or the manual form it = v.erase(it); else ++it;, which is O(n^2)). Bug 2: erase(it) invalidates 'it' before ++it runs -> UB; but a map only invalidates the erased node. Fix: rewrite the loop as `for (auto it = m.begin(); it != m.end(); ) { if (it->second.expired) it = m.erase(it); else ++it; }` — capture the returned next iterator.",
    "commonMistakes": [
      "Incrementing the iterator that erase just invalidated.",
      "Using the one-at-a-time erase loop on a vector (O(n^2)) when erase-remove is O(n).",
      "Assuming the map fix and the vector fix are identical for the same reason (map invalidates only the erased node; vector shifts the tail)."
    ],
    "followUpQuestions": [
      "Why is erase-remove O(n) while the naive vector loop is O(n^2)?",
      "Does the same map fix apply to std::unordered_map, and what extra caveat about rehash applies?"
    ],
    "rubric": [
      {
        "criterion": "UB diagnosis",
        "description": "Identifies iterator invalidation + ++it on an invalid iterator for both containers."
      },
      {
        "criterion": "Idiomatic fixes",
        "description": "Erase-remove idiom for the vector; it = erase(it) capture for the map."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [
      "https://en.cppreference.com/w/cpp/algorithm/remove",
      "https://en.cppreference.com/w/cpp/container/map/erase"
    ],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "stl-lowlatency-container-design",
    "title": "Design the Container Layout for a Low-Latency Order Cache",
    "type": "quant_dev",
    "difficulty": "hard",
    "topics": [
      "cpp",
      "stl",
      "cache-locality",
      "low-latency",
      "design"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund"
    ],
    "estimatedMinutes": 30,
    "language": "cpp",
    "prompt": "Design the in-memory data structures for a single-threaded order cache on a hot path. Requirements:\n\n```text\n- add(order_id, price, qty)     called ~1M/sec\n- cancel(order_id)              called ~1M/sec  (lookup by id)\n- best_bid() / best_ask()       read on every market tick\n- iterate levels near the top of book to compute imbalance, every tick\n- p99 latency budget is a few microseconds; NO allocation on the hot path\n```\n\nPropose concrete container choices and justify each against the STL alternatives (vector, map, unordered_map, list). Address: lookup by id, ordered access to price levels, allocation, and cache locality.",
    "constraints": "Single thread (ignore locking). Prices are on a known tick grid. Optimize for p99 latency and zero hot-path allocation, not for asymptotic elegance. Justify every choice against the node-based alternatives.",
    "hints": [
      "unordered_map gives O(1) id lookup but node allocation and cache misses on scan.",
      "std::map keeps prices sorted but is a node-per-level tree — pointer chasing and allocation.",
      "A price-indexed flat array (price -> level) over a bounded tick range gives O(1), contiguous, allocation-free access.",
      "reserve() everything up front so the hot path never allocates."
    ],
    "solutionOutline": "id -> order: an unordered_map<OrderId, handle> reserved to the max order count up front so no rehash/alloc occurs on the hot path (or an open-addressed flat hash map for better locality). Price levels: because prices sit on a bounded tick grid, a price-indexed flat array (index = (price - base)/tick) of level structs gives O(1) add/cancel with contiguous, allocation-free storage and excellent cache locality near the inside; maintain best_bid/best_ask as incrementally-updated indices, and walk outward for the top-of-book imbalance scan (a contiguous run that stays in cache). This beats std::map (node-per-level tree: pointer chasing + allocation) and a scan over unordered_map (buckets scattered in memory). Reserve all structures at startup so the hot path performs no allocation. Caveat: the flat array wastes memory over a very wide/sparse tick range, so bound it around the active band or fall back to a hybrid (dense array near the inside + map for far levels). This is the same average-vs-tail and cache-locality reasoning from the module, applied to a book.",
    "commonMistakes": [
      "Using std::map for price levels and paying node allocation + pointer chasing on every tick.",
      "Allowing hot-path allocation (an unreserved unordered_map rehash, or new nodes) inside the latency budget.",
      "Scanning an unordered_map for top-of-book (buckets are scattered) instead of a contiguous structure."
    ],
    "followUpQuestions": [
      "How would you make add/cancel allocation-free even under bursts (object pools, intrusive lists)?",
      "What changes if the book must be shared across threads (single writer, many reader strategies)?"
    ],
    "rubric": [
      {
        "criterion": "Layout choices",
        "description": "Flat price-indexed levels + reserved hash map for ids, justified against map/unordered_map/list."
      },
      {
        "criterion": "Latency discipline",
        "description": "Zero hot-path allocation, incremental best bid/ask, cache-friendly top-of-book scan; names the sparse-range caveat."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [
      "https://en.cppreference.com/w/cpp/container/unordered_map"
    ],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "cache-latency-numbers-rank",
    "title": "Rank Operations by Latency (Numbers Every Engineer Should Know)",
    "type": "read_code",
    "difficulty": "easy",
    "topics": [
      "performance",
      "memory-hierarchy",
      "latency"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 14,
    "prompt": "Each line below touches a different level of the storage/latency hierarchy. Rank the five operations from fastest to slowest and give the approximate latency (order of magnitude) for each.\n\n```cpp\nint r = a + b;              // A) register arithmetic\nint x = arr[i];             // B) L1 cache hit\nint y = big_array[rand()];  // C) main-memory (RAM) access, cache miss\nread(fd, buf, 4096);        // D) read 4 KB from a local SSD\nrpc_call(peer, req);        // E) round trip to another host in the same datacenter\n```",
    "constraints": "Give the ordering and an order-of-magnitude latency for each (the exact numbers vary by hardware; the ratios are the point).",
    "hints": [
      "Register/ALU work is sub-nanosecond; an L1 hit is ~1 ns.",
      "A main-memory access is ~100 ns — about 100x an L1 hit.",
      "SSD is ~100 microseconds; a datacenter network round trip is ~0.5 ms."
    ],
    "solutionOutline": "Fastest to slowest: A) register arithmetic ~sub-ns (in-core); B) L1 cache hit ~1 ns (~4 cycles); C) RAM access / cache miss ~100 ns (~200+ cycles, ~100x L1); D) local SSD 4 KB read ~100 us (~100,000 ns, ~1000x RAM); E) intra-datacenter network round trip ~0.5 ms (~500,000 ns, ~5x the SSD). The key ratios: L1 -> RAM ~100x, RAM -> SSD ~1000x, SSD -> network another ~5x. These orders of magnitude are why keeping the working set in cache dominates performance.",
    "commonMistakes": [
      "Putting SSD ahead of RAM, or network ahead of SSD.",
      "Treating an L1 hit and a RAM access as similar (they differ ~100x).",
      "Quoting exact nanoseconds as if fixed — the orders of magnitude are what matter."
    ],
    "followUpQuestions": [
      "Where do L2 (~4 ns) and L3 (~15 ns) fall in this ranking?",
      "Why does a branch mispredict or a TLB miss also cost tens of cycles?"
    ],
    "rubric": [
      {
        "criterion": "Correct ordering",
        "description": "register < L1 < RAM < SSD < network round trip."
      },
      {
        "criterion": "Order-of-magnitude latencies",
        "description": "~1 ns L1, ~100 ns RAM, ~100 us SSD, ~0.5 ms network — correct ratios."
      }
    ],
    "sourceType": "educational_inspired",
    "sourceUrls": [
      "https://colin-scott.github.io/personal_website/research/interactive_latency.html"
    ],
    "licenseNote": "Original scenario and wording. Source links reference public educational material for learning only.",
    "qualityScore": 4
  },
  {
    "slug": "cache-row-vs-column-traversal",
    "title": "Which Matrix Loop Is Cache-Friendly?",
    "type": "read_code",
    "difficulty": "easy",
    "topics": [
      "performance",
      "cache-locality",
      "memory-layout"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 15,
    "language": "cpp",
    "prompt": "Both loops sum the same N x N matrix stored in row-major order (`m[r][c]` and `m[r][c+1]` are adjacent in memory). Identify which is faster and by roughly what factor, and explain in terms of cache lines.\n\n```cpp\n// Loop A\ndouble sum = 0;\nfor (int r = 0; r < N; ++r)\n    for (int c = 0; c < N; ++c)\n        sum += m[r][c];\n\n// Loop B\ndouble sum = 0;\nfor (int c = 0; c < N; ++c)\n    for (int r = 0; r < N; ++r)\n        sum += m[r][c];\n```",
    "constraints": "Both do identical arithmetic and are O(N^2). Explain the difference purely from memory access order and cache lines (assume 8 doubles per 64-byte line).",
    "hints": [
      "Row-major means a row's elements are contiguous; consecutive rows are a full row apart.",
      "Loop A's inner loop walks contiguous memory; Loop B strides by a whole row each step.",
      "A stride bigger than a cache line means a miss per access."
    ],
    "solutionOutline": "Loop A is faster — often 5-10x on a large matrix. Loop A's inner loop over c walks contiguous memory, so each 64-byte line brings in 8 doubles and the hardware prefetcher streams ahead: ~1 miss per 8 elements. Loop B's inner loop over r strides by a full row (N doubles) each step, so consecutive accesses land on different cache lines — up to a cache miss per element, and the prefetcher cannot help a large stride. Same arithmetic, same O(N^2), but Loop B's access order fights the row-major layout. Rule: iterate in storage order — put the contiguous dimension (columns, here) in the innermost loop.",
    "commonMistakes": [
      "Thinking the two loops are equivalent because the big-O and arithmetic match.",
      "Getting the row-major direction backwards (columns are contiguous within a row).",
      "Ignoring the prefetcher, which helps the sequential loop but not the strided one."
    ],
    "followUpQuestions": [
      "How would blocking/tiling improve a matrix multiply that must touch both orders?",
      "In a column-major language (Fortran/Julia), which loop would be fast?"
    ],
    "rubric": [
      {
        "criterion": "Correct verdict",
        "description": "Loop A (row-inner-column) is faster, ~5-10x."
      },
      {
        "criterion": "Cache-line reasoning",
        "description": "Explains contiguous vs full-row stride and misses per line / prefetching."
      }
    ],
    "sourceType": "educational_inspired",
    "sourceUrls": [
      "https://en.algorithmica.org/hpc/cpu-cache/"
    ],
    "licenseNote": "Original scenario and wording. Source links reference public educational material for learning only.",
    "qualityScore": 4
  },
  {
    "slug": "cache-aos-vs-soa",
    "title": "Convert Array-of-Structs to Struct-of-Arrays for a Hot Field",
    "type": "optimization",
    "difficulty": "medium",
    "topics": [
      "performance",
      "cache-locality",
      "data-layout"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 20,
    "language": "cpp",
    "prompt": "This hot loop reads only one field (`mass`) across a million records but is slow. Convert the layout to speed it up and explain the cache-line math.\n\n```cpp\nstruct Particle {        // 64 bytes total\n    double pos[3];       // 24\n    double vel[3];       // 24\n    double mass;         // 8   <-- the only field the hot loop reads\n    long   id;           // 8\n};\nstd::vector<Particle> parts;   // 1,000,000 particles\n\ndouble total_mass() {\n    double s = 0;\n    for (const auto& p : parts)   // Array-of-Structs\n        s += p.mass;\n    return s;\n}\n```\n\nGive the converted layout, the loop, and how much cache bandwidth you save (assume a 64-byte cache line).",
    "constraints": "Preserve behavior (sum of masses). Assume a 64-byte cache line. Explain the useful-bytes-per-line before and after.",
    "hints": [
      "Under AoS, each 64-byte line holds one whole Particle, so reading only mass uses 8 of 64 bytes.",
      "Struct-of-Arrays puts each field in its own contiguous array.",
      "With mass in its own array, each line holds 8 masses -> every byte useful."
    ],
    "solutionOutline": "Convert to Struct-of-Arrays: keep parallel vectors, one per field, and give the hot field its own array. `struct Particles { std::vector<std::array<double,3>> pos, vel; std::vector<double> mass; std::vector<long> id; };` and sum with `for (double m : parts.mass) s += m;`. Cache math: under AoS each 64-byte line contains one 64-byte Particle, so the loop uses only the 8-byte mass — 8/64 = 1/8 of each loaded line is useful, and it loads ~1M lines. Under SoA the mass array is contiguous doubles, so each line carries 8 masses and every byte is useful — ~125K lines, roughly 8x fewer misses. Tradeoff: SoA scatters a single particle's fields across arrays, so code that touches ALL fields of one particle is worse under SoA; choose the layout by the hot access pattern.",
    "commonMistakes": [
      "Leaving the AoS layout and micro-optimizing the loop body.",
      "Forgetting that AoS drags cold fields (pos, vel, id) into cache on every iteration.",
      "Applying SoA blindly where the hot path touches all fields of one record."
    ],
    "followUpQuestions": [
      "When is AoS the better layout despite this result?",
      "How would padding/alignment of the SoA arrays interact with SIMD vectorization of the sum?"
    ],
    "rubric": [
      {
        "criterion": "SoA conversion",
        "description": "Moves the hot field into its own contiguous array, preserving behavior."
      },
      {
        "criterion": "Cache-bandwidth math",
        "description": "Explains 1/8 vs full line utilization and the ~8x miss reduction, plus the AoS tradeoff."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [
      "https://en.algorithmica.org/hpc/cpu-cache/"
    ],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "cache-false-sharing-counters",
    "title": "Diagnose and Fix False Sharing Between Threads",
    "type": "quant_dev",
    "difficulty": "medium",
    "topics": [
      "performance",
      "cache-locality",
      "concurrency",
      "false-sharing"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund",
      "big_tech"
    ],
    "estimatedMinutes": 22,
    "language": "cpp",
    "prompt": "Two threads each update their own counter, yet adding the second thread makes the program SLOWER than one thread. Diagnose why and fix it.\n\n```cpp\nstruct Stats { long a; long b; };   // a and b are 8 bytes apart\nStats s;\n\nvoid worker_a() { for (long i = 0; i < 100000000; ++i) s.a++; }  // thread 1\nvoid worker_b() { for (long i = 0; i < 100000000; ++i) s.b++; }  // thread 2\n// run worker_a and worker_b on two cores in parallel\n```\n\nExplain the mechanism (name it), why two threads are slower than one, and give a concrete fix with code.",
    "constraints": "The counters are logically independent — no data race exists. Explain the hardware-level cause and fix it without changing the counting logic. Assume a 64-byte cache line.",
    "hints": [
      "a and b are only 8 bytes apart, so they share one 64-byte cache line.",
      "Cache coherence invalidates the whole line in other cores when any core writes it.",
      "Force each counter onto its own cache line."
    ],
    "solutionOutline": "This is FALSE SHARING. `a` and `b` sit in the same 64-byte cache line, so even though the threads write different variables, the cache-coherence protocol tracks ownership per line: each write by core 1 invalidates core 2's copy of the line and vice versa, so the line ping-pongs between cores on every increment. That serializes the two 'independent' loops and adds a coherence miss (~tens of ns) per iteration — often making two threads slower than one. Fix: put each hot counter on its own cache line, e.g. `struct Stats { alignas(64) long a; alignas(64) long b; };` (or pad between them). Now each core owns a private line and there is no coherence traffic, so the two loops scale. An alternative fix: each thread accumulates in a local variable and writes the shared counter once at the end.",
    "commonMistakes": [
      "Calling it a data race and adding a mutex (there is no race; a lock would make it even slower).",
      "Assuming logically-separate variables cannot interfere (the coherence unit is the line, not the variable).",
      "Padding to less than a full cache line, leaving the variables still sharing a line."
    ],
    "followUpQuestions": [
      "How would you detect false sharing with a profiler (e.g. perf HITM events)?",
      "What is std::hardware_destructive_interference_size and how does it help portably?"
    ],
    "rubric": [
      {
        "criterion": "Names false sharing",
        "description": "Identifies same-cache-line writes causing coherence ping-pong, not a data race."
      },
      {
        "criterion": "Correct fix",
        "description": "alignas(64)/padding to separate lines (or thread-local accumulation), keeping the logic unchanged."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [
      "https://en.cppreference.com/w/cpp/thread/hardware_destructive_interference_size"
    ],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  },
  {
    "slug": "cache-marketdata-hot-path-layout",
    "title": "Design a Cache-Friendly Market-Data Hot Path",
    "type": "quant_dev",
    "difficulty": "hard",
    "topics": [
      "performance",
      "cache-locality",
      "market-data",
      "low-latency",
      "design"
    ],
    "targetRoles": [
      "quant_developer",
      "hft_swe",
      "backend_swe"
    ],
    "companyStyles": [
      "hft",
      "quant_fund"
    ],
    "estimatedMinutes": 30,
    "language": "cpp",
    "prompt": "Design the memory layout for a market-data feed handler's hot path. Every incoming packet applies a book update and every strategy reads the top of book. Requirements:\n\n```text\n- apply_update(price, side, qty)   ~5M/sec, must be a few hundred ns\n- read top-N levels per side        on every tick (strategies compute imbalance)\n- NO allocation and NO locks on the hot path (single writer thread)\n- prices are on a fixed tick grid within a known band around the inside\n```\n\nPropose the data layout (not the networking). Address: how levels are stored, how top-of-book reads stay cache-resident, avoiding allocation, and how you would lay out per-level fields (AoS vs SoA). Justify against node-based alternatives.",
    "constraints": "Single writer thread on the hot path (ignore recovery/sequencing here — that is the market-data module). Optimize p99 latency and cache residency. Prices are bounded on a tick grid. No hot-path allocation.",
    "hints": [
      "A price-indexed flat array over the bounded tick band gives O(1), contiguous, allocation-free level access.",
      "Keep the inside (top-of-book) levels physically adjacent so a top-N read touches a few cache lines.",
      "SoA per-level (parallel arrays of qty, order_count) lets an imbalance scan read only the fields it needs.",
      "Preallocate everything; maintain best_bid/best_ask as indices updated incrementally."
    ],
    "solutionOutline": "Store price levels in a price-indexed flat array over the bounded tick band: index = (price - base)/tick, each slot a small POD level. This gives O(1) apply_update with contiguous, allocation-free storage — no per-level nodes, no pointer chasing, unlike std::map (node-per-level tree) or a scattered hash map. Keep best_bid/best_ask as integer indices updated incrementally on each update, so top-of-book reads are O(1). For the per-tick top-N imbalance scan, walk outward from the inside indices over the contiguous array — a few adjacent cache lines that stay resident and prefetch. Lay out per-level fields as Struct-of-Arrays (parallel arrays of total_qty and order_count) so the imbalance scan, which reads mainly total_qty, uses every byte of each cache line rather than dragging cold fields. Preallocate all arrays at startup so the hot path never allocates; keep the level struct small and 64-byte-line-aware. Bound the array to the active band (fall back to a map for far, rarely-touched levels) so memory stays reasonable. Net: O(1) allocation-free updates, cache-resident top-of-book, and a contiguous imbalance scan — the module's cache-locality principles applied to a 5M/sec feed.",
    "commonMistakes": [
      "Using std::map/unordered_map for levels and paying node allocation + pointer chasing per update.",
      "Allowing allocation on the hot path (unreserved containers, per-update new).",
      "AoS per-level so the imbalance scan drags cold fields into cache; and an unbounded flat array over a huge sparse price range."
    ],
    "followUpQuestions": [
      "How would you publish consistent top-of-book snapshots to many reader strategy threads without locks?",
      "How do you keep the level struct within one cache line, and why does that matter for update latency?"
    ],
    "rubric": [
      {
        "criterion": "Cache-resident layout",
        "description": "Price-indexed flat array + incremental best bid/ask + contiguous top-N scan, justified against node-based containers."
      },
      {
        "criterion": "Latency discipline",
        "description": "No hot-path allocation, SoA for scanned fields, bounded tick band with a fallback; ties to the module's principles."
      }
    ],
    "sourceType": "original",
    "sourceUrls": [
      "https://en.algorithmica.org/hpc/cpu-cache/"
    ],
    "licenseNote": "Original problem written for Interview OS. Concept-based; no text copied from any external source.",
    "qualityScore": 5
  }
]);
