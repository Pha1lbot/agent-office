# Branch: main (Hal's Job Search)

**Started:** 2026-11-08
**Status:** Default branch

## Purpose

The change notes for work committed straight to `main` in Hal's Job Search: changes Tim Everard makes to it. It is separate from `main.md` (Tim's office) so the two offices never edit the same file. Everything else follows the rules in CLAUDE.md.

## Change log

Newest entries first. Never delete or rewrite old entries.

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
