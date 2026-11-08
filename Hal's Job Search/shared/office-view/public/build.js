// The build label at the top left: which build is running and whether it's
// current. The server sends system.build (src/build.ts). A server too old to
// send it is running older code than this page, so it needs a restart.
import { store, on } from "./store.js";
import { $ } from "./util.js";

const COLOURS = { ok: "var(--typing)", warn: "var(--waiting)", bad: "var(--danger)", none: "var(--muted)" };

function status(b) {
  if (b === undefined) return { level: "warn", short: "Restart the office to update", long: "The office server is older than this page: close the office window and open it again." };
  if (b === null) return { level: "none", short: "Build unknown", long: "This copy isn't a git folder, so the build can't be checked." };
  const day = b.date ? new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  const n = `Build ${b.number}`;
  if (b.branch && b.branch !== "main") return { level: "bad", short: `${n} · not on main (${b.branch})`, long: `This folder is on the branch "${b.branch}", not main, so it won't get merged work. Run "git checkout main" in it.` };
  if (b.restart) return { level: "warn", short: `${n} · restart to update`, long: "A newer build has arrived in this folder: close the office window and open it again." };
  if (b.behind > 0) return { level: "warn", short: `${n} · ${b.behind} update${b.behind === 1 ? "" : "s"} on GitHub`, long: `GitHub's main has ${b.behind} newer commit${b.behind === 1 ? "" : "s"} that this folder hasn't pulled. The automatic sync may be failing: run "git pull" in the folder.` };
  return { level: "ok", short: `${n} · ${day}`, long: "Up to date with GitHub." };
}

export function renderBuild() {
  if (!store.connected) return;
  const b = store.system.build;
  const s = status(b);
  const detail = b ? `\nBuild ${b.number} (${b.hash}), ${b.date ? new Date(b.date).toLocaleString("en-GB") : ""}\nBranch: ${b.branch}\nFolder: ${b.folder}` : "";
  for (const el of [$("build"), $("build-foot"), $("build-dot")]) {
    if (!el) continue;
    if (el.id !== "build-dot") el.textContent = s.short;
    el.className = el.id === "build-dot" ? "bdot" : `${el.id === "build" ? "build" : "build-foot"} ${s.level === "ok" || s.level === "none" ? "" : s.level}`.trim();
    el.style.setProperty("--bstate", COLOURS[s.level]);
    el.title = s.long + detail;
  }
}

on("system", () => { store.connected = true; renderBuild(); });
