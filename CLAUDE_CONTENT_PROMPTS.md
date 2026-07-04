# Claude Content Expansion Prompts

Use these prompts sequentially. Small, reviewed batches should produce a more coherent curriculum than asking Claude to fill every module at once.

## Prompt 1 — Research and curriculum planning

```text
You are taking over the Interview OS repository.

Goal:
Research and plan the next content expansion without generating the entire curriculum yet.

First read:
- README.md
- PROGRESS.md
- prisma/schema.prisma
- prisma/seed-data/learning.ts
- prisma/seed-data/learning-overrides.ts
- prisma/seed-data/types.ts
- scripts/validate-seed.ts
- existing problem seed files

Preserve:
- all existing problems and lessons
- standalone modules
- reusable path/module relationships
- local submissions and judging
- Codex review export/import
- existing working routes and APIs

Before editing, run:
- git status
- npm run validate:seed
- npm run lint
- npm run typecheck
- npm test
- npm run build

Curriculum requirements:
Interview OS must support both:
1. Guided paths whose lessons and problems flow naturally.
2. Standalone modules for targeted interview preparation.

Create or update a curriculum coverage plan in PROGRESS.md. For every module, record:
- intended learner level
- prerequisites
- lesson sequence
- missing warmup problems
- missing core problems
- missing challenge problems
- missing advanced/applied problems
- interview formats covered
- research sources still needed

Prioritize:
1. DSA Confidence Builder
2. Backend SWE
3. Operating systems and networking
4. Databases
5. C++
6. System design
7. Quant Dev
8. Docker and Kubernetes
9. AI-efficient engineering

DSA requirements:
The DSA path must eventually provide broad original coverage comparable to a high-quality “150-style” interview roadmap without copying LeetCode, NeetCode, or paid platforms.

Cover:
- arrays and hashing
- two pointers
- sliding window
- stacks
- binary search
- linked lists
- trees and BSTs
- tries
- heaps
- backtracking
- graphs
- advanced graphs
- 1-D dynamic programming
- 2-D dynamic programming
- greedy algorithms
- intervals
- bit manipulation
- math and geometry

Learning-flow requirements:
Each topic should normally progress through:
1. concise concept lesson
2. worked example or walkthrough
3. genuinely easy warmup
4. standard interview-level core problem
5. harder variation
6. applied backend, infrastructure, or quant variant where appropriate
7. self-review using the rubric

Do not confuse “warmup” with a disguised medium problem. Easy problems should:
- isolate one main idea
- use small, clear contracts
- avoid unnecessary tricks
- usually take 10–20 minutes
- build confidence for the next lesson or problem

Research requirements:
- Prefer official documentation, standards, textbooks, reputable university material, and public engineering references.
- Use primary sources where practical.
- Record source URLs.
- Do not copy proprietary problem statements.
- Clearly distinguish researched facts from original interview exercises.

Do not add a large content batch in this pass. Improve the coverage plan, identify the next three bounded implementation batches, update PROGRESS.md, and commit the planning work only if files changed.
```

## Prompt 2 — Expand one coherent lesson/problem batch

```text
Continue from the current Interview OS repository state.

Goal:
Fully develop one coherent module batch so its lessons and problems form a smooth interview-preparation progression.

Read README.md and PROGRESS.md first. Follow the curriculum coverage plan. Do not restart or re-architect the application.

Choose:
- no more than two closely related modules
- preferably modules identified as the highest-priority incomplete batch
- at least one module with beginner-accessible material

For each selected module, create:
- one concise concept lesson
- one worked-example or pattern lesson
- one optional interview checkpoint lesson
- 2 genuinely easy warmup problems
- 2 standard core problems
- 1 challenge problem
- at most 1 advanced or applied problem

Required flow:
concept → worked example → easy warmup → second warmup → core → core variation → challenge → self-review

Every lesson must include:
- concise explanation
- why interviewers test the topic
- prerequisite knowledge
- worked example
- common mistakes
- key takeaways
- recommended next step
- public source URLs
- links to the relevant problems

Every problem must include:
- title
- realistic original prompt
- type and calibrated difficulty
- topics and target roles
- estimated time
- confidence level
- module and lesson links
- constraints
- hints
- solution outline
- common mistakes
- follow-up questions
- concrete rubric
- source URLs or original-content license note

Problem formats must match the skill:
- DSA/implementation: starter code, function contract, examples, public and hidden tests where supported.
- Optimization: provide correct but inefficient code, SQL, query plan, or design to improve. State baseline complexity/performance, target, constraints, and behavior to preserve.
- Debugging/read-code: provide code, logs, traces, symptoms, or failing tests.
- System design: use an open-ended descriptive scenario with requirements, scale, ambiguity, tradeoffs, rubric, and follow-ups. Do not force it into a code harness.
- OS/networking/C++/database/quant: use the realistic mix of implementation, diagnosis, explanation, and design found in interviews.

Difficulty calibration:
- Warmups must test one main idea and should not require an obscure trick.
- Core problems should resemble realistic standard interview questions.
- Challenges should combine concepts or introduce meaningful constraints.
- Advanced problems should test tradeoffs, performance, or system application.
- Do not generate mostly medium and hard problems.

Bidirectional linking:
- Lessons must link their problem slugs.
- Problems must link the correct path/module/lesson IDs.
- Problems should appear under the correct confidence-level section.
- The final lesson should explain what the learner should study next.

Research:
Use primary or high-quality public sources. Do not copy LeetCode, NeetCode, paid courses, company interview banks, or proprietary statements. All exercises must be original.

After implementation run:
- npx prisma generate
- npx prisma db push
- npm run validate:seed
- npm run seed
- npm run lint
- npm run typecheck
- npm test
- npm run build

Manually verify:
- standalone module page
- relevant learning-path page
- lesson navigation
- problem links
- runnable test cases, if added
- warmup → core → challenge ordering

Update README.md and PROGRESS.md with:
- lessons added
- problems added by difficulty
- sources used
- remaining gaps
- next recommended batch

Commit only this bounded batch with a descriptive commit message.
```

## Prompt 3 — Build out the DSA roadmap

```text
Continue developing Interview OS.

Goal:
Expand the DSA Confidence Builder into a strong original algorithms-and-data-structures curriculum comparable in breadth—not copied content—to a “150-style” interview roadmap.

Do not attempt the entire roadmap in one run.

First:
- Read README.md and PROGRESS.md.
- Audit existing DSA modules, lessons, problems, and runnable tests.
- Select the next two adjacent incomplete DSA topics.
- Preserve all existing content and application behavior.

For this batch:
- scaffold missing global modules if necessary
- fully develop no more than two modules
- add a clear prerequisite relationship
- add concise lessons and a worked example
- add exactly:
  - 4 easy warmups total
  - 3 medium/core problems total
  - 1 hard/challenge problem total
  - optionally 1 applied backend or quant variation

The path must feel cumulative:
- lessons teach the technique before problems require it
- the first warmup isolates the basic operation
- the second warmup introduces recognition
- core problems require choosing and implementing the pattern
- the challenge combines the pattern with another idea
- the applied problem connects DSA to realistic engineering

For coding problems:
- use original scenarios and wording
- provide starter code
- support Python, JavaScript, and TypeScript where compatible
- include public and hidden tests
- cover empty, minimal, duplicate, boundary, and performance-relevant cases
- ensure the reference solution satisfies the tests
- keep expected function names and test metadata valid

Do not neglect easy problems. At least half of the problems in this batch must be genuinely accessible to learners who just completed the lesson.

Maintain long-term coverage across:
arrays/hashing, two pointers, sliding window, stacks, binary search, linked lists, trees/BSTs, tries, heaps, backtracking, graphs, advanced graphs, 1-D/2-D DP, greedy, intervals, bit manipulation, and math/geometry.

Run all validation, update README.md and PROGRESS.md, document the next two DSA topics, and commit the completed batch.
```

Prompt 2 is the reusable default. Run it repeatedly for different module batches instead of asking Claude to generate the entire curriculum in one pass.
