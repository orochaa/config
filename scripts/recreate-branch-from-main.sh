#!/usr/bin/env bash
set -euo pipefail

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Sanitize branch name for patch file (replace / with _)
SAFE_BRANCH_NAME=${CURRENT_BRANCH//\//-}
PATCH_FILE="/tmp/${SAFE_BRANCH_NAME}.patch"

echo "📌 Current branch: $CURRENT_BRANCH"

# Prevent running on main
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo "❌ You are on main branch. Please run this script on a feature branch."
  exit 1
fi

# Determine which remote has main branch
REMOTE=$(git remote)
REMOTE_NAME=""
for r in $REMOTE; do
  if git ls-remote --heads "$r" main >/dev/null 2>&1; then
    REMOTE_NAME=$r
    break
  fi
done

if [[ -z "$REMOTE_NAME" ]]; then
  echo "❌ Could not find a remote with main branch."
  exit 1
fi

echo "🌐 Using remote '$REMOTE_NAME' for main branch"

# Stash uncommitted changes first
echo "💾 Stashing uncommitted changes..."
git add -A
git stash push -m "temp-stash-for-${CURRENT_BRANCH}" || true

# Create patch comparing current branch to main
echo "📝 Creating patch at $PATCH_FILE"
git fetch $REMOTE_NAME
git diff $REMOTE/main..$CURRENT_BRANCH > "$PATCH_FILE"

# Update local main branch
echo "🔄 Updating main branch..."
git checkout main
git pull $REMOTE_NAME main

# Delete old branch
echo "🗑️ Deleting branch $CURRENT_BRANCH"
git branch -D "$CURRENT_BRANCH"

# Recreate branch from main
echo "🌱 Recreating branch $CURRENT_BRANCH from main"
git checkout -b "$CURRENT_BRANCH"

# Apply patch
echo "📥 Applying patch"
git apply "$PATCH_FILE" || {
  echo "⚠️ Patch did not apply cleanly. Trying 3-way merge..."
  git apply --3way "$PATCH_FILE"
}

# Restore stashed changes
if git stash list | grep -q "temp-stash-for-${CURRENT_BRANCH}"; then
  echo "♻️ Restoring stashed changes..."
  git stash pop || true
fi

echo "✅ Branch $CURRENT_BRANCH recreated from main and patch applied successfully!"
