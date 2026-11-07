# Branch: claude/compassionate-ptolemy-vc0jj2

**Started:** 2026-11-07
**Status:** In progress

## Purpose

Tim shared a picture of a popular "build your first AI team" one-shot prompt and asked what the agent office can learn from it and what to improve. This branch holds that review. It changes no agent, prompt or convention until Tim picks which improvements to make.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-07: Review of the office against the "first AI team" blueprint prompt

**What changed**
- `notes/plans/learnings-ai-team-blueprint.md`: new. Compares each section of the blueprint prompt with the office as it is on `main`, lists what the office already does better, seven gaps with evidence, ten ranked improvements (tokens, effort, whether Tim's OK is needed), draft "done means" lines for Rita, Wren and Cole, and a 7-day "prove it" week.
- `notes/changes/claude-compassionate-ptolemy-vc0jj2.md`: this notes file.

**Why**
Tim asked: "Read the image and take the learnings into our agent-office. What can we learn? What can we improve?"

**Decisions**
- Wrote a review instead of changing prompts straight away: CLAUDE.md says to ask before changing shared conventions, and most improvements touch Hal's skill, the agents' prompts or `handoffs.md`.
- Checked claims against the repo before writing them down:
  - `auto-cos.ts` gives unattended runs `Bash(git:*)`, which allows force-push and hard reset.
  - A rough script compared every figure in the 4 drafted CVs and 2 cover letters with `cv-bank.md`: all clean (one false alarm).
  - `tracker.py insights`: picked roles average fit 2.7, skipped roles 2.5.
  - Old names ("Senior Admin", "the Admin agent") are still in `cv-rules.md`, `shared/job-search/cv/README.md`, `jobs/README.md` and `preferences.md`.
- Advised against copying the blueprint's "top model for everything": the office's own token measurements favour Sonnet plus scripts. A stronger model for Wren's final drafts is offered only as a measured trial.

**How to check it**
Read `notes/plans/learnings-ai-team-blueprint.md`. Each gap names the file or figure it rests on, so it can be checked directly.

**Open items**
- Tim to say which of improvements 1 to 10 to make. 1 to 3 cost no tokens.
- Session start: the start-up `git pull` failed because this cloud branch had no upstream yet. It was already level with `main` (same commit), so nothing was missing.
