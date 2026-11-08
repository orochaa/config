# Refinement report: handoff

- Skill: `handoff`
- Date: 2026-11-07
- Upstream status: not upstream. `handoff` is absent from
  `~/.agents/.skill-lock.json`, so suggestions carry no `Upstream` tag.
- Invocation: user-invoked (`disable-model-invocation: true`,
  `allow_implicit_invocation: false`). No skill invokes it. Several skills
  read or write the files it produces (see Cross-skill findings).
- Files read:
  - `handoff/SKILL.md` (115 lines, ~760 words)
  - `handoff/agents/openai.yaml`
  - `to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
  - `_refinement/spec.md`, `_refinement/platform-facts.md`
  - `~/.claude/CLAUDE.md`
  - Consumers of handoff files: `address-comments/SKILL.md`,
    `address-comments/assets/local-comments.md`,
    `address-comments/assets/remote-pr-comments.md` (archive naming section),
    `grill-to-implementation/SKILL.md`, `implement/SKILL.md` (L50-70),
    `review-and-refine/SKILL.md` (L180-215), `to-spec/SKILL.md` (L90-105)

## Process map

```
/handoff [purpose of next session]
  |
  v
[A] Identify workstream + target file (spec/task or none)
  |
  v
[B] Derive filename  ---- target file? --yes--> <target-basename>.handoff.md
  |                            no --> <workstream-id>.handoff.md
  v
<split into scoped handoff?> --yes--> {root}.{scope}.handoff.md beside root,
  |   (no gate: agent decides)        link root<->scoped, root lists scopes
  no
  v
<matching handoff under other name?> --yes--> rename + update references
  |   (no gate, no scope)                         (no user confirmation)
  v
[C] Choose directory: existing handoff dir > target dir > .scratch/ > /tmp
  |   (no instruction on HOW to find an existing handoff)
  v
<file exists?>  (implicit; no explicit branch)
  |-- no --> [D] Create fresh: snapshot + reconstructed history (template)
  |-- yes -> [E] Refresh: read history + linked artifacts, append entry,
  |              rewrite snapshot/next steps, mark superseded, corrections
  v
(no completion step: no verify, no path reported)
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| A Identify | Conversation, argument | Name the workstream and target file | Identifier | None stated | Identifier ambiguous; no rule when several workstreams are active |
| B Filename | Identifier, target | Apply naming pattern; decide split; rename | Filename(s) | Split: "meant to continue as an independent workstream" (L20) | Split and rename happen without user consent; rename reference scope undefined (L35-36) |
| C Directory | Existing handoffs, target, repo layout | 4-step precedence | Directory | First matching rule | No search procedure for existing handoffs; `/tmp` loses repo context (L43, L83) |
| D Create | Session context, artifacts | Fill template, reconstruct history | New file | None | No workspace state or open-decision section; redaction stated only here (L90) |
| E Refresh | Existing file, linked artifacts | Append entry, update snapshot | Updated file | None | Reads every linked artifact (L94); "superseded" marking ambiguous (L104-106); no redaction rule |
| (end) | — | — | — | None | No completion criterion; user is not told the path |

Embedded diagram: not recommended. The branches (fresh vs refresh, split vs
not, directory precedence) are shallow and read well as numbered steps once
handoff-04 lands.

## Findings summary

| Severity | Count |
| --- | --- |
| High | 3 |
| Med | 10 |
| Low | 4 |
| Total | 17 |

## Suggestions

### handoff-01

- ID: `handoff-01`
- Severity: High
- Category: Failure points
- Evidence: `handoff/SKILL.md:39` "Use the directory of an existing handoff
  for the same workstream."; `:48` "## Create a fresh handoff"; `:92`
  "## Refresh an existing handoff"
- Problem: The skill never says how to look for an existing handoff or how to
  choose between Create and Refresh. An agent that does not search creates a
  second file (often in `/tmp`) and splits the record, which breaks the
  append-only history the skill exists to keep.
- Change: Add a step before directory selection.
  Before: (nothing)
  After:
  ```markdown
  1. Find existing handoffs. Search the target file's directory, the
     repository (`git ls-files -co --exclude-standard '*.handoff.md'`), and
     `/tmp/*.handoff.md`. A file matches when its name carries the
     workstream identifier or its `# Handoff:` title names the workstream.
     - One match: refresh it (step N).
     - Several matches: list them and ask the user which to refresh.
     - No match: create a fresh handoff (step M).
     Done when the mode (create or refresh) and the path are known.
  ```
  If handoff-13 is approved, replace the shell commands with
  `node scripts/handoff.mjs find <identifier>` (run, not read).
- Risk: One extra search per run. Makes the fresh/refresh branch explicit in
  the process map.
- Status: implemented
- Note: Approved as written. Amended after user context (2026-11-07): the user usually supplies the handoff path at session start. Make the step open with 'When the user supplies a handoff path, refresh that file and skip the search.' The search runs only when no path is given.

### handoff-02

- ID: `handoff-02`
- Severity: High
- Category: Failure points
- Evidence: `handoff/SKILL.md:34-36` "If a matching handoff already exists
  under a different filename, rename it while preserving its full contents and
  update references to the old path."
- Problem: A rename plus a repository-wide reference rewrite runs with no
  gate and no defined scope. It can touch tracked files the user did not
  expect, and it hides inside a paragraph about split links.
- Change:
  Before: the sentence above.
  After:
  ```markdown
  If a matching handoff exists under a different filename, propose the rename.
  List every file that references the old basename
  (`grep -rl -- '<old-basename>' <repo-root> <handoff-dir>`). Rename the file
  and update those references only after the user approves. Use `git mv` when
  the file is tracked.
  ```
  Move it into the "find existing handoffs" step from handoff-01.
- Risk: Adds one approval gate. Renames become slower but never silent.
- Status: rejected
- Note: Rejected by user; keep current rename behavior.

### handoff-03

- ID: `handoff-03`
- Severity: High
- Category: Failure points
- Evidence: `handoff/SKILL.md:90` "Redact secrets and personally identifying
  information." appears only under "Create a fresh handoff"; the Refresh
  section (`:92-115`) has no equivalent.
- Problem: A refresh appends evidence, logs, and command output without any
  redaction rule, so secrets can land in a persistent file that may be
  committed.
- Change: Delete the sentence at `:90`. Add it to a shared rules section that
  applies to both modes (see handoff-05):
  ```markdown
  - Redact secrets and personally identifying information in every entry you
    write, including quoted command output.
  ```
- Risk: None; widens an existing rule to the path it was missing from.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-04

- ID: `handoff-04`
- Severity: Med
- Category: Clarity; Platform compliance (lint 13)
- Evidence: `handoff/SKILL.md:10-46` one 37-line prose section mixing naming,
  splitting, linking, renaming, and directory choice; `:48-90` Create section
  has no steps; no step ends on a completion criterion.
- Problem: The workflow is prose, so ordering and completion are left to the
  agent. Lint item 13 requires numbered steps for multi-step workflows.
- Change: Restructure the body into numbered steps, each ending on a
  "Done when" line. Target skeleton (content from other suggestions slots in
  where marked; drop a slot if its suggestion is rejected):
  ```markdown
  ## Rules            <- handoff-05 (shared rules, incl. handoff-03)

  ## Steps
  1. Identify the workstream and its target spec or task file, if any.
     Done when you can name the identifier.
  2. Name the file.   <- existing L12-18 naming text
     Done when the filename is fixed.
  3. Find existing handoffs.   <- handoff-01, handoff-02
  4. Choose the directory for a new handoff.  <- existing L37-43, handoff-11
  5. Split only on request.   <- existing L20-33 split text, handoff-08
  6a. Create: fill the template.   <- existing L50-90, handoff-06/07/15/16
  6b. Refresh: append and update.  <- existing L94-111, handoff-09/10
  7. Verify and report.   <- handoff-12
  ```
  Keep the template block and the refresh sub-steps verbatim except where
  another suggestion changes them.
- Risk: Large diff with no change of meaning by itself. Makes every gate
  visible in the process map.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-05

- ID: `handoff-05`
- Severity: Med
- Category: Duplication
- Evidence:
  - `:89-90` "Tailor the current snapshot and next steps to any user-provided
    arguments." and `:114-115` the same sentence.
  - `:54` "Mark unavailable history as unknown instead of inferring it." and
    `:113-114` "If prior sessions or evidence cannot be recovered, state that
    gap rather than implying the record is complete."
  - `:95-97` "never delete or silently rewrite a historical decision...",
    `:107-108` "Keep the original entry visible.", `:112-113` "Do not remove
    completed actions from the historical record..."
- Problem: Three meanings are stated two or three times each, across the two
  modes. Edits must be made in several places and the repeats inflate those
  rules' weight.
- Change: Add a `## Rules` section directly after the frontmatter:
  ```markdown
  ## Rules

  These apply when creating and when refreshing a handoff.

  - Tailor the snapshot and next steps to the argument, which states what the
    next session is for.
  - Treat `## Task history` as append-only. Keep every earlier entry's wording;
    record changes and corrections in new entries.
  - Mark history you cannot recover as unknown; never infer it.
  - Redact secrets and personally identifying information.  (handoff-03)
  ```
  Delete `:54` second sentence, `:89-90`, `:95-97` from "Preserve" onward,
  `:107-108` last sentence, and `:112-115`.
- Risk: None. Rules move earlier, which also protects them under compaction.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-06

- ID: `handoff-06`
- Severity: Med
- Category: Failure points
- Evidence: `handoff/SKILL.md:56-84` template has no repository, branch,
  commit, or uncommitted-changes field; `:43` allows `/tmp`; `:83`
  "Repository-relative path or URL".
- Problem: The next agent cannot tell which repository, branch, or commit the
  handoff describes, nor which uncommitted changes are in flight. For a `/tmp`
  handoff the repository-relative key files do not resolve at all.
  `review-and-refine/SKILL.md:200-202` records branch and SHA for the same
  reason.
- Change: In the template, under `## Current snapshot`, add a first line:
  ```markdown
  Workspace: {absolute repository path} @ {branch} {short HEAD SHA};
  uncommitted: {changed paths, or none}
  ```
  and add to step 6b: "Update the Workspace line to the current state."
- Risk: Small token cost per handoff. No process-map change.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-07

- ID: `handoff-07`
- Severity: Med
- Category: Failure points (hand-off contract)
- Evidence: `handoff/SKILL.md:56-84` no section for decisions awaiting the
  user; consumer `address-comments/assets/local-comments.md:10-12` "It must
  identify affected paths, relevant context, suggested changes, and pending
  decisions"; `address-comments/SKILL.md:55-57` "...pending decisions,
  decisions already made, completed fixes, validation, and the next approval
  status."
- Problem: Pending decisions and approval status get buried in "Current
  snapshot" or lost. The next agent may act on an unapproved choice, and
  `address-comments` treats a handoff without them as incomplete.
- Change: Add a template section after `## Next steps`:
  ```markdown
  ## Open decisions

  {Decision awaiting the user: options, recommendation, and approval status.
  Write "None" when nothing is pending.}
  ```
  In step 6b add: "Move a decision out of Open decisions into the new history
  entry once the user settles it."
- Risk: One more section. Closes the contract gap with address-comments.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-08

- ID: `handoff-08`
- Severity: Med
- Category: Clarity
- Evidence: `handoff/SKILL.md:20-21` "Split work into separate handoffs only
  when a subtask is meant to continue as an independent workstream."
- Problem: "Meant to" has no owner, so the agent decides alone whether to
  create new files. The split is a structural change to the user's records.
- Change:
  Before: the sentence above.
  After:
  ```markdown
  Split work into scoped handoffs only when the user asks for it or approves
  your proposal. Propose a split when a subtask will continue in a separate
  session from the root task; name each proposed scope.
  ```
- Risk: Adds a gate on the rare split branch.
- Status: implemented
- Note: Approved by user.

### handoff-09

- ID: `handoff-09`
- Severity: Med
- Category: Clarity
- Evidence: `handoff/SKILL.md:104-106` "append the new information and mark
  the earlier entry as superseded in a new note. Preserve the original
  wording and evidence."
- Problem: It is unclear whether the marker goes on the old entry (an edit to
  history) or only in the new entry. Agents will differ, and some will edit
  old wording.
- Change:
  Before: refresh items 3 and 4 (`:104-108`).
  After:
  ```markdown
  3. When a decision or status changes, record it in the new entry as
     `Supersedes: {old entry heading}, {bullet}` and give the reason. Append
     ` _(superseded by {new entry heading})_` to the end of the old bullet.
     Change nothing else in the old entry.
  4. When an old entry is factually wrong, record the correction the same way
     with `Corrects:` and its evidence, and append
     ` _(corrected in {new entry heading})_` to the old bullet.
  ```
- Risk: Allows one fixed suffix on old bullets; the rest of history stays
  untouched. If handoff-13 is approved, its `check` must allow that suffix.
- Status: implemented
- Note: Approved by user: new entry + fixed suffix on the old bullet.

### handoff-10

- ID: `handoff-10`
- Severity: Med
- Category: Bottlenecks
- Evidence: `handoff/SKILL.md:94` "Read the full handoff history and its
  linked artifacts"
- Problem: A long-running workstream links many specs, reviews, and PRs.
  Reading all of them on every refresh costs many tool calls and tokens for
  little gain.
- Change:
  Before: "Read the full handoff history and its linked artifacts, then
  compare them with the current conversation and task state."
  After:
  ```markdown
  Read the handoff in full. Open a linked artifact only when it changed since
  the last history entry (check `git log --since={last entry date} -- <path>`
  or the file's mtime) or when the snapshot you are writing depends on it.
  ```
- Risk: An unchanged artifact with stale content in the handoff could be
  missed; the "snapshot depends on it" clause covers that case.
- Status: implemented
- Note: Approved by user.

### handoff-11

- ID: `handoff-11`
- Severity: Med
- Category: Failure points
- Evidence: `handoff/SKILL.md:43` "4. Otherwise, use `/tmp`."; `:30`
  "Every split handoff must link to its parent and sibling handoffs" (no link
  form); `:83` "Repository-relative path or URL".
- Problem: `/tmp` is cleared on reboot and shared across repositories, and
  link forms are unspecified, so links break when the handoff lives outside
  the repository.
- Change:
  - Directory rule 4 after: "Otherwise, use `/tmp`. Tell the user the file
    will not survive a reboot."
  - Add under the template: "Link handoffs to each other by path relative to
    the handoff file. List key files relative to the repository root; when
    the handoff lives outside the repository, the Workspace line
    (handoff-06) gives the root."
- Risk: None material.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-12

- ID: `handoff-12`
- Severity: Med
- Category: Clarity (completion criterion)
- Evidence: `handoff/SKILL.md:115` the skill ends on "Tailor the current
  snapshot and next steps to any user-provided arguments." There is no final
  step.
- Problem: Nothing tells the agent when it is done or to give the user the
  path, which the user needs to start the next session.
- Change: Add a final step:
  ```markdown
  7. Verify and report. Check the file has every template heading and that
     the new history entry is last. Reply with the absolute path of each
     handoff written and one line the user can paste into the next session:
     `Continue the work in {absolute path}.`
     Done when the user has the path.
  ```
  If handoff-13 is approved, the check is
  `node scripts/handoff.mjs check <path>` (run).
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-13

- ID: `handoff-13`
- Severity: Med
- Category: Script opportunities
- Evidence: `handoff/SKILL.md:39` existing-handoff lookup (manual `find`/
  `grep` each run); `:95-97` append-only history with no validation loop for
  a critical rule (lint 13).
- Problem: Finding handoffs and checking that history survived a rewrite are
  deterministic, repeated, and error-prone by hand.
- Change: Add `handoff/scripts/handoff.mjs`, dependency-free Node, modeled on
  `address-comments/assets/remote-pr-comments.mjs` (usage string, subcommand
  `switch`, strict argument checks, `fail()` to stderr with exit 2, compact
  stdout).
  - `find <identifier> [--repo <dir>]`: lists `*.handoff.md` files whose
    basename contains `<identifier>` or whose first `# Handoff:` line
    contains it, searching `git ls-files -co --exclude-standard` under the
    repository (default: `git rev-parse --show-toplevel`, else cwd) and
    `/tmp` (top level only). Prints one line per match:
    `<absolute path>\t<mtime ISO>\t<title>`. Prints `none` when empty.
    Exit 0 either way.
  - `snapshot <path>`: copies the file to `<path>.bak` (atomic: write temp,
    rename). Prints `snapshot <path>.bak`. Run before a refresh.
  - `check <path> [--before <bak>]`: verifies the headings `# Handoff:`,
    `## Goal`, `## Current snapshot`, `## Next steps`,
    `## Task history (append-only)`, `## Key files` (plus
    `## Open decisions` if handoff-07 is approved). With `--before`, verifies
    every line of the old `## Task history` section still appears in order in
    the new one, ignoring the suffixes allowed by handoff-09. Prints `ok` or
    each violation with its line; exit 1 on violation. Deletes the `.bak`
    on success when `--before` was given.
  - Add `handoff/scripts/handoff.md` describing when to run each subcommand,
    linked from `SKILL.md`. `SKILL.md` states each subcommand is run, not
    read.
  - Constants: the heading list (the template is its source; state that in a
    comment); `/tmp` top level only (handoffs are written there flat).
- Risk: Adds a script to maintain and ties template headings to code. Without
  it, handoff-01 and handoff-12 still work with shell commands.
- Status: rejected
- Note: Rejected by user: the path is always supplied, so find adds little; revisit a check-only script if a refresh ever loses history. Drop the script alternatives from 01 and 12.

### handoff-14

- ID: `handoff-14`
- Severity: Low
- Category: Platform compliance (lint 3)
- Evidence: `handoff/SKILL.md:3-5` "Compact the current conversation into a
  handoff document for another agent to pick up."
- Problem: Not third person, and it omits the refresh mode. Lint 3 also asks
  for a "Use when" clause, but `to-agents/SKILL-MECHANICS.md:22-26` says a
  user-invoked skill's description is a human-facing one-liner with triggers
  stripped; follow that and record the lint exception.
- Change:
  Before: `Compact the current conversation into a handoff document for
  another agent to pick up.`
  After: `Compacts the current conversation into a new or refreshed handoff
  document for another agent to continue.`
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for the 'Use when' everywhere decision: description = 'Compacts the current conversation into a new or refreshed handoff document for another agent to continue. Use when a session ends and another agent will pick up the work.'

### handoff-15

- ID: `handoff-15`
- Severity: Low
- Category: Clarity
- Evidence: `handoff/SKILL.md:73` "### {phase} — {Date or session}"
- Problem: `{phase}` is undefined and the date format is open, so headings
  vary and cannot be sorted or referenced reliably (handoff-09 references
  headings).
- Change: After:
  `### {YYYY-MM-DD} — {phase: design, implementation, review, or similar}`
  and add under the template: "Get the date with `date +%F`. Write
  `unknown date` for an unrecoverable session."
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-16

- ID: `handoff-16`
- Severity: Low
- Category: Duplication (cross-artifact)
- Evidence: `handoff/SKILL.md:61` "{Requested outcome and constraints}";
  `to-spec/SKILL.md:99-100` "Do not ... duplicate the current requirements in
  a chronological handoff."
- Problem: When a spec exists, the Goal section restates its requirements,
  which then drift from the spec.
- Change: After: `{Requested outcome and constraints. When a spec exists, link
  it and state only what it omits.}`
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-17

- ID: `handoff-17`
- Severity: Low
- Category: Clarity (style)
- Evidence: `handoff/SKILL.md:21` is 81 characters ("independent workstream.
  Keep the parent handoff as the root record, and name each").
- Problem: Exceeds the 80-character line limit in `to-agents/SKILL.md:204`.
- Change: Rewrap the paragraph at `:20-28` to 80 columns (moot if handoff-04
  or handoff-08 rewrites it; check the result).
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### handoff-18

- ID: `handoff-18`
- Severity: Med
- Category: Cross-skill contract (added by main session in phase 3)
- Evidence: `handoff/SKILL.md:12-17` names a handoff after the target's
  basename; `grill-to-implementation/SKILL.md:19` expects `<base>.handoff.md`
  beside `<base>.spec.md`.
- Problem: For `sync.spec.md`, handoff writes `sync.spec.handoff.md` while
  grill-to-implementation looks for `sync.handoff.md`.
- Change: Keep handoff's naming rule (option B) and make it the single source
  of the contract: in the naming step, state explicitly that the full target
  basename is kept, with the example `sync.spec.md` gets
  `sync.spec.handoff.md`. Other skills point to this rule instead of restating
  it (their own walkthroughs apply that).
- Risk: grill-to-implementation must change to match (logged in
  `cross-skill.md`).
- Status: implemented
- Note: User chose option B (`<base>.spec.handoff.md`) over dropping `.spec`.

## Cross-skill findings

- `review-and-refine/SKILL.md:180-196` repeats the handoff filename and
  directory-precedence rules almost word for word (with `.review.md`). Both
  are user-invoked, so per `to-agents/SKILL-MECHANICS.md:32-34` the shared
  rule belongs in one plain reference file both skills link to.
  Affects: review-and-refine, handoff.
- `review-and-refine/SKILL.md:205-206` searches for handoffs in "the target
  directory, repository, and `/tmp`" with its own wording. It should reuse
  the search from handoff-01 (or `scripts/handoff.mjs find`).
  Affects: review-and-refine.
- `grill-to-implementation/SKILL.md:78-80` writes handoff entries with its own
  field list (scope, decisions, evidence, remaining questions, spec changes)
  and its own superseding rule. It should follow the handoff template's entry
  fields and handoff-09's `Supersedes:` convention.
  Affects: grill-to-implementation.
- `address-comments/SKILL.md:55-57` and
  `address-comments/assets/local-comments.md:44-49` each restate a handoff
  content list, duplicating each other and the handoff template. Keep one, and
  point it at the handoff template's `Open decisions` section (handoff-07).
  Affects: address-comments.
- `_refinement/platform-facts.md:13-14` lint item 3 demands a "Use when…"
  clause, which conflicts with `to-agents/SKILL-MECHANICS.md:22-26` for
  user-invoked skills. Add an exception for `disable-model-invocation: true`.
  Affects: _refinement (platform-facts), to-agents.
