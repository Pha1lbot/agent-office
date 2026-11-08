# Jobs

The job-search team's working data.

- `tracker.json`: one record per role. The source of truth, and what the office view's dashboard will read. Only change it with `shared/tools/tracker.py` (Hal runs it, and the office runs it when Tim edits roles).
- `tracker.md`: a readable table built from `tracker.json`. Do not edit by hand.
- `today.md`: Hal's priority list for the day.
- `preference-reviews.md`: suggested changes to Tim's preferences and which he accepted.
- `roles/<role-id>/`: one folder per role:
  - `advert.txt` (optional): the advert Tim pasted in, when the page needs a login.
  - `listing.md`: Rita's short summary of the advert, with the link, fit and verdict.
  - `cv.json`, `cover-letter.md`: Wren's drafts. `cv.json` is the CV in Tim's template format (see `shared/tools/cv_template.py`).
  - `cv.md`: the CV as text, made by Ada from `cv.json` (roles drafted before 2026-11-08 have only this).
  - `cv.docx`, `cover-letter.docx`: plain Word copies Tim can edit.
  - `Tim_Everard_<Job_Title>_cv.pdf`, `Tim_Everard_<Job_Title>_cover_letter.pdf`: the documents to send, in Tim's CV template. Ada makes them when Wren drafts and again when Tim approves. Older roles may have `cv.pdf` and `cover-letter.pdf` instead.
  - `.ada-built.json`: fingerprints of the Word files Ada made, so she can tell when Tim has edited one.
  - `notes.md` (optional): Wren's questions for Tim about gaps between the advert and his CV, plus Ada's fact check if it found anything to check.
  - `talking-points.md`, `interview-prep.md`: Cole's interview prep. Tim edits the talking points; Cole never overwrites them.
  - `attachments/` (optional): files Tim uploads on the role page.

Role statuses, in order: found → shortlisted → drafted → approved → applied → interview → offer / rejected / skipped.
