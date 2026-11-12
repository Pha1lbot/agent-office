import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { keyStatus, setKeys } from "../src/keys.ts";

const tmp = () => join(mkdtempSync(join(tmpdir(), "keys-")), ".env");

test("a missing file means no keys are set", async () => {
  assert.deepEqual(await keyStatus(tmp()), { REED_API_KEY: false });
});

test("sets keys, creates the file, and status never contains a value", async () => {
  const file = tmp();
  assert.deepEqual(await setKeys(file, { REED_API_KEY: "abcd1234-efgh-5678" }), ["REED_API_KEY"]);
  assert.equal(readFileSync(file, "utf8"), "REED_API_KEY=abcd1234-efgh-5678\n");
  const status = await keyStatus(file);
  assert.deepEqual(status, { REED_API_KEY: true });
  assert.ok(!JSON.stringify(status).includes("abcd"));
});

test("replaces a key in place and keeps comments and other lines", async () => {
  const file = tmp();
  writeFileSync(file, "# my keys\nREED_API_KEY=oldoldold1\nOTHER_SETTING=keep me\n");
  await setKeys(file, { REED_API_KEY: "newnewnew22" });
  assert.equal(readFileSync(file, "utf8"), "# my keys\nREED_API_KEY=newnewnew22\nOTHER_SETTING=keep me\n");
});

test("blank values leave a key alone and write nothing", async () => {
  const file = tmp();
  writeFileSync(file, "REED_API_KEY=keepkeepkeep\n");
  assert.deepEqual(await setKeys(file, { REED_API_KEY: "  " }), []);
  assert.equal(readFileSync(file, "utf8"), "REED_API_KEY=keepkeepkeep\n");
  const none = tmp();
  await setKeys(none, {});
  assert.equal(existsSync(none), false);
});

test("refuses values that could add a new line or setting, and unknown names", async () => {
  const file = tmp();
  for (const bad of ["abc", "has space 1234", "line\nINJECT=1", "quote\"1234567", "x".repeat(200), "semi;colon12345", "../../etc1234"]) {
    await assert.rejects(setKeys(file, { REED_API_KEY: bad }), /doesn't look right/, bad);
  }
  assert.deepEqual(await setKeys(file, { NOT_A_KEY: "validvalue123" }), []);
  assert.equal(existsSync(file), false);
});
