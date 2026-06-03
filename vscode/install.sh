#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing vs code"

if ! command -v code >/dev/null 2>&1; then
  sudo dnf install code
fi

mkdir -p ~/.config/Code/User
cp "$CONFIG/settings.json" ~/.config/Code/User/settings.json
cp "$CONFIG/keybindings.json" ~/.config/Code/User/keybindings.json

# Extensions

EXPECTED="$CONFIG/extensions.txt"
CURRENT="$(mktemp)"

trap 'rm -f "$CURRENT"' EXIT

# Export current extensions
code --list-extensions | sort > "$CURRENT"

# Compare lists
if diff -q "$CURRENT" <(sort "$EXPECTED") >/dev/null; then
  echo "VS Code extensions already synchronized."
  exit 0
fi

echo "Installing missing extensions..."

xargs -r -L 1 code --log error --install-extension < "$EXPECTED"

echo "VS Code extensions synchronized."
