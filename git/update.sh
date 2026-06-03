#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

cp ~/.gitconfig "$CONFIG/.gitconfig"