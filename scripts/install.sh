#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing Scripts"

mkdir -p ~/scripts
cp -r "$CONFIG/"* ~/scripts

