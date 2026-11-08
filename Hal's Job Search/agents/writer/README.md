# Wren (Writer)

Formerly "Senior Admin". Named Wren on 2026-11-06.

**Purpose:** writes a tailored CV and cover letter for each role Hal shortlists, from his CV text bank, in Hal's CV template.

**Instructions:** `.claude/agents/writer.md` (a Claude Code subagent, model: Sonnet). Briefed by Tim, once per batch of roles.

**Inputs**
- Shortlisted role ids from Tim, or the changes Hal asked for in his own words.
- `shared/job-search/cv/cv-bank.md` (never the PDF) and any `extra-*.md` files.
- `shared/job-search/cv-rules.md` (Hal's writing rules).
- `shared/job-search/cv/base-cv.json` (Hal's default CV in the template's format).
- `jobs/roles/<role-id>/listing.md`.

**Outputs**
- `jobs/roles/<role-id>/cv.json` (only what changes from the base CV) and `cover-letter.md` (just the letter).
- From those, Ada (`shared/tools/make_docs.py`) makes `cv.md`, `cv.docx`, `cover-letter.docx`, and the PDFs `<Your_Name>_<Job_Title>_cv.pdf` and `<Your_Name>_<Job_Title>_cover_letter.pdf` in Hal's template.
- `jobs/roles/<role-id>/notes.md` when the advert asks for something the CV doesn't show.

**Rules:** never invents experience. Ada's fact check runs each time the Word files are built and lists anything not in the CV bank in `notes.md`. Name and contact details always come from the base CV, so they can't be mistyped. Ada won't let a redraft overwrite a Word file Hal has edited. Interview prep is Cole's job.
