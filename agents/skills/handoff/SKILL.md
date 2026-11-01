---
name: handoff
description:
  Compact the current conversation into a handoff document for another agent to
  pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

## Choose the filepath

Identify the task or workstream the next agent must continue. For the ordinary
case, keep the work in one stacked handoff file named
`{identification-in-kebab-case}.handoff.md`. For a handoff about a specific spec
or task file, use that target's kebab-case basename: `plan.md` gets
`plan.handoff.md`, while `sync-replay-task.md` gets
`sync-replay-task.handoff.md`. For work without a specific target file, use a
concise, distinctive workstream identifier.

Split work into separate handoffs only when a subtask is meant to continue as an
independent workstream. Keep the parent handoff as the root record, and name each
scoped handoff `{root}.{scope}.handoff.md`, where `{root}` is the root handoff's
identification without `.handoff.md`, and `{scope}` is a concise kebab-case name
for that subtask. For example, work rooted at `spec.md` keeps `spec.handoff.md`;
separately tracking the `replay` and `resume` subtasks uses
`spec.replay.handoff.md` and `spec.resume.handoff.md`. A scoped handoff belongs
beside the root handoff. Do not split ordinary stacked progress into a new file
just because it has phases or next steps.

Every split handoff must link to its parent and sibling handoffs where relevant.
The root handoff should list each active scoped handoff and briefly state its
scope and relationship to the root task. Scoped handoffs should describe only
their own goal, status, history, and next steps; include relevant parent context
by linking to the root rather than duplicating its history. If a matching
handoff already exists under a different filename, rename it while preserving
its full contents and update references to the old path. Choose the directory
for a new root handoff by this order:

1. Use the directory of an existing handoff for the same workstream.
2. Otherwise, if a relevant spec or task file exists, use the directory
   containing the target file.
3. Otherwise, if the repository has a `.scratch/` directory, use that directory.
4. Otherwise, use `/tmp`.

Use one file for one continuing workstream. A root handoff and its explicitly
split scoped handoffs form a linked set of workstreams.

## Create a fresh handoff

Create both a current snapshot and a historical task record. Reconstruct the
record from available session context and task artifacts, tracing the work from
its spec or initial request through decisions, evidence, implementation, and
validation. Summarise findings and link to their sources rather than copying
large artifacts. Mark unavailable history as unknown instead of inferring it.

```markdown
# Handoff: {Workstream}

## Goal

{Requested outcome and constraints}

## Current snapshot

{Latest status, completed work, remaining work, and active blockers}

## Next steps

{Ordered, actionable steps for the next agent}

## Task history (append-only)

### {phase} — {Date or session}

- Scope or spec: {request, requirement, or spec and source link}
- Decisions: {choice, reason, and whether it remains current}
- Evidence: {finding or observation and source link}
- Implementation: {change and affected files or commit}
- Validation: {check performed and result}

## Key files

{Repository-relative path or URL}
```

Add chronological history entries for relevant prior sessions and the current
session. Record decisions with their rationale, evidence with its source, code
and artifact changes, and validation results, including failures that affect
the work. Tailor the current snapshot and next steps to any user-provided
arguments. Redact secrets and personally identifying information.

## Refresh an existing handoff

Read the full handoff history and its linked artifacts, then compare them with
the current conversation and task state. Preserve the existing history as a
record; never delete or silently rewrite a historical decision, evidence item,
implementation record, or validation result.

1. Append a dated entry for this session. Add its decisions and rationale,
   evidence and source links, implementation changes, and validation results.
2. Update the current snapshot and next steps to reflect the latest evidence.
   These sections describe the present and may change; the task history remains
   intact.
3. When a decision or status changes, append the new information and mark the
   earlier entry as superseded in a new note. Preserve the original wording and
   evidence.
4. If a historical entry is factually wrong, append a correction with its
   evidence and identify the affected entry. Keep the original entry visible.
5. Preserve links to old and new artifacts so the record traces the task from
   its initial spec or request through implementation.

Do not remove completed actions from the historical record when updating next
steps. If prior sessions or evidence cannot be recovered, state that gap rather
than implying the record is complete. Tailor the current snapshot and next steps
to any user-provided arguments.
