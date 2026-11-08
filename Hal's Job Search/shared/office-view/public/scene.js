// The office in 3D (Three.js).
// office.js owns the live data; this file draws it. Each person goes where their
// live state says: desk when working or waiting, the files shelf or web kiosk when
// looking things up, the kitchen or the sofas when idle, and a sofa nap when asleep.
import * as THREE from "three";
import { OrbitControls } from "/vendor/three/OrbitControls.js";
import { RoundedBoxGeometry } from "/vendor/three/RoundedBoxGeometry.js";
import { CSS2DRenderer, CSS2DObject } from "/vendor/three/CSS2DRenderer.js";
import { AISLE, LOOKS, ZONES, BOXES, GLASS, SPOTS, W, D, path } from "./floorplan.js";

// Each live agent id, and how they look.
const LOOK_OF = { "chief-of-staff": "cass", "lead-recruiter": "rita", writer: "wren", "interview-coach": "cole", admin: "ada" };
const VISITOR = { body: 0x7b8794, hair: 0x4a3a2a, skin: 0xe9bf98 };
// The tag's dot: what someone is doing.
const STATE_DOT = { working: "#4fbf7f", looking: "#3fa7d6", waiting: "#f2b134", coffee: "#c9925a", chilling: "#9aa0b5", asleep: "#6b7090", walking: "#3fa7d6" };
const SPEED = 1.7; // metres per second

let host, renderer, labels, scene, camera, controls, sun, turn = 0;
const centre = new THREE.Vector3(W / 2 - 1, 0.8, D / 2 - 1.2);
const people = new Map(); // agent id -> { look, parts, x, z, face, pose, spot, queue, cup, ... }
let onPick = () => {};
let selectedId = null;

export function setSelected(id) { selectedId = id; }

export function start(el, opts = {}) {
  host = el; onPick = opts.onPick || onPick;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    host.innerHTML = `<p class="no-3d">This browser can't show the 3D office (WebGL is off). The cards below still work.</p>`;
    return false;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);
  labels = new CSS2DRenderer();
  Object.assign(labels.domElement.style, { position: "absolute", top: "0", left: "0", pointerEvents: "none" });
  host.appendChild(labels.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2d3d);
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false; controls.enableDamping = true;
  controls.screenSpacePanning = true; controls.minZoom = 0.6; controls.maxZoom = 4;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.enableZoom = false; // zoom with the buttons, so scrolling the page still works
  new ResizeObserver(resize).observe(host); resize(); placeCamera();

  scene.add(new THREE.HemisphereLight(0xfff7ea, 0x8a8170, 1.6));
  sun = new THREE.DirectionalLight(0xfff2dd, 2.3);
  sun.position.set(W / 2 + 10, 24, D / 2 + 6); sun.target.position.copy(centre);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 16, bottom: -16, near: 1, far: 70 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  buildRoom();
  tools();
  pickOnClick();
  return true;
}

function placeCamera() {
  const a = Math.PI / 4 + turn * Math.PI / 2;
  camera.position.set(centre.x + Math.sin(a) * 40, 34, centre.z + Math.cos(a) * 40);
  controls.target.copy(centre);
  camera.lookAt(centre);
}
function resize() {
  const { clientWidth: w, clientHeight: h } = host;
  if (!w || !h) return;
  renderer.setSize(w, h); labels.setSize(w, h);
  const aspect = w / h, view = Math.max(17, 34 / aspect);
  Object.assign(camera, { left: -view * aspect / 2, right: view * aspect / 2, top: view / 2, bottom: -view / 2 });
  camera.updateProjectionMatrix();
}
function tools() {
  const bar = document.createElement("div"); bar.className = "scene-tools";
  bar.innerHTML = `<button type="button" data-t="in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-t="out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-t="turn" title="Turn the room" aria-label="Turn the room">⟳</button><button type="button" data-t="home" title="Recentre" aria-label="Recentre">⌖</button><button type="button" data-t="full" title="Full screen" aria-label="Full screen">⛶</button>`;
  host.appendChild(bar);
  const zoom = (f) => { camera.zoom = THREE.MathUtils.clamp(camera.zoom * f, 0.6, 4); camera.updateProjectionMatrix(); };
  bar.addEventListener("click", (e) => {
    const t = e.target.closest("button")?.dataset.t;
    if (t === "in") zoom(1.25);
    if (t === "out") zoom(0.8);
    if (t === "turn") { turn = (turn + 1) % 4; placeCamera(); walls(); }
    if (t === "home") { camera.zoom = 1; camera.updateProjectionMatrix(); turn = 0; placeCamera(); walls(); }
    if (t === "full") document.fullscreenElement ? document.exitFullscreen() : host.requestFullscreen?.();
  });
}
/** Clicking near someone picks them: the nearest person on screen within a short distance. */
function pickOnClick() {
  let down = null;
  const v = new THREE.Vector3();
  renderer.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; // a drag, not a click
    const r = renderer.domElement.getBoundingClientRect();
    let best = null, bestDist = 48; // pixels
    for (const [id, p] of people) {
      for (const h of [0.4, 1.0, 1.6]) { // feet, middle and head
        v.set(p.x, h, p.z).project(camera);
        const d = Math.hypot((v.x + 1) / 2 * r.width + r.left - e.clientX, (1 - v.y) / 2 * r.height + r.top - e.clientY);
        if (d < bestDist) { bestDist = d; best = id; }
      }
    }
    if (best) onPick(best);
  });
}

// ---------- Building the room ----------
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
const glow = (c, i = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i });
function mesh(geo, m, x, y, z, parent = scene) {
  const o = new THREE.Mesh(geo, m instanceof THREE.Material || Array.isArray(m) ? m : mat(m));
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
const rbox = (w, h, d, r = 0.03) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
const cyl = (rt, rb, h, s = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

let wallSets = {};
const screens = [];
const todayCanvas = document.createElement("canvas"); todayCanvas.width = 512; todayCanvas.height = 256;
const todayTex = new THREE.CanvasTexture(todayCanvas); todayTex.colorSpace = THREE.SRGBColorSpace; todayTex.anisotropy = 8;
let boardLines = ["", ""];
// The TODAY board on the back wall shows the tracker's numbers and today's tokens.
function makeBoard() {
  mesh(new THREE.BoxGeometry(2.1, 1.15, 0.06), mat(0x2a2e39), 11.25, 1.75, 0.04, wallSets.back);
  mesh(new THREE.PlaneGeometry(2, 1.05), new THREE.MeshStandardMaterial({ map: todayTex, emissive: 0xffffff, emissiveMap: todayTex, emissiveIntensity: 0.35 }), 11.25, 1.75, 0.075, wallSets.back);
  paintBoard();
}
export function setBoard(line1, line2) { boardLines = [line1, line2]; if (scene) paintBoard(); }
function paintBoard() {
  const [line1, line2] = boardLines;
  const g = todayCanvas.getContext("2d");
  g.fillStyle = "#f7f8fc"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#5b4bff"; g.font = "800 44px system-ui, sans-serif"; g.textAlign = "center"; g.fillText("TODAY", 256, 66);
  g.fillStyle = "#1f2230"; g.font = "600 34px system-ui, sans-serif"; g.fillText(line1 || "", 256, 140);
  g.fillStyle = "#6b7083"; g.font = "500 28px system-ui, sans-serif"; g.fillText(line2 || "", 256, 200);
  todayTex.needsUpdate = true;
}
function walls() {
  const hide = [["front", "right"], ["front", "left"], ["back", "left"], ["back", "right"]][turn];
  for (const [k, g] of Object.entries(wallSets)) g.visible = !hide.includes(k);
}
function buildRoom() {
  // ---------- Floors ----------
  // Wooden floor tiles, 1 m square, each made of a few planks with a little grain.
  const planks = canvasTex(512, 512, (g, w, h) => {
    const tones = ["#d9a86e", "#d3a064", "#dfb078", "#d6a56a"];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const x0 = c * 256, y0 = r * 256;
      for (let p = 0; p < 4; p++) {
        g.fillStyle = tones[(r * 2 + c + p) % 4]; g.fillRect(x0, y0 + p * 64, 256, 64);
        g.strokeStyle = "#0000000c"; g.lineWidth = 1;
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x0, y0 + p * 64 + 12 + i * 13); g.bezierCurveTo(x0 + 90, y0 + p * 64 + 8 + i * 13, x0 + 170, y0 + p * 64 + 18 + i * 13, x0 + 256, y0 + p * 64 + 12 + i * 13); g.stroke(); }
        g.strokeStyle = "#b5824a55"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0 + p * 64); g.lineTo(x0 + 256, y0 + p * 64); g.stroke();
      }
    }
    g.strokeStyle = "#a9773f"; g.lineWidth = 4;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 256); g.lineTo(w, i * 256); g.stroke(); }
  }, [W / 2, D / 2]);
  const tiles = canvasTex(256, 256, (g) => {
    g.fillStyle = "#e9e6e0"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#d8d3cb"; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
    g.strokeStyle = "#c2bcb2"; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
    g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  }, [4, 3.2]);
  const rugTex = canvasTex(256, 256, (g) => {
    g.fillStyle = "#b9a58a"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#a48f72"; g.lineWidth = 2; for (let i = 0; i < 256; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); }
    g.strokeStyle = "#8d785c"; g.lineWidth = 10; g.strokeRect(10, 10, 236, 236);
  });
  mesh(new THREE.BoxGeometry(W, 0.3, D), new THREE.MeshStandardMaterial({ map: planks, roughness: 0.8 }), W / 2, -0.15, D / 2);
  for (const z of ZONES) {
    if (z.name === "kitchen") mesh(new THREE.BoxGeometry(z.w, 0.02, z.d), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.5 }), z.x + z.w / 2, 0.01, z.z + z.d / 2);
    if (z.name === "rug") mesh(rbox(z.w, 0.03, z.d, 0.01), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }), z.x + z.w / 2, 0.015, z.z + z.d / 2);
    if (z.name === "halrug") mesh(rbox(z.w, 0.03, z.d, 0.01), mat(0x3c4a6b, { roughness: 1 }), z.x + z.w / 2, 0.015, z.z + z.d / 2);
  }

  // ---------- Walls: the two furthest from you stay up; the ones in front are hidden ----------
  const WALL = 0x4b5166, WH = 3, WT = 0.3;
  wallSets = { back: new THREE.Group(), left: new THREE.Group(), front: new THREE.Group(), right: new THREE.Group() };
  Object.values(wallSets).forEach((g) => scene.add(g));
  function wall(g, w, d, x, z) {
    mesh(new THREE.BoxGeometry(w, WH, d), mat(WALL, { roughness: 0.9 }), x, WH / 2, z, g);
    mesh(new THREE.BoxGeometry(w + 0.02, 0.14, d + 0.02), mat(0x2a2e39), x, 0.07, z, g); // skirting
  }
  wall(wallSets.back, W + WT * 2, WT, W / 2, -WT / 2);
  wall(wallSets.left, WT, D, -WT / 2, D / 2);
  wall(wallSets.front, W + WT * 2, WT, W / 2, D + WT / 2);
  wall(wallSets.right, WT, D, W + WT / 2, D / 2);
  const view = canvasTex(256, 160, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#cfe9d0"); sky.addColorStop(1, "#7fae6b"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = "#5f8f4e"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(i * 32, h, 30 + (i % 3) * 10, 0, Math.PI * 2); g.fill(); }
  });
  function windowOn(g, x, z, alongX) {
    const frame = mat(0x2a2e39), w = 2.4, h = 1.4;
    const pane = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: view, emissive: 0xffffff, emissiveMap: view, emissiveIntensity: 0.55 }), x, 1.75, z, g);
    if (!alongX) pane.rotation.y = Math.PI / 2;
    const bar = (bw, bh, ox, oy) => mesh(alongX ? new THREE.BoxGeometry(bw, bh, 0.06) : new THREE.BoxGeometry(0.06, bh, bw), frame, x + (alongX ? ox : 0), 1.75 + oy, z + (alongX ? 0 : ox), g);
    bar(w + 0.12, 0.08, 0, h / 2); bar(w + 0.12, 0.08, 0, -h / 2); bar(0.08, h, -w / 2, 0); bar(0.08, h, w / 2, 0); bar(0.06, h, 0, 0); bar(w, 0.05, 0, 0);
  }
  for (const x of [8.6, 13.9, 20.5]) windowOn(wallSets.back, x, 0.01, true);
  makeBoard();

  windowOn(wallSets.left, 0.01, 8, false);
  // A door in the back wall, beside the files shelf
  mesh(new THREE.BoxGeometry(1.3, 2.3, 0.05), mat(0x2f3340), 15.8, 1.15, 0.02, wallSets.back);
  for (const dx of [-0.7, 0.7]) mesh(new THREE.BoxGeometry(0.1, 2.4, 0.12), mat(0xc8964f), 15.8 + dx, 1.2, 0.05, wallSets.back);
  mesh(new THREE.BoxGeometry(1.5, 0.1, 0.12), mat(0xc8964f), 15.8, 2.4, 0.05, wallSets.back);
  // Whiteboard in Tim's office
  const board = canvasTex(384, 240, (g, w, h) => {
    g.fillStyle = "#f7f7f5"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5b4bff"; g.lineWidth = 4;
    const n = [[70, 70], [150, 120], [70, 170], [230, 70]];
    for (const [a, b] of [[0, 1], [1, 2], [1, 3]]) { g.beginPath(); g.moveTo(...n[a]); g.lineTo(...n[b]); g.stroke(); }
    g.fillStyle = "#5b4bff"; for (const [x, y] of n) { g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); }
    g.fillStyle = "#e06c75"; g.fillRect(290, 140, 18, 60); g.fillStyle = "#22a06b"; g.fillRect(318, 110, 18, 90); g.fillStyle = "#3b82f6"; g.fillRect(346, 80, 18, 120);
  });
  const grey = mat(0xbbbbbb);
  mesh(new THREE.BoxGeometry(0.06, 1.2, 1.9), [new THREE.MeshStandardMaterial({ map: board }), grey, grey, grey, grey, grey], 0.05, 1.7, 3.6, wallSets.left); // the board faces into the room (+x)
  walls();

  // ---------- Glass office for Tim ----------
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transmission: 0.7, opacity: 0.28, transparent: true, roughness: 0.05 });
  for (const gl of GLASS) {
    const w = Math.max(gl.w, 0.04), d = Math.max(gl.d, 0.04), cx = gl.x + gl.w / 2, cz = gl.z + gl.d / 2;
    mesh(new THREE.BoxGeometry(w, 2.5, d), glass, cx, 1.25, cz).castShadow = false;
    for (const y of [0.04, 2.5]) mesh(new THREE.BoxGeometry(Math.max(w, 0.08), 0.08, Math.max(d, 0.08)), mat(0x2a2e39), cx, y, cz);
  }
  const plate = canvasTex(320, 64, (g) => { g.fillStyle = "#2a2e39"; g.fillRect(0, 0, 320, 64); g.fillStyle = "#fff"; g.font = "700 30px system-ui"; g.textAlign = "center"; g.fillText("TIM · Chief of Staff", 160, 43); });
  mesh(new THREE.PlaneGeometry(1.9, 0.38), new THREE.MeshBasicMaterial({ map: plate }), 4.2, 2.25, 6.46);

  // ---------- Furniture ----------
  const WOOD = 0xd8a468, METAL = 0x2b2f3a, DARK = 0x3a3f4c;
  function chair(x, z, rotY = 0, colour = DARK) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      mesh(new THREE.BoxGeometry(0.05, 0.04, 0.3), METAL, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15, g).rotation.y = a;
      mesh(new THREE.SphereGeometry(0.035, 8, 6), 0x111111, Math.sin(a) * 0.29, 0.035, Math.cos(a) * 0.29, g);
    }
    mesh(cyl(0.03, 0.03, 0.38), METAL, 0, 0.25, 0, g);
    mesh(rbox(0.52, 0.09, 0.5, 0.04), colour, 0, 0.47, 0, g);
    mesh(rbox(0.5, 0.62, 0.08, 0.04), colour, 0, 0.85, -0.26, g);
    for (const s of [-1, 1]) mesh(rbox(0.05, 0.05, 0.36, 0.02), METAL, s * 0.27, 0.65, 0, g);
  }
  function monitor(x, y, z, rotY = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
    mesh(rbox(0.25, 0.02, 0.18, 0.01), METAL, 0, 0.01, 0, g);
    mesh(new THREE.BoxGeometry(0.05, 0.25, 0.05), METAL, 0, 0.14, -0.02, g);
    mesh(rbox(0.95, 0.58, 0.05, 0.02), 0x1b1e27, 0, 0.53, 0, g);
    const ui = canvasTex(256, 160, (c, w, h) => {
      c.fillStyle = "#2b2470"; c.fillRect(0, 0, w, h); c.fillStyle = "#8f86ff"; c.fillRect(12, 14, 150, 12);
      c.fillStyle = "#c8c3ff"; for (let i = 0; i < 5; i++) c.fillRect(12, 40 + i * 20, 90 + ((i * 37) % 120), 8);
      c.fillStyle = "#6c63ff"; c.fillRect(190, 40, 50, 90);
    });
    const m = new THREE.MeshStandardMaterial({ map: ui, emissive: 0xffffff, emissiveMap: ui, emissiveIntensity: 0.15 });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.5), m); s.position.set(0, 0.53, 0.027); g.add(s);
    return m;
  }
  function plant(x, z, size = 1) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(size); scene.add(g);
    mesh(cyl(0.22, 0.17, 0.42, 18), 0xf1ede6, 0, 0.21, 0, g);
    mesh(cyl(0.2, 0.2, 0.03, 18), 0x5a3d2b, 0, 0.41, 0, g);
    const leaf = mat(0x3f8a4a, { roughness: 0.6 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, tilt = 0.5 + (i % 3) * 0.2;
      const l = mesh(new THREE.SphereGeometry(0.1, 10, 8), leaf, Math.sin(a) * 0.12, 0.75 + (i % 3) * 0.12, Math.cos(a) * 0.12, g);
      l.scale.set(0.8, 3.2, 0.25); l.rotation.set(Math.cos(a) * tilt, 0, -Math.sin(a) * tilt);
    }
  }
  screens.length = 0;
  for (const b of BOXES) {
    const cx = b.x + b.w / 2, cz = b.z + b.d / 2, y0 = b.y || 0;
    if (b.kind === "desk") {
      const cass = b.colour === 0x6b4426;
      mesh(rbox(b.w, 0.06, b.d, 0.02), cass ? 0x8a5a36 : WOOD, cx, b.h - 0.03, cz);
      for (const sx of [-1, 1]) {
        for (const zz of [b.z + 0.1, b.z + b.d - 0.1]) mesh(new THREE.BoxGeometry(0.06, b.h - 0.06, 0.06), METAL, cx + sx * (b.w / 2 - 0.08), (b.h - 0.06) / 2, zz);
        mesh(new THREE.BoxGeometry(0.06, 0.05, b.d - 0.2), METAL, cx + sx * (b.w / 2 - 0.08), 0.03, cz);
      }
      mesh(rbox(0.45, 0.58, b.d - 0.15, 0.02), METAL, cx + b.w / 2 - 0.35, 0.36, cz); // drawers
      mesh(rbox(0.5, 0.02, 0.17, 0.01), 0x22252f, cx, b.h + 0.01, b.z + 0.3); // keyboard
      chair(cx, b.z - 0.5, 0, cass ? 0x24262f : DARK);
    } else if (b.kind === "screen") {
      screens.push({ m: monitor(cx, 0.75, cz - 0.1, Math.PI), x: cx, z: cz });
    } else if (b.kind === "table") {
      mesh(rbox(b.w, 0.06, b.d, 0.02), WOOD, cx, b.h - 0.03, cz);
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(new THREE.BoxGeometry(0.06, b.h - 0.06, 0.06), METAL, cx + lx * (b.w / 2 - 0.08), (b.h - 0.06) / 2, cz + lz * (b.d / 2 - 0.08));
    } else if (b.kind === "stool") {
      mesh(cyl(0.2, 0.2, 0.06), WOOD, cx, b.h, cz); mesh(cyl(0.025, 0.025, b.h), METAL, cx, b.h / 2, cz); mesh(cyl(0.16, 0.16, 0.03), METAL, cx, 0.015, cz);
    } else if (b.kind === "plant") {
      plant(cx, cz, b.h / 1.3);
    } else if (b.kind === "shelf") {
      const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
      for (const y of [0.05, 0.7, 1.35, 1.95]) mesh(rbox(b.w, 0.05, b.d, 0.01), WOOD, 0, y, 0, g);
      for (const sx of [-1, 0, 1]) mesh(new THREE.BoxGeometry(0.05, 1.95, b.d), WOOD, sx * (b.w / 2 - 0.03), 0.98, 0, g);
      const cols = [0x5b4bff, 0xe06c75, 0xf2b134, 0x22a06b, 0xf1ede6];
      for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(0.12, 0.42 + (i % 3) * 0.05, 0.3), cols[i % 5], -1 + i * 0.14, 1.6 + (i % 3) * 0.025, 0, g);
      for (let i = 0; i < 3; i++) mesh(rbox(0.45, 0.32, 0.38, 0.02), 0xc9b08a, -0.8 + i * 0.55, 0.25, 0, g);
      mesh(rbox(0.5, 0.3, 0.3, 0.02), 0xc9b08a, 0.6, 0.88, 0, g);
    } else if (b.kind === "kiosk") {
      mesh(rbox(0.5, 1.0, 0.4, 0.04), METAL, cx, 0.5, cz);
      screens.push({ m: monitor(cx, 1.0, cz, 0), x: cx, z: cz, always: true });
    } else if (b.kind === "server") {
      mesh(rbox(b.w, b.h, b.d, 0.03), 0x262a34, cx, b.h / 2, cz);
      for (let r = 0; r < 6; r++) {
        mesh(new THREE.BoxGeometry(b.w - 0.08, 0.16, 0.02), 0x1a1d25, cx, 0.2 + r * 0.2, b.z + b.d + 0.005);
        for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(0.05, 0.03, 0.01), glow(i ? 0x6c63ff : 0x3b82f6, 2), cx - 0.18 + i * 0.07, 0.2 + r * 0.2, b.z + b.d + 0.02);
      }
    } else if (b.kind === "counter") {
      mesh(new THREE.BoxGeometry(b.w, b.h - 0.05, b.d), 0x2f3440, cx, (b.h - 0.05) / 2, cz);
      mesh(rbox(b.w + 0.04, 0.05, b.d + 0.04, 0.01), WOOD, cx, b.h - 0.025, cz);
    } else if (b.kind === "coffee") {
      mesh(rbox(0.42, 0.5, 0.4, 0.04), 0x1d2029, cx, y0 + 0.25, cz);
      mesh(new THREE.BoxGeometry(0.3, 0.06, 0.12), METAL, cx, y0 + 0.08, cz - 0.24);
      mesh(new THREE.BoxGeometry(0.06, 0.04, 0.01), glow(0x22a06b, 2), cx + 0.1, y0 + 0.42, cz - 0.205);
      for (const dx of [0.45, 0.6]) mesh(cyl(0.05, 0.045, 0.1, 14), 0xffffff, cx + dx, y0 + 0.05, cz);
    } else if (b.kind === "fridge") {
      mesh(rbox(b.w, b.h, b.d, 0.05), 0xd5d9df, cx, b.h / 2, cz);
      mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), METAL, cx + 0.32, 1.25, cz + b.d / 2 + 0.03);
    } else if (b.kind === "tv") {
      mesh(rbox(b.w + 0.4, 0.5, 0.45, 0.03), 0x2f3440, cx, 0.25, cz + 0.2);
      mesh(rbox(b.w, b.h, 0.08, 0.03), 0x15171d, cx, y0 + b.h / 2 + 0.05, cz);
      mesh(new THREE.PlaneGeometry(b.w - 0.12, b.h - 0.12), glow(0x2a3a8f, 0.9), cx, y0 + b.h / 2 + 0.05, cz + 0.045);
    } else if (b.kind === "sofa") {
      mesh(rbox(b.w, b.h, b.d, 0.1), 0x4a505e, cx, b.h / 2, cz);
    } else if (b.kind === "sofaback") {
      mesh(rbox(b.w, b.h, b.d, 0.1), 0x3f4452, cx, b.h / 2, cz);
    } else if (b.kind === "cabinet") {
      mesh(rbox(b.w, b.h, b.d, 0.03), 0x2f3440, cx, b.h / 2, cz);
      mesh(rbox(b.w + 0.04, 0.05, b.d + 0.04, 0.01), WOOD, cx, b.h, cz);
    } else {
      mesh(rbox(b.w, b.h, b.d), b.colour, cx, y0 + b.h / 2, cz);
    }
  }
  for (const x of [17.4, 18.9, 20.4]) mesh(rbox(1.25, 0.16, 0.78, 0.08), 0x5a6070, x, 0.52, 15.25);
  for (const z of [11.6, 13.6]) mesh(rbox(0.78, 0.16, 1.7, 0.08), 0x5a6070, 22.85, 0.52, z);
  mesh(rbox(0.5, 0.45, 0.16, 0.08), 0x9aa88a, 16.95, 0.78, 15.55).rotation.z = 0.2; // a green cushion
  mesh(rbox(0.25, 0.65, 0.95, 0.08), 0x3f4452, 16.45, 0.33, 15.35); // sofa arm
  // Floor lamp by the sofa
  mesh(cyl(0.18, 0.2, 0.04), METAL, 15.9, 0.02, 14.7); mesh(cyl(0.02, 0.02, 1.7), METAL, 15.9, 0.87, 14.7);
  mesh(cyl(0.18, 0.26, 0.32, 20, true), glow(0xffe8bf, 0.7), 15.9, 1.75, 14.7);
  const lamp = new THREE.PointLight(0xffd9a0, 4, 5, 2); lamp.position.set(15.9, 1.6, 14.7); scene.add(lamp);


}

const TROUSERS = { cass: 0x2a2e3a, rita: 0x3b4a6b, wren: 0x4a3f36, cole: 0x2f3446, ada: 0x5b4a6e };
const BIG = 1.25; // people a little larger than life, so they read well from above
function makePerson(t) {
  const g = new THREE.Group(); g.scale.setScalar(BIG); scene.add(g);
  const body = new THREE.Group(); g.add(body);
  const top = mat(t.body, { roughness: 0.65 }), skin = mat(t.skin, { roughness: 0.55 }), hair = mat(t.hair, { roughness: 0.8 });
  const legsM = mat(TROUSERS[t.id] || 0x2f3446, { roughness: 0.8 });
  mesh(new THREE.CapsuleGeometry(0.21, 0.36, 6, 16), top, 0, 0.98, 0, body).scale.set(1, 1, 0.78); // torso
  mesh(cyl(0.07, 0.08, 0.1, 12), skin, 0, 1.33, 0, body); // neck
  const head = new THREE.Group(); head.position.y = 1.52; body.add(head);
  mesh(new THREE.SphereGeometry(0.19, 24, 18), skin, 0, 0, 0, head).scale.set(0.95, 1.05, 0.98);
  // Hair: a cap over the top and back, plus a fringe; Rita and Ada have longer hair.
  mesh(new THREE.SphereGeometry(0.2, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 0.03, -0.01, head).scale.set(1, 1.05, 1.03);
  mesh(new THREE.SphereGeometry(0.2, 20, 12, Math.PI * 0.75, Math.PI * 1.5, Math.PI * 0.35, Math.PI * 0.45), hair, 0, 0, -0.01, head);
  if (t.id === "rita" || t.id === "ada") mesh(rbox(0.36, 0.34, 0.12, 0.06), hair, 0, -0.16, -0.12, head);
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.022, 10, 8), 0x1d1f2b, s * 0.065, 0.01, 0.175, head);
    mesh(new THREE.SphereGeometry(0.035, 10, 8), skin, s * 0.185, -0.01, 0, head); // ears
  }
  const smile = mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), 0x9b4a3c, 0, -0.07, 0.175, head); smile.rotation.z = Math.PI;
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.68, 0); body.add(hip);
    mesh(new THREE.CapsuleGeometry(0.085, 0.46, 4, 10), legsM, 0, -0.32, 0, hip);
    mesh(rbox(0.13, 0.08, 0.26, 0.04), 0x1b1d26, 0, -0.63, 0.05, hip);
    legs.push(hip);
    const sh = new THREE.Group(); sh.position.set(s * 0.26, 1.2, 0); body.add(sh);
    mesh(new THREE.CapsuleGeometry(0.065, 0.36, 4, 10), top, 0, -0.22, 0, sh);
    mesh(new THREE.SphereGeometry(0.06, 12, 10), skin, 0, -0.46, 0, sh);
    arms.push(sh);
  }
  const mug = mesh(cyl(0.055, 0.05, 0.11, 14), 0xffffff, 0, -0.5, 0.08, arms[1]);
  const el = document.createElement("div"); el.className = "tag"; el.innerHTML = "<i></i><span></span>"; el.lastChild.textContent = t.name;
  const tag = new CSS2DObject(el); g.add(tag);
  const zz = document.createElement("div"); zz.className = "zz"; zz.textContent = "Z z";
  const zObj = new CSS2DObject(zz); zObj.position.set(0.4, 1.2, 0); zObj.visible = false; g.add(zObj);
  return { g, body, head, legs, arms, mug, el, tag, zObj };
}
function pose(p, a, t) {
  const { g, body, head, legs, arms } = p;
  g.position.set(a.x, 0, a.z); g.rotation.set(0, a.face, 0);
  body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
  legs.forEach((l) => l.rotation.set(0, 0, 0)); arms.forEach((r) => r.rotation.set(0, 0, 0));
  p.mug.visible = a.cup;
  if (a.pose === "walk") {
    const s = Math.sin(a.walkPhase);
    legs[0].rotation.x = s * 0.6; legs[1].rotation.x = -s * 0.6;
    arms[0].rotation.x = -s * 0.5; arms[1].rotation.x = a.cup ? -1 : s * 0.5;
    body.position.y = Math.abs(Math.cos(a.walkPhase)) * 0.04;
  } else if (a.pose === "sit") {
    body.position.y = -0.27; // hips on the seat once scaled
    legs.forEach((l) => (l.rotation.x = -1.5));
    const typing = a.state === "working";
    arms[0].rotation.x = typing ? -1.15 + Math.sin(t * 14) * 0.08 : -0.3;
    arms[1].rotation.x = a.cup ? -1.3 : typing ? -1.15 + Math.cos(t * 14) * 0.08 : -0.3;
    if (a.state === "chilling") { body.rotation.x = -0.15; head.rotation.y = Math.sin(t * 0.5) * 0.4; arms[0].rotation.z = 0.4; }
  } else if (a.pose === "lie") {
    body.rotation.x = -Math.PI / 2; body.position.set(0, 0.5, 0.72);
    legs[0].rotation.x = 0.1; arms[0].rotation.set(-0.3, 0, 0.3);
  } else if (a.pose === "stand") {
    if (a.cup) arms[1].rotation.x = -1 + Math.sin(t * 1.5) * 0.05;
    if (a.state === "looking") { arms[0].rotation.x = -1.4 + Math.sin(t * 3) * 0.15; head.rotation.x = -0.15; }
  }
  if (a.state === "waiting") head.rotation.z = Math.sin(t * 2) * 0.1;
  if (a.state === "asleep") { body.position.y += Math.sin(t * 1.6) * 0.012; head.rotation.x = 0.2; }
  p.el.className = "tag" + (a.state === "waiting" ? " waiting" : "") + (a.selected ? " selected" : "");
  p.el.firstChild.style.background = STATE_DOT[a.state] || "#8b8fa3";
  p.el.lastChild.textContent = a.state === "waiting" ? `${a.name} !` : a.name;
  p.zObj.visible = a.state === "asleep"; // the label renderer shows or hides it
  p.tag.position.set(0, a.pose === "lie" ? 0.9 : a.pose === "sit" ? 1.65 : 1.8, 0);
}


// ---------- Live behaviour ----------
/** Where someone should be, from their live state. Idle and asleep people wander. */
function wanted(a, p, now) {
  const desk = p.desk;
  if (a.state !== "idle" && a.state !== "asleep") p.plan = null; // back to work: forget the downtime plan
  if (a.state === "typing" || a.state === "waiting") return { spot: desk, mood: a.state === "waiting" ? "waiting" : "working" };
  if (a.state === "walking") return { spot: a.place === "web" ? "web" : a.place === "shelf" ? "files" : desk, mood: "looking" };
  const sleepy = a.state === "asleep";
  if (p.plan && now < p.plan.until && p.plan.sleepy === sleepy) return p.plan;
  // A new bit of downtime: coffee, the sofa, back to the desk, or (asleep) a nap.
  const taken = new Set([...people.values()].filter((q) => q !== p).map((q) => q.spot));
  const free = (prefix) => Object.keys(SPOTS).filter((k) => k.startsWith(prefix) && !taken.has(k));
  let spot = desk, mood = "chilling";
  if (sleepy && a.id !== "admin") {
    const nap = free("sofa:").filter((k) => SPOTS[k].pose === "lie");
    spot = nap[0] || free("sofa:")[0] || desk; mood = "asleep";
  } else if (sleepy) {
    mood = "asleep"; // Ada dozes at her desk
  } else {
    const r = Math.random();
    const coffee = free("coffee:"), sofa = free("sofa:").filter((k) => SPOTS[k].pose === "sit");
    if (r < 0.4 && coffee.length) { spot = coffee[Math.floor(Math.random() * coffee.length)]; mood = "coffee"; }
    else if (r < 0.8 && sofa.length && a.id !== "admin") { spot = sofa[Math.floor(Math.random() * sofa.length)]; mood = "chilling"; }
  }
  p.plan = { spot, mood, sleepy, until: now + (sleepy ? 600 : 25 + Math.random() * 35) };
  return p.plan;
}
function freeVisitorSeat() {
  const taken = new Set([...people.values()].map((q) => q.desk));
  return ["meet:0", "meet:1", "meet:2", "meet:3"].find((k) => !taken.has(k)) || "meet:0";
}
function personFor(a) {
  let p = people.get(a.id);
  if (p) return p;
  const short = LOOK_OF[a.id];
  const look = short ? LOOKS.find((l) => l.id === short) : { id: a.id, name: a.name, ...VISITOR, body: a.colour ?? VISITOR.body };
  const desk = short ? `desk:${short}` : freeVisitorSeat();
  const start = short ? desk : "door";
  p = { desk, spot: start, x: SPOTS[start].x, z: SPOTS[start].z, face: SPOTS[start].face, pose: SPOTS[start].pose, queue: [], cup: false, walkPhase: 0, plan: null };
  p.name = a.name || look.name;
  p.parts = makePerson({ ...look, name: p.name });
  people.set(a.id, p);
  return p;
}

/** Moves everyone one frame towards where they should be, and poses them. */
function step(agents, dt, now) {
  for (const [id, p] of people) if (!agents.has(id)) { scene.remove(p.parts.g); people.delete(id); } // visitors who left
  for (const a of agents.values()) {
    const p = personFor(a);
    const want = wanted(a, p, now);
    if (!p.queue.length && want.spot !== p.spot) {
      if (p.spot.startsWith("coffee")) p.cup = true; // carries the mug away
      else if (want.spot === p.desk && Math.random() < 0.3) p.cup = false;
      p.queue = path(p.spot, want.spot); p.spot = want.spot;
    }
    let mood = want.mood;
    if (p.queue.length) {
      const q = p.queue[0], dx = q.x - p.x, dz = q.z - p.z, dist = Math.hypot(dx, dz), move = SPEED * dt;
      p.pose = "walk"; p.walkPhase += dt * 9;
      if (dist > 0.001) p.face = Math.atan2(dx, dz);
      if (dist <= move) { p.x = q.x; p.z = q.z; p.queue.shift(); } else { p.x += (dx / dist) * move; p.z += (dz / dist) * move; }
      if (!p.queue.length) { const s = SPOTS[p.spot]; p.pose = s.pose; p.face = s.face; if (s.coffee) p.cup = true; }
      if (mood !== "waiting") mood = "walking";
    }
    p.mood = mood;
    pose(p.parts, { ...p, name: a.name || p.name, state: mood, selected: a.id === selectedId }, now);
  }
  for (const s of screens) {
    const busy = s.always || [...people.values()].some((p) => p.mood === "working" && Math.abs(p.x - s.x) < 1.2 && Math.abs(p.z - s.z) < 2);
    s.m.emissiveIntensity += ((busy ? 1.1 : 0.12) - s.m.emissiveIntensity) * 0.08;
  }
}

let last = 0;
/** Call once with the live agents map; the scene then follows it by itself. */
export function follow(agents) {
  if (!renderer) return;
  last = performance.now() / 1000;
  renderer.setAnimationLoop(() => {
    const now = performance.now() / 1000, dt = Math.min(0.05, now - last); last = now;
    step(agents, dt, now);
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  });
}
