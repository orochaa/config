#!/usr/bin/env bash

set -Eeuo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

cp ~/.zshrc "$CONFIG/"
cp ~/.p10k.zsh "$CONFIG/"