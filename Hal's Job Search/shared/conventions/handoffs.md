# Handover rules

The team: **Cass** (Chief of Staff), **Rita** (Lead Recruiter), **Wren** (Writer), **Cole** (Interview Coach) and **Ada** (Admin, automation only).

How the job-search agents pass work to each other. The aim is to use as few tokens as possible: every word passed between agents is read again by the next one.

## Pass paths, not contents

- Long things (adverts, CVs, cover letters) live in files. Agents pass the file path, never the text.
- The tracker is read with `python3 shared/tools/tracker.py list --summary` or `show <id>`, not by opening `tracker.json`.

## Asking a subagent to do something

Cass's (the Chief of Staff's) brief to a subagent is a few lines:

```
Task: <one sentence>
Roles: <role ids, if any>
Limits: <e.g. up to 10 roles, UK only>
Return: <what to send back>
```

## Replying

Every subagent replies in this shape and nothing more:

```
Done: <one line>
Files: <paths written or changed>
Roles: <one line per role, if relevant>
Blocked: <anything Hal or COS must decide, or "none">
```

No preamble, no repeating the brief, no pasting file contents.

## One line per role

When listing roles, use:

```
<role-id> | <title> @ <company> | <pay> | <location> | fit <1-5> | <reason, under 15 words>
```

## Team rules

- Only Cass (and Hal, from the office) change the tracker, always through `tracker.py`. Subagents never do.
- No agent applies for jobs, sends emails or fills in forms. Hal does that.
- Wren and Cole never invent experience, dates, numbers, qualifications or skills. They only use what is in the CV text bank (`shared/job-search/cv/cv-bank.md`). Ada's fact check (`shared/tools/fact_check.py`) compares Wren's drafts with the bank each time the Word files are built, and lists anything it can't find in the role's `notes.md`.
- Nothing is spent on CVs until Hal has said which roles to go for.

## Why hand-offs are expensive

Starting a subagent costs about 15k tokens before it does any work (measured on 2026-11-06). So Cass makes one hand-off per specialist per run, does tracker work directly, and leaves rule-based work to scripts.
