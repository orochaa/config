# Skills repo

Personal agent skills for Claude Code and Codex, one folder per skill.
`~/.claude/skills/<name>` symlinks to each folder here. Every skill is local;
no upstream dependency or lock file exists.

## Maintain

1. Edit skills through the `to-agents` skill (writing standard + lint).
2. Refine one skill per agent: follow `_refinement/spec.md`; reports land in
   `_refinement/reports/<name>.md`; cross-skill findings append to
   `_refinement/cross-skill.md`.
3. Run `_refinement/scripts/check-skills.sh`; fix every drift line it prints.
4. Commit per `~/.claude/CLAUDE.md`: one skill per commit, `refactor: Refine
   <name> skill` for refinements, `feat: Add <name>` for new skills.

## Add a skill

1. Create `<name>/SKILL.md` (and `agents/openai.yaml`).
2. Symlink it: `ln -s ~/.agents/skills/<name> ~/.claude/skills/<name>`.
3. Add a row below.
4. Run the check script until clean.

## Inventory

Status: **refined** = has a report in `_refinement/reports/`; **raw** = not
yet refined. **M** = user-invoked only (`disable-model-invocation: true`).

| Skill | Purpose | Status |
| --- | --- | --- |
| `address-comments` | Address review comments with approval gates | refined, M |
| `diagnosing-bugs` | Diagnosis loop for hard bugs | raw |
| `domain-modeling` | CONTEXT.md and ADR upkeep | raw |
| `grill-me` | Relentless interview on a plan | raw, M |
| `grill-to-implementation` | Grill a spec into an implementation contract | refined |
| `grill-with-docs` | Grill and write CONTEXT.md/ADRs | refined, M |
| `grilling` | Stress-test a plan or idea | raw |
| `handoff` | Compact a session into a handoff doc | refined, M |
| `implement` | Build an approved spec in tested slices | refined, M |
| `improve-codebase-architecture` | Find deepening opportunities | raw, M |
| `research` | Cited research saved as Markdown | refined |
| `resolving-merge-conflicts` | Resolve in-progress git conflicts | refined |
| `retro` | Retrospective over past sessions | refined, M |
| `review-and-refine` | Review a finished branch | refined, M |
| `setup-ts-deep-modules` | dependency-cruiser deep-module setup | raw, M |
| `tdd` | Test-first development | raw |
| `teach` | Teach a concept in this workspace | raw, M |
| `to-agents` | Writing standard for agent documents | refined |
| `to-github` | Publish specs/tickets as GitHub issues | raw |
| `to-github-review` | Format findings as GitHub review comments | refined, M |
| `to-human` | Rewrite text in plain English | refined, M |
| `to-questionnaire` | Turn a decision into a questionnaire | raw, M |
| `to-source-comments` | Add TSDoc intent comments to a diff | refined, M |
| `to-quick-ticket` | One quick ticket from requirements | raw |
| `to-spec` | Draft a spec from conversation | raw, M |
| `to-tickets` | Turn a spec into merge-safe tickets | raw, M |
| `wait-what` | Re-pitch the last message plainly | refined, M |
| `wayfinder` | Map huge work as decision tickets | raw, M |

## Pipeline

`grill-*` → `to-spec` → `to-tickets` → `to-github` → `implement` →
`review-and-refine` → `address-comments` → `to-github-review`.
`handoff` carries state between sessions.

## Open drift

- Raw skills pending refinement: see the **raw** rows above.
