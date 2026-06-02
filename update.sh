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

printf "\n# Syncing scripts\n"
rm -rf "$ROOT/scripts"
cp -r ~/scripts \
  "$ROOT/"

printf "\n# Syncing VS Code\n"
cp ~/.config/Code/User/settings.json \
  "$ROOT/vscode/settings.json"

cp ~/.config/Code/User/keybindings.json \
  "$ROOT/vscode/keybindings.json"

code --list-extensions \
  > "$ROOT/vscode/extensions.txt"

printf "\n# Syncing KDE\n"

KDE_FILES=(
  kdeglobals
  kwinrc
  kglobalshortcutsrc
  dolphinrc
  konsolerc
)

for file in "${KDE_FILES[@]}"; do
  cp ~/.config/"$file" \
    "$ROOT/kde/"
done

printf "\n# Syncing Plasma\n"

PLASMA_FILES=(
  plasmarc
  plasmashellrc
  plasma-org.kde.plasma.desktop-appletsrc
)

for file in "${PLASMA_FILES[@]}"; do
  cp ~/.config/"$file" \
    "$ROOT/plasma/"
done

printf "\n# Syncing Konsole\n"

rm -rf "$ROOT/konsole"
cp -r ~/.local/share/konsole \
  "$ROOT/"

printf "\n# Syncing fastfetch\n"

cp -r ~/.config/fastfetch \
  "$ROOT/"

