---
name: to-spec
description:
  Draft an implementation-ready spec from the current conversation and
  repository context; publish it to the issue tracker only when requested.
disable-model-invocation: true
---

Turn the current conversation and relevant repository context into a clear,
implementation-ready spec. Synthesize decisions already made without re-asking
them. Show the draft in the conversation by default. Do not create a file or
publish an issue unless the user explicitly requests it.

## Workflow

1. Inspect relevant code, domain vocabulary, package guidance, ADRs, and test
   prior art. Use repository facts and decisions already made; do not invent
   APIs, conventions, or agreed behavior.
2. Identify the problem, desired outcome, behavior, acceptance requirements,
   implementation decisions and their reasoning, and test strategy. Mark
   assumptions and unresolved questions clearly.
3. Choose only the conditional details needed for the feature. Describe
   appropriate test seams and layers without requiring user approval. Treat
   every uncovered material decision as blocking: ask the user to resolve it
   before finalizing. Continue with an unresolved decision only if the user
   explicitly skips it, and mark it as unresolved in the draft. Do not re-ask
   settled decisions or ask about facts repository research can establish.
4. Produce the complete Markdown draft in the conversation and keep agent-facing
   Markdown prose lines at 80 characters or fewer. If the user asks
   to publish, create a new issue unless they identify an existing issue to
   update. Apply `ready-for-agent` by default; if another label is requested,
   use the closest applicable existing label.

## Spec content

Every spec covers these elements:

- **TL;DR** — place this first after the title; summarize the proposed change
  and intended outcome in one or two short, direct sentences.

- **Problem** — the user or system problem.
- **Solution** — the desired outcome.
- **Behavior** — how the system should act, including relevant contracts and
  state changes.
- **Acceptance requirements** — observable scenarios that establish expected
  behavior, including meaningful boundary and failure cases.
- **Implementation decisions** — confirmed choices with the reasoning for
  relevant cases. Label proposals and assumptions; do not present them as
  agreed decisions.
- **Test strategy** — what behavior to verify, useful test layers and seams,
  and relevant prior art. Prefer observable behavior over replaceable internal
  representations.

State scope boundaries when they prevent ambiguity or scope drift. Keep one
adaptive spec for frontend, backend, or cross-stack work. Omit empty sections
and avoid repeating a decision in multiple places.

## Choose relevant detail

For frontend behavior, describe the user journey and applicable visible states,
actions, and recovery paths. Include platform or accessibility details when
they affect behavior.

For backend behavior, assess lifecycle, persistence, ordering, authorization,
concurrency, retries, idempotency, recovery, failure behavior, rollout, and
observability. Include only the concerns that affect the change.

For cross-stack work, connect client behavior to server contracts and cover
the observable flow across the relevant layers.

Use user stories only when actor and benefit clarify intent. Acceptance
requirements remain the primary expression of behavior. Add examples, schemas,
types, or pseudocode only when they resolve real ambiguity; keep guidance
behavior-first. Leave implementation order to the implementer and do not add a
separate completion checklist.

## Revision sessions

When revising an existing spec, compare the prior and proposed versions. Show
only the changed content, with the prior wording, proposed wording, and a brief
reason. Do not repeat the full spec unless the user requests it.

For any requested spec-file write, present the proposed content first. For a
revision, present only the changed content as described above. Write the file
only after the user explicitly approves all proposed changes. A request to
revise or write a file does not approve later changes that have not yet been
shown. If the user approves only some changes, keep revising the proposal and
wait for approval of the complete set before writing.

## Keep the spec current

Keep current requirements and decisions in their canonical sections. When
revising an existing spec, retain a short dated history only for:

- Decisions made to resolve an unexpected case during implementation.
- Conflicts between the implementation and the proposed spec.
- Review decisions that change a prior spec requirement.

Do not append routine implementation notes or duplicate the current
requirements in a chronological handoff.
