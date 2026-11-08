#!/usr/bin/env bash
# Verifies that edits made by to-source-comments touch only comment lines.
#
# snapshot copies the in-scope files before editing, so the user's own
# uncommitted changes form the baseline and are never blamed on the agent.
# check diffs each snapshot copy against the live file and fails on any
# changed line that is not blank or a comment line.
#
# Known limit: the check is a line regex, not a parser. A code continuation
# line that starts with `*` (for example a wrapped multiplication) is accepted
# as a comment line.
set -euo pipefail

usage='usage: comment-guard.sh snapshot <file>...
       comment-guard.sh check <snapshot-dir>'

fail() {
  printf 'comment-guard: %s\n' "$1" >&2
  exit 2
}

snapshot() {
  [ "$#" -gt 0 ] || fail "snapshot needs at least one file"$'\n'"$usage"
  for f in "$@"; do
    case "$f" in
      /*) fail "absolute path not allowed: $f" ;;
    esac
    case "/$f/" in
      */../*) fail "'..' segment not allowed: $f" ;;
    esac
    [ -f "$f" ] || fail "no such file: $f"
  done
  local dir
  dir=$(mktemp -d "${TMPDIR:-/tmp}/comment-guard.XXXXXX")
  for f in "$@"; do
    mkdir -p "$dir/$(dirname "$f")"
    cp -p "$f" "$dir/$f"
  done
  printf '%s\n' "$dir"
}

check() {
  [ "$#" -eq 1 ] || fail "check takes exactly one snapshot dir"$'\n'"$usage"
  local dir=${1%/}
  [ -d "$dir" ] || fail "no such snapshot dir: $dir"
  [ -n "$(find "$dir" -type f -print -quit)" ] || fail "snapshot dir is empty: $dir"

  local files=0 changed=0 bad=0 path rc out result
  while IFS= read -r -d '' copy; do
    path=${copy#"$dir"/}
    files=$((files + 1))
    [ -f "$path" ] || { printf '%s: file missing since snapshot\n' "$path" >&2; bad=$((bad + 1)); continue; }
    rc=0
    out=$(git diff --no-index --no-color -U0 -- "$copy" "$path") || rc=$?
    [ "$rc" -le 1 ] || fail "git diff failed for $path"
    [ -n "$out" ] || continue
    # Prints "C <n>" per allowed comment line, or "B <path>:<line>: <text>".
    result=$(printf '%s\n' "$out" | awk -v path="$path" '
      /^(---|\+\+\+) / { next }
      /^@@/ {
        split($2, o, ","); split($3, n, ",")
        old = substr(o[1], 2) + 0; new = substr(n[1], 2) + 0
        next
      }
      /^[-+]/ {
        sign = substr($0, 1, 1); text = substr($0, 2)
        line = (sign == "+") ? new++ : old++
        if (text ~ /^[ \t]*$/ || text ~ /^[ \t]*(\/\*\*.*|\*.*|\*\/|\/\/.*)[ \t]*$/) {
          print "C"
        } else {
          print "B " path ":" line ": " sign text
        }
      }
    ')
    changed=$((changed + $(printf '%s\n' "$result" | grep -c '^C' || true)))
    while IFS= read -r v; do
      printf '%s\n' "${v#B }" >&2
      bad=$((bad + 1))
    done < <(printf '%s\n' "$result" | grep '^B ' || true)
  done < <(find "$dir" -type f -print0)

  if [ "$bad" -gt 0 ]; then
    printf 'fail: %d non-comment lines changed\n' "$bad" >&2
    exit 1
  fi
  printf 'ok: %d files, %d comment lines changed\n' "$files" "$changed"
}

[ "$#" -gt 0 ] || fail "$usage"
cmd=$1
shift
case "$cmd" in
  snapshot) snapshot "$@" ;;
  check) check "$@" ;;
  *) fail "unknown command: $cmd"$'\n'"$usage" ;;
esac
