if [[ -d "$HOME/.nvm" ]]; then
  echo "✓ nvm already installed"
  exit 0
fi

echo "# Installing nvm"

curl -fsSL \
  https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh \
  | bash