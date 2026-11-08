#!/usr/bin/env python3
"""Tim's default CV template: builds his CVs and cover letters as PDFs.

Usage:
  python3 shared/tools/cv_template.py <content.json> <out.pdf>
  python3 shared/tools/cv_template.py --letter <letter.md> [--cv <content.json>] [--subject "Role, Company"] <out.pdf>
  Add --html to write the page as HTML instead of PDF (for checking the layout).

The layout copies Tim's default CV (shared/job-search/cv/default-cv.pdf): two A4
pages, Inter font, a blue accent.
- Page 1: name, headline and contact details, a rule, then the profile, a row of
  up to five figures and the first job, with a grey sidebar of key skills and
  certifications.
- Page 2: the remaining jobs, full width.
Cover letters use the same header (with the headline from --cv, if given), then the date,
the subject line and the letter. The letter's Markdown is just the letter: greeting,
paragraphs and sign-off.

Content comes from shared/job-search/cv/base-cv.json (Tim's default CV). A role's
content.json only needs what it changes, such as headline, profile, stats, skills or
jobs; anything it leaves out comes from the base. Name and contact details always come
from the base, so they are always right. The base file shows the format.

The PDF is printed by Chrome, Chromium or Microsoft Edge in headless mode; set
CV_BROWSER to use a particular one. The Inter fonts are in shared/tools/cv-fonts/,
so the result looks the same on every PC.
"""
import base64
import glob
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BASE = REPO / "shared" / "job-search" / "cv" / "base-cv.json"
FONTS = Path(__file__).resolve().parent / "cv-fonts"
FIXED = ("name", "contact")  # always from the base
MAX_STATS = 5
BROWSERS = ["chrome-headless-shell", "google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome", "msedge",
            "microsoft-edge"]
BROWSER_PATHS = [
    r"%ProgramFiles%\Google\Chrome\Application\chrome.exe",
    r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe",
    r"%LocalAppData%\Google\Chrome\Application\chrome.exe",
    r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe",
    r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell",
    "/opt/pw-browsers/chromium",
]


class ContentError(ValueError):
    """The content file is missing something or has the wrong shape."""


# ---------- Content ----------

def load_content(path=None, base_path=BASE):
    """The base CV, with a role's content.json laid over it."""
    base = json.loads(Path(base_path).read_text(encoding="utf-8"))
    data = dict(base)
    if path:
        try:
            role = json.loads(Path(path).read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise ContentError(f"{Path(path).name} isn't valid JSON: {error}") from None
        if not isinstance(role, dict):
            raise ContentError(f"{Path(path).name} must be a JSON object")
        for key, value in role.items():
            if key not in FIXED and not key.startswith("_"):
                data[key] = value
    check(data)
    return data


def check(data):
    """Raise ContentError with a plain-English reason if the content won't fit the template."""
    def need(cond, why):
        if not cond:
            raise ContentError(why)
    text = lambda v: isinstance(v, str) and v.strip()
    need(text(data.get("name")), "name is missing")
    need(text(data.get("headline")), "headline is missing")
    need(text(data.get("profile")), "profile is missing")
    need(isinstance(data.get("contact"), dict), "contact must be an object")
    stats = data.get("stats", [])
    need(isinstance(stats, list) and len(stats) <= MAX_STATS, f"stats must be a list of at most {MAX_STATS}")
    for s in stats:
        need(isinstance(s, dict) and text(s.get("value")) and text(s.get("label")), "each stat needs value and label")
    for s in data.get("skills", []):
        need(isinstance(s, dict) and text(s.get("title")) and text(s.get("text")), "each skill needs title and text")
    for c in data.get("certifications", []):
        need(isinstance(c, dict) and text(c.get("name")), "each certification needs a name")
    jobs = data.get("jobs")
    need(isinstance(jobs, list) and jobs, "jobs must be a non-empty list")
    for j in jobs:
        need(isinstance(j, dict) and text(j.get("title")) and text(j.get("company")) and text(j.get("dates")),
             "each job needs title, company and dates")
        need(isinstance(j.get("bullets", []), list), f"bullets for {j.get('title')} must be a list")
    first = data.get("page1_jobs", 1)
    need(isinstance(first, int) and 0 <= first <= len(jobs), "page1_jobs must be a whole number of jobs")


def to_markdown(data):
    """The CV as Markdown: what the office shows, the Word copy and Ada's fact check use."""
    c = data["contact"]
    out = [f"# {data['name']}", "", f"**{data['headline']}**", "",
           " · ".join(v for v in (c.get("location"), c.get("phone"), c.get("email"), c.get("linkedin")) if v),
           "", "## Profile", "", data["profile"].strip(), ""]
    if data.get("stats"):
        out += ["**In numbers:** " + " · ".join(f"{s['value']} {s['label']}" for s in data["stats"]), ""]
    out += ["## Experience", ""]
    for j in data["jobs"]:
        head = f"{j['title']}, {j['company']}"
        if j.get("detail"):
            head += f" · {j['detail']}"
        out += [f"### {head} ({j['dates']})", ""]
        out += [f"- {b}" for b in j.get("bullets", [])] + [""]
    if data.get("skills"):
        out += ["## Key skills", ""]
        out += [f"- **{s['title']}:** {s['text']}" for s in data["skills"]] + [""]
    if data.get("certifications"):
        out += ["## Certifications", "", "| Certification | Year |", "|---|---|"]
        out += [f"| {x['name']} | {x.get('year', '')} |" for x in data["certifications"]] + [""]
    if data.get("references", True):
        out += ["References available on request.", ""]
    return "\n".join(out)


# ---------- HTML ----------

E = lambda s: html.escape(str(s), quote=True)


def font_faces():
    faces = []
    for file, family, weight in [("Inter-Regular", "Inter", 400), ("Inter-Medium", "Inter", 500),
                                 ("Inter-SemiBold", "Inter", 600), ("Inter-Bold", "Inter", 700),
                                 ("InterDisplay-Bold", "Inter Display", 700)]:
        path = FONTS / f"{file}.woff2"
        if path.exists():
            data = base64.b64encode(path.read_bytes()).decode()
            src = f"url(data:font/woff2;base64,{data}) format('woff2')"
        else:  # fall back to an installed copy
            src = f"local('{family} {'Bold' if weight == 700 else ''}'.strip())"
        faces.append(f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:normal;"
                     f"font-display:block;src:{src}}}")
    return "\n".join(faces)


STYLE = """
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact }
body { font-family: Inter, 'Segoe UI', Arial, sans-serif; color: #1c2230; font-size: 9.4pt; line-height: 1.45;
  font-feature-settings: 'kern', 'calt' }
.page { width: 210mm; height: 297mm; padding: 49pt 45.5pt 30pt 45pt; overflow: hidden; break-after: page; position: relative }
.page:last-child { break-after: auto }
.page.rest { padding-top: 45pt }
header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 11pt;
  border-bottom: 1.5pt solid #1c2230 }
.name { font-family: 'Inter Display', Inter, sans-serif; font-weight: 700; font-size: 29.7pt; line-height: 1.12;
  letter-spacing: -0.01em }
.headline { color: #2b5fd9; font-weight: 600; font-size: 11.78pt; margin-top: 7pt; line-height: 1.4 }
.contact { text-align: right; font-size: 8.85pt; line-height: 1.68; color: #5d6675; margin-top: -4pt }
.contact div:nth-child(n+2) { color: #1c2230 }
.cols { display: grid; grid-template-columns: 1fr 164.2pt; column-gap: 25.5pt; margin-top: 19pt; align-items: start }
.label { color: #2b5fd9; font-weight: 700; font-size: 7.3pt; letter-spacing: 0.2em; text-transform: uppercase;
  margin: 0 0 10pt }
.profile { font-size: 9.86pt; line-height: 1.535; margin-bottom: 15pt }
.stats { display: grid; grid-template-columns: repeat(5, 1fr); column-gap: 4.5pt; margin-bottom: 18pt }
.stat { border-top: 1.6pt solid #2b5fd9; padding-top: 4pt }
.stat b { display: block; font-weight: 700; font-size: 13.35pt; line-height: 1.45; letter-spacing: -0.01em }
.stat span { display: block; color: #6b6f78; font-size: 7.7pt; line-height: 1.32 }
.job { margin-bottom: 18pt; break-inside: avoid }
.job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt }
.job-title { font-weight: 600; font-size: 10.45pt; line-height: 1.5 }
.dates { color: #6b6f78; font-size: 8.6pt; white-space: nowrap }
.company { font-weight: 500; font-size: 9.1pt; line-height: 1.5; margin-bottom: 5.5pt }
.company .detail { color: #6b6f78; font-weight: 400 }
ul { list-style: none }
li { position: relative; padding-left: 11.3pt; font-size: 9.46pt; line-height: 1.43; margin-bottom: 2.5pt }
li::before { content: ''; position: absolute; left: 1.6pt; top: 0.62em; width: 3.4pt; height: 3.4pt; border-radius: 50%;
  background: #2b5fd9 }
aside { background: #f3f5f9; border-radius: 6pt; padding: 13pt 14pt 13pt }
.skill { margin-bottom: 5.9pt }
.skill b { display: block; font-weight: 600; font-size: 8.95pt; line-height: 1.5 }
.skill span { display: block; color: #5d6675; font-size: 8.57pt; line-height: 1.58 }
aside .label + .skill { margin-top: 0 }
.certs { margin-top: 16pt }
.cert { display: flex; justify-content: space-between; gap: 8pt; font-size: 8.66pt; line-height: 1.5;
  padding: 1.8pt 0 2.3pt; border-bottom: 0.75pt solid #e3e3e5 }
.cert:last-child { border-bottom: 0 }
.cert span:last-child { color: #5d6675; font-variant-numeric: tabular-nums; letter-spacing: 0.04em }
.refs { color: #6b6f78; font-size: 8.4pt; margin-top: 4pt }
.letter { margin-top: 30pt; font-size: 10pt; line-height: 1.6; max-width: 440pt }
.letter .when { color: #6b6f78; font-size: 9pt; margin-bottom: 14pt }
.letter .subject { font-weight: 600; margin-bottom: 14pt }
.letter p { margin-bottom: 10pt }
.letter strong { font-weight: 600 }
"""


def doc(title, body):
    return (f"<!doctype html><html lang='en-GB'><head><meta charset='utf-8'><title>{E(title)}</title>"
            f"<style>{font_faces()}{STYLE}</style></head><body>{body}</body></html>")


def header(data):
    c = data["contact"]
    lines = "".join(f"<div>{E(v)}</div>" for v in (c.get("location"), c.get("phone"), c.get("email"),
                                                    c.get("linkedin")) if v)
    return (f"<header><div><div class='name'>{E(data['name'])}</div>"
            f"<div class='headline'>{E(data['headline'])}</div></div><div class='contact'>{lines}</div></header>")


def job_html(j):
    detail = f"<span class='detail'> · {E(j['detail'])}</span>" if j.get("detail") else ""
    bullets = "".join(f"<li>{E(b)}</li>" for b in j.get("bullets", []))
    return (f"<section class='job'><div class='job-head'><div class='job-title'>{E(j['title'])}</div>"
            f"<div class='dates'>{E(j['dates'])}</div></div><div class='company'>{E(j['company'])}{detail}</div>"
            f"<ul>{bullets}</ul></section>")


def cv_html(data):
    first = data.get("page1_jobs", 1)
    jobs = data["jobs"]
    stats = "".join(f"<div class='stat'><b>{E(s['value'])}</b><span>{E(s['label'])}</span></div>"
                    for s in data.get("stats", []))
    skills = "".join(f"<div class='skill'><b>{E(s['title'])}</b><span>{E(s['text'])}</span></div>"
                     for s in data.get("skills", []))
    certs = "".join(f"<div class='cert'><span>{E(c['name'])}</span><span>{E(c.get('year', ''))}</span></div>"
                    for c in data.get("certifications", []))
    side = ""
    if skills:
        side += f"<div class='label'>Key skills</div>{skills}"
    if certs:
        side += f"<div class='{'certs' if skills else ''}'><div class='label'>Certifications</div>{certs}</div>"
    if data.get("references", True):
        side += "<div class='refs'>References available on request.</div>"
    main = (f"<div class='label'>Profile</div><p class='profile'>{E(data['profile'].strip())}</p>"
            + (f"<div class='stats'>{stats}</div>" if stats else "")
            + (f"<div class='label'>Experience</div>" + "".join(job_html(j) for j in jobs[:first]) if first else ""))
    page1 = (f"<div class='page'>{header(data)}<div class='cols'><main>{main}</main>"
             f"<aside>{side}</aside></div></div>")
    rest = jobs[first:]
    if not first and rest:  # experience starts on page 2
        rest_html = "<div class='label'>Experience</div>" + "".join(job_html(j) for j in rest)
    else:
        rest_html = "".join(job_html(j) for j in rest)
    page2 = f"<div class='page rest'>{rest_html}</div>" if rest else ""
    return doc(f"{data['name']} CV", page1 + page2)


def inline(text):
    """Bold and italics from Markdown, escaped."""
    text = E(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    return re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", text)


def letter_body(markdown):
    """The letter's paragraphs. A leading header (# name, contact lines) is dropped: the template adds it."""
    paras = [p.strip() for p in re.split(r"\n\s*\n", markdown.strip()) if p.strip()]
    while paras and (paras[0].startswith("#") or paras[0].startswith("**") and paras[0].endswith("**")
                     or "@" in paras[0] and len(paras[0]) < 200):
        paras.pop(0)
    if not paras:
        raise ContentError("the cover letter is empty")
    return "".join(f"<p>{'<br>'.join(inline(line.strip()) for line in p.splitlines())}</p>" for p in paras)


def letter_html(data, markdown, subject="", when=None):
    when = when or date.today()
    day = f"{when.day} {when.strftime('%B %Y')}"
    sub = f"<div class='subject'>{E(subject)}</div>" if subject else ""
    body = f"<div class='letter'><div class='when'>{E(day)}</div>{sub}{letter_body(markdown)}</div>"
    return doc(f"{data['name']} cover letter", f"<div class='page'>{header(data)}{body}</div>")


# ---------- PDF ----------

def find_browser():
    env = os.environ.get("CV_BROWSER")
    if env and Path(env).exists():
        return env
    shells = sorted(glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell"))
    if shells:  # the light headless browser, where installed (as in Claude's cloud sessions)
        return shells[-1]
    for name in BROWSERS:
        found = shutil.which(name)
        if found:
            return found
    for path in BROWSER_PATHS:
        path = os.path.expandvars(path)
        if "%" in path:
            continue
        matches = sorted(glob.glob(path)) if "*" in path else [path] if Path(path).exists() else []
        if matches:
            return matches[-1]
    return None


def page_count(pdf):
    return len(re.findall(rb"/Type\s*/Page(?![s\w])", Path(pdf).read_bytes()))


def print_pdf(page, out):
    """Print an HTML page to a PDF with headless Chrome or Edge. Returns the page count."""
    browser = find_browser()
    if not browser:
        sys.exit("No Chrome, Chromium or Edge found to make the PDF. Install Google Chrome, "
                 "or set CV_BROWSER to the browser.")
    out = Path(out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / "page.html"
        source.write_text(page, encoding="utf-8")
        target = Path(tmp) / "out.pdf"
        command = [browser, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
                   "--disable-extensions", "--disable-background-networking", "--disable-component-update",
                   "--disable-sync", f"--user-data-dir={Path(tmp) / 'profile'}", "--no-pdf-header-footer",
                   "--print-to-pdf-no-header", f"--print-to-pdf={target}", source.as_uri()]
        if os.name == "posix" and hasattr(os, "geteuid") and os.geteuid() == 0:
            command.insert(1, "--no-sandbox")  # Chrome refuses to run as root otherwise
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=120)
        except subprocess.TimeoutExpired:
            sys.exit(f"{Path(browser).name} took over two minutes and was stopped. Set CV_BROWSER to another "
                     "Chrome or Edge, or close the browser and try again.")
        if not target.exists() or target.stat().st_size == 0:
            sys.exit(f"The browser didn't make a PDF: {(result.stderr or result.stdout).strip()[-300:]}")
        shutil.move(str(target), out)
    return page_count(out)


def build_cv(content, out, as_html=False):
    data = load_content(content)
    page = cv_html(data)
    if as_html:
        Path(out).write_text(page, encoding="utf-8")
        return 0
    pages = print_pdf(page, out)
    if pages > 2:
        print(f"Warning: {Path(out).name} runs to {pages} pages. Shorten the profile or bullets to fit two.")
    return pages


def build_letter(letter, out, subject="", as_html=False, content=None):
    data = load_content(content)
    page = letter_html(data, Path(letter).read_text(encoding="utf-8"), subject)
    if as_html:
        Path(out).write_text(page, encoding="utf-8")
        return 0
    pages = print_pdf(page, out)
    if pages > 1:
        print(f"Warning: {Path(out).name} runs to {pages} pages. A cover letter should fit on one.")
    return pages


def main():
    args = sys.argv[1:]
    as_html = "--html" in args
    args = [a for a in args if a != "--html"]
    def option(name):
        if name not in args:
            return ""
        i = args.index(name)
        value = args[i + 1] if i + 1 < len(args) else ""
        del args[i:i + 2]
        return value
    subject, content = option("--subject"), option("--cv")
    try:
        if args[:1] == ["--letter"] and len(args) == 3:
            build_letter(args[1], args[2], subject, as_html, content or None)
        elif len(args) == 2 and not args[0].startswith("-"):
            build_cv(args[0], args[1], as_html)
        else:
            sys.exit(__doc__)
    except ContentError as error:
        sys.exit(f"Can't build: {error}")
    print(f"Made {args[-1]}")


if __name__ == "__main__":
    main()
