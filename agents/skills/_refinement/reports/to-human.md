# Refinement Report: to-human

- **Skill**: `to-human`
- **Date**: 2026-11-07
- **Upstream status**: local (not listed in `~/.agents/.skill-lock.json`);
  no `Upstream` tags.
- **Invocation**: user-invoked (`disable-model-invocation: true`;
  `allow_implicit_invocation: false`).
- **Files read**:
  - `~/.agents/skills/to-human/SKILL.md` (37 lines)
  - `~/.agents/skills/to-human/agents/openai.yaml` (5 lines)
  - `~/.agents/skills/to-agents/SKILL.md`
  - `~/.agents/skills/to-agents/SKILL-MECHANICS.md`
  - `~/.agents/skills/_refinement/platform-facts.md`
  - `~/.agents/skills/_refinement/spec.md`
  - `~/.claude/CLAUDE.md`
  - `~/.agents/skills/domain-modeling/SKILL.md` (lines on `CONTEXT.md` /
    `CONTEXT-MAP.md`, the convention `to-human` consumes)
- **Hand-offs**: none. No skill invokes `to-human` and it invokes none
  (repo-wide grep for `to-human` hits only its own `name`). It consumes
  `CONTEXT.md`, whose layout `domain-modeling` defines.
- **CLAUDE.md overlap**: none. `~/.claude/CLAUDE.md` holds only git commit
  rules.

## Process map

```text
[User types $to-human / /to-human]
        |
        v
(1) Identify input ......... UNDEFINED: which text? own last reply? a topic?
        |
        v
<Project has CONTEXT.md?> --no--> (skip)
        | yes                        |
        v                            |
(2) Read CONTEXT.md, adopt terms     |
        |<---------------------------+
        v
(3) Draft text under style rules (STE100, lead with point, one term per
    idea, define terms, reason/effect, next action)
        |
        v
<Task summary that changes a process?> --no--+
        | yes                                |
        v                                    |
(4) Short paragraph + `text` flow diagram    |
    (+ schema changes "when they help")      |
        |<-----------------------------------+
        v
<(5) Final check: "reader can tell what and why"> -- fail --> back to (3)
        | pass (unverifiable)
        v
[Output: explanation to the user] ...... UNDEFINED: replace? append?
                                          one reply or rest of session?
```

| # | Inputs | Action | Outputs | Gate / exit | Failure points |
|---|--------|--------|---------|-------------|----------------|
| 1 | Invocation, conversation | Decide what to write or rewrite | Target text/topic | None stated | No input contract; agent guesses target and scope (SKILL.md has no input line) |
| 2 | Repo | Read `CONTEXT.md` | Glossary terms | "concerns a project that has one" (L7–8) | No location rule; ignores `CONTEXT-MAP.md`; glossary terms conflict with "everyday word" (L11) and "explain term" (L16) |
| 3 | Terms, source facts | Apply style rules (L9–18, L35) | Draft | None | Rules scattered; audience rule (L35) sits last; L11 restates L10 |
| 4 | Draft | Add paragraph + flow diagram | Paragraph, `text` block | "task summaries that change a process" (L19) | Template puts the paragraph inside the code fence (L22–23); "schema changes" rule vague (L32–33) |
| 5 | Draft | Self-check | Final text | "reader can tell what… and why" (L36–37) | Not checkable; no concrete criteria |

## Findings summary

| Severity | Count |
|----------|-------|
| High | 2 |
| Med | 4 |
| Low | 3 |
| **Total** | **9** |

## Suggestions

### to-human-01

- **ID**: to-human-01
- **Severity**: High
- **Category**: Clarity (input/output)
- **Evidence**: `to-human/SKILL.md:1-7` — the body starts directly with
  rules ("- Read `CONTEXT.md` before writing…"); no line says what text
  the rules apply to or what the output replaces.
- **Problem**: The skill is user-invoked, often bare (`$to-human`). With no
  input contract the agent must guess: rewrite its previous reply, explain
  the current task, or adopt the style for the rest of the session. Runs
  diverge on the first and most visible decision.
- **Change**: Insert, directly after the frontmatter, before line 7:

  ```markdown
  Rewrite for a human reader. The input is the text or topic the user names
  with the invocation. When they name none, the input is your most recent
  reply. Output the rewritten explanation only, in place of the original.
  ```

  (If the user prefers session-wide style, replace the last sentence with:
  "Apply these rules to every reply for the rest of the session.")
- **Risk**: Picks one default; the user may want the other mode. Adds step
  (1) to the process map with a clear exit (input identified). Three lines.
- **Status**: implemented
- **Note**: Approved. User chose rewrite in place: the named text, else the latest reply; output only the rewritten version.
 Approved by user: rewrite in place (named text, else the latest reply).
### to-human-02

- **ID**: to-human-02
- **Severity**: High
- **Category**: Failure points (prompt format steers output)
- **Evidence**: `to-human/SKILL.md:19-30` — "explain the main path and its
  result in a short paragraph. Follow it with a small `text` flow diagram."
  The template then opens ```` ```text ```` and puts
  "[Short paragraph: what starts the process…]" inside the same fence.
- **Problem**: The instruction says paragraph, then diagram. The template
  shows the paragraph inside the code block. Format in a prompt steers
  output format, so the agent can emit the prose paragraph as monospace
  code, or treat the paragraph as part of the diagram.
- **Change**: Replace lines 19–33 with:

  ````markdown
  - When the work changed a process (a workflow, pipeline, or request path),
    write a short paragraph: what starts it, what it does, and the result.
    Follow the paragraph with a small `text` flow diagram:

    ```text
    [Starting condition]
      -> [First action]
      -> [Decision or next step]
      -> [Result]
    ```

    Replace each placeholder with the real system and action. When a data
    schema changed, name the changed fields after the diagram.
  ````
- **Risk**: The paragraph is no longer shown as a template, only described.
  The "schema" rule becomes concrete (see to-human-05 for the trigger
  wording). No effect on map shape; step (4) output is now unambiguous.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### to-human-03

- **ID**: to-human-03
- **Severity**: Med
- **Category**: Clarity (conflicting rules)
- **Evidence**: `to-human/SKILL.md:7-8` "Use its terms for project
  concepts."; `:11` "Prefer the everyday word when it says the same
  thing."; `:16` "When a technical term is needed, explain it the first
  time you use it."
- **Problem**: A `CONTEXT.md` term is often a non-everyday word. The rules
  give no priority: the agent may swap a glossary term for a plain synonym
  (breaking "one term for one idea", L14), or use the glossary term without
  a definition. Output varies run to run.
- **Change**: Replace lines 7–8 with:

  ```markdown
  - When the topic is a project with a `CONTEXT.md` (or a `CONTEXT-MAP.md`
    that points to several), read the one that covers the topic. Use its
    terms for project concepts, even when an everyday word exists. Define
    each glossary term in plain words the first time you use it.
  ```

  and replace line 11 with:

  ```markdown
  - For everything else, prefer the everyday word when it says the same
    thing.
  ```
- **Risk**: Slightly longer. Also fixes the missing `CONTEXT-MAP.md` path
  (domain-modeling convention, `domain-modeling/SKILL.md:24`). Step (2)
  gets a clear branch and location rule.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### to-human-04

- **ID**: to-human-04
- **Severity**: Med
- **Category**: Clarity (unverifiable completion criterion)
- **Evidence**: `to-human/SKILL.md:36-37` "Before finishing, check that a
  reader can tell what you are saying and why it matters, without losing
  needed information."
- **Problem**: The only gate is a judgment the agent always passes. It
  invites premature completion (to-agents: "sharpen the bound first"). The
  STE100 rules (L9–10) are never checked.
- **Change**: Replace lines 36–37 with:

  ```markdown
  - Before finishing, re-read the draft and fix it until all hold:
    1. The first sentence states the main point.
    2. Each sentence carries one idea and stays under about 25 words.
    3. Each technical or glossary term is defined at first use.
    4. Each idea has one term throughout.
    5. Every fact the reader needs from the source is still present.
    6. A next action is stated when the reader must act.
  ```
- **Risk**: Adds ~7 lines. The 25-word bound comes from STE100's limit for
  descriptive sentences (20 for procedural); stating "about" keeps it a
  guide, not a hard count. Step (5) becomes a real validation loop.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### to-human-05

- **ID**: to-human-05
- **Severity**: Med
- **Category**: Duplication / co-location
- **Evidence**: `to-human/SKILL.md:12-13` "Add only the context a reader
  needs to understand it."; `:17-18` "Include the reason or effect when
  needed to understand the point."; `:35` "Write for a person who does not
  already know the implementation."; `:10` "common words" vs `:11` "Prefer
  the everyday word".
- **Problem**: The audience rule (L35) is the premise of every other rule
  but sits last, split from the "what context to add" rules (L12–13,
  L17–18), which say the same thing twice. L11 restates L10's "common
  words" (to-human-03 rescopes L11 so it is no longer a pure duplicate).
- **Change**: Replace lines 9–18 and 35 with this ordered block (keep the
  `CONTEXT.md` bullet from to-human-03 first and the process bullet from
  to-human-02 after it):

  ```markdown
  - Write for a reader who does not know the implementation.
  - Use ASD-STE100 Simplified Technical English: short, direct sentences,
    common words, and active voice.
  - Lead with the main point. Then add only what the reader needs: the
    reason or effect, and a next action when they must act.
  - Use one term for one idea, consistently.
  - Define a technical term the first time you use it.
  ```
- **Risk**: Pure reorder and merge; no rule dropped. If to-human-03 is
  rejected, keep "Prefer the everyday word…" out (covered by "common
  words"). Step (3) gets one co-located rule block.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### to-human-06

- **ID**: to-human-06
- **Severity**: Med
- **Category**: Failure points (vague trigger in a branch)
- **Evidence**: `to-human/SKILL.md:19` "For task summaries that change a
  process"; `:32-33` "Highlight core schema changes when they help explain
  the result."
- **Problem**: "Task summaries that change a process" reads as if the
  summary changes the process. "Process" can mean an OS process. "When they
  help" leaves the schema rule to chance. The diagram branch fires
  inconsistently.
- **Change**: Covered by the replacement text in to-human-02 ("When the
  work changed a process (a workflow, pipeline, or request path)" and "When
  a data schema changed, name the changed fields after the diagram"). If
  to-human-02 is rejected, apply only these two wording changes to lines 19
  and 32–33.
- **Risk**: Narrows the branch to named kinds of process; edge cases (e.g.
  a UI flow) may need the list extended.
- **Status**: implemented
- **Note**: Approved.
 Auto-approved as safe and small, per user instruction 2026-11-07.
### to-human-07

- **ID**: to-human-07
- **Severity**: Low
- **Category**: Platform compliance (lint 3)
- **Evidence**: `to-human/SKILL.md:3` "description: Write clear, simplified
  English for people."; `agents/openai.yaml:3` same text.
- **Problem**: Lint 3 asks for third person. The "Use when…" part of lint 3
  does not apply: `SKILL-MECHANICS.md:22-26` says a user-invoked skill's
  description is a human-facing one-liner with triggers stripped.
- **Change**: `SKILL.md:3` →
  `description: Rewrites text in clear, simplified English for a human
  reader. Use when an explanation, summary, or reply must be plain enough for
  someone who does not know the implementation.` and `agents/openai.yaml:3` →
  `short_description: 'Rewrite text in clear, simplified English'`.
- **Risk**: None functional; description is not in model context.
- **Status**: implemented
- **Note**: Modified. Description in third person with a "Use when…" clause; platform-facts lint 3 now applies to every skill, user-invoked included.
 Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3: third person and a 'Use when…' clause.
### to-human-08

- **ID**: to-human-08
- **Severity**: Low
- **Category**: Script opportunities
- **Evidence**: `to-human/SKILL.md:9-10` (STE100 short sentences, active
  voice) with no measurement; to-human-04 adds a sentence-length check.
- **Problem**: Counting words per sentence is deterministic work the model
  does poorly by eye.
- **Change**: Optional. Add `to-human/scripts/check-text.mjs`
  (dependency-free Node), modeled on
  `address-comments/assets/remote-pr-comments.mjs`:
  - Usage: `node scripts/check-text.mjs check [--max-words N] <file|->`
    (default N=25, the STE100 descriptive-sentence limit).
  - Subcommand `switch` with one subcommand `check`; unknown subcommand or
    missing path → `fail()` to stderr, exit 2.
  - Strips fenced code blocks and inline code, splits sentences on
    `[.!?]` followed by whitespace or end of line, and list items as
    sentences.
  - Prints one line per offending sentence: `L<line>: <n> words: <first 60
    chars>`; then `ok: <k> sentences, <m> over limit`. Exit 0 when none
    over, 1 otherwise. Read-only, so idempotent; no JSON writes.
  - Companion `to-human/scripts/check-text.md` describing usage; `SKILL.md`
    check item 2 says "Run `scripts/check-text.mjs check <draft>` when the
    draft is over ~150 words."
- **Risk**: Adds a tool call and a temp file per use for a 37-line style
  skill; most replies are short. Recommend rejecting unless long rewrites
  are common. No map change beyond an optional tool call in step (5).
- **Status**: rejected
- **Note**: Rejected. No script.
 Rejected per the report's own recommendation (too costly for a 37-line skill); auto-decided under the user's safe/small instruction.
### to-human-09

- **ID**: to-human-09
- **Severity**: Low
- **Category**: Embedded diagram
- **Evidence**: `to-human/SKILL.md` — two optional branches, one check, no
  loops beyond the final fix pass.
- **Problem**: None; recorded so the lens is closed.
- **Change**: No process diagram in the skill. The `text` template in
  lines 22–30 is an output format, not a process map; keep it.
- **Risk**: None.
- **Status**: implemented
- **Note**: Approved (no change to make).
 Auto-approved as safe and small, per user instruction 2026-11-07.
## Cross-skill findings

- Lint item 3 in `_refinement/platform-facts.md:13-14` requires a "Use
  when…" clause, which contradicts `to-agents/SKILL-MECHANICS.md:22-26`
  (user-invoked skills carry a human-facing description with triggers
  stripped). Scope lint 3's trigger clause to model-invoked skills. Affects
  `_refinement` and every user-invoked skill's review.
