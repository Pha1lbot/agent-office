#!/usr/bin/env python3
"""Import Tim's old "Job Hunt" dashboard (a claude.ai artifact) into the role tracker.

Usage:
  python3 shared/tools/import_dashboard.py jobs/imports/<export>.json [--dry-run]

The export is a JSON file with the dashboard's database documents:
  {"state": {...roles, leads, actions, cvs, cvRules, target...},
   "cv-<id>": {"content": "...", "jd": "...", "notes": "..."}, ...}

What it does:
- Dashboard roles and leads become tracker roles. Ones already tracked (same
  LinkedIn job number or advert link, or same company and title) are merged:
  the further-on status wins, and empty fields are filled in.
- Next actions become tracker actions.
- Tailored CV texts become jobs/roles/<id>/cv.md (plus notes.md and the job
  description as listing.md if the role has none yet). Existing files are
  never overwritten.
- Safe to run again: nothing is added twice.

Standard library only. Set JOBS_DIR to use a different jobs folder (for testing).
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tracker  # noqa: E402  (same folder)

ROLE_STAGE = {  # dashboard role stage -> tracker status
    "toapply": "shortlisted", "applied": "applied", "interview": "interview",
    "offer": "offer", "rejected": "rejected", "closed": "skipped",
}
LEAD_STATUS = {"new": "found", "shortlist": "shortlisted", "dismissed": "skipped"}
ORDER = {s: i for i, s in enumerate(tracker.STATUSES)}


def date_of(stamp):
    return stamp[:10] if stamp and re.match(r"\d{4}-\d{2}-\d{2}", stamp) else tracker.today()


def job_key(url):
    """A stable key for an advert link: the LinkedIn job number, or the link without query."""
    if not url:
        return ""
    m = re.search(r"linkedin\.com/jobs/view/(?:[^/?#]*?-)?(\d{8,})", url)
    if m:
        return "linkedin:" + m.group(1)
    return re.sub(r"[?#].*$", "", url).rstrip("/").lower()


def name_key(company, title):
    def norm(text):
        text = re.sub(r"\(.*?\)|·.*$", " ", text or "")  # drop "(client unnamed)", "· The Esports Radar"
        return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()
    return norm(company) + "|" + norm(title)


def notes_from(item):
    parts = []
    for label, key in (("Notes", "notes"), ("Why it fits", "fit"), ("Concern", "concern"), ("Posted", "posted")):
        if item.get(key):
            parts.append(f"{label}: {item[key]}")
    return " ".join(parts)


def interview_time(stamp):
    return stamp[:16] if stamp else ""


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("export")
    parser.add_argument("--dry-run", action="store_true", help="show what would change, write nothing")
    args = parser.parse_args()

    export = json.loads(Path(args.export).read_text(encoding="utf-8"))
    state = export.get("state") or {}
    data = tracker.load()
    roles = data["roles"]
    by_job = {job_key(r.get("url")): r for r in roles if r.get("url")}
    by_name = {name_key(r["company"], r["title"]): r for r in roles}
    ids = {r["id"] for r in roles}
    report = {"added": [], "merged": [], "skipped": []}
    cv_role = {}  # dashboard CV name -> tracker role

    def upsert(item, status, origin):
        url = item.get("link", "")
        existing = by_job.get(job_key(url)) if url else None
        existing = existing or by_name.get(name_key(item.get("company"), item.get("title")))
        fields = {
            "title": item.get("title", ""), "company": item.get("company", ""),
            "location": item.get("location", ""), "pay": item.get("pay", ""), "url": url,
            "source": item.get("source") or "Job Hunt dashboard", "next": item.get("next", ""),
            "cv": item.get("cv", ""), "interview_at": interview_time(item.get("interviewAt", "")),
            "interview_with": item.get("interviewWith", ""), "list": item.get("list") or item.get("track", ""),
            "notes": notes_from(item),
        }
        if status == "skipped" and item.get("next"):
            fields["reason"] = item["next"]
        if existing:
            changed = []
            for key, value in fields.items():
                if value and not existing.get(key):
                    existing[key] = value
                    changed.append(key)
            if ORDER.get(status, 0) > ORDER.get(existing["status"], 0):
                existing["status"] = status
                existing.setdefault("history", []).append({"date": tracker.today(), "status": status})
                changed.append("status")
            if changed:
                existing["updated"] = tracker.today()
                report["merged"].append(f"{existing['id']} ({', '.join(changed)})")
            return existing
        found = date_of(item.get("createdAt", ""))
        base = f"{found}-{tracker.slug(fields['company'])}-{tracker.slug(fields['title'])}"
        role_id, n = base, 2
        while role_id in ids:
            role_id, n = f"{base}-{n}", n + 1
        ids.add(role_id)
        history = [{"date": date_of(h.get("at")), "status": ROLE_STAGE.get(h.get("stage"), "found")}
                   for h in item.get("history") or []] or [{"date": found, "status": status}]
        role = {"id": role_id, **fields, "fit": None, "priority": None, "status": status,
                "found": found, "updated": date_of(item.get("updatedAt") or item.get("createdAt")),
                "history": history, "imported_from": origin}
        roles.append(role)
        by_name[name_key(role["company"], role["title"])] = role
        if url:
            by_job[job_key(url)] = role
        report["added"].append(f"{role_id} ({status})")
        return role

    tailored = {c.get("name"): c for c in state.get("cvs") or [] if c.get("kind") == "tailored"}
    for item in state.get("roles") or []:
        status = ROLE_STAGE.get(item.get("stage"), "found")
        # "To apply" with a tailored CV already made means ready to apply.
        if status == "shortlisted" and item.get("cv") in tailored:
            status = "approved"
        role = upsert(item, status, "dashboard role")
        if item.get("cv"):
            cv_role[item["cv"]] = role
    for item in state.get("leads") or []:
        if item.get("status") == "moved" or item.get("roleId"):
            report["skipped"].append(f"{item.get('title')} @ {item.get('company')} (already a role)")
            continue
        upsert(item, LEAD_STATUS.get(item.get("status"), "found"), "dashboard lead")

    known = {a["text"].strip().lower() for a in data["actions"]}
    added_actions = 0
    for a in state.get("actions") or []:
        text = (a.get("text") or "").strip()
        if not text or text.lower() in known:
            continue
        data["actions"].append({"id": f"a{len(data['actions']) + 1}", "text": text, "role": "",
                                "done": bool(a.get("done")), "created": date_of(a.get("createdAt"))})
        known.add(text.lower())
        added_actions += 1

    files = []
    for name, cv in tailored.items():
        doc = export.get(f"cv-{cv.get('id')}") or {}
        role = cv_role.get(name)
        if not role or not doc.get("content"):
            continue
        folder = tracker.JOBS / "roles" / role["id"]
        for filename, text in (("cv.md", doc.get("content")), ("notes.md", doc.get("notes")),
                               ("listing.md", doc.get("jd") and f"# {role['title']} at {role['company']}\n\n"
                                f"- Link: {role.get('url') or 'not saved'}\n\n## Job description (from the dashboard)\n\n{doc['jd']}\n")):
            path = folder / filename
            if text and not path.exists():
                files.append(str(path.relative_to(tracker.JOBS.parent) if path.is_relative_to(tracker.JOBS.parent) else path))
                if not args.dry_run:
                    folder.mkdir(parents=True, exist_ok=True)
                    path.write_text(text.rstrip() + "\n", encoding="utf-8")

    if not args.dry_run:
        tracker.save(data)
    prefix = "Would import" if args.dry_run else "Imported"
    print(f"{prefix}: {len(report['added'])} new roles, {len(report['merged'])} merged with existing, "
          f"{added_actions} actions, {len(files)} CV files; skipped {len(report['skipped'])}.")
    for key in ("merged", "skipped"):
        for line in report[key]:
            print(f"  {key}: {line}")
    for path in files:
        print(f"  file: {path}")


if __name__ == "__main__":
    main()
