#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$ROOT/config"
INSTALLERS="$ROOT/installers"

TOOLS_FILE="$CONFIG/tools.txt"

install_tool() {
  local command="$1"
  local source="$2"
  local package="$3"

  if command -v "$command" >/dev/null 2>&1; then
    echo "✓ $command already installed"
    return 0
  fi

  case "$source" in
    cargo)
      echo "# Installing $command from $source"
      cargo install --locked "$package"
      ;;

    npm)
      echo "# Installing $command from $source"
      npm install --global "$package"
      ;;

    dnf)
      echo "# Installing $command from $source"
      sudo dnf install -y "$package"
      ;;

    custom)
      installer="$INSTALLERS/${package}.sh"
      if [[ ! -f "$installer" ]]; then
        echo "x Installer not found: $installer"
        exit 1
      fi
      "$installer"
      ;;

    *)
      echo "x Unknown source: $source"
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