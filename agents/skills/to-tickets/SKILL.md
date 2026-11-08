---
name: to-tickets
description: Turn an approved spec or conversation into merge-safe tickets.
disable-model-invocation: true
---

# To Tickets

Turn an approved spec or conversation into a set of complete implementation
tickets. Draft and review the breakdown in chat. Approval of the breakdown
publishes it to the configured destination.

## Workflow

### 1. Gather the source and current behavior

Use an approved spec when one is provided. Otherwise, work from the decisions in
the conversation. If the user supplies an issue number or URL, fetch and read
its full body and comments. Use relevant parent specs, issue history, and repo
context as source material; each ticket must still state its own requirements.

Code exploration is optional. When it will improve the breakdown, inspect the
relevant implementation, domain terms, package guidance, ADRs, tests, and prior
tickets. Group source links by topic, connecting each ticket requirement to its
parent spec and relevant code, documentation, and test references.

Resolve material requirements and dependencies before finalizing the breakdown.
Do not create standalone discovery tickets. Ask the user about material choices
that repository research cannot settle. If the user explicitly skips a choice,
mark it unresolved in the draft; the affected tickets are not ready to publish.

### 2. Design complete implementation tickets

Each implementation ticket must be self-contained: state the complete behavior,
contracts, acceptance requirements, and test strategy needed to implement its
scope. References provide context but do not replace requirements in the ticket.

A ticket may depend on earlier work that provides a genuine prerequisite. It
must not defer required behavior to a later ticket. Plan each merge point so the
app continues to work after the changes land. Include the relevant shared,
backend, frontend, documentation, and test work in the ticket when those parts
are required for its behavior.

Size tickets for effective review and complete behavior. Do not use a context
window as a hard size limit. Propose prefactoring only when it is needed to make
the implementation safe, reviewable, or independently mergeable.

### 3. Plan dependencies and stacks

List only genuine prerequisites in **Blocked by**. Order tickets so blockers
come first. A ticket with no blockers can start immediately.

Use a stack when a complete behavior cannot be merged as independent working
increments, or when one task is too large for effective review and should be
split. State why the stack is needed, its order, the scope of each increment,
and what works at each merge point.

- If each increment leaves the app working, make each one independently
green and merge the increments in order.
- If no increment can land alone while keeping the app working, make the stack
  reviewable in parts but eligible to land only as a complete working unit.
- Never rely on a later ticket to make an already merged implementation work.

Retain expand–migrate–contract for wide mechanical refactors. Keep each step
working at its merge point; use an explicit stack and merge rule when that is
impossible or when review size requires a split.

### 4. Request approval for the breakdown

Present a numbered ticket breakdown for scope approval before writing or
publishing complete ticket content. For each ticket, show its title, blockers,
stack membership and merge order when relevant, merge-point behavior, and a
minimal summary covering every change in its scope. Keep each summary concise
while naming all behavior, contracts, and required shared, backend, frontend,
documentation, and test changes.

Review the breakdown for complete scope coverage, correct prerequisites, useful
granularity, review size, independent mergeability, and unresolved material
requirements. Ask the user to correct gaps or tradeoffs and revise the
breakdown until they approve its scope. Treat approval as sign-off on the
breakdown and scope. Do not proceed while a material requirement remains
unresolved.

### 5. Write and publish the complete tickets

After breakdown approval, expand each approved scope into a complete ticket
using the template below, then publish it without another approval round. Use
the configured destination when one is available. If no destination
configuration exists, default to local files under
`.scratch/<feature-slug>/issues/`.

- For local files, write one ticket per file, numbered from `01` in dependency
  order. Record blockers by number and title.
- For a real issue tracker, create one issue per ticket in dependency order.
  Use native blocking or sub-issue links when available; otherwise record
  **Blocked by** in the issue. Apply the `ready-for-agent` label by default.
- Preserve the parent issue. Do not close or modify it.

When creating tickets on a tracker, publish blockers before dependents so the
relationships can use real issue identifiers. Work the frontier: a ticket is
ready to start when all of its blockers are done.

## Ticket template

Use the spec structure below as the base. Put blockers, merge plan, scope, and
status in the ticket header. Group source links by topic. Keep scope details
when they prevent ambiguity or drift.

```markdown
# <NN> — <Ticket title>

**Status:** ready-for-agent

**Blocked by:** <Prerequisites, or "None — can start immediately.">

**Scope:** <Boundaries when needed to prevent ambiguity or scope drift.>

**Merge plan:** <Independent merge, or stack order, merge rule, and behavior.>

## TL;DR

<One or two sentences: what works when this ticket lands.>

## Source topics

- **<Topic>** — <Parent spec/issue section and relevant code, docs, tests,
  glossary, or ADR links.>

## Problem

<The user or system problem this ticket addresses.>

## Solution

<The desired outcome of this ticket.>

## Behavior

<Complete behavior and relevant contracts for this ticket's scope.>

## Acceptance requirements

- [ ] <Observable requirement, including relevant boundary or failure cases.>

## Implementation decisions

<Confirmed choices and reasoning when they affect implementation.>

## Test strategy

<Concise behavior, test layers, and coverage required for this ticket.>

## Key files

- `<path>` — <edit | read | test>: <what changes, or what to follow>
```

Key files use the format of the `to-spec` Key files section
([`../to-spec/SKILL.md`](../to-spec/SKILL.md)). List every file the ticket
needs in full, taken from the spec's list plus anything the ticket adds; a
ticket never says "see the spec" for its files. Confirm every path without
`(new)` exists before publishing.

Use a source-topic bullet for the parent issue or spec when one exists. The
local file number and title identify local blockers; tracker issues use native
relationships where supported.

Describe behavior and contracts rather than prescribing a file-by-file edit
plan. Link to relevant existing files. Include a schema, type, state machine, or
example only when it resolves real ambiguity; identify prototype-derived
examples as such.
