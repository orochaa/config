# Remote PR Comment Workflow

Use this workflow for comments on the current branch's remote pull request.
Treat each actionable inline review thread as a separate unit of work. The
agent owns review decisions and code changes. The helper owns GitHub data
transfer and archive updates.

## Contents

- Archive
- Helper
- Establish the review
- Per-thread loop
- Reply format
- Rebases and stale links
- Completion push

## Archive

The archive stores only remote pull request comment state. A handoff is
historical support; the archive is the source for remote comment state.

Archive path:

- With a handoff `{base}.handoff.md`, use `{base}.address-comments.json`
  beside it (`sync.spec.handoff.md` → `sync.spec.address-comments.json`).
- Otherwise name it `pr-<number>.address-comments.json` and choose its
  directory by the order in [`handoff/SKILL.md`](../../handoff/SKILL.md)
  (step 4).

Read the archive before any GitHub comment fetch:

- If it is missing, run `sync` to create it.
- If it exists, read the pending thread from the archive and do not sync.
- When the user says “refresh comments” or “refresh commits,” run `sync`. It
  replaces the archive with a fresh snapshot and reports stale commit links
  in your comments.

`sync` writes a complete snapshot to a temporary file and atomically replaces
the archive only after every fetch succeeds. It keeps local deferrals for
threads that are still pending. It prints status only.

The archive contains repository and PR identity, current developer login,
review summaries, PR conversation comments, and all inline review threads and
replies. Each thread carries GitHub's resolved and outdated state. Its
`pendingReply` value is true only when the thread is unresolved and its latest
message author is not the current developer. Outdated threads remain eligible
for review when they otherwise meet the pending rule.

## Helper

Run every helper command from the PR's worktree, so `gh` can resolve the pull
request, by its absolute path. `<skill>` is
`~/.agents/skills/address-comments`:

```sh
node <skill>/scripts/remote-pr-comments.mjs sync <pr-number> <archive.json>
node <skill>/scripts/remote-pr-comments.mjs read-pending <archive.json>
node <skill>/scripts/remote-pr-comments.mjs read-comment \
  <archive.json> <comment-id>
node <skill>/scripts/remote-pr-comments.mjs read-context <archive.json>
node <skill>/scripts/remote-pr-comments.mjs defer \
  <archive.json> <comment-id> <reason>
node <skill>/scripts/remote-pr-comments.mjs undefer <archive.json> <comment-id>
node <skill>/scripts/remote-pr-comments.mjs reply \
  <pr-number> <archive.json> <comment-id> <body>
node <skill>/scripts/remote-pr-comments.mjs edit-reply \
  <pr-number> <archive.json> <comment-id> <body>
node <skill>/scripts/remote-pr-comments.mjs edit-comment \
  <pr-number> <archive.json> <comment-id> <body>
```

The helper needs an authenticated `gh` CLI and an archive path ending in
`.address-comments.json`. It exits 2 with a message on stderr on any error.
`reply` always posts on the thread's top-level comment, whichever comment ID
of the thread you pass.

## Establish the review

1. Confirm the worktree and branch state under the main skill's Shared rules.
2. Identify the pull request for the current branch with `gh`. If it cannot be
   identified, ask the user for the PR URL.
3. Fix the archive path (see Archive). Run `sync` if the archive is missing.
4. Read review summaries and PR conversation comments once with
   `read-context`. They are context only, never pending threads.

Done when the archive exists and the context is read.

## Per-thread loop

1. Run `read-pending`. If `thread` is null, go to Completion push. It returns
   the oldest pending, non-deferred thread with message IDs, authors,
   timestamps, bodies, file and line context, and commit references.
2. Decide the outcome under the main skill's Shared rules. The pending rule
   picks the thread; you decide whether it is actionable.
   - Deferred (a decision the user will make later): run `defer` with a
     one-line reason, then go to 1.
   - Not implementing: draft the reply reason, post it with `reply` only after
     the user approves the text, then go to 1.
   - Implementing: continue.
3. Implement and validate under the Shared rules, then pass the review gate.
   Done when the user gave a clear approval.
4. Create exactly one commit for this thread. Keep unrelated changes out of
   it. Never rewrite, squash, or reset user commits without explicit
   permission. Do not push yet.
5. Reply with `reply` (see Reply format). Done when the helper prints
   `Posted reply`.
6. Go to 1.

Read comments only through the helper's readers.

## Reply format

Use exactly:

```text
Done [<sha8>](https://github.com/<owner>/<repo>/commit/<sha8>)
```

`<sha8>` is the first eight characters of the thread's commit SHA. The link
resolves after the Completion push; a `sync` before that push reports these
SHAs as stale, which is expected.

- If implementation matches the request, reply only with the `Done` line.
- If implementation addresses the concern but differs from the requested
  approach, add a concise reason after the `Done` line.
- If the comment is not implemented, reply with a concise reason; do not claim
  it is done.

## Rebases and stale links

`sync` checks every inline comment and reply authored by the current
developer. It reports each linked SHA missing from the PR commit list, and
each ambiguous SHA prefix, with its comment and thread IDs. It never edits
comments.

For each report, inspect the thread with `read-comment` and compare the old
SHA with local history. Choose the updated local commit that corresponds to
that comment, then use `edit-reply` for a reply or `edit-comment` for a
top-level inline comment. Use the PR head SHA only when it is that comment's
commit. Editing a body cannot move a comment's diff anchor.

## Completion push

When `read-pending` returns a null thread and the worktree is clean, push the
branch once. Every reply link resolves after this push. If the push is
rejected (non-fast-forward, hook failure), stop and report it to the user.
List deferred threads (`deferredCount` in `read-pending`) in the completion
report.
