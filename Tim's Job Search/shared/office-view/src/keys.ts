// The job-site key (Reed) kept in shared/job-search/.env, which is never saved to GitHub.
// The office can add or replace a key but never shows one: the page only learns "set" or "not set".
import { readFile, writeFile } from "node:fs/promises";

export const KEY_NAMES = ["REED_API_KEY"] as const;
export type KeyName = (typeof KEY_NAMES)[number];

const valid = (value: string) => /^[A-Za-z0-9_-]{8,128}$/.test(value);

async function readLines(envFile: string): Promise<string[]> {
  try { return (await readFile(envFile, "utf8")).split(/\r?\n/); } catch { return []; }
}

/** Which keys are set (non-empty). Never returns a value. */
export async function keyStatus(envFile: string): Promise<Record<KeyName, boolean>> {
  const set = new Set<string>();
  for (const line of await readLines(envFile)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && m[2].replace(/^["']|["']$/g, "")) set.add(m[1]);
  }
  return Object.fromEntries(KEY_NAMES.map((k) => [k, set.has(k)])) as Record<KeyName, boolean>;
}

/**
 * Add or replace keys. Blank values are ignored (so a form can leave a key as it is). Anything that
 * isn't plain letters, digits, hyphens or underscores is refused, so a value can't carry a new line
 * or another setting. Other lines in the file are kept as they are. Returns the names that changed.
 */
export async function setKeys(envFile: string, values: Partial<Record<string, unknown>>): Promise<KeyName[]> {
  const changes = new Map<KeyName, string>();
  for (const name of KEY_NAMES) {
    const raw = values[name];
    if (raw === undefined || raw === null || String(raw).trim() === "") continue;
    const value = String(raw).trim();
    if (!valid(value)) throw new Error(`That ${name.replace(/_/g, " ").toLowerCase()} doesn't look right: it should be 8 to 128 letters and numbers, with no spaces.`);
    changes.set(name, value);
  }
  if (!changes.size) return [];
  const lines = await readLines(envFile);
  const done = new Set<string>();
  const next = lines.map((line) => {
    const m = /^\s*([A-Z_]+)\s*=/.exec(line);
    const name = m && (KEY_NAMES as readonly string[]).includes(m[1]) ? (m[1] as KeyName) : null;
    if (name && changes.has(name) && !done.has(name)) { done.add(name); return `${name}=${changes.get(name)}`; }
    return line;
  });
  while (next.length && next[next.length - 1] === "") next.pop();
  for (const [name, value] of changes) if (!done.has(name)) next.push(`${name}=${value}`);
  await writeFile(envFile, next.join("\n") + "\n", { encoding: "utf8", mode: 0o600 });
  return [...changes.keys()];
}
