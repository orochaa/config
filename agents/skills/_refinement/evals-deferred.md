# Evals (Deferred)

Status: deferred by the user on 2026-11-07. Out of scope for the current
refinement program. No decision was made on where suites live, when they run,
or what they cover. This file holds the research and context to resume.

## What an eval is

A small, repeatable test of a skill:

1. **Prompt**: a realistic user request.
2. **Expected behavior**: what a correct run does (skill triggers, steps and
   gates happen in order, outputs produced).
3. **Run and compare**: run in a fresh session and grade the transcript,
   before and after a change.

Kinds: **trigger** evals (the right prompt picks the skill; unrelated prompts
do not) and **behavior** evals (steps, gates, outputs). Anthropic recommends at
least 3 per skill, written before editing it.

## `claude plugin eval` findings

Checked on CLI 2.1.319 (requires 2.1.269 or later).

- **Plugins only.** A standalone skill needs a wrapper:
  `.claude-plugin/plugin.json` (`{"name": "<name>"}`) plus a **copy** of the
  skill at `skills/<name>/`. Symlinks leaving the plugin root are rejected.
- Keep the wrapper outside `~/.claude/skills` and `.claude/skills`, or it
  loads as a plugin in every session.
- Suites live in `evals/` at the plugin root; override with `--eval-dir` or
  `"experimental": {"evals": "..."}` in `plugin.json`.
- A case is a directory with `prompt.md` and at least one `graders/<g>.md`.
  Optional `case.yaml` (`schema_version: "1.1"`, `name`, `context.*` such as
  `scaffold_script`, `history_file`, `add_dirs`).
- `prompt.md` frontmatter: `runs` (default 3), `max_turns` (10),
  `timeout_seconds` (300), `allowed_tools`, `model`, `tags`, `env` (`EVAL_*`
  keys only). Unknown keys error.
- Graders: free `regex`, `tool_used`, `tool_order`, `file_exists`; paid `llm`
  and `baseline` (judge, 2-of-3 vote). Targets: `last_message` (default),
  `trace`, `files`, `{source: file, path}`.
- Sandbox: each run is a fresh `claude -p` with isolated HOME and config. User
  skills, `CLAUDE.md`, and MCP servers are absent. Bash/Write/Edit/WebFetch
  need `--allow-tools`; scaffold scripts need `--scaffold`.
- Output: WITH / W/OUT / Δ table, then
  `evals/results/<ts>/aggregate-result.json` and `report.html`. Exit codes:
  0 pass, 1 below threshold (default 1.0), 2 partial, 130/143 interrupted.
- Unconfirmed: `plugins: ["../.."]` in a case pointing at a plain skill
  folder. Test before relying on it.

Minimal wrapper:

```
<wrapper>/
├── .claude-plugin/plugin.json
├── skills/<name>/                 # copy of ~/.agents/skills/<name>
└── evals/triggers-on-request/
    ├── prompt.md
    └── graders/
        ├── skill-fired.md
        └── answer.md
```

`prompt.md`:

```markdown
---
allowed_tools: [Read, Glob, Grep, Skill]
max_turns: 8
---
Address the open review comments on my current branch.
```

`graders/skill-fired.md`:

```markdown
---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?address-comments"'
---
```

`graders/answer.md`:

```markdown
---
type: llm
---
PASS if the reply works through review comments one at a time and asks for
approval before each change. FAIL otherwise.
```

First run: `claude plugin eval <wrapper> --ablation none --runs 1`.

## Alternatives

- **skill-creator plugin** (`/plugin install
  skill-creator@claude-plugins-official`): in-session with/without comparison
  and description tuning; stores `evals/evals.json` in the skill dir. Format
  is not interchangeable with plugin eval.
- **`/skill-doctor`**: usage and context-cost report, not a test harness.
- **Headless trigger sweep** against the real `~/.claude/skills` setup:
  `claude -p "<natural prompt>" --output-format stream-json --verbose
  --allowedTools "Read,Glob,Grep,Skill" --max-budget-usd 0.50`, then look for
  a `tool_use` block named `Skill` with the skill's name. Never use `--bare`
  (it skips skill discovery). Use natural phrasing, not `/name`, to test
  triggering.

Sources:

- <https://code.claude.com/docs/en/plugin-evals.md>
- <https://code.claude.com/docs/en/plugins/loading.md>
- <https://code.claude.com/docs/en/skills.md>
- <https://code.claude.com/docs/en/headless.md>
- <https://code.claude.com/docs/en/agent-sdk/overview.md>

## Options proposed but not decided

- **Home**: suites in `<skill>/evals/` (versioned with the skill) plus one
  shared runner `run-evals.sh <name>` that copies the skill into a temp
  wrapper and runs `claude plugin eval --eval-dir` (recommended), versus
  `~/.agents/skills/_refinement/evals/<name>/`.
- **Timing**: a `--runs 1` baseline during investigation plus a full run after
  implementation (recommended), versus after only, versus user-run.
- **Coverage**: at least trigger + behavior + should-not-trigger cases
  (explicit-invocation case for `disable-model-invocation` skills), optionally
  one regression case per High suggestion.

## Refinement program decisions (to resume from)

- Spec: [`spec.md`](spec.md). Skill name is a spawn parameter; the user
  hand-picks skills.
- `~/.agents/skills` is a git repo; baseline commit made before any agent ran.
  One `refactor: Refine <name> skill` commit per skill.
- Layout: lower-case kebab-case names; agent reports in `reports/`; shared
  cross-skill log in `cross-skill.md`; platform rules in
  [`platform-facts.md`](platform-facts.md).
- Evidence: static read of the skill, its linked skills, the `to-agents` style
  guide, and platform docs. Session transcripts not used.
- Process map: ASCII diagram plus per-step table in each report.
- Suggestions: implementation-ready, ranked High/Med/Low, no cap.
- Approval: one AskUserQuestion per suggestion; verdicts written to the report.
- Implementer: the same agent, resumed. Phases 1–2 in parallel across skills;
  phases 3–4 one skill at a time.
- Edits stay inside the skill; cross-skill problems are report-only.
- Scripts: `scripts/` (move existing ones); Bash first, Node `.mjs` modeled on
  `address-comments/scripts/remote-pr-comments.mjs` when complex.
- Upstream skills (in `~/.agents/.skill-lock.json`) tag suggestions
  `local-fork` or `upstream-candidate`.
