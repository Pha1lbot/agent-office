# Plan: Job Hunt v3, combining Tim's artifact dashboard with the Agent Office (approved 2026-11-07)

## Context

Tim built a Job Hunt dashboard as a claude.ai artifact (handover: `Job_Hunt_Dashboard_-_Handover.md`; source read in full, 2,048 lines). He prefers its function, feel and look to the office's Pipeline tab, and wants it as the template. It lacks what the office has:
- CVs and cover letters written by Wren
- interview prep by Cole
- verdicts and ranking
- the agents, docs and 3D office

**Tim's choices:**
- **Both, kept in sync.** The office (on his PC) becomes the main dashboard, rebuilt in the artifact's design. The artifact stays as his phone view, kept in step by a sync job.
- **Wren does the tailoring.** The artifact's Tailor dialog becomes a request to Wren: CV and letter in his template, fact-checked by Ada.
- **Lead finding:** a review queue that Hal handles, a daily search, and the job-alert email scan.

### What the artifact does well (taken as the template)
- **Layout:** a collapsible sidebar (Overview, Roles, Leads, Interviews, Next actions, CVs) and a Target card (pay, location, focus). It uses the Geist font in dark mode, with search under `/`, a "Saved" indicator, skeleton loading, designed empty states, toasts with Undo and keyboard-friendly dialogs.
- **Overview:** KPI tiles with count-up (active roles, applications sent, interviews, top of the pay range), an animated pipeline bar chart, an 8-week activity chart, upcoming interviews and the top next actions. A callout appears when new leads are waiting.
- **Leads, separate from Roles:**
  - each lead has a fit, a concern, list and track tags, a "posted" date and a CV picker
  - **To pipeline** moves a lead into Roles
  - dismissed leads can be restored
- **Find new leads:** a review queue fed by a daily web search and an Outlook job-alert scan. Each find is rated Strong, Possible or Weak, with Add, Dismiss and "Add all strong". Duplicates are caught by company and title.
- **CVs:**
  - a library of base and tailored versions
  - upload a .docx or .pdf and its text is pulled out
  - the Tailor dialog takes a job description, screenshots, a starting CV, a focus and Tim's saved rules, and gives a CV plus "What I changed" and "Gaps"
  - a viewer with copy, .md and Word download
- **Tim's rules:**
  - his two-page A4 CV template (`cv_template.py`, Chrome print-to-PDF)
  - contact details, with the corrected LinkedIn link
  - no education section, and "References available on request"
  - file names like `Tim Everard CV - <Company>.pdf`

### What the office adds
- Hal, Rita, Wren, Cole and Ada
- tracker history and the inbox that starts Hal automatically
- Word and PDF documents, cover letters and the Ada fact-check
- interview prep with editable talking points
- verdicts with automatic ranking, closing dates and follow-ups
- attachments, backup to GitHub, the token meter and the 3D office

## Stages: what each means and what happens

Every role moves through these stages. Tim moves a role by dragging it, using the stage menu or pressing a button. The team reacts automatically: Hal starts about 2 minutes after the last change. Only Tim applies, emails or submits anything.

| Stage | Means | What happens automatically | Who moves it on |
|---|---|---|---|
| **New finds** (review queue) | Rita's daily search or the email scan found it | Hal triages each find. Good ones (Strong or Possible) are added to Leads with a verdict. Clear mismatches (deal-breakers, pay under £50k) are dismissed with a reason Tim can see and undo | Hal; Tim can restore a dismissed find |
| **Lead** (was "To review") | Worth a look; not picked yet | Ranked best first (P1, P2…). If it came from Tim, or has no listing yet, Rita reads the advert and gives a fit score and a verdict (Apply, Maybe or Skip). "Ask Hal: worth applying?" asks again | Tim: **To pipeline** (shortlist) or **Dismiss** |
| **Shortlisted** | Tim wants to go for it | **Wren writes the tailored CV and cover letter** (in Tim's template, from the CV bank). **Ada fact-checks** both against the CV bank and builds the Word files. When they're done, Hal moves the role to Drafted | Hal → Drafted |
| **Drafted** | The CV and letter exist, waiting for Tim to check | Nothing until Tim acts. If Tim sets a role straight to Drafted and there's no CV yet, Wren writes one, as above. "Ask Wren for changes" sends his notes back to her | Tim: **Approve**, or ask for changes |
| **Approved** | Tim is happy with the documents | **Ada makes the PDFs** (`Tim_Everard_<Job_Title>_cv.pdf` and `Tim_Everard_<Job_Title>_cover_letter.pdf`). If no documents exist yet, Wren drafts first and the role goes back to Drafted | Tim, once he has applied himself |
| **Applied** | Tim has sent the application | **Ada sets a follow-up date** a week ahead ("Follow up if no reply by …"), which shows as overdue in Next actions | Tim: Interview, Offer or Rejected |
| **Interview** | An interview is booked | **Cole writes interview prep and key talking points.** Tim edits the points; Cole only adds suggestions. The date shows in Interviews and on the Overview | Tim |
| **Offer** | Tim has an offer | Nothing automatic | Tim |
| **Rejected** | The employer said no | Tim can give the reason; it feeds the preference reviews | Tim |
| **Dismissed** (was "Skipped") | Tim or Hal decided not to go for it | Kept with its reason, and can be restored. It feeds the preference reviews | Tim can restore |

In the artifact's Roles view, the first three stages after Lead (Shortlisted, Drafted, Approved) appear as one stage, "To apply". A small documents label shows where each role is: "Wren writing", "Ready to check" or "PDFs ready".

**File names:** `Tim_Everard_<Job_Title>_cv.pdf` and `..._cover_letter.pdf` (and `.docx`). The job title uses underscores and drops characters a file name can't hold, for example `Tim_Everard_Senior_Producer_cv.pdf`. If two roles share a title, the second adds the company, for example `Tim_Everard_Senior_Producer_Premier_cv.pdf`. The files a role already has keep their names; new and rebuilt ones use the new pattern.

## Approach

The source of truth stays `jobs/tracker.json` in git. The artifact becomes a synced copy that Tim can view and edit on his phone.

Work goes on branch `claude/youthful-hopper-alwu7m`, recreated from `main`. The old one was merged and deleted on GitHub, which is why the start-up pull failed. Delivery is in four pull requests, one per phase.

### Phase 1: The office dashboard in the artifact's design (`shared/office-view/public/`)
- **Design:** port the artifact's CSS tokens and components (sidebar, cards, KPI tiles, pills, chips, tables, dialogs, toasts, skeletons, empty states) into `style.css`, and load Geist from Google Fonts.
- **Navigation:** a new shell in `index.html` and `app.js`, with a sidebar of Overview, Roles, Leads, Interviews, Next actions, CVs and **Office** (the 3D scene and cards, unchanged). The routes are `#overview`, `#roles`, `#leads` and so on, plus `#role/<id>`.
- **Mapping our tracker onto its views:**
  - **Leads:** `found`, with `skipped` shown as Dismissed. They show the verdict badge, plus fit and concern from `verdict_why`, `notes` and the listing. **To pipeline** sets the role to `shortlisted`.
  - **Roles:** everything from `shortlisted` on. The stage pill groups our statuses into the artifact's stages, with a documents sub-status:

    | Artifact stage | Our statuses |
    |---|---|
    | To apply | shortlisted, drafted, approved |
    | Applied | applied |
    | Interview | interview |
    | Offer | offer |
    | Rejected | rejected |

  - The Board / List toggle stays as a Roles option, so drag-and-drop isn't lost.
- **Role page:** the existing Overview, Documents, Interview and Activity tabs, restyled, opened from any row.
- **New views:**
  - **Overview:** KPIs, the pipeline chart, the weekly chart from tracker history, upcoming interviews and top actions.
  - **Interviews:** from `interview_at`.
  - **Next actions:** the tracker actions, with add and tick.
  - **CVs:** the base CV (`cv-bank.md` and `default-cv.pdf`) and every role's tailored CV and letter, with view, Word and PDF.
  - **Target card:** read from `preferences.md`. Editing it asks Hal through the inbox.
- **Tailor dialog,** built from the artifact's: role, job description (paste, upload or screenshots), starting CV, focus and rules. Submitting saves the advert text and queues "Draft a tailored CV and cover letter: focus …" for Wren. The role then shows "Hal is on it", and the documents appear when they're ready. Rules are saved to `cv-rules.md` through a new server route.
- **Server:**
  - new routes: `POST /api/actions` (add and done), `POST /api/prefs/rules`, and the tailor request (extends `/request`)
  - text pulled from an uploaded CV with the existing upload, then `mammoth` and `pdfjs` on the page, pinned and served from `/vendor`
- **Kept:** today's `dashboard.js` and `role.js` logic where possible (drag-and-drop, talking points editor, uploads, `say()`), reused under the new shell.

### Phase 2: Tim's CV template and rules
- **Tim's files:** he uploads `cv_template.py` and `example-content.json` from the handover pack. They're not in this session. They go in `shared/tools/`.
- **Wren** (`.claude/agents/writer.md`) writes `cv.json` in that format, as well as `cv.md`.
- **Ada:**
  - `make_docs.py` builds `Tim_Everard_<Job_Title>_cv.pdf` and `_cover_letter.pdf` with `cv_template.py`, using Chrome or Chromium; `pandoc` stays for Word. Downloads use the same names. The role folder keeps `cv.md` and `cv.json` as the team's working files.
  - `fact_check.py` runs on the JSON
- **`cv-rules.md`** gains the rules from the handover:
  - contact details (phone, Gmail, `linkedin.com/in/tim-everard`)
  - "References available on request"
  - the file-name pattern `Tim_Everard_<Job_Title>_cv.pdf` (replacing the handover's `Tim Everard CV - <Company>.pdf`, at Tim's request)
  - two pages, page 1 with a sidebar

### Phase 3: Lead finding, with the review queue handled by Hal (built 2026-11-08: see the branch notes)
- **Queue:** a new `jobs/found.json` holds items (title, company, location, pay, link, posted, source, fit, why, concern, found_at), deduped by company and title against the tracker. A new `tracker.py found add|list|take|dismiss` manages it.
- **Daily search:** a scheduled cloud task, "Rita's daily search". It replaces the artifact's 06:31 task, whose prompt becomes this one with Tim's OK. It runs Rita's search of the `sources.md` sites (plus the email scan below), writes to `found.json`, commits and pushes.
- **Job-alert email scan:** the same task, with the Microsoft 365 connector granted. It reads the "Job Alerts" folder and the last two weeks of job emails, and pulls out roles, following the artifact's prompt.
- **Hal triages the queue** (new "Office changes" task "Triage new finds"):
  - Strong and Possible finds are added to Leads, with a verdict and reason
  - clear mismatches (deal-breakers, pay under £50k) are dismissed with a reason
  - nothing is shortlisted without Tim
- **Office:** a "New leads" dialog like the artifact's shows what Hal added and dismissed today, with Undo / Restore. The Overview callout shows "N new leads".

### Phase 4: Sync with the artifact (phone view)
- **One-off import:** Tim's current artifact data (roles, leads, actions, CV list, `cvRules`, target, for user `u_dHrNh0gdcIvLTY09VvS7WA`) is merged into the tracker with the existing `import_dashboard.py`, extended. That picks up the Chelsea and Hexagon changes since the 6 November import.
- **Sync job:** a scheduled cloud task every 2 hours, plus "/hal sync". Claude only moves the data (cheap). `shared/tools/sync_artifact.py` does the merge:
  - it reads the artifact's `state` doc with the artifact database tools, and writes it to a temp file
  - `sync_artifact.py merge` matches on ids and is careful with timestamps. Where both sides changed, the newer field wins. Changes Tim made on his phone become tracker changes with `--by tim`, so the inbox and Hal react to them as usual.
  - it writes the merged view back with `ifVersion`, and never overwrites without reading first
  - documents are pushed as CV docs (`cv-<id>`: CV, cover letter, prep and talking points as markdown), so the phone shows them
- **Artifact changes** (Tim's copy and the template, slugs from the handover):
  - show the verdict, the cover letter, interview prep and talking points
  - the Tailor button becomes "Ask Wren", writing to a `requests` doc that the sync carries into the inbox
  - show the last sync time
- **Build Log:** a line in the artifact's Build Log for each change.

## Critical files
- **`shared/office-view/public/`:** `index.html`, `style.css`, `app.js`, `dashboard.js` (split into `overview.js`, `leads.js`, `roles.js`, `cvs.js`), `role.js`, `util.js`
- **`shared/office-view/src/`:** `server.ts`, `roles.ts`, plus tests
- **`shared/tools/`:** `tracker.py` (found queue, actions), `make_docs.py`, `fact_check.py`, `cv_template.py` (new, from Tim), `sync_artifact.py` (new), `import_dashboard.py`
- **Agent instructions:** `.claude/agents/writer.md`, `lead-recruiter.md`, and `.claude/skills/cos/SKILL.md` (triage, tailor requests, sync)
- **Rules:** `shared/job-search/cv-rules.md`
- **Docs:** READMEs and notes (`notes/changes/claude-youthful-hopper-alwu7m.md`), plus CHANGELOG lines after each merge

## Verification
- **Each phase:** `npm test`, `tsc`, and new Python tests (the found queue, sync merge rules including conflicts and phone edits becoming inbox items).
- **Phase 1:** Playwright against a throwaway copy with the fake agents:
  - every sidebar view shows real tracker data
  - **To pipeline**, stage changes and Next actions all work
  - Tailor queues Wren
  - the role page tabs still work
  - no sideways scroll at phone width
  - screenshots for Tim
- **Phase 2:** build the Chelsea example from `example-content.json` and compare it with Tim's PDF. Wren's JSON passes the fact-check.
- **Phase 3:** a dry run of the search task in this cloud session, writing to a test `found.json`, then Hal triage on it.
- **Phase 4:** sync dry-run against the **template** artifact first. It has no personal data, so it's safe for both directions. Then Tim's copy, with a backup of the `state` doc saved first.

## Open items for Tim
- Upload `cv_template.py` and `example-content.json` (phase 2).
- Confirm the artifact's 06:31 search task can be repointed or retired (phase 3).
- The sync and search tasks run in the cloud, using his Claude usage. Each sync run is small.
