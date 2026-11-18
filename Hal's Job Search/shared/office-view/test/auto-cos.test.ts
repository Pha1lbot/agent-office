import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AutoCos, cosPrompt } from "../src/auto-cos.ts";

// server.ts starts the Chief of Staff in REPO = two folders up from office-view:
// the office folder. Its skill and tools must be there, or the run does nothing.
const OFFICE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("the office folder holds the Chief of Staff's skill and the tracker tool", () => {
  assert.ok(existsSync(join(OFFICE, ".claude", "skills", "cos", "SKILL.md")));
  assert.ok(existsSync(join(OFFICE, "shared", "tools", "tracker.py")));
});

test("started in a folder without the skill, it refuses and says why", async () => {
  const app = mkdtempSync(join(tmpdir(), "cos-"));
  let started = false;
  const cos = new AutoCos("claude-that-must-not-run", mkdtempSync(join(tmpdir(), "wrong-")), "python3", app, {
    before: async () => { started = true; }, after: async () => ({ inbox: 0, finds: 0 }), changed: () => {}, budgetLeft: () => null,
  });
  cos.inboxChanged(2, false);
  await cos.start();
  assert.equal(started, false);
  assert.equal(cos.status.running, false);
  assert.match(cos.status.last?.message ?? "", /skills\/cos\/SKILL\.md|skills\\cos\\SKILL\.md/);
});

const quietCos = () => new AutoCos("claude-that-must-not-run", mkdtempSync(join(tmpdir(), "wrong-")), "python3", mkdtempSync(join(tmpdir(), "cos-")), {
  before: async () => {}, after: async () => ({ inbox: 0, finds: 0 }), changed: () => {}, budgetLeft: () => null,
});

test("finds left by the office's own Scout run start Tim; finds seen any other way don't", () => {
  const cos = quietCos();
  cos.findsChanged(5, false); // the office opening, or found.json changing
  assert.equal(cos.status.startsAt, 0);
  cos.findsChanged(5, true); // the office's Scout run just finished
  assert.ok(cos.status.startsAt > 0);
  assert.equal(cos.status.finds, 5);
  cos.setAuto(false); // also cancels the scheduled run
});

test("a Scout run with nothing left to sort doesn't start Tim", () => {
  const cos = quietCos();
  cos.findsChanged(0, true);
  assert.equal(cos.status.startsAt, 0);
});

test("the prompt points Tim at the right sections of his skill", () => {
  const sections = readFileSync(join(OFFICE, ".claude", "skills", "cos", "SKILL.md"), "utf8");
  assert.match(sections, /^## "Scout's finds"/m);
  assert.match(sections, /^## Office changes/m);
  const finds = cosPrompt(0, 3, "py");
  assert.match(finds, /3 finds to sort/);
  assert.match(finds, /"Scout's finds" section/);
  assert.doesNotMatch(finds, /Office changes/);
  const both = cosPrompt(2, 1, "py");
  assert.match(both, /^\/cos office changes/);
  assert.match(both, /1 find to sort/);
  assert.match(cosPrompt(2, 0, "py"), /'Office changes' section/);
});
