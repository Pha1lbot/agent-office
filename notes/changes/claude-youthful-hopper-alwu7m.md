# Branch: claude/youthful-hopper-alwu7m

**Started:** 2026-11-06
**Status:** In progress (Job Hunt v3, phase 3: lead finding); phase 1 merged in [PR #21](https://github.com/Pha1lbot/agent-office/pull/21), earlier work in PRs [#3](https://github.com/Pha1lbot/agent-office/pull/3) and [#9](https://github.com/Pha1lbot/agent-office/pull/9)–[#17](https://github.com/Pha1lbot/agent-office/pull/17)

## Purpose

Tim asked to start planning the office view (`notes/plans/office-view.md`). While planning, he named the first agents that should work in the office: a four-person job-search team (Chief of Staff, Lead Recruiter, Senior Admin, Admin). He chose to build the agents first, on this branch, and the office view on the next branch.

This branch sets up:
- the four agents and how they hand work to each other,
- a role tracker (the data the office view's dashboard tab will show later),
- tools that turn drafted CVs and cover letters into Word files, and into PDFs once Tim approves them.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-08: Job Hunt v3, phase 3: daily lead finding, with Hal sorting the review queue

**What changed**
- `shared/tools/tracker.py`:
  - **Review queue `jobs/found.json`**, through `tracker.py found add|list|take|run`.
    - `add` dedupes finds by normalised company and title, and by link, against both the queue and the tracker.
    - `take <id> --as lead|dismissed` creates the role, with history `by: hal`, fit mapped (strong 4, possible 3, weak 2), a verdict (Apply, Maybe or Skip), `verdict_why` and the reason. It marks the item triaged, and Ada ranks it.
    - `run` logs each search (via web or email, how many found, a note), plus `last_email_scan`.
    - Finds older than 45 days are pruned, and the queue keeps at most 300.
  - `cmd_add`'s logic is now `add_role()`, shared with `found take`.
- `shared/tools/test_tracker.py`: tests for dedupe, taking a find as a lead or dismissed, and refusing to take one twice.
- `shared/office-view/src/server.ts`: reads `jobs/found.json` (the last 7 days of finds and the last 10 runs) into the tracker snapshot as `tracker.found`, and watches it.
- `public/views.js`, `index.html` and `style.css`:
  - the Overview callout "Rita found N new roles this morning: A added to Leads, D dismissed by Hal"
  - a **New leads** dialog on Leads, in the style of the artifact's review queue: the last run, each find with its Strong / Possible / Weak badge, source and link, and Hal's decision and reason, with **Add to Leads** / **Dismiss** and **Open**
  - a **New** tag on leads Hal added today
- `.claude/skills/cos/SKILL.md` (and the `hal` alias description): a new **"Daily search"** routine.
  - Rita's search goes to a JSON file.
  - Hal scans job-alert emails himself with the Microsoft 365 tools (subagents can't use connectors).
  - Both go through `found add` and `found run`, then Hal triages each find: dismiss deal-breakers, pay under the minimum, Weak fits and the wrong discipline, with a reason; keep the rest as leads; never shortlist.
  - He writes `today.md` and commits `jobs/` to `main`, merging (never rebasing or forcing) if the push is refused.
  - Token rules: one Rita brief, no listings, at most 6 emails.
  - "Start the day" now runs the search if it hasn't run today.
- `.claude/agents/lead-recruiter.md`: a "Daily search" mode with the JSON format and the fit rules. She writes no listings and reads at most 5 adverts.
- READMEs (root, office view, Rita, Hal), `sources.md` (job-alert emails), and the plan marked as built. `CHANGELOG.md` gets the line for #21.

**Why**
Tim asked to proceed with phase 3 of `notes/plans/job-hunt-v3.md`. He chose:
- 06:31 on weekdays, in the cloud
- pausing the artifact's old 06:31 search after the new one's first good run
- finds Hal dismisses going to Leads → Dismissed with his reason

**Decisions**
- **One queue** (`found.json`) separate from the tracker, so the same job is never found twice, and Tim can see what was found and what Hal did with it.
- **Hal does the email scan himself:** subagents don't get connector tools.
- **The email rules came from a real read-only test of Tim's Outlook.**
  - Alerts are in the Inbox (there's no Job Alerts folder), so Hal searches "jobs" since the last scan.
  - The results included non-alert emails (a benefits email, "application sent", "saved job expiring"), so those are now skipped.
  - One LinkedIn email was about 12k tokens of HTML, so Hal reads at most 6 a day (not the 12 planned).
  - LinkedIn links carry long tracking codes, so they're trimmed to `/jobs/view/<number>/`.

**How to check it**
- `test_tracker.py` (5) and `test_fact_check.py` pass. `npm test` (30) and `tsc` are clean.
- **A dry run against a throwaway copy of the tracker:**
  - Rita's real capped search returned 3 roles in the right JSON (about 27k tokens), and `found add` queued them.
  - A real LinkedIn alert email was read and its job extracted; `found add` skipped it, because Razer is already tracked.
  - Triaged as Hal: 2 to Leads (ranked) and 1 dismissed with a reason.
- **Playwright, with no page errors:**
  - the Overview callout counts
  - the New leads dialog lists each find with Hal's decision
  - Add to Leads on a dismissed find works
  - the New tags show
  - there's no sideways scroll at 390 px wide

**Open items**
- **After the merge:**
  - create the scheduled task "Rita's daily search" (`CRON_TZ=Europe/London 31 6 * * 1-5`, a new cloud session each time, with the Microsoft 365 connector and push notifications)
  - fire it once and check it pushes to `main`
  - then pause the artifact's old task `trig_01JmHmGcgHAyaRFj75jCN6BA`
- The cloud network doesn't allow some boards Rita's search turned up (jobleads.com, builtinlondon.uk), so those finds come from search snippets. Add hosts if Tim wants full reads of them.
- Phase 2 (Tim's CV template) still needs `cv_template.py` and `example-content.json`. Phase 4 is the artifact sync.

### 2026-11-07: Job Hunt v3, phase 1: the office dashboard in the style of Tim's artifact

**What changed**
- New `notes/plans/job-hunt-v3.md`: the approved four-phase plan to combine Tim's Job Hunt artifact (claude.ai) with the office, including what each stage means. The phases:
  1. this dashboard
  2. Tim's CV template and rules
  3. lead finding, with Hal triaging the queue
  4. sync with the artifact as his phone view
- `shared/office-view/public/index.html`: a new shell in the artifact's design.
  - **Sidebar:** Overview, Roles, Leads, Interviews, Next actions, CVs, The office, plus the Target card. It collapses, and becomes a top strip on phones.
  - **Header:** the greeting and date, Live, search (`/`) and Add role.
  - **Dialogs:** new Tailor and CV-bank dialogs, and a toast.
- `public/style.css`: rebuilt on the artifact's tokens and components (Geist, cards, KPI tiles, bar charts, chips, pills, tables, empty states, dialogs, toasts, skeletons). The older parts (office, board, role page, contracts) are re-themed with the same tokens. Class clashes were renamed: the office cards are now `.agent`, and the artifact's tag is `.tg`.
- New `public/views.js`:
  - **Overview:** KPIs with count-up, the pipeline and weekly charts, upcoming interviews and next actions.
  - **Leads:** ranked, verdict and fit chips, To pipeline, Dismiss, Restore, Tailor, all with Undo toasts.
  - **Interviews:** listed, with prep links.
  - **Next actions:** add, tick and untick.
  - **CVs:** the CV bank, editable rules, and tailored CVs with View, PDF and Word.
  - **Also here:** the Target card (from `preferences.md`), the nav counts, and the Tailor dialog.
- `public/app.js`: a router for `#overview`, `#roles`, `#leads`, `#interviews`, `#actions`, `#cvs`, `#office` and `#role/<id>[/<tab>]`. The old `#pipeline` still works.
- `public/dashboard.js`: the board is now the Roles view. It starts at Shortlisted, leads live in Leads, and the Closed strip is now Rejected. Waiting on you links to Leads and Next actions.
- `public/role.js`: the back link goes to Leads or Roles, and a link can open a chosen tab.
- `public/office.js`: the agent cards' class is renamed.
- `public/util.js`: stage labels "Lead" and "Dismissed", plus `toast()`, `svg()`, `ICON` and `yearlyPay()`.
- `src/server.ts`:
  - `POST /api/actions` (add, done, reopen)
  - `POST /api/cv-rules`, with `cv-rules.md` now included in the office backup
  - `GET /api/job-search` (rules, preferences, CV bank) and `GET /files/cv/default-cv.pdf`
  - the role request `kind: "tailor"`: saves the job description, queues Wren (or a redo if documents exist), and shortlists a lead
- `shared/tools/tracker.py`:
  - `action reopen`
  - inbox tasks count as the same work when one is the other plus details after a colon, so a tailor request and a shortlist queue Wren once
  - moving a role back to found or skipped cancels drafting not yet started
- New `shared/tools/test_tracker.py`.
- `.claude/skills/cos/SKILL.md`: Hal passes the Tailor dialog's details to Wren word for word.
- READMEs: the dashboard section, now with what each stage means, and new screenshots `mockup/screenshot-dashboard-*.png`.

**Why**
Tim prefers his artifact dashboard's function, feel and look and asked to use it as the template, combined with the office's CVs, cover letters and interview prep. He chose:
- both, kept in sync
- Wren does the tailoring
- a review queue handled by Hal, a daily search, and the email scan

He asked what each stage means, and to name CVs `Tim_Everard_<Job_Title>_cv.pdf` (phase 2).

**Decisions**
- Tracker statuses are unchanged; the views group them. Leads are found and skipped; Roles are Shortlisted onwards. The finer stages stay on the board.
- **Tailoring:**
  - It goes to Wren rather than running in the page, so CVs follow the CV bank and the fact-check, and come with a cover letter.
  - A PDF or Word job description is attached to the role for Wren rather than read in the browser, so no new libraries are needed in this phase.

**How to check it**
- `npm test` (30 pass) and `tsc` are clean, and `test_tracker.py` and `test_fact_check.py` pass.
- Playwright against a throwaway copy, with no page errors:
  - every view shows real tracker data
  - To pipeline and Undo work, as do Dismiss and Restore
  - Tailor from a lead saved `advert.txt`, queued "Draft a tailored CV and cover letter: bring out budget ownership" and shortlisted the role
  - adding and ticking an action work
  - a lead row opens the role page, with "← Leads"
  - the office shows all 5 cards
  - at 390 px wide, Overview, Leads, Roles and CVs have no sideways scroll
- That run found that Undo left Wren's drafting task queued. It's fixed (the cancel rule above) and tested.

**Open items**
- Phases 2 to 4. Phase 2 needs Tim's `cv_template.py` and `example-content.json`.
- Not yet seen on Tim's PC.

### 2026-11-07: The live office is now the 3D office

**What changed**
- New `shared/office-view/public/floorplan.js`: the mockup's floor plan as an ES module. It adds a meeting table with four stools in the middle of the floor (spots `meet:0-3`, where visiting subagents sit) and a `door` spot where visitors arrive. It exports `path()`.
- New `shared/office-view/public/scene.js`: the 3D scene in Three.js, built from the restyled mockup.
  - **Room:** an orthographic isometric camera, the room, furniture and people, and HTML name tags. The TODAY board on the back wall shows the tracker counts and today's tokens (`setBoard`).
  - **Controls:** zoom, turn, recentre and full-screen buttons. Drag pans; scroll-zoom is off, so the page still scrolls.
  - **Picking:** a click picks the nearest person on screen within 48 px. Raycasting missed too often at this size.
  - **No WebGL:** a message shows instead, and the cards still work.
  - **Live behaviour:** `typing` and `waiting` go to the desk (`waiting` gets a yellow tag with !). `walking` goes to the shelf or the web kiosk, by `place`. `idle` wanders: coffee 40%, sofa 40% or desk, for 25–60 s each. `asleep` takes a nap on a sofa (Ada dozes at her desk). Visitors take a meeting-table seat, in their own colour. Routes are only recalculated once someone reaches a spot.
- `shared/office-view/public/office.js`: the PixiJS scene is removed. It keeps the cards, log and contracts, and calls `start` / `follow` / `setSelected` / `setBoard`.
- `public/index.html`: an import map for `three`, and a new scene label.
- `public/style.css`: the scene's size, tool buttons, tags and `Z z`, with reduced motion respected.
- `src/server.ts`: serves `/vendor/three.mjs` plus OrbitControls, RoundedBoxGeometry and CSS2DRenderer from `node_modules/three`; the PixiJS route is removed.
- `package.json`: `three` 0.170.0 (exact) added and `pixi.js` removed. The description is updated.
- READMEs (root and office view): what you see, how to move around, and a new screenshot (`mockup/screenshot-office-live.png`).

**Why**
Tim was happy with the restyled mockup and said "Ready to build".

**Decisions**
- Staff go for coffee or the sofa only when the live state is idle or asleep, so the office still tells the truth at a glance. The tag's dot gives the exact state.
- Live `agents` messages carry only changed agents, so the page never removes agents that are missing from an update (a first draft did, and was fixed before committing).

**How to check it**
- `tsc` is clean and `npm test` passes (26).
- Against a throwaway copy, with `scripts/fake-agents.ts --fast`:
  - the scene drew all five, and all vendor files returned 200
  - cards and the log updated
  - clicking Wren, Ada and Cole in the scene selected each one
  - at 390 px wide there's no sideways scroll

**Open items**
- Not yet seen on Tim's laptops. It needs WebGL, which any recent browser has.
- After merging, `Open Office.cmd` runs `npm install`, which fetches Three.js and removes PixiJS.

### 2026-11-06: 3D mockup restyled after Tim's reference

**What changed**
- `shared/office-view/mockup/office-3d.html` rewritten:
  - **Camera:** an orthographic isometric camera with zoom, quarter-turn, recentre and full-screen buttons. Drag pans, and the walls nearest you hide as the room turns.
  - **Room:** dark walls with skirting, windows onto greenery, a door, and wooden floor tiles from a canvas texture, with kitchen floor tiles and a woven rug.
  - **Furniture:** desks with metal frames and drawers, swivel chairs with five-star bases, monitors with a glowing interface (lit while their owner works), a shelf with books and boxes, a server rack with LEDs, a coffee machine with mugs, a fridge, a floor lamp that gives off light, a darker sofa with cushions, a TV, a whiteboard and Hal's name plate.
  - **People:** larger than life (×1.25), with hair, ears, eyes and a smile, and each person's own trouser colour.
  - **Name tags:** HTML pills with a status dot (CSS2DRenderer), yellow when waiting, plus floating "Z z" when asleep.
  - **Testing:** `?speed=` runs the day faster for screenshots.
- `office-sim.js`: a full floor zone, and desks turned so staff face the front.
- Mockup README, plus the new screenshot.

**Why**
Tim shared a screenshot of the look he wants: an isometric illustrated office with robot coworkers. He then said to keep people, not robots.

**Decisions**
- People stay, as Tim asked; everything else follows the reference.
- Staff still face the camera, so monitors are seen from behind, unlike the reference where screens face you. To revisit if Tim prefers the screens visible.

**How to check it**
Open `office-3d.html` (add `?speed=10` to see the day go by). Playwright screenshot in the mockup folder.

**Open items**
- Tim picks this or the flat isometric version.
- Then wire the chosen one into the live office.

### 2026-11-06: Mockups for the redesigned office (3D and isometric)

**What changed**
- New `shared/office-view/mockup/office-sim.js`. It holds the floor plan in metres (24 × 16):
  - an open plan with four desks, plus Hal's desk in a glass office
  - Ada's server box, the files shelf and the web kiosk
  - a kitchen with counters, a coffee machine, a fridge, and a table with stools
  - a lounge with an L-shaped sofa, a coffee table, a TV and a rug

  It also holds the places people go, with routes along an aisle so nobody walks through furniture, and a made-up day: working, looking things up, waiting, coffee (with a mug), the sofa when idle, and napping when asleep.
- New `office-3d.html`: low-poly 3D in Three.js 0.170.0, from jsDelivr through an import map. It has soft shadows, rounded furniture and capsule people with walk, sit and lie poses, typing arms and a mug, and name tags with `!` or `z Z`. Screens light up while their owner works. It uses OrbitControls.
- New `office-iso.html`: the same scene as isometric canvas 2D, with shaded boxes sorted by depth and people drawn larger than life.
- `mockup/README.md`, plus the two screenshots.

**Why**
Tim asked for a redesign: a large open-plan office with an office for Hal, a staff kitchen and a sofa area, where staff fetch coffee or relax on the sofas when they're not working, in a more 3D, less pixel-art style. He asked to see both styles before anything is built, as a mockup first, with downtime that mixes kitchen and sofa.

**Decisions**
- One shared floor plan and routine, so the two styles compare like for like, and the live version can reuse it.
- Desks were turned so staff face the camera; the first version showed their backs.
- No external models or art: everything is built from simple shapes, so there are no licences to worry about.

**How to check it**
- Open either page. Playwright screenshots of both are in the mockup folder.
- The iso version runs at 60 fps headless.
- The test browser couldn't reach the CDN, so the 3D version was tested with the same Three.js version served locally.

**Open items**
- Tim picks a style. He also shared a Reddit post as the look he's after, which couldn't be opened from the cloud session, so he's been asked for a screenshot.
- Then the chosen one gets wired to the live office: agent states from the hooks, the cards and the log.

### 2026-11-06: Edit a role's details, link and advert text in the office

**What changed**
- `shared/office-view/public/index.html` and `dashboard.js`: the "Edit details" dialog gains Role title, Company, Pay, Location, Advert link and "Paste the advert text". Only changed fields are sent; the advert box always starts empty.
- `shared/office-view/src/server.ts`:
  - `POST /api/roles/<id>` takes optional `advert` text and saves it with `saveAdvert()`. It checks the link starts with http(s).
  - When Tim changes the link or pastes an advert, "Read the advert, write the listing, score the fit and give a verdict" is queued for Hal. The reply says so, and the page tells Tim.
  - Fix: `closing_date` was missing from `EDITABLE`, so closing dates set in the dialog were silently dropped. It's now saved.
- `shared/office-view/README.md`: a row for the new trigger.
- `CHANGELOG.md`: lines for #13 and #14.

**Why**
Tim needs to edit roles and add details, such as NetEase's job link. NetEase was stuck because it had no link or advert for Rita or Wren to work from.

**Decisions**
- A new link or advert always triggers a fresh read, even if a listing exists, because it's new information. A role waiting for Wren is drafted once the listing exists: Hal's existing rule is "no listing, get Rita first".

**How to check it**
- `tsc` is clean, and `npm test` passes (26).
- Playwright against a throwaway copy, on NetEase's role page with "Edit details": set the link, pay, closing date and advert text, then Save. The tracker had the new url, pay and closing_date, `advert.txt` was written, and the inbox gained the read task.

**Open items**
None.

### 2026-11-06: Job search: Cole's interview prep for the three applied roles

**What changed**
- `interview-prep.md` and `talking-points.md` for:
  - Hexagon World Series (`2026-11-06-hexagon-world-series-director-of-team-operations`)
  - Chelsea FC (`2026-11-06-chelsea-fc-senior-manager-admin-operations-football`)
  - Razer (`2026-11-02-razer-associate-manager-marketing-operations-e`, new folder)
- Their three "Refresh interview prep" inbox items are done. NetEase's (i1) is still open: no advert, no interview.

**Why**
Tim pressed "Refresh interview prep" on these roles in the office, at 22:45.

**Decisions**
- Cole used no web lookups.
- Razer's prep is generic, as it has no advert on file.

**How to check it**
Each role page's Interview tab.

**Open items**
- Tim to add interview dates and interviewers when he has them.
- Paste Razer's advert so Cole can refresh it.
- Cole flagged claims in the Hexagon and Chelsea `cv.md` files that aren't in the CV bank: "from one title to six", and the Airtable booking system "with AI support". Tim should only use them if he can back them up.

### 2026-11-06: Job search: merged Tim's office changes; Wren drafted Vitality

**What changed**
- Merged `origin/main` into this branch (Tim's office edits).
  - The conflict in `jobs/tracker.json` and `jobs/tracker.md` was resolved by taking main's version and re-running Hal's 38 verdict updates on top. Nothing of Tim's was lost.
  - The NetEase action is now a5.
- `jobs/roles/2026-11-06-vitality-head-of-events-and-experiences/`: Wren's `cv.md`, `cover-letter.md`, `notes.md`, `cv.docx` and `cover-letter.docx`. Its inbox task is done.

**Why**
Tim shortlisted Vitality and moved it to Drafted in the office. Hal's automatic runs aren't happening on his PC, so Hal handled the inbox from this session.

**Decisions**
- NetEase is still not drafted: there's no advert.
- Cole was briefed for the "Refresh interview prep" requests on the three applied roles (Hexagon, Razer, Chelsea). That work is in a later entry.

**How to check it**
The Vitality role page's Documents tab shows the CV and letter. `notes.md` lists Wren's gaps for Tim.

**Open items**
- Cole's prep.
- NetEase advert.
- Hal's automatic runs on Tim's PC.

### 2026-11-06: Job search: verdicts for all 37 To review roles

**What changed**
- `jobs/tracker.json` / `tracker.md`:
  - `fit`, `verdict` and `verdict_why` set on all 37 To review roles and on NetEase (Drafted): 1 Apply, 18 Maybe, 18 Skip.
  - Ada re-ranked To review.
  - An inbox task asks Wren to draft NetEase (i2, left open), and an action asks Tim for the NetEase advert.
- Rita appended a `## Verdict` section to the 4 existing listings: Vitality, the two Blank Space roles and Disrupt Search.
- `jobs/today.md`: today's top picks.

**Why**
Tim ran `/hal give verdicts on everything in To review`, and chose full reads for the top 10 with details-only verdicts for the rest. He also pointed out that NetEase is Drafted with no CV. He moved it to Drafted before [Pha1lbot/agent-office#12](https://github.com/Pha1lbot/agent-office/pull/12), so Wren was never asked.

**Decisions**
- LinkedIn is not reachable from this cloud session's network, so Rita's 9 full reads fell back to details only. I didn't widen the network: Tim can ask for the full reads from his PC, where LinkedIn works.
- Wren wasn't briefed on NetEase. There's no link, advert or listing to tailor to, and Tim's own notes say the role is below his level and pay floor.

**How to check it**
`tracker.py list --status found`: every role has a verdict, P1 is The Crowd (Apply) and the Skips are at the bottom.

**Open items**
- NetEase: Tim adds the advert or skips the role. Inbox i1 ("Refresh interview prep") is still open, as there's no interview.
- Full reads of the top Maybes from Tim's PC.
- Hal's automatic runs don't seem to be happening on Tim's PC: i1 has been waiting since 22:13. Check that Claude Code is installed and signed in there.

### 2026-11-06: To review is ranked automatically, and Hal gives verdicts on roles

**What changed**
- `shared/tools/tracker.py`:
  - New fields `verdict` (`apply`, `maybe` or `skip`, checked) and `verdict_why` (one line, at most 300 characters).
  - New `rank()` runs on every save. It numbers every `found` role best first: verdict (apply, maybe, none, skip), then fit, then pay band (£60k+, £50k+, other, using `yearly_pay`), then closing date, then oldest. A priority Tim sets with `--by tim` gets `priority_by_tim` and is kept; the others are numbered around it.
  - New `rank` command.
  - The add task is now "Read the advert, write the listing, score the fit and give a verdict" (`READ_TASK`).
- `shared/office-view/src/roles.ts`: `advert.txt` added to the allowed and text files. New `saveAdvert()`, using the same id and path checks, with a 20,000-character limit.
- `shared/office-view/src/server.ts`:
  - `POST /api/roles` takes optional `advert` text and saves it as `advert.txt`. A link or the text is now required.
  - `POST /api/roles/<id>/request` takes `kind: "verdict"`, which queues "Give a verdict: worth applying?".
- Office page:
  - `util.js`: `verdictBadge()`.
  - `dashboard.js`: a badge on cards and a sortable "Hal" column in the list.
  - `index.html`: an "Or paste the advert text" box in Add role.
  - `role.js`: a "Hal's verdict" panel on Overview, with "Ask Hal: worth applying?" (or "Ask again"), and the pasted advert shown until Rita's listing exists.
  - `style.css`: badge colours.
- `.claude/agents/lead-recruiter.md` (Rita):
  - a `## Verdict` section in every listing, with For and Against bullets
  - rules for Apply, Maybe and Skip
  - reads `advert.txt` when present
  - a verdict-only mode that reads only `listing.md` and `preferences.md`, with no web
- `.claude/skills/cos/SKILL.md` (Hal):
  - sets `verdict` and `verdict_why` from Rita's replies
  - new "Give a verdict" office task
  - "Start the day" uses Ada's ranking instead of ranking by hand
- `test/roles.test.ts`: a test for `saveAdvert` and `advert.txt`.
- READMEs (root, office view, Rita, Hal).
- `CHANGELOG.md`: line for #12.

**Why**
Tim asked for Hal to "auto arrange jobs from Rita", and chose ranking (P1, P2…) over auto-shortlisting or auto-skipping. He also wanted to give Hal jobs himself and hear whether they're worth applying for. He chose the office route with Apply / Maybe / Skip verdicts, and pasted text for pages that need a login.

**Decisions**
- Ranking is done by the tracker (Ada), with no tokens, rather than by Hal. It's re-run on every save, so the order can't go stale.
- Rita gives the verdict, as she already reads the advert, and Hal records it. A verdict-only request avoids web lookups to keep the hand-off cheap.
- Tim's real tracker had no priorities on its 37 To review roles, so the first ranking overwrites nothing of his.

**How to check it**
- Tracker, in a temporary `JOBS_DIR`:
  - four roles ranked as expected
  - a priority Tim set (1) was kept
  - shortlisting renumbered the rest
  - `verdict=great` was refused
- `npm test`: 26 pass. `tsc --noEmit` is clean.
- End to end, against a throwaway copy of the repo with a fake Claude, using Playwright:
  - Add role refuses an entry with neither link nor text
  - with pasted text, it saves `advert.txt` and queues the read task
  - verdicts set through the tracker show as badges, and To review is ordered P1 Apply, P2 Maybe…
  - the role page shows the verdict panel, and the pasted `<script>` appears as plain text
  - "Ask again" queued "Give a verdict: worth applying?"
- A first run found `verdictBadge` missing from `dashboard.js`'s imports (the board didn't draw). Fixed, then re-tested.

**Open items**
- 33 of Tim's 37 To review roles have no fit or verdict yet (imported from his old dashboard), so for now they're ranked by pay and closing date. Tim can ask Hal to give verdicts on them in one batch, which costs one Rita hand-off.

### 2026-11-06: Setting a role to Drafted sends it to Wren

**What changed**
- `shared/tools/tracker.py`: `INBOX_TASKS` gains `drafted` → "Draft a tailored CV and cover letter". Like `approved`, it's queued only when Tim makes the change and the role has no `cv.docx` yet. So it never re-drafts documents that exist, and the team setting `drafted` after Wren finishes doesn't queue anything.
- `.claude/skills/cos/SKILL.md`: Hal's drafting task also covers roles Tim set to drafted.
- `shared/office-view/public/role.js`: the Documents tab's "nothing drafted yet" note shows "Wren drafts… when Hal next runs" for drafted roles too.
- `shared/office-view/README.md`: a row for the new trigger.
- `CHANGELOG.md`: line for [Pha1lbot/agent-office#11](https://github.com/Pha1lbot/agent-office/pull/11).

**Why**
Tim drags roles straight to Drafted, and expected that to get Wren writing. Before, only Shortlisted did.

**Decisions**
Drafted with documents already there does nothing, as Tim is probably just recording that they exist.

**How to check it**
In a temporary `JOBS_DIR`, setting a role to drafted with `--by tim` queued one task (and only one when repeated). A role with `cv.docx` queued nothing. The office tests (25) pass.

**Open items**
None.

### 2026-11-06: Launcher and setup no longer wait for the sync

**What changed**
- `shared/office-view/Open Office.cmd`: runs `sync.ps1` hidden in the background (`start "" /b`) instead of waiting for it.
- `shared/tools/setup-pc.ps1`: step 3 also starts the sync in the background.
- `README.md`: wording to match, and where to look in the sync log.
- `CHANGELOG.md`: line for [Pha1lbot/agent-office#10](https://github.com/Pha1lbot/agent-office/pull/10). This file also notes #10 as merged in its status.

**Why**
Even with #10 merged, the launcher on Tim's new laptop still sat on "Getting the latest from GitHub". So it wasn't only a sign-in wait: `git fetch` hangs there for a reason still unknown. Whatever the cause, the office shouldn't depend on it. The scheduled task keeps pulling, and has a 5-minute limit.

**Decisions**
Background rather than a timeout inside `sync.ps1`. It's simpler and works whatever makes git hang.

**How to check it**
Double-click the launcher: it goes straight to "Checking everything is installed...".

**Open items**
- Find out why `git fetch` hangs on the new laptop. Tim runs `git fetch -v` and checks the credential helper.

### 2026-11-06: The sync never holds up the office

**What changed**
- `shared/tools/sync.ps1`: sets `GCM_INTERACTIVE=never`, so Git's sign-in helper fails at once instead of waiting for a login window. Fetches use `http.lowSpeedLimit=1000` and `http.lowSpeedTime=20`, so a stalled connection gives up after about 20 seconds. The failure message in the log now tells Tim to run `git fetch` once to sign in.
- `shared/office-view/Open Office.cmd`: the message says the step is skipped if it can't connect. The office already starts whatever the result.
- `README.md`: "If something goes wrong" lines for Smart App Control blocking the launcher, and for signing in to GitHub.

**Why**
On Tim's new laptop the launcher stopped at "Getting the latest from GitHub...". That was most likely Git Credential Manager waiting on a sign-in window that was hidden, or that never appeared. Smart App Control had also blocked the launcher at first.

**Decisions**
- The sync doesn't try to sign in. Signing in is a one-off, done by hand with `git fetch`.
- There's no way round Smart App Control for one file, short of turning it off, so the README gives the PowerShell route.

**How to check it**
In bash against a throwaway repo, a remote that asks for a password made the fetch fail at once rather than prompt.

**Open items**
- Tim runs `git fetch` once on the new laptop to sign in, then reopens the office.

### 2026-11-06: Record the merge of #9

**What changed**
- `CHANGELOG.md`: line for [Pha1lbot/agent-office#9](https://github.com/Pha1lbot/agent-office/pull/9).
- This file: status set to merged.

**Why**
The "After a merge" routine in CLAUDE.md.

**Decisions**
None.

**How to check it**
Read the top of `CHANGELOG.md`.

**Open items**
- On the new laptop, the clone failed with "Repository not found" (a sign-in problem). Tim is retrying with `https://Pha1lbot@github.com/...` so Git asks him to sign in, then runs `setup-pc.ps1`.

### 2026-11-06: Set-up for a second laptop, and main kept up to date after every merge

**What changed**
- New `shared/tools/setup-pc.ps1`: one-off set-up for a new Windows PC. Installs any missing Node.js, Python, pandoc and LibreOffice with winget, sets the git name and email if unset, puts the copy on `main`, runs a sync, installs the office's npm packages, sets up the scheduled pull, and checks for Claude Code. Safe to run again.
- `shared/tools/sync.ps1`: rewritten. It fetches first, then: on `main`, fast-forwards; on another branch, updates local `main` with `git fetch origin main:main`; with local commits not yet on GitHub, merges (`--no-edit`), and on a clash runs `git merge --abort` and logs it. Never forces or discards anything.
- `shared/tools/install-sync.ps1`: the scheduled task now runs every 5 minutes instead of 15.
- `shared/office-view/Open Office.cmd`: runs `sync.ps1` before starting the office.
- `README.md`: new "Setting up a new PC or laptop" steps, and the sync section updated.
- Restarted this branch from `main`, as its earlier work was merged. Also did the after-merge routine for #7 and #8: CHANGELOG lines and both notes files marked merged.

**Why**
Tim is setting up a second laptop. On the first one he was updating `main` by hand after merges. Possible causes: the scheduled task was never installed, the laptop was on another branch (the old script only pulled the current branch), or a local office-backup commit had made `--ff-only` refuse. The new script handles the last two, and the setup script installs the task.

**Decisions**
- Polling every 5 minutes rather than a push from GitHub: GitHub can't reach a laptop without exposing it to the internet, and a `git fetch` with nothing new is very cheap.
- The sync merges but doesn't push. Pushing stays with the office backup and Claude sessions.
- The setup script doesn't install Claude Code itself; it points to the official instructions.

**How to check it**
The git steps were tested in bash against a throwaway repo: on a branch, local `main` updates; one local commit plus one new on GitHub merges; a clash is aborted with nothing changed. PowerShell isn't available here, so the scripts haven't been run on Windows yet.

**Open items**
- Tim runs `setup-pc.ps1` on the new laptop, and re-runs `install-sync.ps1` on the old one to get the 5-minute task.

### 2026-11-06: Open pull request for preference reviews

**What changed**
- This file: status set to "In review", with a link to [Pha1lbot/agent-office#3](https://github.com/Pha1lbot/agent-office/pull/3).

**Why**
The preference-review work needs merging into `main`, because Tim's PC stays on `main`.

**Decisions**
Tim merges it himself; the PR asks for a merge commit, not a squash.

**How to check it**
Open the pull request link.

**Open items**
After merging: add the CHANGELOG line (the "After a merge" routine).

### 2026-11-06: Suggest preference updates from what Tim does with roles

**What changed**
- `shared/tools/tracker.py`: new `reason` field (why Tim skipped a role or was rejected). New `insights [--since DATE]` command that summarises Tim's decisions: picked vs skipped counts, outcomes, pay (lowest yearly figure; day rates and "competitive" are left out), work style (remote, hybrid, office), title words, sources, average fit score and the reasons Tim gave.
- `.claude/skills/cos/SKILL.md`: Chief of Staff asks once for an optional reason when Tim passes on roles. New "Preference reviews" section: runs when Tim asks, or is offered in one line once 10 or more decisions have been made since the last review. It makes up to 5 suggestions, each with evidence and at least 3 decisions behind it, edits `preferences.md` only for the ones Tim accepts, and logs the result.
- `.claude/agents/admin.md`: how to record a reason.
- `jobs/preference-reviews.md`: new log of suggestions and Tim's answers. The top entry's date is where the next review starts.
- `jobs/README.md`, `README.md`, `shared/job-search/preferences.md`: explain the reviews and the `/cos review my preferences` command.
- This file: status set back to "In progress", because the branch was restarted from `main` for this follow-up.

**Why**
Tim asked whether his preferences could update automatically from the details on his dashboard. He chose to learn from what he does with roles (picks, skips, outcomes), with changes suggested for him to approve rather than made automatically.

**Decisions**
- The patterns are worked out by `tracker.py insights`, not by the model reading every role, so a review costs a few hundred tokens however big the tracker gets.
- Suggest-and-approve, so the search can't drift from what Tim wants without him knowing. At least 3 decisions are needed behind each suggestion, so a single odd choice isn't over-read.
- Reviews are offered, never run unasked, to save tokens.
- Reasons are optional and asked once, so skipping roles stays quick.
- The branch was restarted from `main` after #1 and #2 merged, as a fresh change (fast-forward, no force push).

**How to check it**
Tested in this session on sample data in the scratchpad: 5 roles (2 picked, one of them reaching interview, and 3 skipped with reasons). `insights` reported the right counts, pay medians, work styles, title words, sources, fit averages and reasons, and `--since` a future date reports nothing. Pay parsing was checked on ranges, "40k", day and hour rates, "Up to £55,000" and "competitive". On the PC: skip a few roles with reasons, then run `/cos review my preferences`.

**Open items**
Pay parsing is approximate (it uses the lowest figure in the text). Unusual formats are left out rather than guessed. The office view's dashboard could show these insights later.

### 2026-11-06: Fix merge conflict with main

**What changed**
- Merged `main` into this branch to clear the conflict that stopped [Pha1lbot/agent-office#2](https://github.com/Pha1lbot/agent-office/pull/2) merging. `README.md` and this notes file conflicted; this branch's versions were kept.
- `CHANGELOG.md`: added the line for the work merged in [Pha1lbot/agent-office#1](https://github.com/Pha1lbot/agent-office/pull/1), which was missing.

**Why**
Tim couldn't merge #2 because of a conflict. An earlier pull request from this same branch, #1, had already been squash-merged into `main`. It contained the commits up to "Document the new layout". Because a squash merge turns them into one new commit, git saw the same two files changed on both sides.

**Decisions**
- Checked first that `main` was exactly this branch at commit 238b8a8 ("Document job-search team layout and daily use"). So this branch's version of both files is simply the newer one, and nothing on `main` is lost by keeping it. After the merge, the branch's files are identical to before.
- Merged rather than rebased. A rebase would need a force push, which CLAUDE.md forbids without Tim's say-so.
- This entry and the CHANGELOG line go in the merge commit itself, so the change and its note are in the same commit.

**How to check it**
#2 should now show "no conflicts" on GitHub. `git diff 238b8a8 origin/main` is empty, which confirms `main` held nothing beyond this branch.

**Open items**
Tim to merge #2. To avoid this next time, keep merging with "Create a merge commit" rather than "Squash and merge", or start a fresh branch after each squash merge.

### 2026-11-06: Open pull request

**What changed**
- `notes/changes/claude-youthful-hopper-alwu7m.md`: status set to "In review", with a link to the pull request.

**Why**
Tim wants his PC kept on `main`, so this branch needs merging. A pull request was opened as [Pha1lbot/agent-office#2](https://github.com/Pha1lbot/agent-office/pull/2), with a summary of these notes, as CLAUDE.md requires.

**Decisions**
Tim merges it himself; Claude does not push to `main`.

**How to check it**
Open the pull request link.

**Open items**
After merging: on the PC run `git checkout main`, `git pull` and `install-sync.ps1`; add the CHANGELOG line.

### 2026-11-06: Keep Tim's PC on main

**What changed**
- `CLAUDE.md`: new "Tim's PC stays on `main`" section in the backup routine. On the PC, Claude uses a branch only when needed and switches back to `main` once the branch is pushed and its pull request is open. Cloud sessions can still use their own branches.

**Why**
Tim said "Keep pc on main", after hearing that the automatic pulls only update the branch the PC is on.

**Decisions**
This is written as a rule for Claude rather than enforced by a script. A script that switched branches automatically could get in the way of work in progress. A pull request is opened for this branch so `main` gets the job-search team and the sync setup; Tim merges it himself.

**How to check it**
After the pull request is merged, run `git checkout main` and `git pull` on the PC. `git status` should say "On branch main" and up to date.

**Open items**
Tim to merge the pull request. After the merge, add this branch's line to `CHANGELOG.md` (the "After a merge" routine).

### 2026-11-06: Pull automatically on Tim's PC and at session start

**What changed**
- `.claude/settings.json`: new. A SessionStart hook runs `git pull --ff-only` when a Claude Code session starts or resumes (not on clear or compact). It times out after 30 seconds, never asks for a password, and always exits cleanly. If the pull fails, Claude is told to run `git status` and `git pull` and sort it out with Tim.
- `shared/tools/sync.ps1`: new. Windows script that runs `git pull --ff-only` on this repo and logs the result to `%LOCALAPPDATA%\agent-office-sync.log`, keeping the last 500 lines.
- `shared/tools/install-sync.ps1`: new. One-off setup that registers a Windows scheduled task, "agent-office git pull", running `sync.ps1` at log-on and every 15 minutes. The remove command is in the file and the README.
- `README.md`: new "Keeping your PC up to date" section.
- `CLAUDE.md`: start-of-session step 2 now mentions the hook and says to check its result.

**Why**
Tim asked to keep his local copy up to date after every merge. After choosing the after-merge rule, he asked for the scheduled pull and the start-up hook as well.

**Decisions**
- `--ff-only` everywhere, so an automatic pull never creates a merge commit or touches local changes. If Tim's copy has diverged it stops, and a person or Claude sorts it out, following CLAUDE.md's "never discard" rules.
- `GIT_TERMINAL_PROMPT=0` and a timeout, so a credential prompt or a network problem can't hang the scheduled task or hold up a session.
- The hook runs only on start and resume. Clear and compact happen mid-session, and pulling in the middle of work could surprise it.
- The hook command is written inline in `settings.json` rather than as a separate script, to keep it to one small file.
- Windows scripts, because Tim works from a PC. Task Scheduler needs no extra software.

**How to check it**
- Hook: tested in this session. In the repo it prints "Already up to date." and exits 0. Pointed at a folder that isn't a repo, it prints git's error and the "did not finish" message and still exits 0. On Tim's PC, start Claude Code in the folder; the first thing Claude sees is the pull result.
- Scheduled task: not tested here (no Windows or PowerShell in the cloud sandbox). On the PC, run `install-sync.ps1`, then check that "agent-office git pull" appears in Task Scheduler and that the log file gets an "ok" line within 15 minutes.

**Open items**
- Check on Tim's PC that the hook runs. Claude Code on Windows runs hook commands through Git Bash, and the inline command uses bash syntax. If it doesn't run, move it into a small script.
- PowerShell may flash a window briefly every 15 minutes. If that is annoying, it can be launched through a small VBScript wrapper instead.
- The scheduled pull only updates the branch the PC is on, so the PC should stay on `main`.

### 2026-11-06: Pull main after every merge

**What changed**
- `CLAUDE.md`: new "After a merge" section in the backup routine. After Claude merges a pull request, or Tim says one has been merged, Claude checks for uncommitted changes, switches to `main`, runs `git pull`, adds the CHANGELOG line, pushes, and tells Tim the copy is up to date.

**Why**
Tim asked how to keep his local copy up to date and whether it could pull after every merge. He chose this option (pull after merges Claude does or is told about).

**Decisions**
Options offered: a scheduled pull on Tim's PC every 15 minutes, a Claude Code start-up hook that pulls at the start of every session, or this rule in CLAUDE.md. Tim picked the CLAUDE.md rule. It needs nothing installed, but it only works when Claude does the merge or is told about it. A merge clicked on GitHub with no Claude session running is picked up by the existing "pull at the start of every session" step. The CHANGELOG step from "Change notes" was folded in, since it also happens straight after a merge.

**How to check it**
After the next pull request is merged, say "it's merged" in Claude Code on the PC. Claude should switch to `main`, pull, add the CHANGELOG line, push, and report that `main` is up to date.

**Open items**
The scheduled pull and the start-up hook were not added. Either can be added later if merges made on GitHub keep being missed.

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
