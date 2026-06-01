#!/usr/bin/env bash

WORK_DIR="$HOME/git/unvoid"
PERSONAL_DIR="$HOME/git/orochaa"

# Default key
KEY="$HOME/.ssh/id_ed25519_work"

# Detect folder
if [[ "$PWD" == $PERSONAL_DIR* ]]; then
    KEY="$HOME/.ssh/id_ed25519_personal"
elif [[ "$PWD" == $WORK_DIR* ]]; then
    KEY="$HOME/.ssh/id_ed25519_work"
fi

# Pass all args to ssh
exec ssh -i "$KEY" -o IdentitiesOnly=yes "$@"
