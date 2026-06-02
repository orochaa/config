#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_DIR="$HOME/.ssh"

WORK_KEY="$SSH_DIR/id_ed25519_work"
PERSONAL_KEY="$SSH_DIR/id_ed25519_personal"

WORK_CONFIG="$HOME/.gitconfig-unvoid"
PERSONAL_CONFIG="$HOME/.gitconfig-personal"

WORK_NAME="Bruno Rocha"
WORK_EMAIL="bruno.rocha@unvoid.com"

PERSONAL_NAME="Bruno Rocha"
PERSONAL_EMAIL="brunorocha2674@gmail.com"

echo "== Creating ~/.ssh =="
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

echo
echo "== Generating SSH keys =="

if [ ! -f "$WORK_KEY" ]; then
  ssh-keygen \
    -t ed25519 \
    -C "$WORK_EMAIL" \
    -f "$WORK_KEY" \
    -N ""
else
  echo "Work key already exists"
fi

if [ ! -f "$PERSONAL_KEY" ]; then
  ssh-keygen \
    -t ed25519 \
    -C "$PERSONAL_EMAIL" \
    -f "$PERSONAL_KEY" \
    -N ""
else
  echo "Personal key already exists"
fi

echo
echo "== Starting ssh-agent =="

if ! pgrep -u "$USER" ssh-agent >/dev/null; then
  eval "$(ssh-agent -s)"
fi

echo
echo "== Loading SSH keys =="

ssh-add "$WORK_KEY" || true
ssh-add "$PERSONAL_KEY" || true

echo
echo "== Creating profile configs =="

cat > "$WORK_CONFIG" <<EOF
[user]
    name = $WORK_NAME
    email = $WORK_EMAIL
EOF

cat > "$PERSONAL_CONFIG" <<EOF
[user]
    name = $PERSONAL_NAME
    email = $PERSONAL_EMAIL
EOF

echo
echo "== Configuring includeIf rules =="

git config --global includeIf.gitdir:"$HOME/git/unvoid/**".path "$WORK_CONFIG"
git config --global includeIf.gitdir:"$HOME/git/orochaa/**".path "$PERSONAL_CONFIG"

echo
echo "== Public keys =="
echo

echo "WORK:"
echo
cat "${WORK_KEY}.pub"

echo
echo

echo "PERSONAL:"
echo
cat "${PERSONAL_KEY}.pub"

echo
echo "========================================"
echo "Add WORK key to your Unvoid GitHub account"
echo "Add PERSONAL key to your Personal GitHub account"
echo "========================================"

echo
echo "Verification:"
echo

echo "Work fingerprint:"
ssh-keygen -lf "${WORK_KEY}.pub"

echo
echo "Personal fingerprint:"
ssh-keygen -lf "${PERSONAL_KEY}.pub"

echo
git config --global core.sshCommand \
  "$ROOT/git/ssh-proxy.sh"