// Agent Office: the office scene (PixiJS), the team's cards, the activity log and contracts.
// Layout and look follow mockup/index.html. Live data comes from store.js.
import { Application, Container, Graphics, Text } from "/vendor/pixi.mjs";
import { CONTRACTS } from "/contracts.js";
import { store, on } from "./store.js";
import { $, esc, hex, clock, short, PICKED } from "./util.js";

// ---------- Settings ----------
const W = 200, H = 120, S = 4; // art pixels, and screen pixels per art pixel
const DW = 44; // desk width
// Hal, Rita and Wren along the top row; Cole and Ada below.
const DESKS = {
  "chief-of-staff": { x: 6, y: 58 }, "lead-recruiter": { x: 58, y: 58 }, writer: { x: 110, y: 58 },
  "interview-coach": { x: 6, y: 94 }, admin: { x: 58, y: 94 },
};
const PLACES = { shelf: { x: 176, y: 48 }, web: { x: 182, y: 82 } };
const VISITOR_SPOTS = [{ x: 132, y: 92 }, { x: 146, y: 70 }, { x: 108, y: 76 }, { x: 52, y: 76 }];
const HAIR = { "chief-of-staff": 0x3b2a1a, "lead-recruiter": 0xa0522d, writer: 0x1c1c1c, "interview-coach": 0x6b4a2b, admin: 0xe0b04a };
const WALK_SPEED = 45; // art pixels per second
const STATE_COLOUR = { typing: "#4fbf7f", walking: "#3fa7d6", waiting: "#f2b134", idle: "#9aa0b5", asleep: "#6b7090" };
const STATE_LABEL = { typing: "Working", walking: "Looking things up", waiting: "Waiting for you", idle: "Idle", asleep: "Asleep" };

const agents = store.agents;
let selected = "chief-of-staff";

function seatOf(a) {
  const d = DESKS[a.id];
  return d ? { x: d.x + 18, y: d.y - 15 } : null;
}
function targetOf(a) {
  if (a.place !== "desk" && PLACES[a.place]) return PLACES[a.place];
  return seatOf(a) || VISITOR_SPOTS[a.visitor % VISITOR_SPOTS.length];
}
function update(list) {
  for (const incoming of list || []) {
    const known = agents.get(incoming.id);
    if (known) Object.assign(known, incoming);
    else {
      const visitors = [...agents.values()].filter((a) => !DESKS[a.id]).length;
      const a = { ...incoming, visitor: visitors };
      const start = targetOf(a);
      a.x = start.x; a.y = start.y;
      agents.set(a.id, a);
    }
  }
  renderCards();
  renderLog();
}

// ---------- Scene ----------
const app = new Application();
await app.init({ width: W * S, height: H * S, background: 0x1d1f2b, antialias: false, resolution: Math.max(1, Math.round(devicePixelRatio || 1)), autoDensity: true });
$("scene").appendChild(app.canvas);

const world = new Container();
world.scale.set(S);
const labels = new Container(); // text is drawn at screen scale so it stays sharp
const room = new Graphics(), back = new Graphics(), front = new Graphics(), top = new Graphics();
world.addChild(room, back, front, top);
app.stage.addChild(world, labels);

const rect = (g, x, y, w, h, c) => g.rect(x, y, w, h).fill(c);
function label(str, x, y, size, colour, weight = "600") {
  const t = new Text({ text: str, style: { fontFamily: 'ui-monospace, "Cascadia Mono", Menlo, monospace', fontSize: size, fill: colour, fontWeight: weight } });
  t.anchor.set(0.5);
  t.position.set(x * S, y * S);
  labels.addChild(t);
  return t;
}

function drawRoom() {
  const g = room;
  rect(g, 0, 0, W, 36, 0x3b3f5c); rect(g, 0, 34, W, 2, 0x2c2f45);
  for (const wx of [8, 150]) { rect(g, wx, 6, 34, 20, 0x2c2f45); rect(g, wx + 2, 8, 30, 16, 0x8ec5ff); rect(g, wx + 2, 18, 30, 6, 0xb5dcff); rect(g, wx + 16, 8, 2, 16, 0x2c2f45); }
  rect(g, 58, 5, 84, 24, 0xd9dbe6); rect(g, 60, 7, 80, 20, 0xf7f8fc);
  rect(g, 48, 8, 7, 7, 0xf7f8fc); rect(g, 51, 9, 1, 3, 0x30344a); rect(g, 51, 11, 2, 1, 0x30344a);
  for (let y = 36; y < H; y += 8) for (let x = 0; x < W; x += 8) rect(g, x, y, 8, 8, ((x + y) / 8) % 2 ? 0xc9b38f : 0xc1aa85);
  rect(g, 2, 42, 52, 32, 0xa65d57); rect(g, 4, 44, 48, 28, 0xb86b63);
  rect(g, 170, 38, 26, 28, 0x6b4428);
  const books = [0xe06c75, 0x7aa2ff, 0xf2b134, 0x4fbf7f, 0xc38bff, 0xe5e7ef];
  for (let r = 0; r < 3; r++) { rect(g, 172, 40 + r * 9, 22, 7, 0x4a2e1a); for (let b = 0; b < 6; b++) rect(g, 173 + b * 3.5, 41 + r * 9, 2.5, 6, books[(b + r) % 6]); }
  rect(g, 160, 82, 20, 18, 0x30344a); rect(g, 162, 84, 16, 11, 0x3fa7d6);
  rect(g, 167, 86, 6, 6, 0x8ee0ff); rect(g, 169, 86, 2, 6, 0x3fa7d6); rect(g, 167, 88, 6, 2, 0x3fa7d6);
  rect(g, 168, 100, 4, 8, 0x30344a);
  rect(g, 114, 106, 8, 8, 0x8a5a3b); rect(g, 112, 96, 12, 11, 0x3c9a5f); rect(g, 115, 92, 6, 6, 0x4fbf7f);
  rect(g, 158, 40, 8, 14, 0xd9dbe6); rect(g, 159, 36, 6, 6, 0x8ec5ff);
  label("TODAY", 100, 11, 11, 0x4f6bed);
  label("FILES", 183, 69, 9, 0x6b4428);
  label("WEB", 170, 112, 9, 0x30344a);
  for (const [id, d] of Object.entries(DESKS)) {
    rect(front, d.x, d.y, DW, 4, 0xb07a50); rect(front, d.x, d.y + 4, DW, 10, 0x8a5a3b);
    rect(front, d.x + 2, d.y + 14, 3, 4, 0x6b4428); rect(front, d.x + DW - 5, d.y + 14, 3, 4, 0x6b4428);
    rect(front, d.x + 16, d.y + 1, 12, 2, 0xe5e7ef);
    plates[id] = label("", d.x + DW / 2, d.y + 9, 11, 0xfff3e0);
  }
}
const plates = {};
const board = label("", 100, 18, 10, 0x30344a, "500");
const boardTokens = label("", 100, 24, 8, 0x6b7090, "500");
drawRoom();

function person(g, x, y, a, t, sitting) {
  const skin = 0xf1c27d, hair = HAIR[a.id] ?? 0x5a3b22, shirt = a.colour;
  const asleep = a.state === "asleep" && sitting;
  const hy = asleep ? y + 3 : y;
  rect(g, x + 1, hy, 7, 7, skin); rect(g, x + 1, hy, 7, 2, hair); rect(g, x + 1, hy + 2, 1, 2, hair);
  if (a.state === "asleep") { rect(g, x + 3, hy + 4, 2, 1, 0x5a3b22); rect(g, x + 6, hy + 4, 1, 1, 0x5a3b22); }
  else { rect(g, x + 3, hy + 3, 1, 1, 0x22242f); rect(g, x + 6, hy + 3, 1, 1, 0x22242f); rect(g, x + 4, hy + 5, 2, 1, 0xc98f5a); }
  rect(g, x, y + 7, 9, 8, shirt);
  if (sitting && a.state === "typing") {
    const f = Math.floor(t / 180) % 2;
    rect(g, x - 1, y + 9 + f, 2, 5, shirt); rect(g, x + 8, y + 10 - f, 2, 5, shirt);
    rect(g, x - 1, y + 14 + f, 2, 1, skin); rect(g, x + 8, y + 15 - f, 2, 1, skin);
  } else {
    rect(g, x - 1, y + 8, 2, 6, shirt); rect(g, x + 8, y + 8, 2, 6, shirt);
  }
  if (!sitting) {
    const f = a.moving ? Math.floor(t / 150) % 2 : 0;
    rect(g, x + 1, y + 15, 3, 6 - f, 0x2c3e50); rect(g, x + 5, y + 15, 3, 5 + f, 0x2c3e50);
  }
}

const bubbles = new Map(); // agent id -> { q: Text, z: Text }
function marks(a) {
  let m = bubbles.get(a.id);
  if (!m) { m = { q: label("?", 0, 0, 20, 0xc98a00, "800"), z: label("", 0, 0, 14, 0xb5c4ff) }; bubbles.set(a.id, m); }
  return m;
}

let last = performance.now();
app.ticker.add(() => {
  const t = performance.now(), dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  back.clear(); top.clear();
  for (const [id, d] of Object.entries(DESKS)) {
    const a = agents.get(id);
    rect(back, d.x + 16, d.y - 14, 12, 12, 0x444a66);
    if (id === "admin") { // Ada's server box: lights blink while her scripts run
      const busy = a && a.state === "typing";
      rect(back, d.x + 32, d.y - 13, 9, 13, 0x2c2f45); rect(back, d.x + 33, d.y - 12, 7, 11, 0x3a3d50);
      for (let i = 0; i < 4; i++) rect(back, d.x + 34 + (i % 2) * 3, d.y - 10 + Math.floor(i / 2) * 4, 2, 1, busy && (Math.floor(t / 120) + i) % 3 ? 0x4fbf7f : 0x22242f);
    }
    rect(back, d.x + 8, d.y - 12, 3, 12, 0x22242f);
    rect(back, d.x + 11, d.y - 12, 2, 12, a && a.state === "typing" && !a.moving ? 0x6fd3ff : 0x3a3d50);
    rect(back, d.x + 6, d.y - 1, 9, 1, 0x22242f);
    if (plates[id]) plates[id].text = a ? a.name : "";
  }
  for (const a of agents.values()) {
    const goal = targetOf(a), dx = goal.x - a.x, dy = goal.y - a.y, dist = Math.hypot(dx, dy);
    a.moving = dist > 0.5;
    if (a.moving) { const step = Math.min(dist, WALK_SPEED * dt); a.x += (dx / dist) * step; a.y += (dy / dist) * step; }
    else { a.x = goal.x; a.y = goal.y; }
    const seat = seatOf(a);
    const sitting = !a.moving && seat && a.x === seat.x && a.y === seat.y;
    const px = Math.round(a.x), py = Math.round(a.y);
    person(sitting ? back : top, px, py, a, t, sitting);
    const m = marks(a), bob = Math.round(Math.sin(t / 300));
    m.q.visible = a.state === "waiting";
    if (m.q.visible) {
      rect(top, px + 12, py - 13 + bob, 10, 9, 0xf7f8fc); rect(top, px + 15, py - 4 + bob, 2, 2, 0xf7f8fc);
      m.q.position.set((px + 17) * S, (py - 8.3 + bob) * S);
    }
    m.z.visible = a.state === "asleep";
    if (m.z.visible) { m.z.text = Math.floor(t / 600) % 2 ? "z Z" : "Z z"; m.z.position.set((px + 14) * S, (py + 3) * S); }
    if (a.id === selected) {
      const d = DESKS[a.id];
      if (sitting && d) top.rect(d.x - 2, d.y - 32, DW + 4, 52).stroke({ width: 0.5, color: 0x7aa2ff });
      else top.rect(px - 3, py - 3, 15, 27).stroke({ width: 0.5, color: 0x7aa2ff });
    }
  }
});

app.canvas.addEventListener("click", (e) => {
  const r = app.canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
  const hit = [...agents.values()].find((a) => x >= a.x - 3 && x <= a.x + 12 && y >= a.y - 3 && y <= a.y + 24)
    || [...agents.values()].find((a) => { const d = DESKS[a.id]; return d && x >= d.x && x <= d.x + DW && y >= d.y - 32 && y <= d.y + 18; });
  if (hit) select(hit.id);
});

// ---------- Cards and log ----------
function select(id) {
  selected = id;
  renderCards();
  renderLog();
}
function renderCards() {
  $("cards").innerHTML = [...agents.values()].map((a) => `
    <button class="card" aria-pressed="${a.id === selected}" data-id="${esc(a.id)}">
      <div class="who"><span class="dot" style="background:${hex(a.colour)}"></span>${CONTRACTS[a.id] ? `<span class="name-link" data-contract="${esc(a.id)}" title="View ${esc(a.name)}'s contract">${esc(a.name)}</span>` : esc(a.name)}${a.role ? `<span class="role">${esc(a.role)}</span>` : ""}</div>
      <span class="state" style="background:${STATE_COLOUR[a.state]}">${STATE_LABEL[a.state]}</span>
      <div class="detail" title="${esc(a.detail)}">${esc(a.detail)}</div>
      <div class="tokens">${a.id === "admin" ? "No tokens (automatic)" : `${short(a.tokens || 0)} tokens today`}</div>
    </button>`).join("");
}
$("cards").addEventListener("click", (e) => {
  const link = e.target.closest("[data-contract]");
  if (link) return openContract(link.dataset.contract);
  const c = e.target.closest(".card"); if (c) select(c.dataset.id);
});
$("log-name").addEventListener("click", () => { if (CONTRACTS[selected]) openContract(selected); });

function openContract(id) {
  const c = CONTRACTS[id];
  if (!c) return;
  const rows = (list) => list.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
  $("contract").innerHTML = `
    <header><p class="c-org">The Agent Office</p><h2 id="contract-heading">${esc(c.title)}</h2></header>
    <section><h3>1. The parties</h3><table>${rows(c.parties)}</table></section>
    <section><h3>2. Terms</h3><table>${rows(c.terms)}</table></section>
    <section><h3>3. Duties and responsibilities</h3><ol>${c.duties.map((d) => `<li>${esc(d)}</li>`).join("")}</ol></section>
    <section><h3>4. Gross misconduct</h3><p>The following will result in immediate dismissal:</p><ul>${c.conduct.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></section>
    <section><h3>5. Other terms</h3><table>${rows(c.extras)}</table></section>
    <section class="c-sign">
      <div><span class="sig">${esc(c.signed.employer)}</span><span class="line">Signed for the Employer</span></div>
      <div><span class="sig">${esc(c.signed.employee)}</span><span class="line">Signed by the Employee</span></div>
      <p class="c-date">Dated ${esc(c.signed.date)}</p>
    </section>
    <footer>A novelty document for the Agent Office. Not a legal contract.</footer>`;
  $("contract-dlg").showModal();
  $("contract").focus(); // start at the top, not at the Close button
  $("contract-dlg").scrollTop = 0;
}

function renderLog() {
  const a = agents.get(selected);
  if (!a) return;
  $("log-name").textContent = a.name;
  $("log-name").classList.toggle("name-link", !!CONTRACTS[a.id]);
  $("log-name").title = CONTRACTS[a.id] ? `View ${a.name}'s contract` : "";
  $("log-sub").textContent = `${STATE_LABEL[a.state]} · ${a.detail}`;
  $("log").innerHTML = a.log.length
    ? a.log.slice().reverse().map((l) => `<li><time>${clock(l.ts)}</time><span>${esc(l.text)}</span></li>`).join("")
    : `<li><time></time><span>Nothing yet today</span></li>`;
  $("log-stats").innerHTML = `<span><b>${a.tools}</b> tool calls so far</span>` +
    (a.id === "admin" ? `<span>Automatic: uses no tokens</span>` : `<span><b>${short(a.tokens || 0)}</b> tokens today${a.cacheRead ? ` (+${short(a.cacheRead)} re-read)` : ""}</span>`);
}

// ---------- Live updates ----------
function renderBoard() {
  const roles = store.tracker.roles || [];
  const counts = {};
  for (const r of roles) counts[r.status] = (counts[r.status] || 0) + 1;
  const picked = roles.filter((r) => PICKED.has(r.status)).length;
  board.text = roles.length ? `${counts.found || 0} found · ${picked} picked · ${counts.drafted || 0} drafted` : "No roles yet";
}
on("agents", update);
on("tracker", renderBoard);
on("system", () => { boardTokens.text = store.system.tokens ? `Tokens today: ${short(store.system.tokens.today)}` : ""; });
renderBoard();
