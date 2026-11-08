# Branch: claude/adoring-maxwell-qzaklb

**Started:** 2026-11-08
**Status:** In progress

## Purpose

Tim has a friend, Hal, who is also looking for work. Tim wants Hal added to this GitHub repo with his own office and his own agents, so Hal can change his search requirements to suit him. The repo now holds two self-contained offices side by side: **Tim's Job Search** and **Hal's Job Search**. Tim also asked for an easy-to-read, in-depth guide to using the system (changing search requirements, adjusting templates, and so on).

Tim chose (2026-11-08): one repo with two folders (not a separate repo for Hal); Hal's folder starts as a clean template with none of Tim's data; Hal is his friend's real name, so Hal's Chief of Staff agent is renamed in Hal's office to avoid two Hals.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-08: Move Tim's office into its own folder

**What changed**
- `agents/`, `jobs/`, `.claude/` and `shared/` moved (with `git mv`, so history follows) into `Tim's Job Search/`. Nothing inside them was edited by the move: the tools find their data relative to their own location (`shared/tools/..` is the office folder), so they work unchanged.
- `shared/tools/sync.ps1`, `install-sync.ps1`, `setup-pc.ps1` stay at the repo root in `shared/tools/`. They are about the git copy as a whole, not one office. Tim's PC has a scheduled task pointing at `shared\tools\sync.ps1`, so leaving it where it is keeps his automatic pull working after the move.
- `shared/tools/setup-pc.ps1`: step 4 now runs `npm install` in every office folder that has an `office-view`; the closing message names the two folders.
- `Tim's Job Search/shared/office-view/Open Office.cmd`: the background sync now points at the root `shared\tools\sync.ps1` (`..\..\..\shared\tools\sync.ps1`).
- `.gitignore`: the office's local settings and logs are ignored in any office (`**/shared/office-view/...`).

**Why**
Each person's office needs its own `.claude/` (skills and agents), `shared/`, `jobs/` and `agents/`, because Claude Code loads `.claude/` from the folder it is opened in.

**Decisions**
- Folder names are exactly "Tim's Job Search" and "Hal's Job Search", as Tim asked, apostrophes and spaces included. Quoted paths cope with this; the one place that needed care was the `.cmd` launcher and the PowerShell scripts.
- Repo-wide things stay at the root: `CLAUDE.md` (backup rules, loaded by Claude Code from the parent folder too), `README.md`, `CHANGELOG.md`, `.github/`, `notes/`.

**How to check it**
- In `Tim's Job Search/shared/office-view`: `npm ci && npm test` (37 pass). In `Tim's Job Search/shared/tools`: `python3 -m unittest discover -p "test_*.py"` (25 pass).

**Open items**
- Tim's PC: any desktop shortcut to the old `shared\office-view\Open Office.cmd` must now point inside `Tim's Job Search`. Claude Code must now be opened in `Tim's Job Search`.
- The scheduled task "Rita's daily search" (disabled) has paths in its prompt that need the `Tim's Job Search/` prefix before it is turned back on.
