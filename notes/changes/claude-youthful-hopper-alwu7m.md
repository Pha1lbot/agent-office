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
