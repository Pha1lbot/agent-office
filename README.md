# agent-office
Tim's agent office: Claude Code agents and their setup

## Layout

- `agents/`: one folder per agent, with a README saying what it does.
- `.claude/`: the agents' prompts, where Claude Code finds them.
- `shared/`: conventions, tools and job-search settings used by several agents.
- `jobs/`: the job search's tracker, daily list and documents.
- `notes/`: plans and per-branch change notes.

## The job-search team

| Who | Does |
|---|---|
| **Hal**, Chief of Staff | Runs the team and sets the day's priorities. The one you talk to (`/hal` or `/cos`). |
| **Rita**, Lead Recruiter | Finds and scores roles that fit your skills, experience and pay, and says whether each is worth applying for (including ones you add). |
| **Wren**, Writer | Writes a tailored CV and cover letter for each role you shortlist. |
| **Cole**, Interview Coach | Writes interview prep and key talking points when you get an interview. |
| **Ada**, Admin | The office's automation (no AI, no tokens): tracker updates, ranking new roles best first, fact-checking drafts against your CV, PDFs, follow-up dates, backups. |

The team's plan, including how it keeps token use down, is in `notes/plans/agent-office-v2.md`.

### Setting up a new PC or laptop

1. Install Git: open PowerShell and run `winget install --id Git.Git -e`, then close and reopen PowerShell.
2. Clone the repo where you want it (it's private, so a GitHub sign-in window opens the first time):

   ```
   cd $HOME\Documents
   git clone https://github.com/Pha1lbot/agent-office.git
   cd agent-office
   ```

3. Run the setup script. It installs whatever is missing (Node.js, Python, pandoc, LibreOffice), sets your git name and email, installs the office's packages, puts this copy on `main` and turns on the automatic pull. It's safe to run again:

   ```
   powershell -ExecutionPolicy Bypass -File shared\tools\setup-pc.ps1
   ```

4. Install Claude Code if it isn't already (https://code.claude.com/docs/en/setup) and run `claude` once to sign in. Hal's automatic runs need it.

Your CV, preferences and every role's files are in the repo, so they come across with the clone.

### Keeping each PC up to date

- **Automatic pull every 5 minutes (Windows):** set up by `setup-pc.ps1` (or on its own with `powershell -ExecutionPolicy Bypass -File shared\tools\install-sync.ps1`). A scheduled task called "agent-office git pull" runs at log-on and every 5 minutes, so a merged pull request reaches your PC within about 5 minutes, with nothing to do by hand. If you're on another branch, it still updates your local `main`. If this PC has its own commits that aren't on GitHub yet, it merges the two. It never overwrites your work: if something clashes, it changes nothing and writes why to `%LOCALAPPDATA%\agent-office-sync.log`. To remove it: `Unregister-ScheduledTask -TaskName "agent-office git pull" -Confirm:$false`.
- **When you open the office:** `Open Office.cmd` pulls in the background while the office starts.
- **When Claude Code starts:** `.claude/settings.json` runs `git pull` whenever a session starts or resumes in this folder, on your PC or in the cloud.
- **After a merge:** if Claude merges a pull request, or you tell it one was merged, it switches to `main` and pulls (see CLAUDE.md).

**Check the build:** the office shows its build at the top left, under "Job Hunt" (on a phone, at the foot of the Overview). It goes up with every merge, and the dot tells you whether that PC is current: green is up to date. Hover over it for the commit, branch and folder. An office with no build label at all is older than 8 November 2026.

**If something goes wrong:**
- **The office looks old, or the build label isn't green:** in PowerShell, in this PC's `agent-office` folder:
  1. Run `git status -sb`. The first line should be `## main...origin/main`; if it names another branch, run `git checkout main`.
  2. Run `Get-Content $env:LOCALAPPDATA\agent-office-sync.log -Tail 5` to see why the automatic sync stopped, then `git pull`. If it asks you to sign in, do. If it says your changes would be overwritten, stop and ask Claude.
  3. Close the black "Agent Office" window and open `shared\office-view\Open Office.cmd` from **this** folder. Check your shortcut doesn't point at an old copy, such as an `agent-office-main` folder from a ZIP download.
- **"Smart App Control blocked" `Open Office.cmd`:** open the office from PowerShell instead. In the `agent-office` folder run `cd shared\office-view`, then `npm install` (first time only), then `npm start`, and open http://127.0.0.1:4747.
- **The sync can't get past GitHub (the log at `%LOCALAPPDATA%\agent-office-sync.log` shows FAILED, or nothing new):** Git needs you to sign in once on each PC. In PowerShell, in the `agent-office` folder, run `git fetch` and sign in when asked. The sync never waits for a sign-in; it logs the problem and the office opens anyway.

Keep each PC on `main`. When Claude needs a branch on your PC, it works in a separate `agent-office-work` folder beside this one, so this folder never changes branch and your office edits always go to `main`. Both laptops can run the office: each one's backups are pushed to GitHub and pulled by the other.

### Each day

Open Claude Code in this folder and type:

- `/cos start the day`: finds new roles, ranks them and asks which to go for.
- Reply with the roles you want: CVs and cover letters are drafted as Word files in `jobs/roles/<role>/`.
- `/cos approve <role>`: makes the PDFs once you're happy with the Word files. Or describe the changes you want.
- `/cos I applied to <role>` (or interview, rejected, offer): records the outcome.
- `/cos how's it going?`: a quick summary.
- `/cos review my preferences`: suggests changes to `preferences.md` based on which roles you picked and skipped. Nothing changes until you say yes. It also offers this once you've made 10 or more decisions since the last review.

When you skip a role, give a few words of reason if you can ("pay too low", "too far"). That's what the reviews learn from.

### Watch them in the office

Double-click `shared/office-view/Open Office.cmd`. It starts the office and opens http://127.0.0.1:4747 in your browser. (Or, in that folder, run `npm install` once, then `npm start`.) You'll see the team as coworkers in a 3D open-plan office (working at their desks, fetching coffee, relaxing on the sofas), plus a dashboard in the style of your Job Hunt artifact (Overview, Roles, Leads, Interviews, Next actions, CVs) and a page for each role with its CV, cover letter, attachments and interview talking points. Hal acts on your changes automatically. See `shared/office-view/README.md`.

Every weekday at 6:31, Rita searches your job sites and Hal reads your job-alert emails, in the cloud, so your PC can be off. Hal sorts the finds into Leads (or Dismissed, with his reason) before you start.

The agents never apply, email or fill in forms for you. Using Sonnet for the session (`/model sonnet`) keeps token use down.
