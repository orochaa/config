---
name: grill-with-docs
description:
  A relentless interview to sharpen a plan or design, which also creates docs
  (ADR's and glossary) as we go.
disable-model-invocation: true
---

Run a `/grilling` session, using the `/domain-modeling` skill.

During each grilling round, use the structured question tool (or the
closest available question/elicitation tool) to ask the user the frontier
questions when it is available. If no such tool is available, fall back to
the numbered question format required by `/grilling` and wait for the user's
answers before continuing.
