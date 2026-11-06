# Branch: dashboard-v2

**Started:** 2026-11-06
**Status:** In progress

## Purpose

Phase 2 of the Agent Office v2 plan (`notes/plans/agent-office-v2.md`, section 4), approved by Tim. A **Pipeline** dashboard replaces the Roles tab:
- a board with a column per stage (drag cards to change status) and a sortable list
- key details at a glance: pay, fit, closing date, interview date, document ticks, next step
- a **role page** for each role, with its rendered CV and cover letter, downloads, attachments, and an **Interview** section with editable key talking points and Cole's prep notes

Built on `team-v2` ([Pha1lbot/agent-office#7](https://github.com/Pha1lbot/agent-office/pull/7)), which should be merged first.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Teach Hal the new requests; update the READMEs

**What changed**
- `.claude/skills/cos/SKILL.md`: the "Office changes" section handles two new inbox tasks from the role page.
  - **"Revise documents: <Tim's words>"**: brief Wren with Tim's exact words, rebuild the Word files, and move an approved role back to drafted.
  - **"Refresh interview prep"**: brief Cole, keeping Tim's talking points.
- `shared/office-view/README.md`:
  - New "The Pipeline" section: the board, cards, dragging, the list and the role page's four sections.
  - The automatic-actions table gains "Ask Wren for changes", "Refresh prep", and the free actions (attachments, talking points, notes).
- `README.md`: the office paragraph describes the Pipeline and role pages.

**Why**
So Hal knows what to do with the new requests, and Tim knows how to use the dashboard.

**Decisions**
A revision of an approved role sends it back to drafted, so the PDFs Tim sends always match the latest text.

**How to check it**
Read the "Office changes" section of the cos skill and "The Pipeline" in `shared/office-view/README.md`.

**Open items**
Pull request next (merge after #7). Phase 3 (Job Scout) needs Tim's Reed and Adzuna API keys.

### 2026-11-06: Pipeline board and role pages

**What changed**
- `shared/office-view/public/index.html`:
  - The Roles tab becomes **Pipeline**: a toolbar (Board/List switch, search, list and work-style filters, + Add role), the board, and the list.
  - New role page container (`#view-role`).
  - The edit dialog gains a **closing date** field.
  - The page now starts from `app.js`.
- `public/util.js` (new): shared helpers and status names and colours; `closing()` ("closes in N days", amber at 7 days or fewer, red once passed); `overdue()` (follow-ups past their date); `fitDots()`; `post()`.
- `public/store.js` (new): the WebSocket connection and the live data (agents, tracker, document flags, system), with `on()` subscriptions. Shared by the office, the dashboard and the role page.
- `public/office.js`: now only the office scene, cards, activity log and contracts. Its Roles code moved out.
- `public/dashboard.js` (new): the Pipeline tab.
  - **Board:** columns for To review, Shortlisted, Drafted, Approved, Applied, Interview and Offer, plus a Closed strip (rejected and skipped). Drag a card between columns, or use its status menu. Dropping on Closed opens the reason dialog.
  - **Cards:** title, company, pay, location, fit, priority, closing date, interview date, document ticks (CV / Letter / PDF / Prep / attachments), next step (red with ⚠ when a follow-up is overdue), and "Hal is on it".
  - **List:** sortable by priority, pay, fit, closing date and updated, with Closes and Docs columns.
  - **"Waiting on you"** now also lists follow-ups due and roles closing soon, each linking to its role page.
  - Also holds the strip, and the edit and add-role dialogs, moved from `office.js`.
- `public/role.js` (new): the role page at `#role/<id>`.
  - **Overview:** Rita's listing, rendered; next step and notes editable inline; key facts.
  - **Documents:** CV and cover letter rendered as paper documents, Download Word / PDF, Wren's notes, attachments with upload, **Ask Wren for changes**, and "Shortlist this role" when nothing is drafted yet.
  - **Interview:** date and who with; an **editable key talking points list** (edit, add, move up or down, delete, then save) with Cole's suggestions and "Add to my points"; Cole's prep notes; **Refresh prep**.
  - **Activity:** status changes (by Tim or the team), requests to Hal and when they were finished, and files saved.
  - Markdown is rendered with marked and always cleaned with DOMPurify.
  - Reloads when the role changes, unless Tim has unsaved talking points; then it offers "Load the new version" instead.
  - Confirmations ("Sent: Hal will brief Wren…") stay visible through those reloads.
- `public/app.js` (new): switches between the Office, the Pipeline and role pages using the address, so the back button works.
- `public/style.css`: board, cards, ticks, closing levels, list sorting, role page, panels, paper documents, the talking points editor, timeline and notices. **Each column scrolls on its own**, so the whole board and the Closed strip fit on one screen.

**Why**
Tim asked to see key details for every role at a glance, click into a role for its CVs, cover letters and attachments, and have an interview section with key talking points.

**Decisions**
- Plain ES modules with a small shared store, rather than a framework or build step, as for the rest of the office.
- Talking points are edited as a list, not as raw markdown, so Tim can't accidentally break the format Cole reads. Cole's suggestions are kept in their own section.
- Board layout: the first test showed the "To review" column (38 roles) pushed the Closed strip thousands of pixels down the page, so columns now scroll on their own.

**How to check it**
In a headless browser against a throwaway git repo:
- **Board:** 7 columns with the right counts; the list sorts by closing date.
- **Dragging** (with real mouse moves): a To review card moved to Shortlisted and queued Hal; dropping a card on Closed opened the reason dialog for that card.
- **Safety:** a listing with `<script>` and `<img onerror>` showed neither.
- **Talking points:** adopting Cole's suggestion, editing, reordering, adding and saving gave the right `talking-points.md`, and the points were still there after a reload.
- **Requests:** "Refresh prep" and "Ask Wren" queued inbox items and showed their confirmations.
- **Files:** the upload was listed and backed up; the Word download came back 200 as an attachment.
- No page errors; no sideways scroll at phone width on the board or role page.
- `npm test` (25) and the type check pass.

**Open items**
- Playwright's built-in `dragTo` started drags from the wrong card in this layout; real mouse moves work. The tests use mouse moves.
- Hal's instructions for the new request types, and the READMEs, come next.

### 2026-11-06: Role files API and inbox requests

**What changed**
- `shared/office-view/src/roles.ts`: new.
  - Document flags per role (CV, letter, their PDFs, prep, talking points, number of attachments) from the files in `jobs/roles/<id>/`.
  - Safe file lookup: only an allowed list of team files, plus `attachments/`, and never outside the role folder.
  - Text of the markdown files for the role page.
  - Attachment saving (cleaned names, allowed types, up to 10 MB, `-2` for name clashes), and saving `talking-points.md`.
- `shared/office-view/src/server.ts`:
  - `GET /api/roles/<id>` (role, files, texts, document flags).
  - `GET /files/roles/<id>/<name>`: downloads. Word files download; PDFs open in the browser. Sent with `nosniff`.
  - `POST /api/roles/<id>/attachments`, `/talking-points` and `/request` (`revise` for Wren, `prep` for Cole). All go through Ada's animation and the GitHub backup.
  - Document flags go out in the snapshot and as `docs` updates, re-checked every 5 seconds.
  - Serves `/vendor/marked.mjs` and `/vendor/purify.mjs`.
- `shared/office-view/package.json`: `marked` 15.0.12 and `dompurify` 3.4.17, pinned exactly.
- `shared/tools/tracker.py`: new `inbox add --role <id> --task "..."`, which skips a task already waiting.
- `shared/office-view/test/roles.test.ts`: 5 tests (flags, refused paths and ids, file list, upload names and limits, talking points).

**Why**
The role page needs to show and download each role's documents, take Tim's attachments and talking points, and let him ask Wren or Cole for more.

**Decisions**
- Downloads are limited to a fixed list of names plus `attachments/`, rather than "anything in the folder", so nothing unexpected can be served.
- The document flags are re-checked by a 5-second poll rather than file watching, which behaves differently on Windows.
- Requests become inbox items, so they use the same Hal trigger, daily cap and token budget as status changes.

**How to check it**
- `npm test` (25 pass).
- Tested against a throwaway git repo:
  - the role API returned files, texts and flags
  - PDF and Word downloads came back 200 with the right types; `../` and `secret.txt` came back 404
  - a PDF upload was saved as `My-sent-CV.pdf`, and an `.exe` was refused
  - talking points were saved
  - "revise" and "prep" requests were queued
  - a website's Origin got 403
  - the backup pushed the attachment, the talking points and the tracker

**Open items**
The Pipeline board and the role page come next.

