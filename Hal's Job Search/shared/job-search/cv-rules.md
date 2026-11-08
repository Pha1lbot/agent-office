# CV writing rules

Wren (the Writer) follows these for every CV and cover letter. **They are a starting set: change them to suit you.** Each line is an instruction. Add, remove or reword lines, and Wren follows the new version from the next draft.

- Plain, human writing. It must not sound AI-written.
- Never invent numbers, achievements or experience. Use only what is in `cv/cv-bank.md`.
- No education section. (Delete this line if you want one.)
- British English. (Change to American English if you prefer.)
- Keep every CV to two pages and every cover letter to one.

## Template and details

- Use the default CV template only (`shared/tools/cv_template.py`): two A4 pages, with page 1 holding the profile, the figures and the first job beside the Key skills and Certifications sidebar, and page 2 the other jobs.
- Contact details come from `cv/base-cv.json`, so they are always right. Don't type them into drafts.
- References aren't listed: the CV says "References available on request." (Set `"references": false` in `cv/base-cv.json` to drop that line.)
- File names are `<Your_Name>_<Job_Title>_cv.pdf` and `<Your_Name>_<Job_Title>_cover_letter.pdf`, where the name is the one in `cv/base-cv.json` and the job title is the advert's. Ada names them.

Add your own rules below, for example "Never mention my previous employer's name", "Always lead with my management experience" or "Keep the tone warm, not formal".
