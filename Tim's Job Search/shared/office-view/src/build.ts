// Which build of the office is running, and whether it's up to date, for the
// label at the top left of the page. The build number is the number of commits
// on the running copy, so it goes up with every merge. No network: sync.ps1
// fetches from GitHub (at log-on and when the office opens), and this compares with what it fetched.
import type { RunResult } from "./tools.ts";

export interface Build {
  number: number;       // commits in the running copy
  hash: string;         // short commit id
  date: string;         // commit date, ISO
  branch: string;
  folder: string;
  behind: number;       // commits on GitHub's main not in this folder yet
  restart: boolean;     // the folder has a newer build than the running server
}

type Run = (args: string[]) => Promise<RunResult>;

const first = (r: RunResult) => (r.ok ? r.out.split("\n")[0].trim() : "");

/** The running build, read once when the office starts. Null if this isn't a git folder. */
export async function readBuild(git: Run, folder: string): Promise<Build | null> {
  const [count, hash, date, branch] = await Promise.all([
    git(["rev-list", "--count", "HEAD"]), git(["rev-parse", "--short", "HEAD"]),
    git(["log", "-1", "--format=%cI"]), git(["rev-parse", "--abbrev-ref", "HEAD"]),
  ]);
  const number = Number(first(count));
  if (!count.ok || !Number.isFinite(number)) return null;
  return { number, hash: first(hash), date: first(date), branch: first(branch), folder, behind: 0, restart: false };
}

/** Re-check against the folder and the last fetch. Returns the same object if nothing changed. */
export async function checkBuild(git: Run, build: Build): Promise<Build> {
  const [head, branch, behind] = await Promise.all([
    git(["rev-parse", "--short", "HEAD"]), git(["rev-parse", "--abbrev-ref", "HEAD"]),
    git(["rev-list", "--count", "HEAD..origin/main"]),
  ]);
  const next = {
    ...build,
    restart: head.ok && first(head) !== build.hash,
    branch: first(branch) || build.branch,
    behind: behind.ok ? Number(first(behind)) || 0 : build.behind,
  };
  const same = next.restart === build.restart && next.branch === build.branch && next.behind === build.behind;
  return same ? build : next;
}
