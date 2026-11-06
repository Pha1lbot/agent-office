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

### 2026-11-06: Update the READMEs and CLAUDE.md for the new team

**What changed**
- `shared/office-view/README.md`:
  - The "acts on your changes" table now says who does what, and whether it costs tokens. Ada handles PDFs and follow-ups for free; Wren, Cole and Rita do the token work through Hal.
  - New paragraph on the token meter, a note that names open contracts, and the `OFFICE_DAILY_TOKEN_BUDGET` setting.
- `CLAUDE.md`: the Layout section names the team and points to the v2 plan.

**Why**
So the docs match what the office now does.

**Decisions**
None.

**How to check it**
Read the "Editing roles, and Hal" section of `shared/office-view/README.md`.

**Open items**
- Phase 2 (`dashboard-v2`) and phase 3 (`job-scout`) follow as separate branches.
- Tim should check `cv-bank.md` against his CV and, for the Job Scout, sign up for the Reed and Adzuna API keys.

### 2026-11-06: Five-desk office, token figures on screen, and contracts for everyone

**What changed**
- `shared/office-view/public/office.js`:
  - New layout: Hal, Rita and Wren on the top row; Cole and Ada below. Desks are narrower (44 art pixels); the plant and water cooler moved.
  - Ada's desk has a server box whose lights blink while her scripts run.
  - Cards show "N tokens today"; Ada's says "No tokens (automatic)".
  - The side panel shows tokens today and re-reads.
  - The whiteboard has a "Tokens today" line, and the Roles strip shows the total with the budget if one is set.
- `shared/office-view/public/style.css`: five cards in a row (two on a phone), a token line on each card, job titles under names.
- `shared/office-view/public/contracts.js`: contracts for Rita (Lead Recruiter, £85k plus "one biscuit per interview landed"), Wren (Writer, £70k), Cole (Interview Coach, £75k) and Ada (a "Contract of Service": no salary, runs on electricity, notice period "Unplugging"), with duties taken from each agent's instructions. Click any name to open one.
- `shared/office-view/scripts/fake-agents.ts`: the fake day uses the new team. Hal does tracker work himself with Ada's lights blinking, Wren reads `cv-bank.md`, and Cole preps for an interview at the end.

**Why**
The plan's office changes: five named desks, Ada visible as automation, and token use on screen.

**Decisions**
Ada keeps a character even though she isn't an AI, so Tim can see automatic work happen and see that it costs nothing.

**How to check it**
- `npm start` then `npm run fake -- --fast`, and open http://127.0.0.1:4747.
- Checked in a headless browser:
  - five desks, Wren walking to the shelf, Ada working
  - token figures on the cards and the whiteboard
  - Ada's contract opens
  - no page errors, no sideways scroll on a phone

**Open items**
None for this part.

### 2026-11-06: Token meter and daily budget

**What changed**
- `shared/office-view/src/tokens.ts`: new. Reads Claude Code transcripts and adds up today's usage (UK day).
  - Covers the main conversation, plus each subagent from `<session>/subagents/agent-*.jsonl`, credited by the agent type in its `.meta.json`.
  - Each message is counted once, even though it appears on several lines.
  - Splits **fresh tokens** (new input + cache writes + output) from **cache reads** (re-reading the same context, much cheaper).
- `shared/office-view/test/tokens.test.ts`: 5 tests (counting once, skipping older days, subagents by type, missing files, labels, UK midnight in winter and summer).
- `shared/office-view/hooks/report.mjs`: also sends `transcript_path`, the file's location only, never its contents.
- `shared/office-view/src/office.ts`: agents gain `tokens` and `cacheRead` (today), plus `mainOf()` and `subagentId()` so the meter credits the right character.
- `shared/office-view/src/server.ts`: recounts a session 3 seconds after its reports arrive (they include Stop and SubagentStop) and resets at UK midnight. Sends per-agent totals and the day's total (`system.tokens`) to the page.
- `shared/office-view/src/auto-cos.ts`: optional daily budget (`OFFICE_DAILY_TOKEN_BUDGET`, in fresh tokens). When it's used up, Hal stops starting by himself and the office says why.

**Why**
The plan's "caps and visibility" rule: Tim should see what each member of staff costs and be able to cap automatic spending.

**Decisions**
- The headline figure is fresh tokens; cache reads are shown alongside. Counting cache reads in full would make every long session look hundreds of times more expensive than it is, and leaving them out entirely would hide real costs on long runs.
- Measured today from this session's transcripts: the Admin hand-off used about 20k fresh tokens (38k including re-reads) to add 7 roles, and Rita's search about 75k fresh (760k including re-reads). That confirms the plan's choice to script Admin and feed Rita from data feeds.

**How to check it**
- `npm test` (20 pass).
- Tested against this session's real transcript: Rita 75,501 fresh and Ada 19,913 fresh, matching a hand count. The day's total and the budget reached the page.

**Open items**
The page doesn't show the numbers yet; that comes with the office rebuild.

### 2026-11-06: Ada (Admin) becomes automation: PDFs, follow-ups and her character

**What changed**
- `shared/tools/tracker.py`:
  - **Follow-ups:** when a role goes to *applied*, the next step becomes "Follow up if no reply by <7 days later>", unless a real next step is already set or is given in the same command.
  - **Approved roles:** they only queue Hal ("Draft first, then PDFs") when they have no Word files.
  - New `closing_date` field (YYYY-MM-DD).
- `shared/office-view/src/server.ts`:
  - **Ada makes the PDFs** (`make_docs.py --pdf`) as soon as Tim approves a role that has Word files. No Hal run, no tokens. If it fails (for example LibreOffice isn't installed), an action explaining why appears under "Waiting on you".
  - Ada's character "types" while the tracker is updated, a role is added, PDFs are made or the backup runs.
  - The backup now covers the whole `jobs/` folder, so PDFs and other generated files reach GitHub too.
- `shared/office-view/src/office.ts`: the team is now Hal, Rita (`lead-recruiter`), Wren (`writer`), Cole (`interview-coach`, new) and Ada (`admin`), each with a job title. New `Office.ada()` shows Ada working or idle.
- `shared/office-view/test/office.test.ts`: updated for the new team and ids; new tests for Ada and for the team's names and titles (15 tests).
- `CLAUDE.md`: the "Edits made in the office" section now says the office backs up the `jobs/` folder, not just the tracker files.

**Why**
The plan moves rule-based steps from Hal to Ada so they cost nothing. Before, approving a role meant an automatic Hal run (~15k+ tokens) just to call one script.

**Decisions**
- Follow-ups are set in `tracker.py`, so they work whether Tim, Hal or the office makes the change.
- A failed PDF becomes an action for Tim rather than a silent error, because LibreOffice may not be installed on his PC yet.

**How to check it**
- `tracker.py` tested in a scratch folder:
  - applied with "Apply today" gives "Follow up if no reply by 13 Nov"
  - a custom next step is kept
  - approved without Word files queues "Draft first, then PDFs"
  - approved with Word files queues nothing
- End to end against a throwaway git repo:
  - approving Vitality (with Word files) made `cv.pdf` and `cover-letter.pdf` with an empty inbox
  - Epic set to applied got its follow-up date
  - Ada's log showed "Updating the tracker", "Making PDFs: Vitality" and "Backing up to GitHub"
  - the PDFs were pushed in the "Office:" commit
- `npm test` passes (15) and the TypeScript check passes.

**Open items**
Tim needs pandoc and LibreOffice on his PC for Word files and PDFs.

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

