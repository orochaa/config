# Refinement report: grill-with-docs

## Header

- Skill: `grill-with-docs`
- Date: 2026-11-07
- Upstream: no (`grill-with-docs` is not listed in `~/.agents/.skill-lock.json`),
  so suggestions carry no `Upstream` tag.
- Files read:
  - `grill-with-docs/SKILL.md`
  - `grill-with-docs/agents/openai.yaml`
  - `grilling/SKILL.md`, `grilling/agents/openai.yaml` (invoked)
  - `domain-modeling/SKILL.md`, `domain-modeling/CONTEXT-FORMAT.md`,
    `domain-modeling/ADR-FORMAT.md`, `domain-modeling/agents/openai.yaml`
    (invoked)
  - `grill-me/SKILL.md` (sibling wrapper, for comparison)
  - `to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
  - `_refinement/platform-facts.md`, `_refinement/spec.md`
  - `~/.claude/CLAUDE.md`
- No other skill invokes or hands off to `grill-with-docs` (grep over
  `~/.agents/skills` and `~/.claude` finds only its own `SKILL.md`).

## Process map

The skill is a two-line wrapper. Its own logic is lines 9–15 of `SKILL.md`; the
loop and gates come from `grilling`, the doc writes from `domain-modeling`.

```
user types /grill-with-docs <plan>
        |
        v
[1] load grilling + domain-modeling   (SKILL.md:9; "how" unstated)
        |
        v
[2] build design tree, compute frontier        (grilling)
        |
        v
[3] ask round ----> question tool available? --yes--> AskUserQuestion,
        |                                             <=4 per call
        |                  \--no--> numbered "Q1" fallback
        |               (SKILL.md:11-15 restates grilling:12-27)
        v
[4] need a fact? --yes--> dispatch sub-agent (non-blocking)  (grilling)
        |
        v
[5] answers arrive
        |-- term resolved?        --> write CONTEXT.md now (domain-modeling)
        |-- term conflicts?       --> challenge in next round
        |-- decision hard to reverse + surprising + real trade-off?
        |                         --> offer ADR (how/when unstated)
        v
[6] frontier empty? --no--> back to [2]
        |yes
        v
[7] user confirms shared understanding?  (grilling: "Do not act on it until")
        |yes                          <-- conflicts with [5] inline writes
        v
output: settled design (in chat), CONTEXT.md terms, docs/adr/NNNN-*.md
        (no closing check that docs exist)
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 Load | User's plan; `/grill-with-docs` | Load `grilling` and `domain-modeling` | Both skills in context | None stated | "using the `/domain-modeling` skill" does not say to invoke it; `/name` syntax means nothing in Codex (`$name`) |
| 2 Tree | Plan, codebase | Build design tree, compute frontier | Frontier | Frontier non-empty | Owned by `grilling` |
| 3 Ask | Frontier | Ask round via question tool or fallback | Questions | Wait for answers | Wrapper restates `grilling` rule with different wording |
| 4 Facts | Fact-dependent questions | Sub-agent lookup | Facts | Downstream questions wait | Owned by `grilling` |
| 5 Record | Answers | Write terms to `CONTEXT.md`; offer ADRs | `CONTEXT.md`, `docs/adr/` | Term resolved; ADR three-part test | ADR offer channel unstated; writes may be deferred because of step 7's "do not act" |
| 6 Loop | Updated tree | Recompute frontier | Next round or exit | Frontier empty | Owned by `grilling` |
| 7 Close | Settled tree | Ask user to confirm | Confirmed design | User confirms | No check that every resolved term and qualifying decision was written |

## Findings summary

| Severity | Count |
| --- | --- |
| High | 2 |
| Med | 2 |
| Low | 1 |
| Total | 5 |

Lenses with no suggestion:

- Bottlenecks: none; the wrapper adds no tool calls.
- Script opportunities: none; the work is interactive judgement. ADR numbering
  is a one-command lookup owned by `domain-modeling`.
- Embedded diagram: not proposed. The loop and gates live in `grilling`; the
  wrapper's own steps are linear and need no diagram.
- Duplication with `~/.claude/CLAUDE.md`: none.
- Platform lint: items 1, 2, 4–17 pass (name matches folder; no scripts, no
  reference files, no MCP tools, no `MUST`; `openai.yaml` uses only
  `interface` and `policy`, boolean `allow_implicit_invocation`). Item 3 is
  covered by grill-with-docs-05.

## Suggestions

### grill-with-docs-01

- `ID`: grill-with-docs-01
- `Severity`: High
- `Category`: Failure points
- `Evidence`: `grilling/SKILL.md:42-43` "Do not act on it until the user
  confirms you have reached a shared understanding." versus
  `domain-modeling/SKILL.md:62` "When a term is resolved, update
  `CONTEXT.md` right there. Don't batch these up". `grill-with-docs/SKILL.md:9`
  "Run a `/grilling` session, using the `/domain-modeling` skill." does not
  reconcile them.
- `Problem`: The two loaded skills give conflicting orders. An agent can read
  writing `CONTEXT.md` or an ADR as "acting on" the session and defer every
  write to the end, or skip it, which defeats the skill's one promise ("creates
  docs as we go"). The wrapper also never says how an ADR offer reaches the
  user during a round-based session, so offers get dropped or interrupt a
  round as free text.
- `Change`: Replace `SKILL.md:9` with:

  ```
  Run a `grilling` session with the `domain-modeling` skill: invoke both
  before the first round.

  Writing glossary terms and ADRs is part of the session, not acting on its
  outcome. Write each term to `CONTEXT.md` the moment it resolves. Put each
  ADR offer to the user as a question in the next round, and write the ADR
  when they accept.
  ```

- `Risk`: Slightly longer wrapper (about 60 words). Process map: step 1 gains
  an explicit invoke; step 5 gains "ADR offer = next-round question"; the
  step 5/step 7 conflict disappears.
- `Status: implemented`
- `Note:` Approved in phase 3.

### grill-with-docs-02

- `ID`: grill-with-docs-02
- `Severity`: High
- `Category`: Clarity (completion criterion)
- `Evidence`: `grill-with-docs/SKILL.md:9-15` has no completion criterion;
  the only exit is `grilling/SKILL.md:41` "The session is done when the
  frontier is empty".
- `Problem`: The exit gate checks only the design tree, so the session can end
  with resolved terms never written and qualifying decisions never offered as
  ADRs. Nothing makes the doc side checkable, and the visible "user confirms"
  step pulls the agent toward premature completion.
- `Change`: Append to `SKILL.md` after the text from grill-with-docs-01:

  ```
  The session is done when grilling's frontier is empty, every term resolved
  in the session is in `CONTEXT.md`, and every decision passing the ADR test
  was offered. Before asking the user to confirm shared understanding, list
  the terms written and the ADRs created or declined.
  ```

- `Risk`: Adds one closing list per session (a few lines of output). Process
  map: step 7 gains a docs-complete gate before the user confirmation.
- `Status: implemented`
- `Note:` Approved in phase 3.

### grill-with-docs-03

- `ID`: grill-with-docs-03
- `Severity`: Med
- `Category`: Duplication
- `Evidence`: `grill-with-docs/SKILL.md:11-15` "use the structured question
  tool (or the closest available question/elicitation tool) ... fall back to
  the numbered question format required by `/grilling` and wait for the
  user's answers" restates `grilling/SKILL.md:14-27` ("Ask each round with the
  AskUserQuestion tool ... When no question tool is available, format each
  question like so ... Then wait for the user's answers").
- `Problem`: One meaning lives in two places with different wording
  ("structured question tool or closest available" vs "AskUserQuestion, at
  most 4 per call"). A change to `grilling`'s asking rules will drift from
  this copy, and the copy inflates the rule's prominence. `grill-me`, the
  sibling wrapper, carries no such copy, so the two wrappers already behave
  differently. The one real addition (the cross-platform "closest available"
  tool) belongs in `grilling`.
- `Change`: Delete `SKILL.md:11-15` in full. Record the "closest available
  question tool" wording as a cross-skill fix for `grilling` (see
  Cross-skill findings).
- `Risk`: Until `grilling` adopts the cross-platform wording, a Codex run
  relies on `grilling`'s existing fallback ("When no question tool is
  available"), which still works. Process map: step 3 is owned by `grilling`
  alone.
- `Status: implemented`
- `Note:` Approved in phase 3.

### grill-with-docs-04

- `ID`: grill-with-docs-04
- `Severity`: Med
- `Category`: Platform compliance
- `Evidence`: `grill-with-docs/SKILL.md:9` "Run a `/grilling` session, using
  the `/domain-modeling` skill." and `SKILL.md:14` "required by `/grilling`".
- `Problem`: `/name` is Claude Code slash syntax. The skill also serves Codex
  (`agents/openai.yaml`), where skills are invoked as `$name`, so a Codex
  agent may not map `/grilling` to the skill. Plain skill names work on both.
- `Change`: Write skill references as plain backticked names: `grilling`,
  `domain-modeling` (already done in the replacement text of
  grill-with-docs-01; line 14 goes away with grill-with-docs-03).
- `Risk`: None on Claude Code; the agent resolves the name through the Skill
  tool either way. No process-map change.
- `Status: implemented`
- `Note:` Approved in phase 3.

### grill-with-docs-05

- `ID`: grill-with-docs-05
- `Severity`: Low
- `Category`: Clarity (description)
- `Evidence`: `grill-with-docs/SKILL.md:3-5` "A relentless interview to
  sharpen a plan or design, which also creates docs (ADR's and glossary) as we
  go."
- `Problem`: "ADR's" is a wrong plural. "glossary" hides the file name the
  user will see (`CONTEXT.md`). "as we go" is vague. The skill is user-invoked
  (`disable-model-invocation: true`), so per `to-agents/SKILL-MECHANICS.md:25-26`
  the description is a human-facing one-liner and needs no "Use when" clause;
  lint item 3 does not fit user-invoked skills (see Cross-skill findings).
- `Change`:

  Before:

  ```yaml
  description:
    A relentless interview to sharpen a plan or design, which also creates docs
    (ADR's and glossary) as we go.
  ```

  After:

  ```yaml
  description:
    Grills a plan or design relentlessly, writing CONTEXT.md terms and ADRs as
    decisions settle. Use when stress-testing a design whose domain language and
    hard-to-reverse decisions should be recorded.
  ```

- `Risk`: None; the description is not in the agent's listing. No
  process-map change.
- `Status: implemented`
- `Note:` Modified in phase 3: the description must keep a third-person
  "Use when…" clause, because platform-facts.md item 3 now applies to every
  skill, user-invoked ones included (user decision). The suggested wording was
  not recorded here, so phase 4 wrote the After text above.

### Resulting SKILL.md (if 01–05 are all approved)

```md
---
name: grill-with-docs
description:
  Grills a plan or design relentlessly, writing CONTEXT.md terms and ADRs as
  decisions settle. Use when stress-testing a design whose domain language and
  hard-to-reverse decisions should be recorded.
disable-model-invocation: true
---

Run a `grilling` session with the `domain-modeling` skill: invoke both
before the first round.

Writing glossary terms and ADRs is part of the session, not acting on its
outcome. Write each term to `CONTEXT.md` the moment it resolves. Put each
ADR offer to the user as a question in the next round, and write the ADR
when they accept.

The session is done when grilling's frontier is empty, every term resolved
in the session is in `CONTEXT.md`, and every decision passing the ADR test
was offered. Before asking the user to confirm shared understanding, list
the terms written and the ADRs created or declined.
```

## Cross-skill findings

- `grilling/SKILL.md:14-15` names only "the AskUserQuestion tool". Add "or the
  platform's equivalent structured question tool" so Codex runs use their
  native tool before the text fallback; this lets grill-with-docs-03 delete its
  copy. → affects `grilling`
- `grilling/SKILL.md:42-43` "Do not act on it until the user confirms" reads
  as forbidding in-session writes by companion skills. Scoping it to
  implementation ("Do not implement the outcome until ...") would remove the
  conflict at its source. → affects `grilling`
- `_refinement/platform-facts.md:13-14` lint item 3 demands a "Use when…"
  clause, but `to-agents/SKILL-MECHANICS.md:25-26` says a user-invoked skill's
  description is human-facing with trigger lists stripped. Exempt
  `disable-model-invocation: true` skills from item 3. → affects
  `_refinement/platform-facts.md`
- `domain-modeling` places `CONTEXT.md` and `docs/adr/` at "the repo root"
  but gives no rule when the working directory is not a repository (a common
  case when grilling a non-code plan). → affects `domain-modeling`
