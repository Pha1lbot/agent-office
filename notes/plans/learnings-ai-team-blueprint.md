# Learnings from the "first AI team" blueprint prompt

**Date:** 2026-11-07
**Status:** Review only. Nothing here changes the team until Tim says which improvements to make.

## Where this came from

Tim shared a picture of a popular one-shot prompt ("claude + first ai team / one_shot_setup.xml", marked APPROVAL-GATED). It asks Claude to design a beginner's AI team in sections: role, goal, use case, team architecture, agent design, prompt design, workflow, tool stack, QA plan, rules, output (ending with a 7-day launch plan and "START HERE FIRST") and start (ask sharp questions first).

This note compares that checklist with the office as it is on `main` today (Hal, Rita, Wren, Cole and Ada) and lists what we can learn and improve.

## How the office measures up

| Blueprint asks for | The office today | Verdict |
|---|---|---|
| **One real, narrow use case** | Tim's job search, nothing else | Done |
| **3 to 5 agents, each owning one thing** | Hal (runs the day), Rita (find and score), Wren (CV and letter), Cole (interviews), plus Ada (scripts, no AI) | Done |
| **Input and output formats** | `shared/conventions/handoffs.md`: a 4-line brief and a 4-line reply, one line per role | Done, tighter than the blueprint |
| **Decision rules** | Rita has clear Apply / Maybe / Skip rules. Hal's rules for conflicts are improvised (see NetEase below) | Partly |
| **Success criteria per agent** | Not written down. Some limits exist (Wren: two pages; Cole: 5 to 7 points) but no "done means" list | Gap |
| **When to escalate to the human** | Spread across Hal's skill, each agent's Rules and CLAUDE.md. No single list | Partly |
| **Workflow, review points, feedback loops** | Pipeline stages in `notes/plans/agent-office-v2.md`; Tim gates at pick, approve and apply; preference reviews learn from his picks and skips | Done |
| **Lean tool stack** | Git (backup), `tracker.py` (the database), the office (task board and visibility), Word and PDF tools | Done |
| **QA plan: checkpoints, failure modes, tests before launch, is it helping?** | Unit tests cover the office's code, not the agents. Nothing checks Wren's facts, tests a prompt change, or measures results | Biggest gap |
| **Ask before publishing, sending, deleting, spending, irreversible changes** | "Never apply, email or submit" is clear. But unattended Hal runs may use any `git` command, including the force-push and hard reset CLAUDE.md forbids | Written, not enforced |
| **Never ask for secrets in chat** | Keys live in `.env`, git-ignored | Done |
| **Evidence before major decisions** | On 2026-11-06, verdicts on 37 roles were mostly made from title, company and pay, because LinkedIn blocked the cloud session. They rank alongside verdicts made from a full read | Gap |
| **Start by asking sharp questions** | `preferences.md` still has three *(assumed)* answers: 3 office days, a 1-hour commute, contract considered | Gap |
| **7-day launch plan, "START HERE FIRST"** | The team launched in a day. The README's "Each day" section is the nearest thing to a start-here | Partly |

## What the office already does better (keep doing)

The blueprint is generic and misses things the office learnt the hard way:

- **Cost.** The blueprint never mentions it. The office measured about 15k tokens per subagent hand-off and built around it: scripts first, one hand-off per specialist per run, paths not text, the CV as a text bank instead of a PDF.
- **Memory and backup.** The blueprint has no plan for where work lives between sessions. Here every role is a folder, every change is a commit, and every branch has notes.
- **Unattended runs with guardrails.** At most 8 automatic runs a day, a token budget, and "don't ask questions, add actions" when Tim isn't there.
- **Learning from Tim.** Preference reviews suggest changes only with 3 or more decisions behind them, and Tim approves each one.
- **One front door.** Tim only talks to Hal, and specialists never talk to each other. That is cleaner than the blueprint's agents passing work around.
- **Seeing the team work.** The office view is oversight the blueprint doesn't have.

**One thing not to copy:** the blueprint runs everything on the top model. The office's own measurements say Sonnet plus scripts is the right default. The one place a stronger model might pay is Wren's final drafts (what employers actually read, "must not sound AI-written", at most 3 a day), and only as a measured trial: does Tim ask for fewer changes?

## What we can learn: the gaps, with evidence

1. **Rules that are written but not enforced.** CLAUDE.md says never force-push or hard reset. Unattended Hal runs (`shared/office-view/src/auto-cos.ts`) are given `Bash(git:*)`, which allows both. The blueprint's "approval-gated" idea means the tools should make the risky thing impossible, not just discouraged.
2. **No check on the most important rule.** "Never invent experience" relies on Wren's prompt alone. A rough check on 2026-11-07 compared every figure in the 4 CVs and 2 cover letters with `cv-bank.md`: all clean (one false alarm, "more than 2,000" against "2,000+"). That is good news, and a free script could confirm it on every draft.
3. **Guesses rank like facts.** A verdict from a full advert read and a verdict from a job title look the same on the board.
4. **Conflicts take several rounds.** NetEase: Rita said Skip, Tim set the role to Drafted three times, and Hal held off, asked, then drafted anyway. A simple rule ("flag once, then follow Tim") would have settled it in one round.
5. **Three agents work out the same gaps.** Rita writes Gaps in `listing.md`, Wren writes them again in `notes.md`, Cole again in `interview-prep.md`. The plan's own rule is "reuse, don't redo".
6. **Nobody measures whether the team helps.** `tracker.py insights` serves preference reviews, not results. Today's figures already hint at a problem: roles Tim picked average fit 2.7, roles he skipped 2.5, so the fit score barely separates them (though 10 of the 13 picks came from his old dashboard, not Rita).
7. **Old names left behind.** Agents still read "Senior Admin follows these" in `cv-rules.md`. Also in `shared/job-search/cv/README.md`, `jobs/README.md` ("the Admin agent does this") and `preferences.md` ("Lead Recruiter and Chief of Staff").

## Suggested improvements, best value first

| # | Improvement | Tokens | Effort | Needs Tim's OK? |
|---|---|---|---|---|
| 1 | **Fix old names** in `cv-rules.md`, `cv/README.md`, `jobs/README.md` and `preferences.md` (Senior Admin → Wren, Admin agent → Hal with `tracker.py`, and so on) | 0 | 10 min | No, it's a correction |
| 2 | **Block risky commands in unattended runs.** Add a disallowed list to `auto-cos.ts`: force push, hard reset, `git clean`, deleting branches | 0 | Small, with a test | Yes (automation) |
| 3 | **Fact-check script (Ada).** After Wren writes, compare figures, employers, dates and qualifications in `cv.md` and `cover-letter.md` with `cv-bank.md` (and `extra-*.md`). Anything not found goes into `notes.md` and shows on the role page | 0 | Small | Yes |
| 4 | **Evidence level on verdicts.** Rita marks each verdict "read advert" or "details only"; the board shows it; details-only verdicts rank below read ones; Hal offers full reads of the top ones when on Tim's PC | ~0 | Small | Yes |
| 5 | **"Done means" for each agent.** 3 to 5 checkable lines at the end of each prompt (below). Wren and Cole start from Rita's Gaps and only add to them | ~100 per prompt | Small | Yes (prompts) |
| 6 | **One "ask Tim first" list** in `handoffs.md`: apply, send, publish, delete, spend money, anything that can't be undone. Plus the conflict rule: when Tim's action goes against a Skip, add one action saying why, then follow Tim | ~50 | Small | Yes (shared convention) |
| 7 | **Team scorecard.** Add to `tracker.py insights`: share of Rita's Apply verdicts Tim picks, drafts approved without changes, applied → interview rate, days from found to applied, tokens per drafted application (from the token meter). Hal shows it weekly in three lines | 0 to run | Medium | Yes |
| 8 | **A small test set.** Keep two frozen sample roles (a strong fit and one with a big gap). After any change to Rita's, Wren's or Cole's prompt, run them once and compare with the last good output | ~50k per check, only after prompt changes | Small | Yes |
| 9 | **Confirm the assumed preferences.** Hal asks the three *(assumed)* questions once, at the next "start the day" | ~0 | Tiny | Yes |
| 10 | **"Start here" box** at the top of the README: the five things Tim does each day, in five lines | 0 | Tiny | No |

### Draft "done means" lines (for #5)

- **Rita:** every kept role has a link, pay (or "pay not stated"), a closing date if given, a verdict with For and Against, and its evidence level; no duplicates of tracked roles; each listing under 40 lines.
- **Wren:** at most two pages; every fact is in the CV bank; the advert's keywords are used where they are true; anything missing is a question in `notes.md`; the Word files are built; Tim's rules in `cv-rules.md` are met.
- **Cole:** 5 to 7 talking points, each tied to a real CV-bank example; prep under two pages; Tim's talking points and "Tim's notes" untouched.

## A 7-day "prove it" week

The blueprint ends with a 7-day launch plan. The office is already launched, so the useful version is one real week on Tim's PC that shows whether the team helps:

1. **Day 1:** improvements 1, 2, 3 and 9 (no tokens). Tim checks `cv-bank.md` (still an open item).
2. **Day 2:** Tim gets the free Reed and Adzuna keys; phase 3 (`job-scout`) goes in.
3. **Day 3:** "start the day" on the PC. Rita reads full adverts for the top picks. Note the token meter against the 40k target.
4. **Day 4:** Tim shortlists up to 3; Wren drafts; the fact-check runs; note how many changes Tim asks for.
5. **Day 5:** Tim approves and applies; Ada sets follow-ups.
6. **Day 6:** Cole preps any interviews; Tim edits the talking points.
7. **Day 7:** scorecard and preference review. Decide one or two changes for next week, not more.

## Start here

If Tim only does one thing: say which of improvements 1 to 10 to make. Numbers 1 to 3 cost no tokens and close the gaps that matter most (wrong names in what agents read, risky commands in unattended runs, and no check on invented facts).
