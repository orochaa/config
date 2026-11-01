#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$ROOT/skills"
TARGET="$HOME/.agents/skills"

mkdir -p "$TARGET"
cp -a "$CONFIG/." "$TARGET/"

echo "✓ agent skills installed"
