// Fake agents: act out a typical job-search day so the office can be seen
// working without running Claude (no tokens used). Sends the same reports the
// real hooks send.
//
//   npm run fake            loops until Ctrl+C
//   npm run fake -- --once  plays the day once
//   npm run fake -- --fast  three times faster

import type { Report } from "../src/office.ts";

const PORT = process.env.OFFICE_PORT || 4747;
const BRIDGE = `http://127.0.0.1:${PORT}/report`;
const ONCE = process.argv.includes("--once");
const SPEED = process.argv.includes("--fast") ? 3 : 1;
const BASE: Partial<Report> = { session_id: "fake-session-0001", cwd: "/fake/agent-office" };

const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms / SPEED));

async function send(hook_event_name: string, extra: Partial<Report> = {}) {
  try {
    await fetch(BRIDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...BASE, hook_event_name, ...extra }),
    });
  } catch {
    console.error(`Can't reach the office at ${BRIDGE}. Start it first with: npm start`);
    process.exit(1);
  }
}

/** One tool call by an agent (agent_type unset = the main session, Chief of Staff). */
async function tool(tool_name: string, target: string, ms: number, agent_type?: string) {
  await send("PreToolUse", { tool_name, target, agent_type });
  await sleep(ms);
  await send("PostToolUse", { tool_name, agent_type });
  await sleep(400);
}

/** Chief of Staff briefs a subagent, the subagent works, then reports back. */
async function delegate(subagent_type: string, description: string, work: () => Promise<void>) {
  await send("PreToolUse", { tool_name: "Task", subagent_type, description });
  await sleep(800);
  await work();
  await send("SubagentStop", { agent_type: subagent_type });
  await send("PostToolUse", { tool_name: "Task", subagent_type });
  await sleep(1200);
}

async function day() {
  console.log("Morning: Tim says 'start the day'");
  await send("SessionStart");
  await sleep(1500);
  await send("UserPromptSubmit");
  await tool("Bash", "List open roles in the tracker", 1500);
  await tool("Read", "shared/job-search/preferences.md", 2000);

  await delegate("lead-recruiter", "Find up to 10 new roles", async () => {
    const r = "lead-recruiter";
    await tool("Read", "shared/job-search/sources.md", 2500, r);
    await tool("WebSearch", "data analyst Manchester hybrid", 4000, r);
    await tool("WebFetch", "reed.co.uk/jobs/data-analyst-jobs-in-manchester", 4000, r);
    await tool("Write", "jobs/roles/acme-ltd-data-analyst/listing.md", 2500, r);
    await tool("WebFetch", "indeed.co.uk/q-bi-analyst-remote-jobs", 4000, r);
    await send("Notification", { message: "Claude needs your permission to use WebFetch", agent_type: r });
    await sleep(5000);
    await tool("Write", "jobs/roles/northwind-bi-analyst/listing.md", 2500, r);
  });

  await delegate("admin", "Add 8 new roles to the tracker", async () => {
    await tool("Bash", "Add roles to the tracker", 3500, "admin");
    await tool("Bash", "List open roles in the tracker", 1500, "admin");
  });

  await tool("Write", "jobs/today.md", 2500);
  await send("Stop");
  console.log("Chief of Staff waits for Tim to pick roles");
  await sleep(10000);

  await send("UserPromptSubmit");
  await delegate("senior-admin", "Draft CVs for 2 shortlisted roles", async () => {
    const s = "senior-admin";
    await tool("Read", "shared/job-search/cv/default-cv.md", 2500, s);
    await tool("Read", "jobs/roles/acme-ltd-data-analyst/listing.md", 2000, s);
    await tool("Write", "jobs/roles/acme-ltd-data-analyst/cv.md", 5000, s);
    await tool("Write", "jobs/roles/acme-ltd-data-analyst/cover-letter.md", 4000, s);
    await tool("Bash", "Build the Word files", 2500, s);
  });
  await delegate("admin", "Mark 2 roles as drafted", async () => {
    await tool("Bash", "Set status to drafted", 2500, "admin");
  });
  await send("Stop");
  console.log("Drafts ready for Tim to check");
  await sleep(12000);
}

console.log(`Sending fake agents to the office at ${BRIDGE}${SPEED > 1 ? " (fast)" : ""}`);
do await day(); while (!ONCE);
await send("SessionEnd");
