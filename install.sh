#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

"$ROOT/git/install.sh"
"$ROOT/zsh/install.sh"
"$ROOT/vscode/install.sh"
"$ROOT/fastfetch/install.sh"
"$ROOT/kde/install.sh"
"$ROOT/konsole/install.sh"
"$ROOT/plasma/install.sh"
"$ROOT/scripts/install.sh"
"$ROOT/tools/install.sh"