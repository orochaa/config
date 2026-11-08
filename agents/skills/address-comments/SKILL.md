---
name: address-comments
description: >-
  Addresses review comments one at a time with approval gates, from this
  session, a handoff file, or a GitHub pull request. Use when the user asks to
  address, fix, or reply to review comments or PR feedback.
disable-model-invocation: true
---

# Address Comments

When the user asks for a single direct action (commit, reply, push), do just
that action and skip the per-comment gates.

Address comments one at a time. First identify the source, then read the
matching workflow asset:

- For local comments supplied in this session or recorded in a handoff, read
  [`assets/local-comments.md`](assets/local-comments.md).
- For GitHub review comments, including a PR handed off from another session,
  read [`assets/remote-pr-comments.md`](assets/remote-pr-comments.md). It runs
  [`scripts/remote-pr-comments.mjs`](scripts/remote-pr-comments.mjs); run the
  script, do not read it.

If comments come from several sources, finish the source the user named
first, then ask before starting the next.

## Shared rules

- Preserve unrelated user changes. Stop before editing when the comment's
  scope overlaps dirty user changes that cannot be isolated. Keep each
  comment's changes isolated from other comments.
- A safe fix is explicit and contract-preserving; apply it without asking first.
  Behavior, API, compatibility, and scope changes need explicit user
  confirmation before editing.
- For a pending decision, present the comment context, viable approaches, and a
  recommendation. Wait for explicit confirmation before editing.
- Confirmation for a specific change does not approve another change or the
  next comment.
- Make the smallest scoped edit. Add or update a focused regression test when
  behavior changes. Run the narrowest complete validation for the changed
  package, review the diff, and run `git diff --check`. Report checks that
  could not run.
- Review gate: after implementing a comment, show its context, the fix, and
  validation. For a safe change, offer to commit it. For a change that needed
  approval before editing, request approval of the implemented change and
  offer to commit it in that same request. A clear approval commits the
  current change and authorizes proceeding to the next comment; do not ask
  for a second approval after commit.
- When an approval gate applies, accept only a clear approval to proceed. If the
  response is unclear, ask for clarification and do not continue. If the user
  rejects the fix or asks for an adjustment, rework only the active comment and
  repeat the review gate.
- When handing work to another session, write a handoff in the format of
  [`handoff/SKILL.md`](../handoff/SKILL.md). Put unresolved comments and the
  next approval status in its Open decisions section. For a remote PR, list
  the archive path in Key files as `path` — read.

## Completion

Complete when no pending comment remains (the local list is empty, or
`read-pending` returns a null thread) or the user stops. For a remote PR,
push once here (see the remote workflow). Report addressed and unresolved
comments, decisions awaiting the user, relevant validation, commits, remote
replies and the push when applicable, and the final worktree state.
