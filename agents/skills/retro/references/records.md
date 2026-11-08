# Retro records

Each retro keeps one record. The record is three things at once: the plan, the
implementation tracker, and the history that later retros read. Run
[`../scripts/retro-record.mjs`](../scripts/retro-record.mjs) for every read and
write. Never edit a record by hand.

## Location

Records live in `~/.agents/retros/<YYYY-MM-DD>-<slug>.json`. Set
`RETRO_RECORDS_DIR` to use another folder.

The folder sits outside every repo. Records quote the user and name private
repos, so they stay on this machine. Both Claude Code and Codex can reach it.

## Lifecycle

1. `new <slug> <project-dir> <scope> [<YYYY-MM-DD>]` creates the record. The
   date defaults to today; pass one only to import an earlier retro. If the
   record already exists, it prints `Exists` and changes nothing.
2. `add-session <record> <session-id> <log-path> [<kind>]` adds one reviewed
   session.
3. `set-notes <record> <notes.json>` sets the user's constraints and the facts
   the retro established. The file is `{"constraints": [...], "facts": [...]}`.
4. `add-candidate <record> <candidate.json>` adds a candidate, or updates it by
   `id`. It needs at least one evidence quote from a recorded session.
5. `decide <record> <id> <approved|modified|rejected> <user-note>
   [<change.md>]` records the user's verdict in their own words.
   - Approved and modified items need an exact change.
   - Pass the change as a Markdown file.
6. `implement <record> <id> <done|failed> <verification> [<repo>@<sha>]` is run
   by whoever implements, after each item.

These commands read without writing:

- `show <record>` prints the whole record as Markdown.
- `show <record> --open` prints only the approved items not yet done. It is
  the implementer's view.
- `history [<project-dir>]` prints:
  - every record, with its verdict counts;
  - targets and tags that appear in two or more records;
  - rejected items, with the user's note;
  - open items.
- `search <regex>` matches candidate text, targets, tags, and quotes.

## Candidate file

```json
{
  "id": "L01",
  "title": "Grilling uses the question tool",
  "category": "coding-standards",
  "severity": "high",
  "scope": "local",
  "targets": ["~/.agents/skills/grilling/SKILL.md"],
  "tags": ["question-tool"],
  "problem": "grilling prescribes a markdown Q1 format",
  "evidence": [{ "session": "82dd60c1", "quote": "use the question tool" }],
  "recommendation": "Ask each question with the question tool",
  "relatedTo": ["2026-11-07-when-spec-implement-review/L09"],
  "change": "Optional here; required by decide for approved items",
  "verify": "grep finds no Q1 block"
}
```

- `id` is optional. When it is missing, the next `L` (local) or `R` (remote)
  number is assigned.
- `category` is one of: `navigation`, `automated-checks`, `coding-standards`,
  `global-agents-md`, `tool-economy`, `no-ops`, `information-access`.
- `severity` is `high`, `med`, or `low`. `scope` is `local` or `remote`.
- `targets` are the files or settings to change.
- `tags` are kebab-case leading words for the problem.
- Targets and tags are the keys that `history` matches across retros, so reuse
  the earlier wording when it fits.
- `evidence[].session` is a recorded session id, or a prefix of 8 or more
  characters.
- `relatedTo` names earlier items as `<record-id>/<candidate-id>`.

The script adds the tracking fields:

- `verdict`: `pending`, `approved`, `modified`, or `rejected`.
- `userNote` and `decidedAt`.
- `status`: `todo`, `done`, `failed`, or `skipped`.
- `implementedAt`, `verification`, and `commits`.

## Using history

- An item that recurs is a repeated problem, so raise its severity one level.
- A candidate that matches a rejected item needs new evidence. Quote the
  earlier user note when you ask.
- An open item whose problem shows up again becomes a candidate again, citing
  both records.
