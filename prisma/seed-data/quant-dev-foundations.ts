import { defineProblems, DOCS_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";

/**
 * Batch 12: market-data-feeds and order-books written-answer problems.
 * These are quant_dev design/reasoning problems (no runnable harness).
 * Path/module/lesson/confidence mappings live in learning-overrides.ts,
 * consistent with the other quant_dev starter problems.
 */
export const quantDevFoundationProblems = defineProblems([
  // ─── market-data-feeds warmup 1 ───────────────────────────────────────────
  {
    slug: "mdf-sequence-number-basics",
    title: "What Sequence Numbers Tell You (and What They Don't)",
    type: "quant_dev",
    difficulty: "easy",
    topics: ["market-data", "sequence-numbers", "udp", "correctness"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "fintech"],
    estimatedMinutes: 18,
    prompt:
      "A market-data feed handler receives UDP packets, each carrying a strictly increasing per-channel sequence number. Over one second it observes this sequence of arrivals: 1001, 1002, 1004, 1003, 1004, 1006.\n\nClassify each event after the first as one of: in-order, gap (loss), reorder, or duplicate — using an 'expected next sequence' counter that starts at 1002. For each, state what the handler should do. Then explain the single most important thing sequence numbers give you, and the one thing they do NOT do by themselves.",
    constraints:
      "Assume a single channel. The handler must never let a strategy trade on an incomplete book. You are only reasoning about detection and the correct reaction — not implementing recovery yet.",
    hints: [
      "Track expected = last_in_order + 1. Compare each arrival's sequence to expected.",
      "A sequence below expected is either a duplicate (already applied) or a late reorder of something you already recovered — both are dropped once you are past them.",
      "A sequence above expected means one or more packets are missing: a gap.",
    ],
    solutionOutline:
      "Start expected=1002. 1002: matches expected → in-order, apply, expected=1003. 1004: 1004 > 1003 → GAP (1003 missing); mark the book stale, buffer 1004, do not apply it in isolation, begin recovery. 1003: arrives (reorder / delayed) → this fills the gap; apply 1003 then the buffered 1004, expected=1005. 1004 (second time): 1004 < 1005 → DUPLICATE; drop it. 1006: 1006 > 1005 → GAP (1005 missing); mark stale, buffer, recover. The key thing sequence numbers give you: loss, duplication, and reordering become *detectable* deterministic state transitions — over plain UDP loss is otherwise silent. What they do NOT do: they do not repair anything. Detecting a gap does not recover the missing update; you still need a snapshot or replay channel to restore state.",
    commonMistakes: [
      "Applying update 1004 immediately on the gap, leaving the book missing whatever 1003 changed — the book is now silently wrong.",
      "Treating the reordered 1003 as a duplicate and dropping it, permanently losing the update.",
      "Assuming sequence numbers make the feed 'reliable' — they make loss visible, not repaired.",
    ],
    followUpQuestions: [
      "How large should the reorder/gap buffer be, and what happens when it overflows?",
      "If the venue guarantees in-order delivery per channel, can a lower sequence ever be a legitimate reorder rather than a duplicate?",
    ],
    rubric: [
      { criterion: "Event classification", description: "Correctly labels each arrival as in-order, gap, reorder, or duplicate against a maintained expected counter." },
      { criterion: "Correct reaction", description: "Marks the book stale on a gap and does not apply post-gap updates in isolation; drops true duplicates." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── market-data-feeds warmup 2 ───────────────────────────────────────────
  {
    slug: "mdf-ab-feed-arbitration",
    title: "Arbitrating Redundant A/B Multicast Feeds",
    type: "quant_dev",
    difficulty: "easy",
    topics: ["market-data", "redundancy", "multicast", "deduplication"],
    targetRoles: ["quant_developer", "hft_swe"],
    companyStyles: ["hft", "quant_fund"],
    estimatedMinutes: 20,
    prompt:
      "Many exchanges publish the same market-data stream on two independent multicast feeds, A and B, carrying identical sequence numbers over separate network paths. Consumers are expected to 'arbitrate' between them.\n\nExplain: (1) why a venue sends the exact same data twice, (2) how a consumer combines A and B into one clean stream using the shared sequence numbers, and (3) what failure this protects against that a single feed with a replay-request channel does not.",
    constraints:
      "A and B can each independently lose, delay, or reorder packets. The arbitrated output must be a single in-order, de-duplicated stream. Latency matters: you should not wait for both copies of every packet.",
    hints: [
      "The two feeds carry the SAME sequence numbers — that is what makes arbitration possible.",
      "Process whichever copy of sequence N arrives first; discard the second copy of N when it arrives.",
      "A gap only becomes a real gap when BOTH feeds miss the same sequence number.",
    ],
    solutionOutline:
      "(1) The feeds are redundant paths: an independent network fault (a switch, a link, a NIC) drops packets on one path but rarely both simultaneously, so publishing twice over disjoint infrastructure turns most single-path losses into non-events. (2) Maintain one expected-sequence counter across BOTH feeds. For each incoming packet, look at its sequence: if it equals expected, apply it and advance; if it is below expected, it is the redundant second copy (or a late duplicate) — drop it; if it is above expected, a true gap exists on the feed that is currently ahead, so buffer and wait briefly for the other feed to supply the missing sequence before declaring a real gap. You take the first arrival of each sequence, so you get the lower latency of the two paths per packet. (3) It protects against transient single-path loss with ZERO recovery latency — no round-trip replay request is needed because the other feed already carried the packet. A single feed plus replay channel recovers, but at the cost of a request/response round trip and a window of staleness; A/B arbitration hides most loss entirely.",
    commonMistakes: [
      "Running two separate books (one per feed) instead of one arbitrated stream — doubles work and still gaps when either feed does.",
      "Waiting for both copies of every packet before applying — throws away the latency benefit and stalls on any single-path loss.",
      "Assuming A/B redundancy removes the need for a replay/snapshot channel — a gap on both feeds still requires recovery.",
    ],
    followUpQuestions: [
      "If feed A is consistently ~50 microseconds faster than B, does B ever contribute anything? When?",
      "How do you detect that one feed has died entirely versus is merely lossy, and what do you alert on?",
    ],
    rubric: [
      { criterion: "Redundancy rationale", description: "Explains disjoint network paths and why duplicate publication hides single-path loss." },
      { criterion: "Arbitration mechanics", description: "One shared sequence counter, first-copy-wins, second-copy dropped, true gap only when both miss." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.rfc-editor.org/rfc/rfc3550",
      "https://www.rfc-editor.org/rfc/rfc768",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  // ─── market-data-feeds core ───────────────────────────────────────────────
  {
    slug: "mdf-snapshot-incremental-join",
    title: "Joining a Snapshot to a Live Incremental Stream",
    type: "quant_dev",
    difficulty: "medium",
    topics: ["market-data", "recovery", "snapshots", "state-machines"],
    targetRoles: ["quant_developer", "hft_swe"],
    companyStyles: ["hft", "quant_fund", "fintech"],
    estimatedMinutes: 30,
    prompt:
      "You start a feed handler mid-session. The venue sends continuous incremental book updates (each tagged with a sequence number) over multicast, plus a periodic snapshot of the full book (tagged with the sequence number it is current as of) over a separate channel.\n\nDesign the algorithm that produces a correct live book from a cold start. Specifically: what do you do with incremental updates that arrive while you are still waiting for the snapshot, and exactly how do you 'join' the snapshot to the incremental stream so you neither skip nor double-apply any update?",
    constraints:
      "Snapshots are large and arrive only every few seconds; incrementals arrive continuously. Updates can be lost. The book must be marked LIVE only when it is provably complete and contiguous. Fixed-point integer prices; do not use floats as keys.",
    hints: [
      "Start buffering incrementals immediately — do not discard them while waiting for the snapshot.",
      "The snapshot carries a sequence number S: it reflects all updates up to and including S.",
      "The join rule: apply the snapshot, then apply buffered incrementals with sequence > S in order, discarding any with sequence <= S.",
    ],
    solutionOutline:
      "Model states EMPTY → RECOVERING → LIVE (with STALE as a re-entry into RECOVERING). On start (RECOVERING): subscribe to the incremental multicast and begin buffering every incremental in a structure keyed/sorted by sequence — crucially, buffer from the very first packet, because the snapshot you are about to request is already slightly behind by the time it arrives. Request/await the next snapshot; it arrives tagged 'current as of sequence S'. Join: install the snapshot as the base book, then replay buffered incrementals in ascending sequence order, discarding any with sequence <= S (already reflected in the snapshot) and applying those with sequence > S. Verify the buffer contains a contiguous run S+1, S+2, … with no gap up to the latest live sequence; if there is a gap inside that run, you are still missing data — stay RECOVERING (request replay or await the next snapshot). Only when the applied stream is contiguous from S to the current live sequence do you transition to LIVE and begin publishing. Store prices/quantities as fixed-point integers so map keys compare exactly. Emit counters: recovery duration, buffered-message count, discarded (<= S) count, and any gap that forced a re-recover.",
    commonMistakes: [
      "Discarding incrementals while waiting for the snapshot, then having a hole between the snapshot's sequence and the first incremental you kept.",
      "Applying every buffered incremental including those <= S, double-counting updates already baked into the snapshot.",
      "Going LIVE without verifying the buffered run from S+1 onward is gap-free, publishing a book that is missing an update.",
    ],
    followUpQuestions: [
      "If snapshots only arrive every 5 seconds, how do you bound the incremental buffer, and what do you do if it overflows before a snapshot arrives?",
      "How does this change if the venue offers on-demand replay of a specific sequence range instead of periodic full snapshots?",
    ],
    rubric: [
      { criterion: "Buffer-then-join", description: "Buffers incrementals from the start and joins at the snapshot's sequence S, discarding <= S and applying > S in order." },
      { criterion: "Completeness gate", description: "Verifies a contiguous sequence run before going LIVE and stays in recovery on any interior gap." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },

  // ─── market-data-feeds challenge ──────────────────────────────────────────
  {
    slug: "mdf-slow-consumer-conflation",
    title: "The Slow Consumer That Silently Drops Packets",
    type: "quant_dev",
    difficulty: "hard",
    topics: ["market-data", "backpressure", "conflation", "kernel", "latency"],
    targetRoles: ["quant_developer", "hft_swe", "infrastructure_swe"],
    companyStyles: ["hft", "quant_fund"],
    estimatedMinutes: 40,
    prompt:
      "A market-data feed handler that was fine in testing starts showing frequent gaps in production during volatile opens. The network team insists the network is not dropping packets. `netstat -su` on the host shows a rising 'receive buffer errors' count that climbs exactly during the volatility spikes.\n\nExplain what is actually happening, why the venue's replay channel makes the problem worse rather than better under this condition, and design a strategy so a single strategy consumer that cannot keep up degrades gracefully instead of falling further behind.",
    constraints:
      "You cannot slow down the market. The feed is UDP multicast; there is no flow control back to the exchange. One shared feed handler fans out to multiple strategy consumers of differing speeds. Correctness for fast consumers must not be sacrificed to accommodate a slow one.",
    hints: [
      "'Receive buffer errors' means the kernel's socket receive buffer filled and the kernel dropped datagrams before your application ever read them — this is a consumer-speed problem, not a network problem.",
      "Requesting replay for every gap adds MORE inbound traffic and MORE processing to a handler that is already saturated — a feedback loop.",
      "For a book, only the latest state of each price level matters to a slow consumer; intermediate updates can be collapsed.",
    ],
    solutionOutline:
      "Root cause: the socket receive buffer (SO_RCVBUF) overflows because the application drains it slower than packets arrive during the burst; the kernel drops the excess and increments 'receive buffer errors'. The gaps are self-inflicted by consumer slowness, not the network — which is why the network team is right. Why replay backfires: issuing replay requests for each gap injects additional inbound packets and additional parsing/state work into a handler that is already CPU- or drain-bound, deepening the backlog — a positive feedback loop that turns a transient burst into a cascading failure (the same dynamic as retry storms). Mitigations, in layers: (1) Separate the network-drain thread from the strategy-processing thread(s): a lean thread does nothing but read packets into a large ring buffer as fast as the NIC delivers, so the kernel buffer rarely overflows even if downstream is slow. (2) Size SO_RCVBUF generously to absorb bursts. (3) Conflation for slow consumers: because an order book only needs the LATEST state per price level, a slow consumer can be served a conflated view — coalesce multiple updates to the same level into one, so a consumer that reads every 10 ms sees current state without replaying every intermediate tick. Fast consumers still get the full stream. (4) Per-consumer queues with a bounded policy: a slow consumer's queue conflates or drops-oldest rather than back-pressuring the shared handler, isolating the slow consumer (bulkhead). (5) Recover via snapshot, not per-gap replay, when a consumer falls far behind — one snapshot resets state cheaply versus replaying thousands of increments. Observability: alert on receive-buffer-error rate, per-consumer queue depth, and conflation ratio.",
    commonMistakes: [
      "Blaming the network because gaps appear, when 'receive buffer errors' localizes the drop to the local kernel socket buffer.",
      "Reacting to every gap with a replay request, amplifying load on an already-saturated handler.",
      "Letting one slow strategy consumer back-pressure the shared feed handler and induce drops for the fast consumers too.",
    ],
    followUpQuestions: [
      "How would you decide between conflation and drop-oldest for a given consumer, and what does each cost in correctness?",
      "What kernel and NIC techniques (busy-polling, kernel-bypass like DPDK/Solarflare, CPU pinning) reduce the drain-side bottleneck, and what do they trade away?",
    ],
    rubric: [
      { criterion: "Root-cause localization", description: "Identifies kernel socket-buffer overflow from a slow drain, not network loss, and reads the receive-buffer-error signal correctly." },
      { criterion: "Feedback-loop and isolation design", description: "Explains why per-gap replay worsens saturation and designs drain/processing separation, conflation, and per-consumer bulkheading." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://man7.org/linux/man-pages/man7/udp.7.html",
      "https://man7.org/linux/man-pages/man7/socket.7.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ─── order-books warmup 1 ─────────────────────────────────────────────────
  {
    slug: "ob-book-levels-l1-l2-l3",
    title: "L1, L2, and L3: What Each Order-Book View Shows",
    type: "quant_dev",
    difficulty: "easy",
    topics: ["order-books", "market-data", "book-levels"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "fintech"],
    estimatedMinutes: 18,
    prompt:
      "Market-data products are commonly described as L1, L2, or L3 (also called 'top of book', 'market by price', and 'market by order'). Consider this resting book for one symbol:\n\nBIDS: 100.02 × 500 (3 orders), 100.01 × 200 (1 order)\nASKS: 100.04 × 300 (2 orders), 100.05 × 900 (4 orders)\n\nDescribe exactly what an L1, an L2, and an L3 feed would each report for this book. Then give one concrete reason a trading strategy would need L3 rather than L2, and one reason a firm might choose L2 despite L3 being available.",
    constraints:
      "Prices are fixed-point (two decimals shown for readability). 'Best bid' is the highest price a buyer will pay; 'best ask' is the lowest price a seller will accept.",
    hints: [
      "L1 is just the best bid and best ask (top of book) with their aggregate sizes.",
      "L2 aggregates all orders at each price into per-price levels — you see price and total quantity, not individual orders.",
      "L3 exposes every individual order (its size and queue position), not just the per-price total.",
    ],
    solutionOutline:
      "L1 (top of book): best bid 100.02 × 500 and best ask 100.04 × 300, plus last trade. Only the inside quote — no depth. L2 (market by price): the aggregated ladder — BIDS 100.02 × 500 and 100.01 × 200; ASKS 100.04 × 300 and 100.05 × 900. You see total quantity at each price level but not how many orders compose it or their order. L3 (market by order): every individual order — at 100.02 the three separate orders with their individual sizes and arrival order (queue position); likewise each order on every level. Why L3 is needed: to estimate your queue position at a price level (how much size sits ahead of you under price-time priority), which determines your fill probability — impossible to know from L2's aggregate. Also for detecting order-level behavior like spoofing or iceberg refresh patterns. Why choose L2 anyway: L3 is far higher bandwidth and processing cost (every order add/modify/cancel is a message), and many strategies only need aggregate depth and imbalance, for which L2 is sufficient and cheaper to consume and store.",
    commonMistakes: [
      "Saying L2 shows individual orders — it shows per-price aggregates; individual orders are L3.",
      "Thinking L1 includes depth beyond the inside quote — it is only the best bid/ask.",
      "Assuming L3 is always better — it costs materially more bandwidth and CPU for information many strategies do not use.",
    ],
    followUpQuestions: [
      "Under price-time priority, why does queue position (an L3 concept) matter more than total level size for a passive order's fill rate?",
      "How would you reconstruct an L2 book from an L3 feed, and what bookkeeping must stay exactly consistent?",
    ],
    rubric: [
      { criterion: "Level definitions", description: "Correctly distinguishes top-of-book (L1), per-price aggregate (L2), and per-order (L3) using the given book." },
      { criterion: "Tradeoff reasoning", description: "Gives a valid strategy reason for needing L3 (e.g., queue position) and a valid cost reason for choosing L2." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── order-books warmup 2 ─────────────────────────────────────────────────
  {
    slug: "ob-best-bid-ask-crossed",
    title: "Best Bid, Best Ask, Spread, and the Crossed-Book Alarm",
    type: "quant_dev",
    difficulty: "easy",
    topics: ["order-books", "market-data", "invariants"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "fintech"],
    estimatedMinutes: 20,
    prompt:
      "Define, for a resting order book: best bid, best ask, the spread, the mid price, a 'locked' book, and a 'crossed' book. Given best bid 100.02 and best ask 100.04, compute the spread and mid.\n\nThen: while consuming an incremental L2 feed, your book momentarily shows best bid 100.05 and best ask 100.04 — the bid is higher than the ask. List the possible causes and explain how you decide whether this is a bug in your handler versus a real (allowed) venue state.",
    constraints:
      "Prices are fixed-point integers scaled by 100 (so 100.04 is stored as 10004). Under normal continuous trading, resting bids and asks should not overlap because a marketable order would match.",
    hints: [
      "Spread = best ask − best bid. Mid = (best ask + best bid) / 2.",
      "Locked: best bid == best ask. Crossed: best bid > best ask.",
      "A crossed book in YOUR state, when the venue is not actually crossed, usually means you mis-applied or missed an update.",
    ],
    solutionOutline:
      "Best bid = highest buy price (100.02); best ask = lowest sell price (100.04). Spread = ask − bid = 100.04 − 100.02 = 0.02 (2 ticks). Mid = (100.04 + 100.02)/2 = 100.03. Locked book: best bid == best ask (spread 0) — normally transient, some venues disallow it. Crossed book: best bid > best ask (negative spread) — a buyer willing to pay more than a seller demands, which under continuous matching should immediately trade and thus should not persist. Causes of a crossed book in your state: (1) you missed a delete/update (a gap) so a stale level lingers above the true opposite side — a correctness bug driven by lost data; (2) you applied updates out of sequence; (3) a genuine but brief venue condition during auctions/openings or across separate venues (NBBO composed of multiple exchanges can appear crossed). Decision procedure: check your sequence-number continuity first — if you have a gap or applied out of order, it is your bug: mark the book STALE and recover (snapshot/replay). If your sequence stream is contiguous and the single venue's own feed shows the cross, it is a real venue state (auction/opening) and should be handled per the venue spec, not 'corrected'. Never silently clamp a crossed book to look normal — that hides missed data. Emit a crossed-book counter and alert.",
    commonMistakes: [
      "Silently 'fixing' a crossed book by dropping the offending level, which masks a missed update and corrupts state.",
      "Computing spread as bid − ask (sign flipped) or mid without dividing by two.",
      "Assuming any crossed book is always a bug — auctions and multi-venue NBBO can legitimately appear crossed.",
    ],
    followUpQuestions: [
      "Why does a data gap tend to manifest specifically as a crossed or locked book rather than some other symptom?",
      "How would you distinguish a single-venue crossed book (suspicious) from a crossed NBBO aggregated across venues (expected)?",
    ],
    rubric: [
      { criterion: "Definitions and arithmetic", description: "Correctly defines best bid/ask, spread, mid, locked, and crossed, and computes spread 0.02 / mid 100.03." },
      { criterion: "Diagnosis procedure", description: "Uses sequence continuity to separate a handler bug from a legitimate venue state and refuses to silently mask a cross." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ─── order-books core ─────────────────────────────────────────────────────
  {
    slug: "ob-data-structure-choice",
    title: "Choosing the Data Structures for a Fast Order Book",
    type: "quant_dev",
    difficulty: "medium",
    topics: ["order-books", "data-structures", "latency", "cache-locality"],
    targetRoles: ["quant_developer", "hft_swe"],
    companyStyles: ["hft", "quant_fund"],
    estimatedMinutes: 32,
    prompt:
      "You are building an L2 order book that must support, at high message rates: apply an update to a price level (add/modify/delete quantity at a price), read the best bid and best ask, and read the top N levels per side.\n\nCompare at least three candidate structures for holding the price levels — a balanced BST / ordered map (e.g., std::map), a hash map from price to level, and a price-indexed array (direct-mapped by tick) — for these operations. State which you would choose for a liquid instrument with a bounded tick range and justify it with both complexity and hardware (cache) reasoning.",
    constraints:
      "Prices are fixed-point integers on a known tick grid. 'Best bid/ask' reads happen on nearly every message; updates cluster near the inside. Latency tails matter as much as averages; allocation on the hot path is undesirable.",
    hints: [
      "An ordered map keeps prices sorted so best bid/ask is O(1) at the ends, but updates are O(log n) with pointer-chasing and per-node allocation.",
      "A hash map gives O(1) update by price but does NOT keep prices ordered — best bid/ask and top-N become expensive.",
      "If the tick range is bounded, a flat array indexed by (price − base)/tick gives O(1) updates with contiguous, cache-friendly memory.",
    ],
    solutionOutline:
      "Ordered map / balanced BST (std::map<price, level>): keeps levels sorted, so best bid = last key, best ask = first key in O(1) (or O(log n) to locate), and top-N is a cheap in-order walk. But every update is O(log n) with node allocation and pointer-chasing across cache lines — poor tails at high rates. Hash map (price → level): O(1) average update, but unordered, so best bid/ask requires scanning all keys or maintaining separate sorted state, and top-N is expensive — wrong shape for a book whose dominant reads are ordered. Price-indexed array (direct-mapped): with a bounded tick range, store levels in a contiguous array indexed by (price − base)/tick. Update is O(1) with no allocation and excellent cache locality (hot inside levels sit in a few cache lines); maintain best-bid/best-ask index pointers updated incrementally, and walk outward for top-N. Choice for a liquid, bounded-tick instrument: the price-indexed array, because (a) updates cluster near the inside, so the working set is a handful of contiguous cache lines that stay hot; (b) O(1) allocation-free updates give tight latency tails, which matter more than asymptotic elegance at these rates; (c) best bid/ask maintained as incremental indices. Caveats to state: the array wastes memory across a very wide or sparse tick range, and instruments without a bounded grid (or with huge price ranges) fall back to an ordered map or a hybrid (array around the inside, map for far levels). This is the same average-vs-tail and locality tradeoff from the latency/cache-locality module, applied to a book.",
    commonMistakes: [
      "Choosing a hash map for the level store, forgetting that the book's dominant operation is ORDERED (best bid/ask, top-N), which a hash map does not support cheaply.",
      "Defending std::map purely on O(log n) while ignoring per-node allocation and pointer-chasing that blow up latency tails.",
      "Proposing a flat array without acknowledging its failure mode: unbounded or sparse tick ranges waste memory and cache.",
    ],
    followUpQuestions: [
      "Sketch a hybrid: a dense array for levels near the inside plus an ordered map for the tails. When does the extra complexity pay off?",
      "How does moving from L2 to L3 (per-order, with queue position) change the structure — what do you need at each price level then?",
    ],
    rubric: [
      { criterion: "Structure comparison", description: "Compares ordered map, hash map, and price-indexed array across update, best bid/ask, and top-N with correct complexities and the ordered-read requirement." },
      { criterion: "Hardware-aware choice", description: "Justifies the array for bounded ticks via cache locality, allocation-free O(1) updates, and latency tails, and names its failure mode for sparse ranges." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
