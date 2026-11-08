// Backs up Hal's office edits to GitHub: commit the tracker, pull, push.
// Never forces anything. If GitHub has a clashing change, it stops and says so.
import { relative } from "node:path";
import { run, mergeInProgress } from "./tools.ts";

export type BackupState = "idle" | "pending" | "saving" | "saved" | "error" | "off";

export interface BackupStatus {
  state: BackupState;
  at: number;
  message: string;
}

const QUIET_MS = Number(process.env.OFFICE_BACKUP_QUIET_MS || 15_000); // wait this long after the last edit, so several edits make one commit
const GIT_ENV = { GIT_TERMINAL_PROMPT: "0", GIT_MERGE_AUTOEDIT: "no" };

export class Backup {
  status: BackupStatus = { state: "idle", at: 0, message: "" };
  private changes: string[] = [];
  private timer: NodeJS.Timeout | null = null;
  private busy: Promise<void> | null = null;
  /** Set while Chief of Staff is running: it commits its own work, so wait for it. */
  hold = false;

  constructor(private repo: string | null, private files: string[], private onChange: () => void, offMessage = "Not in a git folder, so edits aren't backed up") {
    if (!repo) this.status = { state: "off", at: 0, message: offMessage };
  }

  /** Note an edit (e.g. "Hexagon World Series: approved") and save soon. */
  edited(summary: string) {
    if (!this.repo) return;
    this.changes.push(summary);
    this.set("pending", "Saving to GitHub shortly…");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.save(), QUIET_MS);
  }

  /** Save now (before Chief of Staff starts, so it works from the saved version). */
  async flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.busy) await this.busy;
    if (this.changes.length) await this.save(true);
  }

  private set(state: BackupState, message: string) {
    this.status = { state, at: Date.now(), message };
    this.onChange();
  }

  private async save(force = false) {
    if (!this.repo) return;
    if (this.hold && !force) {
      this.timer = setTimeout(() => void this.save(), QUIET_MS);
      return;
    }
    if (this.busy) { await this.busy; if (!this.changes.length) return; }
    this.busy = this.commitAndPush().finally(() => { this.busy = null; });
    await this.busy;
  }

  private async commitAndPush() {
    const repo = this.repo!;
    const changes = this.changes.splice(0);
    const git = (...args: string[]) => run("git", args, repo, GIT_ENV, 120_000);
    this.set("saving", "Saving to GitHub…");
    if (mergeInProgress(repo)) return this.set("error", "Git has an unfinished merge. Ask Claude to sort it out, then edit again.");
    const paths = this.files.map((f) => relative(repo, f));
    let r = await git("add", "--", ...paths);
    if (!r.ok) return this.set("error", `Couldn't stage the tracker: ${r.out}`);
    const staged = await git("diff", "--cached", "--quiet", "--", ...paths);
    if (!staged.ok) {
      const unique = [...new Set(changes)];
      const subject = unique.length === 1 ? `Office: ${unique[0]}` : `Office: ${unique.length} changes by Hal`;
      const body = unique.length > 1 ? "\n\n" + unique.map((c) => `- ${c}`).join("\n") : "";
      r = await git("commit", "-m", subject + body, "--", ...paths);
      if (!r.ok) return this.set("error", `Couldn't commit: ${r.out}`);
    }
    r = await git("pull", "--no-rebase", "--no-edit");
    if (!r.ok) {
      if (mergeInProgress(repo)) await git("merge", "--abort"); // undo only the half-done merge; Hal's commit stays
      return this.set("error", "Your changes are saved on this PC, but GitHub has changes that clash. Ask Claude to merge them.");
    }
    r = await git("push");
    if (!r.ok) return this.set("error", `Saved on this PC, but couldn't push to GitHub: ${r.out.split("\n").pop()}`);
    this.set("saved", "Saved to GitHub");
  }
}
