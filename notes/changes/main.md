# Branch: main

**Started:** 2026-11-06
**Status:** Default branch

## Purpose

The main branch of Tim's agent office. Small changes are committed straight here; bigger or risky changes go on their own branch first (see CLAUDE.md).

## Change log

Newest entries first. Never delete or rewrite old entries.

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
