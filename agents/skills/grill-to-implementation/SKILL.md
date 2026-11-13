---
name: grill-to-implementation
description: >-
  Grills a ticket, spec, or pasted requirements decision by decision into an
  approved implementation contract (architecture, interfaces, rules),
  persisted to a spec and handoff each round. Use when requirements must
  become implementation-ready interfaces before coding, or when given a
  spec-and-tickets directory to grill. For open-ended stress-testing with no
  persisted spec, use grilling.
---

# Grill to implementation

Run the `grilling` skill to resolve the decisions needed for a deterministic,
implementation-ready design. The audience is the coding agent that will
implement the approved requirements.

## Inputs

Before grilling, identify all supplied source material.

When given a directory `<dir>`:

1. Run `scripts/resolve-inputs.sh <dir>` and use the paths it prints:
   - `spec:` is the spec, `<base>.spec.md` or else `<base>.md`.
   - `handoff:` is the handoff, named by the naming rule in
     [`../handoff/SKILL.md`](../handoff/SKILL.md) (step 2). Create it when
     the script reports it `missing`.
   - `subhandoff:` lines are scoped sub-handoffs. Each holds the history of
     its own scope; read it with the task it covers.
   - `task:` lines are the tasks in `NN` order.
2. On exit 2, show the error and ask the user for the missing path.
3. Write targets: the spec plus the task file the decision belongs to.
   Shared rules live in the spec. Task-specific rules and interfaces live in
   the task file, which links to the spec rule rather than copying it.

Grill the tasks in `NN` order. A task is settled when every decision for it
is recorded in the handoff and written to its task file, and its interface
set is approved (see Finish).

Otherwise, use these user-provided paths:

- Handoff: one path for the decision history. It may not exist yet.
- Spec targets: one or more paths for the final spec. They may already hold
  rules to extend or correct.

When a path is missing, ask for it before the interview. Offer as default
the handoff name that [`../handoff/SKILL.md`](../handoff/SKILL.md) (step 2)
gives the first spec target, beside it.

Work only on the paths given in this invocation. Read and write no other
`.scratch/*` workstream, even when the session name or an earlier handoff
suggests one.

The original requirements may be a ticket, a spec, pasted content, or a
combination. Accept additional source paths and pasted context. Read the
supplied artifacts before asking about facts they establish.

When the user invokes `/to-spec`, `/to-tickets`, or `/handoff` mid-session,
follow that skill for its output. Then resume the round with the updated
files as current state.

## Interview

Run the rounds with the `grilling` skill. Keep every question at the
architecture and contract level.

Before proposing a new type, service, or file name, grep for the existing
naming family and construction pattern (classes vs `make*` functions), and cite
the match in the question.

Resolve enough detail for an implementer to make consistent choices about:

- Responsibilities, boundaries, dependencies, and data flow.
- Domain rules, lifecycle, ordering, authorization, and state transitions when
  relevant.
- Names and ownership of important types and components.
- Public or cross-component interfaces, including classes, methods, functions,
  and their inputs, outputs, and failure behavior.
- Compatibility, edge cases, and observable acceptance scenarios.

Use the source language and repository conventions for typed signatures when
clear. Otherwise describe the contract precisely and ask only if the language or
representation materially changes the interface. Do not turn the spec into
line-by-line implementation instructions or prescribe private code structure
without a concrete architectural need.

## Each round

1. Ask the frontier questions (see Interview) and wait for answers.
2. Append a dated handoff entry: scope, settled decisions with rationale,
   evidence with source links, remaining questions, and spec changes. Mark
   superseded decisions in the new entry; keep earlier entries intact.
3. Write the newly settled rules to the spec target(s). Correct rules the
   round resolved differently. State each requirement in one target only.
   Add every file the round touched or researched to the Key files of the
   spec or task it belongs to.
4. Label every interface in the spec `proposed` or `approved`.
5. Show the draft (see Drafts).

A round is done when the handoff entry and spec edits are on disk and the
draft is shown. The handoff is the chronological record; the spec is the
current state, with each interface's status labelled.

The handoff follows the template in
[`../handoff/SKILL.md`](../handoff/SKILL.md). Create it from that template
when missing. Append each round entry to its task history, and refresh its
snapshot, next steps, and open decisions each round.

## Drafts

A draft shows the proposed code interfaces, the main rules they depend on,
and the affected spec sections. It is a review view and approves nothing.

At the end of each round, show only the interfaces, rules, and spec sections
the round added or changed. Show the full draft when the user says
**"draft"** and at Finish.

## Finish

Enter Finish when the grilling frontier is empty: every branch visited and
no material decision open, except ones the user chose to leave open.

1. Show the complete interface set with every rule it depends on.
2. Ask for explicit approval of the whole set. On a requested change,
   revise, persist the round, and ask again.
3. Record the approval, with date and scope, in the handoff. Mark the
   interfaces `approved` in the spec.
4. Settle the Implementation order: the slices in build order, in the
   `to-spec` format ([`../to-spec/SKILL.md`](../to-spec/SKILL.md)). Put it in
   the spec. When tickets exist, put it in every task file too, and have the
   spec list the tickets in that order. A slice order change updates the
   spec and every task file in the same round.
5. Check the spec against the list below. Every left-open decision appears
   in both spec and handoff with its implementation impact. Every approved
   interface names the file it lives in, and that file is in Key files.
   Every Key files path without `(new)` exists. Implementation order has
   the same slices in the spec and every task file, and its last slice names
   the observable done criterion.
6. Report the spec and handoff paths and any open decisions, then stop.
   The user picks the next step, such as `/to-tickets` or `/implement`.

The final spec gives the coding agent the agreed requirements and contracts
without requiring it to infer a material decision. Include the sections
needed for this design, such as:

- TL;DR: the change and its outcome in one or two sentences.
- Goal, problem, scope, and relevant constraints.
- Architecture, component responsibilities, dependencies, and data flow.
- Settled rules and behavior, including important state and failure cases.
- Named code interfaces with approved signatures and contract semantics.
- Implementation order, the slices in build order.
- Key files, in the `to-spec` format
  ([`../to-spec/SKILL.md`](../to-spec/SKILL.md)). Each task file carries the
  full list for its own scope.
- Compatibility, observable acceptance requirements, and test seams.

Keep rationale where it explains a non-obvious choice. Mark genuine assumptions
and unresolved items explicitly; do not present them as approved requirements.
