#!/usr/bin/env bash

set -Eeuo pipefail

TOOLS_FILE="tools/tools.txt"

while IFS=: read -r command source package homepage; do
  [[ -z "${command}" ]] && continue
  [[ "${command}" =~ ^# ]] && continue

  if command -v "$command" >/dev/null 2>&1; then
    printf "✓ $command already installed\n"
  else
    printf "✗ $command missing\n"
  fi

done < "$TOOLS_FILE"
