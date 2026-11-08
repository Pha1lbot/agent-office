# Cass (Chief of Staff)

Cass is the Chief of Staff: the one you talk to. (In Tim's Job Search the same role is called Hal; it is renamed here so there aren't two Hals.) Start a session with `/cos`.

**Purpose:** runs the job-search team. The only agent Hal talks to. Sets the day's priorities, hands work to the other agents and keeps handovers short to save tokens.

**How to start it:** in Claude Code in this repo, type `/cos start the day`.

**Instructions:** `.claude/skills/cos/SKILL.md`. It runs in the main Claude Code session, so it uses whichever model the session is on. Sonnet is enough (`/model sonnet`).

**Inputs**
- Hal's requests ("start the day", "approve <role>", "I applied to <role>").
- An optional scheduled task that runs `/cass daily search` in the cloud each weekday morning. Hal's office doesn't have one yet: `GUIDE.md` explains how to set one up.
- Hal's job-alert emails in Outlook, through the Microsoft 365 connector (daily search only).
- `shared/job-search/preferences.md` (daily limits and what Hal wants).
- `python3 shared/tools/tracker.py list --summary`.
- Short replies from Rita, Wren and Cole.

**Outputs**
- `jobs/today.md`: the day's priority list.
- The review queue `jobs/found.json`: Cass adds Rita's and the email scan's finds (`tracker.py found add`), then sorts each into Leads or Dismissed with a reason (`tracker.py found take`).
- Short briefs to Rita (Lead Recruiter), Wren (Writer) and Cole (Interview Coach), one per batch.
- Tracker changes, made by Cass with `tracker.py` (no Admin hand-off), including each role's verdict (`verdict=apply|maybe|skip`, `verdict_why=`). Ada ranks the To review roles from these automatically.
- PDFs of approved documents (via `make_docs.py --pdf`).
- Commits and pushes after each step.
