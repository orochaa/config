---
name: to-github-review
description: >-
  Format supplied review findings as copy-ready GitHub review comments when
  explicitly invoked with $to-github-review.
---

# Convert Review Findings for GitHub

Turn review findings supplied in the prompt or in Markdown into comments that
can be inserted manually into a GitHub review.

## Workflow

1. Identify each distinct finding in the supplied source. Keep its meaning and
   supporting details while rewriting rough notes into clear, actionable
   review text.
2. Use only file paths and code locations supplied by the source. When a
   location is supplied and the local repository is available, inspect that
   exact location to quote the relevant code as the target anchor. Do not
   search for a different location or remap the finding.
3. If a supplied path or target no longer matches the local code, stop and ask
   the user to clarify before formatting the affected findings. If no target
   was supplied, format the finding as a general review comment.
4. Assign a MoSCoW tag to each finding. Use `M:` for required fixes, `S:` for
   important fixes that are not blocking, and `C:` for optional improvements.
   Preserve an explicit `W:` label in the user-supplied source, but do not infer
   `W:`; classify other optional improvements as `C:`. Preserve explicit `M:`,
   `S:`, and `C:` source tags when they fit these categories.
5. Merge repeated findings only when they describe the same underlying issue
   at the same code target. Preserve distinct findings and targets separately.
6. Present each result as a labeled Markdown block. Keep the comment body
   separate and copy-ready. Use natural references such as “in the lines below”
   or “in the function below” when describing nearby code; do not put absolute
   line numbers in the comment body.
7. When a comment recommends a refactor, include a concrete code suggestion
   in a fenced code block within the comment body. Base it on the supplied
   target and available code context, and keep it focused on the suggested
   refactor.
8. After all findings are ready and no target needs clarification, save the
   complete Markdown output to a new temporary `.md` file. Use a unique path
   for every run so prior output is not overwritten. Keep the file for the
   user to access; report its path and do not show the comments in your
   response.

## Output format

For a finding with a supplied code target:

### Inline review comment

**File:** `path/to/file`

**Target code:**

```text
<exact excerpt from the supplied target>
```

**Comment to paste:**

```text
M: <clear, actionable comment>
```

For a comment that recommends a refactor, include the code suggestion
inside the comment body, using a nested code fence. Use a four-backtick outer
fence for the copy-ready body so its inner code fence remains intact:

**Comment to paste:**

````text
S: This can be simplified:

```ts
const value = getValue();
```
````

For a finding without a supplied target:

### General review comment

**File:** `<supplied path>` or `Not specified` if the source has no path

**Target code:** No code target supplied

**Comment to paste:**

```text
S: <clear, actionable comment>
```

Use one block per finding after same-target duplicates are merged. For findings
that share an issue but have distinct targets, write separate blocks. Include
only the code excerpts needed to identify each target.

The output is text for manual insertion. Do not connect to GitHub, create or
submit a review, or send comments through an API or browser.
