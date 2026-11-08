#!/usr/bin/env python3
"""Ada's fact check: is everything in a tailored CV and cover letter in Hal's CV bank?

Usage:
  python3 shared/tools/fact_check.py <role-id> [<role-id> ...]
  python3 shared/tools/fact_check.py --all

Compares jobs/roles/<role-id>/cv.md and cover-letter.md with
shared/job-search/cv/cv-bank.md (plus any extra-*.md files beside it):
- figures (numbers, money, percentages, years) must be in the bank
- job headings in the CV (### lines: title, employer, dates) must match the bank
- certifications listed in the CV must be in the bank, with the same year
- email addresses must be in the bank
- well-known qualifications (degrees, PRINCE2, CIPD...) must be in the bank

Anything not found goes into a "## Fact check (Ada)" section at the end of the
role's notes.md, which the role page shows, and is printed. A clean check takes
that section out again. It never changes the CV or letter: Hal decides.

make_docs.py runs this every time it builds Word files. Costs no tokens.
Set JOBS_DIR to use a different jobs folder. Exits with 1 if anything was found.
"""
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
JOBS = Path(os.environ.get("JOBS_DIR", REPO / "jobs"))
BANK_DIR = REPO / "shared" / "job-search" / "cv"
DOCS = ["cv.md", "cover-letter.md"]
SECTION = "## Fact check (Ada)"

MULTIPLIERS = {"k": 1e3, "thousand": 1e3, "m": 1e6, "million": 1e6, "bn": 1e9, "billion": 1e9}
CURRENCIES = {"£": "£", "gbp": "£", "€": "€", "eur": "€", "$": "$", "usd": "$"}
NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
                "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
                "eighteen", "nineteen", "twenty"]
FIGURE = re.compile(
    r"(?<![\w.])(?P<cur>[£€$]|(?:GBP|EUR|USD)\s?)?"
    r"(?P<num>\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)"
    r"(?:\s?(?P<mult>k|m|bn|thousand|million|billion)\b)?"
    r"(?P<pct>\s?%|\s?per\s?cent)?"
    r"(?![A-Za-z0-9])",
    re.IGNORECASE,
)
EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
LINK = re.compile(r"(?:https?://|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|co\.uk|org|net|io)(?:/\S*)?", re.IGNORECASE)
# Qualifications a CV might claim. Narrow on purpose: "BA" could be British
# Airways and "a high degree of" isn't a degree.
QUALIFICATIONS = [
    (r"\b(?:[Bb]achelor|[Mm]aster)'?s(?: degree)?\b|\bdegree in\b|\buniversity degree\b", "a degree"),
    (r"\bBSc\b", "BSc"), (r"\bMSc\b", "MSc"), (r"\bMBA\b", "MBA"), (r"\bPhD\b", "PhD"),
    (r"\bPRINCE ?2\b", "PRINCE2"), (r"\bPMP\b", "PMP"), (r"\bCIPD\b", "CIPD"), (r"\bNEBOSH\b", "NEBOSH"),
    (r"\bIOSH\b", "IOSH"), (r"\bITIL\b", "ITIL"), (r"\bSix Sigma\b", "Six Sigma"), (r"\bACCA\b", "ACCA"),
    (r"\bCIMA\b", "CIMA"), (r"\bScrum Master\b", "Scrum Master"),
    (r"\bChartered (?:Manager|Accountant|Institute|Member|Engineer)\b", "a chartered title"),
]
CERT_HEADINGS = ("certification", "qualification", "training", "education", "licence", "license")
MONTH = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?"
DATE = re.compile(rf"\b{MONTH} \d{{4}}\b|\b(?:19|20)\d{{2}}\b", re.IGNORECASE)
# Words that join the parts of a job heading but aren't facts themselves.
FILLER = {"earlier", "later", "then", "until", "till", "to", "from", "since", "and", "present", "now",
          "current", "today", "at", "in", "of", "the", "with", "alongside"}


def flat(text):
    """Lower case, one space between words, one kind of dash, no markdown emphasis."""
    text = text.replace("*", "").replace("_", " ")
    text = re.sub(r"[‐-―−-]", "-", text)
    return re.sub(r"\s+", " ", text).strip().strip(".").lower()


def figures(text):
    """(shown as, currency, value, percent) for each figure, ignoring links and emails."""
    text = LINK.sub(" ", EMAIL.sub(" ", text))
    found = []
    for m in FIGURE.finditer(text):
        value = float(m["num"].replace(",", ""))
        if m["mult"]:
            value *= MULTIPLIERS[m["mult"].lower()]
        currency = CURRENCIES.get((m["cur"] or "").strip().lower(), "")
        found.append((m.group(0).strip(), currency, value, bool(m["pct"])))
    return found


def show(value):
    return f"{value:,.0f}" if value == int(value) else f"{value:,}"


def month_date(text):
    """'January 2020' and 'Jan 2020' both become 'jan 2020'."""
    words = text.lower().replace(".", "").split()
    return f"{words[0][:3]} {words[1]}" if len(words) == 2 else words[0]


def heading_parts(line):
    """The facts in a job heading: its dates, and the other parts between separators."""
    text = line.strip().lstrip("#").replace("*", "").strip()
    dates = [month_date(d) for d in DATE.findall(text)]
    rest = DATE.sub(" ", text)
    parts = []
    splitter = r"\s*[,·|()/:;]\s*|\s+[-–—]\s+|\s*[–—]\s*|\s+(?:at|until|till|to|from|since|then)\s+"
    for part in re.split(splitter, rest, flags=re.IGNORECASE):
        words = part.strip(" .-–—").split()
        while words and words[0].lower() in FILLER:
            words.pop(0)
        while words and words[-1].lower() in FILLER:
            words.pop()
        if words:
            parts.append(" ".join(words))
    return dates, parts


def table_rows(lines):
    rows = []
    for line in lines:
        s = line.strip()
        if s.startswith("|") and not re.fullmatch(r"[|\s:-]+", s):
            rows.append(tuple(flat(c) for c in s.strip("|").split("|")))
    return rows


def cert_lines(text):
    """Table rows and bullets under a certifications-style ## heading."""
    rows, bullets, inside = [], [], False
    lines = text.splitlines()
    for line in lines:
        if line.startswith("## "):
            inside = any(word in line.lower() for word in CERT_HEADINGS)
            continue
        if inside and line.strip().startswith("|"):
            rows.append(line)
        elif inside and re.match(r"\s*[-*] ", line):
            bullets.append(re.sub(r"^\s*[-*] ", "", line))
    table = table_rows(rows)
    if table and table[0][0] in ("certification", "qualification", "course"):
        table = table[1:]  # the header row
    return table, bullets


class Bank:
    def __init__(self, folder):
        texts = []
        for path in [folder / "cv-bank.md", *sorted(folder.glob("extra-*.md"))]:
            if path.exists():
                texts.append(path.read_text(encoding="utf-8"))
        if not texts:
            sys.exit(f"No CV bank found in {folder}")
        self.text = "\n".join(texts)
        self.flat = flat(self.text)
        self.figures = figures(self.text)
        for n, word in enumerate(NUMBER_WORDS):
            if re.search(rf"\b{word}\b", self.text, re.IGNORECASE):
                self.figures.append((word, "", float(n), False))
        self.dates = {month_date(d) for d in DATE.findall(self.text)}
        self.dates |= {d.split()[-1] for d in self.dates}  # "Mar 2010" also counts for a bare "2010"
        self.rows = table_rows(self.text.splitlines())
        self.emails = {e.lower() for e in EMAIL.findall(self.text)}

    def has_figure(self, currency, value, percent):
        for _, cur, val, pct in self.figures:
            if abs(val - value) < 1e-9 and (not (currency or percent) or (cur == currency and pct == percent)):
                return True
        return False

    def same_value(self, value):
        return [shown for shown, _, val, _ in self.figures if abs(val - value) < 1e-9]


def check(folder, bank):
    """What in this role's CV and letter isn't in the CV bank, as plain-English lines."""
    listing = folder / "listing.md"
    advert = figures(listing.read_text(encoding="utf-8")) if listing.exists() else []
    problems = []
    for name in DOCS:
        path = folder / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        seen = set()
        for shown, currency, value, percent in figures(text):
            key = (currency, value, percent)
            if key in seen or bank.has_figure(currency, value, percent):
                continue
            seen.add(key)
            line = f'{name}: "{shown}" isn\'t in the CV bank.'
            close = bank.same_value(value)
            if close:
                line += f' The bank has "{close[0]}".'
            if any(abs(val - value) < 1e-9 for _, _, val, _ in advert):
                line += " It's in the advert, so fine if it's about them, not you."
            problems.append(line)
        for word, label in QUALIFICATIONS:
            if re.search(word, text) and not re.search(word, bank.text):
                problems.append(f"{name}: mentions {label}, which isn't in the CV bank.")
        for email in sorted({e.lower() for e in EMAIL.findall(text)} - bank.emails):
            problems.append(f"{name}: email {email} isn't in the CV bank.")
        if name != "cv.md":
            continue
        reported = set()
        for line in text.splitlines():
            # Job headings: "### Title, Employer (dates)", or a short bold or italic line
            # with dates, such as "**Title** · Jan 2020 – Jun 2023" or "*Earlier: ... (dates)*".
            # Longer lines are prose, which only the figure check covers.
            short = line.strip()
            is_job = line.startswith("### ") or (
                short.startswith("*") and not short.startswith("* ") and len(short) <= 110 and DATE.search(short))
            if not is_job:
                continue
            dates, parts = heading_parts(line)
            for date in dates:
                if date not in bank.dates and date not in reported:
                    reported.add(date)
                    problems.append(f'cv.md: the date "{date.title()}" in a job heading isn\'t in the CV bank.')
            for part in parts:
                if flat(part) not in bank.flat and flat(part) not in reported:
                    reported.add(flat(part))
                    problems.append(f'cv.md: "{part}" (in a job heading) isn\'t in the CV bank. '
                                    "Job titles, employers and places must be as they are in the bank.")
        rows, bullets = cert_lines(text)
        for row in rows:
            if row in bank.rows:
                continue
            same_name = [r for r in bank.rows if r and r[0] == row[0]]
            if same_name:
                problems.append(f'cv.md: certification "{" | ".join(row)}" differs from the CV bank ("{" | ".join(same_name[0])}").')
            else:
                problems.append(f'cv.md: certification "{row[0]}" isn\'t in the CV bank.')
        for bullet in bullets:
            if flat(bullet) not in bank.flat:
                problems.append(f'cv.md: "{bullet.strip()}" (under certifications) isn\'t in the CV bank.')
    return problems


def write_notes(folder, problems):
    """Put the problems in notes.md's fact-check section, or take the section out if there are none."""
    notes = folder / "notes.md"
    text = notes.read_text(encoding="utf-8") if notes.exists() else ""
    start = text.find(SECTION)
    if start == -1 and not problems:
        return  # nothing to add or take out
    if start != -1:
        end = text.find("\n## ", start + len(SECTION))
        text = text[:start] + (text[end + 1:] if end != -1 else "")
    text = text.rstrip()
    if problems:
        section = "\n".join([
            SECTION, "",
            "Ada compared the CV and cover letter with the CV bank. Please check each of these before "
            "approving. Some may be fine (a figure quoted from the advert, say), but nothing untrue may go out.",
            "",
            *[f"- {p}" for p in problems],
        ])
        text = f"{text}\n\n{section}" if text else section
    if text:
        if not notes.exists() or notes.read_text(encoding="utf-8") != text + "\n":
            notes.write_text(text + "\n", encoding="utf-8")
    elif notes.exists():
        notes.unlink()  # only Ada's section was in it


def report(role_id, jobs=JOBS, bank_dir=BANK_DIR):
    """Check one role, update its notes.md, print the result. Returns the problems."""
    folder = jobs / "roles" / role_id
    if not any((folder / name).exists() for name in DOCS):
        print(f"{role_id}: no CV or cover letter to check")
        return []
    problems = check(folder, Bank(bank_dir))
    write_notes(folder, problems)
    if problems:
        print(f"{role_id}: fact check found {len(problems)} thing(s) to check (listed in notes.md):")
        for p in problems:
            print(f"  - {p}")
    else:
        print(f"{role_id}: fact check passed (everything is in the CV bank)")
    return problems


def main():
    args = sys.argv[1:]
    if args == ["--all"]:
        args = sorted(p.parent.name for name in DOCS for p in (JOBS / "roles").glob(f"*/{name}"))
        args = list(dict.fromkeys(args))
    if not args or any(a.startswith("-") for a in args):
        sys.exit(__doc__)
    found = [report(role_id) for role_id in args]
    sys.exit(1 if any(found) else 0)


if __name__ == "__main__":
    main()
