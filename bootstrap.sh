#!/usr/bin/env bash

set -Eeuo pipefail

REPO="orochaa/config"
BRANCH="main"

WORKDIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORKDIR"
}

trap cleanup EXIT

echo "# Downloading"

curl -L \
  "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" \
  -o "$WORKDIR/config.tar.gz"

tar -xzf \
  "$WORKDIR/config.tar.gz" \
  -C "$WORKDIR"

cd "$WORKDIR/config-${BRANCH}"

./install.sh