#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

"$ROOT/git/update.sh"
"$ROOT/zsh/update.sh"
"$ROOT/vscode/update.sh"
"$ROOT/fastfetch/update.sh"
"$ROOT/kde/update.sh"
"$ROOT/konsole/update.sh"
"$ROOT/plasma/update.sh"
"$ROOT/scripts/update.sh"
"$ROOT/tools/update.sh"
