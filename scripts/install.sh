#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing scripts"

mkdir -p ~/scripts
cp -r "$CONFIG/"* ~/scripts

echo "✓ scripts installed"