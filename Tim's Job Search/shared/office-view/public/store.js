// The live data from the bridge, shared by every part of the page.
// Parts subscribe with on("agents" | "tracker" | "docs" | "system", fn).
import { $ } from "./util.js";

export const store = {
  agents: new Map(), // id -> agent (the office scene adds drawing positions to these)
  tracker: { roles: [], actions: [], inbox: [] },
  docs: {}, // role id -> { cv, letter, cvPdf, letterPdf, prep, points, attachments }
  system: { editing: false, backup: null, cos: null, tokens: null },
};

const listeners = { agents: [], tracker: [], docs: [], system: [] };
export function on(kind, fn) { listeners[kind].push(fn); }
const emit = (kind, arg) => listeners[kind].forEach((fn) => fn(arg));

export const roleById = (id) => (store.tracker.roles || []).find((r) => r.id === id);
/** Roles Hal has been asked to work on and hasn't finished. */
export const queuedFor = (id) => (store.tracker.inbox || []).filter((i) => !i.done && i.role === id);

export function connect() {
  const ws = new WebSocket(`ws://${location.host}/live`);
  ws.onopen = () => { $("live").textContent = "Live"; $("live").classList.remove("off"); };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "snapshot") {
      store.tracker = m.tracker;
      store.docs = m.docs || {};
      store.system = m.system || store.system;
      store.agents.clear();
      emit("tracker");
      emit("docs");
      emit("system");
      emit("agents", m.agents);
    }
    if (m.type === "agents") emit("agents", m.agents);
    if (m.type === "tracker") { store.tracker = m.tracker; emit("tracker"); }
    if (m.type === "docs") { store.docs = m.docs; emit("docs"); }
    if (m.type === "system") { store.system = m.system; emit("system"); }
  };
  ws.onclose = () => {
    $("live").textContent = "Reconnecting…";
    $("live").classList.add("off");
    setTimeout(connect, 2000);
  };
}
