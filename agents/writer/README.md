# Wren (Writer)

Formerly "Senior Admin". Named Wren on 2026-11-06.

**Purpose:** writes a tailored CV and cover letter for each role Tim shortlists, from his CV text bank, and builds the Word files.

**Instructions:** `.claude/agents/writer.md` (a Claude Code subagent, model: Sonnet). Briefed by Hal, once per batch of roles.

**Inputs**
- Shortlisted role ids from Hal, or the changes Tim asked for in his own words.
- `shared/job-search/cv/cv-bank.md` (never the PDF) and any `extra-*.md` files.
- `shared/job-search/cv-rules.md` (Tim's writing rules).
- `jobs/roles/<role-id>/listing.md`.

**Outputs**
- `jobs/roles/<role-id>/cv.md` and `cover-letter.md`, then `cv.docx` and `cover-letter.docx` (via `shared/tools/make_docs.py`).
- `jobs/roles/<role-id>/notes.md` when the advert asks for something the CV doesn't show.

**Rules:** never invents experience. Ada's fact check runs each time the Word files are built and lists anything not in the CV bank in `notes.md`. PDFs are Ada's job, once Tim approves. Interview prep is Cole's job.
