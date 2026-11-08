# Skill mechanics

What changes when the document is a skill. The universal reference is
[`SKILL.md`](SKILL.md).

## Invocation

Two choices, trading the two loads:

- A **model-invoked** skill keeps a `description`, so the agent can fire it
  autonomously — and other skills can reach it. You can still type its name:
  model-invocation always _includes_ user reach; a description only ever adds
  agent discovery, never removes the human's. The description is the skill's
  top-level context pointer, forced to stay loaded at all times — permanent
  context load in exchange for discoverability. A model-invoked skill whose
  content is all reference is also one home for shared reference: another skill
  can invoke it, so reference needed by several skills lives in one place.
  Mechanics: omit `disable-model-invocation`, and write a model-facing
  description carrying the trigger branches (the pointer-writing rules in
  `SKILL.md` apply in full).
- A **user-invoked** skill strips the description from the agent's reach: only
  the human typing its name can invoke it, and no other skill can. Zero context
  load, but it spends cognitive load — you are the index that must remember it
  exists. Mechanics: set `disable-model-invocation: true` for Claude Code
  and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`
  for Codex. The `description` stays third person, key use case first, with
  a "Use when…" clause.

Pick model-invocation only when the agent must reach the skill on its own, or
another skill must. If it only ever fires by hand, make it user-invoked and pay
no context load.

Shared reference that two user-invoked skills both need can live in neither —
their descriptions sit outside the agent's reach, so neither can fire the
other. Push it to a plain file
outside the skill system: external reference any skill can point at.

## Frontmatter and layout

Skills here load in Claude Code and OpenAI Codex.

- `name`: 1–64 characters matching `^[a-z0-9]+(-[a-z0-9]+)*$`, equal to
  the folder name, free of `anthropic` and `claude`.
- `description`: 1–1024 characters, no XML tags, third person, key use
  case first. Every skill ends with a "Use when…" clause. `description`
  plus `when_to_use` stays within 1536 characters, the listing cutoff.
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

After creating or editing a skill, run
`node ~/.agents/skills/to-agents/scripts/lint-skill.mjs check <skill-dir>`.
Fix every error and rerun until it exits 0; judge each warning.

## Splitting by invocation

Split off a model-invoked skill when you have a distinct leading word that
should trigger it on its own — a trigger word you actually use in your
prompts — or another skill must reach it. You pay context load for the new
always-loaded description, so that independent reach has to be worth it.

## Router skills

When user-invoked skills multiply past what you can remember, that piled-up
cognitive load is cured by a **router skill**: one user-invoked skill that names
the others and when to reach for each, so the human has one skill to remember
instead of many. It can only hint, never fire them: a user-invoked skill's
description sits outside the agent's reach, so only the human can invoke it.
