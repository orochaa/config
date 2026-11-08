# Refinement report: wait-what

- **Skill**: `wait-what`
- **Date**: 2026-11-07
- **Upstream status**: not upstream (absent from `~/.agents/.skill-lock.json`);
  no `Upstream` tags apply.
- **Files read**:
  - `wait-what/SKILL.md`
  - `wait-what/agents/openai.yaml`
  - `to-human/SKILL.md`, `to-human/agents/openai.yaml` (overlapping skill)
  - `domain-modeling/SKILL.md`, `domain-modeling/CONTEXT-FORMAT.md`
    (owner of the `CONTEXT.md` / `CONTEXT-MAP.md` convention)
  - `to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
  - `_refinement/spec.md`, `_refinement/platform-facts.md`
  - `~/.claude/CLAUDE.md`

The skill invokes and hands off to no other skill and receives from none. It
shares its style rules with `to-human` and its vocabulary source with
`domain-modeling`. It has no scripts and no reference files.

## Process map

```text
user types /wait-what (optionally with text)
  -> agent reads the injected prompt (written in the user's voice)
  -> [which message?] implied: the agent's last message
  -> [CONTEXT.md?] read it ----- not stated: absent? CONTEXT-MAP.md?
  -> write re-pitch: "a little bit of context" + ASD-STE100 + glossary terms
  -> [done?] no completion criterion
  -> [then what?] not stated: stop, or resume the task?
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1. Invoke | User types `/wait-what`, maybe with text | Body is injected as the user's words | Prompt in context | None | Text after the command is not handled (`SKILL.md:7-9`) |
| 2. Pick target | Conversation | Implied: last message ("where you've got to here", `SKILL.md:7`) | Message to re-pitch | None stated | A named part of the message is ignored |
| 3. Load glossary | `CONTEXT.md` | "use the ubiquitous language from `CONTEXT.md`" (`SKILL.md:9`) | Terms | None | No branch for a missing file or for `CONTEXT-MAP.md` |
| 4. Re-pitch | Steps 2-3 | Add "a little bit of context", use ASD-STE100 (`SKILL.md:8`) | New message | None | Vague context bound; no shape; may repeat the old message shorter; may open with an apology |
| 5. Exit | — | Not stated | — | None | Agent may resume tool calls before the user understands |

## Findings summary

| Severity | Count |
| --- | --- |
| High | 2 |
| Med | 3 |
| Low | 2 |

Lint checklist (`platform-facts.md`) results on the current skill:

- 1 pass. 2 pass. 3 **fail** — see wait-what-06 and the cross-skill note on
  user-invoked skills. 4 pass. 5 pass (9 lines). 6 pass. 7 pass (no reference
  files). 8 n/a. 9 pass. 10 n/a. 11 n/a. 12 n/a. 13 **fail** — the body is one
  paragraph with no steps or completion check (wait-what-03). 14 pass. 15 pass.
  16 pass (`interface`, `policy`; boolean). 17 n/a.
- Prose lines are at most 80 characters.
- No duplication with `~/.claude/CLAUDE.md`.
- Script opportunities: none. The work is pure prose generation.
- Embedded diagram: not warranted. The flow is linear with one optional branch.

## Suggestions

### wait-what-01

- **ID**: wait-what-01
- **Severity**: High
- **Category**: Failure points
- **Evidence**: `wait-what/SKILL.md:9` — "use the ubiquitous language from
  `CONTEXT.md`."
- **Problem**: The rule assumes a root `CONTEXT.md` exists. Many projects have
  none, and multi-context repos use `CONTEXT-MAP.md` plus per-context files
  (`domain-modeling/CONTEXT-FORMAT.md:34-60`). With no file, the agent may
  search the repo at length, invent "ubiquitous" terms, or offer to create a
  glossary — all off-task for a quick clarification. Outside a repo (plain
  chat) the instruction is meaningless.
- **Change**:
  Before (`SKILL.md:8-9`):
  ```text
  little bit of context, talk in ASD-STE100 Simplified Technical English, and use
  the ubiquitous language from `CONTEXT.md`.
  ```
  After (as a step; see wait-what-03 for the full body):
  ```text
  Read the project's `CONTEXT.md` if one exists. With a `CONTEXT-MAP.md`, read
  the context the topic belongs to. Use its terms for project concepts. With
  neither file, use plain words.
  ```
- **Risk**: Minimal. Adds one branch to the process map (glossary present /
  absent). If wait-what-04 is approved, this text moves into, or is covered by,
  `to-human`; see the cross-skill section.
- **Status**: implemented
- **Note**: Approved. Implemented via the to-human pointer (step 2): to-human owns the CONTEXT.md rules; its CONTEXT-MAP.md branch is a to-human cross-skill item.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### wait-what-02

- **ID**: wait-what-02
- **Severity**: High
- **Category**: Failure points
- **Evidence**: `wait-what/SKILL.md:7-9` — the body ends at "use the
  ubiquitous language from `CONTEXT.md`." with no exit instruction.
- **Problem**: The user types `/wait-what` because they lost track, often
  mid-task. Nothing tells the agent to stop after the re-pitch. It may
  re-pitch and then keep making tool calls or edits, which acts on a plan the
  user has just said they do not understand.
- **Change**: Add a final step:
  ```text
  End with the one decision or reply you need from the user, if any. Then stop
  and wait for their reply.
  ```
- **Risk**: The agent pauses even when the user only wanted a quick recap
  and would have let work continue. The user can say "continue", which is
  cheap. Adds an explicit exit to the process map.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### wait-what-03

- **ID**: wait-what-03
- **Severity**: Med
- **Category**: Clarity
- **Evidence**: `wait-what/SKILL.md:7-8` — "Wait — I don't understand where
  you've got to here. Re-pitch that: give me a little bit of context".
- **Problem**: One paragraph, no steps, no completion criterion (lint 13).
  "A little bit of context" has no bound: the agent cannot tell what context
  is missing (goal? current position? what just changed?) or when it has
  given enough. "Re-pitch" without an angle invites the old message, only
  shorter — the version that already failed.
- **Change**: Replace the body (`SKILL.md:7-9`) with numbered steps and a
  done-check. Full proposed body, folding in wait-what-01, -02, -05, -07:
  ```text
  Your last message did not land. Re-pitch it.

  1. Pick the target: the part the user names after the command, or else your
     last message.
  2. Read the project's `CONTEXT.md` if one exists. With a `CONTEXT-MAP.md`,
     read the context the topic belongs to. Use its terms for project
     concepts. With neither file, use plain words.
  3. Open with one or two sentences of context: the goal, where the work
     stands, and what just happened.
  4. Re-pitch the main point in ASD-STE100 Simplified Technical English. Take
     a new angle: lead with the point, leave out implementation detail, and
     give a concrete example when the idea is abstract.
  5. Explain each term the user may not know the first time it appears.
  6. End with the one decision or reply you need from the user, if any. Then
     stop and wait for their reply.

  Done when the user can tell, from this message alone, what happened, why it
  matters, and what comes next.
  ```
- **Risk**: The body grows from 3 to about 18 lines; still far under any
  budget. Each step now ends on a checkable criterion. If wait-what-04 is
  approved, steps 2, 4 (style half) and 5 collapse into one pointer to
  `to-human`.
- **Status**: implemented
- **Note**: Approved. Body applied with steps 2/4/5 collapsed per wait-what-04.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### wait-what-04

- **ID**: wait-what-04
- **Severity**: Med
- **Category**: Duplication
- **Evidence**: `wait-what/SKILL.md:8-9` — "talk in ASD-STE100 Simplified
  Technical English, and use the ubiquitous language from `CONTEXT.md`";
  `to-human/SKILL.md:7-10` — "Read `CONTEXT.md` ... Use ASD-STE100 Simplified
  Technical English".
- **Problem**: The plain-English style is defined twice. `to-human` is the
  fuller version (one term per idea, explain terms, lead with the point,
  done-check at `to-human/SKILL.md:36-37`). A change to the style must be made
  in both places, and they already drift (`to-human` handles a missing
  `CONTEXT.md`; `wait-what` does not). Both skills are user-invoked, so
  neither can invoke the other (`to-agents/SKILL-MECHANICS.md:32-34`); a
  file read is the only way to share.
- **Change**: In the wait-what-03 body, replace steps 2, 4 and 5 with one
  step that reads `to-human`:
  ```text
  2. Read [`to-human`](../to-human/SKILL.md) and write the re-pitch by its
     rules.
  3. Open with one or two sentences of context: the goal, where the work
     stands, and what just happened.
  4. Re-pitch the main point. Take a new angle: lead with the point, leave
     out implementation detail, and give a concrete example when the idea is
     abstract.
  ```
  (Renumber the remaining steps.) Keep the leading word "ASD-STE100" out of
  `wait-what` once it lives only in `to-human`.
- **Risk**: The link leaves the skill folder, against the spirit of lint 7
  (one level deep, inside the skill). It breaks if `to-human` is renamed,
  removed, or the skill is installed alone. Costs one extra Read per run.
  Alternative if rejected: keep the rules inline (wait-what-03 as written) and
  accept the duplication; the cross-skill section proposes a shared plain file
  as the long-term home.
- **Status**: implemented
- **Note**: Approved: point to ../to-human/SKILL.md for the style rules instead of copying them (whole-file link, no anchors).
 Auto-approved as safe and small, per user instruction 2026-11-07.
### wait-what-05

- **ID**: wait-what-05
- **Severity**: Med
- **Category**: Clarity
- **Evidence**: `wait-what/SKILL.md:1-5` — no `argument-hint`; body has no
  `$ARGUMENTS` and no mention of text after the command; `SKILL.md:7` —
  "where you've got to here".
- **Problem**: A user often knows which part lost them (`/wait-what the
  migration bit`). Claude Code appends such text to the prompt, but the skill
  never says to use it, so the agent may re-pitch the whole message and bury
  the confusing part again.
- **Change**:
  Frontmatter, add after `description`:
  ```yaml
  argument-hint: '[the part that lost you]'
  ```
  Body: step 1 of wait-what-03 ("the part the user names after the command,
  or else your last message").
- **Risk**: `argument-hint` is a Claude Code key; claude.ai rejects unknown
  keys (`platform-facts.md:59-60`), but the skill already carries
  `disable-model-invocation`, so its claude.ai compatibility is unchanged.
  Codex ignores the key. Adds one branch to step 2 of the map.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### wait-what-06

- **ID**: wait-what-06
- **Severity**: Low
- **Category**: Platform compliance
- **Evidence**: `wait-what/SKILL.md:3` — "description: Stop. That last message
  did not land — re-pitch it."
- **Problem**: The description is imperative, in the user's voice, and does
  not say what the skill does. Lint 3 asks for third person with the use case
  first. Lint 3's "Use when…" clause does not fit a user-invoked skill, whose
  description is a human-facing one-line summary
  (`to-agents/SKILL-MECHANICS.md:22-26`); keep it a summary, but name the
  action.
- **Change**:
  Before:
  ```yaml
  description: Stop. That last message did not land — re-pitch it.
  ```
  After (modified in phase 3: adds a "Use when…" clause):
  ```yaml
  description:
    Re-pitches the last message in plain English, with the context the reader is
    missing. Use when the user says the last message did not land.
  ```
  `agents/openai.yaml:3` already says this ("Re-pitch that — simpler, with the
  context I'm missing"); leave it.
- **Risk**: None to behaviour; the description is never shown to the model
  for triggering (`disable-model-invocation: true`).
- **Status**: implemented
- **Note**: Modified: description in third person with a "Use when…" clause (platform-facts.md item 3 now applies to every skill, user-invoked included).
 Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3: third-person description with a 'Use when…' clause.
### wait-what-07

- **ID**: wait-what-07
- **Severity**: Low
- **Category**: Clarity
- **Evidence**: `wait-what/SKILL.md:7` — "Wait — I don't understand where
  you've got to here."
- **Problem**: The body is written as the user's confused voice. That framing
  pulls the agent toward an apology and a preamble ("Sorry, let me
  clarify...") before the content, spending the reader's attention on the
  wrong thing. A direct instruction states the target behaviour (prompt the
  positive, `to-agents/SKILL.md:164-172`).
- **Change**:
  Before:
  ```text
  Wait — I don't understand where you've got to here. Re-pitch that: give me a
  ```
  After (first line of the wait-what-03 body):
  ```text
  Your last message did not land. Re-pitch it.
  ```
- **Risk**: Loses the casual tone the user may like when the command echoes
  in the transcript. Behavioural effect is small.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
## Cross-skill findings

- `to-human` and `wait-what` define the same plain-English style
  (ASD-STE100 + `CONTEXT.md` terms). Both are user-invoked, so a shared plain
  file outside the skill system (per `to-agents/SKILL-MECHANICS.md:32-34`),
  or `to-human/SKILL.md` as the single source, should own it. → affects
  `to-human`
- `to-human/SKILL.md:7-8` handles a missing `CONTEXT.md` but not a
  multi-context repo with `CONTEXT-MAP.md` (`domain-modeling/CONTEXT-FORMAT.md:34-60`).
  → affects `to-human`
- Lint item 3 (`platform-facts.md:13-14`) requires a "Use when…" trigger in
  every description, but `to-agents/SKILL-MECHANICS.md:22-26` says a
  user-invoked skill's description is a human-facing summary with triggers
  stripped. The checklist should exempt `disable-model-invocation: true`
  skills. → affects `_refinement/platform-facts.md` and `to-agents`
