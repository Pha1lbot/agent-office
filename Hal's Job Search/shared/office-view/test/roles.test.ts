import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanUploadName, docsOf, downloadName, fileFor, fileTitle, listFiles, saveAdvert, saveAttachment, saveTalkingPoints, setFilePrefix, textsOf } from "../src/roles.ts";

setFilePrefix("Your Name");

function sample() {
  const root = mkdtempSync(join(tmpdir(), "roles-"));
  const dir = join(root, "acme-analyst");
  mkdirSync(join(dir, "attachments"), { recursive: true });
  for (const f of ["listing.md", "cv.md", "cv.docx", "cv.pdf", "talking-points.md"]) writeFileSync(join(dir, f), `# ${f}\n`);
  writeFileSync(join(dir, "attachments", "advert.pdf"), "%PDF");
  writeFileSync(join(dir, "secret.txt"), "not for the page");
  return root;
}

test("document flags come from which files exist", async () => {
  const root = sample();
  assert.deepEqual(await docsOf(root, "acme-analyst"), {
    cv: true, letter: false, cvPdf: true, letterPdf: false, prep: false, points: true, attachments: 1,
  });
  assert.equal((await docsOf(root, "no-such-role")).cv, false);
});

test("only allowed files can be fetched, and nothing outside the role folder", () => {
  const root = sample();
  assert.ok(fileFor(root, "acme-analyst", "cv.pdf")?.endsWith(join("acme-analyst", "cv.pdf")));
  assert.ok(fileFor(root, "acme-analyst", "attachments/advert.pdf"));
  assert.equal(fileFor(root, "acme-analyst", "secret.txt"), null);
  assert.equal(fileFor(root, "acme-analyst", "../other/cv.pdf"), null);
  assert.equal(fileFor(root, "acme-analyst", "attachments/../../x"), null);
  assert.equal(fileFor(root, "../etc", "cv.pdf"), null);
  assert.equal(fileFor(root, "Bad_ID", "cv.pdf"), null);
});

test("file list and texts only include the team's files", async () => {
  const root = sample();
  const names = (await listFiles(root, "acme-analyst")).map((f) => f.name).sort();
  assert.deepEqual(names, ["attachments/advert.pdf", "cv.docx", "cv.md", "cv.pdf", "listing.md", "talking-points.md"]);
  const texts = await textsOf(root, "acme-analyst");
  assert.deepEqual(Object.keys(texts).sort(), ["cv.md", "listing.md", "talking-points.md"]);
});

test("upload names are cleaned, types limited, and clashes numbered", async () => {
  assert.equal(cleanUploadName("My CV (final).PDF"), "My-CV-final.pdf");
  assert.equal(cleanUploadName("..\\..\\evil.pdf"), "evil.pdf");
  assert.equal(cleanUploadName("run.exe"), null);
  const root = sample();
  assert.equal(await saveAttachment(root, "acme-analyst", "advert.pdf", Buffer.from("x")), "advert-2.pdf");
  assert.equal(await saveAttachment(root, "acme-analyst", "notes.txt", Buffer.from("x")), "notes.txt");
  await assert.rejects(saveAttachment(root, "acme-analyst", "a.exe", Buffer.from("x")));
  await assert.rejects(saveAttachment(root, "acme-analyst", "big.pdf", Buffer.alloc(10 * 1024 * 1024 + 1)));
  await assert.rejects(saveAttachment(root, "../x", "a.pdf", Buffer.from("x")));
});

test("talking points are saved to talking-points.md only", async () => {
  const root = sample();
  await saveTalkingPoints(root, "acme-analyst", "# Key talking points\r\n\r\n- One\r\n- Two\r\n\r\n");
  assert.equal(readFileSync(join(root, "acme-analyst", "talking-points.md"), "utf8"), "# Key talking points\n\n- One\n- Two\n");
  await assert.rejects(saveTalkingPoints(root, "../x", "hi"));
});

test("pasted advert text is saved as advert.txt and sent to the role page", async () => {
  const root = sample();
  await saveAdvert(root, "acme-analyst", "  Analyst wanted\r\nRemote  \n");
  assert.equal(readFileSync(join(root, "acme-analyst", "advert.txt"), "utf8"), "Analyst wanted\nRemote\n");
  assert.ok(fileFor(root, "acme-analyst", "advert.txt"));
  assert.ok("advert.txt" in (await textsOf(root, "acme-analyst")));
  await assert.rejects(saveAdvert(root, "../x", "hi"));
  await assert.rejects(saveAdvert(root, "acme-analyst", "x".repeat(20_001)));
});

test("Ada's named PDFs stand in for cv.pdf and cover-letter.pdf", async () => {
  const root = mkdtempSync(join(tmpdir(), "roles-"));
  const dir = join(root, "acme-producer");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cv.md"), "# CV\n");
  writeFileSync(join(dir, "Your_Name_Producer_cv.pdf"), "%PDF new");
  writeFileSync(join(dir, "Your_Name_Producer_cover_letter.pdf"), "%PDF letter");
  assert.ok(fileFor(root, "acme-producer", "cv.pdf")?.endsWith("Your_Name_Producer_cv.pdf"));
  assert.ok(fileFor(root, "acme-producer", "cover-letter.pdf")?.endsWith("Your_Name_Producer_cover_letter.pdf"));
  assert.equal(fileFor(root, "acme-producer", "Your_Name_Producer_cv.pdf"), null); // only through the plain name
  const docs = await docsOf(root, "acme-producer");
  assert.equal(docs.cvPdf, true);
  assert.equal(docs.letterPdf, true);
  assert.deepEqual((await listFiles(root, "acme-producer")).map((f) => f.name).sort(), ["cover-letter.pdf", "cv.md", "cv.pdf"]);
});

test("download names follow <Your_Name>_<Job_Title>_cv, like make_docs.py", () => {
  assert.equal(fileTitle("Senior Manager, Admin & Operations – Football Schools"),
    "Senior_Manager_Admin_and_Operations_Football_Schools");
  assert.equal(fileTitle("Head of Esports (Co-ordinator) / Café"), "Head_of_Esports_Co-ordinator_Cafe");
  assert.equal(fileTitle("!!!"), "Role");
  assert.ok(fileTitle("Word ".repeat(40)).length <= 60);
  assert.equal(downloadName("Producer", "cv.docx"), "Your_Name_Producer_cv.docx");
  assert.equal(downloadName("Producer", "cover-letter.pdf"), "Your_Name_Producer_cover_letter.pdf");
  assert.equal(downloadName("Producer", "listing.md"), null);
});
