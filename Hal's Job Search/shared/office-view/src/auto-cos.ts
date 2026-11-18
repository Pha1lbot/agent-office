// Starts Chief of Staff in the background when Hal's office changes need work
// (the tracker's inbox), or when the office's own Scout run left finds for him
// to sort. One run at a time, a quiet period first so several edits share one
// run, and a daily cap to protect Hal's usage limits.
import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface CosStatus {
  available: boolean; // Claude Code is installed on this PC
  auto: boolean; // Hal's on/off switch
  running: boolean;
  startsAt: number; // when a scheduled run starts (0 = none)
  runsToday: number;
  maxPerDay: number;
  inbox: number; // changes waiting
  finds: number; // Scout's finds waiting to be sorted (kept as leads or dismissed)
  last: { at: number; ok: boolean; message: string } | null;
}

const QUIET_MS = Number(process.env.OFFICE_COS_QUIET_MS || 2 * 60_000);
const MAX_RUN_MS = 20 * 60_000;
const MAX_PER_DAY = Number(process.env.OFFICE_COS_MAX_PER_DAY || 8);
const ALLOWED_TOOLS = [
  "Read", "Write", "Edit", "Glob", "Grep", "Task", "Agent", "WebSearch", "WebFetch",
  "Bash(git status:*)", "Bash(git pull:*)", "Bash(git log:*)", "Bash(git diff:*)", "Bash(python:*)", "Bash(python3:*)", "Bash(py:*)", "Bash(pandoc:*)",
];

const ukDay = () => new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });

/** What to tell Tim when the office starts him: office changes, Scout's finds, or both. */
export function cosPrompt(inbox: number, finds: number, python: string): string {
  const lines: string[] = [];
  if (inbox) {
    lines.push("/cos office changes", "",
      "You were started automatically by the Agent Office because Hal changed roles there.",
      "Follow the 'Office changes' section of .claude/skills/cos/SKILL.md.");
  }
  if (finds) {
    if (!inbox) lines.push("/cos sort Scout's finds", "", "You were started automatically by the Agent Office.");
    lines.push(`The office's job search (Scout) left ${finds} find${finds === 1 ? "" : "s"} to sort. Follow the "Scout's finds" section of .claude/skills/cos/SKILL.md.`);
    if (inbox) lines.push("Do both.");
  }
  lines.push(
    "Hal isn't watching this session, so don't ask him anything: record questions for him with `tracker.py action add`.",
    `On this PC, run Python as \`${python}\` (for example \`${python} shared/tools/tracker.py inbox list\`).`,
  );
  return lines.join("\n");
}

export class AutoCos {
  status: CosStatus;
  private timer: NodeJS.Timeout | null = null;
  private child: ChildProcess | null = null;
  private day = ukDay();
  private settingsFile: string;

  constructor(
    private claude: string | null,
    private office: string, // the office folder: holds .claude/skills/cos and shared/tools
    private python: string,
    private appDir: string,
    private hooks: { before: () => Promise<void>; after: () => Promise<{ inbox: number; finds: number }>; changed: () => void; budgetLeft: () => number | null },
  ) {
    this.settingsFile = join(appDir, ".office-settings.json");
    let auto = true;
    try { auto = JSON.parse(readFileSync(this.settingsFile, "utf8")).autoCos !== false; } catch {}
    this.status = { available: !!claude, auto, running: false, startsAt: 0, runsToday: 0, maxPerDay: MAX_PER_DAY, inbox: 0, finds: 0, last: null };
  }

  /** Anything for Tim to do: office changes or finds to sort. */
  private get work() { return this.status.inbox + this.status.finds; }

  setAuto(on: boolean) {
    this.status.auto = on;
    try { writeFileSync(this.settingsFile, JSON.stringify({ autoCos: on }) + "\n"); } catch {}
    if (!on) this.cancel();
    else if (this.work) this.schedule();
    this.hooks.changed();
  }

  /** Tell it how many inbox items are waiting; schedules a run if there are new ones. */
  inboxChanged(count: number, fromTim: boolean) {
    const grew = count > this.status.inbox;
    this.status.inbox = count;
    if (grew && fromTim) this.schedule();
    this.hooks.changed();
  }

  /** Tell it how many of Scout's finds are unsorted. `fromScout`: the office's own Scout run just
   *  finished, so start Tim to sort them (a scheduled daily search sorts its own finds). */
  findsChanged(count: number, fromScout: boolean) {
    this.status.finds = count;
    if (count && fromScout) this.schedule();
    this.hooks.changed();
  }

  private cancel() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.status.startsAt = 0;
  }

  schedule(delay = QUIET_MS) {
    if (!this.status.available || !this.status.auto || !this.work) return;
    this.cancel();
    this.status.startsAt = Date.now() + delay;
    this.timer = setTimeout(() => void this.start(), delay);
    this.hooks.changed();
  }

  /** Start now (the office's "Run now" button), within the same limits. */
  async start() {
    this.cancel();
    if (this.child || !this.claude || !this.work) return this.hooks.changed();
    if (!existsSync(join(this.office, ".claude", "skills", "cos", "SKILL.md"))) {
      this.status.last = { at: Date.now(), ok: false, message: `Can't start: no .claude/skills/cos/SKILL.md in ${this.office}.` };
      return this.hooks.changed();
    }
    if (ukDay() !== this.day) { this.day = ukDay(); this.status.runsToday = 0; }
    if (this.status.runsToday >= MAX_PER_DAY) {
      this.status.last = { at: Date.now(), ok: false, message: `Daily limit of ${MAX_PER_DAY} automatic runs reached. Run /cos yourself, or wait until tomorrow.` };
      return this.hooks.changed();
    }
    const left = this.hooks.budgetLeft();
    if (left !== null && left <= 0) {
      this.status.last = { at: Date.now(), ok: false, message: "Today's token budget is used up, so Tim won't start automatically until tomorrow. Run /tim yourself if it can't wait." };
      return this.hooks.changed();
    }
    await this.hooks.before();
    this.status.runsToday++;
    this.status.running = true;
    this.hooks.changed();

    const logs = join(this.appDir, "logs");
    mkdirSync(logs, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const log = createWriteStream(join(logs, `cos-${stamp}.log`));
    const prompt = cosPrompt(this.status.inbox, this.status.finds, this.python);
    const quote = (a: string) => (process.platform === "win32" ? `"${a}"` : a);
    const args = ["-p", "--model", "sonnet", "--permission-mode", "acceptEdits", "--allowedTools", ...ALLOWED_TOOLS].map(quote);
    // OFFICE_AUTO_RUN turns on hooks/guard.mjs, which refuses git commands that
    // rewrite or throw away history: Hal isn't there to say yes to them.
    const env = { ...process.env, OFFICE_AUTO_RUN: "1" };
    const child = spawn(this.claude, args, { cwd: this.office, env, shell: process.platform === "win32", windowsHide: true });
    this.child = child;
    const kill = setTimeout(() => child.kill(), MAX_RUN_MS);
    child.stdout?.pipe(log);
    child.stderr?.pipe(log);
    child.stdin?.end(prompt);
    const finish = async (ok: boolean, message: string) => {
      if (!this.child) return;
      clearTimeout(kill);
      this.child = null;
      this.status.running = false;
      this.status.last = { at: Date.now(), ok, message };
      log.end();
      const left = await this.hooks.after();
      this.status.inbox = left.inbox;
      this.status.finds = left.finds;
      this.hooks.changed();
    };
    child.on("error", (e) => void finish(false, `Couldn't start Claude Code: ${e.message}`));
    child.on("exit", (code) => void finish(code === 0, code === 0 ? "Finished" : `Stopped with an error (code ${code}). See the log in shared/office-view/logs.`));
  }
}
