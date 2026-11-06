# Branch: main

**Started:** 2026-11-06
**Status:** Default branch

## Purpose

The main branch of Tim's agent office. Small changes are committed straight here; bigger or risky changes go on their own branch first (see CLAUDE.md).

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Record merge of preference reviews

**What changed**
- `CHANGELOG.md`: added the line for [Pha1lbot/agent-office#3](https://github.com/Pha1lbot/agent-office/pull/3) (preference reviews).
- `notes/changes/claude-youthful-hopper-alwu7m.md`: status set to merged.

**Why**
#3 was merged; this is the "After a merge" routine in CLAUDE.md.

**Decisions**
A small notes-only commit, made straight on `main`.

**How to check it**
`CHANGELOG.md` lists #1, #2 and #3.

**Open items**
Office view to be built on a fresh `office-view` branch, as Tim asked.

### 2026-11-06: Record merge of the job-search branch

**What changed**
- `CHANGELOG.md`: added the line for [Pha1lbot/agent-office#2](https://github.com/Pha1lbot/agent-office/pull/2) (keeping local copies in sync, and the merge-conflict fix).
- `notes/changes/claude-youthful-hopper-alwu7m.md`: status set to merged. Old entries are unchanged.

**Why**
Tim merged #2 and said "we are updated now". CLAUDE.md's "After a merge" routine asks for a CHANGELOG line straight after each merge.

**Decisions**
Committed straight to `main`, because it is a small notes-only change, as CLAUDE.md allows. #2 was merged with a merge commit, so every commit from the branch is on `main`.

**How to check it**
`CHANGELOG.md` lists both #1 and #2. `git status` on `main` shows it up to date with origin.

**Open items**
- On Tim's PC: confirm it is on `main` (`git status`) and run `install-sync.ps1` once for the 15-minute pull, if not done yet.
- Tim to fill in `shared/job-search/preferences.md` and `sources.md` and add his CV, then try `/cos start the day`.
- Next: the office view branch.

### 2026-11-06: Add office view plan

**What changed**
- `notes/plans/office-view.md`: new plan for showing agents as pixel-art coworkers in an office. It covers existing projects (Pixel Agents, Bit Office, pixtuoid), the three-layer design (agents, bridge, office view), decisions so far, notes on tokens and weekly limits, first steps and open questions.

**Why**
Tim explored the idea in a Claude chat and asked to move it over to Claude Code. This file carries that discussion into the repo so a Claude Code session can pick it up.

**Decisions**
Put it under `notes/plans/` rather than a new top-level folder, so the repo layout in CLAUDE.md doesn't change without Tim agreeing. It's committed straight to `main` because it is a single new notes file, not code.

**How to check it**
Open `notes/plans/office-view.md` on GitHub or in Claude Code.

**Open items**
Tim still needs to answer the open questions in the plan (view type, fork or build, which agents go first) before any build starts.

### 2026-11-06: Add change notes system

**What changed**
- `CLAUDE.md`: added a "Change notes" section requiring a detailed notes file per branch, updated in the same commit as every change.
- `notes/changes/TEMPLATE.md`: new template for branch notes files.
- `notes/changes/main.md`: this file, the notes file for `main`, with the history so far.
- `CHANGELOG.md`: new one-line summary log of merged work.

**Why**
Tim asked for Claude to keep detailed notes of every change made on each branch.

**Decisions**
One notes file per branch (rather than one big log) so each branch's history can be read on its own and survives after merging. `CHANGELOG.md` gives a short overview across branches.

**How to check it**
Open `CLAUDE.md` and read the "Change notes" section. Future commits should each come with an entry here or in their branch's notes file.

**Open items**
None.

### 2026-11-06: Add backup routine and .gitignore

**What changed**
- `CLAUDE.md`: added a "Backup routine" section (pull at start, commit and push after each piece of work, check nothing is unpushed before finishing, never force-push or commit secrets, use branches and PRs for big changes).
- `.gitignore`: new file excluding secrets (`.env`, keys), local Claude settings, OS and editor clutter, dependencies, build output and logs.

**Why**
Tim asked for CLAUDE.md to be set up so there is always a backup on GitHub.

**Decisions**
Push after every commit rather than at the end of a session, so GitHub is never more than one change behind.

**How to check it**
Read the "Backup routine" section of `CLAUDE.md`; run `git status` after a session and confirm nothing is left unpushed.

**Open items**
None.

### 2026-11-06: Create repository

**What changed**
- `README.md`: created by GitHub with the repo description.
- `CLAUDE.md`: starter instructions describing the `agents/` and `shared/` layout.

**Why**
Tim asked for a new private GitHub repo for his agent office.

**Decisions**
Private repo under the Pha1lbot account, named `agent-office`.

**How to check it**
Visit github.com/Pha1lbot/agent-office.

**Open items**
None.
