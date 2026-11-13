// Page start-up: loads each part and shows one view at a time, using the address
// (#overview, #roles, #leads, #interviews, #actions, #cvs, #office, #role/<id>[/<tab>])
// so Back works.
import { connect } from "./store.js";
import { $ } from "./util.js";
import "./office.js";
import "./dashboard.js";
import "./build.js";
import { showView } from "./views.js";
import { showRole, hideRole } from "./role.js";

const VIEWS = ["overview", "roles", "leads", "interviews", "actions", "cvs", "office"];

const TITLES = { overview: "Overview", roles: "Roles", leads: "Leads", interviews: "Interviews", actions: "Next actions", cvs: "CVs", office: "The office" };
let first = true;
function route() {
  let hash = location.hash.replace(/^#/, "");
  if (hash === "pipeline") hash = "roles"; // the old Pipeline tab
  const role = /^role\/([a-z0-9-]+)(?:\/([a-z]+))?$/.exec(hash);
  const view = role ? null : VIEWS.includes(hash) ? hash : "overview";
  for (const v of VIEWS) $(`v-${v}`).hidden = v !== view;
  if (role) showRole(role[1], role[2]); else hideRole();
  if (view) showView(view);
  else document.querySelectorAll("[data-nav]").forEach((a) => a.removeAttribute("aria-current"));
  window.scrollTo(0, 0);
  document.title = `${role ? "Role" : TITLES[view]} · Hal’s Job Search`;
  document.getElementById("app").classList.remove("menu-open");
  document.getElementById("menu-btn").setAttribute("aria-expanded", "false");
  if (!first) document.getElementById("main").focus({ preventScroll: true }); // tell keyboard and screen-reader users the page changed
  first = false;
}
document.getElementById("menu-btn").addEventListener("click", () => {
  const open = document.getElementById("app").classList.toggle("menu-open");
  document.getElementById("menu-btn").setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { document.getElementById("app").classList.remove("menu-open"); document.getElementById("menu-btn").setAttribute("aria-expanded", "false"); }
});
window.addEventListener("hashchange", route);
route();
connect();
