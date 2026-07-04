import { defineProblems, DOCS_INSPIRED_NOTE, EDU_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const INFRA_PATH = learningPathId("infrastructure-swe");
const QUANT_PATH = learningPathId("quant-dev");
const BACKEND_PATH = learningPathId("backend-swe");
const THREADING = learningModuleId("threading-synchronization");
const PRIMITIVES = learningModuleId("mutexes-semaphores-condition-variables");
const RACES_LESSON = lessonId(THREADING, "data-races-and-critical-sections");
const LOST_INCREMENT_LESSON = lessonId(THREADING, "lost-increment-walkthrough");
const TOOLBOX_LESSON = lessonId(PRIMITIVES, "mutex-semaphore-condvar-toolbox");
const BOUNDED_BUFFER_LESSON = lessonId(PRIMITIVES, "bounded-buffer-walkthrough");

/**
 * Batch 3 of the curriculum plan: threading-synchronization and
 * mutexes-semaphores-condition-variables. Written-answer problems.
 */
export const concurrencyFoundationProblems = defineProblems([
  {
    slug: "is-it-a-data-race",
    title: "Which of These Are Data Races?",
    type: "os_networking_concurrency",
    difficulty: "easy",
    topics: ["concurrency", "data-races", "threads"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 12,
    pathIds: [INFRA_PATH],
    moduleIds: [THREADING],
    lessonIds: [RACES_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "For each scenario, state whether it contains a data race and justify the verdict in one or two sentences using the definition (concurrent access to the same data, unsynchronized, at least one write).\n\n1. Ten threads read a configuration object that was fully built before the threads started; nobody writes it afterwards.\n2. A metrics thread reads a plain integer `request_count` every second while worker threads increment it without any lock or atomic.\n3. Two threads call `fetch_add(1)` on an atomic counter.\n4. Two threads write to the same array, one filling indices 0–499, the other 500–999.\n5. One thread writes a boolean `done = true` (plain variable); another spins in `while not done: pass`.",
    constraints:
      "Answer race / no race for each, plus the one-line justification. For any 'no race' verdict, name which part of the definition fails (no writer, not concurrent, synchronized, or different data).",
    hints: [
      "The definition has four conditions; a scenario is only a race when all four hold.",
      "Disjoint array slices are different data even though they share a variable name.",
    ],
    solutionOutline:
      "1. No race — no writer during concurrency (immutable after publication, assuming the thread start provides the happens-before publication). 2. Race — same integer, concurrent, unsynchronized, writers present; reads may see torn or stale values and the count drifts. 3. No race — the accesses are synchronized (atomic read-modify-write). 4. No race — writes touch disjoint elements, so no two threads access the same data (though false sharing may hurt performance, that is not a correctness race). 5. Race — plain-variable write and read, unsynchronized and concurrent; beyond the definition, compilers and CPUs may legally keep `done` in a register and never observe the store — use an atomic flag or an event.",
    commonMistakes: [
      "Calling scenario 4 a race because 'both threads write the array' — the granularity that matters is the element, not the container.",
      "Calling scenario 5 harmless because 'writing a boolean is atomic on x86' — visibility and reordering, not tearing, are what break the spin loop.",
    ],
    followUpQuestions: [
      "In scenario 1, what exactly guarantees the threads see the fully built object rather than a half-constructed one?",
      "What is false sharing in scenario 4 and why does it degrade throughput without breaking correctness?",
    ],
    rubric: [
      { criterion: "Definition applied", description: "Each verdict cites the specific failing or satisfied condition, not intuition." },
      { criterion: "Subtle cases", description: "Gets 4 (disjoint data) and 5 (visibility, not tearing) right." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "shared-cache-dict-race",
    title: "Check-Then-Insert on a Shared Cache",
    type: "os_networking_concurrency",
    difficulty: "easy",
    topics: ["concurrency", "check-then-act", "locks", "caching"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH, BACKEND_PATH],
    moduleIds: [THREADING],
    lessonIds: [RACES_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A service caches expensive lookups in a shared in-process map. Every request thread runs:\n\n```python\nif key not in cache:\n    cache[key] = expensive_load(key)   # ~200 ms\nreturn cache[key]\n```\n\nDescribe the interleaving problem in this code, what the worst observable outcomes are (consider both a thread-safe map and a non-thread-safe map), and fix it with a lock. Then explain why holding that lock across `expensive_load` is a bad idea and give the standard resolution.",
    constraints:
      "Assume many threads request the same hot key simultaneously. The fix must keep the cache correct and state explicitly what happens to concurrent requests for the same key during a load.",
    hints: [
      "Two threads can both evaluate the 'not in cache' check before either inserts.",
      "Separate the question 'is the map internally corrupted?' from 'did we do duplicate work?'.",
      "If the lock cannot cover the load, park a marker (a future/event) in the map under the lock instead of the value.",
    ],
    solutionOutline:
      "The check and the insert are two steps, so N threads can all miss and all call expensive_load — a check-then-act race. With a thread-safe map the damage is duplicate loads (N × 200 ms wasted, possible thundering herd on the backend) plus harmless overwrites; with a non-thread-safe map, concurrent mutation can corrupt internal structure. Naive fix: take one mutex around check+insert+read. Correct but it serializes every cache hit and holds the lock for 200 ms during a miss, stalling unrelated keys. Standard resolution (single-flight): under the lock, look up the key; on a miss, insert a placeholder future/event and release the lock; the inserting thread performs the load outside the lock, stores the value, and signals; other threads for that key find the future and wait on it rather than loading. Hits stay cheap, exactly one load per key, and the lock is held only for map operations.",
    commonMistakes: [
      "Fixing only corruption ('use a concurrent map') while leaving the duplicate-load stampede in place.",
      "Holding the mutex across the 200 ms load, converting a cache into a global bottleneck.",
      "Double-checked locking without understanding what makes it safe in the language at hand.",
    ],
    followUpQuestions: [
      "The load can fail — what does your single-flight design do with the parked future and the waiters?",
      "How does this in-process pattern map onto the distributed cache-stampede problem?",
    ],
    rubric: [
      { criterion: "Race identification", description: "Names the check-then-act gap and distinguishes duplicate work from structural corruption." },
      { criterion: "Lock scope judgment", description: "Fix keeps the lock off the slow path via a parked future or equivalent, with failure behavior considered." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "metrics-flush-torn-read",
    title: "The Average That Never Happened",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["concurrency", "invariants", "atomicity", "metrics"],
    targetRoles: ["backend_swe", "infrastructure_swe", "quant_developer"],
    companyStyles: ["big_tech", "infra_heavy", "hft"],
    estimatedMinutes: 25,
    pathIds: [INFRA_PATH, QUANT_PATH],
    moduleIds: [THREADING],
    lessonIds: [LOST_INCREMENT_LESSON],
    confidenceLevel: "core",
    prompt:
      "A latency tracker keeps two fields updated by worker threads on every request: `total_micros += elapsed` and `count += 1`. Each field is an atomic, so there are no data races reported by the race detector. A reporter thread computes `average = total_micros / count` every 10 seconds, and on busy days it occasionally emits averages that are impossible — higher than any single recorded latency, or lower than the minimum. Explain how per-field atomics still allow an inconsistent (total, count) pair, construct a concrete interleaving that yields an impossible average, and present two fixes with their costs: (a) a mutex around both updates and the read, and (b) a snapshot design that keeps the hot path lock-free.",
    constraints:
      "The race detector is right: there is no data race. Your explanation must locate the bug in the invariant spanning two variables. The snapshot fix may use techniques like a single packed atomic, a sequence lock, or swapping a pointer to an immutable struct — pick one and describe it concretely.",
    hints: [
      "Atomicity of each field is not atomicity of the pair; the reporter can read total after a worker's add but before that worker's count increment.",
      "For an impossible average you want the reader to observe one update's total without its count, at low count values.",
      "Think about what a reader would see if writers published a complete (total, count) struct by pointer swap instead of mutating fields.",
    ],
    solutionOutline:
      "The invariant is on the pair: total must be the sum of exactly the counted samples. Interleaving: counters at total=1000, count=1 (one 1000µs sample). Worker records a 1000µs request: adds to total (now 2000), is preempted before count++. Reporter reads total=2000, count=1 → average 2000µs, higher than any real sample. Symmetrically, reading count after the increment but total before the add yields an undershoot. Fix (a): one mutex covering both increments and the reader's paired read restores the invariant; cost is a lock acquisition on every request — acceptable at moderate rates, a contention point at high rates. Fix (b): keep the hot path lock-free by making the pair a single unit: pack (total, count) into one 128-bit atomic where supported, or use a seqlock (writers bump a sequence counter around the pair; the reader retries if the sequence changed or is odd), or have each worker maintain thread-local (total, count) and let the reporter sum per-thread snapshots — each thread's pair is only written by its owner, so the reporter's per-pair read needs only the seqlock-or-pack trick locally, and global drift is bounded and consistent. State the tradeoff: (b) adds design complexity and slightly stale reads; (a) is 5 lines and correct.",
    commonMistakes: [
      "Concluding 'no data race means no bug' — race-freedom does not imply invariant preservation across variables.",
      "Proposing to read count before total (or vice versa) as a fix; ordering the two reads shrinks but does not close the window.",
      "A seqlock where the writer forgets the odd/even discipline or the reader forgets to retry, which silently reintroduces the tear.",
    ],
    followUpQuestions: [
      "Where does this same two-variable tear appear in order-book state (best bid and its size), and why is it more expensive there?",
      "How would you write a test that reliably exposes this bug instead of waiting for a busy day?",
    ],
    rubric: [
      { criterion: "Invariant-level diagnosis", description: "Explains that atomics protect words, not the cross-field invariant, with a concrete impossible-average schedule." },
      { criterion: "Fix quality", description: "Presents both the mutex fix and one correctly described lock-free snapshot technique." },
      { criterion: "Cost honesty", description: "States contention and staleness tradeoffs rather than declaring one fix universally right." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "pick-the-primitive",
    title: "Pick the Right Synchronization Primitive",
    type: "os_networking_concurrency",
    difficulty: "easy",
    topics: ["concurrency", "mutex", "semaphore", "condition-variables"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 12,
    pathIds: [INFRA_PATH],
    moduleIds: [PRIMITIVES],
    lessonIds: [TOOLBOX_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "For each requirement, name the synchronization primitive you would reach for first (mutex, counting semaphore, condition variable, or one-time initialization/once) and justify the choice in one sentence:\n\n1. At most 6 threads may run image conversions at the same time; others must wait for a slot.\n2. A shared routing table is read and updated by many threads and must never be observed mid-update.\n3. A consumer thread should sleep until a work queue has at least one item, without polling.\n4. An expensive TLS certificate parse must happen exactly once, the first time any thread needs it.\n5. A pool of 6 database connections is checked out and returned by arbitrary threads.",
    constraints:
      "One primitive per requirement plus the one-line reason. If two primitives could work, name your first choice and say what property tips the decision (ownership, counting, or waiting-for-a-predicate).",
    hints: [
      "Translate each requirement into a sentence: 'only one at a time' vs 'at most N at a time' vs 'wait until X is true' vs 'exactly once ever'.",
      "Who releases matters: a mutex must be released by its owner; a semaphore permit can be released by any thread.",
    ],
    solutionOutline:
      "1. Counting semaphore initialized to 6 — the requirement is 'at most N concurrently', which is exactly a permit count. 2. Mutex (or a read-write lock as refinement) — exclusive critical sections protect the mid-update invariant; ownership semantics fit acquire/release in one thread. 3. Condition variable paired with the queue's mutex and the predicate 'queue non-empty' — sleeping until a fact holds, no polling. 4. Once/one-time initialization (pthread_once, std::call_once, sync.Once) — the primitive built for exactly-once with all later callers seeing the result. 5. Counting semaphore(6) for slot accounting plus a mutex-protected free list for the actual connections — checkout and return happen on different threads, which suits a semaphore's no-ownership release and rules out a plain mutex per slot.",
    commonMistakes: [
      "Semaphore(1) for requirement 2 — it 'works' but discards ownership, so any thread can accidentally release someone else's critical section.",
      "A polling loop with sleep() for requirement 3, which trades correctness pressure for latency and wasted wakeups.",
      "Missing that requirement 5 needs both counting (slots) and mutual exclusion (the shared free-list structure).",
    ],
    followUpQuestions: [
      "When would you upgrade requirement 2 from a mutex to a read-write lock, and what workload makes rwlocks slower?",
      "For requirement 1, what changes if conversions can deadlock while holding a permit?",
    ],
    rubric: [
      { criterion: "Correct mapping", description: "All five requirements map to defensible primitives with the deciding property named." },
      { criterion: "Ownership awareness", description: "Distinguishes mutex ownership from semaphore permits, especially in cases 2 and 5." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "condvar-if-instead-of-while",
    title: "The Consumer That Pops an Empty Queue",
    type: "debugging",
    difficulty: "easy",
    topics: ["concurrency", "condition-variables", "spurious-wakeups"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [PRIMITIVES],
    lessonIds: [TOOLBOX_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A worker service crashes about once a day with `IndexError: pop from an empty deque` in this consumer, even though every push calls notify:\n\n```python\ndef consume():\n    with lock:\n        if len(queue) == 0:\n            not_empty.wait()\n        item = queue.popleft()   # crashes here, rarely\n    process(item)\n```\n\nExplain the two distinct mechanisms that can make `wait()` return while the queue is empty, give the concrete multi-consumer interleaving for one of them, and fix the function. State why the fix is mandatory for condition-variable code and not a defensive nicety.",
    constraints:
      "There are at least two consumer threads and one producer. The fix must not poll and must keep the lock discipline correct.",
    hints: [
      "What happens when one push notifies two waiting consumers, or notify_all is used?",
      "The condition variable contract in POSIX and most runtimes explicitly permits wakeups with no corresponding notify.",
    ],
    solutionOutline:
      "Mechanism 1 — stolen wakeup: consumers A and B both wait; producer pushes one item and calls notify (waking A) but B is also awakened later by a second notify racing with A's consumption, or notify_all wakes both. A reacquires the lock first and pops the only item; B then reacquires the lock, resumes after its `if`, and pops from an empty queue. Mechanism 2 — spurious wakeup: the platform is allowed to return from wait with no notification at all, so even a single consumer can resume to an empty queue. Fix: replace `if` with `while len(queue) == 0: not_empty.wait()` — on every wakeup the predicate is re-checked under the lock before popping, making stolen and spurious wakeups both harmless (the thread just sleeps again). This is not defensive style: the condition-variable contract only guarantees 'when wait returns you hold the lock', never 'the predicate is true', so the loop is the primitive's required usage.",
    commonMistakes: [
      "Fixing by catching the IndexError and retrying, which papers over the broken wait discipline and still races.",
      "Switching notify to notify-one 'so only one consumer wakes' — spurious wakeups still break the if-based wait.",
      "Adding a second emptiness check after wait but before pop without the loop, which shrinks the window instead of closing it.",
    ],
    followUpQuestions: [
      "Why does the runtime reacquire the mutex before wait returns, and what could a woken thread observe if it did not?",
      "When is notify_all correct here despite waking consumers that will re-sleep?",
    ],
    rubric: [
      { criterion: "Both mechanisms", description: "Names stolen wakeups (with the two-consumer schedule) and spurious wakeups as distinct causes." },
      { criterion: "Contract understanding", description: "Justifies the while-loop as the primitive's contract, not optional hardening." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "bounded-queue-two-condvars",
    title: "Design a Bounded Queue's Wakeup Protocol",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["concurrency", "condition-variables", "bounded-buffer", "producer-consumer"],
    targetRoles: ["backend_swe", "infrastructure_swe", "quant_developer"],
    companyStyles: ["big_tech", "infra_heavy", "hft"],
    estimatedMinutes: 30,
    pathIds: [INFRA_PATH, QUANT_PATH],
    moduleIds: [PRIMITIVES],
    lessonIds: [BOUNDED_BUFFER_LESSON],
    confidenceLevel: "core",
    prompt:
      "Write (in pseudocode or a language of your choice) a blocking bounded queue with `put` and `get` for multiple producers and consumers: capacity C, producers sleep when full, consumers sleep when empty, no busy-waiting. Then defend two specific design decisions: (1) why you use two condition variables rather than one, including the concrete schedule where one condvar plus notify-one strands a waiter that could make progress; and (2) where exactly each notify call sits relative to the state change and the lock, and what breaks if the notify happens before the mutation or outside the lock discipline you chose.",
    constraints:
      "One mutex owns the buffer. Wait loops must use while-predicates. For the stranded-waiter schedule, use capacity 1, two producers, and two consumers, and show each thread's step. Notify placement must be justified by the invariant a woken thread will observe.",
    hints: [
      "With one condvar, a consumer's notify after get() might wake another consumer instead of a blocked producer.",
      "Walk capacity-1 with P1, P2 waiting on full and C1, C2 finishing gets: who does each notify-one wake, worst case?",
      "A woken waiter re-evaluates its predicate under the lock — so the state change must already be in place when the wakeup can be observed.",
    ],
    solutionOutline:
      "Structure: mutex m; condvars not_full, not_empty; deque buf. put: lock m; while len(buf)==C wait(not_full); append; notify(not_empty); unlock. get: lock m; while empty wait(not_empty); pop; notify(not_full); unlock. (1) Single-condvar failure: capacity 1, buffer full, P1 and P2 wait on the lone condvar; C1 pops and notify-one wakes — the runtime may pick P... it may also pick the other waiting consumer C2 if it is waiting too: schedule — buf full; P1, P2 wait; C1 pops (buf empty) and notifies one: suppose it wakes P1, fine; P1 fills, notifies one: it can wake P2 (a producer) while C2 sleeps; P2 re-checks full, sleeps again — the notification was consumed by a thread that cannot progress, and with the wrong alternation every notify-one lands on the wrong class while work exists: consumers sleep with a full buffer. notify_all on one condvar fixes correctness at the cost of thundering wakeups every operation; two condvars route each wakeup to the only class that can act, which is both correct and efficient. (2) Notify sits after the state mutation, while still holding the lock (or immediately after release in runtimes where that is the documented pattern): the woken thread re-acquires the mutex and re-checks the predicate, so the mutation must be complete and visible under that mutex before any wakeup can be observed. Notifying before mutating under a scheme where the notifier releases the lock between notify and mutation lets the woken thread find the predicate still false and re-sleep — then no further notify ever comes for that item: a lost wakeup. Signaling without holding/having-held the lock around the predicate change creates the same check-to-sleep race on the waiter side.",
    commonMistakes: [
      "Using if instead of while in the wait, which the multi-consumer schedule breaks immediately.",
      "Claiming notify-one on a single condvar is merely slow — the stranded-waiter schedule makes it a liveness bug, not a performance one.",
      "Calling notify with the mutex never held anywhere in the protocol, allowing a waiter to check the predicate, be preempted, miss the notify, then sleep forever.",
    ],
    followUpQuestions: [
      "Add shutdown: which predicates change, who gets notify_all, and what do woken producers return?",
      "Replace condvars with two counting semaphores (empty-slots, filled-slots) — what changes about the mutex's role and the fairness behavior?",
    ],
    rubric: [
      { criterion: "Correct protocol", description: "Mutex + two while-loop waits + correctly placed notifies form a working bounded buffer." },
      { criterion: "Stranded-waiter schedule", description: "Concrete capacity-1 schedule shows notify-one on a shared condvar failing to reach the runnable class." },
      { criterion: "Notify-placement justification", description: "Explains lost-wakeup mechanics when notification precedes mutation or evades the lock discipline." },
    ],
    sourceType: "educational_inspired",
    sourceUrls: ["https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf"],
    licenseNote: EDU_INSPIRED_NOTE,
    qualityScore: 5,
  },
  {
    slug: "shutdown-deadlock-workers",
    title: "The Worker Pool That Never Shuts Down",
    type: "debugging",
    difficulty: "hard",
    topics: ["concurrency", "condition-variables", "shutdown", "deadlocks"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 35,
    pathIds: [INFRA_PATH],
    moduleIds: [PRIMITIVES],
    lessonIds: [BOUNDED_BUFFER_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "A deploy hangs forever in `pool.close()` roughly once in fifty runs. The pool code:\n\n```python\nclass Pool:\n    def __init__(self, n):\n        self.q = deque()\n        self.lock = Lock()\n        self.not_empty = Condition(self.lock)\n        self.stop = False\n        self.threads = [Thread(target=self.worker) for _ in range(n)]\n\n    def worker(self):\n        while True:\n            with self.lock:\n                while len(self.q) == 0:\n                    if self.stop:\n                        return\n                    self.not_empty.wait()\n                job = self.q.popleft()\n            job()\n\n    def submit(self, job):\n        with self.lock:\n            self.q.append(job)\n            self.not_empty.notify()\n\n    def close(self):\n        self.stop = True          # <-- no lock\n        self.not_empty.notify_all()\n        for t in self.threads:\n            t.join()\n```\n\nExplain the interleaving that leaves a worker asleep forever despite the `notify_all`, fix `close()` (and anything else required), and then answer the harder design question: after `stop` is set, what should happen to jobs still sitting in the queue, and how does each policy change the worker's predicate?",
    constraints:
      "The hang is not a missing notify_all — one is right there. Your interleaving must show why setting `stop` outside the lock lets a worker miss both the flag and the wakeup. Then give the corrected close() and the worker predicate for both drain-then-exit and abandon-remaining policies.",
    hints: [
      "Put a worker between 'checked stop (false)' and 'called wait()' — where must close() run to strand it, and what makes that possible here?",
      "Condition.notify_all only wakes threads already waiting; a thread that has decided to wait but not yet started waiting is invisible... unless the flag-set and the decision are serialized by the same lock.",
      "Setting the flag under the lock makes 'checked stop, then waited' and 'set stop, then notified' impossible to interleave badly.",
    ],
    solutionOutline:
      "Interleaving: worker W holds the lock, sees the queue empty, checks self.stop → False. Preemption point: before W calls wait() it still holds the lock — so close() cannot be mid-critical-section... but `self.stop = True` in close() takes no lock, so it can execute at any instant, including right after W's check; notify_all() then runs while W has not yet released the lock via wait() — in CPython, Condition.notify_all grabs internal waiter state, and a thread not yet in the waiter list receives nothing. W then calls wait(), releasing the lock and sleeping. stop is True, the queue is empty, no further submit or notify will ever come: W sleeps forever and join() hangs. Fix: set the flag inside the lock —\n\n```python\ndef close(self):\n    with self.lock:\n        self.stop = True\n        self.not_empty.notify_all()\n    for t in self.threads:\n        t.join()\n```\n\nNow the flag-set is serialized with every worker's check-then-wait: either W checks after stop=True (returns immediately) or W is already waiting when notify_all fires (wakes, re-checks, returns). Drain policy: workers should finish queued jobs before exiting — predicate becomes: sleep only while `q empty and not stop`; on wake, if q non-empty pop and run (even when stop is set); return only when q empty and stop. That is exactly the existing loop order (check emptiness first, stop second) — so with the lock fix, this code already drains. Abandon policy: return as soon as stop is set regardless of queue contents — move the stop check before the emptiness loop and document that close() discards len(q) jobs (better: return them to the caller for requeueing or logging). Either way close() must pick a contract explicitly; silently choosing one is how duplicate or dropped jobs happen during deploys.",
    commonMistakes: [
      "Diagnosing a missing notify_all instead of the unserialized flag write racing the check-then-wait window.",
      "Fixing with a timeout on wait() — it converts a deadlock into a delayed shutdown and hides the protocol bug.",
      "Ignoring queued jobs at shutdown; drain vs abandon changes the predicate and the caller's contract, and interviewers push on exactly this.",
    ],
    followUpQuestions: [
      "A job itself calls submit() during drain — does your close() contract still terminate, and why?",
      "How would you make close() idempotent and safe to call from two threads at once?",
      "What changes in this design when workers are processes and the queue is remote — which piece of the condvar protocol no longer exists?",
    ],
    rubric: [
      { criterion: "Lost-wakeup interleaving", description: "Pinpoints the check-then-wait window and why the unlocked flag write plus notify_all can both land inside it." },
      { criterion: "Serialized fix", description: "Sets the flag and notifies under the mutex, with the argument for why this closes every schedule." },
      { criterion: "Shutdown contract", description: "Articulates drain vs abandon, the predicate for each, and the caller-visible consequences." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "connection-pool-semaphore",
    title: "A Connection Pool with Permits and Timeouts",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["concurrency", "semaphores", "connection-pools", "backpressure"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 30,
    pathIds: [INFRA_PATH, BACKEND_PATH],
    moduleIds: [PRIMITIVES],
    lessonIds: [BOUNDED_BUFFER_LESSON],
    confidenceLevel: "advanced",
    prompt:
      "Design an in-process database connection pool for a request-serving backend: at most 20 open connections, checkout blocks when all are in use, and a request that cannot get a connection within 500 ms must fail fast with a clear error rather than queue forever. Specify the synchronization design (which primitives own which state), the checkout/checkin protocol including the timeout path, and how you prevent the two classic pool leaks: a request that crashes while holding a connection, and a connection that dies while checked in. Close with what the 500 ms timeout protects the service from during a database slowdown.",
    constraints:
      "Use a counting semaphore (or equivalent) for slot accounting and a mutex-protected structure for the idle connections; justify why the semaphore alone is insufficient. The timeout must not leak permits. Assume the language provides semaphore acquire with timeout.",
    hints: [
      "The semaphore counts 'how many may hold connections'; something else must track 'which connections are idle'.",
      "Walk the timeout path: if acquire(500ms) fails, what must not have happened yet? If acquire succeeds but the idle-list pop fails, who returns the permit?",
      "For crash-safety, tie checkin to a context manager / finally, and consider what health check runs at checkout.",
    ],
    solutionOutline:
      "State: semaphore permits(20) counts available slots; mutex + idle list (deque of connections) holds actual idle connections; a small struct per connection tracks last-used and health. Checkout: acquire permit with 500 ms timeout — on timeout, raise PoolExhausted immediately (no shared state touched, nothing to undo). On success, lock the idle list: pop a connection if present, else open a new one (total opens can never exceed 20 because each open is covered by a held permit); validate liveness (cheap ping or staleness check), replacing a dead connection while still holding the permit. Checkin: lock idle list, push connection, unlock, release permit — release order after the push so a woken waiter always finds either an idle connection or the right to open one. Leak 1 (holder crashes): checkout returns a guard object; application code uses with pool.connection() so checkin runs in finally; a background reaper that flags connections held beyond a hard ceiling catches the remaining escapes and closes them, releasing the permit on behalf of the dead holder — permitted precisely because semaphores have no ownership. Leak 2 (idle connection dies): validate at checkout and/or a periodic idle sweep; a dead connection is closed and the checkout proceeds to open a fresh one under the same permit, so the count stays truthful. The 500 ms timeout is backpressure: when the database slows, requests fail fast instead of stacking up behind 20 stuck connections — without it, every server thread eventually parks in the pool, upstream queues fill, and a database slowdown becomes a full-service outage. The error should be distinct (pool exhausted vs query timeout) so dashboards separate saturation from slowness.",
    commonMistakes: [
      "Using only the semaphore and a lock-free grab of 'any connection', leaving the idle-list structure racy.",
      "Leaking a permit on the timeout or validation-failure paths — every early exit must account for whether a permit is held.",
      "Releasing the permit before returning the connection to the idle list, letting a waiter acquire a permit and find neither an idle connection nor headroom to open one.",
      "Treating the timeout as an inconvenience to retry immediately in a loop, which recreates the queue with extra steps.",
    ],
    followUpQuestions: [
      "How do you size the pool relative to server threads and database capacity, and what symptom tells you it is too big?",
      "What changes when two pools in two processes share one database — where does the global limit live?",
      "Why do async runtimes make the 'crashed holder' case rarer but the 'slow holder' case more dangerous?",
    ],
    rubric: [
      { criterion: "Two-structure design", description: "Semaphore for counting plus mutex-protected idle list, with the insufficiency of the semaphore alone explained." },
      { criterion: "No-leak accounting", description: "Timeout, validation-failure, crash, and dead-idle paths all preserve the permit/connection invariant." },
      { criterion: "Backpressure rationale", description: "Connects the bounded wait to failure isolation during database degradation." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
