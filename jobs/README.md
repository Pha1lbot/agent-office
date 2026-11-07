# Jobs

The job-search team's working data.

- `tracker.json`: one record per role. The source of truth, and what the office view's dashboard will read. Only change it with `shared/tools/tracker.py` (Hal runs it, and the office runs it when Tim edits roles).
- `tracker.md`: a readable table built from `tracker.json`. Do not edit by hand.
- `today.md`: Hal's priority list for the day.
- `preference-reviews.md`: suggested changes to Tim's preferences and which he accepted.
- `roles/<role-id>/`: one folder per role:
  - `advert.txt` (optional): the advert Tim pasted in, when the page needs a login.
  - `listing.md`: Rita's short summary of the advert, with the link, fit and verdict.
  - `cv.md`, `cover-letter.md`: Wren's drafts.
  - `cv.docx`, `cover-letter.docx`: Word versions for Tim to check.
  - `cv.pdf`, `cover-letter.pdf`: made by Ada only after Tim approves.
  - `notes.md` (optional): Wren's questions for Tim about gaps between the advert and his CV, plus Ada's fact check if it found anything to check.
  - `talking-points.md`, `interview-prep.md`: Cole's interview prep. Tim edits the talking points; Cole never overwrites them.
  - `attachments/` (optional): files Tim uploads on the role page.

Role statuses, in order: found → shortlisted → drafted → approved → applied → interview → offer / rejected / skipped.
