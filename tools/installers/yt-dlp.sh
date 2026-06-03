if [[ -f "/usr/local/bin/yt-dlp" ]]; then
  echo "✓ yt-dlp already installed"
  exit 0
fi

echo "# Installing yt-dlp"

wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp 
sudo mv yt-dlp /usr/local/bin/yt-dlp