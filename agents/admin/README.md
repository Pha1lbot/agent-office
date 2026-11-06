# Admin

**Purpose:** keeps the role tracker up to date. The tracker is the data behind Tim's dashboard (a tab in the office view, coming next).

**Instructions:** `.claude/agents/admin.md` (a Claude Code subagent, model: Haiku, the cheapest). Called by Chief of Staff.

**Inputs**
- Briefs from Chief of Staff: new roles to add, statuses, priorities and notes to change.
- `jobs/roles/<role-id>/listing.md` for new roles' details.

**Outputs**
- `jobs/tracker.json` and `jobs/tracker.md`, changed only through `shared/tools/tracker.py`.
- A one-line totals summary back to Chief of Staff.
