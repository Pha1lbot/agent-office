# Plan: Agent Office v2 — leaner team, better dashboard, interview prep

**Status:** Approved by Tim on 2026-11-06. Phase 1 on branch `team-v2`; phases 2 and 3 to follow.

## Context

Today Tim got a working setup:
- **Office:** a pixel-art office with a Roles tab he can edit.
- **Team:** Hal (Chief of Staff), Lead Recruiter, Senior Admin and Admin, with Hal starting by himself when Tim changes a role.
- **Data:** the old Job Hunt dashboard imported (52 roles).

Tim now wants:
1. A thought-through **staffing plan**: roles, responsibilities, and the most **token-efficient** way to run the team. More or fewer staff is fine.
2. A **better dashboard**: key details at a glance, and a click-through to each role with its CVs, cover letters and attachments.
3. An **interview section** with key talking points.

What today's runs taught us (real numbers from this session):

| Call | Tokens | Notes |
|---|---|---|
| Admin subagent, 3 tool calls (add 7 roles) | ~17,600 | Almost all of it is the cost of starting a subagent, for work a script does for free |
| Lead Recruiter, full web search | ~61,000 | Browsing HTML pages is expensive; half the sites blocked anyway |
| Reading the CV as a PDF | high | PDFs are read as page images on every read |

**Main lesson:** each hand-off to a subagent costs about 15k tokens before any work starts. Browsing and PDFs are the other big costs. So the plan cuts hand-offs, replaces mechanical work with scripts, and gives agents small structured inputs.

Tim's choices:
- **Staff:** Hal plus 3 specialists, with Admin turned into free automation. Tim left the names to Claude: **Rita** (Lead Recruiter), **Wren** (Writer), **Cole** (Interview Coach) and **Ada** (Admin).
- **Dashboard:** a pipeline board with a list toggle.
- **Job sources:** **both** the job-site data feeds (Reed and Adzuna, free keys) and web pages.
- **Interviews:** the Coach drafts talking points, and Tim edits them.

---

## 1. The team

Every member of staff gets a name. Each starts with the same letter as the job, so they're easy to remember.

| Name and job | Model | Does | Starts when | Rough cost |
|---|---|---|---|---|
| **Hal**, Chief of Staff | Sonnet (main session) | Runs the day, ranks roles, works through Tim's office changes, briefs specialists once per batch, **updates the tracker himself** with `tracker.py` (no hand-off to Ada) | `/hal` or `/cos`, or automatically after office changes | 5–10k per run |
| **Rita**, Lead Recruiter | Sonnet | Scores the candidates the Scout script found; browses only sites without a data feed (Hitmarker, LinkedIn, careers pages); reads adverts for roles Tim adds | Once a day; when Tim adds a role | 15–25k a day (was ~61k) |
| **Wren**, Writer (was Senior Admin) | Sonnet | Tailored CV and cover letter from the CV text bank and the listing; follows `cv-rules.md` | Tim sets a role to *shortlisted* | ~20–30k per role |
| **Cole**, Interview Coach (new) | Sonnet | Interview prep notes and 5–7 key talking points; refreshes them when Tim asks | Tim sets a role to *interview*, or asks | ~20–30k per role |
| **Ada**, Admin (now automatic, named after Ada Lovelace) | none (scripts) | Tracker updates, duplicate checks, follow-up dates, the inbox, building Word and PDF files, GitHub backup. Her character still animates when these run | Always | 0 |

The subagent ids stay descriptive (`lead-recruiter`, `writer`, `interview-coach`), so the office and hooks keep working. The names are what Tim sees in the office, on the cards, in Hal's replies and in each contract. Each agent introduces itself by name.

Every figure here is an estimate. Phase A adds a token meter that shows the real cost of each run.

**Why this shape**
- Ada's (Admin's) work was all mechanical, and each Admin call cost about 15k tokens. Scripts and Hal calling `tracker.py` directly do the same work for nothing.
- Interview prep is a different skill from CV writing and is only needed now and then, so a separate Coach (Cole) keeps Wren's instructions short and costs nothing until an interview comes up.
- Hal stays the only one Tim talks to. Specialists never talk to each other directly; everything goes through files.

**Each agent keeps a README** in `agents/<name>/` (purpose, inputs, outputs, model), per CLAUDE.md:
- `agents/senior-admin/` is renamed `agents/writer/` (Wren).
- A new `agents/interview-coach/` (Cole) is added.
- `agents/admin/README.md` (Ada) is rewritten to say she is now automation.
- `agents/lead-recruiter/README.md` gains Rita's name.

## 2. Token-efficiency rules (written into the agents)

1. **Scripts first.** Anything rule-based is a script: tracker changes, duplicates, filters on pay, location and keywords, dates, follow-ups, documents, backup. Agents only do judgement and writing.
2. **One hand-off per specialist per run.** Hal batches: all new roles in one Recruiter call, all shortlisted roles in one Writer call.
3. **Small, structured inputs.**
   - The CV becomes a **text bank**: `shared/job-search/cv/cv-bank.md`, made once from the PDF and checked by Tim. Agents never re-read the PDF.
   - Listings stay under 40 lines.
   - Agents pass file paths, not text.
4. **Feeds before browsing.** The Scout script pulls Reed and Adzuna results as JSON and filters them for free. The Recruiter browses only the sites without a feed, and only reads full adverts for candidates that passed the filters.
5. **Reuse, don't redo.** The Writer and Coach reuse the Recruiter's listing and the CV bank. A draft or a set of talking points Tim has edited is never regenerated unless he asks.
6. **Caps and visibility.**
   - Automatic runs: at most 8 a day, Sonnet, 20-minute limit (already in place).
   - New token meter: tokens per run and per day, shown in the office, plus an optional daily token budget that pauses automatic runs when reached.
7. **Run on the PC.** Cloud sessions can't reach most job sites and can't show the office, so the daily run happens in Claude Code on Tim's PC.

## 3. How a role moves through the pipeline

| Stage | Who acts | What happens | Tokens |
|---|---|---|---|
| **To review** (found) | Scout script, Rita | Script finds and filters; Recruiter scores and writes a short listing | Recruiter only |
| **Shortlisted** (Tim) | Wren | Tailored CV and cover letter (`.md`, then `.docx`) | Wren |
| **Drafted** | Tim | Checks the Word files in the role page, asks for changes or approves | — |
| **Approved** (Tim) | Ada (script) | PDFs made | 0 |
| **Applied** (Tim) | Ada (script) | Next step set to "Follow up by \<+7 days\>"; overdue follow-ups highlighted | 0 |
| **Interview** (Tim adds date) | Cole | `interview-prep.md` and `talking-points.md` | Cole |
| **Offer / Rejected / Skipped** | Ada (script) | Reason recorded; feeds Hal's preference reviews | 0 |

Making PDFs and setting follow-up dates move from Hal to Ada (the office server), so those stages cost nothing.

## 4. Dashboard v2

### At a glance: the Pipeline tab (replaces the Roles tab)
- **Board view (default):**
  - A column per stage: To review, Shortlisted, Drafted, Approved, Applied, Interview, Offer. Rejected and skipped go in a collapsed "Closed" section.
  - Drag a card to change its status. Each card also has a status menu, for keyboard and phone.
- **List view toggle:** a sortable table (priority, fit, pay, closing date, updated) with search and filters (list, source, work style).
- **Each card shows:**
  - title, company, pay, location / work style
  - fit dots and priority
  - **closing date** ("closes in 3 days" in amber when 7 days or fewer)
  - **interview date** when there is one
  - **document ticks**: CV ✓ / Letter ✓ / PDF ✓
  - next step, red when overdue
  - a small "Hal is on it" marker while work is queued or running
- **Top strip:**
  - "Waiting on you": things to check, apply for, review or follow up, and to-dos
  - Hal's status
  - tokens used today
  - backup status

### Click through: the role page (`#role/<id>`)
Opens as a full page with its own address, so the back button works and it can be bookmarked. Four sections:
1. **Overview**
   - Status menu, link to the advert, pay, location, closing date, fit with reasons.
   - The Recruiter's summary: what they want, keywords, gaps.
   - Next step and notes, editable.
2. **Documents**
   - The CV and cover letter rendered on the page (from `cv.md` and `cover-letter.md`).
   - **Download Word / PDF** buttons.
   - Notes and gaps from Wren.
   - **Attach file**: upload PDF or Word files, such as the exact version you sent or the advert saved as PDF. They go in `jobs/roles/<id>/attachments/` and are backed up.
   - **Ask for changes** box: queues Wren with your words.
3. **Interview**
   - Date, time and who it's with.
   - **Key talking points:** 5–7 bullets at the top, editable in place. You can add, reword, reorder or delete them, and your edits are saved and never overwritten.
   - Prep notes below: the company, likely questions with answer plans from your CV, gaps and how to handle them, questions to ask.
   - **Refresh prep** button: queues Cole, who adds suggestions and never overwrites your edits.
4. **Activity**
   - Timeline of status changes (who and when), Hal's runs on this role, and documents made.

### Tech
- Stays plain JavaScript with no build step, served by the existing bridge. The page is split into modules: `dashboard.js`, `role.js`, `board.js`.
- Markdown is rendered with **marked**, and every rendered file (it can contain advert text from the web) is cleaned with **DOMPurify** first. Both are pinned on npm and served locally like PixiJS.
- New bridge endpoints:
  - `GET /api/roles/<id>`: the role, its file list and the file texts.
  - `GET /files/roles/<id>/<name>`: downloads, only from an allowed list of names and the `attachments/` folder.
  - `POST /api/roles/<id>/talking-points`: saves Tim's edits.
  - `POST /api/roles/<id>/attachments`: uploads (PDF or Word, up to 10 MB).
  - `POST /api/roles/<id>/request`: "Ask for changes" and "Refresh prep", both queued in the inbox.
- Tracker additions: a `closing_date` field; document ticks worked out from which files exist in the role folder; new inbox tasks "Revise documents" and "Refresh interview prep".

## 5. Job Scout (feeds and web)

- `shared/tools/scout.py` (standard library only):
  - Calls the **Reed** and **Adzuna** APIs with the titles, locations and pay floor from `preferences.md`.
  - Normalises results (title, company, pay, location, link, closing date, a short description).
  - Removes duplicates against the tracker using the existing link and name matching in `import_dashboard.py`, moved into a shared helper.
  - Applies the deal-breakers (pay below £50k, office-only roles too far away, constant travel, BLAST).
  - Writes `jobs/scout/<date>.json`.
- API keys go in `shared/job-search/.env`, which is already git-ignored by `.env`. A `.env.example` shows the names. Tim signs up at reed.co.uk/developers and developer.adzuna.com.
- **Daily flow:**
  1. Hal runs `scout.py`, which costs no tokens.
  2. Hal briefs Rita once with the candidates file and the sites without feeds (Hitmarker, LinkedIn, careers pages).
  3. Rita browses those sites and scores the combined shortlist, up to 10.
  4. Hal adds the roles himself with `tracker.py`.

## 6. The office (pixel view)

- **Five desks with name plates:** Hal, Rita, Wren, Cole and Ada. Each card shows the name with the job underneath, as Hal's does now.
  - Ada's desk gets a little server box that lights up when the scripts run. The bridge sends Ada "working" events when it runs `tracker.py`, `make_docs.py` or a backup.
  - The room is laid out again to fit five desks.
- **Token meter:** the Stop hook already runs `report.mjs`. It will also send `transcript_path`, and the bridge adds up that session's token use from the transcript. Each character shows tokens used today, and the whiteboard shows the day's total.
- Novelty contracts for everyone in the same style as Hal's: Rita, Wren and Cole as new hires, and Ada as "automation, salary: electricity". Each opens by clicking the name.

## 7. Delivery: three branches, each with a pull request

1. **`team-v2`: leaner team and token meter**
   - Hal does tracker work himself.
   - Ada (Admin) becomes automation: PDFs, follow-ups and her character animation.
   - Senior Admin becomes Wren, the Writer; Cole, the Interview Coach, is added; the Lead Recruiter becomes Rita. Each introduces itself by name.
   - CV text bank made from the PDF, for Tim to check.
   - Token meter and daily budget.
   - Five-desk office and new contracts.
   - Agent READMEs and the handoffs doc updated; CLAUDE.md layout notes.
2. **`dashboard-v2`:** pipeline board and list, role page (Overview / Documents / Interview / Activity), attachments, editable talking points, closing dates, the new inbox tasks.
3. **`job-scout`:** `scout.py`, `.env` keys, Hal's daily flow updated, the Recruiter's instructions trimmed to scoring and sites without feeds.

Each branch gets notes in `notes/changes/<branch>.md` and a CHANGELOG line when merged. This plan is saved as `notes/plans/agent-office-v2.md` in the first branch.

## Critical files

- **Agents:** `.claude/skills/cos/SKILL.md` (Hal), `.claude/agents/lead-recruiter.md`, `.claude/agents/senior-admin.md` (renamed `writer.md`), new `.claude/agents/interview-coach.md`, `.claude/agents/admin.md` (removed; Admin becomes automation)
- **Tools:** `shared/tools/tracker.py` (closing dates, document ticks, new inbox tasks), `shared/tools/make_docs.py` (unchanged, now called by the server), new `shared/tools/scout.py`, `shared/tools/import_dashboard.py` (matching helpers moved into a shared module)
- **Office server:** `shared/office-view/src/server.ts` (new endpoints), `src/auto-cos.ts` (token use read from `--output-format json`, daily budget), `src/office.ts` (five-person team, Admin events), `hooks/report.mjs` (send `transcript_path`)
- **Office page:** `shared/office-view/public/` (new `dashboard.js`, `role.js`, `board.js`; `office.js` gets the five-desk layout; `contracts.js` gets new contracts)
- **Job-search files:** `shared/job-search/cv/cv-bank.md` (new), `shared/job-search/.env.example` (new), `jobs/roles/<id>/talking-points.md`, `interview-prep.md`, `attachments/`

## Verification

- **Unit tests:**
  - `npm test`: board status changes, document ticks, token totals from a sample transcript, and refusal of download paths outside the allowed list.
  - New Python checks for `scout.py`: filters and duplicates, using saved sample API responses.
- **End to end in a throwaway repo with a fake Claude** (as done for #6):
  - drag a card to Shortlisted
  - Hal runs and the document ticks appear
  - approve: PDFs are made with no Hal run
  - applied: the follow-up date is set
  - interview: Coach prep appears
  - edit the talking points, then Refresh prep: Tim's edits are kept
  - upload an attachment
  - backup pushes it all
- **Screenshots:** board, list, the role page (each section) and the phone layout.
- **On Tim's PC:** one real day.
  - `scout.py` with his keys, then `/hal start the day`.
  - Compare the token meter with today's roughly 80–100k baseline. The target is under 40k for a normal day without drafting.

## Open items for Tim

- Sign up for the free Reed and Adzuna API keys (before phase 3).
- Check the CV text bank once it's made (phase 1).
