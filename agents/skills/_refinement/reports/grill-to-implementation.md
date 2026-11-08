# Refinement report: grill-to-implementation

## Header

- Skill: `grill-to-implementation`
- Date: 2026-11-07
- Upstream status: local (not listed in `~/.agents/.skill-lock.json`); no
  `Upstream` tags apply.
- Files read:
  - `grill-to-implementation/SKILL.md` (119 lines, ~880 words)
  - `grill-to-implementation/agents/openai.yaml`
  - `grilling/SKILL.md`, `grilling/agents/openai.yaml` (invoked skill)
  - `handoff/SKILL.md` (handoff file format and naming it shares)
  - `to-spec/SKILL.md`, `to-tickets/SKILL.md` (produce its inputs)
  - `implement/SKILL.md` (consumes its output)
  - `grill-me/SKILL.md`, `grill-with-docs/SKILL.md` (sibling grill skills)
  - `to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
  - `_refinement/platform-facts.md`, `_refinement/spec.md`
  - `~/.claude/CLAUDE.md` (git-commit rules only; no overlap with this skill)

## Process map

```
 invocation (ticket / spec / pasted text / directory)
            |
            v
   [1] Identify inputs ----------------------------+
      <dir> given?                                 |
       | yes                    | no               |
       v                        v                  |
   read <base>.spec.md|.md   >= 2 paths given? --no--> ask for path(s)
   <base>.handoff.md          (handoff + spec       |   (loop until given)
   issues/NN-*.md             targets)             |
       |   write targets: ??  | yes               |
       +----------+-----------+                    |
                  v                                |
   [2] Read all source material  <-----------------+
                  v
   [3] Interview round (via grilling: frontier, recommend, wait)
       grep naming family before proposing names
                  v
   [4] End of round: append handoff entry; update spec target(s)
                  v
   [5] Show draft (interfaces + rules + affected spec sections)
                  v
      <complete interface set ready?> -- ?? (no entry condition)
         | yes                         | no
         v                             |
   [6] explicit approval? --change--> revise --+
         | approved                            |
         v                                     |
      record approval in handoff               |
                  v                            v
      <material decision open?> --yes--> next round ([3])
         | no (or user leaves open)
         v
   [7] "Finalize" spec  -- ?? (no defined action, no report, no stop)
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 Identify inputs | Directory, or user paths, ticket, pasted text | Resolve spec, handoff, tasks; or require handoff + spec paths | Path set | ≥2 paths, or directory files found | Directory mode names no write targets; no rule for missing files or both `<base>.md` and `<base>.spec.md`; handoff creation unspecified (L18–37) |
| 2 Read sources | Path set | Read all artifacts | Facts | None stated | No completion criterion |
| 3 Interview round | Frontier from grilling | Ask questions, recommend, research facts | User decisions | User answers round | Duplicates grilling mechanics (L47–51); per-task order vs frontier unclear in directory mode (L20–22) |
| 4 Persist round | Decisions | Append handoff entry; update spec | Updated files | None stated | Handoff format undefined vs `/handoff` template; directory-mode spec target undefined (L76–83) |
| 5 Draft | Spec, proposals | Show interfaces, rules, affected sections | Draft in chat | Every round or on "draft" | Full redraw each round costs tokens (L85–88) |
| 6 Approval | Complete interface set | Ask for explicit approval; revise | Approval in handoff | No entry condition; exit = approval | When to ask is unstated (L91–95) |
| 7 Finalize | Settled decisions | "Finalize" | Final spec | No material decision open | "Finalize" is not an action; no final report, no stop, no next step (L103–119) |

## Findings summary

| Severity | Count |
| --- | --- |
| High | 3 |
| Med | 7 |
| Low | 2 |
| Total | 12 |

Lint checklist (`platform-facts.md`): items 1, 2, 4–12, 14–16 pass; item 3
fails (no "Use when" clause, see -03); item 13 fails (workflow in prose, no
numbered steps or validation loop, see -04); item 17 n/a. No line exceeds 80
characters. No embedded diagram is proposed: once the workflow is numbered
(-04, -02) the one loop and one approval gate read clearly as steps.

## Suggestions

### grill-to-implementation-01

- ID: grill-to-implementation-01
- Severity: High
- Category: Clarity / Failure points
- Evidence: `SKILL.md:18-22` "When given a directory `<dir>` ... read the
  spec (`<base>.spec.md` or `<base>.md`), the handoff (`<base>.handoff.md`),
  and the tasks ... A task is done when the handoff records every decision
  for it." and `SKILL.md:76-83` "Update the target spec file or files".
- Problem: Directory mode says what to read but never what to write. "Target
  spec file or files" is defined only for the two-path mode (L26-28), so in
  directory mode the agent must guess whether settled rules go into
  `<base>.spec.md`, into each `issues/NN-*.md`, or both. `implement` (L61)
  later updates "the rule in the ticket", so tickets are evidently expected
  to carry the rules. There is also no error path when the spec or handoff is
  missing, no precedence when both `<base>.spec.md` and `<base>.md` exist,
  and no statement of whether interface approval (L91) is per task or for the
  whole set.
- Change: Replace `SKILL.md:18-22` with:

  ```markdown
  When given a directory `<dir>` (base name `<base>`):

  - Spec: `<dir>/<base>.spec.md`; else `<dir>/<base>.md`. When both exist,
    use `<base>.spec.md` and say so. When neither exists, ask for the spec
    path before grilling.
  - Handoff: `<dir>/<base>.handoff.md`. Create it when missing.
  - Tasks: each `<dir>/issues/NN-*.md` in `NN` order, excluding
    `*.handoff.md` and `*.review.md`.
  - Write targets: the spec plus the task file the decision belongs to.
    Shared rules live in the spec; task-specific rules and interfaces live
    in the task file, which links to the spec rule rather than copying it.

  Grill the tasks in `NN` order. A task is settled when every decision for it
  is recorded in the handoff and written to its task file, and its interface
  set is approved (see Finish).
  ```

  If -09 is approved, replace the three resolution bullets with "Run
  `scripts/resolve-inputs.sh <dir>` and use the paths it prints."
- Risk: Fixes a write convention (shared vs task-specific) the user may want
  differently; confirm the split in phase 3. Process map: step 1 gains an
  explicit error branch and step 4 gets defined targets.
- Status: implemented
- Note: Approved by user (shared rules → spec, task rules → ticket). Adjusted for handoff-18 (option B): the handoff path is <dir>/<base>.spec.handoff.md when the spec is <base>.spec.md, else <dir>/<base>.handoff.md — state it by pointing to handoff/SKILL.md step 2's naming rule. Scoped sub-handoffs (handoff step 5, <root>.<scope>.handoff.md) also exist now; exclude nothing new, but treat them as belonging to their scope.

### grill-to-implementation-02

- ID: grill-to-implementation-02
- Severity: High
- Category: Clarity / Failure points (completion criterion)
- Evidence: `SKILL.md:91-92` "Get the user's explicit approval for the
  complete interface set before marking it approved"; `SKILL.md:117`
  "Do not finalize while a material decision remains open".
- Problem: The approval gate has no entry condition: nothing says when the
  interface set counts as complete enough to put to the user. "Finalize" is
  not an action: there is no final check, no report, and no stop, so the
  session either ends prematurely (agent declares done after a round) or
  never ends. It also never names what comes next (`to-tickets` or
  `implement`), both of which are user-invoked and consume this output.
- Change: Rename `## Final result` to `## Finish` and put these numbered
  steps before the existing spec-content list (L105-114, kept as reference):

  ```markdown
  ## Finish

  Enter Finish when the grilling frontier is empty: every branch visited and
  no material decision open, except ones the user chose to leave open.

  1. Show the complete interface set with every rule it depends on.
  2. Ask for explicit approval of the whole set. On a requested change,
     revise, persist the round, and ask again.
  3. Record the approval, with date and scope, in the handoff. Mark the
     interfaces `approved` in the spec.
  4. Check the spec against the list below. Every left-open decision appears
     in both spec and handoff with its implementation impact.
  5. Report the spec and handoff paths and any open decisions, then stop.
     The user picks the next step, such as `/to-tickets` or `/implement`.
  ```

  Delete `SKILL.md:91-95` (moved into steps 1-3) and `SKILL.md:117-119`
  (moved into the entry condition and step 4).
- Risk: Low. Makes the end checkable and adds one explicit stop. Process map:
  step 6 gets an entry condition, step 7 becomes a concrete report + stop.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### grill-to-implementation-03

- ID: grill-to-implementation-03
- Severity: High
- Category: Platform compliance / Failure points (triggering)
- Evidence: `SKILL.md:3-5` "Run a decision-by-decision grilling session that
  turns a ticket, spec, or pasted requirements into an architecture-focused
  implementation contract."
- Problem: Fails lint item 3: imperative rather than third person, and no "Use
  when" trigger clause. The skill is model-invocable
  (`allow_implicit_invocation: true`) and competes with `grilling`, whose
  description fires on "any 'grill' trigger phrases"; nothing separates the
  two branches (persisted contract vs open-ended stress test), and the
  directory branch has no trigger at all.
- Change: Replace the description with:

  ```yaml
  description: >-
    Grills a ticket, spec, or pasted requirements decision by decision into an
    approved implementation contract (architecture, interfaces, rules),
    persisted to a spec and handoff each round. Use when requirements must
    become implementation-ready interfaces before coding, or when given a
    spec-and-tickets directory to grill. For open-ended stress-testing with
    no persisted spec, use grilling.
  ```

  (~420 characters; within limits.)
- Risk: Longer always-loaded pointer (~30 more tokens). Process map
  unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### grill-to-implementation-04

- ID: grill-to-implementation-04
- Severity: Med
- Category: Platform compliance (lint 13) / Clarity / Duplication
- Evidence: `SKILL.md:76` "At the end of each round, update both persistent
  artifacts"; `SKILL.md:97-98` "Persist round decisions and history as they
  are settled; do not wait until the whole interview ends."; `SKILL.md:99`
  "the spec file or files as the current approved result" vs `SKILL.md:100`
  "The spec may contain settled rules while an interface is still proposed".
- Problem: The per-round procedure is prose spread over three paragraphs.
  L97-98 restates L76. L99 calls the spec "the current approved result" and
  L100 immediately allows unapproved content in it, which is contradictory.
  There is no ordered checklist or completion criterion for a round.
- Change: Replace `SKILL.md:74-101` (minus the approval lines moved by -02)
  with:

  ```markdown
  ## Each round

  1. Ask the frontier questions (see Interview) and wait for answers.
  2. Append a dated handoff entry: scope, settled decisions with rationale,
     evidence with source links, remaining questions, and spec changes. Mark
     superseded decisions in the new entry; keep earlier entries intact.
  3. Write the newly settled rules to the spec target(s). Correct rules the
     round resolved differently. State each requirement in one target only.
  4. Label every interface in the spec `proposed` or `approved`.
  5. Show the draft (see Drafts).

  A round is done when the handoff entry and spec edits are on disk and the
  draft is shown. The handoff is the chronological record; the spec is the
  current state, with each interface's status labelled.

  ## Drafts

  A draft shows the proposed code interfaces, the main rules they depend on,
  and the affected spec sections. It is a review view and approves nothing.
  The user can ask for one at any time by saying **"draft"**.
  ```
- Risk: Pure restructuring; no behaviour change except the explicit round
  completion criterion. Interacts with -07 (draft size). Process map: steps
  4-5 become numbered sub-steps.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### grill-to-implementation-05

- ID: grill-to-implementation-05
- Severity: Med
- Category: Duplication
- Evidence: `SKILL.md:47-52` "Use the `/grilling` design tree, round
  frontier, and question format. Ask all questions whose prerequisites are
  settled in one round, recommend an answer, and wait for the user's
  decisions ... Research facts from the supplied sources and available
  environment rather than asking the user to repeat them." vs
  `grilling/SKILL.md:12-18` and `grilling/SKILL.md:34-39`.
- Problem: Restates grilling's frontier, recommendation, wait, and
  facts-are-yours rules. Two sources of truth drift; e.g. grilling's
  "at most 4 questions per call" and sub-agent fact dispatch are not echoed
  here, so the restatement is already a partial (and therefore misleading)
  copy. `SKILL.md:10` already says to run grilling.
- Change: Replace `SKILL.md:47-52` with:

  ```markdown
  Run the rounds with the `grilling` skill. Keep every question at the
  architecture and contract level.
  ```
- Risk: Relies on `grilling` being loaded; it is model-invocable, so the
  agent can reach it. Process map unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### grill-to-implementation-06

- ID: grill-to-implementation-06
- Severity: Med
- Category: Failure points / Hand-off contract
- Evidence: `SKILL.md:26` "One path for the persistent grilling handoff and
  decision history."; `SKILL.md:79` "Append a dated handoff entry"; vs
  `handoff/SKILL.md:56-84` (template with `## Task history (append-only)`).
- Problem: The skill never says what a new handoff file looks like or where
  in an existing one entries go. The same file is later refreshed by
  `/handoff` and read by `implement` (L61); entries in an ad hoc shape break
  `/handoff`'s refresh (it expects Goal / Current snapshot / Next steps /
  Task history sections).
- Change: Add after the round step 2 text from -04 (or after `SKILL.md:80`
  if -04 is rejected):

  ```markdown
  The handoff uses the `/handoff` template
  ([`../handoff/SKILL.md`](../handoff/SKILL.md), "Create a fresh handoff").
  Create it from that template when missing. Append round entries under
  `## Task history (append-only)` and refresh `## Current snapshot` and
  `## Next steps` each round.
  ```
- Risk: Adds an external link outside the skill folder (allowed as
  disclosed reference per `to-agents`); couples the skill to the handoff
  template's section names. Process map: step 4 output gets a defined shape.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted: link to the handoff template in ../handoff/SKILL.md without naming its section heading (handoff is being restructured into numbered steps); name the handoff file per handoff's naming rule (handoff-18, option B).

### grill-to-implementation-07

- ID: grill-to-implementation-07
- Severity: Med
- Category: Bottlenecks
- Evidence: `SKILL.md:85-87` "At the end of each round, show a concise draft
  of the proposed code interfaces and the main high-level rules they depend
  on. Also show the affected spec sections".
- Problem: Re-printing interfaces, rules, and spec sections every round
  grows with the design and repeats unchanged material, costing output
  tokens and user attention on long sessions.
- Change: In the Drafts text (from -04, or `SKILL.md:85-87`), replace the
  every-round display with:

  ```markdown
  At the end of each round, show only the interfaces, rules, and spec
  sections the round added or changed. Show the full draft when the user
  says **"draft"** and at Finish.
  ```
- Risk: The user sees the whole picture less often; mitigated by the
  "draft" keyword and the full view at Finish. Process map: step 5 shrinks to
  a delta.
- Status: implemented
- Note: Approved by user.

### grill-to-implementation-08

- ID: grill-to-implementation-08
- Severity: Med
- Category: Duplication / Clarity (no-op)
- Evidence: `SKILL.md:39-43` "The user controls invocation of related spec,
  ticket, and handoff skills. Treat artifacts they provide from those
  workflows as source material ... Keep those skills' workflow instructions
  out of this skill."
- Problem: The first sentence is a no-op (`to-spec`, `to-tickets`,
  `handoff` all set `disable-model-invocation: true`). The second restates
  L34-36. The last sentence is a maintainer note, not an agent instruction.
  The only live rule is "an explicitly invoked related skill governs its own
  workflow", and it does not say what happens to the grilling session after.
- Change: Replace `SKILL.md:39-43` with:

  ```markdown
  When the user invokes `/to-spec`, `/to-tickets`, or `/handoff` mid-session,
  follow that skill for its output. Then resume the round with the updated
  files as current state.
  ```
- Risk: Low. Process map: adds an explicit resume edge from a side skill
  back into step 3.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

### grill-to-implementation-09

- ID: grill-to-implementation-09
- Severity: Med
- Category: Script opportunities
- Evidence: `SKILL.md:18-21` directory-mode resolution: spec fallback,
  handoff name, `issues/NN-*.md` glob with two exclusions.
- Problem: Deterministic file resolution done by hand each invocation: a
  few `ls`/glob calls with exclusions and ordering, easy to get subtly wrong
  (e.g. including `01-foo.review.md`, or picking `<base>.md` when
  `<base>.spec.md` exists).
- Change: Add `grill-to-implementation/scripts/resolve-inputs.sh`, Bash,
  read-only and idempotent:
  - Usage: `resolve-inputs.sh <dir>`. Missing/extra args or a non-directory
    print the usage string to stderr and exit 2 via `fail()`.
  - `base=$(basename "$(realpath "$dir")")`.
  - Spec: `<dir>/<base>.spec.md` if present, else `<dir>/<base>.md`. If both
    exist, print `note: using <base>.spec.md; ignoring <base>.md` to stderr.
    If neither exists, `fail "no spec: expected <dir>/<base>.spec.md or
    <dir>/<base>.md"`.
  - Handoff: print `handoff: <path> (exists)` or `handoff: <path> (missing)`.
  - Tasks: `<dir>/issues/[0-9][0-9]-*.md`, excluding `*.handoff.md` and
    `*.review.md`, sorted with `LC_ALL=C sort`. Print `task: <path>` per file,
    or `tasks: none` when the folder is absent or empty.
  - Stdout example:
    ```
    spec: .scratch/sync/sync.spec.md
    handoff: .scratch/sync/sync.handoff.md (exists)
    task: .scratch/sync/issues/01-schema.md
    task: .scratch/sync/issues/02-replay.md
    ```
  - In `SKILL.md` directory-mode text: "Run
    `scripts/resolve-inputs.sh <dir>` and use the paths it prints. On exit 2,
    show the error and ask the user for the missing path."
- Risk: One more file to maintain; requires `realpath` (coreutils). Process
  map: step 1 directory branch becomes one tool call with an explicit error
  exit.
- Status: implemented
- Note: Approved by user. Adjusted for handoff-18: print the handoff path per the handoff naming rule (<base>.spec.handoff.md for <base>.spec.md, else <base>.handoff.md); also list scoped sub-handoffs (<root>.*.handoff.md) as 'subhandoff: <path>' lines.

### grill-to-implementation-10

- ID: grill-to-implementation-10
- Severity: Med
- Category: Bottlenecks / Clarity
- Evidence: `SKILL.md:24` "Otherwise, require at least two user-provided
  paths"; `SKILL.md:36-37` "If a required path is missing, ask for it before
  beginning the interview."
- Problem: The missing-path rule sits 12 lines from the requirement it
  enforces (scattered). A bare "which path?" question costs a round-trip
  when a conventional default exists: the handoff for spec `x.md` is
  `x.handoff.md` beside it (`handoff/SKILL.md:14-17`). Whether a given
  handoff path may not yet exist (create it?) is also unstated.
- Change: Replace `SKILL.md:24-28` and `SKILL.md:36-37` with:

  ```markdown
  Otherwise, use these user-provided paths:

  - Handoff: one path for the decision history. It may not exist yet.
  - Spec targets: one or more paths for the final spec. They may already
    hold rules to extend or correct.

  When a path is missing, ask for it before the interview and offer a
  default: the handoff beside the first spec target, named
  `<spec-base>.handoff.md`.
  ```
- Risk: The default is only offered, never assumed, so the user keeps
  control. Process map: the ask loop in step 1 usually resolves in one
  answer.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for handoff-18 (option B): the offered default is the handoff skill's name for the first spec target, i.e. the full basename + .handoff.md (sync.spec.md → sync.spec.handoff.md); point to handoff/SKILL.md for the rule rather than restating it.

### grill-to-implementation-11

- ID: grill-to-implementation-11
- Severity: Low
- Category: Duplication (cross-skill shape)
- Evidence: `SKILL.md:107-113` section list (Goal, Architecture, Settled
  rules, Named code interfaces, Compatibility/acceptance) vs
  `to-spec/SKILL.md:38-52` (TL;DR, Problem, Solution, Behavior, Acceptance
  requirements, Implementation decisions, Test strategy).
- Problem: Two spec shapes feed the same consumers (`to-tickets`,
  `implement`). This one lacks a TL;DR and any test strategy, which
  `implement` L20 ("required test coverage") looks for.
- Change: Replace `SKILL.md:109-113` with:

  ```markdown
  - TL;DR: the change and its outcome in one or two sentences.
  - Goal, problem, scope, and relevant constraints.
  - Architecture, component responsibilities, dependencies, and data flow.
  - Settled rules and behavior, including important state and failure cases.
  - Named code interfaces with approved signatures and contract semantics.
  - Compatibility, observable acceptance requirements, and test seams.
  ```
- Risk: Slightly longer specs. Process map unchanged.
- Status: implemented
- Note: Approved by user.

### grill-to-implementation-12

- ID: grill-to-implementation-12
- Severity: Low
- Category: Platform compliance (wording)
- Evidence: `SKILL.md:10` "Run `/grilling`"; `SKILL.md:47` "Use the
  `/grilling` design tree".
- Problem: `/grilling` is Claude Code slash syntax; Codex invokes skills as
  `$grilling` (see `agents/openai.yaml:4`). Naming the skill plainly works on
  both platforms.
- Change: Replace each `` `/grilling` `` with "the `grilling` skill"
  (L10: "Run the `grilling` skill to resolve ..."). -05 already does this for
  L47.
- Risk: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.

## Cross-skill findings

- `handoff/SKILL.md:14-17` derives the handoff name from the target's
  basename, so spec `<base>.spec.md` yields `<base>.spec.handoff.md`, while
  grill-to-implementation directory mode expects `<base>.handoff.md`
  (`grill-to-implementation/SKILL.md:19`). → affects `handoff`.
- No skill produces the directory layout grill-to-implementation consumes:
  `to-tickets/SKILL.md:89-90` writes `.scratch/<feature-slug>/issues/` but
  says nothing about the spec file, and `to-spec` writes files only on
  request with no naming convention, so `<dir>/<base>.spec.md` is never
  guaranteed. → affects `to-tickets`, `to-spec`.
- Spec shape differs between `to-spec/SKILL.md:38-52` and
  `grill-to-implementation/SKILL.md:107-113` (no TL;DR or test strategy in
  the latter); consumers `to-tickets` and `implement` get two shapes.
  → affects `to-spec`.
