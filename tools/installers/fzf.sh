if command -v fzf >/dev/null 2>&1; then
  echo "✓ fzf already installed"
  exit 0
fi

echo "# Installing fzf"

git clone --depth 1 \
  https://github.com/junegunn/fzf.git \
  ~/.fzf

~/.fzf/install