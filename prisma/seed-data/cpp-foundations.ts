import { defineProblems, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const QUANT_PATH = learningPathId("quant-dev");
const RAII = learningModuleId("raii-resource-ownership");
const MOVE = learningModuleId("move-semantics");
const RAII_CONCEPT = lessonId(RAII, "cpp-raii-in-interviews");
const RAII_WALKTHROUGH = lessonId(RAII, "cpp-raii-scope-exit-walkthrough");
const MOVE_CONCEPT = lessonId(MOVE, "cpp-move-semantics-value-categories");
const MOVE_WALKTHROUGH = lessonId(MOVE, "cpp-move-semantics-noexcept-walkthrough");

/**
 * Batch 7 of the curriculum plan: raii-resource-ownership and move-semantics.
 * Written-answer C++ problems covering ownership, value categories, and move correctness.
 */
export const cppFoundationProblems = defineProblems([
  // ── raii-resource-ownership warmups ──────────────────────────────────────

  {
    slug: "cpp-raii-owner-identification",
    title: "Who Owns This Resource?",
    type: "read_code",
    difficulty: "easy",
    topics: ["cpp", "raii", "resource-ownership", "smart-pointers"],
    targetRoles: ["quant_developer", "hft_swe", "infrastructure_swe"],
    companyStyles: ["hft", "quant_fund", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [QUANT_PATH],
    moduleIds: [RAII],
    lessonIds: [RAII_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      'For each snippet, answer: (a) which object or scope owns the resource, (b) when and how the resource is released, and (c) whether a resource leak or double-release is possible.\n\n**Snippet 1 — stack object**\n```cpp\nvoid handle_request() {\n    std::ifstream log("request.log");\n    if (!log.is_open()) return;   // early return\n    process(log);\n}  // log goes out of scope here\n```\n\n**Snippet 2 — raw pointer**\n```cpp\nvoid process_file(const std::string& path) {\n    FILE* fp = fopen(path.c_str(), "r");\n    if (!fp) throw std::runtime_error("open failed");\n    read_all(fp);\n    fclose(fp);   // only reached if read_all does not throw\n}\n```\n\n**Snippet 3 — unique_ptr**\n```cpp\nstd::unique_ptr<Socket> connect(const std::string& host) {\n    auto s = std::make_unique<Socket>(host);\n    s->set_timeout(5000);\n    return s;   // moves ownership to caller\n}\n```\n\n**Snippet 4 — shared_ptr aliasing**\n```cpp\nstd::shared_ptr<Buffer> g_buf;\nvoid use_buffer() {\n    auto local = g_buf;   // increments ref count\n    process(*local);\n}  // local destroyed here; g_buf still alive\n```',
    constraints:
      "Answer (a), (b), (c) for each snippet. For leak/double-release verdicts, give the exact code path that causes the problem or state 'none'.",
    hints: [
      "RAII ties cleanup to scope exit; raw pointers do not — what happens if an exception fires between open and close?",
      "A unique_ptr return moves ownership; the caller's lifetime determines when the resource is released.",
      "Shared ownership means the resource outlives any one holder; the last shared_ptr to be destroyed closes the resource.",
    ],
    solutionOutline:
      "Snippet 1: std::ifstream is the owner; destructor calls close() on both early return and normal exit — no leak or double-release possible. Snippet 2: caller owns nothing; fclose is only called if read_all returns normally. If read_all throws, fp is leaked (the throw unwinds past fclose). Fix: use std::fclose in a unique_ptr deleter or switch to ifstream. Snippet 3: the returned unique_ptr transfers ownership to the caller; destruction calls Socket's destructor on any scope exit in the caller — no leak. Snippet 4: local is a second owner; its destructor decrements the count; g_buf still holds a reference, so the buffer is not destroyed when use_buffer returns. The buffer lives until g_buf is reset or goes out of scope — no leak within this code, but shared ownership means lifetime is controlled by the last holder, which can be unexpected.",
    commonMistakes: [
      "Believing snippet 2 is safe because 'the function is short'; the throw path skips fclose unconditionally.",
      "Thinking unique_ptr return copies the pointer; it moves it, so only one owner exists at any time.",
      "Confusing a shared_ptr increment (local = g_buf) with a copy of the underlying object — only the count changes.",
    ],
    followUpQuestions: [
      "How would you make snippet 2 exception-safe without switching to ifstream?",
      "When is shared_ptr the right choice over unique_ptr for a socket, and what are the risks?",
    ],
    rubric: [
      { criterion: "Ownership identification", description: "Names the owner and the triggering event for release in each snippet." },
      { criterion: "Leak/double-release verdict", description: "Correctly identifies the exception-path leak in snippet 2 with the code path." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/language/raii",
      "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r-resource-management",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "cpp-transaction-missing-rollback",
    title: "The Transaction That Only Commits on the Happy Path",
    type: "debugging",
    difficulty: "easy",
    topics: ["cpp", "raii", "transactions", "exception-safety"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "fintech"],
    estimatedMinutes: 18,
    pathIds: [QUANT_PATH],
    moduleIds: [RAII],
    lessonIds: [RAII_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      'A trading system credits a position update to the database. The function below appears in a code review. Find the exception-safety bug, show the exact code path that leaves the database in a bad state, and fix it using an RAII transaction guard.\n\n```cpp\nvoid apply_position_update(DB& db, const Trade& trade) {\n    db.begin_transaction();\n\n    db.execute("UPDATE positions SET qty = qty + ? WHERE symbol = ?",\n               trade.qty, trade.symbol);\n\n    validate_position_limits(db, trade.symbol);   // may throw LimitViolation\n\n    db.execute("INSERT INTO audit_log VALUES (?, ?, ?)",\n               trade.id, trade.symbol, trade.qty);\n\n    db.commit();\n    // no rollback anywhere\n}\n```\n\nThen explain why the RAII guard is still correct if `commit()` itself throws.',
    constraints:
      "Name the failing line, the exception type, and the resulting database state. The RAII fix must roll back on any scope exit except a committed transaction, including commit throwing. Show the guard as a class or a brief lambda-based scope_exit.",
    hints: [
      "Which line can throw, and what has already been executed in the database by that point?",
      "An RAII guard's destructor must know whether commit already succeeded; a bool flag is the common idiom.",
      "A guard that rolls back unconditionally would also roll back after a successful commit — how do you distinguish?",
    ],
    solutionOutline:
      "Bug: validate_position_limits may throw LimitViolation after the first UPDATE has already executed. The exception unwinds past db.commit() and there is no rollback, so the database retains the partial update (positions incremented, audit log missing) — a half-applied transaction. The INSERT into audit_log is also never reached. Fix with a transaction guard:\n\n```cpp\nstruct TxGuard {\n    DB& db;\n    bool committed = false;\n    explicit TxGuard(DB& d) : db(d) { db.begin_transaction(); }\n    void commit() { db.commit(); committed = true; }\n    ~TxGuard() { if (!committed) db.rollback(); }\n};\n\nvoid apply_position_update(DB& db, const Trade& trade) {\n    TxGuard tx(db);\n    db.execute(\"UPDATE positions SET qty = qty + ? WHERE symbol = ?\",\n               trade.qty, trade.symbol);\n    validate_position_limits(db, trade.symbol);\n    db.execute(\"INSERT INTO audit_log VALUES (?, ?, ?)\",\n               trade.id, trade.symbol, trade.qty);\n    tx.commit();\n}\n```\n\nIf commit() throws, committed remains false, so ~TxGuard calls rollback — correct. If commit() succeeds, committed = true, so ~TxGuard skips rollback — also correct. Every exit path (exception before commit, exception during commit, normal return after commit) is handled.",
    commonMistakes: [
      "Adding only `catch (...) { db.rollback(); throw; }` — correct but more brittle than RAII; a second throw escaping the catch still leaves the transaction open.",
      "Setting committed = true before db.commit() — if commit throws, the guard does not roll back, leaving the transaction in limbo.",
      "Calling rollback() in the destructor unconditionally — rolls back a successfully committed transaction if the caller's destructor fires later.",
    ],
    followUpQuestions: [
      "What happens if rollback() itself throws in the destructor, and how do production RAII guards handle it?",
      "How does this guard compose with nested transactions in databases that support savepoints?",
    ],
    rubric: [
      { criterion: "Bug identification", description: "Names validate_position_limits as the throwing line and the resulting half-applied state." },
      { criterion: "RAII guard correctness", description: "Guard rolls back on any exception, does not roll back after successful commit, and handles a throwing commit." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },

  // ── raii-resource-ownership challenge ────────────────────────────────────

  {
    slug: "cpp-raii-two-phase-cleanup",
    title: "RAII for a Resource That Needs Two-Phase Cleanup",
    type: "quant_dev",
    difficulty: "hard",
    topics: ["cpp", "raii", "resource-ownership", "rule-of-five", "exception-safety"],
    targetRoles: ["quant_developer", "hft_swe", "infrastructure_swe"],
    companyStyles: ["hft", "quant_fund", "infra_heavy"],
    estimatedMinutes: 40,
    pathIds: [QUANT_PATH],
    moduleIds: [RAII],
    lessonIds: [RAII_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      'A market-data handler opens a vendor feed connection that requires two separate cleanup steps in a specific order: first `feed.stop()` (stops delivery, blocking until in-flight callbacks finish), then `feed.disconnect()` (closes the socket). Stopping without disconnecting leaks the socket; disconnecting without stopping first causes a use-after-free in the callback thread. The current code is:\n\n```cpp\nclass MarketDataSubscriber {\n    VendorFeed* feed_ = nullptr;\npublic:\n    explicit MarketDataSubscriber(const Config& cfg) {\n        feed_ = vendor_connect(cfg);   // may throw\n    }\n    ~MarketDataSubscriber() {\n        feed_->stop();        // step 1\n        feed_->disconnect();  // step 2\n    }\n    // no copy or move defined\n};\n```\n\nIdentify all correctness and safety problems in this class, then redesign it as a correct Rule-of-Five RAII type. Address: (1) copy semantics, (2) move semantics and the moved-from invariant, (3) constructor exception safety, (4) destructor exception safety for stop() and disconnect(), and (5) partial construction if the constructor throws after acquiring the feed.',
    constraints:
      "Copying must be deleted. The moved-from state must be safely destructible. The constructor must not leak the feed if any post-connection step throws. The destructor must not propagate exceptions. Show the full corrected class with all five special members.",
    hints: [
      "If the default copy constructor is used, two objects will call stop() and disconnect() on the same feed — what happens?",
      "A moved-from MarketDataSubscriber must have feed_ == nullptr and a destructor that gracefully skips cleanup.",
      "If vendor_connect succeeds but the next line throws, the destructor is not called because construction did not complete — who calls stop/disconnect?",
    ],
    solutionOutline:
      "Problems in the original: (1) implicit copy constructor copies the raw pointer — two MarketDataSubscribers call stop/disconnect on the same feed, causing a double-stop and use-after-free. (2) No move constructor defined — moving copies the pointer, same double-cleanup bug. (3) If vendor_connect succeeds and a subsequent step (e.g., subscribing to symbols) throws, the constructor did not complete so the destructor is not called, leaking the feed. (4) If stop() or disconnect() throw, the exception propagates out of the destructor, which is undefined behavior and kills the process during stack unwinding. (5) partial construction is the same as (3).\n\nFull fix:\n```cpp\nclass MarketDataSubscriber {\n    VendorFeed* feed_ = nullptr;\n\n    void cleanup() noexcept {\n        if (!feed_) return;\n        try { feed_->stop(); } catch (...) {}\n        try { feed_->disconnect(); } catch (...) {}\n        feed_ = nullptr;\n    }\n\npublic:\n    explicit MarketDataSubscriber(const Config& cfg) {\n        feed_ = vendor_connect(cfg);   // throws on failure; feed_ stays null\n        try {\n            feed_->subscribe(cfg.symbols);  // if this throws, cleanup the feed\n        } catch (...) {\n            cleanup();\n            throw;\n        }\n    }\n\n    ~MarketDataSubscriber() { cleanup(); }\n\n    MarketDataSubscriber(const MarketDataSubscriber&) = delete;\n    MarketDataSubscriber& operator=(const MarketDataSubscriber&) = delete;\n\n    MarketDataSubscriber(MarketDataSubscriber&& other) noexcept\n        : feed_(std::exchange(other.feed_, nullptr)) {}\n\n    MarketDataSubscriber& operator=(MarketDataSubscriber&& other) noexcept {\n        if (this != &other) {\n            cleanup();\n            feed_ = std::exchange(other.feed_, nullptr);\n        }\n        return *this;\n    }\n};\n```\nThe moved-from object has feed_ == nullptr; cleanup() is a no-op. The try-catch in the constructor manually cleans up if post-connection setup throws, since the destructor won't run. Destructor swallows exceptions from stop/disconnect so they cannot escape.",
    commonMistakes: [
      "Deleting copy but forgetting move — the compiler provides a deleted move when copy is deleted, so moves fail to compile, which is correct only if moves are never needed; but in containers they often are.",
      "Setting feed_ = nullptr in the move constructor after the exchange, redundantly — std::exchange already does this.",
      "Catching exceptions in the destructor and logging them: fine, but the exception must not rethrow.",
    ],
    followUpQuestions: [
      "How would you generalize the two-step cleanup into a reusable scope_guard or unique_resource wrapper?",
      "If stop() is a blocking call, what happens if the thread calling the destructor is the callback thread — and how do you design around it?",
    ],
    rubric: [
      { criterion: "All five problems identified", description: "Names double-cleanup (copy+move), constructor leak, destructor exception, and partial construction." },
      { criterion: "Correct Rule-of-Five", description: "Deleted copy, noexcept move with std::exchange, noexcept destructor, constructor try-catch for post-connect steps." },
      { criterion: "Moved-from invariant", description: "Defines the moved-from state (feed_ = nullptr) and verifies cleanup is a no-op for it." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/language/rule_of_three",
      "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-five",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── move-semantics warmups ────────────────────────────────────────────────

  {
    slug: "cpp-move-value-categories",
    title: "Classify the Value Category",
    type: "read_code",
    difficulty: "easy",
    topics: ["cpp", "move-semantics", "value-categories", "lvalue", "rvalue"],
    targetRoles: ["quant_developer", "hft_swe", "infrastructure_swe"],
    companyStyles: ["hft", "quant_fund", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [QUANT_PATH],
    moduleIds: [MOVE],
    lessonIds: [MOVE_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      'For each expression in the snippet below, state whether it is an lvalue, rvalue (prvalue), or xvalue, and give a one-line reason. Then answer the two questions that follow.\n\n```cpp\nstd::string make_name() { return std::string("feed_"); }\n\nvoid example() {\n    std::string s = "hello";          // (1) "hello"\n    std::string t = make_name();      // (2) make_name()\n    std::string u = std::move(s);     // (3) std::move(s)\n    const std::string& r = make_name(); // (4) the temporary bound to r\n    std::string* p = &s;              // (5) *p\n}\n```\n\n**Q1:** After line (3) executes, what is the value of `s`, and is it safe to read `s` again?\n\n**Q2:** A function `void sink(std::string&&)` accepts an rvalue reference. Which of the five expressions can be passed directly to `sink()`, and why?',
    constraints:
      "Classify each expression with a reason. For Q1, state the standard's guarantee (not what a typical implementation does). For Q2, list which numbered expressions work and explain one that might surprise.",
    hints: [
      "An expression is an lvalue if you can take its address; it is an rvalue (prvalue or xvalue) if it is about to expire.",
      "std::move is a cast — it does not move anything itself; it changes the category of its argument.",
      "A named variable, even one declared with &&, is an lvalue inside its scope.",
    ],
    solutionOutline:
      '(1) "hello" — string literal, lvalue (it has a persistent address as a static const char[6]). (2) make_name() — prvalue; a function returning by value produces a temporary. (3) std::move(s) — xvalue; std::move casts an lvalue to an rvalue reference, making it an xvalue (an "expiring" value whose resources may be stolen). (4) the temporary bound to r — its lifetime is extended by the const lvalue reference; as an expression *r evaluates to an lvalue (it has a name you can take the address of). (5) *p — dereferencing a pointer yields an lvalue. Q1: After u = std::move(s), s is in a valid-but-unspecified state; the C++ standard only guarantees the moved-from object is destructible and assignable, not that it is empty. In practice std::string implementations leave it empty, but code must not rely on this — assign before reusing. Q2: (2) make_name() and (3) std::move(s) can be passed directly; (1), (4) as lvalue, and (5) are lvalues and do not bind to rvalue references without an explicit std::move. The surprising one: (3) std::move(s) works, but calling sink with it actually moves s; after the call s is again in an unspecified state.',
    commonMistakes: [
      "Classifying std::move(s) as 'moves s' — std::move is only a cast; the move happens inside the constructor or assignment operator that receives the xvalue.",
      "Thinking a const lvalue reference extends lifetime makes the temporary an lvalue globally; it stays an rvalue — it just does not expire until r's scope ends.",
      "Passing an xvalue to sink() twice and expecting it to still hold its data — the first sink call already moved from it.",
    ],
    followUpQuestions: [
      "Why does a function parameter declared as `std::string&& s` behave as an lvalue inside the function body?",
      "What is copy elision (NRVO/RVO) and how does it interact with prvalues like make_name()?",
    ],
    rubric: [
      { criterion: "All five classifications", description: "Each expression correctly labeled with a one-line mechanical reason." },
      { criterion: "Moved-from state answer", description: "States 'valid but unspecified' per the standard, not the implementation behavior." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/language/value_category",
      "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Res-move",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "cpp-noexcept-move-vector",
    title: "The std::vector That Copies Instead of Moving",
    type: "debugging",
    difficulty: "easy",
    topics: ["cpp", "move-semantics", "noexcept", "stl", "vector"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "infra_heavy"],
    estimatedMinutes: 18,
    pathIds: [QUANT_PATH],
    moduleIds: [MOVE],
    lessonIds: [MOVE_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      'A market-data team wraps an order-book snapshot in a struct and stores it in a `std::vector`. Profiling shows the vector reallocation is copying the snapshots instead of moving them — even though a move constructor exists. Here is the struct:\n\n```cpp\nstruct BookSnapshot {\n    std::vector<PriceLevel> bids;\n    std::vector<PriceLevel> asks;\n    uint64_t sequence;\n\n    BookSnapshot(BookSnapshot&& other)\n        : bids(std::move(other.bids)),\n          asks(std::move(other.asks)),\n          sequence(other.sequence) {\n        // intentionally deep-moves the level data\n    }\n\n    BookSnapshot(const BookSnapshot&) = default;\n};\n\nstd::vector<BookSnapshot> history;\nhistory.push_back(make_snapshot());\n```\n\nExplain exactly why `std::vector` falls back to copying during reallocation, which single-keyword fix resolves it, and what safety contract that keyword imposes.',
    constraints:
      "Name the standard rule that causes vector to copy rather than move when the move constructor is not noexcept. Explain the safety contract — what does the implementation assume if you declare noexcept? State the one-word fix and show the corrected signature.",
    hints: [
      "std::vector reallocates by moving elements only if it can guarantee not to leave the old storage in an invalid state if a move throws mid-way.",
      "The C++ standard requires vector::push_back to offer the strong exception guarantee: if it throws, the vector is unchanged.",
      "std::move_if_noexcept selects the move constructor only when it is declared noexcept.",
    ],
    solutionOutline:
      "std::vector provides the strong exception guarantee for push_back: if anything throws during reallocation, the original vector is unchanged. Moving elements satisfies this only if the moves themselves cannot throw — because if one move throws mid-reallocation, the old buffer may have already been partially emptied and there is no safe way to restore it. When the move constructor is not declared noexcept, std::vector conservatively falls back to copying via std::move_if_noexcept, which selects the copy constructor in this case. Fix: add noexcept to the move constructor:\n\n```cpp\nBookSnapshot(BookSnapshot&& other) noexcept\n    : bids(std::move(other.bids)),\n      asks(std::move(other.asks)),\n      sequence(other.sequence) {}\n```\n\nSafety contract: declaring noexcept promises the implementation that this constructor will never throw. If it does throw despite the declaration, std::terminate is called — the program ends, not a silent invariant violation. This is a stronger promise than the compiler can verify; the programmer must ensure the move operations on bids and asks (which are std::vector<PriceLevel> members) are themselves noexcept, which they are because vector's move constructor is noexcept.",
    commonMistakes: [
      "Thinking the move constructor is simply 'not found' — it exists, but std::move_if_noexcept will not select it without noexcept.",
      "Adding noexcept to the copy constructor instead of the move constructor — vector does not use the copy's noexcept status for reallocation decisions.",
      "Assuming noexcept is purely a hint the compiler ignores; it changes overload resolution (move_if_noexcept) and invokes std::terminate on violation.",
    ],
    followUpQuestions: [
      "What does `static_assert(std::is_nothrow_move_constructible_v<BookSnapshot>)` buy you, and where would you put it?",
      "If PriceLevel had a throwing move constructor, how would that affect BookSnapshot's noexcept guarantee, and what would you do?",
    ],
    rubric: [
      { criterion: "Root cause", description: "Names the strong exception guarantee and std::move_if_noexcept as the mechanism that triggers copying." },
      { criterion: "Fix and contract", description: "Adds noexcept to the move constructor and explains the std::terminate consequence of violating it." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/utility/move_if_noexcept",
      "https://en.cppreference.com/w/cpp/container/vector/push_back",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  // ── move-semantics challenge ──────────────────────────────────────────────

  {
    slug: "cpp-pipeline-move-optimization",
    title: "The Message Pipeline That Copies 4 MB Per Hop",
    type: "quant_dev",
    difficulty: "hard",
    topics: ["cpp", "move-semantics", "performance", "pipelines", "rvalue-references"],
    targetRoles: ["quant_developer", "hft_swe", "infrastructure_swe"],
    companyStyles: ["hft", "quant_fund", "infra_heavy"],
    estimatedMinutes: 40,
    pathIds: [QUANT_PATH],
    moduleIds: [MOVE],
    lessonIds: [MOVE_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      'A market-data normalizer processes 4 MB raw feed messages through three pipeline stages: decode, enrich, and publish. A profiler shows the system copies the 4 MB buffer on each stage transition despite a designed-for-move payload type. Here is the current pipeline:\n\n```cpp\nstruct Payload {\n    std::vector<uint8_t> raw;          // 4 MB\n    std::unordered_map<std::string, double> fields;\n    std::string symbol;\n};\n\nPayload decode(const Payload& in);       // stage 1: returns new Payload\nPayload enrich(const Payload& in);       // stage 2: returns new Payload\nvoid publish(const Payload& in);         // stage 3: reads, does not take ownership\n\nvoid run_pipeline(const Payload& msg) {\n    Payload decoded = decode(msg);\n    Payload enriched = enrich(decoded);\n    publish(enriched);\n}\n```\n\nIdentify every copy in run_pipeline, explain why each happens, redesign the signatures to propagate ownership via moves, and show the corrected pipeline. Then answer: (1) why does returning by value not always require a copy in C++17, and (2) what happens to decoded after `enrich(std::move(decoded))`.',
    constraints:
      "The original msg must not be modified. publish should still receive a const reference — it only reads. The decoded value should be moved into enrich, not copied. Show before/after signatures and the corrected run_pipeline. For (1), name the optimization by its standard term.",
    hints: [
      "enrich(decoded) passes decoded by const reference, so enrich must copy its input internally to build the output.",
      "If enrich takes a Payload by value, the caller can move into it — one move instead of one copy of the 4 MB vector.",
      "Returning by value from decode can be elided by NRVO; the object is constructed directly in the return slot.",
    ],
    solutionOutline:
      "Copies in run_pipeline:\n1. decode(msg) — msg is const Payload&, so decode reads it and constructs a new Payload internally: one copy of the 4 MB raw buffer plus the map and symbol.\n2. enrich(decoded) — decoded is passed as const Payload&, so enrich also reads and internally constructs a new Payload: another copy of the 4 MB buffer.\nTotal: two 4 MB buffer copies, plus two copies of fields and symbol.\n\nRedesign — take Payload by value where the stage owns and transforms it:\n```cpp\nPayload decode(Payload in);           // caller moves or copies into in\nPayload enrich(Payload in);           // caller moves decoded into in\nvoid publish(const Payload& in);      // read-only, unchanged\n\nvoid run_pipeline(const Payload& msg) {\n    Payload decoded = decode(msg);         // copy here: msg is const, cannot move\n    Payload enriched = enrich(std::move(decoded));  // move: no copy\n    publish(enriched);                     // const ref: no copy\n}\n```\n\nWith this design: decode(msg) copies once (msg is const, unavoidable); enrich receives decoded by move — the 4 MB raw vector is moved, not copied. decode and enrich can consume and transform in in-place and return it by value, using NRVO to elide the return copy. Total: one 4 MB copy (the initial decode from the const source), down from two.\n\n(1) C++17 mandates copy elision (guaranteed RVO) for prvalues: when a function returns a prvalue of the return type, the object is constructed directly in the destination — no move or copy. NRVO (Named Return Value Optimization) is an additional non-mandatory elision for named locals. With these, returning by value is typically zero-copy even without explicit std::move on the return expression.\n\n(2) After enrich(std::move(decoded)), decoded is in a valid-but-unspecified state — raw is likely empty (std::vector move empties the source). decoded must not be read before being reassigned. The pipeline above does not use decoded after the move, so this is safe.",
    commonMistakes: [
      "Changing enrich to take Payload&& and then calling enrich(decoded) without std::move — decoded is an lvalue; it will not bind to && without the explicit cast.",
      "Adding std::move to the return statement: return std::move(in) — this disables NRVO; let the compiler elide by returning the name directly.",
      "Passing msg by value to decode so that the caller can move it — the original msg is const Payload&, so the caller cannot move it; the first copy is unavoidable.",
    ],
    followUpQuestions: [
      "If decode needs both the original msg and its output simultaneously (e.g., to log diffs), what signature design avoids the extra copy?",
      "How does the pipeline change if Payload is non-copyable (copy constructor deleted) — which callers break and how do you fix them?",
    ],
    rubric: [
      { criterion: "Copy identification", description: "Names both copies in the original pipeline and explains why each const-reference parameter forces an internal copy." },
      { criterion: "Corrected pipeline", description: "Takes ownership by value, uses std::move to hand decoded to enrich, keeps publish as const&." },
      { criterion: "NRVO and moved-from answers", description: "Names guaranteed copy elision / NRVO for (1) and 'valid but unspecified' for (2)." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/language/copy_elision",
      "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Res-move",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
