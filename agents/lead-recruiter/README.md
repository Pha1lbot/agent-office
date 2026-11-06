# Rita (Lead Recruiter)

Named Rita on 2026-11-06.

**Purpose:** finds new roles that match Tim's skills, experience and pay, on the sites Tim lists.

**Instructions:** `.claude/agents/lead-recruiter.md` (a Claude Code subagent, model: Sonnet). Briefed by Hal.

**Inputs**
- Brief from Hal (how many roles).
- `shared/job-search/preferences.md`, `shared/job-search/sources.md`, the matching summary in `shared/job-search/cv/cv-bank.md`.
- `tracker.py list`, to skip roles already tracked.

**Outputs**
- `jobs/roles/<role-id>/listing.md` for each role: link, pay, location, fit score, requirements, keywords, gaps, and a verdict (Apply / Maybe / Skip, with reasons for and against).
- For a role Tim pasted in, she reads `advert.txt` instead of the link. Asked for a verdict only, she reads just the listing and Tim's preferences.
- One line per role back to Hal.

**Tools:** web search and page fetching. It cannot sign in to sites or apply.
