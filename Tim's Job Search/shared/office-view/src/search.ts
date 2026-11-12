// The part of the search definition (shared/job-search/search.json) that Tim can change from the
// office: pay, office days, commute, which tracks are on and in what order, and employers to avoid.
// Everything is checked before anything is written, and only these fields can change: the titles,
// keywords and sources stay as they are.
import { readFile, writeFile } from "node:fs/promises";

export interface SearchView {
  pay: { minimum: number | null; ideal: number | null };
  office_days_per_week: number | null;
  max_commute_minutes: number | null;
  avoid_employers: string[];
  tracks: { id: string; name: string; enabled: boolean; priority: number }[];
}

type Def = {
  pay?: { minimum?: number | null; ideal?: number | null };
  where?: { office_days_per_week?: number | null; max_commute_minutes?: number | null };
  avoid_employers?: string[];
  tracks?: { id: string; name: string; priority?: number; enabled?: boolean }[];
  updated?: string;
  [key: string]: unknown;
};

const num = (v: unknown, name: string, min: number, max: number): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) throw new Error(`${name} should be a whole number from ${min} to ${max}.`);
  return n;
};

export function viewOf(def: Def): SearchView {
  return {
    pay: { minimum: def.pay?.minimum ?? null, ideal: def.pay?.ideal ?? null },
    office_days_per_week: def.where?.office_days_per_week ?? null,
    max_commute_minutes: def.where?.max_commute_minutes ?? null,
    avoid_employers: def.avoid_employers || [],
    tracks: [...(def.tracks || [])].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
      .map((t) => ({ id: t.id, name: t.name, enabled: t.enabled !== false, priority: t.priority ?? 99 })),
  };
}

export async function readSearch(file: string): Promise<SearchView | null> {
  try { return viewOf(JSON.parse(await readFile(file, "utf8"))); } catch { return null; }
}

/** Apply edits from the page. Returns what changed in plain words (empty if nothing did). Throws a plain message if something is wrong. */
export async function applySearch(file: string, input: Record<string, unknown>, today = new Date().toISOString().slice(0, 10)): Promise<string[]> {
  const def = JSON.parse(await readFile(file, "utf8")) as Def;
  const before = viewOf(def);
  const next = structuredClone(before);

  if (input.pay !== undefined) {
    const pay = (input.pay ?? {}) as { minimum?: unknown; ideal?: unknown };
    next.pay.minimum = num(pay.minimum, "The minimum pay", 10_000, 1_000_000);
    next.pay.ideal = num(pay.ideal, "The ideal pay", 10_000, 1_000_000);
    if (next.pay.minimum !== null && next.pay.ideal !== null && next.pay.ideal < next.pay.minimum) throw new Error("The ideal pay can't be lower than the minimum.");
  }
  if (input.office_days_per_week !== undefined) next.office_days_per_week = num(input.office_days_per_week, "Office days", 0, 5);
  if (input.max_commute_minutes !== undefined) next.max_commute_minutes = num(input.max_commute_minutes, "The commute", 0, 240);
  if (input.avoid_employers !== undefined) {
    if (!Array.isArray(input.avoid_employers)) throw new Error("Employers to avoid should be a list.");
    const names = [...new Set(input.avoid_employers.map((e) => String(e).replace(/\s+/g, " ").trim()).filter(Boolean))];
    if (names.length > 30 || names.some((n) => n.length > 60)) throw new Error("Employers to avoid: up to 30 names, 60 characters each.");
    next.avoid_employers = names;
  }
  if (input.tracks !== undefined) {
    if (!Array.isArray(input.tracks)) throw new Error("Tracks should be a list.");
    const ids = before.tracks.map((t) => t.id);
    const given = input.tracks as { id?: unknown; enabled?: unknown }[];
    if (given.length !== ids.length || new Set(given.map((t) => t.id)).size !== ids.length || !given.every((t) => ids.includes(String(t.id)))) {
      throw new Error("The list of tracks doesn't match the search definition. Reload the page and try again.");
    }
    next.tracks = given.map((t, i) => ({ ...before.tracks.find((b) => b.id === t.id)!, enabled: t.enabled !== false, priority: i + 1 }));
    if (next.tracks.length && !next.tracks.some((t) => t.enabled)) throw new Error("Keep at least one kind of work switched on.");
  }

  const said: string[] = [];
  const k = (n: number | null) => (n === null ? "not set" : `£${n.toLocaleString("en-GB")}`);
  if (next.pay.minimum !== before.pay.minimum) said.push(`minimum pay ${k(before.pay.minimum)} to ${k(next.pay.minimum)}`);
  if (next.pay.ideal !== before.pay.ideal) said.push(`ideal pay ${k(before.pay.ideal)} to ${k(next.pay.ideal)}`);
  if (next.office_days_per_week !== before.office_days_per_week) said.push(`office days ${before.office_days_per_week ?? "not set"} to ${next.office_days_per_week ?? "not set"}`);
  if (next.max_commute_minutes !== before.max_commute_minutes) said.push(`longest commute ${before.max_commute_minutes ?? "not set"} to ${next.max_commute_minutes ?? "not set"} minutes`);
  if (JSON.stringify(next.avoid_employers) !== JSON.stringify(before.avoid_employers)) said.push(`employers to avoid now: ${next.avoid_employers.join(", ") || "none"}`);
  for (const t of next.tracks) {
    const was = before.tracks.find((b) => b.id === t.id)!;
    if (t.enabled !== was.enabled) said.push(`${t.name} switched ${t.enabled ? "on" : "off"}`);
  }
  if (next.tracks.map((t) => t.id).join() !== before.tracks.map((t) => t.id).join()) said.push(`order of the kinds of work: ${next.tracks.map((t) => t.name).join(", ")}`);
  if (!said.length) return [];

  def.pay = { ...def.pay, minimum: next.pay.minimum, ideal: next.pay.ideal };
  def.where = { ...def.where, office_days_per_week: next.office_days_per_week, max_commute_minutes: next.max_commute_minutes };
  def.avoid_employers = next.avoid_employers;
  def.tracks = (def.tracks || []).map((t) => { const n = next.tracks.find((x) => x.id === t.id)!; return { ...t, enabled: n.enabled, priority: n.priority }; });
  def.updated = today;
  await writeFile(file, JSON.stringify(def, null, 2) + "\n", "utf8");
  return said;
}
