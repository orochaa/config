#!/usr/bin/env bash

set -euo pipefail

CONFIG="$(cd "$(dirname "$0")" && pwd)/config"

echo "# Installing zsh"

if ! command -v zsh >/dev/null 2>&1; then
  sudo dnf install zsh
else 
  echo "✓ zsh command already installed"
fi

cp "$CONFIG/.zshrc" ~/
cp "$CONFIG/.p10k.zsh" ~/

# Plugins

clone_if_missing() {
  local repo="$1"
  local target="$2"

  if [[ -d "$target/.git" ]]; then
    echo "✓ $target"
    return 0
  fi

  git clone "$repo" "$target"
}

clone_if_missing \
  "https://github.com/romkatv/powerlevel10k.git" \
  "$HOME/.oh-my-zsh/custom/themes/powerlevel10k"

clone_if_missing \
  "https://github.com/zsh-users/zsh-autosuggestions.git" \
  "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"

clone_if_missing \
  "https://github.com/zsh-users/zsh-syntax-highlighting.git" \
  "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"