#!/usr/bin/env bash
set -e

WORK_DIR="$HOME/git/unvoid"
PERSONAL_DIR="$HOME/git/orochaa"

function test_dir() {
  local label=$1
  local dir=$2

  echo "===== Testing $label ====="

  # Test at root
  if [ -d "$dir" ]; then
    echo "$dir"
    (cd "$dir" && \
      echo "Git user.name: $(git config user.name || echo '(not set)')" && \
      echo "Git user.email: $(git config user.email || echo '(not set)')" && \
      ssh -T git@github.com || true
    )

    echo ""

    # Test first repo if exists
    first_repo=$(find "$dir" -maxdepth 1 -type d ! -path "$dir" | head -n 1)
    if [ -n "$first_repo" ]; then
      echo "$first_repo"
      (cd "$first_repo" && \
        echo "Git user.name: $(git config user.name || echo '(not set)')" && \
        echo "Git user.email: $(git config user.email || echo '(not set)')" && \
        ssh -T git@github.com || true
      )
    else
      echo "No repos found inside $dir"
    fi
  else
    echo "Directory $dir does not exist"
  fi

  echo ""
  echo ""
}

# Run tests
test_dir "WORK" "$WORK_DIR"
test_dir "PERSONAL" "$PERSONAL_DIR"
