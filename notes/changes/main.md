# Branch: main

**Started:** 2026-11-06
**Status:** Default branch

## Purpose

The main branch of Tim's agent office. Small changes are committed straight here; bigger or risky changes go on their own branch first (see CLAUDE.md).

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Move CV into the cv folder

**What changed**
- `shared/job-search/cvdefault-cv.pdf` moved to `shared/job-search/cv/default-cv.pdf`.
- The CV path given in the entry below ("Job search set up") is now out of date; the CV is at `shared/job-search/cv/default-cv.pdf`.

**Why**
Tim renamed the CV on GitHub to `default-cv.pdf`, but the slash was lost (`cvdefault-cv.pdf`), so the file ended up outside the `cv` folder where the agents look.

**Decisions**
The intended name was clear, so the file was moved rather than asking first.

**How to check it**
`shared/job-search/cv/` contains `default-cv.pdf` and `README.md`.

**Open items**
None.

### 2026-11-06: Job search set up (preferences and job sites)

**What changed**
- `shared/job-search/preferences.md`: filled in from Tim's CV (`shared/job-search/cv/Tim Everard CV 2026 v3.pdf`, which Tim uploaded) and his answers: £50k minimum, remote or hybrid near London (he lives in Epsom), some event travel. Assumed values are marked *(assumed)* for Tim to correct.
- `shared/job-search/sources.md`: Hitmarker, Indeed UK, LinkedIn Jobs and company careers pages, as Tim chose.

**Why**
Tim ran `/cos start the day`. The setup check stopped it because these two files were still blank templates.

**Decisions**
- Roles and skills are taken from the CV so Tim didn't have to type them. Ideal pay is left open.
- Same-company BLAST roles are skipped by default, since Tim has just left; he can change that.

**How to check it**
Read both files. Tim should correct anything marked *(assumed)*.

**Open items**
- The CV is a PDF, so new Word files use the default style rather than Tim's CV styling. A .docx copy named `default-cv.docx` would fix that.
- The PDF's text layer is missing the letter "a" in places, so Senior Admin should work from the page images and have Tim check its text copy.

### 2026-11-06: Add a double-click launcher for the office

**What changed**
- `shared/office-view/Open Office.cmd`: new Windows launcher. It moves to its own folder, checks Node.js is installed, and just opens the browser if the office is already running. Otherwise it runs `npm.cmd install` quietly (quick when nothing has changed), opens the browser as soon as the office answers (waiting up to 30 seconds) and starts the office. Closing its window closes the office.
- `.gitattributes`: new. `.cmd` and `.bat` files get Windows line endings when checked out.
- `shared/office-view/README.md`: the launcher, desktop shortcut and start-at-login steps, plus a "Problems" section (PowerShell "running scripts is disabled", "Could not read package.json", port already in use).
- `README.md`: points to the launcher.
- `CHANGELOG.md`: line for [Pha1lbot/agent-office#4](https://github.com/Pha1lbot/agent-office/pull/4) (the office view), which was merged.
- `notes/changes/office-view.md`: status set to merged.

**Why**
On his PC, Tim hit PowerShell's script block (`npm.ps1 cannot be loaded`), then a window that opened in `system32` ("Could not read package.json"). He asked for something like a .bat that loads the office automatically.

**Decisions**
- A `.cmd` file, because cmd.exe isn't affected by PowerShell's script policy. It calls `npm.cmd` directly and always runs from its own folder (`%~dp0`), which avoids both problems.
- It runs `npm install` every time rather than only the first time, so it stays correct after a `git pull` changes the packages; when nothing has changed it takes a few seconds.
- It checks whether the office is already running, so double-clicking twice doesn't fail with "port in use".
- The line-ending rule covers only `.cmd` and `.bat`. Adding `.ps1` would have changed existing files, which might show as modified on Tim's PC and block the automatic `git pull --ff-only`.
- Committed straight to `main`, because it is one small file and Tim wanted it straight away.

**How to check it**
Not tested here (no Windows in the cloud sandbox). The file was checked to have Windows line endings. On the PC: `git pull`, then double-click `shared\office-view\Open Office.cmd`. The browser should open http://127.0.0.1:4747 once the office is ready, and a second double-click should just open the browser.

**Open items**
Tim to try it and report anything odd. If PowerShell is blocked entirely on his PC, the "already open" check and the browser opening would fail; the office would still start and he could open the address by hand.

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
