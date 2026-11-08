---
name: grill-with-docs
description:
  Grills a plan or design relentlessly, writing CONTEXT.md terms and ADRs as
  decisions settle. Use when stress-testing a design whose domain language and
  hard-to-reverse decisions should be recorded.
disable-model-invocation: true
---

Run a `grilling` session with the `domain-modeling` skill: invoke both
before the first round.

Writing glossary terms and ADRs is part of the session, not acting on its
outcome. Write each term to `CONTEXT.md` the moment it resolves. Put each
ADR offer to the user as a question in the next round, and write the ADR
when they accept.

The session is done when grilling's frontier is empty, every term resolved
in the session is in `CONTEXT.md`, and every decision passing the ADR test
was offered. Before asking the user to confirm shared understanding, list
the terms written and the ADRs created or declined.
