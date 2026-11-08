---
name: implement
description:
  Implements a spec or ticket set in approved, tested vertical slices. Use when
  an approved spec or tickets are ready to build.
disable-model-invocation: true
---

# Implement

Implement the supplied spec or tickets faithfully. The spec is the source of
truth: build exactly the behavior it covers, and ask before adding more.

## Inputs

Accept the spec or tickets in any of these forms:

- A file path: read it in full.
- A workstream directory `<dir>`: run
  [`resolve-inputs.sh`](../grill-to-implementation/scripts/resolve-inputs.sh)
  with `<dir>` as its only argument. It prints the spec, handoff, scoped
  sub-handoffs, and tasks in order. Read each one it lists.
- An issue number or URL: fetch its full body and comments.
- Pasted content in the conversation.

When no spec or ticket is supplied, ask for one before reading code.
Implement tickets in **Blocked by** order; a ticket starts only when its
blockers are done.

The workstream's handoff is named by step 2 of the `handoff` skill (for
`sync.spec.md`, `sync.spec.handoff.md`). A scoped sub-handoff
`<root>.<scope>.handoff.md` belongs to the ticket of that scope. Note each
handoff path for rule changes.

## Establish the work

Before editing:

1. Read the complete input from **Inputs**, repository instructions, and
   every applicable package or domain skill. Open the Key files of the spec or
   ticket first; search the codebase only for what they leave out.
2. Record `git rev-parse HEAD` and `git status --short` as the baseline.
   Files already changed in the baseline stay out of every slice commit
   unless the spec covers them.
3. Write a requirement list in the conversation: each requirement, each
   explicit non-goal, and the test that will cover it.
4. Inspect the nearest implementation and tests to derive ordinary public
   test seams.
5. List the slices in order, naming which requirements each covers.

This stage is done when every requirement maps to a slice and a test.

A **decision edge** is an uncovered choice that changes product or domain
behavior, or carries material risk: data or migration semantics, permissions or
security, external side effects, compatibility, deletion or irreversible work,
or scope expansion.

At a decision edge, ask the user before choosing. State the options, your
recommendation, the impact, and the uncovered part of the spec. Derive ordinary
implementation and test-seam decisions autonomously.

## Implement in slices

Implement one independently coherent vertical slice at a time, test-first,
using the `tdd` skill for test quality. Under this skill, the spec's
requirements are the agreed seams: derive ordinary seams without asking.

Test every requirement in the spec. Add integration or E2E coverage when it
is the relevant test level. When repository rules forbid running those
tests, leave them unrun and list each exact command as unverified in the
slice pause and the completion request.

For each slice except the last:

1. Run its focused validation. On failure, fix and rerun until it passes.
2. Pause and ask:
   > {Current slice} is validated. Should I commit it and proceed to
   > {next slice}?
3. On approval, commit the slice, then start the next one. On requested
   changes, apply them and return to step 1.

The last slice skips this pause; the completion gate below covers it.

When an existing test fails, fix the implementation, unless the spec
changes the behavior the test asserts. Change an existing test's assertions
only after the user approves the reason; quote the spec line that changes
the behavior.

### Changing an approved rule

When the user asks to change a rule the spec or ticket already settled, first
ask for approval. Quote the approved rule and the proposed change, and state
the scope impact: affected slices, tests, and tickets.

After approval, update the rule in its source (spec file, ticket file, or
tracker issue) before changing code. When the workstream has a handoff,
append a dated entry recording the change and its reason.

## Complete the implementation

After the last slice:

1. Run the repository's verification for every directly changed package:
   its verify skill when one exists (for example `when-verify`), otherwise
   the package's lint, type-check, and test commands. On failure, fix and
   rerun until every command passes.
2. Check the requirement list from "Establish the work": each requirement
   has relevant test coverage or an explicit reason it cannot be automated,
   and each non-goal remains unimplemented.
3. Ask once for approval of the complete implementation. Quote each
   verification command and its result, list any unrun integration or E2E
   command, and keep the rest to a short prose summary. Offer changes as the
   alternative.
4. On requested changes, apply them and return to step 1.
5. On approval, commit the last slice, report `Implementation is complete
   and ready for review.`, and stop. The user chooses the next step.
