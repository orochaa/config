#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

printf "\n# Installing dnf packages\n"
sudo dnf install -y git zsh code jetbrains-mono-fonts.noarch

printf "\n# Installing git\n"
cp "$ROOT/git/.gitconfig" \
  ~/.gitconfig

"$ROOT/git/ssh-setup.sh"

printf "\n# Installing zsh\n"
cp "$ROOT/zsh/.zshrc" \
  ~/.zshrc

git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" || true

cp "$ROOT/zsh/.p10k.zsh" \
  ~/.p10k.zsh

printf "\n# Installing VS Code\n"
mkdir -p ~/.config/Code/User

cp "$ROOT/vscode/settings.json" \
  ~/.config/Code/User/settings.json

cp "$ROOT/vscode/keybindings.json" \
  ~/.config/Code/User/keybindings.json

cat "$ROOT/vscode/extensions.txt" \
  | xargs -L 1 code --log error --install-extension

printf "\n# Installing Tools\n"
"$ROOT/tools/install.sh"

cp -r "$ROOT/scripts" \
  ~/

printf "\n# Installing KDE Plasma\n"
cp -r "$ROOT/kde/"* \
  ~/.config/

printf "\n# Installing Konsole Profiles\n"

mkdir -p ~/.local/share/konsole

cp -r "$ROOT/konsole/"* \
  ~/.local/share/konsole/
