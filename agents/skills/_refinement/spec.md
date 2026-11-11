# Skill Refinement Spec

You refine one skill, named in your spawn prompt as `<name>`. The skill lives
at `~/.agents/skills/<name>/`. Your report lives at
`~/.agents/skills/_refinement/reports/<name>.md`.

The work runs in four phases. The spawn prompt runs phases 1–2; the user
resumes you for phase 3, then phase 4. Stop at the end of each phase you were
asked to run and report a short summary.

Evals are out of scope; see [`evals-deferred.md`](evals-deferred.md).

## Phase 0 — Preconditions

1. Confirm these exist under `~/.agents/skills/`: `_refinement/spec.md`,
   `_refinement/platform-facts.md`, `.git`, and `<name>/SKILL.md`.
   If any is missing, stop and report it.

Done when: every path is confirmed.

## Phase 1 — Investigate

Your only write in phases 1–2 is your report and appends to `cross-skill.md`.

Read, in full:

- Every file in `~/.agents/skills/<name>/`, including `agents/openai.yaml`.
- Every skill `<name>` invokes, hands off to, or receives from, for its
  hand-off contract.
- `~/.agents/skills/to-agents/SKILL.md` and `SKILL-MECHANICS.md`: the writing
  standard.
- `~/.agents/skills/_refinement/platform-facts.md`: platform rules and the
  lint checklist.
- `~/.claude/CLAUDE.md`, to spot rules the skill duplicates.

Apply every lens below to the whole skill:

1. **Process map**: every step, gate, branch, loop, sub-agent hand-off, input,
   and output.
2. **Clarity**: each rule, gate, step, input, and output is unambiguous. Each
   gate states its entry and exit condition. Each step ends on a checkable
   completion criterion.
3. **Duplication**: one meaning stated twice, inside the skill or across the
   skill and a linked skill or `CLAUDE.md`.
4. **Bottlenecks**: steps that cost many tool calls or tokens, and repeated
   manual manipulation by the agent.
5. **Failure points**: ambiguous wording, missing error paths, unverifiable
   gates, critical rules placed past the first ~5k tokens (lost on
   compaction), weak triggering in the description.
6. **Script opportunities**: repeated deterministic work a script or CLI can
   take over. Follow the script conventions below.
7. **Platform compliance**: every item of the lint checklist in
   `platform-facts.md`.
8. **Embedded diagram**: propose embedding the ASCII process map in the skill
   only when it has real branches, loops, or gates that numbered steps express
   poorly. The diagram supplements the steps; the steps stay complete without
   it. Keep it small, or move it to a reference file.

Done when: every lens has been applied and every finding has file:line
evidence.

### Script conventions

- Scripts live in `<skill>/scripts/`. Propose moving existing scripts there
  (e.g. from `assets/`) and updating every reference.
- Use Bash for simple glue. Use dependency-free Node (`.mjs`) when parsing
  JSON or for heavier logic.
- Model Node CLIs on
  `~/.agents/skills/address-comments/scripts/remote-pr-comments.mjs`: a usage
  string, a subcommand `switch`, strict argument validation, `fail()` writing
  to stderr with exit 2, atomic JSON writes, compact stdout confirmations, and
  a companion workflow `.md` linked from `SKILL.md`.
- Scripts are idempotent and handle their own errors. `SKILL.md` states
  whether each script is run or read.

## Phase 2 — Write the report

Write `~/.agents/skills/_refinement/reports/<name>.md` with these sections,
in order:

1. **Header**: skill name, date, list of files read.
2. **Process map**: an ASCII flow diagram (steps, gates as decision points,
   hand-offs, outputs), then a table with one row per step: inputs, action,
   outputs, gate or exit condition, failure points.
3. **Findings summary**: suggestion counts by severity.
4. **Suggestions**, ordered High, then Med, then Low. Each one carries:
   - `ID`: `<name>-NN`
   - `Severity`: High, Med, or Low
   - `Category`: the lens that found it
   - `Evidence`: `file:line` and a short quote
   - `Problem`: what is wrong and why it matters
   - `Change`: the exact proposed change, as before/after text or a full
     script spec
   - `Risk`: trade-offs, and the effect on the process map
   - `Status: pending`
   - `Note:` (empty; filled in phase 3)
5. **Cross-skill findings**: problems whose fix lies in another skill.

Severity scale:

- **High**: the skill can fail or misbehave.
- **Med**: friction, duplication, token waste, or scriptable manual work.
- **Low**: wording or style.

Append each cross-skill finding to
`~/.agents/skills/_refinement/cross-skill.md` as one line:
`- [<name>] <finding> → affects <other-skill>`.
Append with a shell `>>` (for example `printf '%s\n' "<line>" >> <file>`):
other agents append to the same file in parallel.

Done when: any agent could implement each suggestion from the report alone,
without re-investigating.

## Phase 3 — Walkthrough

Runs when the user resumes you with "Start phase 3".

1. Put each suggestion to the user with AskUserQuestion, one suggestion per
   call, in report order. Options: Approve, Modify, Reject. You may offer all
   Low suggestions as one batch.
2. After each answer, update the suggestion in the report: set `Status` to
   `approved`, `modified`, or `rejected`, and record the user's words in
   `Note`. For `modified`, rewrite `Change` to match.

Done when: no suggestion has `Status: pending`.

## Phase 4 — Implement

Runs when the user resumes you with "Start phase 4". Skills are implemented one
at a time.

1. Apply every `approved` and `modified` suggestion. Keep every edit inside
   `~/.agents/skills/<name>/`.
2. Verify:
   - Run `node ~/.agents/skills/to-agents/scripts/lint-skill.mjs check
     ~/.agents/skills/<name>`. Fix every error and rerun until it exits 0.
     Then check the judgement items of the `platform-facts.md` checklist
     the script cannot test.
   - Run each new or changed script on a sample input and show its output.
   - Check every relative link in the skill resolves.
3. Set each applied suggestion's `Status` to `implemented`.
4. Commit the skill's changed paths and the report by name, staging and
   committing in one command:
   `git -C ~/.agents/skills add <paths> _refinement/reports/<name>.md &&
   git -C ~/.agents/skills commit -m "refactor: Refine <name> skill"`.

Done when: the lint script exits 0, every script ran, and the commit exists.

## Boundaries

- Edits land only in `~/.agents/skills/<name>/`. Fixes for other skills go in
  the report's cross-skill section and `cross-skill.md`.
- Phases 1–2 may run in parallel with other skills' agents. Phases 3–4 run one
  skill at a time.
