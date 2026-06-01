#!/usr/bin/env bash

set -Eeuo pipefail

TOOLS_FILE="./tools/tools.txt"

install_tool() {
  local command="$1"
  local source="$2"
  local package="$3"

  if command -v "$command" >/dev/null 2>&1; then
    printf "✓ $command already installed\n"
    return 0
  fi

  printf "\n# Installing $command from $source\n"

  case "$source" in
    cargo)
      cargo install --locked "$package"
      ;;

    npm)
      npm install --global "$package"
      ;;

    dnf)
      sudo dnf install -y "$package"
      ;;

    custom)
      installer="./tools/installers/${package}.sh"
      if [[ ! -f "$installer" ]]; then
        echo "Installer not found: $installer" >&2
        exit 1
      fi
      "$installer"
      ;;

    *)
      echo "Unknown source: $source"
      exit 1
      ;;
  esac
}

while IFS=: read -r command source package homepage; do
  [[ -z "${command}" ]] && continue
  [[ "${command}" =~ ^# ]] && continue

  install_tool \
    "$command" \
    "$source" \
    "$package"

done < "$TOOLS_FILE"