# Branch: office-view

**Started:** 2026-11-06
**Status:** Merged 2026-11-06 ([PR #4](https://github.com/Pha1lbot/agent-office/pull/4))

## Purpose

Build the office view planned in `notes/plans/office-view.md`: a browser page that shows Tim's four job-search agents (Chief of Staff, Lead Recruiter, Senior Admin, Admin) as pixel-art coworkers, plus a Roles dashboard tab that reads the role tracker. A small local server on Tim's PC (Node/TypeScript) collects Claude Code hook events and pushes them to the page. Code lives in `shared/office-view/`. Tim asked for the build on a fresh branch, and for a mockup first.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Open pull request

**What changed**
- This file: status set to "In review", with a link to [Pha1lbot/agent-office#4](https://github.com/Pha1lbot/agent-office/pull/4).

**Why**
The office view is ready for Tim to merge into `main`, which his PC stays on.

**Decisions**
Tim merges it himself, with a merge commit.

**How to check it**
Open the pull request link.

**Open items**
After merging: add the CHANGELOG line; on the PC run `npm install` and `npm start` in `shared/office-view`.

### 2026-11-06: Connect Claude Code to the office and document it

**What changed**
- `.claude/settings.json`: added hooks that run `shared/office-view/hooks/report.mjs` on SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, SubagentStop and SessionEnd, each with a 3-second limit. The existing start-up `git pull` hook is unchanged.
- `shared/office-view/README.md`: how to open the office (`npm install`, `npm start`, http://127.0.0.1:4747), the fake agents, what each animation means, how it works, its inputs and outputs, settings, and developer commands.
- `README.md`: new "Watch them in the office" section.
- `notes/plans/office-view.md`: status updated to "first version built".

**Why**
So that real Claude Code sessions in the agent-office folder show up in the office without Tim setting anything up, and so Tim knows how to open it.

**Decisions**
- The hooks go in the project's settings, so they work as soon as Tim pulls `main`. They also run in cloud sessions, where there is no office: they fail quietly in well under a second.
- Hooks are not added to Tim's user settings, so other projects are not affected. The README says how to add them if he wants visitors from other folders.
- Each tool call starts a short Node process, about 0.07 s when the office is closed, which is fine for this use.

**How to check it**
Tested in this session: the hook command, run the way Claude Code runs it, exits 0 in about 0.07 s with the office closed. `npm test` passes (13 tests) and `npm run check` passes. On Tim's PC: pull `main` after merging, open the office, start Claude Code in the repo, and watch Chief of Staff wake up.

**Open items**
- Still to confirm on Tim's PC with real sessions that the hook data names the subagent (`agent_type`). If not, the fallback credits tool calls to the running subagent.
- Later: token and context use per character (plan step 4), real sprite art, and a one-click way to start the office on Windows.

### 2026-11-06: Add the live office page and fake agents

**What changed**
- `shared/office-view/public/index.html`, `style.css`: the real page, with the same layout and styles as the mockup (Office and Roles tabs, cards, activity panel).
- `shared/office-view/public/office.js`: draws the office with PixiJS 8, the same room as the mockup. It keeps the page live from the bridge over WebSocket and reconnects every 2 seconds if the bridge restarts; the header shows "Live" or "Reconnecting…".
  - Characters walk to the FILES shelf or the WEB kiosk and back.
  - The screen lights up while an agent types. Waiting agents get a bobbing `?` and sleeping ones `z Z`.
  - Agents from other folders stand in visitor spots.
  - Click a character or a card to see its log.
  - The whiteboard and the Roles tab come from the tracker. "Waiting on you" lists agents waiting for Tim, CVs to check, roles ready to apply for and new roles to pick.
- `shared/office-view/scripts/fake-agents.ts`: acts out a job-search day (start, Recruiter searching with one permission prompt, Admin logging roles, Chief of Staff waiting for Tim, Senior Admin drafting, Admin marking drafted). Sends the same reports as the real hooks. Options: `--once`, `--fast`.
- `shared/office-view/src/server.ts`: new `OFFICE_TRACKER` setting to show a different tracker file (for testing).

**Why**
The office view Tim asked for, built from the mockup he approved ("This is a good start").

**Decisions**
- Text is drawn at screen size above the scaled-up art, so it stays sharp while the art stays blocky.
- Everything from the tracker is escaped before it is shown, and only `http(s)` links are clickable, because job adverts come from the web.
- The fake agents go through the real `/report` path, so a fake run tests the same code the real hooks use.

**How to check it**
In `shared/office-view/`: `npm start`, then `npm run fake` in a second terminal, and open http://127.0.0.1:4747. Checked in this session with a headless browser:
- No page errors and the header shows "Live".
- Mid-day shots showed the Recruiter walking to the kiosk, Chief of Staff waiting with `?`, and Admin and Senior Admin asleep.
- With a sample tracker, the Roles tab showed counts, the "Waiting on you" list and the table. A title containing `<b>` showed as plain text and a `javascript:` link was not made clickable.
- Changing a role's status in the tracker reached the bridge within 3 seconds.
- No sideways scrolling at phone width.

The first run showed the sleeping `z Z` too high (drifting toward the desk above); it was moved next to the head.

**Open items**
Hook settings and README next.

### 2026-11-06: Add bridge server and hook reporter

**What changed**
- `shared/office-view/src/server.ts`: the bridge. `POST /report` takes a report and updates the office state. `GET /api/state` returns everything. `/live` is a WebSocket: a full snapshot on connect, then updates for changed agents and for the tracker. It serves the page from `public/` and PixiJS from `node_modules` at `/vendor/pixi.mjs`. It watches `jobs/tracker.json` every 2 seconds and runs the dozing timers every 15 seconds. If the port is taken, it says so clearly.
- `shared/office-view/hooks/report.mjs`: the Claude Code hook. It reads the hook JSON from stdin and keeps only what the office needs: event, session, folder, tool, subagent, a short description, and a short target (file path relative to the project, search, URL, or the Bash command's description). It posts that to the bridge with a 500 ms timeout and a 1-second hard stop, never prints anything and always exits 0.

**Why**
These connect Claude Code to the office. They are the "bridge" layer in `notes/plans/office-view.md`.

**Decisions**
- Listens on 127.0.0.1 only, so nothing outside Tim's PC can reach it. Reports carrying a web page's `Origin` header are refused, so a website open in Tim's browser can't send fake events.
- The reporter sends a trimmed copy and never the full tool input (prompts, file contents), so long text never leaves the hook. For Bash it sends Claude's short description of the command rather than the command itself, so tokens or passwords in commands aren't shown on screen.
- PixiJS is served from the installed package, so the page works offline and needs no build step.
- Plain Node `http` plus `ws`, no web framework, to keep it small.
- Polls the tracker file rather than using `fs.watch`, which behaves differently on Windows.

**How to check it**
Tested in this session on port 4799. A Task-briefing report and a Read report piped through `report.mjs` showed up in `/api/state` as Chief of Staff "Waiting on Lead Recruiter" and Lead Recruiter walking to the shelf with the path relative to the project. A post with a website's Origin got 403, bad JSON got 400, PixiJS was served (200), and a `../` path got 404. With the server closed, the reporter exited 0 in 0.1 seconds; with bad input it also exited 0.

**Open items**
Hook settings, page, fake agents, README.

### 2026-11-06: Add tests for the state logic

**What changed**
- `shared/office-view/test/office.test.ts`: 13 tests covering the starting state, Chief of Staff detection with Windows and Unix paths, visitor desks, briefing a subagent, crediting tool calls (named subagent, or the running one), walking to the shelf or kiosk and back, reporting back, Stop meaning "Your turn", permission notifications, unknown subagents, SessionEnd, dozing timers and log trimming.

**Why**
The state logic decides what Tim sees, so it needs tests before the server and page are built on it.

**Decisions**
Uses Node's built-in test runner through tsx, so no test framework is needed.

**How to check it**
`npm test` in `shared/office-view/`: 13 pass. One test's expectation was wrong at first (it expected Senior Admin to doze at exactly 5 minutes idle, but the rule is "more than 5 minutes"). The test was corrected; the logic was right.

**Open items**
Bridge server, hook reporter, page, fake agents, README.

### 2026-11-06: Set up the office-view project and its state logic

**What changed**
- `shared/office-view/package.json`, `package-lock.json`: new Node project. Pinned dependencies: pixi.js 8.22.0, ws 8.22.1, tsx 4.23.15. Dev dependencies: typescript 5.9.3 and type definitions. Scripts: `start`, `fake`, `test`, `check`. (`node_modules/` is already ignored by `.gitignore`.)
- `shared/office-view/tsconfig.json`: strict TypeScript settings, type checking only.
- `shared/office-view/src/office.ts`: the office's state logic. It turns Claude Code hook reports into what each character is doing (typing, walking to the FILES shelf or WEB kiosk, waiting, idle, asleep) and keeps the last 50 log lines and a tool-call count per agent. How it works:
  - A session started in the agent-office folder is Chief of Staff.
  - A `Task`/`Agent` tool call with a `subagent_type` puts that subagent to work and shows Chief of Staff "Waiting on …".
  - Tool calls are credited to the subagent named in the hook, or else to the subagent that is running.
  - `Stop` means "Your turn" (waiting for Tim).
  - Idle agents doze after 5 minutes, waiting ones after 15. Busy agents with no news for 10 minutes go idle.
  - Sessions from other folders get visitor desks.

**Why**
The first part of the build Tim asked for. It's committed now, while Tim looks at the mockup, so the work is backed up.

**Decisions**
- The state logic is kept apart from the server so it can be tested without a network.
- Reports use a trimmed-down copy of Claude Code's hook data (event, session, folder, tool, subagent, short target), so the same format can later be sent by Agent SDK agents too.
- Tool calls are credited to the running subagent as a fallback, in case hook data doesn't name the subagent. Still to confirm on Tim's version of Claude Code.

**How to check it**
`npm run check` passes (type check). A quick run in this session: after "Chief of Staff briefs Lead Recruiter" followed by a web search, the Recruiter shows as walking to the WEB kiosk and Chief of Staff as "Waiting on Lead Recruiter"; after `Stop`, Chief of Staff is "waiting" and the Recruiter idle. Unit tests come next.

**Open items**
Still to do: unit tests, bridge server, hook reporter and hook settings, PixiJS page following the mockup, fake agents, README. Waiting on Tim's mockup feedback before building the page.

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

