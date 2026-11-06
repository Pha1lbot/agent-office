#!/usr/bin/env python3
"""Role tracker for the job-search team.

jobs/tracker.json holds one record per role. jobs/tracker.md is rebuilt from it
after every change so it can be read on GitHub. Only the Admin agent should run
the commands that change the tracker (add, set).

Usage:
  python3 shared/tools/tracker.py add --title "Data Analyst" --company "Acme" \
      [--location ...] [--pay ...] [--url ...] [--source ...] [--fit 1-5] [--notes ...]
  python3 shared/tools/tracker.py set <id> status=shortlisted priority=1 notes="..."
  python3 shared/tools/tracker.py list [--status found] [--summary]
  python3 shared/tools/tracker.py show <id>
  python3 shared/tools/tracker.py render

Standard library only. Set JOBS_DIR to use a different jobs folder (for testing).
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

REPO = Path(__file__).resolve().parents[2]
JOBS = Path(os.environ.get("JOBS_DIR", REPO / "jobs"))
DATA = JOBS / "tracker.json"
TABLE = JOBS / "tracker.md"

STATUSES = [
    "found",        # Recruiter found it
    "shortlisted",  # Tim chose to go for it
    "drafted",      # CV and cover letter made, waiting for Tim to check
    "approved",     # Tim approved the documents, PDFs made, ready to apply
    "applied",      # Tim applied
    "interview",
    "offer",
    "rejected",
    "skipped",      # Tim or COS decided not to go for it
]
OPEN = {"found", "shortlisted", "drafted", "approved", "applied", "interview"}
FIELDS = ["title", "company", "location", "pay", "url", "source", "fit",
          "priority", "status", "notes"]


def today():
    return datetime.now(ZoneInfo("Europe/London")).strftime("%Y-%m-%d")


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40].strip("-")


def load():
    if not DATA.exists():
        return {"roles": []}
    return json.loads(DATA.read_text(encoding="utf-8"))


def save(data):
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
    if roles:
        lines += [
            "| Status | Priority | Role | Company | Pay | Location | Fit | Found | Updated |",
            "|---|---|---|---|---|---|---|---|---|",
        ]
        for r in roles:
            title = f"[{cell(r['title'])}]({r['url']})" if r.get("url") else cell(r["title"])
            lines.append("| " + " | ".join([
                r["status"], cell(r.get("priority")), title, cell(r["company"]),
                cell(r.get("pay")), cell(r.get("location")), cell(r.get("fit")),
                r["found"], r["updated"],
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
    if key == "status" and value not in STATUSES:
        sys.exit(f"status must be one of: {', '.join(STATUSES)}")
    return value


def cmd_add(args):
    data = load()
    if args.url and any(r.get("url") == args.url for r in data["roles"]):
        sys.exit(f"Already tracked: {args.url}")
    base = f"{today()}-{slug(args.company)}-{slug(args.title)}"
    role_id, n = base, 2
    ids = {r["id"] for r in data["roles"]}
    while role_id in ids:
        role_id, n = f"{base}-{n}", n + 1
    role = {
        "id": role_id, "title": args.title, "company": args.company,
        "location": args.location, "pay": args.pay, "url": args.url,
        "source": args.source, "fit": parse_value("fit", args.fit or ""),
        "priority": None, "status": "found", "notes": args.notes,
        "found": today(), "updated": today(),
        "history": [{"date": today(), "status": "found"}],
    }
    data["roles"].append(role)
    save(data)
    print(role_id)


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
            role["history"].append({"date": today(), "status": value})
        role[key] = value
    role["updated"] = today()
    save(data)
    print(f"{role['id']}: {role['status']}")


def cmd_list(args):
    roles = load()["roles"]
    if args.status:
        roles = [r for r in roles if r["status"] == args.status]
    if args.summary:
        counts = {}
        for r in roles:
            counts[r["status"]] = counts.get(r["status"], 0) + 1
        print("Totals: " + (", ".join(f"{s} {counts[s]}" for s in STATUSES if s in counts) or "none"))
        roles = [r for r in roles if r["status"] in OPEN]
    for r in roles:
        print(f"{r['id']} | {r['status']} | p{r.get('priority') or '-'} | fit {r.get('fit') or '-'} | "
              f"{r['title']} @ {r['company']} | {r.get('pay') or '?'}")


def cmd_show(args):
    print(json.dumps(find(load(), args.id), indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Job-search role tracker")
    sub = parser.add_subparsers(dest="cmd", required=True)

    add = sub.add_parser("add", help="add a newly found role")
    add.add_argument("--title", required=True)
    add.add_argument("--company", required=True)
    for name in ("location", "pay", "url", "source", "fit", "notes"):
        add.add_argument(f"--{name}", default="")
    add.set_defaults(func=cmd_add)

    st = sub.add_parser("set", help="change fields on a role, e.g. status=shortlisted")
    st.add_argument("id")
    st.add_argument("changes", nargs="+")
    st.set_defaults(func=cmd_set)

    ls = sub.add_parser("list", help="list roles, one line each")
    ls.add_argument("--status", choices=STATUSES)
    ls.add_argument("--summary", action="store_true", help="totals plus open roles only")
    ls.set_defaults(func=cmd_list)

    sh = sub.add_parser("show", help="show one role in full")
    sh.add_argument("id")
    sh.set_defaults(func=cmd_show)

    rd = sub.add_parser("render", help="rebuild tracker.md from tracker.json")
    rd.set_defaults(func=lambda a: render(load()))

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
