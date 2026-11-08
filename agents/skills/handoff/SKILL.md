---
name: handoff
description:
  Compacts the current conversation into a new or refreshed handoff document
  for another agent to continue. Use when a session ends and another agent will
  pick up the work.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

## Rules

These apply when creating and when refreshing a handoff.

- Tailor the snapshot and next steps to the argument, which states what the
  next session is for.
- Treat `## Task history` as append-only. Keep every earlier entry's wording;
  record changes and corrections in new entries (step 6b).
- Mark history you cannot recover as unknown; never infer it.
- Redact secrets and personally identifying information in every entry you
  write, including quoted command output.

## Steps

1. Identify the task or workstream the next agent must continue, and its
   target spec or task file, if any. Done when you can name the identifier.
2. Name the file. Keep one continuing workstream in one stacked handoff file
   named `{identification-in-kebab-case}.handoff.md`. For a handoff about a
   specific spec or task file, keep that target's full kebab-case basename
   and replace `.md` with `.handoff.md`: `plan.md` gets `plan.handoff.md`,
   `sync-replay-task.md` gets `sync-replay-task.handoff.md`, and
   `sync.spec.md` gets `sync.spec.handoff.md`. For work without a specific
   target file, use a concise, distinctive workstream identifier. Done when
   the filename is fixed.
3. Find the existing handoff. When the user supplies a handoff path, refresh
   that file and skip the search. Otherwise search the target file's
   directory, the repository
   (`git ls-files -co --exclude-standard '*.handoff.md'`), and
   `/tmp/*.handoff.md`. A file matches when its name carries the workstream
   identifier or its `# Handoff:` title names the workstream.
   - One match: refresh it (step 6b).
   - Several matches: list them and ask the user which to refresh.
   - No match: create a fresh handoff (step 6a).

   If a matching handoff already exists under a different filename, rename it
   while preserving its full contents and update references to the old path.
   Done when the mode (create or refresh) and the path are known.
4. Choose the directory for a new root handoff by this order:
   1. Use the directory of an existing handoff for the same workstream.
   2. Otherwise, if a relevant spec or task file exists, use the directory
      containing the target file.
   3. Otherwise, if the repository has a `.scratch/` directory, use that
      directory.
   4. Otherwise, use `/tmp`. Tell the user the file will not survive a
      reboot.

   Done when the directory is fixed.
5. Check for scope drift. Each handoff holds one scope, and every refresh is
   an increment of that same scope. Compare the work this session did and the
   argument's purpose for the next session with the handoff's Goal:
   - Same scope (the next increment of the same goal, even across phases):
     write to this handoff.
   - Drifted scope (a different subtask, component, or ticket that will
     continue in its own sessions): propose a scoped sub-handoff, naming the
     scope and what moves into it. Create it only after the user approves;
     otherwise write to this handoff.

   For each approved sub-handoff:
   - Name it `{root}.{scope}.handoff.md`, where `{root}` is the root
     handoff's identification without `.handoff.md` and `{scope}` is a
     concise kebab-case name. Work rooted at `sync.spec.md` keeps
     `sync.spec.handoff.md`; the `replay` scope gets
     `sync.spec.replay.handoff.md`. Put it beside the root handoff.
   - Fill its `Links` line with the root handoff, the main spec, and the task
     file for its scope.
   - Keep only its own goal, status, history, and next steps; link to the
     root for parent context instead of copying it.
   - Add it to the root's `Scoped handoffs` list with its scope and
     relationship to the root task, and record the split in the root's new
     history entry. Later work in that scope refreshes the sub-handoff, not
     the root.

   Done when the target handoff for this session is fixed, and every
   approved sub-handoff is named and linked both ways.
6. Write the handoff.
   - 6a. Create: follow [Create a fresh handoff](#create-a-fresh-handoff).
   - 6b. Refresh: follow
     [Refresh an existing handoff](#refresh-an-existing-handoff).

   Done when the file holds the current snapshot and this session's history
   entry.
7. Verify and report. Check the file has every template heading and that the
   new history entry is last. Reply with the absolute path of each handoff
   written and one line the user can paste into the next session:
   `Continue the work in {absolute path}.` Done when the user has the path.

## Create a fresh handoff

Create both a current snapshot and a historical task record. Reconstruct the
record from available session context and task artifacts, tracing the work from
its spec or initial request through decisions, evidence, implementation, and
validation. Summarise findings and link to their sources rather than copying
large artifacts.

```markdown
# Handoff: {Workstream}

Links: {sub-handoff only: root handoff, main spec, and task file, as relative
paths. Root handoff: omit this line.}

Scoped handoffs: {root only: each sub-handoff with its scope and relationship
to the root task. Omit while there are none.}

## Goal

{Requested outcome and constraints. When a spec exists, link it and state only
what it omits.}

## Current snapshot

Workspace: {absolute repository path} @ {branch} {short HEAD SHA};
uncommitted: {changed paths, or none}

{Latest status, completed work, remaining work, and active blockers}

## Next steps

{Ordered, actionable steps for the next agent}

## Open decisions

{Decision awaiting the user: options, recommendation, and approval status.
Write "None" when nothing is pending.}

## Task history (append-only)

### {YYYY-MM-DD} — {phase: design, implementation, review, or similar}

- Scope or spec: {request, requirement, or spec and source link}
- Decisions: {choice, reason, and whether it remains current}
- Evidence: {finding or observation and source link}
- Implementation: {change and affected files or commit}
- Validation: {check performed and result}

## Key files

{Link the spec's and task's Key files. List only files the sessions found
beyond them, as `path` — edit, read, or test.}
```

Get the date with `date +%F`. Write `unknown date` for an unrecoverable
session. Link handoffs to each other by path relative to the handoff file.
List key files relative to the repository root; when the handoff lives outside
the repository, the Workspace line gives the root.

Add chronological history entries for relevant prior sessions and the current
session. Record decisions with their rationale, evidence with its source, code
and artifact changes, and validation results, including failures that affect
the work.

## Refresh an existing handoff

Read the handoff in full. Open a linked artifact only when it changed since
the last history entry (check `git log --since={last entry date} -- <path>` or
the file's mtime) or when the snapshot you are writing depends on it. Then
compare the handoff with the current conversation and task state.

1. Append a dated entry for this session. Add its decisions and rationale,
   evidence and source links, implementation changes, and validation results.
2. Update the Workspace line, current snapshot, and next steps to reflect the
   latest evidence. Move a decision out of Open decisions into the new history
   entry once the user settles it. These sections describe the present and may
   change; the task history remains intact.
3. When a decision or status changes, record it in the new entry as
   `Supersedes: {old entry heading}, {bullet}` and give the reason. Append
   ` _(superseded by {new entry heading})_` to the end of the old bullet.
   Change nothing else in the old entry.
4. When an old entry is factually wrong, record the correction the same way
   with `Corrects:` and its evidence, and append
   ` _(corrected in {new entry heading})_` to the old bullet.
5. Preserve links to old and new artifacts so the record traces the task from
   its initial spec or request through implementation.
