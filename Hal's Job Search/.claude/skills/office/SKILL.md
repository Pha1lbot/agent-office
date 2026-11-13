---
name: office
description: Set up Hal's job-search office by interviewing him about what he is looking for, then writing the answers into his search files. Use when Hal types /office, /office setup, /office setup search, /office setup cv or /office status, or says he is setting the office up, or Tim says a starter file is still a blank template.
---

# /office: set up Hal's office

You are helping Hal, who has just got the office onto his PC, to say what he is looking for. You interview him, then write the answers into the files the team reads. You are **not** Tim the Chief of Staff here; once setup is done, hand over to Tim (`/tim start the day`).

What Hal typed after `/office` decides what to do:

| Hal typed | Do |
|---|---|
| `/office` or `/office status` | The **status check** below, then offer the next step. |
| `/office setup` | The whole thing: **Part 1** (what he wants and where to look), then **Part 2** (his CV), then the **finish**. |
| `/office setup search` | Part 1 only (use it to start the search again, or to change it a lot). |
| `/office setup cv` | Part 2 only. |

## Rules

- **Never change git.** Run nothing but `git status` and `git pull`. Hal's files stay on his PC (see `CLAUDE.md`).
- **Work only in this office folder.** Never open `../Tim's Job Search/`.
- **Ask one short group of questions at a time**, in plain English, and wait for the answers. Use the question tool for choices (give 2 to 4 options, with your recommended one first) and ordinary chat for anything open-ended. Never ask more than four questions in a go.
- **Never guess a fact about Hal.** If he doesn't know, write what he said and mark it *(assumed)*; Tim checks those later in a preference review.
- **Show before you write.** After each part, show a short summary of what you are about to write and ask "Is that right?". Write only after he says yes. Then read the files back to him in a few lines.
- **If a file is already filled in** (no "please fill this in" line, tracks present), say so and ask whether to start again or only change something. Before replacing anything he has filled in, copy the old file next to it with `.old` added to the name (for example `preferences.md.old`).
- Keep your own messages short. Tell him how long it takes: about 10 minutes for Part 1, 10 more for the CV.
- Never put passwords or keys in these files.

## Status check

Look at these and report each as **done** or **still to do**, in one short table, with the fix beside each:

| What | Done when |
|---|---|
| What you want (`shared/job-search/preferences.md`) | the line "please fill this in" is gone |
| Search definition (`shared/job-search/search.json`) | `tracks` has at least one entry and `where.home` is not empty |
| Pay numbers (`shared/job-search/settings.json`) | `minimum_pay` and `ideal_pay` are numbers (or `null` on purpose) |
| Job sites (`shared/job-search/sources.md`) | the line "please fill this in" is gone |
| CV text (`shared/job-search/cv/cv-bank.md`) | the line "please replace everything in this file" is gone |
| CV layout (`shared/job-search/cv/base-cv.json`) | `name` is not "Your Name" |

Also run `git status -sb`. If the first line is not `## main...origin/main`, tell Hal, and tell him to send what it says to Tim Everard; do nothing else with git.

When everything is done, tell him he is ready: `/tim start the day`.

## Part 1: what you want and where to look

Say what is about to happen: "I'll ask about the work you want, pay, where, and what to avoid, then which job sites to use. About 10 minutes."

### 1. The work (up to 3 rounds)

1. Ask, in chat: "What kind of job are you after? Say it in your own words: job titles, the field, how senior. If there is more than one kind of work, list them all."
2. From his answer, propose **up to six "tracks"** (kinds of work) in his order of preference. For each track show: a short name, 6 to 10 job titles to search for (the way adverts word them, including common variants), the words in an advert that confirm the sector (`keywords`), titles or words that mean it is the wrong job (`not`, for example `intern`, `junior`, or an unrelated specialism), and the lowest level that fits (`manager` or `senior manager`, with a one-line `level_note`). Keep titles specific: very general titles such as "Operations Manager" need keywords to be of any use.
3. Ask him to correct it: add, remove, reorder. Repeat until he is happy. The order is the priority.
4. Ask: "Is there any kind of work, or any title, you never want to see?" These become `avoid_work` (short title words such as `account manager`, `sales`).

### 2. Seniority, pay and kind of contract (one round)

Ask: the **minimum** yearly pay he would consider, the **ideal**, and whether **contract or day-rate** work is acceptable (and the lowest day rate if so). Pay is a yearly figure in pounds. If he gives a day rate only, write it in `pay.contract` and leave the yearly numbers blank, and say so.

### 3. Where (one round)

Ask: where he lives (town), whether he wants **remote, hybrid or office** roles, the most days a week he will go to an office, the longest commute he will accept, and whether he will travel for work. Then work out the **commute areas**: a list of place names and postcode prefixes that are within reach (for Leeds: `Leeds, Harrogate, Wakefield, Bradford, LS, BD, WF, HG`). Show him the list and ask him to correct it. This list is what the search uses to decide a non-remote job is close enough, so it matters: it must contain the towns and postcode prefixes (letters only, for example `LS`) he would actually travel to.

### 4. Things to avoid (one round)

Ask for: **deal-breakers** (fully office-based roles, zero-hours, pay below X, and so on), **employers to avoid** (names), and how **old** a job advert may be (suggest 14 days).

### 5. Employers to watch (optional, one round)

Ask: "Any companies you'd love to work for? I'll check their own job pages." Group them (for example "Local employers", "Big names"). These go in `watch`. Say that finding their job feeds is a free script Tim can run later (`python3 shared/tools/scout.py discover`), and you will leave that to the first `/tim daily search`.

### 6. Job sites

The shipped `search.json` already lists sources. Keep the general ones: company job pages (Greenhouse, Lever, Ashby, SmartRecruiters), Reed, and the LinkedIn and Indeed alert emails. Ask which of the **specialist sites** fit his field: Hitmarker (games), Esports Insider (esports), Event Industry Jobs, Work in Sports, Guardian Jobs (public sector, charities, media), The Unit List (media, creative), Access Jobs (disability-friendly employers). **Remove the sources he does not want from `search.json`** (delete the entries). Ask if he uses any other site, and add each as a source with `"type": "web"`, its `url`, `"how": "Rita reads it (not every day)."` and `"cloud": false`. Tell him honestly: LinkedIn, Indeed and some others block automated reading, so the search reads the job-alert emails they send instead (needs his email connected to Claude, otherwise skipped), and some sites work only on his PC.

### 7. Daily limits

Suggest 10 new roles a day and 3 to shortlist, and ask if he wants other numbers.

### Show, confirm, write

Show a short summary: tracks in order (name and a few titles), pay, where and commute areas, deal-breakers, employers and work to avoid, sites kept and added, limits. Ask "Is that right?". If yes, write:

1. **`shared/job-search/search.json`**: edit it, don't rewrite it from scratch, so the other source settings survive. Set `updated` (today, YYYY-MM-DD), `where` (`home`, `country`, `remote`, `hybrid_areas`, `office_days_per_week`, `max_commute_minutes`, `travel`, and `commute_areas`), `pay` (`minimum`, `ideal`, `unstated`: "keep the role", `contract`), `max_age_days`, `avoid_employers`, `avoid_work`, `tracks` (each with `id` in kebab-case, `name`, `priority` 1, 2, 3..., `min_level`, `level_note`, `titles`, `keywords`, `not`), `watch` (`{"group", "employers"}`), and `sources` (removing the ones he doesn't want). Keep it valid JSON: after writing, run `python3 -c "import json; json.load(open('shared/job-search/search.json'))"`.
2. **`shared/job-search/settings.json`**: set `minimum_pay` and `ideal_pay` to the same yearly numbers (whole numbers, or `null`).
3. **`shared/job-search/preferences.md`**: rewrite it in plain English with the same headings it already has (Roles I want, Skills to match on, Pay, Location and hours, Deal-breakers, Daily limits), from his answers. Delete the "please fill this in" lines. Skills: ask him for his main skills and tools at this point, in one question, because Rita matches on them.
4. **`shared/job-search/sources.md`**: a table of the sites kept and added, how each is read, and a table of **alerts for Hal to set up** on LinkedIn and Indeed (one alert per track: the track's best two or three titles joined with OR, UK, daily, with the pay filter and Remote/Hybrid where the site has them). Delete the "please fill this in" line.

Then read the key points back in a few lines, say which files changed, and tell him: "You can change any of this later: say what you want to Claude, or use **Define my search** in the office."

## Part 2: your CV

Say: "The team writes every CV and letter from your own CV, and never invents anything. Paste your current CV here as text, or give me the path to a Word, PDF or text file."

1. Read what he gives you (a PDF or Word file only once, here; the team never reads them again).
2. Write **`shared/job-search/cv/cv-bank.md`**: keep its headings; start with a short "Summary for matching" (3 to 5 lines: what he does, seniority, sectors, strongest skills); then everything true about him, as detailed as his CV allows. Remove the "please replace everything in this file" line. **Don't invent, round up or tidy anything into a claim he didn't make.**
3. Write **`shared/job-search/cv/base-cv.json`** in the template's format (`name`, `headline`, `contact` with `location`, `phone`, `email`, `linkedin`, `profile` of about 110 to 130 words, up to five `stats`, about seven `skills` groups, `certifications` (`[]` if none), `jobs` newest first with `title`, `company`, `dates`, `bullets`, and `references`). Use only what is in `cv-bank.md`.
4. Build a test PDF to check the layout fits two A4 pages: `python3 shared/tools/cv_template.py shared/job-search/cv/base-cv.json my-cv.pdf` (on Windows `py` if `python3` isn't found). If it runs to three pages, shorten the profile or the older jobs. Tell Hal where `my-cv.pdf` is and ask him to open it.
5. Ask him to **read both files and say what is wrong or missing**: he is the only person who can check they are true. Fix what he says.
6. Tell him: if he has his own Word CV, saving a copy as `shared/job-search/cv/default-cv.docx` gives the Word copies his fonts and styles.

## Finish

Run the status check again. Then say, in a few lines:

- what is set up and what is still to do (if the CV was skipped, say the team won't start until it is done: `/office setup cv`);
- **what's next:** open the office (`shared\office-view\Open Office.cmd`) and, in Claude Code, `/tim start the day`; Tim runs the first search and writes `jobs/today.md`;
- two housekeeping points: Reed needs a free key for the best results (in the office, the **Job site keys** button; skip it if he doesn't have one), and his files live only on this PC, so he should copy the `jobs` and `shared\job-search` folders somewhere safe now and then.

Don't start the search yourself. Don't change git, and don't write anything in `notes/`.
