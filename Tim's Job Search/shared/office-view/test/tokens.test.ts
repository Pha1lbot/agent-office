import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { usageOfFile, usageOfSession, shortTokens, startOfUkDay } from "../src/tokens.ts";

const msg = (id: string, ts: string, usage: object) =>
  JSON.stringify({ type: "assistant", timestamp: ts, message: { id, usage } });
const U = { input_tokens: 10, cache_creation_input_tokens: 100, cache_read_input_tokens: 1000, output_tokens: 5 };

test("counts each message once, splits fresh tokens from cache reads, skips older days", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tok-"));
  const file = join(dir, "s1.jsonl");
  writeFileSync(file, [
    msg("m1", "2026-11-06T10:00:00Z", U),
    msg("m1", "2026-11-06T10:00:00Z", U), // same message, second content block
    msg("m2", "2026-11-06T11:00:00Z", U),
    msg("old", "2026-11-05T11:00:00Z", U), // yesterday
    JSON.stringify({ type: "user", message: { content: "hi" } }),
    "not json",
  ].join("\n"));
  const u = await usageOfFile(file, Date.parse("2026-11-06T00:00:00Z"));
  assert.deepEqual(u, { fresh: 230, cacheRead: 2000, output: 10 });
});

test("adds subagents by type from their meta files", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tok-"));
  writeFileSync(join(dir, "s2.jsonl"), msg("a", "2026-11-06T10:00:00Z", U));
  const subs = join(dir, "s2", "subagents");
  mkdirSync(subs, { recursive: true });
  writeFileSync(join(subs, "agent-1.jsonl"), msg("b", "2026-11-06T10:01:00Z", U));
  writeFileSync(join(subs, "agent-1.meta.json"), JSON.stringify({ agentType: "writer" }));
  writeFileSync(join(subs, "agent-2.jsonl"), msg("c", "2026-11-06T10:02:00Z", U));
  writeFileSync(join(subs, "agent-2.meta.json"), JSON.stringify({ agentType: "writer" }));
  writeFileSync(join(subs, "agent-3.jsonl"), msg("d", "2026-11-06T10:03:00Z", U)); // no meta file
  const r = await usageOfSession(join(dir, "s2.jsonl"), 0);
  assert.equal(r.main.fresh, 115);
  assert.equal(r.subagents.get("writer")!.fresh, 230);
  assert.equal(r.subagents.get("subagent")!.fresh, 115);
});

test("a missing transcript counts as zero", async () => {
  const r = await usageOfSession("/nope/none.jsonl", 0);
  assert.equal(r.main.fresh, 0);
  assert.equal(r.subagents.size, 0);
});

test("short token labels", () => {
  assert.equal(shortTokens(950), "950");
  assert.equal(shortTokens(12_345), "12k");
  assert.equal(shortTokens(1_234_567), "1.2M");
});

test("the UK day starts at UK midnight in winter and summer", () => {
  assert.equal(new Date(startOfUkDay(Date.parse("2026-11-06T15:00:00Z"))).toISOString(), "2026-11-06T00:00:00.000Z");
  assert.equal(new Date(startOfUkDay(Date.parse("2026-07-01T15:00:00Z"))).toISOString(), "2026-06-30T23:00:00.000Z");
  assert.equal(new Date(startOfUkDay(Date.parse("2026-07-01T23:30:00Z"))).toISOString(), "2026-07-01T23:00:00.000Z");
});
