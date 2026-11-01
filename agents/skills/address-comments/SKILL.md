---
name: address-comments
description: >-
  Address review comments from the current session, a handoff file, or a remote
  pull request, one comment at a time with explicit approval gates.
---

# Address Comments

Address comments one at a time. First identify the source, then read the
matching workflow asset:

- For comments supplied in this session or in a local handoff file, read
  [`assets/local-comments.md`](assets/local-comments.md).
- For comments on the current remote pull request, read
  [`assets/remote-pr-comments.md`](assets/remote-pr-comments.md).

If a request includes comments from more than one source, choose one source and
work through one comment at a time. Never work on multiple comments at once. For
remote PR comments, after committing and replying to the active comment,
proceed immediately to the next active comment without asking for a second
approval.

## Shared rules

- Preserve unrelated user changes. Keep each comment's changes isolated from
  other comments.
- A safe fix is explicit and contract-preserving; apply it without asking first.
  Behavior, API, compatibility, and scope changes need explicit user
  confirmation before editing.
- For a pending decision, present the comment context, viable approaches, and a
  recommendation. Wait for explicit confirmation before editing.
- Confirmation for a specific change does not approve another change or the
  next comment.
- After implementing a comment, show its context, the fix, and validation. For a
  safe change, offer to commit it. For a change that needed approval before
  editing, request approval of the implemented change and offer to commit it in
  that same request. A clear approval commits the current change and authorizes
  proceeding to the next comment; do not ask for a second approval after commit.
- When an approval gate applies, accept only a clear approval to proceed. If
  the response is unclear, ask for clarification and do not continue. If the user rejects the fix, keep working
  only on that comment.
- When handing work to another session, leave a self-contained handoff with
  affected paths, context, suggested changes, pending decisions, decisions
  already made, completed fixes, validation, and the next approval status.

## Completion

Report addressed and unresolved comments, decisions awaiting the user, relevant
validation, commits and remote replies when applicable, and the final worktree
state.
