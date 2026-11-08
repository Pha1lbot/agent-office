# Cole (Interview Coach)

New on 2026-11-06.

**Purpose:** gets Hal ready for interviews: key talking points and prep notes for each role at interview stage.

**Instructions:** `.claude/agents/interview-coach.md` (a Claude Code subagent, model: Sonnet). Briefed by Cass when Hal sets a role to *interview*, or asks to refresh prep.

**Inputs**
- Role ids from Cass.
- `shared/job-search/cv/cv-bank.md` (never the PDF).
- The role's `listing.md`, and the `cv.md` and `cover-letter.md` Hal sent.
- The interview time and who it's with (from the tracker).
- At most two quick web lookups about the company.

**Outputs**
- `jobs/roles/<role-id>/talking-points.md`: 5 to 7 key points. **Hal edits these; Cole never overwrites them**, he only adds "Suggestions from Cole".
- `jobs/roles/<role-id>/interview-prep.md`: the company, likely questions with answer plans, gaps, questions to ask, practical details.
