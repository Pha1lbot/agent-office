# Branch: claude/youthful-hopper-alwu7m

**Started:** 2026-11-06
**Status:** In progress

## Purpose

Tim asked to start planning the office view (`notes/plans/office-view.md`). While planning, he named the first agents that should work in the office: a four-person job-search team (Chief of Staff, Lead Recruiter, Senior Admin, Admin). He chose to build the agents first, on this branch, and the office view on the next branch.

This branch sets up:
- the four agents and how they hand work to each other,
- a role tracker (the data the office view's dashboard tab will show later),
- tools that turn drafted CVs and cover letters into Word files, and into PDFs once Tim approves them.

## Change log

Newest entries first. Never delete or rewrite old entries.

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
