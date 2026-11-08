#!/usr/bin/env bash
# Resolve the spec, handoff, scoped sub-handoffs, and tasks of a grilling
# directory. Read-only: it writes nothing, so reruns are safe.
set -euo pipefail

usage='Usage: resolve-inputs.sh <dir>

Prints one "kind: path" line per input. Exit 2 on usage error or no spec.'

fail() {
  printf '%s\n' "$1" >&2
  exit 2
}

[ "$#" -eq 1 ] || fail "$usage"
[ -d "$1" ] || fail "not a directory: $1"$'\n'"$usage"

dir=${1%/}
base=$(basename "$(realpath "$1")")

if [ -f "$dir/$base.spec.md" ]; then
  spec="$dir/$base.spec.md"
  if [ -f "$dir/$base.md" ]; then
    printf 'note: using %s.spec.md; ignoring %s.md\n' "$base" "$base" >&2
  fi
elif [ -f "$dir/$base.md" ]; then
  spec="$dir/$base.md"
else
  fail "no spec: expected $dir/$base.spec.md or $dir/$base.md"
fi
printf 'spec: %s\n' "$spec"

# Handoff naming follows handoff/SKILL.md step 2: replace the spec's .md
# with .handoff.md.
root=${spec%.md}
handoff="$root.handoff.md"
if [ -f "$handoff" ]; then
  printf 'handoff: %s (exists)\n' "$handoff"
else
  printf 'handoff: %s (missing)\n' "$handoff"
fi

# Scoped sub-handoffs follow handoff/SKILL.md step 5: <root>.<scope>.handoff.md.
shopt -s nullglob
for f in "$root".*.handoff.md; do
  [ "$f" = "$handoff" ] && continue
  # With spec <base>.md, <base>.spec.*.handoff.md belongs to another root.
  case "$spec" in
    *.spec.md) ;;
    *) case "$f" in "$root".spec.*) continue ;; esac ;;
  esac
  printf 'subhandoff: %s\n' "$f"
done

tasks=()
for f in "$dir"/issues/[0-9][0-9]-*.md; do
  case "$f" in
    *.handoff.md | *.review.md) ;;
    *) tasks+=("$f") ;;
  esac
done
if [ "${#tasks[@]}" -eq 0 ]; then
  printf 'tasks: none\n'
else
  # C collation keeps NN order independent of the user's locale.
  printf '%s\n' "${tasks[@]}" | LC_ALL=C sort | sed 's/^/task: /'
fi
