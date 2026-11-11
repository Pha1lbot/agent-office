#!/usr/bin/env python3
"""Role tracker for the job-search team.

jobs/tracker.json holds one record per role. jobs/tracker.md is rebuilt from it
after every change so it can be read on GitHub. Only Tim (and the office, when
Hal edits roles) should run the commands that change the tracker (add, set).
Subagents never do.

Usage:
  python3 shared/tools/tracker.py add --title "Data Analyst" --company "Acme" \
      [--id <folder-name>] [--location ...] [--pay ...] [--url ...] [--source ...] [--fit 1-5] [--notes ...]
  python3 shared/tools/tracker.py set <id> status=shortlisted priority=1 notes="..."
  python3 shared/tools/tracker.py list [--status found] [--summary]
  python3 shared/tools/tracker.py show <id>
  python3 shared/tools/tracker.py insights [--since YYYY-MM-DD]
  python3 shared/tools/tracker.py action add "Ask the recruiter who the employer is" [--role <id>]
  python3 shared/tools/tracker.py action done <action-id>
  python3 shared/tools/tracker.py action list [--all]
  python3 shared/tools/tracker.py inbox list          Hal's office changes waiting for Chief of Staff
  python3 shared/tools/tracker.py inbox done <id>...  mark them handled (or --all)
  python3 shared/tools/tracker.py inbox add --role <id> --task "Refresh interview prep"

add and set take --by tim when Hal made the change by hand (the office does this);
changes that need work from the team then go into the inbox.
  python3 shared/tools/tracker.py render

Standard library only. Set JOBS_DIR to use a different jobs folder (for testing).
"""
import argparse
import json
import os
import re
import statistics
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO = Path(__file__).resolve().parents[2]
JOBS = Path(os.environ.get("JOBS_DIR", REPO / "jobs"))
DATA = JOBS / "tracker.json"
TABLE = JOBS / "tracker.md"

STATUSES = [
    "found",        # Recruiter found it
    "shortlisted",  # Hal chose to go for it
    "drafted",      # CV and cover letter made, waiting for Hal to check
    "approved",     # Hal approved the documents, PDFs made, ready to apply
    "applied",      # Hal applied
    "interview",
    "offer",
    "rejected",
    "skipped",      # Hal or COS decided not to go for it
]
OPEN = {"found", "shortlisted", "drafted", "approved", "applied", "interview"}
FIELDS = ["title", "company", "location", "pay", "url", "source", "fit",
          "priority", "status", "notes", "reason",
          "next",            # the next step for this role, in a few words
          "cv",              # which CV was or will be used
          "interview_at",    # YYYY-MM-DDTHH:MM, UK time
          "interview_with",  # who the interview is with
          "list",            # Hal's own grouping, e.g. "Shortlist", "Transition roles"
          "closing_date",    # YYYY-MM-DD, when the advert closes
          "verdict",         # Tim's view: apply, maybe or skip
          "verdict_why"]     # one line on why
VERDICTS = ["apply", "maybe", "skip"]
# Hal's decisions, used by insights to learn his preferences.
PICKED = {"shortlisted", "drafted", "approved", "applied", "interview", "offer"}
PASSED = {"skipped"}
# When Hal moves a role to one of these, Tim has work to do. (Approved roles that
# already have Word files need no Tim: Ada, the office's automation, makes the PDFs.)
INBOX_TASKS = {
    "shortlisted": "Draft a tailored CV and cover letter",
    "drafted": "Draft a tailored CV and cover letter",  # only when there's no CV yet
    "approved": "Draft first, then PDFs",
    "interview": "Write interview prep notes",
}
READ_TASK = "Read the advert, write the listing, score the fit and give a verdict"
VERDICT_TASK = "Give a verdict: worth applying?"
FOLLOW_UP_DAYS = 7
TITLE_SKIP = {"and", "of", "the", "a", "an", "to", "in", "for", "with", "uk", "x", "-"}


try:
    UK = ZoneInfo("Europe/London")
except Exception:  # Python on Windows has no time zone data unless the tzdata package is installed
    UK = None  # then use the PC's own clock, which is on UK time for Hal


def uk_now():
    return datetime.now(UK) if UK else datetime.now()


def today():
    return uk_now().strftime("%Y-%m-%d")


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40].strip("-")


def load():
    if not DATA.exists():
        return {"roles": [], "actions": []}
    data = json.loads(DATA.read_text(encoding="utf-8"))
    data.setdefault("actions", [])
    data.setdefault("inbox", [])
    return data


def now_stamp():
    return uk_now().strftime("%Y-%m-%dT%H:%M")


def same_task(a, b):
    """True if two inbox tasks ask for the same work: equal, or one is the other plus
    details after a colon ("Draft a tailored CV and cover letter: bring out budgets")."""
    return a == b or a.startswith(b + ":") or b.startswith(a + ":")


def to_inbox(data, role, task):
    """Queue work for Chief of Staff, once per role and task."""
    if any(i["role"] == role["id"] and same_task(i["task"], task) and not i["done"] for i in data["inbox"]):
        return
    data["inbox"].append({"id": f"i{len(data['inbox']) + 1}", "role": role["id"], "task": task,
                          "title": f"{role['title']} @ {role['company']}", "at": now_stamp(), "done": False})


def pay_bands():
    """(ideal, minimum) yearly pay from shared/job-search/settings.json, for ranking new roles."""
    try:
        settings = json.loads((REPO / "shared" / "job-search" / "settings.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        settings = {}
    number = lambda v: float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None  # noqa: E731
    return number(settings.get("ideal_pay")), number(settings.get("minimum_pay"))


def rank(data):
    """Ada: number every role in To review (found) best first, so the board is in order.
    Order: Tim's verdict, fit, pay band (ideal pay or more, minimum pay or more, other: see settings.json), closing date, then oldest.
    A priority Hal set by hand on a found role is kept; the others are numbered around it."""
    found = [r for r in data["roles"] if r["status"] == "found"]
    pinned = {r["priority"] for r in found if r.get("priority_by_tim") and r.get("priority")}
    order = {"apply": 0, "maybe": 1, None: 2, "skip": 3}
    ideal, minimum = pay_bands()

    def key(r):
        pay = yearly_pay(r.get("pay")) or 0
        band = 0 if ideal and pay >= ideal else 1 if minimum and pay >= minimum else 2
        return (order.get(r.get("verdict"), 2), -(r.get("fit") or 0), band,
                r.get("closing_date") or "9999-99-99", r.get("found") or "")

    n = 0
    for r in sorted((r for r in found if not (r.get("priority_by_tim") and r.get("priority"))), key=key):
        n += 1
        while n in pinned:
            n += 1
        r["priority"] = n


def save(data):
    rank(data)
    JOBS.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    render(data)


def find(data, role_id):
    for role in data["roles"]:
        if role["id"] == role_id:
            return role
    sys.exit(f"No role with id {role_id}")


def cell(value):
    return str(value if value not in (None, "") else "").replace("|", "/").replace("\n", " ")


def render(data):
    order = {s: i for i, s in enumerate(STATUSES)}
    roles = sorted(data["roles"], key=lambda r: (
        order.get(r["status"], 99), r.get("priority") or 999, r["found"]))
    lines = [
        "# Role tracker",
        "",
        "Built from `tracker.json` by `shared/tools/tracker.py`. Do not edit by hand.",
        "",
    ]
    counts = {s: sum(r["status"] == s for r in roles) for s in STATUSES}
    lines.append(" · ".join(f"{s}: {n}" for s, n in counts.items() if n) or "No roles yet.")
    lines.append("")
    todo = [a for a in data.get("actions", []) if not a.get("done")]
    if todo:
        lines += ["## Next actions", ""] + [f"- {cell(a['text'])}" for a in todo] + [""]
    interviews = sorted((r for r in roles if r.get("interview_at") and r["status"] in OPEN),
                        key=lambda r: r["interview_at"])
    if interviews:
        lines += ["## Interviews", ""] + [
            f"- {r['interview_at'].replace('T', ' ')}: {cell(r['title'])} @ {cell(r['company'])}"
            + (f" (with {cell(r['interview_with'])})" if r.get("interview_with") else "")
            for r in interviews] + [""]
    if roles:
        lines += [
            "## Roles",
            "",
            "| Status | Priority | Role | Company | Pay | Location | Fit | Next step | Updated |",
            "|---|---|---|---|---|---|---|---|---|",
        ]
        for r in roles:
            title = f"[{cell(r['title'])}]({r['url']})" if r.get("url") else cell(r["title"])
            lines.append("| " + " | ".join([
                r["status"], cell(r.get("priority")), title, cell(r["company"]),
                cell(r.get("pay")), cell(r.get("location")), cell(r.get("fit")),
                cell(r.get("next")), r["updated"],
            ]) + " |")
    TABLE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_value(key, value):
    if key in ("fit", "priority"):
        if value == "":
            return None
        number = int(value)
        if key == "fit" and not 1 <= number <= 5:
            sys.exit("fit must be 1 to 5")
        return number
    if key == "verdict":
        value = value.strip().lower()
        if value == "":
            return None
        if value not in VERDICTS:
            sys.exit(f"verdict must be one of: {', '.join(VERDICTS)}")
        return value
    if key == "verdict_why":
        return " ".join(value.split())[:300]
    if key == "status" and value not in STATUSES:
        sys.exit(f"status must be one of: {', '.join(STATUSES)}")
    return value


def add_role(data, title, company, location="", pay="", url="", source="", fit="", notes="", by=None, role_id=""):
    """Add a new role (status found) to data and return it. Exits if it's already tracked."""
    if url and any(r.get("url") == url for r in data["roles"]):
        sys.exit(f"Already tracked: {url}")
    ids = {r["id"] for r in data["roles"]}
    if role_id:
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", role_id):
            sys.exit("id must be lower case letters, numbers and hyphens")
        if role_id in ids:
            sys.exit(f"Already tracked: {role_id}")
    else:
        base = f"{today()}-{slug(company)}-{slug(title)}"
        role_id, n = base, 2
        while role_id in ids:
            role_id, n = f"{base}-{n}", n + 1
    role = {
        "id": role_id, "title": title, "company": company,
        "location": location, "pay": pay, "url": url,
        "source": source, "fit": parse_value("fit", str(fit or "")),
        "priority": None, "status": "found", "notes": notes,
        "found": today(), "updated": today(),
        "history": [{"date": today(), "status": "found", **({"by": by} if by else {})}],
    }
    data["roles"].append(role)
    return role


def cmd_add(args):
    data = load()
    role = add_role(data, args.title, args.company, args.location, args.pay, args.url, args.source,
                    args.fit, args.notes, args.by, args.id)
    if args.by == "tim":
        to_inbox(data, role, READ_TASK)
    save(data)
    print(role["id"])


# ---------- The review queue: jobs/found.json ----------
# Rita's daily search and the job-alert email scan add finds here; Tim triages each
# one into Leads (status found) or Dismissed (skipped), with a reason.
FOUND = JOBS / "found.json"
FITS = {"strong": 4, "possible": 3, "weak": 2}
FOUND_KEEP_DAYS = 45


def load_found():
    if not FOUND.exists():
        return {"items": [], "runs": [], "last_email_scan": ""}
    found = json.loads(FOUND.read_text(encoding="utf-8"))
    found.setdefault("items", [])
    found.setdefault("runs", [])
    found.setdefault("last_email_scan", "")
    return found


def save_found(found):
    cutoff = (uk_now() - timedelta(days=FOUND_KEEP_DAYS)).strftime("%Y-%m-%dT%H:%M")
    found["items"] = [i for i in found["items"] if i.get("found_at", "") >= cutoff][-300:]
    found["runs"] = found["runs"][-30:]
    JOBS.mkdir(parents=True, exist_ok=True)
    FOUND.write_text(json.dumps(found, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def norm(text):
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def find_key(company, title):
    return f"{norm(company)}|{norm(title)}"


def clip(value, n):
    return " ".join(str(value or "").split())[:n]


def cmd_found(args):
    data, found = load(), load_found()
    if args.verb == "add":
        if not args.file:
            sys.exit("Usage: found add --file <items.json> [--via web|email]")
        raw = json.loads(Path(args.file).read_text(encoding="utf-8"))
        items = raw.get("items", []) if isinstance(raw, dict) else raw
        known = {find_key(r["company"], r["title"]) for r in data["roles"]} | {find_key(i["company"], i["title"]) for i in found["items"]}
        links = {r.get("url") for r in data["roles"] if r.get("url")} | {i.get("link") for i in found["items"] if i.get("link")}
        n = max([int(i["id"][1:]) for i in found["items"] if re.fullmatch(r"f\d+", i.get("id", ""))] + [0])
        added = skipped = 0
        for j in items:
            if not isinstance(j, dict) or not clip(j.get("title"), 200) or not clip(j.get("company"), 120):
                skipped += 1
                continue
            key, link = find_key(j["company"], j["title"]), clip(j.get("link"), 1500)
            if not re.match(r"https?://", link):
                link = ""
            if key in known or (link and link in links):
                skipped += 1
                continue
            known.add(key)
            if link:
                links.add(link)
            n += 1
            fit = j.get("fit") if j.get("fit") in FITS else "possible"
            found["items"].append({
                "id": f"f{n}", "title": clip(j["title"], 200), "company": clip(j["company"], 120),
                "location": clip(j.get("location"), 120), "pay": clip(j.get("pay"), 80), "link": link,
                "posted": clip(j.get("posted"), 40), "source": clip(j.get("source"), 60),
                "via": j.get("via") if j.get("via") in ("web", "email") else (args.via or "web"),
                "fit": fit, "why": clip(j.get("why"), 300), "concern": clip(j.get("concern"), 200),
                "found_at": now_stamp(),
            })
            added += 1
        save_found(found)
        print(f"added {added}, skipped {skipped} (already known or incomplete)")
    elif args.verb == "list":
        for i in found["items"]:
            t = i.get("triage")
            if args.pending and t:
                continue
            state = f"{t['action']}: {t.get('role', '')}" if t else "pending"
            print(f"{i['id']} | {i['fit']} | {i['title']} @ {i['company']} | {i['location'] or '?'} | {i['pay'] or '?'} | {i['source'] or i['via']} | {state}")
        if not found["items"]:
            print("Queue empty")
    elif args.verb == "take":
        if not args.ids or args.ids[0] not in {i["id"] for i in found["items"]}:
            sys.exit("Usage: found take <item-id> --as lead|dismissed [--verdict ...] [--why ...] [--reason ...]")
        item = next(i for i in found["items"] if i["id"] == args.ids[0])
        if item.get("triage"):
            sys.exit(f"{item['id']} was already {item['triage']['action']} ({item['triage'].get('role', '')})")
        if args.take_as not in ("lead", "dismissed"):
            sys.exit("--as must be lead or dismissed")
        notes = f"Concern: {item['concern']}" if item.get("concern") else ""
        role = add_role(data, item["title"], item["company"], item["location"], item["pay"], item["link"],
                        item["source"] or ("Job alert email" if item["via"] == "email" else "Rita's daily search"),
                        FITS.get(item["fit"], ""), notes, "cass")
        verdict = parse_value("verdict", args.verdict or ("apply" if item["fit"] == "strong" else "maybe"))
        if args.take_as == "dismissed" and not args.verdict:
            verdict = "skip"
        role["verdict"] = verdict
        role["verdict_why"] = parse_value("verdict_why", args.why or item.get("why", ""))
        if item.get("posted"):
            role["notes"] = "; ".join(x for x in (role["notes"], f"Posted {item['posted']}") if x)
        if args.take_as == "dismissed":
            role["status"] = "skipped"
            role["reason"] = clip(args.reason or "Tim: not a fit", 300)
            role["history"].append({"date": today(), "status": "skipped", "by": "cass"})
        item["triage"] = {"action": "added" if args.take_as == "lead" else "dismissed", "role": role["id"],
                          "reason": role.get("reason", ""), "at": now_stamp()}
        save(data)
        save_found(found)
        print(role["id"])
    elif args.verb == "run":
        found["runs"].append({"at": now_stamp(), "via": args.via or "web", "found": args.count or 0, "note": clip(args.note, 300)})
        if args.email_scan_at:
            found["last_email_scan"] = args.email_scan_at
        save_found(found)
        print("logged")


def cmd_set(args):
    data = load()
    role = find(data, args.id)
    for pair in args.changes:
        if "=" not in pair:
            sys.exit(f"Expected key=value, got {pair}")
        key, value = pair.split("=", 1)
        if key not in FIELDS:
            sys.exit(f"Unknown field {key}. Fields: {', '.join(FIELDS)}")
        value = parse_value(key, value)
        if key == "status" and value != role["status"]:
            role["history"].append({"date": today(), "status": value, **({"by": args.by} if args.by else {})})
            has_docs = (JOBS / "roles" / role["id"] / "cv.docx").exists()
            if args.by == "tim" and value in INBOX_TASKS and not (value in ("drafted", "approved") and has_docs):
                to_inbox(data, role, INBOX_TASKS[value])
            if args.by == "tim" and value in ("found", "skipped"):
                # Hal took the role back out of the pipeline (or undid a move): cancel drafting nobody has started.
                for i in data["inbox"]:
                    if i["role"] == role["id"] and not i["done"] and i["task"].startswith(("Draft a tailored CV", "Draft first")):
                        i["done"] = True
                        i["cancelled"] = True
            if value == "applied" and not any(p.startswith("next=") for p in args.changes):
                # Ada: every applied role gets a follow-up date. A next step written before
                # applying is done with now, so it is kept in the notes, not left in the way.
                old = (role.get("next") or "").strip()
                if old and not re.match(r"(?i)\s*(apply|follow up)", old):
                    role["notes"] = "; ".join(x for x in (role.get("notes"), f"Before applying: {old}") if x)
                when = uk_now() + timedelta(days=FOLLOW_UP_DAYS)
                role["next"] = f"Follow up if no reply by {when.day} {when:%b}"
        if key == "priority":
            # Hal's own priority on a To review role is kept when Ada ranks the rest.
            role["priority_by_tim"] = bool(args.by == "tim" and value)
        role[key] = value
    role["updated"] = today()
    save(data)
    print(f"{role['id']}: {role['status']}")


def cmd_list(args):
    data = load()
    roles = data["roles"]
    if args.status:
        roles = [r for r in roles if r["status"] == args.status]
    if args.summary:
        counts = {}
        for r in roles:
            counts[r["status"]] = counts.get(r["status"], 0) + 1
        print("Totals: " + (", ".join(f"{s} {counts[s]}" for s in STATUSES if s in counts) or "none"))
        waiting = [i for i in data["inbox"] if not i["done"]]
        if waiting:
            print(f"Inbox from Hal's office changes ({len(waiting)}): see `inbox list`")
        todo = [a for a in data["actions"] if not a.get("done")]
        if todo:
            print(f"Next actions ({len(todo)}): " + "; ".join(a["text"] for a in todo[:5]))
        upcoming = sorted((r for r in roles if r.get("interview_at") and r["status"] in OPEN),
                          key=lambda r: r["interview_at"])
        for r in upcoming:
            print(f"Interview {r['interview_at'].replace('T', ' ')}: {r['title']} @ {r['company']}")
        # Found roles are many and unreviewed; summarise them rather than list each one.
        found = [r for r in roles if r["status"] == "found"]
        roles = [r for r in roles if r["status"] in OPEN and r["status"] != "found"]
        if found:
            print(f"Found, not yet reviewed: {len(found)} (see `list --status found`)")
    for r in roles:
        next_step = f" | next: {r['next']}" if r.get("next") else ""
        print(f"{r['id']} | {r['status']} | p{r.get('priority') or '-'} | fit {r.get('fit') or '-'} | "
              f"{r['title']} @ {r['company']} | {r.get('pay') or '?'}{next_step}")


def cmd_action(args):
    data = load()
    actions = data["actions"]
    if args.verb == "add":
        if not args.text:
            sys.exit('Usage: action add "what to do" [--role <id>]')
        if args.role:
            find(data, args.role)
        action = {"id": f"a{len(actions) + 1}", "text": " ".join(args.text), "role": args.role or "",
                  "done": False, "created": today()}
        while any(a["id"] == action["id"] for a in actions):
            action["id"] = "a" + str(int(action["id"][1:]) + 1)
        actions.append(action)
        save(data)
        print(action["id"])
    elif args.verb in ("done", "reopen"):
        if not args.text:
            sys.exit(f"Usage: action {args.verb} <action-id>")
        for action in actions:
            if action["id"] == args.text[0]:
                action["done"] = args.verb == "done"
                if action["done"]:
                    action["completed"] = today()
                else:
                    action.pop("completed", None)
                save(data)
                print(f"{action['id']}: {'done' if action['done'] else 'to do'}")
                return
        sys.exit(f"No action with id {args.text[0]}")
    else:
        for a in actions:
            if args.all or not a.get("done"):
                role = f" (role {a['role']})" if a.get("role") else ""
                print(f"{a['id']} | {'done' if a.get('done') else 'todo'} | {a['text']}{role}")


def cmd_inbox(args):
    data = load()
    if args.verb == "add":
        if not args.role or not args.task:
            sys.exit('Usage: inbox add --role <id> --task "what to do"')
        role = find(data, args.role)
        before = len(data["inbox"])
        to_inbox(data, role, args.task.strip()[:400])
        save(data)
        print(data["inbox"][-1]["id"] if len(data["inbox"]) > before else "Already waiting")
        return
    waiting = [i for i in data["inbox"] if not i["done"]]
    if args.verb == "list":
        for i in waiting:
            print(f"{i['id']} | {i['role']} | {i['task']} | {i['title']} | {i['at']}")
        if not waiting:
            print("Inbox empty")
        return
    ids = {i["id"] for i in waiting} if args.all else set(args.ids)
    if not ids:
        sys.exit("Usage: inbox done <id>... (or --all)")
    unknown = ids - {i["id"] for i in data["inbox"]}
    if unknown:
        sys.exit(f"No inbox item {', '.join(sorted(unknown))}")
    for i in data["inbox"]:
        if i["id"] in ids:
            i["done"] = True
            i["handled"] = now_stamp()
    save(data)
    print(f"{len(ids)} done")


def cmd_show(args):
    print(json.dumps(find(load(), args.id), indent=2, ensure_ascii=False))


def yearly_pay(text):
    """Lowest yearly figure in a pay string like '£35,000 - £45,000' or '40k'. None if unclear."""
    if not text or re.search(r"(?i)\b(day|daily|hour|hourly|ph|pd)\b", text):
        return None
    figures = []
    for number, k in re.findall(r"(\d[\d,]*(?:\.\d+)?)\s*(k)?", text.lower()):
        value = float(number.replace(",", ""))
        if k:
            value *= 1000
        if value >= 5000:
            figures.append(value)
    return min(figures) if figures else None


def work_style(location):
    text = (location or "").lower()
    if "remote" in text:
        return "remote"
    if "hybrid" in text:
        return "hybrid"
    return "office/unstated"


def decided_on(role, statuses, since):
    """True if the role reached one of these statuses on or after since."""
    return any(h["status"] in statuses and h["date"] >= since for h in role["history"])


def money(value):
    return f"£{value / 1000:.0f}k"


def cmd_insights(args):
    since = args.since or "0000-00-00"
    roles = load()["roles"]
    picked = [r for r in roles if decided_on(r, PICKED, since)]
    passed = [r for r in roles if decided_on(r, PASSED, since) and r not in picked]
    outcomes = Counter(r["status"] for r in roles
                       if r["status"] in {"interview", "offer", "rejected"}
                       and decided_on(r, {r["status"]}, since))
    print(f"Decisions since {args.since or 'the start'}: {len(picked)} picked, {len(passed)} skipped"
          + (", outcomes: " + ", ".join(f"{n} {s}" for s, n in outcomes.items()) if outcomes else ""))
    if not picked and not passed:
        return

    def pay_line(label, group):
        pays = [p for p in (yearly_pay(r.get("pay")) for r in group) if p]
        if not pays:
            return f"  {label}: no yearly pay stated"
        return (f"  {label}: median {money(statistics.median(pays))}, lowest {money(min(pays))}"
                f" ({len(pays)} of {len(group)} stated)")
    print("Pay (lowest yearly figure):")
    print(pay_line("picked", picked))
    print(pay_line("skipped", passed))

    def count_line(label, values):
        counts = Counter(values).most_common(6)
        return f"  {label}: " + (", ".join(f"{v} {n}" for v, n in counts) or "none")
    print("Work style:")
    print(count_line("picked", [work_style(r.get("location")) for r in picked]))
    print(count_line("skipped", [work_style(r.get("location")) for r in passed]))

    def words(group):
        return [w for r in group for w in set(re.findall(r"[a-z]+", r["title"].lower()))
                if w not in TITLE_SKIP]
    print("Title words:")
    print(count_line("picked", words(picked)))
    print(count_line("skipped", words(passed)))
    print("Sources:")
    print(count_line("picked", [r.get("source") or "unknown" for r in picked]))
    print(count_line("skipped", [r.get("source") or "unknown" for r in passed]))

    def fit_line(label, group):
        fits = [r["fit"] for r in group if r.get("fit")]
        return f"  {label}: " + (f"average {statistics.mean(fits):.1f}" if fits else "no scores")
    print("Fit score:")
    print(fit_line("picked", picked))
    print(fit_line("skipped", passed))

    reasons = Counter((r.get("reason") or "").strip().lower() for r in roles
                      if r.get("reason") and (r in picked or r in passed or r["status"] == "rejected"))
    print("Reasons Hal gave:")
    for reason, n in reasons.most_common(10):
        print(f"  - {reason} ({n})")
    if not reasons:
        print("  none")


def main():
    parser = argparse.ArgumentParser(description="Job-search role tracker")
    sub = parser.add_subparsers(dest="cmd", required=True)

    add = sub.add_parser("add", help="add a newly found role")
    add.add_argument("--title", required=True)
    add.add_argument("--company", required=True)
    add.add_argument("--id", default="", help="use this id (the role's folder name)")
    for name in ("location", "pay", "url", "source", "fit", "notes"):
        add.add_argument(f"--{name}", default="")
    add.add_argument("--by", choices=["tim"], help="Hal added it by hand (from the office)")
    add.set_defaults(func=cmd_add)

    st = sub.add_parser("set", help="change fields on a role, e.g. status=shortlisted")
    st.add_argument("id")
    st.add_argument("changes", nargs="+")
    st.add_argument("--by", choices=["tim"], help="Hal made the change by hand (from the office)")
    st.set_defaults(func=cmd_set)

    ls = sub.add_parser("list", help="list roles, one line each")
    ls.add_argument("--status", choices=STATUSES)
    ls.add_argument("--summary", action="store_true", help="totals plus open roles only")
    ls.set_defaults(func=cmd_list)

    sh = sub.add_parser("show", help="show one role in full")
    sh.add_argument("id")
    sh.set_defaults(func=cmd_show)

    ins = sub.add_parser("insights", help="patterns in Hal's decisions, for preference reviews")
    ins.add_argument("--since", help="only decisions on or after this date (YYYY-MM-DD)")
    ins.set_defaults(func=cmd_insights)

    act = sub.add_parser("action", help="Hal's next actions: add, done, list")
    act.add_argument("verb", choices=["add", "done", "reopen", "list"])
    act.add_argument("text", nargs="*", help="the action's text (add) or id (done)")
    act.add_argument("--role", help="the role this action is about (add)")
    act.add_argument("--all", action="store_true", help="include done actions (list)")
    act.set_defaults(func=cmd_action)

    inb = sub.add_parser("inbox", help="Hal's office changes waiting for Chief of Staff")
    inb.add_argument("verb", choices=["list", "done", "add"])
    inb.add_argument("--role", help="add: the role the task is about")
    inb.add_argument("--task", help="add: what Tim should get done")
    inb.add_argument("ids", nargs="*")
    inb.add_argument("--all", action="store_true")
    inb.set_defaults(func=cmd_inbox)

    rk = sub.add_parser("rank", help="number the To review roles best first (also done on every save)")
    rk.set_defaults(func=lambda a: (save(load()), cmd_list(argparse.Namespace(status="found", summary=False))))

    fd = sub.add_parser("found", help="the review queue of new finds (jobs/found.json)")
    fd.add_argument("verb", choices=["add", "list", "take", "run"])
    fd.add_argument("ids", nargs="*", help="take: the item id")
    fd.add_argument("--file", help="add: a JSON list of finds")
    fd.add_argument("--via", choices=["web", "email"], help="add/run: where the finds came from")
    fd.add_argument("--pending", action="store_true", help="list: only finds Tim hasn't triaged")
    fd.add_argument("--as", dest="take_as", help="take: lead or dismissed")
    fd.add_argument("--verdict", help="take: apply, maybe or skip (default from fit)")
    fd.add_argument("--why", help="take: one line on why (default: the find's own)")
    fd.add_argument("--reason", help="take --as dismissed: why it was dismissed")
    fd.add_argument("--found", dest="count", type=int, help="run: how many new finds")
    fd.add_argument("--note", help="run: anything worth knowing, e.g. Outlook not connected")
    fd.add_argument("--email-scan-at", help="run: when the email scan started (ISO)")
    fd.set_defaults(func=cmd_found)

    rd = sub.add_parser("render", help="rebuild tracker.md from tracker.json")
    rd.set_defaults(func=lambda a: render(load()))

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
