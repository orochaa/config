#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$ROOT/skills"

mkdir -p "$CONFIG"
cp -a "$HOME/.agents/skills/." "$CONFIG/"

echo "✓ agent skills updated"
