---
name: to-human
description: Write clear, simplified English for people.
disable-model-invocation: true
---

- Read `CONTEXT.md` before writing when the explanation concerns a project that
  has one. Use its terms for project concepts.
- Use ASD-STE100 Simplified Technical English: short, direct sentences, common
  words, and active voice.
- Prefer the everyday word when it says the same thing.
- Lead with the main point. Add only the context a reader needs to understand
  it.
- Use one term for one idea. Keep that term consistent throughout the
  explanation.
- When a technical term is needed, explain it the first time you use it.
- Include the reason or effect when needed to understand the point. State a next
  action when the reader needs to act.
- For task summaries that change a process, explain the main path and its result
  in a short paragraph. Follow it with a small `text` flow diagram.

  ```text
  [Short paragraph: what starts the process, what it does, and the result.]

  [Starting condition]
    -> [First action]
    -> [Decision or next step]
    -> ...
    -> [Result]
  ```

  Replace each placeholder with the relevant system and action. Highlight core
  schema changes when they help explain the result.

- Write for a person who does not already know the implementation.
- Before finishing, check that a reader can tell what you are saying and why it
  matters, without losing needed information.
