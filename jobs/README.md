# Jobs

The job-search team's working data.

- `tracker.json`: one record per role. The source of truth, and what the office view's dashboard will read. Only change it with `shared/tools/tracker.py` (the Admin agent does this).
- `tracker.md`: a readable table built from `tracker.json`. Do not edit by hand.
- `today.md`: Chief of Staff's priority list for the day.
- `preference-reviews.md`: suggested changes to Tim's preferences and which he accepted.
- `roles/<role-id>/`: one folder per role:
  - `listing.md`: Lead Recruiter's short summary of the advert, with the link.
  - `cv.md`, `cover-letter.md`: Senior Admin's drafts.
  - `cv.docx`, `cover-letter.docx`: Word versions for Tim to check.
  - `cv.pdf`, `cover-letter.pdf`: made only after Tim approves.
  - `notes.md` (optional): gaps between the advert and Tim's CV, questions for Tim.

Role statuses, in order: found → shortlisted → drafted → approved → applied → interview → offer / rejected / skipped.
