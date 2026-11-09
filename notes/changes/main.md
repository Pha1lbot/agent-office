# Branch: main

**Started:** 2026-11-06
**Status:** Default branch

## Purpose

The main branch of Tim's agent office. Small changes are committed straight here; bigger or risky changes go on their own branch first (see CLAUDE.md).

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-09: Automatic Hal runs start in the office folder

**What changed**
- `Tim's Job Search/shared/office-view/src/server.ts`: the automatic Chief of Staff run (`AutoCos`) now starts Claude Code in the office folder (`REPO`) instead of the git repo's top folder (`gitRepo || REPO`), with a comment saying why.

**Why**
- Tim asked for the fix found in the entry below: every automatic run failed with "Unknown command: /cos", because /cos, the agents and the guard hook live in the office's own `.claude/`, which Claude Code doesn't load from the top folder. The run's tool paths (`shared/tools/tracker.py`) are also relative to the office folder.

**Decisions**
- Only the run's working folder changed. The office's GitHub backup still uses the git top folder, which is right for git.
- Hal's office has the same code and likely the same bug; not changed, as the rules say to change the other office's copy only when asked.

**How to check it**
- `npm run check` and `npm test` in `shared/office-view` pass (37 tests).
- Restart the office, then press "Run now" with an inbox item waiting: the new `logs/cos-*.log` should show Hal working, not "Unknown command: /cos".

**Open items**
- The running office must be restarted to pick this up.
- Same fix probably needed in `Hal's Job Search/shared/office-view/src/server.ts`.
- With GitHub suspended, runs will hit a failed start-up git pull; whether they carry on depends on the existing rules. Not pushed (GitHub suspended).

### 2026-11-09: Drafts for UNICEF UK and Handle Recruitment, and why automatic runs fail

**What changed**
- `jobs/roles/2026-11-05-unicef-uk-director-of-soccer-aid-interim/`: new. Rita's `listing.md`; Wren's `cv.json`, `cover-letter.md`, `notes.md`; Ada's `cv.md`, Word files and PDFs.
- `jobs/roles/2026-11-05-handle-recruitment-client-unnamed-event-director/`: new, same set of files.
- `jobs/tracker.json` / `jobs/tracker.md`: Handle Recruitment set to fit 2, verdict skip; UNICEF UK set to fit 3, verdict maybe, closing date 2026-11-09. Inbox items i10, i11 and i12 done. Action a9 added (UNICEF closed and rejects AI-written answers).

**Why**
- Tim reported that automatic runs did nothing although the office showed requests waiting, and asked Hal to run the inbox for these two roles by hand, with a verdict for Handle Recruitment.
- Cause of the failed runs: the logs (`Tim's Job Search/shared/office-view/logs/cos-*.log`) all say only "Unknown command: /cos". `shared/office-view/src/auto-cos.ts` starts Claude Code in the git repo's top folder (`server.ts` passes `gitRepo || REPO`), but since the office moved into `Tim's Job Search/` the /cos skill lives only in that office's `.claude/skills/`, so Claude Code at the top level doesn't know it. The start-up git pull (GitHub is currently suspended) is not what stopped them, so the planned "carry on without GitHub" rule changes were not made.

**Decisions**
- Rita found UNICEF closed at 8am today and rated Handle a skip (4 office days a week, agency experience essential). Tim was asked and chose to draft both anyway.
- Committed locally only: Tim's GitHub account is suspended, so push when it's back.
- Activision Blizzard (i13) left in the inbox: not part of this request.

**How to check it**
- `python shared/tools/tracker.py inbox list` shows only i13. Both role folders have a CV and cover letter PDF.

**Open items**
- Fix `server.ts` to start automatic runs in the office folder (`REPO`), not the git top level. Hal's office has the same code and likely the same bug.
- Push this commit when GitHub access is restored.
- Wren's UNICEF CV figure "6 / person team led" may read oddly; Tim to check.

### 2026-11-08: Verdicts for two roles Tim added from the office (TikTok, Activision Blizzard)

**What changed**
- `jobs/roles/2026-11-05-tiktok-tiktok-shop-creator-operations-manager/listing.md`: new, Rita's read of the TikTok Shop Creator Operations Manager advert.
- `jobs/roles/2026-11-08-activision-blizzard-marketing-senior-specialist-call-of-duty/listing.md`: new, Rita's read of the Activision Blizzard Marketing Senior Specialist advert.
- `jobs/tracker.json` / `jobs/tracker.md`: set fit and skip verdicts for both roles; inbox items i8 and i9 marked done.

**Why**
Tim added both roles from the office and asked for a verdict (i8: "Ask Hal" on TikTok Shop; i9: full read request on Activision Blizzard). The office started this session automatically for the inbox items.

**Decisions**
Briefed Rita once for both roles together (neither had a listing.md yet, so both needed the full read rather than verdict-only) to keep it to one hand-off.

**How to check it**
`python shared/tools/tracker.py show <id>` for either role id, or open the listing.md files above.

**Open items**
Both came back skip: TikTok Shop role is e-commerce creator ops (wrong discipline) and no longer accepting applications; Activision Blizzard role is a marketing/GTM IC role, not esports ops leadership. No action needed from Tim.

### 2026-11-06: NetEase CV, cover letter and interview prep drafted despite skip verdict

**What changed**
- `jobs/roles/2026-11-05-netease-games-esport-specialist/`: Wren added `cv.md`, `cv.docx`, `cover-letter.md`, `cover-letter.docx`, `notes.md`. Cole added `interview-prep.md`, `talking-points.md`.
- `jobs/tracker.json` / `jobs/tracker.md`: inbox items i1 and i6 marked done; added action a8 for Tim to check the documents are honest about the seniority/language gaps.

**Why**
Tim's office changes queued two inbox items (refresh interview prep, draft CV/cover letter) for this role despite Rita's earlier skip verdict (entry-level specialist role, requires Chinese, below Tim's Head of Department seniority). He wasn't watching this session, but the tracker history showed him setting the role to "drafted" three times today, which Hal treated as confirmation he wanted the documents anyway rather than holding them again.

**Decisions**
Briefed Wren and Cole to be honest about the gaps rather than oversell fit: no Chinese language claimed, no entry-level reframing, seniority mismatch and language gap addressed directly in interview prep.

**How to check it**
Read the new files in the role folder; check action a8 in the tracker for the flag to Tim.

**Open items**
Tim still needs to decide whether to actually apply, given the skip verdict stands.

### 2026-11-06: NetEase role unblocked (Tim added the link) — but Rita's read says skip

**What changed**
- Tim added a LinkedIn link to `2026-11-05-netease-games-esport-specialist` (the previous blocker, a5/a6, is resolved). A new inbox item i7 ("Give a verdict: worth applying?") also arrived.
- Briefed Rita for a full read since the role still had no `listing.md`. She wrote `jobs/roles/2026-11-05-netease-games-esport-specialist/listing.md` and confirmed a skip verdict, fit 2: entry-level specialist role (2+ yrs exp, requires Chinese), far below Tim's Head of Department seniority.
- Set `fit=2 verdict=skip verdict_why="Entry-level specialist role (2+ yrs exp, requires Chinese), far below Tim's Head of Department seniority"` on the tracker.
- Marked inbox i7 done, and actions a5/a6 done (their missing-advert blocker is resolved now `listing.md` exists).
- Did **not** action i1 (refresh interview prep) or i6 (draft CV/cover letter) — Tim had already moved this role to `drafted`, but Rita's read turned up a hard mismatch (the role needs Chinese). Added action a7 asking Tim to confirm he still wants the draft and prep refresh despite the skip verdict, rather than spending a Wren and Cole hand-off on a role likely to be dropped.

**Why**
- Started automatically by the office after Tim's changes. Rule in CLAUDE.md/SKILL.md: Tim isn't watched in this mode, so open questions become actions, not drafted work.

**Decisions**
- Considered drafting anyway since the role was already in `drafted` status (Tim's call), but the skip reason is a hard requirement gap (language), not just a soft preference mismatch — holding off avoids a ~15k-token hand-off each to Wren and Cole for a role Tim is likely to pass on once he sees Rita's verdict.

**How to check it**
- `python shared/tools/tracker.py show 2026-11-05-netease-games-esport-specialist` shows the new fit/verdict.
- `python shared/tools/tracker.py inbox list` shows only i1 and i6 remaining.
- `python shared/tools/tracker.py action list` shows a7.

**Open items**
- Waiting on Tim to say whether to proceed with the CV/cover letter draft and interview prep refresh (i1, i6) despite the skip verdict.

### 2026-11-06: Office changes inbox — NetEase role blocked on missing advert

**What changed**
- Checked the two office-changes inbox items (i1: refresh interview prep, i6: draft CV/cover letter), both for `2026-11-05-netease-games-esport-specialist`. Neither Wren nor Cole can do this work: the role has no `url`, no pasted advert text, and no `jobs/roles/` folder at all.
- Left i1 and i6 open in the inbox (nothing to mark done).
- Added action a6 noting the interview-prep refresh is blocked for the same reason as the existing action a5 (missing advert/link).

**Why**
- Started automatically by the office after Tim changed role statuses; this role already has `verdict: skip` and an open action (a5) asking Tim to add the advert, so the gap was already known but the new inbox items repeat work that's still blocked.

**How to check it**
- `python shared/tools/tracker.py inbox list` still shows i1 and i6.
- `python shared/tools/tracker.py action list` shows a5 and a6, both pointing at the same missing-advert gap.

**Open items**
- Waiting on Tim to add the NetEase advert link or paste its text before Wren/Cole can act.

### 2026-11-06: Record merges of #5 and #6, and add /hal

**What changed**
- `CHANGELOG.md`: lines for [Pha1lbot/agent-office#5](https://github.com/Pha1lbot/agent-office/pull/5) (dashboard import) and [Pha1lbot/agent-office#6](https://github.com/Pha1lbot/agent-office/pull/6) (office editing, Hal).
- `notes/changes/import-dashboard.md`, `notes/changes/office-editing.md`: status set to merged.
- `.claude/skills/hal/SKILL.md`: new `/hal` command, another name for `/cos`. It points to the cos skill rather than copying it, so there is only one set of instructions to keep up to date.

**Why**
Tim merged both PRs and typed `/hal start of day`, which didn't exist.

**Decisions**
The new command points to `/cos` rather than replacing it, so the office's automatic runs (which send `/cos office changes`) keep working.

**How to check it**
In Claude Code in the repo, `/hal start the day` behaves like `/cos start the day`.

**Open items**
Tim to pull on his PC and reopen the office to get editing and the contract.

### 2026-11-06: Repair notes file and remove duplicate CV after a merge

**What changed**
- `notes/changes/main.md`: restored to its last good version (commit 8c49ce7). Resolving a merge conflict on Tim's PC had removed the `###` from every entry heading and left two stray merge lines ("HEAD" and a commit id). No entry's text was lost or changed; only the headings were repaired.
- `shared/job-search/cv/Tim Everard CV 2026 v3.pdf`: removed. The merge on Tim's PC had brought it back, and it is byte-for-byte identical to `default-cv.pdf` (same SHA-256).

**Why**
Tim's PC was behind GitHub with an unfinished merge. Finishing it led to a conflict in this file, and the hand resolution stripped the heading markers.

**Decisions**
- Restored the whole file rather than patching it line by line. A comparison showed the PC's side added no entries of its own, so nothing is lost.
- Removed only the exact duplicate CV, after checking the hashes match.

**How to check it**
`grep -c '^### ' notes/changes/main.md` counts every entry heading again. `shared/job-search/cv/` holds `README.md` and `default-cv.pdf`.

**Open items**
Tim's PC needs a `git pull` to pick this up.

### 2026-11-06: Job search: first day, 7 roles found

**What changed**
- `jobs/roles/2026-11-06-*/listing.md`: 7 listings from Lead Recruiter (Epic Games, Hexagon World Series, Vitality, Disrupt Search, 2 × Blank Space Recruitment, ESL FACEIT Group).
- `jobs/tracker.json`, `jobs/tracker.md`: 7 roles added as `found` by Admin.
- `jobs/today.md`: ranked list with top 3 picks (Epic, Vitality, Hexagon).

**Why**
Tim ran `/cos start the day`.

**Decisions**
- Ranked by fit (none above 3), then by sector and work style, because no closing dates were given and most pay is unstated.
- The first search was blocked by the cloud network. Tim approved a new "agent-office" cloud environment allowing the job sites, and the search was re-run.

**How to check it**
`python3 shared/tools/tracker.py list --summary` shows 7 found. Read `jobs/today.md`.

**Open items**
- Tim to pick roles.
- Coverage was partial: Indeed returned 403, Hitmarker listings load by JavaScript, and Greenhouse careers boards returned 403. Running from Tim's PC, or allowing `boards-api.greenhouse.io`, should help.

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
