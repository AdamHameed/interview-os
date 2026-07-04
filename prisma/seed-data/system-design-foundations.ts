import { defineProblems, DOCS_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const SYSTEM_PATH = learningPathId("system-design");
const BACKEND_PATH = learningPathId("backend-swe");
const FRAMEWORK = learningModuleId("system-design-interview-framework");
const APIS = learningModuleId("apis-requirements");
const STRUCTURE_LESSON = lessonId(FRAMEWORK, "structure-system-design-answer");
const WEBHOOK_LESSON = lessonId(FRAMEWORK, "webhook-delivery-design-walkthrough");
const CONTRACTS_LESSON = lessonId(APIS, "api-contracts-and-requirements");
const ENDPOINT_LESSON = lessonId(APIS, "designing-one-endpoint-well");

/**
 * Batch 6 of the curriculum plan: the first true system_design-type
 * problems, for system-design-interview-framework and apis-requirements.
 * Open-ended written scenarios — no code harness by design.
 */
export const systemDesignFoundationProblems = defineProblems([
  {
    slug: "clarify-notification-requirements",
    title: "Twenty Minutes of Questions Before Any Boxes",
    type: "system_design",
    difficulty: "easy",
    topics: ["requirements", "clarification", "system-design-process"],
    targetRoles: ["new_grad_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [FRAMEWORK],
    lessonIds: [STRUCTURE_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "An interviewer opens with exactly this: \"Design a service that sends notifications to our users.\" Do not design anything yet. Produce the clarifying questions you would ask, grouped into (a) functional scope, (b) scale and workload, and (c) guarantees and constraints — eight to twelve questions total. For each question, add one line on how the answer would change the design. Then pick plausible answers yourself and write the resulting one-paragraph problem statement you would confirm with the interviewer before drawing anything.",
    context:
      "Example of the difference this exercise trains, for a different prompt (\"design a file-sharing service\"):\n\n> **Weak opening:** \"Okay, so we'll need an upload service, S3 for storage, a metadata DB, and a CDN…\" (design before scope — the interviewer never said files are large, public, or shared).\n>\n> **Strong opening:** \"Before I draw anything: Are files shared publicly or with specific users? — that decides whether I need an auth/ACL model or just signed URLs. What's the size distribution? — 10 KB documents and 4 GB videos produce different upload paths. …\"\n\nEach question is paired with the design consequence of its answer. That pairing is what you are being scored on here.",
    constraints:
      "Questions must be answerable by a product owner (not 'what database should I use?'). At least two questions per group. The design-consequence line must name a concrete fork (e.g., 'push vs pull model', 'fan-out on write vs read'), not 'it would affect the design.' The final paragraph must include concrete assumed numbers (users, notifications/day, peak factor).",
    hints: [
      "Channels (push/SMS/email/in-app) each carry different latency, cost, and third-party dependencies — asking about them first collapses the space fastest.",
      "'What happens if a notification is delivered twice? Late? Never?' — guarantee questions are where interviewers hide the real problem.",
      "Scale questions worth asking are the ones whose answers cross architectural thresholds (fits-in-one-box vs needs-fanout-infrastructure).",
    ],
    solutionOutline:
      "Strong answers cover — functional: which channels; who triggers (system events, marketing campaigns, both — campaigns imply batch fanout, events imply streaming); user preferences/opt-outs and quiet hours (a compliance requirement, not a feature); templating/localization. Scale: user count and notifications per user per day; peak-to-average ratio (a campaign to 10M users at once is a different system from a steady 100/s drip); channel mix (SMS cost caps throughput; push is cheap). Guarantees: delivery guarantee per class (an OTP must arrive in seconds, exactly-usable-once; a digest can be dropped); ordering requirements; deduplication when multiple triggers fire; retention/auditability of delivery history. Each question maps to a fork: e.g., campaigns → precomputed fanout queue with rate-limited drain; OTP class → dedicated low-latency lane isolated from bulk traffic (priority or separate queue); strict per-user ordering → per-user partitioning key. A good confirmed statement reads like: 'A multi-channel (push, email) notification platform for 10M users, ~50M notifications/day with 20× campaign peaks, at-least-once delivery with per-user dedup, OTP-class messages under 5 s p99, full preference/opt-out enforcement, 90-day delivery audit log.'",
    commonMistakes: [
      "Asking technology questions ('Kafka or RabbitMQ?') that the product owner cannot answer and that no requirement yet justifies.",
      "Questions without consequences — a list of interrogatives is not scoping; the fork each answer selects is the point.",
      "Skipping the confirmation paragraph, which is what converts an interview from guessing into a graded contract.",
    ],
    followUpQuestions: [
      "The interviewer answers 'assume WhatsApp scale' — which three of your questions become the critical ones and why?",
      "Which single requirement, if answered adversarially, forces the most expensive redesign — and how would you probe for it early?",
    ],
    rubric: [
      { criterion: "Question quality", description: "Product-answerable questions spanning scope, scale, and guarantees, at least two each." },
      { criterion: "Consequence mapping", description: "Every question names the concrete design fork its answer selects." },
      { criterion: "Confirmed statement", description: "Closing paragraph fixes numbers and guarantees precise enough to design against." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "envelope-math-image-uploads",
    title: "Envelope Math for an Image Upload Feature",
    type: "system_design",
    difficulty: "easy",
    topics: ["capacity-estimation", "back-of-envelope", "storage"],
    targetRoles: ["new_grad_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup"],
    estimatedMinutes: 15,
    pathIds: [SYSTEM_PATH],
    moduleIds: [FRAMEWORK],
    lessonIds: [STRUCTURE_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A photo-sharing app is adding image uploads. Product gives you: 10 million daily active users; on an average day 20% of them upload, 3 photos each; a photo averages 2 MB as stored (after server-side compression); every photo is kept for 5 years; storage is 3×-replicated; traffic peaks at 4× the daily average rate. Compute, with visible arithmetic and sensible rounding: (a) uploads per second, average and peak; (b) ingress bandwidth at peak; (c) storage added per day and total raw storage after 5 years including replication; (d) one derived observation about what these numbers mean for the design (which component crosses a single-machine threshold first?). Keep every number to one or two significant figures — this is an estimation exercise, not accounting.",
    context:
      "Worked example of the expected style, for a different quantity (read traffic):\n\n> Views: 10M DAU × 30 views/day = 300M views/day. A day is ~86,400 s ≈ 10^5 s, so 300M / 10^5 = ~3,000 views/s average; at 4× peak ≈ 12,000 views/s. At 500 KB per served image (resized), peak egress ≈ 12,000 × 0.5 MB = 6 GB/s — that is CDN territory, not app-server territory.\n\nNote the habits: round 86,400 to 10^5, carry units through every line, and end with the threshold the number crosses.",
    constraints:
      "Show each calculation on its own line with units. Use ~10^5 seconds/day. State any additional assumption you introduce. The observation in (d) must reference a concrete threshold (disk sizes, single-node network limits, object-store vs database choice) rather than 'that's a lot of data.'",
    hints: [
      "Uploads/day = 10M × 20% × 3. Divide by ~10^5 s/day; multiply by 4 for peak.",
      "Daily bytes = uploads/day × 2 MB; multiply by 365 × 5 × 3 for the retained, replicated total.",
      "2 MB at the peak upload rate — compare the resulting ingress with what one NIC or one load balancer handles.",
    ],
    solutionOutline:
      "(a) 10M × 0.2 × 3 = 6M uploads/day → 6M / 10^5 ≈ 60/s average, ~240/s peak. (b) Peak ingress ≈ 240/s × 2 MB = ~480 MB/s ≈ 4 Gbps (client-original sizes before compression would be higher — worth stating as an assumption either way). (c) Daily: 6M × 2 MB = 12 TB/day logical; 5 years: 12 TB × 365 × 5 ≈ 22 PB logical, × 3 replication ≈ **65–70 PB raw**. (d) The observation that matters: request *rate* is trivial (240/s peak is one modest service), but *bytes* are not — 12 TB/day rules out anything database-shaped for the blobs on day one (object storage with lifecycle tiering; only metadata in the database), and 4 Gbps sustained peak ingress already wants upload termination spread across nodes or direct-to-object-store presigned uploads. Good answers notice the rate/bytes split explicitly: this workload is storage-bound, not compute-bound.",
    commonMistakes: [
      "False precision (86,400 s, 3 significant figures everywhere) that slows the exercise and impresses no one.",
      "Dropping replication or retention from the storage total — the ×3 and ×5-years factors dominate the answer.",
      "Computing numbers and stopping — without the threshold observation, the arithmetic served no design purpose.",
      "Confusing bytes and bits when converting 480 MB/s to network terms.",
    ],
    followUpQuestions: [
      "Product adds video (100 MB average, 1% of uploaders daily) — which of your four answers changes the most, and does any architectural conclusion flip?",
      "How would tiering (hot 30 days, cold thereafter) change the cost picture, and what access pattern would justify it?",
    ],
    rubric: [
      { criterion: "Arithmetic discipline", description: "Visible per-line calculations, units carried, one–two significant figures, stated assumptions." },
      { criterion: "Correct magnitudes", description: "~60/s uploads, ~4 Gbps peak ingress, ~12 TB/day, tens of PB retained." },
      { criterion: "Design-relevant conclusion", description: "Identifies the workload as storage/bandwidth-bound and names the component crossing a threshold." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "design-status-page-service",
    title: "Design a Status Page That Survives Your Outage",
    type: "system_design",
    difficulty: "medium",
    topics: ["system-design", "availability", "fanout", "caching"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 40,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [FRAMEWORK],
    lessonIds: [WEBHOOK_LESSON],
    confidenceLevel: "core",
    prompt:
      "Design a hosted status-page service (like the pages SaaS companies publish at status.example.com): companies define components ('API', 'Dashboard', 'EU region'), operators post incidents and updates, visitors see current status and history, and subscribers get notified on changes. The defining constraint: traffic is violently anti-correlated with your customers' health — a page that averages 50 views/minute takes 200,000 views/minute when its company has an outage, and that is precisely when the page must not fail, must not show stale 'all operational' banners for long, and when the operator is panicking and needs posting to work instantly. Cover: requirements and numbers you assume, the read path (how a spike of 200k/min is served and what staleness you promise), the write path (incident posted → visible everywhere → subscribers notified), the data model, and failure isolation — including the awkward question in the context block.",
    context:
      "Load shape for one customer's page during their incident (views/minute):\n\n```\n13:00  48     13:20  61     13:41  183,000   <- their outage begins,\n13:05  52     13:25  55     13:45  201,400      users search 'is X down'\n13:10  47     13:30  49     13:50  176,900\n13:15  50     13:35  58     14:20   95,000   <- update posted, traffic halves\n```\n\nThe awkward question your design must answer: the status-page company runs on the same cloud region as many of its customers. A regional cloud outage takes down your customers *and* threatens your own serving stack — exactly when every customer's page is spiking simultaneously. What, concretely, keeps the pages up?",
    constraints:
      "Assume 5,000 customer pages, 20 simultaneous incident spikes worst case, subscriber lists up to 100k per page (email/webhook/RSS). Staleness budget: an incident update must be globally visible within 30 seconds. Operator writes must succeed even mid-spike. State your consistency choice between operator view and public view explicitly. The multi-region/awkward question cannot be answered with 'use a different cloud' alone — address the serving architecture.",
    hints: [
      "The read path is a fanout of one tiny, rarely-changing document to enormous anonymous traffic — that is the textbook CDN/edge-cache shape; the design problem is invalidation within the staleness budget.",
      "Separate the planes: the public read path should be static-izable and survive with zero database queries; the operator write path is low-traffic and can afford strong consistency.",
      "Pre-render each page to a static artifact on every update and push/purge at the edge — then a database outage degrades to 'slightly stale page', not 'no page'.",
    ],
    solutionOutline:
      "Requirements: reads 200k/min per spiking page × 20 pages ≈ 67k req/s worst case — trivially CDN-able, lethal if it reaches origin; writes are tiny (an incident update is a few KB, a few per minute). Architecture: split planes hard. Write path: operator dashboard → API → durable store (incidents, components, updates — a small relational model: pages, components, incidents, incident_updates, subscriptions) → on commit, render the page to a static artifact (HTML + JSON feed) → publish to object storage → CDN purge/push; also enqueue subscriber fanout (the webhook-delivery walkthrough is exactly this subsystem: at-least-once, retries, per-endpoint isolation; email via provider with batching; 100k subscribers × 20 incidents = 2M notifications — queue with rate-limited drains). Read path: CDN serves the static artifact with a short TTL (e.g., 15–30 s) plus purge-on-update for the 30 s budget; origin is object storage, not the application — during a spike, zero dynamic work per view. Consistency: operator sees read-your-writes from the primary store; public view is eventually consistent within 30 s — state this asymmetry as deliberate. The awkward question: the public plane must have a smaller dependency set than anything it reports on — static artifacts replicated to multi-region object storage behind a CDN with origin failover; DNS and CDN are third parties independent of your compute region; the *write* path may degrade in a regional disaster (operators post via a minimal fallback — even a signed direct-to-storage updater), accepting degraded posting rather than degraded serving. Failure isolation: per-customer artifacts mean one page's churn cannot cache-bust others; subscriber fanout is bulkheaded per page so one 100k-subscriber incident cannot starve others' notifications. Observability: edge hit ratio, origin qps (should be ~0 during spikes), publish-to-visible latency against the 30 s SLO, notification lag.",
    commonMistakes: [
      "Serving reads from the application/database and 'adding caching later' — the spike math makes origin-per-view a non-starter from the first minute.",
      "Promising a single strong consistency level for both operator and public views instead of naming the deliberate asymmetry.",
      "Ignoring subscriber fanout scale (2M notifications during a bad hour) or coupling it to the read path's fate.",
      "Answering the shared-region question with 'multi-cloud' as a slogan, without reducing the public plane's dependency set to CDN + replicated static storage.",
    ],
    followUpQuestions: [
      "Customers want a private status page (login required) — which parts of your static-artifact read path survive, and what replaces the rest?",
      "How do you prove the 30-second visibility SLO to a customer — what do you measure, from where?",
      "An operator posts an update and their own page's CDN purge fails in one region — walk the user experience and your detection.",
      "Why might you deliberately keep the status-page stack technologically boring relative to your main product?",
    ],
    rubric: [
      { criterion: "Plane separation", description: "Public read path degrades to static, CDN-served, database-free; write path stays strongly consistent for operators." },
      { criterion: "Spike arithmetic", description: "Quantifies worst-case reads and shows origin traffic stays near zero during spikes." },
      { criterion: "Dependency honesty", description: "Answers the shared-region question by minimizing the public plane's dependency set, with an explicit degraded-write story." },
      { criterion: "Fanout isolation", description: "Subscriber notification subsystem is bounded, retried, and bulkheaded per page." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "design-flash-sale-checkout",
    title: "Design Checkout for a 100k-Buyer Flash Sale",
    type: "system_design",
    difficulty: "hard",
    topics: ["system-design", "inventory", "queueing", "fairness", "backpressure"],
    targetRoles: ["backend_swe", "mid_level_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "startup", "fintech"],
    estimatedMinutes: 50,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [FRAMEWORK],
    lessonIds: [WEBHOOK_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "A sneaker retailer runs drops: 5,000 units of one product go on sale at exactly 10:00; historically ~100,000 buyers arrive within the first 30 seconds, and 95% must be turned away. Design the drop-checkout system. Non-negotiable requirements: never oversell (financial/legal), never significantly undersell (money on the table), no buyer is charged without securing a unit, bounded and honest user experience for the 95k losers (a truthful 'sold out' beats a spinning wheel), and resistance to the obvious abuse (one buyer with 500 bots taking the whole drop). Cover: admission architecture for the spike, the inventory-decrement design at the moment of contention, payment sequencing (reserve vs charge ordering and timeout reclamation), fairness/anti-abuse, and what you deliberately let degrade. Address the reservation-math example in the context block explicitly.",
    context:
      "The arithmetic your design must survive:\n\n```\n10:00:00–10:00:30   ~100,000 checkout attempts for 5,000 units\npayment authorization p50: 2.5 s, p99: 8 s, timeout: 15 s\npayment failures/abandonment after reserving: ~8%\n```\n\nReservation math to address: if you reserve a unit before charging, 8% of reservations release back into stock seconds or minutes later. Naive design: 5,000 reserved in the first 200 ms, 400 units trickle back over the next 2 minutes, and your system must sell them — to whom, and how do those buyers still exist? If you answered 'sold out' to everyone at 10:00:01, you undersell by 400 units (~8%), violating requirement two.",
    constraints:
      "The inventory hot spot is one row/key for one product — sharding by product does not help within a drop; address single-key contention directly (the inventory-oversell problem is the small-scale version). Fairness: define what 'fair' means in your design (first-come? lottery among arrivals in a window?) — either is defensible, but the choice must be explicit and the anti-bot story must match it. State the user-facing timeline honestly: what does each cohort (winner, waitlisted, loser) see and when.",
    hints: [
      "Do not let 100k requests race the inventory key. Admit through a gate: either a queue with positions (first-come) or a short entry window + lottery — the gate converts a thundering herd into a controlled drain.",
      "Decrement-with-guard (the guarded atomic UPDATE) or a token allocator (5,000 pre-minted claim tokens in memory/Redis) both work; compare them under 100k-way contention.",
      "The 8% reclamation is why you keep a standby cohort: waitlist the next N buyers in order instead of telling them 'sold out' — they absorb returned units automatically.",
      "Reserve → authorize → capture, with reservation TTL slightly above payment p99; reclamation is just TTL expiry.",
    ],
    solutionOutline:
      "Admission: at 10:00 the spike hits a lightweight gate that is cheap per request (static-served waiting page + a queue-token API). Two defensible fairness models: (a) FIFO queue — arrival order wins; simple story, rewards latency/bots unless mitigated; (b) lottery — all arrivals in a 10–30 s window enter a draw for queue positions; kills the latency race and most bot advantage, at the cost of 'later arrival can win'. Either way, only the head of the queue (throttled to, say, 200–500 concurrent checkouts) reaches real checkout — the inventory key sees hundreds of contenders, not 100k. Inventory: pre-mint 5,000 claim tokens (or a single guarded atomic counter) — a claim is a durable reservation row with a TTL (~20 s, above payment p99 + margin). Sequencing: claim (reserve) → payment authorize → on success, capture and finalize; on failure/timeout, the claim row TTL-expires and the unit returns to the pool. The context math: keep a standby waitlist — buyers 5,001–7,000 hold positions with an honest 'waitlisted: ~8% of units historically return; you'll know within 3 minutes'; returned units auto-assign to the waitlist head, converting the 400 trickle-back units into sales without reopening the floodgates. Cohort experience: winners see reserve→pay immediately; waitlisted see position + deadline; everyone past the waitlist gets a truthful instant 'sold out' (cheap, static, cacheable). Anti-abuse: account-level (not IP-level) limits of one claim per account/payment instrument, proof-of-humanity before the gate for drops, device/payment fingerprinting to collapse bot farms into one identity, and the lottery model if bot latency wars persist. Degrade deliberately: browse/recommendations/analytics shed first; the claim ledger and payment path are the protected core. Observability: claims outstanding vs sold vs reclaimed in real time — the drop operator needs the sell-through curve live. Anchor numbers: queue drain 300 concurrent × ~3 s payment ≈ 100 checkouts/s → 5,000 primary sales complete in under a minute; waitlist absorbs reclamation for the following 2–3 minutes.",
    commonMistakes: [
      "Letting all 100k requests contend on the inventory row and calling the database the bottleneck — the design failure happened before the database.",
      "Charging before reserving (double-charge risk on contention) or reserving with no TTL (8% abandonment permanently strands stock).",
      "Telling everyone 'sold out' the instant 5,000 reservations exist, silently underselling by the reclamation rate — the waitlist cohort is the direct answer to the stated requirement.",
      "IP-based rate limiting as the whole anti-bot story (mobile NATs make IPs both too coarse and too easy to rotate).",
      "No explicit fairness definition — FIFO vs lottery changes the gate, the abuse surface, and the user comms, so 'a queue' without the choice is incomplete.",
    ],
    followUpQuestions: [
      "The retailer wants drops of 500k units across 20 warehouses with regional allocation — what changes about the single-key contention and what new problem appears?",
      "Payment provider latency degrades to p50 20 s mid-drop — walk the system behavior: reservation TTLs, waitlist, and operator options.",
      "Legal asks for a provable audit that allocation matched the published fairness policy — what do you log and how is it verifiable?",
      "Why might you intentionally slow the drop (queue drain rate below capacity), and what does that trade?",
    ],
    rubric: [
      { criterion: "Contention architecture", description: "A gate converts 100k arrivals into a bounded drain; the inventory mechanism (tokens or guarded counter) is correct under that bound." },
      { criterion: "Reservation lifecycle", description: "Reserve→authorize→capture with TTL reclamation, and the waitlist cohort that turns the 8% return into sales." },
      { criterion: "Honest UX and fairness", description: "Explicit fairness model with matching anti-abuse design, and truthful per-cohort timelines." },
      { criterion: "Numbers throughout", description: "Drain-rate, TTL, and sell-through arithmetic pin the design instead of decorating it." },
    ],
    sourceType: "original",
    sourceUrls: [],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "fix-this-api-contract",
    title: "Critique and Rewrite This API Contract",
    type: "system_design",
    difficulty: "easy",
    topics: ["api-design", "http-semantics", "contracts"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 15,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [APIS],
    lessonIds: [CONTRACTS_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A teammate proposes the API below for a task-management product. Identify the contract problems (aim for six or more distinct issues), explain the concrete harm each causes a client or the service, and rewrite the API. Keep the rewrite to the same feature scope — this is a contract fix, not a redesign.",
    context:
      "Proposed API:\n\n```\nPOST /api/getTasks\n  body: { \"user\": 123 }\n  -> 200 { \"tasks\": [ ...every task the user has ever had... ] }\n\nGET /api/createTask?title=Buy+milk&user=123\n  -> 200 { \"success\": true }\n  -> 200 { \"success\": false, \"reason\": \"error\" }   (on any failure)\n\nPOST /api/deleteTask\n  body: { \"id\": 987 }\n  -> 200 \"deleted\"        (also 200 if the task never existed)\n\nPOST /api/markDone?id=987\n  -> 200 { \"task\": { \"done\": 1, \"ts\": 1751371389 } }\n```",
    constraints:
      "For each issue: name it, cite the line, state the harm (caching, retries, monitoring, clients breaking — be specific). The rewrite must show methods, paths, status codes for success and the main failures, and the pagination shape for the list. You do not need to write JSON Schema — a compact spec is fine.",
    hints: [
      "Which operations are on the wrong method for their semantics, and what does that break in caches, prefetchers, and retry middleware?",
      "What can a monitoring system or client retry logic conclude from a 200 that means failure?",
      "What happens to the list endpoint after a user accumulates 50,000 tasks?",
    ],
    solutionOutline:
      "Core issues: (1) POST for a read (`getTasks`) — uncacheable, unbookmarkable, and semantically a query; (2) GET with side effects (`createTask`) — link prefetchers and crawlers create tasks, retried GETs duplicate them, URLs with data end up in logs; (3) verbs in URLs instead of resources — the method already carries the verb; (4) 200-for-failure with `success: false` — HTTP-level monitoring sees a healthy service while every call fails; retry middleware and circuit breakers keyed on status codes are blind; (5) unbounded list — no pagination; response size grows without limit (see the deep-pagination problems for the fallout); (6) no error taxonomy — 'reason: error' gives clients nothing to branch on; (7) inconsistent response shapes (bare string 'deleted', numeric boolean `done: 1`, opaque `ts`) — every client hand-rolls parsing; (8) user ID in the request body/query as authorization — the credential, not the request, must scope access; (9) delete returning 200 for never-existed hides client bugs (should be 204 on success, 404 unknown — or a documented idempotent-204 policy, but chosen, not accidental). Rewrite sketch: `GET /tasks?status=&after=<cursor>&limit=50` → 200 `{data:[...], next_cursor}`; `POST /tasks` body `{title}` → 201 + Location + task body, 422 validation errors with coded body; `DELETE /tasks/{id}` → 204, 404; `PATCH /tasks/{id}` body `{status:\"done\"}` → 200 with the full task; timestamps RFC 3339 UTC; one error envelope `{error:{code,message}}` everywhere; auth from the token, not a user parameter.",
    commonMistakes: [
      "Rewriting URLs cosmetically while keeping 200-for-failure — the status-code contract is the highest-impact fix here.",
      "Calling GET-with-side-effects merely 'unRESTful' without naming the prefetcher/retry/log-leak harms.",
      "Adding pagination to the rewrite but leaving it unbounded by default (no cap on limit).",
    ],
    followUpQuestions: [
      "The mobile team says 'we already shipped clients against the old API' — sequence the migration without breaking them.",
      "Which single issue would you fix first if you could only fix one before launch, and why?",
    ],
    rubric: [
      { criterion: "Issue coverage with harms", description: "Six-plus distinct issues, each tied to a concrete client, cache, retry, or monitoring consequence." },
      { criterion: "Rewrite quality", description: "Correct methods and status codes, cursor pagination with a cap, one error envelope, auth from credentials." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "choose-the-status-code",
    title: "Six Responses, Six Status Codes",
    type: "system_design",
    difficulty: "easy",
    topics: ["http-semantics", "status-codes", "api-design"],
    targetRoles: ["new_grad_swe", "backend_swe", "fullstack_swe"],
    companyStyles: ["startup", "big_tech"],
    estimatedMinutes: 12,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [APIS],
    lessonIds: [CONTRACTS_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "For each situation, choose the status code you would return, justify it in one or two sentences, and name the client behavior the code should trigger. Where two codes are defensible, say which you'd pick and why.\n\n1. A request to `GET /invoices/inv_42` with a valid token whose scope covers a different account.\n2. `POST /payments` with a syntactically valid JSON body whose `amount` is -50.\n3. `GET /invoices/inv_99` where inv_99 was deleted permanently last month, and product wants clients to stop retrying it forever.\n4. A burst of requests from one client exceeding its documented 100 req/min limit.\n5. `POST /reports` accepted for processing; the report takes ~2 minutes to generate.\n6. The database behind the API is down; the service itself is running.",
    context:
      "Example of the expected answer form, for a seventh situation:\n\n> **`GET /invoices/inv_42` with no Authorization header at all** → **401 Unauthorized**, with `WWW-Authenticate`. The request lacks credentials, so the correct client behavior is 'obtain/refresh credentials and retry' — as opposed to 403, whose message is 'your credentials are fine and the answer is no; do not retry with the same identity.'",
    constraints:
      "One primary code each, from real semantics (RFC 9110/6585) — no inventing codes. For 4 and 6, include the header that tells clients when to come back. For 1, address the information-disclosure tradeoff explicitly. The 'client behavior' clause is mandatory: a status code is an instruction to machines, not decoration.",
    hints: [
      "The 401/403/404 triangle is about what you reveal: does this caller get to learn the resource exists?",
      "400 vs 422: was the request unreadable, or readable but semantically unacceptable?",
      "Codes that carry Retry-After are the ones that manage client back-off for you.",
    ],
    solutionOutline:
      "1. **403** if resource existence is not sensitive (credentials valid, access denied; client should not retry as-is) — or **404** when tenancy must not leak existence across accounts; state the policy and apply it uniformly. 2. **422** (readable JSON, semantically invalid amount) with a coded field-level error; 400 is defensible if you don't distinguish, but 422 lets clients separate 'fix your parser' from 'fix your data'. 3. **410 Gone** — the explicit 'existed, permanently removed' signal; clients and crawlers should delete references and stop retrying, which 404 ('currently no representation, maybe later') does not communicate. 4. **429** with `Retry-After` — client behavior: back off until the header says otherwise; pair with rate-limit headers so well-behaved clients never hit it. 5. **202 Accepted** with a status URL (`Location: /reports/rpt_7/status`) — client behavior: poll (or receive a webhook) rather than holding a 2-minute connection. 6. **503** with `Retry-After` — the service is temporarily unable; load balancers and clients treat it as retryable and health checks can act on it; 500 would claim a bug rather than a dependency outage and gives no back-off signal.",
    commonMistakes: [
      "401 for 'valid token, wrong account' — 401 asks the client to re-authenticate, which cannot fix an authorization denial.",
      "404 for the permanently deleted invoice when the product requirement ('stop retrying forever') is exactly what 410 encodes.",
      "429 or 503 without Retry-After, leaving every client to invent its own back-off against an overloaded service.",
      "200 with an 'accepted, still processing' body for situation 5, making success indistinguishable from completion.",
    ],
    followUpQuestions: [
      "Which of these six does your monitoring page on, and which does it deliberately ignore? Why?",
      "When would you intentionally collapse 403 into 404 across an entire API, and what does the support team need to know?",
    ],
    rubric: [
      { criterion: "Correct codes with reasoning", description: "Defensible primary code per situation, RFC-grounded, with the 403/404 disclosure tradeoff addressed." },
      { criterion: "Machine-behavior framing", description: "Every answer names the client action the code triggers (retry, back off, poll, re-auth, delete reference)." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110", "https://www.rfc-editor.org/rfc/rfc6585"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "money-transfer-api-contract",
    title: "An API Contract for Moving Money",
    type: "system_design",
    difficulty: "medium",
    topics: ["api-design", "idempotency", "async-operations", "payments"],
    targetRoles: ["backend_swe", "mid_level_swe"],
    companyStyles: ["fintech", "big_tech", "startup"],
    estimatedMinutes: 35,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [APIS],
    lessonIds: [ENDPOINT_LESSON],
    confidenceLevel: "core",
    prompt:
      "Design the API contract for initiating account-to-account transfers at a fintech: `POST /transfers` plus whatever else the contract needs. Transfers take 1–30 seconds to settle through a downstream ledger, can fail after acceptance (insufficient funds discovered at settlement, compliance holds), and clients are flaky mobile apps on bad networks that retry aggressively. The incident in the context block is what your contract must make impossible. Specify: the request including the idempotency mechanism and its exact semantics (same key + same body, same key + different body, key reuse after failure), the immediate response and status lifecycle for a 30-second settlement, the error taxonomy, and how a client that lost every response reliably discovers what happened.",
    context:
      "Incident report from the current, naive API (`POST /transfer` returning 200 `{\"ok\": true}` after synchronous settlement):\n\n```\n14:02:11  client POST /transfer {from: A, to: B, amount: 120.00}\n14:02:26  gateway timeout (15 s) — client saw an error\n14:02:29  settlement actually completed server-side\n14:02:31  client auto-retried the identical POST\n14:02:33  second transfer settled: B received 240.00 total\n\ncustomer support tickets: 340 duplicate-transfer cases this quarter\n```",
    constraints:
      "Amounts must be integers in minor units with an explicit currency. The idempotency key is client-generated; specify scope (per endpoint? per account?), retention window, and the response when a key is reused while the first attempt is still in flight (the race the incident timeline implies). The lifecycle must use 202 + a status resource or an equivalent explicit async pattern — synchronous settlement built the incident. Include at least five distinct, machine-actionable error codes.",
    hints: [
      "The client retry at 14:02:31 must land on the *same* transfer — what does the server store, keyed by what, before it does anything else?",
      "Same key + different body should be an error (409/422), never a silent second transfer — a buggy client that reuses keys must be caught, not paid.",
      "A transfer is a state machine: pending → processing → settled | failed(reason). The GET on the transfer is the client's source of truth, not the POST's response.",
    ],
    solutionOutline:
      "Request: `POST /transfers` with `Idempotency-Key: <uuid>` header; body `{source_account, destination_account, amount: {value_minor: 12000, currency: \"USD\"}, reference}`. Server flow: atomically insert (key, request-hash, transfer_id, state=pending) before any side effect — the insert is the dedup point (the webhook-idempotency problem is this in miniature). Semantics: same key + same body → return the original transfer's current state (200/202 with the same transfer_id — the 14:02:31 retry now reads the existing row and B is paid once); same key + different body → 422 `idempotency_key_reuse` (client bug surfaced, no money moves); key while first attempt in flight → same transfer, current state (or 409 `in_progress` with the transfer_id — pick and document); retention ≥ 24 h, scoped per account so keys cannot collide across tenants. Lifecycle: `POST` → **202** `{transfer_id, state: \"pending\", status_url}`; `GET /transfers/{id}` returns the state machine (`pending → processing → settled | failed{reason_code}`) — clients poll or subscribe via webhook; a client that lost every response replays its POST with the same key (gets the truth) or lists `GET /transfers?idempotency_key=...`. Errors, machine-actionable: 422 `invalid_amount` / `currency_mismatch`; 402-or-422 `insufficient_funds` (at acceptance) vs `failed.reason=insufficient_funds_settlement` (after acceptance — different states, both must exist because settlement can fail late); 403 `account_frozen`; 409 `idempotency_conflict`; 429 with Retry-After; failed transfers carry `reason_code` + human message. Never float, never implicit currency; state transitions are append-only and auditable.",
    commonMistakes: [
      "Idempotency by (source, dest, amount) fingerprint instead of a client key — two legitimate identical transfers in one day become indistinguishable from a retry.",
      "Returning the *original cached response* for a key reuse instead of current state — the retry at 14:02:31 would see 'pending' forever even after settlement.",
      "Synchronous 200-on-settled design retained with a longer timeout, which just moves the incident to slower settlements.",
      "No late-failure state: treating acceptance as success, so compliance holds and settlement failures have nowhere to live in the contract.",
      "Floats for money or amount without currency.",
    ],
    followUpQuestions: [
      "The ledger team wants to add a 'reversed' terminal state for post-settlement compliance reversals — is that a breaking change to your contract? Walk a client through it.",
      "How does the webhook notification for state changes interact with the idempotency story — what must the webhook payload carry so consumers can dedupe?",
      "What load does aggressive client polling of status_url create at 10k transfers/minute, and what do you change (poll intervals, ETag/304, webhooks) to manage it?",
    ],
    rubric: [
      { criterion: "Idempotency precision", description: "Key scope, storage-before-side-effect, all three reuse cases (same body, different body, in-flight) with exact responses." },
      { criterion: "Async lifecycle", description: "202 + status resource with a complete state machine including late failures; the incident timeline is walked to a safe outcome." },
      { criterion: "Error taxonomy", description: "Five-plus coded, machine-actionable errors distinguishing acceptance-time from settlement-time failures." },
      { criterion: "Money hygiene", description: "Integer minor units, explicit currency, auditable state transitions." },
    ],
    sourceType: "original",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "api-field-versioning-migration",
    title: "Changing a Field That 200 Partners Parse",
    type: "system_design",
    difficulty: "medium",
    topics: ["api-design", "versioning", "deprecation", "migrations"],
    targetRoles: ["backend_swe", "mid_level_swe", "platform_engineer"],
    companyStyles: ["big_tech", "fintech", "startup"],
    estimatedMinutes: 30,
    pathIds: [SYSTEM_PATH, BACKEND_PATH],
    moduleIds: [APIS],
    lessonIds: [ENDPOINT_LESSON],
    confidenceLevel: "advanced",
    prompt:
      "Your public order API returns `\"status\": \"shipped\"` — a single string field. The business now has multi-shipment orders: one order can be partially shipped, and the single status can no longer represent reality (today the code arbitrarily reports the first shipment's status, which is a slow-burning lie). Two hundred integration partners parse this field; the partner code in the context block is typical. Design the change: the new representation, the compatibility strategy (in-place evolution vs versioning — choose and defend), the deprecation timeline with its enforcement mechanics (how partners find out, how you measure who still depends on the old field, what happens at sunset), and what you do about the partners who never migrate. State explicitly which principle governs every choice.",
    context:
      "Typical partner integration code (from a partner's public repo):\n\n```python\norder = api.get_order(order_id)\nif order[\"status\"] == \"shipped\":\n    notify_customer(order_id)\nelif order[\"status\"] not in (\"pending\", \"processing\", \"shipped\", \"delivered\"):\n    raise IntegrationError(f\"unknown status: {order['status']}\")   # <- note this\n```\n\nTwo landmines this code exposes: it branches on exact string equality, and it *hard-fails on any status value it has never seen*. Assume a meaningful fraction of the 200 partners wrote something like this.",
    constraints:
      "The IntegrationError line rules out the 'easy' fix — adding a new enum value like \"partially_shipped\" to the existing field is a breaking change for these partners; your design must acknowledge this. The business wants new-model data available to willing partners within one quarter, and the old field maintained no longer than four additional quarters. Include: the additive shape, opt-in mechanics, Deprecation/Sunset signaling, usage measurement, and the sunset-day behavior — 'turn it off and see who screams' needs a better answer.",
    hints: [
      "Additive beats versioned when you can keep the old field truthful-ish: ship `shipments: [...]` and a derived `fulfillment_status` alongside `status`, freeze `status` semantics, and document the derivation.",
      "The partner's unknown-value guard means the old field's value set is part of the contract — you may add fields, not values, without a version boundary.",
      "You cannot manage what you cannot measure: per-partner telemetry on who reads/relies on the old field (SDK instrumentation, response-shaping opt-ins) drives the whole timeline.",
    ],
    solutionOutline:
      "Representation: additive. Keep `status` with its existing closed value set and frozen semantics (documented as 'derived legacy summary: reports X when any/all shipments…' — pick the least-false derivation, e.g., 'shipped' only when all shipments shipped, and document the change of derivation itself as a behavior fix with notice). Add `shipments: [{id, items, status, carrier, ...}]` and `fulfillment_status` (open-set, documented as extensible with a client contract of 'treat unknown as generic in-progress'). Adding *fields* is safe for JSON parsers including the sample; adding enum *values* to `status` is not — the IntegrationError line is the proof, so the new-value fix is explicitly rejected. Compatibility strategy: in-place additive evolution beats a global v2 here — a version bump forces all 200 partners to act to get *any* improvement, while additive lets the motivated migrate this quarter; reserve versioning for when semantics of existing fields must change (state the principle: version for breakage, add for growth). Opt-in mechanics: new fields appear for everyone (harmless), but any partner wanting the *derivation change* of legacy `status` opts in via account setting or request header during the transition. Deprecation machinery: mark `status` deprecated in docs and OpenAPI; emit `Deprecation` and `Sunset` headers (with the actual date) on every response containing it; measure per-partner old-field reliance (partners who query with field selectors, SDK telemetry, or — bluntly — partners who have never fetched `shipments`); dashboard: 200 → n partners outstanding. Timeline: Q1 ship additive + docs + migration guide with copy-paste equivalents of common checks; Q2–Q3 targeted outreach to the long tail, migration status visible in the partner portal; Q4 brownouts — scheduled, announced windows where `status` is omitted (or returns a sentinel) for a few minutes, turning silent dependence into a ticket *before* sunset; sunset day: field removed for partners confirmed migrated, and for stragglers either (a) a paid/negotiated legacy compatibility mode pinned per-account (response shaping keeps serving the frozen derivation), or (b) hard removal with account-manager sign-off — the honest answer is that the last 5% is a business decision, and the design's job is making it a *small*, known set rather than a surprise. Governing principles named: additive for growth, version for breakage; deprecate with machine-readable signals + measurement; never break silently — brownouts convert unknown risk into known work.",
    commonMistakes: [
      "Adding 'partially_shipped' to the existing enum and calling it backward-compatible — the sample partner code hard-fails, and the closed value set was de facto contract.",
      "Jumping to /v2 for everything, forcing 200 partners to migrate to receive a feature only some need, then maintaining two full API surfaces indefinitely.",
      "A deprecation 'timeline' that is only an email — no Sunset headers, no usage measurement, no brownouts, so sunset day is a discovery process.",
      "Changing the legacy field's derivation quietly 'to make it more accurate' — a behavior change to a frozen field is a breaking change wearing a helpful face.",
    ],
    followUpQuestions: [
      "A top-10-revenue partner refuses to migrate and demands the old field forever — walk the options and their long-term costs.",
      "How would this play out differently in a GraphQL API — which parts of the problem disappear and which get worse?",
      "What would you build into the *next* new field's contract so its eventual deprecation is cheaper (extensibility clauses, unknown-value rules, SDK defaults)?",
    ],
    rubric: [
      { criterion: "Breakage analysis", description: "Recognizes the closed value set as contract via the partner code, rejecting the new-enum-value shortcut with evidence." },
      { criterion: "Strategy with principle", description: "Chooses additive evolution over global versioning and articulates when each applies." },
      { criterion: "Operational deprecation", description: "Machine-readable signals, per-partner usage measurement, brownouts, and a concrete sunset-day policy for stragglers." },
    ],
    sourceType: "original",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc8594"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
