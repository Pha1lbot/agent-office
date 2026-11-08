import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// @ts-expect-error: plain JavaScript hook, no type declarations
import { riskyGit } from "../hooks/guard.mjs";

const GUARD = fileURLToPath(new URL("../hooks/guard.mjs", import.meta.url));

test("lets through the git commands Cass uses every day", () => {
  for (const cmd of [
    "git status",
    "git pull",
    "git pull --ff-only",
    "git add jobs/tracker.json jobs/tracker.md notes/changes/main.md",
    "git add -A",
    'git commit -m "Job search: 3 roles shortlisted"',
    "git push",
    "git push -u origin claude/some-branch",
    "git push origin HEAD:main",
    "git log --oneline -5",
    "git diff --stat",
    "git checkout main",
    "git checkout -b restructure-agents",
    "git switch -c new-branch",
    "git restore --staged jobs/tracker.json",
    "git branch --set-upstream-to=origin/main",
    "git stash",
    "git stash pop",
    "git clean -n",
    "git -C /repo status && git -C /repo push",
    "python3 shared/tools/tracker.py inbox list",
  ]) assert.equal(riskyGit(cmd), null, cmd);
});

test("blocks commands that rewrite or throw away history", () => {
  for (const cmd of [
    "git push --force",
    "git push -f origin main",
    "git push origin main --force-with-lease",
    "git push -fu origin main",
    "git push origin +main",
    "git push origin :old-branch",
    "git push --delete origin old-branch",
    "git push --mirror",
    "git reset --hard origin/main",
    "git clean -fd",
    "git clean -f",
    "git branch -D old",
    "git branch --delete old",
    "git checkout -- .",
    "git checkout .",
    "git checkout -f main",
    "git switch --discard-changes main",
    "git restore jobs/tracker.json",
    "git restore --staged --worktree jobs/tracker.json",
    "git stash drop",
    "git stash clear",
    "git commit --amend --no-edit",
    "git rebase -i HEAD~3",
    "git filter-branch --tree-filter 'rm x' HEAD",
    "git add -f .env",
    "git add --force shared/job-search/.env",
    "git rm -r jobs/roles",
    "git -C /repo push --force",
    "git -c core.editor=true push -f",
    "cd /repo && git reset --hard",
    "git status; git push --force",
    "/usr/bin/git push --force",
    '"C:\\Program Files\\Git\\cmd\\git.exe" push --force',
  ]) assert.notEqual(riskyGit(cmd), null, cmd);
});

test("ignores the words in commit messages, heredocs and comments", () => {
  assert.equal(riskyGit('git commit -m "Never use git push --force"'), null);
  assert.equal(riskyGit("git commit -F - <<'EOF'\nBlock git push --force and git reset --hard\nEOF\ngit push"), null);
  assert.equal(riskyGit('git commit -m "$(cat <<\'EOF\'\ngit reset --hard is blocked\nEOF\n)"'), null);
  assert.equal(riskyGit("# don't: git push --force\ngit push"), null);
  // ...but still checks what comes after the heredoc
  assert.notEqual(riskyGit("git commit -F - <<EOF\nmessage\nEOF\ngit push --force"), null);
});

function runHook(env: Record<string, string>, command: string) {
  const input = JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command } });
  return spawnSync(process.execPath, [GUARD], { input, env: { ...process.env, ...env }, encoding: "utf8" });
}

test("as a hook: refuses with exit code 2 only in automatic runs", () => {
  const blocked = runHook({ OFFICE_AUTO_RUN: "1" }, "git push --force");
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /Blocked in Cass's automatic run/);

  assert.equal(runHook({ OFFICE_AUTO_RUN: "1" }, "git push").status, 0);
  assert.equal(runHook({ OFFICE_AUTO_RUN: "" }, "git push --force").status, 0); // Hal's own sessions
});
