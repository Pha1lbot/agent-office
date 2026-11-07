// Page start-up: loads each part and shows one view at a time, using the address
// (#overview, #roles, #leads, #interviews, #actions, #cvs, #office, #role/<id>[/<tab>])
// so Back works.
import { connect } from "./store.js";
import { $ } from "./util.js";
import "./office.js";
import "./dashboard.js";
import { showView } from "./views.js";
import { showRole, hideRole } from "./role.js";

const VIEWS = ["overview", "roles", "leads", "interviews", "actions", "cvs", "office"];

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
}
window.addEventListener("hashchange", route);
route();
connect();
