# Refinement report: review-and-refine

- Skill: `review-and-refine`
- Date: 2026-11-07
- Upstream status: local (not listed in `~/.agents/.skill-lock.json`), so
  suggestions carry no `Upstream` tag.
- Phases run: 1–2.

Files read:

- `~/.agents/skills/review-and-refine/SKILL.md` (221 lines, ~1.8k words)
- `~/.agents/skills/review-and-refine/agents/openai.yaml`
- `~/.agents/skills/handoff/SKILL.md` (shares the review-file path rules)
- `~/.agents/skills/address-comments/SKILL.md` and
  `assets/local-comments.md` (natural consumer of a review file)
- `~/.agents/skills/tdd/SKILL.md` (points to this skill at line 74)
- `~/.agents/skills/grill-to-implementation/SKILL.md` (excludes
  `*.review.md` at line 20)
- `~/.agents/skills/to-agents/SKILL.md`, `SKILL-MECHANICS.md`
- `~/.agents/skills/_refinement/platform-facts.md`, `spec.md`,
  `evals-deferred.md`, `cross-skill.md`
- `~/.claude/CLAUDE.md`
- For context on hard-coded paths: `~/git/unvoid/when/docs/22-qa-checklist.md`
  and `docs/agents/issue-tracker.md` (exist), the `when` repo's
  `.claude/skills/when-websocket-sync/` and `refine-before-pr/SKILL.md`, and
  its `AGENTS.md` (does not route to any of these).

Hand-off contracts:

- Invokes: three anonymous review sub-agents (Standards, Spec, Refinement);
  `when-websocket-sync` by name (exists only in the `when` repo).
- Produces: `{target}.review.md` beside the spec/task, read by humans and later
  agents; `grill-to-implementation` skips `*.review.md` in task dirs.
- Receives: any `*.handoff.md` for the workstream (linked, not parsed).
- Pointed to by: `tdd` ("Refactoring ... belongs to the review stage").

## Process map

```
 user: /review-and-refine [base] [spec path] [edit request?]
                 |
   [1] scope: rev-parse base ──fail──> (undefined: no action stated)
                 |
        capture branch/HEAD/diffs/status/untracked
                 |
        scope empty? ──yes──> "Fail" (undefined: stop? report?)
                 | no
        build guidance set (AGENTS/CLAUDE walk, ls each, docs,
        task skills, style guides, docs/22-qa-checklist.md*)
                 |
   [2] find spec: commit issues (docs/agents/issue-tracker.md*)
        -> user path -> docs/ specs/ .scratch/ -> ask user
                 |                       └─ none -> "no spec available"
   [3] spawn in parallel, once each (never re-spawn)
        ├─ Standards  (guidance paths + smell baseline)  ≤400 words
        ├─ Spec       (spec or "no spec available")      ≤400 words
        └─ Refinement (style guides; when-websocket-sync*) ≤400 words
                 |
   [4] reconcile (fixed/open)
                 |
        writable? (user explicitly asked for edits)
         ├─ no  ──> write review file ─────────────────────────┐
         └─ yes ──> safe edits ─> contract changes? ─yes─> record│
                     |                decision, wait for user   │
                     v                                          │
                   validate (fmt/lint/types/tests/build)        │
                     v                                          │
                   final diff check (git diff --check)          │
                     v                                          │
                   record results in review file ───────────────┤
                                                                v
   [path] choose {target}.review.md: existing review dir -> spec dir
          -> .scratch/ -> /tmp; append dated section; link spec,
          issue, handoff (search repo + /tmp)
                 |
   [Report] ready? / ## Standards / ## Spec / ## Refinements and
            validation / ## Decisions

 * = project-specific to the `when` repo
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1.1 Base | user base or `main` | `git rev-parse <base>` | resolved base | resolves | no action on failure (L21) |
| 1.2 Capture | base | 6 git commands, untracked contents | scope artifacts | captured "once" | commands vs outputs passed later (L93) |
| 1.3 Empty check | artifacts | test emptiness | — | "Fail" | "Fail" undefined (L29) |
| 1.4 Guidance | changed paths | walk AGENTS/CLAUDE, `ls`, read docs, skills, QA list | guidance path list | each path `ls`-checked | manual walk; hard-coded `docs/22-qa-checklist.md` (L44) |
| 2 Spec | commits, user path, repo | ordered lookup, ask user | spec path or `no spec available` | found or recorded none | user path ranked 2nd (L51); "matching" undefined (L52); hard-coded issue-tracker doc (L50) |
| 2 Baseline | — | in-file smell list | reference for Standards | — | 25 lines inline reference used by one sub-agent |
| 3 Reviews | diffs, guidance, spec, style guides | spawn 3 agents in parallel | 3 reports | each ≤400 words; Standards opens with file list | incomplete report has no recovery and re-spawn is banned (L94, L111-112); cap vs "every" (L104-110) |
| 4.1 Reconcile | 3 reports, diff | mark fixed/open | annotated findings | — | "fixed" meaningless in read-only mode |
| 4.2 Read-only write | findings | write review file | `.review.md` | file written | — |
| 4.3–4.5 Edit | explicit edit request | safe edits; record contract decisions | edits, decisions | user direction for contract changes | mode gate not stated up front; "establishes" undefined (L167) |
| 4.6 Validate | edited scope | narrowest checks | results | only run checks reported | — |
| 4.7 Final diff | diff | `git diff --check`, unrelated changes | — | passes | `tauri.conf.json` project rule (L175) |
| 4.8 Record | results | append to review file | updated file | — | — |
| Path | workstream | choose name/dir, append, link spec/issue/handoff | file path | standalone | duplicates `handoff`; re-finds spec (L205); searches `/tmp` |
| Report | all | chat summary | 4 headed sections | — | "fixed by the parent" assumes edits (L217-218) |

## Findings summary

| Severity | Count |
| --- | --- |
| High | 4 |
| Med | 10 |
| Low | 3 |
| Total | 17 |

Lint checklist (`platform-facts.md`) results:

1. Pass: `name` valid and equals folder.
2. Pass: description 216 chars, no XML.
3. Exempt: no "Use when" clause, but the skill is
   `disable-model-invocation: true`, and `SKILL-MECHANICS.md:22-26` says a
   user-invoked description is human-facing with triggers stripped. No change
   proposed; wording is covered by review-and-refine-02.
4. Pass: no `when_to_use`.
5. Pass: 221 lines, ~2.5k tokens.
6. Partial: the read-only default is early (L12-16), but the mode gate is never
   a step; see review-and-refine-02.
7. Pass: no reference files (see review-and-refine-12).
8. N/A.
9. Pass.
10. N/A: no MCP tools.
11. N/A: no scripts (see review-and-refine-13).
12. N/A.
13. Partial: steps are numbered, but "Choose the review filepath" holds
    unnumbered steps (see review-and-refine-11).
14. Pass.
15. Pass: no `CRITICAL`/`MUST`.
16. Pass: `openai.yaml` uses `interface` and `policy` only; boolean policy.
17. N/A: no diagram. Embedding one is not recommended: the only real branch is
    read-only versus writable, which review-and-refine-02 expresses as two
    numbered sub-sequences.

Prose lines are all at most 80 characters. `~/.claude/CLAUDE.md` holds only
commit rules; the skill does not commit, so nothing is duplicated.

## Suggestions

### High

#### review-and-refine-01

- ID: `review-and-refine-01`
- Severity: High
- Category: Failure points
- Evidence:
  - `SKILL.md:44` "Read `docs/22-qa-checklist.md` to select relevant QA
    recommendations."
  - `SKILL.md:50` "Issue references in commit messages using
    `docs/agents/issue-tracker.md`."
  - `SKILL.md:137-138` "For WebSocket sync changes, use `when-websocket-sync`"
  - `SKILL.md:175-176` "Do not report automatic `tauri.conf.json` version
    bumps as findings."
- Problem: The skill is global (`~/.agents/skills`), but these four lines name
  files and a skill that exist only in `~/git/unvoid/when`. In any other repo
  the agent is told to read a missing file, use a missing skill, or apply a
  Tauri rule. No fallback exists, so the agent stalls, improvises, or reports
  a false gap. Step 1.4 already collects `AGENTS.md`/`CLAUDE.md` and "the docs
  they route to", which is the right channel for project specifics.
- Change: Replace each line with a project-neutral rule:
  - L44 before: "Read `docs/22-qa-checklist.md` to select relevant QA
    recommendations." After: "Read any QA checklist the guidance set routes
    to; use it to select relevant QA recommendations."
  - L50 before: "Issue references in commit messages using
    `docs/agents/issue-tracker.md`." After: "Issue references in commit
    messages, resolved with the issue-tracker doc the guidance set names, if
    any."
  - L137-138: delete "For WebSocket sync changes, use `when-websocket-sync` to
    trace both peers, recovery paths, and terminal connection behavior." Add to
    the Refinement brief (L127): "Provide every task-specific skill from the
    guidance set that covers the changed area; the agent applies it."
  - L175-176: delete "Do not report automatic `tauri.conf.json` version bumps
    as findings." Add to step 4.7: "Skip changes the guidance set marks as
    automated (for example, generated version bumps)."
  The `when` repo's `AGENTS.md` must then route to its QA checklist, issue
  tracker, `when-websocket-sync`, and the `tauri.conf.json` rule (logged as a
  cross-skill finding).
- Risk: Until the `when` repo's `AGENTS.md` routes to these, reviews there
  lose the QA list, sync tracing, and Tauri exemption. Process map: steps 1.4,
  2, 3 (Refinement), and 4.7 become repo-agnostic.
- Status: implemented
- Note: Approved by user. The main session edits ~/git/unvoid/when's agent guidance in this session to route to the four items.
#### review-and-refine-02

- ID: `review-and-refine-02`
- Severity: High
- Category: Clarity
- Evidence:
  - `SKILL.md:4` "Review and safely improve a completed branch"
  - `SKILL.md:12-15` "A review session leaves source files unchanged by
    default ... Change to a writable refinement session only when the user
    explicitly requests edits."
  - `SKILL.md:152` "Reconcile findings against the reviewed diff, marking each
    fixed or open."
  - `SKILL.md:217-219` "identifying findings fixed by the parent. Then present
    `## Refinements and validation` with completed cleanup, commands and
    results"
  - `agents/openai.yaml:4` "review and safely refine this branch."
- Problem: The read-only default is stated, but the mode is never decided at a
  step, and four writable sub-steps each repeat "In a writable session"
  (L158, L168, L169, L173, L177). The description, `default_prompt`, step 4.1,
  and the Report template all assume edits ("fixed by the parent", "completed
  cleanup"). An agent can drift into editing, or emit a report claiming fixes
  in a read-only run. Lint item 6 wants this gate early.
- Change:
  1. Description, before: "Review and safely improve a completed branch before
     pull-request review or after implementation. Assess repository standards,
     the originating specification, and refinement concerns, then validate the
     affected scope." After (modified: keeps a third-person "Use when" clause
     per lint item 3): "Reviews a completed branch on standards, spec, and
     refinement axes and saves the findings to a review file; applies safe
     fixes and validates only when asked to edit. Use when a finished branch
     needs review before a pull request or after implementation."
  2. `openai.yaml` `default_prompt`, after: "Use $review-and-refine to review
     this branch and save the findings."
  3. Add step 1.0 at the top of section 1: "Set the session mode. The mode is
     **read-only** unless the user's request explicitly asks for edits; then it
     is **writable**. Record the mode in the review file. Switch to writable
     mid-session only on a new explicit user request."
  4. Replace L12-16 with: "Review the branch on three independent axes. The
     parent agent owns every edit and validation; each review sub-agent
     reports once and edits nothing."
  5. Split section 4 into "4. Reconcile" (old 4.1, with "mark each finding
     open; in writable mode, mark it fixed once repaired"), "5. Read-only:
     write the review file" (old 4.2), and "6. Writable: refine and validate"
     (old 4.3-4.8, dropping each "In a writable session" prefix).
  6. Report, L217-221: replace "identifying findings fixed by the parent" with
     "in writable mode, identifying findings the parent fixed", and prefix the
     `## Refinements and validation` sentence with "In writable mode,". In
     read-only mode that section lists only validation recommendations.
- Risk: Renumbering touches every internal step reference (review-file
  section says "selected below"). Process map: the mode gate moves from step 4
  to step 1.0.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3: the new description keeps a third-person 'Use when…' clause, e.g. '… Use when a finished branch needs review before a pull request or after implementation.'
#### review-and-refine-03

- ID: `review-and-refine-03`
- Severity: High
- Category: Failure points
- Evidence:
  - `SKILL.md:94` "Do not launch another review sub-agent after repairs."
  - `SKILL.md:111-112` "Open the report with the list of standards files read.
    A report without that list is incomplete."
- Problem: The Standards gate defines "incomplete" but no action. The parent
  may not re-spawn (L94 bans relaunch, and "exactly three ... once each" at
  L90-92), so an incomplete, failed, or empty sub-agent report leaves a dead
  end: the parent either silently accepts it or breaks the rule. No error path
  exists for any of the three agents.
- Change: Add after L95: "If a review sub-agent fails, returns nothing, or
  returns an incomplete report (Standards without its file list), resume that
  same agent once with the gap named. If it is still incomplete, mark that
  axis **incomplete** in the review file and the Report, with the reason.
  The one-run rule covers new review rounds after repairs; resuming an agent to
  complete its first report is allowed." Change L94 to: "Run one review round;
  repairs are verified by the parent's validation, not by new reviewers."
- Risk: Allows one extra resume per agent (tokens). Process map: adds a loop
  of at most one at step 3.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-04

- ID: `review-and-refine-04`
- Severity: High
- Category: Failure points
- Evidence:
  - `SKILL.md:104-106` "Report every documented-standard violation per file or
    hunk ... Report every baseline smell, naming it and quoting the hunk."
  - `SKILL.md:110` "Keep the report under 400 words." (also L123, L147)
- Problem: An exhaustive demand ("every", "quoting the hunk") conflicts with a
  hard 400-word cap. On any non-trivial diff the agent must drop findings to
  fit, silently, and the parent cannot tell what was cut. The skill then
  reports a cleaner branch than it is.
- Change: Replace each "Keep the report under 400 words." with: "Keep each
  finding to one line: `path:line`, rule or smell, a quote of at most one line,
  and the repair. When findings exceed 40 lines, keep every hard violation,
  then list the remaining smells by name and `path:line` only." (40 lines
  keeps roughly the original budget per report while never dropping a
  finding.)
- Risk: Longer reports on large diffs. Process map: unchanged; the step 3 exit
  condition becomes "every finding listed".
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### Med

#### review-and-refine-05

- ID: `review-and-refine-05`
- Severity: Med
- Category: Clarity
- Evidence:
  - `SKILL.md:50-52` "1. Issue references in commit messages ... 2. A path the
    user supplied. 3. A matching file under `docs/`, `specs/`, or `.scratch/`."
  - `SKILL.md:205` "Find the related spec and issue from the review scope"
- Problem: A user-supplied path ranks below commit-message issue lookup, so
  the agent may pick an issue over the spec the user named. "Matching" is
  undefined. The spec is searched again in the filepath section (L205), a
  second lookup with no ordering.
- Change: Replace L48-54 with:
  "Find the originating specification; stop at the first hit:
  1. A path the user supplied.
  2. Issue references in commit messages (see review-and-refine-01 for the
     tracker doc).
  3. A file under `docs/`, `specs/`, or `.scratch/` whose name or title
     contains the branch name or a commit-subject keyword.
  4. Ask the user. If none exists, record `no spec available`.
  Record the spec path and issue URL; later steps reuse them."
  At L205 replace "Find the related spec and issue from the review scope" with
  "Link the spec and issue recorded in step 2".
- Risk: Low. Process map: step 2 becomes the single spec lookup.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-06

- ID: `review-and-refine-06`
- Severity: Med
- Category: Bottlenecks
- Evidence:
  - `SKILL.md:53-54` "If none exists, record `no spec available`; still run
    the Spec sub-agent."
  - `SKILL.md:122` "Report exactly `no spec available` if no specification is
    available."
- Problem: With no spec, a whole sub-agent is spawned to return a fixed
  string the parent already knows. That costs a spawn, context setup, and a
  full diff read for no information.
- Change: L53-54 after: "If none exists, record `no spec available` and skip
  the Spec sub-agent." L90 heading after: "Run the parallel reviews" and L92
  "Spawn the following three sub-agents" becomes "Spawn the Standards and
  Refinement sub-agents, plus Spec when a specification exists, in parallel,
  once each." Delete Spec item 5 (L122). In the Report, `## Spec` reads
  `no spec available`.
- Risk: The Spec heading must still appear in the Report so the gap stays
  visible. Process map: step 3 fans out to two or three agents.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-07

- ID: `review-and-refine-07`
- Severity: Med
- Category: Failure points
- Evidence:
  - `SKILL.md:20-21` "Confirm it resolves with `git rev-parse <base>`."
  - `SKILL.md:29` "Fail when the combined committed and working-tree scope is
    empty."
- Problem: Neither gate says what to do on failure. "Fail" could mean stop,
  ask, or write an empty review file. An unresolved `main` (repos on `master`,
  `alpha`, or `develop`) is common.
- Change: L20-21 after: "Use the base branch named by the user, or `main`.
  If it does not resolve with `git rev-parse --verify <base>`, ask the user
  for the base and stop until they answer." L29-31 after: "If the combined
  scope is empty, tell the user there is nothing to review against `<base>`
  and stop without writing a review file. The scope includes added, modified,
  renamed, copied, deleted, staged, unstaged, and untracked files." (Both are
  enforced by the script in review-and-refine-13 if approved.)
- Risk: None. Process map: both gates gain an explicit stop exit.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-08

- ID: `review-and-refine-08`
- Severity: Med
- Category: Clarity
- Evidence:
  - `SKILL.md:22` "Capture these artifacts once:"
  - `SKILL.md:93-94` "Give every agent the committed diff command, working-tree
    diff command, commit list, and untracked-file contents."
- Problem: Step 1 captures diff output; step 3 passes diff commands. It is
  unclear whether the parent pastes full diffs into three prompts (token
  triple-cost) or the agents re-run commands (then "capture once" is moot for
  diffs). Untracked contents are pasted while tracked changes are not.
- Change: L22-28 after: "Capture these once and pass them verbatim to every
  sub-agent: branch name and full HEAD SHA; base; the commands
  `git diff <base>...HEAD` and `git diff HEAD`; `git log <base>..HEAD
  --oneline` output; `git status --short --untracked-files=all` output.
  Sub-agents run the diff commands and read untracked files themselves."
  L93-94 after: "Give every agent the scope block from step 1."
- Risk: Agents re-run two git commands each (cheap). Process map: the
  step 1 to step 3 hand-off is one named block.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-09

- ID: `review-and-refine-09`
- Severity: Med
- Category: Clarity
- Evidence: `SKILL.md:143-146` "5. Extract function results from conditional
  expressions into named variables before the condition (for example,
  `if (foo())` becomes `const result = foo(); if (result)`)."
- Problem: The Refinement agent is read-only (L95), yet this item tells it to
  extract code. It is also a coding-style rule, which belongs to Standards
  (style guides) rather than Refinement, whose brief excludes Standards issues
  (L127-128).
- Change: Remove item 5 from Refinement. Add to the Standards brief after
  item 3: "Report each function call used directly as a condition (for
  example, `if (foo())`), suggesting a named variable for the result
  (`const isReady = foo(); if (isReady)`), unless the guidance set allows
  it." Long term, move the rule into the user's general style guide and drop
  it here.
- Risk: The rule becomes overridable by repo standards, consistent with the
  baseline policy (L57-59).
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-10

- ID: `review-and-refine-10`
- Severity: Med
- Category: Duplication
- Evidence:
  - `SKILL.md:180-197` "Name the file `{identification-in-kebab-case}.review.md`
    ... 1. Use the directory of an existing review ... 4. Otherwise, use
    `/tmp`."
  - `handoff/SKILL.md:12-44` near-identical naming, rename, and directory
    order for `.handoff.md`.
- Problem: One meaning (how to name and place a workstream file) lives in two
  skills. Both are user-invoked, so neither can invoke the other
  (`SKILL-MECHANICS.md:32-34`); edits to one drift from the other.
- Change (modified: `handoff` owns the workstream-file contract; no
  `_shared/` file): replace L180-197 and the restated rules in L198-212 with
  step 5.1: "Name the file by [`handoff`](../handoff/SKILL.md) step 2 and
  choose its directory by step 4, reading `review` wherever those steps say
  `handoff`: the suffix is `.review.md`, so `sync.spec.md` gets
  `sync.spec.review.md`. Keep one file per review workstream." Link without
  section anchors.
- Risk: Adds a dependency outside the skill folder; Codex follows relative
  links only if the agent reads them. Process map: unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted per the user's earlier decision that handoff owns the workstream-file contract (no _shared/ file): name and place the review file by handoff/SKILL.md step 2 (naming) and step 4 (directory order), with suffix .review.md instead of .handoff.md (sync.spec.md → sync.spec.review.md). Link ../handoff/SKILL.md without section anchors; delete the restated rules here.
#### review-and-refine-11

- ID: `review-and-refine-11`
- Severity: Med
- Category: Process map
- Evidence:
  - `SKILL.md:153` "write the reports to the review file selected below."
  - `SKILL.md:198-212` an unnumbered paragraph with seven actions: read
    existing file, append dated section, record SHAs, re-check HEAD, find
    spec/issue, search handoffs in repo and `/tmp`, add links.
  - `SKILL.md:154-157` and `208-212` list the same standalone contents twice.
- Problem: The review-file write is a step buried as unnumbered prose after
  section 4, so it lacks a completion criterion and its contents list is
  duplicated. Its structure differs from the Report headings, so file and chat
  diverge. Searching `/tmp` for handoffs is unbounded.
- Change: Make it a numbered step "5. Write the review file" placed before the
  writable steps:
  1. Choose the path (pointer from review-and-refine-10).
  2. If the file exists, read it in full; append a section headed
     `## Review — <YYYY-MM-DD>`; keep earlier sections verbatim and note
     resolutions there, citing the earlier finding.
  3. Open the section with mode, branch, base, full HEAD SHA checked, and
     links to the spec, issue, and any `{target}.handoff.md` in the review
     file's directory (relative links; issues by URL).
  4. Use the Report headings below (`### Standards`, `### Spec`,
     `### Refinements and validation`, `### Decisions`). Each finding carries
     `path:line`, a code quote, the suggested change, and `open`/`fixed`.
  Done when: a later agent could act on every finding without this
  conversation.
  Delete L154-157 and L198-212.
- Risk: Narrows handoff search to the review directory (drops repo-wide and
  `/tmp` search). Process map: the path step joins the main sequence.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-12

- ID: `review-and-refine-12`
- Severity: Med
- Category: Bottlenecks
- Evidence: `SKILL.md:65-88` the 12-item Fowler smell baseline, and `SKILL.md:99`
  "Pass the guidance-set file paths and the smell baseline above; never pass a
  summary of the rules."
- Problem: 24 lines of reference used only by the Standards sub-agent sit
  between the spec step and the review step, in every run's context. The skill
  already prefers passing paths over content.
- Change: Move L56-88 (policy paragraph plus list) to
  `references/smell-baseline.md`. In section 2 keep: "The Standards review also
  applies [`references/smell-baseline.md`](references/smell-baseline.md)."
  L99 after: "Pass the guidance-set file paths and the absolute path of
  `references/smell-baseline.md`." Keep the **Scope expansion** paragraph
  (L61-63) in `SKILL.md` under section 3, since all three agents use it.
- Risk: The sub-agent needs the absolute path. Process map: unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-13

- ID: `review-and-refine-13`
- Severity: Med
- Category: Script opportunities
- Evidence:
  - `SKILL.md:20-31` six git commands plus emptiness check.
  - `SKILL.md:33-37` "Collect every `AGENTS.md` and `CLAUDE.md` from each
    changed file's directory up to the filesystem root ... check each path with
    `ls`."
- Problem: Deterministic work done by hand: many tool calls per changed
  directory, easy to miss renamed/deleted paths, and two undefined failure
  exits (review-and-refine-07).
- Change: Add `scripts/review-scope.sh` (Bash; read-only; idempotent).
  - Usage: `review-scope.sh [<base>]`; default base `main` (keeps the current
    skill default). `-h` prints usage.
  - `fail()` writes `review-scope: <msg>` to stderr and exits 2.
  - Fails when not inside a git work tree, or when
    `git rev-parse --verify --quiet "<base>^{commit}"` fails
    ("base '<base>' does not resolve").
  - Collects paths from `git diff --name-only <base>...HEAD`,
    `git diff --name-only HEAD`, and
    `git ls-files --others --exclude-standard`; for renames uses both names
    (`--name-status -M`). Fails with "empty review scope against <base>" when
    the union is empty.
  - Guidance walk: for each path, from its directory up to `/`, test
    `AGENTS.md` and `CLAUDE.md` with `-f`; dedupe; print absolute paths,
    deepest first. Missing directories (deleted files) are skipped silently.
  - Stdout, compact, one section per header: `branch:`, `head:` (full SHA),
    `base:` and merge-base SHA, `commits:` (`git log --oneline`),
    `files:` (`git status --short --untracked-files=all` plus committed
    `--name-status`), `guidance:`.
  - SKILL.md step 1 becomes: "Run `scripts/review-scope.sh <base>`. On exit 2,
    relay the message and stop (ask for the base when it does not resolve).
    Pass its output to every sub-agent as the scope block." Docs routed from
    the guidance files, READMEs, and style guides stay manual.
  - No companion workflow `.md` is needed: one subcommand, stated inline.
- Risk: Adds a script to maintain; Bash portability on macOS (`realpath`
  absent on old macOS; use `cd ... && pwd -P`). Process map: steps 1.1-1.4
  (first two bullets) collapse into one call with defined exits.
- Status: implemented
- Note: Approved by user.
#### review-and-refine-14

- ID: `review-and-refine-14`
- Severity: Med
- Category: Duplication
- Evidence:
  - Read-only rule: `SKILL.md:15-16` "each review sub-agent reports once and
    never changes the branch", `SKILL.md:95` "The reviews are read only:
    agents report findings and never edit files."
  - Scope expansion: `SKILL.md:61-63` and `SKILL.md:141-142`.
  - Separate reports: `SKILL.md:151` and `SKILL.md:216-218`.
  - Changed-file coverage: `SKILL.md:29-31`, `SKILL.md:102`, and
    `SKILL.md:130-131`.
- Problem: Each meaning appears two or three times, inflating its prominence
  and creating drift risk on edit.
- Change: Keep one source each: the read-only sub-agent rule at L95 (delete
  from L15-16 per review-and-refine-02); **Scope expansion** once in section 3
  intro "All three agents mark each repair beyond the task as **Scope
  expansion**" (delete L141-142 second sentence and L61-63 after the move in
  review-and-refine-12); "keep reports separate" only in the Report section
  (delete L151 first sentence); file coverage only in step 1 (L29-31) plus a
  section 3 intro line "Every agent reviews every changed file, tests
  included" (delete L102 "and every changed file, tests included" and L130-131
  first clause).
- Risk: None functional. Process map: unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### Low

#### review-and-refine-15

- ID: `review-and-refine-15`
- Severity: Low
- Category: Clarity
- Evidence:
  - `SKILL.md:40-41` "Read every task-specific skill that applies to the
    changed scope, and the closest local or package style guide. These are the
    source of truth."
  - `SKILL.md:167-168` "When the user establishes a reusable review convention
    absent from the applicable style guide, add it to that style guide"
- Problem: "Task-specific skill" is undefined (project skills such as
  `.claude/skills/*`?). "These" could mean skills, style guides, or the whole
  guidance set. "Establishes" has no observable trigger, so style-guide edits
  may happen unasked.
- Change: L40-41 after: "Read every project skill (`.claude/skills/`,
  `.agents/skills/`) whose description covers the changed area, and the
  closest local or package style guide. Where guidance conflicts, these
  override broader docs." L167-168 after: "When the user states a review
  convention as a rule to keep and the applicable style guide lacks it, offer
  to add it there; add it on approval."
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-16

- ID: `review-and-refine-16`
- Severity: Low
- Category: Failure points
- Evidence: `SKILL.md:204-205` "If HEAD changes during the review, check the
  new commits before advancing that SHA."
- Problem: Sub-agents run once, so "check the new commits" has no defined
  actor or depth. The parent either skips it or reviews them shallowly.
- Change: After: "If HEAD moves during the review, record the SHA the
  sub-agents reviewed and list the newer commits as **not reviewed**."
- Risk: Leaves new commits unreviewed but visible. Process map: unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
#### review-and-refine-17

- ID: `review-and-refine-17`
- Severity: Low
- Category: Clarity
- Evidence:
  - `SKILL.md:94` "Do not launch another review sub-agent after repairs."
  - `SKILL.md:162-163` "Do not silently rename public symbols, remove supported
    behavior, change resolved public types, or alter ordering, persistence, or
    other consumer contracts."
- Problem: Prohibitions lead with the banned action (`to-agents` "Negation",
  `SKILL.md:164-172`).
- Change: L94: see review-and-refine-03. L162-165 after: "Treat any change to
  a public name, supported behavior, resolved public type, ordering,
  persistence, or other consumer contract as a **decision**: record it in the
  review file and wait for user direction. With direction, implement only that
  decision and validate its scope."
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
## Cross-skill findings

- `handoff`: review-file naming, rename, and directory-order rules
  (`review-and-refine/SKILL.md:180-197`) duplicate `handoff/SKILL.md:12-44`.
  Extract both into one shared `_shared/workstream-file.md` with a kind
  suffix. See review-and-refine-10.
- `when` repo `AGENTS.md` (project, outside `~/.agents/skills`): should route
  to `docs/22-qa-checklist.md`, `docs/agents/issue-tracker.md`,
  `when-websocket-sync`, and the `tauri.conf.json` version-bump exemption, so
  this global skill can drop them. See review-and-refine-01.
- `when` repo `.claude/skills/refine-before-pr`: overlaps this skill almost
  step for step (safe edits, contract decisions, validation, final diff) with
  a different default base (`alpha`) and edits by default. Decide which one
  owns pre-PR review in that repo.
- `address-comments`: does not name a `*.review.md` file as a local-comment
  source, though review files are written so a later agent can act on each
  finding. Adding it to the local-comments source list would close the
  hand-off.
