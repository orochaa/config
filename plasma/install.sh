#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

if ! command -v plasmashell >/dev/null 2>&1; then
  exit 0
fi

echo "# Installing plasma"

for file in "$CONFIG"/*; do
  install -m 644 "$file" "$HOME/.config/$(basename "$file")"
done

echo "✓ plasma installed"