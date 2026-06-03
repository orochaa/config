#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

cp -r ~/.config/fastfetch/config.jsonc "$CONFIG/config.jsonc" 

echo "✓ fastfetch updated"