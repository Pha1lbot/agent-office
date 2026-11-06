# Chief of Staff

**Purpose:** runs the job-search team. The only agent Tim talks to. Sets the day's priorities, hands work to the other agents and keeps handovers short to save tokens.

**How to start it:** in Claude Code in this repo, type `/cos start the day`.

**Instructions:** `.claude/skills/cos/SKILL.md`. It runs in the main Claude Code session, so it uses whichever model the session is on. Sonnet is enough (`/model sonnet`).

**Inputs**
- Tim's requests ("start the day", "approve <role>", "I applied to <role>").
- `shared/job-search/preferences.md` (daily limits and what Tim wants).
- `python3 shared/tools/tracker.py list --summary`.
- Short replies from the other agents.

**Outputs**
- `jobs/today.md`: the day's priority list.
- Short briefs to Lead Recruiter, Senior Admin and Admin.
- PDFs of approved documents (via `make_docs.py --pdf`).
- Commits and pushes after each step.
