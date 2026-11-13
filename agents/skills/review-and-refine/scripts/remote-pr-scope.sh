#!/usr/bin/env bash
# Print the review scope block for a remote GitHub pull request.
# Fetches the PR head into the local clone's object store; it never checks
# out, merges, or touches the working tree, so reruns are safe.
set -euo pipefail

usage='Usage: remote-pr-scope.sh <pr-url|pr-number> [<base>]

Run from a clone of the PR repository. Prints pr, state, head SHA, base,
commits, changed files, guidance paths (as <headSha>:<path>), the detected
issue, and the spec source. <base> overrides the PR base branch.

Exit codes: 0 scope printed, 2 usage error, gh or git failure, not a clone of
the PR repository, unresolved base, or empty scope.'

fail() {
  printf 'remote-pr-scope: %s\n' "$1" >&2
  exit 2
}

case "${1-}" in
  -h | --help)
    printf '%s\n' "$usage"
    exit 0
    ;;
esac
{ [ "$#" -ge 1 ] && [ "$#" -le 2 ]; } || fail "expected 1 or 2 arguments
$usage"

command -v gh >/dev/null 2>&1 || fail "gh is not installed"
command -v jq >/dev/null 2>&1 || fail "jq is not installed"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 ||
  fail "not inside a git work tree"

arg="$1"
base_override="${2-}"

if [[ "$arg" =~ ^https://github\.com/([^/]+/[^/]+)/pull/([0-9]+) ]]; then
  repo="${BASH_REMATCH[1]}"
  number="${BASH_REMATCH[2]}"
elif [[ "$arg" =~ ^[0-9]+$ ]]; then
  number="$arg"
  repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)" ||
    fail "cannot resolve the repository for PR ${number}"
else
  fail "'${arg}' is neither a PR URL nor a PR number"
fi

# The remote whose URL names the PR repository.
remote=""
while read -r name url; do
  case "$url" in
    *"github.com:${repo}" | *"github.com:${repo}.git" | \
      *"github.com/${repo}" | *"github.com/${repo}.git")
      remote="$name"
      break
      ;;
  esac
done < <(git remote -v | awk '$3 == "(fetch)" { print $1, $2 }')
[ -n "$remote" ] ||
  fail "no remote of this clone points at ${repo}; run from a clone of it"

pr="$(gh pr view "$number" -R "$repo" --json \
  number,title,state,isDraft,url,baseRefName,headRefName,body,closingIssuesReferences)" ||
  fail "gh cannot read PR ${number} in ${repo}"
field() { printf '%s' "$pr" | jq -r "$1"; }

base="${base_override:-$(field .baseRefName)}"

git fetch --quiet "$remote" "pull/${number}/head" ||
  fail "cannot fetch pull/${number}/head from ${remote}"
head="$(git rev-parse FETCH_HEAD)"
git fetch --quiet "$remote" "+refs/heads/${base}:refs/remotes/${remote}/${base}" ||
  fail "base '${base}' does not resolve on ${remote}; pass the correct base branch"
base_ref="refs/remotes/${remote}/${base}"
merge_base="$(git merge-base "$base_ref" "$head")" ||
  fail "base '${base}' shares no history with the PR head"

changed="$(git diff --name-only --no-renames "${merge_base}...${head}")"
[ -n "$changed" ] ||
  fail "empty review scope against '${base}': the PR changes no files"

indent() { sed 's/^/  /'; }

printf 'pr: %s\n' "$(field .url)"
printf 'title: %s\n' "$(field .title)"
printf 'state: %s%s\n' "$(field .state)" \
  "$([ "$(field .isDraft)" = true ] && printf ' (draft)')"
printf 'mode: read-only (remote PR)\n'
printf 'branch: %s\n' "$(field .headRefName)"
printf 'head: %s\n' "$head"
printf 'base: %s (merge-base %s)\n' "$base" "$merge_base"

printf 'commits:\n'
git log --oneline "${merge_base}..${head}" | indent
printf 'files:\n'
git diff --name-status -M "${merge_base}...${head}" | indent

printf 'guidance:\n'
guidance="$(
  printf '%s\n' "$changed" | while IFS= read -r rel; do
    dir="$(dirname "$rel")"
    while :; do
      prefix=""
      [ "$dir" = . ] || prefix="${dir}/"
      for name in AGENTS.md CLAUDE.md; do
        if git cat-file -e "${head}:${prefix}${name}" 2>/dev/null; then
          printf '%s:%s%s\n' "$head" "$prefix" "$name"
        fi
      done
      [ "$dir" = . ] && break
      dir="$(dirname "$dir")"
    done
  done | sort -u
)"
if [ -n "$guidance" ]; then
  printf '%s\n' "$guidance" | indent
else
  printf '  (none)\n'
fi

# Issue: closing references, then body links (HTML comments stripped), then
# a title "(#N)". Commit messages are not a source; stacked branches carry the
# parent's issue.
issue=""
issue_source=""
closing="$(field '[.closingIssuesReferences[].url] | join(" ")')"
if [ -n "$closing" ]; then
  issue="$closing"
  issue_source="closing references"
else
  body="$(field .body | perl -0pe 's/<!--.*?-->//gs')"
  link="$(printf '%s' "$body" |
    grep -oiE '(close[sd]?|fix(e[sd])?|resolve[sd]?):?[[:space:]]+(https://github\.com/[^[:space:])]+/issues/[0-9]+|[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+#[0-9]+|#[0-9]+)' |
    sed -E 's/^[A-Za-z]+:?[[:space:]]+//' | sort -u | paste -sd' ' -)" || true
  if [ -n "$link" ]; then
    issue="$link"
    issue_source="PR body"
  else
    title_ref="$(field .title | grep -oE '\(#[0-9]+\)' | head -1 | tr -d '()')" || true
    if [ -n "$title_ref" ]; then
      issue="$title_ref"
      issue_source="PR title (repository unconfirmed)"
    fi
  fi
fi
if [ -n "$issue" ]; then
  printf 'issue: %s (from %s)\n' "$issue" "$issue_source"
else
  printf 'issue: none\n'
fi

other="$(git log --format=%s "${merge_base}..${head}" |
  grep -oE '\(#[0-9]+\)' | tr -d '()' | sort -u | paste -sd' ' -)" || true
[ -z "$other" ] || printf 'commit-issues: %s (informational)\n' "$other"

if [ -n "$issue" ]; then
  printf 'spec-source: issue + PR body\n'
else
  printf 'spec-source: PR body\n'
fi
