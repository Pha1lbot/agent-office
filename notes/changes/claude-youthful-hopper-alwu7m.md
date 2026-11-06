# Branch: claude/youthful-hopper-alwu7m

**Started:** 2026-11-06
**Status:** Merged 2026-11-06 ([PR #9](https://github.com/Pha1lbot/agent-office/pull/9)); earlier work merged in [PR #3](https://github.com/Pha1lbot/agent-office/pull/3)

## Purpose

Tim asked to start planning the office view (`notes/plans/office-view.md`). While planning, he named the first agents that should work in the office: a four-person job-search team (Chief of Staff, Lead Recruiter, Senior Admin, Admin). He chose to build the agents first, on this branch, and the office view on the next branch.

This branch sets up:
- the four agents and how they hand work to each other,
- a role tracker (the data the office view's dashboard tab will show later),
- tools that turn drafted CVs and cover letters into Word files, and into PDFs once Tim approves them.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Record the merge of #9

**What changed**
- `CHANGELOG.md`: line for [Pha1lbot/agent-office#9](https://github.com/Pha1lbot/agent-office/pull/9).
- This file: status set to merged.

**Why**
The "After a merge" routine in CLAUDE.md.

**Decisions**
None.

**How to check it**
Read the top of `CHANGELOG.md`.

**Open items**
- On the new laptop, the clone failed with "Repository not found" (a sign-in problem). Tim is retrying with `https://Pha1lbot@github.com/...` so Git asks him to sign in, then runs `setup-pc.ps1`.

### 2026-11-06: Set-up for a second laptop, and main kept up to date after every merge

**What changed**
- New `shared/tools/setup-pc.ps1`: one-off set-up for a new Windows PC. Installs any missing Node.js, Python, pandoc and LibreOffice with winget, sets the git name and email if unset, puts the copy on `main`, runs a sync, installs the office's npm packages, sets up the scheduled pull, and checks for Claude Code. Safe to run again.
- `shared/tools/sync.ps1`: rewritten. It fetches first, then: on `main`, fast-forwards; on another branch, updates local `main` with `git fetch origin main:main`; with local commits not yet on GitHub, merges (`--no-edit`), and on a clash runs `git merge --abort` and logs it. Never forces or discards anything.
- `shared/tools/install-sync.ps1`: the scheduled task now runs every 5 minutes instead of 15.
- `shared/office-view/Open Office.cmd`: runs `sync.ps1` before starting the office.
- `README.md`: new "Setting up a new PC or laptop" steps, and the sync section updated.
- Restarted this branch from `main`, as its earlier work was merged. Also did the after-merge routine for #7 and #8: CHANGELOG lines and both notes files marked merged.

**Why**
Tim is setting up a second laptop. On the first one he was updating `main` by hand after merges. Possible causes: the scheduled task was never installed, the laptop was on another branch (the old script only pulled the current branch), or a local office-backup commit had made `--ff-only` refuse. The new script handles the last two, and the setup script installs the task.

**Decisions**
- Polling every 5 minutes rather than a push from GitHub: GitHub can't reach a laptop without exposing it to the internet, and a `git fetch` with nothing new is very cheap.
- The sync merges but doesn't push. Pushing stays with the office backup and Claude sessions.
- The setup script doesn't install Claude Code itself; it points to the official instructions.

**How to check it**
The git steps were tested in bash against a throwaway repo: on a branch, local `main` updates; one local commit plus one new on GitHub merges; a clash is aborted with nothing changed. PowerShell isn't available here, so the scripts haven't been run on Windows yet.

**Open items**
- Tim runs `setup-pc.ps1` on the new laptop, and re-runs `install-sync.ps1` on the old one to get the 5-minute task.

### 2026-11-06: Open pull request for preference reviews

**What changed**
- This file: status set to "In review", with a link to [Pha1lbot/agent-office#3](https://github.com/Pha1lbot/agent-office/pull/3).

**Why**
The preference-review work needs merging into `main`, because Tim's PC stays on `main`.

**Decisions**
Tim merges it himself; the PR asks for a merge commit, not a squash.

**How to check it**
Open the pull request link.

**Open items**
After merging: add the CHANGELOG line (the "After a merge" routine).

### 2026-11-06: Suggest preference updates from what Tim does with roles

**What changed**
- `shared/tools/tracker.py`: new `reason` field (why Tim skipped a role or was rejected). New `insights [--since DATE]` command that summarises Tim's decisions: picked vs skipped counts, outcomes, pay (lowest yearly figure; day rates and "competitive" are left out), work style (remote, hybrid, office), title words, sources, average fit score and the reasons Tim gave.
- `.claude/skills/cos/SKILL.md`: Chief of Staff asks once for an optional reason when Tim passes on roles. New "Preference reviews" section: runs when Tim asks, or is offered in one line once 10 or more decisions have been made since the last review. It makes up to 5 suggestions, each with evidence and at least 3 decisions behind it, edits `preferences.md` only for the ones Tim accepts, and logs the result.
- `.claude/agents/admin.md`: how to record a reason.
- `jobs/preference-reviews.md`: new log of suggestions and Tim's answers. The top entry's date is where the next review starts.
- `jobs/README.md`, `README.md`, `shared/job-search/preferences.md`: explain the reviews and the `/cos review my preferences` command.
- This file: status set back to "In progress", because the branch was restarted from `main` for this follow-up.

**Why**
Tim asked whether his preferences could update automatically from the details on his dashboard. He chose to learn from what he does with roles (picks, skips, outcomes), with changes suggested for him to approve rather than made automatically.

**Decisions**
- The patterns are worked out by `tracker.py insights`, not by the model reading every role, so a review costs a few hundred tokens however big the tracker gets.
- Suggest-and-approve, so the search can't drift from what Tim wants without him knowing. At least 3 decisions are needed behind each suggestion, so a single odd choice isn't over-read.
- Reviews are offered, never run unasked, to save tokens.
- Reasons are optional and asked once, so skipping roles stays quick.
- The branch was restarted from `main` after #1 and #2 merged, as a fresh change (fast-forward, no force push).

**How to check it**
Tested in this session on sample data in the scratchpad: 5 roles (2 picked, one of them reaching interview, and 3 skipped with reasons). `insights` reported the right counts, pay medians, work styles, title words, sources, fit averages and reasons, and `--since` a future date reports nothing. Pay parsing was checked on ranges, "40k", day and hour rates, "Up to £55,000" and "competitive". On the PC: skip a few roles with reasons, then run `/cos review my preferences`.

**Open items**
Pay parsing is approximate (it uses the lowest figure in the text). Unusual formats are left out rather than guessed. The office view's dashboard could show these insights later.

### 2026-11-06: Fix merge conflict with main

**What changed**
- Merged `main` into this branch to clear the conflict that stopped [Pha1lbot/agent-office#2](https://github.com/Pha1lbot/agent-office/pull/2) merging. `README.md` and this notes file conflicted; this branch's versions were kept.
- `CHANGELOG.md`: added the line for the work merged in [Pha1lbot/agent-office#1](https://github.com/Pha1lbot/agent-office/pull/1), which was missing.

**Why**
Tim couldn't merge #2 because of a conflict. An earlier pull request from this same branch, #1, had already been squash-merged into `main`. It contained the commits up to "Document the new layout". Because a squash merge turns them into one new commit, git saw the same two files changed on both sides.

**Decisions**
- Checked first that `main` was exactly this branch at commit 238b8a8 ("Document job-search team layout and daily use"). So this branch's version of both files is simply the newer one, and nothing on `main` is lost by keeping it. After the merge, the branch's files are identical to before.
- Merged rather than rebased. A rebase would need a force push, which CLAUDE.md forbids without Tim's say-so.
- This entry and the CHANGELOG line go in the merge commit itself, so the change and its note are in the same commit.

**How to check it**
#2 should now show "no conflicts" on GitHub. `git diff 238b8a8 origin/main` is empty, which confirms `main` held nothing beyond this branch.

**Open items**
Tim to merge #2. To avoid this next time, keep merging with "Create a merge commit" rather than "Squash and merge", or start a fresh branch after each squash merge.

### 2026-11-06: Open pull request

**What changed**
- `notes/changes/claude-youthful-hopper-alwu7m.md`: status set to "In review", with a link to the pull request.

**Why**
Tim wants his PC kept on `main`, so this branch needs merging. A pull request was opened as [Pha1lbot/agent-office#2](https://github.com/Pha1lbot/agent-office/pull/2), with a summary of these notes, as CLAUDE.md requires.

**Decisions**
Tim merges it himself; Claude does not push to `main`.

**How to check it**
Open the pull request link.

**Open items**
After merging: on the PC run `git checkout main`, `git pull` and `install-sync.ps1`; add the CHANGELOG line.

### 2026-11-06: Keep Tim's PC on main

**What changed**
- `CLAUDE.md`: new "Tim's PC stays on `main`" section in the backup routine. On the PC, Claude uses a branch only when needed and switches back to `main` once the branch is pushed and its pull request is open. Cloud sessions can still use their own branches.

**Why**
Tim said "Keep pc on main", after hearing that the automatic pulls only update the branch the PC is on.

**Decisions**
This is written as a rule for Claude rather than enforced by a script. A script that switched branches automatically could get in the way of work in progress. A pull request is opened for this branch so `main` gets the job-search team and the sync setup; Tim merges it himself.

**How to check it**
After the pull request is merged, run `git checkout main` and `git pull` on the PC. `git status` should say "On branch main" and up to date.

**Open items**
Tim to merge the pull request. After the merge, add this branch's line to `CHANGELOG.md` (the "After a merge" routine).

### 2026-11-06: Pull automatically on Tim's PC and at session start

**What changed**
- `.claude/settings.json`: new. A SessionStart hook runs `git pull --ff-only` when a Claude Code session starts or resumes (not on clear or compact). It times out after 30 seconds, never asks for a password, and always exits cleanly. If the pull fails, Claude is told to run `git status` and `git pull` and sort it out with Tim.
- `shared/tools/sync.ps1`: new. Windows script that runs `git pull --ff-only` on this repo and logs the result to `%LOCALAPPDATA%\agent-office-sync.log`, keeping the last 500 lines.
- `shared/tools/install-sync.ps1`: new. One-off setup that registers a Windows scheduled task, "agent-office git pull", running `sync.ps1` at log-on and every 15 minutes. The remove command is in the file and the README.
- `README.md`: new "Keeping your PC up to date" section.
- `CLAUDE.md`: start-of-session step 2 now mentions the hook and says to check its result.

**Why**
Tim asked to keep his local copy up to date after every merge. After choosing the after-merge rule, he asked for the scheduled pull and the start-up hook as well.

**Decisions**
- `--ff-only` everywhere, so an automatic pull never creates a merge commit or touches local changes. If Tim's copy has diverged it stops, and a person or Claude sorts it out, following CLAUDE.md's "never discard" rules.
- `GIT_TERMINAL_PROMPT=0` and a timeout, so a credential prompt or a network problem can't hang the scheduled task or hold up a session.
- The hook runs only on start and resume. Clear and compact happen mid-session, and pulling in the middle of work could surprise it.
- The hook command is written inline in `settings.json` rather than as a separate script, to keep it to one small file.
- Windows scripts, because Tim works from a PC. Task Scheduler needs no extra software.

**How to check it**
- Hook: tested in this session. In the repo it prints "Already up to date." and exits 0. Pointed at a folder that isn't a repo, it prints git's error and the "did not finish" message and still exits 0. On Tim's PC, start Claude Code in the folder; the first thing Claude sees is the pull result.
- Scheduled task: not tested here (no Windows or PowerShell in the cloud sandbox). On the PC, run `install-sync.ps1`, then check that "agent-office git pull" appears in Task Scheduler and that the log file gets an "ok" line within 15 minutes.

**Open items**
- Check on Tim's PC that the hook runs. Claude Code on Windows runs hook commands through Git Bash, and the inline command uses bash syntax. If it doesn't run, move it into a small script.
- PowerShell may flash a window briefly every 15 minutes. If that is annoying, it can be launched through a small VBScript wrapper instead.
- The scheduled pull only updates the branch the PC is on, so the PC should stay on `main`.

### 2026-11-06: Pull main after every merge

**What changed**
- `CLAUDE.md`: new "After a merge" section in the backup routine. After Claude merges a pull request, or Tim says one has been merged, Claude checks for uncommitted changes, switches to `main`, runs `git pull`, adds the CHANGELOG line, pushes, and tells Tim the copy is up to date.

**Why**
Tim asked how to keep his local copy up to date and whether it could pull after every merge. He chose this option (pull after merges Claude does or is told about).

**Decisions**
Options offered: a scheduled pull on Tim's PC every 15 minutes, a Claude Code start-up hook that pulls at the start of every session, or this rule in CLAUDE.md. Tim picked the CLAUDE.md rule. It needs nothing installed, but it only works when Claude does the merge or is told about it. A merge clicked on GitHub with no Claude session running is picked up by the existing "pull at the start of every session" step. The CHANGELOG step from "Change notes" was folded in, since it also happens straight after a merge.

**How to check it**
After the next pull request is merged, say "it's merged" in Claude Code on the PC. Claude should switch to `main`, pull, add the CHANGELOG line, push, and report that `main` is up to date.

**Open items**
The scheduled pull and the start-up hook were not added. Either can be added later if merges made on GitHub keep being missed.

### 2026-11-06: Document the new layout and how to run the job search

**What changed**
- `CLAUDE.md`: Layout section now describes `jobs/` and `.claude/`. No other rules changed.
- `README.md`: added the repo layout, the job-search team, one-off setup on Tim's PC (Python, pandoc, LibreOffice, CV, preferences, sources) and the daily `/cos` commands.

**Why**
The plan Tim approved adds two top-level folders, and CLAUDE.md's layout section should match the repo. Tim also needs a short guide to start using the team.

**Decisions**
The guide goes in the README so it is the first thing seen on GitHub, rather than a separate file.

**How to check it**
Read `README.md` on GitHub and follow the setup steps on Tim's PC.

**Open items**
- Tim: add his CV, fill in `preferences.md` and `sources.md`, then run `/cos start the day`.
- Next branch: the office view (PixiJS page, Node/TypeScript bridge, Claude Code hooks) with one character per agent and a dashboard tab reading `jobs/tracker.json`. First check whether hook data says which subagent made each tool call.
- This branch is not merged into `main` yet. When it is, add a line to `CHANGELOG.md`.

### 2026-11-06: Add the four job-search agents

**What changed**
- `.claude/skills/cos/SKILL.md`: Chief of Staff, started with `/cos`. It covers the daily routine (find roles, add them to the tracker, rank them, ask Tim, draft, approve, record outcomes), token-saving rules, checking the setup first, and committing and pushing after each step.
- `.claude/agents/lead-recruiter.md`: subagent (Sonnet) that searches the sites in `sources.md`, skips roles already tracked, scores fit 1 to 5 and writes a short `listing.md` per role.
- `.claude/agents/senior-admin.md`: subagent (Sonnet) that writes a tailored `cv.md` and `cover-letter.md` from Tim's default CV, notes gaps in `notes.md` and builds the Word files. It makes a text copy of a Word CV with pandoc so the CV is cheap to reread.
- `.claude/agents/admin.md`: subagent (Haiku) that changes the tracker only through `tracker.py`.
- `agents/chief-of-staff/`, `agents/lead-recruiter/`, `agents/senior-admin/`, `agents/admin/`: a README for each with purpose, inputs, outputs and model, as CLAUDE.md requires.
- `shared/tools/tracker.py`: new `--id` option on `add`, so the tracker id matches the folder name the Recruiter chose. Ids must be lower case letters, numbers and hyphens.

**Why**
Tim asked for these four roles: Chief of Staff to run the agents, keep handovers token-efficient and set the day's priorities; Lead Recruiter to find roles by skills, experience and pay; Senior Admin to make CVs and cover letters from his default CV for COS's priority list; Admin to keep the dashboard's role statuses up to date.

**Decisions**
- Chief of Staff is a skill, not a subagent, because it runs in the main session Tim talks to, and subagents cannot call other subagents.
- The prompts live in `.claude/` because that is where Claude Code looks for them. `agents/<name>/README.md` documents each one, so the prompt text is not duplicated.
- Models: Sonnet for judgement and writing, Haiku for Admin's simple tracker updates.
- Tools are limited per agent: Admin has no web access or file writing, and only the Recruiter can browse.
- COS stops and asks Tim before any CV is drafted, so tokens are not spent on roles he doesn't want.
- Job-search commits get a short line in the branch notes file to follow CLAUDE.md's "every commit has a note" rule. Tim may want to relax this for routine job data later.

**How to check it**
Front matter checked in this session (name, description, tools, model on each subagent; name and description on the skill). The `--id` option was tested: duplicates and badly formed ids are refused. To try the team: on Tim's PC, open Claude Code in the repo, check `/agents` lists the three subagents, and run `/cos start the day`.

**Open items**
Not yet run end to end: that needs Tim's CV, preferences and job sites. The office view comes on the next branch.

### 2026-11-06: Add Word and PDF document tool

**What changed**
- `shared/tools/make_docs.py`: new tool. `make_docs.py <role-id>` turns `jobs/roles/<role-id>/cv.md` and `cover-letter.md` into `.docx` with pandoc. `make_docs.py --pdf <role-id>` turns those `.docx` files into PDFs with LibreOffice. If `shared/job-search/cv/default-cv.docx` exists it is used as the style file (fonts, styles, page size); otherwise A4 with 2 cm margins is set.

**Why**
Tim wants CVs and cover letters made as Word files, with the option to confirm each one and then get a PDF.

**Decisions**
- Senior Admin writes markdown and the script makes the Word file. This is cheaper on tokens and more reliable than having the model build Word files directly, and Tim's CV styling is applied the same way every time.
- The PDF is made from the approved Word file, not from the markdown, so the PDF matches exactly what Tim checked, including any edits he made in Word.
- LibreOffice runs with a temporary profile, so it works even when LibreOffice is already open on Tim's PC. It also checks the usual Windows install folders.
- A4 is the fallback because pandoc's default style leaves the page size out and LibreOffice then picks US Letter.

**How to check it**
Checked in this session with a sample CV and cover letter in the scratchpad: both `.docx` files and both PDFs were made, the PDF text and layout looked right, the page is A4 (595 x 842 pt) without a style file, and a style file's own page size is kept. A missing role folder gives a clear error.

**Open items**
Tim needs pandoc and LibreOffice installed on his PC (install links are in the script's error messages; setup steps will go in the guide).

### 2026-11-06: Add handover rules, job-search files and role tracker

**What changed**
- `shared/tools/tracker.py`: new command-line tool for the role tracker (`add`, `set`, `list`, `show`, `render`). Standard library only. Every change writes `jobs/tracker.json` and rebuilds `jobs/tracker.md`. Checks statuses and fit scores, refuses duplicate links, records a dated history of status changes, uses UK dates.
- `jobs/tracker.json`, `jobs/tracker.md`: empty tracker.
- `jobs/today.md`: placeholder for Chief of Staff's daily priority list.
- `jobs/README.md`: what lives in `jobs/` and the list of role statuses.
- `jobs/roles/.gitkeep`: keeps the empty roles folder in git.
- `shared/conventions/handoffs.md`: handover rules (pass file paths not contents, fixed short brief and reply formats, one line per role, team rules).
- `shared/job-search/preferences.md`, `sources.md`: fill-in files for Tim (what roles, skills, pay, location, deal-breakers, daily limits; which job sites).
- `shared/job-search/cv/README.md`: where Tim puts his default CV.

**Why**
Tim wants the team to keep handovers token-efficient and wants a status dashboard. The tracker is the dashboard's data; the office view will show it later.

**Decisions**
- JSON as the source of truth with a generated markdown table: the office view can read the JSON, and the table is readable on GitHub and on a phone.
- Agents change the tracker through a script rather than editing JSON, so the data stays valid and the Admin agent (on Haiku) spends few tokens.
- Python standard library only, so it runs on Tim's PC without installing anything beyond Python.
- Daily limits default to 10 roles found and 3 shortlisted; Tim can change them in `preferences.md`.

**How to check it**
Run `JOBS_DIR=/some/temp/folder python3 shared/tools/tracker.py add --title "Test" --company "Acme"`, then `set <id> status=shortlisted`, then `list --summary`, and look at the `tracker.md` in that folder. Checked in this session: duplicate links and bad statuses are refused with a clear message, and ids are unique.

**Open items**
Tim to fill in `preferences.md` and `sources.md` and add his CV.

### 2026-11-06: Record Tim's decisions and start branch notes

**What changed**
- `notes/changes/claude-youthful-hopper-alwu7m.md`: new notes file for this branch.
- `notes/plans/office-view.md`: status changed to "Planned, agents first". Added Tim's answers to the open questions and the job-search team as the first agents.

**Why**
Tim asked to start planning the office view and answered its open questions in this session.

**Decisions**
Tim's answers, from the planning questions:
- View: browser page (PixiJS) with a Node/TypeScript bridge, in `shared/office-view/`. Not a VS Code panel or terminal view.
- Build our own small version, borrowing ideas from Pixel Agents and Bit Office, rather than forking.
- Art: simple shapes drawn in code first; real sprites later.
- First agents: Chief of Staff, Lead Recruiter, Senior Admin, Admin.
- Run them in one Claude Code session: Tim talks to Chief of Staff, which calls the others as subagents. This was chosen over separate sessions per agent or a scheduled daily run because it uses the fewest tokens and gives Tim one place to talk.
- Job sites: Tim will name them. Default CV: Tim will add his own.
- CVs and generated documents are kept in this private repo so they are backed up.
- Documents are made as Word (.docx). After Tim confirms one, a PDF is exported from it.
- Dashboard: a tab in the office view, reading the tracker built on this branch.
- Order: agents first (this branch), office view next.

**How to check it**
Read `notes/plans/office-view.md` and confirm the decisions match what Tim chose.

**Open items**
The full build plan is in the sections that follow. Tim still needs to add his CV, job sites and preferences.
