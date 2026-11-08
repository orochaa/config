---
name: to-github-review
description: >-
  Formats supplied review findings as copy-ready GitHub review comments for
  manual pasting. Use when the user explicitly invokes to-github-review on
  findings in the prompt or a Markdown file, such as a `.review.md`.
disable-model-invocation: true
---

# Convert Review Findings for GitHub

Turn review findings supplied in the prompt or in Markdown into comments that
can be inserted manually into a GitHub review.

## Workflow

1. Identify each distinct finding in the supplied source. Keep its meaning and
   supporting details while rewriting rough notes into clear, actionable
   review text. A finding is an open issue about the code under review. Skip
   items the source marks fixed, resolved, or done, plus validation logs and
   completed-cleanup lists. When a later section of the source updates an
   earlier finding, use the latest state. List skipped items, one line each,
   in a `## Skipped` section at the end of the output file.
2. Classify each finding's target from the source alone:
   - **Code target**: a path plus a line, line range, symbol, or quoted
     code. Format it as an inline comment.
   - **File target**: a path only. Format it as a general comment with
     that path.
   - **No target**: format it as a general comment with `Not specified`.
   Keep the supplied location; finding a better one is the reviewer's job.
3. Take each code target's excerpt from one source, in this order:
   1. The code quoted in the source, verbatim.
   2. The local file at the supplied location, read before quoting. Check
      the current branch with `git branch --show-current` first.
   3. Neither available: mark the excerpt `Excerpt unavailable: <supplied
      location>` and keep the comment inline.
   Include only the code needed to identify the target. A completed step 3
   leaves every excerpt copied from the source or the file, never written
   from memory.
4. Collect every mismatch: a code target whose local file is missing, or
   whose location no longer holds the code the finding describes. Format
   all other findings first. Then ask the user once, listing each mismatch
   as `<finding summary> -> <supplied location>: <what is there now>`. Per
   mismatch, apply the user's answer: use the new location, format it as a
   general comment, or drop it. The gate exits when every mismatch has an
   answer.
5. Merge repeated findings only when they describe the same underlying issue
   at the same code target. Write separate blocks for distinct targets, even
   when they share an issue. A merged finding takes the strictest source tag
   (M over S over C over W) and keeps every distinct supporting detail.
6. Tag each comment body with one MoSCoW prefix:

   | Tag | Meaning | Source signals |
   | --- | --- | --- |
   | `M:` | Must fix before merge | High, blocker, bug, security, breaks spec |
   | `S:` | Should fix; not blocking | Med, important, maintainability |
   | `C:` | Could fix; optional | Low, nit, style, optional, question |
   | `W:` | Won't fix now; noted for later | Only when the source says `W:` |

   A tag written in the source (`M:`, `S:`, `C:`, `W:`) is the user's call;
   copy it unchanged. Map other scales by the table. `W:` comes only from
   the source.
7. Present each result as a labeled Markdown block. Keep the comment body
   separate and copy-ready. Put the supplied line numbers in the `Lines`
   field only; the comment body refers to code as "the lines below" or "the
   function below", because GitHub anchors it there.
8. When a comment recommends a refactor, include a concrete code suggestion
   in a fenced code block within the comment body. Base it on the supplied
   target and available code context, and keep it focused on the suggested
   refactor. When the suggestion replaces exactly the target excerpt's lines
   and nothing else, use a ` ```suggestion ` fence so GitHub offers one-click
   apply. Otherwise use a language fence.
9. After the mismatch gate exits, save the complete Markdown output with
   `mktemp --suffix=.md "${TMPDIR:-/tmp}/github-review-XXXXXX"` (or in the
   session scratchpad directory when one is provided), then write to the
   returned path. Keep the file for the user to access. Before replying,
   check the count: findings identified = blocks written + findings merged
   away + items in `## Skipped` + mismatches dropped by the user. Reply with
   the file path and that one-line tally, for example
   `12 findings: 10 blocks (7 inline, 3 general), 1 merged, 1 skipped`.
   Leave the comments themselves in the file.

## Output format

For a finding with a code target:

### Inline review comment

**File:** `path/to/file`

**Lines:** `<supplied line or range>` or `Not specified`

**Target code:**

```text
<exact excerpt from step 3>
```

**Comment to paste:**

```text
M: <clear, actionable comment>
```

Wrap a body that holds a code suggestion (step 8) in a four-backtick outer
fence so its inner fence stays intact:

**Comment to paste:**

````text
S: This can be simplified:

```ts
const value = getValue();
```
````

For a finding with a file target or no target:

### General review comment

**File:** `<supplied path>` or `Not specified` if the source has no path

**Target code:** No code target supplied

**Comment to paste:**

```text
S: <clear, actionable comment>
```

The output is text for manual insertion. Do not connect to GitHub, create or
submit a review, or send comments through an API or browser.
