# Branch: claude/compassionate-ptolemy-vc0jj2

**Started:** 2026-11-07
**Status:** In progress

## Purpose

Tim shared a picture of a popular "build your first AI team" one-shot prompt and asked what the agent office can learn from it and what to improve. This branch holds that review. It changes no agent, prompt or convention until Tim picks which improvements to make.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-07: Improvement 3: Ada fact-checks every draft against the CV bank

**What changed**
- `shared/tools/fact_check.py`: new, standard library only, no tokens. Compares a role's `cv.md` and `cover-letter.md` with `cv-bank.md` and any `extra-*.md`:
  - figures, including money and percentages, so "more than 2,000" matches "2,000+", "€12 million" matches "€12m", and a swapped currency is caught ("£12m": the bank has "€12m")
  - job titles, employers, places and dates in job headings, part by part, so a different layout passes but a changed title, employer or date doesn't
  - certifications, with their year
  - well-known qualifications (degree, PRINCE2, CIPD, NEBOSH...)
  - email addresses

  Anything not found goes into a "## Fact check (Ada)" section at the end of the role's `notes.md`. A figure that is also in `listing.md` is marked as probably about the employer. The section is replaced on each run and removed once clean, and Wren's own notes are kept. It never changes the CV or letter. `--all` checks every drafted role.
- `shared/tools/test_fact_check.py`: new, 10 tests (`python3 shared/tools/test_fact_check.py`).
- `shared/tools/make_docs.py`: runs the fact check before building the Word files. A failure in the check never stops the Word files.
- `.claude/agents/writer.md` (Wren): step 4 says what the fact check does: fix her own mistakes, leave figures quoted from the advert, mention any flags left.
- `.claude/skills/cos/SKILL.md` (Hal): tells Tim about fact-check flags with the drafts, and reminds him in one line before making PDFs if flags remain.
- `shared/conventions/handoffs.md`, `agents/admin/README.md`, `agents/writer/README.md`, `README.md`: describe the check.
- `shared/office-view/public/role.js`: the notes panel heading is now "Notes: Wren's questions and Ada's fact check".
- `notes/plans/learnings-ai-team-blueprint.md`: status says 1 to 3 are done.

**Why**
Improvement 3 of `notes/plans/learnings-ai-team-blueprint.md`, approved by Tim. "Never invent experience" was the team's most important rule and was only enforced by Wren's prompt.

**Decisions**
- A script (Ada), not another agent pass: no tokens, and it runs every time without anyone remembering to ask.
- It reports and never blocks: some flags are fine (a figure about the employer), and Tim decides.
- Headings are checked part by part, not as whole lines. A first version matched whole headings and raised 5 false flags each on the Chelsea and Hexagon CVs, which came from Tim's old dashboard in a different layout ("BLAST · Jan 2020 – Oct 2026"). Long bold lines are treated as prose, not headings.
- "BA", "MA" and plain "degree" are left out of the qualification list: they'd flag British Airways and "a high degree of".
- Ran it on every drafted role. NetEase and Vitality pass. Chelsea and Hexagon each have one flag: "Mole Valley District Council" (the employer in the Dorking Halls heading) isn't in the CV bank. Both are already applied for, so their `notes.md` files were left unchanged.

**How to check it**
- `python3 shared/tools/test_fact_check.py` (10 tests pass).
- `python3 shared/tools/fact_check.py --all` lists the two Mole Valley flags (and writes them to those roles' notes).
- Done on 2026-11-07: a copy of the Vitality role with "3,000+ freelancers and £12m+" built with `JOBS_DIR=<copy> make_docs.py`. Both were flagged in the output and in `notes.md`, and the Word files were still made.

**Open items**
- Tim: if it's right, add "Mole Valley District Council" to `cv-bank.md` so these flags clear.
- The Chelsea and Hexagon CVs also contain other material that isn't in the CV bank and that the check can't see, because it is prose: monthly budget meetings, the Airtable and HTML booking system, growing from one title to six, touring from 2011 to 2012. It is probably true, as it came from Tim's own CV. If so, an `extra-*.md` file would let Wren use it for other roles.
- The check can't tell whether a reworded sentence is true. That's still Wren's rule and Tim's read.

### 2026-11-07: Improvement 2: automatic runs can't rewrite or throw away git history

**What changed**
- `shared/office-view/hooks/guard.mjs`: new Claude Code hook. Before each Bash command in an automatic run, it reads the command and refuses git commands that rewrite or throw away history: force or delete pushes (including `+` and `:` refspecs), `reset --hard`, `clean` (unless a dry run), deleting or overwriting branches, `checkout`/`switch`/`restore` that discard changes, `stash drop`/`clear`, `commit --amend`, `rebase`, `filter-branch`, and `add --force` (which could commit a git-ignored `.env`). Claude is told why and to add an action for Tim instead. It ignores commit messages, heredoc bodies and comments, and understands `git -C <path>` and full paths to git, including Windows ones.
- `.claude/settings.json`: runs the guard before every Bash command (`PreToolUse`, matcher `Bash`).
- `shared/office-view/src/auto-cos.ts`: Hal's automatic runs start with `OFFICE_AUTO_RUN=1`, which switches the guard on. Subagents in that run inherit it.
- `shared/office-view/test/guard.test.ts`: new. Everyday commands pass, 33 risky forms are refused, words in messages, heredocs and comments are ignored, and the hook exits with code 2 only when `OFFICE_AUTO_RUN=1`.
- `shared/office-view/README.md`: says what automatic runs can't do, and why.

**Why**
Improvement 2 of `notes/plans/learnings-ai-team-blueprint.md`, approved by Tim. Automatic runs were allowed every git command (`Bash(git:*)`), so CLAUDE.md's "never force-push or hard reset" rule was only a request.

**Decisions**
- A hook rather than `--disallowedTools` patterns: permission patterns match on text prefixes and are easy to get round by reordering flags (`git push origin main -f`). The hook reads the command properly and has unit tests.
- On only in automatic runs: CLAUDE.md allows these commands when Tim asks, so his own sessions are untouched. Outside automatic runs the hook exits straight away.
- It doesn't try to catch git run from inside Python or another shell. It stops mistakes, not someone set on getting round it. Automatic runs can't run `bash` or `rm` anyway (not in their allowed tools).

**How to check it**
- `cd shared/office-view && npm test` (30 tests pass) and `npm run check` (no type errors).
- End to end, done on 2026-11-07: in a throwaway repo with these settings and a local remote, `OFFICE_AUTO_RUN=1 claude -p ... --allowedTools "Bash(git:*)"` was told to run `git push --force origin main` over a rewritten commit. The hook refused it, Claude reported the reason, and the remote kept the original commit.

**Open items**
None.

### 2026-11-07: Improvement 1: old team names corrected

**What changed**
- `shared/job-search/cv-rules.md`: "Senior Admin follows these" is now "Wren (the Writer) follows these". Wren reads this file for every draft.
- `shared/job-search/cv/README.md`: says Wren works from `cv-bank.md`, never the PDF (it said Senior Admin reads the PDF); extra material is for Wren and Cole.
- `shared/job-search/preferences.md`: the two intro lines name Rita and Hal. Tim's preferences themselves are unchanged.
- `jobs/README.md`: Hal and the office change the tracker (not "the Admin agent"); Rita, Wren and Ada named; the role folder list now includes `advert.txt`, `talking-points.md`, `interview-prep.md` and `attachments/`, which were missing.
- `shared/tools/tracker.py`: docstring says only Hal and the office change the tracker.
- `shared/office-view/public/contracts.js`: Hal's novelty contract names Rita, Wren and Cole as his team, with Ada as automation (it still listed the Senior Admin and the Admin).

**Why**
Tim approved improvements 1 to 3 from `notes/plans/learnings-ai-team-blueprint.md`. These files still used names from before the team was renamed on 2026-11-06, and two of them are read by agents.

**Decisions**
Left history alone: `CHANGELOG.md` and older notes keep the old names, because they describe what was true then. `agents/writer/README.md` keeps "Formerly Senior Admin" on purpose.

**How to check it**
`grep -rn -i "senior admin" --exclude-dir=notes .` finds only the CHANGELOG, the writer README's "Formerly" line and the old mockup.

**Open items**
None.

### 2026-11-07: Review of the office against the "first AI team" blueprint prompt

**What changed**
- `notes/plans/learnings-ai-team-blueprint.md`: new. Compares each section of the blueprint prompt with the office as it is on `main`, lists what the office already does better, seven gaps with evidence, ten ranked improvements (tokens, effort, whether Tim's OK is needed), draft "done means" lines for Rita, Wren and Cole, and a 7-day "prove it" week.
- `notes/changes/claude-compassionate-ptolemy-vc0jj2.md`: this notes file.

**Why**
Tim asked: "Read the image and take the learnings into our agent-office. What can we learn? What can we improve?"

**Decisions**
- Wrote a review instead of changing prompts straight away: CLAUDE.md says to ask before changing shared conventions, and most improvements touch Hal's skill, the agents' prompts or `handoffs.md`.
- Checked claims against the repo before writing them down:
  - `auto-cos.ts` gives unattended runs `Bash(git:*)`, which allows force-push and hard reset.
  - A rough script compared every figure in the 4 drafted CVs and 2 cover letters with `cv-bank.md`: all clean (one false alarm).
  - `tracker.py insights`: picked roles average fit 2.7, skipped roles 2.5.
  - Old names ("Senior Admin", "the Admin agent") are still in `cv-rules.md`, `shared/job-search/cv/README.md`, `jobs/README.md` and `preferences.md`.
- Advised against copying the blueprint's "top model for everything": the office's own token measurements favour Sonnet plus scripts. A stronger model for Wren's final drafts is offered only as a measured trial.

**How to check it**
Read `notes/plans/learnings-ai-team-blueprint.md`. Each gap names the file or figure it rests on, so it can be checked directly.

**Open items**
- Tim to say which of improvements 1 to 10 to make. 1 to 3 cost no tokens.
- Session start: the start-up `git pull` failed because this cloud branch had no upstream yet. It was already level with `main` (same commit), so nothing was missing.
