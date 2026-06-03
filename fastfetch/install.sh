#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing fastfetch"

if ! command -v fastfetch >/dev/null 2>&1; then
  sudo dnf install fastfetch
else 
  echo "✓ fastfetch command already installed"
fi

mkdir -p ~/.config/fastfetch
cp "$CONFIG/config.jsonc" ~/.config/fastfetch/
