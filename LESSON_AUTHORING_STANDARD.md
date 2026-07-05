# Interview OS Lesson Contract v2

Every lesson should teach like an instructor helping a strong CS student who is rusty or seeing the topic for the first time. Build intuition first, then gradually add technical detail. Do not write short encyclopedia notes or dense interview cheat sheets.

The canonical reference is **Page Tables and Virtual Memory** (`page-tables-virtual-memory`) in `prisma/seed-data/learning.ts`.

Do not mark a lesson ready and expect the seed pipeline to turn short notes into a lesson. New lessons are not eligible for legacy normalization and must pass `npm run validate:seed` as authored.

## Module motivation contract

Every new `ModuleSpec` should provide `motivation`; the seed stores it as `motivationMarkdown` and the module page renders it before the lessons. In plain language, it must answer:

- Why does this topic exist?
- What problem does it solve in real systems?
- Why would an interviewer care about it?
- What should the learner be able to explain after finishing the module?

Avoid a glossary. Give the learner a reason to care before Lesson 1. A Kubernetes motivation, for example, should begin with the operational problem of keeping many containers running across changing machines—not with control-plane component names.

## How lesson fields map to the page

The lesson page already renders the title, estimated minutes, module position, difficulty, and lesson type. Do not repeat the H1 or metadata inside `contentMarkdown`.

- `title`: page heading, such as `Page Tables and Virtual Memory`.
- `estimatedMinutes`: displayed reading/practice time.
- `order`: displayed lesson position within the module.
- `contentMarkdown`: begins with `## Goal` and follows the structure below.
- `keyTakeaways`: concise facts also used by module and review UI.
- `examples`: concrete scenarios, inputs, traces, diagrams, or calculations.
- `linkedProblemSlugs`: the warmup/core/challenge sequence taught by the lesson.
- `sourceUrls`: public primary or high-quality educational sources.
- `isPlaceholder`: `false` only after the complete lesson is authored and reviewed.

## Required lesson structure

Use this order:

````markdown
## Goal

By the end of this lesson, you should understand ... and be able to ...

---

## Why This Matters

Connect the topic to a real engineering problem. Explain why the learner should care before introducing the technical breakdown.

## The Simple Mental Model

Explain the concept in 3–6 plain-language sentences. This should be the model a learner can repeat before learning the detailed terminology.

## First Core Concept

Introduce one idea at a time in plain language.

```text
Use a diagram, trace, table, protocol exchange, query plan, memory layout,
code fragment, or configuration example whenever it makes the mechanism clearer.
```

## Second Core Concept

Build on the first concept. Explain the important invariant, contract, or tradeoff.

## Full Flow

Give an ordered end-to-end mental model.

```text
1. First event or decision
2. State transition
3. Validation or lookup
4. Success and failure outcomes
```

---

## Worked Example

Use real values and trace the result. Include multiple labelled cases when behavior branches.

### Case 1: Normal path

...

### Case 2: Important boundary or failure path

...

## Interview Value

Explain why interviewers ask this topic and what signals distinguish a strong answer.

## Common Interview Questions

### Topic-specific question 1?

Give a direct answer, then explain why.

---

### Topic-specific question 2?

Give a direct answer, then explain the tradeoff or boundary.

---

### Topic-specific question 3?

Walk through a concrete scenario.

## Common Mistakes

### Mistake 1: Specific misconception

Correct it precisely.

### Mistake 2: Specific implementation or reasoning failure

Explain its consequence.

### Mistake 3: Missing edge case or tradeoff

Explain how to avoid it.

## Quick Check

### Question 1

A concrete recall or application question.

### Answer

The answer with a short explanation.

---

### Question 2

Another question that tests a different part of the lesson.

### Answer

The answer with a short explanation.

---

### Question 3

A boundary case, calculation, trace, or tradeoff question.

### Answer

The answer with a short explanation.

## Key Takeaway

End with the compact mental model the learner should retain.
````

## Quality requirements

- Teach progressively. Do not begin with a wall of terminology.
- Lessons should usually be 900–1600 words. The validator requires at least `max(900, estimatedMinutes × 30)` words.
- Define a technical term in plain language before using it heavily. Introduce no more than 3–5 new terms before returning to an example.
- Explain why the mechanism works, not only what API or pattern to memorize.
- Use concrete values, artifacts, diagrams, or code. Avoid purely abstract examples.
- Include both normal behavior and an important boundary, failure, or counterexample.
- Write at least three topic-specific interview questions. Generic prompts such as “What is the central model?” are insufficient for newly authored lessons.
- Include at least three numbered, topic-specific mistakes.
- Include at least three quick-check questions with explicit `### Answer` sections.
- End with `## Key Takeaway`; it must be the final level-two section.
- Cite at least one public source. Prefer official documentation, standards, university material, textbooks, or primary technical references.
- Do not copy proprietary course material or interview-bank wording.

## First-lesson rule

Lesson 1 assumes the learner has heard the term but does not yet understand the system. It should prioritize:

1. why the topic exists;
2. the simplest useful mental model;
3. one concrete example;
4. only the 3–5 terms needed to follow that example;
5. common beginner misconceptions.

Delay deep implementation details, secondary components, optimizations, and production edge cases until later lessons unless they are essential to the basic model. Lesson 1 must feel like “let’s build the idea carefully,” not “here is every fact you must know.”

## Interview framing

Interview framing should support the teaching rather than dominate it. State what the interviewer is specifically testing, what a strong explanation contains, which shallow answer misses the mechanism, and which follow-ups are likely. Do not use generic language such as “this distinguishes vocabulary recall from working understanding.”

## Jargon and tone

When introducing a term, use this sequence:

1. plain-English meaning;
2. technical name;
3. why it matters;
4. tiny example.

Prefer “When a Pod has not been assigned to a machine, the scheduler chooses a node” over implementation-first descriptions such as “the scheduler watches for Pods without `spec.nodeName`.” Precise implementation detail can follow after the learner understands the job being performed.

Use a clear, calm, encouraging tone. The lesson should feel like “let’s build the idea carefully,” not official documentation, a production incident report, or a compressed list of facts.

## Acceptance checklist

Before accepting a ready lesson, verify:

- Does it explain why the topic exists?
- Does it start with intuition before technical detail?
- Are technical terms defined before they are used heavily?
- Is there a realistic event or problem driving the worked example?
- Could a beginner explain the main idea after reading it?
- Does the interview section test understanding rather than slogans?
- Does Lesson 1 defer secondary and advanced details?
- Do quick checks test reasoning more often than memorization?
- Does the lesson feel like teaching rather than documentation?

If any answer is no, rewrite the lesson before setting `isPlaceholder: false`.

## Lesson-to-problem flow

A lesson is incomplete until it leads naturally into practice:

1. Teach the concept and invariant.
2. Trace a worked example using the same mental model.
3. Link a genuinely easy warmup that isolates the idea.
4. Link a core problem that requires recognizing and applying it.
5. Link a challenge or applied variant when available.
6. Make the final lesson guidance identify the next lesson or problem.

The lesson must teach every concept required by its warmup. Do not make the learner discover an unstated trick in the first problem.

## Required validation

After authoring or changing lessons, run:

```bash
npm run validate:seed
npm run seed
npm run lint
npm run typecheck
npm test
npm run build
```

Open the lesson page and verify heading order, diagrams, code blocks, source links, linked problems, and previous/next navigation.
