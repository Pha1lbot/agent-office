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

    def test_a_track_switched_off_is_skipped(self):
        off = {**DEFN, "tracks": [{**DEFN["tracks"][0], "enabled": False}, DEFN["tracks"][1]]}
        item, _ = scout.judge(job(title="Head of Esports Operations", description="A growth scale-up in esports."), "Test", off, today=TODAY)
        self.assertEqual(item["track"], "Head of Operations at scale-ups")
        both = {**DEFN, "tracks": [{**t, "enabled": False} for t in DEFN["tracks"]]}
        self.assertEqual(scout.judge(job(), "Test", both, today=TODAY)[1], "no track matches")

    def test_a_track_can_require_its_sector_words(self):
        defn = {**DEFN, "tracks": [{"id": "pm", "name": "Project management", "priority": 1, "min_level": "manager", "require_keyword": True,
                                    "titles": ["Programme Manager"], "keywords": ["esports", "events"], "not": []}]}
        kept, _ = scout.judge(job(title="Programme Manager", description="A live events programme."), "Test", defn, today=TODAY)
        self.assertIsNotNone(kept)
        dropped, why = scout.judge(job(title="Programme Manager", description="Retail banking change."), "Test", defn, today=TODAY)
        self.assertEqual((dropped, why), (None, "no track matches"))


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
        self.last_url = url
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
        self.assertEqual(set(found["sources"]), {"Hitmarker", "Company hiring pages: Greenhouse", "Reed"})  # email sources are Hal's
        self.assertEqual(found["sources"]["Reed"]["result"], "needs-key")
        self.assertEqual(found["sources"]["Reed"]["failures"], 1)
        # a second run adds nothing: the job page is remembered and the feed's job is a known duplicate
        again = scout.run(self.defn, FakeHttp(self.routes), log=lines.append)
        self.assertEqual(sum(new for *_, new in again), 0)
        self.assertEqual(len(self.found()["items"]), 2)
        self.assertEqual(self.found()["sources"]["Hitmarker"]["total"], 1)

    def test_company_feed_jobs_get_a_longer_age_limit_and_are_not_queued_twice(self):
        old = (TODAY - timedelta(days=45)).isoformat()
        gh = {"jobs": [{"title": "Head of Esports Operations", "location": {"name": "London"}, "absolute_url": "https://gh/old",
                        "first_published": old, "content": "Esports"}]}
        http = FakeHttp({"https://boards-api.greenhouse.io/v1/boards/acme/jobs*": json.dumps(gh)})
        src = {"type": "greenhouse", "boards": [{"board": "acme", "company": "Acme"}]}
        jobs, _, _ = scout.read_ats(src, http)
        self.assertEqual(jobs[0]["max_age_days"], 60)
        item, why = scout.judge(jobs[0], "Test", DEFN, today=TODAY)
        self.assertEqual(why, "")  # 45 days old, but fine for a company feed
        self.assertEqual(scout.judge(job(posted=old), "Test", DEFN, today=TODAY)[1], "too old")  # not for a job board
        defn = {**self.defn, "sources": [{"id": "gh", "name": "GH", "type": "greenhouse", "boards": [{"board": "acme", "company": "Acme"}]}]}
        http = FakeHttp({"https://boards-api.greenhouse.io/v1/boards/acme/jobs*": json.dumps(gh)})
        first = scout.run(defn, http, log=lambda *_: None)
        self.assertEqual(first[0][3], 1)
        again = scout.run(defn, FakeHttp({"https://boards-api.greenhouse.io/v1/boards/acme/jobs*": json.dumps(gh)}), log=lambda *_: None)
        self.assertEqual(again[0][2], 0)  # remembered, so not even judged again

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


class RealDefinition(unittest.TestCase):
    """The project management track, judged against Tim's actual search.json."""

    def setUp(self):
        real = HERE.parent / "job-search" / "search.json"
        if not real.exists():
            self.skipTest("no search.json in this office")
        self.defn = json.loads(real.read_text(encoding="utf-8"))
        if not any(t["id"] == "project-programme" for t in self.defn.get("tracks", [])):
            self.skipTest("this office has no project track")

    def judge(self, title, desc, **kw):
        return scout.judge(job(title=title, description=desc, **kw), "Test", self.defn, today=TODAY)

    def test_senior_project_and_programme_roles_in_his_sectors_are_kept(self):
        for title, desc in [("Senior Project Manager", "Delivering esports tournaments across Europe."),
                            ("Programme Manager", "A live events programme for a football club."),
                            ("Head of PMO", "Gaming studio portfolio office."),
                            ("Delivery Manager", "AI automation delivery for a media group.")]:
            item, why = self.judge(title, desc)
            self.assertIsNotNone(item, (title, why))
            self.assertEqual(item["track"], "Project and programme management", title)

    def test_the_wrong_kind_or_level_of_project_role_is_left_out(self):
        for title, desc in [("Senior Project Manager", "Construction of a new office building."),
                            ("Project Manager", "Esports tournaments."),
                            ("Project Coordinator", "Events."),
                            ("Junior Project Manager", "Gaming."),
                            ("Senior Project Manager", "Retail banking systems change."),
                            ("Programme Manager", "Network infrastructure rollout for telecoms.")]:
            self.assertIsNone(self.judge(title, desc, company="Acme Ltd")[0], (title, desc))

    def test_an_esports_operations_title_still_goes_to_the_higher_track(self):
        item, _ = self.judge("Esports Programme Manager", "Run our esports league.")
        self.assertEqual(item["track"], "Esports and gaming operations")

    def test_reeds_first_real_results_that_were_noise_are_left_out(self):
        # Tim's first Reed dry run on 2026-11-12 listed these as fits. None belongs in his leads.
        noise = [("Account Director - Event Services", "Michael Page Sales", "London"),
                 ("Event Senior Director of Sales", "Live Recruitment", "EC2M1QS"),
                 ("Head of Marketing - Events", "Lipton Media", "EC1A1AA"),
                 ("Head of Operations", "Tiger Recruitment", "W1G0EF"),
                 ("Head of Service Operations", "SR2", "London"),
                 ("Head of Operations (Telecommunications)", "Rise Technical Recruitment Limited", "Slough"),
                 ("Head of Expert Network & Operations", "Inventum Group", "London"),
                 ("Head of IT Operations", "Red Dot Search UK Limited", "BL11RU"),
                 ("Technical Operations Director", "Teemz Ltd", "London"),
                 ("Interim Director of Operations", "TPP Recruitment", "London")]
        for title, company, loc in noise:
            item, why = self.judge(title, "A permanent role based in the city. Hybrid working.", company=company, location=loc)
            self.assertIsNone(item, (title, company))

    def test_london_postcodes_count_as_in_reach_and_recruiters_are_never_strong(self):
        item, why = self.judge("Head of Esports Operations", "Esports tournaments.", company="Acme Games", location="EC2M1QS")
        self.assertEqual((item["fit"], item["concern"]), ("strong", ""))
        item, why = self.judge("Head of Esports Operations", "Esports tournaments.", company="Tiger Recruitment", location="London")
        self.assertEqual(item["fit"], "possible")
        self.assertIn("recruiter", item["concern"])
        _, why = self.judge("Head of Esports Operations", "Esports. Hybrid, two days in the office.", company="Acme Games", location="BL11RU")
        self.assertEqual(why, "outside commute, not remote")


class ClosedPostings(unittest.TestCase):
    NOW = TODAY

    def page(self, text="", valid=None, title="Head of Esports Operations"):
        ld = ""
        if title:
            through = f', "validThrough": "{valid}"' if valid else ""
            ld = ('<script type="application/ld+json">{"@type": "JobPosting", "title": "%s", "datePosted": "%s", "hiringOrganization": {"name": "Acme"}%s}</script>' % (title, RECENT, through))
        return (200, f"<html><head>{ld}</head><body>{text}</body></html>".encode())

    def verdict(self, status_body, title="Head of Esports Operations", url="https://x/jobs/1"):
        status, body = status_body
        return scout.closed_reason(status, body, url, title, today=TODAY)

    def test_a_gone_page_a_closed_notice_and_a_passed_closing_date_are_closed(self):
        self.assertEqual(self.verdict((404, b""))[0], "closed")
        self.assertEqual(self.verdict((410, b""))[0], "closed")
        v, why = self.verdict(self.page("Sorry, this job is no longer available."))
        self.assertEqual(v, "closed"); self.assertIn("no longer available", why)
        self.assertEqual(self.verdict(self.page("No longer accepting applications"))[0], "closed")
        v, why = self.verdict(self.page("Apply now", valid=(TODAY - timedelta(days=3)).isoformat()))
        self.assertEqual((v, "closing date passed" in why), ("closed", True))
        self.assertEqual(self.verdict((200, b"<html>Nothing here</html>"), url="https://boards.greenhouse.io/acme?error=true")[0], "closed")

    def test_an_advert_that_is_still_there_is_open_and_scripts_dont_count(self):
        self.assertEqual(self.verdict(self.page("Apply now. Closing date soon.", valid=(TODAY + timedelta(days=10)).isoformat())), ("open", ""))
        self.assertEqual(self.verdict(self.page('<script>var msg = "this job has expired";</script>Apply now'))[0], "open")
        self.assertEqual(self.verdict((200, b"<html><body>Head of Esports Operations at Acme. Apply.</body></html>"), title="Head of Esports Operations")[0], "open")

    def test_a_block_or_a_login_wall_is_unknown_not_guessed(self):
        for res in [(403, b""), (429, b""), (500, b""), (200, b"<html><body>Sign in to view this job</body></html>")]:
            self.assertEqual(self.verdict(res)[0], "unknown", res)

    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.old = (scout.JOBS, os.environ.get("JOBS_DIR"))
        scout.JOBS = self.dir
        os.environ["JOBS_DIR"] = str(self.dir)

    def tearDown(self):
        scout.JOBS, jobs_dir = self.old
        if jobs_dir is None:
            os.environ.pop("JOBS_DIR", None)
        else:
            os.environ["JOBS_DIR"] = jobs_dir
        shutil.rmtree(self.dir)

    def roles(self, *roles):
        base = {"company": "Acme", "history": [], "notes": "", "found": "2026-11-01", "updated": "2026-11-01"}
        data = {"roles": [{**base, "title": "Head of Esports Operations", **r} for r in roles], "actions": [], "inbox": []}
        (self.dir / "tracker.json").write_text(json.dumps(data), encoding="utf-8")

    def tracker_data(self):
        return json.loads((self.dir / "tracker.json").read_text(encoding="utf-8"))

    def test_a_closed_lead_is_dismissed_and_a_closed_shortlisted_role_is_flagged_once(self):
        self.roles({"id": "lead", "status": "found", "url": "https://x/jobs/lead"}, {"id": "short", "status": "shortlisted", "url": "https://x/jobs/short"},
                   {"id": "open", "status": "found", "url": "https://x/jobs/open"}, {"id": "applied", "status": "applied", "url": "https://x/jobs/applied"},
                   {"id": "wall", "status": "found", "url": "https://x/jobs/wall"})
        http = FakeHttp({"https://x/jobs/lead": (404, b""), "https://x/jobs/short": self.page("This job has expired"), "https://x/jobs/open": self.page("Apply"),
                         "https://x/jobs/applied": (404, b""), "https://x/jobs/wall": (403, b"")})
        state = {}
        lines = []
        counts = scout.check_closed(http, self.dir / "tracker.json", state, today=TODAY, log=lines.append)
        self.assertEqual(counts, (1, 1, 1, 4))  # dismissed, flagged, unknown, opened (the applied role is never opened)
        data = self.tracker_data()
        by_id = {r["id"]: r for r in data["roles"]}
        self.assertEqual(by_id["lead"]["status"], "skipped")
        self.assertIn("Posting closed", by_id["lead"]["reason"])
        self.assertEqual(by_id["lead"]["history"][-1].get("by"), "ada")
        self.assertEqual((by_id["short"]["status"], by_id["open"]["status"], by_id["applied"]["status"], by_id["wall"]["status"]), ("shortlisted", "found", "applied", "found"))
        self.assertEqual(len(data["actions"]), 1)
        self.assertIn("Posting looks closed", data["actions"][0]["text"])
        self.assertEqual(data["actions"][0]["role"], "short")
        # a second pass the same day opens nothing and adds nothing
        again = scout.check_closed(FakeHttp({}), self.dir / "tracker.json", state, today=TODAY, log=lines.append)
        self.assertEqual(again[3], 0)
        self.assertEqual(len(self.tracker_data()["actions"]), 1)

    def test_a_site_that_disallows_robots_is_counted_not_opened(self):
        self.roles({"id": "li", "status": "found", "url": "https://www.linkedin.com/jobs/view/123/"}, {"id": "ok", "status": "found", "url": "https://x/jobs/ok"})
        http = FakeHttp({"https://x/jobs/*": self.page("Apply")})
        http.allowed = lambda url: "linkedin" not in url
        refused = {}
        counts = scout.check_closed(http, self.dir / "tracker.json", {}, today=TODAY, log=lambda *_: None, blocked=refused)
        self.assertEqual((counts[2], counts[3], refused), (1, 1, {"www.linkedin.com": 1}))
        self.assertNotIn("https://www.linkedin.com/jobs/view/123/", http.calls)

    def test_a_passed_closing_date_needs_no_page_and_the_check_is_limited(self):
        self.roles({"id": "late", "status": "found", "url": "", "closing_date": (TODAY - timedelta(days=2)).isoformat()},
                   *[{"id": f"r{i}", "status": "found", "url": f"https://x/jobs/{i}"} for i in range(5)])
        http = FakeHttp({"https://x/jobs/*": self.page("Apply")})
        counts = scout.check_closed(http, self.dir / "tracker.json", {}, today=TODAY, max_checks=3, log=lambda *_: None)
        self.assertEqual((counts[0], counts[3]), (1, 3))
        self.assertEqual({r["id"]: r["status"] for r in self.tracker_data()["roles"]}["late"], "skipped")


if __name__ == "__main__":
    unittest.main()
