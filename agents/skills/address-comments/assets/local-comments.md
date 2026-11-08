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

## Address one comment

Select one active comment and handle it fully before analyzing or acting on
another comment. Work on only the active comment. Never edit, test, commit, or
reply to multiple comments concurrently.

Classify, implement, and validate it under the main skill's Shared rules.
Then apply the review gate in the main skill's Shared rules.
