---
name: to-source-comments
description: >-
  Adds durable TSDoc comments that explain the intent behind meaningful
  TypeScript changes. Use when the user invokes it by name on a diff.
disable-model-invocation: true
---

# Document TypeScript Changes in Source

Add TSDoc comments that explain the intent, rationale, or constraints behind
meaningful TypeScript changes. Edit the source files in place; see
[Comment quality](#comment-quality) for what earns a comment.

## Workflow

1. Resolve the diff scope, taking the first source that applies:
   1. A diff, file list, or commit range supplied in the task.
   2. Files this session edited.
   3. Uncommitted changes: `git diff HEAD`.
   4. The branch: `git diff $(git merge-base HEAD <default-branch>)`, where
      `<default-branch>` comes from
      `git symbolic-ref --short refs/remotes/origin/HEAD`.

   Keep only `.ts`, `.tsx`, `.mts`, and `.cts` files. If the chosen source
   mixes unrelated work, or nothing applies, ask the user for the scope. If
   the scope holds no TypeScript changes, report that and stop.
   Done when: you have a named list of in-scope TypeScript files.
2. Before editing, run `scripts/comment-guard.sh snapshot <in-scope files>`
   from the repository root and keep the printed path. Read the changed
   TypeScript source and enough surrounding code to understand each change.
   Read documentation supplied or identified in the task, and relevant session
   history. Find comment conventions in the nearest `AGENTS.md` or
   `CLAUDE.md`, `tsdoc.json`, and ESLint `jsdoc` or `tsdoc` rules, then in two
   or three documented declarations in the same file.
3. Triage each change. A change earns a comment when it carries one of:
   - a constraint or invariant callers rely on;
   - a workaround, with what it works around;
   - an ordering, concurrency, or lifecycle requirement;
   - a non-obvious error-handling, fallback, or default choice;
   - a magic value or limit, with its source;
   - a public API contract change.

   Leave everything else to the code. Also check each existing comment on the
   changed declarations. Correct any that the change makes inaccurate. Delete
   any that describe removed behavior.
   Done when: every in-scope change is marked comment or skip.
4. Mark an anchor unclear when sources conflict or its intent cannot be
   grounded in the diff, code, documentation, or session context. Skip
   unclear anchors, finish the clear ones, then ask the user about all
   unclear anchors in one message. Apply the answers. Leave unanswered
   anchors uncommented and list them in the report.
   Done when: every anchor is written, answered and written, or reported
   as open.
5. Draft each comment to meet [Comment quality](#comment-quality).
6. Anchor each comment on the nearest declaration that owns the behavior:
   function, method, class, property, type, or exported constant. Use TSDoc
   block syntax (`/** ... */`). Put the summary first, and put rationale or
   constraints under `@remarks`. Add `@param`, `@returns`, or `@throws` only
   when they state something the signature does not. When the rationale is
   about one statement inside a body, name that statement in the enclosing
   declaration's `@remarks`. Use an inline `//` comment there only if the
   package already does so. If the anchor already has a TSDoc block, extend
   that block.
   Done when: every comment sits on a declaration or follows an existing
   package convention.
7. Review the final diff. Confirm every added, updated, or deleted comment is
   anchored beside the code it documents and adds useful context. Run
   `scripts/comment-guard.sh check <path>` with the path from step 2. On exit
   1, revert the listed non-comment edits and re-run until it passes. Report
   one line per comment, `path:line` and a few words on what it documents,
   then the open anchors from step 4.

## Comment quality

A useful comment is durable: it states what a maintainer cannot learn from
the code, such as why a constraint exists or which behavior must stay
stable. Write it as present-tense fact about the code, not as a changelog
entry. Prefer one focused comment at its anchor over file-level notes. When
related changes share one rationale and one anchor, document them once.
Keep each distinct rationale beside its own code. Match the package's
comment length and tone.
