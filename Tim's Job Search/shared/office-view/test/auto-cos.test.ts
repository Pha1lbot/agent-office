import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AutoCos } from "../src/auto-cos.ts";

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
    before: async () => { started = true; }, after: async () => 0, changed: () => {}, budgetLeft: () => null,
  });
  cos.inboxChanged(2, false);
  await cos.start();
  assert.equal(started, false);
  assert.equal(cos.status.running, false);
  assert.match(cos.status.last?.message ?? "", /skills\/cos\/SKILL\.md|skills\\cos\\SKILL\.md/);
});
