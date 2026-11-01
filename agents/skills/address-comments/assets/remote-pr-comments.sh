#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  remote-pr-comments.sh fetch <pr-number>
  remote-pr-comments.sh reply <pr-number> <comment-id> <body>

Fetch prints review summaries, inline review comments, and issue comments.
Reply posts a response to an inline review comment thread.
USAGE
}

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 2
fi

action="$1"
pr_number="$2"

if [[ ! "$pr_number" =~ ^[0-9]+$ ]]; then
  echo "PR number must be numeric: $pr_number" >&2
  exit 2
fi

case "$action" in
  fetch)
    if [[ $# -ne 2 ]]; then
      usage >&2
      exit 2
    fi

    repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
    for resource in reviews comments issue-comments; do
      case "$resource" in
        reviews) endpoint="pulls/$pr_number/reviews" ;;
        comments) endpoint="pulls/$pr_number/comments" ;;
        issue-comments) endpoint="issues/$pr_number/comments" ;;
      esac

      echo "=== $resource ==="
      gh api --paginate --slurp "repos/$repo/$endpoint?per_page=100"
    done
    ;;
  reply)
    if [[ $# -ne 4 ]]; then
      usage >&2
      exit 2
    fi

    comment_id="$3"
    if [[ ! "$comment_id" =~ ^[0-9]+$ ]]; then
      echo "Comment ID must be numeric: $comment_id" >&2
      exit 2
    fi

    repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
    gh api \
      --method POST \
      "repos/$repo/pulls/$pr_number/comments/$comment_id/replies" \
      -f "body=$4"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
