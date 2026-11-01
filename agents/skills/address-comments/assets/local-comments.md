# Local Comment Workflow

Use this workflow for comments supplied in the current session or in a local
handoff file. Treat each actionable comment as a separate unit of work.

## Establish the source

1. For current-session comments, use the user's supplied comment and context.
   Ask for missing context only when it cannot be recovered from the workspace.
2. For handoff comments, read the named temporary or local handoff file. It must
   identify affected paths, relevant context, suggested changes, and pending
   decisions well enough for this session to act without the prior conversation.
   If a handoff is incomplete, inspect the workspace for missing context and
   ask the user only for details that remain unavailable.
3. Read repository instructions, applicable package guidance, and any
   specification or documentation needed to understand the comment.
4. Preserve unrelated user changes. Stop before editing if the requested scope
   overlaps dirty user changes in a way that cannot be safely isolated.

## Address one comment

Apply the shared classification rules in the main skill. Select one active
comment and handle it fully before analyzing or acting on another comment.

Work on only the active comment. Never edit, test, commit, or reply to multiple
comments concurrently. Make the smallest scoped edit. Add or update a
focused regression test when the change affects behavior. Run the narrowest
complete validation for the changed package, review the diff, and run
`git diff --check`. Report checks that could not run.

After implementing the active comment, present its context, the fix, and
validation results. For a safe change, offer to commit it. For a change that
needed approval before editing, request approval of the implemented change and
offer to commit it in that same request. A clear approval commits the current
change and authorizes proceeding immediately to the next comment; do not ask
for a second approval after the commit. If the response is unclear, clarify
without committing or proceeding. If the user rejects the fix or requests an
adjustment, continue only on the active comment and repeat this review step.

Approval before editing authorizes only the specific decision described. It
does not authorize another comment. Approval of the implemented change and its
commit authorizes moving to the next comment.

## Handoff

If the work moves to another session, update or create a self-contained
handoff. Include unresolved comments, affected paths and context, suggested
changes, pending decisions and approaches, decisions already made, completed
fixes, validation results, and the approval status for the next comment.
