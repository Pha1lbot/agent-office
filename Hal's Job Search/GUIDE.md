# Hal's Job Search: how to use it

A plain-English guide to your job-search office. You don't need to be technical. If you can edit a text document and type a short command, you can run and change everything here.

**On this page**

1. [What this is](#1-what-this-is)
2. [Where everything lives](#2-where-everything-lives)
3. [Setting up (first time only)](#3-setting-up-first-time-only)
4. [Every day](#4-every-day)
5. [The office (the dashboard)](#5-the-office-the-dashboard)
6. [Changing your search](#6-changing-your-search) (pay, job titles, location, sites, daily limits)
7. [Your CV](#7-your-cv)
8. [Changing the templates](#8-changing-the-templates) (CV design, cover letters, writing rules, interview prep)
9. [Changing how the team works](#9-changing-how-the-team-works)
10. [Backups and sharing the repo](#10-backups-and-sharing-the-repo)
11. [If something goes wrong](#11-if-something-goes-wrong)
12. [Cheat sheet](#12-cheat-sheet)

---

## 1. What this is

Hal's Job Search is a small team of AI helpers that do the repetitive parts of looking for a job, so you can spend your time on the parts that need you: choosing roles, checking what is written about you, applying and interviewing.

You talk to one of them, Cass. Cass runs the rest.

| Who | Job | What they do for you |
|---|---|---|
| **Cass**, Chief of Staff | The one you talk to | Runs the team, decides what to do first each day, keeps the tracker up to date, learns what you like and suggests changes to your preferences. |
| **Rita**, Lead Recruiter | Finds roles | Searches the job sites you list, reads adverts, scores how well each fits you (1 to 5) and says whether it is worth applying for: Apply, Maybe or Skip. |
| **Wren**, Writer | Writes your applications | Writes a tailored CV and cover letter for each role you shortlist, using only true things from your CV. |
| **Cole**, Interview Coach | Prepares you | When you get an interview, writes prep notes (likely questions, gaps, questions to ask) and key talking points. |
| **Ada**, Admin | Paperwork (automatic) | Not an AI: a set of scripts. Updates the tracker, ranks new roles best first, fact-checks Wren's drafts against your CV, makes the PDFs and Word files, sets follow-up dates and backs everything up to GitHub. |

**Two rules the team always follows**

- **They never apply for anything, send email or fill in a form for you.** You do the applying.
- **They never invent anything about you.** Everything in a CV or letter has to come from your CV text bank (`shared/job-search/cv/cv-bank.md`). Ada checks, and flags anything that isn't there.

**How a role moves through the system** (you move it; the team does the work at each stage):

`Lead` → `Shortlisted` (Wren writes) → `Drafted` (you check) → `Approved` (Ada makes final PDFs) → `Applied` (follow-up date set) → `Interview` (Cole preps you) → `Offer`, or `Rejected` / `Dismissed`.

---

## 2. Where everything lives

Everything is in plain files in this folder. Here is the map, with the files **you are most likely to edit** marked ✏️.

```
Hal's Job Search/
├─ GUIDE.md                       ← this guide
├─ CLAUDE.md                      ← short instructions Claude reads when you open this folder
├─ shared/
│  ├─ job-search/                 ← ABOUT YOU: what you want, where to look, your CV
│  │  ├─ preferences.md           ✏️ roles, skills, pay, location, deal-breakers, daily limits
│  │  ├─ sources.md               ✏️ the job sites Rita searches
│  │  ├─ settings.json            ✏️ your ideal and minimum pay as numbers (used to rank roles)
│  │  ├─ cv-rules.md              ✏️ how Wren writes (tone, spelling, what to leave out)
│  │  └─ cv/
│  │     ├─ cv-bank.md            ✏️ your CV as plain text: everything true about you
│  │     ├─ base-cv.json          ✏️ your default CV in the format of the CV template
│  │     └─ extra-*.md            ✏️ optional: more detail Wren and Cole can use
│  ├─ tools/                      ← the scripts (Ada). The CV design is in cv_template.py
│  ├─ office-view/                ← the Agent Office: the dashboard and 3D office in your browser
│  └─ conventions/handoffs.md     ← how the team talks to each other
├─ agents/                        ← a short README for each team member (what they do)
├─ .claude/
│  ├─ agents/                     ✏️ the instructions each member follows: Rita, Wren, Cole
│  └─ skills/                     ✏️ Cass's instructions (cos/SKILL.md) and the /cass shortcut
└─ jobs/                          ← YOUR WORKING DATA (the team writes here)
   ├─ tracker.json / tracker.md   ← every role and where it stands (don't edit by hand)
   ├─ today.md                    ← Cass's priorities for the day
   ├─ preference-reviews.md       ← suggestions Cass has made about your preferences
   └─ roles/<role>/               ← one folder per role: listing, CV, cover letter, PDFs, prep
```

**The golden rule:** `shared/job-search/` is about *you* and is what you change when your search changes. `.claude/` is about *how the team behaves*. `jobs/` is *their output*: look at it, but let the office and the team change it.

The folder above this one (the whole `agent-office` repo) also holds another person's separate office. **Stay inside Hal's Job Search**: you never need to open the other one, and it isn't connected to yours.


---

## 3. Setting up (first time only)

Do this once. Allow about 30 minutes, most of it waiting for installs. You need a Windows PC, an internet connection and a Claude account that can use Claude Code.

### Step 1: get access to the repo

Tim adds you to the private GitHub repo (`github.com/Pha1lbot/agent-office`). Accept the invitation from the email GitHub sends, signed in with your own GitHub account (free to make at github.com).

### Step 2: install Git and download the repo

Open **PowerShell** (press the Windows key, type `PowerShell`, press Enter) and run these one at a time:

```
winget install --id Git.Git -e
```

Close PowerShell and open it again, then:

```
cd $HOME\Documents
git clone https://github.com/Pha1lbot/agent-office.git
cd agent-office
```

A GitHub sign-in window opens the first time; sign in. You now have a folder `Documents\agent-office`. Your office is the folder inside it called **Hal's Job Search**.

### Step 3: run the setup script

Still in PowerShell, in the `agent-office` folder:

```
powershell -ExecutionPolicy Bypass -File shared\tools\setup-pc.ps1
```

It installs what is missing (Node.js, Python, pandoc, LibreOffice), asks for your name and email for GitHub backups, installs the office's packages and switches on an automatic update from GitHub every 5 minutes. It is safe to run again.

### Step 4: install Claude Code

Follow https://code.claude.com/docs/en/setup, then type `claude` once in PowerShell and sign in.

### Step 5: fill in the starter files

Right now your office is a blank template. The team will refuse to start until the first four of these are filled in (Cass checks for the words "please fill this in" or "please replace" at the top of each, so delete that line when you're done):

| Order | File | What goes in it | Section of this guide |
|---|---|---|---|
| 1 | `shared/job-search/preferences.md` | The roles, pay and place you want | [6](#6-changing-your-search) |
| 2 | `shared/job-search/sources.md` | The job sites to search | [6](#6-changing-your-search) |
| 3 | `shared/job-search/cv/cv-bank.md` | Your CV as plain text | [7](#7-your-cv) |
| 4 | `shared/job-search/cv/base-cv.json` | Your CV in the CV template's format | [7](#7-your-cv) |
| 5 | `shared/job-search/settings.json` | Your pay numbers (not checked, but needed for ranking by pay) | [6](#6-changing-your-search) |

You can edit them in Notepad, but the easy way is to let Claude do it with you. Open PowerShell, then:

```
cd "$HOME\Documents\agent-office\Hal's Job Search"
claude
```

(Keep the double quotes: the apostrophe in the folder name needs them.) Then type something like:

> Help me fill in preferences.md. Interview me one section at a time, then write my answers into the file.

Do the same for sources.md. For the CV, see [section 7](#7-your-cv).

### Step 6: try it

In Claude Code, in your office folder, type:

```
/cass start the day
```

Cass will check your setup, run a search and write `jobs/today.md`. Then open the office: double-click `shared\office-view\Open Office.cmd`.

> **Tip:** type `/model sonnet` at the start of a session. It does the job well at a lower cost than the biggest model.

---

## 4. Every day

Open Claude Code in your office folder and type:

| You type | What happens |
|---|---|
| `/cass start the day` | Cass handles anything waiting, runs the search if it hasn't run today, and writes `jobs/today.md`: new leads best first, what was dismissed and why, and what is waiting for you. |
| `/cass daily search` | Only the search: Rita searches your sites and, if your email is connected, reads your job-alert emails; Cass sorts what comes back into **Leads** (worth a look) or **Dismissed** (with a reason). |
| Pick roles in the office (**To pipeline**) or tell Cass "go for the first two" | Wren writes a tailored CV and cover letter for each, as Word files, and Ada makes PDFs. |
| `/cass approve <role>` | You're happy with the drafts: Ada makes the final PDFs. Or describe changes ("make the cover letter shorter") and Wren redoes them. |
| `/cass I applied to <role>` | Recorded. A follow-up date is set a week ahead. Also: "I have an interview at <role> on Tuesday", "rejected by <role>", "offer from <role>". |
| `/cass how's it going?` | A short summary. |
| `/cass review my preferences` | Cass looks at which roles you picked and skipped and suggests changes to `preferences.md`. **Nothing changes until you say yes.** It also offers this after about 10 decisions. |

`/cass` and `/cos` do exactly the same thing. You can also just talk normally once Cass is running.

**When you skip a role, give a few words why** ("pay too low", "too far", "wrong sector"). That is what the preference reviews learn from.

You can do most of this by clicking in the office instead of typing (next section). Typing and clicking change the same data.

**Keep the cost down.** Each run uses your Claude allowance. The team is built to be frugal (scripts do all the mechanical work, one brief per team member per run, small files instead of big ones), but you can help: use `/model sonnet`, shortlist a few roles at a time rather than dozens, and don't ask for a fresh search if one ran this morning.

---

## 5. The office (the dashboard)

Double-click `shared\office-view\Open Office.cmd` in your office folder. A black window opens (leave it open while you work) and your browser shows **http://127.0.0.1:4747**. Close the black window to close the office. It only runs on your PC; nobody else can see it.

The top left shows your office's name and a **build** label with a dot. Green means this PC is up to date with GitHub.

| Tab | What it's for |
|---|---|
| **Overview** | Key numbers, your pipeline, what's **Waiting on you**, upcoming interviews, next actions. |
| **Roles** | Every role you've shortlisted or beyond, as a board (drag a card to the next stage) or a list. |
| **Leads** | Roles the team found that you haven't picked yet, best first, with a verdict (Apply / Maybe / Skip), a fit score and a reason. **To pipeline** shortlists one. **✕** dismisses it (you can restore it). Every move has an **Undo**. |
| **Interviews** | Upcoming interviews. Each opens Cole's prep and your talking points. |
| **Next actions** | A to-do list. Cass adds questions here when they've run on their own. |
| **CVs** | Your CV bank, your CV writing rules (editable here), every tailored CV and letter with View, PDF and Word buttons, and **Tailor a CV**. |
| **The office** | A 3D office where you watch the team work (and take coffee breaks). |

**Click any role** to open its page: Rita's summary of the advert, the CV and letter (with Download Word / PDF), Wren's notes on gaps, attachments, **Ask Wren for changes**, and your interview talking points. Downloads are named for the job, ready to attach (for example `Hal_Surname_Project_Manager_cv.pdf`).

**Add a role yourself** (the Leads tab, or **Add role**): paste the link, or paste the advert text if the page needs a login. Rita reads it, scores it and gives a verdict.

**Tailor a CV**: pick a role, paste the job description, say what to bring out ("lead with budget experience"), and Wren writes it.

**Changes you make in the office start the team automatically**, about 2 minutes after your last change (so several changes share one run). Set a role to *shortlisted* and Wren drafts; to *interview* and Cole preps; and so on. Edits are saved to GitHub about 15 seconds after you stop. There is an **Auto start** switch if you'd rather start the team yourself.

Full details of the office are in `shared/office-view/README.md`.

---

## 6. Changing your search

This is the heart of customising the system. Almost everything is **one plain-text file** you can edit, and the team follows the new version on its next run. No restarting, no code.

### The easy way: ask Claude

Open Claude Code in your office folder and say what you want, in your own words:

> My minimum pay is now £40,000 and my ideal is £55,000. Update everything that needs changing.

> I only want remote roles now. Update my preferences and add it as a deal-breaker if it's not remote.

> Add Reed and Totaljobs to my job sites and take Indeed off.

Claude knows which files to change. Look at the result with `git diff` or just open the file and read it. If you don't like it, say so and it will fix it.

### Or by hand: the files

#### 6.1 What you want: `shared/job-search/preferences.md`

Rita and Cass read this to choose and rank roles. Short bullets are fine. Each section does something specific:

| Section | What it controls | Example |
|---|---|---|
| **Roles I want** → Job titles | What Rita searches for and what counts as a match | `Project Manager, Programme Coordinator, Delivery Lead` |
| Sectors or industries | Which industries are a good fit | `healthcare, public sector, charities` |
| Seniority | Roles that are too junior or senior are marked down | `senior or lead, managing a small team` |
| **Skills to match on** | How Rita judges fit against each advert | `stakeholder management, budgets, Agile, Jira` |
| **Pay** → Minimum / Ideal | Roles clearly below the minimum are dismissed or marked Skip; roles at or above the ideal rank higher | `Minimum £40,000. Ideal £55,000+` (or a day rate) |
| **Location and hours** | Where, and how: remote / hybrid / office, days in the office, commute, full or part time, contract | `Leeds or remote. 2 days in the office at most. 45 minutes commute at most. Full time, permanent.` |
| **Deal-breakers** | Automatic Skip. Be specific. | `Fully office-based outside Leeds`; `Zero-hours contracts`; `Pay below £40,000` |
| **Daily limits** | How many new roles Rita finds per day, and how many Cass suggests shortlisting | `New roles to find per day: 10` |

Tips for good preferences:

- **Deal-breakers are hard rules; everything else is a preference.** If you put "needs to be remote" under Location, a hybrid role may still be suggested as a Maybe. If you put "fully office-based roles" under Deal-breakers, they'll be skipped.
- **Be concrete.** "Good salary" can't be acted on. "£45,000 minimum" can.
- **Mark guesses.** If you aren't sure, add *(assumed)* after it and Cass will check with you in a preference review.
- **Change it whenever your search changes.** A new city, a career switch, a lower pay floor after a few quiet weeks: edit the file and carry on.

#### 6.2 Pay numbers: `shared/job-search/settings.json`

Pay is written in `preferences.md` in words (so the team understands it) **and** as plain numbers in `settings.json` (so the ranking script can use it). Keep both in step.

```json
{
  "ideal_pay": 55000,
  "minimum_pay": 40000
}
```

Yearly amounts, in pounds, no commas or £ sign. New roles are ranked best first by Cass's verdict, then fit score, then pay: roles at or above `ideal_pay` first, then roles at or above `minimum_pay`, then the rest. Use `null` instead of a number to switch a figure off. Day rates and "competitive" pay are not ranked by pay (they're treated as unknown).

#### 6.3 Where to look: `shared/job-search/sources.md`

A table of the sites Rita searches, **in order**. She searches only these.

```
| Site | Link or search URL | Notes |
|---|---|---|
| Indeed UK | https://uk.indeed.com | Search "project manager" near Leeds, last 7 days. |
| Reed | https://www.reed.co.uk | Use the saved-search link below. |
| Company careers pages | e.g. the NHS, Leeds City Council, big local employers | Check each careers page for project and programme roles. |
```

- **Add a site:** add a row. **Remove one:** delete the row. **Prioritise:** the order is the search order, so put your best sources first.
- **Use the Notes column** to tell Rita how to search: the exact titles, filters, "last 7 days", "remote only". A saved-search URL from the site (the address after you've set your filters) is the most reliable.
- Some sites need a login or block automated visits (LinkedIn often does). Rita will say so rather than guess. Pasting an advert into the office (**Add role**) always works.

#### 6.4 Job-alert emails (optional)

If you connect your email to Claude, Cass can also read the job-alert emails that job sites send you (read-only: nothing is sent, deleted or moved) and add those roles as leads. To get more leads this way, set up email alerts on the job sites you use. If your email isn't connected, this step is skipped and the web search still runs. Ask Claude "how do I connect my email for job alerts?" if you want it.

#### 6.5 Switching to a different kind of job

For a bigger change (a new field, not just a new city), do these three together:

1. Rewrite **Roles I want**, **Skills to match on** and **Deal-breakers** in `preferences.md`.
2. Update the **Summary for matching** at the top of `cv/cv-bank.md`, because that is the only part of your CV Rita reads when scoring fit.
3. Replace the sites in `sources.md` with ones for the new field.

Roles already in the tracker stay as they are. Dismiss or skip the old ones in the office.

#### 6.6 Let Cass suggest changes

After you've picked and skipped some roles, type `/cass review my preferences`. Cass looks for patterns ("you skipped 6 of 7 roles below £35k") and proposes up to five changes, each with its evidence. You accept all, some or none. Accepted changes go into `preferences.md` and the review is logged in `jobs/preference-reviews.md`. It works best when you give a few words of reason each time you skip a role.

#### 6.7 Currency and place

The system is set up for the UK: pay in pounds, UK English, UK time (daily limits and "today" reset at UK midnight), UK job sites. It reads pay such as `£45,000`, `£45k–£55k` and `45k`, and also shows `€` and `$` amounts correctly. If you search somewhere else, change the sites and wording in `sources.md` and `preferences.md`; for deeper changes (time zone, spelling) ask Claude to make them in your copy.

---

## 7. Your CV

The system keeps your CV in **two** files, and keeps them in step:

| File | What it is | Who reads it |
|---|---|---|
| `shared/job-search/cv/cv-bank.md` | Your CV as plain text, as detailed as you like. **The only source of facts.** Starts with a short "Summary for matching". | Rita (summary only), Wren, Cole, and Ada's fact check |
| `shared/job-search/cv/base-cv.json` | Your default CV laid out for the CV template: name, contact details, profile, key figures, skills, certifications and jobs. | The template; Wren starts every tailored CV from it |

The agents never read a PDF or Word copy of your CV (a PDF is read as page images, which is far more costly). That's why these two files exist.

### Setting up your CV

Both files start as placeholders. Replace them with your own details:

1. Open Claude Code in your office folder.
2. Paste your current CV text and say:

   > This is my CV. Fill in `shared/job-search/cv/cv-bank.md` and `shared/job-search/cv/base-cv.json` from it. Don't invent or exaggerate anything. Keep the same headings as the placeholders.

3. **Read both files carefully.** You are the only person who can check they are true. Fix anything that is wrong or missing. Add detail to `cv-bank.md` freely: it can be longer than your CV, because Wren picks what is relevant for each job.
4. Check the layout. In your office folder:

   ```
   python3 shared/tools/cv_template.py shared/job-search/cv/base-cv.json my-cv.pdf
   ```

   (On Windows, if `python3` isn't recognised, use `py` instead.) Open `my-cv.pdf`. It should be two A4 pages. If it spills onto a third, shorten the profile or some bullets.

### What goes where in `base-cv.json`

| Key | What | Notes |
|---|---|---|
| `name` | Your name | Also used in file names: "Hal Smith" gives `Hal_Smith_<Job_Title>_cv.pdf` |
| `headline` | The line under your name | Wren rewrites this for each role |
| `contact` | `location`, `phone`, `email`, `linkedin` | Always taken from here, so they're always right |
| `profile` | One paragraph (about 110 to 130 words) | Wren rewrites it for each role |
| `stats` | Up to five key figures: a `value` and a short `label` | e.g. `"10+"` / `"years' experience"` |
| `skills` | Groups for the sidebar: a `title` and `text` | About seven works well |
| `certifications` | `name` and `year` | Leave the list empty `[]` if you have none |
| `jobs` | Each job: `title`, `company`, `dates`, `bullets` (and optional `detail`) | Newest first. Page 1 holds the first job, page 2 the rest (`page1_jobs`) |
| `references` | `true` (the default) prints "References available on request." | Set to `false` to leave it out |

### Keeping it up to date

When your CV changes (new job, new certification), update **both** files, or ask Claude: "I've started a new job as X at Y. Update my CV bank and base CV."

### More material for Wren and Cole

Put extra detail in `shared/job-search/cv/extra-<anything>.md` (for example `extra-projects.md` with project write-ups). They read these too, and the fact check counts them as true. Don't put anything in that you wouldn't want on GitHub.

---

## 8. Changing the templates

"Templates" here means the things the team produces: the CV design, the cover letter, the way CVs are written, the role summaries, the interview prep and the daily priority list. Each one is controlled by one file.

> **Before you change anything:** make one change at a time, then test it on a single role (Section 8.7). If it goes wrong, you can always undo: `git checkout -- <file>` puts a file back to the last saved version, or ask Claude to "undo my last change to <file>".

| To change… | Edit | How |
|---|---|---|
| How CVs and letters are *written* (tone, spelling, what's left out) | `shared/job-search/cv-rules.md` | One rule per line, in plain English. Section 8.1. |
| How the CV *looks* (colours, fonts, spacing, layout) | `shared/tools/cv_template.py` | Section 8.2. Easiest: ask Claude. |
| The cover letter's structure and length | `.claude/agents/writer.md` | Section 8.3. |
| The fonts and styles of the *Word* copies | `shared/job-search/cv/default-cv.docx` | Section 8.4. |
| The role summary Rita writes for each advert | `.claude/agents/lead-recruiter.md` | Section 8.5. |
| The interview prep notes and talking points | `.claude/agents/interview-coach.md` | Section 8.6. |
| The daily priority list (Cass's `today.md`) | `.claude/skills/cos/SKILL.md` | Section 8.6. |

### 8.1 Writing rules: `cv-rules.md`

Wren reads this before every CV and letter, and **your rules override her normal instructions**. Each bullet is a rule. Examples of rules you can add:

- `Always lead with my management experience.`
- `Use American English.` (and delete the British English line)
- `Never mention my previous employer by name in the cover letter.`
- `Keep the tone warm and direct, not formal.`
- `Include an education section.` (and delete the "No education section" line)
- `Don't use the words "passionate" or "dynamic".`

Change a rule, then run a draft (8.7) to see the effect.

### 8.2 CV design: `shared/tools/cv_template.py`

The template draws two A4 pages: a header with your name, a profile and key figures, your jobs, and a grey sidebar with skills and certifications. The look is controlled by a block of styles (CSS) near the top of the file. You can ask Claude, in plain words:

> Change the CV accent colour from blue to dark green.
> Make the CV font slightly larger, but keep it to two pages.
> Put certifications above skills in the sidebar.

If you'd rather do it by hand, the accent blue is the colour code `#2b5fd9`, used for the headline, section labels, the line above each key figure and the bullet markers. Find and replace it with any hex colour (for example `#1f7a4d` for green). Text sizes are in `pt` units in the same block. The font, Inter, is bundled in `shared/tools/cv-fonts/` so the PDF looks the same on every PC.

Test with the command in [section 7](#setting-up-your-cv). Because the PDF is always two pages, a bigger font means shorter text.

### 8.3 Cover letters: `.claude/agents/writer.md`

Step 2 of Wren's instructions describes the letter: under one page, three or four short paragraphs (why this role, two or three matching achievements, a close), UK English, addressed to the named contact or "Dear Hiring Manager". Change those sentences to change every future letter. Examples:

- "Write two short paragraphs, not four."
- "Open with a one-line hook about the company, then the achievements."
- "End with 'Kind regards,'."

The letter's *header, date and subject line* come from the template (`cv_template.py`), not from Wren, so they always match your CV.

### 8.4 Word copies

Every draft also gets editable Word copies (`cv.docx`, `cover-letter.docx`). To control their fonts and styles, put a Word document called `default-cv.docx` in `shared/job-search/cv/`. Its styles are used for new Word copies. If you edit a Word file by hand, Ada never overwrites it, and its PDF is built from your edited version.

### 8.5 Role summaries: `.claude/agents/lead-recruiter.md`

Rita's summary of each advert (`listing.md`) follows a layout in her instructions: link, source, location, pay, closing date, fit score with a reason, what they want, keywords, gaps and a verdict. You can add or remove headings (for example "Culture signals" or "Visa sponsorship?"). The same file defines how she scores:

- **Fit 1 to 5** (5 is a near-perfect match)
- **Apply** = fit 4 to 5, pay at or above your minimum, no deal-breaker
- **Maybe** = a real fit with one clear doubt
- **Skip** = a deal-breaker, pay clearly below the minimum, or fit 1 to 2

Change those definitions to make Rita stricter or more generous.

### 8.6 Interview prep and the daily list

- `.claude/agents/interview-coach.md` describes Cole's two files: key talking points (5 to 7) and prep notes (the company, 8 to 10 likely questions, gaps, 4 or 5 questions to ask, practical details). Change the numbers or headings. Your own edits to the talking points are never overwritten.
- `.claude/skills/cos/SKILL.md` is Cass's full set of instructions, including what goes in `jobs/today.md`. It is long: change only the part you need, and ask Claude to help find it.

### 8.7 Test a change on one role

1. In the office, add a real role (or use one you already have), or tell Cass: "Draft a CV and cover letter for <role> as a test."
2. Open the role's page, and look at the CV, letter and PDF.
3. Not right? Adjust the file, then click **Ask Wren for changes** or run the draft again.
4. Happy? Carry on. Not happy? Undo the file change (see the note above).

---

## 9. Changing how the team works

The team members are just instruction files. If you can describe the behaviour you want in a sentence, you can usually change it.

| Who | Instructions | Easy things to change |
|---|---|---|
| Rita | `.claude/agents/lead-recruiter.md` | What counts as a Strong match; "ignore recruitment agency adverts"; how many adverts she reads in full. |
| Wren | `.claude/agents/writer.md` | Bullets per job; length of the profile; how she picks keywords; the letter's shape. |
| Cole | `.claude/agents/interview-coach.md` | Number of questions; whether to include salary-negotiation tips. |
| Cass | `.claude/skills/cos/SKILL.md` | What goes in the daily list; how many roles to suggest; what to dismiss. |
| Everyone | `shared/conventions/handoffs.md` | The short format they reply to Cass in. Leave this alone unless you know why. |

Guidelines:

- **Write instructions as you would brief a person**: short, specific, one idea per line.
- **Don't remove the safety rules** (the "Rules" and "Never" sections): they stop the team applying for things, emailing people, inventing facts or rewriting your history.
- **The names** (Rita, Wren, Cole, Ada) appear in the instructions and the office. To rename one, ask Claude to rename them everywhere in your office, and test it.
- **Adding a new team member** (say, a Networking Coach) is a bigger job. Ask Claude to set it up, and it will add instructions, a README in `agents/`, and a desk in the office. Because it changes how the shared repo is set up, check with Tim first.

---

## 10. Backups and sharing the repo

**Your work is saved on GitHub.** The office saves your edits for you (look for "Saved to GitHub" in the strip at the top of the office). Changes the team makes in Claude Code are saved when Cass finishes, or when you ask Claude to "commit and push". Anything not on GitHub is not backed up.

**Each PC stays up to date automatically.** The setup script adds a background task that pulls from GitHub every 5 minutes, so work done on another PC (or in the cloud) turns up on its own.

**Sharing the repo with another person.** The repo holds two separate offices. Each person's CV, preferences and roles live only in their own folder, and the team in one office never reads the other's. But GitHub gives everyone with access the **whole** repo, so you can *technically* read each other's files. Don't put anything in the repo you wouldn't want the other person to read. Never put passwords, API keys or tokens in it, ever.

**Staying out of each other's way.** Only change files inside your own office folder. Both offices save to the same GitHub branch (`main`), and because you are in different folders the saves merge cleanly. If the office ever says "GitHub has changes that clash", don't worry: nothing is lost. Open Claude Code in your folder and say "sort out the git clash".

**Bigger experiments.** If you want to try something risky (a big rewrite of the instructions, say), ask Claude to do it on a separate branch and open a pull request, so you can look before it goes live.

---

## 11. If something goes wrong

| Problem | Try this |
|---|---|
| The office looks old, or the build dot isn't green | In PowerShell in the `agent-office` folder: `git status -sb`. The first line should say `main...origin/main`. If it names another branch, run `git checkout main`. Then `git pull`, close the black office window and open `Open Office.cmd` again from your office folder. |
| "Smart App Control blocked Open Office.cmd" | Open it from PowerShell instead: `cd "<your office folder>\shared\office-view"`, then `npm install` (first time only), then `npm start`, and browse to http://127.0.0.1:4747. |
| The automatic update stopped | Read the last lines of the log: `Get-Content $env:LOCALAPPDATA\agent-office-sync.log -Tail 5`. Git needs you to sign in once: in `agent-office`, run `git fetch` and sign in when asked. |
| Cass says a file is still a blank template | Open the file it names and fill it in (section 3 or 7). The line "please fill this in" must be removed. |
| Wren's CV runs to three pages | Ask Wren for changes: "shorten the profile and the older jobs so it fits two pages". Or shorten `base-cv.json`. |
| A CV or letter has a fact-check warning | Ada found something that isn't in your CV bank. If it's true, add it to `cv-bank.md` or an `extra-*.md` file and redraft. If it's wrong, ask Wren to remove it. |
| "Ada won't overwrite a Word file you edited" | That's protection. Say so when you want the drafts redone ("redo the drafts, ignoring my edits"). |
| The search returns nothing, or Rita says a site is blocked | Some sites block automated visits. Add other sites in `sources.md`, or paste adverts into the office with **Add role**. |
| The PDF won't build | PDFs need Chrome, Chromium or Microsoft Edge (Edge is built into Windows). The setup script checks the rest. Run it again: `powershell -ExecutionPolicy Bypass -File shared\tools\setup-pc.ps1`. |
| The office won't start | Make sure Node.js is installed (`node --version`). Run the setup script again. |
| You changed something and want it back | `git checkout -- <file>` restores one file to the last saved version. Or ask Claude: "put <file> back how it was". |
| Anything else | Open Claude Code in your office folder and describe the problem in your own words. Paste any error message. |

---

## 12. Cheat sheet

**Start:** open PowerShell → `cd` to your office folder (in double quotes) → `claude` → `/cass start the day`.

**Which file for which change**

| I want to change… | File |
|---|---|
| Job titles, sectors, location, deal-breakers, daily limits | `shared/job-search/preferences.md` |
| My pay floor and target | `preferences.md` **and** `shared/job-search/settings.json` |
| Which sites are searched | `shared/job-search/sources.md` |
| My CV | `shared/job-search/cv/cv-bank.md` **and** `cv/base-cv.json` |
| How CVs and letters are written | `shared/job-search/cv-rules.md` |
| How the CV looks | `shared/tools/cv_template.py` |
| Cover letter shape | `.claude/agents/writer.md` |
| What Rita's summaries and scoring look like | `.claude/agents/lead-recruiter.md` |
| Interview prep | `.claude/agents/interview-coach.md` |
| What Cass does each day | `.claude/skills/cos/SKILL.md` |

**Commands:** `/cass start the day` · `/cass daily search` · `/cass approve <role>` · `/cass I applied to <role>` · `/cass how's it going?` · `/cass review my preferences`

**Open the office:** double-click `shared\office-view\Open Office.cmd` → http://127.0.0.1:4747

**Rule of thumb:** if you're not sure how to change something, ask Claude in plain English and read the result before you accept it.
