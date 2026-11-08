// A role's page (#role/<id>): Overview, Documents, Interview and Activity.
// Markdown from the team (and adverts from the web) is rendered with marked and
// always cleaned with DOMPurify before it is shown.
import { marked } from "/vendor/marked.mjs";
import DOMPurify from "/vendor/purify.mjs";
import { store, on, roleById, queuedFor } from "./store.js";
import { $, esc, post, safeUrl, fitDots, verdictBadge, closing, overdue, shortDate, longWhen, STATUS_ORDER, STATUS_LABEL, STATUS_COLOUR } from "./util.js";
import { openEdit } from "./dashboard.js";

const SECTIONS = [["overview", "Overview"], ["documents", "Documents"], ["interview", "Interview"], ["activity", "Activity"]];
const page = $("view-role");
let current = null; // { id, data: { role, files, texts, docs } }
let section = "overview";
let points = null; // the talking points being edited: { items: [], suggestions: [], dirty }
let stale = false;
let flash = null; // { text, until }: a confirmation that survives the page reloading its data
const say = (text) => { flash = { text, until: Date.now() + 8000 }; renderNotice(); setTimeout(renderNotice, 8100); };

const md = (text) => DOMPurify.sanitize(marked.parse(text || "", { gfm: true, breaks: false }));
const hasFile = (name) => current?.data.files.some((f) => f.name === name);
const fileUrl = (name) => `/files/roles/${encodeURIComponent(current.id)}/${name.split("/").map(encodeURIComponent).join("/")}`;
const kb = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export async function showRole(id, want) {
  page.hidden = false;
  if (current?.id !== id) { section = "overview"; points = null; }
  if (want && SECTIONS.some(([k]) => k === want)) section = want;
  current = { id, data: null };
  page.innerHTML = `<p class="loading">Loading…</p>`;
  await load();
}
export function hideRole() {
  page.hidden = true;
  current = null;
  points = null;
}

async function load() {
  if (!current) return;
  const id = current.id;
  const res = await fetch(`/api/roles/${encodeURIComponent(id)}`);
  if (current?.id !== id) return;
  if (!res.ok) {
    page.innerHTML = `<p class="muted">That role isn't in the tracker. <a href="#roles">Back to Roles</a></p>`;
    return;
  }
  current.data = await res.json();
  stale = false;
  if (!points || !points.dirty) points = parsePoints(current.data.texts["talking-points.md"]);
  render();
}

// Reload when this role's tracker entry or files change, unless Hal is mid-edit.
function refreshIfOpen() {
  if (!current?.data) return;
  if (points?.dirty) { stale = true; renderNotice(); return; }
  void load();
}
on("tracker", refreshIfOpen);
on("docs", () => { if (current?.data && JSON.stringify(store.docs[current.id]) !== JSON.stringify(current.data.docs)) refreshIfOpen(); });
on("system", () => { if (current?.data) renderHeaderBits(); });

// ---------- Talking points ----------
function parsePoints(text) {
  const items = [], suggestions = [];
  let inSuggestions = false;
  for (const line of (text || "").split("\n")) {
    if (/^##\s+Suggestions from Cole/i.test(line)) { inSuggestions = true; continue; }
    if (/^#{1,6}\s/.test(line)) { if (!/^#\s/.test(line)) inSuggestions = /Suggestions/i.test(line); continue; }
    const m = /^\s*[-*]\s+(.*\S)\s*$/.exec(line);
    if (m) (inSuggestions ? suggestions : items).push(m[1]);
  }
  return { items, suggestions, dirty: false };
}
function pointsText() {
  const r = current.data.role;
  const lines = [`# Key talking points: ${r.title} at ${r.company}`, "", ...points.items.filter((p) => p.trim()).map((p) => `- ${p.trim()}`)];
  if (points.suggestions.length) lines.push("", "## Suggestions from Cole", "", ...points.suggestions.map((p) => `- ${p}`));
  return lines.join("\n");
}

// ---------- Rendering ----------
function render() {
  const { role, docs } = current.data;
  const url = safeUrl(role.url);
  const c = closing(role.closing_date);
  const editing = store.system.editing;
  page.innerHTML = `
    <nav class="crumbs">${["found", "skipped"].includes(role.status) ? `<a href="#leads">← Leads</a>` : `<a href="#roles">← Roles</a>`}</nav>
    <div class="role-head">
      <div>
        <h2>${esc(role.title)}</h2>
        <p class="role-co">${esc(role.company)}</p>
        <p class="role-meta">${esc(role.pay || "Pay not stated")}${role.location ? ` · ${esc(role.location)}` : ""}${c ? ` · <span class="close ${c.level}">${esc(c.text)}${role.closing_date ? ` (${esc(shortDate(role.closing_date))})` : ""}</span>` : ""} ${fitDots(role.fit)}</p>
      </div>
      <div class="role-actions">
        ${editing ? `<select id="role-status" class="status-select" aria-label="Status" style="background-color:${STATUS_COLOUR[role.status]}">${STATUS_ORDER.map((s) => `<option value="${s}"${s === role.status ? " selected" : ""}>${STATUS_LABEL[s]}</option>`).join("")}</select>`
          : `<span class="status" style="background:${STATUS_COLOUR[role.status]}">${esc(STATUS_LABEL[role.status])}</span>`}
        ${url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open advert ↗</a>` : ""}
        ${editing ? `<button type="button" class="btn" id="role-edit">Edit details</button>` : ""}
        <span id="role-cass"></span>
      </div>
    </div>
    <div id="role-notice"></div>
    <nav class="role-tabs" role="tablist">${SECTIONS.map(([k, label]) => `<button role="tab" data-section="${k}" aria-selected="${k === section}">${label}${k === "documents" && (docs.cv || docs.letter) ? " ✓" : ""}${k === "interview" && (docs.prep || docs.points) ? " ✓" : ""}</button>`).join("")}</nav>
    <div class="role-body">${({ overview, documents, interview, activity })[section]()}</div>`;
  renderHeaderBits();
  renderNotice();
}

function renderHeaderBits() {
  const el = $("role-cass");
  if (!el || !current?.data) return;
  const q = queuedFor(current.id);
  el.innerHTML = q.length ? `<span class="cass-on" title="${esc(q.map((i) => i.task).join("; "))}">● Tim is on it${store.system.cos?.running ? " now" : ""}</span>` : "";
}
function renderNotice() {
  const el = $("role-notice");
  if (!el) return;
  const msg = flash && flash.until > Date.now() ? `<p class="notice ok">${esc(flash.text)}</p>` : "";
  el.innerHTML = msg + (stale ? `<p class="notice">This role has changed. <button type="button" id="role-reload">Load the new version</button> (your unsaved talking points will be lost)</p>` : "");
}

function overview() {
  const { role, texts } = current.data;
  const editing = store.system.editing;
  const asked = queuedFor(role.id).some((i) => /verdict|read the advert/i.test(i.task));
  const verdict = `
    <section class="panel verdict-panel">
      <h3>Tim's verdict: worth applying?</h3>
      ${role.verdict ? `<p class="verdict-line">${verdictBadge(role, "")} ${esc(role.verdict_why || "")}</p><p class="muted">Rita's reasons for and against are under "The role, from Rita".</p>`
        : `<p class="muted">No verdict yet.</p>`}
      ${asked ? `<p class="cass-on">● Tim is on it</p>` : editing ? `<button type="button" class="btn${role.verdict ? "" : " primary"}" data-request="verdict">${role.verdict ? "Ask again" : "Ask Tim: worth applying?"}</button>` : ""}
    </section>`;
  const advert = !texts["listing.md"] && texts["advert.txt"]
    ? `<h4>The advert you pasted</h4><pre class="advert">${esc(texts["advert.txt"])}</pre>` : "";
  return `${verdict}
    <div class="ov-grid">
      <section class="panel">
        <h3>Next step</h3>
        ${editing ? `<div class="inline-edit"><input id="ov-next" value="${esc(role.next)}" maxlength="300" placeholder="What needs to happen next?"><button type="button" data-save="next">Save</button></div>` : `<p>${esc(role.next) || "None set"}</p>`}
        ${overdue(role.next) ? `<p class="late">This follow-up is due.</p>` : ""}
        <h3>Notes</h3>
        ${editing ? `<div class="inline-edit col"><textarea id="ov-notes" rows="4" maxlength="2000">${esc(role.notes)}</textarea><button type="button" data-save="notes">Save notes</button></div>` : `<p>${esc(role.notes) || "No notes"}</p>`}
        <dl class="facts">
          <dt>Priority</dt><dd>${esc(role.priority ?? "–")}</dd>
          <dt>Source</dt><dd>${esc(role.source || "–")}</dd>
          <dt>List</dt><dd>${esc(role.list || "–")}</dd>
          <dt>Found</dt><dd>${esc(shortDate(role.found))}</dd>
          ${role.interview_at ? `<dt>Interview</dt><dd>${esc(longWhen(role.interview_at))}</dd>` : ""}
          ${role.reason ? `<dt>Reason</dt><dd>${esc(role.reason)}</dd>` : ""}
        </dl>
      </section>
      <section class="panel md">
        <h3>The role, from Rita</h3>
        ${texts["listing.md"] ? md(texts["listing.md"]) : `<p class="muted">No listing yet. Rita writes one when she finds a role or when you add one.</p>${advert}`}
      </section>
    </div>`;
}

function documents() {
  const { role, texts, files, docs } = current.data;
  const editing = store.system.editing;
  const doc = (title, mdName, docx, pdf) => `
    <section class="doc-panel">
      <div class="doc-head"><h3>${title}</h3><div class="doc-buttons">
        ${hasFile(docx) ? `<a class="btn" href="${fileUrl(docx)}" download>Download Word</a>` : ""}
        ${hasFile(pdf) ? `<a class="btn" href="${fileUrl(pdf)}" target="_blank" rel="noopener">PDF</a>` : `<span class="muted">${hasFile(docx) ? "PDF made when you approve" : ""}</span>`}
      </div></div>
      ${texts[mdName] ? `<div class="paper md">${md(texts[mdName])}</div>` : `<p class="muted">Not written yet.</p>`}
    </section>`;
  const attachments = files.filter((f) => f.name.startsWith("attachments/"));
  const nothing = !docs.cv && !docs.letter;
  return `
    ${nothing ? `<div class="panel callout"><p>Nothing drafted yet.</p>${editing && role.status === "found" ? `<button type="button" class="btn primary" data-status="shortlisted">Shortlist this role: Wren drafts a CV and letter</button>` : role.status === "shortlisted" || role.status === "drafted" ? `<p class="muted">Wren drafts a CV and letter when Tim next runs.</p>` : ""}</div>` : ""}
    ${texts["notes.md"] ? `<section class="panel md notes"><h3>Notes: Wren's questions and Ada's fact check</h3>${md(texts["notes.md"])}</section>` : ""}
    <div class="docs-grid">${doc("CV", "cv.md", "cv.docx", "cv.pdf")}${doc("Cover letter", "cover-letter.md", "cover-letter.docx", "cover-letter.pdf")}</div>
    <div class="ov-grid">
      <section class="panel">
        <h3>Attachments</h3>
        ${attachments.length ? `<ul class="files">${attachments.map((f) => `<li><a href="${fileUrl(f.name)}" ${f.name.endsWith(".pdf") ? 'target="_blank" rel="noopener"' : "download"}>${esc(f.name.slice(12))}</a> <span class="muted">${kb(f.size)}</span></li>`).join("")}</ul>` : `<p class="muted">None yet. Keep the exact CV you sent, or the advert saved as a PDF, here.</p>`}
        ${editing ? `<label class="btn upload">Attach a file<input type="file" id="attach" accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg" hidden></label><span id="attach-msg" class="muted"></span>` : ""}
      </section>
      ${editing ? `<section class="panel">
        <h3>Ask Wren for changes</h3>
        <textarea id="revise" rows="3" maxlength="300" placeholder="e.g. Shorter profile, lead with budgets, mention Airtable"></textarea>
        <button type="button" class="btn" data-request="revise">Send to Wren</button> <span id="revise-msg" class="muted"></span>
      </section>` : ""}
    </div>`;
}

function interview() {
  const { role, texts } = current.data;
  const editing = store.system.editing;
  const atInterview = role.status === "interview";
  const pts = points.items.length || editing ? `
    <ol class="points" id="points">${points.items.map((p, i) => `<li>
      ${editing ? `<textarea data-point="${i}" rows="2" aria-label="Talking point ${i + 1}">${esc(p)}</textarea>
      <span class="pt-buttons"><button type="button" data-up="${i}" title="Move up" ${i ? "" : "disabled"}>↑</button><button type="button" data-down="${i}" title="Move down" ${i < points.items.length - 1 ? "" : "disabled"}>↓</button><button type="button" data-del="${i}" title="Delete">✕</button></span>`
        : esc(p)}</li>`).join("")}</ol>
    ${editing ? `<div class="pt-actions"><button type="button" class="btn" id="pt-add">+ Add a point</button><button type="button" class="btn primary" id="pt-save" ${points.dirty ? "" : "disabled"}>Save talking points</button><span id="pt-msg" class="muted">${points.dirty ? "Unsaved changes" : ""}</span></div>` : ""}` : `<p class="muted">No talking points yet.</p>`;
  return `
    <div class="ov-grid">
      <section class="panel">
        <h3>The interview</h3>
        ${editing ? `<div class="inline-edit col">
            <label>Date and time<input type="datetime-local" id="iv-at" value="${esc(role.interview_at)}"></label>
            <label>Who with<input id="iv-with" value="${esc(role.interview_with)}" maxlength="200" placeholder="Names or panel"></label>
            <button type="button" data-save="interview">Save</button></div>`
          : `<p>${role.interview_at ? esc(longWhen(role.interview_at)) : "No date set"}${role.interview_with ? ` with ${esc(role.interview_with)}` : ""}</p>`}
        ${!atInterview && editing ? `<p class="muted">Set the status to Interview and Cole writes your talking points and prep.</p><button type="button" class="btn" data-status="interview">Set to Interview</button>` : ""}
      </section>
      <section class="panel points-panel">
        <h3>Key talking points</h3>
        <p class="muted small">What you want to get across. Yours to edit: Cole never overwrites them.</p>
        ${pts}
        ${points.suggestions.length ? `<h4>Suggestions from Cole</h4><ul class="suggestions">${points.suggestions.map((s, i) => `<li>${esc(s)} ${editing ? `<button type="button" data-adopt="${i}">Add to my points</button>` : ""}</li>`).join("")}</ul>` : ""}
      </section>
    </div>
    <section class="panel md prep">
      <div class="doc-head"><h3>Prep notes from Cole</h3>
        ${editing ? `<div class="doc-buttons"><input id="prep-note" maxlength="300" placeholder="Anything to focus on? (optional)"><button type="button" class="btn" data-request="prep">${texts["interview-prep.md"] ? "Refresh prep" : "Ask Cole for prep"}</button><span id="prep-msg" class="muted"></span></div>` : ""}</div>
      ${texts["interview-prep.md"] ? md(texts["interview-prep.md"]) : `<p class="muted">No prep notes yet.</p>`}
    </section>`;
}

function activity() {
  const { role } = current.data;
  const events = [
    ...(role.history || []).map((h) => ({ when: h.date, text: `${h.by === "tim" ? "You" : "The team"} moved it to ${STATUS_LABEL[h.status] || h.status}` })),
    ...(store.tracker.inbox || []).filter((i) => i.role === role.id).flatMap((i) => [
      { when: i.at, text: `Asked Tim: ${i.task}` },
      ...(i.done && i.handled ? [{ when: i.handled, text: `Tim finished: ${i.task}` }] : []),
    ]),
    ...(current.data.files || []).filter((f) => !f.name.startsWith("listing")).map((f) => ({ when: new Date(f.modified).toISOString(), text: `${f.name.startsWith("attachments/") ? "Attached" : "Saved"} ${f.name.replace("attachments/", "")}` })),
  ].sort((a, b) => String(b.when).localeCompare(String(a.when)));
  return `<section class="panel"><ul class="timeline">${events.map((e) => `<li><time>${esc(e.when.length > 10 ? longWhen(e.when) : shortDate(e.when))}</time><span>${esc(e.text)}</span></li>`).join("") || "<li>Nothing yet.</li>"}</ul></section>`;
}

// ---------- Actions ----------
async function saveChanges(changes, msgEl) {
  try { await post(`/api/roles/${current.id}`, { changes }); say("Saved."); }
  catch (err) { alert(err.message); }
}

page.addEventListener("click", async (e) => {
  if (!current?.data) return;
  const t = e.target;
  const tab = t.closest("[data-section]");
  if (tab) { section = tab.dataset.section; render(); return; }
  if (t.id === "role-reload") { points = null; stale = false; await load(); return; }
  if (t.id === "role-edit") return openEdit(current.id);
  const st = t.closest("[data-status]");
  if (st) return saveChanges({ status: st.dataset.status });
  const save = t.closest("[data-save]");
  if (save) {
    if (save.dataset.save === "next") return saveChanges({ next: $("ov-next").value.trim() });
    if (save.dataset.save === "notes") return saveChanges({ notes: $("ov-notes").value.trim() });
    if (save.dataset.save === "interview") return saveChanges({ interview_at: $("iv-at").value, interview_with: $("iv-with").value.trim() });
  }
  const req = t.closest("[data-request]");
  if (req) {
    const kind = req.dataset.request;
    if (kind === "verdict") {
      try { await post(`/api/roles/${current.id}/request`, { kind }); say("Sent: Tim will ask Rita whether it's worth applying for."); }
      catch (err) { say(err.message); }
      return;
    }
    const box = kind === "revise" ? $("revise") : $("prep-note");
    const msg = $(kind === "revise" ? "revise-msg" : "prep-msg");
    if (kind === "revise" && !box.value.trim()) { msg.textContent = "Say what you'd like changed first."; return; }
    try { await post(`/api/roles/${current.id}/request`, { kind, text: box.value.trim() }); box.value = ""; say(kind === "revise" ? "Sent: Tim will brief Wren with your changes." : "Sent: Tim will brief Cole to refresh your prep."); }
    catch (err) { msg.textContent = err.message; }
    return;
  }
  // talking points editor
  const idx = (k) => Number(t.dataset[k]);
  if (t.dataset.up !== undefined) { const i = idx("up"); [points.items[i - 1], points.items[i]] = [points.items[i], points.items[i - 1]]; points.dirty = true; render(); }
  else if (t.dataset.down !== undefined) { const i = idx("down"); [points.items[i + 1], points.items[i]] = [points.items[i], points.items[i + 1]]; points.dirty = true; render(); }
  else if (t.dataset.del !== undefined) { points.items.splice(idx("del"), 1); points.dirty = true; render(); }
  else if (t.dataset.adopt !== undefined) { points.items.push(points.suggestions.splice(idx("adopt"), 1)[0]); points.dirty = true; render(); }
  else if (t.id === "pt-add") { points.items.push(""); points.dirty = true; render(); page.querySelector(`[data-point="${points.items.length - 1}"]`)?.focus(); }
  else if (t.id === "pt-save") {
    try {
      await post(`/api/roles/${current.id}/talking-points`, { text: pointsText() });
      points.items = points.items.filter((p) => p.trim());
      points.dirty = false;
      stale = false;
      await load();
      say("Talking points saved.");
    } catch (err) { $("pt-msg").textContent = err.message; }
  }
});
page.addEventListener("input", (e) => {
  const ta = e.target.closest("[data-point]");
  if (!ta) return;
  points.items[Number(ta.dataset.point)] = ta.value;
  if (!points.dirty) { points.dirty = true; $("pt-save").disabled = false; $("pt-msg").textContent = "Unsaved changes"; }
});
page.addEventListener("change", async (e) => {
  if (e.target.id === "role-status") {
    const status = e.target.value;
    if (["skipped", "rejected"].includes(status)) { e.target.value = current.data.role.status; return openEdit(current.id, status); }
    return saveChanges({ status });
  }
  if (e.target.id === "attach") {
    const file = e.target.files[0];
    if (!file) return;
    const msg = $("attach-msg");
    if (file.size > 10 * 1024 * 1024) { msg.textContent = "Files can be up to 10 MB."; return; }
    msg.textContent = "Uploading…";
    const res = await fetch(`/api/roles/${current.id}/attachments?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { msg.textContent = out.error || "Couldn't attach that."; return; }
    await load();
    say(`Attached ${out.name}.`);
  }
});
window.addEventListener("beforeunload", (e) => { if (points?.dirty) e.preventDefault(); });
