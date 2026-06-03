#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

if ! command -v plasmashell >/dev/null 2>&1; then
  exit 0
fi

PLASMA_FILES=(
  plasmarc
  plasmashellrc
  plasma-org.kde.plasma.desktop-appletsrc
  plasma-localerc
)

for file in "${PLASMA_FILES[@]}"; do
  cp ~/.config/"$file" "$CONFIG/"
done