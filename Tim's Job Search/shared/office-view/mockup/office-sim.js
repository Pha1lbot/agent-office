// Shared by the two office mockups (office-3d.html and office-iso.html):
// the floor plan, the places staff go, and a fake day that sends them there.
// World units are metres. x runs left to right (0-24), z runs back to front (0-16).
// A plain script (not a module) so the mockups open with a double-click.
(function () {
  const AISLE = 8.6; // the walkway across the middle of the floor

  const TEAM = [
    { id: "hal", name: "Hal", role: "Chief of Staff", body: 0x5b6cff, hair: 0x3b2a1a, skin: 0xf1c7a1 },
    { id: "rita", name: "Rita", role: "Lead Recruiter", body: 0x3fae7a, hair: 0xa0522d, skin: 0xe8b48f },
    { id: "wren", name: "Wren", role: "Writer", body: 0xe08a3c, hair: 0x1c1c1c, skin: 0xc68a63 },
    { id: "cole", name: "Cole", role: "Interview Coach", body: 0xc2453a, hair: 0x6b4a2b, skin: 0xf0c29b },
    { id: "ada", name: "Ada", role: "Admin (automatic)", body: 0x9a5cc6, hair: 0xe0b04a, skin: 0xf3cfae },
  ];

  // Areas of floor, drawn under everything.
  const ZONES = [
    { name: "floor", x: 0, z: 0, w: 24, d: 16, colour: 0xc9b79c }, // the whole floor first
    { name: "office", x: 0, z: 0, w: 6, d: 6.4, colour: 0x8a5a3c }, // Hal's office: dark wood
    { name: "open", x: 6, z: 0, w: 18, d: 9.6, colour: 0xc9b79c }, // open plan: light oak
    { name: "kitchen", x: 0, z: 9.6, w: 8, d: 6.4, colour: 0xd9d4cc }, // kitchen: tiles
    { name: "lounge", x: 15, z: 9.6, w: 9, d: 6.4, colour: 0xb7a58c },
    { name: "rug", x: 16.4, z: 10.6, w: 6, d: 3.8, colour: 0x6d7fb3 }, // lounge rug
    { name: "halrug", x: 0.8, z: 1, w: 4, d: 3.6, colour: 0xa04848 },
  ];

  // Furniture as boxes: x, z = back-left corner, w = along x, d = along z, h = height, y = lift off floor.
  const BOXES = [
    // Hal's office
    { kind: "desk", x: 1.4, z: 1.6, w: 2.4, d: 1.1, h: 0.75, colour: 0x6b4426 },
    { kind: "screen", x: 2.2, z: 2.45, w: 0.8, d: 0.08, h: 0.5, y: 0.75, colour: 0x22252f, faces: "back" },
    { kind: "cabinet", x: 0.2, z: 0.2, w: 1.6, d: 0.5, h: 1.2, colour: 0x5a3b22 },
    { kind: "plant", x: 4.8, z: 0.4, w: 0.6, d: 0.6, h: 1.3, colour: 0x3f8f5a },
    // Open plan: two rows of desks facing the front
    ...[[8.4, 2.4], [12.4, 2.4], [8.4, 5.8], [12.4, 5.8]].flatMap(([x, z]) => [
      { kind: "desk", x, z, w: 2.2, d: 1, h: 0.75, colour: 0xe9e4dc },
      { kind: "screen", x: x + 0.7, z: z + 0.8, w: 0.8, d: 0.08, h: 0.48, y: 0.75, colour: 0x22252f, faces: "back" },
    ]),
    { kind: "server", x: 14.8, z: 5.9, w: 0.6, d: 0.8, h: 1.4, colour: 0x2c2f3a }, // Ada's server box
    { kind: "shelf", x: 17.2, z: 0.15, w: 2.4, d: 0.5, h: 2, colour: 0x7a5232 }, // files
    { kind: "kiosk", x: 20.9, z: 1.2, w: 0.7, d: 0.5, h: 1.5, colour: 0x31415f }, // web
    { kind: "plant", x: 22.8, z: 0.4, w: 0.7, d: 0.7, h: 1.5, colour: 0x3f8f5a },
    { kind: "plant", x: 6.6, z: 8.8, w: 0.6, d: 0.6, h: 1.1, colour: 0x4a9a62 },
    // Kitchen
    { kind: "counter", x: 0.1, z: 15.2, w: 7.4, d: 0.75, h: 0.92, colour: 0xf2efe9 },
    { kind: "counter", x: 0.1, z: 10.2, w: 0.75, d: 5, h: 0.92, colour: 0xf2efe9 },
    { kind: "coffee", x: 2.1, z: 15.3, w: 0.5, d: 0.45, h: 0.55, y: 0.92, colour: 0x2b2b2b },
    { kind: "fridge", x: 0.1, z: 9.8, w: 0.9, d: 0.8, h: 1.9, colour: 0xdfe3e8 },
    { kind: "table", x: 4, z: 11.3, w: 1.4, d: 1.4, h: 0.75, colour: 0xa77a4f },
    { kind: "stool", x: 3.5, z: 11.75, w: 0.45, d: 0.45, h: 0.5, colour: 0x5b5f6a },
    { kind: "stool", x: 5.55, z: 11.75, w: 0.45, d: 0.45, h: 0.5, colour: 0x5b5f6a },
    // Lounge
    { kind: "sofa", x: 16.6, z: 14.9, w: 4.6, d: 0.95, h: 0.45, colour: 0x4b6aa8 }, // seat
    { kind: "sofaback", x: 16.6, z: 15.55, w: 4.6, d: 0.3, h: 0.95, colour: 0x3e5a93 },
    { kind: "sofa", x: 22.4, z: 10.8, w: 0.95, d: 4.1, h: 0.45, colour: 0x4b6aa8 },
    { kind: "sofaback", x: 23.05, z: 10.8, w: 0.3, d: 4.75, h: 0.95, colour: 0x3e5a93 },
    { kind: "table", x: 18.2, z: 12.2, w: 1.8, d: 0.9, h: 0.4, colour: 0x7a5232 },
    { kind: "tv", x: 17.4, z: 9.75, w: 2.6, d: 0.12, h: 1.4, y: 0.5, colour: 0x15171d },
    { kind: "plant", x: 15.4, z: 15.2, w: 0.7, d: 0.7, h: 1.4, colour: 0x3f8f5a },
  ];

  // Glass walls of Hal's office (with a door gap) and half-height kitchen screen.
  const GLASS = [
    { x: 6, z: 0, w: 0.08, d: 6.4 },
    { x: 0, z: 6.4, w: 3.4, d: 0.08 },
    { x: 5, z: 6.4, w: 1.08, d: 0.08 },
  ];

  // Places people go. pose: sit / stand / lie. face: direction they look (radians, 0 = towards the front).
  // route: points from the aisle to the spot, so nobody walks through furniture.
  const SPOTS = {
    // Staff sit behind their desks, facing the front of the room.
    "desk:hal": { x: 2.6, z: 1.05, pose: "sit", face: 0, route: [[4.2, AISLE], [4.2, 1.05]] },
    "desk:rita": { x: 9.5, z: 1.9, pose: "sit", face: 0, route: [[11.3, AISLE], [11.3, 1.9]] },
    "desk:wren": { x: 13.5, z: 1.9, pose: "sit", face: 0, route: [[11.3, AISLE], [11.3, 1.9]] },
    "desk:cole": { x: 9.5, z: 5.3, pose: "sit", face: 0, route: [[11.3, AISLE], [11.3, 5.3]] },
    "desk:ada": { x: 13.5, z: 5.3, pose: "sit", face: 0, route: [[11.3, AISLE], [11.3, 5.3]] },
    files: { x: 18.4, z: 1.2, pose: "stand", face: Math.PI, route: [[18.4, AISLE]] },
    web: { x: 21.25, z: 2.3, pose: "stand", face: Math.PI, route: [[21.25, AISLE]] },
    "coffee:0": { x: 2.35, z: 14.4, pose: "stand", face: 0, route: [[2.35, AISLE]], coffee: true },
    "coffee:1": { x: 3.5, z: 14.5, pose: "stand", face: 0.3, route: [[3.5, AISLE], [3.2, 13.2]], coffee: true },
    "coffee:2": { x: 3.75, z: 12, pose: "sit", face: -Math.PI / 2, route: [[3.0, AISLE], [3.0, 11.0]], coffee: true },
    "coffee:3": { x: 5.75, z: 12, pose: "sit", face: Math.PI / 2, route: [[6.6, AISLE], [6.6, 12]], coffee: true },
    "sofa:0": { x: 17.4, z: 15.2, pose: "sit", face: Math.PI, route: [[15.9, AISLE], [15.9, 14.2], [17.4, 14.2]] },
    "sofa:1": { x: 18.9, z: 15.2, pose: "sit", face: Math.PI, route: [[15.9, AISLE], [15.9, 14.2], [18.9, 14.2]] },
    "sofa:2": { x: 20.4, z: 15.2, pose: "sit", face: Math.PI, route: [[21.4, AISLE], [21.4, 14.2], [20.4, 14.2]] },
    "sofa:3": { x: 22.8, z: 11.6, pose: "lie", face: 0, route: [[21.6, AISLE], [21.6, 12.4]] },
    "sofa:4": { x: 22.8, z: 13.6, pose: "lie", face: 0, route: [[21.6, AISLE], [21.6, 13.0]] },
  };

  // What the fake day looks like. Each activity lasts a few seconds in the mockup.
  const ACTIVITIES = [
    { state: "working", weight: 5, where: "desk", secs: [8, 14] },
    { state: "looking", weight: 2, where: "files", secs: [4, 6] },
    { state: "looking", weight: 2, where: "web", secs: [4, 6] },
    { state: "waiting", weight: 1, where: "desk", secs: [5, 8] },
    { state: "coffee", weight: 2, where: "coffee", secs: [5, 8] },
    { state: "chilling", weight: 2, where: "sofa", secs: [7, 11] },
    { state: "asleep", weight: 1, where: "nap", secs: [8, 12] },
  ];
  const LABEL = { working: "Working", looking: "Looking things up", waiting: "Waiting for you", coffee: "Getting a coffee", chilling: "On the sofa (idle)", asleep: "Asleep on the sofa", walking: "Walking" };
  const SPEED = 1.7; // metres per second

  const rand = (a, b) => a + Math.random() * (b - a);
  function pickActivity(agent) {
    // Ada never leaves her desk for long; Hal rarely naps. Keeps it believable.
    const list = ACTIVITIES.filter((a) => !(agent.id === "ada" && ["sofa", "nap"].includes(a.where)));
    let n = Math.random() * list.reduce((s, a) => s + a.weight, 0);
    for (const a of list) { n -= a.weight; if (n <= 0) return a; }
    return list[0];
  }
  function spotFor(where, agent, taken) {
    if (where === "desk") return `desk:${agent.id}`;
    if (where === "files" || where === "web") return where;
    const pool = Object.keys(SPOTS).filter((k) => (where === "nap" ? ["sofa:3", "sofa:4"].includes(k) : k.startsWith(`${where}:`)));
    const free = pool.filter((k) => !taken.has(k));
    return free.length ? free[Math.floor(Math.random() * free.length)] : `desk:${agent.id}`;
  }

  /** The route from one spot to another: back out to the aisle, along it, then in. */
  function path(fromKey, toKey) {
    const a = SPOTS[fromKey], b = SPOTS[toKey];
    if (fromKey === toKey) return [];
    const out = [...a.route].reverse();
    const inn = b.route;
    return [...out, ...inn, [b.x, b.z]].map(([x, z]) => ({ x, z }));
  }

  function create() {
    const agents = TEAM.map((t, i) => {
      const key = `desk:${t.id}`;
      return { ...t, spot: key, x: SPOTS[key].x, z: SPOTS[key].z, face: 0, pose: "sit", state: "working",
        queue: [], until: performance.now() / 1000 + 2 + i * 1.5, walkPhase: 0, cup: false };
    });
    const taken = () => new Set(agents.map((a) => a.spot));
    function step(dt, now) {
      for (const a of agents) {
        if (a.queue.length) {
          const p = a.queue[0];
          const dx = p.x - a.x, dz = p.z - a.z, dist = Math.hypot(dx, dz);
          const move = SPEED * dt;
          a.pose = "walk"; a.walkPhase += dt * 9;
          if (dist > 0.001) a.face = Math.atan2(dx, dz);
          if (dist <= move) { a.x = p.x; a.z = p.z; a.queue.shift(); }
          else { a.x += (dx / dist) * move; a.z += (dz / dist) * move; }
          if (!a.queue.length) {
            const s = SPOTS[a.spot];
            a.pose = s.pose; a.face = s.face; a.state = a.next.state;
            if (s.coffee) a.cup = true;
            a.until = now + rand(...a.next.secs);
          }
          continue;
        }
        if (now < a.until) continue;
        const act = pickActivity(a);
        const target = spotFor(act.where, a, taken());
        a.next = act;
        if (a.spot.startsWith("coffee") && !target.startsWith("coffee")) a.cup = true; // walks back with the mug
        else if (!target.startsWith("coffee") && !a.spot.startsWith("coffee")) a.cup = a.cup && act.where === "desk" && Math.random() < 0.6;
        if (target === a.spot) { a.state = act.state; a.until = now + rand(...act.secs); continue; }
        a.queue = path(a.spot, target);
        a.spot = target;
        a.state = "walking";
      }
    }
    return { agents, step };
  }

  window.OfficeSim = { TEAM, ZONES, BOXES, GLASS, SPOTS, LABEL, create, W: 24, D: 16 };
})();
