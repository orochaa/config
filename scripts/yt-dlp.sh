#!/usr/bin/env bash

set -euo pipefail

ARCHIVE="downloaded.txt"

echo "========================================"
echo "        YouTube Downloader"
echo "========================================"
echo "Select an option:"
echo "[1] Best video + audio (up to 1080p)"
echo "[2] Video 720p + best audio"
echo "[3] Audio only (MP3 with thumbnail)"
echo

read -rp "Enter option (1/2/3): " option
read -rp "Paste YouTube video or playlist link: " url

case "$option" in
  1)
    yt-dlp \
      --download-archive "$ARCHIVE" \
      -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" \
      -o "%(title)s [1080p] [%(id)s].%(ext)s" \
      "$url"
    ;;
  2)
    yt-dlp \
      --download-archive "$ARCHIVE" \
      -f "bestvideo[height<=720]+bestaudio/best[height<=720]" \
      -o "%(title)s [720p] [%(id)s].%(ext)s" \
      "$url"
    ;;
  3)
    yt-dlp \
      --download-archive "$ARCHIVE" \
      -f bestaudio \
      -x \
      --audio-format mp3 \
      --embed-thumbnail \
      --add-metadata \
      -o "%(title)s [%(id)s].%(ext)s" \
      "$url"
    ;;
  *)
    echo "Invalid option. Please choose 1, 2 or 3."
    exit 1
    ;;
esac

echo
echo "Done."
read -rp "Press Enter to continue..."