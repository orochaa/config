#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

cp -r ~/.local/share/konsole/* "$CONFIG/"

echo "✓ konsole updated"
