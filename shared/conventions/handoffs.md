# Handover rules

How the job-search agents pass work to each other. The aim is to use as few tokens as possible: every word passed between agents is read again by the next one.

## Pass paths, not contents

- Long things (adverts, CVs, cover letters) live in files. Agents pass the file path, never the text.
- The tracker is read with `python3 shared/tools/tracker.py list --summary` or `show <id>`, not by opening `tracker.json`.

## Asking a subagent to do something

Hal's (the Chief of Staff's) brief to a subagent is a few lines:

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
Blocked: <anything Tim or COS must decide, or "none">
```

No preamble, no repeating the brief, no pasting file contents.

## One line per role

When listing roles, use:

```
<role-id> | <title> @ <company> | <pay> | <location> | fit <1-5> | <reason, under 15 words>
```

## Team rules

- Only Admin changes the tracker, and only through `tracker.py`.
- No agent applies for jobs, sends emails or fills in forms. Tim does that.
- Senior Admin never invents experience, dates, qualifications or skills. It only uses what is in Tim's default CV.
- Nothing is spent on CVs until Tim has said which roles to go for.
