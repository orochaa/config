# Refinement Report: to-source-comments

- **Skill**: `to-source-comments`
- **Date**: 2026-11-07
- **Upstream status**: not upstream (absent from `~/.agents/.skill-lock.json`),
  so no `Upstream` tags.
- **Files read**:
  - `to-source-comments/SKILL.md` (51 lines)
  - `to-source-comments/agents/openai.yaml` (8 lines)
  - `to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
  - `_refinement/spec.md`, `_refinement/platform-facts.md`
  - `~/.claude/CLAUDE.md`
  - `to-github-review/SKILL.md` and `agents/openai.yaml` (sibling skill with
    the same invocation pattern, compared but not a hand-off partner)
- **Linked skills**: none. A repo-wide grep finds no skill that invokes, hands
  off to, or receives from `to-source-comments`, and this skill names none.

## Process map

```
 invoke ($to-source-comments in Codex; model or /name in Claude Code)
   |
   v
 [1] Resolve diff scope ----- scope unclear? ---> ASK user, stop
   |
   v
 [2] Read changed TS + surroundings + docs + session + style guidance
   |
   v
 [3] Triage each change: meaningful and non-obvious?
   |        |no ---> skip
   |yes
   v
 [4] Draft durable rationale (grounded in sources)
   |
   v
 [5] Write /** */ at nearest anchor (extend existing block if present)
   |
   v
 [6] Sources conflict / intent unclear? --yes--> ASK user before editing
   |no                                           that source (no exit stated)
   v
 [7] Review final diff --> report files changed + open questions
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 | Task, session, git state | Pick the supplied diff or a "clearly related" working-tree or branch diff | Diff scope | Ask if scope unknown | No branch base stated; no rule for mixed or unrelated changes; no exit when the diff has no TS files (SKILL.md:16-18) |
| 2 | Diff scope | Read changed TS, surrounding code, docs, session history, "closest package-specific style guidance" | Understanding | None stated | "Enough surrounding code" is open-ended; style-guidance sources are unnamed (SKILL.md:19-22) |
| 3 | Each change | Keep only behaviorally meaningful, non-obvious changes | Candidate anchors | Implicit | "Behaviorally meaningful" undefined; no exit when zero candidates; stale existing comments ignored (SKILL.md:23-25) |
| 4 | Candidates | Draft rationale | Comment text | "Ground claims" | Overlaps steps 3 and 6 (SKILL.md:26-29) |
| 5 | Comment text | Insert `/** */` at the nearest anchor | Edited files | None | TSDoc-only conflicts with statement-level anchors inside bodies (SKILL.md:30-33) |
| 6 | Conflicts | Ask before editing the affected source | Questions | No exit condition | Placed after the writing steps; no batching rule (SKILL.md:34-36) |
| 7 | Final diff | Confirm anchoring, value, and unchanged runtime | Report | "Runtime unchanged" is unverifiable as written | No mechanical check; no fix-and-recheck loop; report format unstated (SKILL.md:37-40) |

Embedded diagram (lens 8): **not proposed.** The flow is linear with two ask
branches. Numbered steps express it well.

## Findings summary

| Severity | Count |
| --- | --- |
| High | 1 |
| Med | 8 |
| Low | 2 |
| **Total** | **11** |

## Suggestions

### to-source-comments-01

- **Severity**: High
- **Category**: Platform compliance / Failure points (triggering)
- **Evidence**:
  - `SKILL.md:3-5`: "Add useful, durable TSDoc comments to meaningful
    TypeScript changes when explicitly invoked with $to-source-comments."
  - `agents/openai.yaml:8`: `allow_implicit_invocation: false`
  - The frontmatter has no `disable-model-invocation`. Fifteen sibling skills
    set it (for example `to-spec`, `retro`, `handoff`).
- **Problem**: The skill is meant to be explicit-only, and Codex enforces this
  through `openai.yaml`. Claude Code does not: with no
  `disable-model-invocation: true`, the description is always loaded and
  Claude may fire the skill on its own. `$to-source-comments` is Codex syntax
  that means nothing in Claude Code, where the skill is invoked as
  `/to-source-comments`. The description also has no "Use when…" clause
  (lint item 3). As a result, Claude Code can invoke the skill unprompted and
  the skill pays context load every turn.
- **Change**: Replace the frontmatter (`SKILL.md:1-6`).

  Before:

  ```yaml
  ---
  name: to-source-comments
  description: >-
    Add useful, durable TSDoc comments to meaningful TypeScript changes when
    explicitly invoked with $to-source-comments.
  ---
  ```

  After:

  ```yaml
  ---
  name: to-source-comments
  description: >-
    Adds durable TSDoc comments that explain the intent behind meaningful
    TypeScript changes. Use when the user invokes it by name on a diff.
  disable-model-invocation: true
  ---
  ```

  Leave `agents/openai.yaml` unchanged; it already sets the Codex equivalent.
- **Risk**: The skill disappears from Claude's autonomous reach, which matches
  its stated intent and the Codex policy. The description becomes
  human-facing, so the "Use when" clause is kept short to satisfy lint item 3.
  See the cross-skill note on the tension between lint item 3 and
  `SKILL-MECHANICS.md`. The process map is unchanged except for the entry
  point.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3a: add disable-model-invocation: true (keep allow_implicit_invocation: false); description keeps a third-person 'Use when…' clause (item 3).
### to-source-comments-02

- **Severity**: Med
- **Category**: Clarity / Failure points
- **Evidence**: `SKILL.md:16-18`: "Use the supplied diff when available;
  otherwise inspect the clearly related working-tree or branch diff. If the
  task scope cannot be identified, ask before editing."
- **Problem**: "Clearly related" and "branch diff" do not name a resolution
  order or a base ref, so different runs choose different scopes. This risks
  commenting on unrelated changes. The skill also does not define which files
  count as TypeScript, and it gives no exit when the scope contains no TS
  changes.
- **Change**: Replace step 1 with:

  ```markdown
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
  ```

- **Risk**: The new step is longer. The fixed order may pick the session's
  edits when the user meant the whole branch; the ask branch covers that
  case. The process map gains an explicit "no TS changes → stop" exit.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-03

- **Severity**: Med
- **Category**: Clarity / Failure points
- **Evidence**: `SKILL.md:30-31`: "Use TSDoc block syntax (`/** ... */`) only.
  Place each comment at the nearest useful code anchor."
- **Problem**: TSDoc attaches only to declarations. The "nearest useful
  anchor" for a rationale is often a statement inside a function body, such as
  a guard or an ordering constraint. With a TSDoc-only rule, the agent either
  writes `/** */` above statements, which no TSDoc tool reads and most code
  styles reject, or drifts the rationale away from its code. The skill also
  names no tags, so runs differ on `@remarks` versus prose and on adding
  `@param` boilerplate.
- **Change**: Replace step 5 with:

  ```markdown
  5. Anchor each comment on the nearest declaration that owns the behavior:
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
  ```

- **Risk**: Moving statement-level rationale up to the declaration loses a
  little locality. The escape hatch for an existing `//` convention keeps
  local style. If the user wants strict TSDoc only, drop that clause.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-04

- **Severity**: Med
- **Category**: Failure points (missing path)
- **Evidence**: `SKILL.md:23-25` reviews only whether to *add* comments.
  `SKILL.md:38` mentions "every added or updated comment", but no step tells
  the agent to update anything.
- **Problem**: A behavior change often makes an existing TSDoc block near the
  changed code wrong. The workflow never checks existing comments, so stale
  docs survive next to freshly documented code. That is the most damaging
  kind of comment rot, and it is squarely in scope.
- **Change**: Append to step 3:

  ```markdown
     Also check each existing comment on the changed declarations. Correct any
     that the change makes inaccurate. Delete any that describe removed
     behavior.
  ```

  In step 7, change "every added or updated comment" to "every added,
  updated, or deleted comment".
- **Risk**: The skill now also touches comments the user did not write
  recently. Scope stays limited to declarations the diff changes. The process
  map gains a "stale existing comment → correct" branch at step 3.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-05

- **Severity**: Med
- **Category**: Clarity
- **Evidence**: `SKILL.md:23-25`: "Review each behaviorally meaningful change.
  Do not comment on mechanical, self-evident, or otherwise clear behavior."
- **Problem**: "Behaviorally meaningful" is the gate for the whole skill, but
  the skill never defines it, and the rule is stated through what to avoid.
  Runs vary between over-commenting and under-commenting. Per `to-agents`, the
  target should be stated positively, with a checkable bound.
- **Change**: Replace step 3 (keep the `-04` addition at its end) with:

  ```markdown
  3. Triage each change. A change earns a comment when it carries one of:
     - a constraint or invariant callers rely on;
     - a workaround, with what it works around;
     - an ordering, concurrency, or lifecycle requirement;
     - a non-obvious error-handling, fallback, or default choice;
     - a magic value or limit, with its source;
     - a public API contract change.

     Leave everything else to the code.
     Done when: every in-scope change is marked comment or skip.
  ```

- **Risk**: The list may miss a case a user considers worth documenting; it
  reads as guidance, so the agent can still extend it. Step 3 becomes
  checkable.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-06

- **Severity**: Med
- **Category**: Clarity (gate exit) / Process map
- **Evidence**: `SKILL.md:34-36`: "If relevant sources conflict or intent
  remains unclear after inspecting all available context, ask the user before
  editing the affected source."
- **Problem**: The gate comes after the writing steps (4 and 5) even though
  it governs them. It also has no exit condition: the skill does not say
  whether to stop everything, ask once per anchor, or continue with the clear
  anchors. Asking per anchor costs a round trip each time, and stopping
  everything wastes the clear work.
- **Change**: Move the gate before writing, as a new step 4. Renumber the
  later steps and update the "steps 3 and 6" cross-references:

  ```markdown
  4. Mark an anchor unclear when sources conflict or its intent cannot be
     grounded in the diff, code, documentation, or session context. Skip
     unclear anchors, finish the clear ones, then ask the user about all
     unclear anchors in one message. Apply the answers. Leave unanswered
     anchors uncommented and list them in the report.
     Done when: every anchor is written, answered and written, or reported
     as open.
  ```

  Drop the "Ground claims…" sentence from the old step 4 and the old step 6
  as a whole; the new step 4 carries both meanings.
- **Risk**: Batching delays questions to the end, which is fine for a
  comments-only task. The process map's ask branch gains an explicit exit.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-07

- **Severity**: Med
- **Category**: Clarity
- **Evidence**: `SKILL.md:21-22`: "Follow the closest package-specific style
  guidance."
- **Problem**: The skill does not name where style guidance lives, so the
  agent either skips the lookup or searches widely, which wastes tool calls.
- **Change**: Replace the sentence with:

  ```markdown
  Find comment conventions in the nearest `AGENTS.md` or `CLAUDE.md`,
  `tsdoc.json`, and ESLint `jsdoc` or `tsdoc` rules, then in two or three
  documented declarations in the same file.
  ```

- **Risk**: None of significance. The list bounds the search.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-08

- **Severity**: Med
- **Category**: Script opportunities / Failure points (unverifiable gate)
- **Evidence**: `SKILL.md:37-39`: "Confirm every added or updated comment …
  leaves runtime behavior unchanged."
- **Problem**: Nothing mechanically checks "runtime behavior unchanged". The
  baseline is the user's uncommitted working tree, not `HEAD`, so `git diff`
  alone cannot isolate the skill's edits. Lint item 13 asks for a validation
  loop on critical operations, and this skill's one hard promise is that it
  changes no code.
- **Change**: Add `to-source-comments/scripts/comment-guard.sh` (Bash, no
  dependencies).

  Spec:

  - Usage: `comment-guard.sh snapshot <file>...` or
    `comment-guard.sh check <snapshot-dir>`. With no or unknown arguments,
    print the usage string to stderr and exit 2.
  - `snapshot <file>...`:
    - Reject absolute paths, `..` segments, and missing files with
      `fail()` (stderr, exit 2).
    - Create a directory with `mktemp -d`.
    - Copy each file to `<dir>/<relative-path>`, using `mkdir -p` for parent
      directories.
    - Print the directory path on stdout as the only output.
  - `check <snapshot-dir>`:
    - Exit 2 if the directory is missing or empty.
    - For each file in the snapshot, run
      `git diff --no-index -U0 <dir>/<path> <path>`. This works for untracked
      files too.
    - Collect the changed lines, skipping the `---`, `+++`, and `@@` headers.
    - Allow a changed line when, after stripping the leading `+` or `-`, it
      matches `^\s*$` or `^\s*(/\*\*.*|\*.*|\*/|//.*)\s*$`. The `//` branch
      exists only for the `-03` escape hatch.
    - On violations, print `<path>:<line>: <text>` to stderr and exit 1.
    - On success, print `ok: <n> files, <m> comment lines changed` and exit 0.
  - Idempotent: `check` is read-only, and each `snapshot` makes a fresh
    directory.
  - Known limit (put it in the script header): a code continuation line that
    starts with `*`, such as a multiplication, is accepted as a comment line.

  Add to `SKILL.md`, step 2: "Before editing, run
  `scripts/comment-guard.sh snapshot <in-scope files>` and keep the printed
  path."

  Replace the last step's runtime clause with: "Run
  `scripts/comment-guard.sh check <path>`. On exit 1, revert the listed
  non-comment edits and re-run until it passes."
- **Risk**: Adds a script and one tool call at each end of the run. The regex
  is a heuristic, not a parser; the known limit above can produce false
  passes, never false failures on real comment edits. If the user prefers
  less machinery, a weaker alternative is a sentence asking the agent to read
  its own diff hunks. The process map gains a check → fix → re-check loop at
  the final step.
- **Status**: implemented
- **Note**: Approved by user.
### to-source-comments-09

- **Severity**: Med
- **Category**: Duplication
- **Evidence**:
  - `SKILL.md:11-12`: "Every comment must add value beyond the code itself."
  - `SKILL.md:24-25`: "Add a comment only when it gives a maintainer useful
    context that is not already apparent from the code."
  - `SKILL.md:27-28`: "Avoid changelog narration and paraphrases of what the
    code visibly does."
  - `SKILL.md:44-45`: "A useful comment answers something a maintainer cannot
    readily learn from the code…"
  - `SKILL.md:28-29` ("Ground claims…") and `SKILL.md:35-36` ("Do not invent
    rationale"): one meaning stated twice.
  - `SKILL.md:31-32` ("Extend an existing TSDoc block … instead of adding a
    duplicate") and `SKILL.md:46-48` ("document them once"): placement rules
    split across two sections.
- **Problem**: The value test appears four times and the grounding rule
  twice. The repetition inflates their prominence and spreads placement rules
  across sections, against single source of truth and co-location in
  `to-agents`.
- **Change**: Make `## Comment quality` the single home for the value test
  and the placement rules, and point to it from the steps. Replace the intro
  (`SKILL.md:10-12`) with:

  ```markdown
  Add TSDoc comments that explain the intent, rationale, or constraints behind
  meaningful TypeScript changes. Edit the source files in place; see
  [Comment quality](#comment-quality) for what earns a comment.
  ```

  Replace step 4 with: "Draft each comment to meet
  [Comment quality](#comment-quality)." Drop "Ground claims…" from step 4,
  which `-06` covers.

  Make `## Comment quality` read:

  ```markdown
  ## Comment quality

  A useful comment is durable: it states what a maintainer cannot learn from
  the code, such as why a constraint exists or which behavior must stay
  stable. Write it as present-tense fact about the code, not as a changelog
  entry. Prefer one focused comment at its anchor over file-level notes. When
  related changes share one rationale and one anchor, document them once.
  Keep each distinct rationale beside its own code. Match the package's
  comment length and tone.
  ```

- **Risk**: Applies cleanly only after `-03`, `-05`, and `-06`, which rewrite
  the overlapping steps. The process map is unchanged.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-10

- **Severity**: Low
- **Category**: Clarity (placement, negation)
- **Evidence**: `SKILL.md:50-51`: "The skill edits TypeScript source files
  directly. Do not create GitHub review comments or separate comment-draft
  files."
- **Problem**: The output-boundary rule sits last, under an unrelated
  heading, and is phrased as a prohibition. The prohibition puts the rejected
  outputs in the agent's context, which `to-agents` warns about under
  "Negation". This matters because sibling skills (`to-github-review`,
  `address-comments`) do produce review comments.
- **Change**: Delete `SKILL.md:50-51`. The positive form now lives in the
  intro from `-09`: "Edit the source files in place". If `-09` is rejected,
  add that sentence to the intro instead.
- **Risk**: The ban on drafts is no longer stated. The positive target covers
  it, and if drafts appear in practice, add the ban back paired with the
  positive.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
### to-source-comments-11

- **Severity**: Low
- **Category**: Clarity (output)
- **Evidence**: `SKILL.md:39-40`: "Report the source files changed and any
  unresolved questions."
- **Problem**: The report has no format, so the user cannot quickly find each
  new comment.
- **Change**: Replace the sentence with:

  ```markdown
  Report one line per comment, `path:line` and a few words on what it
  documents, then the open anchors from step 4.
  ```

- **Risk**: None of significance.
- **Status**: implemented
- **Note**: Auto-approved as safe and small, per user instruction 2026-11-07.
## Lint checklist results (current state)

| # | Result | Note |
| --- | --- | --- |
| 1 | pass | `to-source-comments` matches the folder name |
| 2 | pass | 124 chars, no XML |
| 3 | **fail** | No "Use when…" clause, and Codex-only `$` syntax (see `-01`) |
| 4 | pass | No `when_to_use` |
| 5 | pass | 51 lines |
| 6 | pass | The whole body fits in 5k tokens |
| 7 | n/a | No reference files |
| 8 | n/a | No reference files |
| 9 | pass | |
| 10 | n/a | No MCP tools |
| 11 | n/a | No scripts yet; `-08` states "run" |
| 12 | n/a | No scripts yet |
| 13 | **partial** | Numbered steps, but no validation loop (see `-08`) |
| 14 | pass | |
| 15 | pass | No CRITICAL or MUST |
| 16 | pass | Only `interface` and `policy`; boolean policy |
| 17 | n/a | No diagram |

`~/.claude/CLAUDE.md` covers only git commits. The skill makes no commits, so
nothing is duplicated.

## Cross-skill findings

- `to-github-review` has the same invocation mismatch as `-01`. Its
  description says "explicitly invoked with $to-github-review" and its
  `openai.yaml` sets `allow_implicit_invocation: false`, but its `SKILL.md`
  frontmatter does not set `disable-model-invocation: true`, so Claude Code
  can invoke it on its own. **Affects `to-github-review`.**
- Lint item 3 in `platform-facts.md` requires a "Use when…" clause in every
  description. `to-agents/SKILL-MECHANICS.md:22-26` says a user-invoked
  skill's description is a human-facing one-liner with the trigger list
  stripped. The two rules conflict for every `disable-model-invocation`
  skill. **Affects `to-agents` and `_refinement/platform-facts.md`.**
