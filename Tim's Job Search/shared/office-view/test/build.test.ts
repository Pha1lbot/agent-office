import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBuild, readBuild } from "../src/build.ts";

/** A fake git: answers by the command's arguments. */
function fakeGit(answers: Record<string, string | null>) {
  return async (args: string[]) => {
    const out = answers[args.join(" ")];
    return out === null || out === undefined ? { ok: false, out: "fatal" } : { ok: true, out };
  };
}
const START = {
  "rev-list --count HEAD": "214", "rev-parse --short HEAD": "8fcb094",
  "log -1 --format=%cI": "2026-11-08T13:20:00+00:00", "rev-parse --abbrev-ref HEAD": "main",
  "rev-list --count HEAD..origin/main": "0",
};

test("reads the build number, hash, date and branch", async () => {
  const b = await readBuild(fakeGit(START), "/office");
  assert.deepEqual(b, { number: 214, hash: "8fcb094", date: "2026-11-08T13:20:00+00:00", branch: "main",
    folder: "/office", behind: 0, restart: false });
});

test("no git folder means no build", async () => {
  assert.equal(await readBuild(fakeGit({}), "/office"), null);
});

test("up to date: the same object comes back, so nothing is sent", async () => {
  const b = (await readBuild(fakeGit(START), "/office"))!;
  assert.equal(await checkBuild(fakeGit(START), b), b);
});

test("a newer commit in the folder means restart; GitHub ahead means behind; a branch is reported", async () => {
  const b = (await readBuild(fakeGit(START), "/office"))!;
  assert.equal((await checkBuild(fakeGit({ ...START, "rev-parse --short HEAD": "aaaaaaa" }), b)).restart, true);
  assert.equal((await checkBuild(fakeGit({ ...START, "rev-list --count HEAD..origin/main": "3" }), b)).behind, 3);
  assert.equal((await checkBuild(fakeGit({ ...START, "rev-parse --abbrev-ref HEAD": "restructure" }), b)).branch, "restructure");
});

test("no origin/main yet (never fetched) keeps behind at 0", async () => {
  const b = (await readBuild(fakeGit(START), "/office"))!;
  const next = await checkBuild(fakeGit({ ...START, "rev-list --count HEAD..origin/main": null }), b);
  assert.equal(next.behind, 0);
});
