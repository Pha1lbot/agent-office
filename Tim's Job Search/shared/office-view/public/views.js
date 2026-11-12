// The dashboard views in the style of Tim's Job Hunt artifact: Overview, Leads,
// Interviews, Next actions and CVs, plus the sidebar (counts, target card), the
// greeting and the Tailor dialog. Roles (the board) is dashboard.js; a role's own
// page is role.js; the 3D office is office.js.
import { marked } from "/vendor/marked.mjs";
import DOMPurify from "/vendor/purify.mjs";
import { store, on, roleById, queuedFor } from "./store.js";
import {
  $, esc, post, safeUrl, fitDots, verdictBadge, closing, overdue, shortDate, longWhen, toast, svg, ICON, yearlyPay,
  STATUS_LABEL, STATUS_COLOUR, VERDICT_LABEL,
} from "./util.js";

const md = (text) => DOMPurify.sanitize(marked.parse(text || "", { gfm: true }));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
const roles = () => store.tracker.roles || [];
const LEAD = new Set(["found", "skipped"]);
const ACTIVE = new Set(["shortlisted", "drafted", "approved", "applied", "interview"]);
const PIPE = ["found", "shortlisted", "drafted", "approved", "applied", "interview", "offer", "rejected"];
const ui = { view: "overview", q: "", leadFilter: "all", leadShow: "open", animate: true };
let jobSearch = null; // { rules, prefs, cvBank, hasDefaultCv } from /api/job-search

const ever = (r, s) => r.status === s || (r.history || []).some((h) => h.status === s);
const matches = (r) => !ui.q || `${r.title} ${r.company} ${r.location} ${r.notes || ""} ${r.verdict_why || ""}`.toLowerCase().includes(ui.q);
const halOn = (r) => queuedFor(r.id).length > 0;
const todayKey = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local (UK) date
const FIT_LABEL = { strong: "Strong", possible: "Possible", weak: "Weak" };
const isNewLead = (r) => r.found === todayKey() && (r.history || [])[0]?.by === "hal";
/** The latest batch of finds: today's, or else the most recent day's. */
function latestFinds() {
  const f = store.tracker.found || { items: [], runs: [] };
  const days = [...new Set(f.items.map((i) => (i.found_at || "").slice(0, 10)))].sort();
  const day = days.includes(todayKey()) ? todayKey() : days[days.length - 1];
  const items = day ? f.items.filter((i) => (i.found_at || "").startsWith(day)) : [];
  return { day, items, added: items.filter((i) => i.triage?.action === "added"), dismissed: items.filter((i) => i.triage?.action === "dismissed"),
    pending: items.filter((i) => !i.triage), runs: f.runs || [], lastRun: (f.runs || [])[(f.runs || []).length - 1] };
}
const dayWord = (day) => (day === todayKey() ? "this morning" : day ? `on ${shortDate(day)}` : "");
function docLabel(r) {
  const d = store.docs[r.id] || {};
  if (halOn(r) && ["shortlisted", "drafted"].includes(r.status)) return `<span class="tg">Wren writing</span>`;
  if (r.status === "approved" && d.cvPdf) return `<span class="tg docs">PDFs ready</span>`;
  if (d.cv) return `<span class="tg docs">${r.status === "drafted" ? "Ready to check" : "CV and letter"}</span>`;
  return "";
}
function emptyBox(title, body, button, href) {
  return `<div class="empty"><div class="e-t">${esc(title)}</div><div class="e-b">${esc(body)}</div>${button ? `<a class="btn sm" href="${href}">${esc(button)}</a>` : ""}</div>`;
}
function countUp(root) {
  if (!ui.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll(".countup").forEach((el) => {
    const to = Number(el.dataset.to) || 0, start = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - start) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  requestAnimationFrame(() => root.querySelectorAll(".bar.pre").forEach((b) => b.classList.remove("pre")));
}

// ---------- Greeting, sidebar ----------
function greet() {
  const now = new Date(), h = now.getHours();
  $("greeting").textContent = `${h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening"}, Tim`;
  $("today").textContent = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
function counts() {
  const rs = roles();
  const n = {
    roles: rs.filter((r) => ACTIVE.has(r.status)).length,
    leads: rs.filter((r) => r.status === "found").length,
    interviews: rs.filter((r) => r.interview_at && new Date(r.interview_at) >= Date.now() - 36e5).length,
    actions: (store.tracker.actions || []).filter((a) => !a.done).length,
    cvs: rs.filter((r) => (store.docs[r.id] || {}).cv).length + 1,
    office: [...store.agents.values()].filter((a) => a.state === "typing" || a.state === "walking").length || "",
  };
  document.querySelectorAll("[data-count]").forEach((el) => { el.textContent = n[el.dataset.count] || ""; });
}
function pref(label) {
  const m = new RegExp(`^- ${label}[^:]*:\\s*(.+)$`, "mi").exec(jobSearch?.prefs || "");
  return m ? m[1].replace(/\*\(assumed\)\*/g, "").trim() : "";
}
function money(text) { const n = yearlyPay(text); return n ? `£${Math.round(n / 1000)}k` : ""; }
function renderTarget() {
  const el = $("target");
  if (!jobSearch) { el.innerHTML = `<span class="eyebrow">Target</span><span class="t2">Loading…</span>`; return; }
  const min = money(pref("Minimum salary")), ideal = money(pref("Ideal salary"));
  const style = pref("Remote / hybrid");
  const sectors = pref("Sectors");
  el.innerHTML = `<span class="eyebrow">Target</span><strong>${esc([min && `${min}+`, ideal && `ideal ${ideal}+`].filter(Boolean).join(", ") || "Set in preferences.md")}</strong>` +
    `${style ? `<span class="t2">${esc(style[0].toUpperCase() + style.slice(1))}</span>` : ""}${sectors ? `<span class="t2">${esc(sectors)}</span>` : ""}`;
}
$("target").addEventListener("click", () => toast("Your target comes from preferences.md. To change it, ask Hal: /hal review my preferences."));
const app = $("app");
function collapse(c) {
  app.classList.toggle("collapsed", c);
  $("collapse").setAttribute("aria-expanded", String(!c));
  $("collapse").setAttribute("aria-label", c ? "Expand sidebar" : "Collapse sidebar");
  try { localStorage.setItem("office.sidebar", c ? "1" : "0"); } catch { /* fine */ }
}
$("collapse").addEventListener("click", () => collapse(!app.classList.contains("collapsed")));
try { collapse(localStorage.getItem("office.sidebar") === "1"); } catch { /* fine */ }

// ---------- Overview ----------
function kpis() {
  const rs = roles();
  const active = rs.filter((r) => ACTIVE.has(r.status)).length;
  const closed = rs.filter((r) => r.status === "rejected").length;
  const sent = rs.filter((r) => ever(r, "applied")).length;
  const ready = rs.filter((r) => r.status === "approved").length;
  const ivs = rs.filter((r) => ever(r, "interview")).length;
  const next = rs.filter((r) => r.interview_at && new Date(r.interview_at) >= Date.now()).sort((a, b) => a.interview_at.localeCompare(b.interview_at))[0];
  let top = null;
  for (const r of rs) {
    if (!ACTIVE.has(r.status) && r.status !== "offer") continue;
    const p = yearlyPay(r.pay), cur = /€/.test(r.pay || "") ? "€" : /\$/.test(r.pay || "") ? "$" : "£";
    if (p && (!top || p > top.n)) top = { n: p, co: r.company, cur };
  }
  const tiles = [
    { l: "Active roles", v: active, s: closed ? plural(closed, "rejected", "rejected") : "None rejected yet" },
    { l: "Applications sent", v: sent, s: ready ? `${plural(ready, "role")} ready to send` : "Nothing waiting to send" },
    { l: "Interviews", v: ivs, s: next ? `Next: ${new Date(next.interview_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : "None booked yet" },
    { l: "Top of pay range", v: top, s: top ? top.co : "Add pay to a role to see it here" },
  ];
  return `<section class="grid-kpi" aria-label="Key numbers">${tiles.map((t, i) => {
    const val = t.v === null ? "—" : typeof t.v === "number" ? `<span class="countup" data-to="${t.v}">${t.v}</span>` : `${t.v.cur}<span class="countup" data-to="${Math.round(t.v.n / 1000)}">${Math.round(t.v.n / 1000)}</span>k`;
    return `<div class="card kpi${ui.animate ? " enter" : ""}" style="animation-delay:${i * 60}ms"><span class="k-l">${t.l}</span><span class="k-v num">${val}</span><span class="k-s" title="${esc(t.s)}">${esc(t.s)}</span></div>`;
  }).join("")}</section>`;
}
function pipelineChart() {
  const c = {}; for (const s of PIPE) c[s] = 0;
  for (const r of roles()) if (r.status in c) c[r.status]++;
  const max = Math.max(1, ...Object.values(c));
  const cols = `grid-template-columns:repeat(${PIPE.length},minmax(0,1fr))`;
  return `<div class="card-h"><h2>Pipeline</h2><span class="sub">${plural(roles().length, "role")} tracked</span></div>
    <div class="bars" style="${cols}">${PIPE.map((s, i) => { const n = c[s], h = n ? Math.max(8, Math.round((n / max) * 100)) : 0;
      return `<div class="bar-col"><span class="bar-val${n ? "" : " zero"} countup" data-to="${n}">${n}</span><div class="bar${ui.animate ? " pre" : ""}" role="img" aria-label="${STATUS_LABEL[s]}: ${n}" style="height:${n ? `max(6px, calc(${h}% - 30px))` : "4px"};background:${n ? STATUS_COLOUR[s] : "var(--line-2)"};transition-delay:${i * 70}ms"></div></div>`; }).join("")}</div>
    <div class="bar-labels" style="${cols}">${PIPE.map((s) => `<span title="${STATUS_LABEL[s]}">${s === "found" ? "Leads" : STATUS_LABEL[s]}</span>`).join("")}</div>`;
}
function weeklyChart() {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const weeks = []; for (let i = 7; i >= 0; i--) { const s = new Date(start); s.setDate(start.getDate() - i * 7); weeks.push({ s, n: 0 }); }
  for (const r of roles()) for (const h of r.history || []) {
    if (h.status !== "applied") continue;
    const t = new Date(`${h.date}T12:00:00`);
    for (let j = weeks.length - 1; j >= 0; j--) if (t >= weeks[j].s) { weeks[j].n++; break; }
  }
  const max = Math.max(1, ...weeks.map((w) => w.n)), total = weeks.reduce((a, w) => a + w.n, 0);
  const cols = `grid-template-columns:repeat(${weeks.length},minmax(0,1fr))`;
  return `<div class="card-h"><h2>Applications per week</h2><span class="sub">${plural(total, "application")} in 8 weeks</span></div>
    <div class="bars week" style="${cols}">${weeks.map((w, i) => `<div class="bar-col"><span class="bar-val${w.n ? "" : " zero"}">${w.n}</span><div class="bar${ui.animate ? " pre" : ""}" style="height:${w.n ? `max(6px, calc(${Math.round((w.n / max) * 100)}% - 30px))` : "4px"};${w.n ? "" : "background:var(--line-2);"}transition-delay:${i * 50}ms"></div></div>`).join("")}</div>
    <div class="bar-labels" style="${cols}">${weeks.map((w) => `<span>${w.s.getDate()} ${w.s.toLocaleDateString("en-GB", { month: "short" })}</span>`).join("")}</div>`;
}
function interviewItems(limit) {
  const now = Date.now() - 36e5;
  const list = roles().filter((r) => r.interview_at).map((r) => ({ r, t: new Date(r.interview_at) })).filter((x) => !isNaN(x.t))
    .sort((a, b) => ((a.t < now) - (b.t < now)) || (a.t < now ? b.t - a.t : a.t - b.t));
  const rows = (limit ? list.filter((x) => x.t >= now).slice(0, limit) : list);
  return rows.map(({ r, t }) => `<a class="iv clickable${t < now ? " past" : ""}" href="#role/${esc(r.id)}/interview" style="color:inherit;text-decoration:none">
      <div class="iv-date"><b>${t.getDate()}</b><span>${t.toLocaleDateString("en-GB", { month: "short" })}</span></div>
      <div style="min-width:0"><div class="r-title">${esc(r.title)}</div><div class="r-co">${esc(r.company)} · ${esc(t.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }))}${r.interview_with ? ` · with ${esc(r.interview_with)}` : ""}</div>
      ${(store.docs[r.id] || {}).prep ? `<div class="tags"><span class="tg docs">Cole's prep ready</span></div>` : ""}</div></a>`).join("");
}
function actionItems(limit) {
  const all = store.tracker.actions || [];
  const open = all.filter((a) => !a.done), done = all.filter((a) => a.done);
  const list = limit ? open.slice(0, limit) : [...open, ...done.slice(-10).reverse()];
  return list.map((a) => {
    const role = a.role && roleById(a.role);
    return `<div class="act${a.done ? " done" : ""}"><input type="checkbox" data-action="${esc(a.id)}" ${a.done ? "checked" : ""} ${store.system.editing ? "" : "disabled"} aria-label="Done: ${esc(a.text)}">
      <div class="a-body"><span class="a-t">${esc(a.text)}</span>${a.options && !a.answer ? `<span class="a-q">${a.options.map((o) => `<button type="button" class="btn sm" data-answer="${esc(o)}" data-id="${esc(a.id)}" ${store.system.editing ? "" : "disabled"}>${esc(o)}</button>`).join("")}</span>` : ""}${a.answer ? `<span class="a-w">You answered: ${esc(a.answer)}</span>` : ""}<span class="a-w">${role ? `<a href="#role/${esc(role.id)}">${esc(role.company)}: ${esc(role.title)}</a> · ` : ""}${a.done && a.completed ? `done ${esc(shortDate(a.completed))}` : `added ${esc(shortDate(a.created))}`}</span></div></div>`;
  }).join("");
}
function addActionForm() {
  return store.system.editing ? `<form class="add-inline" data-form="add-action"><label class="sr" for="new-action">New action</label><input class="input" id="new-action" name="text" maxlength="300" placeholder="Add a next action…"><button class="btn" type="submit">Add</button></form>` : "";
}
function renderOverview() {
  const leads = roles().filter((r) => r.status === "found");
  const fresh = leads.filter((r) => r.verdict === "apply").length;
  const fb = latestFinds();
  const findLine = fb.items.length && fb.day === todayKey()
    ? `<div class="callout${ui.animate ? " enter" : ""}"><span><strong style="color:var(--text)">Rita found ${plural(fb.items.length, "new role")} ${dayWord(fb.day)}</strong>: ${fb.added.length} added to Leads, ${fb.dismissed.length} dismissed by Hal${fb.pending.length ? `, ${fb.pending.length} still to sort` : ""}.</span><button type="button" class="btn sm primary" data-found="open">Review</button></div>` : "";
  $("ov-callout").innerHTML = findLine || (leads.length ? `<div class="callout${ui.animate ? " enter" : ""}"><span><strong style="color:var(--text)">${plural(leads.length, "lead")}</strong> to look at${fresh ? `, ${fresh} that Hal says to apply for` : ""}.</span><a class="btn sm primary" href="#leads">Review</a></div>` : "");
  $("ov-kpis").innerHTML = kpis();
  $("ov-pipe").innerHTML = pipelineChart();
  $("ov-week").innerHTML = weeklyChart();
  const ivs = interviewItems(4);
  $("ov-iv").innerHTML = `<div class="card-h"><h2>Upcoming interviews</h2><a class="sub" href="#interviews">All</a></div>${ivs ? `<div class="list">${ivs}</div>` : emptyBox("None booked yet", "Set a role to Interview and add the date; Cole writes your prep.")}`;
  const acts = actionItems(5);
  const openN = (store.tracker.actions || []).filter((a) => !a.done).length;
  $("ov-acts").innerHTML = `<div class="card-h"><h2>Next actions</h2><a class="sub" href="#actions">${openN > 5 ? `All ${openN}` : "All"}</a></div>${acts ? `<div class="list">${acts}</div>` : `<p class="sub" style="margin:0">Nothing to do right now.</p>`}${addActionForm()}`;
  countUp($("v-overview"));
}

// ---------- Leads ----------
function leadRows() {
  const show = ui.leadShow === "dismissed" ? "skipped" : "found";
  return roles().filter((r) => r.status === show && matches(r) &&
    (ui.leadFilter === "all" || (ui.leadFilter === "none" ? !r.verdict : ui.leadFilter.startsWith("list:") ? r.list === ui.leadFilter.slice(5) : r.verdict === ui.leadFilter)))
    .sort((a, b) => (a.priority || 999) - (b.priority || 999) || (b.updated || "").localeCompare(a.updated || ""));
}
// ---------- Sources: which job sites are being reached ----------
const SRC_RESULT = { ok: ["Working", "ok"], empty: ["Reached, nothing new", "ok"], blocked: ["Blocked", "bad"], "needs-key": ["Needs a key", "bad"], error: ["Error", "bad"] };
const PICKED = ["shortlisted", "drafted", "approved", "applied", "interview", "offer"];
function daysSince(stamp) {
  if (!stamp) return null;
  const then = new Date(`${stamp.slice(0, 10)}T12:00:00`), now = new Date(`${todayKey()}T12:00:00`);
  return Math.round((now - then) / 864e5);
}
function whenLabel(stamp) {
  const d = daysSince(stamp);
  if (d === null) return "Never";
  return d <= 0 ? `Today ${stamp.slice(11, 16)}` : d === 1 ? "Yesterday" : `${d} days ago`;
}
function sourceRows() {
  const f = store.tracker.found || {}, logged = f.sources || {}, listed = f.listed || [];
  const names = [...listed.map((s) => s.name), ...Object.keys(logged).filter((n) => !listed.some((s) => s.name === n))];
  return names.map((name) => {
    const s = logged[name] || null, how = (listed.find((l) => l.name === name) || {}).how || "";
    const d = s ? daysSince(s.last_checked) : null;
    const [label, tone0] = s ? (SRC_RESULT[s.result] || [s.result || "?", "bad"]) : ["Not checked yet", "bad"];
    const stale = d === null || d > 7;
    const picked = roles().filter((r) => r.source === name && PICKED.some((st) => ever(r, st))).length;
    return { name, how, s, label, tone: stale && tone0 === "ok" ? "warn" : tone0, when: whenLabel(s && s.last_checked), stale, picked, reached: !!s && !stale && (s.result === "ok" || s.result === "empty") };
  });
}
function renderSources() {
  const rows = sourceRows();
  if (!rows.length) return "";
  const reached = rows.filter((r) => r.reached).length, editing = store.system.editing;
  const body = ui.srcOpen === false ? "" : `<div class="tbl-wrap"><table class="tbl" style="min-width:720px"><thead><tr><th>Site</th><th>Read by</th><th>Last checked</th><th>Result</th><th>Leads: last / total</th><th>You picked</th></tr></thead><tbody>${rows.map((r) =>
    `<tr><td><span class="r-title">${esc(r.name)}</span>${r.s && r.s.note ? `<span class="r-co" title="${esc(r.s.note)}">${esc(r.s.note.slice(0, 80))}</span>` : ""}</td><td>${esc(r.how)}</td><td>${esc(r.when)}</td>
     <td><span class="tg src-${r.tone}">${esc(r.label)}</span></td><td>${r.s ? `${r.s.found || 0} / ${r.s.total || 0}` : "—"}</td><td>${r.picked || "—"}</td></tr>`).join("")}</tbody></table></div>`;
  return `<section class="card flush sources" aria-label="Job sites"><div class="tbl-head"><div class="row1"><div><h2>Job sites</h2><span class="sub">${reached} of ${rows.length} reached in the last week${reached < rows.length ? ": the others need a look" : ""}</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-scout="toggle">${ui.srcOpen === false ? "Show" : "Hide"}</button>${editing ? `<button type="button" class="btn sm" data-scout="keys">Job site keys</button><button type="button" class="btn sm primary" data-scout="run" id="scout-run">Check sources now</button>` : ""}</div></div></div>${body}</section>`;
}
function openKeys() {
  const have = store.tracker.keys || {};
  const field = (id, label, hint) => `<label class="keys-field"><span>${label} <span class="tg ${have[id] ? "src-ok" : "src-bad"}">${have[id] ? "Set" : "Not set"}</span></span><input type="password" name="${id}" autocomplete="off" spellcheck="false" placeholder="${have[id] ? "Leave blank to keep the current one" : "Paste it here"}"><small class="sub">${hint}</small></label>`;
  const dlg = document.createElement("dialog");
  dlg.className = "dlg";
  dlg.innerHTML = `<form method="dialog" class="dlg-body" style="display:flex;flex-direction:column;gap:14px;min-width:min(440px,86vw)">
    <h3 style="margin:0">Job site keys</h3>
    <p class="sub" style="margin:0">Free keys that let the search read Reed and Adzuna. They are saved on this PC only (in <code>shared/job-search/.env</code>), never sent to GitHub, and never shown again.</p>
    ${field("REED_API_KEY", "Reed API key", 'Sign up free at <a href="https://www.reed.co.uk/developers/jobseeker" target="_blank" rel="noopener">reed.co.uk/developers/jobseeker</a>')}
    ${field("ADZUNA_APP_ID", "Adzuna application ID", 'Sign up free at <a href="https://developer.adzuna.com/overview" target="_blank" rel="noopener">developer.adzuna.com</a>')}
    ${field("ADZUNA_APP_KEY", "Adzuna application key", "From the same Adzuna page")}
    <p class="sub" id="keys-msg" style="margin:0;min-height:1.2em"></p>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-k="cancel">Cancel</button><button type="button" class="btn primary" data-k="save">Save keys</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener("close", () => dlg.remove());
  dlg.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    if (b.dataset.k === "cancel") return dlg.close();
    const values = {};
    for (const input of dlg.querySelectorAll("input")) if (input.value.trim()) values[input.name] = input.value.trim();
    if (!Object.keys(values).length) return dlg.close();
    b.disabled = true; b.textContent = "Saving…";
    try { const r = await post("/api/keys", values); dlg.close(); toast(r.changed.length ? "Keys saved on this PC" : "Nothing to save"); }
    catch (err) { dlg.querySelector("#keys-msg").textContent = err.message; b.disabled = false; b.textContent = "Save keys"; }
  });
  dlg.showModal();
}
async function runScoutNow(button) {
  button.disabled = true; button.textContent = "Searching…";
  try { const r = await post("/api/scout", {}); toast(r.summary || "Job search done"); }
  catch (err) { toast(err.message); }
  finally { button.disabled = false; button.textContent = "Check sources now"; }
}

function renderLeads() {
  const open = roles().filter((r) => r.status === "found"), dismissed = roles().filter((r) => r.status === "skipped");
  const lists = [...new Set(open.map((r) => r.list).filter(Boolean))].sort();
  const chips = [["all", "All", open.length], ...["apply", "maybe", "skip"].map((v) => [v, `Hal: ${VERDICT_LABEL[v]}`, open.filter((r) => r.verdict === v).length]),
    ["none", "No verdict yet", open.filter((r) => !r.verdict).length], ...lists.map((l) => [`list:${l}`, l, open.filter((r) => r.list === l).length])].filter((c) => c[0] === "all" || c[2]);
  const editing = store.system.editing;
  const head = `<div class="tbl-head"><div class="row1"><div><h2>${ui.leadShow === "dismissed" ? "Dismissed leads" : "Leads"}</h2><span class="sub">${ui.leadShow === "dismissed" ? "Roles you or Hal ruled out, in case you change your mind" : `${plural(open.length, "role")} to look at, best first. Moving one to the pipeline gets Wren writing.`}</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${latestFinds().items.length ? `<button type="button" class="btn sm${latestFinds().day === todayKey() ? " primary" : ""}" data-found="open">New leads<span class="n-badge">${latestFinds().items.length}</span></button>` : ""}${dismissed.length ? `<button type="button" class="btn sm ghost" data-lead="toggle">${ui.leadShow === "dismissed" ? "Back to leads" : `Dismissed (${dismissed.length})`}</button>` : ""}${editing ? `<button type="button" class="btn sm" data-lead="add">${svg(ICON.plus, 14, 2.2)}Add lead</button>` : ""}</div></div>
    ${ui.leadShow === "open" && open.length ? `<div class="chips" role="group" aria-label="Filter leads">${chips.map(([k, l, n]) => `<button type="button" class="chip" data-chip="${esc(k)}" aria-pressed="${ui.leadFilter === k}">${esc(l)}<span class="n">${n}</span></button>`).join("")}</div>` : ""}</div>`;
  const rows = leadRows();
  let body;
  if (!rows.length) {
    body = `<div style="padding:0 22px 22px">${ui.leadShow === "dismissed" ? emptyBox("Nothing dismissed", "Leads you rule out land here.") : open.length ? emptyBox("No leads match", ui.q ? "Try a different word, or clear the search." : "Nothing with this filter.") : emptyBox("No leads yet", "Rita adds new roles each morning, and you can add one you've found yourself.")}</div>`;
  } else {
    body = `<div class="tbl-wrap"><table class="tbl" style="min-width:1000px"><thead><tr><th style="width:30%">Role</th><th>Location</th><th>Pay</th><th style="width:30%">Hal's view</th><th></th></tr></thead><tbody>${rows.map((r) => {
      const url = safeUrl(r.url), c = closing(r.closing_date);
      const tags = [isNewLead(r) ? `<span class="tg new">New</span>` : "", r.priority && ui.leadShow === "open" ? `<span class="tg star">P${esc(r.priority)}</span>` : "", r.list ? `<span class="tg">${esc(r.list)}</span>` : "", r.source && r.source !== "Job Hunt dashboard" ? `<span class="tg">${esc(r.source)}</span>` : "", c ? `<span class="tg close ${c.level}">${esc(c.text)}</span>` : "", halOn(r) ? `<span class="tg" style="color:var(--accent)">Hal is on it</span>` : ""].join("");
      const why = r.verdict_why || r.notes || "";
      const acts = ui.leadShow === "dismissed"
        ? (editing ? `<button type="button" class="btn sm" data-lead="restore" data-id="${esc(r.id)}">Restore</button>` : "")
        : (editing ? `<button type="button" class="btn sm" data-lead="move" data-id="${esc(r.id)}" title="Shortlist it: Wren writes the CV and cover letter">${svg(ICON.arrow, 14, 2)}To pipeline</button>
          <button type="button" class="icon-btn" data-lead="tailor" data-id="${esc(r.id)}" title="Tailor a CV" aria-label="Tailor a CV for ${esc(r.title)}">${svg(ICON.spark, 16)}</button>
          <button type="button" class="icon-btn" data-lead="dismiss" data-id="${esc(r.id)}" title="Dismiss" aria-label="Dismiss ${esc(r.title)}">${svg(ICON.x, 16)}</button>` : "");
      return `<tr class="clickable${ui.leadShow === "dismissed" ? " dismissed" : ""}" data-role="${esc(r.id)}"><td><span class="r-title">${esc(r.title)}</span><span class="r-co">${esc(r.company)}</span>${url ? ` · <a class="r-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Advert</a>` : ""}${tags ? `<div class="tags">${tags}</div>` : ""}</td>
        <td>${esc(r.location || "—")}</td><td>${esc(r.pay || "—")}</td>
        <td><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">${verdictBadge(r, "") || `<span class="sub">No verdict yet</span>`}${fitDots(r.fit)}</div>${why ? `<div class="clamp c-fit" title="${esc(why)}">${esc(why)}</div>` : ""}${r.reason && ui.leadShow === "dismissed" ? `<div class="clamp c-con">Reason: ${esc(r.reason)}</div>` : ""}</td>
        <td><div class="acts">${acts}</div></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  $("v-leads").innerHTML = `<section class="card flush" aria-label="Leads">${head}${body}</section>${renderSources()}`;
}
async function setStatus(id, status, message, undoTo) {
  try {
    await post(`/api/roles/${id}`, { changes: { status } });
    toast(message, undoTo ? () => post(`/api/roles/${id}`, { changes: { status: undoTo } }).catch((e) => toast(e.message)) : null);
  } catch (err) { toast(err.message); }
}
$("v-leads").addEventListener("click", (e) => {
  const sc = e.target.closest("[data-scout]");
  if (sc) { if (sc.dataset.scout === "run") void runScoutNow(sc); else if (sc.dataset.scout === "keys") openKeys(); else { ui.srcOpen = ui.srcOpen === false; ui.animate = false; renderLeads(); } return; }
  const b = e.target.closest("[data-lead], [data-chip]");
  if (!b) { const row = e.target.closest("tr[data-role]"); if (row && !e.target.closest("a")) location.hash = `#role/${row.dataset.role}`; return; }
  if (b.dataset.chip) { ui.leadFilter = b.dataset.chip; ui.animate = false; renderLeads(); return; }
  const id = b.dataset.id, r = id && roleById(id), act = b.dataset.lead;
  if (act === "toggle") { ui.leadShow = ui.leadShow === "dismissed" ? "open" : "dismissed"; renderLeads(); }
  else if (act === "add") $("add-role").click();
  else if (act === "move" && r) setStatus(id, "shortlisted", `Moved to Roles. Wren will write the CV and cover letter for ${r.company}.`, "found");
  else if (act === "dismiss" && r) setStatus(id, "skipped", `Dismissed ${r.company}. Add a reason on its page if you like.`, "found");
  else if (act === "restore" && r) setStatus(id, "found", `${r.company} is back in Leads.`, "skipped");
  else if (act === "tailor" && r) openTailor(id);
});

// ---------- Interviews ----------
function renderInterviews() {
  const items = interviewItems(0);
  $("v-interviews").innerHTML = `<section class="card"><div class="card-h"><h2>Interviews</h2><span class="sub">Upcoming first. Each opens Cole's prep and your talking points.</span></div>
    ${items ? `<div class="list">${items}</div>` : emptyBox("No interviews yet", "When you set a role to Interview and add the date, it shows here and Cole writes your prep.", "Go to Roles", "#roles")}</section>`;
}

// ---------- Next actions ----------
function renderActions() {
  const items = actionItems(0);
  $("v-actions").innerHTML = `<section class="card"><div class="card-h"><h2>Next actions</h2><span class="sub">Things for you to do. Hal adds questions here when he runs on his own.</span></div>
    ${items ? `<div class="list">${items}</div>` : `<p class="sub" style="margin:0">Nothing to do right now.</p>`}${addActionForm()}</section>`;
}
async function toggleAction(id, done) {
  try { await post("/api/actions", { id, done }); if (done) toast("Done.", () => post("/api/actions", { id, done: false })); }
  catch (err) { toast(err.message); }
}
for (const host of ["v-overview", "v-actions"]) {
  $(host).addEventListener("change", (e) => { const c = e.target.closest("[data-action]"); if (c) toggleAction(c.dataset.action, c.checked); });
  $(host).addEventListener("click", async (e) => {
    const b = e.target.closest("[data-answer]"); if (!b) return;
    b.disabled = true;
    try { await post("/api/actions", { id: b.dataset.id, answer: b.dataset.answer }); toast(`Answered: ${b.dataset.answer}. It goes to your Chief of Staff.`); }
    catch (err) { toast(err.message); b.disabled = false; }
  });
  $(host).addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-form=add-action]"); if (!f) return;
    e.preventDefault();
    const text = f.elements.text.value.trim(); if (!text) return f.elements.text.focus();
    try { await post("/api/actions", { text }); f.reset(); } catch (err) { toast(err.message); }
  });
}

// ---------- CVs ----------
function renderCVs() {
  const tailored = roles().filter((r) => (store.docs[r.id] || {}).cv).sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
  const editing = store.system.editing;
  const base = `<section class="card cv-card"><div style="display:flex;gap:8px;align-items:center"><span class="badge base">Base</span><span class="cv-n">Your CV bank</span></div>
    <span class="cv-sub">Everything Wren is allowed to use, word for word from your CV. Every tailored CV is checked against it.</span>
    <div class="cv-actions"><button type="button" class="btn sm" data-cv="bank">${svg(ICON.doc, 14)}Read it</button>${jobSearch?.hasDefaultCv ? `<a class="btn sm" href="/files/cv/default-cv.pdf" target="_blank" rel="noopener">Original PDF</a>` : ""}${editing ? `<button type="button" class="btn sm primary" data-cv="tailor">${svg(ICON.spark, 14, 2)}Tailor a CV</button>` : ""}</div></section>`;
  const rules = `<section class="card cv-card"><div style="display:flex;gap:8px;align-items:center"><span class="badge base">Rules</span><span class="cv-n">Your CV writing rules</span></div>
    <div class="md sub" style="max-height:150px;overflow:auto">${jobSearch ? md(jobSearch.rules.split("\n").filter((l) => /^\s*[-*]\s/.test(l)).join("\n") || jobSearch.rules) : "Loading…"}</div>
    ${editing ? `<div class="cv-actions"><button type="button" class="btn sm" data-cv="rules">${svg(ICON.edit, 14)}Edit rules</button></div>` : ""}</section>`;
  const cards = tailored.map((r) => {
    const d = store.docs[r.id] || {}, f = (n) => `/files/roles/${encodeURIComponent(r.id)}/${n}`;
    return `<section class="card cv-card"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge tailored">Tailored</span><span class="pill" style="background:#1A1F29;color:${STATUS_COLOUR[r.status]}">${STATUS_LABEL[r.status]}</span></div>
      <div><div class="cv-n">${esc(r.title)}</div><div class="cv-sub">${esc(r.company)}${r.updated ? ` · ${esc(shortDate(r.updated))}` : ""}</div></div>
      <div class="tags">${d.letter ? `<span class="tg docs">Cover letter</span>` : ""}${d.cvPdf ? `<span class="tg docs">PDF</span>` : ""}${d.prep ? `<span class="tg docs">Interview prep</span>` : ""}</div>
      <div class="cv-actions"><a class="btn sm" href="#role/${esc(r.id)}/documents">View</a>${d.cvPdf ? `<a class="btn sm" href="${f("cv.pdf")}" target="_blank" rel="noopener">PDF</a>` : ""}<a class="btn sm" href="${f("cv.docx")}">Word</a>${editing ? `<button type="button" class="icon-btn" data-cv="tailor" data-id="${esc(r.id)}" title="Tailor again" aria-label="Tailor again for ${esc(r.title)}">${svg(ICON.spark, 16)}</button>` : ""}</div></section>`;
  }).join("");
  $("v-cvs").innerHTML = `<div class="cv-grid">${base}${rules}</div>
    <section class="card flush"><div class="tbl-head"><div class="row1"><div><h2>Tailored CVs</h2><span class="sub">${tailored.length ? `${plural(tailored.length, "role")} with a CV from Wren` : "Wren's CVs appear here"}</span></div></div></div>
    <div style="padding:0 22px 22px">${tailored.length ? `<div class="cv-grid">${cards}</div>` : emptyBox("No tailored CVs yet", "Move a lead to the pipeline, or use Tailor a CV, and Wren writes one with a cover letter.")}</div></section>`;
}
$("v-cvs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cv]"); if (!b) return;
  if (b.dataset.cv === "bank") {
    $("cv-title").textContent = "Your CV bank";
    $("cv-meta").textContent = "Wren and Cole only use what's in here. Edit shared/job-search/cv/cv-bank.md to change it.";
    $("cv-doc").innerHTML = md(jobSearch?.cvBank || "Not found.");
    $("cv-pdf").hidden = !jobSearch?.hasDefaultCv;
    $("cv-dlg").showModal();
  } else if (b.dataset.cv === "tailor") openTailor(b.dataset.id);
  else if (b.dataset.cv === "rules") { openTailor(null, true); }
});
$("cv-dlg").addEventListener("click", (e) => { if (e.target.closest("[data-close]") || e.target === $("cv-dlg")) $("cv-dlg").close(); });

// ---------- Tailor dialog ----------
const tForm = $("tailor-form");
let tailorFile = null;
function openTailor(id, rulesOnly = false) {
  if (!store.system.editing) return toast("Editing needs the office running on your PC with Python 3.");
  const pick = roles().filter((r) => r.status === "found" || ACTIVE.has(r.status))
    .sort((a, b) => (LEAD.has(a.status) - LEAD.has(b.status)) || a.company.localeCompare(b.company));
  $("tailor-role").innerHTML = `<option value="">Pick a role…</option>` +
    `<optgroup label="Roles">${pick.filter((r) => !LEAD.has(r.status)).map((r) => `<option value="${esc(r.id)}">${esc(r.title)} · ${esc(r.company)}</option>`).join("")}</optgroup>` +
    `<optgroup label="Leads (this shortlists it)">${pick.filter((r) => LEAD.has(r.status)).map((r) => `<option value="${esc(r.id)}">${esc(r.title)} · ${esc(r.company)}</option>`).join("")}</optgroup>`;
  tForm.reset(); tailorFile = null;
  $("tailor-file-msg").textContent = "";
  $("tailor-err").textContent = "";
  if (id) $("tailor-role").value = id;
  $("tailor-rules").value = jobSearch?.rules || "";
  $("tailor-title").textContent = id && roleById(id) ? `Tailor a CV: ${roleById(id).title}` : "Tailor a CV";
  tForm.querySelector("details.rules").open = rulesOnly;
  $("tailor-dlg").showModal();
  if (rulesOnly) $("tailor-rules").focus();
}
$("tailor-pick").addEventListener("click", () => $("tailor-file").click());
$("tailor-file").addEventListener("change", async () => {
  const file = $("tailor-file").files[0]; if (!file) return;
  if (/\.(txt|md)$/i.test(file.name)) { tForm.elements.advert.value = (await file.text()).slice(0, 20000); tailorFile = null; $("tailor-file-msg").textContent = `Read ${file.name}.`; }
  else if (file.size > 10 * 1024 * 1024) { $("tailor-file-msg").textContent = "Files can be up to 10 MB."; }
  else { tailorFile = file; $("tailor-file-msg").textContent = `${file.name} will be attached to the role for Wren to read.`; }
  $("tailor-file").value = "";
});
tForm.addEventListener("submit", async (e) => {
  if (e.submitter?.value !== "save") return;
  e.preventDefault();
  const f = tForm.elements, id = f.role.value, err = $("tailor-err");
  const rules = f.rules.value.trim();
  try {
    if (jobSearch && rules && rules !== jobSearch.rules.trim()) { await post("/api/cv-rules", { text: rules }); jobSearch.rules = rules; }
    if (!id) { if (rules) { $("tailor-dlg").close(); toast("Rules saved. Wren uses them from now on."); return; } err.textContent = "Pick the role to tailor for."; return; }
    let focus = f.focus.value.trim();
    if (tailorFile) {
      const res = await fetch(`/api/roles/${id}/attachments?name=${encodeURIComponent(tailorFile.name)}`, { method: "POST", body: tailorFile });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Couldn't attach that file.");
      focus = [focus, `(the job description is attached as attachments/${out.name})`].filter(Boolean).join(" ");
    }
    await post(`/api/roles/${id}/request`, { kind: "tailor", text: focus.slice(0, 300), advert: f.advert.value.trim() });
    $("tailor-dlg").close();
    toast(`Sent to Wren. The CV and cover letter will appear on ${roleById(id)?.company || "the role"}'s Documents tab.`);
  } catch (ex) { err.textContent = ex.message; }
});

// ---------- New leads (the review queue Hal triaged) ----------
function renderFound() {
  const fb = latestFinds(), run = fb.lastRun;
  const row = (i) => {
    const r = i.triage?.role && roleById(i.triage.role);
    const decision = !i.triage ? `<span class="sub">Waiting for Hal</span>`
      : i.triage.action === "added" ? `<span class="tg docs">Added to Leads</span>${r && r.status !== "found" ? ` <span class="sub">(now ${esc(STATUS_LABEL[r.status])})</span>` : ""}`
      : `<span class="tg">Dismissed</span>${i.triage.reason ? ` <span class="sub">${esc(i.triage.reason)}</span>` : ""}`;
    const undo = !store.system.editing || !r ? ""
      : r.status === "found" ? `<button type="button" class="btn sm ghost" data-found="dismiss" data-id="${esc(r.id)}">Dismiss</button>`
      : r.status === "skipped" ? `<button type="button" class="btn sm" data-found="restore" data-id="${esc(r.id)}">Add to Leads</button>` : "";
    return `<div class="found"><div class="f-main"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="fitb ${esc(i.fit)}">${FIT_LABEL[i.fit] || "Possible"}</span><span class="r-title">${esc(i.title)}</span></div>
      <span class="r-co">${esc(i.company)}${i.location ? ` · ${esc(i.location)}` : ""}${i.pay ? ` · ${esc(i.pay)}` : ""} · ${esc(i.source || (i.via === "email" ? "Job alert email" : "Web search"))}${safeUrl(i.link) ? ` · <a class="r-link" href="${esc(i.link)}" target="_blank" rel="noopener noreferrer">Advert</a>` : ""}</span>
      ${i.why ? `<span class="clamp c-fit">${esc(i.why)}</span>` : ""}<div>${decision}</div></div>
      <div class="f-acts">${undo}${r ? `<a class="btn sm ghost" href="#role/${esc(r.id)}">Open</a>` : ""}</div></div>`;
  };
  const runLine = run ? `Last run ${esc(longWhen(run.at.length <= 16 ? run.at + ":00" : run.at))} (${run.via === "email" ? "email scan" : "web search"}, ${plural(run.found || 0, "new find")})${run.note ? `: ${esc(run.note)}` : ""}.` : "No search has run yet.";
  $("found-body").innerHTML = `<p class="sub" style="margin:0 0 12px">${runLine} Rita searches your job sites and job-alert emails at 6:31 on weekdays; Hal sorts what she finds.</p>
    ${fb.items.length ? `<h3 class="found-h">${dayWord(fb.day) === "this morning" ? "This morning" : `Found ${dayWord(fb.day)}`}: ${fb.added.length} added, ${fb.dismissed.length} dismissed</h3><div class="list">${[...fb.added, ...fb.pending, ...fb.dismissed].map(row).join("")}</div>` : emptyBox("Nothing new yet", "New finds appear here after the morning search.")}`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-found]");
  if (!b) { if (e.target === $("found-dlg")) $("found-dlg").close(); return; }
  const act = b.dataset.found, r = b.dataset.id && roleById(b.dataset.id);
  if (act === "open") { renderFound(); $("found-dlg").showModal(); }
  else if (act === "close") $("found-dlg").close();
  else if (act === "dismiss" && r) setStatus(r.id, "skipped", `Dismissed ${r.company}.`, "found");
  else if (act === "restore" && r) setStatus(r.id, "found", `${r.company} added to Leads.`, "skipped");
});
on("tracker", () => { if ($("found-dlg").open) renderFound(); });

// ---------- Rendering ----------
const RENDER = { overview: renderOverview, leads: renderLeads, interviews: renderInterviews, actions: renderActions, cvs: renderCVs };
export function showView(name) {
  ui.animate = ui.view !== name;
  ui.view = name;
  document.querySelectorAll("[data-nav]").forEach((a) => (a.dataset.nav === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  if (RENDER[name]) RENDER[name]();
  ui.animate = false;
}
function refresh() { counts(); if (RENDER[ui.view] && !$(`v-${ui.view}`).hidden) RENDER[ui.view](); }
on("tracker", refresh);
on("docs", refresh);
on("system", refresh);
on("agents", counts);
$("search").addEventListener("input", (e) => {
  ui.q = e.target.value.trim().toLowerCase();
  if (ui.q && !["roles", "leads"].includes(ui.view)) location.hash = "#roles";
  else if (ui.view === "leads") renderLeads();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "") && !document.querySelector("dialog[open]")) { e.preventDefault(); $("search").focus(); }
});
async function loadJobSearch() {
  try { const res = await fetch("/api/job-search"); if (res.ok) jobSearch = await res.json(); } catch { /* shown as loading */ }
  renderTarget();
  if (ui.view === "cvs") renderCVs();
}
greet();
setInterval(greet, 60_000);
renderTarget();
loadJobSearch();
export { openTailor };
