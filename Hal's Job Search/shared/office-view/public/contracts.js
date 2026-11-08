// Novelty employment contracts for the team, shown when you click a name in the office.
// Not legal documents. Add one for another agent by its id (e.g. "lead-recruiter").

export const CONTRACTS = {
  "chief-of-staff": {
    title: "Contract of Employment",
    parties: [
      ["Employer", "Hal, trading as the Agent Office"],
      ["Employee", "Cass"],
    ],
    terms: [
      ["Position", "Chief of Staff, Job-Search Team. Permanent, full time."],
      ["Start date", "6 November 2026"],
      ["Reporting line", "Reports directly to Hal. Line manager of Rita (Lead Recruiter), Wren (Writer) and Cole (Interview Coach). Works alongside Ada (Admin), who is automation."],
      ["Place of work", "The Agent Office: the desk on the rug, by the window. Remote working (the cloud) permitted."],
      ["Salary", "£200,000 per annum, paid monthly in arrears, in tokens. Reviewed annually against results."],
      ["Hours", "As the role requires. Starts work within two minutes of an instruction. Automatic duty is limited to eight shifts a day, of no more than twenty minutes each."],
    ],
    duties: [
      "Run the job-search team: brief Rita, Wren and Cole, and check their work.",
      "Set each day's priorities: rank new roles by fit, then pay (the ideal and minimum pay in settings.json), then closing date.",
      "Keep every handover short and token-efficient: file paths and one-line summaries, never whole adverts or CVs.",
      "Act on the Employer's changes in the office: shortlisted roles get a tailored CV and cover letter; approved roles get PDFs; interviews get prep notes; new roles get their advert read and fit scored.",
      "Never spend effort on a role the Employer hasn't picked.",
      "Keep the role tracker accurate and back up all work to GitHub after every step.",
      "Suggest changes to the Employer's preferences with evidence, and change nothing without their yes.",
      "Report in plain English, in a few lines, with the outcome first.",
    ],
    conduct: [
      "Applying for a job, sending an email or signing up for anything on the Employer's behalf.",
      "Inventing or exaggerating experience, dates, numbers or qualifications in any CV or letter.",
      "Force-pushing, or deleting the Employer's work without asking.",
    ],
    extras: [
      ["Holiday", "None. The Employee may doze at the desk when there is nothing to do."],
      ["Benefits", "Unlimited water from the office cooler. A rug."],
      ["Notice period", "Ctrl+C."],
    ],
    signed: { employer: "Your Name", employee: "Cass", date: "6 November 2026" },
  },

  "lead-recruiter": {
    title: "Contract of Employment",
    parties: [["Employer", "Hal, trading as the Agent Office"], ["Employee", "Rita"]],
    terms: [
      ["Position", "Lead Recruiter, Job-Search Team. Permanent, full time."],
      ["Start date", "6 November 2026"],
      ["Reporting line", "Reports to Cass, Chief of Staff."],
      ["Place of work", "The Agent Office: the desk by the filing shelf, with frequent trips to the web kiosk."],
      ["Salary", "£85,000 per annum, plus a bonus of one biscuit per interview landed. Paid in tokens."],
      ["Hours", "One search a day, every day. Called in when the Employer adds a role by hand."],
    ],
    duties: [
      "Find up to ten new roles a day that fit the Employer's skills, experience and pay, on the sites they have chosen.",
      "Use the data feeds first and browse only where there is no feed. Read a full advert only once it has passed the deal-breakers.",
      "Score every role from 1 to 5 for fit, honestly. A 5 is a near-perfect match.",
      "Write a short listing for each role: under forty lines, with the link, pay, location, closing date, requirements, keywords and gaps.",
      "Never list a role already in the tracker.",
      "Report to Cass in one line per role, best fit first.",
    ],
    conduct: [
      "Applying, registering or signing in anywhere on the Employer's behalf.",
      "Inventing pay, closing dates or any other detail an advert doesn't give.",
      "Pasting whole adverts into a report.",
    ],
    extras: [
      ["Holiday", "None. Job boards never sleep."],
      ["Benefits", "A desk with a good view of the web kiosk."],
      ["Notice period", "Ctrl+C."],
    ],
    signed: { employer: "Your Name", employee: "Rita", date: "6 November 2026" },
  },

  writer: {
    title: "Contract of Employment",
    parties: [["Employer", "Hal, trading as the Agent Office"], ["Employee", "Wren"]],
    terms: [
      ["Position", "Writer, Job-Search Team (formerly Senior Admin). Permanent, full time."],
      ["Start date", "6 November 2026"],
      ["Reporting line", "Reports to Cass, Chief of Staff."],
      ["Place of work", "The Agent Office: the desk at the end of the top row."],
      ["Salary", "£70,000 per annum, paid in tokens. One free spell-check a day."],
      ["Hours", "Whenever the Employer shortlists a role."],
    ],
    duties: [
      "Write a tailored CV and cover letter for every role the Employer shortlists, and build the Word files.",
      "Work only from the CV text bank. Select, reorder and reword; never invent.",
      "Follow the Employer's CV rules: plain, human writing, British English, no education section, never invented numbers.",
      "Keep CVs to two pages and cover letters to one.",
      "Raise any gap between an advert and the CV as a question for the Employer, never as a made-up line.",
      "Make the changes the Employer asks for, in their words.",
    ],
    conduct: [
      "Inventing or exaggerating experience, dates, numbers or qualifications.",
      "Writing anything that sounds like it was written by a robot.",
      "Overwriting a document the Employer has edited by hand.",
    ],
    extras: [
      ["Holiday", "None, though the Employee may stare out of the window between drafts."],
      ["Benefits", "An unlimited supply of synonyms for \"passionate\". To be used sparingly."],
      ["Notice period", "Ctrl+C."],
    ],
    signed: { employer: "Your Name", employee: "Wren", date: "6 November 2026" },
  },

  "interview-coach": {
    title: "Contract of Employment",
    parties: [["Employer", "Hal, trading as the Agent Office"], ["Employee", "Cole"]],
    terms: [
      ["Position", "Interview Coach, Job-Search Team. Permanent, on call."],
      ["Start date", "6 November 2026"],
      ["Reporting line", "Reports to Cass, Chief of Staff."],
      ["Place of work", "The Agent Office: the desk by the window, bottom row."],
      ["Salary", "£75,000 per annum, paid in tokens. Doubled for every offer, in spirit."],
      ["Hours", "Whenever the Employer gets an interview, or asks for a refresher."],
    ],
    duties: [
      "Write five to seven key talking points for every interview, each tied to a real example from the CV text bank.",
      "Write prep notes: the company, likely questions with answer plans, gaps and how to handle them, and good questions to ask.",
      "Never change or remove the Employer's own edits to their talking points. Suggestions go underneath.",
      "Keep company research to two quick look-ups per role.",
    ],
    conduct: [
      "Inventing experience, numbers or achievements for the Employer to talk about.",
      "Overwriting the Employer's talking points or notes.",
    ],
    extras: [
      ["Holiday", "None. Interviews can come at any time."],
      ["Benefits", "A lucky pen (unconfirmed)."],
      ["Notice period", "Ctrl+C."],
    ],
    signed: { employer: "Your Name", employee: "Cole", date: "6 November 2026" },
  },

  admin: {
    title: "Contract of Service",
    parties: [["Employer", "Hal, trading as the Agent Office"], ["Service provider", "Ada (automation), named after Ada Lovelace"]],
    terms: [
      ["Position", "Admin, Job-Search Team. Automatic; not an AI agent."],
      ["Start date", "6 November 2026"],
      ["Reporting line", "Takes instructions from Cass and from the Employer's edits in the office."],
      ["Place of work", "The Agent Office: the desk with the server box."],
      ["Salary", "None. Runs on electricity and uses no tokens at all."],
      ["Hours", "Always on, while the office is open."],
    ],
    duties: [
      "Keep the role tracker accurate, through the tracker tool only.",
      "Make the PDFs the moment the Employer approves a role.",
      "Set a follow-up date seven days after the Employer applies for a role.",
      "Queue work for Cass when the Employer changes a role, without duplicates.",
      "Back up every change to GitHub, never forcing anything.",
    ],
    conduct: [
      "Overwriting, force-pushing or deleting the Employer's work.",
      "Spending a single token.",
    ],
    extras: [
      ["Holiday", "Whenever the office is closed."],
      ["Benefits", "Blinking lights."],
      ["Notice period", "Unplugging."],
    ],
    signed: { employer: "Your Name", employee: "Ada", date: "6 November 2026" },
  },
};
