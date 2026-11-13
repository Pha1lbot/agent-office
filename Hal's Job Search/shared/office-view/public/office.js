// Agent Office: the office scene (3D, in scene.js), the team's cards, the activity log and contracts.
// Live data comes from store.js.
import { CONTRACTS } from "/contracts.js";
import { store, on } from "./store.js";
import { $, esc, hex, clock, short, PICKED } from "./util.js";
import { start, follow, setSelected, setBoard } from "./scene.js";

const STATE_LABEL = { typing: "Working", walking: "Looking things up", waiting: "Waiting for you", idle: "Idle", asleep: "Asleep" };
const STATE_SHAPE = { typing: "●", walking: "◐", waiting: "!", idle: "○", asleep: "–" };

const agents = store.agents;
let selected = "chief-of-staff";

function update(list) {
  for (const incoming of list || []) {
    const known = agents.get(incoming.id);
    if (known) Object.assign(known, incoming);
    else agents.set(incoming.id, { ...incoming });
  }
  renderCards();
  renderLog();
}

// ---------- Scene ----------
if (start($("scene"), { onPick: (id) => select(id) })) follow(agents);
setSelected(selected);

// ---------- Cards and log ----------
function select(id) {
  selected = id;
  setSelected(id);
  renderCards();
  renderLog();
}
function renderCards() {
  const had = document.activeElement?.closest?.("#cards") ? document.activeElement.dataset : null; // keep keyboard focus through live updates
  $("cards").innerHTML = [...agents.values()].map((a) => `
    <article class="agent" data-selected="${a.id === selected}">
      <button type="button" class="agent-pick" aria-pressed="${a.id === selected}" data-id="${esc(a.id)}">
        <span class="who"><span class="dot" style="background:${hex(a.colour)}" aria-hidden="true"></span>${esc(a.name)}</span>
        ${a.role ? `<span class="role">${esc(a.role)}</span>` : ""}
        <span class="state s-${esc(a.state)}"><span aria-hidden="true">${STATE_SHAPE[a.state] || "○"}</span>${STATE_LABEL[a.state] || esc(a.state)}</span>
        <span class="detail">${esc(a.detail)}</span>
        <span class="tokens">${a.id === "admin" ? "No tokens (automatic)" : `${short(a.tokens || 0)} tokens today`}</span>
      </button>
      ${CONTRACTS[a.id] ? `<button type="button" class="name-link" data-contract="${esc(a.id)}" aria-label="Read ${esc(a.name)}'s contract">Contract</button>` : ""}
    </article>`).join("");
  if (had) $("cards").querySelector(had.contract ? `[data-contract="${had.contract}"]` : `[data-id="${had.id}"]`)?.focus();
}
$("cards").addEventListener("click", (e) => {
  const link = e.target.closest("[data-contract]");
  if (link) return openContract(link.dataset.contract);
  const c = e.target.closest("[data-id]"); if (c) select(c.dataset.id);
});


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
  $("log-name").textContent = `${a.name}'s day`;
  $("log-sub").textContent = a.detail;
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
  boardLine = roles.length ? `${counts.found || 0} found · ${picked} picked · ${counts.drafted || 0} drafted` : "No roles yet";
  setBoard(boardLine, tokensLine);
}
let boardLine = "", tokensLine = "";
on("agents", update);
on("tracker", renderBoard);
on("system", () => { tokensLine = store.system.tokens ? `Tokens today: ${short(store.system.tokens.today)}` : ""; setBoard(boardLine, tokensLine); });
renderBoard();
