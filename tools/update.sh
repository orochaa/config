#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_FILE="$ROOT/tools/config/tools.txt"
OUTPUT_FILE="$ROOT/tools.md"

mkdir -p "$(dirname "$OUTPUT_FILE")"

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

echo "✓ tools updated"
