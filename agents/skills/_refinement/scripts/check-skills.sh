#!/usr/bin/env bash
# Run it: reports drift between skill folders, AGENTS.md, refinement reports,
# and the ~/.claude/skills symlinks. Exits 1 when drift exists.
set -u
root="$(cd "$(dirname "$0")/../.." && pwd)"
links="$HOME/.claude/skills"
bad=0
say() { echo "$1"; bad=1; }

for d in "$root"/*/; do
  n=$(basename "$d")
  case "$n" in _*) continue ;; esac
  [ -f "$d/SKILL.md" ] || { say "no SKILL.md: $n"; continue; }
  grep -q "\`$n\`" "$root/AGENTS.md" || say "not in AGENTS.md: $n"
  [ -f "$root/_refinement/reports/$n.md" ] || echo "unrefined: $n"
  [ -L "$links/$n" ] || say "not linked in $links: $n"
done

for l in "$links"/*; do
  [ -L "$l" ] && [ ! -e "$l" ] && say "dangling link: $l"
done

exit $bad
