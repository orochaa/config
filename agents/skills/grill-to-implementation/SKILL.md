---
name: grill-to-implementation
description: >-
  Run a decision-by-decision grilling session that turns a ticket, spec, or
  pasted requirements into an architecture-focused implementation contract.
---

# Grill to implementation

Run `/grilling` to resolve the decisions needed for a deterministic,
implementation-ready design. The audience is the coding agent that will
implement the approved requirements.

## Required inputs

Before grilling, identify all supplied source material and require at least two
user-provided paths:

- One path for the persistent grilling handoff and decision history.
- One or more paths for the persistent final spec. These are the canonical
  spec targets and may already contain rules to extend or correct.

The original requirements may be a ticket, a spec, pasted content, or a
combination. Accept additional source paths and pasted context. Read the
supplied artifacts before asking about facts they establish. If a required path
is missing, ask for it before beginning the interview.

The user controls invocation of related spec, ticket, and handoff skills. Treat
artifacts they provide from those workflows as source material or current
session state. When the user explicitly invokes one of those skills, let that
skill govern its own workflow and use the approved spec and handoff as context.
Keep those skills' workflow instructions out of this skill.

## Interview

Use the `/grilling` design tree, round frontier, and question format. Ask all
questions whose prerequisites are settled in one round, recommend an answer,
and wait for the user's decisions before moving to the next frontier.
Research facts from the supplied sources and available environment rather than
asking the user to repeat them. Ask about decisions that cannot be established
from evidence. Keep the interview at the architecture and contract level.

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

## Round records and drafts

At the end of each round, update both persistent artifacts:

- Append a dated handoff entry with the round's scope, settled decisions and
  rationale, relevant evidence and source links, remaining questions, and spec
  changes. Preserve earlier history; mark superseded decisions in a new entry.
- Update the target spec file or files with the newly settled rules. Correct
  existing rules when the round resolves them differently. Keep each target's
  content coherent and avoid duplicating the same requirement across targets.

At the end of each round, show a concise draft of the proposed code interfaces
and the main high-level rules they depend on. Also show the affected spec
sections so the user can review what will be implemented. The user may request
this view at any time by saying **"draft"**. A draft is a review artifact; it
must not imply that an interface has been approved.

Get the user's explicit approval for the complete interface set before marking
it approved or implementation-ready in the persistent spec. Record that approval
in the handoff. If the user requests a change, revise the proposed interfaces
and obtain approval for the revised set. Continue grilling on unresolved
branches after recording the current round.

Persist round decisions and history as they are settled; do not wait until the
whole interview ends. Keep the handoff as the chronological record and the spec
file or files as the current approved result. The spec may contain settled rules
while an interface is still proposed; label proposal and approval status
clearly.

## Final result

The final spec must give the coding agent the agreed requirements and contracts
without requiring it to infer a material decision. Include the sections needed
for this design, such as:

- Goal, problem, scope, and relevant constraints.
- Architecture, component responsibilities, dependencies, and data flow.
- Settled rules and behavior, including important state and failure cases.
- Named code interfaces with approved signatures and contract semantics.
- Compatibility considerations and observable acceptance requirements.

Keep rationale where it explains a non-obvious choice. Mark genuine assumptions
and unresolved items explicitly; do not present them as approved requirements.
Do not finalize while a material decision remains open unless the user
explicitly chooses to leave it unresolved. When they do, identify the
implementation impact in the spec and handoff.
