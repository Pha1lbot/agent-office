# Senior Admin

**Purpose:** takes Chief of Staff's shortlist and writes a tailored CV and cover letter for each role from Tim's default CV.

**Instructions:** `.claude/agents/senior-admin.md` (a Claude Code subagent, model: Sonnet). Called by Chief of Staff.

**Inputs**
- Shortlisted role ids from Chief of Staff, or changes Tim asked for.
- `shared/job-search/cv/default-cv.*` (and any `extra-*.md`).
- `jobs/roles/<role-id>/listing.md`.

**Outputs**
- `jobs/roles/<role-id>/cv.md` and `cover-letter.md`, then `cv.docx` and `cover-letter.docx` (via `shared/tools/make_docs.py`).
- `jobs/roles/<role-id>/notes.md` when the advert asks for something the CV does not show.

**Rule:** never invents experience, dates, qualifications or skills. PDFs are made only after Tim approves.
