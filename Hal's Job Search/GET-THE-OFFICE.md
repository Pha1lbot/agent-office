# Get the office onto your PC

A step-by-step guide for Hal. It takes you from a PC with nothing installed to a working job-search office on your desktop. You don't need to know anything about Git or code: copy the commands exactly as written.

Allow about 30 minutes for the installs (steps 1 to 6), then about 20 minutes to tell the team what you are looking for and give it your CV (step 7).

**The whole journey in one list**

1. Tim Everard gives you access (the box below).
2. Install Git, download the office, run the setup script (steps 1 to 4).
3. Install Claude Code (step 5).
4. Open the office on your desktop (step 6).
5. Type **`/office setup`** in Claude Code: it asks what you're looking for and writes your search files and CV (step 7).
6. Type **`/tim start the day`**: your team runs the first search.

**What "main" means.** The office lives on GitHub in a shared place called a *repository* ("repo"). The repo has one up-to-date, approved version of everything, called **main**. Getting "main" onto your PC means downloading that version once (the *clone*), then letting your PC pick up Tim Everard's updates (a *pull*). Your PC only ever receives. **You never send anything back to GitHub:** Tim Everard looks after all changes to the repo.

---

## Before you start

**You need**

- A Windows PC with an internet connection.
- A Claude account that includes Claude Code (it needs a paid Claude plan).
- A free GitHub account (make one at https://github.com if you don't have one).

**Tim Everard does this first**

1. You send him your GitHub username.
2. He adds you to the private repo `Pha1lbot/agent-office` on GitHub: *Settings, Collaborators, Add people*, with **Read** access. (Read access means you can download the repo but can't change it. That is deliberate.)
3. GitHub emails you an invitation. **Open it and click Accept** while signed in to your GitHub account. If you skip this, step 3 below fails with "repository not found".

---

## Step 1: open PowerShell

Press the Windows key, type `PowerShell`, press Enter. A blue or black window opens. You'll type (or paste) commands into it one at a time and press Enter after each.

## Step 2: install Git

```
winget install --id Git.Git -e
```

If Windows asks for permission, say yes. When it finishes, **close PowerShell and open it again** (the new program isn't found until you do).

> If it says `winget` isn't recognised, download Git from https://git-scm.com/download/win, run the installer and accept the defaults, then reopen PowerShell.

## Step 3: download "main" (the clone)

```
cd $HOME\Documents
git clone https://github.com/Pha1lbot/agent-office.git
cd agent-office
```

A **GitHub sign-in window** opens the first time. Sign in with your GitHub account. (If you get "repository not found", you haven't accepted the invitation yet: go back to the box above.)

You now have a folder, `Documents\agent-office`. Inside it, **`Hal's Job Search`** is your office. The other folder in there is someone else's: leave it alone.

Check you're on main:

```
git status -sb
```

The first line should say `## main...origin/main`.

## Step 4: run the setup script

Still in PowerShell, in the `agent-office` folder:

```
powershell -ExecutionPolicy Bypass -File shared\tools\setup-pc.ps1
```

It does the rest for you:

- installs what's missing: Node.js, Python, pandoc and LibreOffice (these run the office and make your Word and PDF files)
- asks for **your name and email** (type them in; they're only used by Git on your PC)
- installs the office's packages
- switches on an **automatic update when you log on** (and each time you open the office), so new versions from Tim Everard arrive on their own

It's safe to run again if anything fails. If it says something "was not found yet", close PowerShell, open it again, go back to the `agent-office` folder (`cd $HOME\Documents\agent-office`) and run the script again.

## Step 5: install Claude Code

Follow https://code.claude.com/docs/en/setup. Then in PowerShell type:

```
claude
```

and sign in when it asks. Type `/exit` to leave it for now.

## Step 6: open the office on your desktop

1. In File Explorer, go to `Documents\agent-office\Hal's Job Search\shared\office-view`.
2. Double-click **Open Office.cmd**. A black window opens (leave it open) and your browser shows your office at http://127.0.0.1:4747. Close the black window to close the office.
3. To put it on your desktop: right-click **Open Office.cmd**, choose *Show more options* (Windows 11), *Send to*, then *Desktop (create shortcut)*.

> If Windows says **"Smart App Control blocked"** the file, open the office from PowerShell instead:
> ```
> cd "$HOME\Documents\agent-office\Hal's Job Search\shared\office-view"
> npm install
> npm start
> ```
> then browse to http://127.0.0.1:4747. (After the first time, `npm install` isn't needed.) Keep the double quotes: the apostrophe in the folder name needs them.

The office will be empty at first. That's normal: it fills up once you've set up your search.

## Step 7: tell the team what you're looking for (`/office setup`)

In PowerShell:

```
cd "$HOME\Documents\agent-office\Hal's Job Search"
claude
```

Then, in Claude Code, type:

```
/office setup
```

Claude interviews you, one small group of questions at a time, and writes your answers into the files the team reads:

| Part | What it asks | What it writes |
|---|---|---|
| **1. The work** | The kinds of job you want, in your own words; the job titles to look for; what you never want to see | `shared/job-search/search.json` (what Scout and Rita search for), `preferences.md` |
| **2. Pay and where** | Minimum and ideal pay; remote, hybrid or office; days in the office; your town and the longest commute; the nearby towns and postcodes that count | `search.json`, `settings.json`, `preferences.md` |
| **3. Avoid and watch** | Deal-breakers, employers to avoid, companies you'd love to work for, how old an advert may be | `search.json`, `preferences.md` |
| **4. Job sites** | Which job sites to use; any others you use | `search.json`, `sources.md` (including the job alerts to create on LinkedIn and Indeed) |
| **5. Your CV** | Paste your CV (or give a file); you check the result | `shared/job-search/cv/cv-bank.md`, `cv/base-cv.json`, plus a test PDF |

Before it writes anything, it shows you a short summary and asks "Is that right?". **Read what it writes**: nobody else can check your CV is true.

It takes about 20 minutes. You can stop and come back: type `/office` to see what's done and what's left. `/office setup search` redoes only the search; `/office setup cv` only the CV.

When it finishes, type:

```
/tim start the day
```

Your Chief of Staff is called **Tim** (a member of your team, not Tim Everard). He runs the first search and writes `jobs/today.md`. Then look at the office: it fills up with leads.

> Tip: type `/model sonnet` at the start of a session. It does the job well at lower cost.

---

## Getting updates later

You normally do nothing:

- **Automatically:** when you log on, and each time you open the office, your PC checks GitHub and downloads any new version of main.
- **When you open the office:** `Open Office.cmd` also checks.
- **How to tell you're up to date:** the label at the top left of the office ("Build …") has a dot. **Green** means up to date. Amber means an update is waiting on GitHub and hasn't arrived yet.

To fetch an update by hand, in PowerShell:

```
cd $HOME\Documents\agent-office
git pull
```

Then close and reopen the office so it uses the new version.

Your own files (CV, preferences, roles, tracker) are not touched by updates. They live only on this PC, so **copy the `jobs` and `shared\job-search` folders inside `Hal's Job Search` to a USB stick or cloud drive now and then** as your backup.

## The rules for your PC

- **Don't commit, push, branch, merge or reset anything.** Your PC only pulls. Tim Everard does all the changes to the repo.
- **Stay on main.** If `git status -sb` ever shows a different branch name, don't try to fix it: send what it says to Tim Everard.
- **Keep to your own folder**, `Hal's Job Search`.
- **Never put passwords or keys in the repo folder.**

## If something goes wrong

| Problem | What to do |
|---|---|
| "repository not found" or a sign-in loop when cloning | You haven't accepted the GitHub invitation, or you signed in with a different GitHub account. Check your email for the invitation and accept it, then try the clone again. Ask Tim Everard to confirm which username he invited. |
| `winget` or `git` isn't recognised | Close PowerShell and open a new one. If it still isn't found, install Git from https://git-scm.com/download/win. |
| The setup script says "running scripts is disabled" | Use the exact command in step 4 (it includes `-ExecutionPolicy Bypass`). |
| `node` or `npm` "not found" after setup | Close PowerShell, open it again, and run the setup script again. |
| The office won't open, or looks old | In `agent-office`, run `git status -sb` and `git pull`, then close the black window and open `Open Office.cmd` again. Make sure your shortcut points into `Hal's Job Search`, not an old copy. |
| `git pull` says your local changes would be overwritten, or anything about conflicts | Stop. Don't try to fix it. Send the message to Tim Everard. |
| The automatic update seems stuck | Read the log: `Get-Content $env:LOCALAPPDATA\agent-office-sync.log -Tail 5`. If it says it needs you to sign in, run `git fetch` once in `agent-office` and sign in. Otherwise send the lines to Tim Everard. |
| Tim says a file is "still a blank template", or the search finds nothing | Type `/office` to see what's missing, then `/office setup` (or `/office setup search` / `/office setup cv`). |
| `/office` isn't recognised | You aren't in your office folder. Close Claude Code, `cd "$HOME\Documents\agent-office\Hal's Job Search"` and run `claude` again; if it still isn't there, run `git pull` and tell Tim Everard. |
| Anything else | Open Claude Code in your office folder and describe the problem. It can help with the office itself, but it won't change git for you. |
