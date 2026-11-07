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

    def test_action_done_and_reopen(self):
        aid = self.run_t("action", "add", "Call the recruiter")
        self.run_t("action", "done", aid)
        self.assertIn("| done |", self.run_t("action", "list", "--all"))
        self.run_t("action", "reopen", aid)
        self.assertIn("| todo |", self.run_t("action", "list"))


if __name__ == "__main__":
    unittest.main()
