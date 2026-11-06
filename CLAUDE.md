# Agent Office

This repo is Tim's agent office: a home for Claude Code agents, their instructions and shared setup.

GitHub (github.com/Pha1lbot/agent-office, private) is the master copy and the backup. Work that has not been pushed to GitHub is not backed up.

## Layout

agents/ holds one folder per agent, each with its own instructions.

shared/ holds prompts, tools and conventions used by more than one agent.

jobs/ holds the job-search team's working data: the role tracker, the daily priority list and one folder per role with its advert summary, CV and cover letter.

.claude/ holds what Claude Code loads directly: subagent prompts in .claude/agents/ and skills (such as /cos) in .claude/skills/. Each one is documented by a README in its agents/ folder.

## Working here

Keep each agent's purpose, inputs and outputs written down in its folder.

Ask before adding new agents or changing shared conventions.

## Backup routine (always follow)

Tim may work here from his PC, from Claude Code on his PC, and from Claude sessions in the cloud. Every copy must stay in sync with GitHub.

### At the start of every session

1. Run `git status`. If there are uncommitted changes left over from before, tell Tim what they are and ask whether to commit them before doing anything else.
2. Run `git pull` so you are working on the latest version. A start-up hook in `.claude/settings.json` already tries this; check its result, and if it failed, sort it out (ask Tim if unsure) before doing anything else.

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

### After a merge

Whenever Claude merges a pull request, or Tim says one has been merged:

1. Run `git status`. If there are uncommitted changes, tell Tim and ask what to do with them before going on.
2. Run `git checkout main`, then `git pull`, so this copy has the merged work.
3. Add the one-line `CHANGELOG.md` entry for the merged branch (see "Change notes" below), then commit and push it.
4. Check `git status` shows `main` up to date with origin, and tell Tim this copy is now up to date.

## Change notes (always follow)

Every branch, including `main`, has a detailed notes file at `notes/changes/<branch-name>.md`. Replace any `/` in the branch name with `-` (e.g. `feature/research-agent` becomes `notes/changes/feature-research-agent.md`). Anyone reading it, including a future Claude session with no memory of this one, should understand exactly what was done on that branch and why.

1. When you start work on a branch, create its notes file from `notes/changes/TEMPLATE.md` if it does not exist yet. Fill in the purpose section.
2. Add an entry to the notes file in the same commit as every change, before pushing. Never commit a change without its note.
3. Each entry is dated (YYYY-MM-DD, UK time) and covers:
   - **What changed:** the specific files and what was added, edited or removed in each.
   - **Why:** the reason or request behind it, including what Tim asked for.
   - **Decisions:** options considered and why this one was chosen.
   - **How to check it:** how to test or confirm it works.
   - **Open items:** anything unfinished, known issues, or follow-ups.
4. Add new entries at the top of the log so the latest is first. Never delete or rewrite old entries; if something was wrong, add a new entry that corrects it.
5. When a branch is opened as a pull request, put a summary of its notes in the PR description and link to the notes file.
6. When a branch is merged into `main`, add a one-line summary to `CHANGELOG.md` at the repo root, linking to the branch's notes file. Keep the branch's notes file; it is the permanent record.
