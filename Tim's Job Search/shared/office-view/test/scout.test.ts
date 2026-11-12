import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closedSummary, howRead, listSources, scoutDue, scoutSummary } from "../src/scout.ts";

test("each source type says who reads it", () => {
  for (const t of ["sitemap", "greenhouse", "lever", "ashby", "smartrecruiters", "reed", "rss"]) assert.equal(howRead(t), "Scout", t);
  assert.equal(howRead("email"), "Alert emails");
  assert.equal(howRead("web"), "Rita");
});

test("lists the sources in the search definition, and copes with none", async () => {
  const dir = mkdtempSync(join(tmpdir(), "scout-"));
  const file = join(dir, "search.json");
  writeFileSync(file, JSON.stringify({ sources: [{ name: "Hitmarker", type: "sitemap" }, { name: "LinkedIn Jobs", type: "email" }, { type: "web" }, { name: "Esports Insider jobs", type: "web" }] }));
  assert.deepEqual(await listSources(file), [
    { name: "Hitmarker", how: "Scout" }, { name: "LinkedIn Jobs", how: "Alert emails" }, { name: "Esports Insider jobs", how: "Rita" },
  ]);
  assert.deepEqual(await listSources(join(dir, "missing.json")), []);
  writeFileSync(file, "not json");
  assert.deepEqual(await listSources(file), []);
});

test("Scout is due when nothing was checked on today's UK date", () => {
  const noon = new Date("2026-11-12T12:00:00Z");
  assert.equal(scoutDue(undefined, noon), true);
  assert.equal(scoutDue({}, noon), true);
  assert.equal(scoutDue({ Hitmarker: { last_checked: "2026-11-11T06:35" } }, noon), true);
  assert.equal(scoutDue({ Hitmarker: { last_checked: "2026-11-12T06:35" } }, noon), false);
  // just after UK midnight in summer it is already the next UK day, though still the previous day in UTC
  assert.equal(scoutDue({ Hitmarker: { last_checked: "2026-07-02T00:10" } }, new Date("2026-07-01T23:30:00Z")), false);
});

test("picks Scout's own summary line out of its output", () => {
  assert.equal(scoutSummary("Hitmarker: ok | 60 read\nReed: needs-key | 0 read\nScout: 5 of 7 sources reached, 2 new leads queued.\n"), "Scout: 5 of 7 sources reached, 2 new leads queued.");
  assert.equal(scoutSummary("Traceback (most recent call last):\nValueError: boom"), "Traceback (most recent call last):");
  assert.equal(scoutSummary(""), "Scout finished");
});

test("picks the closed-postings line out of its output", () => {
  assert.equal(closedSummary("  dismissed (closed): X\nClosed: 12 adverts opened, 2 leads dismissed, 0 roles flagged for you, 20 couldn't be read.\n"), "Closed: 12 adverts opened, 2 leads dismissed, 0 roles flagged for you, 20 couldn't be read.");
  assert.equal(closedSummary("nothing here"), "");
});
