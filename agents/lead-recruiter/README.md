# Lead Recruiter

**Purpose:** finds new roles that match Tim's skills, experience and pay, on the sites Tim lists.

**Instructions:** `.claude/agents/lead-recruiter.md` (a Claude Code subagent, model: Sonnet). Called by Chief of Staff.

**Inputs**
- Brief from Chief of Staff (how many roles).
- `shared/job-search/preferences.md`, `shared/job-search/sources.md`, Tim's CV.
- `tracker.py list`, to skip roles already tracked.

**Outputs**
- `jobs/roles/<role-id>/listing.md` for each role: link, pay, location, fit score, requirements, keywords, gaps.
- One line per role back to Chief of Staff.

**Tools:** web search and page fetching. It cannot sign in to sites or apply.
