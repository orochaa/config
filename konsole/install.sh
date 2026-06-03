#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing konsole"

mkdir -p ~/.local/share/konsole
cp -r "$CONFIG/"* ~/.local/share/konsole/