// The bridge: receives reports from Claude Code hooks (hooks/report.mjs) or the
// fake agents, keeps the office state, watches the role tracker, and pushes
// updates to the browser over a WebSocket. Listens on this PC only.
//
//   npm start            then open http://127.0.0.1:4747
//   OFFICE_PORT=5000 npm start   to use another port
//   OFFICE_TRACKER=path/to/tracker.json npm start   to show another tracker (for testing)
//
// Tim can also edit roles from the page. Edits go through shared/tools/tracker.py,
// are backed up to GitHub (backup.ts), and changes that need work start Hal,
// the Chief of Staff, in the background (auto-cos.ts).

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, watchFile } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { Office, type Report } from "./office.ts";
import { Tracker, findClaude, findPython, repoOf, run } from "./tools.ts";
import { Backup } from "./backup.ts";
import { AutoCos } from "./auto-cos.ts";
import { addUsage, emptyUsage, startOfUkDay, usageOfSession, type Usage } from "./tokens.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, "..");
const REPO = resolve(APP, "..", "..");
const TRACKER = process.env.OFFICE_TRACKER ? resolve(process.env.OFFICE_TRACKER) : join(REPO, "jobs", "tracker.json");
const PUBLIC = join(APP, "public");
const PIXI = join(APP, "node_modules", "pixi.js", "dist", "pixi.min.mjs");
const HOST = "127.0.0.1";
const PORT = Number(process.env.OFFICE_PORT || 4747);
const MAX_BODY = 64 * 1024;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const office = new Office();
let tracker: { roles: { id: string; title: string; company: string }[]; inbox?: { done: boolean }[]; error?: string } = { roles: [] };
let tool: Tracker | null = null;
let backup: Backup;
let cos: AutoCos | null = null;

async function loadTracker() {
  try {
    tracker = JSON.parse(await readFile(TRACKER, "utf8"));
  } catch {
    tracker = { roles: [], error: "Couldn't read jobs/tracker.json" };
  }
  return (tracker.inbox || []).filter((i) => !i.done).length;
}

// ---------- Token meter ----------
// Optional daily budget of fresh tokens; when reached, Hal stops starting by himself.
const DAILY_BUDGET = Number(process.env.OFFICE_DAILY_TOKEN_BUDGET || 0) || null;
const meterSessions = new Map<string, { transcript: string; mainId: string }>();
let tokensToday: Usage = emptyUsage();
let meterTimer: NodeJS.Timeout | null = null;
let meterDay = startOfUkDay();

function trackTokens(report: Report) {
  if (!report.transcript_path || !report.session_id) return;
  meterSessions.set(report.session_id, { transcript: report.transcript_path, mainId: office.mainOf(report) });
  if (!meterTimer) meterTimer = setTimeout(() => { meterTimer = null; void recountTokens(); }, 3000);
}

async function recountTokens() {
  const since = startOfUkDay();
  const per = new Map<string, Usage>();
  const add = (id: string, u: Usage) => { if (!per.has(id)) per.set(id, emptyUsage()); addUsage(per.get(id)!, u); };
  for (const [sessionId, s] of meterSessions) {
    const u = await usageOfSession(s.transcript, since);
    add(s.mainId, u.main);
    for (const [type, su] of u.subagents) add(office.subagentId(type), su);
    if (!u.main.fresh && !u.subagents.size) meterSessions.delete(sessionId); // nothing today
  }
  const total = emptyUsage();
  const changed: string[] = [];
  for (const a of office.agents.values()) {
    const u = per.get(a.id) || emptyUsage();
    addUsage(total, u);
    if (a.tokens !== u.fresh || a.cacheRead !== u.cacheRead) {
      a.tokens = u.fresh;
      a.cacheRead = u.cacheRead;
      changed.push(a.id);
    }
  }
  tokensToday = total;
  pushAgents(changed);
  pushSystem();
}

function systemStatus() {
  return {
    editing: !!tool, backup: backup?.status, cos: cos?.status ?? null,
    tokens: { today: tokensToday.fresh, cacheRead: tokensToday.cacheRead, budget: DAILY_BUDGET },
  };
}

// Fields Tim can change from the page, with a length limit each.
const EDITABLE: Record<string, number> = {
  status: 20, priority: 3, next: 300, notes: 2000, reason: 300, interview_at: 16, interview_with: 200,
  list: 60, pay: 120, location: 160, cv: 120, fit: 1, title: 200, company: 200, url: 500,
};
const ADDABLE = ["title", "company", "url", "location", "pay", "notes"];
const oneLine = (v: unknown, max: number) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

// ---------- WebSocket ----------
const sockets = new WebSocketServer({ noServer: true });

function send(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}
function broadcast(message: object) {
  for (const ws of sockets.clients) send(ws, message);
}
function pushAgents(ids: string[]) {
  if (ids.length) broadcast({ type: "agents", agents: ids.map((id) => office.agents.get(id)) });
}

sockets.on("connection", (ws) => {
  send(ws, { type: "snapshot", agents: office.snapshot(), tracker, system: systemStatus(), now: Date.now() });
});
const pushSystem = () => broadcast({ type: "system", system: systemStatus() });

/** After a change through the tracker tool: reload, tell the page, back up, maybe wake Hal. */
/** Ada (Admin) is automation: animate her while a script runs. */
function ada<T>(text: string, work: () => Promise<T>, done = "Done"): Promise<T> {
  pushAgents(office.ada(true, text));
  return work().finally(() => pushAgents(office.ada(false, done)));
}

/** Ada makes the PDFs as soon as Tim approves a role that has Word files. No tokens. */
async function adaPdfs(role: { id: string; title: string; company: string }) {
  if (!tool || !existsSync(join(dirname(TRACKER), "roles", role.id, "cv.docx"))) return;
  const r = await ada(`Making PDFs: ${role.company}`, () =>
    run(tool!.python, [join(REPO, "shared", "tools", "make_docs.py"), "--pdf", role.id], REPO,
      { JOBS_DIR: dirname(TRACKER), PYTHONIOENCODING: "utf-8" }, 180_000), "PDFs done");
  if (!r.ok) {
    const why = r.out.split("\n").filter(Boolean).pop() || "unknown error";
    await tool.call(["action", "add", `PDFs for ${role.company} (${role.title}) failed: ${why.slice(0, 160)}. Install LibreOffice, or ask Hal.`, "--role", role.id]);
  }
  await afterEdit(r.ok ? `PDFs made for ${role.company}: ${role.title}` : `PDFs failed for ${role.company}`);
}

async function afterEdit(summary: string) {
  const waiting = await loadTracker();
  broadcast({ type: "tracker", tracker });
  backup.edited(summary);
  cos?.inboxChanged(waiting, true);
}

function json(res: ServerResponse, code: number, body: object) {
  res.writeHead(code, { "Content-Type": "application/json" }).end(JSON.stringify(body));
}

// ---------- HTTP ----------
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((ok, fail) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        fail(new Error("too large"));
        req.destroy();
      }
    });
    req.on("end", () => ok(body));
    req.on("error", fail);
  });
}

/** Only accept reports from this PC's own programs, not from web pages in a browser. */
function fromBrowserPage(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  return !!origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
}

async function serveFile(res: ServerResponse, file: string) {
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}`);

  if (req.method === "POST" && url.pathname === "/report") {
    if (fromBrowserPage(req)) return void res.writeHead(403).end();
    try {
      const report = JSON.parse(await readBody(req)) as Report;
      if (typeof report?.hook_event_name !== "string") throw new Error("no hook_event_name");
      pushAgents(office.handle(report));
      trackTokens(report);
      res.writeHead(204).end();
    } catch {
      res.writeHead(400).end();
    }
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    if (fromBrowserPage(req)) return void res.writeHead(403).end();
    let body: Record<string, unknown>;
    try { body = JSON.parse((await readBody(req)) || "{}"); } catch { return json(res, 400, { error: "Bad request" }); }

    const roleMatch = url.pathname.match(/^\/api\/roles\/([a-z0-9-]{1,120})$/);
    if (roleMatch || url.pathname === "/api/roles") {
      if (!tool) return json(res, 503, { error: "Editing needs Python 3 on this PC." });
      if (roleMatch) {
        const id = roleMatch[1];
        const role = tracker.roles.find((r) => r.id === id);
        if (!role) return json(res, 404, { error: "No such role" });
        const changes = Object.entries((body.changes as Record<string, unknown>) || {})
          .filter(([k]) => k in EDITABLE).map(([k, v]) => `${k}=${oneLine(v, EDITABLE[k])}`);
        if (!changes.length) return json(res, 400, { error: "Nothing to change" });
        const r = await ada("Updating the tracker", () => tool!.call(["set", id, ...changes, "--by", "tim"]));
        if (!r.ok) return json(res, 400, { error: r.out.split("\n").pop() || "Couldn't save" });
        const status = (body.changes as Record<string, unknown>).status;
        await afterEdit(`${role.company}: ${role.title}${status ? ` → ${status}` : " updated"}`);
        if (status === "approved") void adaPdfs(role);
        return json(res, 200, { ok: true });
      }
      const title = oneLine(body.title, 200), company = oneLine(body.company, 200);
      if (!title || !company) return json(res, 400, { error: "A role needs a title and a company." });
      const args = ["add", "--by", "tim", "--source", "Tim"];
      for (const k of ADDABLE) { const v = oneLine(body[k], EDITABLE[k] ?? 500); if (v) args.push(`--${k}`, v); }
      const url2 = oneLine(body.url, 500);
      if (url2 && !/^https?:\/\//i.test(url2)) return json(res, 400, { error: "The link must start with http:// or https://" });
      const r = await ada("Adding a role", () => tool!.call(args));
      if (!r.ok) return json(res, 400, { error: r.out.split("\n").pop() || "Couldn't add the role" });
      await afterEdit(`added ${company}: ${title}`);
      return json(res, 200, { ok: true, id: r.out.trim().split("\n").pop() });
    }

    if (url.pathname === "/api/cos") {
      if (!cos) return json(res, 503, { error: "Claude Code isn't installed on this PC." });
      if (typeof body.auto === "boolean") cos.setAuto(body.auto);
      if (body.run === true) void cos.start();
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: "Not found" });
  }

  if (req.method !== "GET") return void res.writeHead(405).end();
  if (url.pathname === "/api/state") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return void res.end(JSON.stringify({ agents: office.snapshot(), tracker }));
  }
  if (url.pathname === "/vendor/pixi.mjs") return serveFile(res, PIXI);

  const file = resolve(PUBLIC, "." + (url.pathname === "/" ? "/index.html" : url.pathname));
  if (!file.startsWith(PUBLIC)) return void res.writeHead(404).end();
  return serveFile(res, file);
});

server.on("upgrade", (req, socket, head) => {
  if (new URL(req.url || "/", `http://${HOST}`).pathname !== "/live" || fromBrowserPage(req)) {
    socket.destroy();
    return;
  }
  sockets.handleUpgrade(req, socket, head, (ws) => sockets.emit("connection", ws, req));
});

// ---------- Start ----------
const initialInbox = await loadTracker();
const gitRepo = await repoOf(TRACKER);
let adaSaving = false;
// Back up the whole jobs folder: the tracker plus PDFs and other files the office makes.
backup = new Backup(gitRepo, [dirname(TRACKER)], () => {
  pushSystem();
  const saving = backup?.status.state === "saving";
  if (saving !== adaSaving) {
    adaSaving = saving;
    pushAgents(office.ada(saving, saving ? "Backing up to GitHub" : backup.status.message));
  }
});
const python = await findPython(REPO);
if (python) tool = new Tracker(python, REPO, TRACKER);
else console.log("Python 3 not found: the office will show roles but can't edit them. Install Python from python.org.");
const claude = python ? await findClaude(REPO) : null;
if (python) {
  cos = new AutoCos(claude, gitRepo || REPO, python, APP, {
    before: async () => { backup.hold = true; await backup.flush(); },
    after: async () => { backup.hold = false; const n = await loadTracker(); broadcast({ type: "tracker", tracker }); return n; },
    changed: pushSystem,
    budgetLeft: () => (DAILY_BUDGET ? DAILY_BUDGET - tokensToday.fresh : null),
  });
  cos.inboxChanged(initialInbox, false);
}
if (!claude) console.log("Claude Code not found: Hal won't start automatically. Run /cos yourself.");
// Polling works the same on Windows, macOS and Linux, and survives the file being replaced.
watchFile(TRACKER, { interval: 2000 }, async () => {
  const waiting = await loadTracker();
  broadcast({ type: "tracker", tracker });
  cos?.inboxChanged(waiting, false);
});
setInterval(() => {
  pushAgents(office.tick());
  if (startOfUkDay() !== meterDay) { meterDay = startOfUkDay(); void recountTokens(); } // a new day starts at zero
}, 15_000);

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Is the office already open? Try http://${HOST}:${PORT}`);
    process.exit(1);
  }
  throw error;
});
server.listen(PORT, HOST, () => {
  console.log(`Agent Office is open at http://${HOST}:${PORT}  (Ctrl+C to close)`);
});
