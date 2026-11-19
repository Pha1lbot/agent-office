# Branch: main

**Started:** 2026-11-06
**Status:** Default branch

## Purpose

The main branch of Tim's agent office. Small changes are committed straight here; bigger or risky changes go on their own branch first (see CLAUDE.md).

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-19: Office changes: Capital.com drafted, EA and PGA revised against updated CV bank

**What changed:**
- `jobs/roles/2026-11-05-capital-com-senior-operations-manager-ai-automation/`: new role folder. Rita wrote `listing.md` from the advert URL (no advert.txt existed; Tim moved this role straight to `drafted` himself from the office). Scored fit 2/5, verdict skip: wants hands-on AI/LLM automation tooling (n8n, Python, SQL) and regulated fintech experience not on Tim's CV, and Capital.com is a trading platform, a sector his preferences flag as not wanted. Wren drafted `cv.md`/`cv.json` and `cover-letter.md` anyway (plus Word and PDF files), using the closest genuine matches (process rebuild, tooling, vendor/account management, rulebook enforcement) and stating the AI/fintech gap directly in the cover letter rather than papering over it.
- `jobs/roles/2026-11-18-electronic-arts-product-operations-manager-12-month-cont/`: `cv.json`/`cv.md`, `cover-letter.md` and rebuilt Word/PDF files updated against new facts in `cv-bank.md` (vendor/third-party qualifier management, prize money). Two lower-relevance bullets dropped to keep the first job within its bullet budget; rulebook/competitive-integrity content left out as less relevant to this advert's focus (flagged in `notes.md`).
- `jobs/roles/2026-11-12-the-professional-golfers-association-the-national-tournaments-manager/`: `cv.json`/`cv.md` updated with the same new cv-bank facts plus rulebook creation/enforcement. Cover letter now states Tim holds the R&A Level 1 Online Certificate and is booked for R&A Level 2 Rules of Golf in January. Certifications sidebar trimmed to the four most relevant to this role after the new text pushed it over the page.
- `shared/job-search/cv/extra-from-tim.md`: added the R&A Level 2 booking fact (wasn't yet in the CV bank) so it's on record for future roles and the fact-check stayed clean.
- `jobs/tracker.json`: Capital.com role set `fit=2 verdict=skip` with reasoning; inbox items i30, i31, i32 marked done.

**Why:** Tim made three office changes: added the Capital.com role and moved it straight to drafted; pasted new CV bank details and asked for the EA draft to be rechecked; pasted new CV bank details for the PGA role and asked for the R&A Level 2 booking to be added to its cover letter.

**Decisions:** Capital.com was drafted despite the weak fit because Tim set it to drafted himself from the office — an action logged for him to review before applying, rather than silently skipping it. EA kept its page-1 fit by dropping two bullets instead of shrinking text; PGA kept its fit by trimming the certifications list rather than the new skill content.

**How to check it:** Read the three roles' `notes.md` for flags, and `tracker.py list --status drafted` to see all three sitting at `drafted` for Tim to check.

**Open items:** None.

### 2026-11-19: The CV template now warns when text doesn't fit; five drafts trimmed

**What changed:**
- `shared/tools/cv_template.py`: a new `run_browser()` is shared by `print_pdf()` and a new `overflow()`. `overflow()` opens the page in the same headless browser, measures every part of each page (header, main column, sidebar, each job) against the bottom margin, and returns how far each runs over and whether it is past the page edge (cut off) or only in the margin. `overflow_warnings()` turns that into plain warnings, which `build_cv()` and `build_letter()` print next to the page-count warning.
- `shared/tools/test_cv_template.py`: 4 new tests. The default CV fits; an over-long sidebar is caught and named; a much longer one is reported as cut off; an over-long main column is caught.
- `.claude/agents/writer.md`: Wren is told the sidebar fits about 6 skill rows, that pages don't grow, and to rerun Ada until there are no warnings.
- `jobs/roles/*/cv.json` and the rebuilt Word files and PDFs for 5 drafts. EA dropped the Safeguarding and safety, and Broadcast and technical, skill rows. Arlington and Reed Head of Events dropped Systems and tooling. Pontoon dropped Event management. Live Recruitment dropped Safeguarding and safety. Reed Head of Events (approved) also had its final PDFs rebuilt.

**Why:** Tim asked for the template to warn on cut-off text and for the affected drafts to be fixed. Each `.page` is a fixed A4 box with `overflow: hidden`, so text that didn't fit was hidden without any warning.

**Decisions:** The check is a second headless-browser run (`--dump-dom`) with a measuring script, after `document.fonts.ready`. It takes about a second and uses no new dependencies. The fix was to drop each draft's least relevant sidebar row rather than cut certifications. The first-aid, DSL and fire marshal certificates still show in the certifications list. Roles already applied for or skipped (British Airways, Reed Head of Operations, ElevenLabs) were left alone. Correction to the earlier entry: the six drafts listed there overflowed into the bottom margin; only EA and BA were actually cut off.

**How to check it:** `python shared/tools/test_cv_template.py` (15 tests pass). Building any role prints no warnings for the five fixed drafts.

**Open items:** Hal's office has the same template and needs this fix in its own copy. Two existing test failures are unrelated to this: `test_tracker` garbles "£" when passing it to a subprocess on Windows, and `test_scout` expects Reed's key to be missing, but this PC has it set.

### 2026-11-19: CV bank: rulebook creation and enforcement; default CV fitted to page 1

**What changed:** `cv-bank.md` gets the bullet "Wrote and enforced tournament rulebooks to uphold competitive integrity" under Head of Esports Operations, BLAST, plus matching words in Event management and Rita's summary. The vendor bullet was shortened to "Account manager for tournament vendors, including Challengermode". In `base-cv.json`, the same rulebook bullet; the two vendor/qualifier bullets merged into one; and the Event management and Freelancers and vendors sidebar text shortened.

**Why:** Tim asked to include rulebook creation and enforcement to uphold integrity. Measuring the page layout in headless Chrome showed that page 1 of the default CV was being clipped. The template's pages have a fixed height with `overflow: hidden`, so extra text is cut off without a warning, and the page count stays 2. The R&A certificate filled most of the sidebar's spare room, the longer skill text then went 14px past the end, and the new bullets put the main column over too.

**Decisions:** The default CV's wording is shorter, while the CV bank keeps the full wording for Wren. Page 1 now has 38px spare in the main column and 5px in the sidebar. The preview Tim was sent earlier today was slightly clipped; the new one fits.

**How to check it:** Render `cv_template.cv_html()` for `base-cv.json` in Chrome and compare each column's bottom to the page's content area.

**Open items:** The same measurement shows that some role drafts overflow the page-1 sidebar with the current base certifications (BA, EA, ElevenLabs, Arlington, Reed Head of Events, Reed Head of Operations, Pontoon, Live Recruitment). EA's and BA's built PDFs were already clipped before today. `cv_template.py` should warn on overflow, not just on page count. The same applies to Hal's office copy.

### 2026-11-19: CV bank: prize money as a responsibility

**What changed:** `cv-bank.md` and `base-cv.json`: the bullet "Responsible for tournament prize money" was added under Head of Esports Operations, BLAST, and "prize money" was added to the Commercial and finance skill and to Rita's summary line.

**Why:** Tim asked to include prize money as a responsibility. He also confirmed that the earlier three additions belong under Head of Esports Operations.

**Decisions:** The wording is kept to what Tim said. Amounts, or how payouts were handled, can be added if he gives them. The default CV still builds to 2 pages.

**How to check it:** The bullet appears in both files. `cv_template.py` builds 2 pages.

**Open items:** None.

### 2026-11-19: CV bank: third-party qualifiers, vendor account management, Challengermode

**What changed:** In `shared/job-search/cv/cv-bank.md`, two bullets were added under Head of Esports Operations, BLAST: "Managed third-party tournament organisers delivering BLAST qualifiers" and "Account manager for tournament vendors, including the tournament platform Challengermode". The Key skills (Event management; Freelancers and vendors) and Rita's summary line were extended to match. `base-cv.json` gets the same two bullets and shorter skill wording, so the sidebar still fits.

**Why:** Tim asked to add third-party tournament management (qualifiers), account management for vendors, and ChallengerMode as a vendor.

**Decisions:** These went under Head of Esports Operations (Jun 2023 – Oct 2026), because Tim didn't say which BLAST role. The vendor is spelled "Challengermode", as the company writes it. The default CV still builds to 2 pages.

**How to check it:** `python shared/tools/cv_template.py shared/job-search/cv/base-cv.json out.pdf` gives 2 pages with the new bullets.

**Open items:** If this work was in the Tournament Operations Manager role instead, move the bullets. Existing drafts use their own job bullets, so they don't pick this up unless redrafted.

### 2026-11-19: Add The R&A Online Certificate (Level 1, 2026) to Tim's CV

**What changed:** The certificate was added at the top (newest) of the certifications in `shared/job-search/cv/base-cv.json` and in the `cv-bank.md` table and summary line, and to the qualifications line in `preferences.md`. Today's three drafts (BHF, McLaren, Insight Select) were rebuilt with `make_docs.py`, so their CVs show it.

**Why:** Tim asked for it to be listed as a qualification he holds, completed in 2026.

**Decisions:** No role's `cv.json` overrides the certifications, so every CV built from now on picks it up from `base-cv.json`. Older drafts get it when they are rebuilt or approved. Tim's own `default-cv.pdf` is his file and wasn't changed.

**How to check it:** `jobs/roles/2026-11-19-mclaren-automotive-ltd-events-operations-lead/cv.md` lists it under Certifications.

**Open items:** Tim's own default CV (`default-cv.pdf`) doesn't have it yet.

### 2026-11-19: Job search: 3 roles shortlisted and drafted (BHF, McLaren, Insight Select)

**What changed:** Tim picked the day's top three. They were shortlisted at priorities 1 to 3 and are now drafted. Rita wrote `listing.md` for each and scored them: BHF Change & Adoption Manager (AI) fit 3, maybe; McLaren Events Operations Lead fit 3, maybe; Insight Select Operations Director fit 1, skip (logistics and warehouse). Wren wrote the CV and cover letter for each, plus `notes.md` with the gaps, and built the Word files and PDFs. Fact check passed.

**Why:** Tim said "All three top picks".

**Decisions:** Insight Select was drafted even though Rita says skip, because Tim chose it before her read. The mismatch is flagged to Tim. Rita and Wren ran as general subagents briefed from their instructions files, because this session started at the repo's top level.

**How to check it:** `tracker.py list --summary` shows the three as drafted. Each `jobs/roles/<id>/` folder has `cv.docx`, `cover-letter.docx`, the PDFs and `notes.md`.

**Open items:** Tim to check the drafts. Wren asks whether Tim measured how much his tools were used or ran training (for BHF). i30 (Capital.com) is still waiting on Tim.

### 2026-11-19: Job search: daily search, 4 new leads, 3 dismissed

**What changed:** `jobs/found.json`, `jobs/tracker.json`, `jobs/tracker.md` and `jobs/today.md`. Tim asked for the day's work to be started from a Claude session, because the 6:31 run hadn't happened. Scout found 0 new roles. 4 of the 10 LinkedIn alert emails since 16 Nov were read, giving 7 finds. 4 were kept (McLaren Events Operations Lead, Royal Albert Hall Production Operations Manager, GutSee Health Head of Operations, Reed Senior Operations Manager) and 3 dismissed (dmg events, Deel, Corinthian Sports). Rita checked Event Industry Jobs (empty) and Work in Sports (blocked). The closed-postings check dismissed nothing. `review-due` added question a13.

**Why:** The daily search, run by hand.

**Decisions:** Inbox item i30 (draft for Capital.com) was left open. Capital.com is a trading platform, which preferences.md rules out, so Tim is asked first rather than spending Rita's and Wren's tokens. Rita ran as a general subagent briefed from her instructions file, because this session was opened at the repo's top level, where the office's agents aren't loaded.

**How to check it:** `tracker.py found list --pending` is empty. `jobs/today.md` lists the picks.

**Open items:** search.json still has Event Industry Jobs' old URL, which now redirects to eventjobsite.com. i30 is waiting on Tim's answer.

### 2026-11-18: Office changes — drafted CVs/cover letters for 2 roles Tim added and drafted himself

**What changed (Tim's office only):**
- Two inbox items (i28, i29) from Tim shortlisting and drafting two roles himself in the office, with no listing.md yet: `2026-11-18-electronic-arts-product-operations-manager-12-month-cont` (Product Operations Manager, 12-month contract, Electronic Arts) and `2026-11-18-live-recruitment-event-project-director` (Event Project Director, Live Recruitment).
- Rita read both full adverts (no advert.txt/attachment existed) and wrote `listing.md` for each, updating fit/verdict from Scout's provisional queue scores: EA to fit 5/apply, Live Recruitment to fit 3/maybe (flagging no agency-side hospitality/experiential background and ~5-6 weeks/year travel above Tim's usual preference).
- Wren drafted CV, cover letter, `notes.md` and built the Word/PDF files for both roles. Fact checks passed clean on both; `notes.md` on each records genuine gaps for Tim to weigh (EA: no "product operations" title/direct partner-account-management history; Live Recruitment: no agency-side hospitality/experiential background, travel above preference).
- `jobs/tracker.json` / `jobs/tracker.md`: fit and verdict updated for both roles (status stays `drafted`, as Tim set it).

**Why:** Tim shortlisted and drafted both roles directly in the office (ahead of the normal Hal shortlist step), landing "Draft a tailored CV and cover letter" inbox items with no listing written yet.

**Decisions:** Had Rita write the listing first (reading the advert from the role's URL, since there was no pasted advert text or attachment) before briefing Wren, per the office-changes rule for drafting without an existing listing.

**How to check it:** Open each role's PDFs under `jobs/roles/<id>/`; read `notes.md` for the fact-check and gap notes, especially the Live Recruitment travel/agency-experience flag.

**Open items:** None — this was an automated run with Tim not present; no questions were raised.

### 2026-11-18: Start Hal after the office's own Scout run so new finds get sorted

**What changed (Tim's office only):**
- `shared/office-view/src/auto-cos.ts`: the status now counts `finds` (Scout's finds not yet sorted), and there is a new `findsChanged(count, fromScout)`. Hal is scheduled (same 2-minute wait, daily cap and token budget) when the office's Scout run leaves finds. The run's prompt is built by a new `cosPrompt()`, which covers office changes, finds, or both. The `after` hook now returns `{ inbox, finds }`.
- `shared/office-view/src/server.ts`: counts unsorted finds and calls `findsChanged` after `runScout` (which starts Hal), and when the office opens or `found.json` changes (which only updates the count).
- `shared/office-view/public/dashboard.js`: the strip says "N new finds to sort", and Run now appears for finds as well.
- `.claude/skills/cos/SKILL.md`: a new "Scout's finds" section. Hal sorts the pending finds (daily search step 6), updates `today.md` and backs up. There is no Scout run, email scan or Rita brief.
- `shared/office-view/test/auto-cos.test.ts`: 3 new tests, and the existing test was updated for the new hook.
- `shared/office-view/README.md`: one sentence on the new start-up.

**Why:** Tim saw "Waiting for Hal" in the office. When the 6:31 daily search doesn't run, the office runs Scout itself, but nothing then started Hal, so the finds sat unsorted until the next morning. Tim asked for it to be fixed.

**Decisions:** Only the office's own Scout run starts Hal. Finds seen when the office opens or when `found.json` changes just update the count, because the scheduled daily search sorts its own finds and should not cause a second run. Sorting is a separate skill section, so Hal doesn't repeat the full daily search (tokens).

**How to check it:** `npm test` in `shared/office-view` (60 pass) and `npm run check` (clean). In the office, after a Scout run that queues leads, the strip shows "Hal: starts in 2:00 (N new finds to sort)".

**Open items:** Hal's office has the same gap in its own copy of `auto-cos.ts`, `server.ts`, `dashboard.js` and the cos skill. It has not been changed, pending Tim's go-ahead. The running office needs restarting to pick this up.

### 2026-11-18: Job search: sorted Scout's afternoon finds, 4 new leads, 1 dismissed

**What changed:** `jobs/found.json`, `jobs/tracker.json` and `jobs/tracker.md`: Scout's 5 finds from the office's 14:08 run were sorted. Kept as leads: BHF Change & Adoption Manager (AI), Live Recruitment Event Project Director and EA Product Operations Manager (all Apply), plus Insight Select Operations Director (Maybe). Dismissed: Live Recruitment Senior Technical Project Manager, which is based in Royston and too far from Epsom. `jobs/today.md` was rewritten for today.

**Why:** Tim saw the office showing these finds as "Waiting for Hal". The office runs Scout on its own when the morning daily search hasn't run, but nothing starts Hal afterwards to sort the finds. Tim asked for them to be sorted now.

**Decisions:** Each lead was judged against preferences.md. Insight Select is a Maybe because the advert names no sector and the commute is borderline. Only the sorting step was run: there was no email scan and no Rita brief.

**How to check it:** `python shared/tools/tracker.py found list --pending` shows nothing. The four leads appear in the office under Leads, and the dismissed role under Leads → Dismissed.

**Open items:** Gap in `shared/office-view/src/server.ts`: after the office's own Scout run, nothing starts Hal to sort the finds, so they wait until the next daily search. Hal's office has the same code.

### 2026-11-16: Job search: 6 roles drafted from the office inbox

**What changed:** Tim shortlisted and drafted 6 roles in the office (Pontoon Senior Project Manager AI Adoption, Carrington Digital Enablement Manager AI Adoption, DP World Tour HotelPlanner Tour Tournament Business Manager, Product Madness Senior Product Manager, TryHackMe Head of Operations, ElevenLabs Company Operations Lead), none of which had a listing.md yet. Rita read each advert from its URL and wrote `jobs/roles/<id>/listing.md` with a fit score and verdict for each. Wren then drafted CV and cover letter for all 6 from the CV bank, and Ada built the Word/PDF files. Tracker fit/verdict fields updated to match Rita's real reads (replacing the daily-search triage placeholders); TryHackMe's status moved to `drafted` to match the others.

**Why:** Tim moved these 6 roles to drafted in the Agent Office; the office queued "Draft a tailored CV and cover letter" for each in the tracker inbox (i22-i27).

**Decisions:** Rita's real read scored 4 of the 6 as weak fits (DP World Tour, Product Madness, TryHackMe, ElevenLabs — fit 2, verdict skip) and 2 as maybe (Pontoon, Carrington — fit 3, good pay/track fit but each wants specific experience not well evidenced in the CV bank). Drafted all 6 anyway since Tim had already asked for them in the office; added action a12 flagging the weak-fit verdicts for him to review before spending more time on them. Wren drafted honestly within the CV bank and flagged gaps in each role's notes.md rather than inventing experience.

**How to check it:** `python shared/tools/tracker.py inbox list` (empty), `tracker.py list --summary` shows all 6 as `drafted`, `tracker.py action list` shows a12. Each role's `notes.md` lists its CV gaps.

**Open items:** Tim to review the weak-fit verdicts (action a12) and the Word/PDF drafts for all 6 roles before approving any.

### 2026-11-16: Job search: daily search, 5 new leads, 1 dismissed

**What changed:** `Tim's Job Search/jobs/` (found.json, tracker.json, today.md) from a manual daily search: Scout, LinkedIn and Reed alert emails read, sources logged.
**Why:** Tim asked to search now; the panel showed nothing checked for 3 days.
**Open items:** five job sites still blocked by the cloud allowlist; Reed key not available in the cloud; Indeed alerts not set up.

### 2026-11-13: Job search: LinkedIn alerts read, source panel updated

**What changed:** Tim asked to re-check the sources in the Sources panel. The Microsoft 365 connector was working again, so I read the 3 LinkedIn alert emails (15 roles). 3 kept as leads (Stadium Managers at UK & Ireland 2028 Limited, HotelPlanner Tour Tournament Business Manager at DP World Tour, Regional Manager at Fever), 12 dismissed with reasons (on-site, wrong discipline or sector). `Tim's Job Search/jobs/found.json` and `jobs/tracker.json` updated. Source log: LinkedIn Jobs ok; Indeed UK empty (no Indeed alert emails in 7 days); Esports Insider blocked (the site returns 403 to automated readers); Event Industry Jobs, Work in Sports, Guardian Jobs, The Unit List and Access Jobs blocked (hosts not on the environment's allowed list).

**Why:** Tim asked to check those sources now.

**Decisions:** Judged fit from the alert emails only (title, company, place); pay and duties not read, so all three leads are `maybe`. Left f23 (Pontoon AI adoption, Reed, strong) untriaged: it was already in the queue and is Hal's call at the next daily run.

**How to check it:** `python3 shared/tools/tracker.py found sources`; the office's Sources panel and Leads page.

**Open items:** Tim to allow the five hosts in the environment's network settings, set up the Indeed UK alerts (sources.md), and read Esports Insider by hand.

### 2026-11-13: Job search: office changes, 4 roles drafted

**What changed:** Worked the tracker inbox (i16–i21) from Tim's office edits. The PGA National Tournaments Manager role (fit 2, verdict skip) had a partial draft left from an earlier session (`cv.json`, `cover-letter.md`, `notes.md` written but never built) — ran `make_docs.py` to finish it; fact check passed clean. Briefed Wren for three fresh drafts: Reed Head of Events (fit 4, apply), Arlington Resource Management Head of Operations (fit 3, maybe), and Reed Head of Operations (fit 3, maybe) — all built cleanly with gaps noted in each role's `notes.md`. Tim then shortlisted Direct Chauffeur Line's Assistant Operations Manager himself despite Rita's fit 1/skip verdict (HR/employee-relations role, no match to Tim's background), so briefed Wren for that too, built from transferable ops/people-management experience only; set it to `drafted`.
**Why:** Tim's office edits queued these as inbox tasks; Direct Chauffeur Line is the same pattern as the earlier NetEase case — Tim wants it drafted even against a skip verdict, so it's drafted rather than argued with.
**Decisions:** Ran `make_docs.py` directly for the PGA role instead of re-briefing Wren, since her text work (`cv.json`/`cover-letter.md`) was already done and correct — only the build step was missing.
**How to check it:** `tracker.py list --summary` shows all 5 roles as `drafted`; each role folder has `cv.docx`/`cover-letter.docx` and matching PDFs; `tracker.py inbox list` is empty (i16–i21 all done).
**Open items:** None. Tim should check the drafts, especially Direct Chauffeur Line's (built against a skip verdict) and Arlington/Reed Head of Operations (sector/D2C gaps noted in their `notes.md`).

### 2026-11-12: Job search: office change for PGA role, merge conflict resolved

**What changed:** Tim added a role in the office (The PGA: National Tournaments Manager), which landed in the inbox at the same time the daily search's auto-commit went to `origin/main`, so the start-up pull hit a genuine merge conflict in `Tim's Job Search/jobs/tracker.json` and `tracker.md` (both sides appended different roles/priorities at the same point). Resolved by merging the two JSON files programmatically (kept both sides' additions: Tim's PGA role plus the daily search's 7 new leads and its inbox item), then re-ran `tracker.py rank` and `render`. Briefed Rita to read the PGA advert; she scored it fit 2, verdict skip (missing the essential PGA/R&A Rules qualification; golf-specific sector with heavy travel), closing date 24 Nov 2026 noon. Set those fields and marked inbox item i15 done.
**Why:** Tim's office edit and the scheduled daily search ran close together, so two independent commits diverged from the same base.
**Decisions:** Resolved the tracker.json conflict by diffing the three git stages (common ancestor/ours/theirs) in Python rather than hand-editing conflict markers, since the file is machine-written list data; this avoided accidentally dropping either side's additions.
**How to check it:** `git log --oneline -5` shows the merge commit; `jobs/tracker.json` has no conflict markers and includes both the PGA role and the daily search's new roles; `jobs/roles/2026-11-12-the-professional-golfers-association-the-national-tournaments-manager/listing.md` exists.
**Open items:** `tracker.py rank` has a pre-existing bug — it crashes with `AttributeError: 'Namespace' object has no attribute 'older_than'` after it saves, because its default lambda calls `cmd_list` without that argument. The rank/save step still completes before the crash, so this didn't block the work, but it's worth a small fix (`rk.set_defaults` in `shared/tools/tracker.py`, around the `rank` subcommand).

### 2026-11-12: Job search: daily search, 3 new leads, 4 dismissed

- Scout reached 5 of 6 sources (Reed needs its key in the cloud). Three Reed leads kept, four dismissed. Outlook returned a Microsoft error, and Event Industry Jobs and Work in Sports can't be reached from the cloud yet. Details in `Tim's Job Search/jobs/today.md`.

### 2026-11-11: Job search: finance meetings confirmed as Head of Esports Operations; BA profile reworded

- Tim confirmed the fortnightly finance budget meetings were in his Head of Esports Operations role at BLAST. `Tim's Job Search/shared/job-search/cv/extra-from-tim.md` now files the fact under that role. This closes the open item in the entry below.
- BA role `2026-11-05-british-airways-senior-operations-resource-planning-mana`: profile's last sentence reworded ("Used to stakeholder management…" became "Experienced in stakeholder management… and in continuous improvement…"). Rebuilt with `make_docs.py`; fact check passed.

### 2026-11-11: Job search: finance budget meetings added to CV facts and the British Airways CV

- New `Tim's Job Search/shared/job-search/cv/extra-from-tim.md`: Tim told Hal he held fortnightly meetings with finance at BLAST to align on budgets. Recorded as an extra fact Wren may use; Tim didn't say which BLAST role.
- BA role `2026-11-05-british-airways-senior-operations-resource-planning-mana`: Wren added it to the CV (bullet under Head of Esports Operations, profile, budgets skill) and the cover letter, answering the advert's "track budgets with Finance". Dropped the "technical requirements for commercial partnerships" bullet to keep two pages. Ada rebuilt the files; fact check passed.
- Open: confirm with Tim which BLAST role the meetings belong to (placed under Head of Esports Operations for now).

### 2026-11-11: Job search: British Airways CV and letter tightened to the advert's wording

- Tim asked for the BA documents to match the advert's terms after comparing them with his default CV. Wren revised `cv.json` and `cover-letter.md` for `2026-11-05-british-airways-senior-operations-resource-planning-mana`; Ada rebuilt the Word files and PDFs (fact check passed, fits two pages).
- Wording now mirrors BA's: rosters/rostering (no "rotas" left), resource and workforce planning, planning tools, stakeholder management, continuous improvement; vendor and supplier management brought back (backed by the CV bank). Headline: "Operations Leader, Rostering, Resourcing and Budgets".
- Not claimed, still listed as gaps in the role's `notes.md`: manpower forecasting, budget variance reporting with Finance, Excel/Power BI, union work, aviation, offshore teams, deputising.

### 2026-11-11: Job search: British Airways Senior Ops Resource Planning Manager drafted

- Rita found the live advert (careers.ba.com, ref 12246, closes 31 Dec 2026) and wrote `listing.md`: fit 2, verdict maybe. Wren drafted the CV and cover letter; Ada built the files. Tracker updated with the link, closing date and verdict; inbox i14 done.
- This supersedes the entry below: the office's automatic run (11:34, the first since the office-folder fix) flagged the draft as blocked because there was no advert on file. Action a10 marked done.
- For Tim: the letter says openly there's no aviation or union experience; gaps are listed in the role's `notes.md`.

### 2026-11-11: Job search: British Airways Senior Ops Resource Planning Manager drafting blocked, no advert on file (action a10)

### 2026-11-11: Job search: daily search, 7 new leads, 8 dismissed; Activision Blizzard drafted

- Daily search run by hand at Tim's request (it had never run before: no `jobs/found.json`). 3 LinkedIn alert emails gave 14 roles; Rita's web search gave 1 (most results stale or blocked). 7 kept as leads, 8 dismissed; summary in `jobs/today.md`.
- Inbox i13: Wren drafted the CV and cover letter for `2026-11-08-activision-blizzard-marketing-senior-specialist-call-of-duty`; role set to drafted. Marketing skills the advert asks for are not in the CV bank; listed in the role's `notes.md` for Tim.
- Open: inbox i14 (British Airways draft) arrived during the run and is not done yet.

### 2026-11-11: Back to the normal start-up git rules

**What changed**
- `CLAUDE.md`, both offices' `.claude/settings.json` and both offices' `.claude/skills/cos/SKILL.md`: restored to their wording from before the 2026-11-09 entry "Carry on locally when GitHub can't be reached". A failed start-up pull again means sorting it out with the person before starting work, and office changes are committed and pushed as before.

**Why**
- Tim's GitHub account is active again, and he asked to go back to the old system while keeping the other updates (the UNICEF UK and Handle Recruitment drafts, and the automatic-run fix from PR #27).

**Decisions**
- Restored the five files by hand in a new commit rather than `git revert`, so the 2026-11-09 notes entries stay, as the change-notes rules require.

**How to check it**
- The hook message in each office's `.claude/settings.json` again ends "sort out any problem with Tim/Hal before starting work". `main` matches GitHub after the push.

**Open items**
- None. If GitHub goes down again, the 2026-11-09 commit (9243d72) has the "carry on locally" wording to reuse.

### 2026-11-11: Merge GitHub's main after GitHub came back

**What changed**
- Merged `origin/main` (PR #27, `notes/changes/claude-youthful-hopper-alwu7m.md`) into the 9 local commits made while GitHub was suspended.
- `Tim's Job Search/shared/office-view/src/server.ts`: conflict resolved by taking GitHub's version. It makes the same fix as the local 2026-11-09 commit (automatic runs start in the office folder), and with `auto-cos.ts` also refuses with a clear message if the /cos skill is missing.
- `notes/changes/main-hals-job-search.md`: conflict resolved by keeping both entries, newest first.

**Why**
- Tim asked for the automatic-run fix in Hal's office too. PR #27 had already made it in both offices, so merging covered it.

**Decisions**
- A merge, not a rebase, as CLAUDE.md requires. GitHub's version of the fix kept because it is the same change plus a safety check and tests.

**How to check it**
- `npm run check` and `npm test` pass in both offices' `shared/office-view` (39 tests each).

**Open items**
- Closes the 2026-11-09 open items "Same fix probably needed in Hal's office" and "Push this commit when GitHub access is restored", if the push below succeeds.
- Both offices must be restarted to pick up the fix.

### 2026-11-09: Carry on locally when GitHub can't be reached

**What changed**
- `CLAUDE.md`: "At the start of every session" step 2 now splits a failed pull in two. If GitHub can't be reached, carry on locally, commit without pushing, tell Tim, and push when it's back (Hal's office just carries on and pulls later). Merge conflicts or local changes in the way still stop work.
- `Tim's Job Search/.claude/settings.json`: the start-up hook's failure message says the same, instead of "sort out any problem with Tim before starting work".
- `Tim's Job Search/.claude/skills/cos/SKILL.md`: "Office changes" step 4 says to still do the work and commit without pushing when GitHub can't be reached, and to stop only for conflicts or local changes in the way.
- Hal's office got the matching hook and skill changes; see `main-hals-job-search.md`.

**Why**
- Tim's GitHub account is suspended, so every pull and push fails. With the old message, a session (and every automatic run, now that they start in the office folder) would stop before doing any work. Tim asked for work to carry on locally until GitHub is back.

**Decisions**
- Kept the stop for merge conflicts and local changes in the way: carrying on through those could lose or mix up work.
- Left "Before finishing" steps 7-8 (nothing left unpushed; never leave a failed push) as they are: step 2 now covers the GitHub-down case, and they still apply once it's back.

**How to check it**
- Both settings files still parse as JSON. Start a session in the office while GitHub is unreachable: the hook message should say to carry on locally, and /cos office changes should finish and commit without pushing.

**Open items**
- Not pushed (GitHub suspended). 9 local commits are waiting.

### 2026-11-09: Automatic Hal runs start in the office folder

**What changed**
- `Tim's Job Search/shared/office-view/src/server.ts`: the automatic Chief of Staff run (`AutoCos`) now starts Claude Code in the office folder (`REPO`) instead of the git repo's top folder (`gitRepo || REPO`), with a comment saying why.

**Why**
- Tim asked for the fix found in the entry below: every automatic run failed with "Unknown command: /cos", because /cos, the agents and the guard hook live in the office's own `.claude/`, which Claude Code doesn't load from the top folder. The run's tool paths (`shared/tools/tracker.py`) are also relative to the office folder.

**Decisions**
- Only the run's working folder changed. The office's GitHub backup still uses the git top folder, which is right for git.
- Hal's office has the same code and likely the same bug; not changed, as the rules say to change the other office's copy only when asked.

**How to check it**
- `npm run check` and `npm test` in `shared/office-view` pass (37 tests).
- Restart the office, then press "Run now" with an inbox item waiting: the new `logs/cos-*.log` should show Hal working, not "Unknown command: /cos".

**Open items**
- The running office must be restarted to pick this up.
- Same fix probably needed in `Hal's Job Search/shared/office-view/src/server.ts`.
- With GitHub suspended, runs will hit a failed start-up git pull; whether they carry on depends on the existing rules. Not pushed (GitHub suspended).

### 2026-11-09: Drafts for UNICEF UK and Handle Recruitment, and why automatic runs fail

**What changed**
- `jobs/roles/2026-11-05-unicef-uk-director-of-soccer-aid-interim/`: new. Rita's `listing.md`; Wren's `cv.json`, `cover-letter.md`, `notes.md`; Ada's `cv.md`, Word files and PDFs.
- `jobs/roles/2026-11-05-handle-recruitment-client-unnamed-event-director/`: new, same set of files.
- `jobs/tracker.json` / `jobs/tracker.md`: Handle Recruitment set to fit 2, verdict skip; UNICEF UK set to fit 3, verdict maybe, closing date 2026-11-09. Inbox items i10, i11 and i12 done. Action a9 added (UNICEF closed and rejects AI-written answers).

**Why**
- Tim reported that automatic runs did nothing although the office showed requests waiting, and asked Hal to run the inbox for these two roles by hand, with a verdict for Handle Recruitment.
- Cause of the failed runs: the logs (`Tim's Job Search/shared/office-view/logs/cos-*.log`) all say only "Unknown command: /cos". `shared/office-view/src/auto-cos.ts` starts Claude Code in the git repo's top folder (`server.ts` passes `gitRepo || REPO`), but since the office moved into `Tim's Job Search/` the /cos skill lives only in that office's `.claude/skills/`, so Claude Code at the top level doesn't know it. The start-up git pull (GitHub is currently suspended) is not what stopped them, so the planned "carry on without GitHub" rule changes were not made.

**Decisions**
- Rita found UNICEF closed at 8am today and rated Handle a skip (4 office days a week, agency experience essential). Tim was asked and chose to draft both anyway.
- Committed locally only: Tim's GitHub account is suspended, so push when it's back.
- Activision Blizzard (i13) left in the inbox: not part of this request.

**How to check it**
- `python shared/tools/tracker.py inbox list` shows only i13. Both role folders have a CV and cover letter PDF.

**Open items**
- Fix `server.ts` to start automatic runs in the office folder (`REPO`), not the git top level. Hal's office has the same code and likely the same bug.
- Push this commit when GitHub access is restored.
- Wren's UNICEF CV figure "6 / person team led" may read oddly; Tim to check.

### 2026-11-08: Verdicts for two roles Tim added from the office (TikTok, Activision Blizzard)

**What changed**
- `jobs/roles/2026-11-05-tiktok-tiktok-shop-creator-operations-manager/listing.md`: new, Rita's read of the TikTok Shop Creator Operations Manager advert.
- `jobs/roles/2026-11-08-activision-blizzard-marketing-senior-specialist-call-of-duty/listing.md`: new, Rita's read of the Activision Blizzard Marketing Senior Specialist advert.
- `jobs/tracker.json` / `jobs/tracker.md`: set fit and skip verdicts for both roles; inbox items i8 and i9 marked done.

**Why**
Tim added both roles from the office and asked for a verdict (i8: "Ask Hal" on TikTok Shop; i9: full read request on Activision Blizzard). The office started this session automatically for the inbox items.

**Decisions**
Briefed Rita once for both roles together (neither had a listing.md yet, so both needed the full read rather than verdict-only) to keep it to one hand-off.

**How to check it**
`python shared/tools/tracker.py show <id>` for either role id, or open the listing.md files above.

**Open items**
Both came back skip: TikTok Shop role is e-commerce creator ops (wrong discipline) and no longer accepting applications; Activision Blizzard role is a marketing/GTM IC role, not esports ops leadership. No action needed from Tim.

### 2026-11-06: NetEase CV, cover letter and interview prep drafted despite skip verdict

**What changed**
- `jobs/roles/2026-11-05-netease-games-esport-specialist/`: Wren added `cv.md`, `cv.docx`, `cover-letter.md`, `cover-letter.docx`, `notes.md`. Cole added `interview-prep.md`, `talking-points.md`.
- `jobs/tracker.json` / `jobs/tracker.md`: inbox items i1 and i6 marked done; added action a8 for Tim to check the documents are honest about the seniority/language gaps.

**Why**
Tim's office changes queued two inbox items (refresh interview prep, draft CV/cover letter) for this role despite Rita's earlier skip verdict (entry-level specialist role, requires Chinese, below Tim's Head of Department seniority). He wasn't watching this session, but the tracker history showed him setting the role to "drafted" three times today, which Hal treated as confirmation he wanted the documents anyway rather than holding them again.

**Decisions**
Briefed Wren and Cole to be honest about the gaps rather than oversell fit: no Chinese language claimed, no entry-level reframing, seniority mismatch and language gap addressed directly in interview prep.

**How to check it**
Read the new files in the role folder; check action a8 in the tracker for the flag to Tim.

**Open items**
Tim still needs to decide whether to actually apply, given the skip verdict stands.

### 2026-11-06: NetEase role unblocked (Tim added the link) — but Rita's read says skip

**What changed**
- Tim added a LinkedIn link to `2026-11-05-netease-games-esport-specialist` (the previous blocker, a5/a6, is resolved). A new inbox item i7 ("Give a verdict: worth applying?") also arrived.
- Briefed Rita for a full read since the role still had no `listing.md`. She wrote `jobs/roles/2026-11-05-netease-games-esport-specialist/listing.md` and confirmed a skip verdict, fit 2: entry-level specialist role (2+ yrs exp, requires Chinese), far below Tim's Head of Department seniority.
- Set `fit=2 verdict=skip verdict_why="Entry-level specialist role (2+ yrs exp, requires Chinese), far below Tim's Head of Department seniority"` on the tracker.
- Marked inbox i7 done, and actions a5/a6 done (their missing-advert blocker is resolved now `listing.md` exists).
- Did **not** action i1 (refresh interview prep) or i6 (draft CV/cover letter) — Tim had already moved this role to `drafted`, but Rita's read turned up a hard mismatch (the role needs Chinese). Added action a7 asking Tim to confirm he still wants the draft and prep refresh despite the skip verdict, rather than spending a Wren and Cole hand-off on a role likely to be dropped.

**Why**
- Started automatically by the office after Tim's changes. Rule in CLAUDE.md/SKILL.md: Tim isn't watched in this mode, so open questions become actions, not drafted work.

**Decisions**
- Considered drafting anyway since the role was already in `drafted` status (Tim's call), but the skip reason is a hard requirement gap (language), not just a soft preference mismatch — holding off avoids a ~15k-token hand-off each to Wren and Cole for a role Tim is likely to pass on once he sees Rita's verdict.

**How to check it**
- `python shared/tools/tracker.py show 2026-11-05-netease-games-esport-specialist` shows the new fit/verdict.
- `python shared/tools/tracker.py inbox list` shows only i1 and i6 remaining.
- `python shared/tools/tracker.py action list` shows a7.

**Open items**
- Waiting on Tim to say whether to proceed with the CV/cover letter draft and interview prep refresh (i1, i6) despite the skip verdict.

### 2026-11-06: Office changes inbox — NetEase role blocked on missing advert

**What changed**
- Checked the two office-changes inbox items (i1: refresh interview prep, i6: draft CV/cover letter), both for `2026-11-05-netease-games-esport-specialist`. Neither Wren nor Cole can do this work: the role has no `url`, no pasted advert text, and no `jobs/roles/` folder at all.
- Left i1 and i6 open in the inbox (nothing to mark done).
- Added action a6 noting the interview-prep refresh is blocked for the same reason as the existing action a5 (missing advert/link).

**Why**
- Started automatically by the office after Tim changed role statuses; this role already has `verdict: skip` and an open action (a5) asking Tim to add the advert, so the gap was already known but the new inbox items repeat work that's still blocked.

**How to check it**
- `python shared/tools/tracker.py inbox list` still shows i1 and i6.
- `python shared/tools/tracker.py action list` shows a5 and a6, both pointing at the same missing-advert gap.

**Open items**
- Waiting on Tim to add the NetEase advert link or paste its text before Wren/Cole can act.

### 2026-11-06: Record merges of #5 and #6, and add /hal

**What changed**
- `CHANGELOG.md`: lines for [Pha1lbot/agent-office#5](https://github.com/Pha1lbot/agent-office/pull/5) (dashboard import) and [Pha1lbot/agent-office#6](https://github.com/Pha1lbot/agent-office/pull/6) (office editing, Hal).
- `notes/changes/import-dashboard.md`, `notes/changes/office-editing.md`: status set to merged.
- `.claude/skills/hal/SKILL.md`: new `/hal` command, another name for `/cos`. It points to the cos skill rather than copying it, so there is only one set of instructions to keep up to date.

**Why**
Tim merged both PRs and typed `/hal start of day`, which didn't exist.

**Decisions**
The new command points to `/cos` rather than replacing it, so the office's automatic runs (which send `/cos office changes`) keep working.

**How to check it**
In Claude Code in the repo, `/hal start the day` behaves like `/cos start the day`.

**Open items**
Tim to pull on his PC and reopen the office to get editing and the contract.

### 2026-11-06: Repair notes file and remove duplicate CV after a merge

**What changed**
- `notes/changes/main.md`: restored to its last good version (commit 8c49ce7). Resolving a merge conflict on Tim's PC had removed the `###` from every entry heading and left two stray merge lines ("HEAD" and a commit id). No entry's text was lost or changed; only the headings were repaired.
- `shared/job-search/cv/Tim Everard CV 2026 v3.pdf`: removed. The merge on Tim's PC had brought it back, and it is byte-for-byte identical to `default-cv.pdf` (same SHA-256).

**Why**
Tim's PC was behind GitHub with an unfinished merge. Finishing it led to a conflict in this file, and the hand resolution stripped the heading markers.

**Decisions**
- Restored the whole file rather than patching it line by line. A comparison showed the PC's side added no entries of its own, so nothing is lost.
- Removed only the exact duplicate CV, after checking the hashes match.

**How to check it**
`grep -c '^### ' notes/changes/main.md` counts every entry heading again. `shared/job-search/cv/` holds `README.md` and `default-cv.pdf`.

**Open items**
Tim's PC needs a `git pull` to pick this up.

### 2026-11-06: Job search: first day, 7 roles found

**What changed**
- `jobs/roles/2026-11-06-*/listing.md`: 7 listings from Lead Recruiter (Epic Games, Hexagon World Series, Vitality, Disrupt Search, 2 × Blank Space Recruitment, ESL FACEIT Group).
- `jobs/tracker.json`, `jobs/tracker.md`: 7 roles added as `found` by Admin.
- `jobs/today.md`: ranked list with top 3 picks (Epic, Vitality, Hexagon).

**Why**
Tim ran `/cos start the day`.

**Decisions**
- Ranked by fit (none above 3), then by sector and work style, because no closing dates were given and most pay is unstated.
- The first search was blocked by the cloud network. Tim approved a new "agent-office" cloud environment allowing the job sites, and the search was re-run.

**How to check it**
`python3 shared/tools/tracker.py list --summary` shows 7 found. Read `jobs/today.md`.

**Open items**
- Tim to pick roles.
- Coverage was partial: Indeed returned 403, Hitmarker listings load by JavaScript, and Greenhouse careers boards returned 403. Running from Tim's PC, or allowing `boards-api.greenhouse.io`, should help.

### 2026-11-06: Move CV into the cv folder

**What changed**
- `shared/job-search/cvdefault-cv.pdf` moved to `shared/job-search/cv/default-cv.pdf`.
- The CV path given in the entry below ("Job search set up") is now out of date; the CV is at `shared/job-search/cv/default-cv.pdf`.

**Why**
Tim renamed the CV on GitHub to `default-cv.pdf`, but the slash was lost (`cvdefault-cv.pdf`), so the file ended up outside the `cv` folder where the agents look.

**Decisions**
The intended name was clear, so the file was moved rather than asking first.

**How to check it**
`shared/job-search/cv/` contains `default-cv.pdf` and `README.md`.

**Open items**
None.

### 2026-11-06: Job search set up (preferences and job sites)

**What changed**
- `shared/job-search/preferences.md`: filled in from Tim's CV (`shared/job-search/cv/Tim Everard CV 2026 v3.pdf`, which Tim uploaded) and his answers: £50k minimum, remote or hybrid near London (he lives in Epsom), some event travel. Assumed values are marked *(assumed)* for Tim to correct.
- `shared/job-search/sources.md`: Hitmarker, Indeed UK, LinkedIn Jobs and company careers pages, as Tim chose.

**Why**
Tim ran `/cos start the day`. The setup check stopped it because these two files were still blank templates.

**Decisions**
- Roles and skills are taken from the CV so Tim didn't have to type them. Ideal pay is left open.
- Same-company BLAST roles are skipped by default, since Tim has just left; he can change that.

**How to check it**
Read both files. Tim should correct anything marked *(assumed)*.

**Open items**
- The CV is a PDF, so new Word files use the default style rather than Tim's CV styling. A .docx copy named `default-cv.docx` would fix that.
- The PDF's text layer is missing the letter "a" in places, so Senior Admin should work from the page images and have Tim check its text copy.

### 2026-11-06: Add a double-click launcher for the office

**What changed**
- `shared/office-view/Open Office.cmd`: new Windows launcher. It moves to its own folder, checks Node.js is installed, and just opens the browser if the office is already running. Otherwise it runs `npm.cmd install` quietly (quick when nothing has changed), opens the browser as soon as the office answers (waiting up to 30 seconds) and starts the office. Closing its window closes the office.
- `.gitattributes`: new. `.cmd` and `.bat` files get Windows line endings when checked out.
- `shared/office-view/README.md`: the launcher, desktop shortcut and start-at-login steps, plus a "Problems" section (PowerShell "running scripts is disabled", "Could not read package.json", port already in use).
- `README.md`: points to the launcher.
- `CHANGELOG.md`: line for [Pha1lbot/agent-office#4](https://github.com/Pha1lbot/agent-office/pull/4) (the office view), which was merged.
- `notes/changes/office-view.md`: status set to merged.

**Why**
On his PC, Tim hit PowerShell's script block (`npm.ps1 cannot be loaded`), then a window that opened in `system32` ("Could not read package.json"). He asked for something like a .bat that loads the office automatically.

**Decisions**
- A `.cmd` file, because cmd.exe isn't affected by PowerShell's script policy. It calls `npm.cmd` directly and always runs from its own folder (`%~dp0`), which avoids both problems.
- It runs `npm install` every time rather than only the first time, so it stays correct after a `git pull` changes the packages; when nothing has changed it takes a few seconds.
- It checks whether the office is already running, so double-clicking twice doesn't fail with "port in use".
- The line-ending rule covers only `.cmd` and `.bat`. Adding `.ps1` would have changed existing files, which might show as modified on Tim's PC and block the automatic `git pull --ff-only`.
- Committed straight to `main`, because it is one small file and Tim wanted it straight away.

**How to check it**
Not tested here (no Windows in the cloud sandbox). The file was checked to have Windows line endings. On the PC: `git pull`, then double-click `shared\office-view\Open Office.cmd`. The browser should open http://127.0.0.1:4747 once the office is ready, and a second double-click should just open the browser.

**Open items**
Tim to try it and report anything odd. If PowerShell is blocked entirely on his PC, the "already open" check and the browser opening would fail; the office would still start and he could open the address by hand.

### 2026-11-06: Record merge of preference reviews

**What changed**
- `CHANGELOG.md`: added the line for [Pha1lbot/agent-office#3](https://github.com/Pha1lbot/agent-office/pull/3) (preference reviews).
- `notes/changes/claude-youthful-hopper-alwu7m.md`: status set to merged.

**Why**
#3 was merged; this is the "After a merge" routine in CLAUDE.md.

**Decisions**
A small notes-only commit, made straight on `main`.

**How to check it**
`CHANGELOG.md` lists #1, #2 and #3.

**Open items**
Office view to be built on a fresh `office-view` branch, as Tim asked.

### 2026-11-06: Record merge of the job-search branch

**What changed**
- `CHANGELOG.md`: added the line for [Pha1lbot/agent-office#2](https://github.com/Pha1lbot/agent-office/pull/2) (keeping local copies in sync, and the merge-conflict fix).
- `notes/changes/claude-youthful-hopper-alwu7m.md`: status set to merged. Old entries are unchanged.

**Why**
Tim merged #2 and said "we are updated now". CLAUDE.md's "After a merge" routine asks for a CHANGELOG line straight after each merge.

**Decisions**
Committed straight to `main`, because it is a small notes-only change, as CLAUDE.md allows. #2 was merged with a merge commit, so every commit from the branch is on `main`.

**How to check it**
`CHANGELOG.md` lists both #1 and #2. `git status` on `main` shows it up to date with origin.

**Open items**
- On Tim's PC: confirm it is on `main` (`git status`) and run `install-sync.ps1` once for the 15-minute pull, if not done yet.
- Tim to fill in `shared/job-search/preferences.md` and `sources.md` and add his CV, then try `/cos start the day`.
- Next: the office view branch.

### 2026-11-06: Add office view plan

**What changed**
- `notes/plans/office-view.md`: new plan for showing agents as pixel-art coworkers in an office. It covers existing projects (Pixel Agents, Bit Office, pixtuoid), the three-layer design (agents, bridge, office view), decisions so far, notes on tokens and weekly limits, first steps and open questions.

**Why**
Tim explored the idea in a Claude chat and asked to move it over to Claude Code. This file carries that discussion into the repo so a Claude Code session can pick it up.

**Decisions**
Put it under `notes/plans/` rather than a new top-level folder, so the repo layout in CLAUDE.md doesn't change without Tim agreeing. It's committed straight to `main` because it is a single new notes file, not code.

**How to check it**
Open `notes/plans/office-view.md` on GitHub or in Claude Code.

**Open items**
Tim still needs to answer the open questions in the plan (view type, fork or build, which agents go first) before any build starts.

### 2026-11-06: Add change notes system

**What changed**
- `CLAUDE.md`: added a "Change notes" section requiring a detailed notes file per branch, updated in the same commit as every change.
- `notes/changes/TEMPLATE.md`: new template for branch notes files.
- `notes/changes/main.md`: this file, the notes file for `main`, with the history so far.
- `CHANGELOG.md`: new one-line summary log of merged work.

**Why**
Tim asked for Claude to keep detailed notes of every change made on each branch.

**Decisions**
One notes file per branch (rather than one big log) so each branch's history can be read on its own and survives after merging. `CHANGELOG.md` gives a short overview across branches.

**How to check it**
Open `CLAUDE.md` and read the "Change notes" section. Future commits should each come with an entry here or in their branch's notes file.

**Open items**
None.

### 2026-11-06: Add backup routine and .gitignore

**What changed**
- `CLAUDE.md`: added a "Backup routine" section (pull at start, commit and push after each piece of work, check nothing is unpushed before finishing, never force-push or commit secrets, use branches and PRs for big changes).
- `.gitignore`: new file excluding secrets (`.env`, keys), local Claude settings, OS and editor clutter, dependencies, build output and logs.

**Why**
Tim asked for CLAUDE.md to be set up so there is always a backup on GitHub.

**Decisions**
Push after every commit rather than at the end of a session, so GitHub is never more than one change behind.

**How to check it**
Read the "Backup routine" section of `CLAUDE.md`; run `git status` after a session and confirm nothing is left unpushed.

**Open items**
None.

### 2026-11-06: Create repository

**What changed**
- `README.md`: created by GitHub with the repo description.
- `CLAUDE.md`: starter instructions describing the `agents/` and `shared/` layout.

**Why**
Tim asked for a new private GitHub repo for his agent office.

**Decisions**
Private repo under the Pha1lbot account, named `agent-office`.

**How to check it**
Visit github.com/Pha1lbot/agent-office.

**Open items**
None.
