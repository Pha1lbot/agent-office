// Roles view: a board (a column per stage) and a sortable list of every role,
// with the key details at a glance. Also the strip (Hal, backup, tokens), the
// "Waiting on you" box, and the edit and add-role dialogs.
import { store, on, roleById, queuedFor } from "./store.js";
import {
  $, esc, clock, short, safeUrl, roleName, post, fitDots, verdictBadge, VERDICT_RANK, closing, overdue, shortDate, longWhen,
  STATUS_ORDER, STATUS_LABEL, STATUS_COLOUR, OPEN, CLOSED,
} from "./util.js";

// Leads (found, skipped) have their own view (views.js); the board starts at Shortlisted.
const COLUMNS = ["shortlisted", "drafted", "approved", "applied", "interview", "offer"];
const LEAD = new Set(["found", "skipped"]);
const REASON_STATUSES = new Set(["skipped", "rejected"]);
const HAL_TASK = {
  shortlisted: "Hal will get Wren to draft a tailored CV and cover letter.",
  approved: "Ada will make the PDFs straight away (or Wren drafts first if there are no Word files yet).",
  interview: "Hal will get Cole to write your key talking points and prep notes.",
  applied: "Ada will set a follow-up date for a week from today.",
};
const ui = { view: "board", q: "", list: "", style: "", sort: "priority", dir: 1, closedOpen: false };
try { Object.assign(ui, JSON.parse(localStorage.getItem("office.pipeline") || "{}")); } catch { /* use defaults */ }
const remember = () => { try { localStorage.setItem("office.pipeline", JSON.stringify({ view: ui.view, sort: ui.sort, dir: ui.dir })); } catch { /* fine */ } };

const halOn = (r) => queuedFor(r.id).length > 0 || (store.system.cos?.running && queuedFor(r.id).length > 0);
const workStyle = (r) => { const l = (r.location || "").toLowerCase(); return l.includes("remote") ? "remote" : l.includes("hybrid") ? "hybrid" : "office"; };
const payNumber = (p) => { const m = String(p || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k)?/i); return m ? Number(m[1]) * (m[2] ? 1000 : 1) : 0; };

function filtered() {
  const q = ui.q.trim().toLowerCase();
  return (store.tracker.roles || []).filter((r) => !LEAD.has(r.status) &&
    (!q || `${r.title} ${r.company} ${r.location} ${r.notes || ""}`.toLowerCase().includes(q)) &&
    (!ui.list || r.list === ui.list) &&
    (!ui.style || workStyle(r) === ui.style));
}

// ---------- Board ----------
function docTicks(id) {
  const d = store.docs[id] || {};
  const tick = (on, label) => `<span class="tick ${on ? "on" : ""}" title="${label}${on ? "" : " not yet"}">${on ? "✓" : "·"} ${label}</span>`;
  return `<div class="ticks">${tick(d.cv, "CV")}${tick(d.letter, "Letter")}${tick(d.cvPdf, "PDF")}${d.prep || d.points ? tick(true, "Prep") : ""}${d.attachments ? `<span class="tick on" title="Attachments">📎 ${d.attachments}</span>` : ""}</div>`;
}

function card(r) {
  const c = closing(r.closing_date);
  const iv = r.interview_at && OPEN.has(r.status) ? `<div class="meta iv">🗓 Interview ${esc(longWhen(r.interview_at))}</div>` : "";
  const late = overdue(r.next);
  return `<article class="pcard" draggable="${store.system.editing}" data-id="${esc(r.id)}" tabindex="0" aria-label="${esc(r.title)} at ${esc(r.company)}">
    <div class="pc-top"><span class="pc-title">${esc(r.title)}</span>${r.priority ? `<span class="prio" title="Priority">P${esc(r.priority)}</span>` : ""}</div>
    <div class="pc-co">${esc(r.company)}</div>
    <div class="meta">${esc(r.pay || "Pay not stated")}${r.location ? ` · ${esc(r.location)}` : ""}</div>
    <div class="meta row">${fitDots(r.fit)}${verdictBadge(r)}${c ? `<span class="close ${c.level}">${esc(c.text)}</span>` : ""}</div>
    ${iv}
    ${["found", "shortlisted"].includes(r.status) ? "" : docTicks(r.id)}
    ${r.next ? `<div class="next ${late ? "late" : ""}" title="${esc(r.next)}">${late ? "⚠ " : ""}${esc(r.next)}</div>` : ""}
    ${halOn(r) ? `<div class="hal-on">● Hal is on it</div>` : ""}
    ${store.system.editing ? `<select class="card-status" data-id="${esc(r.id)}" aria-label="Move ${esc(r.title)}">${STATUS_ORDER.map((st) => `<option value="${st}"${st === r.status ? " selected" : ""}>${STATUS_LABEL[st]}</option>`).join("")}</select>` : ""}
  </article>`;
}

function renderBoard(roles) {
  const by = (st) => roles.filter((r) => r.status === st).sort((a, b) => (a.priority || 99) - (b.priority || 99) || (Number(b.fit) || 0) - (Number(a.fit) || 0));
  const col = (st) => {
    const list = by(st);
    return `<section class="col" data-status="${st}">
      <h3><span class="dot" style="background:${STATUS_COLOUR[st]}"></span>${STATUS_LABEL[st]}<span class="count">${list.length}</span></h3>
      <div class="col-body">${list.map(card).join("") || `<p class="col-empty">Nothing here</p>`}</div>
    </section>`;
  };
  const closed = roles.filter((r) => CLOSED.has(r.status));
  $("board").innerHTML = `<div class="cols">${COLUMNS.map(col).join("")}</div>
    <details class="closed col" data-status="rejected" ${ui.closedOpen ? "open" : ""}>
      <summary><span class="dot" style="background:${STATUS_COLOUR.rejected}"></span>Rejected<span class="count">${closed.length}</span>
        <span class="hint">Drop a card here to close it. Roles you decide not to go for move to Leads → Dismissed.</span></summary>
      <div class="col-body closed-body">${closed.map(card).join("") || `<p class="col-empty">Nothing closed yet</p>`}</div>
    </details>`;
}

// ---------- List ----------
function sortValue(r) {
  switch (ui.sort) {
    case "fit": return Number(r.fit) || 0;
    case "pay": return payNumber(r.pay);
    case "closing": return r.closing_date || "9999";
    case "updated": return r.updated || "";
    case "verdict": return VERDICT_RANK[r.verdict] ?? 2;
    default: return r.priority || 99;
  }
}
function renderList(roles) {
  const rows = roles.slice().sort((a, b) => {
    const x = sortValue(a), y = sortValue(b);
    return (x < y ? -1 : x > y ? 1 : 0) * ui.dir || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });
  document.querySelectorAll("#list th[data-sort]").forEach((th) => th.setAttribute("aria-sort", th.dataset.sort === ui.sort ? (ui.dir > 0 ? "ascending" : "descending") : "none"));
  $("roles").innerHTML = rows.length ? rows.map((r) => {
    const url = safeUrl(r.url), c = closing(r.closing_date), d = store.docs[r.id] || {};
    return `<tr class="clickable" data-id="${esc(r.id)}">
      <td><span class="status" style="background:${STATUS_COLOUR[r.status] || "#9aa0b5"}">${esc(STATUS_LABEL[r.status] || r.status)}</span></td>
      <td>${esc(r.priority ?? "")}</td>
      <td>${esc(r.title)}${r.list ? `<div class="list-tag">${esc(r.list)}</div>` : ""}</td>
      <td title="${esc(r.company)}">${esc(r.company)}</td><td title="${esc(r.pay)}">${esc(r.pay || "Not stated")}</td><td title="${esc(r.location)}">${esc(r.location)}</td>
      <td>${fitDots(r.fit)}</td>
      <td>${verdictBadge(r, "")}</td>
      <td>${c ? `<span class="close ${c.level}">${esc(shortDate(r.closing_date))}</span>` : ""}</td>
      <td class="docs-cell">${d.cv ? "CV " : ""}${d.letter ? "Letter " : ""}${d.cvPdf ? "PDF " : ""}${d.attachments ? `📎${d.attachments}` : ""}</td>
      <td class="next ${overdue(r.next) ? "late" : ""}" title="${esc(r.next)}">${esc(r.next)}</td>
      <td>${esc(shortDate(r.updated))}${url ? ` <a href="${esc(url)}" target="_blank" rel="noopener" title="Open the advert">↗</a>` : ""}</td></tr>`;
  }).join("") : `<tr><td colspan="12" class="empty">${(store.tracker.roles || []).length ? "No roles match." : "No roles yet. Run /hal start the day in Claude Code."}</td></tr>`;
}

export function renderPipeline() {
  if (dragId) return; // don't redraw the board under a card being dragged
  const lists = [...new Set((store.tracker.roles || []).map((r) => r.list).filter(Boolean))].sort();
  const sel = $("filter-list");
  const keep = ui.list;
  sel.innerHTML = `<option value="">All lists</option>` + lists.map((l) => `<option${l === keep ? " selected" : ""}>${esc(l)}</option>`).join("");
  const roles = filtered();
  $("board").hidden = ui.view !== "board";
  $("list").hidden = ui.view !== "list";
  document.querySelectorAll("#roles-seg [data-view]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === ui.view));
  $("add-role").disabled = !store.system.editing;
  if (ui.view === "board") renderBoard(roles); else renderList(roles);
}

// ---------- Moving a role ----------
async function move(id, status) {
  const role = roleById(id);
  if (!role || role.status === status) return;
  if (REASON_STATUSES.has(status)) return openEdit(id, status);
  try { await post(`/api/roles/${id}`, { changes: { status } }); }
  catch (err) { alert(err.message); renderPipeline(); }
}

const board = $("board");
let dragId = null;
board.addEventListener("dragstart", (e) => {
  const c = e.target.closest(".pcard");
  if (!c) return;
  dragId = c.dataset.id;
  e.dataTransfer.setData("text/plain", dragId);
  e.dataTransfer.effectAllowed = "move";
  c.classList.add("dragging");
});
board.addEventListener("dragend", (e) => { e.target.closest?.(".pcard")?.classList.remove("dragging"); dragId = null; board.querySelectorAll(".drop").forEach((x) => x.classList.remove("drop")); });
board.addEventListener("dragover", (e) => {
  const col = e.target.closest("[data-status]");
  if (!col || !dragId) return;
  e.preventDefault();
  board.querySelectorAll(".drop").forEach((x) => x !== col && x.classList.remove("drop"));
  col.classList.add("drop");
});
board.addEventListener("drop", (e) => {
  const col = e.target.closest("[data-status]");
  if (!col) return;
  e.preventDefault();
  col.classList.remove("drop");
  const id = e.dataTransfer.getData("text/plain") || dragId;
  if (id) move(id, col.dataset.status);
});
board.addEventListener("change", (e) => { const s = e.target.closest(".card-status"); if (s) move(s.dataset.id, s.value); });
board.addEventListener("click", (e) => {
  if (e.target.closest("select, a, summary")) return;
  const c = e.target.closest(".pcard");
  if (c) location.hash = `#role/${c.dataset.id}`;
});
board.addEventListener("keydown", (e) => {
  const c = e.target.closest?.(".pcard");
  if (c && e.key === "Enter" && e.target === c) location.hash = `#role/${c.dataset.id}`;
});
board.addEventListener("toggle", (e) => { if (e.target.matches?.("details.closed")) ui.closedOpen = e.target.open; }, true);

$("roles").addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  const row = e.target.closest("tr[data-id]");
  if (row) location.hash = `#role/${row.dataset.id}`;
});
document.querySelector("#list thead").addEventListener("click", (e) => {
  const th = e.target.closest("th[data-sort]");
  if (!th) return;
  if (ui.sort === th.dataset.sort) ui.dir = -ui.dir; else { ui.sort = th.dataset.sort; ui.dir = ["fit", "pay", "updated"].includes(ui.sort) ? -1 : 1; }
  remember();
  renderPipeline();
});
$("roles-seg").addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]");
  if (b) { ui.view = b.dataset.view; remember(); renderPipeline(); }
});
$("search").addEventListener("input", (e) => { ui.q = e.target.value; renderPipeline(); });
$("filter-list").addEventListener("change", (e) => { ui.list = e.target.value; renderPipeline(); });
$("filter-style").addEventListener("change", (e) => { ui.style = e.target.value; renderPipeline(); });

// ---------- Waiting on you ----------
function renderTodo() {
  const roles = store.tracker.roles || [];
  const items = [];
  for (const a of store.agents.values()) {
    if (a.state === "waiting") items.push(a.detail === "Your turn" ? `${esc(a.name)} is waiting for your reply` : `${esc(a.name)}: ${esc(a.detail)}`);
  }
  const by = (s) => roles.filter((r) => r.status === s);
  const link = (r) => `<a href="#role/${esc(r.id)}">${roleName(r)}</a>`;
  const drafted = by("drafted"), approved = by("approved"), found = by("found");
  if (drafted.length) items.push(`${drafted.length} CV${drafted.length > 1 ? "s" : ""} to check: ${drafted.map(link).join(", ")}`);
  if (approved.length) items.push(`Ready to apply: ${approved.map(link).join(", ")}`);
  const late = roles.filter((r) => OPEN.has(r.status) && overdue(r.next));
  if (late.length) items.push(`Follow-ups due: ${late.map(link).join(", ")}`);
  const closingSoon = roles.filter((r) => ["shortlisted", "drafted", "approved"].includes(r.status) && closing(r.closing_date)?.level === "soon");
  if (closingSoon.length) items.push(`Closing soon: ${closingSoon.map((r) => `${link(r)} (${esc(closing(r.closing_date).text)})`).join(", ")}`);
  if (found.length) items.push(`<a href="#leads">${found.length} lead${found.length > 1 ? "s" : ""} to look at</a>`);
  const soon = Date.now() + 14 * 864e5;
  for (const r of roles.filter((r) => r.interview_at && OPEN.has(r.status)).sort((a, b) => a.interview_at.localeCompare(b.interview_at))) {
    const when = new Date(r.interview_at);
    if (when.getTime() < Date.now() - 864e5 || when.getTime() > soon) continue;
    items.push(`Interview ${esc(longWhen(r.interview_at))}: ${link(r)}${r.interview_with ? ` with ${esc(r.interview_with)}` : ""}`);
  }
  const todo = (store.tracker.actions || []).filter((a) => !a.done).length;
  if (todo) items.push(`<a href="#actions">${todo} next action${todo > 1 ? "s" : ""}</a>`);
  const queued = (store.tracker.inbox || []).filter((i) => !i.done).length;
  if (queued) items.push(`${queued} request${queued > 1 ? "s" : ""} queued for Hal`);
  $("todo").classList.toggle("clear", !items.length);
  $("todo-list").innerHTML = items.length ? items.map((i) => `<li>${i}</li>`).join("") : `<li class="sub">Nothing waiting on you.</li>`;
}

// ---------- Strip: backup, Hal, tokens ----------
function renderSystem() {
  const system = store.system;
  const parts = [];
  const b = system.backup;
  if (b && b.state !== "idle") {
    parts.push(b.state === "error" ? `<span class="err">Backup: ${esc(b.message)}</span>` : `<span>Backup: ${esc(b.message)}${b.state === "saved" && b.at ? ` ${clock(b.at)}` : ""}</span>`);
  }
  const c = system.cos;
  if (!system.editing) parts.push("<span>Viewing only: editing needs Python 3 on this PC.</span>");
  else if (!c?.available) parts.push("<span><b>Hal</b>: Claude Code isn't installed here, so run /hal yourself.</span>");
  else {
    let state;
    if (c.running) state = `working on ${c.inbox} request${c.inbox === 1 ? "" : "s"}…`;
    else if (c.startsAt) { const s = Math.max(0, Math.round((c.startsAt - Date.now()) / 1000)); state = `starts in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} (${c.inbox} request${c.inbox === 1 ? "" : "s"})`; }
    else if (c.inbox) state = `${c.inbox} request${c.inbox === 1 ? "" : "s"} waiting`;
    else state = c.last ? `${esc(c.last.message)} ${clock(c.last.at)}` : "nothing to do";
    const err = c.last && !c.last.ok && !c.running && !c.startsAt;
    parts.push(`<span class="${err ? "err" : ""}"><b>Hal</b>: ${state}</span>`);
    parts.push(`<span>${c.runsToday} of ${c.maxPerDay} automatic runs today</span>`);
    if (c.inbox && !c.running) parts.push(`<button type="button" data-cos="run">Run now</button>`);
    parts.push(`<button type="button" data-cos="auto" aria-pressed="${c.auto}">Auto start: ${c.auto ? "on" : "off"}</button>`);
  }
  const tk = system.tokens;
  if (tk) parts.push(`<span class="${tk.budget && tk.today >= tk.budget ? "err" : ""}">Tokens today: <b>${short(tk.today)}</b>${tk.budget ? ` of ${short(tk.budget)} budget` : ""}</span>`);
  $("sysbar").innerHTML = parts.join("");
  clearTimeout(renderSystem.t);
  if (c?.startsAt) renderSystem.t = setTimeout(renderSystem, 1000);
}
$("sysbar").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-cos]");
  if (!b) return;
  try { await post("/api/cos", b.dataset.cos === "run" ? { run: true } : { auto: !store.system.cos.auto }); }
  catch (err) { alert(err.message); }
});

// ---------- Edit dialog (also used by the role page) ----------
const FIELDS = ["title", "company", "pay", "location", "url", "status", "priority", "next", "reason", "closing_date", "interview_at", "interview_with", "notes"];
const editForm = $("edit-form");
let editing = null;
export function openEdit(id, status) {
  const role = roleById(id);
  if (!role) return;
  editing = role;
  $("edit-title").textContent = role.title;
  $("edit-sub").textContent = role.company;
  $("edit-status").innerHTML = STATUS_ORDER.map((st) => `<option value="${st}">${STATUS_LABEL[st]}</option>`).join("");
  for (const name of FIELDS) editForm.elements[name].value = role[name] ?? "";
  if (status) editForm.elements.status.value = status;
  editForm.elements.advert.value = "";
  $("edit-err").textContent = "";
  editHints();
  $("edit-dlg").showModal();
  if (status && REASON_STATUSES.has(status)) editForm.elements.reason.focus();
}
function editHints() {
  const st = editForm.elements.status.value;
  $("reason-wrap").hidden = !REASON_STATUSES.has(st) && !editing?.reason;
  const changed = editing && st !== editing.status;
  const cos = store.system.cos;
  const needsHal = ["shortlisted", "interview"].includes(st);
  $("edit-hint").textContent = changed && HAL_TASK[st]
    ? HAL_TASK[st] + (needsHal ? (cos?.available && cos.auto ? " He starts by himself a couple of minutes after your last change." : " Run /hal in Claude Code to start him.") : "")
    : "";
}
editForm.elements.status.addEventListener("change", editHints);
editForm.addEventListener("submit", async (e) => {
  if (e.submitter?.value !== "save") return;
  e.preventDefault();
  const changes = {};
  for (const name of FIELDS) {
    const value = editForm.elements[name].value.trim();
    if (value !== String(editing[name] ?? "")) changes[name] = value;
  }
  const advert = editForm.elements.advert.value.trim();
  if (!Object.keys(changes).length && !advert) return $("edit-dlg").close();
  try {
    const out = await post(`/api/roles/${editing.id}`, { changes, advert });
    $("edit-dlg").close();
    if (out.read) alert("Saved. Rita will read the advert and Hal will give a fresh verdict.");
  }
  catch (err) { $("edit-err").textContent = err.message; }
});
$("edit-dlg").addEventListener("close", () => renderPipeline());

// ---------- Add a role ----------
const addForm = $("add-form");
$("add-role").addEventListener("click", () => {
  if (!store.system.editing) return alert("Editing needs the office running on your PC with Python 3 installed.");
  addForm.reset();
  $("add-err").textContent = "";
  $("add-dlg").showModal();
});
addForm.addEventListener("submit", async (e) => {
  if (e.submitter?.value !== "save") return;
  e.preventDefault();
  try { await post("/api/roles", Object.fromEntries(new FormData(addForm))); $("add-dlg").close(); }
  catch (err) { $("add-err").textContent = err.message; }
});

on("tracker", () => { renderPipeline(); renderTodo(); });
on("docs", renderPipeline);
on("agents", renderTodo);
on("system", () => { renderSystem(); renderPipeline(); });
