---
name: to-github
description: >-
  Publishes local specs and tickets as GitHub issues, or refreshes the issues
  already published from them, rewriting local links to remote ones and
  mapping umbrellas to sub-issues. Use when the user says "publish to github"
  or "refresh the issues on github".
---

# To GitHub

Map local specs and tickets onto GitHub issues. The local file is the source;
the issue is its published copy.

## Guardrails

- The source files are read-only. Every rendered body goes to a
  `<base>.remote.md` in a `remote/` directory, never beside its source:
  - Workstream (`.scratch/<slug>/`): `<slug>/remote/`. Ticket
    `issues/01-x.md` → `remote/01-x.remote.md`. The spec gets a `00-` prefix
    and keeps its full name: `<slug>.spec.md` →
    `remote/00-<slug>.spec.remote.md`.
  - Standalone item outside a workstream: `remote/` beside the source
    (`notes/feature.md` → `notes/remote/feature.remote.md`).
- On the remote, write only issues and their relationships. Labels,
  milestones, issue types, and projects are used only when they already
  exist; when one you need is missing, stop and ask the user.
- Nothing reaches GitHub before the preview gate (step 6) is approved.
- Local and remote metadata serve different readers: local status guides
  agents, remote labels guide the company and developers. Keep them apart.

Use the `gh` CLI for every GitHub call.

## 1. Parse the request

From the user's prompt, settle:

- **Verb**: `create` or `refresh`.
- **Sources**: one or more local files or workstream directories.
- **Remote refs** (refresh): the issue for each source, as `#N` or a URL.
- **Repo**: the issue repository, when given.

Ask for anything still missing after step 2. Done when the verb and every
source path are known and each path exists.

## 2. Resolve the remote

Read the `## GitHub remote` section of `docs/agents/issue-tracker.md` at the
root of the source's repository (`git -C <source-dir> rev-parse
--show-toplevel`):

```markdown
## GitHub remote

- Issues: <owner/repo>
- Code links: <owner/repo>@<branch>
```

- **Issues**: the section, else the repo from the prompt, else ask.
- **Code links**: one line per repository that linked files live in. A repo
  is the file's own `git remote get-url origin`. A missing branch comes from
  `gh repo view <repo> --json defaultBranchRef -q .defaultBranchRef.name`.

Write every value you resolved outside the section into it: create the
section, or the file, when missing, and leave the rest of the file as it is.
**Defaults**: read the `## GitHub defaults` section of the same file. Its
lists are ordered, and the first value leads:

```markdown
## GitHub defaults

Ordered options for the issue fields; the first is the default.

- Assignees: <login>, <login>
- Milestones: <title>, <title>
- Types: <name>, <name>
```

- **Section missing**: ask the user for the three lists with
  AskUserQuestion, assuming no values for this repo, then write the section.
- **Verify** every listed value against the issues repo:
  - milestone: `gh api repos/<repo>/milestones --jq '.[].title'`
  - type: `gh api orgs/<owner>/issue-types --jq '.[].name'`
  - assignee: `gh api repos/<repo>/assignees/<login>` (exit 0 is assignable)
- **A value fails**: stop and ask the user before going on.

Done when the issue repo and every code repo's branch are known and
registered, and every listed default is verified.

## 3. Collect the items

- A workstream directory, or a spec with an `issues/` folder beside it, is an
  **umbrella**: the spec is the parent issue, and each `issues/NN-*.md` is a
  sub-issue. Skip `*.handoff.md`, `*.review.md`, and anything in `remote/`.
- Any other file is a standalone item.

For each item, read its `.remote.md` in the `remote/` directory when it exists
(see Guardrails); its front matter
`remote:` is the item's known issue. Done when every item has a role (parent,
sub-issue, standalone) and its known issue, or none.

## 4. Match each item to its issue

**Normalized title**: lowercase, then strip a leading `NN —` / `NN -`,
punctuation, and repeated whitespace. Compare the source H1 with the issue
title.

- **create**: an item with a known issue switches to refresh; flag it at the
  gate, and create a duplicate only when the user confirms.
- **refresh**: take the remote ref from the prompt, else `remote:`. When the
  titles differ, search that issue's sub-issues, parent, and issues linked
  from its body for a match. Still no match: ask the user.
- **Remote edits**: when `.remote.md` exists, diff its body against the
  current issue body (`gh issue view <n> -R <repo> --json body`). A
  difference means someone edited the issue on GitHub; keep the diff for the
  gate.
- **Drift** (umbrella refresh): a local ticket with no issue, or a remote
  sub-issue with no local file. Keep each for a per-item decision at the
  gate.

Done when every item is matched, marked new, or queued for the user.

## 5. Render

Build each body in memory from the source; the source file stays untouched.

1. **Title**: the H1 with its leading `NN` counter (and any `—`/`-` after it)
   dropped, so `1 Data Import: …` becomes `Data Import: …`. Keep any leading
   emoji marker the remote title already carries (such as `☂️` on an umbrella),
   and add it to the local title when the source H1 lacks it. Drop the H1 from
   the body.
2. **Header**: everything before the `## TL;DR` heading becomes a bullet list,
   one `- ` item per paragraph, with list items under their paragraph indented
   beneath it. Drop the `**Status:**` line; keep every other field. Rewrite each
   `**Blocked by:**` reference to its bare `#N`, with no title after it.
3. **Links**: resolve each Markdown link, and each code span holding a path,
   against the source directory, then the repository root. Classify each:
   - **Local issue**: a source in this run, or a file with a `.remote.md`.
     Write `#N`, or `owner/repo#N` when the repos differ. An issue this run
     will create gets the placeholder `#new:<base>`. Replace the whole link,
     label included: never keep the linked title as plain text. When one
     sentence cites the same issue twice, keep one `#N` (`#N and #N` becomes
     `#N`).
   - **Remote file**: tracked and present on the code-link branch
     (`git fetch origin <branch>` once, then `git cat-file -e
     origin/<branch>:<path>`). Write
     `https://github.com/<owner/repo>/blob/<branch>/<path>` (`/tree/` for a
     directory). A code span becomes a link whose text is that code span.
   - **Dead**: ignored, untracked, unpushed, or outside any repository. Write
     the link text with the path in a code span, and flag it at the gate.
4. **Unwrap**: pipe the body through
   `npx --yes prettier@3 --parser markdown --prose-wrap never
   --embedded-language-formatting off`.
5. **Save** the `.remote.md` in its `remote/` directory (see Guardrails):
   front matter, then the exact body.

   ```markdown
   ---
   remote: https://github.com/<owner/repo>/issues/<n>
   synced: <ISO 8601 timestamp of the last publish>
   ---
   ```

   Keep existing values; new items leave both empty until step 7.

**Labels** (create only): list the remote's labels with `gh label list -R
<repo> --json name,description`. Pick those whose description fits the
issue. Local status never maps to a label.

Done when every item has a saved `.remote.md` and every link is classified.

## 6. Preview gate

Show one plan:

- Each item: create or refresh `#N`, title, labels, milestone, type,
  assignee, parent, blockers.
- Remote edits, as diffs.
- Drift items, each with its options: create or skip a missing issue;
  unlink or keep an orphan sub-issue.
- Dead links, with source path and line.
- Every `.remote.md` path, for inspection.

The gate exits when the user approves the plan and has decided every remote
edit and drift item. Revise and re-render on any change.

**Fields**: the first round asks the three run-wide questions, which every
item inherits (umbrella parent and sub-issues alike):

- **Milestone** and **type**: the verified defaults in listed order, with the
  recommended option inferred from the item's content (a defect report leads
  with `Bug`). Without a signal, the first listed value leads.
- **Assignee**: one choice from the verified defaults, the first listed value
  recommended.
- **Custom**: the fourth option, `Other`, takes a value typed by the user.
  Verify it with the commands from step 2. On failure, re-ask with GitHub's
  reason. A verified custom value serves this run only; the defaults section
  stays as written.
- **Override**: after the plan lists each item's fields, ask whether any item
  takes other values, then verify them the same way.
- **Refresh**: for each item whose issue already holds a milestone, type, or
  assignee, show the current value next to the chosen one and ask whether to
  overwrite. Untouched fields stay as they are.

Guide the user through each decision with the AskUserQuestion tool: one
decision per question, the recommended option first and labelled
"(Recommended)", and the current facts stated in the question text. Send the
questions in rounds of up to 4 per AskUserQuestion call, in order (for
example: remote edits, then title changes, then dead or planned links). Ask
every remaining question across rounds before changing any file; once all are
answered, apply the answers to the files and re-render. Close with a final
publish or hold question. Do not batch decisions into a prose list the user
must answer in free text.

## 7. Publish

1. Create new issues in dependency order, parent first:
   `gh issue create -R <repo> --title <title> --body-file <body>
   [--label <name>]... [--milestone <title>] [--assignee <login>]`, then set
   the type: `gh api -X PATCH repos/<repo>/issues/<n> -f type=<name>`.
   Refresh matched issues with `gh issue edit -R <repo> --title <title>
   --body-file <body>`. Pass a body file holding the
   body without front matter. A refresh edits a field only where the user
   approved the overwrite: `--milestone <title>`, `--add-assignee`,
   `--remove-assignee`, and the same `type` call.
2. Look up each issue's database `id`, which relationship endpoints take
   instead of the number: `gh api repos/<repo>/issues/<n> --jq .id`.
3. Sync relationships to the local umbrella:
   - Sub-issue: `gh api -X POST repos/<repo>/issues/<parent>/sub_issues -F
     sub_issue_id=<id>`; unlink with `-X DELETE .../sub_issue`.
   - Blocker: `gh api -X POST
     repos/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<id>`;
     remove with `-X DELETE .../blocked_by/<id>`.
   - Unlink only what the user chose at the gate.
4. Replace every `#new:<base>` placeholder with its new number, and edit each
   issue whose body changed.
5. Write `remote:` and `synced:` into each `.remote.md`.

Done when every approved item exists remotely with its relationships and
every placeholder is resolved. On a failed call, stop and report what was
written so far; never retry a create blindly, since it duplicates the issue.

## 8. Verify

For each item, fetch the issue's title and body and compare them with its
`.remote.md`, and its milestone, type, and assignee with the approved
choices. Fix and recheck until all match. Then reply with each issue URL
and one tally line, for example `5 issues: 3 created, 2 refreshed, 4
sub-issues, 3 blockers, 2 dead links`.
