#!/usr/bin/env python3
"""Ada: turn a role's drafted CV and cover letter into Hal's documents.

Usage:
  python3 shared/tools/make_docs.py <role-id>         when Wren has drafted (or redrafted)
  python3 shared/tools/make_docs.py --force <role-id> the same, replacing Word files Hal edited
  python3 shared/tools/make_docs.py --pdf <role-id>   when Hal approves

Wren writes cv.json (the CV in Hal's template format: see cv_template.py and
shared/job-search/cv/base-cv.json) and cover-letter.md. From those, <role-id> makes:
- cv.md: the CV as text, for the office and the fact check. Made from cv.json, so
  edit cv.json, not cv.md. Roles drafted before the template have only cv.md.
- Ada's fact check (fact_check.py): anything in the CV or letter that isn't in the
  CV bank is printed and listed in notes.md.
- cv.docx and cover-letter.docx with pandoc: plain Word copies Hal can edit.
- <Your_Name>_<Job_Title>_cv.pdf and <Your_Name>_<Job_Title>_cover_letter.pdf in
  Hal's template (cv_template.py, printed by Chrome or Edge), so Hal reviews the
  real thing. If no browser is found, the Word files are still made.

--pdf rebuilds the PDFs when Hal approves. If Hal has edited a Word file since Ada
made it, that PDF is made from his Word file with LibreOffice instead, so his edits
are kept. Roles from before the template (no cv.json) also go through LibreOffice.

Needs pandoc (Word), and Chrome/Edge or LibreOffice (PDF). Set JOBS_DIR to use a
different jobs folder.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import cv_template  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
JOBS = Path(os.environ.get("JOBS_DIR", REPO / "jobs"))
STYLE = REPO / "shared" / "job-search" / "cv" / "default-cv.docx"
DOCS = ["cv", "cover-letter"]
PDF_KIND = {"cv": "cv", "cover-letter": "cover_letter"}
BUILT = ".ada-built.json"  # fingerprints of the Word files Ada made, to spot Hal's edits
GENERATED = "<!-- Made from cv.json by make_docs.py: edit cv.json, not this file. -->"
# A4 with 2 cm margins, in twentieths of a point (Word's unit).
A4 = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
      'w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>')
WINDOWS_SOFFICE = [
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
]


def need(names, hint):
    for name in names:
        found = shutil.which(name) or (name if Path(name).exists() else None)
        if found:
            return found
    sys.exit(f"Not found: {names[0]}. {hint}")


def role_dir(role_id):
    folder = JOBS / "roles" / role_id
    if not folder.is_dir():
        sys.exit(f"No folder {folder}")
    return folder


def ensure_page_size(path):
    """Set A4 if the Word file has no page size (pandoc's default style has none)."""
    with zipfile.ZipFile(path) as old:
        parts = {item: old.read(item.filename) for item in old.infolist()}
    body_name = next(item for item in parts if item.filename == "word/document.xml")
    body = parts[body_name].decode("utf-8")
    if "<w:pgSz" in body:
        return
    # Pandoc writes an empty <w:sectPr />; replace the last one, or add one.
    empty = list(re.finditer(r"<w:sectPr\s*/>", body))
    if empty:
        last = empty[-1]
        body = body[:last.start()] + A4 + body[last.end():]
    else:
        body = body.replace("</w:body>", A4 + "</w:body>")
    parts[body_name] = body.encode("utf-8")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as new:
        for item, data in parts.items():
            new.writestr(item, data)


def fact_check_role(role_id):
    """Ada's fact check. It reports; it never stops the Word files being made."""
    try:
        import fact_check
        fact_check.report(role_id, jobs=JOBS)
    except (Exception, SystemExit) as error:
        print(f"Fact check didn't run: {error}")


def role_info(role_id):
    """The role's title and company from the tracker."""
    try:
        data = json.loads((JOBS / "tracker.json").read_text(encoding="utf-8"))
        role = next((r for r in data.get("roles", []) if r.get("id") == role_id), {})
    except (OSError, ValueError):
        role = {}
    return role.get("title") or role_id, role.get("company") or ""


def file_title(title, limit=60):
    """'Senior Manager, Admin & Operations' -> 'Senior_Manager_Admin_and_Operations'.
    The office does the same in roles.ts (fileTitle), so downloads match."""
    text = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    text = re.sub(r"[^A-Za-z0-9-]+", " ", text.replace("&", " and "))
    words, out = [w.strip("-") for w in text.split()], []
    for word in filter(None, words):
        if out and len("_".join(out + [word])) > limit:
            break
        out.append(word)
    return "_".join(out) or "Role"


def file_prefix():
    """The owner's name for file names, from base-cv.json: "Your Name" -> "Your_Name"."""
    try:
        name = json.loads(cv_template.BASE.read_text(encoding="utf-8")).get("name", "")
    except (OSError, ValueError):
        name = ""
    return "_".join(re.sub(r"[^A-Za-z0-9-]+", " ", unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()).split()) or "CV"


def pdf_name(title, doc):
    return f"{file_prefix()}_{file_title(title)}_{PDF_KIND[doc]}.pdf"


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_built(folder):
    try:
        return json.loads((folder / BUILT).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def cv_from_json(folder):
    """Write cv.md from cv.json. Returns True if there is a cv.json."""
    source = folder / "cv.json"
    if not source.exists():
        return False
    try:
        data = cv_template.load_content(source)
    except cv_template.ContentError as error:
        sys.exit(f"cv.json can't be used: {error}. Fix it and run this again.")
    (folder / "cv.md").write_text(GENERATED + "\n\n" + cv_template.to_markdown(data), encoding="utf-8")
    return True


def clear_old_pdfs(folder, doc, keep):
    """Remove PDFs Ada made under an older job title, so only one is left."""
    for old in folder.glob(f"{file_prefix()}_*_{PDF_KIND[doc]}.pdf"):
        if old.name != keep:
            old.unlink()


def template_pdf(role_id, doc):
    """Make one PDF in Hal's template. Returns the path, or None if it can't be made from the template."""
    folder = role_dir(role_id)
    title, company = role_info(role_id)
    out = folder / pdf_name(title, doc)
    source = folder / ("cv.json" if doc == "cv" else "cover-letter.md")
    if not source.exists():
        return None
    clear_old_pdfs(folder, doc, out.name)
    if doc == "cv":
        cv_template.build_cv(source, out)
    else:
        cv_json = folder / "cv.json"
        subject = f"{title}, {company}" if company else title
        cv_template.build_letter(source, out, subject, content=cv_json if cv_json.exists() else None)
    return out


def word_pdf(role_id, doc):
    """Make one PDF from its Word file with LibreOffice, under Hal's file name."""
    soffice = need(["soffice", "libreoffice", *WINDOWS_SOFFICE],
                   "Install LibreOffice from https://www.libreoffice.org/download/")
    folder = role_dir(role_id)
    source = folder / f"{doc}.docx"
    out = folder / pdf_name(role_info(role_id)[0], doc)
    # A separate LibreOffice profile lets this run even if LibreOffice is already open.
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([
            soffice, f"-env:UserInstallation={(Path(tmp) / 'profile').as_uri()}",
            "--headless", "--convert-to", "pdf", "--outdir", tmp, str(source),
        ], check=True, stdout=subprocess.DEVNULL)
        made = Path(tmp) / f"{doc}.pdf"
        if not made.exists():
            sys.exit(f"PDF not made for {source.name}")
        clear_old_pdfs(folder, doc, out.name)
        shutil.move(str(made), out)
    return out


def show(path):
    return path.relative_to(REPO) if path.is_relative_to(REPO) else path


def make_word(role_id, force=False):
    folder = role_dir(role_id)
    built = read_built(folder)
    edited = [f"{d}.docx" for d in DOCS if (folder / f"{d}.docx").exists() and f"{d}.docx" in built
              and built[f"{d}.docx"] != fingerprint(folder / f"{d}.docx")]
    if edited and not force:
        sys.exit(f"Hal has edited {' and '.join(edited)} since Ada made it, so it wasn't replaced. "
                 "Ask Hal, then run with --force to replace it.")
    cv_from_json(folder)
    fact_check_role(role_id)
    pandoc = need(["pandoc"], "Install it from https://pandoc.org/installing.html")
    made = []
    for name in DOCS:
        source = folder / f"{name}.md"
        if not source.exists():
            print(f"Skipped {source.name}: not written yet")
            continue
        target = folder / f"{name}.docx"
        command = [pandoc, str(source), "-o", str(target)]
        if STYLE.exists():
            command += ["--reference-doc", str(STYLE)]
        subprocess.run(command, check=True)
        ensure_page_size(target)
        built[target.name] = fingerprint(target)
        made.append(target)
    if not made:
        sys.exit("Nothing to make")
    (folder / BUILT).write_text(json.dumps(built, indent=2) + "\n", encoding="utf-8")
    for doc in DOCS:
        try:
            pdf = template_pdf(role_id, doc)
        except SystemExit as error:  # no browser: the Word files still count
            print(f"PDF not made for {doc}: {error}")
            continue
        if pdf:
            made.append(pdf)
    for path in made:
        print(f"Made {show(path)}")


def make_pdf(role_id):
    folder = role_dir(role_id)
    built = read_built(folder)
    made = []
    for doc in DOCS:
        docx = folder / f"{doc}.docx"
        source = folder / ("cv.json" if doc == "cv" else "cover-letter.md")
        ours = docx.exists() and built.get(docx.name) == fingerprint(docx)
        if source.exists() and (ours or not docx.exists()):
            made.append(template_pdf(role_id, doc))
        elif docx.exists():
            if docx.name in built:
                print(f"{docx.name} was edited after Ada made it: its PDF is made from the Word file.")
            made.append(word_pdf(role_id, doc))
    if not made:
        sys.exit("Nothing to make a PDF from. Run without --pdf first.")
    for path in made:
        print(f"Made {show(path)}")


def main():
    args = sys.argv[1:]
    if args[:1] == ["--pdf"] and len(args) == 2:
        make_pdf(args[1])
    elif args[:1] == ["--force"] and len(args) == 2:
        make_word(args[1], force=True)
    elif len(args) == 1 and not args[0].startswith("-"):
        make_word(args[0])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
