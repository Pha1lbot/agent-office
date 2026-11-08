#!/usr/bin/env python3
"""Tests for fact_check.py. Run: python3 shared/tools/test_fact_check.py"""
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fact_check  # noqa: E402

BANK = """# CV text bank

Led a six-person department; 60+ events in 13 countries; 2,000+ freelancers; €12m+ in budgets.
Contact: tim@example.com

### Head of Operations, Acme Events (Jun 2023 – Oct 2026)

- Ran operations

### Production Manager, Studio Co, Leicester (Jul 2015 – Dec 2017)

*Earlier: Technician, Studio Co (Mar 2010 – Jan 2011).*

## Certifications

| Certification | Year |
|---|---|
| First Aid at Work | 2022 |
| IPAF | 2012 |
"""

GOOD_CV = """# Tim

tim@example.com

## Profile
Led a 6-person department: more than 2,000 freelancers and €12 million in budgets across 60 events.

## Experience
### Head of Operations, Acme Events (Jun 2023 – Oct 2026)
- Ran operations

### Studio Co · Jul 2015 – Dec 2017
**Production Manager** · Jul 2015 – Dec 2017 (Leicester)

*Earlier: Technician at Studio Co (2010 – 2011).*

## Certifications
| Certification | Year |
|---|---|
| First Aid at Work | 2022 |
"""


class FactCheck(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "cv").mkdir()
        (self.tmp / "cv" / "cv-bank.md").write_text(BANK, encoding="utf-8")
        self.role = self.tmp / "jobs" / "roles" / "r1"
        self.role.mkdir(parents=True)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def check(self, cv=GOOD_CV, letter=None, listing=None):
        (self.role / "cv.md").write_text(cv, encoding="utf-8")
        if letter is not None:
            (self.role / "cover-letter.md").write_text(letter, encoding="utf-8")
        if listing is not None:
            (self.role / "listing.md").write_text(listing, encoding="utf-8")
        return fact_check.check(self.role, fact_check.Bank(self.tmp / "cv"))

    def test_true_cv_in_a_different_layout_passes(self):
        self.assertEqual(self.check(), [])

    def test_invented_figure(self):
        problems = self.check(GOOD_CV.replace("2,000", "3,000"))
        self.assertEqual(len(problems), 1)
        self.assertIn('"3,000" isn\'t in the CV bank', problems[0])

    def test_wrong_currency_names_what_the_bank_says(self):
        problems = self.check(GOOD_CV.replace("€12 million", "£12m"))
        self.assertEqual(len(problems), 1)
        self.assertIn('The bank has "€12m"', problems[0])

    def test_figure_from_the_advert_is_marked(self):
        letter = "I'd enjoy running your £1.5m events budget."
        problems = self.check(letter=letter, listing="- Pay: £60k\n- Budget: £1.5m")
        self.assertEqual(len(problems), 1)
        self.assertIn("It's in the advert", problems[0])

    def test_changed_job_title_employer_or_date(self):
        problems = self.check(GOOD_CV.replace("Head of Operations, Acme", "Director of Operations, Acme"))
        self.assertTrue(any('"Director of Operations"' in p for p in problems), problems)
        problems = self.check(GOOD_CV.replace("Acme Events (Jun 2023", "Acme Events (Jan 2022"))
        self.assertTrue(any('"Jan 2022"' in p for p in problems), problems)
        problems = self.check(GOOD_CV.replace("Head of Operations, Acme Events", "Head of Operations, Mega Corp"))
        self.assertTrue(any('"Mega Corp"' in p for p in problems), problems)

    def test_certifications(self):
        problems = self.check(GOOD_CV.replace("| First Aid at Work | 2022 |", "| First Aid at Work | 2018 |"))
        self.assertTrue(any("differs from the CV bank" in p for p in problems), problems)
        problems = self.check(GOOD_CV + "| NEBOSH General Certificate | 2020 |\n")
        self.assertTrue(any('"nebosh general certificate" isn\'t in the CV bank' in p for p in problems), problems)

    def test_qualifications_and_emails(self):
        letter = "I hold a degree in event management and PRINCE2. Write to tim@other.com."
        problems = self.check(letter=letter)
        self.assertEqual(len(problems), 3, problems)
        # ...but common words that aren't claims are fine
        self.assertEqual(self.check(letter="A high degree of care. Happy to fly BA."), [])

    def test_notes_section_is_added_replaced_and_removed(self):
        notes = self.role / "notes.md"
        notes.write_text("# Questions for Tim\n\n- Any US experience?\n", encoding="utf-8")
        fact_check.write_notes(self.role, ["cv.md: one"])
        fact_check.write_notes(self.role, ["cv.md: two"])
        text = notes.read_text(encoding="utf-8")
        self.assertIn("- Any US experience?", text)
        self.assertEqual(text.count(fact_check.SECTION), 1)
        self.assertIn("cv.md: two", text)
        self.assertNotIn("cv.md: one", text)
        fact_check.write_notes(self.role, [])
        self.assertEqual(notes.read_text(encoding="utf-8"), "# Questions for Tim\n\n- Any US experience?\n")

    def test_notes_file_made_only_for_problems(self):
        notes = self.role / "notes.md"
        fact_check.write_notes(self.role, [])
        self.assertFalse(notes.exists())
        fact_check.write_notes(self.role, ["cv.md: one"])
        self.assertTrue(notes.exists())
        fact_check.write_notes(self.role, [])
        self.assertFalse(notes.exists())  # it only held Ada's section

    def test_report_writes_notes_then_clears_them_once_fixed(self):
        run = lambda: fact_check.report("r1", jobs=self.tmp / "jobs", bank_dir=self.tmp / "cv")
        (self.role / "cv.md").write_text(GOOD_CV + "\nWorked in 14 countries.\n", encoding="utf-8")
        self.assertEqual(len(run()), 1)
        self.assertIn('"14"', (self.role / "notes.md").read_text(encoding="utf-8"))
        (self.role / "cv.md").write_text(GOOD_CV + "\nWorked in 13 countries.\n", encoding="utf-8")
        self.assertEqual(run(), [])
        self.assertFalse((self.role / "notes.md").exists())


if __name__ == "__main__":
    unittest.main()
