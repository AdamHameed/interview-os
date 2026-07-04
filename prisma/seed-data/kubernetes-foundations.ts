import { defineProblems, DOCS_INSPIRED_NOTE } from "./types";
import { learningModuleId, learningPathId, lessonId } from "../../src/lib/learning";

const INFRA_PATH = learningPathId("infrastructure-swe");
const K8S_FUND = learningModuleId("kubernetes-fundamentals");
const PODS_SVCS = learningModuleId("pods-deployments-services");
const K8S_CONCEPT = lessonId(K8S_FUND, "kubernetes-fundamentals-concept");
const K8S_WALKTHROUGH = lessonId(K8S_FUND, "kubernetes-fundamentals-walkthrough");
const PODS_CONCEPT = lessonId(PODS_SVCS, "kubernetes-pods-deployments-services");
const PODS_WALKTHROUGH = lessonId(PODS_SVCS, "pods-deployments-services-walkthrough");

export const kubernetesFoundationProblems = defineProblems([
  // ── kubernetes-fundamentals warmups ────────────────────────────────────────

  {
    slug: "k8s-control-plane-components",
    title: "Match Each Control Plane Component to Its Role",
    type: "read_code",
    difficulty: "easy",
    topics: ["kubernetes", "control-plane", "etcd", "api-server", "scheduler"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [K8S_FUND],
    lessonIds: [K8S_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "Match each Kubernetes control plane component to its primary responsibility. For each component, also describe what would happen to the cluster if that component went down.\n\nComponents:\n1. **kube-apiserver**\n2. **etcd**\n3. **kube-controller-manager**\n4. **kube-scheduler**\n5. **kubelet** (on each worker node)\n\nResponsibilities (one per component):\n- A. Watches the API server for unscheduled Pods and assigns them to nodes based on resource availability, affinity rules, and taints/tolerations.\n- B. Stores all cluster state as key-value pairs; the only stateful component of the control plane.\n- C. Runs a reconciliation loop for each resource type (Deployments, ReplicaSets, Nodes), comparing desired state to actual state and taking corrective action.\n- D. Acts as the front door: all kubectl commands, internal component communications, and webhook callbacks go through it; validates and stores objects in etcd.\n- E. Runs on every worker node; watches for Pods assigned to its node and starts, stops, or restarts containers to match the spec.",
    constraints:
      "For the 'what breaks' part: describe what cluster operations become impossible when each component is down, and whether already-running workloads continue or stop. Your answer should distinguish between 'no new changes can happen' and 'existing pods crash'.",
    hints: [
      "etcd is the source of truth; losing it is like losing the database of the entire cluster.",
      "Running pods are managed by the kubelet, which is not part of the control plane — they continue running even if the API server is down.",
      "The scheduler only assigns Pods to nodes; the kubelet is what actually starts the containers.",
    ],
    solutionOutline:
      "1D: kube-apiserver — the REST gateway. All reads and writes to cluster state pass through it. If the API server goes down: kubectl stops working, no new Pods can be created or deleted, no deployments can roll out. Critically: **existing pods continue running** — the kubelet holds the pod spec locally and manages the container lifecycle independently.\n\n2B: etcd — the cluster database. If etcd goes down (or loses quorum in a multi-member setup): the API server cannot read or write state. Operations that don't require etcd reads (kubelet reconciling already-known pods) may continue briefly, but the cluster cannot schedule new Pods or reconcile changes. Backups are critical; etcd loss = cluster state loss.\n\n3C: kube-controller-manager — the reconciliation engine. Hosts many controllers: ReplicaSet controller (maintains Pod count), Node controller (marks nodes NotReady on heartbeat failure), Endpoints controller (keeps Service → Pod IP mappings current), and more. If it goes down: no automatic healing — if a Pod crashes, the ReplicaSet controller doesn't restart it. Existing running Pods are fine; self-healing stops.\n\n4A: kube-scheduler — assigns Pods to nodes. If it goes down: new Pods remain in Pending state forever (no node assigned). Running Pods are unaffected; Pods that exist but are Pending stay Pending.\n\n5E: kubelet — the node agent. If the kubelet on one worker node goes down: the API server marks the node NotReady after the heartbeat timeout (~40 s default). The node controller may evict Pods from that node after a toleration period (~5 min). The kubelet is what actually communicates with the container runtime (containerd) to start and stop containers.",
    commonMistakes: [
      "Saying 'if the API server goes down, pods crash' — kubelet manages pod lifecycle locally; existing pods survive a temporary API server outage.",
      "Confusing scheduler and controller-manager — the scheduler assigns pods to nodes; controllers ensure the desired count of replicas exists.",
      "Not mentioning etcd quorum — in a 3-member etcd cluster, losing 2 members loses quorum and makes the cluster read-only or unavailable.",
    ],
    followUpQuestions: [
      "How does a multi-master Kubernetes cluster use leader election between control plane replicas, and which components participate in it?",
      "What is a Node's heartbeat mechanism, and how does the node controller decide a node has failed?",
    ],
    rubric: [
      { criterion: "All five correct", description: "Matches all five components to their responsibilities accurately." },
      { criterion: "Running pods survive", description: "Correctly states that existing pods continue running when the API server or scheduler goes down." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/architecture/",
      "https://kubernetes.io/docs/concepts/architecture/nodes/#heartbeats",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "kubectl-apply-trace",
    title: "Trace What Happens After kubectl apply",
    type: "read_code",
    difficulty: "easy",
    topics: ["kubernetes", "kubectl", "control-plane", "reconciliation", "desired-state"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [K8S_FUND],
    lessonIds: [K8S_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "You run the following command:\n\n```bash\nkubectl apply -f deployment.yaml\n```\n\nThe YAML declares a Deployment with `replicas: 3` for an `api-server:v2` image. The cluster currently has 0 replicas of this Deployment.\n\nPut the following events in the correct order and briefly explain what each event accomplishes:\n\n**A.** The kubelet on worker-node-2 pulls the `api-server:v2` image and starts a container via the container runtime (containerd).\n\n**B.** The kube-scheduler sees a Pending Pod with no `spec.nodeName` and assigns it to `worker-node-2`.\n\n**C.** The kube-apiserver validates the Deployment manifest and writes it to etcd.\n\n**D.** The ReplicaSet controller sees 0 Pods matching the selector and creates 3 Pod objects in etcd.\n\n**E.** The Deployment controller sees the new Deployment object, computes the desired ReplicaSet, and creates a ReplicaSet object.\n\n**F.** The Pod's status transitions to Running and the Deployment's `readyReplicas` counter increments.",
    constraints:
      "Order all six events. Two of them (A and F) repeat three times (once per pod), but answer for one pod. After ordering, identify the single component that decides how the cluster should change (desired state → action), versus the component that executes the change.",
    hints: [
      "kubectl send the manifest to the API server first — nothing else can happen until the API server accepts and stores the object.",
      "The controller-manager hosts multiple controllers; the Deployment controller and the ReplicaSet controller are two of them, and they run in sequence.",
      "The scheduler runs after Pods exist but before any kubelet can start them.",
    ],
    solutionOutline:
      "Correct order: **C → E → D → B → A → F**\n\nC: The API server validates the manifest (schema, admission webhooks, RBAC) and writes the Deployment object to etcd. This is the authoritative record of desired state.\n\nE: The Deployment controller (running inside kube-controller-manager) watches for Deployment objects. It reconciles: desired state = ReplicaSet with replicas:3 and image:v2. It creates the ReplicaSet object in etcd.\n\nD: The ReplicaSet controller watches for ReplicaSet objects. It reconciles: desired = 3 pods, actual = 0. It creates 3 Pod objects in etcd. Each Pod has `spec.containers` set but no `spec.nodeName` — they are Pending.\n\nB: The scheduler watches for Pods with no `spec.nodeName`. It evaluates nodes (resources, affinity, taints), picks worker-node-2, and patches the Pod's `spec.nodeName = worker-node-2`. The Pod is now Scheduled but still not running.\n\nA: The kubelet on worker-node-2 watches for Pods assigned to its node. It sees the new Pod, contacts containerd to pull the image and start the container. The kubelet updates the Pod's status in etcd.\n\nF: Once the container passes its readiness probe (or starts successfully if no probe is configured), the kubelet sets the Pod's condition Ready=True. The ReplicaSet controller sees one more ready Pod; the Deployment controller increments readyReplicas.\n\nDesired state → action: the controller-manager (Deployment and ReplicaSet controllers). Executes the change: the kubelet (and the container runtime it calls). This separation is Kubernetes' reconciliation architecture — controllers decide, kubelets do.",
    commonMistakes: [
      "Placing B (scheduler) before D (ReplicaSet controller creates pods) — the scheduler cannot assign a pod that does not yet exist.",
      "Saying kubectl runs the container — kubectl only sends the manifest to the API server; the kubelet is what starts containers.",
      "Confusing the Deployment controller with the ReplicaSet controller — they are separate controllers that run in sequence, not one thing.",
    ],
    followUpQuestions: [
      "If you `kubectl delete pod <name>` on one of the three pods, which component is responsible for creating a replacement, and how quickly does it act?",
      "What is an admission webhook, and at which step in this sequence does it fire?",
    ],
    rubric: [
      { criterion: "Correct order", description: "C → E → D → B → A → F, with explanations for each step." },
      { criterion: "Control vs execution", description: "Correctly identifies controller-manager as the 'desired state' engine and kubelet as the executor." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/architecture/controller/",
      "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  // ── kubernetes-fundamentals core ───────────────────────────────────────────

  {
    slug: "k8s-crashloopbackoff-diagnosis",
    title: "Diagnose and Fix a CrashLoopBackOff",
    type: "debugging",
    difficulty: "medium",
    topics: ["kubernetes", "crashloopbackoff", "kubectl", "pod-lifecycle", "debugging"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 25,
    pathIds: [INFRA_PATH],
    moduleIds: [K8S_FUND],
    lessonIds: [K8S_CONCEPT],
    confidenceLevel: "core",
    prompt:
      "A Deployment is in CrashLoopBackOff. Here is the output from `kubectl describe pod api-pod-7f3d4-xk9p2` and `kubectl logs api-pod-7f3d4-xk9p2 --previous`:\n\n```\nkubectl describe pod api-pod-7f3d4-xk9p2\n───────────────────────────────────────────\nName:         api-pod-7f3d4-xk9p2\nNamespace:    production\nStatus:       Running\nContainers:\n  api:\n    Image:          api-server:v3\n    State:          Waiting\n      Reason:       CrashLoopBackOff\n    Last State:     Terminated\n      Reason:       Error\n      Exit Code:    1\n      Started:      Fri, 04 Jul 2026 09:12:03 +0000\n      Finished:     Fri, 04 Jul 2026 09:12:05 +0000   ← 2-second lifetime\n    Ready:          False\n    Restart Count:  8\nEvents:\n  Warning  BackOff  2m  kubelet  Back-off restarting failed container\n\nkubectl logs api-pod-7f3d4-xk9p2 --previous\n───────────────────────────────────────────\n[FATAL] 2026-07-04T09:12:05Z failed to load config: \n  environment variable DATABASE_URL is not set\n[FATAL] 2026-07-04T09:12:05Z application startup failed, exiting\n```\n\nAnswer:\n1. What does CrashLoopBackOff mean, and why does Kubernetes use exponential backoff before restarting the container?\n2. What is the immediate cause of this specific crash?\n3. Show the kubectl command to fix the problem without redeploying (assume the value is `postgres://prod-db:5432/api`).\n4. After applying the fix, show how you verify the pod recovered, without waiting minutes for the next restart cycle.",
    constraints:
      "For question 3: the fix should use a Kubernetes Secret for the database URL (not an env literal in the Deployment), but for the immediate kubectl patch to the running pod describe the ENV var patch approach. Explain why a Secret is the correct long-term approach.",
    hints: [
      "`kubectl logs --previous` shows logs from the last terminated container instance, which is essential when the pod crashes immediately.",
      "CrashLoopBackOff's backoff doubles with each restart: 10s → 20s → 40s → 80s → up to 300s. This protects the scheduler from being overwhelmed by a container that crashes instantly on every start.",
      "To inject an env var into a running pod: you cannot inject directly; you must patch the Deployment (which triggers a rollout). For the pod itself, `kubectl set env` patches the Deployment.",
    ],
    solutionOutline:
      "1. CrashLoopBackOff means the container started and exited (crashed) multiple times in a row. Kubernetes restarts it but uses exponential backoff (10 s → 20 s → 40 s → ... → 300 s max) between restarts. The backoff prevents a crashing container from hammering the scheduler, node resources, and image registry. The 2-second lifetime (Start 09:12:03, Finished 09:12:05) confirms the container crashes immediately on startup — it doesn't even reach the point of accepting connections.\n\n2. Immediate cause: the application exits with code 1 because `DATABASE_URL` is not set. The log line `environment variable DATABASE_URL is not set` is definitive. This is a **permanent failure** — the container will crash on every restart until the configuration is provided; exponential backoff eventually slows it to restarting once every 5 minutes.\n\n3. Correct long-term approach:\n```bash\n# Create a Secret (base64-encodes automatically)\nkubectl create secret generic api-db-secret \\\n  --from-literal=DATABASE_URL='postgres://prod-db:5432/api' \\\n  --namespace=production\n\n# Patch the Deployment to use the Secret\nkubectl set env deployment/api-deployment \\\n  --from=secret/api-db-secret \\\n  --namespace=production\n```\nThis triggers a rolling update. The new Pods receive `DATABASE_URL` from the Secret. Why a Secret: env literals in the Deployment manifest appear in plaintext in git history, CI logs, and `kubectl get deployment -o yaml`. Secrets are stored in etcd (encrypted at rest if configured) and are not included in the Deployment manifest — they are referenced by name. For production database credentials, treating the URL as a Secret is the baseline hygiene requirement.\n\n4. Verify recovery:\n```bash\n# Watch the rollout\nkubectl rollout status deployment/api-deployment -n production\n\n# Check pod status\nkubectl get pods -n production -l app=api -w\n\n# Confirm the new pod is Running and Ready, not CrashLoopBackOff\nkubectl describe pod <new-pod-name> -n production | grep -A5 'State:'\n```\nA healthy pod shows `State: Running` and `Ready: True` with Restart Count: 0. The rollout command blocks until all pods are updated and ready, which is the most reliable check.",
    commonMistakes: [
      "Saying 'restart the pod' — you cannot restart a pod directly; you delete it and the ReplicaSet controller creates a replacement, or you patch the Deployment.",
      "Using `kubectl logs` without `--previous` — if the pod is in CrashLoopBackOff and currently Waiting, the current container has no logs yet; `--previous` shows the last terminated container.",
      "Setting the env var directly in the Deployment YAML as a literal string — this is correct for debugging but wrong for secrets in production.",
    ],
    followUpQuestions: [
      "What is the difference between a ConfigMap and a Secret in Kubernetes, and when would you use one vs the other for configuration values?",
      "How would you configure a liveness probe so Kubernetes kills and replaces a pod that is Running but not actually serving traffic?",
    ],
    rubric: [
      { criterion: "CrashLoopBackOff explanation", description: "Explains the restart loop and the purpose of exponential backoff (protecting cluster resources from crash-loop thrashing)." },
      { criterion: "Root cause", description: "Identifies the missing DATABASE_URL env var from the logs as a permanent startup failure." },
      { criterion: "Secret-based fix", description: "Uses kubectl create secret and kubectl set env --from, explaining why Secrets are preferred over inline env literals." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/",
      "https://kubernetes.io/docs/concepts/configuration/secret/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "k8s-resource-requests-limits",
    title: "Configure Resource Requests and Limits for a Mixed Workload",
    type: "write_code",
    difficulty: "medium",
    topics: ["kubernetes", "resources", "requests", "limits", "oomkilled", "cpu-throttling", "qos"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 28,
    pathIds: [INFRA_PATH],
    moduleIds: [K8S_FUND],
    lessonIds: [K8S_CONCEPT],
    confidenceLevel: "core",
    prompt:
      "A Node.js API server pod is being deployed. Profiling shows:\n- CPU: baseline 200m (0.2 cores), spikes to 800m during request bursts, idle at 50m\n- Memory: baseline 400 MiB, peak 600 MiB during GC pressure, never observed above 700 MiB\n\nNodes in the cluster have 4 CPUs and 8 GiB memory each.\n\nComplete the resource section for the container spec below, and answer the follow-up questions:\n\n```yaml\ncontainers:\n- name: api\n  image: api-server:v2\n  resources:\n    requests:\n      cpu: ???\n      memory: ???\n    limits:\n      cpu: ???\n      memory: ???\n```\n\n**Follow-up questions:**\n1. What happens to the container when it exceeds its memory limit? What does the pod's status show?\n2. What happens when the container consistently uses more CPU than its CPU limit?\n3. What is Kubernetes QoS class, and which class does your configuration produce? What are the three classes?\n4. A teammate suggests setting no memory limit to 'let the pod use what it needs.' What is the risk?",
    constraints:
      "Requests must be at least baseline usage (so the scheduler can bin-pack correctly). Memory limit must be above observed peak (to avoid spurious OOMKill) but leave headroom for the scheduler to pack other pods. CPU limit should allow burst capacity but cap at a reasonable multiple. Explain your choices with the profiling data.",
    hints: [
      "CPU requests are what the scheduler uses for placement; CPU limits throttle the container if it tries to use more than the limit.",
      "Memory limits are a hard ceiling: exceeding it results in OOMKilled (exit code 137). Set the limit above the observed peak.",
      "Guaranteed QoS requires requests == limits for all containers and all resource types.",
    ],
    solutionOutline:
      "Reasonable configuration:\n```yaml\nresources:\n  requests:\n    cpu: \"200m\"       # baseline CPU — what the scheduler reserves per pod\n    memory: \"400Mi\"   # baseline memory — scheduler fits this per pod\n  limits:\n    cpu: \"1000m\"      # 1 full core — allows burst to 800m with 200m headroom\n    memory: \"750Mi\"   # above observed peak (600 MiB) with ~150 MiB safety margin\n```\n\nCPU request = 200m (baseline). Scheduler packs pods based on requests; setting request too low overpacks nodes; too high wastes capacity. CPU limit = 1000m: burst demand is 800m, so 1000m avoids throttling the common case while capping runaway consumption.\n\nMemory request = 400Mi (baseline). Memory limit = 750Mi: observed peak is 600 MiB; GC pressure can spike above that; 750Mi gives a 150 MiB safety buffer before OOMKill while being below 1024Mi (where a second pod on the 8 GiB node still fits).\n\n1. Memory limit exceeded → OOMKilled. The kernel's OOM killer terminates the container process. The pod's status shows `OOMKilled`, `Exit Code: 137` (SIGKILL from OOM), and `Last State: Terminated Reason: OOMKilled`. Kubernetes then restarts the container (per the restart policy). Repeated OOMKills → CrashLoopBackOff if memory exceeds limits on every startup.\n\n2. CPU limit exceeded → **throttling** (not termination). The Linux cgroup CPU quota mechanism throttles the container's CPU usage back to the limit. The container slows down — latency increases, requests queue — but it does not exit. CPU throttling is often invisible in pod status; you must observe it with metrics (`container_cpu_cfs_throttled_seconds_total`).\n\n3. QoS class: this configuration produces **Burstable** QoS (requests set, limits set, requests ≠ limits). The three classes: **Guaranteed** — requests == limits for every resource of every container (highest priority; last to be evicted under pressure). **Burstable** — at least one container has requests set but requests < limits, or limits are not set for some resources (middle priority). **BestEffort** — no resources set at all (first evicted under node pressure).\n\n4. No memory limit risk: the pod is BestEffort for memory. Under node memory pressure, the kubelet's eviction manager will evict BestEffort pods first to reclaim memory. More critically: if the application has a memory leak, it can consume all node memory, causing the OS to OOM-kill other pods on the same node (including pods from other deployments). A memory limit is a protection for the rest of the cluster, not just the pod.",
    commonMistakes: [
      "Setting memory request == memory limit (Guaranteed QoS) for a Node.js app — GC means memory fluctuates; equal request and limit triggers eviction at the request level, not just at the limit.",
      "Setting CPU limit = CPU request (200m) — this would throttle every request burst to 800m down to 200m, introducing severe latency under load.",
      "Saying 'CPU limit exceeded → killed' — CPU excess is throttled, not terminated; memory excess is what causes OOMKill.",
    ],
    followUpQuestions: [
      "How does the Vertical Pod Autoscaler (VPA) differ from setting manual requests and limits, and when would you use it?",
      "If your node has 4 CPUs and you set request=1000m and limit=4000m for a single-container pod, how many such pods can be scheduled on the node (scheduler-wise), and what happens if all pods burst simultaneously?",
    ],
    rubric: [
      { criterion: "Correct YAML", description: "Requests set at baseline; memory limit above observed peak; CPU limit allows burst." },
      { criterion: "OOMKilled vs throttling", description: "Correctly distinguishes exit code 137 (OOMKilled) from silent throttling for CPU." },
      { criterion: "QoS class", description: "Identifies Burstable and names all three classes with eviction order." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
      "https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── kubernetes-fundamentals challenge ─────────────────────────────────────

  {
    slug: "k8s-cluster-dns-failure",
    title: "Pods Can't Reach Each Other by Name — Diagnose DNS",
    type: "debugging",
    difficulty: "hard",
    topics: ["kubernetes", "dns", "coredns", "service-discovery", "networking", "debugging"],
    targetRoles: ["infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 35,
    pathIds: [INFRA_PATH],
    moduleIds: [K8S_FUND],
    lessonIds: [K8S_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "A checkout service pod reports that it cannot reach the payments service by DNS name. Curl and wget both time out:\n\n```\n# Inside the checkout pod:\ncurl -v http://payments-svc.production.svc.cluster.local:8080\n* Trying 10.96.200.45...\n* TCP_NODELAY set\n* Connection timed out after 30001 milliseconds\ncurl: (28) Connection timed out after 30001 milliseconds\n```\n\n```bash\nnslookup payments-svc.production.svc.cluster.local\n;; connection timed out; no servers could be reached\n```\n\nYou have the following additional observations:\n\n```bash\n# CoreDNS pods:\nkubectl get pods -n kube-system -l k8s-app=kube-dns\nNAME                       READY   STATUS    RESTARTS   AGE\ncoredns-7f4b9d4cc6-k2xpq   1/1     Running   0          3d\ncoredns-7f4b9d4cc6-m7r9j   1/1     Running   0          3d\n\n# payments-svc Service:\nkubectl get svc payments-svc -n production\nNAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE\npayments-svc   ClusterIP   10.96.200.45    <none>        8080/TCP   5d\n\n# Payments pods:\nkubectl get pods -n production -l app=payments\nNAME                        READY   STATUS    RESTARTS\npayments-7c8f9-4p2wx        1/1     Running   0\npayments-7c8f9-r5n3k        1/1     Running   0\n```\n\nThe checkout pod's `/etc/resolv.conf` inside the container:\n```\nnameserver 169.254.25.10\nsearch production.svc.cluster.local svc.cluster.local cluster.local\noptions ndots:5\n```\n\nAnswer: (1) identify the three layers of the DNS resolution path inside Kubernetes and explain what should happen at each layer; (2) diagnose what is wrong based on the evidence; (3) show the kubectl commands that would confirm your diagnosis; (4) explain the fix.",
    constraints:
      "The resolv.conf shows `nameserver 169.254.25.10` — this is the node-local DNS cache IP (NodeLocal DNSCache), not the CoreDNS ClusterIP directly. CoreDNS pods are Running. Both payments pods are Running. The payments Service exists with the correct ClusterIP. The TCP connection to the ClusterIP timed out, but DNS lookup also failed. These two facts together point to a specific component.",
    hints: [
      "The resolv.conf nameserver 169.254.25.10 is the NodeLocal DNSCache (a DaemonSet that runs a local DNS cache on each node to reduce CoreDNS load). Queries go: pod → 169.254.25.10 (node-local cache) → CoreDNS cluster IP → CoreDNS pod.",
      "CoreDNS pods are Running, which rules out CoreDNS itself crashing. The payment service ClusterIP exists. The TCP timeout to the ClusterIP — not a DNS-specific address — suggests the issue is between the pod and the node's network routing.",
      "Check whether the NodeLocal DNSCache DaemonSet pod is Running on the specific node where the checkout pod runs. A DaemonSet schedules one pod per node; if the pod is NotReady on one node, only pods on that node are affected.",
    ],
    solutionOutline:
      "DNS resolution path in Kubernetes:\n1. **Pod's resolver** reads `/etc/resolv.conf` and sends the query to `nameserver 169.254.25.10`.\n2. **NodeLocal DNSCache** (running as a DaemonSet on each node, bound to the link-local IP `169.254.25.10`) handles the query from its in-memory cache or forwards to CoreDNS.\n3. **CoreDNS** (ClusterIP `10.96.0.10`, typically) answers authoritatively for `.cluster.local` names from the Kubernetes API server's service registry.\n\nThe evidence: CoreDNS pods are Running (step 3 is fine). The payment Service and pods exist (the object to resolve exists). The nslookup says `no servers could be reached` — meaning the pod cannot reach the nameserver at `169.254.25.10`. The TCP timeout to the ClusterIP is a symptom of the DNS failure: the curl can't resolve the hostname, falls back to the IP directly, but there's also a TCP connectivity issue.\n\nDiagnosis: the **NodeLocal DNSCache pod on the node hosting the checkout pod** is not Running. Because NodeLocal DNSCache is a DaemonSet, one pod runs per node; if it is crashing or NotReady on this specific node, all pods on that node lose DNS resolution.\n\nConfirm with:\n```bash\n# Find which node hosts the checkout pod\nkubectl get pod checkout-<id> -n production -o wide\n# → NODE: worker-node-3\n\n# Check NodeLocal DNSCache on that node\nkubectl get pods -n kube-system -l k8s-app=node-local-dns \\\n  --field-selector spec.nodeName=worker-node-3\n# → Expected: 1/1 Running\n# → Actual: 0/1 CrashLoopBackOff or NotRunning\n\n# Get logs\nkubectl logs -n kube-system <node-local-dns-pod-on-worker-node-3> --previous\n```\n\nFix depends on the logs: if the NodeLocal DNS pod is OOMKilled, increase its memory limit; if it has a configuration error, check the ConfigMap; if it has a port conflict on the node, investigate what else is using `169.254.25.10:53`. As an immediate workaround: delete and restart the NodeLocal DNS pod on that node (`kubectl delete pod -n kube-system <name>`); the DaemonSet controller will recreate it.\n\nIf NodeLocal DNSCache is not in use, the alternative diagnosis is that kube-proxy or CNI is not correctly handling traffic to the ClusterIP range, but the nslookup failure points to the 169.254.25.10 nameserver more specifically.",
    commonMistakes: [
      "Blaming CoreDNS because 'DNS is broken' — CoreDNS pods are both Running; the failure is one hop before CoreDNS, at the node-local cache.",
      "Thinking the payments Service ClusterIP is wrong — the nslookup failure is DNS transport, not a bad record; if nslookup couldn't reach the nameserver, it never got to ask about the ClusterIP.",
      "Restarting all CoreDNS pods — this would have no effect on the checkout pod's nameserver 169.254.25.10, which is on the same node, not the CoreDNS pods.",
    ],
    followUpQuestions: [
      "How do you configure a pod to bypass NodeLocal DNSCache and go directly to CoreDNS, and when might you need to do this for debugging?",
      "Why does Kubernetes add `options ndots:5` to resolv.conf, and what problem does it solve (and what performance cost does it impose)?",
    ],
    rubric: [
      { criterion: "Three-layer path", description: "Identifies pod resolver → NodeLocal DNSCache → CoreDNS in order." },
      { criterion: "Node-local diagnosis", description: "Pinpoints the DaemonSet pod on the specific node as the culprit, using the 169.254.25.10 nameserver as the evidence." },
      { criterion: "Diagnostic commands", description: "Uses kubectl get pod -o wide to find the node and kubectl get pods with --field-selector spec.nodeName to check the DaemonSet pod." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/",
      "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── pods-deployments-services warmups ─────────────────────────────────────

  {
    slug: "k8s-workload-type-selection",
    title: "Choose the Right Kubernetes Workload Type",
    type: "read_code",
    difficulty: "easy",
    topics: ["kubernetes", "deployment", "statefulset", "job", "cronjob", "pod", "workloads"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [PODS_SVCS],
    lessonIds: [PODS_CONCEPT],
    confidenceLevel: "warmup",
    prompt:
      "For each of the following scenarios, choose the most appropriate Kubernetes workload type from: **Pod, Deployment, StatefulSet, Job, CronJob**. Briefly justify your choice.\n\n1. A stateless REST API server that should always have 3 replicas running and survive node failures.\n2. A PostgreSQL database instance that requires stable network identity (dns name `postgres-0`) and persistent volume that must stay bound to the same pod replica across restarts.\n3. A one-time database migration script that must run to completion exactly once when a new version deploys.\n4. A nightly report generation script that runs at 02:00 UTC every day and sends results to S3.\n5. You need to quickly test a temporary container interactively for debugging — it runs once, you connect to it, and you delete it when done.",
    constraints:
      "Name one key property or guarantee that makes your chosen type correct for the scenario, and name one type that would be wrong and why.",
    hints: [
      "StatefulSet guarantees stable pod names (postgres-0, postgres-1) and stable storage — each pod always gets the same PersistentVolume.",
      "Deployment is for stateless replicated workloads — it can replace any pod with any replica; it does not guarantee identity.",
      "Job runs to completion (exit 0); CronJob creates Jobs on a schedule.",
    ],
    solutionOutline:
      "1. **Deployment** — manages a ReplicaSet that maintains the desired replica count, performs rolling updates, and replaces failed pods. The key property: replicas are interchangeable (stateless); any pod can serve any request. Wrong choice: StatefulSet — StatefulSets are for stateful workloads with identity; using one for a stateless API adds unnecessary complexity.\n\n2. **StatefulSet** — guarantees stable network identity (postgres-0, postgres-1, ...) and stable PersistentVolumeClaims that are not deleted when a pod is replaced. The postgres-0 pod always reattaches to the same volume. Wrong choice: Deployment — Deployment pods are interchangeable; a replaced Deployment pod gets a random name and a new PVC, losing the database data.\n\n3. **Job** — runs one or more pods to completion. A Job succeeds when the pod exits 0; Kubernetes does not restart it afterward. Wrong choice: Deployment — a Deployment tries to keep pods Running; if the migration script exits 0, the Deployment would restart it in a restart loop.\n\n4. **CronJob** — creates a Job on a cron schedule. At 02:00 UTC, Kubernetes creates the Job; the Job runs the script to completion. Wrong choice: Deployment with a sleep loop — Deployments are not designed for scheduled termination; managing the schedule inside the container is fragile and invisible to Kubernetes tooling.\n\n5. **Pod** (bare pod) — a standalone pod for interactive debugging is idiomatic. `kubectl run tmp --image=busybox --restart=Never -it --rm` creates a pod, attaches, and deletes it on exit. Wrong choice: Deployment — creating a Deployment for a one-time interactive debug session creates unnecessary ReplicaSet and controller overhead, and the pod name changes on every restart.",
    commonMistakes: [
      "Using StatefulSet for the REST API — StatefulSets are heavier and provide guarantees (stable identity, ordered rollout) that a stateless API doesn't need.",
      "Using Job for the PostgreSQL database — a Job runs to completion and exits; a database must run continuously.",
      "Using Deployment for the migration script — Deployment's desired state is 'always running'; the migration would be restarted after completing.",
    ],
    followUpQuestions: [
      "A StatefulSet with replicas=3 is rolled back. What order do pods restart in, and why does this matter for a distributed database?",
      "How does a Job's `completions` field differ from `parallelism`, and when would you set parallelism > 1?",
    ],
    rubric: [
      { criterion: "All five correct", description: "Deployment / StatefulSet / Job / CronJob / Pod, each with a correct justification." },
      { criterion: "Wrong-choice reasoning", description: "Names a wrong choice for each and explains what guarantee it lacks or adds unnecessarily." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/workloads/",
      "https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  {
    slug: "k8s-service-type-selection",
    title: "Choose the Right Kubernetes Service Type",
    type: "read_code",
    difficulty: "easy",
    topics: ["kubernetes", "service", "clusterip", "nodeport", "loadbalancer", "ingress", "networking"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 15,
    pathIds: [INFRA_PATH],
    moduleIds: [PODS_SVCS],
    lessonIds: [PODS_WALKTHROUGH],
    confidenceLevel: "warmup",
    prompt:
      "For each scenario, choose the correct Kubernetes Service type from: **ClusterIP, NodePort, LoadBalancer, Headless (clusterIP: None)**. Explain one key property that makes the type correct and one that makes it wrong for the other options.\n\n1. An internal payments microservice that should only be reachable by other pods within the cluster, not from outside.\n2. A web application that needs to be accessible from the public internet with a stable DNS-resolvable hostname, running in a cloud provider (GKE/EKS/AKS).\n3. A StatefulSet of Kafka brokers where each broker pod needs its own stable DNS hostname (kafka-0.kafka-svc, kafka-1.kafka-svc) that pods can directly address.\n4. A development environment where you need to temporarily expose a service on every node's IP for local testing from your laptop without a cloud load balancer.",
    constraints:
      "For scenario 2, note that LoadBalancer gives you an IP but not a hostname with TLS termination — mention that an Ingress or a cloud-specific annotation is typically layered on top. For scenario 3, explain what a Headless Service returns in a DNS A-record query vs a standard ClusterIP Service.",
    hints: [
      "ClusterIP is the default — it gives a virtual IP only reachable from within the cluster.",
      "A Headless Service (clusterIP: None) returns individual Pod IPs from DNS instead of the ClusterIP VIP, enabling direct-to-pod addressing by name.",
      "LoadBalancer provisions a cloud load balancer and assigns an external IP — it implies ClusterIP and NodePort are also created.",
    ],
    solutionOutline:
      "1. **ClusterIP** — the default type. Creates a virtual IP only accessible from within the cluster. kube-proxy configures iptables rules so traffic to the ClusterIP is load-balanced across matching pods. The payments service should not be reachable externally; ClusterIP enforces that by design. Wrong: NodePort or LoadBalancer would expose it to external traffic unnecessarily, violating the isolation requirement.\n\n2. **LoadBalancer** — provisions a cloud load balancer with an external IP. For public internet access in a managed cloud, this is the standard approach. The cloud provider creates a load balancer that routes to the NodePort on each node. Caveat: LoadBalancer gives an IP, not a hostname. In practice: create a LoadBalancer service, then configure DNS (`api.company.com → lb-external-ip`) and add an Ingress (or cloud annotation for TLS) on top. Wrong: ClusterIP — not externally accessible. NodePort — exposes a high port number (30000–32767) on every node, requires nodes to be publicly reachable, no cloud LB.\n\n3. **Headless Service (clusterIP: None)** — when clusterIP is set to None, the Service has no virtual IP. A DNS query for `kafka-svc` returns individual pod IPs directly (one A record per pod). StatefulSet pods with a Headless Service get stable DNS names: `kafka-0.kafka-svc.namespace.svc.cluster.local`, `kafka-1.kafka-svc.namespace.svc.cluster.local`. Kafka brokers need to advertise their own hostname to clients and to each other; a shared VIP would hide individual broker identities and break broker-to-broker communication. Wrong: ClusterIP — DNS returns only the VIP; individual pod addresses are hidden behind iptables load-balancing; brokers cannot be addressed individually.\n\n4. **NodePort** — opens a static port (30000–32767) on every node's IP. Accessing `<any-node-ip>:<NodePort>` reaches the service. For local development testing when no cloud LB is available, NodePort is sufficient. Wrong: LoadBalancer — works but triggers a cloud LB provisioning that costs money and takes minutes; not appropriate for temporary local testing.",
    commonMistakes: [
      "Saying 'use Ingress' as a Service type — Ingress is not a Service type; it is a separate resource that routes HTTP traffic to Services and requires an Ingress controller.",
      "Using LoadBalancer for the internal payments service — it would expose an external IP for a service that should be cluster-internal.",
      "Saying a ClusterIP service returns pod IPs in DNS — ClusterIP returns the single virtual IP; only Headless Services return individual pod IPs.",
    ],
    followUpQuestions: [
      "How does kube-proxy implement load balancing for a ClusterIP Service — what mechanism does it use on Linux, and what are the two modes?",
      "What is an Ingress resource, and why would you use it instead of one LoadBalancer Service per application?",
    ],
    rubric: [
      { criterion: "All four correct", description: "ClusterIP / LoadBalancer / Headless / NodePort, each justified." },
      { criterion: "Headless DNS behavior", description: "Explains that Headless returns individual Pod IPs, enabling stable per-pod DNS names for StatefulSets." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/services-networking/service/",
      "https://kubernetes.io/docs/concepts/services-networking/service/#headless-services",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 4,
  },

  // ── pods-deployments-services core ────────────────────────────────────────

  {
    slug: "k8s-deployment-rollout-strategy",
    title: "Configure a Zero-Downtime Rolling Update Strategy",
    type: "write_code",
    difficulty: "medium",
    topics: ["kubernetes", "deployment", "rolling-update", "maxUnavailable", "maxSurge", "readiness-probe"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 28,
    pathIds: [INFRA_PATH],
    moduleIds: [PODS_SVCS],
    lessonIds: [PODS_WALKTHROUGH],
    confidenceLevel: "core",
    prompt:
      "You have a Deployment with `replicas: 6`. The service can handle up to 20% capacity reduction during a rollout but must never have fewer than 5 pods healthy at any time. You want the rollout to proceed as fast as possible while respecting the capacity constraint.\n\nComplete the strategy section and the readiness probe:\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  replicas: 6\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxUnavailable: ???\n      maxSurge: ???\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api-server:v2\n        readinessProbe:\n          httpGet:\n            path: ???\n            port: ???\n          initialDelaySeconds: ???\n          periodSeconds: ???\n          failureThreshold: ???\n```\n\nAfter writing the configuration, answer:\n1. Walk through the first two rollout steps — which pods are created or deleted and in what order?\n2. What happens if a new pod's readiness probe fails consistently? Does the rollout proceed?\n3. What is the difference between a readiness probe and a liveness probe? When would you use each?",
    constraints:
      "maxUnavailable must not allow fewer than 5 pods ready at any moment (6 - 1 = 5 minimum). maxSurge controls how many extra pods beyond 6 can be created; set it to the maximum that accelerates the rollout without doubling the fleet. The readiness probe path should be `/healthz` on port `3000`; choose initialDelaySeconds and failureThreshold to give a Node.js app enough startup time (~10 s) without being too conservative.",
    hints: [
      "maxUnavailable: 1 means at most 1 pod can be unavailable at a time → minimum 5 ready pods from a fleet of 6.",
      "maxSurge: 2 means up to 8 pods (6+2) can exist during the rollout, allowing 2 new pods to spin up before old ones are deleted.",
      "If a readiness probe fails, the pod is removed from the Service endpoints (traffic stops routing to it) but is NOT restarted — that is liveness probe's job.",
    ],
    solutionOutline:
      "```yaml\nstrategy:\n  type: RollingUpdate\n  rollingUpdate:\n    maxUnavailable: 1   # ensures minimum 5/6 pods always available\n    maxSurge: 2         # creates 2 new pods before deleting 1 old pod\nreadinessProbe:\n  httpGet:\n    path: /healthz\n    port: 3000\n  initialDelaySeconds: 10  # wait for Node.js startup\n  periodSeconds: 5         # probe every 5 seconds\n  failureThreshold: 3      # 3 consecutive failures = not ready\n```\n\nmaxUnavailable=1: only 1 pod can be unavailable at a time; with 6 total, minimum 5 are always ready — satisfies the ≥5 constraint. maxSurge=2: up to 2 extra pods can exist above the desired 6 (total 8 at most), so 2 new-version pods start before any old-version pods are deleted — the rollout takes 3 waves instead of 6.\n\n1. Rollout steps:\n- Wave 1: Create 2 new pods (now 8 total: 6 old + 2 new pending). Wait for new pods to become Ready. Once 2 new pods are Ready (8 ready), delete 2 old pods → 6 total (2 new + 4 old), still 6 ready → constraint satisfied.\n- Wave 2: Create 2 more new pods (8 total: 4 new + 4 old). Wait for Ready. Delete 2 old pods → 6 total (4 new + 2 old). Ready count stays ≥ 5 throughout.\n- Wave 3: Create 2 more new pods (8 total). Delete last 2 old. Rollout complete with 6 new-version pods.\n\n2. If a new pod's readiness probe fails consistently: the pod is never marked Ready and is never added to the Service's endpoint slice. The rollout controller sees fewer Ready pods than desired and pauses — it will not delete old pods (that would reduce available capacity below the minimum). The rollout stalls indefinitely with a mix of old and new pods. You can inspect with `kubectl rollout status deployment/api` (shows 'waiting for rollout to finish') and `kubectl describe pod <new-pod>` (shows probe failure events). Fix the underlying issue, then either push a corrected image or roll back with `kubectl rollout undo deployment/api`.\n\n3. Readiness probe vs liveness probe:\n- **Readiness probe:** determines whether the pod is ready to receive traffic. A failing readiness probe removes the pod from Service endpoints but does not restart the container. Use for: startup warmup (wait for cache load, DB connection pool), temporary overload (shed traffic while overloaded), graceful startup (don't route before the server is listening).\n- **Liveness probe:** determines whether the container is alive. A failing liveness probe triggers a container restart. Use for: detecting deadlocks (server is running but not responding to requests), detecting stuck processes that will never recover without a restart. Rule of thumb: if the condition is transient and the app will recover on its own, use readiness. If the condition is fatal and the app needs a restart to recover, use liveness.",
    commonMistakes: [
      "Setting maxUnavailable: 2 — this allows only 4 pods ready from 6, violating the ≥5 constraint.",
      "Setting maxSurge: 0 — this means no extra pods can be created, so the rollout must delete one old pod before creating one new pod; it is slower and reduces capacity to 5/6 first.",
      "Confusing readiness and liveness — adding a liveness probe with the same path and threshold as readiness causes the pod to restart when it is temporarily overloaded, creating a restart storm under load.",
    ],
    followUpQuestions: [
      "How would you use `kubectl rollout pause` and `kubectl rollout resume` to implement a canary rollout with this Deployment, and what limitation does this approach have?",
      "What is the `minReadySeconds` field on a Deployment, and how does it interact with maxUnavailable during a rolling update?",
    ],
    rubric: [
      { criterion: "Correct parameters", description: "maxUnavailable=1, maxSurge≥1 (2 is optimal); readiness probe with realistic initialDelaySeconds and failureThreshold." },
      { criterion: "Rollout walkthrough", description: "Describes wave-by-wave pod creation and deletion with Ready counts tracked." },
      { criterion: "Probe distinction", description: "Correctly distinguishes readiness (traffic routing) from liveness (restart trigger) with a use-case example for each." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment",
      "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  {
    slug: "k8s-service-selector-mismatch",
    title: "Service Is Not Routing to Any Pods — Fix the Selector",
    type: "debugging",
    difficulty: "medium",
    topics: ["kubernetes", "service", "selector", "labels", "endpoints", "debugging"],
    targetRoles: ["infrastructure_swe", "backend_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "startup", "infra_heavy"],
    estimatedMinutes: 22,
    pathIds: [INFRA_PATH],
    moduleIds: [PODS_SVCS],
    lessonIds: [PODS_CONCEPT],
    confidenceLevel: "core",
    prompt:
      "A team deployed a new version of the payments service. The Deployment is healthy — 3/3 pods Running. But the `payments-svc` Service shows `<none>` endpoints, and callers get connection refused:\n\n```bash\nkubectl get endpoints payments-svc -n production\nNAME           ENDPOINTS   AGE\npayments-svc   <none>      5d\n```\n\nHere is the Service YAML:\n```yaml\napiVersion: v1\nkind: Service\nmetadata:\n  name: payments-svc\n  namespace: production\nspec:\n  selector:\n    app: payments\n    version: stable\n  ports:\n  - port: 8080\n    targetPort: 3000\n```\n\nHere are the labels on the running pods (from `kubectl get pods -n production --show-labels`):\n```\nNAME                          LABELS\npayments-7c8f9-4p2wx          app=payments,version=v2\npayments-7c8f9-r5n3k          app=payments,version=v2\npayments-7c8f9-xk9m2          app=payments,version=v2\n```\n\nAnswer:\n1. Identify the exact cause of the `<none>` endpoints.\n2. Show two different kubectl commands to fix this without restarting pods, and explain the tradeoff between them.\n3. Explain how Kubernetes's Endpoints controller uses label selectors — where does the matching happen, and which component updates the Endpoints object?\n4. A teammate suggests the fix is to add a label directly to the running pod. Why is this a short-lived solution?",
    constraints:
      "For question 2: one fix modifies the Service selector; the other modifies the Deployment template's labels (which triggers a rollout). Explain what each changes and which is safer to apply in production right now. For question 4: explain the lifecycle of pod labels set via kubectl label vs. set in the Deployment template.",
    hints: [
      "A Service selector is a set of key=value pairs; a pod is selected only if it has ALL the selector's key-value pairs. The pod has `version=v2`; the Service selects `version=stable`. These don't match.",
      "Changing the Deployment's template labels triggers a rollout (new pods with new labels, old pods with old labels deleted). Changing the Service selector is immediate and affects currently running pods.",
      "Labels set directly on a running pod via `kubectl label pod` persist until the pod is deleted; when the Deployment replaces the pod (crash, node eviction, scale-down), the replacement pod has the labels from the template, not the manually added ones.",
    ],
    solutionOutline:
      "1. Cause: the Service selector requires `version=stable` but the running pods have `version=v2`. All Service selector key-value pairs must match for a pod to be included in endpoints. `version=v2 ≠ version=stable` → no pods match → Endpoints object is empty → connection refused.\n\n2. Two fixes:\n\n**Fix A: update the Service selector (immediate, no pod restart)**\n```bash\nkubectl patch svc payments-svc -n production \\\n  --type='json' \\\n  -p='[{\"op\": \"replace\", \"path\": \"/spec/selector/version\", \"value\": \"v2\"}]'\n```\nOr: `kubectl edit svc payments-svc -n production` and change `version: stable` to `version: v2`.\nEffect: immediate. The Endpoints controller sees the updated selector, matches the 3 running pods, and populates the Endpoints object within seconds. No pod restarts. Safest for immediate production unblocking.\n\n**Fix B: update the Deployment template labels to match the Service (triggers rollout)**\n```bash\nkubectl patch deployment payments -n production \\\n  --type='json' \\\n  -p='[{\"op\": \"replace\", \"path\": \"/spec/template/metadata/labels/version\", \"value\": \"stable\"}]'\n```\nEffect: Kubernetes starts a rolling update — new pods with `version=stable` are created, old `version=v2` pods are deleted. During the rollout, the Service starts matching the new pods as they become Ready. This is slower and introduces a rollout, but the Deployment's template becomes consistent with the Service selector — future pods will always match.\n\nTradeoff: Fix A is immediate and safe for the current incident; Fix B is correct long-term. Apply both: Fix A first to restore traffic, Fix B in a follow-up PR.\n\n3. The Endpoints controller (running inside kube-controller-manager) watches for Services with selectors and for Pod status changes. For each Service, it evaluates the selector against all pods in the same namespace. A pod is included in endpoints if: (a) its labels include all selector key-value pairs, (b) it is Running, (c) its readiness probe is passing. The controller writes the Endpoints (or EndpointSlice) object, which kube-proxy reads to update iptables/IPVS rules.\n\n4. Labels added directly to a running pod via `kubectl label pod payments-7c8f9-4p2wx -n production version=stable` persist on that pod object. But when the Deployment controller replaces the pod (node failure, manual delete, scale event), the replacement is created from the Deployment template, which still has `version=v2`. The manually-added label is lost on the next pod replacement. This is fragile: a pod crash on any of the three pods would make the replaced pod invisible to the Service again.",
    commonMistakes: [
      "Checking only `kubectl get pods` (shows Running) and concluding the deployment is fine — the running status tells you nothing about Service routing; you must check `kubectl get endpoints`.",
      "Suggesting `kubectl delete pod` to fix it — deleting and recreating pods does not change their labels, since labels come from the Deployment template.",
      "Missing the label mismatch entirely and blaming the targetPort — the targetPort is 3000 and the Service port is 8080; that is a correct configuration (Service port 8080 → container port 3000). The bug is the selector.",
    ],
    followUpQuestions: [
      "How does `kubectl get endpoints` differ from `kubectl get endpointslices`, and when did Kubernetes switch to EndpointSlices as the default?",
      "A pod passes the selector match but still does not appear in endpoints. Name two pod conditions that can cause this.",
    ],
    rubric: [
      { criterion: "Root cause identified", description: "States that version=v2 in pod labels does not match version=stable in Service selector — all selector key-values must match." },
      { criterion: "Two correct fixes", description: "Service selector patch (immediate) vs. Deployment template label change (rollout), with the tradeoff explained." },
      { criterion: "Label lifecycle", description: "Explains that manually-added pod labels are lost when the Deployment creates a replacement pod from the template." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/services-networking/service/#defining-a-service",
      "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#pod-template",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },

  // ── pods-deployments-services challenge ───────────────────────────────────

  {
    slug: "k8s-pod-stuck-pending",
    title: "Diagnose Three Reasons a Pod Stays in Pending",
    type: "debugging",
    difficulty: "hard",
    topics: ["kubernetes", "pending", "scheduling", "resource-quota", "taints", "pvc", "debugging"],
    targetRoles: ["infrastructure_swe", "mid_level_swe"],
    companyStyles: ["big_tech", "infra_heavy"],
    estimatedMinutes: 35,
    pathIds: [INFRA_PATH],
    moduleIds: [PODS_SVCS],
    lessonIds: [PODS_WALKTHROUGH],
    confidenceLevel: "challenge",
    prompt:
      "A Pod has been in Pending state for 10 minutes. Here are the three `kubectl describe pod` outputs from three separate incidents. For each incident, identify the specific reason the Pod is stuck in Pending, and give the kubectl command that would fix it (or explain the fix).\n\n**Incident 1:**\n```\nEvents:\n  Warning  FailedScheduling  9m  default-scheduler  \n    0/3 nodes are available: 3 Insufficient cpu.\n    preemption: 0/3 nodes are available: 3 No preemption victims found.\n```\nThe pod requests cpu=2000m. All nodes have 4 CPUs total but existing pods already have cpu requests summing to 3800m on each node.\n\n**Incident 2:**\n```\nEvents:\n  Warning  FailedScheduling  8m  default-scheduler  \n    0/3 nodes are available: 1 node(s) had untolerated taint \n    {dedicated: ml-workload: NoSchedule}.\n    2 node(s) didn't match Pod's node affinity/selector.\n```\nThe pod YAML has `nodeSelector: env: production`. Nodes:\n- node-1: taint dedicated=ml-workload:NoSchedule, label env=production\n- node-2: no taints, label env=staging\n- node-3: no taints, label env=staging\n\n**Incident 3:**\n```\nEvents:\n  Warning  FailedScheduling  7m  default-scheduler  \n    0/3 nodes are available: 3 pod has unbound immediate PersistentVolumeClaims.\nVolumes:\n  data-volume:\n    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)\n    ClaimName:  postgres-data-pvc\n    ReadOnly:   false\n```\n```bash\nkubectl get pvc postgres-data-pvc -n production\nNAME               STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS\npostgres-data-pvc  Pending\n```",
    constraints:
      "For Incident 1: diagnose the CPU packing issue and give a fix that does not require changing the pod spec. For Incident 2: identify exactly which nodes are blocked by which reason, then give the minimum change to make the pod schedulable. For Incident 3: explain the PVC binding lifecycle and give the most likely cause of the PVC staying in Pending.",
    hints: [
      "Incident 1: the scheduler can only place the pod on nodes with enough free CPU requests. 4000m - 3800m = 200m free per node, but the pod needs 2000m. No single node has enough free. Scaling the cluster or reducing requests on other pods are the two options.",
      "Incident 2: a taint with NoSchedule rejects pods that do not have a matching toleration. A nodeSelector of env=production matches only node-1, but node-1 has the ml-workload taint. Both constraints must be satisfied simultaneously.",
      "Incident 3: a PVC in Pending means it has not been bound to a PersistentVolume. The most common reasons: no PV available with matching StorageClass, accessMode, and capacity; or the StorageClass does not exist; or storage provisioner is not running.",
    ],
    solutionOutline:
      "**Incident 1 — CPU resource exhaustion:**\nEach node has 4000m CPU total. Existing pods sum to 3800m requests per node, leaving 200m free. The new pod needs 2000m — no single node has enough free requested capacity. The scheduler rejects all 3 nodes with 'Insufficient cpu'. Note: actual CPU *usage* may be much lower than requests; the scheduler uses requests for placement, not actual utilization.\n\nFix options (without changing the pod spec):\n- Scale up the cluster: add a new node with enough CPU capacity.\n- Reduce requests on low-priority pods already running: `kubectl patch deployment <name> --type='merge' -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"app\",\"resources\":{\"requests\":{\"cpu\":\"500m\"}}}]}}}}'`.\n- If the cluster supports preemption and has PriorityClasses configured, the new pod could preempt lower-priority pods — but the event says `0 preemption victims found`, meaning no preemptable pods exist.\n\n**Incident 2 — Taint + nodeSelector conflict:**\nMapping each node:\n- node-1: has taint dedicated=ml-workload:NoSchedule AND label env=production. The pod's nodeSelector requires env=production → matches node-1. But node-1 has an untolerated taint → rejected. 1 node blocked by taint.\n- node-2, node-3: no taint, but label env=staging. The pod's nodeSelector requires env=production → doesn't match. 2 nodes rejected by label.\n\nResult: zero viable nodes. The minimum fix that unblocks the pod without changing node labels/taints:\nAdd a toleration to the pod spec:\n```yaml\ntolerations:\n- key: \"dedicated\"\n  operator: \"Equal\"\n  value: \"ml-workload\"\n  effect: \"NoSchedule\"\n```\nThis makes node-1 (env=production, taint dedicated=ml-workload) schedulable for the pod: the nodeSelector matches and the toleration allows the taint. The pod lands on node-1 alongside ML workloads — which may be intentional if this pod is also ML-related, or a sign that the node labeling scheme needs redesign.\n\n**Incident 3 — PVC not bound:**\nA pod that requests a PVC cannot be scheduled until the PVC is Bound. The PVC `postgres-data-pvc` is in Pending, meaning no PersistentVolume has been bound to it.\n\nPVC binding lifecycle:\n1. PVC is created with StorageClass, accessMode, and capacity request.\n2. If a pre-provisioned PV matches (StorageClass, accessMode, sufficient capacity): it binds immediately.\n3. If dynamic provisioning is configured: the StorageClass provisioner (e.g., AWS EBS CSI, GCE PD CSI) creates a new PV and binds it.\n4. If neither: PVC stays in Pending.\n\nDiagnose:\n```bash\n# Check if the StorageClass exists\nkubectl get storageclass\n\n# Check events on the PVC\nkubectl describe pvc postgres-data-pvc -n production\n# Look for: 'no persistent volumes available' or 'waiting for PVC to be bound'\n# or provisioner error messages\n\n# Check if the CSI provisioner pod is running\nkubectl get pods -n kube-system | grep csi\n```\n\nCommon root causes: the StorageClass name in the PVC doesn't match any StorageClass in the cluster; the dynamic provisioner pod is not running (crashing, misconfigured); the underlying storage system (EBS, NFS) is quota-limited or unavailable. Fix: create a matching PV manually, or fix the StorageClass/provisioner configuration.",
    commonMistakes: [
      "Incident 1: suggesting 'reduce the pod's CPU limit' — the limit does not affect scheduling; only requests do. The scheduler ignores limits.",
      "Incident 2: adding the toleration alone without checking the nodeSelector — a toleration lets the pod onto a tainted node but only if the other constraints (nodeSelector, affinity) are also satisfied.",
      "Incident 3: deleting and recreating the PVC hoping it will bind — the PVC will still be Pending if the underlying cause (missing StorageClass, broken provisioner) is not fixed.",
    ],
    followUpQuestions: [
      "What is PriorityClass and how does it interact with pod preemption? When would you set a PriorityClass on a pod?",
      "Explain the difference between a taint effect of NoSchedule, PreferNoSchedule, and NoExecute, and what happens to already-running pods when NoExecute is added to a node.",
    ],
    rubric: [
      { criterion: "Three root causes", description: "CPU exhaustion / taint+selector conflict / PVC Pending — each diagnosed from the evidence." },
      { criterion: "Incident 2 node mapping", description: "Maps each node individually to the blocking reason (taint for node-1, label mismatch for nodes 2-3)." },
      { criterion: "PVC lifecycle", description: "Explains the three-step bind sequence and identifies the provisioner/StorageClass as the likely broken component." },
    ],
    sourceType: "official_docs_inspired",
    sourceUrls: [
      "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/",
      "https://kubernetes.io/docs/concepts/storage/persistent-volumes/#lifecycle-of-a-volume-and-claim",
    ],
    licenseNote: DOCS_INSPIRED_NOTE,
    qualityScore: 5,
  },
]);
