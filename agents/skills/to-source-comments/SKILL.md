---
name: to-source-comments
description: >-
  Add useful, durable TSDoc comments to meaningful TypeScript changes when
  explicitly invoked with $to-source-comments.
---

# Document TypeScript Changes in Source

Add TSDoc comments beside meaningful TypeScript changes when they explain
behavior, rationale, constraints, or intent that the code does not make clear.
Every comment must add value beyond the code itself.

## Workflow

1. Identify the relevant source diff from the task or session. Use the supplied
   diff when available; otherwise inspect the clearly related working-tree or
   branch diff. If the task scope cannot be identified, ask before editing.
2. Read the changed TypeScript source and enough surrounding code to understand
   each meaningful change. Read relevant documentation supplied or identified
   in the task, along with relevant session history. Follow the closest
   package-specific style guidance.
3. Review each behaviorally meaningful change. Do not comment on mechanical,
   self-evident, or otherwise clear behavior. Add a comment only when it gives
   a maintainer useful context that is not already apparent from the code.
4. Write durable source documentation that explains the relevant intent,
   behavior, design reason, or constraint. Avoid changelog narration and
   paraphrases of what the code visibly does. Ground claims in the diff, code,
   documentation, or session context.
5. Use TSDoc block syntax (`/** ... */`) only. Place each comment at the nearest
   useful code anchor. Extend an existing TSDoc block when appropriate instead
   of adding a duplicate. Keep comments concise and consistent with the
   package's conventions.
6. If relevant sources conflict or intent remains unclear after inspecting all
   available context, ask the user before editing the affected source. Do not
   invent rationale or change executable code to resolve the ambiguity.
7. Review the final diff. Confirm every added or updated comment is anchored
   beside the code it documents, adds useful context, and leaves runtime
   behavior unchanged. Report the source files changed and any unresolved
   questions.

## Comment quality

A useful comment answers something a maintainer cannot readily learn from the
code, such as why a constraint exists or which behavior must remain stable.
Prefer one focused comment near the affected code over broad file-level notes.
When multiple related changes share one rationale and anchor, document them
once. Keep distinct rationale near its own code.

The skill edits TypeScript source files directly. Do not create GitHub review
comments or separate comment-draft files.
