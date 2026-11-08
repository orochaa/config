---
name: wait-what
description:
  Re-pitches the last message in plain English, with the context the reader is
  missing. Use when the user says the last message did not land.
argument-hint: '[the part that lost you]'
disable-model-invocation: true
---

Your last message did not land. Re-pitch it.

1. Pick the target: the part the user names after the command, or else your
   last message.
2. Read [`to-human`](../to-human/SKILL.md) and write the re-pitch by its rules.
3. Open with one or two sentences of context: the goal, where the work stands,
   and what just happened.
4. Re-pitch the main point. Take a new angle: lead with the point, leave out
   implementation detail, and give a concrete example when the idea is
   abstract.
5. End with the one decision or reply you need from the user, if any. Then
   stop and wait for their reply.

Done when the user can tell, from this message alone, what happened, why it
matters, and what comes next.
