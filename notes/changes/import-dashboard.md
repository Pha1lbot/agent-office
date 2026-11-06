# Branch: import-dashboard

**Started:** 2026-11-06
**Status:** In progress

## Purpose

Tim had already built a job-tracking dashboard as a claude.ai artifact ("Job Hunt – Tim", https://claude.ai/artifact/52hKGuj9F8r3BptuFGFHxq). He asked whether its data could be pulled into the office and said: "Ideally everything will move and live in the office space". This branch moves its roles, leads, next actions, tailored CVs and CV writing rules into the agents' tracker and repo, so the office becomes the one place for the job search.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-06: Import the Job Hunt dashboard into the tracker

**What changed**
- `jobs/imports/2026-11-06-job-hunt-dashboard.json`: the dashboard's data as read from its database (the `state` document, plus `cv-cvchelsea` and `cv-cvhexagon`), kept as the record of what was imported.
- `shared/tools/import_dashboard.py`: new import tool.
  - Dashboard roles and leads become tracker roles. Role stages map: To apply → shortlisted (or approved if a tailored CV already exists), Applied/Interview/Offer/Rejected as they are, Closed → skipped. Lead statuses map: New → found, Shortlist → shortlisted, Dismissed → skipped.
  - Matches existing roles by LinkedIn job number, advert link, or company and title. When matched, the further-on status wins and empty fields are filled in.
  - Imports next actions. Writes tailored CV texts, CV notes and job descriptions into `jobs/roles/<id>/` without overwriting anything.
  - Safe to run again.
- `shared/tools/tracker.py`:
  - New role fields: `next`, `cv`, `interview_at`, `interview_with`, `list`.
  - New `action add/done/list` commands for Tim's next actions.
  - `tracker.md` gains "Next actions" and "Interviews" sections and a "Next step" column.
  - `list --summary` now shows actions and interviews, and only counts unreviewed "found" roles rather than listing them, to save tokens now there are many.
- `jobs/tracker.json`, `jobs/tracker.md`: after the import, 52 roles (41 found, 6 shortlisted, 1 approved, 2 applied, 2 skipped) and 4 actions (3 to do).
- `jobs/roles/2026-11-06-chelsea-fc-.../`: `cv.md`, `notes.md` and `listing.md` (job description) from the dashboard. `jobs/roles/2026-11-06-hexagon-world-series-.../`: `cv.md` and `notes.md`; the Recruiter's `listing.md` was kept.
- `shared/job-search/cv-rules.md`: Tim's CV writing rules from the dashboard.
- `shared/job-search/preferences.md`: ideal salary set to £60,000+, as Tim chose ("£50k floor, £60k+ ideal"), and sport moved up the sector list to match the dashboard's target.
- `.claude/agents/senior-admin.md`: reads `cv-rules.md`; starts from an existing `cv.md` if a role has one.
- `.claude/agents/admin.md`: how to set the new fields and manage actions.
- `.claude/skills/cos/SKILL.md`: notes actions, interviews and next steps at the start of the day; ranks today's new roles using the £60k ideal; handles Tim's next steps, actions and interviews.

**Why**
Tim wants everything from his dashboard to live in the office.

**Decisions**
- The import runs through Claude, reading the dashboard's database with the artifact data tool. The office on Tim's PC can't read the dashboard itself, because its data sits behind his claude.ai login.
- A one-off import, not a continuing sync, because the office is now the master. The dashboard was left unchanged; nothing was written back to it.
- 6 dashboard items matched roles the agents had already found today (Hexagon twice, as a role and a lead; Chelsea from role and lead; Epic; both Blank Space roles), so nothing is duplicated.
- Hexagon becomes "approved" (ready to apply), because the dashboard had it as "To apply" with a tailored CV made. Chelsea and Razer are "applied".
- Dashboard "Closed" roles became "skipped", with the dashboard's last next step kept as the reason (e.g. "Declined: unpaid").
- The dashboard's "search" document (its own scan history) was not imported; it isn't needed in the office.

**How to check it**
- Tested on a copy of the tracker first: 45 added, 6 merged, 4 actions, 5 CV files. A second run added nothing.
- `python3 shared/tools/tracker.py list --summary` shows the totals, 3 next actions, and the open roles with their next steps.
- The action commands were tested: add, done, list, and an unknown id gives an error.

**Open items**
- The office page needs to show next steps, actions and interviews (next commit).
- The dashboard's "Razer CV" and "Main CV v3" are files on Tim's PC, not text in the dashboard, so they weren't imported; only their names are recorded on roles. "Strategy-led CV (to make)" is kept as a next action.
- Many imported leads have no fit score; the Recruiter or Chief of Staff can score them when reviewing.

