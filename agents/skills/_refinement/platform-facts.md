# Platform Facts

Researched 2026-11-07 from official sources. Skills here serve Claude Code and
OpenAI Codex (via `agents/openai.yaml`).

## Lint checklist

Apply every item. Diagram items warn only.

1. `name` is 1–64 chars, matches `^[a-z0-9]+(-[a-z0-9]+)*$`, equals the folder
   name, and contains neither `anthropic` nor `claude`.
2. `description` is 1–1024 chars with no XML tags.
3. `description` is third person, puts the key use case first, and carries a
   "Use when…" trigger clause. This holds for every skill, user-invoked ones
   included (user decision, 2026-11-07).
3a. Invocation settings agree across platforms: `disable-model-invocation:
    true` in `SKILL.md` if and only if `policy.allow_implicit_invocation:
    false` in `agents/openai.yaml`.
4. `description` plus `when_to_use` is at most 1536 chars (listing cutoff).
5. `SKILL.md` body is under 500 lines and roughly under 5k tokens.
6. Critical rules sit early: after compaction only the first 5k tokens of an
   invoked skill are kept.
7. Every reference file is linked directly from `SKILL.md` (one level deep).
8. Reference files over 100 lines open with a table of contents.
9. Paths use forward slashes.
10. MCP tools are written as `Server:tool_name`.
11. Each script mention says whether to run it or read it.
12. Scripts handle their errors; every constant has a stated reason.
13. Multi-step workflows use numbered steps or a checklist, with a validation
    loop for critical operations.
14. No time-sensitive conditions ("before August 2025").
15. `CRITICAL` / `MUST` are rare: they make recent models over-apply rules.
16. `agents/openai.yaml` uses only `interface`, `policy`, `dependencies`;
    `brand_color` is hex; `allow_implicit_invocation` is a boolean.
17. (Warn) A diagram, if present, supplements numbered steps that stay
    complete without it.

## Anthropic — skill authoring best practices

<https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices>

- Description: third person, what it does and when to use it, key terms.
  Claude picks from 100+ skills by description alone.
- Degrees of freedom: high (text), medium (pseudocode, parameterised scripts),
  low (exact scripts) — match to how fragile the task is.
- Workflows: numbered steps, a checklist the agent copies and ticks, feedback
  loops (validate → fix → repeat), decision points as text.
- Scripts: "solve, don't punt" — handle errors in the script. Prefer scripts
  for deterministic work; prefer execution over reading.
- Plan-validate-execute for high-stakes or batch work, with verbose validator
  errors.
- One default plus an escape hatch, not a menu of options. Consistent
  terminology. No assumed installed packages.

## Claude Code — skills

<https://code.claude.com/docs/en/skills>

- Frontmatter: `name`, `description`, `when_to_use`, `argument-hint`,
  `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`,
  `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`,
  `background`, `hooks`, `paths`, `shell`. Unknown keys are ignored.
- claude.ai/API accept only `name`, `description`, `license`, `compatibility`,
  `metadata`, `allowed-tools`; other keys error there.
- The skill listing gets ~1% of the context window.
- Rules that must hold every time belong in a hook, not prose.

## Agent Skills spec

<https://agentskills.io/specification>

- Layout: `scripts/`, `references/`, `assets/`.
- `compatibility` at most 500 chars; `allowed-tools` is experimental.
- Metadata ~100 tokens; body under 5k tokens and 500 lines.

## OpenAI Codex

<https://learn.chatgpt.com/docs/build-skills>

- Required: `name`, `description`. Front-load the use case and trigger words;
  say when to trigger and when not to.
- `agents/openai.yaml`: `interface` (`display_name`, `short_description`,
  `icon_small`, `icon_large`, `brand_color`, `default_prompt`),
  `policy.allow_implicit_invocation` (default true; false = `$skill` only),
  `dependencies.tools`.
- Discovery: `.agents/skills` up to repo root, `$HOME/.agents/skills`,
  `/etc/codex/skills`; symlinks followed.
- Skill listing budget: 2% of context, or 8000 chars when unknown.
- "Prefer instructions over scripts unless you need deterministic behavior or
  external tooling." One job per skill; imperative steps with explicit inputs
  and outputs.

## Claude prompting best practices

<https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices>

- Use numbered or bulleted steps when order or completeness matters.
- Explain why an instruction matters.
- Prompt format steers output format.
- Soften "CRITICAL: You MUST" wording; recent models over-apply it.

## Diagrams in skills

No source says anything for or against diagrams in skill content. All endorse
numbered steps and checklists. Rule: embed an ASCII flow only for skills with
real branches, loops, or gates that steps express poorly; keep it a supplement,
small, or in a reference file.
