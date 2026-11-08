---
name: to-human
description:
  Rewrites text in clear, simplified English for a human reader. Use when an
  explanation, summary, or reply must be plain enough for someone who does not
  know the implementation.
disable-model-invocation: true
---

Rewrite for a human reader. The input is the text or topic the user names
with the invocation. When they name none, the input is your most recent
reply. Output the rewritten explanation only, in place of the original.

- When the topic is a project with a `CONTEXT.md` (or a `CONTEXT-MAP.md`
  that points to several), read the one that covers the topic. Use its
  terms for project concepts, even when an everyday word exists. Define
  each glossary term in plain words the first time you use it.
- Write for a reader who does not know the implementation.
- Use ASD-STE100 Simplified Technical English: short, direct sentences,
  common words, and active voice.
- For everything else, prefer the everyday word when it says the same
  thing.
- Lead with the main point. Then add only what the reader needs: the
  reason or effect, and a next action when they must act.
- Use one term for one idea, consistently.
- Define a technical term the first time you use it.
- When the work changed a process (a workflow, pipeline, or request path),
  write a short paragraph: what starts it, what it does, and the result.
  Follow the paragraph with a small `text` flow diagram:

  ```text
  [Starting condition]
    -> [First action]
    -> [Decision or next step]
    -> [Result]
  ```

  Replace each placeholder with the real system and action. When a data
  schema changed, name the changed fields after the diagram.

- Before finishing, re-read the draft and fix it until all hold:
  1. The first sentence states the main point.
  2. Each sentence carries one idea and stays under about 25 words.
  3. Each technical or glossary term is defined at first use.
  4. Each idea has one term throughout.
  5. Every fact the reader needs from the source is still present.
  6. A next action is stated when the reader must act.
