# Refinement report: retro

- **Skill:** `retro`
- **Date:** 2026-11-07
- **Upstream:** yes. `~/.agents/.skill-lock.json:33-41` lists `retro` from
  `mattpocock/skills` (`skills/engineering/retro/SKILL.md`). The local copy is
  already a fork: step 4 and the `to-agents` name were changed locally (see
  `when/.scratch/retro.spec.md` R11 and memory
  `retro-iterate-per-suggestion.md`). Every suggestion is tagged.
- **Phases run:** 0, 1, 2.

## Files read

- `~/.agents/skills/retro/SKILL.md` (55 lines, 5084 bytes)
- `~/.agents/skills/retro/agents/openai.yaml`
- `~/.agents/skills/to-agents/SKILL.md`, `SKILL-MECHANICS.md` (invoked by
  retro step 1; writing standard)
- `~/.agents/skills/review-and-refine/SKILL.md` §1–2 (the "reviewer agent"
  retro writes standards for)
- `~/.agents/skills/_refinement/spec.md`, `platform-facts.md`
- `~/.agents/skills/address-comments/assets/remote-pr-comments.mjs` and `.md`
  (script model)
- `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` (identical git-commit rules; no
  overlap with retro)
- Memory: `~/.claude/projects/-home-unvoid--agents-skills/memory/*.md`
- Evidence from the only recorded retro run:
  - Session log
    `~/.claude/projects/-home-unvoid--agents-skills/e01882f7-6463-4ad8-ace4-c2d984ef8417.jsonl`
    (2.8 MB; 58 Bash, 28 Edit, 14 AskUserQuestion, 10 Write, 4 ExitPlanMode,
    3 Agent calls)
  - Its two plan files: `~/.claude/plans/glittery-growing-sutherland.md`
    (465 lines, 60 Edit/Write targets) and
    `~/git/unvoid/when/.scratch/retro.spec.md` (476 lines, 38 targets)
- Log formats: Claude Code `~/.claude/projects/<slug>/<id>.jsonl` (+
  `<id>/subagents/`), Codex `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`
  and `~/.codex/archived_sessions/`.
- `git -C ~/.agents/skills remote -v`: empty. The skills repo has no remote.

## Process map

```
/retro [session hint]
   |
   v
[1] Skill tool: to-agents ............ (Claude only; no Codex path)
   |
   v
[2] Read session logs
   |-- user named sessions? --no--> "default to current"
   |        |                         (empty when /retro opens a fresh
   |       yes                         session -> agent improvises a question)
   |        v
   |   find logs (no location given) -> ad-hoc jq over multi-MB JSONL
   |   (multi-session: agent improvises subagent fan-out)
   v
[3] Scan 7 categories --> candidates   (no completion criterion,
   |                                    no severity scale, no evidence rule)
   v
[4] Split local-only / remote
   |   (definition: "not tracked by git" -- now wrong for ~/.agents/skills)
   v
  +-> AskUserQuestion: one candidate <---------------+
  |      |                                           |
  |      v                                           |
  |   record decision in "a plan" (where? format?)   |
  |      |                                           |
  +-- more candidates? ----------yes-----------------+
         | no
         v
      end (no hand-off; no record kept; next retro starts blind)
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 | none | Load `to-agents` via the Skill tool | style guide in context | none stated | Codex has no Skill tool (`SKILL.md:11`) |
| 2 | user's session hint | Find and read logs | session understanding | none stated | no log paths; "current session" default empty on fresh `/retro`; raw logs are MBs; no fan-out rule (`SKILL.md:13`) |
| 3 | logs, 7 categories | Look for candidates | candidates | none stated | no severity scale though step 4 sorts by it; no evidence rule; no done-bound (`SKILL.md:15-23`) |
| 4a | candidates | Split local-only / remote | two lists | none | "not tracked by git" misclassifies `~/.agents/skills`, now a git repo (`SKILL.md:26-28`) |
| 4b | one candidate | AskUserQuestion, recommended first | user's verdict | one call per candidate | AskUserQuestion is Claude-only (`SKILL.md:29`) |
| 4c | verdict | Record in "a plan" | plan | "every candidate has a recorded decision" (`SKILL.md:36`) | plan location and format unstated; prior run kept two diverging plans |
| — | — | (missing) hand-off | — | — | nothing says who implements or how status is tracked; no history survives |

## Findings summary

| Severity | Count |
| --- | --- |
| High | 2 |
| Med | 7 |
| Low | 4 |
| **Total** | **13** |

Lint checklist (`platform-facts.md`): items 1, 2, 4–10, 12, 14–17 pass.
Item 3 ("Use when…") is waived: retro is user-invoked
(`disable-model-invocation: true`), and `to-agents/SKILL-MECHANICS.md:22-26`
says a user-invoked description is a human-facing one-liner with triggers
stripped (see cross-skill findings). Item 11 has no scripts today; retro-03
and retro-06 add them with run/read wording. Item 13 is partly failing: steps
1–3 have no completion criteria (retro-05, retro-07). The to-agents 80-char
rule fails on 16 lines (retro-13).

Embedded diagram (lens 8): not proposed. The flow has one loop (step 4) and
one branch (session choice), which numbered steps express well once the
completion criteria below are added.

## Suggestions

### retro-01: Persist every retro as a record that replaces the ad-hoc plan

- **ID:** retro-01
- **Severity:** High
- **Category:** Failure points (plus the user's request for retro history)
- **Upstream:** local-fork
- **Evidence:**
  - `retro/SKILL.md:33-35`: "Record each decision, including skips, in a
    plan. Every approved step names its file and exact change". No location,
    no format.
  - The prior run kept the plan twice:
    `~/.claude/plans/glittery-growing-sutherland.md` (465 lines, 60 writes)
    and `when/.scratch/retro.spec.md` (476 lines, 38 writes, statuses
    hand-edited per item: "Update an item's **Status** line when you start it
    and when you finish it").
  - User, this request: "I think retro should persist its past sessions
    somewhere for historical research."
  - Recurrence the prior run found only by hand: "use the question tool" said
    twice across `c99ad4ea` and `82dd60c1`; that retro had no way to know
    whether earlier retros had seen it.
- **Problem:** The core output of retro has no home. Plan-mode files live in
  `~/.claude/plans/` under random names, and repo `.scratch/` copies are
  per-project. Two copies diverge, statuses are edited by hand, and nothing
  survives in a form a later retro can query. Recurring problems and
  previously rejected ideas are invisible, so retros re-propose rejected items
  and miss patterns.
- **Change:**

  **Evaluation of the request.** Warranted. Retros are rare, expensive
  (2.8 MB of log reading, 14 questions), and their best signal is recurrence
  across runs, which only a history can show. The record also fixes the
  undefined plan: one file serves as the plan, the implementation tracker,
  and the history entry.

  **Location:** `~/.agents/skills/_retro/records/<YYYY-MM-DD>-<slug>.json`,
  overridable with env `RETRO_RECORDS_DIR`.

  Why there:
  - *Local-only.* The skills repo has no remote (`git remote -v` is empty),
    so records stay on this machine, which they must: they quote the user and
    name private repos (`unvoidweb/when`).
  - *Versioned.* The repo gives free history and diffs, and a commit that
    implements a skill change can stage the record update with it.
  - *Outside `retro/`.* `retro/` is an upstream install
    (`.skill-lock.json:33`); a reinstall would wipe data stored inside it. The
    `_` prefix follows `_refinement/`: not a skill folder, never discovered
    as one.
  - *Shared by both agents.* Claude and Codex both reach `~/.agents/skills`.
  - *Rejected alternatives:* per-repo `.scratch/` (scattered, so no
    cross-project recurrence), `~/.claude/plans/` (Claude-only, random names,
    not designed to be read back), `~/.agents/retros/` (works, but loses
    versioning; offer it as the Modify option if the user prefers data
    outside the skills repo).
  - *Guard:* if the skills repo ever gains a shared remote, add `_retro/` to
    `~/.agents/skills/.git/info/exclude`. No script change is needed.

  **Format:** one JSON file per retro, written only through
  `scripts/retro-record.mjs` (retro-03). JSON because history queries must be
  deterministic. The script renders Markdown for humans and implementers.
  If retro-03 is rejected, fall back to one Markdown file per record with the
  same sections, and drop the `history` command from retro-04.

  **Schema (version 1):**

  ```json
  {
    "version": 1,
    "id": "2026-11-07-when-spec-implement-review",
    "createdAt": "2026-11-07T19:02:11.000Z",
    "updatedAt": "2026-11-07T21:40:00.000Z",
    "project": "~/git/unvoid/when",
    "scope": "all spec, implement, and review sessions from last 7 days",
    "constraints": ["Modify untracked agent files only"],
    "facts": ["Claude Code loads only CLAUDE.md files"],
    "sessions": [
      {
        "id": "82dd60c1-…",
        "agent": "claude-code",
        "log": "~/.claude/projects/-home-unvoid-git-unvoid-when/82dd60c1-….jsonl",
        "kind": "spec"
      }
    ],
    "candidates": [
      {
        "id": "L08",
        "title": "Grilling uses the question tool",
        "category": "coding-standards",
        "severity": "high",
        "scope": "local",
        "targets": ["~/.agents/skills/grilling/SKILL.md"],
        "tags": ["question-tool"],
        "problem": "grilling prescribes a markdown Q1 format",
        "evidence": [{ "session": "82dd60c1", "quote": "use the question tool" }],
        "recommendation": "Ask each question with the question tool",
        "relatedTo": [],
        "verdict": "approved",
        "userNote": "approve",
        "decidedAt": "2026-11-07T20:10:00.000Z",
        "change": "Markdown: exact file and before/after text",
        "verify": "grep finds no '❓ **Q' in grilling/SKILL.md",
        "status": "done",
        "implementedAt": "2026-11-07T21:30:00.000Z",
        "verification": "grep returned nothing",
        "commits": ["~/.agents/skills@239ea4f"]
      }
    ]
  }
  ```

  Field rules:
  - `project`, `targets`, `log`: `$HOME` replaced by `~`, so history matches
    paths across runs.
  - `category`: one of `navigation`, `automated-checks`, `coding-standards`,
    `global-agents-md`, `tool-economy`, `no-ops`, `information-access` (the
    seven categories of step 3).
  - `severity`: `high` | `med` | `low`. `scope`: `local` | `remote`.
  - `tags`: kebab-case leading words (e.g. `question-tool`, `commit-rules`);
    the recurrence key besides `targets`.
  - `id`: `L` for local, `R` for remote, plus a two-digit number.
  - `verdict`: `pending` | `approved` | `modified` | `rejected`.
  - `status`: `todo` (approved/modified, not yet done) | `done` | `failed` |
    `skipped` (rejected).
  - `relatedTo`: `<record-id>/<candidate-id>` of earlier history items this
    candidate repeats.

  What each record captures, per the request:
  - Session: `sessions`, `scope`, `project`.
  - Candidates: `candidates[]` with problem, evidence, and recommendation.
  - Verdicts: `verdict`, `userNote` (the user's words), `decidedAt`.
  - Implemented changes: `change`, `status`, `verification`, `commits`.

  **SKILL.md edit:** replace `retro/SKILL.md:33-36`.

  Before:

  ```
     - Record each decision, including skips, in a plan. Every approved step
       names its file and exact change, so another agent can implement it
       without this session's context.
     - The step is complete when every candidate has a recorded decision.
  ```

  After:

  ```
     - After each answer, record it in the retro record with `decide`
       (see [RECORDS.md](RECORDS.md)). The record is the plan: every
       approved candidate names its file and exact change, so another
       agent can implement it without this session's context.
     - The step is complete when
       `node scripts/retro-record.mjs show <record>` lists no pending
       candidate.
  ```

  Optional seed (phase 4): import the 2026-11-07 retro from
  `~/git/unvoid/when/.scratch/retro.spec.md` (R01–R12 done, S01–S05
  rejected) as record `2026-11-07-when-spec-implement-review`, using
  `add-session` and `add-candidate`, so history starts with real data.
- **Risk:** Adds a writable data folder to the skills repo, and records hold
  private project detail; the exclude guard covers a future remote. Each retro
  costs a few extra script calls, in exchange for removing hand-edited plan
  copies. Process map: step 4c gets a concrete output, and a record now flows
  to the next retro (retro-04).
- **Status:** implemented
- **Note:** Modified: records live in ~/.agents/retros/<YYYY-MM-DD>-<slug>.json, outside the skills repo; RETRO_RECORDS_DIR override stays. retro is no longer upstream (removed from .skill-lock.json), so the reinstall reasoning is dropped. Seeded with 2026-11-07-when-spec-implement-review (12 reviewed sessions + the retro session; L01-L12 = spec R01-R12, L13-L16 and R01 = spec S01-S05).
 User decision: records live in ~/.agents/retros/<YYYY-MM-DD>-<slug>.json (outside the skills git repo, not versioned); RETRO_RECORDS_DIR override stays. Seed with the 2026-11-07 retro. Retro is no longer upstream-tracked (user dropped it from .skill-lock.json), so 'outside retro/' reasoning becomes moot but the location stays ~/.agents/retros/.
### retro-02: Redefine local-only now that ~/.agents/skills is a git repo

- **ID:** retro-02
- **Severity:** High
- **Category:** Clarity
- **Upstream:** local-fork
- **Evidence:** `retro/SKILL.md:26-28`: "**local-only** (not tracked by git:
  `~/.claude`, `~/.agents`, git-ignored or excluded files, `.git/hooks`) and
  **remote** (tracked, shared with the team)". Since commit `6e69108`,
  `~/.agents/skills` is tracked by git but has no remote.
- **Problem:** The rule's test ("not tracked by git") now contradicts its own
  example list. An agent that applies the test classifies every skill edit as
  remote and orders it last. That inverts the user's priority (local first)
  for the most common retro target, skills.
- **Change:** replace `retro/SKILL.md:26-28`.

  Before:

  ```
     - Split them into **local-only** (not tracked by git: `~/.claude`,
       `~/.agents`, git-ignored or excluded files, `.git/hooks`) and **remote**
       (tracked, shared with the team). Start with local-only.
  ```

  After:

  ```
     - Split them by audience. **Local-only** files reach only this
       machine: files outside any repo (`~/.claude`), repos with no shared
       remote (`~/.agents/skills`), git-ignored or excluded files, and
       `.git/hooks`. **Remote** files are tracked in a repo the team
       pulls. Check with `git -C <dir> remote -v` and
       `git check-ignore -v <file>`. Start with local-only.
  ```
- **Risk:** None to the flow. The two check commands add at most two calls
  per unclear target.
- **Status:** implemented
- **Note:** Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### retro-03: Add scripts/retro-record.mjs to write and query records

- **ID:** retro-03
- **Severity:** Med
- **Category:** Script opportunities
- **Upstream:** local-fork
- **Evidence:** The prior run hand-edited statuses in two plan files (98
  write targets in total; `retro.spec.md:3-5` "Update an item's
  **Status** line when you start it and when you finish it"). Cross-retro
  queries over free Markdown would be fuzzy.
- **Problem:** Record writes are repetitive, schema-bound, and need to stay
  consistent across retros for history to work. Agents editing JSON by hand
  drift from the schema and spend tokens re-reading the file.
- **Change:** create `retro/scripts/retro-record.mjs` (dependency-free Node,
  modelled on `address-comments/assets/remote-pr-comments.mjs`) and the
  companion doc `retro/RECORDS.md`, linked from `SKILL.md`.

  **Usage string:**

  ```
  Usage:
    node scripts/retro-record.mjs new <slug> <project-dir> <scope>
    node scripts/retro-record.mjs add-session <record> <session-id> <log-path> [<kind>]
    node scripts/retro-record.mjs add-candidate <record> <candidate.json>
    node scripts/retro-record.mjs decide <record> <candidate-id> <approved|modified|rejected> <user-note> [<change.md>]
    node scripts/retro-record.mjs implement <record> <candidate-id> <done|failed> <verification> [<repo>@<sha>]
    node scripts/retro-record.mjs show <record> [--open]
    node scripts/retro-record.mjs history [<project-dir>]
    node scripts/retro-record.mjs search <regex>
  ```

  **Conventions** (copy from the model script):
  - `usage` constant and a `main()` subcommand `switch` with exact arity
    checks. `help`/`--help`/`-h` print usage to stdout.
  - `fail(message)` writes to stderr and exits 2;
    `main().catch((e) => fail(e.message))`.
  - Atomic writes: write `<file>.<pid>.<uuid>.tmp` with flag `wx`, then
    `rename`, and unlink the temp file on error (model lines 239-249).
  - Every write sets `updatedAt`. Stdout gets one confirmation line, e.g.
    `Decided L03 approved in 2026-11-07-when-sessions`.
  - One retro session owns its record, so no locking is needed. State this in
    a comment.

  **Constants, with reasons:**
  - `RECORDS_DIR = process.env.RETRO_RECORDS_DIR ??
    ~/.agents/skills/_retro/records`: local-only, and outside the upstream
    `retro/` folder so reinstalls keep it.
  - `RECURRENCE_MIN = 2`: two records are the fewest that show a problem came
    back.
  - `SCHEMA_VERSION = 1`: lets a later script migrate old records.

  **Validation:**
  - `<record>` is a record id matching
    `^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$`, resolved to
    `RECORDS_DIR/<id>.json`. `<slug>` is kebab-case.
  - `<project-dir>` and `<log-path>` must exist. They are stored realpath'd,
    then `$HOME`-prefix → `~`.
  - Candidate enums and required fields are as in retro-01. `evidence` must
    be non-empty, and each `evidence[].session` must be a prefix (8+ chars)
    of a recorded session id, which catches typos.
  - `relatedTo` entries must name an existing record and candidate.
  - Any unparseable record file fails, naming the file. History is only
    useful when it is complete, so the script never skips silently.

  **Subcommands:**
  - `new`: id = local date + `-` + slug. Creates the record with empty
    `sessions`/`candidates`/`constraints`/`facts`. If the file exists, prints
    `Exists <path>` and exits 0 without writing (idempotent).
  - `add-session`: upsert by session id. `agent` comes from the path:
    under `~/.claude/projects/` → `claude-code`; under `~/.codex/` →
    `codex`; otherwise `other`. `kind` is free text (`spec`, `implement`,
    `review`…).
  - `add-candidate`: reads the JSON file and assigns
    `id` = next `L`/`R` number when absent. Upsert by id: a re-run replaces
    the descriptive fields and keeps `verdict`/`status` fields. New
    candidates start `verdict: pending`, `status: null`.
  - `decide`: `approved`/`modified` require a `change` (from `<change.md>`
    or already present) and set `status: todo`. `rejected` sets
    `status: skipped`. Stores `userNote` verbatim and `decidedAt`.
  - `implement`: allowed only on `approved`/`modified`. Sets
    `status`, `verification`, and `implementedAt`. Appends `<repo>@<sha>`
    (validated `^.+@[0-9a-f]{7,40}$`) to `commits` without duplicates.
  - `show`: renders Markdown to stdout. First a header (id, project, scope)
    and a sessions table. Then candidates by verdict (pending, approved and
    modified, rejected), each with id, title, severity, scope, targets,
    problem, evidence quotes, change, verify, status, and user note.
    `--open` lists only approved/modified with status `todo` or `failed`:
    the implementer's view.
  - `history`: reads every record (filtered by project when given). Prints:
    1. `Records`: one line per record: id, project, session count, and
       verdict counts.
    2. `Recurring targets` and `Recurring tags` (in ≥ `RECURRENCE_MIN`
       records): each key followed by `<record>/<cand> <verdict>/<status>`
       items.
    3. `Rejected`: newest first, `<record>/<cand> <title> — "<userNote>"`.
    4. `Open`: approved items not `done`.

    Output stays one line per item, so it fits in context.
  - `search`: case-insensitive regex over title, problem, recommendation,
    tags, targets, evidence quotes, and userNote. Prints
    `<record>/<cand> [<verdict>/<status>] <title>`.

  **Companion `retro/RECORDS.md`** (under 100 lines, so no TOC needed). It
  holds:
  - the location and why, with the exclude guard from retro-01;
  - the schema and field rules from retro-01;
  - the lifecycle: `new` → `add-session` → `add-candidate` → `decide` →
    `implement`;
  - a note that an implementing agent runs `show --open`, then `implement`
    after each item;
  - how `history` output is used (retro-04).

  SKILL.md says the script is **run**, never read.

  **Phase 4 sample run:** run `new`, `add-session`, `add-candidate`,
  `decide`, `implement`, `show`, `history`, and `search` against a temp
  `RETRO_RECORDS_DIR`. Show each command's output.
- **Risk:** A ~300-line script to maintain in a local fork. Upstream updates
  to retro must be merged by hand (they already must, given the local step 4).
  Process map: each recording action becomes one deterministic call.
- **Status:** implemented
- **Note:** Modified: RECORDS_DIR default ~/.agents/retros. Companion doc placed at retro/references/records.md (to-agents layout: references/ holds material the agent reads). Added during implementation: `set-notes` (constraints/facts had no writer) and an optional `[<YYYY-MM-DD>]` on `new` (needed to import the 2026-11-07 retro).
 Approved by user. Adjusted: RECORDS_DIR default is ~/.agents/retros (see retro-01 note).
### retro-04: Read retro history before looking for candidates

- **ID:** retro-04
- **Severity:** Med
- **Category:** Failure points (plus the user's request)
- **Upstream:** local-fork
- **Evidence:**
  - `retro/SKILL.md:15`: candidates are found from the current sessions
    only.
  - The prior run's `retro.spec.md:434-470` "Decided against (do not
    implement)" lists S01–S05. A later retro has no way to see them and would
    re-propose them.
  - The user's question-tool correction recurred across sessions
    (`c99ad4ea`, `82dd60c1`).
- **Problem:** Without reading history, a retro re-asks settled questions,
  which costs the user's attention on every AskUserQuestion. It also misses
  that a problem is recurring, which should raise its severity. And open
  approved items from earlier retros stay invisible.
- **Change:** insert a step after step 1 (renumber the rest), and extend step
  3.

  New step 2:

  ```
  2. Read the retro history: run
     `node scripts/retro-record.mjs history`.
     Note recurring targets and tags, rejected items, and open items.
     Done when you have its output (an empty history is fine).
  ```

  Append to step 3 (candidates), after the category list:

  ```
     - Search history for each candidate's target and tags
       (`retro-record.mjs search <regex>`). A match goes in `relatedTo`.
     - A recurring match raises severity one level.
     - A match on a rejected item needs new evidence; say so in the
       question and quote the earlier user note.
     - Open items from history whose problem reappears become candidates
       again, citing both records.
  ```
- **Risk:** One or two extra script calls per retro. History is global by
  default because skills and `~/.claude` files recur across projects; pass
  `<project-dir>` to narrow it. Process map: adds an input edge from earlier
  records into step 3.
- **Status:** implemented
- **Note:** Approved.
 Approved by user (history read first).
### retro-05: Make session selection concrete and fan out large reviews

- **ID:** retro-05
- **Severity:** Med
- **Category:** Clarity / Bottlenecks
- **Upstream:** upstream-candidate (log paths), local-fork (script calls)
- **Evidence:**
  - `retro/SKILL.md:13`: "This may mean searching through session logs on
    this machine. If the user doesn't specify a session, default to the
    current one."
  - The prior run's first question: "The current session only contains this
    /retro call. Which session should I review?" (answer: "all spec,
    implement, and review sessions from last 7 days").
  - The prior run then wrote 9 hand-crafted `jq`/`find` pipelines over
    `~/.claude/projects/` to find and classify sessions (Bash calls 1-8, 16,
    17), and improvised 3 subagents ("Retro: spec sessions").
- **Problem:** The default is empty whenever `/retro` opens a fresh session,
  which is the normal way to run it. Log locations are rediscovered each run.
  Multi-session retros have no fan-out rule, so the agent improvises or
  floods its context with multi-MB logs. The step has no completion
  criterion.
- **Change:** replace `retro/SKILL.md:13`.

  Before:

  ```
  2. Read the primary sources for the session the user specifies. This may mean searching through session logs on this machine. If the user doesn't specify a session, default to the current one.
  ```

  After:

  ```
  2. Pick the sessions. Use the ones the user names. With none named,
     use the current session when it holds work before `/retro`;
     otherwise ask which sessions to review.
     Logs live here:
     - Claude Code: `~/.claude/projects/<cwd with / and . as ->/<id>.jsonl`,
       subagents in `<id>/subagents/`.
     - Codex: `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`.
     Find them with `node scripts/session-digest.mjs list <project-dir>`.
     Create the record (`retro-record.mjs new`) and add each session
     (`add-session`). Done when every chosen session is in the record.

  3. Read each session with `session-digest.mjs digest <log>`. Open the
     raw log only for a passage the digest truncates. For more than two
     sessions, give each group of related sessions to one subagent; it
     returns candidates with session ids and verbatim user quotes.
     Done when every recorded session has been read.
  ```

  The threshold is two sessions because two digests fit in context
  comfortably, and the prior 12-session run needed subagents. If retro-06 is
  rejected, drop the script lines and keep the log paths. If retro-03 is
  rejected, drop the record lines.
- **Risk:** Subagent fan-out loses some cross-session detail. The rule that
  subagents return verbatim quotes keeps the evidence checkable. Process
  map: the step splits into select (2) and read (3), each with an exit
  condition.
- **Status:** implemented
- **Note:** Approved. Also records constraints with `set-notes`.
 Approved by user.
### retro-06: Add scripts/session-digest.mjs to list and digest session logs

- **ID:** retro-06
- **Severity:** Med
- **Category:** Script opportunities / Bottlenecks
- **Upstream:** upstream-candidate
- **Evidence:**
  - Prior run Bash calls 2, 4-8, 16, 17 are each a different ad-hoc `jq`
    pipeline that extracts user messages, titles, skills invoked, error tool
    results, and Bash-edit patterns. Example (call 16):
    `jq -r 'select(.type=="user") | .message.content | if type=="array" then .[] | select(.type=="tool_result" and .is_error==true) …'`.
  - Session log `e01882f7…jsonl` is 2.8 MB.
  - A Codex archived log has a malformed line (`jq: parse error … line 9`).
- **Problem:** Each retro re-derives the same extraction, spending tool calls
  and tokens, and raw logs cannot be read whole. A fixed digest makes
  evidence gathering repeatable and cheap.
- **Change:** create `retro/scripts/session-digest.mjs` (dependency-free
  Node, same conventions as retro-03; read-only, so no writes).

  **Usage string:**

  ```
  Usage:
    node scripts/session-digest.mjs list <project-dir> [<since YYYY-MM-DD>]
    node scripts/session-digest.mjs digest <log.jsonl> [<max-chars>]
  ```

  **Validation:**
  - `<project-dir>` must exist.
  - `<since>` must match `^\d{4}-\d{2}-\d{2}$`.
  - `<log.jsonl>` must exist.
  - `<max-chars>` must be a positive integer.

  **`list`:**
  - Claude: read `~/.claude/projects/<slug>/*.jsonl`. `slug` is the realpath
    with `/` and `.` replaced by `-` (verified:
    `/home/unvoid/.agents/skills` → `-home-unvoid--agents-skills`).
  - Codex: scan `~/.codex/sessions/**/rollout-*.jsonl` and
    `~/.codex/archived_sessions/*.jsonl`. Keep files whose first
    `session_meta` line has `payload.cwd` equal to or under the project.
  - Filter by mtime ≥ `<since>`.
  - Print one line per session, newest first:
    `<agent> <id8> <YYYY-MM-DD HH:MM> <size> <title> [skills] <path>`.
    - `title` is the Claude `ai-title`/`customTitle`; otherwise the first
      real user message, cut to 80 chars.
    - `skills` come from `<command-name>/x</command-name>` and `Skill`
      tool_use inputs, deduped, excluding `clear`, `model`, `context`,
      `rename`, and `statusline` (UI commands).
    - Subagent logs under `<id>/subagents/` print indented under their
      parent.

  **`digest`:** print a compact transcript in log order:
  - `USER <time>`: real user text. Skip `isMeta`, `<system-reminder>`,
    `<command-…>`, `<local-command…>`, and skill bodies ("Base directory for
    this skill").
  - `ASK`: AskUserQuestion questions with the user's answers (from
    `toolUseResult.answers`).
  - `ERROR <tool>`: tool results with `is_error: true`.
  - `REJECTED <tool>`: tool uses the user rejected.
  - `AGENT <description>`: Agent/Task dispatches.
  - Footer: tool-call counts by name, total lines, and skipped
    unparseable lines.

  Codex records map as follows:
  - `response_item` / `message` with role `user` → USER;
  - `function_call` → counts;
  - `function_call_output` with an error → ERROR.

  **Constants, with reasons:**
  - Default `max-chars = 300` per item: keeps a 3 MB log's digest near
    20 KB while keeping user quotes whole.
  - The UI-command skip list (above) stops noise from hiding real skills.

  **Errors:**
  - Malformed lines are counted and skipped, never fatal, because logs can
    be truncated mid-write.
  - A missing projects dir prints `No Claude sessions` and continues to
    Codex.

  SKILL.md says the script is **run**. Document the record types in a short
  comment block at the top of the script. No separate workflow doc is needed:
  the usage string is the contract.

  **Phase 4 sample run:** `list ~/git/unvoid/when 2026-10-31`, and
  `digest` on `e01882f7…jsonl`.
- **Risk:** The log formats are undocumented and may change. The script
  degrades by skipping unknown record types and reporting counts, and the
  agent can still open raw logs. Process map: step 3 becomes one call per
  session.
- **Status:** implemented
- **Note:** Approved. Subagent ids drop the `agent-` prefix so 8-char ids stay distinct; Codex errors detected by "Script failed" / "aborted before dispatch".
 Approved by user.
### retro-07: Give candidate finding a severity scale, evidence rule, and exit

- **ID:** retro-07
- **Severity:** Med
- **Category:** Clarity
- **Upstream:** upstream-candidate
- **Evidence:**
  - `retro/SKILL.md:15`: "Look for candidates for improvement in these
    categories." It has no completion criterion.
  - `retro/SKILL.md:25`: "in order of severity", but severity is never
    defined.
  - `retro/SKILL.md:30-31`: "the evidence from the session (quote the user's
    words and the errors)", which is required only at ask time, after the
    logs may be out of context.
- **Problem:** Two agents rank the same candidates differently, so the user
  sees a different order each run. Evidence gathered late is paraphrased or
  lost after compaction. "Look for" invites premature completion.
- **Change:** replace `retro/SKILL.md:15`.

  Before:

  ```
  3. Look for candidates for improvement in these categories.
  ```

  After:

  ```
  3. Find candidates in every category below, checking each category
     against every session. Give each candidate a severity:
     - **High**: the agent failed, or the user had to correct it.
     - **Med**: it cost tool calls, tokens, or rework.
     - **Low**: wording or style.
     Capture its evidence now: session id plus verbatim user words or
     error text. Record it with `retro-record.mjs add-candidate`.
     Done when every category has been checked against every session.
  ```

  Without retro-03, replace the last-but-one sentence with "Keep it in the
  candidate list."
- **Risk:** Slightly longer step. Process map: step 3 gains an exit gate.
- **Status:** implemented
- **Note:** Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### retro-08: Add a hand-off step that ends the retro and tracks implementation

- **ID:** retro-08
- **Severity:** Med
- **Category:** Clarity (process map: missing output)
- **Upstream:** local-fork
- **Evidence:**
  - `retro/SKILL.md:25-36` ends at "every candidate has a recorded decision".
    Nothing says who implements the decisions or how.
  - Memory `retro-iterate-per-suggestion.md`: "Record each decision into a
    deterministic plan to implement later."
  - The prior run implemented in the same session and tracked status by hand
    (`retro.spec.md:80` "**Status:** done. Verified: …").
- **Problem:** No defined output means each run invents its ending. Some
  implement immediately and some stop. Implementation status never makes it
  back into anything durable, so history cannot say what was done.
- **Change:** append a final step after step 4.

  ```
  5. Hand off. Give the user the record id and
     `node scripts/retro-record.mjs show <record> --open`, the list of
     approved changes. Implement only when the user asks. Whoever
     implements runs `implement <record> <id> done|failed <verification>
     [<repo>@<sha>]` after each item. Done when the user has the record id.
  ```
- **Risk:** None. It formalises the user's stated preference. Process map:
  adds the terminal output node.
- **Status:** implemented
- **Note:** Approved.
 Auto-approved as safe and small (follows retro-01/03), per user instruction 2026-11-07.
### retro-09: Name portable equivalents for the Skill tool and AskUserQuestion

- **ID:** retro-09
- **Severity:** Med
- **Category:** Platform compliance
- **Upstream:** upstream-candidate
- **Evidence:**
  - `retro/SKILL.md:11`: "Call the Skill tool with `to-agents`".
  - `retro/SKILL.md:29`: "with the AskUserQuestion tool".
  - `retro/agents/openai.yaml` exists, so Codex runs this skill; Codex has
    neither tool by those names.
- **Problem:** In Codex, step 1 cannot run as written, and step 4 has no
  defined question channel. The agent improvises, and per the user's memory a
  bundled plan dump was exactly the failure they rejected.
- **Change:**
  - `SKILL.md:11`:
    - Before: "1. Call the Skill tool with `to-agents` for the writing style
      guide."
    - After: "1. Load the `to-agents` writing guide: the Skill tool in
      Claude Code, or read `~/.agents/skills/to-agents/SKILL.md`
      elsewhere."
  - `SKILL.md:29`:
    - Before: "Put each candidate to the user with the AskUserQuestion tool,"
    - After: "Put each candidate to the user with the question tool
      (AskUserQuestion in Claude Code; elsewhere, one candidate per
      message, then wait for the answer),".
- **Risk:** None.
- **Status:** implemented
- **Note:** Approved. Codex question tool named as `request_user_input` (seen in Codex logs).
 Auto-approved as safe and small, per user instruction 2026-11-07.
### retro-10: Description should cover multi-session retros

- **ID:** retro-10
- **Severity:** Low
- **Category:** Clarity
- **Upstream:** upstream-candidate
- **Evidence:**
  - `retro/SKILL.md:3`: "Conduct a retrospective on a coding session."
  - The same text is in `agents/openai.yaml:3`.
  - The real use covered 12 sessions.
- **Problem:** The human-facing summary understates the scope. It is minor
  because the skill is user-invoked.
- **Change:** in both files, change the text to "Conduct a retrospective on
  one or more coding sessions and record the decisions."
- **Risk:** None. Lint items 2 and 16 still pass.
- **Status:** implemented
- **Note:** Modified: description keeps a third-person "Use when…" clause (lint item 3).
 Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3: add a third-person 'Use when…' clause, e.g. 'Conducts a retrospective on one or more coding sessions and records the decisions. Use when reviewing past sessions to improve the agent environment.' Keep openai.yaml short_description in sync.
### retro-11: Name the reviewer the standards go to

- **ID:** retro-11
- **Severity:** Low
- **Category:** Clarity / Navigation
- **Upstream:** local-fork
- **Evidence:**
  - `retro/SKILL.md:19` and `:42-46` refer to "the **reviewer agent**".
  - `:53` says "`CODING_STANDARDS.md`: this file is read during review".
  - This user's reviewer is `review-and-refine`, which reads "the guidance
    set" (`review-and-refine/SKILL.md:56`), not a fixed
    `CODING_STANDARDS.md`.
- **Problem:** The agent may propose creating a `CODING_STANDARDS.md` that no
  reviewer reads.
- **Change:** append to `SKILL.md:53`: "Here the reviewer is the
  `review-and-refine` skill; put judgement-call standards where its guidance
  set reads them, and check that before creating a new file."
- **Risk:** It couples the fork to review-and-refine. If that skill changes
  its sources, this line goes stale.
- **Status:** implemented
- **Note:** Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### retro-12: Drop the duplicate to-agents pointer

- **ID:** retro-12
- **Severity:** Low
- **Category:** Duplication
- **Upstream:** upstream-candidate
- **Evidence:**
  - `retro/SKILL.md:55`: "Follow the advice in the `to-agents` skill."
  - This duplicates step 1 (`:11`), which already loads it.
- **Problem:** One meaning is stated twice.
- **Change:** delete the sentence "Follow the advice in the `to-agents`
  skill." from line 55.
- **Risk:** None.
- **Status:** implemented
- **Note:** Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### retro-13: Reflow prose to 80 characters

- **ID:** retro-13
- **Severity:** Low
- **Category:** Platform compliance (to-agents style)
- **Upstream:** local-fork
- **Evidence:** 16 lines exceed 80 chars: `SKILL.md:7, 13, 17-23, 42, 44,
  46, 52-55`. Line 19 is 733 chars. The rule is
  `to-agents/SKILL.md:204-205`.
- **Problem:** It breaks the house style, and dense category bullets are
  hard to scan.
- **Change:** reflow every prose line to 80 characters or fewer, with no
  wording change. Split each category bullet into a lead sentence plus
  sub-bullets where it has more than two sentences (lines 18, 19). Apply it
  after the other edits.
- **Risk:** None. Diff noise only.
- **Status:** implemented
- **Note:** Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
## Appendix: combined Steps if retro-01–09 are all approved

So phase 4 can apply overlapping edits once:

```
## Steps

1. Load the `to-agents` writing guide: the Skill tool in Claude Code,
   or read `~/.agents/skills/to-agents/SKILL.md` elsewhere.

2. Read the retro history: run
   `node scripts/retro-record.mjs history`. Note recurring targets and
   tags, rejected items, and open items. See [RECORDS.md](RECORDS.md).
   Done when you have its output (an empty history is fine).

3. Pick the sessions. Use the ones the user names. With none named, use
   the current session when it holds work before `/retro`; otherwise
   ask. Logs: Claude Code `~/.claude/projects/<cwd with / and . as ->/`;
   Codex `~/.codex/sessions/YYYY/MM/DD/`. Run
   `node scripts/session-digest.mjs list <project-dir> [<since>]`.
   Create the record (`retro-record.mjs new`) and add each session
   (`add-session`). Done when every chosen session is in the record.

4. Read each session with `session-digest.mjs digest <log>`. Open the
   raw log only for a truncated passage. For more than two sessions,
   give each group of related sessions to one subagent that returns
   candidates with session ids and verbatim quotes.
   Done when every recorded session has been read.

5. Find candidates in every category below, checking each against
   every session. Severity: **High** the agent failed or the user
   corrected it; **Med** it cost tool calls, tokens, or rework; **Low**
   wording. Capture evidence now (session id plus verbatim words), and
   record it with `add-candidate`. Search history (`search <regex>`):
   a match goes in `relatedTo`; a recurring one raises severity a
   level; a match on a rejected item needs new evidence.
   Done when every category has been checked against every session.
   [category list unchanged]

6. Iterate the candidates with the user, one at a time, by severity:
   [retro-02 local-only text]
   [retro-09 question-tool text, otherwise current lines 29-32]
   [retro-01 decide/record text]

7. Hand off. [retro-08 text]
```

## Cross-skill findings

- Memory `retro-iterate-per-suggestion.md` restates `retro/SKILL.md:25-36`
  (one question per suggestion, local-only first, record a plan). Once the
  skill holds it, the memory duplicates it and can drift. After phase 4,
  reduce the memory to a pointer or delete it. Affects: auto-memory in
  `~/.claude/projects/-home-unvoid--agents-skills/memory/`.
- `_refinement/platform-facts.md` lint item 3 requires a "Use when…" clause
  in every description. `to-agents/SKILL-MECHANICS.md:22-26` says
  user-invoked skills (`disable-model-invocation: true`) take a human-facing
  one-liner with triggers stripped. Lint item 3 should exempt user-invoked
  skills. Affects: `_refinement` (all agents' lint runs).
