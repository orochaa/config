# Refinement report: implement

- **Skill:** `implement`
- **Date:** 2026-11-07
- **Upstream status:** local (not listed in `~/.agents/.skill-lock.json`); no
  `Upstream` tags apply.
- **Phases run:** 0, 1, 2.

## Files read

- `~/.agents/skills/implement/SKILL.md` (75 lines, ~460 words)
- `~/.agents/skills/implement/agents/openai.yaml`
- `~/.agents/skills/to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
- `~/.agents/skills/_refinement/spec.md`, `platform-facts.md`
- `~/.claude/CLAUDE.md`
- Hand-off neighbours:
  - Upstream producers: `to-spec/SKILL.md`, `to-tickets/SKILL.md`,
    `grill-to-implementation/SKILL.md`, `handoff/SKILL.md`
  - Invoked: `~/git/unvoid/when/.codex/skills/when-verify/SKILL.md`
    (repo-local, not in `~/.agents/skills`)
  - Overlapping / downstream: `tdd/SKILL.md`, `review-and-refine/SKILL.md`
- Context: `~/git/unvoid/AGENTS.md` (grep for commit/verify/integration rules)

## Process map

```
 user invokes /implement  (spec | tickets | ?)          [no input contract]
        |
        v
 [1] Establish the work: read spec, repo rules, skills;
     baseline; requirements/non-goals/tests; test seams
        |
        v
 +-> [2] Implement slice (red -> green)
 |      |
 |      +-- decision edge? --yes--> ASK user --> answer --+
 |      |                                                 |
 |      +-- approved rule change asked? --> ASK approval  |
 |      |        --> update ticket/handoff --> code ------+
 |      |                                                 |
 |      +-- existing test fails? --> fix impl             |
 |      |        (assertion change --> ASK reason)        |
 |      v                                                 |
 |   focused validation of slice  <-----------------------+
 |      |                          [no fail path stated]
 |      v
 |   GATE A: "{slice} is validated. Commit and proceed to {next}?"
 |      | approved
 |      v
 |   commit slice
 |      |
 +-- more slices? --yes
        | no (final slice)          [final slice: gate A or gate B?]
        v
 [3] run `when-verify` per changed package   [repo-specific skill]
        |                                     [no fail path stated]
        v
     account for every requirement / non-goal
        |
        v
 GATE B: quote commands+results; ask user to inspect & approve
         (no evidence table; offer changes)
        | approved                 | changes requested -> [unstated]
        v
 commit final slice  -->  "Implementation is complete and ready for
                           review."  STOP (user picks next step)
```

| # | Step | Inputs | Action | Outputs | Gate / exit | Failure points |
|---|------|--------|--------|---------|-------------|----------------|
| 1 | Establish the work (SKILL.md:12-31) | Spec or tickets (form unstated), repo instructions, package/domain skills, code | Read; capture baseline; list requirements, non-goals, tests; derive test seams | Nothing written or shown | None stated; no completion criterion | No input contract (L9); baseline capture unspecified (L17-18); no slice plan produced, yet L47-48 needs `{next slice}` |
| 1a | Decision edge (L24-31) | Uncovered choice | Ask with options, recommendation, impact | User decision | Exit on user answer | Well defined |
| 2 | Implement slice (L33-42) | One slice | Red -> green with independent expected values; add integration/E2E tests | Code + tests | Focused validation passes (implied) | Validation failure path missing; duplicates `tdd` and conflicts with its seam-confirmation rule |
| 2a | Existing test fails (L52-53) | Failing test | Fix implementation; assertion change needs approval | Fix | User approves reason | Wrong default when spec deliberately changes the asserted behavior |
| 2b | Change approved rule (L55-62) | User request | Ask approval; update ticket and handoff; then code | Updated ticket/handoff | User approval | Ignores spec-as-source; ignores tracker tickets; conflicts with `handoff` append-only format and `to-spec` dated-history rule |
| 2c | Gate A (L44-50) | Validated slice | Ask commit-and-proceed question | Commit | User approval | Final slice has no `{next slice}`; overlaps Gate B |
| 3 | Complete (L64-70) | All slices | Run `when-verify`; account for every requirement | Command results | Commands pass | `when-verify` exists only in the `when` repo; failure loop missing |
| 3a | Gate B (L71-75) | Results | Ask inspect/approve; offer changes | Final commit, completion line | User approval | "Changes" branch unspecified; L67 and L71 read as two separate approval requests |

## Findings summary

| Severity | Count |
|----------|-------|
| High | 3 |
| Med | 6 |
| Low | 3 |
| **Total** | **12** |

## Suggestions

### implement-01

- **ID:** implement-01
- **Severity:** High
- **Category:** Failure points / Duplication
- **Evidence:** `implement/SKILL.md:66` — "After the final slice, run
  `when-verify` for every directly changed package."
- **Problem:** `implement` is a global skill (`~/.agents/skills`, symlinked
  into `~/.claude/skills`), but `when-verify` exists only at
  `~/git/unvoid/when/.codex/skills/when-verify/`. In every other repository
  the completion step names a skill that does not exist, so the agent either
  stalls or improvises, and the approval request cannot quote "each command".
- **Change:** Replace L66-67:

  Before:
  ```
  After the final slice, run `when-verify` for every directly changed package. The
  approval request quotes each command and its result; ask for approval only after
  they pass.
  ```
  After:
  ```
  After the final slice, run the repository's verification for every directly
  changed package: its verify skill when one exists (for example
  `when-verify`), otherwise the package's lint, type-check, and test commands.
  ```
  (The "quotes each command" and pass condition move into the numbered
  completion steps of implement-02.)
- **Risk:** Low. In the `when` repo behavior is unchanged because the repo
  skill still applies. Process map step 3 becomes repo-agnostic.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-02

- **ID:** implement-02
- **Severity:** High
- **Category:** Clarity / Failure points / Platform compliance (lint 13)
- **Evidence:**
  - `SKILL.md:44-50` — "After each slice ... pause and say: > `{Current slice}
    is validated. Should I commit it and proceed to {next slice}?`" and
    "Commit each approved slice before starting the next one."
  - `SKILL.md:66-75` — "The approval request quotes each command ... Then ask
    the user to inspect and approve the complete implementation ... Offer
    changes as an alternative. After approval, commit the final slice".
- **Problem:** The slice loop and completion are prose, not numbered steps,
  and have three gaps:
  1. No failure path when focused validation or verification fails (lint 13
     requires a validation loop for critical operations).
  2. The final slice hits Gate A (whose `{next slice}` does not exist) and
     Gate B; it is unclear which applies, so the agent may commit the final
     slice twice-asked or commit before full verification.
  3. L67 ("The approval request quotes...") and L71 ("Then ask the user to
     inspect and approve") read as two approval requests; the "changes"
     branch has no return path.
- **Change:** Replace the paragraphs at L44-50 and the whole section
  "## Complete the implementation" (L64-75) with numbered steps:

  In "## Implement in slices", replace L44-50 with:
  ```
  For each slice except the last:

  1. Run its focused validation. On failure, fix and rerun until it passes.
  2. Pause and ask:
     > {Current slice} is validated. Should I commit it and proceed to
     > {next slice}?
  3. On approval, commit the slice, then start the next one. On requested
     changes, apply them and return to step 1.

  The last slice skips this pause; the completion gate below covers it.
  ```

  Replace "## Complete the implementation" with:
  ```
  ## Complete the implementation

  After the last slice:

  1. Run the repository's verification for every directly changed package:
     its verify skill when one exists (for example `when-verify`), otherwise
     the package's lint, type-check, and test commands. On failure, fix and
     rerun until every command passes.
  2. Check the requirement list from "Establish the work": each requirement
     has relevant test coverage or an explicit reason it cannot be automated,
     and each non-goal remains unimplemented.
  3. Ask once for approval of the complete implementation. Quote each
     verification command and its result, list any unrun integration or E2E
     command, and keep the rest to a short prose summary. Offer changes as the
     alternative.
  4. On requested changes, apply them and return to step 1.
  5. On approval, commit the last slice, report `Implementation is complete
     and ready for review.`, and stop. The user chooses the next step.
  ```
- **Risk:** Slightly longer (~10 lines). Process map: Gate A no longer fires
  on the last slice; Gate B gains an explicit loop back to verification.
  "No evidence table" is preserved as "short prose summary" (see
  implement-11).
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-03

- **ID:** implement-03
- **Severity:** High
- **Category:** Failure points / Clarity (inputs)
- **Evidence:** `SKILL.md:3` — "based on a spec or set of tickets";
  `SKILL.md:9` — "Implement the supplied spec or tickets faithfully";
  `SKILL.md:16` — "Read the complete spec or ticket set".
- **Problem:** No input contract. Upstream skills produce different shapes:
  `to-spec` drafts in chat or a GitHub issue (`to-spec/SKILL.md:28-32`);
  `to-tickets` publishes tracker issues or `.scratch/<slug>/issues/NN-*.md`
  with **Blocked by** order (`to-tickets/SKILL.md:86-99`);
  `grill-to-implementation` produces a `<dir>` with `<base>.spec.md`,
  `<base>.handoff.md`, and `issues/NN-*.md`
  (`grill-to-implementation/SKILL.md:18-22`). `implement` says nothing about
  fetching an issue's comments, following ticket order, reading the handoff,
  or what to do when invoked with nothing. The agent may implement from
  conversation memory or in the wrong ticket order.
- **Change:** (Modified in phase 3; as implemented.) The Inputs section runs
  `../grill-to-implementation/scripts/resolve-inputs.sh <dir>` for a
  workstream directory, points to `handoff` step 2 for handoff naming
  (`sync.spec.md` -> `sync.spec.handoff.md`), assigns scoped sub-handoffs
  `<root>.<scope>.handoff.md` to their ticket, and step 1 keeps the Key files
  sentence from 36be51b. Original proposal follows.

  Insert a new section after the intro paragraph (after L10):
  ```
  ## Inputs

  Accept the spec or tickets in any of these forms:

  - A file path: read it in full.
  - A workstream directory `<dir>`: read `<base>.spec.md` or `<base>.md`,
    `<base>.handoff.md` when present, and each `issues/NN-*.md`.
  - An issue number or URL: fetch its full body and comments.
  - Pasted content in the conversation.

  When no spec or ticket is supplied, ask for one before reading code.
  Implement tickets in **Blocked by** order; a ticket starts only when its
  blockers are done. Note the handoff path, if any, for rule changes.
  ```
  And change L16 to: "1. Read the complete input from **Inputs**, repository
  instructions, and every applicable package or domain skill."
- **Risk:** Adds ~14 lines. Process map gains an entry gate ("input
  present?") before step 1. Keeps implement decoupled from upstream skills
  by naming artifact shapes, not skill workflows.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted: (a) handoff naming follows handoff/SKILL.md step 2 — for <base>.spec.md the handoff is <base>.spec.handoff.md; point to that rule instead of naming the file, and note scoped sub-handoffs <root>.<scope>.handoff.md belong to their ticket's scope; (b) for a directory, grill-to-implementation/scripts/resolve-inputs.sh <dir> prints spec, handoff, sub-handoffs and ordered tasks — run it; (c) keep the Key files sentence already added to step 1 (commit 36be51b): open the spec's or ticket's Key files first, search only for what they leave out.

### implement-04

- **ID:** implement-04
- **Severity:** Med
- **Category:** Clarity (completion criteria) / Process map
- **Evidence:** `SKILL.md:14-22` — steps 1-4 of "Establish the work" end on
  no criterion; `SKILL.md:47-48` uses `{next slice}`; `SKILL.md:68-70`
  "Account for every requirement and non-goal".
- **Problem:** "Establish the work" produces nothing visible, so (a) nothing
  tells the agent it is done, (b) no slice plan exists to name `{next
  slice}`, and (c) the completion check at L68-70 has no list to account
  against, inviting premature completion.
- **Change:** Replace L20-22 (steps 3-4) with:
  ```
  3. Write a requirement list in the conversation: each requirement, each
     explicit non-goal, and the test that will cover it.
  4. Inspect the nearest implementation and tests to derive ordinary public
     test seams.
  5. List the slices in order, naming which requirements each covers.

  This stage is done when every requirement maps to a slice and a test.
  ```
  No approval gate is added; the list is shown, then work starts.
- **Risk:** One extra message of output per run. Makes Gate A's
  `{next slice}` and the completion check (implement-02 step 2) checkable.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-05

- **ID:** implement-05
- **Severity:** Med
- **Category:** Clarity / Duplication (with CLAUDE.md)
- **Evidence:** `SKILL.md:17-18` — "Capture the current committed baseline
  and preserve unrelated worktree changes."
- **Problem:** "Capture" and "preserve" have no stated method or check. The
  practical risk is a slice commit sweeping in the user's unrelated changes.
  `~/.claude/CLAUDE.md` already requires staging named paths only, so a
  restatement would duplicate it; only the baseline record is new.
- **Change:** Replace L17-18 with:
  ```
  2. Record `git rev-parse HEAD` and `git status --short` as the baseline.
     Files already changed in the baseline stay out of every slice commit
     unless the spec covers them.
  ```
- **Risk:** None to the map. Gives the commit step an observable check.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-06

- **ID:** implement-06
- **Severity:** Med
- **Category:** Duplication / Failure points (cross-skill conflict)
- **Evidence:** `SKILL.md:35-37` — "Use a red → green loop where feasible,
  with tests based on the specification or another independent
  expected-value source."; `SKILL.md:31` — "Derive ordinary implementation
  and test-seam decisions autonomously."; `tdd/SKILL.md:35-38` — "Test only
  at pre-agreed seams. ... confirm them with the user. No test is written at
  an unconfirmed seam."
- **Problem:** L35-37 restates `tdd`'s loop and its Tautological
  anti-pattern (`tdd/SKILL.md:54-59`). `tdd` is model-invoked and its
  description ("build features ... test-first") will often fire during
  implement, and then its seam-confirmation rule contradicts implement's
  autonomous seams, producing an unplanned approval stop per slice.
- **Change:** Replace L35-37 with:
  ```
  Implement one independently coherent vertical slice at a time, test-first,
  using the `tdd` skill for test quality. Under this skill, the spec's
  requirements are the agreed seams: derive ordinary seams without asking.
  ```
- **Risk:** Makes implement depend on `tdd` being present (it is global).
  Removes duplicated wording. The seam override stays in implement; a
  matching note in `tdd` is logged as cross-skill.
- **Status:** implemented
- **Note:** Approved by user, with the tdd note: the main session adds one line to tdd (seams set by an approved spec count as agreed) in a separate commit.
### implement-07

- **ID:** implement-07
- **Severity:** Med
- **Category:** Failure points
- **Evidence:** `SKILL.md:52-53` — "When an existing test fails, fix the
  implementation. Change an existing test's assertions only after the user
  approves the reason."
- **Problem:** When the spec deliberately changes behavior an existing test
  asserts, "fix the implementation" points the agent at the wrong fix, or
  toward reverting spec-required behavior.
- **Change:** Replace L52-53 with:
  ```
  When an existing test fails, fix the implementation, unless the spec
  changes the behavior the test asserts. Change an existing test's assertions
  only after the user approves the reason; quote the spec line that changes
  the behavior.
  ```
- **Risk:** None to the map; tightens branch 2a.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-08

- **ID:** implement-08
- **Severity:** Med
- **Category:** Clarity / Duplication (with handoff, to-spec)
- **Evidence:** `SKILL.md:61-62` — "After approval, update the rule in the
  ticket (and in the handoff when the workstream has one) before changing
  code."; `handoff/SKILL.md:93-110` (append-only history, mark superseded);
  `to-spec/SKILL.md:90-97` (dated history for implementation decisions).
- **Problem:** Names only "the ticket", though the source may be a spec or a
  tracker issue. "Update the rule in the handoff" invites rewriting history,
  which the handoff format forbids.
- **Change:** Replace L61-62 with:
  ```
  After approval, update the rule in its source (spec file, ticket file, or
  tracker issue) before changing code. When the workstream has a handoff,
  append a dated entry recording the change and its reason.
  ```
- **Risk:** None to the map. Aligns with the `handoff` and `to-spec` history
  rules without restating them.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-09

- **ID:** implement-09
- **Severity:** Med
- **Category:** Clarity
- **Evidence:** `SKILL.md:39-42` — "do not execute those tests when
  repository rules prohibit it. State the exact unrun command and that its
  behavioral execution remains unverified."
- **Problem:** Does not say where the unrun command is stated, so it can be
  lost between slices and missing from the final approval request.
- **Change:** Replace L39-42 with:
  ```
  Test every requirement in the spec. Add integration or E2E coverage when it
  is the relevant test level. When repository rules forbid running those
  tests, leave them unrun and list each exact command as unverified in the
  slice pause and the completion request.
  ```
  (implement-02 step 3 already lists unrun commands at completion.)
- **Risk:** None.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-10

- **ID:** implement-10
- **Severity:** Low
- **Category:** Platform compliance (lint 3)
- **Evidence:** `SKILL.md:3` — "description: 'Implement a piece of work based
  on a spec or set of tickets.'"
- **Problem:** Imperative rather than third person, and vague ("a piece of
  work"). The lint "Use when…" clause does not apply: the skill is
  user-invoked (`disable-model-invocation: true`), and
  `to-agents/SKILL-MECHANICS.md:27-31` says its description is a human-facing
  one-liner with triggers stripped.
- **Change:**
  Before: `description: 'Implement a piece of work based on a spec or set of tickets.'`
  After (modified in phase 3, as implemented):
  `Implements a spec or ticket set in approved, tested vertical slices. Use
  when an approved spec or tickets are ready to build.`
- **Risk:** None; human-facing only.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3 ('Use when' everywhere, user decision): e.g. 'Implements a spec or ticket set in approved, tested vertical slices. Use when an approved spec or tickets are ready to build.'

### implement-11

- **ID:** implement-11
- **Severity:** Low
- **Category:** Clarity (negation)
- **Evidence:** `SKILL.md:71-72` — "approve the complete implementation
  without presenting an evidence table"; `SKILL.md:9-10` — "do not add
  behavior outside it without the user's confirmation."
- **Problem:** Prohibitions name the unwanted behavior (`to-agents` Negation
  rule). The first is replaced by implement-02 step 3 ("keep the rest to a
  short prose summary"). The second is a real guardrail and can be paired
  with a positive target.
- **Change:** Replace L9-10 with:
  ```
  Implement the supplied spec or tickets faithfully. The spec is the source of
  truth: build exactly the behavior it covers, and ask before adding more.
  ```
  (L71-72 is covered by implement-02.)
- **Risk:** None.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

### implement-12

- **ID:** implement-12
- **Severity:** Low
- **Category:** Embedded diagram / Script opportunities
- **Evidence:** `SKILL.md:33-75` — one loop and two gates.
- **Problem:** Lens check only. The process has one loop and two gates,
  which the numbered steps from implement-02 express fully. No deterministic
  repeated work exists that a script could take over: baseline capture is two
  git commands, and verification is delegated to repo commands.
- **Change:** No diagram and no script. Record the decision here only.
- **Risk:** None.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.

## Lint checklist (current state)

| # | Item | Result |
|---|------|--------|
| 1 | name | Pass (`implement`) |
| 2 | description length / no XML | Pass |
| 3 | third person, "Use when" | Fail (third person) — implement-10; "Use when" N/A for user-invoked |
| 4 | description + when_to_use ≤ 1536 | Pass |
| 5 | body < 500 lines / 5k tokens | Pass (75 lines) |
| 6 | critical rules early | Pass |
| 7 | reference files linked | N/A (none) |
| 8 | TOC for >100-line refs | N/A |
| 9 | forward slashes | Pass |
| 10 | MCP tool naming | N/A |
| 11 | script run/read | N/A |
| 12 | script errors / constants | N/A |
| 13 | numbered steps + validation loop | Fail — implement-02 |
| 14 | no time-sensitive conditions | Pass |
| 15 | CRITICAL/MUST rare | Pass (none) |
| 16 | openai.yaml keys | Pass (`interface`, `policy`; boolean) |
| 17 | diagram supplements steps | N/A |

Line length: every line ≤ 80 chars.

## Cross-skill findings

- `tdd/SKILL.md:35-38` requires user confirmation of seams before any test;
  `implement` derives seams autonomously from the spec. `tdd` should say that
  when a calling workflow (such as an approved spec under `implement`) already
  defines the seams, those count as pre-agreed. → affects `tdd`
- `when-verify` is invoked by name from the global `implement` skill but lives
  only in `~/git/unvoid/when/.codex/skills/`; its "Handoff" section
  (`when-verify/SKILL.md:27-32`) is the format implement's completion request
  quotes, so the two should stay compatible. → affects `when-verify`
  (repo-local, outside `~/.agents/skills`)
