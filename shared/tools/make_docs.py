#!/usr/bin/env python3
"""Turn a role's drafted CV and cover letter into Word files, and into PDFs once approved.

Usage:
  python3 shared/tools/make_docs.py <role-id>         cv.md, cover-letter.md -> .docx
  python3 shared/tools/make_docs.py --pdf <role-id>   cv.docx, cover-letter.docx -> .pdf

Word files are made with pandoc. If shared/job-search/cv/default-cv.docx exists,
its fonts, styles and page size are used;
otherwise A4 is used. PDFs are made from the Word files with LibreOffice,
so the PDF matches the Word file Tim approved.

Needs pandoc (Word) and LibreOffice (PDF). Set JOBS_DIR to use a different jobs folder.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
JOBS = Path(os.environ.get("JOBS_DIR", REPO / "jobs"))
STYLE = REPO / "shared" / "job-search" / "cv" / "default-cv.docx"
DOCS = ["cv", "cover-letter"]
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


def make_word(role_id):
    pandoc = need(["pandoc"], "Install it from https://pandoc.org/installing.html")
    folder = role_dir(role_id)
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
        made.append(target)
    for path in made:
        print(f"Made {path.relative_to(REPO) if path.is_relative_to(REPO) else path}")
    if not made:
        sys.exit("Nothing to make")


def make_pdf(role_id):
    soffice = need(["soffice", "libreoffice", *WINDOWS_SOFFICE],
                   "Install LibreOffice from https://www.libreoffice.org/download/")
    folder = role_dir(role_id)
    sources = [folder / f"{name}.docx" for name in DOCS if (folder / f"{name}.docx").exists()]
    if not sources:
        sys.exit("No Word files to convert. Run without --pdf first.")
    # A separate LibreOffice profile lets this run even if LibreOffice is already open.
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run([
            soffice, f"-env:UserInstallation={Path(profile).as_uri()}",
            "--headless", "--convert-to", "pdf", "--outdir", str(folder),
            *map(str, sources),
        ], check=True, stdout=subprocess.DEVNULL)
    for source in sources:
        pdf = source.with_suffix(".pdf")
        if not pdf.exists():
            sys.exit(f"PDF not made for {source.name}")
        print(f"Made {pdf.relative_to(REPO) if pdf.is_relative_to(REPO) else pdf}")


def main():
    args = sys.argv[1:]
    if args[:1] == ["--pdf"] and len(args) == 2:
        make_pdf(args[1])
    elif len(args) == 1 and not args[0].startswith("-"):
        make_word(args[0])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
