#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing KDE"

cp -r "$CONFIG"/* ~/.config/

echo "✓ kde installed"
