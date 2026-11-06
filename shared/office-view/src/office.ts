// The office's state: who is in it and what each agent is doing.
// Pure logic, no network or files, so it can be tested directly.

export type State = "typing" | "walking" | "waiting" | "idle" | "asleep";
export type Place = "desk" | "shelf" | "web";

/** What a Claude Code hook (via hooks/report.mjs) or the fake agents send to the bridge. */
export interface Report {
  hook_event_name: string; // SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, SubagentStop, SessionEnd
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  agent_type?: string; // set when the hook fired inside a subagent
  subagent_type?: string; // for Task/Agent tool calls: which subagent is being called
  description?: string; // short task description for Task/Agent calls
  target?: string; // short file path, command, URL or search
  message?: string; // Notification text
}

export interface LogEntry {
  ts: number;
  text: string;
}

export interface Agent {
  id: string;
  name: string;
  colour: number;
  team: boolean; // one of Tim's named agents (always has a desk)
  state: State;
  place: Place;
  detail: string;
  since: number; // when the state last changed
  lastSeen: number; // last report of any kind (0 = never)
  tools: number; // tool calls today, a rough measure of how busy it has been
  log: LogEntry[];
}

export const TEAM = [
  { id: "chief-of-staff", name: "Chief of Staff", colour: 0x4f6bed },
  { id: "lead-recruiter", name: "Lead Recruiter", colour: 0x2f9e6e },
  { id: "senior-admin", name: "Senior Admin", colour: 0xd9822b },
  { id: "admin", name: "Admin", colour: 0x9b59b6 },
];
const VISITOR_COLOURS = [0xc0392b, 0x16a085, 0x7f8c8d, 0xb7950b];

/** Folder name that marks a session as the main agent-office session (Chief of Staff). */
export const REPO_NAME = "agent-office";
const DELEGATE_TOOLS = new Set(["Task", "Agent"]);
const SHELF_TOOLS = new Set(["Read", "Grep", "Glob", "LS", "NotebookRead"]);
const WEB_TOOLS = new Set(["WebFetch", "WebSearch"]);
const LOG_LIMIT = 50;

export const IDLE_TO_ASLEEP_MS = 5 * 60_000;
export const WAITING_TO_ASLEEP_MS = 15 * 60_000;
export const BUSY_TIMEOUT_MS = 10 * 60_000;

interface Session {
  mainId: string;
  active: string[]; // subagents currently running, most recent last
}

function folderName(cwd = ""): string {
  const parts = cwd.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] || "session";
}

function inRepo(cwd = ""): boolean {
  return cwd.split(/[\\/]+/).includes(REPO_NAME);
}

function short(text = "", max = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

export class Office {
  agents = new Map<string, Agent>();
  private sessions = new Map<string, Session>();
  private visitors = 0;

  constructor(now = Date.now()) {
    for (const member of TEAM) {
      this.agents.set(member.id, this.blank(member.id, member.name, member.colour, true, now));
    }
  }

  private blank(id: string, name: string, colour: number, team: boolean, now: number): Agent {
    return {
      id, name, colour, team, state: "asleep", place: "desk", detail: "Not started yet",
      since: now, lastSeen: 0, tools: 0, log: [],
    };
  }

  /** The agent for a subagent type, creating a visitor desk for unknown ones. */
  private agentFor(id: string, name: string, now: number): Agent {
    let agent = this.agents.get(id);
    if (!agent) {
      agent = this.blank(id, name, VISITOR_COLOURS[this.visitors++ % VISITOR_COLOURS.length], false, now);
      this.agents.set(id, agent);
    }
    return agent;
  }

  private subagent(type: string, now: number): Agent {
    return this.agentFor(type, type.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), now);
  }

  private session(report: Report, now: number): Session {
    const key = report.session_id || "unknown";
    let session = this.sessions.get(key);
    if (!session) {
      const mainId = inRepo(report.cwd) ? "chief-of-staff" : `session-${key.slice(0, 8)}`;
      this.agentFor(mainId, folderName(report.cwd), now);
      session = { mainId, active: [] };
      this.sessions.set(key, session);
    }
    return session;
  }

  private set(agent: Agent, state: State, detail: string, now: number, place: Place = "desk") {
    if (agent.state !== state || agent.place !== place) agent.since = now;
    agent.state = state;
    agent.place = place;
    agent.detail = short(detail);
  }

  private note(agent: Agent, text: string, now: number) {
    agent.lastSeen = now;
    agent.log.push({ ts: now, text: short(text, 120) });
    if (agent.log.length > LOG_LIMIT) agent.log.splice(0, agent.log.length - LOG_LIMIT);
  }

  /** Apply one report. Returns the ids of agents that changed. */
  handle(report: Report, now = Date.now()): string[] {
    const session = this.session(report, now);
    const main = this.agents.get(session.mainId)!;
    const changed = new Set<string>();
    const touch = (agent: Agent) => changed.add(agent.id);
    // Who did a tool call: the subagent named in the hook, else the one running, else the main session.
    const actor = (): Agent => {
      if (report.agent_type) return this.subagent(report.agent_type, now);
      const running = session.active[session.active.length - 1];
      return running ? this.agents.get(running)! : main;
    };
    const tool = report.tool_name || "tool";
    const label = report.target ? `${tool} ${report.target}` : tool;

    switch (report.hook_event_name) {
      case "SessionStart":
        if (main.state === "asleep") this.set(main, "idle", "Ready", now);
        this.note(main, "Session started", now);
        touch(main);
        break;

      case "UserPromptSubmit":
        this.set(main, "typing", "Thinking", now);
        this.note(main, "Tim sent a message", now);
        touch(main);
        break;

      case "PreToolUse": {
        if (DELEGATE_TOOLS.has(tool) && report.subagent_type && !report.agent_type) {
          const sub = this.subagent(report.subagent_type, now);
          session.active.push(sub.id);
          const task = report.description || "New task";
          this.set(sub, "typing", task, now);
          this.note(sub, `Briefed by ${main.name}: ${task}`, now);
          sub.tools++;
          this.set(main, "idle", `Waiting on ${sub.name}`, now);
          this.note(main, `Briefed ${sub.name}: ${task}`, now);
          touch(sub);
          touch(main);
          break;
        }
        const who = actor();
        const place: Place = SHELF_TOOLS.has(tool) ? "shelf" : WEB_TOOLS.has(tool) ? "web" : "desk";
        this.set(who, place === "desk" ? "typing" : "walking", label, now, place);
        who.tools++;
        this.note(who, label, now);
        touch(who);
        break;
      }

      case "PostToolUse": {
        if (DELEGATE_TOOLS.has(tool) && report.subagent_type && !report.agent_type) {
          const sub = this.subagent(report.subagent_type, now);
          const at = session.active.lastIndexOf(sub.id);
          if (at >= 0) session.active.splice(at, 1);
          this.set(sub, "idle", "Finished", now);
          this.note(sub, "Finished and reported back", now);
          this.set(main, "typing", `Reading ${sub.name}'s report`, now);
          touch(sub);
          touch(main);
          break;
        }
        const who = actor();
        this.set(who, "typing", "Thinking", now);
        touch(who);
        break;
      }

      case "Notification": {
        const who = actor();
        const text = report.message || "Needs you";
        this.set(who, "waiting", text, now);
        this.note(who, text, now);
        touch(who);
        break;
      }

      case "SubagentStop":
        if (report.agent_type) {
          const sub = this.subagent(report.agent_type, now);
          if (sub.state !== "idle") {
            this.set(sub, "idle", "Finished", now);
            this.note(sub, "Finished", now);
            touch(sub);
          }
        }
        break;

      case "Stop":
        for (const id of session.active.splice(0)) {
          const sub = this.agents.get(id)!;
          this.set(sub, "idle", "Finished", now);
          touch(sub);
        }
        this.set(main, "waiting", "Your turn", now);
        this.note(main, "Finished, waiting for Tim", now);
        touch(main);
        break;

      case "SessionEnd":
        for (const id of [session.mainId, ...session.active.splice(0)]) {
          const agent = this.agents.get(id)!;
          this.set(agent, "asleep", "Session ended", now);
          touch(agent);
        }
        this.note(main, "Session ended", now);
        this.sessions.delete(report.session_id || "unknown");
        break;
    }
    return [...changed];
  }

  /** Time-based changes (dozing off, stuck agents). Returns the ids of agents that changed. */
  tick(now = Date.now()): string[] {
    const changed: string[] = [];
    for (const agent of this.agents.values()) {
      const quiet = now - Math.max(agent.since, agent.lastSeen);
      if (agent.state === "idle" && quiet > IDLE_TO_ASLEEP_MS) {
        this.set(agent, "asleep", "Dozing", now);
      } else if (agent.state === "waiting" && quiet > WAITING_TO_ASLEEP_MS) {
        this.set(agent, "asleep", agent.detail === "Your turn" ? "Dozing until Tim's back" : "Gave up waiting", now);
      } else if ((agent.state === "typing" || agent.state === "walking") && quiet > BUSY_TIMEOUT_MS) {
        this.set(agent, "idle", "Gone quiet", now);
      } else {
        continue;
      }
      changed.push(agent.id);
    }
    return changed;
  }

  snapshot(): Agent[] {
    return [...this.agents.values()];
  }
}
