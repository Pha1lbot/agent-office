# Agent Office

This repo is Tim's agent office: a home for Claude Code agents, their instructions and shared setup.

GitHub (github.com/Pha1lbot/agent-office, private) is the master copy and the backup. Work that has not been pushed to GitHub is not backed up.

## Layout

agents/ holds one folder per agent, each with its own instructions.

shared/ holds prompts, tools and conventions used by more than one agent.

## Working here

Keep each agent's purpose, inputs and outputs written down in its folder.

Ask before adding new agents or changing shared conventions.

## Backup routine (always follow)

Tim may work here from his PC, from Claude Code on his PC, and from Claude sessions in the cloud. Every copy must stay in sync with GitHub.

### At the start of every session

1. Run `git status`. If there are uncommitted changes left over from before, tell Tim what they are and ask whether to commit them before doing anything else.
2. Run `git pull` so you are working on the latest version.

### While working

3. Commit after each meaningful piece of work (a new agent, an updated instruction file, a finished fix), not just at the end. Small, frequent commits are the backup.
4. Write commit messages that say what changed in plain English, e.g. "Add research agent instructions".
5. Push after every commit with `git push`. Do not batch up commits locally.

### Before finishing

6. Make sure `git status` shows nothing left to commit and the branch is not ahead of origin. Then tell Tim the work is pushed.
7. If a push fails, never leave it. Run `git pull`, resolve any conflicts (ask Tim if it is unclear which version to keep), then push again.

### Never

- Never use `git push --force`, `git reset --hard`, or anything else that rewrites or discards history, unless Tim explicitly asks.
- Never delete branches, files or folders in bulk without asking Tim first.
- Never commit passwords, API keys, tokens or other secrets. Keep them in `.env` files, which are excluded by `.gitignore`. If a secret is committed by mistake, stop and tell Tim straight away. Deleting it in a later commit does not remove it from history.

### Bigger or risky changes

For large restructures, or anything Tim may want to review first, work on a new branch (e.g. `git checkout -b restructure-agents`), push the branch, and open a pull request instead of committing straight to `main`.
