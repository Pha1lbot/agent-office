# Branch: main (Hal's Job Search)

**Started:** 2026-11-08
**Status:** Default branch

## Purpose

The change notes for work committed straight to `main` in Hal's Job Search: changes Tim Everard makes to it. It is separate from `main.md` (Tim's office) so the two offices never edit the same file. Everything else follows the rules in CLAUDE.md.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-12: Adzuna removed (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/scout.py`, `test_scout.py`, `shared/job-search/search.json` and `.env.example`, `shared/office-view` (`src/keys.ts`, `src/scout.ts`, `src/server.ts`, `public/views.js`, tests), `.claude/skills/cos/SKILL.md` and `agents/admin/README.md`: Adzuna removed, as in Tim's office.

**Why**
Tim Everard asked for Adzuna to be removed completely.

**Decisions**
Code and instructions only; Hal's CV, preferences, tracker and roles were not opened.

**How to check it**
`python3 shared/tools/test_scout.py` (24) and `npm test` (57) in Hal's office.

**Open items**
None.

### 2026-11-12: Learning loop: owner-only insights, scorecard, review prompt, skip reasons (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/tracker.py` and `test_tracker.py`; `shared/office-view` (`public/views.js`, `dashboard.js`, `index.html`); `.claude/skills/cos/SKILL.md`: the same changes, with the Chief of Staff called Tim.

**Why**
Tim Everard asked for code changes to go into both offices.

**Decisions**
Code and instructions only. Hal's own tracker, roles and preferences were not opened.

**How to check it**
`python3 shared/tools/test_tracker.py` (19) and `npm test` (57) in Hal's office.

**Open items**
None.

### 2026-11-12: Closed-postings check, posting age field (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/scout.py`, `tracker.py` and tests; `shared/office-view` (`src/scout.ts`, `src/server.ts`, `src/search.ts`, `public/views.js`, tests); `.claude/skills/cos/SKILL.md`: the same closed-postings check and age field, with the Chief of Staff called Tim.

**Why**
Tim Everard asked for code changes to go into both offices.

**Decisions**
Code and instructions only. Hal's `search.json` is blank, so nothing changes for his search except the new commands being available. His tracker, roles and CV were not opened.

**How to check it**
`python3 shared/tools/test_scout.py` (23) and `npm test` (57) in Hal's office.

**Open items**
None.

### 2026-11-12: "Define my search" dialog and track switches (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/office-view/` (`src/search.ts`, `src/server.ts`, `public/views.js`, `public/style.css`, tests), `shared/tools/scout.py`, `tracker.py` and their tests, and `.claude/skills/cos/SKILL.md`: the same dialog and handling, with the Chief of Staff called Tim.

**Why**
Tim Everard asked for code changes to go into both offices.

**Decisions**
Code and instructions only. Hal's search definition is still blank, so the dialog starts empty; his files were not opened. His office's GitHub backup is off, so nothing from it is saved to GitHub.

**How to check it**
`npm test` (55) in Hal's `shared/office-view`.

**Open items**
Hal's definition session.

### 2026-11-12: One-tap questions (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/tracker.py` and `test_tracker.py`: `action add --options` and `action answer`; `shared/office-view` (`src/server.ts`, `public/views.js`, `public/style.css`): answer buttons in Next actions; `.claude/skills/cos/SKILL.md`: how Tim (the Chief of Staff) asks questions and acts on answers.

**Why**
Tim Everard asked for code changes to go into both offices.

**Decisions**
Code and instructions only; Hal's CV, preferences, tracker and roles were not opened.

**How to check it**
`python3 shared/tools/test_tracker.py` and `npm test` in Hal's office.

**Open items**
None.

### 2026-11-12: Job sites panel, "Check sources now" and the job site keys dialog (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/office-view/`: new `src/scout.ts` and `src/keys.ts`; `src/server.ts`, `public/views.js` and `public/style.css` updated; new `test/scout.test.ts` and `test/keys.test.ts` (49 tests pass).

**Why**
Tim Everard asked for code changes to go into both offices.

**Decisions**
Code only. Hal's search definition is still blank, so his panel lists the sources with nothing checked yet. His `.env` and other files were not opened.

**How to check it**
`npm test` in Hal's `shared/office-view`; restart his office to see the panel.

**Open items**
None.

### 2026-11-12: Scout's stricter filter (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/scout.py`: generic titles need the track's own words, hybrid outside the commute area no longer passes, London and Surrey postcodes count as in reach, recruiters' adverts are never "strong". 17 Scout tests pass.

**Why**
Tim Everard asked for code changes to go into both offices. Details in `claude-compassionate-ptolemy-vc0jj2.md`.

**Decisions**
Code only; Hal's definition is still blank, and his CV, preferences, tracker and roles were not opened.

**How to check it**
`python3 shared/tools/test_scout.py` in Hal's office.

**Open items**
None.

### 2026-11-12: Daily search instructions use Scout and the definition (ported from Tim's office)

**What changed**
- `Hal's Job Search/.claude/skills/cos/SKILL.md` ("Daily search") and `.claude/agents/lead-recruiter.md`: the same new flow as in Tim's office, with the Chief of Staff called Tim; `agents/lead-recruiter/README.md` and `agents/admin/README.md` updated.

**Why**
Tim Everard asked for code and instruction changes to go into both offices.

**Decisions**
Instructions only. Hal's own `search.json` is blank, so Scout finds nothing for him until he has made a definition; no daily task is created for him. His CV, preferences, tracker and roles were not opened.

**How to check it**
Read the section; try it after Hal has a definition.

**Open items**
Hal's definition session.

### 2026-11-12: Scout feed age limit, queued-jobs memory and board names (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/scout.py` and `test_scout.py`: company feeds allow jobs up to 60 days old, queued jobs are remembered so they aren't queued twice, and `discover` prints each board's name. 17 Scout tests pass.

**Why**
Tim Everard asked for code changes to go into both offices. Details in `claude-compassionate-ptolemy-vc0jj2.md`.

**Decisions**
Code only; Hal's definition is still blank and his CV, preferences, tracker and roles were not opened. No boards were saved for him.

**How to check it**
`python3 shared/tools/test_scout.py` in Hal's office.

**Open items**
None.

### 2026-11-12: Scout tracks can require their sector words (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/scout.py` and `test_scout.py`: a track can set `require_keyword`; one new test (16 tests pass).

**Why**
Part of adding a project management track to Tim Everard's own search. Code only; Hal's search definition is still blank and his CV, preferences, tracker and roles were not opened.

**Decisions**
None.

**How to check it**
`python3 shared/tools/test_scout.py` in Hal's office.

**Open items**
None.

### 2026-11-11: Scout and the coverage log (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/scout.py`, `test_scout.py`, `shared/job-search/.env.example`: new, as in Tim's office with the Chief of Staff named Tim.
- `shared/tools/tracker.py` and `test_tracker.py`: feed finds with a track and summary, the coverage log (`found run --source`, `found sources`), and the missing-file fix. 11 tracker tests and 15 Scout tests pass.

**Why**
Tim Everard asked for code changes to go into both offices. Details in `claude-compassionate-ptolemy-vc0jj2.md`.

**Decisions**
Code only. Hal's search definition is still blank (`search.json` has the sources and no tracks), so Scout finds nothing for him until he has made one; his CV, preferences, tracker and roles were not opened.

**How to check it**
`python3 shared/tools/test_scout.py` in Hal's office.

**Open items**
Hal's definition session.

### 2026-11-11: A blank search definition file (from Tim's office)

**What changed**
- `Hal's Job Search/shared/job-search/search.json`: new. The sources list (how each site is read) with no tracks, pay or watch list filled in.

**Why**
Tim Everard asked for code changes to go into both offices. The search script will read this file; Hal's own definition is his to make with his Chief of Staff. His preferences, CV, tracker and roles were not opened.

**Decisions**
Sources only, so the script works as soon as Hal adds tracks.

**How to check it**
The file parses as JSON.

**Open items**
Hal's definition session, once the "Define my search" page exists.

### 2026-11-11: The office says what the team is doing in plain English (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/office-view/`: new `src/plain.ts`; `src/office.ts`, `public/office.js`, `public/dashboard.js`, `public/style.css` and `test/office.test.ts` updated; new `test/plain.test.ts`. Statuses read "Tim is checking roles", "Tim is waiting for you" and so on (the Chief of Staff is Tim in this office).

**Why**
Tim Everard asked on 2026-11-11 for code changes to go into both offices. Details in `claude-compassionate-ptolemy-vc0jj2.md`.

**Decisions**
Code only; Hal's CV, preferences, tracker and roles were not opened.

**How to check it**
`npm test` and `npm run check` in Hal's `shared/office-view`: 40 tests pass. Restart the office to see the new wording.

**Open items**
None.

### 2026-11-11: Every applied role gets a follow-up date (ported from Tim's office)

**What changed**
- `Hal's Job Search/shared/tools/tracker.py` (`cmd_set`): a role that becomes applied always gets "Follow up if no reply by <7 days on>" as its next step; an earlier next step is kept in the notes as "Before applying: ...".
- `Hal's Job Search/shared/tools/test_tracker.py`: two new tests.

**Why**
Tim Everard asked on 2026-11-11 for code fixes to go into both offices. Made on branch `claude/compassionate-ptolemy-vc0jj2`; details in that branch's notes.

**Decisions**
Code only. Hal's tracker, CV, preferences and roles were not opened or changed, so any role he has already applied to keeps its current next step.

**How to check it**
`python3 shared/tools/test_tracker.py` in Hal's office: 9 tests pass (they use a temporary jobs folder).

**Open items**
None.

### 2026-11-11: Back to the normal start-up git rule

- `Hal's Job Search/.claude/settings.json` and `.claude/skills/cos/SKILL.md`: restored to their wording from before the 2026-11-09 "Carry on locally" entry, now that Tim Everard's GitHub account is active again. A failed start-up pull again means stopping and sorting it out with Hal. Details in `main.md`, 2026-11-11.

### 2026-11-11: Automatic-run fix now in Hal's office (merged from GitHub)

**What changed**
- No new edits here. Merging GitHub's `main` into Tim's PC's `main` brought in PR #27 (`notes/changes/claude-youthful-hopper-alwu7m.md`), which already starts the Chief of Staff's automatic runs in `Hal's Job Search/` instead of the repo's top folder.

**Why**
- Tim asked for the automatic-run fix to be made in Hal's office too. It was already on GitHub, so merging was enough.

**How to check it**
- `npm run check` and `npm test` in `Hal's Job Search/shared/office-view` pass (39 tests). Hal's office needs a pull and a restart to pick it up.

**Open items**
- This closes the first open item in the 2026-11-09 entry below.

### 2026-11-09: Carry on locally when GitHub can't be reached

**What changed**
- `Hal's Job Search/.claude/settings.json`: the start-up hook's failure message now says that if GitHub can't be reached, carry on with the copy on this PC (this office never commits) and pull again later; merge conflicts or local changes in the way still mean stopping and sorting it out with Hal.
- `Hal's Job Search/.claude/skills/cos/SKILL.md`: "Office changes" step 4 says the same.

**Why**
- Made by Tim Everard alongside the same change in his own office and in the repo-wide CLAUDE.md (see `main.md`, 2026-11-09), after his GitHub account was suspended.

**Decisions**
- Hal's office still never commits or pushes; only the "stop or carry on" rule changed.

**How to check it**
- The settings file parses as JSON. A session started with GitHub unreachable should carry on rather than stop.

**Open items**
- Hal's office probably has the same automatic-run bug fixed in Tim's office today (runs started in the repo's top folder, so /cos wasn't found). Not changed here.
- Hal's `CLAUDE.md` still says to tell Hal and send a failed pull to Tim Everard; that fits, but could mention the GitHub-down case.

### 2026-11-08: The Chief of Staff's automatic runs start in the office folder

The office started Claude Code in the repo's top folder, where the `/cos` skill and `tracker.py` aren't, so automatic runs did nothing. It now starts in `Hal's Job Search/`, and refuses with a clear message if the skill is missing. The same fix was made in Tim's office. Details are in `notes/changes/claude-youthful-hopper-alwu7m.md`.

### 2026-11-08: Hal's Job Search created

See `notes/changes/claude-adoring-maxwell-qzaklb.md` for what was added and why. The office starts as a clean template with no personal data.
