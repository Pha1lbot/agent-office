// Small helpers shared by the office, the Pipeline dashboard and the role page.

export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const hex = (n) => "#" + n.toString(16).padStart(6, "0");
export const clock = (ts) => new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const short = (n) => (n < 1000 ? String(n) : n < 1e6 ? `${Math.round(n / 1000)}k` : `${(n / 1e6).toFixed(1)}M`);
export const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : null);
export const roleName = (r) => `${esc(r.company)} (${esc(r.title)})`;

export const STATUS_ORDER = ["found", "shortlisted", "drafted", "approved", "applied", "interview", "offer", "rejected", "skipped"];
export const STATUS_LABEL = { found: "Lead", shortlisted: "Shortlisted", drafted: "Drafted", approved: "Approved", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Rejected", skipped: "Dismissed" };
export const STATUS_COLOUR = { found: "#9aa0b5", shortlisted: "#7aa2ff", drafted: "#f2b134", approved: "#4fbf7f", applied: "#3fa7d6", interview: "#c38bff", offer: "#2ee6a6", rejected: "#e06c75", skipped: "#6b7090" };
export const OPEN = new Set(["found", "shortlisted", "drafted", "approved", "applied", "interview"]);
export const PICKED = new Set(["shortlisted", "drafted", "approved", "applied", "interview", "offer"]);
export const CLOSED = new Set(["rejected", "skipped"]);

export const VERDICT_LABEL = { apply: "Apply", maybe: "Maybe", skip: "Skip" };
export const VERDICT_RANK = { apply: 0, maybe: 1, skip: 3 };
/** Hal's verdict as a small coloured badge, with the reason on hover. */
export function verdictBadge(r, prefix = "Hal: ") {
  if (!VERDICT_LABEL[r.verdict]) return "";
  return `<span class="verdict v-${r.verdict}" title="${esc(r.verdict_why || "")}">${prefix}${VERDICT_LABEL[r.verdict]}</span>`;
}

/** Fit as five dots. */
export function fitDots(fit) {
  const n = Math.max(0, Math.min(5, Number(fit) || 0));
  return n ? `<span class="fit" aria-label="fit ${n} of 5">${"●".repeat(n)}<i>${"●".repeat(5 - n)}</i></span>` : "";
}

/** "closes in 3 days" etc., with a level for colour: "", "soon" (7 days or fewer) or "past". */
export function closing(date) {
  if (!date) return null;
  const end = new Date(`${date}T23:59:00`);
  if (isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / 864e5);
  if (days < 0) return { text: "closed", level: "past" };
  if (days === 0) return { text: "closes today", level: "soon" };
  return { text: days === 1 ? "closes tomorrow" : `closes in ${days} days`, level: days <= 7 ? "soon" : "" };
}

/** A follow-up next step whose date has passed ("Follow up if no reply by 13 Nov"). */
export function overdue(next) {
  const m = /by (\d{1,2}) ([A-Z][a-z]{2})/.exec(next || "");
  if (!m) return false;
  const now = new Date();
  const when = new Date(`${m[1]} ${m[2]} ${now.getFullYear()} 23:59`);
  if (isNaN(when)) return false;
  if (when - now > 300 * 864e5) when.setFullYear(when.getFullYear() - 1); // a December date seen in January
  return when < now;
}

export const shortDate = (iso) => (iso ? new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");
export const longWhen = (iso) => new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export async function post(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || "Couldn't save");
  return out;
}

/** A short message at the bottom of the screen, with an optional Undo. */
let toastTimer = 0;
export function toast(text, undo) {
  const el = $("toast");
  if (!el) return;
  $("toast-msg").textContent = text;
  const b = $("toast-undo");
  b.hidden = !undo;
  b.onclick = undo ? () => { el.classList.remove("show"); undo(); } : null;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), undo ? 7000 : 3500);
}

/** A small line icon (paths from the artifact's icon set). */
export const ICON = {
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  x: "M6 6l12 12M18 6L6 18",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-3.5-3.5",
  doc: "M6 3h9l4 4v14H6zM14 3v5h5",
  leads: "M3 13h5l2 3h4l2-3h5M5 5h14l2 8v6H3v-6z",
  calendar: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
};
export const svg = (path, size = 18, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;

/** Lowest yearly pay in a string like "£55k–£65k", or null (day rates and "competitive" are left out). */
export function yearlyPay(text) {
  const t = String(text || "");
  if (/\b(day|daily|hour|hourly|p\/?d|p\/?h)\b/i.test(t)) return null;
  const nums = [...t.replace(/,/g, "").matchAll(/(\d+(?:\.\d+)?)\s*(k)?/gi)].map((m) => Number(m[1]) * (m[2] ? 1000 : 1)).filter((n) => n >= 5000);
  return nums.length ? Math.min(...nums) : null;
}
