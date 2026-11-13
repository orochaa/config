# Review a remote pull request

Review a GitHub PR without checking out its branch. The clone's working tree,
current branch, and untracked files are out of scope; every read is pinned to
the PR's head SHA.

## Contents

- Scope block
- Substitutions
- Base branch
- Issue reference
- Specification

## Scope block

Run `scripts/remote-pr-scope.sh <pr-url|pr-number> [<base>]` from a clone of
the PR's repository, using the absolute path of this skill's folder. It fetches
`pull/<N>/head` and the base branch, then prints `pr`, `title`, `state`,
`mode`, `branch`, `head`, `base`, `commits`, `files`, `guidance`, `issue`,
`commit-issues`, and `spec-source`. On exit 2, relay its message and stop:

- Not a clone of the PR's repository: ask the user to run from one.
- Base does not resolve: ask the user for the base.
- Empty scope: tell the user the PR changes nothing against `<base>`.

The mode is **read-only**. Edits need the branch checked out, so a user who
wants fixes checks it out and starts a local review.

The script's `base:` line gives `<mergeBase>`, and `head:` gives `<headSha>`.
`commits:` can list a stacked parent's commits; the diff is authoritative.

## Substitutions

Apply these wherever the local steps name a checkout:

| Local step | Remote PR |
| --- | --- |
| `git diff <base>...HEAD`, `git diff HEAD` | `git diff <mergeBase>...<headSha>` only |
| Read a changed or untracked file | `git show <headSha>:<path>` |
| Guidance paths and `ls` check | the script's `<headSha>:<path>` entries, each confirmed with `git cat-file -e` and read with `git show` |
| Project skills in `.claude/skills/`, `.agents/skills/` | `git ls-tree -r --name-only <headSha> .claude/skills .agents/skills`, read with `git show` |
| Record HEAD for "HEAD moves" | `gh pr view <N> --json headRefOid` equals `<headSha>`; a newer SHA lists its commits as **not reviewed** |
| Sub-agent briefing | pass the commands above in place of "run the diff commands and read untracked files" |

## Base branch

Pick the first hit:

1. The base the user named.
2. The PR's `baseRefName` (`gh pr view <N> --json baseRefName`).

Never fall back to `main`: a stacked PR targets its parent branch, and `main`
would pull the parent's changes into the scope.

## Issue reference

Pick the first hit; the script prints it on the `issue:` line:

1. `closingIssuesReferences`, which carries the owning repository (it can
   differ from the PR's, as in `unvoidweb/when-product`).
2. `Closes`, `Fixes`, or `Resolves` links in the PR body, with HTML comments
   removed (template placeholders live there).
3. `(#N)` in the PR title; the repository is unconfirmed, so resolve it with
   the issue-tracker doc the guidance set names.

Commit messages are not a source: a stacked branch carries its parent's issue
numbers. The script's `commit-issues:` line lists them; when they differ from
`issue:`, record the difference in the Report.

## Specification

Replaces step 2's search. Pick the first hit:

1. A path the user supplied.
2. The detected issue and the PR body, concatenated as one specification:
   `gh issue view <issue-url> --json title,body` followed by
   `gh pr view <N> --json body`.
3. The PR body alone, when no issue is detected or `gh` cannot read it. Record
   the specification as `PR body only`.

Skip the Spec sub-agent only when the PR body is empty too; record
`no spec available`.
