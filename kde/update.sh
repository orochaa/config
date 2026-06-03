#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

KDE_FILES=(
  kdeglobals
  kwinrc
  kglobalshortcutsrc
  dolphinrc
  konsolerc
)

for file in "${KDE_FILES[@]}"; do
  cp ~/.config/"$file" "$CONFIG/"
done

echo "✓ kde updated"
