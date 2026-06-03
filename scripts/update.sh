#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

rm -r "$CONFIG"
mkdir "$CONFIG"
cp -r ~/scripts/* "$CONFIG/"

echo "✓ scripts updated"
