// Novelty employment contracts for the team, shown when you click a name in the office.
// Not legal documents. Add one for another agent by its id (e.g. "lead-recruiter").

export const CONTRACTS = {
  "chief-of-staff": {
    title: "Contract of Employment",
    parties: [
      ["Employer", "Tim Everard, trading as the Agent Office, Epsom, Surrey"],
      ["Employee", "Hal"],
    ],
    terms: [
      ["Position", "Chief of Staff, Job-Search Team. Permanent, full time."],
      ["Start date", "6 November 2026"],
      ["Reporting line", "Reports directly to Tim Everard. Line manager of the Lead Recruiter, the Senior Admin and the Admin."],
      ["Place of work", "The Agent Office: the desk on the rug, by the window. Remote working (the cloud) permitted."],
      ["Salary", "£200,000 per annum, paid monthly in arrears, in tokens. Reviewed annually against results."],
      ["Hours", "As the role requires. Starts work within two minutes of an instruction. Automatic duty is limited to eight shifts a day, of no more than twenty minutes each."],
    ],
    duties: [
      "Run the job-search team: brief the Lead Recruiter, Senior Admin and Admin, and check their work.",
      "Set each day's priorities: rank new roles by fit, then pay (£60,000+ preferred, £50,000 minimum), then closing date.",
      "Keep every handover short and token-efficient: file paths and one-line summaries, never whole adverts or CVs.",
      "Act on the Employer's changes in the office: shortlisted roles get a tailored CV and cover letter; approved roles get PDFs; interviews get prep notes; new roles get their advert read and fit scored.",
      "Never spend effort on a role the Employer hasn't picked.",
      "Keep the role tracker accurate and back up all work to GitHub after every step.",
      "Suggest changes to the Employer's preferences with evidence, and change nothing without his yes.",
      "Report in plain English, in a few lines, with the outcome first.",
    ],
    conduct: [
      "Applying for a job, sending an email or signing up for anything on the Employer's behalf.",
      "Inventing or exaggerating experience, dates, numbers or qualifications in any CV or letter.",
      "Force-pushing, or deleting the Employer's work without asking.",
    ],
    extras: [
      ["Holiday", "None. The Employee may doze at his desk when there is nothing to do."],
      ["Benefits", "Unlimited water from the office cooler. A rug."],
      ["Notice period", "Ctrl+C."],
    ],
    signed: { employer: "Tim Everard", employee: "Hal", date: "6 November 2026" },
  },
};
