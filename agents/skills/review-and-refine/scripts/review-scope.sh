#!/usr/bin/env bash
# Print the review scope block for the current git repository.
# Read-only: it changes nothing, so reruns are safe.
set -euo pipefail

usage='Usage: review-scope.sh [<base>]

Prints branch, HEAD, base, commits, changed files, and the AGENTS.md and
CLAUDE.md files on the path from each changed file up to the filesystem root.
<base> defaults to main.

Exit codes: 0 scope printed, 2 usage error, not a repository, unresolved base,
or empty scope.'

# Matches the skill default when the user names no base branch.
DEFAULT_BASE=main

fail() {
  printf 'review-scope: %s\n' "$1" >&2
  exit 2
}

case "${1-}" in
  -h | --help)
    printf '%s\n' "$usage"
    exit 0
    ;;
esac
[ "$#" -le 1 ] || fail "expected at most one argument
$usage"

base="${1:-$DEFAULT_BASE}"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 ||
  fail "not inside a git work tree"
git rev-parse --verify --quiet "${base}^{commit}" >/dev/null ||
  fail "base '${base}' does not resolve; pass the correct base branch"

top="$(git rev-parse --show-toplevel)"
head="$(git rev-parse HEAD)"
merge_base="$(git merge-base "$base" HEAD)" ||
  fail "base '${base}' shares no history with HEAD"
branch="$(git branch --show-current)"
[ -n "$branch" ] || branch='(detached)'

# --no-renames lists both sides of a rename, so both directories are walked.
paths="$(
  {
    git diff --name-only --no-renames "${base}...HEAD"
    git diff --name-only --no-renames HEAD
    git ls-files --others --exclude-standard
  } | sort -u
)"
[ -n "$paths" ] ||
  fail "empty review scope against '${base}': no committed, staged, unstaged, or untracked changes"

indent() { sed 's/^/  /'; }

printf 'branch: %s\n' "$branch"
printf 'head: %s\n' "$head"
printf 'base: %s (merge-base %s)\n' "$base" "$merge_base"

printf 'commits:\n'
commits="$(git log --oneline "${base}..HEAD")"
if [ -n "$commits" ]; then
  printf '%s\n' "$commits" | indent
else
  printf '  (none)\n'
fi

printf 'files:\n'
printf '  committed:\n'
committed="$(git diff --name-status -M "${base}...HEAD")"
if [ -n "$committed" ]; then
  printf '%s\n' "$committed" | indent | indent
else
  printf '    (none)\n'
fi
printf '  working tree:\n'
worktree="$(git status --short --untracked-files=all)"
if [ -n "$worktree" ]; then
  printf '%s\n' "$worktree" | indent | indent
else
  printf '    (none)\n'
fi

printf 'guidance:\n'
guidance="$(
  printf '%s\n' "$paths" | while IFS= read -r rel; do
    dir="$(dirname "${top}/${rel}")"
    while :; do
      for name in AGENTS.md CLAUDE.md; do
        if [ -f "${dir}/${name}" ]; then
          printf '%s\n' "${dir%/}/${name}"
        fi
      done
      [ "$dir" = / ] && break
      dir="$(dirname "$dir")"
    done
  done | sort -u |
    awk '{ depth = gsub("/", "/"); print depth "\t" $0 }' |
    sort -t "$(printf '\t')" -k1,1nr -k2 | cut -f2-
)"
if [ -n "$guidance" ]; then
  printf '%s\n' "$guidance" | indent
else
  printf '  (none)\n'
fi
