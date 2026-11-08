"""Tests for the CV template and Ada's document steps. Run: python3 shared/tools/test_cv_template.py

The PDF tests need Chrome, Chromium or Edge (and LibreOffice for the Word-edit test);
they are skipped where those aren't installed.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))
import cv_template  # noqa: E402
import fact_check  # noqa: E402
import make_docs  # noqa: E402

BASE = json.loads(cv_template.BASE.read_text(encoding="utf-8"))
HAS_BROWSER = bool(cv_template.find_browser())
HAS_PANDOC = bool(shutil.which("pandoc"))


class ContentTests(unittest.TestCase):
    def write(self, data):
        path = Path(tempfile.mkdtemp()) / "cv.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def test_role_content_lays_over_the_base_but_never_the_contact_details(self):
        data = cv_template.load_content(self.write({
            "headline": "Live Events Lead", "contact": {"email": "wrong@example.com"}, "name": "Someone"}))
        self.assertEqual(data["headline"], "Live Events Lead")
        self.assertEqual(data["contact"]["email"], "your.name@example.com")
        self.assertEqual(data["contact"]["linkedin"], "linkedin.com/in/your-name")
        self.assertEqual(data["name"], "Your Name")
        self.assertEqual(data["jobs"], BASE["jobs"])  # left out, so from the base

    def test_bad_content_gives_a_plain_reason(self):
        for bad, why in [({"stats": [{"value": "1"}]}, "value and label"),
                         ({"jobs": []}, "non-empty"),
                         ({"jobs": [{"title": "X", "company": "Y"}]}, "dates"),
                         ({"stats": [{"value": "1", "label": "x"}] * 6}, "at most 5")]:
            with self.assertRaises(cv_template.ContentError) as error:
                cv_template.load_content(self.write(bad))
            self.assertIn(why, str(error.exception))
        path = Path(tempfile.mkdtemp()) / "cv.json"
        path.write_text("{not json", encoding="utf-8")
        with self.assertRaises(cv_template.ContentError):
            cv_template.load_content(path)

    def test_base_cv_as_text_passes_the_fact_check(self):
        text = cv_template.to_markdown(cv_template.load_content())
        self.assertIn("### Your Latest Job Title, Company Name (Jan 2022 – Present)", text)
        self.assertIn("| Your first certification | 2024 |", text)
        self.assertIn("References available on request.", text)
        folder = Path(tempfile.mkdtemp())
        (folder / "cv.md").write_text(text, encoding="utf-8")
        self.assertEqual(fact_check.check(folder, fact_check.Bank(fact_check.BANK_DIR)), [])

    def test_html_escapes_text_and_splits_jobs_over_two_pages(self):
        data = cv_template.load_content(self.write({"profile": "Budgets <b>& teams</b>"}))
        page = cv_template.cv_html(data)
        self.assertIn("Budgets &lt;b&gt;&amp; teams&lt;/b&gt;", page)
        self.assertEqual(page.count("class='page"), 2)
        self.assertEqual(page.count("class='job'"), len(BASE["jobs"]))

    def test_letter_drops_its_own_header_and_keeps_paragraphs(self):
        body = cv_template.letter_body("# Your Name\n\nyour.name@example.com · 07700 900000\n\n"
                                       "Dear Ms Smith,\n\nI am **keen** on this.\n\nYours sincerely,\nYour Name")
        self.assertTrue(body.startswith("<p>Dear Ms Smith,</p>"))
        self.assertIn("<strong>keen</strong>", body)
        self.assertIn("Yours sincerely,<br>Your Name", body)


class NameTests(unittest.TestCase):
    def test_file_names(self):
        self.assertEqual(make_docs.pdf_name("Senior Manager, Admin & Operations – Football Schools", "cv"),
                         "Your_Name_Senior_Manager_Admin_and_Operations_Football_Schools_cv.pdf")
        self.assertEqual(make_docs.pdf_name("Producer", "cover-letter"), "Your_Name_Producer_cover_letter.pdf")
        self.assertEqual(make_docs.file_title("Head of Esports (Co-ordinator) / Café"), "Head_of_Esports_Co-ordinator_Cafe")


@unittest.skipUnless(HAS_BROWSER and HAS_PANDOC, "needs Chrome/Edge and pandoc")
class MakeDocsTests(unittest.TestCase):
    ROLE = "acme-producer"

    def setUp(self):
        self.jobs = Path(tempfile.mkdtemp())
        (self.jobs / "tracker.json").write_text(json.dumps({"roles": [
            {"id": self.ROLE, "title": "Live Producer", "company": "Acme"}]}), encoding="utf-8")
        self.folder = self.jobs / "roles" / self.ROLE
        self.folder.mkdir(parents=True)
        (self.folder / "cv.json").write_text(json.dumps({"headline": "Live Events Producer"}), encoding="utf-8")
        (self.folder / "cover-letter.md").write_text("Dear Hiring Manager,\n\nHello.\n\nYours sincerely,\n\nYour Name",
                                                     encoding="utf-8")
        self.env = {**os.environ, "JOBS_DIR": str(self.jobs)}

    def run_m(self, *args, ok=True):
        out = subprocess.run([sys.executable, str(TOOLS / "make_docs.py"), *args], env=self.env,
                             capture_output=True, text=True, timeout=300)
        if ok:
            self.assertEqual(out.returncode, 0, out.stderr + out.stdout)
        return out

    def test_draft_makes_text_word_and_named_pdfs(self):
        self.run_m(self.ROLE)
        names = {p.name for p in self.folder.iterdir()}
        for name in ["cv.md", "cv.docx", "cover-letter.docx", "Your_Name_Live_Producer_cv.pdf",
                     "Your_Name_Live_Producer_cover_letter.pdf", ".ada-built.json"]:
            self.assertIn(name, names)
        self.assertTrue((self.folder / "cv.md").read_text(encoding="utf-8").startswith(make_docs.GENERATED))
        self.assertEqual(cv_template.page_count(self.folder / "Your_Name_Live_Producer_cv.pdf"), 2)
        self.assertEqual(cv_template.page_count(self.folder / "Your_Name_Live_Producer_cover_letter.pdf"), 1)

    def test_a_new_job_title_replaces_the_old_pdfs(self):
        self.run_m(self.ROLE)
        (self.jobs / "tracker.json").write_text(json.dumps({"roles": [
            {"id": self.ROLE, "title": "Senior Live Producer", "company": "Acme"}]}), encoding="utf-8")
        self.run_m("--pdf", self.ROLE)
        pdfs = sorted(p.name for p in self.folder.glob("*.pdf"))
        self.assertEqual(pdfs, ["Your_Name_Senior_Live_Producer_cover_letter.pdf",
                                "Your_Name_Senior_Live_Producer_cv.pdf"])

    def test_a_word_file_tim_edited_is_not_overwritten(self):
        self.run_m(self.ROLE)
        with open(self.folder / "cv.docx", "ab") as f:
            f.write(b"\0")  # any change counts
        out = self.run_m(self.ROLE, ok=False)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn("edited cv.docx", out.stderr)
        self.run_m("--force", self.ROLE)

    def test_bad_cv_json_stops_with_a_reason(self):
        (self.folder / "cv.json").write_text(json.dumps({"jobs": []}), encoding="utf-8")
        out = self.run_m(self.ROLE, ok=False)
        self.assertIn("cv.json can't be used", out.stderr)


if __name__ == "__main__":
    unittest.main()
