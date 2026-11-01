---
name: review-and-refine
description: >-
  Review and safely improve a completed branch before pull-request review or
  after implementation. Assess repository standards, the originating
  specification, and refinement concerns, then validate the affected scope.
disable-model-invocation: true
---

# Review and Refine

Review the branch on three independent axes. A review session leaves source
files unchanged by default: inspect and report findings, then save the review to
a `.review.md` file. Change to a writable refinement session only when the user
explicitly requests edits. The parent agent owns every edit and validation; each
review sub-agent reports once and never changes the branch.

## 1. Establish the review scope

1. Use the base branch named by the user, or `main` when none is supplied.
   Confirm it resolves with `git rev-parse <base>`.
2. Capture these artifacts once:
   - `git branch --show-current` and `git rev-parse HEAD` for the branch and
     latest commit checked.
   - `git diff <base>...HEAD` and `git log <base>..HEAD --oneline` for the
     committed branch comparison.
   - `git diff HEAD` and `git status --short` for staged and unstaged work.
   - Contents of any untracked files in scope.
3. Fail when the combined committed and working-tree scope is empty. Include
   added, modified, renamed, copied, deleted, staged, unstaged, and untracked
   files in the review.
4. Build a guidance set for every affected scope before reviewing:
   - Read the closest relevant documentation: package `README`s, feature
     specifications, and Markdown adjacent to the changed code.
   - Read every task-specific skill that applies to the changed scope, and the
     closest local or package style guide. These are the source of truth.
   - Use broad repository documentation and the general style guide only to fill
     a gap the local guidance does not cover; do not scan them by default.
   - Read `docs/22-qa-checklist.md` to select relevant QA recommendations.

## 2. Find the specification and standards

Find the originating specification in this order:

1. Issue references in commit messages using `docs/agents/issue-tracker.md`.
2. A path the user supplied.
3. A matching file under `docs/`, `specs/`, or `.scratch/`.
4. Ask the user where the specification is. If none exists, record
   `no spec available`; still run the Spec sub-agent.

Use the guidance set as the Standards source. The Standards review also uses
this Fowler smell baseline. A documented repository standard overrides the
baseline, every smell is a judgement call rather than a hard violation, and
tooling-enforced rules are out of scope.

Keep every relevant finding visible. Mark each proposed repair or refinement
that requires behavior, architecture, public surface, or validation beyond the
task as **Scope expansion**.

- **Mysterious Name** — a name does not reveal what it does or holds. → Rename
  it; if no honest name comes, the design is murky.
- **Duplicated Code** — the same logic shape appears in more than one changed
  hunk or file. → Extract the shared shape and call it from both sites.
- **Feature Envy** — a method reaches into another object's data more than its
  own. → Move it onto the data it envies.
- **Data Clumps** — the same fields or parameters travel together. → Bundle them
  into one type and pass that.
- **Primitive Obsession** — a primitive represents a domain concept deserving
  its own type. → Give that concept a small type.
- **Repeated Switches** — the same `switch` or `if` cascade on one type recurs.
  → Use polymorphism or one shared map.
- **Shotgun Surgery** — one logical change forces scattered edits. → Gather what
  changes together into one module.
- **Divergent Change** — one module changes for several unrelated reasons. →
  Split it so each module changes for one reason.
- **Speculative Generality** — an abstraction, parameter, or hook has no
  specification need. → Delete it or inline it until a real need exists.
- **Message Chains** — long `a.b().c().d()` navigation exposes an internal walk.
  → Hide it behind one method on the first object.
- **Middle Man** — a class or function mostly delegates onward. → Remove it and
  call the real target directly.
- **Refused Bequest** — a subclass or implementer ignores most inherited
  behavior. → Prefer composition over that inheritance.

## 3. Run exactly three parallel reviews

Spawn the following three sub-agents in parallel, once each. Give every agent
the committed diff command, working-tree diff command, commit list, and
untracked-file contents. Do not launch another review sub-agent after repairs.
The reviews are read only: agents report findings and never edit files.

### Standards

Provide the full list of standards-source files and the complete smell baseline
above. Instruct the agent to:

1. Report every documented-standard violation per file or hunk, citing the
   source file and rule.
2. Report every baseline smell, naming it and quoting the hunk.
3. Distinguish hard documented violations from smell judgement calls.
4. Apply a repository standard over the baseline and skip tooling-enforced
   rules.
5. Keep the report under 400 words.

### Spec

Provide the specification path or contents. Instruct the agent to:

1. Report requirements that are missing or partial.
2. Report behavior not requested by the specification.
3. Report requirements that appear implemented but incorrectly.
4. Quote the relevant specification line for every finding.
5. Report exactly `no spec available` if no specification is available.
6. Keep the report under 400 words.

### Refinement

Provide the applicable style guides and ask the agent to report only issues not
already belonging to Standards or Spec. Instruct the agent to:

1. Review every changed file, including tests, documentation, exports, package
   metadata, build configuration, and compatibility changes.
2. Identify concrete correctness, edge-case, public-API, type/runtime,
   immutability, error-handling, supported-environment, documentation, and
   test-coverage issues. Check asynchronous and stateful code for race
   conditions and related lifecycle failures, including relevant interleavings,
   stale results, cancellation or disposal, retries, late events, and cleanup.
   For WebSocket sync changes, use `when-websocket-sync` to trace both peers,
   recovery paths, and terminal connection behavior.
3. Assess success, failure, boundary, invalid-runtime-input, and regression test
   coverage where relevant. Confirm each test belongs to its named unit.
4. Quote the relevant hunk and suggest a compatibility-preserving repair. Mark
   each recommendation that exceeds the task as **Scope expansion**.
5. Extract function results from conditional expressions into named variables
   before the condition (for example, `if (foo())` becomes
   `const result = foo(); if (result)`). Name the variable for the returned
   value.
6. Keep the report under 400 words.

## 4. Refine and validate

1. Keep the three reports separate; do not merge or rerank Standards and Spec.
   Reconcile findings against the reviewed diff, marking each fixed or open.
2. In a read only session, write the reports to the review file selected below.
   Include the affected file paths, enough surrounding context to locate each
   issue, the suggested change, and any pending decision. Include review scope,
   specification status, and validation recommendations so a later session can
   act without this conversation. Leave other repository files unchanged.
3. Enter a writable refinement session only when the user explicitly requests
   edits. Then apply safe, compatibility-preserving improvements: formatting,
   clearer comments, documentation corrections, missing tests, explicit imports,
   and focused cleanup.
4. Do not silently rename public symbols, remove supported behavior, change
   resolved public types, or alter ordering, persistence, or other consumer
   contracts. Put each such decision in the review file and wait for user
   direction. When the user supplies direction, implement only that decision and
   validate its scope.
5. When the user establishes a reusable review convention absent from the
   applicable style guide, add it to that style guide during a writable session.
6. In a writable session, run the narrowest complete validation: applicable
   formatting and lint checks, typechecking, focused tests, and the relevant
   package build. State only checks actually run. Recommend only QA checks
   relevant to the diff.
7. In a writable session, review the final diff. Confirm no unrelated or user
   changes were overwritten, no generated output was accidentally included, and
   `git diff --check` passes. Do not report automatic `tauri.conf.json` version
   bumps as findings.
8. In a writable session, record completed changes, validation results, and
   remaining findings or decisions in the review file as directed below.

## Choose the review filepath

Identify the task or workstream under review. Name the file
`{identification-in-kebab-case}.review.md`. For a review about a specific spec
or task file, use that target's kebab-case basename in the
`{spec|task}.review.md` pattern. For example, `plan.md` gets `plan.review.md`,
while `sync-replay-task.md` gets `sync-replay-task.review.md`. For work without
a specific target file, use a concise, distinctive workstream identifier. Apply
this filename format in every location. If a matching review has a different
filename, rename it while preserving its full contents and update references to
the old path. Choose its directory by this order:

1. Use the directory of an existing review for the same workstream.
2. Otherwise, if a relevant spec or task file exists, use the directory
   containing the target file.
3. Otherwise, if the repository has a `.scratch/` directory, use that directory.
4. Otherwise, use `/tmp`.

Use one file for one review workstream. If it exists, read it in full and append
a dated section with this session's new findings, completed changes, validation
results, and decisions. Preserve earlier entries verbatim. Record resolutions or
corrections in the new section, referencing the earlier finding. For a new file,
write the first section. In every section, record the reviewed branch, base
branch, and full SHA of the latest commit actually checked. If HEAD changes
during the review, check the new commits before advancing that SHA. Find the
related spec and issue from the review scope, and look for a handoff for the
same workstream in the target directory, repository, and `/tmp`. Add Markdown
links to each available spec, issue, and handoff in every section. Link local
files by path relative to the review file and issues by URL. Make the review
standalone: a later agent must be able to address every finding without access
to this conversation. Include the diff scope, specification status, each finding
with affected paths and code context, the suggested change, pending decisions,
and relevant validation recommendations. Mark unresolved items clearly.

## Report

Lead with whether the branch is ready for review. Present `## Standards` and
`## Spec` first, keeping their reports separate and identifying findings fixed
by the parent. Then present `## Refinements and validation` with completed
cleanup, commands and results, checks not completed, and relevant QA
recommendations. End with `## Decisions` for unresolved contract, rename, scope,
or PR questions. Keep completed cleanup separate from decisions.
