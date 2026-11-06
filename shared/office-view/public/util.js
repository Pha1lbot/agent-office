// Small helpers shared by the office, the Pipeline dashboard and the role page.

export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const hex = (n) => "#" + n.toString(16).padStart(6, "0");
export const clock = (ts) => new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const short = (n) => (n < 1000 ? String(n) : n < 1e6 ? `${Math.round(n / 1000)}k` : `${(n / 1e6).toFixed(1)}M`);
export const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : null);
export const roleName = (r) => `${esc(r.company)} (${esc(r.title)})`;

export const STATUS_ORDER = ["found", "shortlisted", "drafted", "approved", "applied", "interview", "offer", "rejected", "skipped"];
export const STATUS_LABEL = { found: "To review", shortlisted: "Shortlisted", drafted: "Drafted", approved: "Approved", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Rejected", skipped: "Skipped" };
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
