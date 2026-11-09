#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$ROOT/skills"

mkdir -p "$CONFIG"
rsync -a --delete --delete-excluded \
  --exclude='.git*' \
  "$HOME/.agents/skills/" "$CONFIG/"

echo "✓ agent skills updated"
