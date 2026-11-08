// The office floor plan, shared by the 3D scene (scene.js).
// World units are metres: x runs left to right (0-24), z from the back wall to the front (0-16).
const AISLE = 8.6; // the walkway across the middle of the floor

const LOOKS = [
  { id: "cass", name: "Tim", role: "Chief of Staff", body: 0x5b6cff, hair: 0x3b2a1a, skin: 0xf1c7a1 },
  { id: "rita", name: "Rita", role: "Lead Recruiter", body: 0x3fae7a, hair: 0xa0522d, skin: 0xe8b48f },
  { id: "wren", name: "Wren", role: "Writer", body: 0xe08a3c, hair: 0x1c1c1c, skin: 0xc68a63 },
  { id: "cole", name: "Cole", role: "Interview Coach", body: 0xc2453a, hair: 0x6b4a2b, skin: 0xf0c29b },
  { id: "ada", name: "Ada", role: "Admin (automatic)", body: 0x9a5cc6, hair: 0xe0b04a, skin: 0xf3cfae },
];

// Areas of floor, drawn under everything.
const ZONES = [
  { name: "floor", x: 0, z: 0, w: 24, d: 16, colour: 0xc9b79c }, // the whole floor first
  { name: "office", x: 0, z: 0, w: 6, d: 6.4, colour: 0x8a5a3c }, // Tim's office: dark wood
  { name: "open", x: 6, z: 0, w: 18, d: 9.6, colour: 0xc9b79c }, // open plan: light oak
  { name: "kitchen", x: 0, z: 9.6, w: 8, d: 6.4, colour: 0xd9d4cc }, // kitchen: tiles
  { name: "lounge", x: 15, z: 9.6, w: 9, d: 6.4, colour: 0xb7a58c },
  { name: "rug", x: 16.4, z: 10.6, w: 6, d: 3.8, colour: 0x6d7fb3 }, // lounge rug
  { name: "halrug", x: 0.8, z: 1, w: 4, d: 3.6, colour: 0xa04848 },
];

// Furniture as boxes: x, z = back-left corner, w = along x, d = along z, h = height, y = lift off floor.
const BOXES = [
  // Tim's office
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

// Glass walls of Tim's office (with a door gap) and half-height kitchen screen.
const GLASS = [
  { x: 6, z: 0, w: 0.08, d: 6.4 },
  { x: 0, z: 6.4, w: 3.4, d: 0.08 },
  { x: 5, z: 6.4, w: 1.08, d: 0.08 },
];

// Places people go. pose: sit / stand / lie. face: direction they look (radians, 0 = towards the front).
// route: points from the aisle to the spot, so nobody walks through furniture.
const SPOTS = {
  // Staff sit behind their desks, facing the front of the room.
  "desk:cass": { x: 2.6, z: 1.05, pose: "sit", face: 0, route: [[4.2, AISLE], [4.2, 1.05]] },
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


// A meeting table in the middle of the floor, where visiting helpers (other subagents) sit.
BOXES.push(
  { kind: "table", x: 10.2, z: 11.6, w: 2.4, d: 1.2, h: 0.75, colour: 0xa77a4f },
  ...[[10.7, 11.15], [12.1, 11.15], [10.7, 13.25], [12.1, 13.25]].map(([x, z]) => ({ kind: "stool", x: x - 0.22, z: z - 0.22, w: 0.45, d: 0.45, h: 0.5, colour: 0x5b5f6a })),
);
Object.assign(SPOTS, {
  "meet:0": { x: 10.7, z: 11.15, pose: "sit", face: 0, route: [[10.7, AISLE]] },
  "meet:1": { x: 12.1, z: 11.15, pose: "sit", face: 0, route: [[12.1, AISLE]] },
  "meet:2": { x: 10.7, z: 13.25, pose: "sit", face: Math.PI, route: [[9.6, AISLE], [9.6, 14.2], [10.7, 14.2]] },
  "meet:3": { x: 12.1, z: 13.25, pose: "sit", face: Math.PI, route: [[13.2, AISLE], [13.2, 14.2], [12.1, 14.2]] },
  "door": { x: 15.8, z: 0.9, pose: "stand", face: 0, route: [[15.8, AISLE]] }, // where visitors arrive
});

/** The route from one spot to another: out to the aisle, along it, then in. */
export function path(fromKey, toKey) {
  if (fromKey === toKey) return [];
  const a = SPOTS[fromKey], b = SPOTS[toKey];
  return [...[...a.route].reverse(), ...b.route, [b.x, b.z]].map(([x, z]) => ({ x, z }));
}

export const W = 24, D = 16;
export { AISLE, LOOKS, ZONES, BOXES, GLASS, SPOTS };
