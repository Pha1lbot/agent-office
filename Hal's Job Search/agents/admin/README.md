# Ada (Admin)

Named Ada (after Ada Lovelace) on 2026-11-06. **Since then Ada is automation, not an AI agent: she costs no tokens.**

**Purpose:** all the rule-based office work that used to need an Admin subagent. Each Admin hand-off cost about 15k tokens for work a script does for free.

**What she does**
- **Tracker updates** through `shared/tools/tracker.py`, run by Tim or by the office when Hal edits roles.
- **Documents in Hal's template** (`shared/tools/make_docs.py`, using `cv_template.py`): when Wren drafts, Ada turns her `cv.json` and `cover-letter.md` into `cv.md`, Word copies and the PDFs `<Your_Name>_<Job_Title>_cv.pdf` and `<Your_Name>_<Job_Title>_cover_letter.pdf`, in Hal's default CV design (printed by Chrome or Edge). When Hal sets a role to *approved*, the office rebuilds the PDFs (`make_docs.py --pdf`); if he has edited a Word file, that PDF is made from his Word file with LibreOffice instead, so his edits are kept. She won't let a redraft overwrite a Word file Hal has edited.
- **Follow-up dates:** when Hal sets a role to *applied*, the next step becomes "Follow up if no reply by <7 days later>".
- **Fact check** (`shared/tools/fact_check.py`): every time Wren builds the Word files, it compares the CV and cover letter with the CV bank (figures, money, job titles, employers, dates, certifications, qualifications, emails). Anything it can't find goes in a "Fact check (Ada)" section of the role's `notes.md`, which the role page shows. It never changes the documents; Hal decides. It can't judge whether a reworded sentence is true: that's still Wren's rule and Hal's read.
- **The inbox** of Hal's changes for Tim, the duplicate checks, (this office does not save to GitHub: it only pulls).

**In the office:** Ada's desk has a little server box. Her character "types" whenever these scripts run.

**Inputs:** Hal's office edits; Tim's tracker commands.
**Outputs:** `jobs/tracker.json` and `tracker.md`, PDFs in `jobs/roles/<id>/`, fact-check notes in `jobs/roles/<id>/notes.md`.

**Instructions:** none (code in `shared/tools/` and `shared/office-view/src/`). The old subagent prompt `.claude/agents/admin.md` was removed.
