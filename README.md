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
| **Rita**, Lead Recruiter | Finds and scores roles that fit your skills, experience and pay. |
| **Wren**, Writer | Writes a tailored CV and cover letter for each role you shortlist. |
| **Cole**, Interview Coach | Writes interview prep and key talking points when you get an interview. |
| **Ada**, Admin | The office's automation (no AI, no tokens): tracker updates, PDFs, follow-up dates, backups. |

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
- **When you open the office:** `Open Office.cmd` pulls first.
- **When Claude Code starts:** `.claude/settings.json` runs `git pull` whenever a session starts or resumes in this folder, on your PC or in the cloud.
- **After a merge:** if Claude merges a pull request, or you tell it one was merged, it switches to `main` and pulls (see CLAUDE.md).

Keep each PC on `main`. Both laptops can run the office: each one's backups are pushed to GitHub and pulled by the other.

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

Double-click `shared/office-view/Open Office.cmd`. It starts the office and opens http://127.0.0.1:4747 in your browser. (Or, in that folder, run `npm install` once, then `npm start`.) You'll see each agent as a pixel-art coworker, plus a **Pipeline** board where you drag roles between stages, and a page for each role with its CV, cover letter, attachments and interview talking points. Hal acts on your changes automatically. See `shared/office-view/README.md`.

The agents never apply, email or fill in forms for you. Using Sonnet for the session (`/model sonnet`) keeps token use down.
