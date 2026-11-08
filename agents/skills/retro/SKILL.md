---
name: retro
description:
  Runs a retrospective on one or more coding sessions and records the
  decisions. Use when the user wants to review past agent sessions and
  improve the agent's environment.
disable-model-invocation: true
---

The user has asked for a **retrospective**. You suggest improvements to the
coding agent's **environment** to improve future runs. Each retro keeps a
**record**: the plan, the implementation tracker, and the history later
retros read. See [`references/records.md`](references/records.md).

Run both scripts; never read them:

- `R` = `node ~/.agents/skills/retro/scripts/retro-record.mjs`
- `D` = `node ~/.agents/skills/retro/scripts/session-digest.mjs`

## Steps

1. Load the `to-agents` writing guide. In Claude Code, use the Skill tool.
   Elsewhere, read `~/.agents/skills/to-agents/SKILL.md`.

2. Read the retro history: run `R history`. Note the recurring targets and
   tags, the rejected items, and the open items. Done when you have its
   output; an empty history is fine.

3. Pick the sessions. Use the ones the user names. With none named, use the
   current session when it holds work before `/retro`; otherwise ask which
   sessions to review. Logs live here:
   - Claude Code: `~/.claude/projects/<cwd with / and . as ->/<id>.jsonl`,
     with subagents in `<id>/subagents/`.
   - Codex: `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`.

   Find them with `D list <project-dir> [<since YYYY-MM-DD>]`. Create the
   record with `R new`, and add each session with `R add-session`. Record
   the user's constraints with `R set-notes`. Done when every chosen session
   is in the record.

4. Read each session with `D digest <log>`. Open the raw log only for a
   passage the digest truncates. For more than two sessions, give each group
   of related sessions to one subagent. It returns candidates with session
   ids and verbatim user quotes. Done when every recorded session has been
   read.

5. Find candidates in every category below, checking each category against
   every session. Give each candidate a severity:
   - **High**: the agent failed, or the user had to correct it.
   - **Med**: it cost tool calls, tokens, or rework.
   - **Low**: wording or style.

   Capture the evidence now: a session id plus the user's verbatim words or
   the error text. Then compare each candidate with history:
   - Search for its targets and tags with `R search <regex>`. Put each match
     in `relatedTo`.
   - A recurring match raises severity one level.
   - A match on a rejected item needs new evidence. Quote the earlier user
     note when you ask.
   - An open history item whose problem reappears becomes a candidate again,
     citing both records.

   Record each candidate with `R add-candidate`. Done when every category has
   been checked against every session.

   - **Navigation**: how easy was it for the agent to find the right files?
     Are there hidden dependencies between files? Would a **navigation
     pointer** make it easier? _Use when_ the session took a long time to
     find a piece of information.
   - **Automated checks**: could an automated check catch the agent's
     errors? Consider linting, typing, tests, and filesystem linters.
     - Read the repo's own check command first: its `package.json` or
       build-tool `lint`/`check` scripts, and its CI workflow. A check that
       exists but sits unwired or silently broken is the finding; do not
       reinvent it.
     - A repo with no **guardrail** is itself a finding. That means no
       pre-commit hook and no CI job running its lint, typecheck, or test
       command. An un-linted repo is a standing missed opportunity, not a
       neutral default.
     - _Use when_ the agent made a mistake an automated check could have
       caught, or the repo has no guardrail at all.
   - **Coding standards**: should the **reviewer agent** enforce a new rule?
     Should an existing rule be removed or clarified?
     - Classify the violation first. A **mechanical** one gets a
       deterministic check, full stop. Mechanical means a fixed syntactic
       pattern, a banned API, an import shape, or a file-location rule.
     - The check is a custom rule in the repo's own linter, a new pre-commit
       hook, or a new CI job. Pick whichever the repo's language and existing
       guardrail make cheapest.
     - Default to building the check over writing the rule.
     - Reserve standards files for genuine **judgement calls**: cross-file
       consistency, "matches the surrounding style", anything no guardrail
       could substitute for.
     - _Use when_ the reviewer agent failed to catch a mistake.
   - **Global AGENTS.md**: should any steering instructions move to coding
     standards or automated checks? _Use when_ the AGENTS.md file is large,
     in the repo or the user's global scope.
   - **Tool economy**: did the agent make expensive tool calls that could be
     streamlined? Is any custom tooling (CLIs, MCPs) token-inefficient? _Use
     when_ the agent made an expensive tool call.
   - **No-ops**: look for instructions in steering files that don't modify
     the agent's behavior. _Use when_ the steering files are large and
     unwieldy.
   - **Information access**: look for ways to increase the agent's access to
     information, such as teeing dev server logs or readonly access to
     third-party services. _Use when_ a crucial piece of information was not
     available to the agent.

6. Iterate the candidates with the user, one at a time, in order of
   severity:
   - Split them by audience. **Local-only** files reach only this machine:
     - files outside any repo (`~/.claude`);
     - repos with no shared remote (`~/.agents/skills`);
     - git-ignored or excluded files;
     - `.git/hooks`.

     **Remote** files are tracked in a repo the team pulls. Check with
     `git -C <dir> remote -v` and `git check-ignore -v <file>`. Start with
     local-only.
   - Put each candidate to the user with the question tool, one candidate
     per call. In Claude Code that is AskUserQuestion; in Codex,
     `request_user_input`. Without a question tool, send one candidate per
     message and wait for the answer.
   - State the problem and the evidence from the session, quoting the user's
     words and the errors. Then give the recommended solutions, recommended
     option first.
   - After each answer, run `R decide` with the user's words. Every approved
     candidate names its file and exact change, so another agent can
     implement it without this session's context.

   Done when `R show <record>` lists no pending candidate.

7. Hand off. Give the user the record id and `R show <record> --open`, the
   list of approved changes. Implement only when the user asks. Whoever
   implements runs `R implement` after each item. Done when the user has the
   record id.

## Reference

### Implementation vs Review

All work goes through two stages: implementation and review. The
implementation agent has the most **context pressure**. It explores, writes
code, and debugs failures.

The review agent has the least context pressure. It receives a diff, so it
needs no exploration, and it often does not write code or debug.

So the review agent imposes coding standards, not the implementation agent.

### Files

These are the files in the repo that steer agents:

- `CLAUDE.md`/`AGENTS.md` load into the context of every agent working in
  this repo. Use them sparingly, usually only for **navigation pointers** to
  other files.
- Standards files (e.g. `CODING_STANDARDS.md`) are read during review, not
  implementation.
  - Here the reviewer is the `review-and-refine` skill. Put judgement-call
    standards where its guidance set reads them, and check that before
    creating a new file.
  - Add **navigation pointers** to docs folders if a standards file grows
    past 1,000 lines.
- Docs serve as reference files that other files point to. Look for existing
  docs before writing new ones.
- Skills hold docs (since their description goes into the agent's context
  window) or user-invoked commands.
