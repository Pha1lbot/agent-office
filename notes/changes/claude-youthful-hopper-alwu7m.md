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
