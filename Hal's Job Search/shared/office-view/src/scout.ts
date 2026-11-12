// Scout (Ada's free job search) as the office sees it: which sources the search
// definition lists, who reads each, and whether Scout has already run today.
import { readFile } from "node:fs/promises";

export interface SourceInfo {
  name: string;
  how: "Scout" | "Alert emails" | "Rita"; // who or what reads this source
}

/** Who reads a source of this type (see shared/job-search/search.json). */
export function howRead(type: string): SourceInfo["how"] {
  if (type === "email") return "Alert emails";
  if (type === "web") return "Rita";
  return "Scout"; // sitemap, greenhouse, lever, ashby, smartrecruiters, reed, rss
}

/** The sources in the search definition, for the Sources panel. Empty if there is no definition. */
export async function listSources(searchFile: string): Promise<SourceInfo[]> {
  try {
    const def = JSON.parse(await readFile(searchFile, "utf8")) as { sources?: { name?: string; type?: string }[] };
    return (def.sources || []).filter((s) => s.name).map((s) => ({ name: String(s.name), how: howRead(String(s.type || "")) }));
  } catch {
    return [];
  }
}

const ukDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD

/** True if no source has been checked on today's UK date, so the office should run Scout once. */
export function scoutDue(sources: Record<string, { last_checked?: string }> | undefined, now = new Date()): boolean {
  const today = ukDate(now);
  return !Object.values(sources || {}).some((s) => (s.last_checked || "").slice(0, 10) === today);
}

/** The last line of Scout's output that says how it went, e.g. "Scout: 5 of 7 sources reached, 2 new leads queued." */
export function scoutSummary(output: string): string {
  const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return [...lines].reverse().find((l) => l.startsWith("Scout:")) || lines[0] || "Scout finished";
}

/** The "Closed: ..." line from the closed-postings check, or "". */
export function closedSummary(output: string): string {
  return [...output.split(/\r?\n/).map((l) => l.trim())].reverse().find((l) => l.startsWith("Closed:")) || "";
}
