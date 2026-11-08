#!/usr/bin/env node
// Claude Code hook (PreToolUse, Bash): a safety guard for Tim's automatic runs.
//
// CLAUDE.md says never rewrite or throw away git history unless Hal asks. In an
// automatic run (started by the office, OFFICE_AUTO_RUN=1) Hal isn't there to
// ask, so this hook refuses those git commands outright. Claude sees the reason
// and carries on another way.
//
// Outside automatic runs it does nothing, so Hal can still ask for these in a
// session he is watching. It only reads the command text: it stops mistakes,
// not someone determined to get round it.

import { pathToFileURL } from "node:url";

const OP = "\u0000op"; // marks ; && || | & ( ) ` and new lines between commands

/**
 * Split a shell command into words, keeping quoted text together. Comments and
 * heredoc bodies (e.g. a commit message) are left out, as they aren't commands.
 */
function words(command) {
  const out = [];
  let cur = "";
  let started = false;
  let quote = null;
  const heredocs = []; // end markers of heredocs whose bodies start on the next line
  const push = () => { if (started) out.push(cur); cur = ""; started = false; };
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"' && '$`"\\\n'.includes(command[i + 1] ?? "")) cur += command[++i];
      else cur += c;
      continue;
    }
    if (c === "'" || c === '"') { quote = c; started = true; continue; }
    if (c === "\\" && i + 1 < command.length && command[i + 1] !== "\n") { cur += command[++i]; started = true; continue; }
    if (c === "#" && !started) { while (i + 1 < command.length && command[i + 1] !== "\n") i++; continue; }
    if (c === "<" && command[i + 1] === "<" && command[i + 2] !== "<") {
      push();
      let k = i + 2;
      if (command[k] === "-") k++;
      while (command[k] === " " || command[k] === "\t") k++;
      let marker = "";
      if (command[k] === "'" || command[k] === '"') {
        const q = command[k++];
        while (k < command.length && command[k] !== q) marker += command[k++];
        k++;
      } else {
        while (k < command.length && !/[\s;&|()<>]/.test(command[k])) marker += command[k++];
      }
      if (marker) heredocs.push(marker);
      i = k - 1;
      continue;
    }
    if (c === "\n") {
      push();
      out.push(OP);
      let k = i + 1;
      for (const marker of heredocs.splice(0)) {
        while (k < command.length) {
          const end = command.indexOf("\n", k);
          const line = command.slice(k, end === -1 ? command.length : end);
          k = end === -1 ? command.length : end + 1;
          if (line.replace(/^\t+/, "") === marker) break;
        }
      }
      i = k - 1;
      continue;
    }
    if (";&|()`".includes(c)) { push(); out.push(OP); continue; }
    if (/\s/.test(c)) { push(); continue; }
    cur += c;
    started = true;
  }
  push();
  return out;
}

const isGit = (w) => /(^|[\\/])git(\.exe)?$/i.test(w);
// Git's own options that come before the subcommand and take a value.
const TAKES_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix", "--config-env"]);
/** Short flags run together, e.g. "-fu" holds "f". */
const shortHas = (args, letters) => args.some((a) => /^-[a-zA-Z]+$/.test(a) && [...letters].some((l) => a.includes(l)));
const has = (args, ...flags) => args.some((a) => flags.some((f) => a === f || a.startsWith(f + "=")));

/** Why a single git command is refused, or null if it's fine. */
function judge(sub, args) {
  switch (sub) {
    case "push":
      if (has(args, "--force", "--force-with-lease", "--force-if-includes") || shortHas(args, "f"))
        return "`git push --force` rewrites history on GitHub";
      if (has(args, "--delete", "--mirror", "--prune") || shortHas(args, "d"))
        return "this push deletes branches or tags on GitHub";
      if (args.some((a) => !a.startsWith("-") && (a.startsWith("+") || a.startsWith(":"))))
        return "a `+` or `:` refspec forces or deletes a branch on GitHub";
      return null;
    case "reset":
      return has(args, "--hard", "--merge", "--keep") ? "`git reset --hard` throws away work" : null;
    case "clean":
      return has(args, "--dry-run") || shortHas(args, "n") ? null : "`git clean` deletes files that aren't committed";
    case "branch":
      return has(args, "--delete", "--force") || shortHas(args, "dDfMC") ? "this deletes or overwrites a branch" : null;
    case "checkout":
      return has(args, "--force", "--discard-changes", "--") || shortHas(args, "fB") || args.includes(".")
        ? "this `git checkout` throws away uncommitted changes" : null;
    case "switch":
      return has(args, "--force", "--discard-changes") || shortHas(args, "fC") ? "this `git switch` throws away changes or a branch" : null;
    case "restore":
      return has(args, "--staged") && !has(args, "--worktree") && !shortHas(args, "W")
        ? null : "`git restore` throws away uncommitted changes";
    case "stash":
      return ["drop", "clear"].includes(args.find((a) => !a.startsWith("-"))) ? "this deletes stashed work" : null;
    case "commit":
      return has(args, "--amend") ? "`git commit --amend` rewrites history" : null;
    case "rebase":
    case "filter-branch":
    case "filter-repo":
      return `\`git ${sub}\` rewrites history`;
    case "reflog":
      return ["expire", "delete"].includes(args[0]) ? "this deletes git's safety record" : null;
    case "update-ref":
      return has(args, "-d") ? "this deletes a branch" : null;
    case "add":
      return has(args, "--force") || shortHas(args, "f") ? "`git add --force` can commit ignored files such as `.env` keys" : null;
    case "rm":
      return has(args, "--force", "-r") || shortHas(args, "rf") ? "`git rm -r` or `-f` deletes files in bulk" : null;
    default:
      return null;
  }
}

/** Why this command is refused in an automatic run, or null if it's allowed. */
export function riskyGit(command) {
  const all = words(String(command ?? ""));
  for (let i = 0; i < all.length; i++) {
    if (!isGit(all[i])) continue;
    let j = i + 1;
    while (j < all.length && all[j] !== OP && all[j].startsWith("-")) {
      j += TAKES_VALUE.has(all[j]) ? 2 : 1;
    }
    if (j >= all.length || all[j] === OP) continue;
    const sub = all[j];
    const args = [];
    for (let k = j + 1; k < all.length && all[k] !== OP; k++) args.push(all[k]);
    const why = judge(sub, args);
    if (why) return why;
  }
  return null;
}

export function message(why) {
  return [
    `Blocked in Tim's automatic run: ${why}.`,
    "CLAUDE.md never allows this unless Hal asks, and Hal isn't watching this run.",
    "Don't try another way round. If a push was rejected, run `git pull` and push again;",
    'if that doesn\'t work, leave it and add an action for Hal with `tracker.py action add "..."`.',
  ].join(" ");
}

async function main() {
  if (process.env.OFFICE_AUTO_RUN !== "1") return 0;
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  let event;
  try { event = JSON.parse(input); } catch { return 0; }
  if (event?.tool_name !== "Bash") return 0;
  const why = riskyGit(event.tool_input?.command);
  if (!why) return 0;
  process.stderr.write(message(why) + "\n");
  return 2; // exit code 2 makes Claude Code refuse the tool call and show Claude the reason
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code), () => process.exit(0));
}
