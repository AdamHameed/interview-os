import { defineProblems, DOCS_INSPIRED_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const INFRA_PATH = learningPathId("infrastructure-swe");
const DOCKER_FUND = learningModuleId("docker-fundamentals");
const DOCKERFILE_LAYERS = learningModuleId("dockerfiles-image-layers");
const CONTAINERS_LESSON = lessonId(DOCKER_FUND, "docker-containers-mental-model");
const DOCKER_RUN_LESSON = lessonId(DOCKER_FUND, "docker-run-to-process-walkthrough");
const LAYERS_CONCEPT_LESSON = lessonId(DOCKERFILE_LAYERS, "docker-image-layers-why-they-matter");
const LAYERS_WALKTHROUGH_LESSON = lessonId(DOCKERFILE_LAYERS, "dockerfile-cache-optimization-walkthrough");

/**
 * Batch 8 of the curriculum plan: docker-fundamentals and
 * dockerfiles-image-layers. Written-answer and write-code problems.
 */
export const dockerFoundationProblems = defineProblems([
  // ── docker-fundamentals warmups ───────────────────────────────────────────

  {
    slug: "container-vs-vm-comparison",
    title: "Container or VM? Choose and Justify",
    type: "read_code",
    difficulty: "easy",
    topics: ["docker", "containers", "virtual-machines", "namespaces", "cgroups"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 12,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKER_FUND],
    lessonIds: [CONTAINERS_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "For each statement below, answer **True**, **False**, or **It depends** and justify in one or two sentences using concrete mechanisms (namespaces, cgroups, hypervisor, kernel).\n\n1. Two containers running on the same host share the host's kernel.\n2. A container provides stronger isolation than a VM because it uses fewer resources.\n3. Running a process in a Docker container prevents it from consuming all CPU on the host by default.\n4. A container image built on Ubuntu can run directly on a macOS host without any virtualization layer.\n5. A VM and a container started from the same application can both listen on port 8080 without conflict.\n\nFor statement 5, explain how each achieves port isolation.",
    constraints:
      "Each answer must name the specific mechanism — not just 'namespaces' but which namespace, or not just 'hypervisor' but what it virtualizes. For statement 5, specify the Docker command-line option and the VM equivalent.",
    hints: [
      "Docker containers on Linux use the host kernel; Docker Desktop on macOS runs a lightweight Linux VM first.",
      "cgroups limit resource usage — but Docker does not set a CPU limit by default, so a container can starve neighbors.",
      "Port isolation in containers uses the network namespace; port isolation between VMs uses virtual NICs with separate IP stacks.",
    ],
    solutionOutline:
      "1. True — containers share the host kernel via Linux namespaces (PID, network, mount, UTS, IPC). There is no separate kernel per container; this is fundamental to how containers differ from VMs. 2. False — sharing the kernel gives better density and lower overhead, but isolation is weaker, not stronger. A VM's hypervisor presents each guest with a virtual hardware layer and a fully separate kernel; a kernel vulnerability exploited from inside a container can affect the host or other containers. Fewer resources ≠ stronger isolation. 3. False — by default Docker places no CPU limit on a container; it can use all available CPU. You must pass `--cpus=<number>` (which uses cgroup CPU bandwidth control) to cap usage. 4. False — a Linux container image requires a Linux kernel. On macOS, Docker Desktop runs a lightweight Linux VM (using the Apple Virtualization framework or QEMU) and runs containers inside it; the container never touches the macOS kernel directly. 5. It depends on configuration. A container: by default runs in its own network namespace with no host ports exposed; to reach port 8080 from outside you publish it with `docker run -p <host_port>:8080`, choosing a different host port for each container. A VM: runs its own full network stack with a separate IP; two VMs can each listen on 8080 on their own IP without publishing — a client addresses each by its VM IP. Both achieve isolation via separate network stacks, but the mechanism differs: containers use network namespaces; VMs use virtual NICs and a separate kernel network stack.",
    commonMistakes: [
      "Saying 'containers are more secure' without qualification — the narrower attack surface of the hypervisor boundary makes VMs more isolated for untrusted workloads.",
      "Believing -p 8080:8080 is the only way a container can reach the host network — host networking mode (`--network=host`) removes the network namespace entirely.",
      "Confusing image portability with kernel portability — an image's filesystem layers are portable, but they run against the host's (or VM's) kernel.",
    ],
    followUpQuestions: [
      "What Linux kernel feature isolates a container's process tree so it cannot see host processes, and how would you verify it with ps?",
      "When would you choose to run a containerized workload inside a VM rather than directly on a bare-metal host?",
    ],
    rubric: [
      { criterion: "Mechanism accuracy", description: "Each verdict cites the specific isolation mechanism (which namespace, cgroup subsystem, or hypervisor feature)." },
      { criterion: "Port isolation detail", description: "Correctly contrasts network namespace publish vs VM separate IP for statement 5." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/get-started/docker-overview/",
      "https://man7.org/linux/man-pages/man7/namespaces.7.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "docker-run-exit-code-debug",
    title: "Why Did the Container Exit Immediately?",
    type: "debugging",
    difficulty: "easy",
    topics: ["docker", "containers", "exit-codes", "process-1", "debugging"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKER_FUND],
    lessonIds: [DOCKER_RUN_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A new team member runs a service container and it exits within one second. Three incident scenarios follow. For each, name the most likely root cause, explain the clue in the output, and give the exact diagnostic command to confirm.\n\n**Scenario A — the fast exit**\n```\n$ docker run --rm my-service:latest\n$ echo $?\n0\n```\nThe container ran, produced no output, and exited with code 0.\n\n**Scenario B — the crash**\n```\n$ docker run --rm my-service:latest\nFatal error: cannot open config file /etc/service/config.yaml\n$ echo $?\n1\n```\n\n**Scenario C — the signal**\n```\n$ docker run --rm my-service:latest\n$ echo $?\n137\n```\nThe container ran for 30 seconds, then exited with code 137.",
    constraints:
      "For each scenario: (1) root cause in one sentence, (2) the specific clue in the output, (3) the exact docker command to investigate further. For scenario C, explain what 137 encodes arithmetically and which signal caused it.",
    hints: [
      "Docker exit codes mirror Linux process exit codes; 137 = 128 + signal number.",
      "Exit 0 from a container means PID 1 returned 0; if no daemon is running, the container finishes the moment its command completes.",
      "For a missing file, check whether the file exists in the image or if it should be bind-mounted from the host.",
    ],
    solutionOutline:
      "Scenario A: PID 1 completed normally and immediately. The most likely cause is that the entrypoint command is a one-shot script or the wrong command — it ran, succeeded, and exited. Exit 0 is the clue: the process did not crash. Investigate: `docker run --rm --entrypoint sh my-service:latest -c 'ps aux; cat /proc/1/cmdline'` to see what PID 1 actually is, or `docker inspect my-service:latest --format '{{.Config.Cmd}} {{.Config.Entrypoint}}'` to check the configured command. Scenario B: the application cannot find its config file. The error message 'cannot open /etc/service/config.yaml' is the direct clue; exit 1 confirms a clean error exit (not a crash). Investigate: `docker run --rm --entrypoint sh my-service:latest -c 'ls /etc/service/'` to check whether the file is in the image, or check if it should be provided via `-v /host/path/config.yaml:/etc/service/config.yaml`. Scenario C: the container was killed by SIGKILL (signal 9). Exit code 137 = 128 + 9; 9 is SIGKILL. Clues: exit 137 after a fixed runtime (30 s) suggests an OOM kill or a timeout. Investigate: `docker inspect <container_id> --format '{{.State.OOMKilled}}'` — if true, the container exceeded its memory limit. Also check: `docker events` or `docker logs --details <container_id>` and the host's `dmesg | grep -i oom`.",
    commonMistakes: [
      "Assuming exit 0 is always correct — a service container should run indefinitely; exiting with 0 is a bug if it means the server process was never started.",
      "Confusing exit 137 with exit 128+9 arithmetic: 128 is the base for signal exits; 137 − 128 = 9 = SIGKILL.",
      "Checking the running container's filesystem with docker exec when the container has already exited — use docker run with an overridden entrypoint or docker cp from a stopped container.",
    ],
    followUpQuestions: [
      "What exit code does a container produce when it is sent SIGTERM (signal 15) and exits cleanly in response?",
      "How does Docker's `--restart=unless-stopped` policy interact with exit code 0 vs non-zero?",
    ],
    rubric: [
      { criterion: "Root cause and clue", description: "Each scenario names the cause and identifies the specific output element that reveals it." },
      { criterion: "Diagnostic command accuracy", description: "Commands are syntactically correct and target the right artifact (inspect, run with override, or events)." },
      { criterion: "Exit code arithmetic", description: "Correctly decodes 137 = 128 + 9 = SIGKILL for scenario C." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/reference/cli/docker/container/run/",
      "https://tldp.org/LDP/abs/html/exitcodes.html",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  // ── docker-fundamentals core ──────────────────────────────────────────────

  {
    slug: "docker-network-container-discovery",
    title: "Two Containers That Cannot Find Each Other",
    type: "debugging",
    difficulty: "medium",
    topics: ["docker", "networking", "dns", "bridge-network", "container-discovery"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 25,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKER_FUND],
    lessonIds: [DOCKER_RUN_LESSON],
    confidenceLevel: "core",
    prompt:
      "A backend service and a Redis cache are started with these commands, and the backend reports connection refused:\n\n```bash\n$ docker run -d --name redis redis:7\n$ docker run -d --name backend \\\n    -e REDIS_URL=redis://redis:6379 \\\n    my-backend:latest\n```\n\nThe backend logs:\n```\n[ERROR] connect ECONNREFUSED redis:6379\n        at redis_connection.connect (/app/node_modules/ioredis/...)\n```\n\nDiagnose the exact problem, explain why `redis:6379` resolves to nothing, and provide the corrected commands. Then answer: what would happen to DNS resolution if the backend is also given the `--network=host` flag?",
    constraints:
      "Name the specific Docker network feature that provides hostname-based discovery between containers. Show the corrected docker run commands as complete shell commands. For the --network=host follow-up, state what hostname 'redis' resolves to in that configuration and why.",
    hints: [
      "Docker's built-in DNS service resolves container names to their IP addresses only within the same user-defined bridge network.",
      "Containers started without a --network flag join the default bridge network, which does not provide automatic DNS.",
      "The default bridge network uses link-local addresses and /etc/hosts entries, not Docker's embedded DNS at 127.0.0.11.",
    ],
    solutionOutline:
      "Root cause: both containers are on the default bridge network, which does not provide automatic DNS resolution by container name. The name 'redis' is not registered anywhere the backend can look up. Docker's embedded DNS server (127.0.0.11) is only available to containers on user-defined bridge networks (created with `docker network create`). On the default bridge, Docker writes static /etc/hosts entries only when the deprecated `--link` flag is used — `--link` is not used here.\n\nFix: create a user-defined bridge network and attach both containers to it:\n```bash\ndocker network create app-net\ndocker run -d --name redis --network app-net redis:7\ndocker run -d --name backend \\\n    --network app-net \\\n    -e REDIS_URL=redis://redis:6379 \\\n    my-backend:latest\n```\n\nNow Docker's embedded DNS resolves 'redis' to the redis container's IP within app-net.\n\n--network=host follow-up: with `--network=host`, the backend container shares the host's network stack — no network namespace, no Docker DNS. The name 'redis' would be looked up in the host's DNS resolver (/etc/resolv.conf), which knows nothing about Docker container names. Resolution would fail with NXDOMAIN (or whatever the host's DNS returns for 'redis'). The fix in host-network mode is to use 127.0.0.1 or the host IP directly, since Redis is also on the host network and listening on 127.0.0.1:6379 (or use the explicit container IP from `docker inspect`).",
    commonMistakes: [
      "Using --link redis:redis — deprecated, creates a one-directional /etc/hosts entry but no DNS, and works only between the two explicitly linked containers.",
      "Adding both containers to a network but starting redis after the backend — Docker DNS resolution works by name lookup at connect time, so start order matters only if the backend attempts to connect before redis is ready (a liveness/readiness issue, not a DNS issue).",
      "Assuming --network=host gives the container access to Docker DNS — host networking bypasses the Docker network stack entirely.",
    ],
    followUpQuestions: [
      "How does docker compose handle network creation and service discovery by default, and where does it embed DNS?",
      "What happens to the redis container's port 6379 on the host when using the default bridge vs --network=host?",
    ],
    rubric: [
      { criterion: "Root cause", description: "Names the default bridge network's lack of DNS resolution and contrasts it with user-defined bridge DNS." },
      { criterion: "Corrected commands", description: "Creates a named network and attaches both containers to it with syntactically correct commands." },
      { criterion: "--network=host follow-up", description: "Explains that host networking bypasses Docker DNS and names are resolved by the host's resolver." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/engine/network/drivers/bridge/",
      "https://docs.docker.com/engine/network/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "docker-resource-limits-oom",
    title: "The Container That Killed Its Neighbor",
    type: "os_networking_concurrency",
    difficulty: "medium",
    topics: ["docker", "cgroups", "memory-limits", "oom-killer", "resource-management"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 28,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKER_FUND],
    lessonIds: [DOCKER_RUN_LESSON],
    confidenceLevel: "core",
    prompt:
      "A host runs three containers. On Tuesday night the payment-service container starts allocating large in-memory caches; by 02:00 it has consumed 14 GB of the host's 16 GB RAM. The OOM killer activates and kills the database container, causing a production outage. The containers were started as:\n\n```bash\ndocker run -d --name payment-service  my-payment:latest\ndocker run -d --name database         postgres:16\ndocker run -d --name metrics-agent    prom/node-exporter\n```\n\nAnswer the following:\n1. Why did the OOM killer kill the database container instead of the payment-service that caused the pressure?\n2. Add memory limits and reservations to all three containers using `--memory` and `--memory-reservation` to prevent this. Choose appropriate values for a 16 GB host; justify your numbers.\n3. What does the OOM killer's `oom_score_adj` have to do with this, and how does Docker expose control over it?\n4. After adding limits, the payment-service is OOM-killed itself. What exit code does Docker report, and how would you detect this in a monitoring system?",
    constraints:
      "For question 2, the three containers together should not exceed ~14 GB hard limit; leave 2 GB for the host OS. For question 4, name the docker inspect field that distinguishes OOM kill from a normal crash, and give a Prometheus or alerting rule concept that would page on it.",
    hints: [
      "The Linux OOM killer selects the victim with the highest oom_score, which is proportional to memory use as a fraction of total RAM.",
      "`--memory` sets a hard cgroup limit; exceeding it triggers an OOM kill of that container. `--memory-reservation` is a soft hint for scheduling, not enforcement.",
      "Docker sets oom_score_adj to -500 for itself and 0 for user containers by default; lower scores are less likely to be killed.",
    ],
    solutionOutline:
      "1. The Linux OOM killer picks the process with the highest oom_score. oom_score is roughly proportional to resident memory as a fraction of total RAM. payment-service had the highest oom_score because it consumed the most memory — but oom_score_adj (the per-process adjustment) also factors in. Docker sets oom_score_adj to 0 for all user containers by default, so the tiebreaker is memory consumption. The database container likely had a second-highest oom_score because PostgreSQL's shared_buffers also hold significant memory. The OOM killer chose database because its oom_score was higher than metrics-agent's (the node exporter uses far less RAM). The root cause is that payment-service had no limit and grew until the OOM killer fired.\n\n2. Limits for a 16 GB host (leaving 2 GB for OS):\n```bash\ndocker run -d --name payment-service \\\n  --memory=6g --memory-reservation=4g \\\n  my-payment:latest\ndocker run -d --name database \\\n  --memory=6g --memory-reservation=5g \\\n  postgres:16\ndocker run -d --name metrics-agent \\\n  --memory=512m --memory-reservation=256m \\\n  prom/node-exporter\n```\nTotal hard limit: 6 + 6 + 0.5 = 12.5 GB, well under 14 GB ceiling. Reservations are lower than limits to allow bursting. The database gets a higher reservation because PostgreSQL performs best when its buffers stay resident.\n\n3. oom_score_adj ranges from -1000 (never kill) to +1000 (kill first). Docker sets oom_score_adj = 0 for containers; adding `--oom-score-adj=-500` makes the container less likely to be killed, useful for critical services like the database. Docker also exposes `--oom-kill-disable` (sets the cgroup oom_kill_disable flag) to prevent the OOM killer from touching a specific container — but with no memory limit this just transfers the kill to another process. Correct usage: set a memory limit AND protect critical containers with a negative oom_score_adj.\n\n4. An OOM-killed container exits with code 137 (128 + SIGKILL = 9). `docker inspect <container_id> --format '{{.State.OOMKilled}}'` returns `true` for an OOM exit. A Prometheus alerting rule concept: scrape docker's /events endpoint (or cadvisor) for OOMKilled=true events and alert on `increase(container_oom_events_total[5m]) > 0`.",
    commonMistakes: [
      "Setting --memory without --memory-swap; by default swap equals memory, effectively doubling the limit and delaying OOM detection.",
      "Using --oom-kill-disable without a memory limit — the container is protected but the host will OOM kill any other unprotected process instead.",
      "Confusing memory-reservation (soft scheduling hint) with an enforced limit — reservation does not prevent the container from using more memory.",
    ],
    followUpQuestions: [
      "How does --memory-swap=0 disable swap for a container, and when would you want that for a latency-sensitive service?",
      "What Kubernetes resource request/limit corresponds to Docker's --memory-reservation and --memory, and why does Kubernetes recommend setting both?",
    ],
    rubric: [
      { criterion: "OOM victim selection", description: "Explains oom_score proportional to RSS and why the database was selected over metrics-agent." },
      { criterion: "Correct limits and reservations", description: "Provides three concrete values that fit in 14 GB, with justification for allocation ratios." },
      { criterion: "OOM detection", description: "Names exit code 137, docker inspect OOMKilled field, and a monitoring concept for alerting." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/config/containers/resource_constraints/",
      "https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── docker-fundamentals challenge ─────────────────────────────────────────

  {
    slug: "docker-entrypoint-design",
    title: "Design a Configurable Container Entrypoint",
    type: "write_code",
    difficulty: "hard",
    topics: ["docker", "entrypoint", "cmd", "shell-form", "exec-form", "signals"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 35,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKER_FUND],
    lessonIds: [DOCKER_RUN_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "A service container needs to satisfy these requirements:\n\n1. The main process must receive SIGTERM directly (not via a shell wrapper) for graceful shutdown.\n2. The command must be overridable at `docker run` time without requiring `--entrypoint`.\n3. A startup script (`/app/init.sh`) must run first — it configures secrets from environment variables into config files — before the main server starts.\n4. The server binary is `/app/server` and accepts `--port` and `--config` as flags that change between environments.\n\nThe current Dockerfile:\n```dockerfile\nFROM ubuntu:22.04\nCOPY app/ /app/\nCMD [\"/app/init.sh && /app/server --port 8080\"]\n```\n\nIdentify all problems in the current CMD, then write the corrected Dockerfile section (ENTRYPOINT + CMD) with an init.sh that correctly execs into the server. Explain your signal-routing decision and why shell form vs exec form matters here.',",
    constraints:
      "The init.sh must use `exec` to replace itself with the server process so PID 1 is the server. The CMD should supply only the flags so they can be overridden at runtime. Show both the Dockerfile snippet and the init.sh content. Explain what `docker stop` sends and to which PID in shell form vs exec form.",
    hints: [
      "CMD with a single string uses shell form (`/bin/sh -c`), which makes the shell PID 1 — SIGTERM goes to the shell, not your server.",
      "ENTRYPOINT (exec form) + CMD (exec form) means CMD arguments are appended to ENTRYPOINT; overriding CMD at `docker run` is easy, overriding ENTRYPOINT requires --entrypoint.",
      "An init script that uses `exec \"$@\"` passes all its arguments to the server and replaces the init process, making the server PID 1.",
    ],
    solutionOutline:
      "Problems with the current Dockerfile:\n1. CMD uses a single string — Docker treats this as exec form of a JSON array with one element, but that element is `/app/init.sh && /app/server --port 8080`. Docker will try to find a binary named literally `/app/init.sh && /app/server --port 8080` which does not exist. Even if it were shell form, the shell would become PID 1 and SIGTERM would be delivered to the shell (which may not forward it), causing a 10-second timeout before SIGKILL.\n2. The CMD contains the full command including flags — operators cannot override just the port without passing the full command.\n\nCorrected Dockerfile:\n```dockerfile\nFROM ubuntu:22.04\nCOPY app/ /app/\nRUN chmod +x /app/init.sh /app/server\nENTRYPOINT [\"/app/init.sh\"]\nCMD [\"--port\", \"8080\", \"--config\", \"/etc/app/config.yaml\"]\n```\n\ninit.sh:\n```bash\n#!/bin/sh\nset -e\n\n# Configure secrets from environment into config file\nmkdir -p /etc/app\ncat > /etc/app/config.yaml <<EOF\ndatabase_url: ${DATABASE_URL}\nsecret_key: ${SECRET_KEY}\nEOF\n\n# Replace init process with the server, making server PID 1\nexec /app/server \"$@\"\n```\n\nSignal routing: with ENTRYPOINT exec form and exec inside init.sh, the server is PID 1. `docker stop` sends SIGTERM to PID 1, which is the server — it receives the signal and can shut down gracefully. Without `exec`, init.sh would stay as PID 1; SIGTERM goes to the shell; unless the shell forwards signals (which bash does with `trap` but sh does not by default), the server gets nothing and after 10 seconds Docker sends SIGKILL.\n\nOverriding CMD at runtime: `docker run my-service:latest --port 9090 --config /etc/app/prod.yaml` replaces the default CMD, which is appended to ENTRYPOINT, so init.sh runs with --port 9090 and passes it to the server via $@.",
    commonMistakes: [
      "Using ENTRYPOINT in shell form (ENTRYPOINT /app/init.sh) — shell form also runs via /bin/sh -c, making the shell PID 1 and breaking signal delivery.",
      "Not using exec in init.sh — the init script stays as PID 1, server is a child process, and signals do not reach it unless the parent explicitly forwards them.",
      "Putting server flags in ENTRYPOINT instead of CMD — flags in ENTRYPOINT cannot be overridden without --entrypoint, which defeats the configurable-flags requirement.",
    ],
    followUpQuestions: [
      "What is tini and when would you use it as a PID 1 wrapper instead of exec'ing the server directly?",
      "How would you handle the case where init.sh must wait for a dependency (e.g., the database) before starting the server, without busy-polling?",
    ],
    rubric: [
      { criterion: "Problems identified", description: "Identifies shell form / bad binary name in CMD and non-overridable flags as distinct bugs." },
      { criterion: "Exec form and exec in init.sh", description: "ENTRYPOINT is exec form; init.sh ends with exec /app/server \"$@\" making server PID 1." },
      { criterion: "Signal routing explained", description: "Explains docker stop → SIGTERM → PID 1 → server, and the shell-form failure mode." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/reference/dockerfile/#entrypoint",
      "https://docs.docker.com/reference/dockerfile/#cmd",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── dockerfiles-image-layers warmups ──────────────────────────────────────

  {
    slug: "dockerfile-layer-order-fix",
    title: "Reorder the Dockerfile to Fix Cache Thrashing",
    type: "optimization",
    difficulty: "easy",
    topics: ["docker", "dockerfile", "layer-cache", "build-performance", "image-layers"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKERFILE_LAYERS],
    lessonIds: [LAYERS_CONCEPT_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A Node.js service has a Dockerfile that reinstalls all npm packages on every build, even when only application code changed. Here is the current Dockerfile:\n\n```dockerfile\nFROM node:20-slim\nWORKDIR /app\nCOPY . .                    # copies everything including package.json\nRUN npm ci --omit=dev       # reinstalls all deps every build\nEXPOSE 3000\nCMD [\"node\", \"src/index.js\"]\n```\n\nFor each of the five lines, state whether it will be cached on a typical code-only change (changing src/index.js but not package.json or package-lock.json), and explain why. Then write the corrected Dockerfile that achieves dependency caching while keeping the final image correct.",
    constraints:
      "Explain Docker's layer invalidation rule: when a layer is invalidated, what happens to all subsequent layers? Show which specific file change triggers each layer. The corrected Dockerfile must produce an identical runtime image.",
    hints: [
      "Docker caches a layer if its instruction and all inputs (the instruction text and any copied files) are identical to the previous build.",
      "COPY invalidates the cache when any file in the source directory has changed — so copying everything before installing deps invalidates the install layer on every code change.",
      "Separate COPY instructions for package files and application files let Docker reuse the npm install layer when only app code changes.",
    ],
    solutionOutline:
      "Cache analysis per line for a src/index.js change:\n- FROM node:20-slim — cached (base image unchanged)\n- WORKDIR /app — cached (instruction unchanged, no file input)\n- COPY . . — INVALIDATED — src/index.js is included in the copy; Docker detects the file change and invalidates this layer\n- RUN npm ci — INVALIDATED — because the previous layer was invalidated, this layer must re-run regardless of whether package files changed\n- EXPOSE 3000 — INVALIDATED (follows invalidated layers)\n- CMD [...] — INVALIDATED (follows invalidated layers)\n\nLayer invalidation rule: when any layer is invalidated, Docker must re-execute it and every subsequent layer. Cache is not selective within a build — it is a linear chain.\n\nCorrected Dockerfile:\n```dockerfile\nFROM node:20-slim\nWORKDIR /app\nCOPY package.json package-lock.json ./   # only dep manifests\nRUN npm ci --omit=dev                    # cached unless manifests change\nCOPY . .                                 # app code copied after install\nEXPOSE 3000\nCMD [\"node\", \"src/index.js\"]\n```\n\nNow a src/index.js change invalidates only the `COPY . .` layer and those after it; npm ci is cached. A package-lock.json change invalidates npm ci — as expected, since deps changed.",
    commonMistakes: [
      "Placing COPY . . before COPY package.json — COPY instructions are evaluated in order; the second COPY overwrites the first, and you still copy everything before npm ci.",
      "Using COPY package*.json ./ — the glob matches both package.json and package-lock.json, which is correct; just ensure package-lock.json exists (npm ci requires it).",
      "Believing RUN layer cache is invalidated based on the command text alone — Docker also considers every layer that precedes it; a changed preceding layer always breaks the chain.",
    ],
    followUpQuestions: [
      "How would you add a BuildKit cache mount (`--mount=type=cache,target=/root/.npm`) to further speed up builds when the lock file changes?",
      "If the Dockerfile uses COPY --chown=node:node . ., does the chown flag affect cache behavior?",
    ],
    rubric: [
      { criterion: "Per-line cache verdict", description: "Correctly identifies COPY . . as the first invalidated layer with the reason, and marks all subsequent layers as also invalidated." },
      { criterion: "Corrected ordering", description: "Copies package files first, installs, then copies application code." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/build/cache/",
      "https://docs.docker.com/reference/dockerfile/#copy",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "dockerfile-cache-invalidation-trace",
    title: "Which Layers Hit the Cache?",
    type: "debugging",
    difficulty: "easy",
    topics: ["docker", "dockerfile", "layer-cache", "build-invalidation"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKERFILE_LAYERS],
    lessonIds: [LAYERS_CONCEPT_LESSON],
    confidenceLevel: "warmup",
    prompt:
      "A Python service has this Dockerfile:\n\n```dockerfile\n# Step 1\nFROM python:3.12-slim\n# Step 2\nWORKDIR /app\n# Step 3\nCOPY requirements.txt .\n# Step 4\nRUN pip install --no-cache-dir -r requirements.txt\n# Step 5\nCOPY src/ src/\n# Step 6\nCOPY config/ config/\n# Step 7\nCMD [\"python\", \"src/main.py\"]\n```\n\nFor each of the four changes below, state which step is the **first** to be invalidated and which steps are subsequently rebuilt. No other files change between builds.\n\n**Change A:** A developer edits `src/api/routes.py`.\n\n**Change B:** A new package is added to `requirements.txt`.\n\n**Change C:** A value is updated in `config/settings.yaml`.\n\n**Change D:** The base image `python:3.12-slim` is updated upstream (the digest changes).",
    constraints:
      "For each change, give: (1) the step number that first invalidates, (2) the steps that must rebuild, (3) the steps that use the cache. Do not say 'it depends' — commit to a specific step number and justify.",
    hints: [
      "COPY invalidates when the content of any copied file or directory changes, not just the file name.",
      "A RUN instruction is always re-executed if any preceding layer was invalidated, regardless of whether the command text changed.",
      "FROM is step 1; if the image digest changes (even if the tag is the same), step 1 is invalidated.",
    ],
    solutionOutline:
      "Change A (src/api/routes.py changes): First invalidated: Step 5 (COPY src/ src/). Rebuilt: Steps 5, 6, 7. Cached: Steps 1–4. The requirements.txt layer (step 3) and pip install (step 4) are untouched.\n\nChange B (requirements.txt changes): First invalidated: Step 3 (COPY requirements.txt .). Rebuilt: Steps 3, 4, 5, 6, 7. Cached: Steps 1–2. pip install must re-run because its input layer changed.\n\nChange C (config/settings.yaml changes): First invalidated: Step 6 (COPY config/ config/). Rebuilt: Steps 6, 7. Cached: Steps 1–5. The config copy is separate from src and appears after pip install, so only CMD is rebuilt after it.\n\nChange D (base image digest changes): First invalidated: Step 1 (FROM python:3.12-slim). Rebuilt: Steps 1–7 — the entire image is rebuilt. Even though the requirements.txt has not changed, Docker cannot reuse layers built on a different parent layer because the parent hash is part of every layer's cache key.",
    commonMistakes: [
      "Saying step 4 (pip install) is invalidated by Change A — it is not; pip install is only re-run when a layer it depends on changes, and COPY src changes steps 5 onward.",
      "Saying Change D only invalidates FROM but the rest stays cached — all layers embed their parent's hash; changing the base invalidates everything derived from it.",
      "Counting step numbers wrong: WORKDIR is a Dockerfile instruction with its own layer even though it copies no files.",
    ],
    followUpQuestions: [
      "If you use `docker build --no-cache`, which steps are invalidated?",
      "Two developers build the same Dockerfile on different machines. Will their layer caches be compatible, and under what condition could they share cache?",
    ],
    rubric: [
      { criterion: "Correct first-invalidated step", description: "All four changes identify the correct first-invalidated step with the right mechanism." },
      { criterion: "Chain propagation", description: "Correctly identifies all downstream steps as rebuilt and all upstream steps as cached." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: ["https://docs.docker.com/build/cache/"],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  // ── dockerfiles-image-layers core ─────────────────────────────────────────

  {
    slug: "dockerfile-multi-stage-conversion",
    title: "Convert a Single-Stage Build to Multi-Stage",
    type: "write_code",
    difficulty: "medium",
    topics: ["docker", "dockerfile", "multi-stage-builds", "image-size", "build-tools"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 30,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKERFILE_LAYERS],
    lessonIds: [LAYERS_WALKTHROUGH_LESSON],
    confidenceLevel: "core",
    prompt:
      "A Go service's Dockerfile produces a 1.2 GB image that includes the Go compiler, build cache, and all intermediate files. The service binary itself is 18 MB and has no runtime dependencies beyond a CA certificate bundle.\n\n```dockerfile\nFROM golang:1.22\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server\nEXPOSE 8080\nCMD [\"/app/server\"]\n```\n\nRewrite this as a multi-stage Dockerfile that:\n1. Produces a final image under 25 MB.\n2. Preserves dependency caching (go mod download should not re-run on code-only changes).\n3. Runs as a non-root user in the final image.\n4. Includes CA certificates for outbound TLS connections.\n\nFor each stage, name it, explain its purpose, and justify why any file is or is not copied to the next stage.",
    constraints:
      "Use `FROM scratch` or `gcr.io/distroless/static` as the final base. The final image must not contain the Go toolchain, go.mod, source files, or build cache. Show the complete Dockerfile. The non-root user must be a static UID/GID (not a named user that might not exist in the minimal base).",
    hints: [
      "Multi-stage builds use `FROM image AS name` and `COPY --from=name` to copy artifacts between stages.",
      "FROM scratch has no shell, no libc, no CA certs, and no users — everything needed must be explicitly copied from build stages.",
      "A statically linked Go binary (CGO_ENABLED=0) has no libc dependency and can run in scratch; only the binary and CA bundle are needed.",
    ],
    solutionOutline:
      "```dockerfile\n# Stage 1: dependency download — cached separately from source\nFROM golang:1.22 AS deps\nWORKDIR /build\nCOPY go.mod go.sum ./\nRUN go mod download\n\n# Stage 2: build — copies source and compiles\nFROM deps AS builder\nCOPY . .\nRUN CGO_ENABLED=0 GOOS=linux go build \\\n    -ldflags='-w -s' \\\n    -o /out/server ./cmd/server\n\n# Stage 3: minimal runtime image\nFROM gcr.io/distroless/static:nonroot AS runtime\nCOPY --from=builder /out/server /server\nEXPOSE 8080\nUSER 65532:65532\nENTRYPOINT [\"/server\"]\n```\n\nStage rationale:\n- Stage 1 (deps): copies only go.mod and go.sum and runs go mod download. This layer is cached whenever module files are unchanged; a code-only edit does not invalidate it.\n- Stage 2 (builder): inherits from deps (reusing the download layer) and builds the binary. -ldflags='-w -s' strips debug info, reducing binary size from ~25 MB to ~18 MB.\n- Stage 3 (runtime): gcr.io/distroless/static already includes CA certificates (/etc/ssl/certs) and a /etc/passwd with uid 65532 (nonroot). The :nonroot tag configures USER 65532 by default; the explicit USER line is belt-and-suspenders. Only the compiled binary is copied — the Go toolchain, source, and module cache never appear in this stage. Final image size: base ~3 MB + binary ~18 MB = ~21 MB.\n\nNon-root: USER 65532:65532 uses a static numeric UID/GID that exists in the distroless /etc/passwd. On scratch, you would need to COPY a passwd file to define the user.",
    commonMistakes: [
      "COPY . . in the deps stage — this defeats the cache split; code changes would invalidate the go mod download layer.",
      "Using FROM scratch without copying /etc/ssl/certs — outbound TLS connections fail with 'certificate signed by unknown authority'.",
      "Using USER nonroot (by name) in a FROM scratch image — there is no /etc/passwd, so the name lookup fails at startup; use the numeric UID.",
    ],
    followUpQuestions: [
      "How would the Dockerfile change for a service that uses CGO (requires libc at runtime) — which base image would you use instead of scratch?",
      "If the build stage needs private Go modules, how do you provide SSH keys or a GONOSUMCHECK environment variable without baking credentials into an image layer?",
    ],
    rubric: [
      { criterion: "Correct multi-stage structure", description: "Three stages named: deps (mod download), builder (compile), runtime (scratch/distroless)." },
      { criterion: "Dependency cache split", description: "go.mod/go.sum copied and downloaded in a separate stage before source is added." },
      { criterion: "Non-root and CA certs", description: "Final image runs as numeric UID 65532, and CA certificates are present for TLS." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/build/building/multi-stage/",
      "https://github.com/GoogleContainerTools/distroless",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  {
    slug: "dockerfile-image-size-diagnosis",
    title: "Track Down a 2.3 GB Image",
    type: "debugging",
    difficulty: "medium",
    topics: ["docker", "dockerfile", "image-size", "layer-analysis", "multi-stage"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 28,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKERFILE_LAYERS],
    lessonIds: [LAYERS_WALKTHROUGH_LESSON],
    confidenceLevel: "core",
    prompt:
      "A team's Python ML service image weighs 2.3 GB. The service processes inference requests and runs `model.predict()`; the model file is 250 MB. Here is the Dockerfile and the output of `docker history`:\n\n```dockerfile\nFROM python:3.12\nWORKDIR /app\nRUN apt-get update && apt-get install -y build-essential git curl\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY model/ model/\nCOPY src/ src/\nRUN rm -rf /root/.cache/pip\nCMD [\"python\", \"src/serve.py\"]\n```\n\n`docker history my-ml-service:latest` (abbreviated):\n```\nIMAGE      CREATED  SIZE    CREATED BY\n...        ...      0B      CMD [...]\n...        ...      0B      RUN rm -rf /root/.cache/pip\n...        ...      1.1GB   COPY model/ model/   ← suspicious\n...        ...      410MB   RUN pip install -r requirements.txt\n...        ...      180MB   RUN apt-get install ...\n...        ...      0B      COPY requirements.txt .\n...        ...      0B      WORKDIR /app\n...        ...      1.01GB  FROM python:3.12\n```\n\nIdentify the three main contributors to the 2.3 GB total, explain a specific problem with how the Dockerfile tries to reclaim space, and write a remediation plan (you do not need to write the full Dockerfile, but describe each change).",
    constraints:
      "Name the three layer sizes from the history output. For the 'reclaim space' problem, explain why deleting files in a later layer does not reduce image size. For the remediation, identify at least two layer-reduction strategies and estimate the target size.",
    hints: [
      "Docker images are a stack of read-only layers; deleting a file in a later layer adds a 'whiteout' marker but the file's bytes remain in the earlier layer.",
      "The model COPY is 1.1 GB but the model is only 250 MB — what else might be in model/?",
      "Combining apt-get update, install, and cleanup into a single RUN layer ensures deleted files do not persist in the image.",
    ],
    solutionOutline:
      "Three main contributors:\n1. python:3.12 base image: 1.01 GB — python:3.12 is a full Debian image with the complete Python ecosystem. python:3.12-slim cuts this to ~130 MB.\n2. RUN pip install: 410 MB — large ML dependencies (numpy, scipy, PyTorch or similar) are typical; reducing or replacing them is a workload change, but pip cache can be excluded.\n3. COPY model/ model/: 1.1 GB — model/ likely contains not just the 250 MB model file but also training checkpoints, test fixtures, or dataset files that should not be in the image.\n\nThe 'reclaim space' problem: `RUN rm -rf /root/.cache/pip` creates a new layer with 0B delta, but the 410 MB pip cache still exists in the preceding pip install layer. Layers are immutable; a later layer can only add a 'whiteout' (deletion marker) that hides the file from the union filesystem view, but the bytes count toward the image's total size. Fix: combine the pip install and cleanup into a single RUN command so the cache never becomes part of any layer.\n\nRemediation plan:\n1. Switch base to python:3.12-slim (saves ~880 MB).\n2. Combine apt-get update, install, and cleanup: `RUN apt-get update && apt-get install -y build-essential git curl && rm -rf /var/lib/apt/lists/*` — all in one RUN so cleanup is in the same layer as the install.\n3. Use pip install --no-cache-dir to never write the pip cache to disk, eliminating the cleanup step.\n4. Audit model/ directory and add a .dockerignore to exclude checkpoints, test data, and any file not needed at inference time — target model/ layer ~250 MB.\n5. Consider multi-stage: compile C extensions in a build stage, copy only runtime artifacts.\nEstimated target: ~130 (slim base) + ~380 (cleaned pip) + ~250 (model only) + ~50 (apt packages, cleaned) + ~10 (src) ≈ 820 MB, a 65% reduction.",
    commonMistakes: [
      "Adding `RUN rm -rf ...` as a separate layer — this is the core mistake the Dockerfile already makes; the fix is to chain it into one RUN with &&.",
      "Switching to alpine base without checking whether ML libraries have pre-compiled wheels for musl libc — alpine uses musl, and many PyPI wheels require glibc.",
      "Ignoring the model/ size by assuming 'the model is 250 MB' — the 1.1 GB layer shows additional files that need to be audited and excluded.",
    ],
    followUpQuestions: [
      "How would a .dockerignore file help here, and what patterns would you add to exclude training artifacts?",
      "For a model that changes frequently but dependencies rarely, what layer ordering maximizes cache reuse?",
    ],
    rubric: [
      { criterion: "Three contributors named", description: "Identifies base image (1.01 GB), pip install (410 MB), and model/ copy (1.1 GB) with correct sizes from the history." },
      { criterion: "Layered deletion explained", description: "Explains whiteout markers and why rm in a separate layer does not reclaim space." },
      { criterion: "Remediation plan", description: "Covers base image switch, single-RUN cleanup, --no-cache-dir, and model/ audit with an estimated target size." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/build/building/best-practices/",
      "https://docs.docker.com/reference/dockerfile/#dockerignore-file",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── dockerfiles-image-layers challenge ────────────────────────────────────

  {
    slug: "dockerfile-build-reproducibility",
    title: "Design a Reproducible Docker Build",
    type: "write_code",
    difficulty: "hard",
    topics: ["docker", "dockerfile", "reproducibility", "pinning", "supply-chain", "build-determinism"],
    targetRoles: ["infrastructure_swe", "platform_engineer", "backend_swe"],
    companyStyles: ["big_tech", "infra_heavy", "startup"],
    estimatedMinutes: 40,
    pathIds: [INFRA_PATH],
    moduleIds: [DOCKERFILE_LAYERS],
    lessonIds: [LAYERS_WALKTHROUGH_LESSON],
    confidenceLevel: "challenge",
    prompt:
      "A security audit finds that your service image is not reproducible: rebuilding from the same source code on the same day sometimes produces a different image digest. The current Dockerfile:\n\n```dockerfile\nFROM node:lts\nWORKDIR /app\nCOPY package.json .\nRUN npm install\nCOPY . .\nRUN npm run build\nCMD [\"node\", \"dist/server.js\"]\n```\n\nIdentify every source of non-determinism in this Dockerfile (there are at least four distinct sources). For each, explain the risk and provide the concrete fix. Then write the hardened Dockerfile that addresses all of them. Close with an explanation of why a reproducible image digest matters for a production deployment pipeline.",
    constraints:
      "Address each non-determinism source separately. The fixed Dockerfile must pin the base image by digest (show the syntax). Use `npm ci` instead of `npm install`. Base image pinning must use SHA256 digest, not just a version tag. Explain the supply-chain risk for each unfixed source.",
    hints: [
      "A floating tag like `node:lts` can resolve to different image digests across builds even on the same day.",
      "npm install updates package-lock.json and can pick different versions of unlocked transitive dependencies; npm ci uses the lock file exactly.",
      "RUN apt-get update without pinned package versions fetches whatever is current — different on different days.",
    ],
    solutionOutline:
      "Non-determinism sources:\n\n1. **Floating base image tag** (`node:lts`): The `lts` tag moves forward as Node.js releases new LTS versions. A build today and tomorrow may pull different digests, introducing different OS patches or Node.js versions. Supply-chain risk: a compromised or accidentally updated upstream image silently changes your runtime. Fix: pin by digest:\n```dockerfile\nFROM node:22.4.0-slim@sha256:<digest>\n```\nGet the digest with: `docker buildx imagetools inspect node:22.4.0-slim --format '{{.Manifest.Digest}}'`.\n\n2. **`npm install` instead of `npm ci`**: npm install resolves package-lock.json but can also upgrade unlocked ranges and rewrite the lock file. npm ci installs exactly the versions in package-lock.json and fails if the lock is out of sync. Supply-chain risk: a transitive dependency with a new vulnerability or breaking change is silently installed. Fix: `RUN npm ci --omit=dev`.\n\n3. **No package-lock.json in the COPY**: if only package.json is copied before `RUN npm install`, the lock file is not present and npm install creates a fresh one using current registry versions. Fix: `COPY package.json package-lock.json ./`.\n\n4. **Build timestamp / environment variables leaking into the build**: `npm run build` may embed a build timestamp, git commit, or environment variable into the bundle output. Fix: use deterministic build flags where the bundler supports them, and pass `--ignore-engines` or fixed environment variables in the Dockerfile: `ENV NODE_ENV=production`.\n\nHardened Dockerfile:\n```dockerfile\nFROM node:22.4.0-slim@sha256:abc123def456...  # replace with actual digest\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package.json package-lock.json ./\nRUN npm ci --omit=dev\nCOPY . .\nRUN npm run build\nCMD [\"node\", \"dist/server.js\"]\n```\n\nWhy reproducibility matters for production deployments: if the image digest is reproducible, you can sign the digest (e.g., with Cosign/Sigstore), store it in a deployment manifest, and verify at deploy time that exactly the same bits are running. A non-reproducible build means two deploys from the same git SHA may run different code — undermining rollback (you cannot be sure `git revert` + rebuild produces the same image you are reverting to) and attestation (your CI's security scan was on image A but production runs image B).",
    commonMistakes: [
      "Pinning the tag version number (node:22.4.0) but not the digest — a tag can be force-pushed to a different digest on Docker Hub.",
      "Copying package.json and running npm ci without also copying package-lock.json — npm ci requires the lock file to be present or it exits with an error.",
      "Treating build reproducibility as a 'nice to have' — a non-reproducible image means the security scan artifact is not the same as the deployed artifact.",
    ],
    followUpQuestions: [
      "How would you automate base image digest updates in CI (e.g., using Renovate or Dependabot) so pinned digests do not drift too far behind security patches?",
      "What is a Software Bill of Materials (SBOM) and how does a reproducible image make it more trustworthy?",
    ],
    rubric: [
      { criterion: "Four non-determinism sources", description: "Identifies floating tag, npm install, missing lock file copy, and at least one more (timestamp, env, or apt) with supply-chain risks." },
      { criterion: "Digest pinning syntax", description: "Uses FROM image@sha256:<digest> format and explains how to obtain the digest." },
      { criterion: "Reproducibility rationale", description: "Connects reproducibility to signing, attestation, and deployment rollback confidence." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://docs.docker.com/build/building/best-practices/",
      "https://docs.npmjs.com/cli/v10/commands/npm-ci",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
