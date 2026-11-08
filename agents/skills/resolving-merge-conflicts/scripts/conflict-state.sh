#!/usr/bin/env bash
# Print the state of an in-progress git conflict: operation, sides,
# unmerged paths, and leftover conflict markers. Read-only and idempotent.
# Exit: 0 clean (no unmerged paths, no markers), 1 not clean, 2 error.
set -euo pipefail

usage='Usage: conflict-state.sh [--help]
Run inside a git work tree. Prints operation, sides, unmerged paths,
and conflict-marker locations. Exit 0 clean, 1 not clean, 2 error.'

fail() {
  printf 'conflict-state: %s\n' "$1" >&2
  exit 2
}

case "${1-}" in
  '') ;;
  -h | --help)
    printf '%s\n' "$usage"
    exit 0
    ;;
  *)
    printf '%s\n' "$usage" >&2
    exit 2
    ;;
esac
[ "$#" -le 1 ] || fail 'too many arguments'

git_dir=$(git rev-parse --git-dir 2>/dev/null) || fail 'not a git repository'
top=$(git rev-parse --show-toplevel 2>/dev/null) || fail 'no work tree'
cd "$top"

# One line per commit: short sha and subject. Empty when the ref is missing.
describe() {
  git log -1 --format='%h %s' "$1" 2>/dev/null || true
}

operation=none
step=''
incoming_ref=''
if [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; then
  operation=rebase
  incoming_ref=REBASE_HEAD
  for d in rebase-merge rebase-apply; do
    if [ -f "$git_dir/$d/msgnum" ] && [ -f "$git_dir/$d/end" ]; then
      step="$(cat "$git_dir/$d/msgnum")/$(cat "$git_dir/$d/end")"
    elif [ -f "$git_dir/$d/next" ] && [ -f "$git_dir/$d/last" ]; then
      step="$(cat "$git_dir/$d/next")/$(cat "$git_dir/$d/last")"
    fi
  done
elif [ -f "$git_dir/MERGE_HEAD" ]; then
  operation=merge
  incoming_ref=MERGE_HEAD
elif [ -f "$git_dir/CHERRY_PICK_HEAD" ]; then
  operation=cherry-pick
  incoming_ref=CHERRY_PICK_HEAD
elif [ -f "$git_dir/REVERT_HEAD" ]; then
  operation=revert
  incoming_ref=REVERT_HEAD
fi

printf 'operation: %s\n' "$operation"
[ -z "$step" ] || printf 'step: %s\n' "$step"
if [ "$operation" != none ]; then
  # In a rebase HEAD is the branch being rebased onto; elsewhere it is
  # the current branch. Either way it is the side already in place.
  printf 'onto: %s\n' "$(describe HEAD)"
  printf 'incoming: %s\n' "$(describe "$incoming_ref")"
fi

unmerged=$(git diff --name-only --diff-filter=U)

# Scan only files changed against HEAD (staged or not) so unrelated files
# that legitimately contain '=======' (Markdown setext headings) are skipped.
# Width 7 is git's default conflict-marker size; '|||||||' is the diff3
# base marker.
marker_re='^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)( |$)'
markers=''
if git rev-parse --verify -q HEAD >/dev/null; then
  changed=$(git diff --name-only HEAD; git diff --name-only --cached HEAD)
else
  changed=$(git diff --name-only --cached)
fi
while IFS= read -r path; do
  [ -n "$path" ] && [ -f "$path" ] || continue
  hits=$(grep -n -E "$marker_re" -- "$path" | cut -d: -f1 || true)
  for line in $hits; do
    markers+="$path:$line"$'\n'
  done
done < <(printf '%s\n' "$changed" | sort -u)

if [ -n "$unmerged" ]; then
  printf 'unmerged:\n'
  printf '%s\n' "$unmerged" | sed 's/^/  /'
fi
if [ -n "$markers" ]; then
  printf 'markers:\n'
  printf '%s' "$markers" | sed 's/^/  /'
fi

if [ -z "$unmerged" ] && [ -z "$markers" ]; then
  printf 'clean: yes\n'
  exit 0
fi
printf 'clean: no\n'
exit 1
