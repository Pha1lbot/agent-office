# Branch: claude/adoring-maxwell-qzaklb

**Started:** 2026-11-08
**Status:** In progress (not yet a pull request)

## Purpose

Tim has a friend, Hal, who is also looking for work. Tim wants Hal added to this GitHub repo with his own office and his own agents, so Hal can change his search requirements to suit him. The repo now holds two self-contained offices side by side: **Tim's Job Search** and **Hal's Job Search**. Tim also asked for an easy-to-read, in-depth guide to using the system (changing search requirements, adjusting templates, and so on).

Tim chose (2026-11-08): one repo with two folders (not a separate repo for Hal); Hal's folder starts as a clean template with none of Tim's data; Hal is his friend's real name, so Hal's Chief of Staff agent is renamed in Hal's office to avoid two Hals.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-08: Hal's Chief of Staff is Tim, Hal is he/him, Hal's office never changes git, and a PC set-up guide

**What changed**
- `Hal's Job Search/`: the Chief of Staff is now **Tim** (was Cass): `.claude/skills/tim/` (`/tim`), the agent's name in the skill, READMEs, the office's labels and contracts. Internal ids in the office code (`cass` in `scene.js`, CSS classes, tracker actor labels) were left as they are, as they never show. The owner Hal now has he/him in the agent prompts, READMEs and office text (the earlier "they" wording was reversed).
- Hal's office is pull-only:
  - `shared/job-search/settings.json`: new `git_backup` (Hal's `false`, Tim's `true`).
  - `shared/office-view/src/server.ts` and `backup.ts` (both offices): the office's automatic commit-and-push is skipped when `git_backup` is false, with the message "Saving to GitHub is off in this office; edits stay on this PC".
  - Hal's `src/auto-cos.ts`: the automatic run may use only `git status`, `pull`, `log`, `diff`.
  - Hal's `.claude/skills/cos/SKILL.md`: the commit-and-push steps and the Backups section are replaced by a Git section (only `git status` and `git pull`). No notes entries from Hal's office.
  - Hal's `CLAUDE.md` rewritten: "Two Tims" (the Chief of Staff vs Tim Everard), the git rule, stay in this folder. Contract text, admin and chief-of-staff READMEs and the office README no longer say work is backed up to GitHub.
- `Hal's Job Search/GET-THE-OFFICE.md` (new): the second guide, for Hal: GitHub invite, Git, clone of `main`, setup script, Claude Code, opening the office and a desktop shortcut, getting updates, rules for his PC, troubleshooting.
- `Hal's Job Search/GUIDE.md`: regenerated from the shared template: Chief of Staff Tim, set-up section now points to `GET-THE-OFFICE.md`, the backups section is "Updates and backups" for a pull-only PC (copy your own files by hand), git undo tips removed. `Tim's Job Search/GUIDE.md` regenerated too (only small wording changes).
- Root `CLAUDE.md` and `README.md`: Hal's office uses Tim as Chief of Staff, he/him, never changes git; "Tim" in the root file always means Tim Everard; daily-run notes only for Tim's office.

**Why**
Tim asked: Hal's Chief of Staff can be called Tim; Hal is he/him; all git changes are made by Tim Everard only; and Hal needs a second guide for getting `main` onto his PC so he can use the office.

**Decisions**
- **Read-only access is the real guard.** The settings and instructions stop Hal's office committing, but a GitHub *Read* collaborator role is what stops pushes. The guide asks Tim to invite Hal with Read access.
- **Hal's own data is not on GitHub.** Since Hal doesn't commit, his CV, tracker and roles exist only on his PC. The guide tells him to copy them by hand. If Tim would rather back them up, he can copy them into the repo himself when asked.
- Kept the `GET-THE-OFFICE.md` guide inside Hal's folder (and not the repo root) so Hal's office keeps all its own files together; Tim can send it to him before he has the repo.

**How to check it**
- Both offices: `npx tsc --noEmit`, `npm test` (37 pass) and the Python tests (27 pass). Hal's office starts and lists Tim, Rita, Wren, Cole, Ada.
- Read `Hal's Job Search/GET-THE-OFFICE.md` as a first-time user.

**Open items**
- Tim must invite Hal on GitHub with **Read** access (Settings, Collaborators).
- `sync.ps1` merges when a PC is ahead; Hal's PC never is. If Hal edits an instruction file that Tim later changes, his pull can refuse: the guide says to send the message to Tim.
- The scheduled-task path update and Windows checks from the previous entry are still open.

### 2026-11-08: Hal's Job Search created, and a guide for both offices

**What changed**
- `Hal's Job Search/` (new, 77 files): a copy of Tim's office with none of Tim's data. Made by copying `Tim's Job Search/`, then:
  - Names: the owner Tim became Hal; Hal's Chief of Staff agent (the old "Hal") became **Cass**, so there aren't two Hals. The `/hal` skill folder became `.claude/skills/cass/` (`/cass`); `/cos` works in both. Hal's pronouns weren't given, so docs and prompts use "they"/"their" or Hal's name.
  - Emptied: `jobs/tracker.json` (no roles), `tracker.md`, `today.md`, `preference-reviews.md`, `jobs/roles/` (only `.gitkeep`). Left out: Tim's imports, the CV PDF, `import_dashboard.py` (a one-off for Tim's old dashboard) and the office-view mockup screenshots.
  - Blank starters for Hal to fill in: `shared/job-search/preferences.md`, `sources.md`, `cv-rules.md` (generic starter rules), `cv/cv-bank.md`, `cv/base-cv.json` (obvious placeholders, a valid two-page CV), `cv/README.md`, and `settings.json` (pay figures switched off).
  - Cass's skill (`.claude/skills/cos/SKILL.md`) now stops with a clear message while a starter file still says "please fill this in" / "please replace everything", and no longer assumes the 6:31 scheduled search, Hitmarker or Tim's Outlook sites. Daily-run notes go to `notes/changes/main-hals-job-search.md`.
  - `test_cv_template.py` assertions use the placeholder CV; `contracts.js` and a few UI strings no longer name Tim's pay or esports.
- `Tim's Job Search/GUIDE.md` and `Hal's Job Search/GUIDE.md` (new): the in-depth guide Tim asked for (what the team does, folder map, first-time setup for Hal, every-day commands, the office, changing the search, the CV, changing templates, changing how the team works, backups and sharing, troubleshooting, a cheat sheet). One template, two outputs (names and the setup section differ).
- `Tim's Job Search/CLAUDE.md`, `Hal's Job Search/CLAUDE.md` (new): short office-level instructions, including "work only in this folder".
- `CLAUDE.md` (root): layout rewritten for two offices; new "Two offices, one repo" section (stay in your folder; code is two copies; Hal's pronouns; where daily-run notes go; privacy note); worktree instructions name the office folder.
- `README.md` (root): layout table for the two offices; setup and daily-use steps say "your office folder".
- Both offices, so Hal's search settings really are changeable (not just in text):
  - `shared/job-search/settings.json` (new): `ideal_pay` and `minimum_pay`. `shared/tools/tracker.py` `rank()` used to have £60k and £50k written into the code; it now reads these (`pay_bands()`). Tim's file holds 60000 and 50000, so his ranking is unchanged. `test_tracker.py` has a new `PayBandTests`.
  - File names: `make_docs.py` and the office (`roles.ts`, `server.ts`) used a fixed `Tim_Everard_` prefix. They now take it from `name` in `cv/base-cv.json` (Tim's is still `Tim_Everard`). `roles.test.ts` sets the prefix explicitly.
  - `public/index.html`: the page title and sidebar name read "Tim's Job Search" / "Hal's Job Search" (the sidebar used to say "Job Hunt", with Tim's initials).

**Why**
Tim asked to duplicate everything for a friend, Hal, who is job hunting too: his own office and agents so he can change his search requirements, with Tim's data left out, and an easy-to-read guide covering things like changing search requirements and adjusting templates.

**Decisions**
- **One repo, two folders** (Tim's choice), not a separate repo. Consequence: GitHub gives Hal read access to Tim's folder and Tim to Hal's. Offered a separate repo for Hal as the private option; Tim chose to keep one repo. The root `CLAUDE.md` and the guide say so plainly.
- **Two independent copies of the code**, not a shared library, so Hal can change anything in his office without affecting Tim's. The cost is that a fix in one needs repeating in the other; recorded in the root `CLAUDE.md`. Both copies currently differ only in names, pronouns, the data files and Hal's tests.
- **Clean template** for Hal (Tim's choice), not a copy of Tim's data.
- **Hal's Chief of Staff renamed Cass** (Tim's friend is Hal). It starts with C like "Chief", following the plan's rule that each name starts with the job's letter (Rita, Wren, Cole, Ada).
- **Folder names kept exactly as asked**, apostrophes and spaces included. The guide tells people to put them in double quotes.
- **Repo-level Windows scripts stay in the root `shared/tools/`** (sync, install-sync, setup-pc), so the scheduled task already on Tim's PC keeps finding `sync.ps1`.
- The internal label `--by tim` in `tracker.py` and the tracker history is left as is in both offices. It means "the owner" and is also in Tim's existing data.

**How to check it**
- Each office: `cd shared/office-view && npm ci && npm test && npx tsc --noEmit` (37 pass), and `cd shared/tools && python3 -m unittest discover -p "test_*.py"` (27 pass).
- Start each office (`npm start`) and open http://127.0.0.1:4747: the title is "Tim's Job Search" or "Hal's Job Search"; Tim's shows his 53 roles, Hal's is empty.
- `python3 shared/tools/cv_template.py shared/job-search/cv/base-cv.json x.pdf` in Hal's folder makes a two-page placeholder CV.
- Read the two `GUIDE.md` files.

**Open items**
- **Tim's PC:** open Claude Code and the office from `Tim's Job Search`; re-run `setup-pc.ps1` once; repoint any shortcut. The guide's section 3 says this.
- **Scheduled task "Rita's daily search"** (currently disabled) still names `.claude/skills/cos/SKILL.md`, `jobs/today.md` and `notes/changes/main.md` at the repo top. Its prompt needs the `Tim's Job Search/` prefix before it is switched on again. Not changed, because it is outside the repo.
- Hal has none of the above scheduled morning search; the guide says it is optional.
- Hal still needs to be invited to the repo on GitHub (Settings, Collaborators). Not done from here.
- The office's build number counts every commit in the repo, so it will also rise when Hal's office commits.
- Not tested on Windows: `Open Office.cmd` and `setup-pc.ps1` edits (path changes only).
- The pull request is not opened yet.

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
