// PART 3 – Neel Decides: the Magic Doors. Replies come through the doors as cards (no guests yet: they come to the
// party), gold seals crack open to show the numbers, and every right answer puts its things around the party table,
// where they stay until the party. When m or d changes, the plan is worked out again and the table follows.
import { qbox, valPills, host, trio, solo, award, afterTitle, setFocus, setFore, gsap, el, img, ui, world, wait, sfx, say, card, popup, playFx, checklist, checkCur, checkDone, pointHand, onTap, closeBubble, farLayer, camRest, camPt, toStage, lightPool, lock } from "./engine.js";
import { setAnswer } from "./qa.js";
import { maya, praise, idleWatch, iconRow, planScroll, garland, coin } from "./common.js";
import { show } from "./part2.js";

// door centres in far-layer coordinates (layer is 2000 wide, offset -200)
const DOORS = [[524, 423], [934, 423], [1326, 423]];
const DOOR_D = 226;
/** where someone coming through each door appears on the stage */
export const DOOR_XY = DOORS.map(([x, y]) => ({ x: x - 200, y: y + 50 }));
// h1, h2, inact are worked from the numbers on screen (the seals have already put them in): they never ask for a
// substitution that is done, they say the next step. The clue word of the plan ("extra", "burst", "in all") is said
// in the hint, since no word box stays on screen
const tens = (a, b) => `${a - (a % 10)} + ${b - (b % 10)} is ${a - (a % 10) + b - (b % 10)}, and ${a % 10} + ${b % 10} is ${(a % 10) + (b % 10)}`;
const Q = [
  { name: "Chairs", plan: ["m", "+", "1"], who: "maya", line: "Chairs = m + 1. m is 6. How many chairs?", means: "a chair for each friend, plus 1 extra", prep: "chairs", icon: "pr_chair", ask: "How many chairs?", opts: [7, 6, 16], ans: 7,
    work: "6 + 1 = 7", h1: (v) => `"Extra" means add. The seal put ${v.m} in place of m, so add the 1 extra chair: ${v.m} + 1.`, h2: (v) => `Start at ${v.m} and count 1 more.`, inact: (v) => `Work out ${v.m} + 1.`, pop: "Neel needs 7 chairs.", exp: "Put 6 in place of m: 6 + 1 = 7. So Neel needs 7 chairs." },
  { name: "Sweets", plan: ["3", "m", "+", "5"], who: "agni", line: "Sweets = 3m + 5. m is 6. How many sweets?", means: "3 sweets for each friend, plus 5 extra for Agni", prep: "sweets", icon: "pr_sweet", ask: "How many sweets?", opts: [18, 41, 23], ans: 23,
    work: "3 × 6 + 5 = 18 + 5 = 23", h1: (v) => `3 × ${v.m} is ${3 * v.m}. "Extra" means add, so add Agni's 5 sweets.`, h2: (v) => `${3 * v.m} + 5. Start at ${3 * v.m} and count on 5.`, inact: (v) => `3 × ${v.m} is ${3 * v.m}. Then add 5.`, pop: "Neel needs 23 sweets.", exp: "3m means 3 × m. Put 6 in place of m: 3 × 6 = 18. Then add Agni's 5 sweets: 18 + 5 = 23 sweets. 3m does not mean 36." },
  { name: "Balloons", plan: ["2", "m", "−", "3"], who: "neel", line: "Balloons = 2m − 3. m is 6. How many balloons are left?", means: "2 balloons for each friend, 3 burst", prep: "balloons", icon: "pr_balloon", ask: "How many balloons are left?", opts: [15, 9, 6], ans: 9,
    work: "2 × 6 − 3 = 12 − 3 = 9", h1: (v) => `2 × ${v.m} is ${2 * v.m}. "Burst" means take away, so take away the 3 burst balloons.`, h2: (v) => `${2 * v.m} − 3. Start at ${2 * v.m} and count back 3.`, inact: (v) => `2 × ${v.m} is ${2 * v.m}. Then take away 3.`, pop: "Neel has 9 balloons.", exp: "2m is 2 × 6 = 12. Then take away the 3 burst balloons: 12 − 3 = 9 balloons." },
  { name: "Friends in all", plan: ["m", "+", "d"], who: "agni", line: "And 4 of my dragon friends are coming, so d is 4! Friends in all = m + d. How many friends are coming in all?", means: "monster friends plus dragon friends", arrive: { d: 4 }, prep: "friends", icon: "gu_dragon_teal", ask: "How many friends in all?", opts: [10, 24, 2], ans: 10,
    work: "6 + 4 = 10", h1: (v) => `"In all" means add. ${v.m} monster friends and ${v.d} dragon friends: ${v.m} + ${v.d}.`, h2: (v) => `Count all the Yes! cards. Start at ${v.m} and count on ${v.d}.`, inact: (v) => `Work out ${v.m} + ${v.d}.`, pop: "There are 10 friends in all.", exp: "Put 6 in place of m and 4 in place of d: 6 + 4 = 10 friends in all." },
  { name: "Plates", plan: ["m", "+", "d", "+", "1"], who: "maya", line: "Plates = m + d + 1. m is 6 and d is 4. How many plates?", means: "a plate for every friend, plus 1 for Maya", prep: "plates", icon: "pr_plate", ask: "How many plates?", opts: [10, 25, 11], ans: 11,
    work: "6 + 4 + 1 = 11", h1: (v) => `${v.m} + ${v.d} is ${v.m + v.d}. "Extra" means add: don't forget the 1 extra plate for me.`, h2: (v) => `${v.m + v.d} + 1. Count 1 more.`, inact: () => "Don't forget my extra plate.", pop: "Neel needs 11 plates.", exp: "Put 6 in place of m and 4 in place of d: 6 + 4 + 1 = 11 plates." },
  { name: "Two friends said no", plan: ["6", "−", "2"], change: true, who: "neel", line: "Oh no! 2 of my friends said no. Now how many monster friends are coming?", means: "6 friends were coming, 2 said no", prep: null, icon: "gu_monster_sad", ask: "How many monster friends are coming now?", opts: [8, 4, 6], ans: 4,
    work: "6 − 2 = 4", h1: () => "\"Said no\" means they are not coming. So we take away 2.", h2: () => "6 − 2. Start at 6 and count back 2.", inact: () => "\"Said no\" means take away.", pop: "Now 4 monster friends are coming.", exp: "6 friends were coming. 2 said no, so we take away 2: 6 − 2 = 4. Now m is 4. See? m can change!" },
  { name: "Cushions", plan: ["m", "+", "2", "d"], who: "agni", line: "Now m is 4 and d is 4. Cushions = m + 2d. How many cushions?", means: "1 for each monster, 2 for each dragon", prep: "cushions", icon: "pr_cushion", ask: "How many cushions?", opts: [12, 10, 16], ans: 12,
    work: "4 + 2 × 4 = 4 + 8 = 12", h1: (v) => `2 × ${v.d} is ${2 * v.d}. Now add m, which is ${v.m}.`, h2: (v) => `${v.m} + ${2 * v.d}. Start at ${2 * v.d} and count on ${v.m}.`, inact: (v) => `2 × ${v.d} is ${2 * v.d}. Then add ${v.m}.`, pop: "Neel needs 12 cushions.", exp: "2d is 2 × 4 = 8. Add m: 4 + 8 = 12 cushions." },
  { name: "Laddoos", plan: ["3", "m", "+", "2", "d"], who: "agni", line: "Yay! 3 more dragon friends said yes. Now d is 4 + 3 = 7, and m is still 4. Laddoos = 3m + 2d. How many laddoos?", means: "3 for each monster, 2 for each dragon", arrive: { d: 3 }, prep: "laddoos", icon: "pr_laddoo", ask: "How many laddoos?", opts: [20, 16, 26], ans: 26,
    work: "3 × 4 + 2 × 7 = 12 + 14 = 26", h1: (v) => `3 × ${v.m} is ${3 * v.m}, and 2 × ${v.d} is ${2 * v.d}. "Total" means add, so add them.`, h2: (v) => `${3 * v.m} + ${2 * v.d}: ${tens(3 * v.m, 2 * v.d)}.`, inact: (v) => `Add ${3 * v.m} and ${2 * v.d}.`, pop: "Neel needs 26 laddoos.", exp: "3m is 3 × 4 = 12. 2d is 2 × 7 = 14. Add them: 12 + 14 = 26 laddoos. The plan still works, even when the numbers change!" },
];
// who praises each right answer (from the script)
const PRAISE = ["neel:yes", "neel:super", "agni:great", "neel:well", "neel:yes", "agni:super", "neel:great", "neel:well"];
const ITEM = { chairs: "Chairs", sweets: "Sweets", balloons: "Balloons", friends: "Friends in all", plates: "Plates", cushions: "Cushions", laddoos: "Laddoos" };
// the plan for each thing on the table: when m or d changes, the table is worked out again from it
const FORM = { chairs: (v) => v.m + 1, sweets: (v) => 3 * v.m + 5, balloons: (v) => 2 * v.m - 3, plates: (v) => v.m + v.d + 1, cushions: (v) => v.m + 2 * v.d, laddoos: (v) => 3 * v.m + 2 * v.d };

let doors = [], vals = { m: 0, d: 0 }, uses = "m", valBox, bar, table, back, front, QB, scroll, rsvp, lights, numbered = false;
const groups = {}; // what is on the table now: kind -> { n, els, tag }
// the party table (tools/blender/table.py): rendered at the hall floor's own angle and standing on the floor's magic
// circle. The art is 961 px wide; the table itself is 822 px of it, from x 51, and 281 px tall from the top
const TB = { cx: 760, foot: 725, w: 700 }, TK = TB.w / 822, TX = TB.cx;
const TOP = TB.foot - 281 * TK;         // back edge of the tabletop
const TOP_FRONT = TOP + 34;             // front edge (the gold piping)
// each question is worked out on a big board over the hall (Draft 4): the plan with its seals at the top, the answer
// gems under it. It clears the speaker's bubble (left), the replies (top left) and the plan tab (top right)
const BOARD = { x: 610, y: 150, w: 970, h: 690 };
const PICK = { cx: BOARD.x + BOARD.w / 2, top: BOARD.y + BOARD.h - 230, gap: 200 };
const CARD_ART = { m: ["gu_monster_green", "gu_monster_pink"], d: ["gu_dragon_teal", "gu_dragon_red"] }; // no blue monster: it looks like Neel

// ---------- the party table: each kind of thing has its own place, with a small count tag beside it ----------
const ICON = { chairs: "pr_chair", sweets: "pr_sweet", balloons: "pr_balloon", plates: "pr_plate", cushions: "pr_cushion", laddoos: "pr_laddoo" };
// the three round doors on the back wall (stage x, from far-layer x - 200): the friends' replies come through them,
// so nothing tall and no count tag may stand in front of them. The things on the tabletop go in the wall between doors
const GAP = { L: 529, R: 930 };       // the wall between door 1 and 2, and between door 2 and 3
const CLOTH = TOP_FRONT + 46;         // count tags for the tabletop sit on the tablecloth, under their things
/** where n things of a kind go: items {x: centre, y: bottom, w, h, under: behind the table, flip, hue, bowl}, and
 *  where their count tag sits. Chairs: one at each end of the table and the rest behind it (their backs show over the
 *  tabletop); sweets and laddoos in bowls in the gaps between the doors, low stacks of plates in the middle; balloons
 *  float high at the two ends of the garland, above the doors; cushions on the floor at the front right */
function layout(kind, n) {
  const it = [];
  let tag = { x: TX, y: CLOTH };
  if (kind === "chairs") {
    // chairs stand on the floor at the table's own scale (the table is about 200 px tall from floor to top): the end
    // ones on the floor halfway back, beside the table ends; the ones behind stand behind it, so the tabletop hides their
    // seats and only the backrests show above it, smaller because they are further away
    const ends = Math.min(2, n), k = n - ends, cx = TX - 30;
    const step = k > 1 ? Math.min(100, 560 / (k - 1)) : 0;
    // the end chairs come first, so when the count changes (restock) they stay the end chairs
    if (ends > 0) it.push({ x: TX - 392, y: TB.foot - 24, w: 127, h: 190 });               // the left end, facing the table
    if (ends > 1) it.push({ x: TX + 392, y: TB.foot - 24, w: 127, h: 190, flip: true });   // the right end
    for (let i = 0; i < k; i++) it.push({ x: cx - ((k - 1) * step) / 2 + i * step, y: TOP + 95, w: 100, h: 150, under: true });
  }
  if (kind === "plates") {
    // low stacks (3 at most) in the middle of the table, so the middle door stays in view above them
    const stacks = Math.ceil(n / 3), gap = 58, tall = Math.ceil(n / stacks);
    for (let i = 0; i < n; i++) { const st = i % stacks, h = Math.floor(i / stacks); it.push({ x: TX - 26 - ((stacks - 1) * gap) / 2 + st * gap, y: TOP_FRONT - 4 - h * 6, w: 62, h: 38 }); }
    tag = { x: TX - 26, y: CLOTH };
  }
  if (kind === "sweets" || kind === "laddoos") {
    // a heap in a gold bowl, in the wall between two doors: the bowl holds them all, the heap shows a handful
    const L = kind === "sweets", bx = L ? GAP.L : GAP.R, by = TOP_FRONT - 4;
    it.push({ x: bx, y: by, w: 130, h: 65, bowl: true });
    const rows = [5, 4, 3, 2, 1], w = L ? 34 : 32, h = L ? 28 : 32;
    let left = Math.min(n, 15);
    rows.forEach((c, r) => { const k = Math.min(c, left); left -= k; for (let j = 0; j < k; j++) it.push({ x: bx - ((k - 1) * w * 0.78) / 2 + j * w * 0.78, y: by - 46 - r * h * 0.5, w, h }); });
    tag = { x: bx, y: CLOTH };
  }
  if (kind === "cushions") {
    // two neat piles on the floor at the front right corner of the table
    const a = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) { const L = i < a, k = L ? i : i - a; it.push({ x: TX + (L ? 282 : 342), y: TB.foot + 45 - k * 13, w: 58, h: 39 }); }
    tag = { x: TX + 252, y: TB.foot + 45 - 39 - (a - 1) * 13 - 26 };
  }
  if (kind === "balloons") {
    // two bunches floating high at the ends of the garland, above the doors
    const a = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) { const L = i < a, k = L ? i : i - a, g = L ? a : n - a; it.push({ x: (L ? 488 : 1080) + (k - (g - 1) / 2) * 18, y: 300 - (k % 2) * 22, w: 47, h: 78, hue: (i * 47) % 360 }); }
    tag = { x: 1166, y: 262 };
  }
  return { it, tag };
}
function thing(kind, o) {
  const e = img(o.bowl ? "pr_bowl" : ICON[kind], o.under ? back : front, { left: o.x - o.w / 2, top: o.y - o.h, width: o.w, height: o.h, objectFit: "contain" });
  if (o.flip) e.style.transform = "scaleX(-1)";
  if (o.hue != null) e.style.filter = `hue-rotate(${o.hue}deg) saturate(2.4)`;
  return e;
}
function countUp(t, a, b, dur) {
  const c = { v: a };
  return gsap.to(c, { v: b, duration: dur, ease: "power1.out", onUpdate: () => (t.textContent = Math.round(c.v)), onComplete: () => { sfx("pop"); gsap.fromTo(t, { scale: 1.35 }, { scale: 1, duration: 0.35, ease: "back.out(3)" }); } });
}
/** put n things of a kind at the table. from: they fly in from the answer panel and land with a bounce, and the
 *  count tag counts up. tag: false for the party (no numbers on the party table) */
function place(kind, n, from, tag = false) {
  const { it, tag: at } = layout(kind, n), els = [];
  it.forEach((o, i) => {
    const e = thing(kind, o);
    if (from) gsap.from(e, o.bowl ? { opacity: 0, scale: 0.6, duration: 0.3 } : { left: from.x, top: from.y - 60, opacity: 0, duration: 0.5, delay: 0.1 + Math.min(i * 0.035, 0.6), ease: "bounce.out" });
    els.push(e);
  });
  let t = null;
  if (tag) {
    t = el("div", "ctag", front, { left: at.x, top: at.y }, from ? "0" : String(n));
    if (from) { gsap.from(t, { scale: 0, duration: 0.3, ease: "back.out(3)" }); countUp(t, 0, n, Math.min(1, 0.3 + n * 0.03)).delay(0.2); }
  }
  return { n, els, tag: t };
}
/** the plan is worked out again (m or d changed): the things on the table move, go or come, the tag counts */
function restock(kind, n) {
  const g = groups[kind];
  if (!g || g.n === n) return;
  const { it, tag } = layout(kind, n), was = g.n;
  it.forEach((o, i) => {
    const e = g.els[i];
    if (e) gsap.to(e, { left: o.x - o.w / 2, top: o.y - o.h, width: o.w, height: o.h, duration: 0.6, ease: "power2.inOut" });
    else { g.els[i] = thing(kind, o); gsap.from(g.els[i], { opacity: 0, y: -30, duration: 0.45, delay: 0.25 + (i - was) * 0.05, ease: "bounce.out" }); }
  });
  g.els.splice(it.length).forEach((e, i) => gsap.to(e, { opacity: 0, y: -40, scale: 0.6, duration: 0.45, delay: i * 0.08, onComplete: () => e.remove() }));
  if (g.tag) { gsap.to(g.tag, { left: tag.x, top: tag.y, autoAlpha: 1, duration: 0.6 }); g.tag.classList.add("chg"); countUp(g.tag, was, n, 0.8).eventCallback("onComplete", () => { g.tag.classList.remove("chg"); sfx("pop"); gsap.to(g.tag, { autoAlpha: 0, duration: 0.5, delay: 1.6 }); }); } // shown while it counts, then it goes
  g.n = n;
}
/** after m or d changed: everything on the table is worked out again from its plan, one kind after another */
async function rework() {
  const todo = Object.keys(groups).filter((k) => groups[k].n !== FORM[k](vals));
  if (!todo.length) return;
  sfx("magic");
  for (const k of todo) { restock(k, FORM[k](vals)); await wait(0.3); }
  await wait(0.6);
}
function buildTable() {
  const L = farLayer();
  doors = DOORS.map(([x, y]) => {
    const d = img("p3_door_closed", L, { left: x - DOOR_D / 2, top: y - DOOR_D / 2, width: DOOR_D, height: DOOR_D });
    d.style.filter = "brightness(.55) saturate(.8)";
    d.dataset.x = x - 200; d.dataset.y = y;
    return d;
  });
  // the hall's lanterns flicker (glows over the painted lanterns, on the same layer so they move with it)
  for (const [x, y] of [[300, 360], [720, 378], [1155, 380], [1745, 372]]) el("div", "flicker", L, { left: x - 80, top: y - 80, width: 160, height: 160 });
  // a garland over the table: one more stretch lights up with every answer, until the party is ready
  lights = garland(world, TX - 340, 196, 680);
  back = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  table = img("pr_party_table_3d", world, { left: TX - (51 + 411) * TK, top: TOP - TK, width: 961 * TK });
  lightPool(TX, TB.foot - 40, 1400, 360);
  front = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  for (const k in groups) delete groups[k];
}
/** the finished table for the party: what the plan gives for the friends who came (m = 4, d = 7), no count tags */
export function partyTable() {
  buildTable();
  lights.light(1);
  for (const k in FORM) groups[k] = place(k, FORM[k]({ m: 4, d: 7 }), null, false);
}
/** Part 3's cards and helpers step away for the party; the table and what is on it stay */
export function partyClear() { [...ui.children].forEach((c) => { if (c.id !== "bubble") c.remove(); }); }

// ---------- reply cards: the friends answer through the doors ----------
function buildRsvp() {
  rsvp = el("div", "rsvp", ui, { left: 16, top: 84, width: 404 }, `<h3>Replies</h3><div class="grp m"><div class="gl">Monster friends: <b>0</b></div><div class="cards yes"></div><div class="cards no"></div></div><div class="grp d"><div class="gl">Dragon friends: <b>0</b></div><div class="cards yes"></div></div>`);
  gsap.set(rsvp, { autoAlpha: 0 });
}
function countCards() {
  for (const k of ["m", "d"]) {
    const g = rsvp.querySelector(".grp." + k), n = g.querySelectorAll(".cards.yes .rc:not(.out)").length;
    g.querySelector(".gl b").textContent = n;
    g.style.display = n || g.querySelector(".cards.no")?.childElementCount ? "" : "none";
  }
}
/** once the friends have been counted, every Yes card keeps a number: 1, 2, 3 … with no gaps */
function renumber() {
  [...rsvp.querySelectorAll(".cards.yes .rc:not(.out)")].forEach((c, i) => { (c.querySelector(".num") || el("i", "num", c)).textContent = String(i + 1); });
}
/** a reply card flies from the door into its place on the board. kind: "m" | "d" yes, or "no" (a monster who can't come) */
function rsvpCard(kind, from, i) {
  const g = rsvp.querySelector(".grp." + (kind === "d" ? "d" : "m"));
  const list = g.querySelector(kind === "no" ? ".cards.no" : ".cards.yes");
  const n = list.childElementCount;
  const art = kind === "no" ? "gu_monster_sad" : CARD_ART[kind][n % 2];
  const c = el("div", "rc " + (kind === "no" ? "sorry" : "yes"), list, {}, `<img src="assets/${art}.webp"><span>${kind === "no" ? "Sorry, I can't come" : "Yes!"}</span>`);
  gsap.set(rsvp, { autoAlpha: 1 });
  countCards();
  if (numbered && kind !== "no") renumber(); // a friend who says yes after the count gets the next number
  const r = c.getBoundingClientRect(), p = toStage({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
  gsap.from(c, { x: from.x - p.x, y: from.y - p.y, scale: 0.3, rotation: (i % 2 ? 1 : -1) * 25, duration: 0.55, ease: "power2.out" });
  sfx("pop");
  return c;
}
function drawVals() { valPills(valBox, vals, uses); gsap.set(valBox, { autoAlpha: 1 }); }
/** while a question is not about the replies, the board shows only its counts ("Monster friends: 6") */
function repliesMini(on) {
  if (!rsvp || rsvp.classList.contains("mini") === on) return;
  rsvp.classList.toggle("mini", on);
  gsap.fromTo(rsvp, { opacity: 0.3 }, { opacity: 1, duration: 0.35 });
}
/** a count tag stays while its question is on; at the next question the older tags go (the things stay) */
const hideTags = () => Object.values(groups).forEach((g) => g.tag && gsap.to(g.tag, { autoAlpha: 0, duration: 0.4 }));
/** a prompt beside the speaker that stays up while the child works (not read aloud) */
const prompt = (t) => host.cur && say(host.cur, t, { wait: false, voice: false });
/** the things standing in front of a door fade back while it is knocked on, so the child can see the door to tap.
 *  Returns a function that brings them back */
function clearDoor(d) {
  const r = d.getBoundingClientRect(), pad = 6;
  const hide = [...back.children, ...front.children].filter((e) => {
    const q = e.getBoundingClientRect();
    return q.width && !(q.right < r.left + pad || q.left > r.right - pad || q.bottom < r.top + pad || q.top > r.bottom - pad);
  });
  gsap.to(hide, { opacity: 0.12, duration: 0.3 });
  return () => gsap.to(hide, { opacity: 1, duration: 0.4 });
}
// someone knocks: the child opens the door and the replies fly in
async function knockDoor(di, kind, count) {
  repliesMini(false); // the replies are the subject again: every card shows
  gsap.set(valBox, { autoAlpha: 0 }); // and they do the counting: no second count beside the title
  const d = doors[di];
  d.classList.add("pulse");
  gsap.to(d, { filter: "brightness(1.15) saturate(1.1) drop-shadow(0 0 24px rgba(255,197,71,.8))", duration: 0.4 });
  sfx("knock");
  const knock = setInterval(() => { sfx("knock"); gsap.fromTo(d, { x: -4 }, { x: 4, duration: 0.05, repeat: 5, yoyo: true }); }, 2600);
  closeBubble();
  // the door must be in clear view: the scroll steps back, and the camera stays wide so the speaker is never
  // pushed off the edge
  gsap.to([scroll?.el].filter(Boolean), { opacity: 0.12, duration: 0.3 });
  const dx = +d.dataset.x, dy = +d.dataset.y;
  await camRest(0.4);
  const dp = camPt(dx, dy, "far");
  const restore = clearDoor(d);
  // the label sits above the door, never on it
  const tip = el("div", "doorTip", ui, { left: dp.x, top: dp.y - DOOR_D / 2 - 66 }, "Tap the door! ▼");
  const h = await pointHand(dp.x + 30, dp.y + 30, 0);
  await new Promise((r) => onTap(d, r));
  clearInterval(knock); h.remove(); tip.remove(); d.classList.remove("pulse");
  sfx("creak");
  // the door swings open on its hinge, warm light pours out across the floor, and the replies fly out of the light
  const light = el("div", "doorLight", null, { left: parseFloat(d.style.left) + 12, top: parseFloat(d.style.top) + 12, width: DOOR_D - 24, height: DOOR_D - 24 });
  d.parentNode.insertBefore(light, d);
  const beam = el("div", "doorBeam", null, { left: dx - 150, top: dy + 70, width: 300, height: 380 });
  world.insertBefore(beam, world.firstChild);
  gsap.fromTo([light, beam], { opacity: 0 }, { opacity: 1, duration: 0.5 });
  await gsap.to(d, { rotationY: -108, transformPerspective: 650, transformOrigin: "0% 50%", duration: 0.65, ease: "power2.out" });
  const pf = playFx("portal", dx, dy + 70, { palette: kind === "d" ? "gold" : "plum", scale: 2 });
  const from = camPt(dx, dy, "far");
  for (let i = 0; i < count; i++) {
    rsvpCard(kind, from, i);
    if (kind !== "no") { vals[kind]++; valPills(valBox, vals, uses); }
    await wait(0.3);
  }
  pf.stop();
  await wait(0.4);
  gsap.to([scroll?.el].filter(Boolean), { opacity: 1, duration: 0.3 });
  restore();
  gsap.to(d, { rotationY: 0, duration: 0.5, ease: "power2.in" });
  gsap.to([light, beam], { opacity: 0, duration: 0.5, onComplete: () => { light.remove(); beam.remove(); } });
  gsap.to(d, { filter: "brightness(.55) saturate(.8)", duration: 0.6 });
}
// the two monsters who said no: their Yes cards are crossed out only once the child has answered
async function twoSaidNo() {
  const yes = [...rsvp.querySelectorAll(".grp.m .cards.yes .rc:not(.out)")].slice(-2);
  for (const c of yes) { c.classList.add("out"); el("i", "x", c, {}, "✕"); sfx("pop"); gsap.fromTo(c, { scale: 1.15 }, { scale: 1, duration: 0.3 }); await wait(0.35); }
  await wait(0.5);
  await gsap.to([...yes, ...rsvp.querySelectorAll(".cards.no .rc")], { opacity: 0, scale: 0.6, duration: 0.35 });
  yes.forEach((c) => c.remove()); rsvp.querySelector(".cards.no").innerHTML = "";
  countCards();
  if (numbered) renumber();
}
// friends in all: every Yes card gets its number, one by one
async function countAll() {
  const cs = [...rsvp.querySelectorAll(".cards.yes .rc:not(.out)")];
  for (const [i, c] of cs.entries()) { el("i", "num", c, {}, String(i + 1)); sfx("star"); gsap.from(c.lastChild, { scale: 0, duration: 0.25, ease: "back.out(3)" }); await wait(0.16); }
  numbered = true;
}

// ---------- the equation bar: item name = plan, with gold seals over the letters ----------
const OPS = ["+", "−", "×"];
const EQ_Q = `<span class="lo">&thinsp;=&thinsp;</span><span class="q">?</span>`;
function renderPlan(q) {
  const head = q.change ? `<span class="lm">m</span>` : `<span class="item">${q.name}</span>`;
  bar.innerHTML = head + `<span class="lo">&thinsp;=&thinsp;</span>` + q.plan.map((t) => OPS.includes(t) ? `&thinsp;${show([t])}&thinsp;` : (t === "m" || t === "d") ? `<span class="seal" data-k="${t}" style="color:${t === "m" ? "#5a1fa8" : "#c2410c"}"><i class="sl">${t}</i></span>` : show([t])).join("");
  // the seals are asleep (grey) while the question is read: a tap on one ends the line, and they wake after it
  lock([...bar.querySelectorAll(".seal")]);
}
// each seal opens on its own tap, even while another one is still opening
async function crackSeals() {
  const seals = [...bar.querySelectorAll(".seal")];
  lock(seals, false);
  const help = setTimeout(() => { const s = bar.querySelector(".seal:not(.open)"); if (!s) return; const r = s.getBoundingClientRect(), p = toStage({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }); pointHand(p.x, p.y, 2.4); }, 10000);
  await Promise.all(seals.map((s) => new Promise((res) => {
    s.classList.add("pulse");
    onTap(s, async () => { if (s.dataset.open) return; s.dataset.open = 1; s.classList.remove("pulse"); await openSeal(s); res(); });
  })));
  clearTimeout(help);
}
// a seal opens in about a second: the number flies in, the coin turns once, the plain number shows
async function openSeal(s) {
  const k = s.dataset.k, v = String(vals[k]), sl = s.querySelector(".sl");
  const rr = s.getBoundingClientRect(), pp = toStage({ clientX: rr.left + rr.width / 2, clientY: rr.top + rr.height / 2 });
  // the value flies out of its m = 6 pill into the coin, so the eye follows the substitution
  const pill = valBox.querySelector(".vpill." + k);
  if (pill) {
    const pr = pill.getBoundingClientRect(), a = toStage({ clientX: pr.left + pr.width / 2, clientY: pr.top + pr.height / 2 });
    const fly = el("div", "flynum " + k, ui, { left: a.x, top: a.y }, v);
    gsap.fromTo(pill, { scale: 1.25 }, { scale: 1, duration: 0.4 });
    await gsap.fromTo(fly, { scale: 0.6 }, { left: pp.x, top: pp.y, scale: 1.1, opacity: 0.2, duration: 0.3, ease: "power2.inOut" });
    fly.remove();
  }
  // the m coin spins; when it is edge-on the letter becomes the number, so the swap is never seen
  sfx("whoosh");
  const o = { a: 0 };
  let swapped = false;
  await gsap.to(o, { a: 1, duration: 0.55, ease: "power2.inOut", onUpdate: () => {
    const fr = Math.floor(((o.a % 0.5) / 0.5) * 12) % 12;
    s.style.backgroundPosition = `${(fr / 11) * 100}% 0`;
    sl.style.transform = `scaleX(${Math.max(0.02, Math.abs(Math.cos(o.a * 2 * Math.PI)))})`;
    if (!swapped && o.a >= 0.25) { swapped = true; sl.textContent = v; }
  } });
  sfx("magic");
  playFx("collect", pp.x, pp.y, { palette: "gold", scale: 2, parent: ui });
  // then the coin steps aside for the plain number, shown whole: no half-drawn sums.
  // 2m with m = 6 reads 2 × 6, never "2 6" (which looks like twenty-six)
  gsap.set(s, { opacity: 0 });
  const afterNum = s.previousElementSibling && s.previousElementSibling.classList.contains("ln");
  s.classList.add("open");
  s.style.backgroundImage = "none";
  s.innerHTML = (afterNum ? '<span class="lo">×</span>' : "") + v;
  await gsap.fromTo(s, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" });
}
// the answers: three gems in a pill panel, bottom right, shown and switched on together
async function chooseNum(opts) {
  const panel = el("div", "pickbar", ui, { left: PICK.cx - 300, top: PICK.top, width: 600, height: 170 });
  const ls = opts.map((v, i) => el("div", "lantern big p3", ui, { left: PICK.cx - 75 + (i - 1) * PICK.gap, top: PICK.top + 10 }, String(v)));
  lock(ls);
  await gsap.from([panel, ...ls], { y: 40, opacity: 0, duration: 0.35, ease: "back.out(1.6)" });
  ls.forEach((l, i) => { l.style.animationDuration = 2 + i * 0.4 + "s"; l.classList.add("bobbing"); }); // a CSS bob: no script every frame
  return {
    ls, panel,
    pick: () => new Promise((res) => {
      lock(ls, false);
      ls.forEach((l, i) => (l.onpointerdown = (e) => { e.stopPropagation(); sfx("tap"); ls.forEach((x) => (x.onpointerdown = null)); lock(ls); res([opts[i], l]); }));
    }),
  };
}
/** a wrong number: the board says what it would mean (the table only ever gets the right number) */
function tooFew(q, n) { if (q.prep !== "friends" && !q.change) popup(n < q.ans ? `${n} is not enough!` : `${n} is too many!`, 1.6, 540, PICK.cx); }
/** the board has gone: the things for the answer drop onto the table, or the friends are counted */
async function deliver(q) {
  if (q.prep === "friends") { await countAll(); return; }
  groups[q.prep] = place(q.prep, q.ans, { x: TX, y: 140 });
  await wait(0.6 + Math.min(q.ans * 0.03, 0.7));
}
// the working-out board comes down over the hall for a question and goes when it is solved
let board = null;
async function boardIn() {
  if (board) return;
  board = el("div", "wboard", null, { left: BOARD.x, top: BOARD.y, width: BOARD.w, height: BOARD.h });
  ui.insertBefore(board, ui.firstChild); // under every other piece of the UI
  gsap.set(QB.box, { opacity: 0 });
  QB.box.classList.add("onboard");
  sfx("whoosh");
  await gsap.from(board, { y: -50, opacity: 0, duration: 0.45, ease: "power3.out" });
}
async function boardOut() {
  if (!board) return;
  const b = board;
  board = null;
  await gsap.to(QB.box, { opacity: 0, duration: 0.2 });
  await gsap.to(b, { y: -40, opacity: 0, duration: 0.4, ease: "power2.in" });
  b.remove();
  QB.box.classList.remove("onboard"); // the worked plan stays at the top of the hall
  gsap.to(QB.box, { opacity: 1, duration: 0.3 });
}

function buildScene() {
  setFocus("table"); // the back wall steps back, so the table and the cards stand out
  setFore(0);
  buildTable();
  buildRsvp();
  numbered = false;
  QB = qbox();
  QB.box.classList.add("eq"); // the big equation bar
  bar = QB.plan; valBox = QB.vals;
}
// a jump into the middle of Part 3 (QA): the cards and the table as they would be by then
function catchUp(start) {
  const from = { x: 200, y: 200 };
  for (let i = 0; i < 6; i++) rsvpCard("m", from, i);
  vals.m = 6;
  if (start > 4) { for (let i = 0; i < 4; i++) rsvpCard("d", from, i); vals.d = 4; renumber(); numbered = true; }
  if (start > 6) { [...rsvp.querySelectorAll(".grp.m .cards.yes .rc")].slice(-2).forEach((c) => c.remove()); vals.m = 4; countCards(); renumber(); }
  for (const q of Q.slice(0, start - 1)) if (FORM[q.prep]) groups[q.prep] = place(q.prep, FORM[q.prep](vals));
  lights.light((start - 1) / Q.length);
}

export async function runPart3(start = 1) {
  vals = { m: 0, d: 0 }; uses = "m";
  buildScene();
  checklist(Q);
  for (let i = 0; i < start - 1; i++) checkDone(i);
  drawVals();
  if (start > 1) {
    catchUp(start);
    drawVals();
    scroll = await planScroll({ left: 1205, top: 96 });
    scroll.el.classList.add("docked", "tab");
  } else {
    // Neel tells his friends: all three are here for it (they stand ready under the title card)
    trio("trioTable");
    await afterTitle();
    const ir = iconRow(Q);
    await say("nar", "Neel has decided who is coming. Let's find the exact number of things we need.");
    ir.remove();
    QB.show("Neel has decided!");
    await say("neel", "I have decided! 6 monster friends are coming.", { p: "happy" });
    await knockDoor(0, "m", 6);
    QB.show("6 monster friends said yes!");
    // the party plan from Part 2 comes out again, then stays open at the side
    gsap.to(QB.box, { opacity: 0, duration: 0.3 });
    scroll = await planScroll({ left: 520, top: 96 });
    await maya("Look at our party plan. We wrote it when we did not know the number of friends. That is why we used m.", "explain");
    await maya("Now we know that m is 6. So we just put 6 in place of m, and then work it out.", "cast");
    // the scroll goes to its place at the side, and the friends step back for the questions: Maya alone, bottom
    // left, so her bubble never covers the scroll
    closeBubble();
    solo("table");
    await scroll.dock({ left: 1205, top: 96 });
    const ex = card(`<div class="tag">Maya explains</div><p>Glasses: ${show(["2", "m"])}</p><p>Put 6 in place of <span class="mtxt">m</span>: 2 × 6 = <b>12</b></p>`, { left: 470, top: 30, width: 680 }, "card lesson");
    await maya("For example, glasses: 2 for each friend is 2m. Put 6 in place of m: 2 × 6 = 12 glasses.", "explain");
    await maya("Now you try! Find the exact number of each thing on the plan.", "happy");
    await gsap.to(ex, { opacity: 0, duration: 0.3 }); ex.remove();
    gsap.to(QB.box, { opacity: 1, duration: 0.3 });
  }
  solo("table"); // one speaker at a time for the questions

  for (let qi = start - 1; qi < Q.length; qi++) {
    const q = Q[qi];
    checkCur(qi);
    hideTags();
    if (!q.arrive && !q.change) repliesMini(true);
    setAnswer(q.ans);
    camRest(0.6); // no zoom: the cards, the table and the speaker all stay in frame
    if (q.arrive?.d) {
      bar.innerHTML = ""; uses = "d"; drawVals();
      QB.show(q.arrive.d === 4 ? "Someone is knocking!" : "More knocking!");
      await say("agni", q.arrive.d === 4 ? "Listen! Someone is knocking!" : "More knocking! Who is it?", { p: "shocked" });
      await knockDoor(2, "d", q.arrive.d);
    }
    if (q.change) {
      // two replies come back: "Sorry, I can't come". The six Yes cards stay until the child has answered
      bar.innerHTML = "";
      QB.show("A knock at the door!");
      await knockDoor(1, "no", 2); // the middle door: the board of replies has grown over the left one
    }
    await boardIn();
    uses = q.change ? "m" : q.plan.filter((t) => t === "m" || t === "d").join("");
    drawVals();
    scroll.glow(q.change ? "" : ITEM[q.prep]);
    QB.show(q.name, q.means);
    renderPlan(q);
    if (q.change) bar.insertAdjacentHTML("beforeend", EQ_Q);
    gsap.fromTo(bar, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" });
    if (q.who === "maya") await maya(q.line, "explain");
    else await say(q.who, q.line);
    const iw = idleWatch(16, async () => { await maya("Take your time. " + q.inact(vals), "hint"); });
    if (!q.change) {
      prompt(uses.length > 1 ? "Tap the gold seals to see the numbers!" : "Tap the gold seal to see the number!");
      await crackSeals();
      closeBubble(); // the seal prompt is done: it does not stay in the bubble
      gsap.to(valBox, { autoAlpha: 0, duration: 0.3 }); // the numbers are in the bar now
      bar.insertAdjacentHTML("beforeend", EQ_Q);
    }
    prompt(q.ask);
    const { ls, panel, pick } = await chooseNum(q.opts);
    let tries = 0;
    while (true) {
      iw.open();
      const [v, l] = await pick();
      iw.pause();
      closeBubble(); // the question prompt goes as soon as the child answers
      const ok = v === q.ans;
      if (ok) break;
      tooFew(q, v);
      tries++;
      // a wrong gem gets a cross while Maya helps; then it is a normal gem again, so the answer is never
      // left alone on the panel before the third try
      sfx("bad");
      const x = el("div", "nope", l, {}, "✕");
      l.classList.add("wrong");
      gsap.fromTo(l, { x: -8 }, { x: 0, duration: 0.45, ease: "elastic.out(1.2,.3)" });
      if (tries < 3) {
        await maya("Not yet. Try again. " + (tries === 1 ? q.h1 : q.h2)(vals), "hint");
        x.remove(); l.classList.remove("wrong");
        prompt(q.ask);
      } else {
        x.remove(); l.classList.remove("wrong");
        const good = ls[q.opts.indexOf(q.ans)];
        good.classList.add("answer");
        pointHand(parseFloat(good.style.left) + 50, parseFloat(good.style.top) + 60, 2);
        await maya(`Let's see the answer together. The answer is ${q.ans}. ` + q.exp, "explain");
        break;
      }
    }
    iw.stop();
    ls.forEach((l) => gsap.to(l, { scale: 0, duration: 0.25, onComplete: () => l.remove() }));
    gsap.to(panel, { opacity: 0, duration: 0.25, onComplete: () => panel.remove() });
    closeBubble();
    // the whole working, with the item's name, on the board
    const head = q.change ? `<span class="lm">m</span>` : `<span class="item">${q.name}</span>`;
    bar.innerHTML = `${head}<span class="lo">&thinsp;=&thinsp;</span><span class="ln work">${q.work.replace(/= (\d+)$/, '= <span style="color:#ffe066">$1</span>')}</span>`;
    gsap.fromTo(bar, { scale: 1.08 }, { scale: 1, duration: 0.5, ease: "back.out(2)" });
    sfx("good");
    playFx("collect", PICK.cx, 330, { palette: "gold", scale: 3, parent: ui });
    QB.sub(`<span class="win">${q.pop} ✓</span>`);
    await award(tries, PICK.cx, 420, 3);
    await wait(0.5);
    // solved: the board goes, and the party hall shows what the answer means
    await boardOut();
    if (!q.change) await deliver(q);
    if (q.change) {
      await twoSaidNo();
      // "m can change": the m coin flips from 6 to 4, then drops into the m pill
      const mc = coin(ui, { left: TX - 75, top: 250, width: 150, height: 150 }, "6");
      mc.face.style.fontSize = "76px";
      await gsap.from(mc.el, { scale: 0, duration: 0.35, ease: "back.out(2)" });
      await mc.spin(1.5, ["4", "4", "4"], 1.1);
      vals.m = 4; drawVals();
      const pr = valBox.querySelector(".vpill.m")?.getBoundingClientRect();
      if (pr) { const a = toStage({ clientX: pr.left + pr.width / 2, clientY: pr.top + pr.height / 2 }); await gsap.to(mc.el, { left: a.x - 75, top: a.y - 75, scale: 0.25, opacity: 0, duration: 0.5, ease: "power2.in" }); }
      mc.el.remove();
    }
    // when m or d has just changed, the table is worked out again while a line from the sheet talks about the plan:
    // after Question 6, Maya's "Now m is 4. Our plan still works…"; after Question 8, her "…The plan still works,
    // even when the numbers change!" (the plates and cushions follow d = 7). No extra lines
    const recount = q.arrive?.d === 3 ? () => rework() : undefined;
    if (tries < 3) { await praise(PRAISE[qi]); await maya("Correct! " + q.exp, "happy", recount); }
    else if (recount) await recount();
    if (q.change) {
      // the table was set for 6 monster friends: 2 chairs go first, then the sweets, plates and balloons are counted again
      await maya("Now m is 4. Our plan still works: chairs = 4 + 1 = 5.", "explain", () => { restock("chairs", FORM.chairs(vals)); setTimeout(rework, 900); });
    }
    await wait(0.6); // a recount that is still landing finishes before the next question
    checkDone(qi);
    lights.light((qi + 1) / Q.length); // the garland over the table: the party is a bit more ready
    closeBubble();
    await wait(0.3);
  }
  gsap.to(QB.box, { opacity: 0, duration: 0.5 });
}
