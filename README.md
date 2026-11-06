# agent-office
Tim's agent office: Claude Code agents and their setup

## Layout

- `agents/`: one folder per agent, with a README saying what it does.
- `.claude/`: the agents' prompts, where Claude Code finds them.
- `shared/`: conventions, tools and job-search settings used by several agents.
- `jobs/`: the job search's tracker, daily list and documents.
- `notes/`: plans and per-branch change notes.

## The job-search team

| Agent | Does |
|---|---|
| Chief of Staff | Runs the team and sets the day's priorities. The one you talk to. |
| Lead Recruiter | Finds roles that fit your skills, experience and pay. |
| Senior Admin | Writes a tailored CV and cover letter for each chosen role. |
| Admin | Keeps the role tracker (`jobs/tracker.md`) up to date. |

### One-off setup on your PC

1. Install Python 3, [pandoc](https://pandoc.org/installing.html) (for Word files) and [LibreOffice](https://www.libreoffice.org/download/) (for PDFs).
2. Put your CV in `shared/job-search/cv/` as `default-cv.docx` (or `.pdf` / `.md`).
3. Fill in `shared/job-search/preferences.md` and `shared/job-search/sources.md`.
4. Commit and push them (or ask Claude to).

### Keeping your PC up to date

- **Automatic pull every 15 minutes (Windows):** run this once in the `agent-office` folder:

  ```
  powershell -ExecutionPolicy Bypass -File shared\tools\install-sync.ps1
  ```

  It sets up a scheduled task called "agent-office git pull" that runs at log-on and every 15 minutes. It never overwrites your local changes: if they clash, it does nothing and writes why to `%LOCALAPPDATA%\agent-office-sync.log`. To remove it: `Unregister-ScheduledTask -TaskName "agent-office git pull" -Confirm:$false`.
- **Pull when Claude Code starts:** `.claude/settings.json` runs `git pull` whenever a Claude Code session starts or resumes in this folder, on your PC or in the cloud.
- **After a merge:** if Claude merges a pull request, or you tell it one was merged, it switches to `main` and pulls (see CLAUDE.md).

The automatic pull only updates the branch your PC is on, so keep your PC on `main`.

### Each day

Open Claude Code in this folder and type:

- `/cos start the day`: finds new roles, ranks them and asks which to go for.
- Reply with the roles you want: CVs and cover letters are drafted as Word files in `jobs/roles/<role>/`.
- `/cos approve <role>`: makes the PDFs once you're happy with the Word files. Or describe the changes you want.
- `/cos I applied to <role>` (or interview, rejected, offer): records the outcome.
- `/cos how's it going?`: a quick summary.

The agents never apply, email or fill in forms for you. Using Sonnet for the session (`/model sonnet`) keeps token use down.
