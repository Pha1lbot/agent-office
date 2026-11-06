# Branch: team-v2

**Started:** 2026-11-06
**Status:** In progress

## Purpose

Phase 1 of the Agent Office v2 plan (`notes/plans/agent-office-v2.md`), which Tim approved. It gives the team names and a leaner shape:
- **Hal**, Chief of Staff
- **Rita**, Lead Recruiter
- **Wren**, Writer (was Senior Admin)
- **Cole**, Interview Coach (new)
- **Ada**, Admin, who becomes free automation instead of a subagent

It also makes a CV text bank so agents stop re-reading the PDF, adds a token meter with an optional daily budget, and rebuilds the office with five desks and contracts for everyone.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Add the CV text bank

**What changed**
- `shared/job-search/cv/cv-bank.md`: new. A word-for-word transcription of `default-cv.pdf` (both pages: profile, numbers, six roles, key skills, certifications), with a short "Summary for matching" at the top for Rita.
- `shared/job-search/cv/README.md`: explains the text bank and asks Tim to keep it in step with his CV.

**Why**
Part of the plan's token rules. Agents were reading the PDF, which comes through as page images on every read. Its text layer also drops the letter "a" ("Hed of Esports Opertions"), so a pandoc text copy wasn't usable.

**Decisions**
- Transcribed from the page images rather than the broken text layer.
- The matching summary is a separate section, so Rita reads a few lines instead of the whole CV.
- The bank states that nothing outside it may go into a CV, which keeps Wren and Cole honest.

**How to check it**
Tim compares `cv-bank.md` with his PDF once.

**Open items**
Tim to check the transcription. He can add `extra-*.md` files with more material for Wren and Cole.

### 2026-11-06: Name the team and make it leaner

**What changed**
- `.claude/skills/cos/SKILL.md` (Hal):
  - Introduces the team by name.
  - **Hal now changes the tracker himself** with `tracker.py`; every "brief Admin" step is a direct command.
  - One hand-off per specialist per run.
  - Subagents are pointed at the CV text bank, not the PDF.
  - Interview prep goes to Cole.
  - The "Make the PDFs" inbox task becomes "Draft first, then PDFs" (only when an approved role has no documents, because Ada makes PDFs herself).
- `.claude/agents/writer.md` (moved from `senior-admin.md`): now **Wren**. Works from `cv-bank.md` and never reads the PDF; interview prep moved out; PDFs are Ada's job and tracker changes are Hal's.
- `.claude/agents/interview-coach.md`: new, **Cole**. Writes `talking-points.md` (5–7 key points; **never overwrites Tim's edits**, only adds "Suggestions from Cole") and `interview-prep.md` (company, likely questions with answer plans, gaps, questions to ask, practical details; keeps any "Tim's notes" section). At most two web lookups per role.
- `.claude/agents/lead-recruiter.md`: now **Rita**. Uses the CV bank's matching summary, reads a full advert only after it passes the deal-breakers, and doesn't touch the tracker.
- `.claude/agents/admin.md`: removed. Ada is now automation.
- `agents/writer/` (moved from `agents/senior-admin/`), `agents/interview-coach/` (new), `agents/admin/`, `agents/lead-recruiter/`, `agents/chief-of-staff/`: READMEs updated for the names and new jobs.
- `shared/conventions/handoffs.md`: team names; only Hal (and Tim from the office) change the tracker; why hand-offs are expensive.
- `README.md`: team table with names and the new jobs.

**Why**
The approved plan, and Tim's request for every member of staff to have a name.

**Decisions**
- Subagent ids stay descriptive (`lead-recruiter`, `writer`, `interview-coach`). Names are what Tim sees, and each agent starts its reply with its name.
- The Admin subagent is removed, not just unused, so Hal can't fall back to an expensive hand-off.

**How to check it**
In Claude Code, `/agents` lists lead-recruiter, writer and interview-coach. Hal's instructions contain no "brief admin" steps.

**Open items**
CV text bank, Ada's automation, token meter and the five-desk office follow in this branch.

### 2026-11-06: Save the approved v2 plan

**What changed**
- `notes/plans/agent-office-v2.md`: the plan Tim approved: staffing, token-efficiency rules, pipeline, Dashboard v2, Job Scout, office changes, and three delivery phases.
- `notes/changes/team-v2.md`: this file.

**Why**
Tim asked for a detailed plan for the office and staffing (roles, responsibilities, token efficiency), a better dashboard with a click-through to each role, and a section for interview talking points. He approved it and asked for every member of staff to have a name, chosen by Claude.

**Decisions**
- Names start with the job's first letter (Rita/Recruiter, Wren/Writer, Cole/Coach, Ada/Admin) so they are easy to remember. Ada is named after Ada Lovelace, as the one who runs on scripts.
- Phase order: team and token meter first (cheap and makes the cost visible), then the dashboard, then the Job Scout (which needs Tim's API keys).

**How to check it**
Read `notes/plans/agent-office-v2.md`.

**Open items**
The rest of phase 1 follows in this branch.

