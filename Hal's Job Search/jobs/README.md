# Jobs

The job-search team's working data.

- `tracker.json`: one record per role. The source of truth, and what the office view's dashboard will read. Only change it with `shared/tools/tracker.py` (Cass runs it, and the office runs it when Hal edits roles).
- `tracker.md`: a readable table built from `tracker.json`. Do not edit by hand.
- `today.md`: Cass's priority list for the day.
- `preference-reviews.md`: suggested changes to Hal's preferences and which were accepted.
- `roles/<role-id>/`: one folder per role:
  - `advert.txt` (optional): the advert Hal pasted in, when the page needs a login.
  - `listing.md`: Rita's short summary of the advert, with the link, fit and verdict.
  - `cv.json`, `cover-letter.md`: Wren's drafts. `cv.json` is the CV in Hal's template format (see `shared/tools/cv_template.py`).
  - `cv.md`: the CV as text, made by Ada from `cv.json` (roles drafted before 2026-11-08 have only this).
  - `cv.docx`, `cover-letter.docx`: plain Word copies Hal can edit.
  - `<Your_Name>_<Job_Title>_cv.pdf`, `<Your_Name>_<Job_Title>_cover_letter.pdf`: the documents to send, in Hal's CV template. Ada makes them when Wren drafts and again when Hal approves. Older roles may have `cv.pdf` and `cover-letter.pdf` instead.
  - `.ada-built.json`: fingerprints of the Word files Ada made, so she can tell when Hal has edited one.
  - `notes.md` (optional): Wren's questions for Hal about gaps between the advert and their CV, plus Ada's fact check if it found anything to check.
  - `talking-points.md`, `interview-prep.md`: Cole's interview prep. Hal edits the talking points; Cole never overwrites them.
  - `attachments/` (optional): files Hal uploads on the role page.

Role statuses, in order: found → shortlisted → drafted → approved → applied → interview → offer / rejected / skipped.
