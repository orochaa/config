#!/usr/bin/env bash

set -Eeuo pipefail

TOOLS_FILE="tools/tools.txt"

while IFS=: read -r command source package homepage; do
  [[ -z "${command}" ]] && continue
  [[ "${command}" =~ ^# ]] && continue

  if ! command -v "$command" >/dev/null 2>&1; then
    printf "\n✗ $command missing\n"
    continue
  fi

  printf "\n# Updating $command from $source\n"

  case "$source" in
    cargo)
      cargo install --locked "$package"
      ;;

    npm)
      npm update --global "$package"
      ;;

    dnf)
      sudo dnf upgrade -y "$package"
      ;;

    custom)
      installer="./tools/installers/${package}.sh"
      if [[ ! -f "$installer" ]]; then
        echo "Installer not found: $installer" >&2
        exit 1
      fi
      "$installer"
      ;;

  esac

done < "$TOOLS_FILE"