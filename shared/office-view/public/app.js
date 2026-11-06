// Page start-up: loads each part and switches between the Office, the Pipeline
// and a role's page (#role/<id>), using the address so Back works.
import { connect } from "./store.js";
import { $ } from "./util.js";
import "./office.js";
import "./dashboard.js";
import { showRole, hideRole } from "./role.js";

function route() {
  const hash = location.hash.replace(/^#/, "");
  const role = /^role\/([a-z0-9-]+)$/.exec(hash);
  const tab = role ? "pipeline" : hash === "pipeline" || hash === "roles" ? "pipeline" : "office";
  document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
  $("tab-office").hidden = tab !== "office";
  $("tab-pipeline").hidden = tab !== "pipeline" || !!role;
  if (role) showRole(role[1]); else hideRole();
  window.scrollTo(0, 0);
}
document.querySelector(".tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]");
  if (b) location.hash = b.dataset.tab === "office" ? "" : b.dataset.tab;
});
window.addEventListener("hashchange", route);
route();
connect();
