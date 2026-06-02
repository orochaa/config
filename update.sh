#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

printf "\n# Syncing git\n"
cp ~/.gitconfig \
  "$ROOT/git/.gitconfig"

printf "\n# Syncing zsh\n"
cp ~/.zshrc \
  "$ROOT/zsh/.zshrc"

cp ~/.p10k.zsh \
  "$ROOT/zsh/.p10k.zsh"

printf "\n# Syncing VS Code\n"
cp ~/.config/Code/User/settings.json \
  "$ROOT/vscode/settings.json"

cp ~/.config/Code/User/keybindings.json \
  "$ROOT/vscode/keybindings.json"

code --list-extensions \
  > "$ROOT/vscode/extensions.txt"

printf "\n# Syncing Scripts\n"
rm -rf "$ROOT/scripts"
cp -r ~/scripts \
  "$ROOT/"

printf "\n# Syncing KDE Plasma\n"

KDE_FILES=(
  kdeglobals
  dolphinrc
  konsolerc
  kglobalshortcutsrc
)

for file in "${KDE_FILES[@]}"; do
  cp ~/.config/"$file" \
    "$ROOT/kde/"
done

printf "\n# Syncing KDE Konsole\n"

rm -rf "$ROOT/konsole"
cp -r ~/.local/share/konsole \
  "$ROOT/"
