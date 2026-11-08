// Token meter: adds up today's token use from Claude Code's transcripts.
//
// A session's transcript is <dir>/<session>.jsonl. Its subagents' transcripts are
// <dir>/<session>/subagents/agent-<id>.jsonl, each with an agent-<id>.meta.json
// that names the agent type. Each assistant message carries a `usage` block; a
// message can appear on several lines (one per content block), so count each
// message id once.
//
// "Fresh" tokens = new input + cache writes + output: what the work really cost.
// Cache reads (re-reading the same context) are listed separately; they are much
// cheaper but add up over long runs.
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export interface Usage {
  fresh: number;
  cacheRead: number;
  output: number;
}

interface UsageBlock {
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

export const emptyUsage = (): Usage => ({ fresh: 0, cacheRead: 0, output: 0 });

export function addUsage(into: Usage, u: Usage) {
  into.fresh += u.fresh;
  into.cacheRead += u.cacheRead;
  into.output += u.output;
  return into;
}

/** Start of today in UK time, as a timestamp. */
export function startOfUkDay(now = Date.now()): number {
  const day = new Date(now).toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD
  const midnightUtc = Date.parse(`${day}T00:00:00Z`);
  // Europe/London is UTC or UTC+1; find the offset at that midnight.
  const londonHour = Number(new Date(midnightUtc).toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }));
  return midnightUtc - (londonHour % 24) * 3600_000;
}

/** Sum the usage in one transcript file since a time. Missing or unreadable files count as zero. */
export async function usageOfFile(file: string, since: number): Promise<Usage> {
  let text: string;
  try { text = await readFile(file, "utf8"); } catch { return emptyUsage(); }
  const messages = new Map<string, UsageBlock>();
  for (const line of text.split("\n")) {
    if (!line.includes('"usage"')) continue;
    let entry: { type?: string; timestamp?: string; message?: { id?: string; usage?: UsageBlock } };
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== "assistant" || !entry.message?.usage) continue;
    if (entry.timestamp && Date.parse(entry.timestamp) < since) continue;
    messages.set(entry.message.id || `line-${messages.size}`, entry.message.usage);
  }
  const total = emptyUsage();
  for (const u of messages.values()) {
    const output = u.output_tokens || 0;
    total.fresh += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + output;
    total.cacheRead += u.cache_read_input_tokens || 0;
    total.output += output;
  }
  return total;
}

/** Today's usage for a session: the main conversation, plus each subagent type. */
export async function usageOfSession(transcript: string, since: number): Promise<{ main: Usage; subagents: Map<string, Usage> }> {
  const main = await usageOfFile(transcript, since);
  const subagents = new Map<string, Usage>();
  const folder = join(dirname(transcript), basename(transcript, ".jsonl"), "subagents");
  let files: string[] = [];
  try { files = await readdir(folder); } catch { /* no subagents */ }
  for (const name of files.filter((f) => f.endsWith(".jsonl"))) {
    let type = "subagent";
    try {
      const meta = JSON.parse(await readFile(join(folder, name.replace(/\.jsonl$/, ".meta.json")), "utf8"));
      if (typeof meta.agentType === "string") type = meta.agentType;
    } catch { /* keep the generic name */ }
    const u = await usageOfFile(join(folder, name), since);
    subagents.set(type, addUsage(subagents.get(type) || emptyUsage(), u));
  }
  return { main, subagents };
}

/** Short form for the office: 12,345 -> "12k", 1,234,567 -> "1.2M". */
export function shortTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
