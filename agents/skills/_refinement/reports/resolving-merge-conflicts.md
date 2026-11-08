# Refinement report: resolving-merge-conflicts

- **Skill**: `resolving-merge-conflicts`
- **Date**: 2026-11-07
- **Upstream status**: local (not listed in `~/.agents/.skill-lock.json`);
  no `Upstream` tags.
- **Phases run**: 1–2.
- **Files read**:
  - `~/.agents/skills/resolving-merge-conflicts/SKILL.md` (21 lines)
  - `~/.agents/skills/resolving-merge-conflicts/agents/openai.yaml` (3 lines)
  - `~/.agents/skills/to-agents/SKILL.md`
  - `~/.agents/skills/to-agents/SKILL-MECHANICS.md`
  - `~/.agents/skills/_refinement/spec.md`
  - `~/.agents/skills/_refinement/platform-facts.md`
  - `~/.claude/CLAUDE.md`
  - `~/.agents/skills/address-comments/assets/remote-pr-comments.mjs`
    (script-convention model; listed only)
- **Linked skills**: none. A repo-wide grep finds no skill that invokes,
  hands off to, or receives from this skill, and it names no other skill.

## Process map

```
[invoked: merge/rebase stopped on conflict]
        |
        v
 1. See current state ------------------- (no exit criterion)
        |
        v
 2. Find primary sources per conflict --- (unbounded: commits, PRs, tickets)
        |
        v
 3. Resolve each hunk
        |
   <both intents compatible?>
     yes -> keep both
     no  -> <merge goal stated?> -- yes -> pick matching side, note trade-off
                                 \-- no  -> (UNDEFINED: no path)
        |
        v
 4. Run automated checks; fix breakage --- (no bound on "fix")
        |
        v
 5. Stage everything, commit ------------- (conflicts with CLAUDE.md staging)
        |
   <rebasing?>
     no  -> done (no report defined)
     yes -> continue rebase  ---- (new conflict? loop is implicit only)
                 \-> "until all commits are rebased"
```

| Step | Inputs | Action | Outputs | Gate / exit | Failure points |
| --- | --- | --- | --- | --- | --- |
| 1 | Repo mid-merge/rebase | Inspect history and conflicted files | Mental picture of state | None stated | Operation type (merge, rebase, cherry-pick) not identified; no command named |
| 2 | Conflicted files | Read commits, PRs, tickets | Understanding of intents | "Understand deeply" (vague) | Unbounded legwork per hunk; no tool named for PR lookup |
| 3 | Intents, hunks | Edit hunks | Resolved files | None per hunk | No path when goal unstated; rebase ours/theirs inversion; no marker check |
| 4 | Resolved tree | Discover and run checks, fix | Green checks | Implicit "checks pass" | "Fix anything" can invent behaviour; timing during multi-commit rebase |
| 5 | Green tree | Stage all, commit, continue | Commit / rebased branch | "all commits are rebased" | `git add .` vs CLAUDE.md; editor prompts hang; implicit loop; no final report |

**Embedded diagram**: not recommended. Once the loop and the ambiguity
branch are written into the numbered steps (see 03 and 06), the steps
express the flow fully; the skill stays short enough that a diagram adds
load without clarity.

## Findings summary

| Severity | Count |
| --- | --- |
| High | 5 |
| Med | 7 |
| Low | 2 |
| **Total** | **14** |

## Suggestions

### resolving-merge-conflicts-01

- **ID**: resolving-merge-conflicts-01
- **Severity**: High
- **Category**: Duplication (conflict with `CLAUDE.md`)
- **Evidence**: `SKILL.md:20` — "Stage everything and commit."
  `~/.claude/CLAUDE.md` — "Stage only the specific affected files by naming
  their paths with `git add path/to/file ...`. Do not use `git add .`."
- **Problem**: "Stage everything" reads as `git add .` / `git add -A`. It
  contradicts the user's global rule and can stage unrelated untracked files
  (build output, scratch files) into the merge commit.
- **Change**: In step 5, replace
  "Stage everything and commit." with
  "Stage each resolved file by path (`git add <path> ...`)."
  (The commit itself moves to the finish text in 05.)
- **Risk**: None to the flow. Slightly more typing for many-file merges; the
  script in 08 prints the path list to paste.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-02

- **ID**: resolving-merge-conflicts-02
- **Severity**: High
- **Category**: Failure points / Platform compliance (lint 13: validation
  loop for critical operations)
- **Evidence**: `SKILL.md:13-15` — "Resolve each hunk. ..." followed directly
  by checks and commit; no check for leftover markers.
- **Problem**: Nothing verifies that every `<<<<<<<`, `=======`, `>>>>>>>`
  marker is gone before staging. Git happily stages and commits a file with
  markers once `git add` is run, so a missed hunk ships.
- **Change**: Append to step 3:
  "Step 3 is done when `scripts/conflict-state.sh` (run it) reports no
  unmerged paths and no conflict markers. Otherwise resolve the listed
  locations and run it again."
  Until 08 is approved, the fallback text is:
  "Step 3 is done when `git diff --name-only --diff-filter=U` is empty and
  `git diff --check` reports no conflict markers."
- **Risk**: Adds one command per loop iteration. `git diff --check` also
  flags whitespace errors; the script in 08 filters to markers only.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-03

- **ID**: resolving-merge-conflicts-03
- **Severity**: High
- **Category**: Clarity / Failure points (missing error path)
- **Evidence**: `SKILL.md:13-15` — "Where incompatible, pick the one matching
  the merge's stated goal and note the trade-off. ... Always resolve; never
  `--abort`."
- **Problem**: Most merges have no stated goal. With no goal and incompatible
  intents, the agent has no defined path and the "always resolve" rule
  pushes it to guess silently. That is the highest-stakes decision in the
  skill.
- **Change**: Replace step 3's second and third sentences with:
  "Where the intents are incompatible, keep the side that matches the
  goal the user or the branch states for this merge, and record the
  trade-off for the report. When no goal is stated, or both sides fit it,
  ask the user which intent wins, showing both sides and their sources.
  Leave the merge in progress; aborting is the user's call."
- **Risk**: Adds a user gate, so runs can pause. That is the intended trade:
  a pause beats a silent wrong pick. Process map gains an explicit
  "ask user" branch.
- **Status: implemented**
- **Note:** Approved by user: ask which intent wins, leave the merge in progress, never abort.
### resolving-merge-conflicts-04

- **ID**: resolving-merge-conflicts-04
- **Severity**: High
- **Category**: Failure points
- **Evidence**: `SKILL.md:6-7, 13` — no mention of side naming; skill covers
  "merge/rebase" (`SKILL.md:3`).
- **Problem**: During a rebase, "ours" / HEAD is the upstream branch being
  rebased onto and "theirs" is the commit being replayed — the reverse of a
  merge. An agent applying merge intuition, or `git checkout --ours`, keeps
  the wrong side. This is a classic gotcha no config confesses, so it earns
  a cache line.
- **Change**: Add to step 1, after identifying the operation:
  "In a rebase, `ours`/HEAD is the branch being rebased onto and `theirs`
  is your commit being replayed — the reverse of a merge. Name sides by
  branch or commit, never by ours/theirs."
- **Risk**: One extra sentence; no flow change.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-05

- **ID**: resolving-merge-conflicts-05
- **Severity**: High
- **Category**: Failure points
- **Evidence**: `SKILL.md:20-21` — "Stage everything and commit. If rebasing,
  continue the rebase process until all commits are rebased."
- **Problem**: `git commit` (merge) and `git rebase --continue` open
  `$EDITOR`. In an agent shell this hangs or fails (the Claude Code
  environment does not support interactive commands). The agent then
  improvises, often rewriting the message.
- **Change**: Replace step 5 with (combined with 01 and 06):
  "5. **Finish the operation.** Stage each resolved file by path
  (`git add <path> ...`). Then run the non-interactive finish for the
  operation step 1 found:
  - merge: `git commit --no-edit`
  - rebase: `GIT_EDITOR=true git rebase --continue`
  - cherry-pick: `GIT_EDITOR=true git cherry-pick --continue`
  - revert: `GIT_EDITOR=true git revert --continue`"
- **Risk**: Keeps git's generated messages; see 12 for the CLAUDE.md
  message-format interaction. Adds cherry-pick/revert, which depends on 07
  widening scope; drop those two lines if 07 is rejected.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-06

- **ID**: resolving-merge-conflicts-06
- **Severity**: Med
- **Category**: Process map / Clarity (implicit loop, no exit criterion)
- **Evidence**: `SKILL.md:20-21` — "continue the rebase process until all
  commits are rebased."
- **Problem**: A rebase stops again at the next conflicting commit. The skill
  never says to go back to step 1 for it, nor how to tell the rebase is
  finished, so agents stop after the first commit or skip steps 2–4 on later
  ones.
- **Change**: Append to step 5:
  "If the operation stops on a new conflict, return to step 1 for that
  commit. The skill is done when `scripts/conflict-state.sh` (run it)
  reports `operation: none`." (Fallback without 08: "when
  `git status` shows no merge, rebase, cherry-pick, or revert in
  progress.")
- **Risk**: Makes the loop explicit; process map gains a back edge from 5
  to 1.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-07

- **ID**: resolving-merge-conflicts-07
- **Severity**: Med
- **Category**: Failure points (weak triggering) / Platform compliance
  (lint 3)
- **Evidence**: `SKILL.md:3` —
  `description: 'Use when you need to resolve an in-progress git merge/rebase
  conflict.'` (85 chars, over the 80-char line limit in `to-agents`).
- **Problem**: The description carries only a trigger clause: no statement of
  what the skill does (lint 3 wants key use case first, third person). It
  misses the other operations that stop on conflicts — cherry-pick, revert,
  stash pop — and the leading word users type ("conflict markers").
- **Change**: Replace the frontmatter description with:
  ```yaml
  description:
    Resolves in-progress git conflicts by tracing each side's intent,
    then verifies and finishes the operation. Use when a merge, rebase,
    cherry-pick, or revert stops on conflicts, or files hold conflict
    markers.
  ```
  `stash pop` is left out: it has no continue step and no commit, so it
  would need its own branch in step 5.
- **Risk**: Slightly more always-loaded tokens (~25). Widens scope to
  cherry-pick and revert, which the step-5 list in 05 covers.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for lint item 3: description in third person with a 'Use when…' clause.
### resolving-merge-conflicts-08

- **ID**: resolving-merge-conflicts-08
- **Severity**: Med
- **Category**: Script opportunities / Clarity (step 1 has no exit
  criterion)
- **Evidence**: `SKILL.md:6-7` — "See the current state of the merge/rebase.
  Check git history, and the conflicting files." No commands, no completion
  criterion; steps 3 and 5 need the same state check again.
- **Problem**: State discovery is deterministic and repeated (start, after
  each resolve, after each rebase continue). Doing it by hand costs several
  tool calls per loop and varies run to run.
- **Change**: Add `resolving-merge-conflicts/scripts/conflict-state.sh`
  (Bash; simple glue, no JSON parsing).
  Spec:
  - Usage: `conflict-state.sh [--help]`. Any other argument: print usage to
    stderr, exit 2.
  - Run inside the repo; resolve `GIT_DIR` with `git rev-parse --git-dir`.
    Not a repo: `fail` (stderr message, exit 2).
  - Detect the operation, first match wins:
    `rebase-merge/` or `rebase-apply/` dir → `rebase` (also print
    `step: <msgnum>/<end>` from `rebase-merge/msgnum` and `end` when
    present); `MERGE_HEAD` → `merge`; `CHERRY_PICK_HEAD` → `cherry-pick`;
    `REVERT_HEAD` → `revert`; else `none`.
  - Print, compact, one item per line:
    ```
    operation: rebase
    step: 3/7
    onto: <short sha> <subject>        # rebase: onto; merge: HEAD
    incoming: <short sha> <subject>    # rebase: REBASE_HEAD; merge: MERGE_HEAD
    unmerged:
      src/a.ts
      src/b.ts
    markers:
      src/c.ts:42
    ```
  - `unmerged`: `git diff --name-only --diff-filter=U`.
  - `markers`: `git grep -n -E '^(<<<<<<<|=======|>>>>>>>)( |$)' --
    $(git diff --name-only HEAD)` restricted to tracked, changed files, so
    unrelated files containing `=======` (e.g. Markdown setext headings)
    are not scanned. Constant reason: the regex matches git's default
    marker width of 7.
  - Exit 0 when `unmerged` and `markers` are both empty, exit 1 otherwise,
    exit 2 on error. This makes it the step-3 validation gate (02) and the
    step-5 done gate (06).
  - Read-only: it never stages, edits, or aborts, so it is idempotent.
  - No companion workflow `.md`: the output is self-describing and the
    SKILL.md step text covers its use.
  Then replace step 1 with:
  "1. **See the current state.** Run `scripts/conflict-state.sh`. Step 1 is
  done when you know the operation, the two sides (branch or commit), and
  every unmerged path."
- **Risk**: One more file to maintain. `=======` regex may match a
  legitimate line in a changed file; the agent inspects listed locations, so
  a false positive costs one look. Shell portability: uses only POSIX tools
  plus git.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-09

- **ID**: resolving-merge-conflicts-09
- **Severity**: Med
- **Category**: Bottlenecks / Clarity
- **Evidence**: `SKILL.md:9-11` — "Understand deeply why each change was
  made ... Read the commit messages, check the PRs, check original
  issues/tickets."
- **Problem**: "Understand deeply" is a vague completion bound, and checking
  PRs and tickets for every conflict is unbounded legwork (several `gh` calls
  per hunk) with no tool named. Trivial conflicts (imports, formatting) get
  the same cost as semantic ones.
- **Change**: Replace step 2 with:
  "2. **Find each side's intent.** For each unmerged file, read the commits
  that touched it on both sides: `git log --merge -p -- <path>` (for a
  rebase, `git log -p REBASE_HEAD -1 -- <path>` and
  `git log -p ORIG_HEAD..HEAD -- <path>`). Go to the PR
  (`gh pr list --search <sha> --state all`) and its linked issue only
  when the commit message does not explain the change. Step 2 is done when
  every conflicting hunk has a one-line intent for each side, with its
  source."
- **Risk**: May under-dig on conflicts whose commit message looks clear but
  misleads; the escalation rule is the escape hatch. `gh` assumed present,
  as elsewhere in this skill set.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-10

- **ID**: resolving-merge-conflicts-10
- **Severity**: Med
- **Category**: Clarity / Failure points
- **Evidence**: `SKILL.md:17-18` — "Discover the project's automated checks
  and run them — typically typecheck, then tests, then format. Fix anything
  the merge broke." vs `SKILL.md:15` — "Do not invent new behaviour."
- **Problem**: "Fix anything" has no bound and pulls against the
  no-new-behaviour rule: an agent may refactor or patch failures that
  predate the merge. It is also unclear whether checks run after every
  rebased commit (costly) or once at the end. Format before tests is the
  usual order; running format last can leave a dirty tree after the commit.
- **Change**: Replace step 4 with:
  "4. **Run the project's checks** (scripts in `package.json`, `Makefile`,
  CI config): format, then typecheck, then tests. Fix only failures the
  resolution caused — compare with the same check on either parent when
  unsure — and add them to the report. During a rebase, run checks after
  the last conflicting commit, and also after any commit whose resolution
  changed behaviour. Step 4 is done when every check passes or each
  remaining failure is shown to predate the merge."
- **Risk**: The parent comparison costs extra runs when used; it is
  optional ("when unsure"). Fewer check runs during rebases.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-11

- **ID**: resolving-merge-conflicts-11
- **Severity**: Med
- **Category**: Process map (output undefined)
- **Evidence**: `SKILL.md:14` — "note the trade-off"; the skill defines no
  output.
- **Problem**: Trade-offs are "noted" nowhere defined, so the user never
  sees which intent lost. The skill ends on the commit with no report.
- **Change**: Add a final step:
  "6. **Report** to the user: per conflicted file, the resolution in one
  line; every trade-off (which intent was dropped and why); any fixes from
  step 4; check results; and the final commit or rebased HEAD sha."
- **Risk**: Adds output length; makes trade-offs reviewable. Process map
  gains an explicit output node.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-12

- **ID**: resolving-merge-conflicts-12
- **Severity**: Med
- **Category**: Duplication / Clarity (interaction with `CLAUDE.md`)
- **Evidence**: `SKILL.md:20` — "commit"; `~/.claude/CLAUDE.md` — "Format
  commit messages as `<type>: <Subject>`".
- **Problem**: An agent obeying CLAUDE.md may rewrite git's
  `Merge branch 'x' into y` message as `chore: Merge ...`, or reword
  replayed commits during a rebase. The user's rule is about authored
  commits; the skill should say which applies.
- **Change**: Add to step 5, after the command list in 05:
  "Keep git's generated merge message and the replayed rebase commit
  messages unchanged. The repo's commit format applies only to new
  non-merge commits. Stage step-4 fixes into the same commit as the
  resolution."
- **Risk**: Needs the user's preference; ask in phase 3.
- **Status: implemented**
- **Note:** User decision: keep git's generated merge message and replayed rebase commit messages unchanged; CLAUDE.md commit format applies only to new non-merge commits.
### resolving-merge-conflicts-13

- **ID**: resolving-merge-conflicts-13
- **Severity**: Low
- **Category**: Clarity (negation; to-agents "Negation")
- **Evidence**: `SKILL.md:15` — "Do **not** invent new behaviour. Always
  resolve; never `--abort`."
- **Problem**: Two prohibitions; the bold "not" puts weight on the banned
  behaviour. `to-agents` asks for the positive target, with a prohibition
  only as a paired guardrail.
- **Change**: Replace with:
  "Every line of the result comes from one side or joins both sides'
  lines." (The abort guardrail is rephrased in 03.)
- **Risk**: None to flow. If 03 is rejected, keep
  "Resolve every conflict; leave aborting to the user."
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### resolving-merge-conflicts-14

- **ID**: resolving-merge-conflicts-14
- **Severity**: Low
- **Category**: Platform compliance (lint 16)
- **Evidence**: `agents/openai.yaml:1-3` — `display_name`,
  `short_description` only.
- **Problem**: Valid, but `short_description` says "merge and rebase" while
  07 widens scope to cherry-pick and revert.
- **Change**: If 07 is approved, set
  `short_description: 'Resolve merge, rebase, and cherry-pick conflicts'`.
  Otherwise no change.
- **Risk**: None.
- **Status: implemented**
- **Note:** Auto-approved as safe and small, per user instruction 2026-11-07.
### Combined target text (reference for phase 4)

If every suggestion is approved as written, `SKILL.md` reads:

```markdown
---
name: resolving-merge-conflicts
description:
  Resolves in-progress git conflicts by tracing each side's intent,
  then verifies and finishes the operation. Use when a merge, rebase,
  cherry-pick, or revert stops on conflicts, or files hold conflict
  markers.
---

1. **See the current state.** Run `scripts/conflict-state.sh`. Step 1 is
   done when you know the operation, the two sides (branch or commit), and
   every unmerged path. In a rebase, `ours`/HEAD is the branch being
   rebased onto and `theirs` is your commit being replayed — the reverse
   of a merge. Name sides by branch or commit, never by ours/theirs.

2. **Find each side's intent.** For each unmerged file, read the commits
   that touched it on both sides: `git log --merge -p -- <path>` (for a
   rebase, `git log -p REBASE_HEAD -1 -- <path>` and
   `git log -p ORIG_HEAD..HEAD -- <path>`). Go to the PR
   (`gh pr list --search <sha> --state all`) and its linked issue only
   when the commit message does not explain the change. Step 2 is done
   when every conflicting hunk has a one-line intent for each side, with
   its source.

3. **Resolve each hunk.** Preserve both intents where possible. Every line
   of the result comes from one side or joins both sides' lines. Where the
   intents are incompatible, keep the side that matches the goal the user
   or the branch states for this merge, and record the trade-off for the
   report. When no goal is stated, or both sides fit it, ask the user
   which intent wins, showing both sides and their sources. Leave the
   merge in progress; aborting is the user's call. Step 3 is done when
   `scripts/conflict-state.sh` (run it) reports no unmerged paths and no
   conflict markers. Otherwise resolve the listed locations and run it
   again.

4. **Run the project's checks** (scripts in `package.json`, `Makefile`,
   CI config): format, then typecheck, then tests. Fix only failures the
   resolution caused — compare with the same check on either parent when
   unsure — and add them to the report. During a rebase, run checks after
   the last conflicting commit, and also after any commit whose resolution
   changed behaviour. Step 4 is done when every check passes or each
   remaining failure is shown to predate the merge.

5. **Finish the operation.** Stage each resolved file by path
   (`git add <path> ...`). Then run the non-interactive finish for the
   operation step 1 found:
   - merge: `git commit --no-edit`
   - rebase: `GIT_EDITOR=true git rebase --continue`
   - cherry-pick: `GIT_EDITOR=true git cherry-pick --continue`
   - revert: `GIT_EDITOR=true git revert --continue`

   Keep git's generated merge message and the replayed commits' messages.
   Stage step-4 fixes into the same commit as the resolution. If
   the operation stops on a new conflict, return to step 1 for that
   commit. Step 5 is done when `scripts/conflict-state.sh` reports
   `operation: none`.

6. **Report** to the user: per conflicted file, the resolution in one
   line; every trade-off (which intent was dropped and why); any fixes
   from step 4; check results; and the final commit or rebased HEAD sha.
```

Lint check of the target: name valid; description 1–1024 chars, third
person, use case first, "Use when" clause; body ~60 lines; no reference
files; script mentions say "run"; numbered steps with a validation loop;
no time-sensitive text; no CRITICAL/MUST; openai.yaml keys valid.

## Cross-skill findings

None. No other skill invokes, hands off to, or receives from this skill, and
no fix here lies outside `resolving-merge-conflicts/`. Nothing appended to
`cross-skill.md`.
