import { test } from "node:test";
import assert from "node:assert/strict";
import { plainTool } from "../src/plain.ts";

test("tool calls become plain phrases", () => {
  const cases: [string, string, string][] = [
    ["Bash", "python3 shared/tools/tracker.py list --summary", "checking roles"],
    ["Bash", "python3 shared/tools/tracker.py set acme status=applied", "updating the role list"],
    ["Bash", "python3 shared/tools/make_docs.py --pdf acme", "making PDFs"],
    ["Bash", "python3 shared/tools/make_docs.py acme", "building Word files"],
    ["Bash", "git pull", "getting the latest from GitHub"],
    ["Bash", "git push", "saving to GitHub"],
    ["Bash", "git status", "checking saved work"],
    ["Bash", "ls -la", "running a task"],
    ["Bash", "Add 8 new roles to the tracker", "updating the role list"],
    ["Bash", "List open roles in the tracker", "checking roles"],
    ["Bash", "Make PDFs for the approved role", "making PDFs"],
    ["Read", "jobs/roles/acme/listing.md", "reading an advert summary"],
    ["Read", "shared/job-search/cv/cv-bank.md", "reading a CV"],
    ["Read", "jobs/roles/acme/talking-points.md", "reading interview notes"],
    ["Write", "jobs/roles/acme/cover-letter.md", "writing a cover letter"],
    ["Write", "jobs/roles/acme/cv.json", "writing a CV"],
    ["Edit", "jobs/today.md", "writing today's list"],
    ["Write", "C:\\work\\jobs\\roles\\acme\\interview-prep.md", "writing interview notes"],
    ["WebSearch", "head of esports operations", "searching job sites"],
    ["WebFetch", "https://hitmarker.net/jobs", "reading an advert online"],
    ["mcp__Microsoft_365__outlook_email_search", "jobs", "checking job alert emails"],
    ["mcp__other__thing", "", "using a connected service"],
    ["Mystery", "", "working"],
  ];
  for (const [tool, target, want] of cases) assert.equal(plainTool(tool, target), want, `${tool} ${target}`);
});
