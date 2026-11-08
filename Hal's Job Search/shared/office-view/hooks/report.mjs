#!/usr/bin/env node
// Claude Code hook: tells the Agent Office what an agent is doing.
//
// Claude Code passes the hook's details as JSON on stdin. This keeps only the
// fields the office needs, sends them to the bridge on this PC, and exits.
// It never prints anything and always exits 0, so a closed office never slows
// down or breaks a Claude Code session.

const PORT = process.env.OFFICE_PORT || 4747;
const BRIDGE = `http://127.0.0.1:${PORT}/report`;

// Hard stop, whatever happens.
setTimeout(() => process.exit(0), 1000);

function short(text, max = 80) {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

/** A short "what" for a tool call: a file path relative to the project, a search, a URL. */
function targetOf(tool, input, cwd) {
  if (!input || typeof input !== "object") return "";
  if (tool === "Bash") return short(input.description || input.command, 60);
  let target = input.file_path || input.notebook_path || input.path || input.url || input.query || input.pattern || "";
  if (cwd && typeof target === "string") {
    const base = cwd.replace(/[\\/]+$/, "");
    if (target.startsWith(base)) target = target.slice(base.length).replace(/^[\\/]+/, "");
  }
  return short(target);
}

async function main() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  const hook = JSON.parse(raw);
  const input = hook.tool_input || {};
  const delegating = hook.tool_name === "Task" || hook.tool_name === "Agent";
  const report = {
    hook_event_name: hook.hook_event_name,
    session_id: hook.session_id,
    cwd: hook.cwd,
    tool_name: hook.tool_name,
    agent_type: hook.agent_type,
    subagent_type: delegating ? input.subagent_type : undefined,
    description: delegating ? short(input.description, 60) : undefined,
    target: delegating ? undefined : targetOf(hook.tool_name, input, hook.cwd),
    message: hook.message ? short(hook.message, 100) : undefined,
    // Only where the transcript is, never its contents; the office reads token totals from it.
    transcript_path: typeof hook.transcript_path === "string" ? hook.transcript_path : undefined,
  };
  await fetch(BRIDGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    signal: AbortSignal.timeout(500),
  });
}

main().catch(() => {}).finally(() => process.exit(0));
