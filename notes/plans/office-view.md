# Plan: Office view for agents

**Status:** Idea / not started
**Written:** 2026-11-06, handed over from a Claude chat

## Goal

Show Tim's agents as little pixel-art coworkers in an office, so he can see at a glance who is working, who is waiting for him and who has finished. Inspired by a Reddit post in r/AI_Agents ("made my AI agents visible as little coworkers").

## Existing projects to learn from or fork

- **Pixel Agents** (VS Code extension, MIT): https://github.com/pablodelucca/pixel-agents. Reads Claude Code's JSONL transcript files to work out what each agent is doing. Most of the other projects are based on it.
- **Bit Office** (TypeScript, Next.js, PixiJS, MIT): https://github.com/longyangxi/bit-office. Runs a local gateway daemon, auto-detects AI CLIs (Claude, Codex, Gemini and others), and has a "Team Leader" agent that hands out work.
- **pixtuoid** (Rust, terminal UI, MIT): https://github.com/IvanWng97/pixtuoid. Claude Code sessions shown as animated coworkers in the terminal.

## How it would work

Three layers:

1. **Agents.** Claude Code sessions (the agents in `agents/`). Each one reports events such as started task, using a tool, waiting for permission, done.
2. **Bridge.** A small local server (Node or Python) that collects the events, keeps track of each agent's current state, and pushes updates to the browser over a WebSocket.
3. **Office view.** A web page using PixiJS or Phaser with a tile map and sprite sheets. Each state has an animation: typing, walking, waiting (`?`), asleep. Clicking a character shows its logs.

## Decisions so far

- **Use Claude Code** as the agent runtime. The existing visualisers already support it, and usage counts against the subscription plan rather than a per-token bill.
- **Report events with Claude Code hooks** (PreToolUse, PostToolUse, Notification, Stop and so on) that post to the bridge. This is cleaner than parsing transcript files. Hooks cost no tokens.
- **Use the Claude Agent SDK later** for any non-coding agents that need more control. Both kinds should send events in the same format so the same office view works for both.

## Token and limit notes

- The office view itself uses no tokens, as long as it only reads events or logs and never calls a model just to update the screen.
- What uses the weekly limit: running several agents at the same time, a "team leader" agent's planning and review calls, agents passing long messages to each other, and idle agents that keep asking the model whether there is work.
- Claude Code shares weekly limits with normal Claude chats.
- To keep usage down: use a smaller model (Haiku or Sonnet) for routine agents, have agents pass short summaries rather than full transcripts, run only a few agents at a time, and show each agent's token use on its character.

## Suggested first steps

1. Install Pixel Agents in VS Code and watch a couple of Claude Code sessions in it.
2. Build a minimal version here: two or three fake agents, one room, four animations (typing, walking, waiting, asleep), driven by a bridge server.
3. Wire up real Claude Code hooks to the bridge.
4. Add each agent's token and context use to the view.

## Open questions for Tim

- Browser view, VS Code panel or terminal?
- Fork an existing project or build from scratch?
- Which agents go in the office first?
