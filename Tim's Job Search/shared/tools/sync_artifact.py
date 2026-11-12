#!/usr/bin/env python3
"""Keeps Tim's phone dashboard (a published page) in step with the office. Standard library only.

The tracker (jobs/tracker.json) stays the one source of truth. The phone page is a view of it,
plus a few answers sent back:

  sync_artifact.py export [--out FILE]      build the snapshot the phone page shows (JSON)
  sync_artifact.py apply FILE               apply what Tim did on his phone (JSON from the page)

The phone page keeps two documents in its database:
  office  written by this script (the snapshot). The page only reads it.
  phone   written by the page: {"answers": {action_id: {"answer": "...", "at": "..."}},
                               "done": {action_id: {"at": "..."}}}
`apply` is safe to run again and again: an answer already given, or an action already done, is skipped.
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
JOBS = os.environ.get("JOBS_DIR") or os.path.join(HERE, "..", "..", "jobs")
TRACKER = os.path.join(HERE, "tracker.py")
LIVE = ("found", "shortlisted", "drafted", "approved", "applied", "interview", "offer")


def read(name, default):
    try:
        with open(os.path.join(JOBS, name), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def today_text():
    try:
        with open(os.path.join(JOBS, "today.md"), encoding="utf-8") as f:
            return f.read()[:6000]
    except OSError:
        return ""


def snapshot(now=None):
    tracker = read("tracker.json", {"roles": [], "actions": []})
    found = read("found.json", {"items": [], "sources": {}})
    roles = []
    for r in tracker.get("roles", []):
        if r.get("status") not in LIVE:
            continue
        roles.append({k: r.get(k, "") for k in ("id", "title", "company", "location", "pay", "status", "next", "notes", "url", "source", "updated")})
    roles.sort(key=lambda r: (r["status"] != "applied", r.get("updated", "")), reverse=False)
    actions = []
    for a in tracker.get("actions", []):
        if a.get("done"):
            continue
        actions.append({"id": a["id"], "text": a.get("text", ""), "role": a.get("role", ""), "options": a.get("options", []), "created": a.get("created", "")})
    leads = []
    for it in found.get("items", []):
        if it.get("triage"):
            continue
        leads.append({k: it.get(k, "") for k in ("id", "title", "company", "location", "pay", "link", "source", "fit", "why", "concern", "track", "posted")})
    sources = []
    for name, s in sorted((found.get("sources") or {}).items()):
        sources.append({"name": name, "last_checked": s.get("last_checked", ""), "result": s.get("result", ""), "found": s.get("found", 0), "note": s.get("note", "")})
    counts = {}
    for r in tracker.get("roles", []):
        counts[r.get("status", "")] = counts.get(r.get("status", ""), 0) + 1
    return {
        "v": 1,
        "generated": (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "today": today_text(),
        "counts": counts,
        "roles": roles,
        "actions": actions,
        "leads": leads,
        "sources": sources,
    }


def run_tracker(*args):
    env = dict(os.environ)
    p = subprocess.run([sys.executable, TRACKER, *args], capture_output=True, text=True, env=env)
    return p.returncode == 0, (p.stdout + p.stderr).strip()


def apply_phone(phone):
    """Apply the phone's answers and done marks. Returns (done_list, skipped_list)."""
    tracker = read("tracker.json", {"actions": []})
    by_id = {a["id"]: a for a in tracker.get("actions", [])}
    done, skipped = [], []
    for aid, v in sorted((phone.get("answers") or {}).items()):
        a = by_id.get(aid)
        answer = (v or {}).get("answer", "")
        if not a:
            skipped.append(f"{aid}: no such action")
        elif a.get("answer") or a.get("done"):
            skipped.append(f"{aid}: already handled")
        else:
            ok, msg = run_tracker("action", "answer", aid, answer)
            (done if ok else skipped).append(f"{aid}: {'answered ' + answer if ok else msg}")
    for aid in sorted((phone.get("done") or {})):
        a = by_id.get(aid)
        if not a:
            skipped.append(f"{aid}: no such action")
        elif a.get("done"):
            skipped.append(f"{aid}: already handled")
        else:
            ok, msg = run_tracker("action", "done", aid)
            (done if ok else skipped).append(f"{aid}: {'marked done' if ok else msg}")
    return done, skipped


def main():
    ap = argparse.ArgumentParser(description="Phone dashboard sync")
    sub = ap.add_subparsers(dest="cmd", required=True)
    ex = sub.add_parser("export")
    ex.add_argument("--out")
    ap_ = sub.add_parser("apply")
    ap_.add_argument("file")
    args = ap.parse_args()
    if args.cmd == "export":
        text = json.dumps(snapshot(), indent=1, ensure_ascii=False)
        if args.out:
            with open(args.out, "w", encoding="utf-8") as f:
                f.write(text)
        else:
            print(text)
    else:
        with open(args.file, encoding="utf-8") as f:
            phone = json.load(f)
        done, skipped = apply_phone(phone)
        for line in done:
            print("applied", line)
        for line in skipped:
            print("skipped", line)
        if not done and not skipped:
            print("Nothing from the phone to apply")


if __name__ == "__main__":
    main()
