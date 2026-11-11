---
name: to-quick-ticket
description:
  Turns main requirements into one quick, shallow GitHub ticket with a
  description, goal, acceptance criteria, and key files. Use when the user says
  "quick ticket" (e.g. "create a quick ticket for ...").
---

Write one **shallow** ticket: the high-level definition and the minimum
guidance to start the task. A shallow ticket holds the _what_ and _why_;
implementation, architecture, and edge cases belong to the implementer.

The input is the main requirements, from the prompt. Publishing runs through
`to-github`.

## Steps

1. **Orient.** Locate the key files for the requirements: the entry point,
   the contract it touches, the nearest existing pattern, and existing tests.
   Use `CONTEXT.md` vocabulary. Read only enough to name each file's role.
   Done when each key file (about 5 at most) is a confirmed existing path.
2. **Ask once.** Send one AskUserQuestion call of up to 3 questions: the
   goal, what is out of scope, and which requirements are the minimum
   acceptance criteria. Put a recommendation first in each, drawn from the
   input and the code. Done when the call is answered.
3. **Draft.** Fill the template below into `<dir>/<slug>.md`, with `<dir>`
   from `mktemp -d`. Print the file's full path; this file is the preview and
   the user may edit it. Done when the file exists and its path is printed.
4. **Publish.** Wait for the user to say the draft is ready, then invoke
   `to-github` with the file. Its preview gate is the only approval.

One ticket per run. When the input holds several independent tasks, say so
and ask which one to write.

## Template

```markdown
# <Sentence-case title naming the outcome>

## Description

<What this is about and why it matters.>

## Goal / Outcome

<What is true when this is done.>

## Acceptance criteria

- [ ] <Observable minimum requirement from the input.>

## Context / Notes

- `<path>` — <one-line role>
- <Link, constraint, or idea that helps the start.>
```

- Keep the headings exactly as shown.
- Write one criterion per minimum requirement; with none stated, derive one
  from the Goal.
- List key files as code-span paths so `to-github` links them.
- Keep prose to the problem, outcome, and starting points.
