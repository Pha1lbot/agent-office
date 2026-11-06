// The bridge: receives reports from Claude Code hooks (hooks/report.mjs) or the
// fake agents, keeps the office state, watches the role tracker, and pushes
// updates to the browser over a WebSocket. Listens on this PC only.
//
//   npm start            then open http://127.0.0.1:4747
//   OFFICE_PORT=5000 npm start   to use another port
//   OFFICE_TRACKER=path/to/tracker.json npm start   to show another tracker (for testing)

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { watchFile } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { Office, type Report } from "./office.ts";

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
let tracker: unknown = { roles: [] };

async function loadTracker() {
  try {
    tracker = JSON.parse(await readFile(TRACKER, "utf8"));
  } catch {
    tracker = { roles: [], error: "Couldn't read jobs/tracker.json" };
  }
}

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
  send(ws, { type: "snapshot", agents: office.snapshot(), tracker, now: Date.now() });
});

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
      res.writeHead(204).end();
    } catch {
      res.writeHead(400).end();
    }
    return;
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
await loadTracker();
// Polling works the same on Windows, macOS and Linux, and survives the file being replaced.
watchFile(TRACKER, { interval: 2000 }, async () => {
  await loadTracker();
  broadcast({ type: "tracker", tracker });
});
setInterval(() => pushAgents(office.tick()), 15_000);

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
