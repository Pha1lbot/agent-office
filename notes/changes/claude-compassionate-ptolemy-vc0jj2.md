# Branch: claude/compassionate-ptolemy-vc0jj2

**Started:** 2026-11-07
**Status:** In progress (review of 2026-11-11: fixes, search, learning loop). Earlier work merged in PRs #18, #19 and #20.

## Purpose

Tim shared a picture of a popular "build your first AI team" one-shot prompt and asked what the agent office can learn from it and what to improve. This branch holds that review. It changes no agent, prompt or convention until Tim picks which improvements to make.

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-11: The office says what the team is doing in plain English

**What changed**
- `Tim's Job Search/shared/office-view/src/plain.ts`: new. Turns a tool call and its target into a short phrase, such as "checking roles", "updating the role list", "searching job sites", "reading an advert online", "writing a cover letter", "making PDFs", "saving to GitHub", "checking job alert emails". It reads file paths and also the plain-English descriptions Claude gives its commands.
- `src/office.ts`: every status is now a sentence with the person's name: "Hal is checking roles", "Rita is looking for roles", "Hal is waiting for Rita", "Hal is waiting for you", "Rita needs your OK", "Wren is dozing", "Ada is making PDFs: Chelsea". Each agent keeps the technical text in a new `raw` field. The activity list now shows the same plain phrases.
- `public/office.js`: the desk card shows the plain sentence and the technical text on hover; the side panel no longer repeats the state. `public/dashboard.js`: the "waiting on you" list uses the new sentences. `public/style.css`: card text wraps to two lines instead of being cut off.
- `test/office.test.ts` updated; new `test/plain.test.ts` (23 wording cases).
- The same changes in `Hal's Job Search/` (see `main-hals-job-search.md`).

**Why**
Tim asked on 2026-11-11 for the office to show what staff are doing more simply, "e.g. Hal is checking roles", instead of commands and file paths.

**Decisions**
- A separate small file for the wording, so it can be extended and tested without touching the office logic. It is identical in both offices; only the Chief of Staff's name differs, and that comes from the team list.
- The raw text is kept and shown on hover, so nothing is lost for finding problems.
- Anything the wording doesn't recognise says "running a task" or "working", never a guess.

**How to check it**
- `npm test` and `npm run check` in each office's `shared/office-view`: 40 tests pass, no type errors.
- Ran a copy of the office outside git with the demo agents (`npm run fake`) and took screenshots: desks read "Hal is updating the role list" with "Bash Add 8 new roles to the tracker" on hover.

**Open items**
- New phrases are added in `plain.ts` as new kinds of work appear. Ada's wording comes from the office's own labels in `server.ts`.

### 2026-11-11: Missing CHANGELOG lines, and the line now travels with the pull request

**What changed**
- `CHANGELOG.md`: lines added for #24 (the CHANGELOG line for #23), #25 (the two offices; wording taken from commit 1d38a36, which was stranded on the unmerged branch `claude/adoring-maxwell-qzaklb`) and #27 (automatic runs start in the office folder).
- `CLAUDE.md`: change-notes step 6 now says to add the CHANGELOG line to the pull request as soon as it has a number. "After a merge" step 3 becomes a check that the line arrived, adding it only if it is missing.
- `.github/pull_request_template.md`: a new "Before merging" tick box for the CHANGELOG line; the "After merging" box becomes a check.

**Why**
Part of the fixes Tim approved on 2026-11-11. Lines have now been missed for six pull requests (#15 to #17, #24, #25, #27). The step came after the merge, when the session had often ended or the branch was gone.

**Decisions**
Moving the step before the merge removes it, where a reminder would only repeat one that already failed. PR #20 showed that a pull request can carry its own line.

**How to check it**
`CHANGELOG.md` lists #1 to #27 with none missing.

**Open items**
- Tim: the branch `claude/adoring-maxwell-qzaklb` on GitHub now holds nothing that isn't on `main` or in this branch. It can be deleted once this pull request is merged (cloud sessions can't delete branches).

### 2026-11-11: Every applied role gets a follow-up date

**What changed**
- `Tim's Job Search/shared/tools/tracker.py` (`cmd_set`): when a role becomes applied without `next=` in the same call, the next step is always set to "Follow up if no reply by <7 days on>". A next step written before applying (unless it was an "Apply ..." note) is kept in the role's notes as "Before applying: ...".
- `Tim's Job Search/shared/tools/test_tracker.py`: two new tests for this.
- `Hal's Job Search/shared/tools/tracker.py` and `test_tracker.py`: the same change (see `main-hals-job-search.md`).
- `Tim's Job Search/jobs/tracker.json` and `tracker.md`: follow-up dates set on the four applied roles that had none: Razer 12 Nov, Hexagon and Chelsea 13 Nov, British Airways 18 Nov (each applied date plus 7 days). BA's old next step is kept in its notes.

**Why**
First fix from the review Tim approved on 2026-11-11 (plan: fixes, then search, then the learning loop). 4 of his 5 applied roles had no follow-up date, so the office never showed them as due. The old rule only wrote one when the next step was empty or began with "apply".

**Decisions**
- Kept the follow-up as the sentence the office already reads (`overdue()` in `public/util.js`), not a new date field: a three-line change with no page changes.
- The old next step goes to notes, not the bin, in case it still matters.

**How to check it**
- `python3 shared/tools/test_tracker.py` in each office: 9 tests pass.
- `python3 shared/tools/tracker.py list --status applied` in Tim's office: all five show "Follow up if no reply by ...".

**Open items**
The rest of PR 1: missing CHANGELOG lines, the CHANGELOG rule, and plainer staff messages in the office.

### 2026-11-07: PR #20 for the CHANGELOG lines

**What changed**
- `CHANGELOG.md`: a line for #20 itself, above the #19 line added in the entry below.
- This notes file: status is "In review" with PR #20.

**Why**
Tim asked to close off #19's CHANGELOG line tonight, before moving on to something else. That replaces the plan in the entry below to wait for the next PR.

**Decisions**
PR #20 records its own merge in its own CHANGELOG line, added once GitHub had given it a number. Without that, every bookkeeping PR would need another one after it. The line reaches `main` at the moment of the merge it describes, so the CHANGELOG stays accurate.

**How to check it**
`CHANGELOG.md` starts with #20, then #19, then #18.

**Open items**
None once #20 is merged and its branch deleted.

### 2026-11-07: After the merge of PR #19

**What changed**
- `CHANGELOG.md`: the line for #19.
- This notes file: status is "Merged".
- The branch was restarted from `main` (all its commits were already merged).

**Why**
CLAUDE.md's "After a merge" step. Tim merged PR #19 and said it was all done.

**Decisions**
As for #18, the CHANGELOG line goes on the branch and reaches `main` with the next pull request. That avoids a PR just for one line, whose own merge would need another line.

**How to check it**
- `git ls-remote --heads origin` lists only `main`: Tim has deleted all seven merged branches, closing the open item below.
- `CHANGELOG.md` has #19 at the top.

**Open items**
- This commit needs a pull request to reach `main`. It can go with the next piece of work.

### 2026-11-07: Pull request #19 opened

**What changed**
- This notes file: status is "In review", linking to [PR #19](https://github.com/Pha1lbot/agent-office/pull/19). The PR covers the CHANGELOG lines, the git-routine changes, the PR template and the branch-deletion note. Its description uses the new template.

**Why**
Tim asked for one PR with these changes.

**Decisions**
None.

**How to check it**
Open PR #19.

**Open items**
After merging: the CHANGELOG line for #19, and Tim deletes the six merged branches (see the entry below).

### 2026-11-07: Merged branches: deletion refused from the cloud session

**What changed**
- `CLAUDE.md`, "After a merge" step 4: cloud sessions can't delete branches, so Tim deletes them with the PR's button, or turns on GitHub's "Automatically delete head branches".
- No branches were deleted.

**Why**
Tim gave permission to delete the merged branches (learning 4). Six were checked first: each fully merged into `main` (`git merge-base --is-ancestor`) and none with an open PR:
- `claude/youthful-hopper-alwu7m` (607d770)
- `dashboard-v2` (ac28429)
- `import-dashboard` (dd84aa3)
- `office-editing` (c1a06d1)
- `office-view` (b53987c)
- `team-v2` (92c543c)

`git push origin --delete` was refused with HTTP 403: this session's GitHub access only allows pushing to its own branch. Per the session's rules, a refusal like this is reported, not retried another way. The seventh branch, `claude/compassionate-ptolemy-vc0jj2`, now carries new work, so it stays until its PR is merged.

**Decisions**
Didn't look for another route (for example the GitHub API from the command line): the refusal is a deliberate limit of this session.

**How to check it**
`git ls-remote --heads origin` still lists the six branches.

**Open items**
- Tim: delete the six branches at https://github.com/Pha1lbot/agent-office/branches (the bin icon on each). Every commit on them is already in `main`.
- Tim (optional): turn on Settings, General, "Automatically delete head branches", so merged branches go by themselves from now on.

### 2026-11-07: Pull request template

**What changed**
- `.github/pull_request_template.md`: new. Sections match the notes file: Summary with the notes link, What changed, Why, Decisions, How it was tested ("Tested it" is not enough), and Open items. It ends with an "After merging" checklist: CHANGELOG line, delete the branch, remove the `agent-office-work` folder.
- `CLAUDE.md`: change-notes step 5 says to use the template, and to rewrite a PR description made some other way. The Layout section mentions `.github/`.

**Why**
Learning 3, approved by Tim. PR #18 was opened from the Claude Code app with a description that left out the notes link and the test evidence, and had to be rewritten by hand. Also, #15, #16 and #17 were merged without their CHANGELOG lines; the checklist puts that step on every PR page.

**Decisions**
- Followed the other project's "Test plan" section, renamed "How it was tested" to match our notes' "How to check it" style.
- The notes link is a full GitHub URL with placeholders, because relative links in PR descriptions don't reliably point at the branch.
- GitHub's website fills in the template. It isn't certain that the Claude Code app's PR button does, hence the CLAUDE.md line to rewrite such descriptions.

**How to check it**
Open a new PR on GitHub's website from any branch: the description box starts with these headings.

**Open items**
None.

### 2026-11-07: Git routine: branch work in a separate folder on Tim's PC; pull before each piece of work

**What changed**
- `CLAUDE.md`:
  - "While working" has a new step 3: pull again before each new piece of work and before making a branch, not only at session start. On a branch, branch from `origin/main`. The later steps are renumbered 4 to 8.
  - "Tim's PC stays on `main`" is rewritten. Branch work on Tim's PC happens in a separate linked folder (`git worktree add ../agent-office-work -b <branch> origin/main`). The main folder never changes branch. The work folder is removed once the PR is merged or dropped, and never forced.
  - "Bigger or risky changes" says to branch from an up-to-date `main`, fill in the PR template, and use the work folder on Tim's PC.
  - "After a merge" removes the work folder, and has a new step 4: delete the merged branch on GitHub, as Tim agreed today. Only fully merged branches.
- `README.md`: one sentence telling Tim about the `agent-office-work` folder.

**Why**
Tim approved learnings 1, 2 and 4 from another project's CLAUDE.md (BLAST Esports Ops Workshop), which has two people's agents in one repo:
- Learning 1 matters more here than there. `shared/office-view/src/backup.ts` commits and pushes Tim's office edits on whatever branch the folder has checked out. The old rule ("switch back to `main` before finishing") left a window where office edits and Hal's automatic runs went to the feature branch.
- Learning 2: `main` takes office backups 15 seconds after each edit, Hal's automatic runs, and pushes from both laptops.

**Decisions**
- Kept "commit small changes straight to `main`" rather than copying the other project's "every change through a PR". The office backs up job data to `main` all day, so PRs for everything would be absurd.
- Did not copy its fix for a drifted `main` (`git reset --hard origin/main`). It conflicts with "Never" above, and `sync.ps1` already merges safely or stops.
- One fixed work-folder name (`agent-office-work`), beside the repo, not inside it. That keeps the instructions simple for one person, and the main folder never sees it as untracked files.
- Branch deletion is limited to fully merged branches with nothing newer on them.

**How to check it**
Tested on 2026-11-07 in a throwaway repo with a local remote:
- `worktree add` left the main folder on `main`, and the work folder pushed its own branch.
- `worktree remove` refused while the work folder had unsaved changes, and removed it once clean.

**Open items**
None.

### 2026-11-07: After the merge of PR #18: CHANGELOG lines

**What changed**
- `CHANGELOG.md`: lines for #18 (this branch), and for #15, #16 and #17 (from `claude/youthful-hopper-alwu7m`), which were merged without their lines.
- This notes file: status is now "Merged".
- The branch was restarted from `main` (all its commits were already merged), as cloud sessions do after a merge.

**Why**
CLAUDE.md's "After a merge" step. Tim merged PR #18 at 22:23 UK time.

**Decisions**
Earlier CHANGELOG lines reached `main` with the next pull request, not as direct pushes to `main`, so this follows the same route. These lines reach `main` with this branch's next PR.

**How to check it**
`CHANGELOG.md` lists #15 to #18 in date order above #14.

**Open items**
Needs a PR to reach `main`. It can go with the git-workflow changes Tim is deciding on.

### 2026-11-07: Pull request opened

**What changed**
- `notes/changes/claude-compassionate-ptolemy-vc0jj2.md`: status is now "In review", linking to [PR #18](https://github.com/Pha1lbot/agent-office/pull/18).
- PR #18's description, which was written automatically, was replaced with a summary of these notes and a link to this file, as CLAUDE.md asks.

**Why**
Tim opened PR #18 for this branch from the Claude Code app.

**Decisions**
The automatic description left out improvement 1, the test evidence and the notes link, so it was rewritten.

**How to check it**
Open PR #18 and check that the description links here.

**Open items**
After merging: the CHANGELOG line, and the open items from the fact-check entry below.

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
