import { defineProblems, DOCS_INSPIRED_NOTE, ORIGINAL_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const INFRA_PATH = learningPathId("infrastructure-swe");
const BACKEND_PATH = learningPathId("backend-swe");
const QUANT_PATH = learningPathId("quant-dev");
const TCP_UDP = learningModuleId("tcp-vs-udp");
const SOCKETS = learningModuleId("sockets-connection-lifecycle");
const TCP_CONCEPT_LESSON = lessonId(TCP_UDP, "tcp-vs-udp-backend-quant");
const TCP_WALKTHROUGH_LESSON = lessonId(TCP_UDP, "tcp-reliability-walkthrough");
const STATES_LESSON = lessonId(SOCKETS, "socket-lifecycle-states");
const LEAKS_LESSON = lessonId(SOCKETS, "where-connections-leak");

/**
 * Batch 5 of the curriculum plan: tcp-vs-udp deepening and
 * sockets-connection-lifecycle. Written-answer problems; every
 * statement includes a concrete example artifact.
 */
export const networkingFoundationProblems = defineProblems([
  {
    slug: "pick-transport-for-three-services",
    title: "Pick the Transport for Three Services",
    type: "os_networking_concurrency",
    difficulty: "easy",
    topics: ["tcp", "udp", "transport-selection"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "hft", "startup"],
    estimatedMinutes: 12,
    pathIds: [INFRA_PATH, QUANT_PATH],
    moduleIds: [TCP_UDP],
    lessonIds: [TCP_CONCEPT_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "Choose TCP or UDP for each service and justify the choice in two or three sentences by naming the transport property that decides it — not just \"reliability\" or \"speed\":\n\n1. **Artifact download**: CI runners download 500 MB build artifacts; a single flipped or missing byte corrupts the archive.\n2. **Live position broadcast**: a multiplayer game server broadcasts entity positions to players 30 times per second; only the newest position matters, and a 200 ms-old position is worthless.\n3. **Internal metrics spray**: thousands of hosts emit one small gauge datagram per second to a collector; losing 1 in 10,000 samples is acceptable, and the collector must not maintain per-host connection state.\n\nFor each, also state concretely what happens when one packet is lost.",
    context:
      "Worked example of the expected reasoning style, for a fourth service:\n\n> **DNS-style lookup** (one small query, one small response): UDP. The whole exchange fits in one datagram each way, so a connection setup (SYN, SYN-ACK, ACK) would triple the round trips before any useful data moves. On loss: the client times out (~1s) and retransmits the query itself — recovery lives in the application, which is fine because the request is idempotent and tiny.",
    constraints:
      "One decision per service with the deciding property named (ordered byte stream, retransmission, head-of-line blocking, datagram boundaries, connection state, fanout). The loss-behavior sentence must be specific: who notices, what stalls or is skipped, who retransmits if anyone.",
    hints: [
      "Ask of each service: does later data depend on earlier data, or does newer data replace older data?",
      "Per-connection state on the receiver matters when the sender population is huge.",
    ],
    solutionOutline:
      "1. TCP — the archive is an ordered byte stream where every byte matters; sequence numbers, checksums, and retransmission give exactly-once in-order bytes. On loss: the receiver stalls at the gap (head-of-line blocking) until the retransmit arrives; the application just sees a slower download. 2. UDP — positions are supersedable: retransmitting a 200 ms-old position wastes a round trip delivering a worthless datum. On loss: that tick is skipped and the next tick (33 ms later) supersedes it; the client may interpolate. TCP would stall newer positions behind a retransmit of a stale one. 3. UDP — the collector serves thousands of senders without per-connection state or handshakes, datagram boundaries match the one-sample-per-packet model, and the stated loss budget tolerates drops. On loss: the sample is gone; nobody retransmits; the next second's sample arrives normally.",
    commonMistakes: [
      "Justifying UDP with 'it's faster' instead of naming head-of-line blocking or the supersedable-data property.",
      "Choosing TCP for the metrics spray without noticing the per-host connection state and handshake cost at that fanout.",
      "Claiming UDP loss produces an error — it produces silence; detection is the application's job.",
    ],
    followUpQuestions: [
      "The game adds in-game chat — same connection or a different transport, and why?",
      "The metrics collector must now support samples larger than one MTU — what breaks with plain UDP and what are the options?",
    ],
    rubric: [
      { criterion: "Property-based decisions", description: "Each choice names the deciding transport property, not a slogan." },
      { criterion: "Loss behavior", description: "States concretely what each service observes when a packet disappears." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9293", "https://www.rfc-editor.org/rfc/rfc768"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "udp-message-boundary-bug",
    title: "The Protocol That Worked Until Two Messages Arrived",
    type: "debugging",
    difficulty: "easy",
    topics: ["tcp", "streams", "message-framing"],
    targetRoles: ["new_grad_swe", "backend_swe", "quant_developer"],
    companyStyles: ["big_tech", "startup", "hft"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH, QUANT_PATH],
    moduleIds: [TCP_UDP],
    lessonIds: [TCP_WALKTHROUGH_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A team prototyped a job-control protocol over UDP where each datagram carried one JSON command, then switched to TCP \"for reliability\" with minimal changes: each send() writes one JSON command, each recv(4096) is parsed as one JSON command. It passes every single-command test but fails under load. Explain why the code was correct over UDP and wrong over TCP, using the trace below; then fix the protocol with explicit framing and state what the receive loop must now do.",
    context:
      "Failing trace (client sends two commands quickly):\n\n```\nclient: send(b'{\"cmd\":\"pause\",\"job\":17}')      # 24 bytes\nclient: send(b'{\"cmd\":\"resume\",\"job\":17}')     # 25 bytes\n\nserver: recv(4096) -> b'{\"cmd\":\"pause\",\"job\":17}{\"cmd\":\"resume\",\"job\":17}'\nserver: json.loads(...) -> JSONDecodeError: Extra data: line 1 column 25\n```\n\nAnd under a slow link, the opposite shape:\n\n```\nserver: recv(4096) -> b'{\"cmd\":\"pau'\nserver: json.loads(...) -> JSONDecodeError: Expecting value\n```",
    constraints:
      "The fix must work for messages up to 1 MB and must handle both coalescing (two messages in one recv) and fragmentation (one message across several recvs). Length-prefix or delimiter framing are both acceptable — pick one and specify it precisely (byte order and size for a length prefix, escaping policy for a delimiter).",
    hints: [
      "UDP preserves datagram boundaries: one send is one recv. What does TCP promise about the byte positions where recv returns?",
      "TCP is a byte stream: the segments on the wire and the chunks recv returns are unrelated to your send calls.",
      "A receive loop over a stream needs a buffer: accumulate until you can prove one complete message is present.",
    ],
    solutionOutline:
      "UDP is a datagram service — message boundaries are part of the delivery contract, so one-send-one-recv held. TCP is an ordered byte stream: the kernel may coalesce two sends into one segment (first trace) or deliver a send in pieces (second trace); recv boundaries carry no meaning. Fix with explicit framing, e.g. a 4-byte big-endian unsigned length prefix before each JSON payload. The receive loop becomes: append every recv into a buffer; while the buffer holds ≥4 bytes, read the length N; if the buffer holds ≥ 4+N bytes, slice out the message, parse it, and repeat; otherwise recv again. Also handle recv returning 0 (peer closed) mid-message as a protocol error. Delimiter framing (e.g. newline-delimited JSON) works too, provided payloads are guaranteed newline-free or escaped.",
    commonMistakes: [
      "Fixing only coalescing (splitting on '}{') and leaving fragmentation unhandled — the slow-link trace still fails.",
      "Assuming recv(4096) returns exactly one send's bytes because it does so on localhost tests.",
      "A length prefix without specifying byte order and width, which breaks the moment a second language implements the peer.",
    ],
    followUpQuestions: [
      "Why did the bug never appear in single-command tests on localhost, and what test setup would have caught it?",
      "Where does the same framing obligation reappear in WebSockets, and who handles it there?",
    ],
    rubric: [
      { criterion: "Stream vs datagram", description: "Attributes the bug to TCP's byte-stream contract, using both traces (coalescing and fragmentation)." },
      { criterion: "Complete framing fix", description: "Precise frame format plus a buffering receive loop that handles partial and multiple messages." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9293#section-3.1", "https://www.rfc-editor.org/rfc/rfc768"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "tcp-retransmission-latency-spike",
    title: "The p99 That Spikes in 200 ms Steps",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["tcp", "retransmission", "latency", "observability"],
    targetRoles: ["backend_swe", "infrastructure_swe", "quant_developer"],
    companyStyles: ["big_tech", "infra_heavy", "hft"],
    estimatedMinutes: 25,
    pathIds: [INFRA_PATH, BACKEND_PATH],
    moduleIds: [TCP_UDP],
    lessonIds: [TCP_WALKTHROUGH_LESSON],
    confidenceLevel: "core",
    prompt:
      "An internal RPC between two services (same datacenter, ~0.5 ms RTT) shows a strange latency histogram after a network change: the p50 is unchanged at 1.2 ms, but a new cluster of requests takes just over 200 ms, a smaller cluster just over 400 ms, and a trace of one slow request is below. The service teams suspect garbage collection. Use the evidence to explain what is actually happening, why the slow requests cluster at those specific values, why p50 is unaffected, and what you would measure to confirm packet loss and locate it. Then list two mitigations at different layers.",
    context:
      "Packet capture for one 210 ms request (client side, times relative):\n\n```\n0.000  client > server  PSH seq=1:129   (the request)\n0.000  server > client  ACK 129\n0.001  server > client  PSH seq=1:213   (the response)   <-- LOST, inferred\n0.209  server > client  PSH seq=1:213   (retransmission)\n0.209  client > server  ACK 213\n```\n\nHistogram buckets (requests/min): 1 ms: 58,000 · 2–10 ms: 1,900 · 200–220 ms: 240 · 400–440 ms: 11 · everything else: ~0.\n\nGC pause logs for both services show max pauses of 12 ms.",
    constraints:
      "Your explanation must account for the 200 ms and 400 ms clusters specifically (initial RTO and one backoff doubling), why duplicate-ACK fast retransmit did not rescue these requests, and why GC is excluded by the evidence. Name concrete counters or captures for confirmation (e.g., retransmit counters per host/flow).",
    hints: [
      "The response fits in one segment and no further segments follow it — what loss-recovery mechanism needs following packets to work?",
      "Linux's minimum retransmission timeout is around 200 ms; each unanswered retransmit doubles it.",
      "GC pauses of at most 12 ms cannot produce a wall at exactly 200 ms.",
    ],
    solutionOutline:
      "The response segment was lost. Fast retransmit needs ~3 duplicate ACKs, which only later segments can trigger — a single-segment response has no followers, so recovery waits for the retransmission timer: RTO_min ≈ 200 ms on Linux despite the 0.5 ms RTT. The 200 ms cluster is one timeout; the 400 ms cluster is a retransmit that was itself lost, doubling the RTO (200 + 400 would appear next at ~600; with 11 vs 240 requests the loss looks independent at ~1–5%... consistent with random loss of small probability applied twice). p50 is untouched because unaffected requests never wait on a timer — loss converts into latency only for the flows that experienced it. GC is excluded: max pause 12 ms, and GC would not quantize at protocol-specific constants. Confirm with per-host TCP retransmission counters (netstat -s / node network telemetry) rising in step with the slow-request rate, and captures at both ends to localize which hop drops (client-side capture shows the retransmit arriving, server-side shows the original leaving → loss is in between). Mitigations: (network) find and fix the drop — a flapping link, an overflowing switch buffer, or a bad NIC/cable after the change; (transport/application) keep connections warm and pipelined so responses are not lone segments, enable TCP timestamps/SACK if disabled, or add application-level hedged retries after ~2× expected latency for idempotent RPCs — hedging masks rare loss at the cost of duplicate work.",
    commonMistakes: [
      "Accepting the GC theory without checking that pause durations cannot reach the observed wall values.",
      "Attributing the delay to slow ACKs or congestion without explaining the exact 200/400 ms quantization.",
      "Proposing to shrink RTO_min globally as the fix — it treats the symptom and risks spurious retransmissions everywhere.",
    ],
    followUpQuestions: [
      "Why does this failure mode get rarer as the RPC payload grows past a few segments?",
      "The same symptom appears on a 40 ms-RTT WAN link — which numbers in the histogram change and which reasoning survives?",
      "When are hedged requests safe, and what makes an RPC unsafe to hedge?",
    ],
    rubric: [
      { criterion: "Timer-based diagnosis", description: "Identifies RTO-driven recovery for lone segments, explaining both clusters and the untouched p50." },
      { criterion: "Evidence discipline", description: "Excludes GC using the pause data and names concrete counters/captures to confirm and localize loss." },
      { criterion: "Layered mitigations", description: "Offers a network-level fix and a transport/application-level mitigation with their tradeoffs." },
    ],
    sourceType: "original",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc6298"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "reliable-udp-telemetry-design",
    title: "Just Enough Reliability for UDP Telemetry",
    type: "os_networking_concurrency",
    difficulty: "hard",
    topics: ["udp", "reliability", "protocol-design", "sequencing"],
    targetRoles: ["backend_swe", "infrastructure_swe", "quant_developer"],
    companyStyles: ["hft", "infra_heavy", "big_tech"],
    estimatedMinutes: 40,
    pathIds: [INFRA_PATH, QUANT_PATH],
    moduleIds: [TCP_UDP],
    lessonIds: [TCP_WALKTHROUGH_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "Five hundred factory devices stream sensor readings to a regional gateway over UDP: one reading per packet, 20 packets/second per device, on a radio network with 0.5–2% loss and occasional 3-second outages. Product requirements: every reading must eventually reach the gateway (at-least-once), readings must be processed in per-device order, duplicates must not double-count, and the devices have little memory (buffer budget: 512 readings). TCP was rejected: 500 concurrent connections through flaky radio links caused endless reconnect storms. Design the application-layer reliability protocol: packet format (sequencing), acknowledgment scheme, retransmission policy, duplicate/ordering handling at the gateway, and the buffer-overflow policy when a device is cut off longer than its buffer covers. Walk your protocol through the example outage below.",
    context:
      "Example to trace your design against — device 42, sequence numbers shown, 3-second outage:\n\n```\nt=0.00s  dev42 -> gw   seq=100..102        (delivered)\nt=0.15s  outage begins — nothing delivered for 3s\nt=0.15s  dev42 keeps sampling: seq=103..162 accumulate in its buffer (60 readings)\nt=3.15s  outage ends\n?        what does dev42 send now, what does the gateway ack,\n?        and when does reading seq=103 finally get processed?\n```\n\nA duplicate case to handle: the gateway processes seq=205 but its ack is lost, so the device retransmits seq=205.",
    constraints:
      "Acks must be batched/cumulative (one ack datagram per device per ~250 ms at most — the radio uplink is precious). Retransmission must be device-driven (the gateway cannot connect back). The 512-reading buffer and the at-least-once + no-double-count requirements are hard; specify precisely what is dropped or degraded when the buffer would overflow, and how the gateway distinguishes a rebooted device (sequence reset) from a duplicate burst.",
    hints: [
      "A cumulative ack ('I have everything through N') plus a short list of gaps ('missing 118, 121') covers batching and targeted retransmission — this is the SACK idea at application scale.",
      "The device retransmits from the lowest unacked sequence on an ack-driven or timer-driven schedule; the gateway needs only a per-device 'highest contiguous seq' and a small out-of-order set.",
      "For reboot vs duplicate: a per-boot epoch/session ID in every packet makes stale sequence numbers unambiguous.",
    ],
    solutionOutline:
      "Packet: device ID, boot epoch (random or persisted counter incremented on reboot), 32-bit per-epoch sequence, timestamp, payload. Gateway per (device, epoch) keeps highest-contiguous seq H and a bounded set of received-above-H seqs; it processes readings in order (releases H+1, H+2… as gaps fill) and acks every 250 ms with (epoch, H, up to k gap seqs below the highest seen). Duplicates (seq <= H or in the set) are acked but not reprocessed — that resolves the lost-ack retransmit of 205: the gateway re-acks H >= 205, device drops it from its buffer. Device: ring buffer of unacked readings; on each ack, discard everything <= H and listed gaps' complements; retransmit lowest-unacked-first when an ack arrives showing gaps, plus a timer fallback (e.g., resend oldest unacked every 500 ms with backoff during silence). Outage trace: during the outage dev42 buffers 103–162 and its timer retransmits of 103 go unanswered (backoff caps the spend). At t≈3.15s a retransmit of 103 gets through; gateway acks H=102 (or H catches up as packets land); dev42 sends 103..162 paced (e.g., 2× normal rate, respecting the radio), gateway's H advances contiguously and 103 is processed as soon as it arrives — total added latency ≈ outage + one round trip, not a reconnect storm. Overflow policy: 512 readings ≈ 25 s of outage; beyond that the requirements conflict, so degrade explicitly — e.g., summarize: collapse oldest readings into min/max/mean aggregate records that occupy one buffer slot each (preserving 'eventually some record of the interval' at reduced fidelity), and set a data-degraded flag; silently dropping newest or oldest without flagging violates the audit intent. Reboot: new epoch; gateway treats (device, new epoch) as fresh state, closes the old epoch after a timeout, so a reset sequence is never mistaken for duplicates.",
    commonMistakes: [
      "Per-packet acks, ignoring the batched-ack constraint and flooding the radio uplink.",
      "No epoch/session ID, making a rebooted device's seq=1 collide with duplicate detection.",
      "Leaving the buffer-overflow behavior unspecified — the hard requirement forces a documented degradation, not an implicit drop.",
      "Reinventing full TCP (windows, congestion control, connection state) when the loss profile only requires sequencing + cumulative acks + device-driven retransmit.",
    ],
    followUpQuestions: [
      "Radio duty-cycle limits now cap the device to one uplink burst per second — which parts of the design change?",
      "The gateway must survive restarts without double-counting — what state does it persist and how often?",
      "At what requirement change (e.g., inter-device ordering, exactly-once end-to-end) would you concede the problem to a message broker or QUIC instead?",
    ],
    rubric: [
      { criterion: "Protocol completeness", description: "Sequencing with epochs, cumulative+gap acks, device-driven retransmission, and in-order release are all specified." },
      { criterion: "Trace fidelity", description: "Walks the outage and lost-ack examples correctly, including when seq=103 is processed." },
      { criterion: "Constraint honesty", description: "Buffer overflow and reboot are handled with explicit, flagged policies rather than silent behavior." },
    ],
    sourceType: "original",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc768"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "map-syscalls-to-handshake",
    title: "Map the Socket Calls to the Wire",
    type: "os_networking_concurrency",
    difficulty: "easy",
    topics: ["sockets", "tcp-handshake", "syscalls"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 12,
    pathIds: [INFRA_PATH],
    moduleIds: [SOCKETS],
    lessonIds: [STATES_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "The interleaved timeline below shows a client connecting to a server, exchanging one request/response, and disconnecting. Fill in the four blanks, then answer the two questions.\n\n```\nserver: socket(); bind(:8080); listen(backlog=128)\nclient: socket()\nclient: connect(server:8080)      -> wire: [ 1 ]\nserver kernel:                    -> wire: SYN-ACK\nclient kernel:                    -> wire: ACK        (connection ESTABLISHED)\nserver: conn = accept()           <- [ 2 ]\nclient: send(request)\nserver: recv() -> request; send(response)\nclient: recv() -> response\nclient: close()                   -> wire: [ 3 ]\nserver: recv() -> [ 4 ]\nserver: close()\n```\n\nQuestions: (a) The handshake completed before the server called accept() — where was the connection while it waited, and what limits how many can wait? (b) After this exchange, which side holds TIME_WAIT and why that side?",
    constraints:
      "Fill blanks with the specific wire event or return value ([1] and [3] are packets, [2] describes what accept returns/dequeues, [4] is what recv returns when the peer has closed). Answers to (a) and (b) should each be two or three sentences.",
    hints: [
      "The kernel, not accept(), speaks the handshake for a listening socket.",
      "recv() has a special return value that means orderly shutdown by the peer.",
    ],
    solutionOutline:
      "[1] SYN. [2] accept() dequeues the already-established connection from the listener's accept queue and returns a new connected socket (the listening socket keeps listening). [3] FIN. [4] recv() returns 0 / EOF — the orderly-shutdown signal, not an error. (a) The completed connection sat in the accept queue; listen(backlog) bounds it, and when it is full further handshakes are dropped or refused — a stalled accept loop therefore turns into client-visible connect timeouts. (b) The client closed first, so the client walks FIN-WAIT-1 → FIN-WAIT-2 → TIME_WAIT and holds TIME_WAIT for 2×MSL; it lands on the *first closer* because that side must be able to re-ACK a retransmitted FIN and absorb stray duplicates so an immediate new connection on the same 4-tuple cannot be corrupted by old segments.",
    commonMistakes: [
      "Placing the SYN at accept() time — the handshake is complete before accept returns.",
      "Treating recv() == 0 as an error instead of the peer's orderly close.",
      "Putting TIME_WAIT on the server because 'servers hold state' — it follows whoever closes first.",
    ],
    followUpQuestions: [
      "What changes on the wire and in the blanks if the server closes first after responding (common for HTTP with Connection: close)?",
      "What does the client see if the server process is running but the accept queue is full, versus if nothing is listening on the port at all?",
    ],
    rubric: [
      { criterion: "Accurate mapping", description: "All four blanks correct, including recv() = 0 for peer close." },
      { criterion: "Queue and TIME_WAIT reasoning", description: "Explains the accept queue's role/limit and why TIME_WAIT belongs to the first closer." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9293#section-3.3.2", "https://man7.org/linux/man-pages/man2/accept.2.html"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },
  {
    slug: "close-wait-pileup",
    title: "Forty Thousand Sockets in CLOSE_WAIT",
    type: "debugging",
    difficulty: "easy",
    topics: ["sockets", "close-wait", "fd-leaks"],
    targetRoles: ["new_grad_swe", "backend_swe", "infrastructure_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH, BACKEND_PATH],
    moduleIds: [SOCKETS],
    lessonIds: [LEAKS_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "An API service starts throwing `OSError: [Errno 24] Too many open files` about six hours after each deploy. Socket-state counts on the box and the client code are below. Explain what CLOSE_WAIT means mechanically (who sent what, who has not done what), why this count rising forever indicts the application rather than the kernel or the peer, find the leak in the code, and fix it. Also explain why the 3,900 TIME_WAIT sockets are *not* part of the problem.",
    context:
      "```\n$ ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn\n  41208 CLOSE-WAIT\n   3900 TIME-WAIT\n    412 ESTAB\n      6 LISTEN\n```\n\nClient code calling an internal user service:\n\n```python\ndef fetch_user(uid):\n    conn = http.client.HTTPConnection(USER_SVC, timeout=2)\n    conn.request(\"GET\", f\"/users/{uid}\")\n    resp = conn.getresponse()\n    if resp.status == 404:\n        return None                # <-- returns without conn.close()\n    data = json.loads(resp.read())\n    conn.close()\n    return data\n```\n\nAbout 8% of lookups are for deleted users and return 404. The user service closes idle connections after 30 s.",
    constraints:
      "The mechanical explanation must name the FIN/ACK exchange that produces CLOSE_WAIT and the missing local action. The fix must cover every exit path (context manager or try/finally), and state what the CLOSE_WAIT count should look like after the fix.",
    hints: [
      "CLOSE_WAIT = the peer's FIN arrived and was ACKed by your kernel; the state persists until your process calls close().",
      "Which code path returns while still owning the connection? How often does it run, and what does the peer do 30 s later?",
      "TIME_WAIT expires on its own after 2×MSL — check whether its count is growing or stable.",
    ],
    solutionOutline:
      "Mechanics: the user service closes idle connections after 30 s, sending FIN; the API box's kernel ACKs it and moves the socket to CLOSE_WAIT, where it must wait for the local application to close() its end. The 404 path returns without close(), leaking one fd per deleted-user lookup; at 8% of traffic that is a steady drip that never drains — CLOSE_WAIT has no timeout, so only the process exiting (or fd exhaustion crashing it) clears them. Rising-forever CLOSE_WAIT is definitionally a local-application omission: the kernel has done its part and the peer has done its part. TIME_WAIT is innocent: those sockets are from connections this box closed first, they expire automatically after 2×MSL, and the count is bounded by recent connection churn (stable ~3,900, not growing). Fix: guarantee close on every path —\n\n```python\ndef fetch_user(uid):\n    conn = http.client.HTTPConnection(USER_SVC, timeout=2)\n    try:\n        conn.request(\"GET\", f\"/users/{uid}\")\n        resp = conn.getresponse()\n        if resp.status == 404:\n            return None\n        return json.loads(resp.read())\n    finally:\n        conn.close()\n```\n\n(or a with-block / pooled session that owns lifecycle). After the fix CLOSE_WAIT should hover near zero — transient entries between the peer's FIN and the local close. Better still, reuse pooled connections so 40k short-lived connections stop being created at all.",
    commonMistakes: [
      "Blaming TIME_WAIT and reaching for kernel socket-reuse settings, which do nothing about CLOSE_WAIT.",
      "Fixing the 404 branch specifically instead of guaranteeing close on all exits, leaving the exception paths leaking.",
      "Restarting the service on a timer as the 'fix' — it clears the symptom every deploy and hides the bug the graph was showing.",
    ],
    followUpQuestions: [
      "What alert would catch this class of leak days before fd exhaustion — on which metric and what condition?",
      "How does connection pooling change both the CLOSE_WAIT and TIME_WAIT pictures on this box?",
    ],
    rubric: [
      { criterion: "State mechanics", description: "Explains FIN → ACK → CLOSE_WAIT and the missing local close(), and why the state cannot clear itself." },
      { criterion: "Complete fix", description: "try/finally or context manager covering all exits, with the expected post-fix steady state stated." },
      { criterion: "TIME_WAIT exoneration", description: "Distinguishes self-expiring TIME_WAIT from unbounded CLOSE_WAIT growth." },
    ],
    sourceType: "original",
    sourceUrls: ["https://man7.org/linux/man-pages/man7/tcp.7.html"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 4,
  },
  {
    slug: "listen-backlog-refused",
    title: "Connection Timeouts While the Server Sits Idle",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["sockets", "listen-backlog", "accept-queue", "capacity"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 25,
    pathIds: [INFRA_PATH, BACKEND_PATH],
    moduleIds: [SOCKETS],
    lessonIds: [LEAKS_LESSON],
    confidenceLevel: "core",
    prompt:
      "During a traffic spike, clients of a payments gateway report connect timeouts and sporadic connection resets, yet the gateway's CPU is at 30% and request handlers show no errors — from the application's point of view, nothing is wrong. The evidence is below. Explain the two-queue model behind a listening socket, identify which queue is overflowing and why the application never sees the failures, connect the evidence lines to that diagnosis, and propose fixes at three levels: the listen call, the accept loop, and admission control. State what each fix does to client-visible behavior.",
    context:
      "```\n$ ss -ltn sport = :443\nState   Recv-Q  Send-Q  Local Address:Port\nLISTEN  129     128     0.0.0.0:443        <-- Recv-Q pinned at Send-Q+1 for minutes\n\n$ nstat -az | grep -i listen\nTcpExtListenOverflows   183,447    <-- rising ~900/s during the spike\nTcpExtListenDrops       183,447\n```\n\nGateway pseudocode:\n\n```\nwhile true:\n    conn = accept()\n    handle(conn)        # parses TLS + request inline, ~40 ms,\n                        # then hands off to a worker pool\n```",
    constraints:
      "Explain both the SYN queue and the accept queue and which one `ListenOverflows` counts. The accept-loop fix must not just say 'use threads' — describe the structural change (accept fast, do slow work elsewhere) and its limit. Admission control must address what happens when the true bottleneck is downstream capacity, not accept speed.",
    hints: [
      "Recv-Q on a LISTEN socket is the count of fully established connections waiting for accept(); Send-Q is the configured backlog.",
      "The accept loop spends ~40 ms per connection before accepting the next one — how many connects/second can it absorb?",
      "When the accept queue is full, the kernel drops the handshake completion; the application literally has no socket on which to observe an error.",
    ],
    solutionOutline:
      "A listening socket has two kernel queues: the SYN queue (handshakes in progress) and the accept queue (handshakes completed, waiting for accept()). `ss` shows the accept queue: Recv-Q 129 vs backlog 128 — saturated. ListenOverflows/ListenDrops count connections whose final ACK arrived when the accept queue was full: the kernel drops them (client retries the SYN after a timeout, or eventually gets a reset), which is exactly why clients see timeouts while the application sees nothing — the failure occurs before any fd exists for the app. Cause: the accept loop does ~40 ms of TLS/parse work inline, capping accept throughput at ~25 connections/s while the spike delivers hundreds/s; the queue of 128 fills in under a second. Fixes: (1) listen(): raise the backlog (and the kernel's somaxconn cap) — buys burst absorption measured in seconds, changes nothing about sustained overload; clients see fewer drops on short spikes. (2) Accept loop: accept eagerly in a tight loop (or multiple acceptor threads / SO_REUSEPORT sharded acceptors) and defer TLS+parsing to the worker pool, so accept throughput is decoupled from request cost; clients connect promptly even under load — but this moves the queue into the process, which must now bound it. (3) Admission control: bound the internal queue and shed load explicitly (fast 503/certain-retry-after, or prioritized shedding) when downstream capacity is exceeded; clients get fast, actionable failures instead of silent drops and retry storms. Note the honest tradeoff: if downstream truly cannot serve the spike, (1) and (2) only convert connect timeouts into slower responses or explicit rejections — (3) is what makes overload behavior intentional.",
    commonMistakes: [
      "Conflating the SYN queue with the accept queue, or attributing the drops to SYN flood protection.",
      "Only raising the backlog — a deeper queue in front of a 25/s consumer just delays the same overflow and adds queueing latency.",
      "Making accept infinitely fast with no internal bound, which converts kernel-visible overload into unbounded memory growth and worse tail latency.",
    ],
    followUpQuestions: [
      "How would you alert on this before users do — which of Recv-Q/Send-Q ratio, ListenOverflows rate, or accept latency, and why?",
      "What does SO_REUSEPORT sharding change about this picture, and what new failure mode does it introduce during rolling restarts?",
      "Why do some load balancers hold a separate, deliberately shallow accept backlog and immediately reset excess connections?",
    ],
    rubric: [
      { criterion: "Two-queue model", description: "Accurately distinguishes SYN and accept queues and reads Recv-Q/Send-Q and ListenOverflows correctly." },
      { criterion: "Invisible-failure explanation", description: "Explains why kernel-level drops precede any application-visible socket or error." },
      { criterion: "Three-level remediation", description: "Backlog, accept-loop restructuring, and bounded admission control, each with its client-visible effect and limits." },
    ],
    sourceType: "original",
    sourceUrls: ["https://man7.org/linux/man-pages/man2/listen.2.html"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
  {
    slug: "ephemeral-port-exhaustion-proxy",
    title: "Cannot Assign Requested Address",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["sockets", "ephemeral-ports", "time-wait", "connection-pooling"],
    targetRoles: ["backend_swe", "infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 30,
    pathIds: [INFRA_PATH, BACKEND_PATH],
    moduleIds: [SOCKETS],
    lessonIds: [LEAKS_LESSON],
    confidenceLevel: "advanced",
    prompt:
      "An internal API proxy forwards ~1,200 requests/second to a single upstream (one IP, one port). It opens a fresh upstream connection per request and closes it after the response. After a traffic increase it starts failing several hundred requests/second with `connect: cannot assign requested address`, in waves. Evidence below. Do the arithmetic that explains the waves (connection rate × TIME_WAIT duration vs the port range), explain why the proxy — not the upstream — owns this failure and why TIME_WAIT lands on the proxy's side, then fix it. Primary fix: connection reuse — specify pool sizing for this workload. Also evaluate two commonly suggested alternatives (widening the port range; enabling time-wait reuse settings) and state precisely what each does and does not solve.",
    context:
      "```\n$ sysctl net.ipv4.ip_local_port_range\nnet.ipv4.ip_local_port_range = 32768 60999      # ~28k ports\n\n$ ss -tan dst 10.0.8.20:9000 | awk '{print $1}' | sort | uniq -c\n  27412 TIME-WAIT\n    608 ESTAB\n\nproxy log, per request:  connect -> send -> recv -> close   (proxy closes first)\nupstream p50 latency: 45 ms\n```\n\nArithmetic starter: a connection to one (dst IP, dst port) pair needs a unique source port; the proxy closes first, so each connection parks its source port in TIME_WAIT for 60 s.",
    constraints:
      "Show the numbers: ports consumed = rate × TIME_WAIT duration, against ~28k available for this destination tuple. Pool sizing must derive from Little's law (concurrency = rate × latency) with headroom. For the alternatives, distinguish 'more budget' from 'recycling' and name at least one risk or limitation of each.",
    hints: [
      "1,200 conn/s × 60 s of TIME_WAIT = how many source ports parked at steady state, against ~28k available?",
      "Concurrent connections actually needed = 1,200 req/s × 0.045 s ≈ 54 — compare that to the 27k being burned.",
      "A pooled connection is never in TIME_WAIT while it is being reused; keep-alive changes who closes and how often.",
    ],
    solutionOutline:
      "Arithmetic: closing first puts each connection's source port in TIME_WAIT for ~60 s, and all connections share one destination tuple, so distinct source ports are the budget: 1,200/s × 60 s = 72,000 ports needed at steady state vs ~28,000 available — exhaustion is guaranteed; the waves are the sawtooth of ports expiring in 60 s cohorts and being immediately reconsumed. The proxy owns it because the client side allocates the ephemeral port, and the proxy closes first, so TIME_WAIT (2×MSL protection against old duplicates) accrues on the proxy. The upstream is healthy — 608 ESTAB is trivial. Fix: keep-alive connection pool to the upstream. Required concurrency by Little's law: 1,200 req/s × 45 ms ≈ 54 in-flight; a pool of ~100–150 (2–3× headroom for latency spikes and retry bursts) serves the load using ~150 ports total, ~200× under budget, and TIME_WAIT churn drops to pool-maintenance events. Add per-request pool-acquire timeouts and health-check/eviction (see the semaphore pool problem). Alternatives: (a) widening ip_local_port_range to ~64k ports raises the budget to under 64,000 — still below the 72,000 steady-state need, so it delays exhaustion without removing it, and it is global to the host; 'more budget' cannot beat a rate × duration product that exceeds it. (b) TIME_WAIT reuse settings (tcp_tw_reuse for outbound connects with timestamps) recycle ports early and can genuinely mask this — but they trade away part of TIME_WAIT's duplicate-segment protection, apply host-wide rather than per-destination, depend on timestamp behavior on both ends, and leave the real inefficiency (72k connection setups/minute for 54 needed conversations, each paying handshake + slow-start) in place. Pooling fixes cause; the others adjust symptoms.",
    commonMistakes: [
      "Diagnosing an upstream capacity problem despite the error occurring at local connect-time port allocation.",
      "Recommending tcp_tw_reuse or a wider port range as the complete fix without the rate × duration arithmetic showing they still lose or merely defer.",
      "Pool sized by folklore (e.g., 'one per CPU') instead of rate × latency with stated headroom.",
      "Forgetting that pooling also removes per-request handshake and TLS/slow-start costs — the fix is a latency win, not just an error fix.",
    ],
    followUpQuestions: [
      "The upstream adds a second IP behind DNS — how does that change the port math, and is 'add IPs' a legitimate scaling lever here?",
      "Why does the same proxy talking to 500 distinct upstreams almost never hit this, at the same total request rate?",
      "If the upstream (not the proxy) closed connections first, where would TIME_WAIT accumulate and what would the failure look like instead?",
    ],
    rubric: [
      { criterion: "Quantified diagnosis", description: "Rate × TIME_WAIT duration vs port-range arithmetic, including why the waves occur and which side owns TIME_WAIT." },
      { criterion: "Pool design", description: "Little's-law sizing with headroom, plus acquire timeouts and eviction, tied to the earlier pool problem's discipline." },
      { criterion: "Alternatives evaluated honestly", description: "Port-range widening and tw_reuse analyzed as budget vs recycling, with risks and what remains unfixed." },
    ],
    sourceType: "original",
    sourceUrls: ["https://man7.org/linux/man-pages/man7/ip.7.html", "https://www.rfc-editor.org/rfc/rfc9293#section-3.3.2"],
    licenseNote: ORIGINAL_NOTE,
    qualityScore: 5,
  },
]);
