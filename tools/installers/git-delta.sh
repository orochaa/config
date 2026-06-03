if rpm -q git-delta >/dev/null 2>&1; then
  echo "✓ git-delta already installed"
  exit 0
fi

echo "# Installing git-delta"

sudo dnf install git-delta