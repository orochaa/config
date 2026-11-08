# Refinement Report: to-github-review

- **Skill:** `to-github-review`
- **Date:** 2026-11-07
- **Upstream status:** local (not listed in `~/.agents/.skill-lock.json`); no
  `Upstream` tags apply.
- **Files read:**
  - `~/.agents/skills/to-github-review/SKILL.md` (99 lines)
  - `~/.agents/skills/to-github-review/agents/openai.yaml`
  - `~/.agents/skills/to-agents/SKILL.md`
  - `~/.agents/skills/to-agents/SKILL-MECHANICS.md`
  - `~/.agents/skills/_refinement/platform-facts.md`
  - `~/.agents/skills/_refinement/spec.md`
  - `~/.claude/CLAUDE.md`
  - `~/.agents/skills/review-and-refine/SKILL.md` (lines 1-70, 180-221: the
    `.review.md` format, the most likely source of findings)
  - `~/.agents/skills/address-comments/SKILL.md` (lines 1-30: the consumer
    of GitHub review comments once posted)
  - `~/.agents/skills/to-source-comments/SKILL.md` (sibling skill with the
    same invocation pattern)
- **Hand-offs:** no skill invokes or names `to-github-review` (grep across
  `~/.agents/skills`). Its implicit producer is `review-and-refine`, whose
  `.review.md` the user pastes or points at. Its output goes to a human, who
  pastes it into GitHub.

## Process map

```text
 [findings: prompt text or Markdown file]
                 |
                 v
 1. Identify distinct findings
                 |
                 v
 2. Target supplied? --no--------------------------+
                 | yes                             |
                 v                                 |
    Local repo available? --no--> (undefined:      |
                 | yes            no excerpt       |
                 v                source; see -01) |
    Read exact location                            |
                 |                                 |
                 v                                 |
 3. Target matches local code? --no--> STOP, ask   |
                 | yes                 user (affected
                 |                     findings only;
                 |                     resume undefined)
                 v                                 v
          inline comment                 general comment
                 \                                /
                  v                              v
 4. Assign tag M:/S:/C: (keep explicit W:, M:, S:, C:)
                 |
                 v
 5. Merge same-issue + same-target duplicates
                 |  (tag conflict on merge: undefined)
                 v
 6-7. Render blocks; refactor -> nested code fence
                 |
                 v
 8. Gate: all ready and no target pending?
                 | yes
                 v
    Write unique temp .md --> reply with path only
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 | Prompt text or Markdown file | Split into distinct findings; rewrite rough notes | Finding list | None stated | Fixed/resolved findings and open decisions in a `.review.md` are treated as findings (-04); no count to check completeness (-07) |
| 2 | Finding paths and locations; local repo | Read the exact location to quote the anchor | Target excerpt | "local repository is available" | Repo unavailable leaves the excerpt with no source (-01); "location" is undefined for path-only findings (-01) |
| 3 | Excerpt vs supplied target | Detect mismatch; ask; or fall back to general | Inline or general class | Mismatch: stop and ask | No timing for the question relative to other findings; no resume rule (-02) |
| 4 | Finding plus source tag | Assign M:/S:/C:, preserve explicit tags | Tagged finding | None | Vague M vs S line; no mapping from High/Med/Low or nit/blocker; "when they fit" lets the agent override the user; question-style comments have no tag (-03) |
| 5 | Tagged findings | Merge same issue at same target | Deduplicated list | None | Merged findings with different tags have no rule (-06) |
| 6 | Deduplicated list | Render Markdown blocks | Blocks | None | Line numbers dropped everywhere, so the user must search for the excerpt (-05) |
| 7 | Refactor findings | Add a fenced code suggestion | Body with nested fence | None | Restates the Output format section (-09) |
| 8 | All blocks | Write unique temp `.md`; reply with path | File path | All ready, none pending | No location or naming for "temporary"; no completion check (-07, -08) |

## Findings summary

| Severity | Count |
| --- | --- |
| High | 2 |
| Med | 6 |
| Low | 3 |
| **Total** | **11** |

Lint checklist (`platform-facts.md`): items 1, 2, 4-16 pass. Item 3 fails (no
"Use when…" clause; see -08 for why the fix differs per platform). Item 17:
no diagram present. All lines are at most 80 chars. No embedded diagram is
proposed: the flow is linear with one gate, which numbered steps express well.

## Suggestions

### to-github-review-01

- **ID:** to-github-review-01
- **Severity:** High
- **Category:** Failure points
- **Evidence:** `SKILL.md:18-20`: "When a location is supplied and the local
  repository is available, inspect that exact location to quote the relevant
  code as the target anchor." and `SKILL.md:57`: "<exact excerpt from the
  supplied target>"
- **Problem:** The inline format requires an exact excerpt, but the skill only
  says how to get one when the local repo is available. When the repo is
  absent (or the source gives `path:line` with no code), there is no excerpt
  source, and the agent is likely to reconstruct or invent the code. "Location"
  is also undefined: it is unclear whether a bare file path counts as a
  target (inline) or not (general). The repo may also be on a different
  branch than the reviewed PR, which step 3 then reports as a mismatch with no
  hint why.
- **Change:** Replace steps 2-3 (`SKILL.md:18-24`) with:

  Before:
  ```text
  2. Use only file paths and code locations supplied by the source. When a
     location is supplied and the local repository is available, inspect that
     exact location to quote the relevant code as the target anchor. Do not
     search for a different location or remap the finding.
  3. If a supplied path or target no longer matches the local code, stop and ask
     the user to clarify before formatting the affected findings. If no target
     was supplied, format the finding as a general review comment.
  ```

  After:
  ```text
  2. Classify each finding's target from the source alone:
     - **Code target**: a path plus a line, line range, symbol, or quoted
       code. Format it as an inline comment.
     - **File target**: a path only. Format it as a general comment with
       that path.
     - **No target**: format it as a general comment with `Not specified`.
     Keep the supplied location; finding a better one is the reviewer's job.
  3. Take each code target's excerpt from one source, in this order:
     1. The code quoted in the source, verbatim.
     2. The local file at the supplied location, read before quoting. Check
        the current branch with `git branch --show-current` first.
     3. Neither available: mark the excerpt `Excerpt unavailable: <supplied
        location>` and keep the comment inline.
     A completed step 3 leaves every excerpt copied from the source or the
     file, never written from memory.
  ```
- **Risk:** Adds one rung (source-quoted code) and an explicit fallback. The
  process map's "Local repo available? --no" branch becomes defined. The
  mismatch gate moves to -02.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-02

- **ID:** to-github-review-02
- **Severity:** High
- **Category:** Clarity
- **Evidence:** `SKILL.md:22-24`: "stop and ask the user to clarify before
  formatting the affected findings" and `SKILL.md:40`: "After all findings
  are ready and no target needs clarification, save"
- **Problem:** The gate has no defined timing or exit. "Stop" conflicts with
  "the affected findings": the agent cannot tell whether to halt at the first
  mismatch or finish the rest and ask once. There is no rule for what happens
  after the user answers (re-read at a new location? drop? format as
  general?), so the step-8 gate "no target needs clarification" has no
  checkable exit.
- **Change:** Insert as new step 4 (after the -01 steps), renumbering the rest:

  ```text
  4. Collect every mismatch: a code target whose local file is missing, or
     whose location no longer holds the code the finding describes. Format
     all other findings first. Then ask the user once, listing each mismatch
     as `<finding summary> -> <supplied location>: <what is there now>`. Per
     mismatch, apply the user's answer: use the new location, format it as a
     general comment, or drop it. The gate exits when every mismatch has an
     answer.
  ```

  And change step 8's opening (`SKILL.md:40`) from "After all findings are
  ready and no target needs clarification," to "After the mismatch gate
  exits,".
- **Risk:** One question round instead of possibly several; the user sees all
  mismatches together. The process map's STOP node gains an exit edge back
  into rendering.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-03

- **ID:** to-github-review-03
- **Severity:** Med
- **Category:** Clarity
- **Evidence:** `SKILL.md:25-29`: "Use `M:` for required fixes, `S:` for
  important fixes that are not blocking ... Preserve explicit `M:`, `S:`, and
  `C:` source tags when they fit these categories."
- **Problem:** Three gaps. (a) "when they fit" lets the agent overrule a tag
  the user chose, with no rule for when. (b) Sources often use other scales
  (`review-and-refine` and this refinement use High/Med/Low; others use
  blocker/nit), and no mapping exists, so tags vary run to run. (c) A finding
  phrased as a question has no tag, and `W:` has no stated meaning, so the
  agent cannot tell whether to keep its wording.
- **Change:** Replace step 4 with:

  ```text
  4. Tag each comment body with one MoSCoW prefix:

     | Tag | Meaning | Source signals |
     | --- | --- | --- |
     | `M:` | Must fix before merge | High, blocker, bug, security, breaks spec |
     | `S:` | Should fix; not blocking | Med, important, maintainability |
     | `C:` | Could fix; optional | Low, nit, style, optional, question |
     | `W:` | Won't fix now; noted for later | Only when the source says `W:` |

     A tag written in the source (`M:`, `S:`, `C:`, `W:`) is the user's call;
     copy it unchanged. Map other scales by the table. `W:` comes only from
     the source.
  ```
- **Risk:** The table is roughly 8 lines longer. The mapping is a default the
  user may want tuned in phase 3 (for example, security as `M:` always).
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-04

- **ID:** to-github-review-04
- **Severity:** Med
- **Category:** Failure points
- **Evidence:** `SKILL.md:15`: "Identify each distinct finding in the
  supplied source." Compare `review-and-refine/SKILL.md:152`: "marking each
  fixed or open", and `review-and-refine/SKILL.md:197-201`: append-only dated
  sections that record "resolutions or corrections in the new section,
  referencing the earlier finding".
- **Problem:** The most likely input, a `.review.md`, holds fixed findings,
  completed cleanup, validation logs, pending decisions, and repeat mentions of
  one finding across dated sections. Step 1 takes "each distinct finding"
  with no filter, so fixed issues and internal decisions can become PR
  comments.
- **Change:** Append to step 1 (`SKILL.md:15-17`):

  ```text
     A finding is an open issue about the code under review. Skip items the
     source marks fixed, resolved, or done, plus validation logs and
     completed-cleanup lists. When a later section of the source updates an
     earlier finding, use the latest state. List skipped items, one line each,
     in a `## Skipped` section at the end of the output file.
  ```
- **Risk:** The `## Skipped` section adds output the user does not paste; it
  makes the filter auditable. Decisions stay in scope, since they may be real
  questions to the PR author.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-05

- **ID:** to-github-review-05
- **Severity:** Med
- **Category:** Bottlenecks
- **Evidence:** `SKILL.md:34-35`: "do not put absolute line numbers in the
  comment body." and `SKILL.md:50-58` (the inline block has File and Target
  code only)
- **Problem:** The rule rightly keeps line numbers out of the pasted body, but
  the block drops them everywhere. To place each inline comment, the user must
  search the PR diff for the excerpt. The source usually supplies the line,
  so the skill discards information the user needs.
- **Change:** In the inline template (`SKILL.md:52`), after the
  `**File:**` line, add:

  ```text
  **Lines:** `<supplied line or range>` or `Not specified`
  ```

  And change `SKILL.md:34-35` to: "Put the supplied line numbers in the
  `Lines` field only; the comment body refers to code as 'the lines below' or
  'the function below', because GitHub anchors it there."
- **Risk:** One more field per block. Lines may drift from the PR diff; the
  excerpt stays the authoritative anchor.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-06

- **ID:** to-github-review-06
- **Severity:** Med
- **Category:** Failure points
- **Evidence:** `SKILL.md:25` (step 4, tag) runs before `SKILL.md:30-31`
  (step 5, merge): "Merge repeated findings only when they describe the same
  underlying issue at the same code target."
- **Problem:** Tagging before merging means two duplicates can carry different
  tags (`S:` and `M:`), and the skill gives no rule for which wins, so the
  result varies.
- **Change:** Swap steps 4 and 5 so merging precedes tagging, and add to the
  merge step: "A merged finding takes the strictest source tag (M over S over
  C over W) and keeps every distinct supporting detail."
- **Risk:** None to the output shape. The process map swaps two nodes.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-07

- **ID:** to-github-review-07
- **Severity:** Med
- **Category:** Clarity
- **Evidence:** `SKILL.md:15-44`: no step ends on a completion criterion;
  `SKILL.md:43-44`: "report its path and do not show the comments in your
  response."
- **Problem:** Nothing checks that every source finding landed somewhere, so a
  long source can lose findings silently, and the path-only reply gives the
  user no signal that anything was lost.
- **Change:** Replace the last sentence of step 8 (`SKILL.md:43-44`) with:

  ```text
     Before replying, check the count: findings identified = blocks written +
     findings merged away + items in `## Skipped` + mismatches dropped by the
     user. Reply with the file path and that one-line tally, for example
     `12 findings: 10 blocks (7 inline, 3 general), 1 merged, 1 skipped`.
     Leave the comments themselves in the file.
  ```
- **Risk:** Slightly longer reply; still no comment text in chat. Depends on
  -04 for `## Skipped`; without -04, drop that term.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-08

- **ID:** to-github-review-08
- **Severity:** Med
- **Category:** Platform compliance
- **Evidence:** `SKILL.md:1-6` (no `disable-model-invocation`; description
  "when explicitly invoked with $to-github-review") and
  `agents/openai.yaml:8`: "allow_implicit_invocation: false"
- **Problem:** Codex is locked to explicit `$to-github-review` calls, but in
  Claude Code the skill has no `disable-model-invocation: true`, so its
  description is always loaded (context load) and the model may fire it. The
  `$` syntax means nothing in Claude Code, where the user types
  `/to-github-review`. No other skill reaches it, so model invocation buys
  nothing (`SKILL-MECHANICS.md:28-30`). Lint item 3 (third person, "Use
  when…") fails, but `SKILL-MECHANICS.md:25-26` says a user-invoked skill's
  description is a human-facing one-line summary with no trigger list. The
  user-invoked rule should win here.
- **Change:** Replace the frontmatter (`SKILL.md:1-6`) with:

  ```yaml
  ---
  name: to-github-review
  description: >-
    Formats supplied review findings as copy-ready GitHub review comments for
    manual pasting. Use when the user explicitly invokes to-github-review on
    findings in the prompt or a Markdown file, such as a `.review.md`.
  disable-model-invocation: true
  ---
  ```

  Leave `agents/openai.yaml` unchanged.
- **Risk:** Removes the description from Claude Code's listing; the user must
  remember `/to-github-review` (cognitive load, which matches the current
  intent). Claude.ai/API reject unknown keys (`platform-facts.md:59-60`), but
  15 sibling skills already use this key, so it is house style.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3a: add disable-model-invocation: true (keep allow_implicit_invocation: false); description keeps a third-person 'Use when…' clause (item 3).
### to-github-review-09

- **ID:** to-github-review-09
- **Severity:** Low
- **Category:** Duplication
- **Evidence:** `SKILL.md:36-39` (step 7: refactor gets a fenced code
  suggestion) restates `SKILL.md:66-68`; `SKILL.md:30-31` (step 5: merge only
  same target) restates `SKILL.md:94-95`.
- **Problem:** Two meanings live in two places each, which raises maintenance
  cost and can drift.
- **Change:** Delete `SKILL.md:94-95` ("Use one block per finding after
  same-target duplicates are merged. For findings that share an issue but have
  distinct targets, write separate blocks."). Shorten `SKILL.md:66-68` to:
  "Wrap a body that holds a code suggestion (step 7) in a four-backtick outer
  fence so its inner fence stays intact:". Move `SKILL.md:95-96` "Include only
  the code excerpts needed to identify each target." into step 2/3, beside
  where the excerpt is taken (co-location).
- **Risk:** None; same meaning, one home each.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-10

- **ID:** to-github-review-10
- **Severity:** Low
- **Category:** Clarity
- **Evidence:** `SKILL.md:41-42`: "save the complete Markdown output to a new
  temporary `.md` file. Use a unique path for every run"
- **Problem:** "Temporary" and "unique" leave location and naming to the agent,
  so the path differs in form every run. One command gives a unique,
  findable name. No script is warranted: this is one command, the only
  deterministic step in the skill.
- **Change:** Replace with: "save the complete Markdown output with
  `mktemp --suffix=.md \"${TMPDIR:-/tmp}/github-review-XXXXXX\"` (or the
  session scratchpad directory when one is provided), then write to the
  returned path."
- **Risk:** GNU `mktemp` syntax; macOS `mktemp` lacks `--suffix`. If macOS
  matters, use `mktemp "${TMPDIR:-/tmp}/github-review-XXXXXX"` and append the
  `.md` with a `mv`.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### to-github-review-11

- **ID:** to-github-review-11
- **Severity:** Low
- **Category:** Script opportunities / Clarity
- **Evidence:** `SKILL.md:36-39`: "include a concrete code suggestion in a
  fenced code block" and `SKILL.md:75`: "```ts"
- **Problem:** GitHub's `suggestion` fence turns a replacement for the
  commented lines into a one-click "Commit suggestion". The skill always uses a
  language fence, so the PR author must apply even small replacements by
  hand.
- **Change:** Append to step 7: "When the suggestion replaces exactly the
  target excerpt's lines and nothing else, use a ` ```suggestion ` fence so
  GitHub offers one-click apply. Otherwise use a language fence."
- **Risk:** A `suggestion` block applies only to the lines the user selects
  when pasting; a wrong selection gives a wrong commit. Pairs with -05's
  `Lines` field, which tells the user which lines to select.
- **Status:** implemented
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
## Cross-skill findings

- `review-and-refine` writes `.review.md` files that mix open and fixed
  findings across append-only dated sections, but gives each finding no stable
  ID or explicit open/fixed status field. A tagged per-finding status (for
  example `Status: open|fixed`) would let `to-github-review` (and
  `address-comments`) filter without interpretation. → affects
  `review-and-refine`
- `to-source-comments` has the same invocation mismatch as -08 (`$skill`
  description, no `disable-model-invocation`, Codex `allow_implicit_invocation:
  false`). → affects `to-source-comments`
