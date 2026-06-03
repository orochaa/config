#!/usr/bin/env bash

set -Eeuo pipefail

REPO="orochaa/config"
BRANCH="main"

WORKDIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORKDIR"
}

trap cleanup EXIT

printf "\n# Downloading config\n"

curl -L \
  "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" \
  -o "$WORKDIR/config.tar.gz"

printf "\n# Extracting\n"

tar -xzf \
  "$WORKDIR/config.tar.gz" \
  -C "$WORKDIR"

printf "\n# Installing\n"

cd "$WORKDIR/config-${BRANCH}"

./install.sh