#!/usr/bin/env python3
"""Scout: Ada's free job search. It reads job sources directly, filters what it finds
against shared/job-search/search.json, and puts the matches in the leads queue
(jobs/found.json) for Hal to sort. It uses no AI and no tokens.

Usage:
  python3 shared/tools/scout.py run [--source <id or name>] [--dry-run] [--max-pages N]
  python3 shared/tools/scout.py check                 test every source: working, blocked, needs a key...
  python3 shared/tools/scout.py discover [--save] [--only "<employer>"]
                                                      find which watch-list employers have a public
                                                      hiring feed (Greenhouse, Lever, Ashby, SmartRecruiters)

Sources it reads (the "type" of each source in search.json):
  sitemap          a site's job sitemap, then each new job's own structured data (Hitmarker)
  greenhouse, lever, ashby, smartrecruiters
                   a company's public job feed, for each board listed on the source
  reed, adzuna     free job-search APIs; keys go in shared/job-search/.env (see .env.example)
  rss              any job feed
Sources of type "email" and "web" are read by Hal and Rita, not by this script.

Every run is logged per site (`tracker.py found sources` shows the table), so the office can
say which sites are being reached. Standard library only. Set JOBS_DIR to use a different
jobs folder, and SCOUT_SEARCH to use a different search.json (for testing).
"""
import argparse
import base64
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib import error, parse, request, robotparser

REPO = Path(__file__).resolve().parents[2]
JOBS = Path(os.environ.get("JOBS_DIR", REPO / "jobs"))
SEARCH = Path(os.environ.get("SCOUT_SEARCH", REPO / "shared" / "job-search" / "search.json"))
ENV_FILE = REPO / "shared" / "job-search" / ".env"
TRACKER = Path(__file__).with_name("tracker.py")
STATE = JOBS / "scout-state.json"
USER_AGENT = "agent-office-scout/0.1 (a personal job search; one request at a time)"
ATS_TYPES = ("greenhouse", "lever", "ashby", "smartrecruiters")


class Unreachable(Exception):
    """The site couldn't be reached at all (blocked by the network, DNS, timeout)."""


# ---------- Fetching ----------

class Http:
    """One polite fetcher: one request at a time, a short pause between them, robots.txt respected."""

    def __init__(self, delay=0.4):
        self.delay = delay
        self._last = 0.0
        self._robots = {}

    def get(self, url, headers=None, auth=None, timeout=25):
        head = {"User-Agent": USER_AGENT, "Accept": "*/*", **(headers or {})}
        if auth:
            head["Authorization"] = "Basic " + base64.b64encode(f"{auth[0]}:{auth[1]}".encode()).decode()
        wait = self.delay - (time.time() - self._last)
        if wait > 0:
            time.sleep(wait)
        try:
            with request.urlopen(request.Request(url, headers=head), timeout=timeout) as r:
                status, body = r.status, r.read()
        except error.HTTPError as e:
            status, body = e.code, (e.read() if hasattr(e, "read") else b"")
        except Exception as e:  # DNS, timeout, proxy refusing the tunnel...
            raise Unreachable(str(e)[:140])
        finally:
            self._last = time.time()
        return status, body

    def allowed(self, url):
        """May an automated reader fetch this page? An unreadable robots.txt means yes."""
        p = parse.urlparse(url)
        base = f"{p.scheme}://{p.netloc}"
        if base not in self._robots:
            rp = robotparser.RobotFileParser()
            try:
                status, body = self.get(base + "/robots.txt", timeout=10)
                rp.parse(body.decode("utf-8", "replace").splitlines() if status == 200 else [])
            except Unreachable:
                rp.parse([])
            self._robots[base] = rp
        return self._robots[base].can_fetch(USER_AGENT, url)


def get_json(http, url, **kw):
    status, body = http.get(url, **kw)
    if status != 200:
        raise ValueError(f"HTTP {status}")
    return json.loads(body.decode("utf-8", "replace"))


def load_env():
    """Read shared/job-search/.env (KEY=value lines) into the environment, without overriding it."""
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


# ---------- Reading text and dates ----------

def strip_html(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(html.unescape(str(text or ""))))).strip()


def norm(text):
    t = re.sub(r"[^a-z0-9£€+]+", " ", str(text or "").lower()).strip()
    return re.sub(r"\bprograms?\b", "programme", t)


def parse_date(value):
    """A date from an ISO string, dd/mm/yyyy (Reed) or epoch milliseconds (Lever); None if unclear."""
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000 if value > 1e11 else value, timezone.utc).date()
    s = str(value).strip()
    for pattern in (r"^(\d{4})-(\d{2})-(\d{2})", r"^(\d{2})/(\d{2})/(\d{4})"):
        m = re.match(pattern, s)
        if m:
            a, b, c = (int(x) for x in m.groups())
            try:
                return date(a, b, c) if a > 31 else date(c, b, a)
            except ValueError:
                return None
    return None


def yearly_pay(text):
    """Lowest yearly figure in a pay string like '£60,000 - £75,000' or '65k'. None for day rates or unclear."""
    if not text or re.search(r"(?i)\b(day|daily|hour|hourly|ph|pd)\b", text):
        return None
    figures = []
    for number, k in re.findall(r"(\d[\d,]*(?:\.\d+)?)\s*(k)?", text.lower()):
        value = float(number.replace(",", "")) * (1000 if k else 1)
        if value >= 5000:
            figures.append(value)
    return min(figures) if figures else None


def pay_text(low, high, currency="GBP"):
    sign = {"GBP": "£", "EUR": "€", "USD": "$"}.get(currency or "GBP", "")
    low, high = (float(low) if low else 0), (float(high) if high else 0)
    if not low and not high:
        return ""
    if low and high and high != low:
        return f"{sign}{low:,.0f} - {sign}{high:,.0f}"
    return f"{sign}{(low or high):,.0f}"


# ---------- Judging a job against the definition ----------

GENERIC_TITLES = {"head of operations", "director of operations", "senior operations manager", "operations director",
                  "vp operations", "head of events", "chief of staff", "production manager", "head of production",
                  "head of service operations", "operations manager", "senior operations resource planning manager"}
# Recruiters' own adverts: often the employer is unnamed, so they are kept but marked and never "strong".
AGENCY = re.compile(r"\b(recruit\w*|staffing|resourcing|headhunt\w*|talent|search|michael page|page personnel|hays|robert half|adecco|randstad|manpower|harvey nash)\b", re.I)
HARD_LOW = re.compile(r"\b(intern|internship|junior|graduate|trainee|apprentice|assistant|coordinator)\b")
SOFT_LOW = re.compile(r"\b(executive|associate|specialist|administrator)\b")
SENIOR = re.compile(r"\b(head|director|vp|vice president|chief|principal|senior)\b")
MANAGER = re.compile(r"\b(manager|lead|head|director|vp|chief|principal|senior)\b")
UK_WORDS = re.compile(r"\b(united kingdom|uk|gb|great britain|england|scotland|wales|northern ireland|london|surrey|manchester|"
                      r"birmingham|leeds|bristol|brighton|reading|guildford|croydon|epsom|kingston|richmond|slough|oxford|"
                      r"cambridge|southampton|edinburgh|glasgow|cardiff|belfast|leicester|nottingham|sheffield|liverpool|"
                      r"newcastle|woking|sutton|crawley|wimbledon|twickenham|watford)\b")
COMMUTE_AREA = re.compile(r"\b((?:ec|wc|nw|se|sw|kt|sm|cr|rh|gu|tw|ha|ub|sl|br|da|en|ig|rm|wd|e|n|w)\d[a-z\d]*|london|surrey|epsom|kingston|croydon|sutton|guildford|woking|wimbledon|richmond|twickenham|"
                          r"slough|reading|crawley|watford|greater london|south east)\b")


def level_ok(title, min_level):
    t = norm(title)
    if HARD_LOW.search(t):
        return False
    senior = bool(SENIOR.search(t))
    if SOFT_LOW.search(t) and not senior:
        return False
    return bool(MANAGER.search(t)) if min_level == "manager" else senior


def title_match(title, track):
    """The track title that this job title contains (all its words, in any order), or None."""
    words = set(norm(title).split())
    for phrase in track.get("titles", []):
        tokens = norm(phrase).split()
        if tokens and all(tok in words for tok in tokens):
            return phrase
    return None


def has_word(text, phrase):
    return bool(re.search(r"\b" + re.escape(norm(phrase)) + r"\b", norm(text)))


def judge(job, source_name, defn, today=None):
    """Return (item for the queue, "") if a job fits the definition, else (None, why not)."""
    today = today or date.today()
    title, company = job.get("title", ""), job.get("company", "")
    if not title or not company or not job.get("link"):
        return None, "incomplete"
    for avoid in defn.get("avoid_employers", []):
        if has_word(company, avoid):
            return None, "employer avoided"
    for word in defn.get("avoid_work", []):
        if has_word(title, word):
            return None, "wrong kind of work"
    posted = parse_date(job.get("posted"))
    if posted and (today - posted).days > (job.get("max_age_days") or defn.get("max_age_days", 14)):
        return None, "too old"
    # Where: the UK, and remote, hybrid or within reach of Epsom.
    loc = norm(job.get("location", ""))
    desc = job.get("description", "")
    country = str(job.get("country", "")).strip().upper()
    in_uk = country in ("GB", "UK", "UNITED KINGDOM") or bool(UK_WORDS.search(loc))
    remote = bool(job.get("remote")) or "remote" in loc or "hybrid" in loc
    if not in_uk and not (remote and not country and re.search(r"\b(uk|united kingdom)\b", norm(title + " " + desc[:400]))):
        return None, "not in the UK"
    if not remote and not COMMUTE_AREA.search(loc):
        if loc and not re.fullmatch(r"(united kingdom|uk|gb|england|great britain)", loc) and not re.search(r"\b(fully remote|remote first|100 remote|work from anywhere|remote working|home based)\b", norm(desc[:1500])):
            return None, "outside commute, not remote"
    pay = job.get("pay", "")
    low = yearly_pay(pay)
    if low is not None and low < defn.get("pay", {}).get("minimum", 0):
        return None, "pay below minimum"
    # Which track, in Tim's order.
    context = f"{title} {company} {desc[:1500]}"
    for track in sorted(defn.get("tracks", []), key=lambda t: t.get("priority", 99)):
        phrase = title_match(title, track)
        if not phrase or any(has_word(title, bad) for bad in track.get("not", [])):
            continue
        if not level_ok(title, track.get("min_level", "senior manager")):
            continue
        keyword = any(has_word(context, k) for k in track.get("keywords", []))
        if track.get("require_keyword") and not keyword:
            continue  # this track is only for the sectors named in its keywords
        if phrase.lower() in GENERIC_TITLES and not keyword:
            continue  # "Head of Operations" says nothing about the sector: it needs the track's own words
        agency = bool(AGENCY.search(company))
        strong = keyword and not agency and (phrase.lower() not in GENERIC_TITLES or track.get("priority", 9) <= 3)
        concern = "; ".join(x for x in (
            "contract" if job.get("contract") else "",
            "recruiter's advert (employer may not be named)" if agency else "",
            "" if in_uk and (remote or COMMUTE_AREA.search(loc)) else "check the location",
        ) if x)
        return {
            "title": title.strip(), "company": company.strip(), "location": (job.get("location") or "").strip(), "pay": pay,
            "link": job["link"], "posted": posted.isoformat() if posted else "", "source": source_name, "via": "feed",
            "fit": "strong" if strong else "possible",
            "why": f"{track['name']}: the title matches '{phrase}'" + (" and the advert uses the track's words" if keyword else ""),
            "concern": concern, "track": track["name"], "summary": strip_html(desc)[:280],
        }, ""
    return None, "no track matches"


# ---------- Source readers: each returns (jobs, status, note) ----------
# status is ok, blocked (couldn't be reached), needs-key, or error.

def read_job_posting(page_html, url):
    """A job from the schema.org JobPosting data in a page, or None."""
    for block in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', page_html, re.S | re.I):
        try:
            data = json.loads(block)
        except ValueError:
            continue
        for item in (data if isinstance(data, list) else data.get("@graph", [data])):
            if isinstance(item, dict) and item.get("@type") == "JobPosting":
                places = item.get("jobLocation") or []
                places = places if isinstance(places, list) else [places]
                parts, country = [], ""
                for place in places:
                    addr = (place or {}).get("address") or {}
                    if isinstance(addr, dict):
                        parts += [addr.get("addressLocality", ""), addr.get("addressRegion", "")]
                        c = addr.get("addressCountry", "")
                        country = country or (c.get("name", "") if isinstance(c, dict) else str(c))
                salary = (item.get("baseSalary") or {}).get("value") or {}
                kinds = item.get("employmentType") or []
                kinds = [kinds] if isinstance(kinds, str) else kinds
                org = item.get("hiringOrganization") or {}
                return {
                    "title": strip_html(item.get("title")), "company": strip_html(org.get("name") if isinstance(org, dict) else org),
                    "location": ", ".join(p for p in parts if p), "country": country, "link": url,
                    "posted": item.get("datePosted"), "remote": item.get("jobLocationType") == "TELECOMMUTE",
                    "pay": pay_text(salary.get("minValue"), salary.get("maxValue"), (item.get("baseSalary") or {}).get("currency")) if isinstance(salary, dict) else "",
                    "contract": any(k in ("CONTRACTOR", "TEMPORARY") for k in kinds), "description": strip_html(item.get("description")),
                }
    return None


def slug_words(url):
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    return [w for w in re.split(r"[-_]+", slug.lower()) if w and not w.isdigit()]


def read_sitemap(src, defn, http, state, max_pages):
    """A job sitemap: pick the likely jobs from their addresses, then read each one's own data."""
    try:
        if not http.allowed(src["url"]):
            return [], "blocked", "robots.txt asks automated readers to stay out"
        status, body = http.get(src["url"])
    except Unreachable as e:
        return [], "blocked", str(e)
    if status in (401, 403, 429):
        return [], "blocked", f"HTTP {status}"
    if status != 200:
        return [], "error", f"HTTP {status}"
    cutoff = (date.today() - timedelta(days=defn.get("max_age_days", 14))).isoformat()
    entries = re.findall(r"<loc>\s*(.*?)\s*</loc>\s*(?:<lastmod>\s*(.*?)\s*</lastmod>)?", body.decode("utf-8", "replace"), re.S)
    track_words, avoid = set(), set()
    for t in defn.get("tracks", []):
        for phrase in t.get("titles", []) + t.get("keywords", []):
            track_words |= {w for w in norm(phrase).split() if w not in ("of", "the", "and", "at", "manager", "head", "director")}
        avoid |= {norm(phrase) for phrase in t.get("not", [])}
    avoid |= {norm(phrase) for phrase in defn.get("avoid_work", [])}
    avoid.discard("")
    candidates = []
    for url, mod in entries:
        if (mod or "9999")[:10] < cutoff or url in state["seen"]:
            continue
        words = slug_words(url)
        text = " " + " ".join(words) + " "
        if not words or any(f" {a} " in text for a in avoid) or not level_ok(text, "manager"):
            continue
        score = sum(1 for w in words if w in track_words)
        if score >= 2:
            candidates.append((score, mod or "", url))
    # Best title match first, then the newest job: ids rise with time, and an old job
    # that was refreshed keeps its old id but a new lastmod.
    candidates.sort(key=lambda c: (c[0], int(re.search(r"(\d+)$", c[2]).group(1)) if re.search(r"(\d+)$", c[2]) else 0), reverse=True)
    jobs, read = [], 0
    for _, _, url in candidates[:max_pages]:
        try:
            if not http.allowed(url):
                continue
            status, page = http.get(url)
        except Unreachable:
            break
        read += 1
        state["seen"][url] = date.today().isoformat()
        if status == 200:
            job = read_job_posting(page.decode("utf-8", "replace"), url)
            if job:
                jobs.append(job)
    note = f"{len(entries)} jobs listed, {len(candidates)} looked possible from their titles, {read} read"
    return jobs, "ok", note


def board_list(src):
    return [b if isinstance(b, dict) else {"board": b, "company": b} for b in src.get("boards", [])]


def read_ats(src, http):
    """Company hiring feeds (Greenhouse, Lever, Ashby, SmartRecruiters) for each board on the source."""
    boards = board_list(src)
    if not boards:
        return [], "ok", "no company boards set yet (run `scout.py discover`)"
    kind, jobs, worked, notes = src["type"], [], 0, []
    # A company's own feed lists every open role, however long ago it was first posted: still open means still worth a look.
    FEED_DAYS = 60
    for b in boards:
        slug, company = b["board"], b.get("company", b["board"])
        try:
            if kind == "greenhouse":
                data = get_json(http, f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true")
                for j in data.get("jobs", []):
                    jobs.append({"title": j.get("title"), "company": company, "location": (j.get("location") or {}).get("name", ""),
                                 "link": j.get("absolute_url"), "posted": j.get("first_published") or j.get("updated_at"),
                                 "description": strip_html(j.get("content"))})
            elif kind == "lever":
                for j in get_json(http, f"https://api.lever.co/v0/postings/{slug}?mode=json"):
                    cats = j.get("categories") or {}
                    jobs.append({"title": j.get("text"), "company": company, "location": cats.get("location", ""), "link": j.get("hostedUrl"),
                                 "posted": j.get("createdAt"), "contract": "contract" in str(cats.get("commitment", "")).lower(),
                                 "description": j.get("descriptionPlain") or strip_html(j.get("description"))})
            elif kind == "ashby":
                for j in get_json(http, f"https://api.ashbyhq.com/posting-api/job-board/{slug}").get("jobs", []):
                    jobs.append({"title": j.get("title"), "company": company, "location": j.get("location", ""), "remote": bool(j.get("isRemote")),
                                 "link": j.get("jobUrl"), "posted": j.get("publishedAt"),
                                 "description": j.get("descriptionPlain") or strip_html(j.get("descriptionHtml"))})
            elif kind == "smartrecruiters":
                for j in get_json(http, f"https://api.smartrecruiters.com/v1/companies/{slug}/postings?limit=100").get("content", []):
                    loc = j.get("location") or {}
                    jobs.append({"title": j.get("name"), "company": company, "location": ", ".join(x for x in (loc.get("city"), loc.get("region")) if x),
                                 "country": loc.get("country", ""), "remote": bool(loc.get("remote")),
                                 "link": f"https://jobs.smartrecruiters.com/{slug}/{j.get('id')}", "posted": j.get("releasedDate"), "description": ""})
            worked += 1
        except (Unreachable, ValueError) as e:
            notes.append(f"{slug}: {e}")
    for j in jobs:
        j["max_age_days"] = FEED_DAYS
    if not worked:
        return [], "blocked", "; ".join(notes[:3])
    return jobs, "ok", f"{worked} of {len(boards)} boards read" + (f"; {len(notes)} failed" if notes else "")


def read_reed(src, defn, http):
    key = os.environ.get("REED_API_KEY")
    if not key:
        return [], "needs-key", "add REED_API_KEY to shared/job-search/.env"
    seen, jobs = set(), []
    minimum = defn.get("pay", {}).get("minimum") or 0
    try:
        for track in sorted(defn.get("tracks", []), key=lambda t: t.get("priority", 99)):
            for phrase in track.get("titles", [])[:2]:
                for extra in ({"locationName": "London", "distanceFromLocation": 25}, {"keywords_suffix": " remote"}):
                    q = parse.urlencode({"keywords": phrase + extra.get("keywords_suffix", ""), "minimumSalary": minimum, "resultsToTake": 50,
                                         **{k: v for k, v in extra.items() if k != "keywords_suffix"}})
                    for j in get_json(http, f"https://www.reed.co.uk/api/1.0/search?{q}", auth=(key, "")).get("results", []):
                        if j.get("jobId") in seen:
                            continue
                        seen.add(j.get("jobId"))
                        jobs.append({"title": j.get("jobTitle"), "company": j.get("employerName"), "location": j.get("locationName", ""),
                                     "country": "GB", "link": j.get("jobUrl"), "posted": j.get("date"),
                                     "pay": pay_text(j.get("minimumSalary"), j.get("maximumSalary"), j.get("currency")),
                                     "description": strip_html(j.get("jobDescription"))})
    except Unreachable as e:
        return jobs, "blocked", str(e)
    except ValueError as e:
        return jobs, "error", str(e)
    return jobs, "ok", f"{len(seen)} results read"


def read_adzuna(src, defn, http):
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        return [], "needs-key", "add ADZUNA_APP_ID and ADZUNA_APP_KEY to shared/job-search/.env"
    seen, jobs = set(), []
    try:
        for track in sorted(defn.get("tracks", []), key=lambda t: t.get("priority", 99)):
            for phrase in track.get("titles", [])[:2]:
                for where in ({"where": "London", "distance": 30}, {}):
                    q = parse.urlencode({"app_id": app_id, "app_key": app_key, "results_per_page": 50, "what_phrase": phrase,
                                         "salary_min": defn.get("pay", {}).get("minimum") or 0, "max_days_old": defn.get("max_age_days", 14),
                                         "content-type": "application/json", **where})
                    for j in get_json(http, f"https://api.adzuna.com/v1/api/jobs/gb/search/1?{q}").get("results", []):
                        if j.get("id") in seen:
                            continue
                        seen.add(j.get("id"))
                        jobs.append({"title": j.get("title"), "company": (j.get("company") or {}).get("display_name"),
                                     "location": (j.get("location") or {}).get("display_name", ""), "country": "GB",
                                     "link": j.get("redirect_url"), "posted": j.get("created"), "contract": j.get("contract_type") == "contract",
                                     "pay": pay_text(j.get("salary_min"), j.get("salary_max")), "description": strip_html(j.get("description"))})
    except Unreachable as e:
        return jobs, "blocked", str(e)
    except ValueError as e:
        return jobs, "error", str(e)
    return jobs, "ok", f"{len(seen)} results read"


def read_rss(src, http):
    try:
        status, body = http.get(src["url"])
    except Unreachable as e:
        return [], "blocked", str(e)
    if status != 200:
        return [], ("blocked" if status in (401, 403, 429) else "error"), f"HTTP {status}"
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return [], "error", "not a feed"
    jobs = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        m = re.match(r"^(.*?)\s+(?:at|-|\|)\s+(.+)$", title)
        jobs.append({"title": m.group(1) if m else title, "company": (m.group(2) if m else src["name"]), "location": it.findtext("location") or "",
                     "link": (it.findtext("link") or "").strip(), "posted": it.findtext("pubDate"), "description": strip_html(it.findtext("description"))})
    return jobs, "ok", f"{len(jobs)} items"


def read_source(src, defn, http, state, max_pages):
    kind = src.get("type")
    if kind == "sitemap":
        return read_sitemap(src, defn, http, state, max_pages)
    if kind in ATS_TYPES:
        return read_ats(src, http)
    if kind == "reed":
        return read_reed(src, defn, http)
    if kind == "adzuna":
        return read_adzuna(src, defn, http)
    if kind == "rss":
        return read_rss(src, http)
    return None  # email and web sources belong to Hal and Rita


# ---------- Running ----------

def load_state():
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        state = {}
    cutoff = (date.today() - timedelta(days=40)).isoformat()
    # seen: job pages already read (sitemaps); queued: jobs already put in the leads queue
    state["seen"] = {u: d for u, d in state.get("seen", {}).items() if d >= cutoff}
    state["queued"] = {u: d for u, d in state.get("queued", {}).items() if d >= cutoff}
    return state


def save_state(state):
    JOBS.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=1) + "\n", encoding="utf-8")


def tracker(*args):
    return subprocess.run([sys.executable, str(TRACKER), *args], capture_output=True, text=True, env=os.environ.copy())


def queue(items):
    """Add items to the leads queue. Returns how many were new."""
    if not items:
        return 0
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(items, f)
    try:
        out = tracker("found", "add", "--file", f.name, "--via", "feed")
    finally:
        os.unlink(f.name)
    m = re.search(r"added (\d+)", out.stdout)
    if out.returncode != 0 or not m:
        raise RuntimeError(out.stderr.strip() or out.stdout.strip() or "found add failed")
    return int(m.group(1))


def run(defn, http, only=None, dry=False, max_pages=100, log=print):
    load_env()
    state = load_state()
    summary = []
    for src in defn.get("sources", []):
        if only and only not in (src.get("id"), src.get("name")):
            continue
        got = read_source(src, defn, http, state, max_pages)
        if got is None:
            continue
        jobs, status, note = got
        items, dropped = [], Counter()
        for job in jobs:
            if job.get("link") in state["queued"]:
                continue  # already queued on an earlier run
            item, why = judge(job, src["name"], defn)
            (items.append(item) if item else dropped.update([why]))
        added = 0 if dry or status != "ok" else queue(items)
        if not dry and status == "ok":
            state["queued"].update({item["link"]: date.today().isoformat() for item in items})
        result = "empty" if status == "ok" and not jobs else status
        top = ", ".join(f"{n} {why}" for why, n in dropped.most_common(3))
        log(f"{src['name']}: {result} | {len(jobs)} read, {len(items)} fit, {added} new" + (f" | {note}" if note else "") + (f" | left out: {top}" if top else ""))
        if dry:
            for item in items[:10]:
                log(f"  would queue: {item['title']} @ {item['company']} | {item['location']} | {item['track']} | {item['fit']}")
        else:
            out = tracker("found", "run", "--via", "feed", "--found", str(added), "--source", src["name"], "--result", result,
                          "--note", (note or "")[:200])
            if out.returncode != 0:
                raise RuntimeError(f"couldn't log {src['name']} in the coverage table: {out.stderr.strip()[-200:]}")
        summary.append((src["name"], result, len(items), added))
    if not dry:
        save_state(state)
    new = sum(a for *_, a in summary)
    log(f"Scout: {sum(1 for s in summary if s[1] in ('ok', 'empty'))} of {len(summary)} sources reached, {new} new leads queued.")
    return summary


def check(defn, http, log=print):
    load_env()
    for src in defn.get("sources", []):
        kind = src.get("type")
        if kind in ("email", "web"):
            log(f"{src['name']} | read by {'Hal (alert emails)' if kind == 'email' else 'Rita'}, not by Scout")
            continue
        if kind in ATS_TYPES and not board_list(src):
            log(f"{src['name']} | no company boards set yet (run `scout.py discover`)")
            continue
        try:
            if kind == "sitemap":
                status, body = http.get(src["url"])
                n = len(re.findall(r"<loc>", body.decode("utf-8", "replace")))
                log(f"{src['name']} | {'working' if status == 200 and n else 'blocked' if status in (401, 403, 429) else f'HTTP {status}'} | {n} jobs listed")
            elif kind in ATS_TYPES:
                jobs, status, note = read_ats(src, http)
                log(f"{src['name']} | {'working' if jobs else status} | {len(jobs)} jobs | {note}")
            elif kind in ("reed", "adzuna"):
                env = ("REED_API_KEY",) if kind == "reed" else ("ADZUNA_APP_ID", "ADZUNA_APP_KEY")
                log(f"{src['name']} | " + ("key found" if all(os.environ.get(k) for k in env) else f"needs {' and '.join(env)} in shared/job-search/.env"))
            elif kind == "rss":
                jobs, status, note = read_rss(src, http)
                log(f"{src['name']} | {'working' if jobs else status} | {note}")
        except Unreachable as e:
            log(f"{src['name']} | blocked | {e}")


def slug_options(employer):
    plain = re.sub(r"[^a-z0-9]+", "", employer.lower())
    dashed = re.sub(r"[^a-z0-9]+", "-", employer.lower()).strip("-")
    return list(dict.fromkeys([plain, dashed]))


def probe(kind, slug, http):
    """The number of jobs on a company's public feed, or None if there is no such board."""
    urls = {"greenhouse": f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs", "lever": f"https://api.lever.co/v0/postings/{slug}?mode=json",
            "ashby": f"https://api.ashbyhq.com/posting-api/job-board/{slug}",
            "smartrecruiters": f"https://api.smartrecruiters.com/v1/companies/{slug}/postings?limit=1"}
    try:
        data = get_json(http, urls[kind])
    except (ValueError, Unreachable):
        return None
    if kind == "greenhouse":
        return len(data.get("jobs", []))
    if kind == "lever":
        return len(data) if isinstance(data, list) else None
    if kind == "ashby":
        return len(data.get("jobs", []))
    return data.get("totalFound", len(data.get("content", [])))


def board_name(kind, slug, http):
    """The company name a Greenhouse board gives itself, so a wrong guess (a different company with a
    similar name) can be spotted. Other feeds don't give one."""
    if kind != "greenhouse":
        return ""
    try:
        return str(get_json(http, f"https://boards-api.greenhouse.io/v1/boards/{slug}").get("name", ""))
    except (ValueError, Unreachable):
        return ""


def discover(defn, http, save=False, only=None, log=print):
    found = {}
    for group in defn.get("watch", []):
        for employer in group.get("employers", []):
            if only and only.lower() != employer.lower():
                continue
            for kind in ATS_TYPES:
                for slug in slug_options(employer):
                    n = probe(kind, slug, http)
                    if n:
                        name = board_name(kind, slug, http)
                        log(f"{employer}: {kind} board '{slug}' with {n} jobs" + (f" (board says: {name})" if name else "") + "  <- check this is the right company")
                        found.setdefault(kind, []).append({"board": slug, "company": employer})
                        break
    if not found:
        log("No boards found (or none reachable from here).")
    if save and found:
        data = json.loads(SEARCH.read_text(encoding="utf-8"))
        for src in data["sources"]:
            if src.get("type") in found:
                have = {b["board"] if isinstance(b, dict) else b for b in src.get("boards", [])}
                src["boards"] = src.get("boards", []) + [b for b in found[src["type"]] if b["board"] not in have]
        SEARCH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        log(f"Saved {sum(len(v) for v in found.values())} boards to {SEARCH.name}. Check the companies look right.")
    return found


def main(argv=None, http=None):
    parser = argparse.ArgumentParser(description="Scout: Ada's free job search")
    sub = parser.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="read the sources and queue new leads")
    r.add_argument("--source", help="only this source (id or name)")
    r.add_argument("--dry-run", action="store_true", help="show what would be queued, change nothing")
    r.add_argument("--max-pages", type=int, default=100, help="most job pages to read per site (default 100)")
    sub.add_parser("check", help="test every source")
    d = sub.add_parser("discover", help="find the watch-list employers' public hiring feeds")
    d.add_argument("--save", action="store_true", help="add what is found to search.json")
    d.add_argument("--only", help="just this employer")
    args = parser.parse_args(argv)
    if not SEARCH.exists():
        sys.exit(f"No search definition at {SEARCH}")
    defn = json.loads(SEARCH.read_text(encoding="utf-8"))
    http = http or Http()
    if args.cmd == "run":
        run(defn, http, only=args.source, dry=args.dry_run, max_pages=args.max_pages)
    elif args.cmd == "check":
        check(defn, http)
    else:
        discover(defn, http, save=args.save, only=args.only)


if __name__ == "__main__":
    main()
