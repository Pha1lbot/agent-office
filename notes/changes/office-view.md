# Branch: office-view

**Started:** 2026-11-06
**Status:** In progress

## Purpose

Build the office view planned in `notes/plans/office-view.md`: a browser page that shows Tim's four job-search agents (Chief of Staff, Lead Recruiter, Senior Admin, Admin) as pixel-art coworkers, plus a Roles dashboard tab that reads the role tracker. A small local server on Tim's PC (Node/TypeScript) collects Claude Code hook events and pushes them to the page. Code lives in `shared/office-view/`. Tim asked for the build on a fresh branch, and for a mockup first.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Add mockup of the office and Roles dashboard

**What changed**
- `shared/office-view/mockup/index.html`: standalone mockup with sample data. The Office tab has a pixel-art room drawn in code, four desks, a FILES shelf, a WEB kiosk and a whiteboard with today's numbers. The characters show each state: Chief of Staff waiting (`?`), Lead Recruiter at the web kiosk, Senior Admin typing, Admin asleep. Status cards sit under the room and an activity log panel on the right. The Roles tab has a "Waiting on you" box, totals by status and a table of roles with an open/all filter.
- `shared/office-view/mockup/screenshot-office.png`, `screenshot-roles.png`: pictures of both tabs.
- `shared/office-view/mockup/README.md`: what the mockup shows and how to open it.
- `notes/changes/office-view.md`: this file.

**Why**
Tim asked for a mockup of what the office and dashboard will look like, in a mockup folder, while the build was starting.

**Decisions**
- The mockup is one HTML file with no dependencies, so Tim can double-click it without installing anything.
- Drawn with plain canvas rectangles, matching the "simple shapes drawn in code" decision. The real page will use PixiJS as planned, with the same layout.
- Dark theme with a warm-coloured room, so the characters and the yellow "waiting for you" stand out.
- State is shown in words on the cards as well as in the picture, so it is readable on a phone and without relying on colour.
- The mockup folder sits inside `shared/office-view/` rather than at the top level, so the repo layout doesn't change.

**How to check it**
Open `shared/office-view/mockup/index.html` in a browser, or view the screenshots on GitHub. Checked in this session with a headless browser: no script errors, both tabs render, and at phone width (390 px) there is no sideways scrolling.

**Open items**
- Tim's feedback on the mockup.
- The real build is in progress (`src/office.ts` drafted, not committed yet): bridge server, hook reporter, PixiJS page, fake agents, tests.

