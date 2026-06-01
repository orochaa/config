#!/usr/bin/env bash

set -euo pipefail

printf "\n# Installing git\n"
cp git/.gitconfig \
  ~/.gitconfig

chmod +x git/ssh-setup.sh
./git/ssh-setup.sh

printf "\n# Installing zsh\n"
cp zsh/.zshrc \
  ~/.zshrc

cp zsh/.p10k.zsh \
  ~/.p10k.zsh

printf "\n# Installing VS Code\n"
cp vscode/settings.json \
  ~/.config/Code/User/settings.json

cat vscode/extensions.txt \
  | xargs -L 1 code --install-extension

printf "\n# Installing Tools\n"
./tools/install.sh
cp -r ./scripts ~/scripts

