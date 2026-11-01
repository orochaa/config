---
name: ask-skill
description:
  Ask which skill or flow fits your situation. A router over the skills in this
  repo.
disable-model-invocation: true
---

# Ask Skill

You don't remember every skill, so ask.

A **flow** is a path through the skills. Most paths run along one **main flow**,
and two **on-ramps** merge onto it. Everything else is standalone, or a
vocabulary layer that runs underneath.

## The main flow: idea → ship

The route most work travels. You have an idea and want it built.

1. **`/grill-with-docs`** — sharpen the idea by interview. Start here when you
   **have a codebase**: it's stateful, retaining what it learns in `CONTEXT.md`
   and ADRs. (No codebase? Use `/grill-me` — see Standalone. Both run the same
   `/grilling` primitive; `grill-with-docs` is the one that leaves a paper
   trail.)
2. **Branch — is this a multi-session build?**
   - **Yes** → **`/to-spec`** (turn the thread into a spec), then
     **`/to-tickets`** to split it into tracer-bullet tickets, each declaring
     its **blocking edges**. On a local tracker that's one file per ticket under
     `.scratch/<feature>/issues/`, worked blockers-first by hand; on a real
     tracker the edges become native blocking links, so any ticket whose
     blockers are done can be grabbed — kick off **`/implement`** per ticket,
     **clearing context between each one**.
   - **No** → **`/implement`** right here, in the same context window.

   Either way, **`/implement`** builds each issue by driving **`/tdd`**
   internally — one red-green slice at a time. Then review the complete
   AI-generated change, run the relevant tests, and complete the relevant QA.
   Use one final review skill:
   - **`/review-and-refine`** — review the completed branch, apply safe
     improvements, and validate them.

   Finish with **`/when-pr-summary`** to prepare the pull-request title and
   description. Reach for **`/tdd`** on its own when you want to build a
   concrete behaviour test-first without a full spec.

### Context hygiene

Keep steps 1–3 in **one unbroken context window** — don't compact or clear until
after `/to-tickets` — so the grilling, spec, and tickets all build on the same
thinking. Each `/implement` then starts fresh, working from the ticket.

The limit on this is the
**[smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone)**: the
window (~120k tokens on state-of-the-art models) within which the model still
reasons sharply. If a session approaches it before `/to-tickets`, don't push on
degraded — `/handoff` and continue in a fresh thread.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug
  that resists a first glance, the intermittent flake, the regression that crept
  in between two known-good states. It refuses to theorise until it has a
  **tight feedback loop** — one command that already goes red on _this_ bug —
  then fixes with a regression test. Review the finished fix, run the relevant
  tests and QA, then use `/review-and-refine` and `/when-pr-summary`.

- **A huge, foggy effort — a greenfield project or a huge feature build, too big
  for one session** → **`/wayfinder`**, the most cognitively demanding flow
  here. When the way from here to the destination isn't visible yet, it charts a
  **shared map** of **decision tickets** on the issue tracker and resolves them
  one at a time — producing **decisions, not deliverables** — until the fog is
  pushed back and the way is clear. Where **`/grill-with-docs`** sharpens an
  idea you can hold in one session, wayfinder is for the idea you can't — and
  it's slower and denser, so save it for exactly that, never a well-scoped
  feature.

  When the map clears, **it hands off, it doesn't build**: merge onto the main
  flow at **`/to-spec`**, which collapses the map's linked decisions into a
  buildable plan, then `/to-tickets` and `/implement` as usual. Looping the map
  straight into `/implement` skips that collapse and throws the linked detail
  away — go straight to `/implement` only when the effort turned out genuinely
  small.

## Crossing sessions

- **`/handoff`** — when a thread is full or you need a separate session, this
  compacts the conversation into a markdown file.
  You don't continue in place — you **open a new session and reference that
  file** to carry the context across. It's the bridge between context windows,
  in either direction. Use it when you want a **fresh session** but need the
  **current conversation preserved**.
- **`/compact`** (built-in) — stay in the **same conversation**, letting the
  earlier turns be summarized. Use it at **intentional breaks between phases**,
  when you don't mind losing the verbatim history. Don't compact mid-phase — the
  agent can lose its way. `/handoff` forks; `/compact` continues.

## Standalone

Off the main flow entirely.

- **`/grill-me`** — the same relentless interview as `/grill-with-docs`, but for
  when you have **no codebase**. Stateless: it saves nothing locally, builds no
  `CONTEXT.md`. Reach for it to sharpen any plan or design that doesn't live in
  a repo.
- **`/research`** — delegate reading legwork to a **background agent**: it
  investigates a question against **primary sources**, then leaves a cited
  Markdown file in the repo. Keep working while it reads. The file it produces
  is something to take _into_ the main flow at `/grill-with-docs` — research
  feeds the thinking, it doesn't replace it.
