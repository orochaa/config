#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

"$ROOT/update.sh"

REPO_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel)"

if [[ "$REPO_ROOT" != "$ROOT" ]]; then
  echo "ERROR: script is not inside the expected git repository:"
  echo "Expected: $ROOT"
  echo "Actual: $REPO_ROOT"
  exit 1
fi

git -C "$ROOT" add .

if ! git diff --cached --quiet; then
  git -C "$ROOT" commit -m "sync: config"
  git -C "$ROOT" push origin
fi