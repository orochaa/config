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

   Keep git's generated merge message and the replayed rebase commit
   messages unchanged. The repo's commit format applies only to new
   non-merge commits. Stage step-4 fixes into the same commit as the
   resolution. If the operation stops on a new conflict, return to step 1
   for that commit. Step 5 is done when `scripts/conflict-state.sh` (run
   it) reports `operation: none`.

6. **Report** to the user: per conflicted file, the resolution in one
   line; every trade-off (which intent was dropped and why); any fixes
   from step 4; check results; and the final commit or rebased HEAD sha.
