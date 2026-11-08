# Ada (Admin)

Named Ada (after Ada Lovelace) on 2026-11-06. **Since then Ada is automation, not an AI agent: she costs no tokens.**

**Purpose:** all the rule-based office work that used to need an Admin subagent. Each Admin hand-off cost about 15k tokens for work a script does for free.

**What she does**
- **Tracker updates** through `shared/tools/tracker.py`, run by Hal or by the office when Tim edits roles.
- **Documents in Tim's template** (`shared/tools/make_docs.py`, using `cv_template.py`): when Wren drafts, Ada turns her `cv.json` and `cover-letter.md` into `cv.md`, Word copies and the PDFs `Tim_Everard_<Job_Title>_cv.pdf` and `Tim_Everard_<Job_Title>_cover_letter.pdf`, in Tim's default CV design (printed by Chrome or Edge). When Tim sets a role to *approved*, the office rebuilds the PDFs (`make_docs.py --pdf`); if he has edited a Word file, that PDF is made from his Word file with LibreOffice instead, so his edits are kept. She won't let a redraft overwrite a Word file Tim has edited.
- **Follow-up dates:** when Tim sets a role to *applied*, the next step becomes "Follow up if no reply by <7 days later>".
- **Fact check** (`shared/tools/fact_check.py`): every time Wren builds the Word files, it compares the CV and cover letter with the CV bank (figures, money, job titles, employers, dates, certifications, qualifications, emails). Anything it can't find goes in a "Fact check (Ada)" section of the role's `notes.md`, which the role page shows. It never changes the documents; Tim decides. It can't judge whether a reworded sentence is true: that's still Wren's rule and Tim's read.
- **The inbox** of Tim's changes for Hal, the duplicate checks, and the **GitHub backup** of office edits.

**In the office:** Ada's desk has a little server box. Her character "types" whenever these scripts run.

**Inputs:** Tim's office edits; Hal's tracker commands.
**Outputs:** `jobs/tracker.json` and `tracker.md`, PDFs in `jobs/roles/<id>/`, fact-check notes in `jobs/roles/<id>/notes.md`, "Office:" commits.

**Instructions:** none (code in `shared/tools/` and `shared/office-view/src/`). The old subagent prompt `.claude/agents/admin.md` was removed.
