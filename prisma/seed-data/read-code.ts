import { defineProblems, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE } from "./types";

export const readCodeProblems = defineProblems([
  {
    slug: "py-mutable-default-report",
    title: "The Report Builder That Remembers Too Much",
    type: "read_code",
    difficulty: "easy",
    topics: ["python", "mutability", "functions"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup", "quant_fund"],
    estimatedMinutes: 10,
    language: "python",
    prompt:
      "Read the function below. A teammate reports that nightly reports have been growing: Monday's report contains Monday's rows, but Friday's report contains the whole week.\n\n1. Predict the exact output of the three calls at the bottom.\n2. Explain *why* — specifically, when the default value is created and where it lives.\n3. Fix it idiomatically, and name one legitimate use of the same mechanism.",
    starterCode:
      "def build_report(day: str, rows: list | None = None, report: list = []) -> list:\n    if rows:\n        report.extend(rows)\n    report.append(f'--- end of {day} ---')\n    return report\n\nmon = build_report('mon', ['r1'])\ntue = build_report('tue', ['r2'])\nprint(mon)\nprint(tue)\nprint(mon is tue)\n",
    hints: [
      "Default parameter values are evaluated once, at \`def\` time — where do you think that list object lives afterwards?",
      "If two calls both fall back to the default, are they looking at the same object or copies?",
      "The idiomatic fix uses a sentinel. Why \`None\` and not a fresh \`[]\` inside a lambda or similar cleverness?",
    ],
    solutionOutline:
      "Output: \`['r1', '--- end of mon ---']\` then \`['r1', '--- end of mon ---', 'r2', '--- end of tue ---']\`, and \`True\` — mon and tue are the *same list object*. Default values are evaluated once at function definition and stored on the function object (\`build_report.__defaults__\`), so every call that omits \`report\` mutates that shared list. Fix: \`report: list | None = None\` then \`report = [] if report is None else report\`. Legitimate use of the mechanism: cheap memoization/caches (\`def f(x, _cache={})\`) — it works precisely *because* the default persists across calls; modern code prefers \`functools.lru_cache\`, but recognizing the idiom matters when reading old codebases.",
    fullSolution:
      "\`\`\`python\ndef build_report(day: str, rows: list | None = None, report: list | None = None) -> list:\n    if report is None:\n        report = []\n    if rows:\n        report.extend(rows)\n    report.append(f'--- end of {day} ---')\n    return report\n\`\`\`\n\nThe printed outputs before the fix:\n\n\`\`\`text\n['r1', '--- end of mon ---']\n['r1', '--- end of mon ---', 'r2', '--- end of tue ---']\nTrue\n\`\`\`\n\nInterview framing: the growing-report symptom in the prompt is how this bug actually presents in production — state leaking across *calls*, which usually means across *requests* in a long-lived worker process. That connection (def-time evaluation → process-lifetime state → cross-request contamination) is what interviewers listen for.",
    commonMistakes: [
      "Saying 'Python passes by reference' — the real mechanism is def-time evaluation of defaults plus shared object mutation.",
      "Predicting mon stays short after tue's call — mon *is* the default list; printing it after the second call shows four elements.",
      "Fixing with \`report=[]\` moved inside but keeping \`report = report or []\` — subtly wrong when callers pass an existing empty list they expect to be filled.",
      "Not knowing the sentinel-None idiom is standard, or over-fixing with copy.deepcopy.",
    ],
    followUpQuestions: [
      "Where can you *see* the shared object at runtime? (Inspect \`build_report.__defaults__\`.)",
      "Same trap with \`dict\`, \`set\`, and — more sneakily — default arguments computed by a function call like \`ts=time.time()\`. What does that one do?",
      "Why doesn't the same problem occur with default values like \`0\` or \`\"x\"\`?",
    ],
    rubric: [
      { criterion: "Exact prediction", description: "All three printed values correct, including \`mon is tue\` → True." },
      { criterion: "Mechanism", description: "Explains def-time evaluation and where defaults are stored, not folk explanations." },
      { criterion: "Idiomatic fix", description: "Sentinel None with \`is None\` check; can say why \`or []\` differs." },
      { criterion: "Production mapping", description: "Connects the bug to cross-request state in long-lived processes." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "py-generator-exhaustion-metrics",
    title: "The Metrics Job That Reports Zero",
    type: "read_code",
    difficulty: "easy",
    topics: ["python", "generators", "iterators", "lazy-evaluation"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "quant_fund", "startup"],
    estimatedMinutes: 12,
    language: "python",
    prompt:
      "A billing job computes total and average request cost. QA reports the total is right but the average is always zero (or crashes). Read the code and:\n\n1. State exactly what \`total\` and \`avg\` will be for the sample input.\n2. Explain the underlying iterator protocol behavior.\n3. List three distinct fixes with their memory trade-offs.",
    starterCode:
      "def parse_costs(lines):\n    return (float(line.split(',')[2]) for line in lines if not line.startswith('#'))\n\nlines = [\n    '# header',\n    'req1,us-east,0.02',\n    'req2,eu-west,0.04',\n]\n\ncosts = parse_costs(lines)\ntotal = sum(costs)\ncount = len(list(costs))\navg = total / count if count else 0.0\nprint(total, count, avg)\n",
    hints: [
      "\`parse_costs\` returns a generator expression, not a list. What happens to a generator after \`sum()\` consumes it?",
      "What does \`list(costs)\` produce the *second* time the generator is touched?",
      "Distinguish the fix families: materialize once, re-create the generator, or compute both aggregates in one pass.",
    ],
    solutionOutline:
      "\`sum(costs)\` drives the generator to exhaustion → total = 0.06. \`list(costs)\` on the exhausted generator yields \`[]\` → count = 0 → avg hits the \`else\` branch → 0.0. Printed: \`0.06 0 0.0\`. Generators implement the iterator protocol: once \`StopIteration\` is raised, subsequent iteration yields nothing (they cannot be reset). Fixes: (1) \`costs = list(parse_costs(lines))\` — O(n) memory, simplest; (2) call \`parse_costs(lines)\` twice — O(1) memory but re-reads/re-parses (wrong if \`lines\` is itself a one-shot iterator like a file object — worth saying); (3) single pass accumulating total and count together — O(1) memory, one read, the right answer for streams. Bonus vocabulary: this is the *iterable vs iterator* distinction; a list is re-iterable, a generator is not.",
    fullSolution:
      "\`\`\`python\n# Fix 3: single pass, streaming-safe\ndef summarize(lines):\n    total = 0.0\n    count = 0\n    for line in lines:\n        if line.startswith('#'):\n            continue\n        total += float(line.split(',')[2])\n        count += 1\n    return total, count, (total / count if count else 0.0)\n\`\`\`\n\nWhy fix 2 is a trap: if \`lines\` is a file handle, the second \`parse_costs(lines)\` call silently reads zero lines because the *file iterator* is also exhausted — the same bug one level down. That observation is the difference between spotting a symptom and understanding the protocol.",
    commonMistakes: [
      "Predicting a crash — the code runs fine and silently reports 0; silent-wrong is the scarier failure mode.",
      "Explaining generators as 'lazy lists' without knowing they can't be re-iterated.",
      "Proposing itertools.tee without mentioning it buffers the divergence (can be O(n) memory anyway).",
      "Missing that fix 2 breaks when the underlying iterable is itself one-shot (file objects, network streams).",
    ],
    followUpQuestions: [
      "What does iterating a *list* twice do differently, mechanically? (\`iter()\` returns a fresh iterator each time.)",
      "When is a generator pipeline over a 100 GB log file the only viable design, and what discipline does it impose on the consumers?",
      "What does \`itertools.tee\` actually buffer, and when is it worse than just materializing?",
    ],
    rubric: [
      { criterion: "Exact prediction", description: "0.06, 0, 0.0 — including recognizing it doesn't crash." },
      { criterion: "Protocol understanding", description: "Iterator vs iterable, StopIteration, non-resettability." },
      { criterion: "Fix taxonomy", description: "Three fixes with memory/re-read trade-offs, including the streaming single-pass." },
      { criterion: "Depth", description: "Spots the file-handle variant of the same bug unprompted." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/glossary.html#term-generator",
      "https://docs.python.org/3/library/stdtypes.html#iterator-types",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "py-identity-vs-equality-dedupe",
    title: "The Deduplicator That Works Only in Tests",
    type: "read_code",
    difficulty: "medium",
    topics: ["python", "identity", "equality", "hashing", "interning"],
    targetRoles: ["backend_swe", "quant_developer", "new_grad_swe"],
    companyStyles: ["quant_fund", "big_tech"],
    estimatedMinutes: 15,
    language: "python",
    prompt:
      "This order-deduplication helper passes its unit tests but misbehaves in production, where order ids come from a network parser. Read it carefully:\n\n1. Why do the tests pass?\n2. Why does production see duplicate orders slip through?\n3. What is the correct comparison, and what contract must \`Order\` satisfy to be used in a set?",
    starterCode:
      "class Order:\n    def __init__(self, order_id: str, qty: int):\n        self.order_id = order_id\n        self.qty = qty\n\nseen_ids = []\n\ndef is_duplicate(order: Order) -> bool:\n    for existing in seen_ids:\n        if existing is order.order_id:      # <-- scrutinize this line\n            return True\n    seen_ids.append(order.order_id)\n    return False\n\n# test (passes!)\no1 = Order('A1', 10)\no2 = Order('A1', 10)\nassert is_duplicate(o1) is False\nassert is_duplicate(o2) is True   # why does THIS pass in tests?\n",
    hints: [
      "\`is\` compares object identity (same memory object), \`==\` compares values. Why might two 'A1' strings be the same object in a test file but not in production?",
      "CPython interns some strings (identifier-like literals compiled together). Bytes from a network buffer decoded at runtime are fresh objects.",
      "For set/dict membership, what dunder methods define the contract, and what invariant ties them together?",
    ],
    solutionOutline:
      "The test passes because both 'A1' literals occur in the same compiled unit and CPython interns identifier-like string constants — so \`existing is order.order_id\` happens to be True. In production, ids are built at runtime from parsed bytes (\`data.decode()\`, slicing, concatenation) → distinct objects with equal values → \`is\` is False → duplicates pass through. Correct comparison is \`==\`; better, replace the list with a set of ids: \`if order.order_id in seen_ids\` where seen_ids is a \`set\` (this uses hash + \`==\`). If Orders themselves go into sets, they must define \`__eq__\` and \`__hash__\` consistently: a == b ⇒ hash(a) == hash(b), and hashed fields must be immutable in practice. Key phrase interviewers want: **interning is an implementation detail; \`is\` is only for singletons like \`None\`.**",
    fullSolution:
      "\`\`\`python\nclass Order:\n    def __init__(self, order_id: str, qty: int):\n        self.order_id = order_id\n        self.qty = qty\n\n    def __eq__(self, other):\n        return isinstance(other, Order) and self.order_id == other.order_id\n\n    def __hash__(self):\n        return hash(self.order_id)\n\nseen: set[str] = set()\n\ndef is_duplicate(order: Order) -> bool:\n    if order.order_id in seen:\n        return True\n    seen.add(order.order_id)\n    return False\n\`\`\`\n\nAlso worth demonstrating the failure at the REPL: \`a = 'A' + '1'; b = 'A1'; a is b\` may be True or False depending on constant folding and version — which is exactly why correctness can never rest on it.",
    commonMistakes: [
      "Explaining \`is\` vs \`==\` correctly but failing to explain why the *test* passed (interning of compile-time literals).",
      "Claiming small-string interning is guaranteed behavior — it's a CPython implementation detail that varies by construction path and version.",
      "Defining \`__eq__\` without \`__hash__\` (making the class unhashable in Python 3) or hashing mutable fields like qty.",
      "Keeping the O(n) list scan after fixing the operator — the set is part of the correct answer.",
    ],
    followUpQuestions: [
      "What happens to a set entry if you mutate a field that participates in \`__hash__\` after insertion?",
      "Why is \`x is None\` correct and idiomatic while \`x is 'A1'\` is a bug?",
      "\`@dataclass(frozen=True)\` — what does it generate for you here, and what does frozen buy?",
    ],
    rubric: [
      { criterion: "Root cause", description: "Identifies interning as why tests pass and runtime construction as why production fails." },
      { criterion: "Contract knowledge", description: "States the __eq__/__hash__ invariant and immutability requirement." },
      { criterion: "Correct rewrite", description: "Set-based dedupe using value equality; O(1) membership." },
      { criterion: "Discipline", description: "Articulates 'is is for singletons' as a reviewable rule." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.python.org/3/reference/expressions.html#is-not",
      "https://docs.python.org/3/reference/datamodel.html#object.__hash__",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "java-hashset-mutable-key",
    title: "The Vanishing Watchlist Entry",
    type: "read_code",
    difficulty: "medium",
    topics: ["java", "hashing", "equality", "collections"],
    targetRoles: ["backend_swe", "mid_level_swe", "new_grad_swe"],
    companyStyles: ["big_tech", "fintech"],
    estimatedMinutes: 15,
    language: "java",
    prompt:
      "A compliance service keeps a HashSet of watched instruments. After a ticker rename, \`contains\` returns false for an entry that is visibly present when iterating the set. Read the code:\n\n1. Explain the exact sequence that makes the entry unreachable.\n2. Is the set corrupted? What does \`set.size()\` report, and what happens if you now \`add\` an equal instrument?\n3. Give two safe designs that prevent this class of bug.",
    starterCode:
      "import java.util.HashSet;\nimport java.util.Set;\n\nclass Instrument {\n    String ticker;\n    Instrument(String t) { this.ticker = t; }\n\n    @Override public boolean equals(Object o) {\n        return o instanceof Instrument && ((Instrument) o).ticker.equals(ticker);\n    }\n    @Override public int hashCode() { return ticker.hashCode(); }\n}\n\npublic class Watchlist {\n    public static void main(String[] args) {\n        Set<Instrument> watched = new HashSet<>();\n        Instrument fb = new Instrument(\"FB\");\n        watched.add(fb);\n\n        fb.ticker = \"META\";                    // ticker rename\n\n        System.out.println(watched.contains(new Instrument(\"META\"))); // ?\n        System.out.println(watched.contains(new Instrument(\"FB\")));   // ?\n        System.out.println(watched.contains(fb));                        // ?\n        watched.add(new Instrument(\"META\"));\n        System.out.println(watched.size());                              // ?\n    }\n}\n",
    hints: [
      "A HashSet stores each element in the bucket chosen by its hashCode *at insertion time*. What bucket is fb sitting in after the rename?",
      "\`contains\` computes the probe bucket from the *argument's* current hashCode. Walk each of the three lookups: which bucket does it probe, and what does equals see there?",
      "The last question is the nasty one: an equal-by-value element can now be added *alongside* the stranded one.",
    ],
    solutionOutline:
      "fb was hashed into the bucket for hash(\"FB\"). After mutation, its hashCode() answers hash(\"META\") but it still *sits* in the FB bucket. contains(new Instrument(\"META\")) probes the META bucket → empty → false. contains(new Instrument(\"FB\")) probes the FB bucket → finds fb → calls equals → \"FB\".equals(\"META\") → false. contains(fb) probes META bucket (fb's current hash) → false — the object can't even find itself. The set isn't 'corrupted' structurally: size() is 1, iteration still shows fb. Adding new Instrument(\"META\") probes the META bucket, finds nothing equal, inserts → size 2, with two logically-equal elements in the set — the set's uniqueness invariant is now silently broken. Fixes: (1) make key fields immutable (final ticker; rename = remove + insert new object — model renames as identity changes); (2) key the map/set by an immutable id (e.g., instrument id string) rather than the mutable entity; honorable mention: records (\`record Instrument(String ticker)\`) make immutability the default.",
    fullSolution:
      "Printed output: \`false\`, \`false\`, \`false\`, \`2\`.\n\n\`\`\`java\n// Design 1: immutable value object\nrecord Instrument(String ticker) { }\n// rename:\nwatched.remove(oldInstrument);\nwatched.add(new Instrument(\"META\"));\n\`\`\`\n\nThe deeper rule: **never mutate any field that participates in equals/hashCode while the object is inside a hash-based collection.** The same applies to HashMap keys, and the same bug exists in Python (mutating a field used by __hash__) and C# — it's a hash-collection contract, not a Java quirk.",
    commonMistakes: [
      "Predicting contains(fb) is true 'because it's the same object' — identity doesn't help; the probe bucket is wrong.",
      "Claiming equals/hashCode are implemented incorrectly — they're consistent; the *mutation* violates the usage contract.",
      "Missing the duplicate-insertion consequence (the most production-relevant part).",
      "Proposing 'rehash the set after renames' as the primary fix instead of removing the mutability.",
    ],
    followUpQuestions: [
      "How would you make this bug *impossible* to write in a codebase — API design, types, or linting?",
      "TreeSet with a Comparator on ticker: does the same mutation break it, and how do the symptoms differ?",
      "What does the Java Object.hashCode contract say exactly about consistency over time?",
    ],
    rubric: [
      { criterion: "Bucket mechanics", description: "Explains insertion-time bucket vs lookup-time probe precisely for all three lookups." },
      { criterion: "Invariant break", description: "Identifies the silent duplicate after re-adding an equal element." },
      { criterion: "Design fix", description: "Reaches immutability / external immutable keys, not band-aid rehashing." },
      { criterion: "Generalization", description: "States the contract as language-agnostic." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html#hashCode--",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "js-async-closure-batcher",
    title: "The Upload Batcher That Reports the Wrong Files",
    type: "read_code",
    difficulty: "medium",
    topics: ["javascript", "closures", "async", "event-loop", "promises"],
    targetRoles: ["fullstack_swe", "backend_swe", "new_grad_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 15,
    language: "javascript",
    prompt:
      "This Node script uploads files and logs progress. Users report: (a) every 'finished' log line names the *last* file, and (b) the 'all done' line prints before any upload completes. Read the code:\n\n1. Explain both symptoms precisely (which language mechanisms cause each).\n2. Predict the full console output order for 3 files.\n3. Rewrite it so logs are correct and 'all done' waits — twice: once uploading serially, once with bounded concurrency of 2.",
    starterCode:
      "const files = ['a.csv', 'b.csv', 'c.csv'];\n\nfunction upload(file) {\n  return new Promise((resolve) => setTimeout(() => resolve(file), 10));\n}\n\nfor (var i = 0; i < files.length; i++) {\n  upload(files[i]).then(function () {\n    console.log('finished ' + files[i]);\n  });\n}\n\nfiles.forEach(async (file) => {\n  await upload(file);\n});\nconsole.log('all done');\n",
    hints: [
      "\`var\` is function-scoped: how many \`i\` variables exist across the three loop iterations, and what is its value when the callbacks finally run?",
      "\`forEach\` does not await its callback — what does an async callback return, and who looks at it?",
      "For the fix: \`let\` vs \`var\` in the loop; \`for...of\` with await for serial; chunking or a worker-pool pattern for bounded concurrency.",
    ],
    solutionOutline:
      "Symptom (a): one shared \`var i\` is captured by all three closures; the \`.then\` callbacks run after the loop finished, when i === 3, so each logs \`files[3]\` → 'finished undefined' (the report of 'last file' is what users *think* they see; it's actually undefined — predicting that exactly is the test). Symptom (b): \`forEach\` ignores the promises returned by async callbacks, so the loop 'completes' immediately and 'all done' logs synchronously, before any timer fires. Output for 3 files: \`all done\` first, then three \`finished undefined\` lines. Fixes: use \`let i\` (fresh binding per iteration) or \`for (const file of files)\`; serial = \`for...of\` + await inside an async function; bounded concurrency = maintain a pool of 2 in-flight promises (e.g., loop with a Set of in-flight, await Promise.race when full), then \`await Promise.all\` of the remainder before logging 'all done'.",
    fullSolution:
      "\`\`\`javascript\n// serial\nasync function runSerial() {\n  for (const file of files) {\n    await upload(file);\n    console.log('finished ' + file);\n  }\n  console.log('all done');\n}\n\n// bounded concurrency of 2\nasync function runPool(limit = 2) {\n  const inFlight = new Set();\n  for (const file of files) {\n    const p = upload(file).then(() => {\n      console.log('finished ' + file);\n      inFlight.delete(p);\n    });\n    inFlight.add(p);\n    if (inFlight.size >= limit) await Promise.race(inFlight);\n  }\n  await Promise.all(inFlight);\n  console.log('all done');\n}\n\`\`\`\n\nMechanism summary: \`let\` creates a new binding per loop iteration (the spec's per-iteration lexical environment), which is why the closure problem evaporates; \`for...of\` + await suspends the surrounding async function, which \`forEach\` structurally cannot do because it discards callback return values.",
    commonMistakes: [
      "Predicting 'finished c.csv' instead of 'finished undefined' — the loop exits with i = 3, past the end.",
      "Fixing (a) with an IIFE and calling it modern — fine historically, but \`let\`/\`for...of\` is the current idiom.",
      "Replacing forEach with map+Promise.all and claiming it's serial — it's concurrent; know which you're choosing.",
      "Bounded-concurrency version that awaits each upload before starting the next two (that's serial with extra steps).",
    ],
    followUpQuestions: [
      "Where exactly does the spec give \`let\` a fresh binding per iteration, conceptually? Why doesn't \`var\` get one?",
      "One upload rejects. What happens in each of your two rewrites, and how do you make failures non-fatal but reported?",
      "Same batcher in the browser uploading 10k files: what limits concurrency in practice besides your pool?",
    ],
    rubric: [
      { criterion: "Dual diagnosis", description: "Separates the closure-over-var bug from the forEach-async bug; doesn't conflate them." },
      { criterion: "Exact output", description: "Predicts 'all done' first and 'finished undefined' ×3." },
      { criterion: "Correct rewrites", description: "Serial and bounded-concurrency versions both correct, with completion barrier." },
      { criterion: "Vocabulary", description: "Uses binding/closure/microtask language precisely." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "cpp-dangling-view-config",
    title: "The Config Getter That Sometimes Returns Garbage",
    type: "read_code",
    difficulty: "hard",
    topics: ["cpp", "lifetimes", "references", "string-view", "undefined-behavior"],
    targetRoles: ["quant_developer", "hft_swe", "backend_swe"],
    companyStyles: ["hft", "quant_fund", "big_tech"],
    estimatedMinutes: 20,
    language: "cpp",
    prompt:
      "A low-latency service reads config values on the hot path. It usually works; under load, values are sporadically corrupted. Read the code:\n\n1. Identify every lifetime bug (there are at least two distinct ones).\n2. Explain why it *usually* works and what 'under load' changes.\n3. Propose the interface you would actually ship, and justify the ownership semantics.",
    starterCode:
      "#include <string>\n#include <string_view>\n#include <unordered_map>\n\nclass Config {\n    std::unordered_map<std::string, std::string> values_;\npublic:\n    // (1) returns a view into... what, exactly?\n    std::string_view get_or(const std::string& key, const std::string& def) const {\n        auto it = values_.find(key);\n        if (it != values_.end()) return it->second;\n        return def;\n    }\n\n    // (2) hot-path helper\n    const std::string& endpoint() const {\n        std::string region = std::getenv(\"REGION\") ? std::getenv(\"REGION\") : \"us-east\";\n        const std::string& ep = values_.at(\"endpoint_\" + region);\n        return ep;   // is THIS one ok?\n    }\n};\n\n// call sites\nstd::string_view host = cfg.get_or(\"host\", \"localhost\");   // (3)\n// ... use host later ...\n",
    hints: [
      "At call site (3), what object does the returned string_view point into when the key is missing? What is that object's lifetime?",
      "\`\"localhost\"\` is a const char*; binding it to \`const std::string&\` creates what, and when does it die?",
      "In endpoint(): \`values_.at(...)\` returns a reference into the map — that part is fine while the map lives. But trace \`\"endpoint_\" + region\`: which objects are temporaries and which references survive the return?",
    ],
    solutionOutline:
      "Bug 1 (call site 3): \`get_or(\"host\", \"localhost\")\` materializes a temporary std::string from the literal to bind \`def\`; the temporary lives until the end of the full expression. The returned string_view points into it → dangling immediately after the statement. It 'usually works' because the stack/heap memory isn't reused instantly; under load (more allocation churn, deeper stacks) it gets overwritten — classic UB that hides in testing. Bug 2 is subtler: in the hit case, \`return it->second\` is fine (view into the map, valid while the map is stable), so the API is *conditionally* dangling — the worst kind, because tests that always hit the key never see it. endpoint() itself is OK at the return (\`at\` returns a reference to the map's value; the \`\"endpoint_\" + region\` temporary only serves as the lookup key and can die after \`at\` returns) — but it's fragile: if someone 'optimizes' it to return string_view of a locally-built string, or the map rehashes/mutates concurrently, it breaks. Also \`getenv\` on a hot path is its own smell (non-thread-safe env access, syscall-ish cost). Shipped interface: return \`std::string\` by value for get_or (small-string optimization makes this cheap; correctness first), or take the default as \`std::string_view\` and return \`std::string_view\` **only** with a documented lifetime contract and no temporary-binding overloads — the honest version is: don't return views into parameters, ever.",
    fullSolution:
      "\`\`\`cpp\nclass Config {\n    std::unordered_map<std::string, std::string> values_;\npublic:\n    // Correct + simple: value return; SSO makes short strings cheap.\n    std::string get_or(std::string_view key, std::string_view def) const {\n        auto it = values_.find(std::string(key));\n        return it != values_.end() ? it->second : std::string(def);\n    }\n\n    // If profiling proves the copy matters: hit path returns a view into the map\n    // (documented: valid until the next mutation of Config), miss returns nullopt —\n    // no default parameter to dangle.\n    std::optional<std::string_view> get(std::string_view key) const;\n};\n\`\`\`\n\nThe pattern name to say out loud: **returning a view/reference whose lifetime depends on which branch was taken**. Reviewers should reject any function where one return path references a parameter or local temporary. Related trap for the follow-up: \`for (const auto& c : cfg.get_or(...))\` — even a by-value return is fine here (lifetime extension of the temporary bound to the range), but \`const std::string& s = cond ? a : temporary;\` is not; C++ lifetime rules are per-expression, not intuitive.",
    commonMistakes: [
      "Spotting only the miss-path dangle and declaring the function 'fixed' by returning const string& — which now dangles the same way for the temporary bound to def.",
      "Claiming \`return it->second;\` is also dangling — it isn't (while the map lives and is unmodified); precision here separates fear from understanding.",
      "Explaining 'usually works' as compiler-dependent rather than as UB whose observable behavior depends on memory reuse.",
      "Proposing string_view everywhere as 'modern' without a lifetime contract — string_view is a non-owning pointer+length; it inherits every dangling-pointer failure mode.",
    ],
    followUpQuestions: [
      "The map is mutated by a config-reload thread while readers call get(). What breaks even with by-value returns, and what concurrency scheme fixes hot-path reads (RCU, shared_ptr snapshot, seqlock)?",
      "Why does small-string optimization change the performance argument for returning std::string by value?",
      "What compiler/tooling catches these bugs — and which of ASan, -Wdangling-gsl, clang-tidy bugprone-dangling-handle would fire here?",
    ],
    rubric: [
      { criterion: "Both bugs found", description: "Miss-path view into temporary AND the conditional nature of the hit path; endpoint() correctly cleared." },
      { criterion: "UB literacy", description: "Explains 'works in test, corrupts under load' as memory-reuse-dependent UB." },
      { criterion: "Interface judgment", description: "Ships value semantics (or optional<view> with explicit contract); rejects dangling-prone defaults." },
      { criterion: "Tooling", description: "Names at least one sanitizer/lint that catches this class." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://en.cppreference.com/w/cpp/string/basic_string_view",
      "https://en.cppreference.com/w/cpp/language/lifetime",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "sql-lost-update-balance",
    title: "Two Sessions, One Balance: Read the Interleaving",
    type: "read_code",
    difficulty: "medium",
    topics: ["sql", "transactions", "isolation-levels", "race-conditions", "postgres"],
    targetRoles: ["backend_swe", "fullstack_swe", "mid_level_swe"],
    companyStyles: ["fintech", "big_tech", "startup"],
    estimatedMinutes: 18,
    language: "sql",
    prompt:
      "Two application servers process refunds for the same account concurrently. Below is the exact SQL each runs (PostgreSQL, default READ COMMITTED) and the wall-clock interleaving. Account starts at balance = 100; refund A is +10, refund B is +20.\n\n1. What is the final balance? Walk each step.\n2. Name this anomaly precisely and state whether READ COMMITTED 'should' prevent it.\n3. Give three distinct fixes and rank them for a high-contention hot account.",
    starterCode:
      "-- Session A                                -- Session B\nBEGIN;\nSELECT balance FROM accounts\n  WHERE id = 42;          -- reads 100\n                                              BEGIN;\n                                              SELECT balance FROM accounts\n                                                WHERE id = 42;   -- reads 100\n-- app computes 100 + 10\nUPDATE accounts SET balance = 110\n  WHERE id = 42;\nCOMMIT;\n                                              -- app computes 100 + 20\n                                              UPDATE accounts SET balance = 120\n                                                WHERE id = 42;\n                                              COMMIT;\n",
    hints: [
      "The UPDATE writes a value computed from a stale read. Does session B's UPDATE re-read the balance, or write a constant?",
      "This is a lost update. Which isolation level in PostgreSQL detects it (hint: it aborts one transaction with a serialization error), and which traditional lock hint prevents it?",
      "Fix families: atomic read-modify-write in SQL, pessimistic row lock, optimistic version check. What retry logic does each impose on the app?",
    ],
    solutionOutline:
      "Final balance = 120; refund A's +10 is lost. Both sessions read 100; A writes 110 and commits; B — which computed 120 from the stale 100 — blocks on the row lock during its UPDATE until A commits (READ COMMITTED makes it re-check visibility, but the SET value is a constant computed by the app), then overwrites with 120. Anomaly: **lost update**. READ COMMITTED permits it (each statement sees a consistent snapshot, but nothing ties B's write to B's earlier read). Fixes: (1) atomic \`UPDATE accounts SET balance = balance + 20 WHERE id = 42\` — the read and write happen in one statement under the row lock; best for hot accounts, no retries; (2) \`SELECT ... FOR UPDATE\` — pessimistic; correct, serializes early, holds the lock across app think-time (bad if that includes network calls); (3) optimistic concurrency: \`UPDATE ... SET balance = 120, version = v+1 WHERE id = 42 AND version = :read_version\`, retry on 0 rows — great at low contention, retry storms at high contention; (4) SERIALIZABLE isolation — detects it and aborts one txn with 40001; correct but requires app-wide retry discipline. Ranking for hot account: (1) > (2) > (4) > (3).",
    fullSolution:
      "\`\`\`sql\n-- Fix 1: make the RMW atomic (preferred)\nUPDATE accounts SET balance = balance + 20 WHERE id = 42;\n\n-- Fix 2: pessimistic\nBEGIN;\nSELECT balance FROM accounts WHERE id = 42 FOR UPDATE;\nUPDATE accounts SET balance = 120 WHERE id = 42;\nCOMMIT;\n\n-- Fix 3: optimistic\nUPDATE accounts SET balance = 120, version = 8\n WHERE id = 42 AND version = 7;  -- app retries if 0 rows updated\n\`\`\`\n\nPrecision points that earn the 'strong' rating: B's UPDATE does *block* until A commits (write-write conflict), so the loss isn't about writes racing — it's that B's write carries a value derived from a read that A invalidated. And PostgreSQL's REPEATABLE READ (unlike the SQL-standard minimum) *does* abort B here with a serialization failure — knowing your engine beats knowing the standard.",
    commonMistakes: [
      "Predicting 130 by assuming the second UPDATE re-reads the current balance — the app computed a constant.",
      "Calling it a dirty read or write skew — it's a lost update; anomaly vocabulary matters.",
      "Recommending SERIALIZABLE without mentioning the mandatory retry loop for 40001 errors.",
      "Using FOR UPDATE but holding the lock across an external API call in the same transaction (correctness fix, availability regression).",
    ],
    followUpQuestions: [
      "Same schedule under PostgreSQL REPEATABLE READ — what exactly happens to session B and what error code does the app see?",
      "The balance update must also insert a ledger row. How do the three fixes extend to the two-statement transaction?",
      "The account is so hot that even row locks queue badly. What design change removes the single-row bottleneck (hint: append-only ledger, periodic materialization)?",
    ],
    rubric: [
      { criterion: "Interleaving walk", description: "Correct final value including B blocking on the row lock, then overwriting." },
      { criterion: "Anomaly naming", description: "Lost update, and what READ COMMITTED does/doesn't promise." },
      { criterion: "Fix taxonomy", description: "Atomic RMW, pessimistic, optimistic, serializable — with contention-aware ranking." },
      { criterion: "Engine specifics", description: "Knows PostgreSQL REPEATABLE READ detects this (40001) — beyond-the-standard knowledge." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://www.postgresql.org/docs/current/transaction-iso.html",
      "https://www.postgresql.org/docs/current/explicit-locking.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "react-stale-interval-dashboard",
    title: "The Dashboard Counter Stuck at One",
    type: "read_code",
    difficulty: "medium",
    topics: ["react", "closures", "hooks", "state"],
    targetRoles: ["fullstack_swe", "new_grad_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 15,
    language: "typescript",
    prompt:
      "This live-ops dashboard should tick a counter every second and let operators adjust a polling multiplier. Two bugs are reported: the counter climbs to 1 and stops, and changing the multiplier does nothing until the page is refreshed. Read the component:\n\n1. Explain both bugs via the closure/dependency model.\n2. Predict what the linter rule \`react-hooks/exhaustive-deps\` would say.\n3. Fix it two ways: functional updates + correct deps, and a version that restarts the interval on multiplier change — when is each right?",
    starterCode:
      "import { useEffect, useState } from 'react';\n\nexport function OpsDashboard() {\n  const [ticks, setTicks] = useState(0);\n  const [multiplier, setMultiplier] = useState(1);\n\n  useEffect(() => {\n    const id = setInterval(() => {\n      setTicks(ticks + 1);            // bug 1\n      console.log('polling at x' + multiplier); // bug 2\n    }, 1000);\n    return () => clearInterval(id);\n  }, []);                              // <-- deps\n\n  return (\n    <div>\n      <span>{ticks}</span>\n      <button onClick={() => setMultiplier((m) => m + 1)}>faster</button>\n    </div>\n  );\n}\n",
    hints: [
      "The effect runs once. The interval callback closes over which render's \`ticks\` and \`multiplier\`?",
      "\`setTicks(ticks + 1)\` with a stale \`ticks\` of 0 sets state to 1 — every second, forever. Why doesn't React re-run the effect?",
      "Two escape hatches: functional updates (\`setTicks(t => t + 1)\`) remove the state read; adding deps re-creates the interval. What's the cost of each?",
    ],
    solutionOutline:
      "With \`[]\` deps the effect — and the interval callback it creates — is created exactly once, closing over the first render's values: ticks = 0, multiplier = 1. Every tick calls setTicks(0 + 1): state 'changes' to 1 once, then every subsequent set is a no-op (same value), so the counter freezes at 1. The multiplier log likewise prints x1 forever: state updates create *new* render scopes, but the old callback keeps reading its snapshot. exhaustive-deps would flag both \`ticks\` and \`multiplier\` as missing dependencies. Fix A (preferred here): \`setTicks(t => t + 1)\` — functional update reads current state without closing over it; for the multiplier, either move the log/poll logic to where current state is available (a ref updated each render, or restructure) — deps stay \`[]\`, interval is stable. Fix B: add \`[multiplier]\` deps so the effect tears down and recreates the interval when the multiplier changes; correct and simple, at the cost of resetting the interval phase (a 1 s timer restarting mid-second) — fine for polling, wrong for anything where continuity matters (animations, precise schedules).",
    fullSolution:
      "\`\`\`tsx\n// Fix A: stable interval, no stale reads\nuseEffect(() => {\n  const id = setInterval(() => setTicks((t) => t + 1), 1000);\n  return () => clearInterval(id);\n}, []);\n\nuseEffect(() => {\n  const id = setInterval(() => {\n    console.log('polling at x' + multiplier);\n  }, 1000);\n  return () => clearInterval(id);\n}, [multiplier]); // Fix B applied where the value is genuinely needed\n\`\`\`\n\nSplitting the two concerns into two effects is itself part of the answer: the ticker never needs multiplier; the poller does. One effect per synchronized concern is the react.dev guidance and it dissolves the 'which deps?' fight.",
    commonMistakes: [
      "Saying the counter 'stops updating because the interval dies' — the interval runs forever; the *set is a no-op* after the first tick.",
      "Suppressing the lint rule with a comment instead of restructuring.",
      "Adding \`ticks\` to deps 'to fix the counter' — works, but re-creates the interval every second; functional update is strictly better there.",
      "Using a ref for everything — refs escape the reactive model; fine as targeted escape hatch, wrong as the default.",
    ],
    followUpQuestions: [
      "In React 18 StrictMode (dev), effects mount-unmount-mount. What would a missing cleanup do here, and how would the bug present?",
      "The polling callback now needs to hit an API with the current multiplier. Ref-based latest-value pattern vs restart-on-change — what changes the decision?",
      "Why did the React team make closures capture render snapshots instead of live-binding state?",
    ],
    rubric: [
      { criterion: "Snapshot model", description: "Explains renders-as-snapshots and which render the callback closed over." },
      { criterion: "No-op set insight", description: "Identifies why the counter freezes at 1 specifically (not 0, not climbing)." },
      { criterion: "Two fixes + judgment", description: "Functional updates vs deps-restart, with the phase-reset trade-off." },
      { criterion: "Effect hygiene", description: "Splits unrelated concerns into separate effects." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://react.dev/learn/state-as-a-snapshot",
      "https://react.dev/reference/react/useEffect",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "go-goroutine-loop-capture",
    title: "The Worker Pool That Processes One Shard Five Times",
    type: "read_code",
    difficulty: "medium",
    topics: ["go", "goroutines", "closures", "concurrency"],
    targetRoles: ["backend_swe", "infrastructure_swe", "distributed_systems_engineer"],
    companyStyles: ["infra_heavy", "big_tech", "startup"],
    estimatedMinutes: 15,
    language: "go",
    prompt:
      "This shard-processing job (built with Go 1.21) logs that it processed shard-4 five times and shards 0–3 never. Read the code:\n\n1. Explain the mechanism — what exactly do the five goroutines share?\n2. Why is the output *usually* all shard-4 but occasionally mixed?\n3. Give the two classic fixes, and explain precisely what changed in Go 1.22 and why the language team made a breaking-ish change.",
    starterCode:
      "package main\n\nimport (\n\t\"fmt\"\n\t\"sync\"\n)\n\nfunc main() {\n\tshards := []string{\"shard-0\", \"shard-1\", \"shard-2\", \"shard-3\", \"shard-4\"}\n\tvar wg sync.WaitGroup\n\tfor _, shard := range shards {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tprocess(shard) // captures what?\n\t\t}()\n\t}\n\twg.Wait()\n}\n\nfunc process(s string) { fmt.Println(\"processing\", s) }\n",
    hints: [
      "In Go ≤1.21, \`shard\` is ONE variable reused across iterations. The closure captures the variable, not its value at spawn time.",
      "The goroutines usually start running after the loop finishes — what does \`shard\` hold then? When would they start earlier?",
      "Fix 1: pass as a parameter (\`go func(s string)\`). Fix 2: shadow (\`shard := shard\`). Go 1.22: per-iteration variables — look up why the team judged the old semantics a persistent bug factory.",
    ],
    solutionOutline:
      "All five closures capture the same loop variable \`shard\` (one memory location in ≤1.21). The unsynchronized goroutines typically get scheduled only after the loop completes, when the variable holds its final value 'shard-4' → five identical lines. Occasionally the scheduler runs a goroutine mid-loop (GOMAXPROCS > 1, preemption), so mixed output is possible — the read of \`shard\` is also a data race (\`go run -race\` flags it), which candidates should name. Fixes: (1) \`go func(s string){...}(shard)\` — explicit argument evaluation copies at spawn; (2) \`shard := shard\` shadow before the goroutine (pre-1.22 idiom). Go 1.22 changed \`for\` loop variables to be freshly declared per iteration, eliminating the trap; the proposal's justification: years of production bugs and static-analysis evidence showed the capture-shared semantics was almost never intended. Bonus precision: the same bug shape existed with \`range\` over index+value, with \`defer\` in loops, and with any escaping closure — not just goroutines.",
    fullSolution:
      "\`\`\`go\n// Fix 1 (works on all versions, clearest intent)\nfor _, shard := range shards {\n\twg.Add(1)\n\tgo func(s string) {\n\t\tdefer wg.Done()\n\t\tprocess(s)\n\t}(shard)\n}\n\n// Fix 2 (pre-1.22 idiom)\nfor _, shard := range shards {\n\tshard := shard // fresh variable per iteration\n\twg.Add(1)\n\tgo func() { defer wg.Done(); process(shard) }()\n}\n\`\`\`\n\nOn Go 1.22+ the original code is correct as written (each iteration declares a new \`shard\`), and \`go vet\`'s loopclosure check plus the race detector are the tools that catch the old form. Knowing *both* the historical semantics and the change is the interview signal — codebases pin old toolchains, and go.mod's \`go\` directive decides which semantics apply per file.",
    commonMistakes: [
      "Explaining it as 'goroutines are slow to start' — scheduling delay is the usual trigger, but the defect is shared capture; even immediate scheduling reads a racing variable.",
      "Not recognizing it's a data race (unsynchronized read/write of shard) — the race detector output is part of a complete answer.",
      "Believing Go 1.22 auto-fixes all closure captures — only \`for\`-loop variables; closures over other mutable locals still share.",
      "Forgetting the same trap with \`defer\` in loops or with taking \`&shard\`.",
    ],
    followUpQuestions: [
      "How does the go.mod \`go\` directive make this semantics change safe for mixed-version codebases?",
      "Show the same bug with C# (foreach pre-5.0) or JS \`var\` — what's the common language-design lesson?",
      "The pool should limit concurrency to 3. Rewrite with a buffered-channel semaphore or errgroup.SetLimit.",
    ],
    rubric: [
      { criterion: "Capture mechanism", description: "One shared variable, closures capture the variable; race identified." },
      { criterion: "Scheduling nuance", description: "Explains why output is usually uniform but occasionally mixed." },
      { criterion: "Both fixes + 1.22", description: "Parameter and shadow fixes; accurate account of the 1.22 semantics change and its motivation." },
      { criterion: "Tooling", description: "Names -race and vet loopclosure." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://go.dev/blog/loopvar-preview",
      "https://go.dev/doc/faq#closures_and_goroutines",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "read-through-cache-stale-forever",
    title: "The Cache Entry That Outlives the Truth",
    type: "read_code",
    difficulty: "hard",
    topics: ["caching", "race-conditions", "distributed-systems", "consistency"],
    targetRoles: ["backend_swe", "infrastructure_swe", "distributed_systems_engineer", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy", "fintech"],
    estimatedMinutes: 25,
    language: "python",
    prompt:
      "This read-through cache with delete-on-write 'invalidation' looks textbook-correct and passes every sequential test. In production, a price occasionally goes stale and stays stale until the TTL saves it hours later.\n\n1. Construct the exact interleaving (two actors, step by step) that plants a permanently stale value.\n2. Explain why no sequential test can catch it and estimate what makes it rare-but-inevitable.\n3. Describe two real mitigations and what each costs.",
    starterCode:
      "CACHE_TTL = 6 * 3600\n\ndef get_price(item_id):\n    price = cache.get(item_id)\n    if price is not None:\n        return price\n    price = db.query('SELECT price FROM items WHERE id = %s', item_id)  # (A)\n    cache.set(item_id, price, ttl=CACHE_TTL)                            # (B)\n    return price\n\ndef update_price(item_id, new_price):\n    db.execute('UPDATE items SET price = %s WHERE id = %s', new_price, item_id)  # (C)\n    cache.delete(item_id)                                                          # (D)\n",
    hints: [
      "The dangerous window is between (A) and (B) on the reader. What can a writer do entirely inside that window?",
      "Sequence it: reader misses, reads old price at (A)… now run the whole writer (C) then (D)… then the reader resumes at (B). What's in the cache, and for how long?",
      "Mitigations to research: short TTLs as blast-radius control, and memcached-style *leases* (the reader gets a token at miss time; a delete invalidates outstanding tokens so the late set is refused).",
    ],
    solutionOutline:
      "Interleaving: (1) Reader: cache miss; (2) Reader executes (A), reads price = 100 from DB; (3) Reader stalls — GC pause, scheduler, slow network to cache; (4) Writer executes (C): DB now 200; (5) Writer executes (D): cache delete (no-op — nothing cached); (6) Reader resumes, executes (B): cache.set(item, 100, ttl=6h). Result: cache holds 100 while DB holds 200 until TTL expiry, and *every* read during those hours returns the stale price (read-through sees a hit). Sequential tests can't catch it — the bug exists only in a specific two-actor interleaving whose window is milliseconds; rare-but-inevitable = (miss rate × write rate × stall probability) integrated over months of traffic. Mitigations: (1) Leases (Facebook memcache): on miss, cache returns a lease token; set is conditional on the token; a delete invalidates outstanding leases → the late set at (B) is refused. Costs: cache protocol complexity, a second round trip shape. (2) Short TTL on top of invalidation: bounds staleness to minutes; costs DB load. (3) Also acceptable: versioned values (CAS on a monotonically increasing version from the DB — set-if-newer), or single-flight per key to narrow the window (reduces, doesn't eliminate). Naming that delete-then-set-stale is why 'cache invalidation is hard' is a cliché earns the point.",
    fullSolution:
      "The fix families in sketch form:\n\n\`\`\`python\n# Lease-based (conceptual API)\ndef get_price(item_id):\n    value, lease = cache.get_with_lease(item_id)\n    if value is not None:\n        return value\n    price = db.query(...)\n    cache.set_if_lease_valid(item_id, price, lease, ttl=CACHE_TTL)  # refused if a delete\n    return price                                                     # invalidated the lease\n\n# Version-guarded (CAS) — requires version column\ndef get_price(item_id):\n    hit = cache.get(item_id)\n    if hit is not None:\n        return hit.price\n    price, version = db.query('SELECT price, version FROM items WHERE id=%s', item_id)\n    cache.set_if_version_newer(item_id, (price, version), ttl=CACHE_TTL)\n    return price\n\`\`\`\n\nWorth stating the general principle: *delete-on-write plus read-through is only correct if set operations can't be reordered across the delete* — and in a distributed system, they can. Every robust scheme re-establishes that ordering with tokens, versions, or bounded staleness.",
    commonMistakes: [
      "Proposing to 'just update the cache in update_price instead of deleting' — set-on-write has its own two-writer reordering race (writer1's older set can land after writer2's newer set).",
      "Claiming the TTL makes it a non-issue — six hours of wrong prices on a fintech product is the incident, not the mitigation.",
      "Reordering (C)/(D) or adding a second delayed delete ('double delete') without acknowledging it shrinks rather than closes the window.",
      "Unable to articulate why tests pass — 'race condition' without constructing the actual schedule.",
    ],
    followUpQuestions: [
      "Two writers, set-on-write, no versions: construct the analogous stale-forever interleaving.",
      "Where does single-flight (per-key request coalescing) help, and why does it not close this window?",
      "The Facebook memcache paper's leases also solve thundering herds. Explain how one mechanism addresses both problems.",
    ],
    rubric: [
      { criterion: "Exact schedule", description: "Produces the six-step interleaving unaided — the core competency this problem tests." },
      { criterion: "Probabilistic reasoning", description: "Explains rare-but-inevitable via window size × event rates." },
      { criterion: "Mitigation depth", description: "Leases/versioning described mechanically, not by name-dropping; costs stated." },
      { criterion: "Generalization", description: "States the ordering principle that all correct schemes restore." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: [
      "https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf",
    ],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
