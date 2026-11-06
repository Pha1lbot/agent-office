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

