// Each role's folder: jobs/roles/<id>/ holds the listing, CV, cover letter,
// PDFs, interview prep, talking points and Tim's attachments.
// Everything here checks names and paths so nothing outside a role folder can
// be read or written.
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

export const ROLE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Files the team makes in a role folder, which the page may read or download. */
export const ROLE_FILES = [
  "listing.md", "advert.txt", "cv.md", "cover-letter.md", "notes.md", "talking-points.md", "interview-prep.md",
  "cv.docx", "cover-letter.docx", "cv.pdf", "cover-letter.pdf",
] as const;
/** Ada names the PDFs you send <Your_Name>_<Job_Title>_cv.pdf and ..._cover_letter.pdf
 * (make_docs.py). The page still asks for "cv.pdf" and "cover-letter.pdf"; these map
 * to the named file, or to an older plain cv.pdf. */
const PDF_KIND: Record<string, string> = { "cv.pdf": "cv", "cover-letter.pdf": "cover_letter" };
const DOC_KIND: Record<string, string> = { ...PDF_KIND, "cv.docx": "cv", "cover-letter.docx": "cover_letter" };

/** "Senior Manager, Admin & Operations" -> "Senior_Manager_Admin_and_Operations".
 * The same as file_title() in shared/tools/make_docs.py. */
export function fileTitle(title: string, limit = 60): string {
  const text = title.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").replace(/&/g, " and ")
    .replace(/[^A-Za-z0-9-]+/g, " ");
  const out: string[] = [];
  for (const raw of text.split(/\s+/)) {
    const word = raw.replace(/^-+|-+$/g, "");
    if (!word) continue;
    if (out.length && [...out, word].join("_").length > limit) break;
    out.push(word);
  }
  return out.join("_") || "Role";
}

/** The owner's name as used in file names, e.g. "Tim Everard" -> "Tim_Everard". Taken from the
 * name in base-cv.json when the office starts (the same as file_prefix() in make_docs.py). */
let prefix = "CV";
export function filePrefix(name: string): string {
  return name.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").replace(/[^A-Za-z0-9-]+/g, " ").trim().split(/\s+/).filter(Boolean).join("_") || "CV";
}
export function setFilePrefix(name: string) { prefix = filePrefix(name); }

/** The name you get when you download a role's CV or letter, e.g. Tim_Everard_Producer_cv.docx. */
export function downloadName(title: string, name: string): string | null {
  const kind = DOC_KIND[name];
  return kind ? `${prefix}_${fileTitle(title)}_${kind}${extname(name)}` : null;
}

/** The file on disk behind "cv.pdf" or "cover-letter.pdf": Ada's named PDF (newest), else the old name. */
function pdfOnDisk(dir: string, name: string): string {
  const kind = PDF_KIND[name];
  let best = name, newest = -1;
  try {
    for (const f of readdirSync(dir)) {
      if (!f.startsWith(`${prefix}_`) || !f.endsWith(`_${kind}.pdf`)) continue;
      const t = statSync(join(dir, f)).mtimeMs;
      if (t > newest) { best = f; newest = t; }
    }
  } catch { /* no folder */ }
  return best;
}

/** The markdown files sent to the role page as text. */
export const TEXT_FILES = ["listing.md", "advert.txt", "cv.md", "cover-letter.md", "notes.md", "talking-points.md", "interview-prep.md"];
export const UPLOAD_TYPES = new Set([".pdf", ".docx", ".doc", ".txt", ".md", ".png", ".jpg", ".jpeg"]);
export const MAX_UPLOAD = 10 * 1024 * 1024;
const MAX_TEXT = 200 * 1024;

export interface Docs {
  cv: boolean;
  letter: boolean;
  cvPdf: boolean;
  letterPdf: boolean;
  prep: boolean;
  points: boolean;
  attachments: number;
}

export interface FileInfo {
  name: string; // "cv.pdf" or "attachments/advert.pdf"
  size: number;
  modified: number;
}

export function roleDir(rolesRoot: string, id: string): string | null {
  return ROLE_ID.test(id) && id.length <= 120 ? join(rolesRoot, id) : null;
}

/** The path of a file the page asked for, or null if it isn't allowed. */
export function fileFor(rolesRoot: string, id: string, name: string): string | null {
  const dir = roleDir(rolesRoot, id);
  if (!dir) return null;
  let target: string;
  if (PDF_KIND[name]) target = join(dir, pdfOnDisk(dir, name));
  else if ((ROLE_FILES as readonly string[]).includes(name)) target = join(dir, name);
  else if (/^attachments\/[^/\\]+$/.test(name) && !name.includes("..")) target = join(dir, name);
  else return null;
  const full = resolve(target);
  return full.startsWith(resolve(dir) + sep) ? full : null;
}

/** A safe file name for an upload: letters, numbers, dots, dashes; a permitted type. */
export function cleanUploadName(raw: string): string | null {
  const base = raw.split(/[\\/]/).pop() || "";
  const ext = extname(base).toLowerCase();
  if (!UPLOAD_TYPES.has(ext)) return null;
  const stem = base.slice(0, base.length - ext.length).normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "file";
  return stem + ext;
}

async function exists(path: string) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

export async function listFiles(rolesRoot: string, id: string): Promise<FileInfo[]> {
  const dir = roleDir(rolesRoot, id);
  if (!dir) return [];
  const files: FileInfo[] = [];
  const add = async (name: string) => {
    try {
      const s = await stat(join(dir, PDF_KIND[name] ? pdfOnDisk(dir, name) : name));
      if (s.isFile()) files.push({ name, size: s.size, modified: s.mtimeMs });
    } catch { /* not there */ }
  };
  for (const name of ROLE_FILES) await add(name);
  try {
    for (const name of await readdir(join(dir, "attachments"))) await add(`attachments/${name}`);
  } catch { /* no attachments yet */ }
  return files;
}

export async function docsOf(rolesRoot: string, id: string): Promise<Docs> {
  const dir = roleDir(rolesRoot, id);
  const none: Docs = { cv: false, letter: false, cvPdf: false, letterPdf: false, prep: false, points: false, attachments: 0 };
  if (!dir || !existsSync(dir)) return none;
  let attachments = 0;
  try { attachments = (await readdir(join(dir, "attachments"))).length; } catch { /* none */ }
  return {
    cv: await exists(join(dir, "cv.docx")) || await exists(join(dir, "cv.md")),
    letter: await exists(join(dir, "cover-letter.docx")) || await exists(join(dir, "cover-letter.md")),
    cvPdf: await exists(join(dir, pdfOnDisk(dir, "cv.pdf"))),
    letterPdf: await exists(join(dir, pdfOnDisk(dir, "cover-letter.pdf"))),
    prep: await exists(join(dir, "interview-prep.md")),
    points: await exists(join(dir, "talking-points.md")),
    attachments,
  };
}

/** The role page's texts: each markdown file that exists, cut to a sensible size. */
export async function textsOf(rolesRoot: string, id: string): Promise<Record<string, string>> {
  const dir = roleDir(rolesRoot, id);
  const out: Record<string, string> = {};
  if (!dir) return out;
  for (const name of TEXT_FILES) {
    try { out[name] = (await readFile(join(dir, name), "utf8")).slice(0, MAX_TEXT); } catch { /* not written yet */ }
  }
  return out;
}

/** Save an upload under attachments/, adding -2, -3… if the name is taken. Returns the saved name. */
export async function saveAttachment(rolesRoot: string, id: string, rawName: string, data: Buffer): Promise<string> {
  const dir = roleDir(rolesRoot, id);
  if (!dir) throw new Error("No such role");
  const clean = cleanUploadName(rawName);
  if (!clean) throw new Error(`Only ${[...UPLOAD_TYPES].join(", ")} files can be attached.`);
  if (data.length > MAX_UPLOAD) throw new Error("Files can be up to 10 MB.");
  const folder = join(dir, "attachments");
  await mkdir(folder, { recursive: true });
  const ext = extname(clean), stem = clean.slice(0, -ext.length);
  let name = clean, n = 2;
  while (existsSync(join(folder, name))) name = `${stem}-${n++}${ext}`;
  await writeFile(join(folder, name), data);
  return name;
}

/** Tim's talking points, as markdown. Only the role folder's talking-points.md is written. */
export async function saveTalkingPoints(rolesRoot: string, id: string, text: string): Promise<void> {
  const dir = roleDir(rolesRoot, id);
  if (!dir) throw new Error("No such role");
  if (text.length > 20_000) throw new Error("That's too long to save.");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "talking-points.md"), text.replace(/\r\n/g, "\n").trimEnd() + "\n", "utf8");
}

/** Save advert text Tim pasted in when adding a role (for pages Rita can't open, like LinkedIn). */
export async function saveAdvert(rolesRoot: string, id: string, text: string): Promise<void> {
  const dir = roleDir(rolesRoot, id);
  if (!dir) throw new Error("No such role");
  if (text.length > 20_000) throw new Error("The advert text is too long (20,000 characters at most).");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "advert.txt"), text.replace(/\r\n/g, "\n").trim() + "\n", "utf8");
}
