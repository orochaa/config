# Refinement Report: address-comments

## 1. Header

- Skill: `address-comments`
- Date: 2026-11-07
- Upstream status: **local** (not listed in `~/.agents/.skill-lock.json`); no
  `Upstream` tags.
- Phases run: 1–2.
- Files read in full:
  - `address-comments/SKILL.md` (64 lines)
  - `address-comments/agents/openai.yaml` (9 lines)
  - `address-comments/assets/local-comments.md` (49 lines)
  - `address-comments/assets/remote-pr-comments.md` (156 lines)
  - `address-comments/assets/remote-pr-comments.mjs` (503 lines)
  - `handoff/SKILL.md` (hand-off contract: `{base}.handoff.md` naming and
    template; the only skill whose output `address-comments` consumes)
  - `to-github-review/SKILL.md` (checked: produces comments for manual paste;
    no direct contract with this skill)
  - `to-agents/SKILL.md`, `to-agents/SKILL-MECHANICS.md`
  - `_refinement/platform-facts.md`, `_refinement/spec.md`
  - `~/.claude/CLAUDE.md`
- No other skill names `address-comments` (grep over `~/.agents/skills`).
- Script checks run: no-args usage (exit 2), bad archive suffix (exit 2),
  non-numeric comment ID (exit 2), missing archive (raw `ENOENT`, exit 2),
  `read-pending` on a two-thread sample archive (always returns the oldest
  pending thread and the full `commitShas` array).

## 2. Process map

```text
                 user request
                      |
          single direct action? --yes--> do only that action --> END
          (commit/reply/push)
                      | no
               identify source
          (if several: pick one)
              /                \
          local                 remote PR
   (session / handoff)              |
   read local-comments.md     read remote-pr-comments.md
          |                   confirm worktree; find PR (gh) --fail--> ask PR URL
          |                   choose archive path
          |                   archive exists? --no--> sync
          |                         | yes
          |                   "refresh comments"/"refresh commits"? --> sync
          |                         |     (report stale links -> edit-reply /
          |                         |      edit-comment per comment)
          v                         v
   +--> select next comment   read-pending --> thread null? --> COMPLETION
   |          |                     |
   |    safe fix? --no--> present options + recommendation
   |          |                     |
   |          |            approval? --unclear--> clarify (stay)
   |          |                     | yes
   |          +-----> edit, test, validate, git diff --check
   |                        |
   |          present context + fix + validation, offer commit
   |                        |
   |          approval? --unclear--> clarify (stay)
   |                  --reject/adjust--> rework same comment
   |                        | yes
   |                     commit (1 per comment)
   |                        |
   |              remote? --yes--> reply "Done [sha](link)" via helper
   |                        |           (push step: NOT STATED)
   +------------------------+
                      |
          handing to another session? --> write handoff (+archive path)
                      |
                 COMPLETION report
```

| # | Step | Inputs | Action | Outputs | Gate / exit | Failure points |
|---|------|--------|--------|---------|-------------|----------------|
| 0 | Direct-action shortcut | User request | Do only commit/reply/push | Action result | Request is a single direct action | "push" appears nowhere else; no rules for how to push (SKILL.md:10) |
| 1 | Pick source | Request, session, handoff, PR | Choose local or remote; read asset | Workflow file loaded | One source chosen | No rule for choosing among several sources (SKILL.md:31) |
| 2L | Establish local source | Session comments or handoff file | Read handoff, repo instructions, check dirty tree | Comment list | Overlapping dirty changes → stop | Handoff field list differs from `handoff` skill template |
| 2R | Establish review | Branch, `gh`, handoff | Find PR, choose archive path, sync if missing | Archive JSON | PR not found → ask URL | "stable path in the workspace" unspecified; relative script path breaks from PR worktree |
| 3 | Select comment | Local list or `read-pending` | Take one comment/thread | Active comment | `thread: null` → done | Deferred thread is returned forever (verified) |
| 4 | Classify | Comment | Safe vs. needs approval | Decision or proposal | Pre-edit approval for behavior/API/scope | "clear approval" undefined (acceptable) |
| 5 | Implement + validate | Active comment | Smallest edit, test, `git diff --check` | Diff, results | Checks run or reported | — |
| 6 | Review gate | Diff, results | Present, offer commit | Approval | Unclear → clarify; reject → step 5 | Rule restated in 4 places; drift risk |
| 7 | Commit | Approved diff | One commit per comment | Commit SHA | Commit exists | — |
| 8R | Reply | SHA, comment ID | `reply` "Done" line | Remote reply, archive update | Reply posted | No push before linking; no gate for non-"Done" replies; reply-to-reply ID |
| 9R | Refresh / stale links | User phrase | `sync` / `refresh-commits`, then edits | Stale-link report, edited comments | Report empty | `refresh-commits` identical to `sync` |
| 10 | Handoff | Session state | Write handoff (+archive path) | Handoff file | — | Own field list vs `handoff` skill |
| 11 | Completion | All above | Report | Summary | — | No explicit end condition for local loop |

## 3. Findings summary

| Severity | Count |
|----------|-------|
| High | 3 |
| Med | 9 |
| Low | 6 |
| **Total** | **18** |

## 4. Suggestions

### address-comments-01

- **ID**: address-comments-01
- **Severity**: High
- **Category**: Failure points
- **Evidence**: `assets/remote-pr-comments.md:121-125` "After the change is
  committed, reply to the specific archived comment … `Done [<commitHash>](https://github.com/<owner>/<repo>/commit/<commitHash>)`";
  no push step anywhere in the remote workflow. `SKILL.md:10-11` mentions
  "push" only as a direct action.
- **Problem**: The reply links a commit that exists only locally. GitHub
  serves a 404 for it, and the next `sync` reports the SHA as stale because it
  is not in the PR commit list (`remote-pr-comments.mjs:251-272`). The skill
  never says when to push or whether pushing needs approval, so agents either
  post dead links or push without being asked (which the Claude Code harness
  forbids by default).
- **Change**: In `assets/remote-pr-comments.md`, replace the first paragraph
  of "Reply on the remote review" (lines 121-122) with:

  ```markdown
  After the change is committed, push the branch before replying, so the
  commit link resolves. The approval that commits the change also approves
  this push; a push that is rejected (non-fast-forward, hook failure) stops
  the loop and goes to the user. Then reply to the archived comment with the
  helper, using exactly:
  ```

  And in `SKILL.md` "Shared rules", append to the approval bullet (line 50):
  "For remote PR comments, that approval also covers pushing the commit."
- **Risk**: Pushing per comment is more network traffic and exposes
  intermediate commits early; an alternative the user may prefer is "commit
  all, push once, then reply to every thread" (would add a batch-reply phase
  to the process map). Adds one node (push) between commit and reply.
- Status: implemented
- Note: User decision: implement each comment, commit it, and reply as soon as it is addressed (the reply's commit link resolves once pushed); repeat for the next thread. Push only once, at completion, when every comment is replied and the worktree is clean. The completion step pushes; a rejected push goes to the user. Do not push per thread. Note in the reply-format section that links resolve after the final push, and that a sync before that push may report the new SHAs as stale.
### address-comments-02

- **ID**: address-comments-02
- **Severity**: High
- **Category**: Failure points / Script opportunities
- **Evidence**: `assets/remote-pr-comments.md:132-133` "Reply only for
  implemented comments; leave deferred decisions and unanswered questions
  open."; `remote-pr-comments.mjs:367-375` `read-pending` returns the oldest
  thread with `pendingReply`. Verified on a sample archive: the same thread is
  returned on every call until a reply is posted.
- **Problem**: A deferred thread stays `pendingReply: true`, so `read-pending`
  keeps returning it and the loop can never reach the next thread. The agent
  must hand-parse the archive JSON to find the second thread, which the skill
  forbids ("Do not use a broad thread dump", line 92).
- **Change**: Add a `defer` / `undefer` pair and make `read-pending` skip
  deferred threads.
  - `node scripts/remote-pr-comments.mjs defer <archive.json> <comment-id> <reason>`:
    finds the thread containing the comment; sets
    `thread.deferred = { reason, at: <ISO time> }`; atomic write; prints
    `Deferred thread <threadId>.` Fails (exit 2) if the comment is absent.
    Idempotent: re-deferring overwrites the reason.
  - `undefer <archive.json> <comment-id>`: deletes `thread.deferred`; prints
    `Undeferred thread <threadId>.`
  - `read-pending`: filter `thread.pendingReply && !thread.deferred`. Add a
    top-level `deferredCount` to the output.
  - `sync`: carry `deferred` over from the existing archive by `threadId`
    when the thread is still pending (so a refresh does not undo deferrals);
    drop it when the thread is resolved or answered.
  - Doc change, `remote-pr-comments.md` after line 133: "For a deferred
    thread, run `defer` with a one-line reason so `read-pending` moves to the
    next thread. List deferred threads in the completion report."
- **Risk**: Adds archive state that is not GitHub state; `schemaVersion` stays
  1 since the field is optional. Adds a "defer" exit edge from step 4 back to
  step 3.
- Status: implemented
- Note: Approved by user.
### address-comments-03

- **ID**: address-comments-03
- **Severity**: High
- **Category**: Failure points
- **Evidence**: `assets/remote-pr-comments.md:51-52` "Run `sync` and
  `refresh-commits` from the PR's worktree … Invoke the helper by its full
  path when needed"; lines 55-64 and `remote-pr-comments.mjs:7-14,341,350,359`
  all print `node assets/remote-pr-comments.mjs …`.
- **Problem**: The helper must run with the PR worktree as cwd, so the
  relative `assets/…` path never resolves there; "when needed" is always.
  The stale-link report also prints commands that fail when copied. Each
  run costs a failed call and a path hunt.
- **Change**: After the move in address-comments-04, use one absolute form
  everywhere:
  - In `remote-pr-comments.md`, replace lines 51-52 with "Run every helper
    command from the PR's worktree, by its absolute path:" and change each
    command to `node ~/.agents/skills/address-comments/scripts/remote-pr-comments.mjs …`.
  - In the script, compute
    `const self = fileURLToPath(import.meta.url);` and build `usage` and the
    three "inspect with" hints from `node ${self} …`.
- **Risk**: Hard-codes the install location in docs; the script hint is
  location-independent. If the skill is ever installed elsewhere (e.g. Codex
  `/etc/codex/skills`), the doc path needs the `<skill-dir>` placeholder
  instead; prefer stating "`<skill-dir>` is the folder holding this file"
  if portability matters.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-04

- **ID**: address-comments-04
- **Severity**: Med
- **Category**: Script opportunities (conventions) / Platform compliance (lint 7)
- **Evidence**: `assets/remote-pr-comments.mjs`; `SKILL.md:16-21` links only
  the two `.md` assets; script is reached only through
  `remote-pr-comments.md:55`.
- **Problem**: Script conventions put scripts in `scripts/`. Lint item 7
  wants every reference file linked from `SKILL.md`; the script is two levels
  deep.
- **Change**: `git mv assets/remote-pr-comments.mjs scripts/remote-pr-comments.mjs`.
  Update every reference: `remote-pr-comments.md:55-64`, script `usage` and
  hints (see -03). Add to `SKILL.md` under the remote bullet: "The workflow
  runs [`scripts/remote-pr-comments.mjs`](scripts/remote-pr-comments.mjs);
  run it, do not read it."
- **Risk**: None beyond path churn; the spec's own pointer to this script as
  the model CLI (`_refinement/spec.md`) will go stale (cross-skill note).
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. The user's standing rule is scripts in scripts/, moving existing ones. After the commit, the main session updates _refinement/spec.md's model-CLI path.
### address-comments-05

- **ID**: address-comments-05
- **Severity**: Med
- **Category**: Duplication
- **Evidence**: The post-implementation gate appears four times:
  `SKILL.md:47-51` "For a safe change, offer to commit it … do not ask for a
  second approval after commit."; `SKILL.md:32-34` "after committing and
  replying … proceed immediately … without asking for a second approval";
  `local-comments.md:31-42`; `remote-pr-comments.md:108-117`. Within
  `local-comments.md`, lines 40-42 restate lines 33-36.
- **Problem**: One meaning in four places inflates its weight and invites
  drift (the remote copy already omits "If the user rejects the fix … repeat
  this review step").
- **Change**: Keep the single source in `SKILL.md` "Shared rules"
  (lines 43-54), adding the reject branch: "If the user rejects the fix or asks
  for an adjustment, rework only the active comment and repeat this gate."
  Delete `SKILL.md:31-34` second and third sentences (keep "If a request
  includes comments from more than one source, choose one source."). Replace
  `local-comments.md:31-42` and `remote-pr-comments.md:108-117` with one line
  each: "Then apply the review gate in the main skill's Shared rules."
- **Risk**: Workflow files lose self-containment, but `SKILL.md` is always
  loaded before them, so nothing is lost. No process-map change.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-06

- **ID**: address-comments-06
- **Severity**: Med
- **Category**: Duplication
- **Evidence**: Archive rules in `SKILL.md:23-29` ("Read the archive first.
  Fetch remote comment data only when …") restate
  `remote-pr-comments.md:15-24` and `:81-82, 90-93`. "Preserve unrelated user
  changes" at `SKILL.md:38`, `local-comments.md:17`, `remote-pr-comments.md:73`.
  Validation steps at `local-comments.md:26-29` and
  `remote-pr-comments.md:97-101` (near-identical). "Do not … fetch comments
  through a second GitHub interface" at `SKILL.md:29` and
  `remote-pr-comments.md:92-93`.
- **Problem**: Branch-only material (archive) sits in the always-read main
  file; shared material (validation) sits in both branches. Opposite of the
  disclosure rule in `to-agents/SKILL.md:79-80`.
- **Change**:
  - Delete `SKILL.md:23-29`; the remote file owns archive rules.
  - Move the validation sentence into `SKILL.md` Shared rules as one bullet:
    "Make the smallest scoped edit. Add or update a focused regression test
    when behavior changes. Run the narrowest complete validation for the
    changed package, review the diff, and run `git diff --check`. Report
    checks that could not run." Delete it from both workflow files.
  - Delete `local-comments.md:17-18` and `remote-pr-comments.md:73-74`
    preservation sentences, keeping the stop condition once in `SKILL.md:38`:
    "Preserve unrelated user changes; stop before editing when the comment's
    scope overlaps dirty user changes that cannot be isolated."
  - Keep the GitHub-interface rule only at `remote-pr-comments.md:92-93`,
    phrased positively: "Read comments only through the helper's readers."
- **Risk**: None to behavior; shrinks SKILL.md by ~7 lines.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-07

- **ID**: address-comments-07
- **Severity**: Med
- **Category**: Clarity / Platform compliance (lint 13)
- **Evidence**: `remote-pr-comments.md:95-156` ("Address one thread" and
  "Reply on the remote review") is prose across three sections; the per-thread
  loop order (edit → validate → gate → commit → push → reply → read-pending)
  must be assembled from paragraphs.
- **Problem**: The core loop has no numbered steps or checkable criteria,
  so steps (reply, re-read) are easy to skip. Lint 13 asks for numbered steps.
- **Change**: Replace both sections with one numbered loop (after -01, -02,
  -05, -06 are applied):

  ```markdown
  ## Per-thread loop

  1. `read-pending`. If `thread` is null, go to Completion in the main skill.
  2. Classify and implement under the main skill's Shared rules.
     Deferred → run `defer`, go to 1.
  3. Pass the review gate. Done when the user gave a clear approval.
  4. Commit exactly one commit for this thread. Push the branch.
  5. Reply with `reply` on the thread's `rootCommentId` (see Reply format).
     Done when the helper prints `Posted reply`.
  6. Go to 1.
  ```

  Keep "Reply format" (the `Done` line, the three outcome bullets) and
  "Rebases and stale links" (current lines 140-148) as reference sections
  below the loop.
- **Risk**: Rewrite of ~60 lines; review wording carefully in phase 4.
  Process map unchanged in shape, but now explicit.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-08

- **ID**: address-comments-08
- **Severity**: Med
- **Category**: Platform compliance (lint 3) / Failure points (triggering)
- **Evidence**: `SKILL.md:3-5` "Address review comments from the current
  session, a handoff file, or a remote pull request, one comment at a time
  with explicit approval gates." (no "Use when…"); `agents/openai.yaml:9`
  `allow_implicit_invocation: false` while `SKILL.md` has no
  `disable-model-invocation`.
- **Problem**: Lint 3 fails. Invocation also differs by platform: Codex is
  explicit-only, Claude Code is model-invoked. Either the user wants the
  agent to fire it (then Codex should allow implicit too, and the
  description needs triggers), or not (then Claude should set
  `disable-model-invocation: true` and keep a human-facing summary).
- **Change**: Ask the user which one. Default proposal (model-invoked on
  both):

  ```yaml
  description: >-
    Address code review comments one at a time with approval gates, from this
    session, a handoff file, or a GitHub pull request. Use when the user asks
    to address, fix, or reply to review comments or PR feedback.
  ```

  and `agents/openai.yaml:9` → `allow_implicit_invocation: true`.
  Alternative: add `disable-model-invocation: true` to `SKILL.md` and leave
  the yaml.
- **Risk**: Model invocation adds ~50 tokens of listing load and may trigger
  on casual "fix this comment" requests.
- Status: implemented
- Note: User decision: only when the user asks. Add disable-model-invocation: true to SKILL.md; keep allow_implicit_invocation: false in agents/openai.yaml. Description stays third person with a 'Use when…' clause (lint item 3).
### address-comments-09

- **ID**: address-comments-09
- **Severity**: Med
- **Category**: Failure points / Clarity
- **Evidence**: `remote-pr-comments.md:15-17` "If there is no handoff, use an
  existing archive for the PR or choose a stable path in the workspace.";
  `:77-79` repeats it.
- **Problem**: "existing archive for the PR" has no discovery rule, and "a
  stable path in the workspace" invites writing the archive into the repo
  tree, where it shows up as untracked and is lost to a later session that
  picks a different path (duplicate syncs).
- **Change**: Replace both passages with one deterministic rule:

  ```markdown
  Archive path: with a handoff `{base}.handoff.md`, use
  `{base}.address-comments.json` beside it. Otherwise use
  `.scratch/pr-<number>.address-comments.json` when the repository has
  `.scratch/`, else `/tmp/<repo>-pr-<number>.address-comments.json`.
  ```

  (Mirrors the directory order in `handoff/SKILL.md:37-43`.)
- **Risk**: `/tmp` is cleared on reboot; acceptable because `sync` rebuilds
  the archive.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted for handoff naming (handoff/SKILL.md step 2): the archive sits beside the handoff with the handoff's base, so sync.spec.handoff.md → sync.spec.address-comments.json; otherwise follow handoff's step 4 directory order (point to it, don't restate).
### address-comments-10

- **ID**: address-comments-10
- **Severity**: Med
- **Category**: Bottlenecks / Script opportunities
- **Evidence**: `remote-pr-comments.mjs:376-381` and `:390-396` print the
  whole `pullRequest` object, including `commitShas` (every PR commit) on
  every `read-pending` / `read-comment`; `SKILL.md:27-29` and
  `remote-pr-comments.md:87-88` tell the agent to use review summaries and
  conversation comments "as context" but no reader returns them.
- **Problem**: Token waste per thread grows with PR size; reading context
  forces a raw read of the full archive (the "broad thread dump" the skill
  rejects).
- **Change**:
  - In `readPending` and `readComment`, output
    `pullRequest: { number, url, headSha }` (drop `commitShas`).
  - Add `read-context <archive.json>`: prints
    `{ repository, pullRequest: {number,url}, reviewSummaries: [non-empty
    bodies only], conversationComments }`. Argument count validated like the
    others.
  - Doc: `remote-pr-comments.md` step 6 → "Read review summaries and PR
    conversation comments once with `read-context`; they are context only,
    never pending threads."
- **Risk**: Anyone relying on `commitShas` in reader output loses it; the
  stale check reads it from the archive file, unaffected.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-11

- **ID**: address-comments-11
- **Severity**: Med
- **Category**: Duplication / Script opportunities
- **Evidence**: `remote-pr-comments.mjs:330-332` `refreshCommits` just calls
  `sync` with another label; `remote-pr-comments.md:21-24` and `:140-142`
  describe two user phrases and two commands that do the same thing.
  `SKILL.md:25-27` repeats it.
- **Problem**: Two names for one operation cost doc lines and make the agent
  decide between them for no reason.
- **Change**: Keep `refresh-commits` as an alias in the `switch` for
  compatibility, drop it from `usage` and docs. Doc text:
  "When the user says “refresh comments” or “refresh commits”, run `sync`.
  It replaces the archive with a fresh snapshot and reports stale commit
  links in your comments."
- **Risk**: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-12

- **ID**: address-comments-12
- **Severity**: Med
- **Category**: Failure points / Clarity
- **Evidence**: `remote-pr-comments.md:150-156` "If the comment is not
  implemented, reply with a concise reason"; the only approval gate defined
  (`SKILL.md:47-51`) is about implemented changes and commits.
- **Problem**: A "won't fix" reply is a public statement on the PR with no
  gate. The agent may post it on its own judgment, or stall because no rule
  covers it.
- **Change**: Add to the outcome list in `remote-pr-comments.md`: "Show the
  reply text for a not-implemented thread and post it only after the user
  approves it." Add the same to the loop in -07 step 2 as a branch:
  "Not implementing → draft the reason, get approval, `reply`, go to 1."
- **Risk**: One more gate per declined thread; matches the skill's
  explicit-approval stance.
- Status: implemented
- Note: Approved by user.
### address-comments-13

- **ID**: address-comments-13
- **Severity**: Low
- **Category**: Failure points (script)
- **Evidence**: `remote-pr-comments.mjs:406-413` posts to
  `pulls/{n}/comments/{commentId}/replies` for any comment ID in the thread;
  `remote-pr-comments.md:121` "reply to the specific archived comment".
- **Problem**: GitHub's REST docs state replies to replies are not supported
  on this endpoint; if the agent passes the latest reply's ID (natural when
  reading the thread), the call may fail. Not verified live.
- **Change**: In `reply`, post to `thread.rootCommentId` regardless of which
  thread comment ID was supplied, and print
  `Posted reply <id> on thread <threadId>.`
- **Risk**: None; behavior on the success path is unchanged.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-14

- **ID**: address-comments-14
- **Severity**: Low
- **Category**: Clarity
- **Evidence**: `remote-pr-comments.md:125-129`
  "`Done [<commitHash>](…/commit/<commitHash>)` … Use the first eight
  characters in every visible commit hash."
- **Problem**: Same placeholder in text and URL, but "visible" suggests only
  the link text is shortened. Agents vary between short and full SHA in the
  URL.
- **Change**: Replace with
  "`Done [<sha8>](https://github.com/<owner>/<repo>/commit/<sha8>)`, where
  `<sha8>` is the first eight characters of the pushed commit's SHA."
  (The stale check accepts 7–40-char prefixes, `remote-pr-comments.mjs:261`.)
- **Risk**: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-15

- **ID**: address-comments-15
- **Severity**: Low
- **Category**: Script opportunities / Platform compliance (lint 12)
- **Evidence**: `remote-pr-comments.mjs:27` `maxBuffer: 64 * 1024 * 1024`
  and `first: 100` (lines 114, 135, 138) have no stated reason; the jq
  ID-stringify expression is defined at line 16 and repeated inline at 412
  and 444; `:457` prints "Edited reply" for `edit-comment`; `:311-320` silently
  overwrites an archive that is not valid JSON; missing archive surfaces as
  raw `ENOENT`.
- **Problem**: Lint 12 asks every constant to state its reason; small
  inaccuracies in messages.
- **Change**:
  - Comment `// 100 is GitHub's GraphQL page maximum.` and
    `// 64 MiB: paginated PR comment JSON can exceed Node's 1 MiB default.`
  - Extract `const idAsStringOne = '.id |= tostring | …'` and use it at both
    sites (derive `idAsString` from it).
  - Print `Edited ${requireReply ? 'reply' : 'comment'} …`.
  - In `loadArchive`, map `ENOENT` to
    `Archive not found: <path>. Run sync first.`
- **Risk**: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-16

- **ID**: address-comments-16
- **Severity**: Low
- **Category**: Platform compliance (lint 8)
- **Evidence**: `assets/remote-pr-comments.md` is 156 lines with no table of
  contents.
- **Problem**: Lint 8 fails. (May fall under 100 lines once -05, -06, -07,
  -11 are applied; re-check in phase 4.)
- **Change**: If still over 100 lines after other edits, add after the H1:
  "Contents: Archive · Helper · Establish the review · Per-thread loop ·
  Reply format · Rebases and stale links".
- **Risk**: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
### address-comments-17

- **ID**: address-comments-17
- **Severity**: Low
- **Category**: Duplication (CLAUDE.md) / Clarity
- **Evidence**: `SKILL.md:55-57` lists handoff contents ("affected paths,
  context, suggested changes, pending decisions, …") and
  `local-comments.md:44-49` repeats them; `handoff/SKILL.md:56-84` defines the
  handoff template. `remote-pr-comments.md:104` "Use the repository's
  conventional commit format" overlaps `~/.claude/CLAUDE.md` Git Commits.
- **Problem**: Two divergent handoff field lists (the skill's list lacks the
  `handoff` skill's append-only history). Commit-format line is a no-op where
  `CLAUDE.md` is loaded, but is needed under Codex, so keep it.
- **Change**: Replace `SKILL.md:55-58` with: "When handing work to another
  session, write a handoff in the `handoff` skill's format
  (`~/.agents/skills/handoff/SKILL.md`), listing unresolved comments and
  the next approval status in Current snapshot; for remote PRs, add the
  archive path under Key files." Delete `local-comments.md:44-49`.
- **Risk**: Couples to the `handoff` skill's file path; `handoff` is
  user-invoked so it cannot be invoked, only read.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07. Adjusted: the handoff template now has Open decisions and Key files sections — put unresolved comments and approval status in Open decisions, and the archive path in Key files (as `path` — read).
### address-comments-18

- **ID**: address-comments-18
- **Severity**: Low
- **Category**: Clarity / Embedded diagram
- **Evidence**: `SKILL.md:10-11` "do just that action and skip the per-comment
  gates" (only place "push" appears); `SKILL.md:31` "choose one source" (no
  rule); `SKILL.md:60-64` Completion has no entry condition;
  `local-comments.md:15-16` "Read repository instructions…" (default
  behavior, a no-op).
- **Problem**: Small ambiguities and a no-op. On the diagram lens: the loop
  has real gates, but after -07 the numbered loop expresses them well, so no
  embedded diagram is proposed.
- **Change**:
  - `SKILL.md:31` → "If comments come from several sources, finish the
    source the user named first, then ask before starting the next."
  - `SKILL.md:60` Completion, first line → "Complete when no pending comment
    remains (local list empty, or `read-pending` returns a null thread) or
    the user stops. Report …"
  - Delete `local-comments.md:15-16`.
- **Risk**: None.
- Status: implemented
- Note: Auto-approved as safe and small, per user instruction 2026-11-07.
## 5. Cross-skill findings

- `handoff`: the skill does not know about the `{base}.address-comments.json`
  companion archive, so a handoff refresh for a PR review may omit it. Fix:
  add one line to `handoff/SKILL.md` Key files guidance — "Include companion
  files beside the handoff (e.g. `{base}.address-comments.json`)."
- `_refinement/spec.md`: names
  `~/.agents/skills/address-comments/assets/remote-pr-comments.mjs` as the
  model Node CLI; the path goes stale if address-comments-04 moves it to
  `scripts/`.
