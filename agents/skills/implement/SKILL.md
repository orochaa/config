---
name: implement
description: 'Implement a piece of work based on a spec or set of tickets.'
disable-model-invocation: true
---

# Implement

Implement the supplied spec or tickets faithfully. The spec is the source of
truth: do not add behavior outside it without the user's confirmation.

## Establish the work

Before editing:

1. Read the complete spec or ticket set, repository instructions, and every
   applicable package or domain skill.
2. Capture the current committed baseline and preserve unrelated worktree
   changes.
3. Identify each requirement, explicit non-goal, and required test coverage.
4. Inspect the nearest implementation and tests to derive ordinary public test
   seams.

A **decision edge** is an uncovered choice that changes product or domain
behavior, or carries material risk: data or migration semantics, permissions or
security, external side effects, compatibility, deletion or irreversible work,
or scope expansion.

At a decision edge, ask the user before choosing. State the options, your
recommendation, the impact, and the uncovered part of the spec. Derive ordinary
implementation and test-seam decisions autonomously.

## Implement in slices

Implement one independently coherent vertical slice at a time. Use a red → green
loop where feasible, with tests based on the specification or another
independent expected-value source.

Test every requirement in the spec. Add integration or E2E coverage when it is
the relevant test level, but do not execute those tests when repository rules
prohibit it. State the exact unrun command and that its behavioral execution
remains unverified.

After each slice, run its focused validation and assess the achieved goal from
the tests. Then pause and say:

> `{Current slice} is validated. Should I proceed to {next slice}?`

Do not mention commits at intermediate slice gates.

## Complete the implementation

After the final slice, run `when-verify` for every directly changed package.
Account for every requirement and non-goal: each requirement has relevant test
coverage, or an explicit reason it cannot be automated.

Then ask the user to inspect and approve the complete implementation without
presenting an evidence table. Offer changes as an alternative. Do not begin
formal code review until the user approves.

After approval, check whether implementation work is pending commit. If it is,
offer the commit action because it is required before formal code review. Commit
only when the user requests it. If the user declines, keep the workflow open for
a later commit request or change request.

## Review, repair, and finish

After the final requested commit, invoke `review-and-refine` once against the
baseline captured before implementation.

`review-and-refine` automatically repairs safe findings that remain within the
specification. At a decision edge, ask the user before repairing. Rerun every
affected focused validation after repairs, but do not invoke another review
skill; use the available review context to confirm that repairs address its
findings.

Present the final review result and wait for the user's explicit approval before
finishing.
