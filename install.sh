#!/usr/bin/env bash

set -euo pipefail

printf "\n# Installing git\n"
sudo dnf install git

cp git/.gitconfig \
  ~/.gitconfig

./git/ssh-setup.sh

printf "\n# Installing zsh\n"
cp zsh/.zshrc \
  ~/.zshrc

cp zsh/.p10k.zsh \
  ~/.p10k.zsh

printf "\n# Installing VS Code\n"
sudo dnf install code
cp vscode/settings.json \
  ~/.config/Code/User/settings.json

cat vscode/extensions.txt \
  | xargs -L 1 code --install-extension

printf "\n# Installing Tools\n"
./tools/install.sh
cp -r ./scripts ~/

printf "\n# Installing KDE Plasma\n"
cp -r kde/* ~/.config/

printf "\n# Installing Konsole Profiles\n"

mkdir -p ~/.local/share/konsole
cp -r konsole/* ~/.local/share/konsole/