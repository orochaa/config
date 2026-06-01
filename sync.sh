#!/usr/bin/env bash

set -euo pipefail

printf "\n#Syncing git"
cp ~/.gitconfig \
  git/.gitconfig

printf "\n#Syncing zsh"
cp ~/.zshrc \
  zsh/.zshrc

cp ~/.p10k.zsh \
  zsh/.p10k.zsh

printf "\n#Syncing VS Code"
cp ~/.config/Code/User/settings.json \
  vscode/settings.json

code --list-extensions \
  > vscode/extensions.txt

printf "\n#Syncing Tools\n"
cp -r ~/scripts ./scripts
./tools/verify.sh
./tools/generate-doc.sh
