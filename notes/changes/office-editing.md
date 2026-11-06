# Branch: office-editing

**Started:** 2026-11-06
**Status:** In review ([PR #6](https://github.com/Pha1lbot/agent-office/pull/6)); merge after #5

## Purpose

Tim asked to be able to edit roles in the office himself, especially to change their status by hand, and for the Chief of Staff to hand out tasks based on what he does. He chose automatic GitHub backup of his edits and automatic Chief of Staff runs. He also renamed the Chief of Staff to **Hal**. Built on `import-dashboard` ([Pha1lbot/agent-office#5](https://github.com/Pha1lbot/agent-office/pull/5)), which should be merged first.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Hal's contract, and the tracker working without Windows time zone data

**What changed**
- `shared/office-view/public/contracts.js`: new. A novelty "Contract of Employment" for Hal: parties, terms (Chief of Staff, start date 6 November 2026, reports to Tim, line manager of the other three, salary **£200,000 per annum**, hours), duties and responsibilities taken from his instructions, gross misconduct (applying or emailing for Tim, inventing experience, force-pushing), holiday, benefits, notice period ("Ctrl+C"), and signatures. The footer says it is a novelty, not a legal contract.
- `shared/office-view/public/office.js`, `index.html`, `style.css`: Hal's name on his card and in the side panel is now a link that opens the contract, styled as a printed document. It opens at the top and works at phone width.
- `shared/tools/tracker.py`: if Python has no time zone data (normal on Windows unless the `tzdata` package is installed), the tracker uses the PC's own clock instead of crashing on `ZoneInfo("Europe/London")`.

**Why**
- Tim asked for Hal's name to open a fake contract with his roles and responsibilities and a £200k salary.
- Tim is about to install Python on Windows, where the tracker's UK time zone lookup would fail without `tzdata`.

**Decisions**
- The contracts live in their own file, keyed by agent id, so the others can get one later without touching the page code.
- The time zone fallback uses the PC clock, which is UK time on Tim's PC, rather than asking him to install an extra package.

**How to check it**
In a headless browser:
- Clicking Hal's name on the card or in the side panel opens the contract; Close shuts it.
- It opens scrolled to the top, with no sideways scrolling at phone width and no page errors.
- The first version opened at the bottom (the browser focused the Close button), and the page's header style put "The Agent Office" beside the title. Both were fixed.

The tracker was run with the time zone lookup forced to fail, and it still worked. `npm test` passes.

**Open items**
None.

### 2026-11-06: Open pull request

**What changed**
- This file: status set to "In review", with a link to [Pha1lbot/agent-office#6](https://github.com/Pha1lbot/agent-office/pull/6).

**Why**
Ready for Tim to merge, after [Pha1lbot/agent-office#5](https://github.com/Pha1lbot/agent-office/pull/5).

**Decisions**
The PR targets `main`; until #5 is merged it also shows #5's commits.

**How to check it**
Open the pull request link.

**Open items**
After merging both: CHANGELOG lines for #5 and #6; Tim pulls, reopens the office, and tries a status change.

### 2026-11-06: Editable Roles tab, automatic backup, Hal starts by himself, and the Chief of Staff renamed Hal

**What changed**
- `shared/tools/tracker.py`:
  - `add` and `set` take `--by tim`, which marks the change as Tim's in the role's history.
  - New inbox: when Tim sets a role to shortlisted, approved or interview, or adds a role, a task is queued for Hal ("Draft a tailored CV and cover letter", "Make the PDFs", "Write interview prep notes", "Read the advert, write the listing and score the fit"). The same task is never queued twice.
  - New `inbox list` and `inbox done <ids>|--all` commands; `list --summary` shows the inbox count.
- `shared/office-view/src/tools.ts`: runs the tracker and git without a shell, and finds Python and Claude Code. On Windows it tries `python` and `py` before `python3`, because `python3` there is often a Microsoft Store placeholder.
- `shared/office-view/src/backup.ts`:
  - Commits the tracker files 15 seconds after the last edit, with an "Office: …" message, then pulls and pushes.
  - Never forces. On a clash it cancels only the half-done merge, keeps Tim's commit and shows an error.
  - Waits while Hal is running.
- `shared/office-view/src/auto-cos.ts`: starts Hal in the background with `claude -p` when Tim's changes queue work.
  - Timing: waits 2 minutes after the last change, runs one at a time, at most 8 a day, and stops a run after 20 minutes.
  - Settings: runs on Sonnet, with only the job-search tools allowed. The on/off switch is saved in `.office-settings.json`; each run's log goes in `logs/`. Both are git-ignored.
- `shared/office-view/src/server.ts`:
  - New `POST /api/roles/<id>` (edit chosen fields), `POST /api/roles` (add a role) and `POST /api/cos` (run now, auto on/off).
  - Pushes a "system" status (backup and Hal) to the page.
  - Edits go through `tracker.py` so there's one set of rules. Values are limited in length and kept to one line.
- `shared/office-view/src/office.ts`: the Chief of Staff's character is named **Hal**, with "Chief of Staff" shown as its role. Team members gain a `role` field.
- `shared/office-view/public/*`:
  - A status dropdown on every row. Skipped and rejected ask for an optional reason.
  - Click a row to edit next step, priority, interview date and who with, reason and notes.
  - "+ Add role" dialog.
  - Status strip: backup state, and Hal's state (starts in m:ss, working, finished or error), with Run now and an Auto start switch.
  - "Waiting on you" counts changes queued for Hal. The Office tab cards show "Hal · Chief of Staff".
- `.claude/skills/cos/SKILL.md`:
  - Hal introduces himself as Hal.
  - New "Office changes" section: how to act on each inbox task, briefing each subagent once, then marking items done and committing. When started automatically he asks Tim nothing and records questions as actions instead.
  - The start of the day handles the inbox first.
- `.claude/agents/senior-admin.md`: new interview-prep task (company, likely questions with answer plans from the CV, gaps, questions to ask, practical details; never invent).
- `.claude/agents/lead-recruiter.md`: new task for reading the advert of a role Tim added.
- `.claude/agents/admin.md`: Tim's edits are marked `by: tim`; don't undo them.
- `CLAUDE.md`: new "Edits made in the office" section. The office's own "Office:" commits of the tracker don't get a notes entry, because the tracker's history records each change; all other commits still do. Tim agreed to this when choosing automatic backup.
- `README.md`, `agents/chief-of-staff/README.md`, `shared/conventions/handoffs.md`, the subagent prompts: Chief of Staff renamed Hal. `/cos` is unchanged.
- `shared/office-view/README.md`: how editing, backup and Hal's automatic runs work, what's needed, and the new settings.
- `.gitignore`: the office's local settings file and Hal's run logs.

**Why**
Tim: "On the dashboard i need to be able to interact and edit - I need to be able to manually change the status. Then the cos can hand out tasks based on what im looking for." He picked "Auto-commit and push" and "Automatically", and asked for the Chief of Staff to be called Hal.

**Decisions**
- Only status changes that need work start Hal: shortlisted, approved, interview, and a new role. Notes, next steps, applied and skipped don't, to save tokens.
- The 2-minute wait, one run at a time, 8-a-day cap, Sonnet, 20-minute limit and on/off switch protect Tim's weekly limits, since automatic runs happen without him asking each time.
- Automatic runs use `--permission-mode acceptEdits` and an allow-list (file tools, web, git, Python, pandoc) rather than skipping permissions, so they can't run other commands.
- Hal flushes the backup before he starts, so he works from the saved version. The backup waits while he runs, since he commits his own work.
- `/cos` keeps its name, so Tim's habits and the automatic prompt keep working; only the display name and how Hal introduces himself changed.

**How to check it**
- `tracker.py` inbox tested: Tim's shortlisted, interview and add queue tasks; repeats don't queue twice; agents' changes don't queue anything; `inbox done` with an unknown id errors.
- End to end in this session against a throwaway git repo (with its own remote) and a fake `claude`:
  - Set a role to shortlisted from the dropdown; the strip showed "starts in 0:06".
  - Skipped a role, which opened the reason box; edited a next step and set approved, and the dialog said "Hal will make the PDFs".
  - Added a role.
  - Hal started by himself, got the right prompt and arguments, and cleared the inbox.
  - The 4 edits were committed as "Office: 4 changes by Tim" and pushed to the remote. No page errors.
- `npm test` (13) and `npm run check` pass.

**Open items**
- Not yet tried on Tim's Windows PC: Python detection, `claude -p` started through `cmd`, and pushing with his GitHub sign-in.
- The office's own commits don't run Hal's notes routine; Hal's own runs do add notes as usual.

