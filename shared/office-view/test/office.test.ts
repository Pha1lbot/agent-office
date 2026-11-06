import { test } from "node:test";
import assert from "node:assert/strict";
import { Office, IDLE_TO_ASLEEP_MS, WAITING_TO_ASLEEP_MS, BUSY_TIMEOUT_MS, type Report } from "../src/office.ts";

const S = { session_id: "abc12345-0000", cwd: "C:\\Users\\Tim\\agent-office" };
const r = (hook_event_name: string, extra: Partial<Report> = {}): Report => ({ ...S, hook_event_name, ...extra });
const brief = (type: string, extra: Partial<Report> = {}) =>
  r("PreToolUse", { tool_name: "Task", subagent_type: type, description: "Find 10 roles", ...extra });

test("the four team members start asleep at their desks", () => {
  const o = new Office(0);
  assert.deepEqual(o.snapshot().map((a) => [a.id, a.state]), [
    ["chief-of-staff", "asleep"], ["lead-recruiter", "asleep"], ["senior-admin", "asleep"], ["admin", "asleep"],
  ]);
});

test("a session in the agent-office folder is Chief of Staff (Windows or Unix paths)", () => {
  for (const cwd of ["C:\\Users\\Tim\\agent-office", "/home/tim/agent-office/shared/office-view"]) {
    const o = new Office(0);
    assert.deepEqual(o.handle({ ...S, cwd, hook_event_name: "UserPromptSubmit" }, 1), ["chief-of-staff"]);
    assert.equal(o.agents.get("chief-of-staff")!.state, "typing");
  }
});

test("sessions in other folders get a visitor desk named after the folder", () => {
  const o = new Office(0);
  const [id] = o.handle({ session_id: "zzz99999", cwd: "/home/tim/other-project", hook_event_name: "SessionStart" }, 1);
  assert.equal(id, "session-zzz99999");
  assert.equal(o.agents.get(id)!.name, "other-project");
  assert.equal(o.agents.get(id)!.team, false);
  assert.equal(o.agents.get(id)!.state, "idle");
});

test("briefing a subagent puts it to work and Chief of Staff waits on it", () => {
  const o = new Office(0);
  o.handle(brief("lead-recruiter"), 1);
  const rec = o.agents.get("lead-recruiter")!, cos = o.agents.get("chief-of-staff")!;
  assert.equal(rec.state, "typing");
  assert.equal(rec.detail, "Find 10 roles");
  assert.equal(cos.state, "idle");
  assert.equal(cos.detail, "Waiting on Lead Recruiter");
  assert.match(cos.log.at(-1)!.text, /Briefed Lead Recruiter/);
});

test("tool calls go to the subagent named in the hook", () => {
  const o = new Office(0);
  o.handle(r("PreToolUse", { tool_name: "Bash", agent_type: "admin", target: "tracker.py list" }), 1);
  const admin = o.agents.get("admin")!;
  assert.equal(admin.state, "typing");
  assert.equal(admin.detail, "Bash tracker.py list");
  assert.equal(admin.tools, 1);
  assert.equal(o.agents.get("chief-of-staff")!.tools, 0);
});

test("without a subagent name, tool calls go to the running subagent", () => {
  const o = new Office(0);
  o.handle(brief("lead-recruiter"), 1);
  o.handle(r("PreToolUse", { tool_name: "WebSearch", target: "data analyst" }), 2);
  const rec = o.agents.get("lead-recruiter")!;
  assert.equal(rec.state, "walking");
  assert.equal(rec.place, "web");
  o.handle(r("PreToolUse", { tool_name: "Read", target: "sources.md" }), 3);
  assert.equal(rec.place, "shelf");
  o.handle(r("PostToolUse", { tool_name: "Read" }), 4);
  assert.equal(rec.state, "typing");
  assert.equal(rec.place, "desk");
});

test("when the subagent reports back it goes idle and Chief of Staff reads the report", () => {
  const o = new Office(0);
  o.handle(brief("senior-admin"), 1);
  o.handle(r("PostToolUse", { tool_name: "Task", subagent_type: "senior-admin" }), 2);
  assert.equal(o.agents.get("senior-admin")!.state, "idle");
  assert.equal(o.agents.get("chief-of-staff")!.detail, "Reading Senior Admin's report");
  // later tool calls are the main session's again
  o.handle(r("PreToolUse", { tool_name: "Write", target: "jobs/today.md" }), 3);
  assert.equal(o.agents.get("chief-of-staff")!.detail, "Write jobs/today.md");
});

test("Stop means it is Tim's turn, and running subagents are stood down", () => {
  const o = new Office(0);
  o.handle(brief("admin"), 1);
  o.handle(r("Stop"), 2);
  assert.equal(o.agents.get("chief-of-staff")!.state, "waiting");
  assert.equal(o.agents.get("chief-of-staff")!.detail, "Your turn");
  assert.equal(o.agents.get("admin")!.state, "idle");
});

test("a permission notification makes the running agent wait", () => {
  const o = new Office(0);
  o.handle(brief("lead-recruiter"), 1);
  o.handle(r("Notification", { message: "Claude needs your permission to use WebFetch" }), 2);
  assert.equal(o.agents.get("lead-recruiter")!.state, "waiting");
  assert.match(o.agents.get("lead-recruiter")!.detail, /permission/);
});

test("unknown subagents get a visitor desk with a readable name", () => {
  const o = new Office(0);
  o.handle(brief("code-reviewer"), 1);
  assert.equal(o.agents.get("code-reviewer")!.name, "Code Reviewer");
});

test("SessionEnd sends everyone in that session to sleep", () => {
  const o = new Office(0);
  o.handle(brief("admin"), 1);
  o.handle(r("SessionEnd"), 2);
  assert.equal(o.agents.get("chief-of-staff")!.state, "asleep");
  assert.equal(o.agents.get("admin")!.state, "asleep");
});

test("agents doze off, and busy agents that go quiet become idle", () => {
  const o = new Office(0);
  o.handle(r("Stop"), 0);                                         // COS waiting
  o.handle(r("SubagentStop", { agent_type: "admin" }), 0);        // Admin idle
  o.handle(r("PreToolUse", { tool_name: "Bash", agent_type: "senior-admin" }), 0);
  assert.deepEqual(o.tick(IDLE_TO_ASLEEP_MS - 1), []);
  assert.deepEqual(o.tick(IDLE_TO_ASLEEP_MS + 1), ["admin"]);
  assert.deepEqual(o.tick(BUSY_TIMEOUT_MS + 1), ["senior-admin"]);
  assert.deepEqual(o.tick(WAITING_TO_ASLEEP_MS + 1), ["chief-of-staff"]);
  assert.deepEqual(o.tick(BUSY_TIMEOUT_MS + IDLE_TO_ASLEEP_MS + 2), ["senior-admin"]);
  assert.equal(o.agents.get("chief-of-staff")!.detail, "Dozing until Tim's back");
});

test("logs keep the latest 50 lines and long text is shortened", () => {
  const o = new Office(0);
  for (let i = 0; i < 60; i++) o.handle(r("PreToolUse", { tool_name: "Bash", target: `step ${i} ` + "x".repeat(200) }), i);
  const cos = o.agents.get("chief-of-staff")!;
  assert.equal(cos.log.length, 50);
  assert.match(cos.log[0].text, /^Bash step 10 /);
  assert.ok(cos.log[0].text.length <= 120);
  assert.ok(cos.detail.length <= 60);
});
