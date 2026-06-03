#!/usr/bin/env bash

set -Eeuo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

cp ~/.config/Code/User/settings.json "$CONFIG/"
cp ~/.config/Code/User/keybindings.json "$CONFIG/"
code --list-extensions | sort > "$CONFIG/extensions.txt"

echo "✓ vs code updated"
