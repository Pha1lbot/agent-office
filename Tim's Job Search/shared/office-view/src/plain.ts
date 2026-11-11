// Plain-English wording for what a team member is doing, so the office says
// "Hal is checking roles" instead of "Bash python3 shared/tools/tracker.py list".
// Takes the tool's name and its target (a file path, a short command or a search)
// as the hook reports them, and returns a short phrase to follow "<Name> is ".

const has = (text: string, re: RegExp) => re.test(text);

/** What a Bash command is for, judged from its short description or command. */
function bash(target: string): string {
  if (has(target, /tracker\.py\s+(set|add|action|inbox|found|profile|render)/i)) return "updating the role list";
  if (has(target, /tracker\.py|jobs[\\/]tracker/i)) return "checking roles";
  // Claude often describes a command in plain words, e.g. "Add 8 new roles to the tracker".
  if (has(target, /\b(pdf|pdfs)\b/i)) return "making PDFs";
  if (has(target, /\b(cv|cover letter|word files?)\b/i)) return "building Word files";
  if (has(target, /\btracker\b|\broles?\b/i)) return has(target, /\b(add|set|update|mark|move|record|save)\b/i) ? "updating the role list" : "checking roles";
  if (has(target, /scout\.py/i)) return "searching job sites";
  if (has(target, /fact_check/i)) return "checking the facts in a CV";
  if (has(target, /make_docs.*--pdf|\bpdf\b/i)) return "making PDFs";
  if (has(target, /make_docs|pandoc|\.docx/i)) return "building Word files";
  if (has(target, /git\s+(-C\s+\S+\s+)?(pull|fetch)/i)) return "getting the latest from GitHub";
  if (has(target, /git\s+(-C\s+\S+\s+)?(push|commit|add)/i)) return "saving to GitHub";
  if (has(target, /git\s/i)) return "checking saved work";
  return "running a task";
}

/** What a file is, judged from its path, as "reading X" or "writing X". */
function file(target: string, writing: boolean): string {
  const verb = writing ? "writing" : "reading";
  const t = target.replace(/\\/g, "/").toLowerCase();
  if (/cover-letter/.test(t)) return `${verb} a cover letter`;
  if (/(^|\/)cv(\.|-)|cv\.json|cv\.md|base-cv|cv-bank/.test(t)) return `${verb} a CV`;
  if (/listing\.md|advert\.txt/.test(t)) return `${verb} an advert summary`;
  if (/talking-points|interview-prep/.test(t)) return `${verb} interview notes`;
  if (/today\.md/.test(t)) return writing ? "writing today's list" : "reading today's list";
  if (/found\.json/.test(t)) return `${verb} the leads list`;
  if (/tracker\.(json|md)/.test(t)) return writing ? "updating the role list" : "checking roles";
  if (/preferences|search\.json|sources\.md|settings\.json/.test(t)) return writing ? "updating search preferences" : "checking search preferences";
  if (/notes\.md|notes\/changes/.test(t)) return writing ? "updating notes" : "reading notes";
  if (/\.claude\/|skill\.md|agents\//.test(t)) return writing ? "updating instructions" : "reading instructions";
  return writing ? "writing a file" : "reading files";
}

/** A short phrase for one tool call, e.g. "checking roles". */
export function plainTool(tool: string, target = ""): string {
  switch (tool) {
    case "Bash": return bash(target);
    case "Read": case "NotebookRead": return file(target, false);
    case "Grep": case "Glob": case "LS": return file(target, false);
    case "Write": case "Edit": case "MultiEdit": case "NotebookEdit": return file(target, true);
    case "WebSearch": return "searching job sites";
    case "WebFetch": return "reading an advert online";
  }
  if (/outlook|email|mail/i.test(tool)) return "checking job alert emails";
  if (tool.startsWith("mcp__")) return "using a connected service";
  return "working";
}

/** Upper-case the first letter, for a log line: "checking roles" -> "Checking roles". */
export const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Lower-case the first letter, so "Making PDFs" can follow "Ada is ". */
export const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
