# Refinement report: to-agents

- Skill: `to-agents`
- Date: 2026-11-07
- Upstream status: **local** (not listed in `~/.agents/.skill-lock.json`), so
  suggestions carry no `Upstream` tag.
- Files read in full:
  - `to-agents/SKILL.md` (205 lines, 11,217 chars, about 2.8k tokens)
  - `to-agents/SKILL-MECHANICS.md` (50 lines)
  - `to-agents/agents/openai.yaml` (3 lines)
  - `retro/SKILL.md` (the only skill that invokes `to-agents`, step 1)
  - `_refinement/spec.md`, `_refinement/platform-facts.md`,
    `_refinement/evals-deferred.md`, `_refinement/cross-skill.md`
  - `~/.claude/CLAUDE.md`
  - `~/.agents/.skill-lock.json`
  - For conventions: `to-human/SKILL.md`, the frontmatter and
    `agents/openai.yaml` of every skill in `~/.agents/skills/`, and the head of
    `address-comments/assets/remote-pr-comments.mjs`.
- Hand-offs: `to-agents` invokes no skill. `retro` calls it as its style guide
  (`retro/SKILL.md:11`). `wayfinder` and `setup-ts-deep-modules` reuse its term
  "context pointer" but do not invoke it.

## Process map

`to-agents` is all reference. It has no numbered steps, so the map shows how an
agent uses it, including the step it lacks.

```
 trigger: create/edit skill, AGENTS.md, CLAUDE.md   (description)
 or retro step 1 (Skill tool)
        |
        v
 [1] read SKILL.md (all reference)
        |
        v
   <is the document a skill?> --no--+
        | yes                       |
        v                           |
 [2] read SKILL-MECHANICS.md        |
     (invocation, split, router)    |
        |                           |
        +<--------------------------+
        v
 [3] write / edit the target document
        |
        v
   <review gate?>   MISSING: no checklist, no completion criterion,
        |           no lint for frontmatter or line length
        v
      done (document written; nothing verifies the levers were applied)
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 Read SKILL.md | Trigger; target doc type | Absorb levers: pointers, loads, hierarchy, completion criteria, splits, leading words, negation, pruning | Writing model in context | None stated | Description misses the "doc reached by a pointer" branch the body claims (`SKILL.md:3-5` vs `:8-9`) |
| 2 Read SKILL-MECHANICS.md | Target is a skill | Choose invocation; split by invocation; router | Invocation choice | Branch on "document is a skill" (`SKILL.md:13`) | Promised "frontmatter" coverage is only invocation; no name/description limits, layout, Codex `openai.yaml` policy (`SKILL.md:14`, `SKILL-MECHANICS.md:7-30`) |
| 3 Write the document | Steps 1-2 | Author or edit | Target document | None | No review pass, no exhaustiveness bar; mechanical rules (80-char lines, `SKILL-MECHANICS` limits) are checked by eye or not at all (`SKILL.md:204-205`) |

## Lens results without suggestions

- **Duplication with `CLAUDE.md`**: none. `CLAUDE.md` covers git commits only.
- **Bottlenecks**: low. The skill is about 3.5k tokens total; the skill branch
  is disclosed behind one pointer. The only manual repeated work is checking
  line length and frontmatter by eye (see to-agents-04).
- **Platform lint** (`platform-facts.md`): items 1, 2, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17 pass. Item 3 partly fails (description is a
  fragment, not third person; see to-agents-03). All prose lines are at most
  80 chars. No `MUST` or `CRITICAL`.
- **Embedded diagram**: not proposed. The skill has no steps, branches, or
  loops beyond one "is it a skill?" pointer.

## Findings summary

| Severity | Count |
| --- | --- |
| High | 2 |
| Med | 4 |
| Low | 2 |
| Total | 8 |

## Suggestions

### to-agents-01

- ID: `to-agents-01`
- Severity: High
- Category: Failure points / Clarity
- Evidence: `SKILL.md:8` "Reference for writing any document an agent
  consumes"; `SKILL.md:116-119` "'every rule applied' binds a body of flat
  reference ... which is how an all-reference document still carries an
  exhaustiveness bar."
- Problem: The skill teaches that an all-reference document needs an
  exhaustiveness bar, but carries none itself. Nothing tells the agent to check
  its output against the levers. Agents read the reference, write the
  document, and stop. Levers such as negation, no-ops, and duplication are
  then applied by chance. That is the variance the skill exists to remove.
- Change: Insert a new section in `SKILL.md` after line 15 (after the
  `SKILL-MECHANICS.md` pointer, before `## Context pointers`):

  ```markdown
  ## Review pass

  After writing, review the whole document against each item, line by line:

  1. **Pointers**: each description or pointer front-loads its leading word
     and names one trigger per branch.
  2. **Hierarchy**: material every branch needs is inline; material only some
     branches reach sits behind a pointer. Each concept sits under one
     heading.
  3. **Steps**: every step ends on a checkable, exhaustive completion
     criterion.
  4. **Leading words**: each restated triad or gesturing sentence collapses
     into one word.
  5. **Negation**: each prohibition becomes its positive target, or is paired
     with one.
  6. **Pruning**: each meaning lives in one place; one-command lookups stay in
     the environment; every sentence changes behaviour versus the default.
  7. **Format**: prose lines are 80 characters or fewer. Each sentence or
     list item carries one action.

  The pass is done when every item has been checked against every line and
  each failure is fixed. For a skill, also run the lint in
  [`SKILL-MECHANICS.md`](SKILL-MECHANICS.md).
  ```

  (Drop the last sentence if to-agents-04 is rejected.)
- Risk: Adds about 230 tokens near the top. The checklist summarises the
  sections below it; each item names a lever and points at its section by
  word, not by restating its rules, so the sections stay the single source.
  Process map gains step 4 "review pass" with exit "every item checked, every
  failure fixed".
- Status: implemented
- Note: Approved as written.

### to-agents-02

- ID: `to-agents-02`
- Severity: High
- Category: Platform compliance / Failure points
- Evidence: `SKILL.md:13-15` "read `SKILL-MECHANICS.md` for frontmatter,
  invocation choice, and router skills"; `SKILL-MECHANICS.md:25-26` "set
  `disable-model-invocation: true`"; `platform-facts.md:3-4` "Skills here
  serve Claude Code and OpenAI Codex (via `agents/openai.yaml`)".
- Problem: The pointer promises frontmatter guidance, but `SKILL-MECHANICS.md`
  covers only `description` and `disable-model-invocation`. An agent creating
  a skill gets no rule for `name` format, description limits, body size, the
  5k-token compaction cutoff, folder layout, or `agents/openai.yaml`. Worse,
  the user-invoked recipe is Claude-only: Codex ignores
  `disable-model-invocation` and reads `policy.allow_implicit_invocation`
  instead. Every user-invoked skill in this repo pairs the two (`grill-me`,
  `handoff`, `retro`, `to-human`, ...), but the convention is written nowhere,
  so a new skill following `to-agents` stays implicitly invocable on Codex.
- Change:
  1. In `SKILL-MECHANICS.md`, replace lines 25-26:

     Before:
     ```markdown
       exists. Mechanics: set `disable-model-invocation: true`; the `description`
       becomes human-facing — a one-line summary, trigger lists stripped.
     ```
     After:
     ```markdown
       exists. Mechanics: set `disable-model-invocation: true` for Claude Code
       and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`
       for Codex. The `description` becomes human-facing — a one-line summary,
       trigger lists stripped.
     ```

  2. Append a new section to `SKILL-MECHANICS.md`, after `## Invocation`
     (before `## Splitting by invocation`):

     ```markdown
     ## Frontmatter and layout

     Skills here load in Claude Code and OpenAI Codex.

     - `name`: 1–64 characters matching `^[a-z0-9]+(-[a-z0-9]+)*$`, equal to
       the folder name, free of `anthropic` and `claude`.
     - `description`: 1–1024 characters, no XML tags, third person, key use
       case first. A model-invoked skill ends with a "Use when…" clause.
       `description` plus `when_to_use` stays within 1536 characters, the
       listing cutoff.
     - Portability: claude.ai and the API accept only `name`, `description`,
       `license`, `compatibility`, `metadata`, and `allowed-tools`; other keys
       error there. Claude Code ignores unknown keys.
     - Body: `SKILL.md` stays under 500 lines and about 5k tokens. After
       compaction only an invoked skill's first 5k tokens survive, so critical
       rules go first.
     - Layout: `scripts/` holds code the agent runs, `references/` holds
       material it reads, `assets/` holds files used in output. Link every
       file directly from `SKILL.md`, one level deep. Give a file over 100
       lines a table of contents. Say at each script mention whether the
       agent runs it or reads it.
     - `agents/openai.yaml` (Codex) uses only `interface` (`display_name`,
       `short_description`, `default_prompt`, icons, hex `brand_color`),
       `policy` (`allow_implicit_invocation`, a boolean), and `dependencies`.
     ```

  3. In `SKILL.md:13-15`, update the pointer:

     Before:
     ```markdown
     When the document you're writing is a skill, read
     [`SKILL-MECHANICS.md`](SKILL-MECHANICS.md) for frontmatter, invocation choice,
     and router skills.
     ```
     After:
     ```markdown
     When the document you're writing is a skill, read
     [`SKILL-MECHANICS.md`](SKILL-MECHANICS.md) for invocation choice,
     frontmatter and layout limits, and router skills.
     ```
- Risk: Adds about 300 tokens to the disclosed file only; no always-loaded
  cost. The facts are a **cache** of web docs (`platform-facts.md` sources),
  justified because the lookup is expensive; they can go stale when the
  platforms change. Process map: step 2 gains the frontmatter/layout output.
- Status: implemented
- Note: Approved with adjustment per user decision 2026-11-07 ('Use when' everywhere): the user-invoked recipe in SKILL-MECHANICS.md must not say 'trigger lists stripped'; it says the description stays third person, key use case first, with a 'Use when…' clause. The Frontmatter section's description bullet says every skill ends with 'Use when…' (drop 'A model-invoked skill'). Also update any other SKILL-MECHANICS.md text that says user-invoked descriptions drop triggers.
- Implementation note: the two other "no description" passages
  (shared-reference paragraph, Router skills) now say the description sits
  outside the agent's reach. The script's `invocation-parity` rule checks
  both directions (lint item 3a).

### to-agents-03

- ID: `to-agents-03`
- Severity: Med
- Category: Failure points (triggering) / Platform compliance (lint 3)
- Evidence: `SKILL.md:3-5` "Writing documents for agents. Use when creating
  or editing skills, or modifying AGENTS.md or CLAUDE.md."; `SKILL.md:8-9`
  "a skill, an `AGENTS.md` / `CLAUDE.md`, a doc reached by a pointer".
- Problem: The body names three branches; the description triggers on two.
  Writing a reference doc behind an `AGENTS.md` pointer (for example a
  `docs/agents/*.md` file) never fires the skill. "Editing" and "modifying"
  name one branch twice, which the skill's own rule (`SKILL.md:35-36`) says
  to collapse. The first sentence is a gerund fragment, not third person as
  `platform-facts.md:13` requires.
- Change: Replace the `description` in `SKILL.md:3-5`:

  Before:
  ```yaml
  description:
    Writing documents for agents. Use when creating or editing skills, or
    modifying AGENTS.md or CLAUDE.md.
  ```
  After:
  ```yaml
  description:
    Writes documents agents consume. Use when creating or editing a skill, an
    AGENTS.md or CLAUDE.md, or a doc an agent reaches through a pointer.
  ```
- Risk: About 15 more characters of always-loaded context. The third branch
  may fire on some docs that are only partly agent-facing; that is the
  intended scope. Adding "subagent prompts" as a fourth branch was considered
  and left out: it would fire on every Agent spawn. No process-map change.
- Status: implemented
- Note: Approved as written.

### to-agents-04

- ID: `to-agents-04`
- Severity: Med
- Category: Script opportunities
- Evidence: `SKILL.md:204-205` "Keep agent-facing Markdown prose lines at 80
  characters or fewer."; `platform-facts.md:10-31` (16 lint items, most
  mechanical); `_refinement/spec.md:138` (phase 4 re-runs the lint checklist
  by hand for every skill).
- Problem: Most skill-shape rules are deterministic: name regex, description
  length, body size, links resolve, line length, `openai.yaml` keys, and
  invocation parity across platforms. Agents check them by eye, so they miss
  some and spend tokens on the rest. Every refinement phase 4 repeats the
  same manual pass.
- Change: Add `to-agents/scripts/lint-skill.mjs`, dependency-free Node.

  Interface:
  ```
  Usage:
    node scripts/lint-skill.mjs check <skill-dir> [<skill-dir> ...]
  ```
  - Structure modeled on `address-comments/assets/remote-pr-comments.mjs`:
    `usage` string, `switch` on the subcommand (only `check`; anything else
    calls `fail(usage)`), strict argument validation (at least one dir; each
    must exist and contain `SKILL.md`), `fail()` writes to stderr and exits 2.
  - Read-only and idempotent; writes no files, so the atomic-write convention
    does not apply.
  - Output: one line per finding, `<file>:<line>: <error|warn> <rule> <msg>`,
    then a summary line `checked <N> skills: <E> errors, <W> warnings`.
  - Exit codes: 0 when no errors (warnings allowed), 1 when any error, 2 on
    usage or I/O failure.
  - Frontmatter parsing: minimal YAML subset — top-level `key: value`,
    single- or double-quoted scalars, `>-` / `>` / `|` block scalars, and
    indented plain continuation lines (as in `to-agents`). An unparseable
    frontmatter is an error naming the line. `openai.yaml`: same subset plus
    one nesting level.

  Rules (each constant carries a comment naming its source):
  | Rule | Level | Check |
  | --- | --- | --- |
  | `name` | error | 1–64 chars (Claude Code), matches `^[a-z0-9]+(-[a-z0-9]+)*$`, equals `basename` of the skill dir, contains neither `anthropic` nor `claude` |
  | `description` | error | present, 1–1024 chars after folding, no `<tag>` |
  | `use-when` | warn | contains `Use when` unless `disable-model-invocation: true` |
  | `listing` | error | `description` + `when_to_use` ≤ 1536 chars |
  | `body-size` | error / warn | body < 500 lines (error); chars/4 < 5000 tokens (warn) |
  | `links` | error | every relative Markdown link in every `.md` in the skill resolves to a file (strip `#anchor`; skip `http(s):`, `mailto:`) |
  | `one-level` | warn | every `.md` file in the skill other than `SKILL.md` is linked from `SKILL.md` |
  | `toc` | warn | a non-`SKILL.md` `.md` over 100 lines has a heading containing `Contents` in its first 20 lines |
  | `line-length` | warn | prose lines over 80 chars, skipping frontmatter, fenced code, table rows, and lines that are only a link or URL |
  | `emphasis` | warn | more than 2 occurrences of `MUST` or `CRITICAL` |
  | `openai-keys` | error | top-level keys only `interface`, `policy`, `dependencies`; `brand_color` matches `^#[0-9a-fA-F]{6}$`; `allow_implicit_invocation` is `true` or `false` |
  | `invocation-parity` | error | `disable-model-invocation: true` requires `agents/openai.yaml` with `policy.allow_implicit_invocation: false` |

  Documentation: add to `SKILL-MECHANICS.md`, at the end of the new
  `## Frontmatter and layout` section from to-agents-02:

  ```markdown
  After creating or editing a skill, run
  `node ~/.agents/skills/to-agents/scripts/lint-skill.mjs check <skill-dir>`.
  Fix every error and rerun until it exits 0; judge each warning.
  ```

  This section is the companion workflow; a separate workflow `.md` adds
  nothing for a single command. `SKILL.md` links to it through the to-agents-01
  checklist.

  Verification in phase 4: run `check` on every `~/.agents/skills/*/` folder
  (excluding `_refinement`) and show the output.
- Risk: The YAML subset parser can misread exotic frontmatter; it fails loudly
  rather than guessing. Line-length warnings will fire on existing skills
  (for example `retro/SKILL.md`), which is expected. Duplicates the lint
  facts of to-agents-02 in code; the doc states the rule, the script enforces
  it. Process map: the review gate gains a validation loop (lint → fix →
  rerun until exit 0).
- Status: implemented
- Note: Approved with adjustment per user decision ('Use when' everywhere): the use-when rule is an error for every skill, with no exemption for disable-model-invocation: true.

### to-agents-05

- ID: `to-agents-05`
- Severity: Med
- Category: Failure points (missing levers) / Platform compliance
- Evidence: `platform-facts.md:62` "Rules that must hold every time belong in
  a hook, not prose."; `platform-facts.md:43-48` "feedback loops (validate →
  fix → repeat)", "One default plus an escape hatch, not a menu of options";
  `platform-facts.md:96` "Soften 'CRITICAL: You MUST' wording"; none of these
  appear in `SKILL.md` (sections at `:99-121`, `:164-172`, `:174-203`).
- Problem: The skill covers variance levers in prose but omits four the
  platforms name as primary: guardrails over prose, validation loops,
  one-default-not-a-menu, and emphasis over-application. Agents writing
  skills then encode must-hold rules as prose, offer option menus, and
  shout with `MUST`.
- Change: Three insertions in `SKILL.md`.
  1. After line 121 ("The strongest criteria are both checkable and
     exhaustive."):
     ```markdown

     For a critical operation, make the criterion a **validation loop**: run a
     check, fix what it reports, rerun until it passes. A check the agent runs
     beats a criterion it judges.

     Give one default path plus an escape hatch. A menu of options hands the
     agent a fresh choice every run — variance by design.
     ```
  2. After line 172 (end of the Negation paragraph):
     ```markdown

     Emphasis is the same lever turned up: `CRITICAL` and `MUST` make recent
     models over-apply a rule. State the rule plainly and give its reason.
     ```
  3. After line 187 (end of the environment bullet), a new bullet:
     ```markdown
     - A rule that must hold on every run belongs in a **guardrail** — a hook,
       a lint rule, a script — where it is enforced rather than requested.
       Prose is the fallback for judgement calls.
     ```
- Risk: About 150 tokens. "Guardrail" matches the leading word `retro` uses
  (`retro/SKILL.md:18`), strengthening shared language. No process-map change
  beyond what to-agents-04 adds.
- Status: implemented
- Note: Approved as written.

### to-agents-06

- ID: `to-agents-06`
- Severity: Med
- Category: Duplication / Clarity (co-location)
- Evidence: `SKILL.md:204-205` "- Keep agent-facing Markdown prose lines at
  80 characters or fewer. Split multi-action instructions into separate
  sentences or list items."
- Problem: Two formatting rules sit as the last bullet of `## Pruning`, a
  section about removing meaning. Neither rule prunes anything. By the
  skill's own co-location test (`SKILL.md:84-91`) this is scattering, and
  the last line of the file is the least attended position. If to-agents-01
  lands, its checklist item 7 states the same two rules, which makes this a
  duplicate.
- Change: Depends on to-agents-01.
  - If to-agents-01 is approved: delete `SKILL.md:204-205`. Checklist item 7
    becomes the single source.
  - If to-agents-01 is rejected: move the bullet out of `## Pruning` into a
    new final section:
    ```markdown
    ## Format

    - Keep agent-facing Markdown prose lines at 80 characters or fewer.
    - Split multi-action instructions into separate sentences or list items.
    ```
- Risk: None material. No process-map change.
- Status: implemented
- Note: Approved: delete SKILL.md:204-205 (to-agents-01 approved, checklist item 7 is the single source).

### to-agents-07

- ID: `to-agents-07`
- Severity: Low
- Category: Clarity
- Evidence: `SKILL.md:68-71` "pushed out into a separate file, reached by a
  context pointer, loaded only when the pointer fires. Spans a sibling file in
  the same folder through fully external reference that lives anywhere and any
  document can point at."
- Problem: The second sentence has no subject and reads as a garble. It means
  the tier ranges from a sibling file to a fully external doc.
- Change: Replace `SKILL.md:68-71`:

  Before:
  ```markdown
  3. **Disclosed reference** — pushed out into a separate file, reached by a
     context pointer, loaded only when the pointer fires. Spans a sibling file in
     the same folder through fully external reference that lives anywhere and any
     document can point at.
  ```
  After:
  ```markdown
  3. **Disclosed reference** — pushed out into a separate file, reached by a
     context pointer, loaded only when the pointer fires. It ranges from a
     sibling file in the same folder to an external doc that lives anywhere
     and any document can point at.
  ```
- Risk: None. No process-map change.
- Status: implemented
- Note: Approved as written.

### to-agents-08

- ID: `to-agents-08`
- Severity: Low
- Category: Duplication (no-ops)
- Evidence: `SKILL-MECHANICS.md:3-5` "The skill-specific branch of
  [`to-agents`](SKILL.md): what changes when the document is a skill —
  frontmatter, the invocation choice, and router skills. Everything else about
  writing it is the universal reference in `SKILL.md`."; `SKILL-MECHANICS.md:38`
  "The invocation cut of splitting (the sequence cut lives in `SKILL.md`):".
- Problem: The agent only reaches this file from `SKILL.md`, so the opening
  restates the pointer it just followed, and "Everything else ... is in
  `SKILL.md`" is a no-op. The parenthetical at line 38 repeats the
  cross-reference that `SKILL.md:132-133` already makes in the other
  direction.
- Change:
  1. Replace `SKILL-MECHANICS.md:3-5` with:
     ```markdown
     What changes when the document is a skill. The universal reference is
     [`SKILL.md`](SKILL.md).
     ```
  2. Replace the start of `SKILL-MECHANICS.md:38-39`:

     Before:
     ```markdown
     The invocation cut of splitting (the sequence cut lives in `SKILL.md`): split
     off a model-invoked skill when you have a distinct leading word that should
     ```
     After:
     ```markdown
     Split off a model-invoked skill when you have a distinct leading word that
     should
     ```
     and rewrap the rest of the paragraph to 80 columns.
- Risk: Keeps the back-link to `SKILL.md` for an agent that lands here
  directly. No process-map change.
- Status: implemented
- Note: Approved as written.

## Cross-skill findings

Appended to `_refinement/cross-skill.md`:

- `retro` names the pointer object **navigation pointer**
  (`retro/SKILL.md:17,52,53`) while `to-agents`, `wayfinder`, and
  `setup-ts-deep-modules` call it **context pointer**. One leading word
  should serve all. Affects `retro` (upstream, so a `local-fork` or
  `upstream-candidate` decision).
- `to-github-review` and `to-source-comments` describe themselves as firing
  only "when explicitly invoked with $…" and set Codex
  `allow_implicit_invocation: false`, but omit `disable-model-invocation:
  true`. Claude Code keeps their descriptions in context every turn for skills
  meant to be user-invoked. Affects `to-github-review`, `to-source-comments`.
- `address-comments` is model-invocable in Claude Code (no
  `disable-model-invocation`) but `allow_implicit_invocation: false` in
  Codex. Invocation differs by platform with no stated reason. Affects
  `address-comments`.
