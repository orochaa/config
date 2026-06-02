#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_FILE="$ROOT/tools/tools.txt"
OUTPUT_FILE="$ROOT/tools.md"

mkdir -p "$(dirname "$OUTPUT_FILE")"

get_description() {
  local command="$1"

  if command -v "$command" >/dev/null 2>&1; then
    "$command" --help 2>/dev/null \
      | grep -v '^$' \
      | head -n 1 \
      | sed 's/|/-/g'
  fi
}

{
  echo "# Tool Catalog"
  echo
  echo "| Command | Source | Package | Homepage |"
  echo "|---------|--------|---------|----------|"

  while IFS=: read -r command source package homepage; do
    [[ -z "${command}" ]] && continue
    [[ "${command}" =~ ^# ]] && continue

    echo "| $command | $source | $package | $homepage |"

  done < "$TOOLS_FILE"

} > "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE"