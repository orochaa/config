# Cross-Skill Findings

Append-only. One line per finding, written by refinement agents:
`- [<source-skill>] <finding> → affects <other-skill>`

- [grill-with-docs] grilling names only AskUserQuestion; add 'or the platform's equivalent structured question tool' so Codex uses its native tool (lets grill-with-docs drop its duplicate rule) → affects grilling
- [grill-with-docs] grilling:42-43 'Do not act on it until the user confirms' reads as forbidding in-session doc writes by companion skills; scope it to implementation → affects grilling
- [grill-with-docs] lint item 3 requires 'Use when…' but SKILL-MECHANICS says user-invoked descriptions are human-facing with triggers stripped; exempt disable-model-invocation skills → affects _refinement/platform-facts.md
- [grill-with-docs] domain-modeling puts CONTEXT.md and docs/adr/ at the repo root with no rule for a cwd that is not a repository → affects domain-modeling
- [wait-what] to-human and wait-what duplicate the plain-English style (ASD-STE100 + CONTEXT.md terms); make one file the single source → affects to-human
- [wait-what] to-human/SKILL.md:7-8 has no branch for multi-context repos (CONTEXT-MAP.md) → affects to-human
- [wait-what] Lint item 3 (Use when… trigger) conflicts with SKILL-MECHANICS guidance that user-invoked descriptions are human-facing summaries; exempt disable-model-invocation skills → affects to-agents (and _refinement/platform-facts.md)
- [to-human] platform-facts lint 3 demands a "Use when…" clause, contradicting SKILL-MECHANICS.md:22-26 (user-invoked descriptions strip triggers); scope it to model-invoked skills → affects _refinement/platform-facts.md, to-agents
- [research] /research subagents told to use a throwaway research/<name> branch with no owner for branch creation, no per-agent worktree for parallel runs, and no defined return (path + answer) to build the ticket pointer → affects wayfinder
- [research] Research tickets limited to knowledge outside the cwd, while research skill also treats local source code as a primary source; local-code questions may be misrouted to grilling → affects wayfinder
- [to-github-review] review-and-refine .review.md has no per-finding stable ID or open/fixed status field, so consumers must infer which findings are still open across append-only sections → affects review-and-refine
- [to-github-review] Description uses Codex-only $skill syntax with no disable-model-invocation, so Claude Code treats a Codex-explicit-only skill as model-invoked → affects to-source-comments
- [to-source-comments] Description says explicit-only ($to-github-review, Codex allow_implicit_invocation: false) but SKILL.md lacks disable-model-invocation: true, so Claude Code can auto-invoke it → affects to-github-review
- [to-source-comments] Lint item 3 (every description needs a "Use when…" clause) conflicts with SKILL-MECHANICS.md:22-26 (user-invoked descriptions drop trigger lists) for all disable-model-invocation skills → affects to-agents
- [implement] tdd requires user-confirmed seams before any test (tdd/SKILL.md:35-38) while implement derives seams autonomously from the spec; tdd should treat seams defined by an approved spec as pre-agreed → affects tdd
- [implement] global implement skill names repo-local when-verify (~/git/unvoid/when/.codex/skills/when-verify); implement-01 makes the call repo-agnostic, when-verify Handoff format should stay compatible with implement's completion request → affects when-verify
- [grill-to-implementation] handoff naming (handoff/SKILL.md:14-17) turns spec `<base>.spec.md` into `<base>.spec.handoff.md`, but grill-to-implementation directory mode expects `<base>.handoff.md` → affects handoff
- [grill-to-implementation] no skill guarantees the `<dir>/<base>.spec.md` + `issues/NN-*.md` layout it consumes; to-tickets writes `.scratch/<feature-slug>/issues/` with no spec file rule and to-spec has no file naming convention → affects to-tickets, to-spec
- [grill-to-implementation] spec section list differs from to-spec/SKILL.md:38-52 (no TL;DR or test strategy), so to-tickets and implement receive two spec shapes → affects to-spec
- [handoff] review-and-refine/SKILL.md:180-196 duplicates handoff's filename and directory-precedence rules; move to one shared plain reference file → affects review-and-refine
- [handoff] review-and-refine/SKILL.md:205-206 has its own handoff search wording; reuse handoff's find step (handoff-01/13) → affects review-and-refine
- [handoff] grill-to-implementation/SKILL.md:78-80 writes handoff entries with its own fields and superseding rule; follow the handoff template and Supersedes: convention → affects grill-to-implementation
- [handoff] address-comments/SKILL.md:55-57 and assets/local-comments.md:44-49 restate a handoff content list twice; keep one and point to handoff's Open decisions section → affects address-comments
- [handoff] platform-facts.md lint item 3 (Use when clause) conflicts with to-agents SKILL-MECHANICS.md:22-26 for user-invoked skills; add an exception → affects to-agents
- [address-comments] handoff skill does not mention the {base}.address-comments.json companion archive, so refreshed PR-review handoffs may omit it → affects handoff
- [address-comments] spec.md cites address-comments/assets/remote-pr-comments.mjs as the model CLI; path goes stale if moved to scripts/ (address-comments-04) → affects _refinement/spec.md
- [to-agents] retro calls the pointer object "navigation pointer" (retro/SKILL.md:17,52,53) while to-agents, wayfinder, and setup-ts-deep-modules call it "context pointer"; unify the leading word → affects retro
- [to-agents] to-github-review and to-source-comments say they fire only when explicitly invoked and set Codex allow_implicit_invocation: false, but omit disable-model-invocation: true, so Claude Code pays their description context load every turn → affects to-github-review, to-source-comments
- [to-agents] address-comments is model-invocable in Claude Code but allow_implicit_invocation: false in Codex, with no stated reason for the platform difference → affects address-comments
- [review-and-refine] Review-file naming, rename, and directory-order rules duplicate handoff's "Choose the filepath"; extract to a shared _shared/workstream-file.md with a kind suffix → affects handoff
- [review-and-refine] Global skill hard-codes when-repo specifics (docs/22-qa-checklist.md, docs/agents/issue-tracker.md, when-websocket-sync, tauri.conf.json bumps); the when repo AGENTS.md should route to them → affects when repo AGENTS.md (outside ~/.agents/skills)
- [review-and-refine] when repo's project skill refine-before-pr overlaps this skill step for step (default base alpha, edits by default); pick one owner for pre-PR review → affects when/.claude/skills/refine-before-pr
- [review-and-refine] address-comments does not list *.review.md as a local-comment source though review files are written for a later agent to act on → affects address-comments
- [retro] Memory retro-iterate-per-suggestion.md duplicates retro/SKILL.md step 4 (one question per suggestion, local-only first); reduce it to a pointer after retro is refined → affects auto-memory (~/.claude/projects/-home-unvoid--agents-skills/memory)
- [retro] Lint item 3 ("Use when…" clause) conflicts with to-agents/SKILL-MECHANICS.md:22-26 for user-invoked skills (disable-model-invocation: true); exempt them → affects _refinement/platform-facts.md (all skills' lint)
- [handoff] Naming contract decided (handoff-18, option B): a spec's handoff keeps the full basename, sync.spec.md → sync.spec.handoff.md; handoff/SKILL.md is the single source → affects grill-to-implementation (expects <base>.handoff.md), review-and-refine, address-comments
