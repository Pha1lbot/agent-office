#!/usr/bin/env python3
"""Tests for scout.py, using canned responses (no network). Run: python3 shared/tools/test_scout.py"""
import json
import os
import shutil
import sys
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import scout  # noqa: E402

TODAY = date(2026, 11, 11)
RECENT = (TODAY - timedelta(days=2)).isoformat()
OLD = (TODAY - timedelta(days=40)).isoformat()

DEFN = {
    "max_age_days": 14,
    "pay": {"minimum": 50000, "ideal": 60000},
    "avoid_employers": ["BLAST"],
    "avoid_work": ["compliance", "accounts payable"],
    "tracks": [
        {"id": "esports", "name": "Esports and gaming operations", "priority": 1, "min_level": "manager",
         "titles": ["Head of Esports Operations", "Head of Operations", "Esports Programme Manager"],
         "keywords": ["esports", "gaming"], "not": ["software engineer", "designer"]},
        {"id": "scaleup", "name": "Head of Operations at scale-ups", "priority": 4, "min_level": "senior manager",
         "titles": ["Head of Operations", "Director of Operations"], "keywords": ["scale-up", "growth"], "not": ["supply chain"]},
        {"id": "ai", "name": "AI operations", "priority": 6, "min_level": "manager",
         "titles": ["AI Programme Manager"], "keywords": ["ai", "automation"], "not": ["engineer"]},
    ],
    "sources": [],
}


def job(**kw):
    base = {"title": "Head of Esports Operations", "company": "Acme Games", "location": "London, UK", "country": "GB",
            "link": "https://example.com/jobs/1", "posted": RECENT, "pay": "", "description": "Lead our esports tournaments."}
    base.update(kw)
    return base


class Judge(unittest.TestCase):
    def check(self, **kw):
        return scout.judge(job(**kw), "Test", DEFN, today=TODAY)

    def test_keeps_a_fitting_job_with_its_track_and_a_summary(self):
        item, why = self.check()
        self.assertEqual(why, "")
        self.assertEqual(item["track"], "Esports and gaming operations")
        self.assertEqual(item["fit"], "strong")
        self.assertEqual((item["via"], item["source"], item["posted"]), ("feed", "Test", RECENT))
        self.assertIn("esports tournaments", item["summary"])

    def test_the_first_track_in_tims_order_wins(self):
        item, _ = self.check(title="Head of Operations", description="A growth scale-up in esports.")
        self.assertEqual(item["track"], "Esports and gaming operations")
        item, _ = self.check(title="Director of Operations", description="Fast growth.")
        self.assertEqual(item["track"], "Head of Operations at scale-ups")

    def test_reasons_a_job_is_left_out(self):
        cases = [
            ({"company": "BLAST"}, "employer avoided"),
            ({"title": "Head of Esports Operations, Compliance"}, "wrong kind of work"),
            ({"posted": OLD}, "too old"),
            ({"location": "Zagreb", "country": "HR"}, "not in the UK"),
            ({"location": "Manchester", "country": "GB", "description": "On site five days."}, "outside commute, not remote"),
            ({"pay": "£35,000 - £40,000"}, "pay below minimum"),
            ({"title": "Esports Operations Coordinator"}, "no track matches"),
            ({"title": "Head of Esports Operations", "link": ""}, "incomplete"),
            ({"title": "Software Engineer, Operations Tools"}, "no track matches"),
        ]
        for change, want in cases:
            item, why = self.check(**change)
            self.assertIsNone(item, change)
            self.assertEqual(why, want, change)

    def test_level_rules_differ_by_track(self):
        # Manager is fine at esports and AI, not for the senior-only scale-up track.
        self.assertIsNotNone(self.check(title="Esports Programme Manager")[0])
        self.assertIsNotNone(self.check(title="AI Programme Manager", description="Automation in a growth team.")[0])
        self.assertIsNone(self.check(title="Operations Manager", description="scale-up growth")[0])

    def test_remote_and_pay_and_contract(self):
        item, _ = self.check(location="Remote", country="", description="UK based remote role. Esports.", remote=True)
        self.assertIsNotNone(item)
        item, _ = self.check(location="Manchester", country="GB", remote=True)
        self.assertIsNotNone(item)
        self.assertEqual(self.check(pay="£60,000 - £70,000")[0]["pay"], "£60,000 - £70,000")
        self.assertIsNotNone(self.check(pay="£450 per day")[0])  # a day rate isn't compared with the yearly floor
        self.assertIn("contract", self.check(contract=True)[0]["concern"])


PAGE = """<html><head><script type="application/ld+json">{
 "@type": "JobPosting", "title": "Head of Esports Operations", "datePosted": "%s",
 "hiringOrganization": {"@type": "Organization", "name": "Acme Games"},
 "jobLocation": [{"@type": "Place", "address": {"@type": "PostalAddress", "addressLocality": "London", "addressCountry": "GB"}}],
 "employmentType": ["FULL_TIME"], "description": "&lt;p&gt;Run our esports tournaments.&lt;/p&gt;",
 "baseSalary": {"currency": "GBP", "value": {"minValue": 70000, "maxValue": 85000}}}</script></head></html>""" % RECENT


class FakeHttp:
    """Canned responses by URL. A value that is an exception is raised."""

    def __init__(self, routes):
        self.routes, self.calls = routes, []

    def get(self, url, **kw):
        self.calls.append(url)
        for prefix, res in self.routes.items():
            if url == prefix or (prefix.endswith("*") and url.startswith(prefix[:-1])):
                if isinstance(res, Exception):
                    raise res
                return res if isinstance(res, tuple) else (200, res.encode() if isinstance(res, str) else res)
        return 404, b""

    def allowed(self, url):
        return True


def sitemap(*urls):
    return "<urlset>" + "".join(f"<url><loc>{u}</loc><lastmod>{TODAY.isoformat()}</lastmod></url>" for u in urls) + "</urlset>"


class Readers(unittest.TestCase):
    def test_reads_job_posting_data(self):
        j = scout.read_job_posting(PAGE, "https://x/jobs/head-of-esports-operations-acme-games-123")
        self.assertEqual((j["title"], j["company"], j["country"], j["location"]), ("Head of Esports Operations", "Acme Games", "GB", "London"))
        self.assertEqual(j["pay"], "£70,000 - £85,000")
        self.assertEqual(j["description"], "Run our esports tournaments.")
        self.assertIsNone(scout.read_job_posting("<html></html>", "u"))

    def test_sitemap_reads_likely_jobs_once_and_skips_the_rest(self):
        src = {"id": "h", "name": "Hitmarker", "type": "sitemap", "url": "https://h/sitemap.xml"}
        urls = ["https://h/jobs/acme-head-of-esports-operations-101", "https://h/jobs/acme-software-engineer-esports-102",
                "https://h/jobs/acme-head-of-gardening-103", "https://h/jobs/acme-esports-programme-manager-104"]
        http = FakeHttp({"https://h/sitemap.xml": sitemap(*urls), "https://h/jobs/*": PAGE})
        state = {"seen": {}}
        jobs, status, note = scout.read_sitemap(src, DEFN, http, state, 10)
        self.assertEqual(status, "ok")
        self.assertEqual(len(jobs), 2)  # the engineer and the gardener never get fetched
        self.assertNotIn("https://h/jobs/acme-software-engineer-esports-102", http.calls)
        self.assertEqual(set(state["seen"]), {urls[0], urls[3]})
        again, _, _ = scout.read_sitemap(src, DEFN, FakeHttp({"https://h/sitemap.xml": sitemap(*urls)}), state, 10)
        self.assertEqual(again, [])  # already read
        limited, _, _ = scout.read_sitemap(src, DEFN, FakeHttp({"https://h/sitemap.xml": sitemap(*urls), "https://h/jobs/*": PAGE}), {"seen": {}}, 1)
        self.assertEqual(len(limited), 1)

    def test_blocked_and_error_sources_say_so(self):
        src = {"type": "sitemap", "url": "https://h/s.xml", "name": "H"}
        self.assertEqual(scout.read_sitemap(src, DEFN, FakeHttp({"https://h/s.xml": scout.Unreachable("tunnel 403")}), {"seen": {}}, 5)[1], "blocked")
        self.assertEqual(scout.read_sitemap(src, DEFN, FakeHttp({"https://h/s.xml": (403, b"")}), {"seen": {}}, 5)[1], "blocked")
        self.assertEqual(scout.read_sitemap(src, DEFN, FakeHttp({"https://h/s.xml": (500, b"")}), {"seen": {}}, 5)[1], "error")

    def test_company_feeds(self):
        gh = {"jobs": [{"title": "Head of Operations", "location": {"name": "London"}, "absolute_url": "https://gh/1",
                        "first_published": RECENT, "content": "&lt;p&gt;Esports.&lt;/p&gt;"}]}
        lever = [{"text": "Director of Operations", "categories": {"location": "London", "commitment": "Full time"},
                  "hostedUrl": "https://lv/1", "createdAt": 1788000000000, "descriptionPlain": "Growth."}]
        ashby = {"jobs": [{"title": "AI Programme Manager", "location": "Remote - UK", "isRemote": True, "jobUrl": "https://ab/1",
                           "publishedAt": RECENT, "descriptionPlain": "Automation."}]}
        sr = {"content": [{"id": "9", "name": "Head of Operations", "location": {"city": "London", "country": "gb"}, "releasedDate": RECENT}]}
        http = FakeHttp({"https://boards-api.greenhouse.io/v1/boards/acme/jobs*": json.dumps(gh), "https://api.lever.co/v0/postings/acme*": json.dumps(lever),
                         "https://api.ashbyhq.com/posting-api/job-board/acme": json.dumps(ashby),
                         "https://api.smartrecruiters.com/v1/companies/acme/postings*": json.dumps(sr)})
        for kind, link in (("greenhouse", "https://gh/1"), ("lever", "https://lv/1"), ("ashby", "https://ab/1"), ("smartrecruiters", "https://jobs.smartrecruiters.com/acme/9")):
            jobs, status, note = scout.read_ats({"type": kind, "boards": [{"board": "acme", "company": "Acme"}]}, http)
            self.assertEqual((status, [j["link"] for j in jobs]), ("ok", [link]), kind)
            self.assertEqual(jobs[0]["company"], "Acme")
        self.assertEqual(scout.read_ats({"type": "greenhouse", "boards": []}, http)[1:], ("ok", "no company boards set yet (run `scout.py discover`)"))
        self.assertEqual(scout.read_ats({"type": "greenhouse", "boards": ["nope"]}, http)[1], "blocked")

    def test_reed_and_adzuna_need_keys_then_read_results(self):
        for k in ("REED_API_KEY", "ADZUNA_APP_ID", "ADZUNA_APP_KEY"):
            os.environ.pop(k, None)
        self.assertEqual(scout.read_reed({}, DEFN, FakeHttp({}))[1], "needs-key")
        self.assertEqual(scout.read_adzuna({}, DEFN, FakeHttp({}))[1], "needs-key")
        os.environ.update({"REED_API_KEY": "k", "ADZUNA_APP_ID": "i", "ADZUNA_APP_KEY": "k"})
        try:
            reed = {"results": [{"jobId": 1, "jobTitle": "Head of Esports Operations", "employerName": "Acme", "locationName": "London",
                                 "minimumSalary": 70000, "maximumSalary": 80000, "currency": "GBP", "date": "09/11/2026", "jobUrl": "https://reed/1", "jobDescription": "Esports"}]}
            jobs, status, _ = scout.read_reed({}, DEFN, FakeHttp({"https://www.reed.co.uk/api/1.0/search*": json.dumps(reed)}))
            self.assertEqual((status, len(jobs), jobs[0]["pay"], jobs[0]["posted"]), ("ok", 1, "£70,000 - £80,000", "09/11/2026"))
            self.assertEqual(scout.parse_date("09/11/2026"), date(2026, 11, 9))
            adz = {"results": [{"id": "7", "title": "Head of Esports Operations", "company": {"display_name": "Acme"}, "location": {"display_name": "London"},
                                "redirect_url": "https://az/7", "created": RECENT + "T08:00:00Z", "salary_min": 65000, "description": "Esports"}]}
            jobs, status, _ = scout.read_adzuna({}, DEFN, FakeHttp({"https://api.adzuna.com/v1/api/jobs/gb/search/1*": json.dumps(adz)}))
            self.assertEqual((status, len(jobs), jobs[0]["company"]), ("ok", 1, "Acme"))
        finally:
            for k in ("REED_API_KEY", "ADZUNA_APP_ID", "ADZUNA_APP_KEY"):
                os.environ.pop(k, None)


class EndToEnd(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        (self.dir / "tracker.json").write_text(json.dumps({"roles": [], "actions": [], "inbox": []}), encoding="utf-8")
        self.old = (scout.JOBS, scout.STATE, scout.SEARCH, os.environ.get("JOBS_DIR"))
        scout.JOBS, scout.STATE = self.dir, self.dir / "scout-state.json"
        os.environ["JOBS_DIR"] = str(self.dir)
        self.defn = {**DEFN, "sources": [
            {"id": "h", "name": "Hitmarker", "type": "sitemap", "url": "https://h/sitemap.xml"},
            {"id": "gh", "name": "Company hiring pages: Greenhouse", "type": "greenhouse", "boards": [{"board": "acme", "company": "Acme"}]},
            {"id": "reed", "name": "Reed", "type": "reed"},
            {"id": "li", "name": "LinkedIn Jobs", "type": "email"},
        ]}
        gh = {"jobs": [{"title": "Head of Esports Operations", "location": {"name": "London"}, "absolute_url": "https://gh/1", "first_published": RECENT, "content": "Esports"}]}
        self.routes = {"https://h/sitemap.xml": sitemap("https://h/jobs/acme-esports-programme-manager-104"), "https://h/jobs/*": PAGE,
                       "https://boards-api.greenhouse.io/v1/boards/acme/jobs*": json.dumps(gh)}
        for k in ("REED_API_KEY",):
            os.environ.pop(k, None)

    def tearDown(self):
        scout.JOBS, scout.STATE, scout.SEARCH, jobs_dir = self.old
        if jobs_dir is None:
            os.environ.pop("JOBS_DIR", None)
        else:
            os.environ["JOBS_DIR"] = jobs_dir
        shutil.rmtree(self.dir)

    def found(self):
        return json.loads((self.dir / "found.json").read_text(encoding="utf-8"))

    def test_a_run_queues_leads_logs_every_site_and_does_not_repeat_itself(self):
        lines = []
        summary = scout.run(self.defn, FakeHttp(self.routes), log=lines.append)
        found = self.found()
        self.assertEqual(sorted(i["company"] for i in found["items"]), ["Acme", "Acme Games"])
        item = next(i for i in found["items"] if i["company"] == "Acme Games")
        self.assertEqual((item["via"], item["track"], item["pay"]), ("feed", "Esports and gaming operations", "£70,000 - £85,000"))
        self.assertTrue(item["summary"])
        results = {name: (res, new) for name, res, _, new in summary}
        self.assertEqual(results, {"Hitmarker": ("ok", 1), "Company hiring pages: Greenhouse": ("ok", 1), "Reed": ("needs-key", 0)})
        self.assertEqual(set(found["sources"]), {"Hitmarker", "Company hiring pages: Greenhouse", "Reed"})  # email sources are Tim's
        self.assertEqual(found["sources"]["Reed"]["result"], "needs-key")
        self.assertEqual(found["sources"]["Reed"]["failures"], 1)
        # a second run adds nothing: the job page is remembered and the feed's job is a known duplicate
        again = scout.run(self.defn, FakeHttp(self.routes), log=lines.append)
        self.assertEqual(sum(new for *_, new in again), 0)
        self.assertEqual(len(self.found()["items"]), 2)
        self.assertEqual(self.found()["sources"]["Hitmarker"]["total"], 1)

    def test_dry_run_changes_nothing(self):
        lines = []
        scout.run(self.defn, FakeHttp(self.routes), dry=True, log=lines.append)
        self.assertFalse((self.dir / "found.json").exists())
        self.assertFalse(scout.STATE.exists())
        self.assertTrue(any("would queue" in line for line in lines))

    def test_an_unreachable_site_is_logged_as_blocked_and_the_rest_still_run(self):
        routes = {**self.routes, "https://h/sitemap.xml": scout.Unreachable("tunnel refused")}
        summary = scout.run(self.defn, FakeHttp(routes), log=lambda *_: None)
        self.assertEqual({n: r for n, r, *_ in summary}["Hitmarker"], "blocked")
        self.assertEqual(self.found()["sources"]["Hitmarker"]["result"], "blocked")
        self.assertEqual(len(self.found()["items"]), 1)  # the Greenhouse find

    def test_only_one_source(self):
        summary = scout.run(self.defn, FakeHttp(self.routes), only="Hitmarker", log=lambda *_: None)
        self.assertEqual([s[0] for s in summary], ["Hitmarker"])

    def test_discover_finds_boards_and_saves_them(self):
        search = self.dir / "search.json"
        defn = {**self.defn, "watch": [{"group": "G", "employers": ["Acme Games", "Nobody Ltd"]}],
                "sources": [{"id": "gh", "name": "GH", "type": "greenhouse", "boards": []}, {"id": "lv", "name": "LV", "type": "lever", "boards": []}]}
        search.write_text(json.dumps(defn), encoding="utf-8")
        scout.SEARCH = search
        http = FakeHttp({"https://boards-api.greenhouse.io/v1/boards/acmegames/jobs": json.dumps({"jobs": [{"id": 1}]}),
                         "https://api.lever.co/v0/postings/acme-games?mode=json": json.dumps([{"id": "x"}])})
        lines = []
        found = scout.discover(defn, http, save=True, log=lines.append)
        self.assertEqual({k: v[0]["board"] for k, v in found.items()}, {"greenhouse": "acmegames", "lever": "acme-games"})
        saved = json.loads(search.read_text(encoding="utf-8"))
        self.assertEqual(saved["sources"][0]["boards"], [{"board": "acmegames", "company": "Acme Games"}])


if __name__ == "__main__":
    unittest.main()
