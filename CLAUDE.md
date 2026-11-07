# Agent Office

This repo is Tim's agent office: a home for Claude Code agents, their instructions and shared setup.

GitHub (github.com/Pha1lbot/agent-office, private) is the master copy and the backup. Work that has not been pushed to GitHub is not backed up.

## Layout

agents/ holds one folder per agent, each with its own instructions.

shared/ holds prompts, tools and conventions used by more than one agent.

The job-search team is Hal (Chief of Staff), Rita (Lead Recruiter), Wren (Writer), Cole (Interview Coach) and Ada (Admin, automation only). Their plan, including the token-saving rules, is in notes/plans/agent-office-v2.md.

jobs/ holds the job-search team's working data: the role tracker, the daily priority list and one folder per role with its advert summary, CV and cover letter.

.github/ holds the pull request template, which every PR description follows.

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

3. Pull again before starting each new piece of work, not only at the start of the session, and always before making a branch. `main` moves during the day (the office's backups, Hal's automatic runs, other PCs), so a long session can otherwise build on an old copy. On `main`, run `git pull`. On a branch, run `git fetch origin main` and make any new branch from `origin/main`.
4. Commit after each meaningful piece of work (a new agent, an updated instruction file, a finished fix), not just at the end. Small, frequent commits are the backup.
5. Write commit messages that say what changed in plain English, e.g. "Add research agent instructions".
6. Push after every commit with `git push`. Do not batch up commits locally.

### Before finishing

7. Make sure `git status` shows nothing left to commit and the branch is not ahead of origin. Then tell Tim the work is pushed.
8. If a push fails, never leave it. Run `git pull`, resolve any conflicts (ask Tim if it is unclear which version to keep), then push again.

### Never

- Never use `git push --force`, `git reset --hard`, or anything else that rewrites or discards history, unless Tim explicitly asks.
- Never delete branches, files or folders in bulk without asking Tim first.
- Never commit passwords, API keys, tokens or other secrets. Keep them in `.env` files, which are excluded by `.gitignore`. If a secret is committed by mistake, stop and tell Tim straight away. Deleting it in a later commit does not remove it from history.

### Edits made in the office

Tim edits roles in the Agent Office (`shared/office-view`). The office commits and pushes those changes to the `jobs/` folder itself (the tracker, plus files it makes such as PDFs), with messages starting "Office:". These commits don't get a notes entry: the tracker records each change, with its date and who made it, in the role's history. Every other commit still needs its notes entry.

### Bigger or risky changes

For large restructures, or anything Tim may want to review first, work on a new branch made from an up-to-date `main` (e.g. `restructure-agents`), push the branch, and open a pull request instead of committing straight to `main`. Fill in the pull request template (`.github/pull_request_template.md`). On Tim's PC, make the branch in a separate folder (see below), never by switching the main folder's branch.

### Tim's PC stays on `main`

The `agent-office` folder on Tim's PC always stays on `main`. Its automatic pulls only update the branch it is on, and the office's backups and Hal's automatic runs commit to whatever branch that folder has checked out. If it were switched to another branch, Tim's office edits would be saved to that branch instead of `main`.

So when branch work is needed on Tim's PC, do it in a separate linked folder (a git worktree) beside the main one:

```
git fetch origin main
git worktree add ../agent-office-work -b <branch> origin/main
```

Open Claude Code in `agent-office-work`, then work, commit and push there (`git push -u origin <branch>`) and open the pull request. The main folder, the office and the automatic pulls carry on as normal. Once the pull request is merged or dropped, and `git status` in the work folder shows nothing to commit, remove it from the main folder with `git worktree remove ../agent-office-work`. Git refuses if anything there is unsaved; never force it. Only one work folder at a time: finish or remove the old one first.

Cloud sessions can work on their own branches directly.

### After a merge

Whenever Claude merges a pull request, or Tim says one has been merged:

1. Run `git status`. If there are uncommitted changes, tell Tim and ask what to do with them before going on.
2. Run `git checkout main`, then `git pull`, so this copy has the merged work. If the work was done in a separate work folder on Tim's PC, remove it as described in "Tim's PC stays on `main`".
3. Add the one-line `CHANGELOG.md` entry for the merged branch (see "Change notes" below), then commit and push it.
4. Delete the merged branch on GitHub (the "Delete branch" button on the pull request, or `git push origin --delete <branch>`). Tim agreed on 2026-11-07 that merged branches can go: the branch's notes file and the pull request keep the record. Only delete a branch that is fully merged, with nothing newer on it.
5. Check `git status` shows `main` up to date with origin, and tell Tim this copy is now up to date.

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
5. When a branch is opened as a pull request, put a summary of its notes in the PR description and link to the notes file, using the headings in `.github/pull_request_template.md`. If the PR was opened some other way (for example from the Claude Code app) with a different description, rewrite it to the template.
6. When a branch is merged into `main`, add a one-line summary to `CHANGELOG.md` at the repo root, linking to the branch's notes file. Keep the branch's notes file; it is the permanent record.
