"""Tests for tracker.py's inbox and action rules. Run: python3 shared/tools/test_tracker.py"""
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TRACKER = Path(__file__).with_name("tracker.py")


class TrackerTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.env = {**os.environ, "JOBS_DIR": self.dir}
        self.run_t("add", "--id", "acme", "--title", "Ops Lead", "--company", "Acme")

    def run_t(self, *args):
        out = subprocess.run([sys.executable, str(TRACKER), *args], env=self.env, capture_output=True, text=True)
        self.assertEqual(out.returncode, 0, out.stderr)
        return out.stdout.strip()

    def waiting(self):
        out = self.run_t("inbox", "list")
        return [] if out == "Inbox empty" else out.splitlines()

    def test_tailor_request_then_shortlist_queues_wren_once(self):
        self.run_t("inbox", "add", "--role", "acme", "--task", "Draft a tailored CV and cover letter: bring out budgets")
        self.run_t("set", "acme", "status=shortlisted", "--by", "tim")
        self.assertEqual(len(self.waiting()), 1)

    def test_moving_back_to_leads_cancels_drafting(self):
        self.run_t("set", "acme", "status=shortlisted", "--by", "tim")
        self.assertEqual(len(self.waiting()), 1)
        self.run_t("set", "acme", "status=found", "--by", "tim")
        self.assertEqual(self.waiting(), [])

    def test_applying_always_sets_a_follow_up_and_keeps_the_old_next_step(self):
        import json
        self.run_t("set", "acme", "next=Long shot; apply if the pay suits")
        self.run_t("set", "acme", "status=applied")
        role = json.loads(self.run_t("show", "acme"))
        self.assertTrue(role["next"].startswith("Follow up if no reply by "), role["next"])
        self.assertIn("Before applying: Long shot; apply if the pay suits", role["notes"])

    def test_applying_drops_an_apply_note_and_respects_a_next_step_given_with_it(self):
        import json
        self.run_t("set", "acme", "next=Apply today: closes Friday")
        self.run_t("set", "acme", "status=applied")
        role = json.loads(self.run_t("show", "acme"))
        self.assertTrue(role["next"].startswith("Follow up if no reply by "))
        self.assertNotIn("Before applying", role.get("notes") or "")
        self.run_t("add", "--id", "beta", "--title", "Ops Head", "--company", "Beta")
        self.run_t("set", "beta", "status=applied", "next=Call Sam on Monday")
        self.assertEqual(json.loads(self.run_t("show", "beta"))["next"], "Call Sam on Monday")

    def test_coverage_log_counts_each_site_and_flags_failures(self):
        import json
        self.run_t("found", "run", "--via", "feed", "--found", "3", "--source", "Hitmarker", "--result", "ok")
        self.run_t("found", "run", "--via", "feed", "--found", "2", "--source", "Hitmarker")
        self.run_t("found", "run", "--via", "feed", "--found", "0", "--source", "Reed", "--result", "needs-key", "--note", "add REED_API_KEY")
        self.run_t("found", "run", "--via", "web", "--found", "0", "--source", "Reed", "--result", "needs-key")
        found = json.loads((Path(self.dir) / "found.json").read_text(encoding="utf-8"))
        self.assertEqual((found["sources"]["Hitmarker"]["total"], found["sources"]["Hitmarker"]["result"], found["sources"]["Hitmarker"]["failures"]), (5, "ok", 0))
        self.assertEqual((found["sources"]["Reed"]["result"], found["sources"]["Reed"]["failures"]), ("needs-key", 2))
        table = self.run_t("found", "sources")
        self.assertIn("Hitmarker | checked", table)
        self.assertIn("total 5", table)
        self.assertIn("needs-key", table)

    def test_feed_finds_keep_their_track_and_summary_and_take_as_leads(self):
        import json
        path = Path(self.dir) / "items.json"
        path.write_text(json.dumps([{"title": "Head of Ops", "company": "Beta", "link": "https://b/1", "fit": "strong", "track": "Esports and gaming operations",
                                      "summary": "Run tournaments", "via": "feed", "source": "Hitmarker"}]), encoding="utf-8")
        self.assertIn("added 1", self.run_t("found", "add", "--file", str(path), "--via", "feed"))
        found = json.loads((Path(self.dir) / "found.json").read_text(encoding="utf-8"))
        self.assertEqual((found["items"][0]["via"], found["items"][0]["track"], found["items"][0]["summary"]), ("feed", "Esports and gaming operations", "Run tournaments"))
        role_id = self.run_t("found", "take", found["items"][0]["id"], "--as", "lead")
        role = json.loads(self.run_t("show", role_id))
        self.assertEqual(role["source"], "Hitmarker")
        self.assertIn("Track: Esports and gaming operations", role["notes"])

    def test_a_question_with_options_is_answered_once_and_goes_to_the_inbox(self):
        import json
        aid = self.run_t("action", "add", "Raise the pay floor to", "55k?", "--options", "Accept|Decline")
        self.assertIn("[options: Accept | Decline]", self.run_t("action", "list"))
        self.assertIn(aid + ": Accept", self.run_t("action", "answer", aid, "accept"))
        data = json.loads((Path(self.dir) / "tracker.json").read_text(encoding="utf-8"))
        action = next(a for a in data["actions"] if a["id"] == aid)
        self.assertEqual((action["done"], action["answer"]), (True, "Accept"))
        self.assertEqual(self.waiting()[0].split(" | ")[2], "Answer to a question: Raise the pay floor to 55k? Answer: Accept")
        out = subprocess.run([sys.executable, str(TRACKER), "action", "answer", aid, "Decline"], env=self.env, capture_output=True, text=True)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn("already answered", out.stderr)

    def test_answers_must_be_one_of_the_options(self):
        aid = self.run_t("action", "add", "Keep BLAST out?", "--options", "Yes|No")
        out = subprocess.run([sys.executable, str(TRACKER), "action", "answer", aid, "Maybe"], env=self.env, capture_output=True, text=True)
        self.assertNotEqual(out.returncode, 0)
        plain = self.run_t("action", "add", "Call the recruiter")
        out = subprocess.run([sys.executable, str(TRACKER), "action", "answer", plain, "Yes"], env=self.env, capture_output=True, text=True)
        self.assertIn("not a question", out.stderr)
        out = subprocess.run([sys.executable, str(TRACKER), "action", "add", "One option only", "--options", "Yes"], env=self.env, capture_output=True, text=True)
        self.assertIn("2 to 6 choices", out.stderr)

    def test_a_question_about_a_role_sends_its_answer_to_that_role(self):
        aid = self.run_t("action", "add", "Draft for Acme?", "--role", "acme", "--options", "Yes|No")
        self.run_t("action", "answer", aid, "Yes")
        line = self.waiting()[0].split(" | ")
        self.assertEqual(line[1], "acme")

    def test_a_general_change_can_go_to_the_inbox_without_a_role(self):
        self.assertTrue(self.run_t("inbox", "add", "--task", "Update preferences.md to match search.json").startswith("i"))
        self.assertEqual(self.run_t("inbox", "add", "--task", "Update preferences.md to match search.json"), "Already waiting")
        self.assertEqual(self.waiting()[0].split(" | ")[1], "")

    def test_action_done_and_reopen(self):
        aid = self.run_t("action", "add", "Call the recruiter")
        self.run_t("action", "done", aid)
        self.assertIn("| done |", self.run_t("action", "list", "--all"))
        self.run_t("action", "reopen", aid)
        self.assertIn("| todo |", self.run_t("action", "list"))


    def finds(self, items):
        path = Path(self.dir) / "finds.json"
        path.write_text(__import__("json").dumps(items))
        return self.run_t("found", "add", "--file", str(path))

    def test_found_add_skips_duplicates(self):
        out = self.finds([
            {"title": "Head of Events", "company": "Beta", "link": "https://x.test/1", "fit": "strong", "why": "Fits"},
            {"title": "head of events", "company": "BETA ", "fit": "weak"},  # same company and title
            {"title": "Ops Lead", "company": "Acme"},  # already in the tracker
            {"title": "Other", "company": "Gamma", "link": "https://x.test/1"},  # same link
            {"title": "", "company": "No title"},
        ])
        self.assertEqual(out, "added 1, skipped 4 (already known or incomplete)")
        self.assertIn("added 0, skipped 1", self.finds([{"title": "Head of Events", "company": "Beta"}]))

    def test_found_take_as_lead_and_dismissed(self):
        self.finds([{"title": "Head of Events", "company": "Beta", "fit": "strong", "why": "Live events, London"},
                    {"title": "Junior Runner", "company": "Delta", "fit": "weak", "pay": "£24k"}])
        lead = self.run_t("found", "take", "f1", "--as", "lead")
        gone = self.run_t("found", "take", "f2", "--as", "dismissed", "--reason", "Tim: pay under £50k")
        data = __import__("json").loads((Path(self.dir) / "tracker.json").read_text())
        roles = {r["id"]: r for r in data["roles"]}
        self.assertEqual((roles[lead]["status"], roles[lead]["verdict"], roles[lead]["fit"]), ("found", "apply", 4))
        self.assertEqual(roles[lead]["history"][0]["by"], "cass")
        self.assertTrue(roles[lead]["priority"])  # ranked with the other leads
        self.assertEqual((roles[gone]["status"], roles[gone]["verdict"], roles[gone]["reason"]), ("skipped", "skip", "Tim: pay under £50k"))
        self.assertEqual(self.run_t("found", "list", "--pending"), "")
        out = subprocess.run([sys.executable, str(TRACKER), "found", "take", "f1", "--as", "lead"], env=self.env, capture_output=True, text=True)
        self.assertNotEqual(out.returncode, 0)  # can't take twice


class PayBandTests(unittest.TestCase):
    """New roles are ranked by pay using the figures in shared/job-search/settings.json."""

    def rank_with(self, settings):
        sys.path.insert(0, str(TRACKER.parent))
        import tracker
        repo = Path(tempfile.mkdtemp())
        (repo / "shared" / "job-search").mkdir(parents=True)
        if settings is not None:
            (repo / "shared" / "job-search" / "settings.json").write_text(settings, encoding="utf-8")
        old = tracker.REPO
        tracker.REPO = repo
        try:
            roles = [{"id": name, "status": "found", "fit": 3, "pay": pay, "found": "2026-11-01"}
                     for name, pay in [("low", "\u00a330k"), ("mid", "\u00a345k"), ("high", "\u00a360k")]]
            data = {"roles": roles}
            tracker.rank(data)
            return [r["id"] for r in sorted(roles, key=lambda r: r["priority"])]
        finally:
            tracker.REPO = old

    def test_bands_come_from_settings(self):
        self.assertEqual(self.rank_with('{"ideal_pay": 55000, "minimum_pay": 40000}'), ["high", "mid", "low"])
        self.assertEqual(self.rank_with('{"ideal_pay": 40000, "minimum_pay": 25000}'), ["mid", "high", "low"])  # mid and high tie, so list order

    def test_missing_or_blank_settings_just_skip_the_pay_bands(self):
        for settings in (None, "{not json", '{"ideal_pay": null, "minimum_pay": null}'):
            self.assertEqual(len(self.rank_with(settings)), 3)


if __name__ == "__main__":
    unittest.main()
