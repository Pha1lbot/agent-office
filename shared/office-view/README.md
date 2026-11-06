# Agent Office (office view)

Shows Tim's agents as pixel-art coworkers in an office, so he can see at a glance who is working, who is waiting for him and who has finished. A **Roles** tab shows the job-search tracker as a dashboard.

![Office](mockup/screenshot-office.png)

## Open the office

**On Windows, the easy way:** double-click **`Open Office.cmd`** in this folder. The first time, it installs what's needed (about a minute), then starts the office and opens it in your browser. Leave its window open while you use the office; closing the window closes the office. If the office is already open, it just shows it.

- **Desktop shortcut:** right-click `Open Office.cmd` → *Show more options* → *Send to* → *Desktop (create shortcut)*.
- **Open automatically when you log in:** press Win+R, type `shell:startup`, press Enter, and put a shortcut to `Open Office.cmd` in the folder that opens.
- You need [Node.js](https://nodejs.org) (the LTS version) installed.

**From a terminal**, one-off, in this folder (`shared/office-view`), with Node.js 20 or newer installed:

```
npm install
```

Then, each time:

```
npm start
```

and open **http://127.0.0.1:4747** in your browser. Leave the terminal open while you use it; Ctrl+C closes the office.

Now use Claude Code in the `agent-office` folder as normal (for example `/cos start the day`). The characters move as the agents work.

**To see it working without using any tokens**, run this in a second terminal, in the same folder:

```
npm run fake
```

It acts out a job-search day on a loop. `npm run fake -- --fast` plays it three times faster.

## What you see

| On screen | Means |
|---|---|
| Typing at the desk, screen on | Working |
| At the FILES shelf | Reading or searching files |
| At the WEB kiosk | Searching or reading the web |
| Bobbing `?` | Waiting for you: Chief of Staff's "Your turn", or a permission prompt |
| Sitting still | Idle: finished, or waiting on a teammate |
| Head down, `z Z` | Asleep: not used for a while |

Click a character or its card to see what it has been doing. The whiteboard and the **Roles** tab read `jobs/tracker.json` and update within a few seconds of any change.

## Editing roles, and Hal

In the **Roles** tab:
- **Status:** change it with the dropdown on each row. For "skipped" or "rejected" it asks for an optional reason, which helps Hal tune your searches.
- **Other details:** click a row to edit next step, priority, interview date and who it's with, reason and notes.
- **+ Add role:** add a role you found yourself.

Your edits are **backed up to GitHub automatically**, about 15 seconds after you stop editing. The strip at the top of the tab shows "Saved to GitHub", or what went wrong.

**Hal (your Chief of Staff) acts on your changes automatically:**

| You… | Hal… |
|---|---|
| set a role to **shortlisted** | gets Senior Admin to draft a tailored CV and cover letter |
| set a role to **approved** | makes the PDFs |
| set a role to **interview** | gets interview prep notes written (`interview-prep.md`) |
| **add a role** | gets the Lead Recruiter to read the advert and score the fit |

Hal starts **2 minutes after your last change**, so several changes share one run. He runs on Sonnet to save tokens, and at most **8 times a day**. Other changes (notes, next steps, applied, skipped) don't start him. The strip shows when he'll start, with **Run now** and an **Auto start** on/off switch. Anything he needs to ask you appears under "Waiting on you". Each run's log is saved in `logs/`.

Needs, on this PC:
- **Python 3**, for editing.
- **Claude Code**, signed in, for Hal's automatic runs. Without it, run `/cos` yourself.

Automatic runs can only use the job-search tools: reading and writing files, the tracker, git, documents and the web.

## How it works

- **Agents:** Claude Code hooks in `.claude/settings.json` run `hooks/report.mjs` on each event (session start, prompt, tool use, notification, stop, subagent stop, session end). It sends a few short fields to the bridge. If the office isn't open, it gives up within half a second and does nothing.
- **Bridge:** `src/server.ts` turns the reports into what each agent is doing (logic in `src/office.ts`), watches the tracker and pushes updates to the page. It only listens on this PC (127.0.0.1).
- **Page:** `public/` draws the office with PixiJS.

A session started in the `agent-office` folder is Chief of Staff. Subagents it calls (Lead Recruiter, Senior Admin, Admin) get their own characters. Sessions from other folders appear as visitors, but only if you also add the hooks to your user settings.

**Inputs:** Claude Code hook events; `jobs/tracker.json`.
**Outputs:** the web page. Nothing is written to disk. The office keeps no history once it is closed.

## Problems

- **"running scripts is disabled on this system"** (PowerShell): use `npm.cmd` instead of `npm`, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. `Open Office.cmd` avoids this.
- **"Could not read package.json"**: the terminal isn't in this folder. `cd` into `shared\office-view` first, or use `Open Office.cmd`.
- **"Port 4747 is already in use"**: the office is already open somewhere; go to http://127.0.0.1:4747.

## Settings

- `OFFICE_PORT`: use a different port (default 4747). Set it for both the office and Claude Code.
- `OFFICE_TRACKER`: show a different tracker file (for testing).
- `OFFICE_COS_MAX_PER_DAY`: Hal's daily limit of automatic runs (default 8).
- `OFFICE_PYTHON`, `OFFICE_CLAUDE`: the commands for Python and Claude Code, if the office can't find them.

## For developers

- `npm test`: tests for the state logic.
- `npm run check`: TypeScript type check.
- `mockup/`: the original mockup with sample data.
