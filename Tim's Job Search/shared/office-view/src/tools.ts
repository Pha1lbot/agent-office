// Running the repo's own tools from the office: the tracker (Python) and git.
import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface RunResult {
  ok: boolean;
  out: string;
}

/** Run a program without a shell (so values can't be misread as commands). */
export function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}, timeoutMs = 60_000): Promise<RunResult> {
  return new Promise((done) => {
    execFile(cmd, args, { cwd, env: { ...process.env, ...env }, timeout: timeoutMs, windowsHide: true, maxBuffer: 4 << 20 },
      (error, stdout, stderr) => done({ ok: !error, out: `${stdout}${stderr}`.trim() }));
  });
}

/** Find a working Python 3. On Windows "python3" is often a Microsoft Store placeholder, so try "python" and "py" first. */
export async function findPython(cwd: string): Promise<string | null> {
  const tries = [process.env.OFFICE_PYTHON, ...(process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"])];
  for (const cmd of tries) {
    if (!cmd) continue;
    const r = await run(cmd, ["--version"], cwd, {}, 10_000);
    if (r.ok && /Python 3\./.test(r.out)) return cmd;
  }
  return null;
}

/** Find the Claude Code command-line tool. */
export async function findClaude(cwd: string): Promise<string | null> {
  const tries = [process.env.OFFICE_CLAUDE, "claude"];
  for (const cmd of tries) {
    if (!cmd) continue;
    const ok = await new Promise<boolean>((done) => {
      const child = spawn(cmd, ["--version"], { cwd, shell: process.platform === "win32", windowsHide: true });
      child.on("error", () => done(false));
      child.on("exit", (code) => done(code === 0));
    });
    if (ok) return cmd;
  }
  return null;
}

export class Tracker {
  constructor(readonly python: string, readonly repo: string, readonly trackerFile: string) {}

  private get script() {
    return join(this.repo, "shared", "tools", "tracker.py");
  }
  private get env() {
    return { JOBS_DIR: dirname(this.trackerFile), PYTHONIOENCODING: "utf-8" };
  }

  call(args: string[]) {
    return run(this.python, [this.script, ...args], this.repo, this.env);
  }
}

/** The git repository that holds a file (the tracker may be a test copy elsewhere). */
export async function repoOf(file: string): Promise<string | null> {
  const r = await run("git", ["rev-parse", "--show-toplevel"], dirname(file), {}, 10_000);
  return r.ok ? resolve(r.out.split("\n")[0]) : null;
}

export function mergeInProgress(repo: string) {
  return existsSync(join(repo, ".git", "MERGE_HEAD"));
}
