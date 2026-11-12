import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySearch, readSearch } from "../src/search.ts";

const DEF = {
  _about: "keep me", updated: "2026-11-11",
  where: { home: "Epsom", office_days_per_week: 3, max_commute_minutes: 60 },
  pay: { minimum: 50000, ideal: 60000, unstated: "keep the role" },
  max_age_days: 14,
  avoid_employers: ["BLAST"],
  tracks: [
    { id: "esports", name: "Esports", priority: 1, titles: ["Head of Esports"] },
    { id: "events", name: "Live events", priority: 2, titles: ["Event Director"] },
    { id: "ai", name: "AI", priority: 3, titles: ["AI Programme Manager"], enabled: true },
  ],
  sources: [{ id: "h", name: "Hitmarker" }],
};
const make = () => { const f = join(mkdtempSync(join(tmpdir(), "search-")), "search.json"); writeFileSync(f, JSON.stringify(DEF)); return f; };
const read = (f: string) => JSON.parse(readFileSync(f, "utf8"));

test("shows the editable parts in order", async () => {
  const v = await readSearch(make());
  assert.deepEqual(v!.pay, { minimum: 50000, ideal: 60000 });
  assert.deepEqual(v!.tracks.map((t) => [t.id, t.enabled, t.priority]), [["esports", true, 1], ["events", true, 2], ["ai", true, 3]]);
  assert.equal(await readSearch("/no/such/file.json"), null);
});

test("changes pay, days, commute and employers, says what changed, and leaves everything else alone", async () => {
  const f = make();
  const said = await applySearch(f, { pay: { minimum: 55000, ideal: 65000 }, office_days_per_week: 2, max_commute_minutes: 45, avoid_employers: ["BLAST", " Betway ", "betway", ""] }, "2026-11-12");
  assert.deepEqual(said, ["minimum pay £50,000 to £55,000", "ideal pay £60,000 to £65,000", "office days 3 to 2", "longest commute 60 to 45 minutes", "employers to avoid now: BLAST, Betway, betway"]);
  const d = read(f);
  assert.equal(d.pay.minimum, 55000); assert.equal(d.pay.unstated, "keep the role"); assert.equal(d.where.home, "Epsom");
  assert.deepEqual(d.tracks[0].titles, ["Head of Esports"]); assert.equal(d._about, "keep me"); assert.equal(d.updated, "2026-11-12");
  assert.equal(d.sources[0].name, "Hitmarker");
});

test("switches tracks off and reorders them", async () => {
  const f = make();
  const said = await applySearch(f, { tracks: [{ id: "ai", enabled: true }, { id: "esports", enabled: true }, { id: "events", enabled: false }] });
  assert.deepEqual(said, ["Live events switched off", "order of the kinds of work: AI, Esports, Live events"]);
  const d = read(f);
  assert.deepEqual(d.tracks.map((t: { id: string; priority: number; enabled?: boolean }) => [t.id, t.priority, t.enabled]), [["esports", 2, true], ["events", 3, false], ["ai", 1, true]]);
});

test("changing nothing writes nothing", async () => {
  const f = make();
  const before = readFileSync(f, "utf8");
  assert.deepEqual(await applySearch(f, { pay: { minimum: 50000, ideal: 60000 }, office_days_per_week: 3, avoid_employers: ["BLAST"] }), []);
  assert.equal(readFileSync(f, "utf8"), before);
});

test("refuses values that make no sense, and writes nothing", async () => {
  const f = make();
  const before = readFileSync(f, "utf8");
  const bad: Record<string, unknown>[] = [
    { pay: { minimum: 70000, ideal: 60000 } }, { pay: { minimum: -5, ideal: 60000 } }, { pay: { minimum: "lots", ideal: 60000 } },
    { office_days_per_week: 9 }, { office_days_per_week: 2.5 }, { max_commute_minutes: 1000 },
    { avoid_employers: "BLAST" }, { avoid_employers: ["x".repeat(80)] }, { avoid_employers: Array.from({ length: 40 }, (_, i) => `Company ${i}`) },
    { tracks: [{ id: "esports", enabled: true }] }, { tracks: [{ id: "esports" }, { id: "events" }, { id: "nope" }] },
    { tracks: [{ id: "esports", enabled: false }, { id: "events", enabled: false }, { id: "ai", enabled: false }] },
  ];
  for (const input of bad) await assert.rejects(applySearch(f, input), Error, JSON.stringify(input).slice(0, 60));
  assert.equal(readFileSync(f, "utf8"), before);
});

test("a definition with no tracks yet can still have its pay changed", async () => {
  const f = join(mkdtempSync(join(tmpdir(), "search-")), "search.json");
  writeFileSync(f, JSON.stringify({ pay: { minimum: null, ideal: null }, tracks: [] }));
  assert.deepEqual(await applySearch(f, { pay: { minimum: 50000, ideal: 60000 }, tracks: [] }), ["minimum pay not set to £50,000", "ideal pay not set to £60,000"]);
});

test("how old a job may be can be changed, within limits", async () => {
  const f = make();
  assert.deepEqual(await applySearch(f, { max_age_days: 21 }), ["jobs may be up to 21 days old (was 14)"]);
  assert.equal(read(f).max_age_days, 21);
  for (const bad of [0, 2, 90, 10.5, "old"]) await assert.rejects(applySearch(f, { max_age_days: bad }), /How old a job may be/, String(bad));
  assert.equal(read(f).max_age_days, 21);
});
