---
name: review-and-refine
description: >-
  Reviews a completed branch on standards, spec, and refinement axes and saves
  the findings to a review file; applies safe fixes and validates only when
  asked to edit. Use when a finished branch needs review before a pull request
  or after implementation.
disable-model-invocation: true
---

# Review and Refine

Review the branch on three independent axes. The parent agent owns every edit
and validation; each review sub-agent reports once and edits nothing.

## 1. Establish the review scope

1. Set the session mode. The mode is **read-only** unless the user's request
   explicitly asks for edits; then it is **writable**. Switch to writable
   mid-session only on a new explicit user request. Done when the mode is
   recorded for the review file.
2. Run `scripts/review-scope.sh [<base>]` from the repository root, using the
   absolute path of this skill's folder. Pass the base branch the user named;
   the script defaults to `main`. It covers added, modified, renamed, copied,
   deleted, staged, unstaged, and untracked files. On exit 2, relay its
   message and stop:
   - Base does not resolve: ask the user for the base.
   - Empty scope: tell the user there is nothing to review against `<base>`,
     and write no review file.

   Done when the script exits 0. Its output plus the commands
   `git diff <base>...HEAD` and `git diff HEAD` form the **scope block**.
3. Build the guidance set for every affected scope:
   - Start from the script's `guidance:` paths, and add the docs they route to
     for the changed areas.
   - Read the closest relevant documentation: package `README`s, feature
     specifications, and Markdown adjacent to the changed code.
   - Read every project skill (`.claude/skills/`, `.agents/skills/`) whose
     description covers the changed area, and the closest local or package
     style guide. Where guidance conflicts, these override broader docs.
   - Use broad repository documentation and the general style guide only to
     fill a gap the local guidance does not cover.
   - Read any QA checklist the guidance set routes to; use it to select
     relevant QA recommendations.

   Done when the guidance set is written as a list of file paths and each
   path is confirmed with `ls`.

## 2. Find the specification

Find the originating specification; stop at the first hit:

1. A path the user supplied.
2. Issue references in commit messages, resolved with the issue-tracker doc
   the guidance set names, if any.
3. A file under `docs/`, `specs/`, or `.scratch/` whose name or title contains
   the branch name or a commit-subject keyword.
4. Ask the user. If none exists, record `no spec available` and skip the Spec
   sub-agent.

Record the spec path and issue URL; later steps reuse them.

The Standards source is the guidance set plus
[`references/smell-baseline.md`](references/smell-baseline.md).

## 3. Run the parallel reviews

Spawn the Standards and Refinement sub-agents, plus Spec when a specification
exists, in parallel, once each. Give every agent the scope block. Sub-agents
run the diff commands and read untracked files themselves. Brief every agent
with these shared rules:

- Review every changed file, tests included. Report findings; never edit
  files.
- Keep every relevant finding visible. Mark each repair or refinement that
  requires behavior, architecture, public surface, or validation beyond the
  task as **Scope expansion**.
- Keep each finding to one line: `path:line`, rule or smell, a quote of at
  most one line, and the repair. When findings exceed 40 lines, keep every
  hard violation, then list the remaining findings by name and `path:line`
  only. (40 lines keeps the report near its old 400-word budget without
  dropping a finding.)

Run one review round; the parent's validation verifies repairs, not new
reviewers. If a sub-agent fails, returns nothing, or returns an incomplete
report (Standards without its file list), resume that same agent once with
the gap named. If it is still incomplete, mark that axis **incomplete**, with
the reason, in the review file and the Report.

### Standards

Pass the guidance-set file paths and the absolute path of
`references/smell-baseline.md`; never pass a summary of the rules. Instruct
the agent to:

1. Read every standards file and the smell baseline before reporting.
2. Report every documented-standard violation per file or hunk, citing the
   source file and rule.
3. Report every baseline smell, naming it and quoting the hunk.
4. Report each function call used directly as a condition (for example,
   `if (foo())`), suggesting a named variable for the result
   (`const isReady = foo(); if (isReady)`), unless the guidance set allows it.
5. Distinguish hard documented violations from smell judgement calls, applying
   the baseline's precedence rules.
6. Open the report with the list of standards files read. A report without
   that list is incomplete.

### Spec

Provide the specification path or contents. Instruct the agent to:

1. Report requirements that are missing or partial.
2. Report behavior not requested by the specification.
3. Report requirements that appear implemented but incorrectly.
4. Quote the relevant specification line for every finding.

### Refinement

Provide the applicable style guides and every project skill from the guidance
set that covers the changed area; the agent applies each one. Ask the agent to
report only issues not already belonging to Standards or Spec. Instruct the
agent to:

1. Cover documentation, exports, package metadata, build configuration, and
   compatibility changes as well as implementation.
2. Identify concrete correctness, edge-case, public-API, type/runtime,
   immutability, error-handling, supported-environment, documentation, and
   test-coverage issues. Check asynchronous and stateful code for race
   conditions and related lifecycle failures, including relevant interleavings,
   stale results, cancellation or disposal, retries, late events, and cleanup.
3. Assess success, failure, boundary, invalid-runtime-input, and regression test
   coverage where relevant. Confirm each test belongs to its named unit.
4. Quote the relevant hunk and suggest a compatibility-preserving repair.

## 4. Reconcile

Reconcile findings against the reviewed diff. Mark each finding open; in
writable mode, mark it fixed once repaired. If HEAD moves during the review,
record the SHA the sub-agents reviewed and list the newer commits as **not
reviewed**.

## 5. Write the review file

1. Name the file by [`handoff`](../handoff/SKILL.md) step 2 and choose its
   directory by step 4, reading `review` wherever those steps say `handoff`:
   the suffix is `.review.md`, so `sync.spec.md` gets `sync.spec.review.md`.
   Keep one file per review workstream.
2. If the file exists, read it in full. Append a section headed
   `## Review — <YYYY-MM-DD>`, and keep earlier sections verbatim. Record
   resolutions or corrections in the new section, citing the earlier finding.
3. Open the section with the mode, branch, base, and full SHA of the latest
   commit checked. Link the spec and issue recorded in step 2, and any
   `{target}.handoff.md` in the review file's directory. Link local files by
   path relative to the review file and issues by URL.
4. Use the Report headings as `###` sections. Give each finding its
   `path:line`, a code quote, the suggested change, and `open` or `fixed`.
   Include pending decisions and relevant validation recommendations.

Done when a later agent could act on every finding without this conversation.
In read-only mode, leave every other repository file unchanged and go to the
Report.

## 6. Writable: refine and validate

1. Apply safe, compatibility-preserving improvements: formatting, clearer
   comments, documentation corrections, missing tests, explicit imports, and
   focused cleanup.
2. Treat any change to a public name, supported behavior, resolved public
   type, ordering, persistence, or other consumer contract as a **decision**:
   record it in the review file and wait for user direction. With direction,
   implement only that decision and validate its scope.
3. When the user states a review convention as a rule to keep and the
   applicable style guide lacks it, offer to add it there; add it on approval.
4. Run the narrowest complete validation: applicable formatting and lint
   checks, typechecking, focused tests, and the relevant package build. State
   only checks actually run.
5. Review the final diff. Confirm no unrelated or user changes were
   overwritten, no generated output was accidentally included, and
   `git diff --check` passes. Skip changes the guidance set marks as automated
   (for example, generated version bumps).
6. Add completed changes, validation results, and remaining findings or
   decisions to this session's review-file section.

## Report

Lead with whether the branch is ready for review. Present `## Standards` and
`## Spec` first, keeping their reports separate; in writable mode, identify
the findings the parent fixed. Then present `## Refinements and validation`:
in writable mode, completed cleanup, commands and results, and checks not
completed; in both modes, QA recommendations relevant to the diff. End with
`## Decisions` for unresolved contract, rename, scope, or PR questions. Keep
completed cleanup separate from decisions.
