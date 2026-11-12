"""Tests for sync_artifact.py. Run: python3 shared/tools/test_sync_artifact.py"""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).parent


class SyncTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.env = {**os.environ, "JOBS_DIR": self.dir}
        self.t("add", "--id", "acme", "--title", "Ops Lead", "--company", "Acme")
        self.t("action", "add", "Raise the pay floor?", "--options", "Accept|Decline")
        self.t("action", "add", "Check the advert")
        Path(self.dir, "found.json").write_text(json.dumps({"items": [
            {"id": "f1", "title": "Head of Ops", "company": "X"},
            {"id": "f2", "title": "Done one", "company": "Y", "triage": {"action": "added"}}],
            "sources": {"Hitmarker": {"last_checked": "2026-11-12T09:00", "result": "ok", "found": 2}}}))

    def t(self, *a):
        return self.run_s("tracker.py", *a)

    def run_s(self, script, *a):
        p = subprocess.run([sys.executable, str(TOOLS / script), *a], env=self.env, capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stderr)
        return p.stdout.strip()

    def test_export_shows_open_questions_leads_and_sources(self):
        snap = json.loads(self.run_s("sync_artifact.py", "export"))
        self.assertEqual([a["id"] for a in snap["actions"]], ["a1", "a2"])
        self.assertEqual(snap["actions"][0]["options"], ["Accept", "Decline"])
        self.assertEqual([x["id"] for x in snap["leads"]], ["f1"])
        self.assertEqual(snap["sources"][0]["name"], "Hitmarker")
        self.assertEqual([r["id"] for r in snap["roles"]], ["acme"])

    def test_apply_answers_and_done_then_is_safe_to_repeat(self):
        f = Path(self.dir, "phone.json")
        f.write_text(json.dumps({"answers": {"a1": {"answer": "Accept"}, "a9": {"answer": "Accept"}}, "done": {"a2": {}}}))
        out = self.run_s("sync_artifact.py", "apply", str(f))
        self.assertIn("applied a1: answered Accept", out)
        self.assertIn("applied a2: marked done", out)
        self.assertIn("skipped a9: no such action", out)
        again = self.run_s("sync_artifact.py", "apply", str(f))
        self.assertNotIn("applied", again)
        self.assertIn("a1: already handled", again)
        snap = json.loads(self.run_s("sync_artifact.py", "export"))
        self.assertEqual(snap["actions"], [])

    def test_bad_answer_is_skipped_not_fatal(self):
        f = Path(self.dir, "phone.json")
        f.write_text(json.dumps({"answers": {"a1": {"answer": "Maybe"}}}))
        self.assertIn("skipped a1:", self.run_s("sync_artifact.py", "apply", str(f)))


if __name__ == "__main__":
    unittest.main()
