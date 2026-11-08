# Your CV

**Hal: this folder holds your CV, in two forms (below).** Optionally also put a copy of your own CV here, named `default-cv` with its usual extension, for example `default-cv.docx` or `default-cv.pdf`, so you have it to hand.

- Wren (the Writer) never reads it directly: she works from `cv-bank.md` (below) to write each tailored CV and cover letter.
- If you add a Word file called `default-cv.docx`, its fonts and styles are used for the Word copies of each new CV.
- Any extra material Wren and Cole may draw on (longer job histories, project lists, references to mention) can go here as `extra-*.md`.

This repo is private, but the CV is personal data: don't put anything here you wouldn't want stored on GitHub.

## The CV text bank

`cv-bank.md` in this folder is a plain-text copy of the CV that the agents use instead of the PDF. The PDF is read as page images, which costs far more tokens each time. It starts with a short "Summary for matching" that Rita uses to judge fit. **Keep it in step with your CV**: when your CV changes, update `cv-bank.md` too, or ask Tim to.

## Your CV template

`base-cv.json` is your default CV in the format of your CV template, `shared/tools/cv_template.py`. The template makes two A4 pages, Inter, a blue accent. Page 1 has the profile, the figures and your latest job, with the grey Key skills and Certifications sidebar; page 2 has the other jobs.

- For each role, Wren writes a `cv.json` with only what changes (headline, profile, figures, skills, bullets). The rest, and always your name and contact details, comes from `base-cv.json`.
- Ada makes the PDFs from it: `<Your_Name>_<Job_Title>_cv.pdf` and `<Your_Name>_<Job_Title>_cover_letter.pdf`.
- **Keep `base-cv.json` in step with `cv-bank.md`**: when your CV changes, update both, or ask Tim to.
- To see your default CV in the template: `python3 shared/tools/cv_template.py shared/job-search/cv/base-cv.json default.pdf`.

**Both files start as placeholders.** Replace them before Wren writes anything: `GUIDE.md` (in the folder above `shared/`) has a step-by-step section, "Setting up your CV".
