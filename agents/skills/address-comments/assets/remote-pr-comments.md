# Remote PR Comment Workflow

Use this workflow for comments on the current branch's remote pull request.
Treat each actionable comment as a separate unit of work.

## GitHub CLI helper

Use the bundled helper to fetch the complete PR conversation and reply to inline
review comments without repeating REST API paths:

```sh
assets/remote-pr-comments.sh fetch <pr-number>
assets/remote-pr-comments.sh reply <pr-number> <comment-id> <body>
```

Run these from the skill directory, or invoke the script by its full path. The
fetch command includes review summaries, inline review comments, and issue
comments, with pagination.

## Establish the review

1. Confirm the worktree and branch state. Preserve unrelated user changes and
   stop before mutating a dirty overlapping scope.
2. Identify the pull request for the current branch with the available remote
   repository tool. If it cannot be identified, ask the user for the PR URL.
3. Read repository instructions, applicable package guidance, and any
   specification or documentation needed to understand the comments.
4. Fetch the complete review conversation, including inline comments, replies,
   review summaries, and issue comments. Ignore deployment noise and comments
   already resolved unless they contain a new actionable request.

## Address one comment

Apply the shared classification rules in the main skill. Select one active
comment and handle it fully before analyzing or acting on another comment.

Work on only the active comment. Never edit, test, commit, or reply to multiple
comments concurrently. Make the smallest scoped edit. Add or update a
focused regression test when the change affects behavior. Run the narrowest
complete validation for the changed package, review the diff, and run
`git diff --check`. Report checks that could not run.

Create exactly one commit for the review change before moving to another
comment. Use a conventional prefix with a capitalized description, for example
`fix: Handle expired subscription`. Keep unrelated changes out of the commit.
Never rewrite, squash, or reset user commits without explicit permission.

After implementing the active comment, present its context, the fix, and
validation results. For a safe change, offer to commit it. For a change that
needed approval before editing, request approval of the implemented change and
offer to commit it in that same request. A clear approval commits the current
change; then reply on the original thread and proceed immediately to the next
active comment without asking for a second approval. If the response is unclear,
clarify without committing or proceeding. If the user rejects the fix or
requests an adjustment, continue only on the active comment, amend or follow up
as appropriate without combining other comments, update the thread reply if
needed, and repeat this review step.

Approval before editing authorizes only the specific decision described. It
does not authorize another comment. Approval of the implemented change and its
commit authorizes moving to the next comment.

## Reply on the remote review

After a change is committed, reply to the specific inline comment with exactly:

```text
Done [<commitHash>](https://github.com/<owner>/<repo>/commit/<commitHash>)
```

Use the final commit hash, not a pre-rebase hash. If a reply already exists and
the branch was rebased, edit that reply in place to point to the new commit URL
instead of adding a duplicate. Reply only for implemented comments; leave
deferred decisions and unanswered questions open.

Prefer the repository's connected remote-review tool. When GitHub CLI access is
the available interface, use the pull-request review-comment endpoints and
reply with `in_reply_to` so the response stays in the original thread.

For every actionable review comment, report the outcome on the original thread:

- If implementation matches the request, reply only with the `Done` line above,
  using the first eight characters of the commit hash in every visible comment.
- If implementation addresses the concern but differs from the requested
  approach, include the `Done` line followed by a concise reason. Use only the
  first eight characters of the commit hash in every visible comment.
- If the comment is not implemented, reply with a concise reason; do not claim
  it is done.
