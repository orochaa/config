#!/usr/bin/env bash

set -euo pipefail

printf "\n# Syncing git"
cp ~/.gitconfig \
  git/.gitconfig

printf "\n# Syncing zsh"
cp ~/.zshrc \
  zsh/.zshrc

cp ~/.p10k.zsh \
  zsh/.p10k.zsh

printf "\n# Syncing VS Code"
cp ~/.config/Code/User/settings.json \
  vscode/settings.json

code --list-extensions \
  > vscode/extensions.txt

printf "\n# Syncing Scripts\n"
cp -r ~/scripts .

printf "\n# Syncing Tools\n"
./tools/verify.sh
./tools/generate-doc.sh

printf "\n# Syncing KDE Plasma\n"

KDE_FILES=(
  kdeglobals
  dolphinrc
  konsolerc
  kglobalshortcutsrc
)

for file in "${KDE_FILES[@]}"; do
  cp \
    ~/.config/$file \
    kde/
done

printf "\n# Syncing KDE Konsole"
cp -r \
  ~/.local/share/konsole \
  .
