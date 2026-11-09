// Core engine: stage, scenes with parallax, characters, dialogue, FX, sound, helpers.
import { gsap } from "gsap";
import { playFx } from "./fx.js";
import CURTAIN from "./curtain.svg";
// recorded character voices (tools/make_vo.py): which (speaker, segment) recordings exist
import { segments, voId } from "./vo.js";
import VO_IDS from "./vo_manifest.json";
// sound effects (Kenney audio packs, CC0), bundled as data URLs so they also work when index.html is opened from disk
import S_TAP from "./sfx/tap.mp3";
import S_POP from "./sfx/pop.mp3";
import S_GOOD from "./sfx/good.mp3";
import S_BAD from "./sfx/bad.mp3";
import S_CHEER from "./sfx/cheer.mp3";
import S_WIN from "./sfx/win.mp3";
import S_KNOCK from "./sfx/knock.mp3";
import S_LAND from "./sfx/land.mp3";
import S_STAR from "./sfx/star.mp3";
export { gsap };

export const W = 1600, H = 900;
export const A = (n) => `assets/${n}.webp`;
export const $ = (s, r = document) => r.querySelector(s);
export const wait = (s) => new Promise((r) => setTimeout(r, s * 1000 / (window.__speed || 1)));
export const rnd = (a, b) => a + Math.random() * (b - a);

export function el(tag, cls, parent, style = {}, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  Object.assign(e.style, Object.fromEntries(Object.entries(style).map(([k, v]) => [k, typeof v === "number" && !["opacity", "zIndex"].includes(k) ? v + "px" : v])));
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function img(name, parent, style = {}, cls = "abs") {
  const i = el("img", cls, parent, style);
  i.src = A(name);
  i.draggable = false;
  return i;
}

// ---------- stage ----------
export const stage = $("#stage");
const layers = {};
export const world = $("#world"), charsL = $("#chars"), ui = $("#ui"), fxl = $("#fxl");
// the camera: everything that belongs to the scene sits in #cam and moves with it; the UI (#ui, HUD, curtain) stays put
const camEl = el("div", "", null); camEl.id = "cam";
stage.insertBefore(camEl, $("#Lfar"));
for (const id of ["Lfar", "Lmid", "dim", "world", "Lfore", "chars", "fxl"]) camEl.appendChild($("#" + id));
/** scene-space UI that should move with the camera (the house map) */
export const camUI = el("div", "", camEl); camUI.id = "camui";
// a soft vignette fixed to the screen gives the frame depth
const vig = el("div", "", null); vig.id = "vig";
stage.insertBefore(vig, ui);
// spotlight: everything but one screen point goes dark (the door that is opening)
const spot = el("div", "", null); spot.id = "spot";
stage.insertBefore(spot, ui);
export function spotOn(x, y, r = 170) { spot.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(6,3,20,0) ${r}px, rgba(6,3,20,.72) ${r * 2}px)`; gsap.to(spot, { opacity: 1, duration: 0.5 }); }
export function spotOff(dur = 0.6) { gsap.to(spot, { opacity: 0, duration: dur }); }
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(${(innerWidth - W * s) / 2}px,${(innerHeight - H * s) / 2}px) scale(${s})`;
  stage._s = s;
}
addEventListener("resize", fit);
fit();
export function toStage(e) {
  const r = stage.getBoundingClientRect(), s = stage._s;
  return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
}

// ---------- preload ----------
export async function preload(names, onp) {
  let n = 0;
  await Promise.all(names.map((nm) => new Promise((res) => {
    const i = new Image();
    i.onload = i.onerror = () => { n++; onp && onp(n / names.length); res(); };
    i.src = A(nm);
  })));
}

// ---------- scenes + parallax ----------
const SPEED = { far: 0.12, mid: 0.4, fore: 0.9 };
const CAMDEPTH = { far: 0.55, mid: 0.8, fore: 1.15 }; // how far each layer travels when the camera pans (scene = 1)
const LT = { far: { x: 0, y: 0 }, mid: { x: 0, y: 0 }, fore: { x: 0, y: 0 } }; // each layer's current offset, scene units
for (const k of ["far", "mid", "fore"]) layers[k] = $("#L" + k);
export const farLayer = () => layers.far;
let px = 0, py = 0, tx = 0, ty = 0, drift = 0;
stage.addEventListener("pointermove", (e) => { const p = toStage(e); tx = (p.x / W - 0.5) * 2; ty = (p.y / H - 0.5) * 2; });
gsap.ticker.add((t) => {
  px += (tx - px) * 0.05; py += (ty - py) * 0.05;
  const sway = Math.sin(t * 0.25) * 0.5 + drift, bob = Math.sin(t * 0.4) * 4; // slow breathing of the middle layer
  for (const k in SPEED) {
    const lt = LT[k];
    lt.x = (-px * 70 + sway * 40) * SPEED[k] + (camOff.x * (CAMDEPTH[k] - 1)) / camOff.s;
    lt.y = -py * 10 * SPEED[k] + (k === "mid" ? bob : 0);
    layers[k].style.transform = `translate(${lt.x}px,${lt.y}px)`;
  }
});

// ---------- scene transition: storybook curtain ----------
// curtain.svg has three groups (left, right, valance). Each goes in its own layer so GSAP only moves
// whole layers with transform (GPU), never SVG attributes. Gradients live in one shared <defs>.
const NS = "http://www.w3.org/2000/svg", CS = W / 1920; // svg is 1920 wide, the stage is 1600
const curtain = el("div", "", stage); curtain.id = "curtain";
const csvg = new DOMParser().parseFromString(CURTAIN, "image/svg+xml");
const defsSvg = document.createElementNS(NS, "svg");
defsSvg.setAttribute("width", 0); defsSvg.setAttribute("height", 0); defsSvg.style.position = "absolute";
defsSvg.appendChild(document.importNode(csvg.querySelector("defs"), true));
curtain.appendChild(defsSvg);
function curtainLayer(id) {
  const d = el("div", "cur", curtain), s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 1920 1080"); s.setAttribute("preserveAspectRatio", "none"); s.setAttribute("aria-hidden", "true");
  s.appendChild(document.importNode(csvg.getElementById(id), true));
  d.appendChild(s);
  return d;
}
const cL = curtainLayer("left-curtain"), cR = curtainLayer("right-curtain"), cV = curtainLayer("top-valance");
const OPEN = { x: 1140 * CS, y: -300 * CS };
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const layers3 = [cL, cR, cV];
// FRAME: the curtains rest at the screen edges like a stage frame (title, party), below the HUD and menu
const FRAME = { x: 835 * CS, y: -115 * CS };
/** close the curtain instantly (e.g. behind the loader, so the title can open like a stage) */
export function curtainShut() { curtain.style.zIndex = 150; gsap.set([cL, cR], { x: 0 }); gsap.set(cV, { y: 0 }); gsap.set(curtain, { autoAlpha: 1 }); }
export function curtainClose() {
  curtain.style.zIndex = 150;
  gsap.set(layers3, { willChange: "transform" });
  if (calm) { curtainShut(); return gsap.fromTo(curtain, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }); }
  gsap.set(cL, { x: -OPEN.x }); gsap.set(cR, { x: OPEN.x }); gsap.set(cV, { y: OPEN.y }); gsap.set(curtain, { autoAlpha: 1 });
  sfx("whoosh");
  return gsap.timeline()
    .to(cV, { y: 0, duration: 0.5, ease: "bounce.out" }, 0)
    .to(cL, { x: 0, duration: 0.7, ease: "power3.in" }, 0.05)
    .to(cR, { x: 0, duration: 0.7, ease: "power3.in" }, 0.05)
    // the halves meet with a soft bump, like heavy velvet
    .to(cL, { x: -14, duration: 0.12, ease: "power1.out" }, 0.75).to(cL, { x: 0, duration: 0.22, ease: "power2.in" })
    .to(cR, { x: 14, duration: 0.12, ease: "power1.out" }, 0.75).to(cR, { x: 0, duration: 0.22, ease: "power2.in" }, "<");
}
/** frame: true stops at the stage-frame pose instead of opening fully */
export function curtainOpen({ frame = false } = {}) {
  const done = () => { gsap.set(layers3, { willChange: "auto" }); if (frame) curtain.style.zIndex = 65; else gsap.set(curtain, { autoAlpha: 0 }); };
  if (calm) return gsap.to(curtain, { autoAlpha: 0, duration: 0.3, onComplete: done });
  gsap.set(layers3, { willChange: "transform" });
  if (frame) return gsap.timeline({ onComplete: done })
    .to(cL, { x: -FRAME.x, duration: 1.1, ease: "power3.inOut" }, 0.1)
    .to(cR, { x: FRAME.x, duration: 1.1, ease: "power3.inOut" }, 0.1)
    .to(cV, { y: FRAME.y, duration: 0.8, ease: "power2.inOut" }, 0.35);
  sfx("magic");
  // timing follows curtain-opening.svg: the halves overshoot a little and settle, the valance lifts after them
  return gsap.timeline({ onComplete: done })
    .to(cL, { keyframes: [{ x: -OPEN.x, duration: 0.95, ease: "power3.inOut" }, { x: -1120 * CS, duration: 0.15, ease: "sine.out" }] }, 0.1)
    .to(cR, { keyframes: [{ x: OPEN.x, duration: 0.95, ease: "power3.inOut" }, { x: 1120 * CS, duration: 0.15, ease: "sine.out" }] }, 0.1)
    .to(cV, { y: OPEN.y, duration: 0.8, ease: "power2.inOut" }, 0.35);
}
/** slide the curtains in from off-screen to the stage-frame pose (the party) */
export function curtainFrame() {
  if (calm) return;
  curtain.style.zIndex = 65;
  gsap.set(cL, { x: -OPEN.x }); gsap.set(cR, { x: OPEN.x }); gsap.set(cV, { y: OPEN.y }); gsap.set(curtain, { autoAlpha: 1 });
  return gsap.timeline()
    .to(cV, { y: FRAME.y, duration: 0.6, ease: "bounce.out" }, 0)
    .to(cL, { x: -FRAME.x, duration: 0.9, ease: "power3.out" }, 0.1)
    .to(cR, { x: FRAME.x, duration: 0.9, ease: "power3.out" }, 0.1);
}

// ---------- ambient life per scene: stars, fireflies, embers, dust (CSS animations, transform + opacity only) ----------
function sprinkle(parent, cls, n, box, extra) {
  for (let i = 0; i < n; i++) {
    const d = el("div", cls, parent, { left: box.x + Math.random() * box.w, top: box.y + Math.random() * box.h });
    d.style.animationDelay = `${-Math.random() * 8}s, ${-Math.random() * 3}s`;
    d.style.animationDuration = `${7 + Math.random() * 6}s, ${1.6 + Math.random() * 2}s`;
    d.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
    d.style.setProperty("--dy", `${-30 - Math.random() * 90}px`);
    extra && extra(d, i);
  }
}
function ambient(name) {
  if (calm) return;
  const far = layers.far, mid = layers.mid;
  if (name === "forest") {
    sprinkle(far, "amb star", 40, { x: 500, y: 10, w: 1500, h: 320 }, (d) => { const z = 2 + Math.random() * 4; Object.assign(d.style, { width: z + "px", height: z + "px" }); });
    sprinkle(mid, "amb fly", 12, { x: 250, y: 470, w: 1500, h: 330 });
  } else if (name === "cauldron") sprinkle(mid, "amb ember", 10, { x: 760, y: 420, w: 200, h: 120 });
  else sprinkle(mid, "amb mote", 14, { x: 250, y: 150, w: 1500, h: 600 });
}

// ---------- scene tint: the night moves on (evening → deep night → party) ----------
const tint = el("div", "", null); tint.id = "tint";
camEl.insertBefore(tint, world);
export function setTint(c = "rgba(0,0,0,0)", dur = 1.2) { gsap.to(tint, { backgroundColor: c, duration: dur }); }

// ---------- camera ----------
// screen = scene * s + offset, offset = a * (1 - s) + t: zooming about the anchor a keeps a still on screen.
// A punch (k about screen point p) and a shake (j) sit on top. The view never shows past the backgrounds.
const cam = { s: 1, ax: W / 2, ay: H / 2, tx: 0, ty: 0, k: 1, px: W / 2, py: H / 2, j: 0 };
let camOff = { x: 0, y: 0, s: 1 };
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function camApply() {
  const s = cam.s;
  let ox = clampN(cam.ax * (1 - s) + cam.tx, W * (1 - s) - 90, 90), oy = clampN(cam.ay * (1 - s) + cam.ty, H * (1 - s), 0);
  const S = s * cam.k;
  ox = (ox - cam.px) * cam.k + cam.px + cam.j; oy = (oy - cam.py) * cam.k + cam.py;
  oy = clampN(oy, H * (1 - S), 0);
  camOff = { x: ox, y: oy, s: S };
  camEl.style.transform = `translate(${ox}px,${oy}px) scale(${S})`;
  if (bubble._c) reflowBubble();
}
gsap.ticker.add(camApply);
/** where a scene point is on screen right now (layer: "far" | "mid" | "fore" for background props) */
export function camPt(x, y, layer) {
  const lt = layer ? LT[layer] : { x: 0, y: 0 };
  return { x: (x + lt.x) * camOff.s + camOff.x, y: (y + lt.y) * camOff.s + camOff.y };
}
function setAnchor(x, y) { cam.tx += (x - cam.ax) * (cam.s - 1); cam.ty += (y - cam.ay) * (cam.s - 1); cam.ax = x; cam.ay = y; }
/** move the camera: zoom s about scene point (x, y), plus a drift (tx, ty) */
export function camTo({ x = cam.ax, y = cam.ay, s = 1, tx = 0, ty = 0, dur = 1, ease = "power2.inOut", from } = {}) {
  if (calm) return Promise.resolve();
  gsap.killTweensOf(cam, "s,tx,ty");
  setAnchor(x, y);
  if (from) Object.assign(cam, from);
  return gsap.to(cam, { s, tx, ty, duration: dur, ease });
}
export const camRest = (dur = 0.9, ease = "power2.inOut") => camTo({ s: 1, dur, ease });
/** jump without animating (behind the curtain) */
export function camSet({ x = W / 2, y = H / 2, s = 1 } = {}) { gsap.killTweensOf(cam); Object.assign(cam, { s, ax: x, ay: y, tx: 0, ty: 0, k: 1, j: 0 }); }
/** a short zoom pulse toward a screen point (reward beats) */
export function punch(x, y, amt = 1.06) {
  if (calm) return;
  cam.px = x; cam.py = y;
  gsap.fromTo(cam, { k: 1 }, { k: amt, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 });
}
export function shake(px = 10) {
  if (calm) return;
  gsap.fromTo(cam, { j: 0 }, { keyframes: [{ j: -px }, { j: px * 0.8 }, { j: -px * 0.5 }, { j: 0 }], duration: 0.32, ease: "none" });
}
/** party: a gentle side-to-side sway, slightly closer */
export function camSway() {
  if (calm) return;
  camTo({ x: W / 2, y: 620, s: 1.04, dur: 1.5 });
  gsap.to(cam, { tx: 24, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5 });
}
/** frame the play area while a question is open */
export const camFocus = (x, y, s = 1.05, dur = 1.2) => camTo({ x, y, s, dur });

// ---------- depth: soft light pools and contact shadows on the floor ----------
export function lightPool(x, y, w, h = w * 0.32, parent = world) {
  const p = el("div", "pool", null, { left: x - w / 2, top: y - h / 2, width: w, height: h });
  parent.insertBefore(p, parent.firstChild);
  return p;
}
/** a soft dark ellipse under a prop standing on the floor at (x, y) */
export function groundShadow(x, y, w, h = w * 0.12, parent = world) {
  const g = el("div", "gshadow", null, { left: x - w / 2, top: y - h / 2, width: w, height: h });
  parent.insertBefore(g, parent.firstChild);
  return g;
}

export let sceneName = "";
/** plain: back layer only (no mid/fore props), for a calm, uncluttered backdrop */
export async function setScene(name, { fast = false, plain = false } = {}) {
  let shut = false;
  if (!fast && sceneName) { await curtainClose(); shut = true; }
  for (const k of ["far", "mid", "fore"]) {
    layers[k].innerHTML = "";
    if (!plain || k === "far") img(`bg_${name}_${k}`, layers[k], {}, "plate");
  }
  world.innerHTML = "";
  gsap.set(layers.fore, { opacity: 1 });
  // reset to the neutral filter, never "none": tweening from "none" starts brightness at 0 and flashes the scene black
  gsap.set([layers.far, layers.mid], { filter: FILTER_OFF });
  host.on = false; host.cur = null;
  sceneName = name;
  ambient(name);
  if (shut && !calm) {
    // establishing shot: start high and close on the top of the scene, tilt down to the floor as the curtain parts
    camSet({ x: W / 2, y: 0, s: 1.1 });
    await wait(0.15);
    camTo({ s: 1, dur: 2.2, ease: "power2.inOut" });
    await curtainOpen();
  } else {
    camSet();
    gsap.fromTo(layers.far, { scale: 1.06 }, { scale: 1, duration: 2.2, ease: "power2.out", transformOrigin: "50% 60%" });
    if (shut) { await wait(0.15); await curtainOpen(); }
  }
}
// every focus filter lists the same functions in the same order, so tweens between them never pass through black
const FILTER_OFF = "blur(0px) brightness(1) saturate(1)";
export function setFocus(on, dur = 0.6) {
  const f = { soft: "blur(0px) brightness(0.86) saturate(0.95)", story: "blur(1.5px) brightness(0.92) saturate(1)", table: "blur(4px) brightness(0.62) saturate(0.8)" }[on] || (on ? "blur(3px) brightness(0.8) saturate(0.95)" : FILTER_OFF);
  gsap.to([layers.far, layers.mid], { filter: f, duration: dur });
}
// host mode: only ONE character is on screen – whoever is speaking – standing on a spot.
// game: bottom-left beside the play area. story: large on the right, the left half is free for visuals.
export const SPOTS = {
  game: { x: 190, y: 890, from: -160, bw: 420, size: { neel: 470, agni: 430, maya: 480 }, flip: { agni: true } }, // Agni's art looks left
  story: { x: 1150, y: 895, from: 160, bw: 600, size: { neel: 600, agni: 520, maya: 600 }, flip: { maya: true } },
  // the table scene: a smaller speaker bottom-left, the bubble beside them (not above), so the table stays the hero
  table: { x: 165, y: 895, from: -160, bw: 310, side: true, btop: 648, size: { neel: 360, agni: 335, maya: 370 }, flip: { agni: true } },
  // conversations: the two characters who are talking stand side by side, facing each other (a third speaker
  // takes the place of whoever spoke longer ago). duo: story scenes and bridges; duoGame: inside a level.
  // slots are spaced from the measured art so both stay whole in frame, even in wide poses (Neel's happy, Maya's celebrate)
  duo: { pair: [820, 1270], y: 895, bw: 520, size: { neel: 540, agni: 480, maya: 550 }, faceR: { agni: true }, faceL: { maya: true } },
  duoGame: { pair: [205, 435], y: 890, bw: 400, size: { neel: 380, agni: 350, maya: 390 }, faceR: { agni: true }, faceL: { maya: true } },
};
export const host = { on: false, cur: null, spot: SPOTS.game, slot: {} };
/** switch to one-character mode on a spot (or a two-character conversation spot); the next speaker slides in */
export function solo(spot = "story") {
  host.on = true; host.spot = SPOTS[spot]; host.cur = null; host.slot = {};
  for (const k in C) if (C[k].visible) hideChar(k, 0.2);
  if (spot === "story" || spot === "duo") setFocus("story"); // the speakers stand out from a slightly soft background
  if (host.spot.pair) camRest(0.6); // a conversation is framed wide, so neither speaker is pushed off the edge
}
async function pairSwap(k) {
  const s = host.spot;
  for (const o in host.slot) if (!C[o].visible) delete host.slot[o];
  if (host.slot[k] != null) { host.cur = k; return; }
  const on = Object.keys(host.slot);
  let i = [0, 1].find((n) => !on.some((o) => host.slot[o] === n));
  if (i == null) { const out = on.find((o) => o !== host.cur) || on[0]; i = host.slot[out]; delete host.slot[out]; hideChar(out, 0.15); }
  host.slot[k] = i; host.cur = k;
  placeChar(k, s.pair[i], s.y, s.size[k], { flip: !!(i === 0 ? s.faceR : s.faceL)[k] });
  if (s === SPOTS.duo && !entered[k] && !calm) { entered[k] = true; return ENTER[k](C[k]); }
  await gsap.from(C[k].box, { x: i === 0 ? -160 : 160, opacity: 0, duration: 0.35, ease: "back.out(1.4)" });
}
export async function hostSwap(k) {
  if (host.spot.pair) return pairSwap(k);
  if (host.cur === k && C[k].visible) return;
  for (const o in C) if (o !== k && C[o].visible) hideChar(o, 0.15);
  host.cur = k;
  const s = host.spot;
  placeChar(k, s.x, s.y, s.size[k], { flip: !!(s.flip && s.flip[k]) });
  // the first time each friend appears in the story they make an entrance; after that a quick slide
  if (s === SPOTS.story && !entered[k] && !calm) { entered[k] = true; return ENTER[k](C[k]); }
  await gsap.from(C[k].box, { x: s.from, opacity: 0, duration: 0.35, ease: "back.out(1.4)" });
}

// ---------- first entrances: Agni flies in, Neel bounds in, Maya teleports in ----------
const entered = {};
function land(c, dust = true) {
  const sx = c.flip ? -1 : 1;
  if (dust) playFx("poof", c.x, c.y - 10, { palette: "stone", scale: 2.2 });
  gsap.to(c.shadow, { opacity: 1, duration: 0.2 });
  sfx("land"); shake(7);
  return gsap.fromTo(c.box, { scaleY: 0.84, scaleX: sx * 1.14 }, { scaleY: 1, scaleX: sx, duration: 0.55, ease: "elastic.out(1.1,0.45)" });
}
const ENTER = {
  // the dragon swoops down from the top-right sky in a curve, tilted into the dive, and lands
  async agni(c) {
    pose("agni", "crash_in", false);
    gsap.set(c.shadow, { opacity: 0 });
    sfx("whoosh");
    await gsap.timeline()
      .fromTo(c.box, { x: 620, y: -760, rotation: 28, opacity: 1 }, { x: -90, y: -120, rotation: -14, duration: 0.75, ease: "power2.in" })
      .to(c.box, { x: 0, y: 0, rotation: 0, duration: 0.3, ease: "power2.out" });
    await land(c);
  },
  // the yeti bounds in from the right in two big hops
  async neel(c) {
    const b = c.box;
    gsap.set(b, { x: 620, y: 0, opacity: 1 });
    gsap.set(c.shadow, { opacity: 0 });
    for (const [x, h] of [[300, 170], [0, 120]]) {
      sfx("whoosh");
      await gsap.timeline().to(b, { x, duration: 0.5, ease: "none" }, 0).to(b, { y: -h, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, 0);
      if (x) gsap.fromTo(b, { scaleY: 0.9 }, { scaleY: 1, duration: 0.18 });
    }
    await land(c);
  },
  // the witch appears in a beam of light over a magic circle: the circle draws itself, and she
  // arrives on the column of light it fires (the effect's FLASH, 1.52 s in)
  async maya(c) {
    const b = c.box, sx = c.flip ? -1 : 1;
    playFx("cast", c.x, c.y - 10, { palette: "plum", scale: 3, parent: world }); // the circle and its light stay behind her
    gsap.set(b, { opacity: 0 });
    await wait(1.45);
    sfx("magic");
    await gsap.fromTo(b, { scaleX: sx * 0.12, scaleY: 1.5, opacity: 0 }, { scaleX: sx, scaleY: 1, opacity: 1, duration: 0.55, ease: "expo.out" });
    playFx("collect", c.x, c.y - c.h * 0.8, { palette: "plum", scale: 2.4, parent: world });
  },
};
export function setFore(v, dur = 0.5) { gsap.to(layers.fore, { opacity: v, duration: dur }); }
export function setDim(v, dur = 0.8) { gsap.to("#dim", { opacity: v, duration: dur }); }

// ---------- characters (Ludo sprite sheets) ----------
import META from "./anim_meta.json";
// pose names used by the story -> sprite animation; loops keep playing, one-shots return to the base pose
const ANIM = {
  neel: { idle: "idle", talk: "talk", happy: "happy", unsure: "oops", oops: "oops", dance: "dance", dance_A: "dance", dance_B: "dance", cheer: "happy", shocked: "oops" },
  agni: { idle: "idle", talk: "talk", cheer: "cheer", happy: "cheer", shocked: "shocked", oops: "shocked", crash_in: "crash_in", dance: "dance", dance_A: "dance", dance_B: "dance" },
  maya: { idle: "idle", talk: "talk", explain: "talk", cast: "cast", happy: "happy", hint: "hint", oops: "hint", shocked: "hint", celebrate: "celebrate", cheer: "happy", dance: "celebrate" },
};
const LOOP = new Set(["idle", "talk", "dance", "oops", "hint", "celebrate"]);
export const NAMES = { neel: "Neel", agni: "Agni", maya: "Maya", nar: "" };
const TAG = { neel: "#4a8fe0", agni: "#e8742a", maya: "#2f9b62", nar: "#7a3fd1" };
export const C = {};
// where the feet are in each character's frames (measured on the idle sheets), for the contact shadow
const FEET = { neel: [0.26, 0.76], agni: [0.29, 0.55], maya: [0.36, 0.66] };
for (const k of Object.keys(ANIM)) {
  const box = el("div", "char", charsL);
  const [f0, f1] = FEET[k];
  const shadow = el("div", "cshadow", box, { left: `${(f0 - 0.06) * 100}%`, width: `${(f1 - f0 + 0.12) * 100}%` });
  C[k] = { k, box, shadow, sp: null, pose: "idle", base: "idle", anim: null, f: 0, t: 0, visible: false, loop: null, talking: false };
  gsap.set(box, { display: "none" });
}
export const ANIM_FILES = Object.keys(META);
// build every animation layer up front so all sheets are decoded before they are needed
for (const key of ANIM_FILES) { const k = key.split("_")[1]; if (C[k]) layer(C[k], key, META[key]); }
// one layer per animation so switching never shows an undecoded (blank) frame
function layer(c, key, m) {
  c.layers = c.layers || {};
  if (!c.layers[key]) {
    const d = el("div", "spr", c.box);
    const rows = Math.ceil(m.n / m.cols);
    Object.assign(d.style, { backgroundImage: `url(assets/${key}.webp)`, backgroundSize: `${m.cols * 100}% ${rows * 100}%`, opacity: 0 });
    c.layers[key] = d;
  }
  return c.layers[key];
}
function setAnim(c, a, restart = true) {
  const key = `anim_${c.k}_${a}`, m = META[key];
  if (!m) return;
  if (c.anim === key && !restart) return;
  const next = layer(c, key, m);
  c.anim = key; c.m = m; c.f = 0; c.t = 0; c.loopAnim = LOOP.has(a);
  c.sp = next;
  frame(c);
  for (const k in c.layers) c.layers[k].style.opacity = c.layers[k] === next ? 1 : 0;
}
function frame(c) {
  const m = c.m, rows = Math.ceil(m.n / m.cols), col = c.f % m.cols, row = Math.floor(c.f / m.cols);
  c.sp.style.backgroundPosition = `${(col / (m.cols - 1)) * 100}% ${(row / Math.max(1, rows - 1)) * 100}%`;
}
gsap.ticker.add((time, dms) => {
  for (const k in C) {
    const c = C[k];
    if (!c.visible || !c.m) continue;
    c.t += dms * (window.__speed || 1);
    let moved = false;
    while (c.t >= c.m.ms) {
      c.t -= c.m.ms; c.f++; moved = true;
      if (c.f >= c.m.n) {
        if (c.loopAnim) c.f = 0;
        else { c.f = c.m.n - 1; c.t = 0; const back = c.talking ? "talk" : ANIM[k][c.base] || "idle"; setAnim(c, LOOP.has(back) ? back : "idle"); c.pose = c.base; moved = false; break; }
      }
    }
    if (moved) frame(c);
  }
});
/** show pose/animation p. asBase: it becomes the resting pose after one-shots / talking. */
export function pose(k, p, asBase = true) {
  const c = C[k], a = ANIM[k][p] || "idle";
  c.pose = p;
  // a pose that plays the talking animation (Maya's "explain") is only for while she speaks: never a resting pose,
  // or the mouth keeps moving after the line has ended
  if (asBase) c.base = LOOP.has(a) && a !== "talk" ? p : "idle";
  setAnim(c, a);
}
export function placeChar(k, x, y, size, { p = "idle", flip = false, show = true } = {}) {
  const c = C[k];
  stopLoop(k);
  gsap.killTweensOf(c.box);
  const m = META[`anim_${k}_idle`], h = size * (k === "agni" ? 0.92 : 1.02), w = (h * m.w) / m.h;
  gsap.set(c.box, { display: "block", left: x - w / 2, top: y - h, width: w, height: h, scaleX: flip ? -1 : 1, opacity: 1, x: 0, y: 0, rotation: 0 });
  c.x = x; c.y = y; c.size = size; c.flip = flip; c.visible = show; c.h = h;
  c.talking = false;
  c.box.classList.remove("quiet", "speaking");
  gsap.set(c.shadow, { opacity: 1 });
  pose(k, p);
  if (!show) gsap.set(c.box, { display: "none" });
}
export function hideChar(k, dur = 0.3) {
  const c = C[k];
  stopLoop(k);
  c.visible = false;
  return gsap.to(c.box, { opacity: 0, duration: dur, onComplete: () => gsap.set(c.box, { display: "none" }) });
}
export async function enterChar(k, x, y, size, from = -300, opts = {}) {
  placeChar(k, x, y, size, opts);
  await gsap.from(C[k].box, { x: from, opacity: 0, duration: 0.55, ease: "back.out(1.4)" });
}
export function hideAllChars() { for (const k in C) { stopLoop(k); gsap.killTweensOf(C[k].box); C[k].visible = false; gsap.set(C[k].box, { display: "none" }); } }
export function stopLoop(k) { const c = C[k]; if (c.loop) { c.loop = null; pose(k, "idle"); } }
export function dance(k) { C[k].loop = true; pose(k, "dance", false); }
export function react(k, p) {
  if (!C[k].visible && host.on && host.cur) k = host.cur;
  const c = C[k];
  if (!c.visible) return;
  c.loop = null;
  pose(k, p, false);
}
function talk(k, on) {
  const c = C[k];
  if (!c || c.loop) return;
  c.talking = on;
  const cur = ANIM[k][c.pose] || "idle";
  if (on && (cur === "idle" || LOOP.has(cur) && cur !== "dance")) setAnim(c, "talk", false);
  if (!on && c.anim === `anim_${k}_talk`) pose(k, c.base);
}

// ---------- sound: recorded effects, synth for the rest, music + voice ----------
let AC = null;
// autoplay: dialogue moves on by itself at a steady reading pace (switch off in the menu for tap-to-continue)
export const settings = { voice: true, sound: true, music: true, autoplay: true };
const FILES = { tap: S_TAP, pop: S_POP, good: S_GOOD, bad: S_BAD, cheer: S_CHEER, win: S_WIN, knock: S_KNOCK, land: S_LAND, star: S_STAR };
const GAIN = { tap: 0.45, pop: 0.5, good: 0.6, bad: 0.55, cheer: 0.6, win: 0.65, knock: 0.8, land: 0.6, star: 0.4 };
const bufs = {};
function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    for (const k in FILES) fetch(FILES[k]).then((r) => r.arrayBuffer()).then((b) => AC.decodeAudioData(b)).then((buf) => (bufs[k] = buf)).catch(() => {});
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}
export function sfx(type) {
  if (!settings.sound) return;
  try {
    const a = ac(), t = a.currentTime;
    // a recorded sound once it has loaded; until then (and for whoosh, boing, magic, creak) the synth version
    if (bufs[type]) { const s = a.createBufferSource(), g = a.createGain(); s.buffer = bufs[type]; g.gain.value = GAIN[type]; s.connect(g).connect(a.destination); s.start(); return; }
    const tone = (f, d, at = 0, wave = "sine", vol = 0.18, f2) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = wave; o.frequency.setValueAtTime(f, t + at);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + d);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(vol, t + at + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
      o.connect(g).connect(a.destination); o.start(t + at); o.stop(t + at + d + 0.05);
    };
    if (type === "tap") tone(660, 0.08, 0, "triangle", 0.12);
    if (type === "pop") tone(420, 0.12, 0, "sine", 0.2, 900);
    if (type === "good") { tone(784, 0.14); tone(988, 0.14, 0.1); tone(1318, 0.3, 0.2, "triangle"); }
    if (type === "bad") { tone(220, 0.25, 0, "sawtooth", 0.08, 140); }
    if (type === "boing") tone(180, 0.3, 0, "sine", 0.22, 520);
    if (type === "whoosh") tone(300, 0.35, 0, "triangle", 0.08, 1200);
    if (type === "magic") { [880, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.25, i * 0.06, "sine", 0.09)); }
    if (type === "knock") { tone(140, 0.08, 0, "square", 0.15); tone(140, 0.08, 0.18, "square", 0.15); }
    if (type === "creak") tone(110, 0.6, 0, "sawtooth", 0.05, 70);
    if (type === "cheer" || type === "win") { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, i * 0.09, "triangle", 0.12)); }
    if (type === "land") tone(90, 0.18, 0, "sine", 0.3, 50);
    if (type === "star") tone(1568, 0.12, 0, "sine", 0.1);
    if (type === "chalk") [0, 0.07, 0.15].forEach((at) => tone(2400 + Math.random() * 600, 0.05, at, "sawtooth", 0.025, 1800));
    if (type === "owl") { tone(420, 0.32, 0, "sine", 0.13, 360); tone(400, 0.5, 0.45, "sine", 0.12, 330); } // hoo-hooo
  } catch (e) {}
}

// background music (OpenGameArt, CC0): "calm" = Mystical Town by Symphony (story, play), "magic" = Magic Town (map, party).
// Browsers only allow sound after a tap, so the wanted track starts on the first tap.
const MUSIC = { calm: { src: "assets/audio/music_calm.mp3", vol: 0.32 }, magic: { src: "assets/audio/music_magic.mp3", vol: 0.38 } };
const mus = { want: null, name: null, el: null, gain: null, unlocked: false, duck: 1 };
// over http the volume goes through Web Audio (iPads ignore element.volume); from disk the element's own volume is used
const viaGraph = /^https?:/.test(location.protocol);
function level(t) { return settings.music ? MUSIC[t.name].vol * mus.duck : 0; }
function setLevel(t, v, dur) { if (t.gain) t.gain.gain.setTargetAtTime(v, AC.currentTime, dur / 3); else gsap.to(t.el, { volume: v, duration: dur }); }
function startTrack(name) {
  const old = mus.cur;
  if (old && old.name === name) return;
  if (old) { setLevel(old, 0, 1.2); setTimeout(() => old.el.pause(), 1300); }
  const el = new Audio(MUSIC[name].src), t = { name, el, gain: null };
  el.loop = true; el.volume = viaGraph ? 1 : 0;
  if (viaGraph) { try { const a = ac(); t.gain = a.createGain(); t.gain.gain.value = 0; a.createMediaElementSource(el).connect(t.gain).connect(a.destination); } catch (e) { t.gain = null; el.volume = 0; } }
  mus.cur = t;
  el.play().then(() => setLevel(t, level(t), 2)).catch(() => {});
}
/** ask for a track; it plays (crossfading) once sound is allowed */
export function music(name) { mus.want = name; if (mus.unlocked) startTrack(name); }
export function musicRefresh() { if (mus.cur) setLevel(mus.cur, level(mus.cur), 0.5); }
function duckMusic(on) { mus.duck = on ? 0.4 : 1; musicRefresh(); }
stage.addEventListener("pointerdown", () => { if (mus.unlocked) return; mus.unlocked = true; ac(); if (mus.want) startTrack(mus.want); }, true);
const VOICE = { neel: { pitch: 0.75, rate: 0.95 }, agni: { pitch: 1.45, rate: 1.05 }, maya: { pitch: 1.2, rate: 0.95 }, nar: { pitch: 1, rate: 0.95 } };
let voices = [];
if ("speechSynthesis" in window) { const lv = () => (voices = speechSynthesis.getVoices()); lv(); speechSynthesis.onvoiceschanged = lv; }
const VO = new Set(VO_IDS);
let voEl = null, voRun = 0;
/** play a line's recorded segments one after another; resolves when done or interrupted */
async function playVo(ids) {
  const run = ++voRun;
  for (const [i, id] of ids.entries()) {
    if (run !== voRun) return;
    if (i) await wait(0.12);
    const a = (voEl = new Audio(`assets/vo/${id}.mp3`));
    await new Promise((r) => { a.onended = a.onerror = r; a.play().catch(r); });
  }
}
function speak(text, who) {
  return new Promise((res) => {
    if (!settings.voice || window.__auto) return res(false);
    // the character's own recorded voice when every part of the line has been recorded
    const ids = segments(text).map((s) => voId(who, s));
    if (ids.length && ids.every((id) => VO.has(id))) {
      hush(); duckMusic(true);
      playVo(ids).then(() => { duckMusic(false); res(true); });
      return;
    }
    if (!("speechSynthesis" in window)) return res(false);
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, "").replace(/×/g, " times ").replace(/−/g, " minus "));
    const v = voices.find((v) => /en[-_]IN/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
    if (v) u.voice = v;
    Object.assign(u, VOICE[who] || VOICE.nar);
    // the music steps back while someone is speaking
    const done = () => { duckMusic(false); res(true); };
    u.onend = u.onerror = done;
    speechSynthesis.cancel();
    duckMusic(true);
    speechSynthesis.speak(u);
    setTimeout(done, Math.max(12000, text.split(/\s+/).length * 600 + 3000));
  });
}
export function hush() {
  voRun++;
  if (voEl) { voEl.pause(); voEl = null; duckMusic(false); }
  try { speechSynthesis.cancel(); } catch (e) {}
}

// ---------- dialogue ----------
const bubble = $("#bubble");
let lastWho = null;
// The bubble sits just above the speaker's head, centred on them and kept fully on screen.
// No speaker on screen (narrator): a wide bubble at the top centre. Positions are set in px only:
// a CSS translate here would be picked up by GSAP and leak into later bubbles.
function placeBubble(c) {
  const on = c && c.visible, w = !on ? 820 : host.on ? host.spot.bw : 600;
  gsap.set(bubble, { x: 0, xPercent: 0, y: 0 });
  bubble.style.width = w + "px";
  bubble.classList.toggle("host", !!on && host.on && host.spot === SPOTS.game);
  bubble.classList.toggle("side", !!on && host.on && !!host.spot.side);
  const tail = bubble.querySelector(".tail");
  bubble._c = null;
  if (!on) { Object.assign(bubble.style, { left: (W - w) / 2 + "px", top: "40px", bottom: "auto" }); tail.style.display = "none"; return; }
  tail.style.display = "";
  bubble._c = c; bubble._w = w; bubble._h = bubble.offsetHeight;
  reflowBubble();
}
// keep the bubble above the speaker's head while the camera moves (the camera calls this every frame)
function reflowBubble() {
  const c = bubble._c, w = bubble._w;
  if (!c.visible) return;
  if (host.on && host.spot.side) {
    // to the right of the speaker's face, tail pointing back at them
    const a = camPt(c.x + c.h * 0.3, c.y - c.h * 0.74);
    bubble.style.left = Math.max(24, Math.min(W - 24 - w, a.x)) + "px";
    bubble.style.top = Math.max(host.spot.btop || 84, Math.min(H - 16 - bubble._h, a.y - 34)) + "px"; bubble.style.bottom = "auto";
    return;
  }
  const head = camPt(c.x, c.y - c.h * 0.88), foot = camPt(c.x, 0);
  const left = Math.max(24, Math.min(W - 24 - w, foot.x - w / 2)), top = Math.max(84, head.y - 30 - bubble._h);
  bubble.style.left = left + "px"; bubble.style.top = top + "px"; bubble.style.bottom = "auto";
  bubble.querySelector(".tail").style.left = Math.max(30, Math.min(w - 62, foot.x - left - 16)) + "px";
}
// A tap on a control that isn't listening yet (a hint or question is still being read) ends the line,
// then reaches the control as soon as it listens, so a quick player is never ignored.
let cutLine = null;
const listening = (t) => { for (let n = t; n && n !== stage; n = n.parentElement) if (n.onpointerdown || n.dataset.tap) return n; return null; };
stage.addEventListener("pointerdown", (e) => {
  const t = e.target;
  if (!cutLine || !e.isTrusted || t.closest("#bubble, #hud, .menu, .qapanel") || listening(t)) return;
  if (getComputedStyle(t).cursor !== "pointer") return;
  cutLine();
  const end = performance.now() + 6000;
  const retry = () => {
    if (!t.isConnected || performance.now() > end) return;
    const n = listening(t);
    if (n && !n.disabled && getComputedStyle(n).pointerEvents !== "none") t.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    else setTimeout(retry, 100);
  };
  setTimeout(retry, 200);
}, true);
/** voice: false shows the line without reading it aloud (a prompt that stays up) */
export async function say(who, text, { p, wait: needTap = true, auto = 0, voice: aloud = true } = {}) {
  if (host.on && C[who] && host.cur !== who) await hostSwap(who);
  const c = C[who];
  // the speaker is lit, everyone else on stage steps back a little
  for (const k in C) { C[k].box.classList.remove("speaking"); C[k].box.classList.toggle("quiet", !!(c && c.visible) && (!host.on || !!host.spot.pair) && k !== who && C[k].visible); }
  if (c && p) pose(who, p);
  bubble.className = "";
  bubble.innerHTML = (NAMES[who] ? `<div class="who" style="background:${TAG[who]}">${NAMES[who]}</div>` : "") + `<div class="txt">${wordify(chipify(text))}</div>` + `<div class="tail"></div>` + (needTap ? (settings.autoplay ? `<div class="prog"><i></i></div>` : `<div class="nx">tap ▶</div>`) : "") + `<div class="rp" title="Hear again">🔊</div>`;
  placeBubble(c);
  // a new speaker gives a small hop (squash and stretch from the feet)
  if (c && c.visible && who !== lastWho && !calm) { const sx = c.flip ? -1 : 1; gsap.fromTo(c.box, { scaleY: 0.93, scaleX: sx * 1.05 }, { scaleY: 1, scaleX: sx, duration: 0.45, ease: "back.out(3)" }); }
  // story camera: push in slowly about the speaker's head for the length of the line; a new speaker also gets a dolly
  const words = text.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length, readFor = Math.max(2.8, words / 2.6 + 1.2);
  if (host.on && host.spot === SPOTS.story) {
    if (c && c.visible) camTo({ x: c.x, y: c.y - c.h * 0.8, s: 1.045, dur: readFor, ease: "sine.inOut", from: who !== lastWho ? { tx: -26 } : undefined });
    else camRest(1);
  }
  lastWho = who;
  bubble.querySelector(".rp").onpointerdown = (e) => { e.stopPropagation(); sfx("tap"); speak(text, who); };
  gsap.fromTo(bubble, { opacity: 0, y: 14, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "back.out(2)" });
  let voice = Promise.resolve(false);
  const wordEls = bubble.querySelectorAll(".w");
  const reveal = gsap.fromTo(wordEls, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.18, stagger: Math.min(0.09, 2.2 / Math.max(1, wordEls.length)), ease: "power1.out" });
  if (c && c.visible) {
    c.box.classList.add("speaking");
    talk(who, true);
    const stopTalk = () => talk(who, false);
    voice = aloud ? speak(text, who) : Promise.resolve(false);
    voice.then((ok) => { if (!ok) setTimeout(stopTalk, Math.min(2600, 600 + text.length * 38)); else stopTalk(); });
    bubble._stop = stopTalk;
  } else voice = aloud ? speak(text, who) : Promise.resolve(false);
  let cut = null;
  const cutP = new Promise((r) => (cut = cutLine = r));
  if (window.__auto) { reveal.progress(1); await wait(0.35); }
  else if (needTap && settings.autoplay) {
    // steady pace: the line stays until the words have appeared, the voice has finished and there was
    // time to read it (about 2.6 words a second, plus a moment), then a short breath before the next line
    const read = readFor;
    gsap.fromTo(bubble.querySelector(".prog i"), { scaleX: 0 }, { scaleX: 1, duration: read, ease: "none" });
    await Promise.race([Promise.all([reveal, wait(read), voice]).then(() => wait(0.45)), cutP]);
  }
  else if (needTap) await Promise.race([(async () => { while (reveal.progress() < 1) { await Promise.race([tapAnywhere(0.15), new Promise((r) => reveal.eventCallback("onComplete", r))]); reveal.progress(1); } await tapAnywhere(0.2); })(), cutP]);
  else if (auto) await wait(auto);
  if (cutLine === cut) cutLine = null;
  bubble._stop && bubble._stop();
  bubble._stop = null;
  if (needTap) hush();
  if (c) c.box.classList.remove("speaking");
  if (needTap || auto) await gsap.to(bubble, { opacity: 0, duration: 0.15 });
}
// word-by-word reveal and colour chips for maths words
function chipify(t) {
  return t.split(/(<[^>]+>)/).map((p, i, arr) => {
    if (p.startsWith("<")) return p;
    const prev = arr.slice(0, i).join("");
    if (/class=(v|"lm"|"ld")[^>]*>$/.test(prev)) return p;
    return p.replace(/(^|[\s(\d])([md])(?=[\s.,!?)]|$)/g, (_, a, l) => `${a}<span class="${l === "m" ? "cm" : "cd"}">${l}</span>`);
  }).join("");
}
/** colour a lone m / d (or 3m, 2d) purple / orange in plain card text */
export function colorMD(t) {
  return t.split(/(<[^>]+>)/).map((p) => (p.startsWith("<") ? p : p.replace(/(^|[\s(\d])([md])(?=[\s.,!?)]|$)/g, (_, a, l) => `${a}<span class="${l === "m" ? "mtxt" : "dtxt"}">${l}</span>`))).join("");
}
function wordify(h) {
  return h.split(/(<[^>]+>)/).map((p) => (p.startsWith("<") ? p : p.replace(/(\S+)/g, '<span class="w">$1</span>'))).join("");
}
export function closeBubble() { bubble._c = null; gsap.to(bubble, { opacity: 0, duration: 0.15 }); lastWho = null; for (const k in C) C[k].box.classList.remove("speaking", "quiet"); }
export function tapAnywhere(delay = 0) {
  return new Promise((res) => {
    setTimeout(() => {
      const h = (e) => { stage.removeEventListener("pointerdown", h, true); sfx("tap"); res(); };
      stage.addEventListener("pointerdown", h, true);
    }, delay * 1000);
  });
}
export function onTap(node, fn) { node.dataset.tap = 1; node.addEventListener("pointerdown", (e) => { e.stopPropagation(); fn(e); }); }

// ---------- misc UI ----------
/** top: optional centre line in px (default 44% of the stage) */
export async function popup(html, dur = 1.6, top) {
  const p = el("div", "popup", ui, top ? { top } : {}, html);
  gsap.from(p, { scale: 0.5, opacity: 0, duration: 0.35, ease: "back.out(2)" });
  await wait(dur);
  await gsap.to(p, { opacity: 0, y: -30, duration: 0.3 });
  p.remove();
}
// part title card: the ribbon unrolls, the letters drop in one by one, a gold line draws itself underneath
export async function partTitle(k, t) {
  const letters = [...t].map((ch) => `<span class="ch">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
  const d = el("div", "partTitle", ui, {}, `<div class="k">${k}</div><div class="t">${letters}</div><svg class="ul" viewBox="0 0 600 40" width="600" height="40"><path d="M14 26Q150 6 300 22T586 16" pathLength="1"/></svg>`);
  sfx("magic");
  playFx("firework", W / 2, 330, { scale: 3 });
  await gsap.timeline()
    .from(d.querySelector(".k"), { scaleX: 0, duration: 0.45, ease: "back.out(1.6)" })
    .from(d.querySelectorAll(".ch"), { y: -70, opacity: 0, rotation: () => gsap.utils.random(-25, 25), duration: 0.5, stagger: 0.045, ease: "back.out(2.2)" }, 0.2)
    .fromTo(d.querySelector(".ul path"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, "-=0.25");
  await wait(1.2);
  await gsap.to(d, { opacity: 0, scale: 1.15, duration: 0.4 });
  d.remove();
}
export function card(html, style, cls = "card pill") {
  const c = el("div", cls, ui, style, html);
  gsap.from(c, { y: -40, opacity: 0, duration: 0.45, ease: "back.out(1.6)" });
  return c;
}
export function button(label, x, y, parent = ui) {
  const b = el("button", "btn", parent, { left: x, top: y }, label);
  b.style.translate = "-50% -50%";
  return b;
}
export function waitClick(node) { return new Promise((res) => onTap(node, () => { sfx("tap"); res(); })); }
export async function pointHand(x, y, dur = 2.4) {
  const h = img("ui_hint_hand", ui, { left: x, top: y, width: 110 }, "hand");
  gsap.fromTo(h, { x: 40, y: 40, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.4 });
  gsap.to(h, { scale: 0.88, duration: 0.35, yoyo: true, repeat: -1, delay: 0.4, transformOrigin: "10% 10%" });
  if (dur) { await wait(dur); gsap.to(h, { opacity: 0, duration: 0.3, onComplete: () => h.remove() }); }
  return h;
}

// ---------- checklist ----------
const check = $("#check");
export function checklist(icons) {
  check.innerHTML = "";
  icons.forEach((n) => { const s = el("div", "slot", check); img(n, s, {}, ""); });
  gsap.to(check, { opacity: 1, duration: 0.4 });
}
export function checkCur(i) { [...check.children].forEach((s, j) => s.classList.toggle("cur", j === i)); }
export function checkDone(i) {
  const s = check.children[i];
  if (!s) return;
  s.classList.add("done"); s.classList.remove("cur");
  gsap.fromTo(s, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
}
export function hideChecklist() { gsap.to(check, { opacity: 0, duration: 0.3 }); }

export { playFx };

// ---------- stars, Party Meter, action zone, menu ----------
export const score = { stars: 0, max: 75, room: {} };
const hud = el("div", "", stage); hud.id = "hud";
hud.innerHTML = `<div class="starpill"><span class="st">★</span><span id="scount">0</span></div><div class="meter"><div class="lbl2">Party</div><div class="bar"><i id="mfill"></i></div></div>`;
const scount = hud.querySelector("#scount"), mfill = hud.querySelector("#mfill");
export function showHud(on = true, full = false) { hud.classList.toggle("full", full); gsap.to(hud, { opacity: on ? 1 : 0, duration: 0.3 }); }
gsap.set(hud, { opacity: 0 });
function refreshHud() {
  const o = { v: +scount.textContent };
  gsap.to(o, { v: score.stars, duration: 0.6, onUpdate: () => (scount.textContent = Math.round(o.v)) });
  gsap.to(mfill, { width: Math.min(100, (score.stars / score.max) * 100) + "%", duration: 0.8, ease: "power2.out" });
  gsap.fromTo(hud, { scale: 1.08 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
}
/** tries = wrong attempts before success. 0 -> 3 stars, 1 -> 2, else 1. */
export async function award(tries, x = W / 2, y = 420, room = "x") {
  const n = tries === 0 ? 3 : tries === 1 ? 2 : 1;
  score.room[room] = (score.room[room] || 0) + n;
  const tgt = { x: 1600 - 18 - hud.offsetWidth + 34, y: 44 };
  // a perfect answer gets a gold sunburst behind the stars
  if (n === 3) { const rays = playFx("sunburst", x, y - 5, { palette: "gold", scale: 2, parent: ui }); if (rays.el) ui.insertBefore(rays.el, ui.firstChild); setTimeout(() => rays.stop(), 1300); }
  punch(x, y, n === 3 ? 1.06 : 1.03);
  camRest(1.2);
  const row = el("div", "starburst", ui, { left: x - 90, top: y - 40 }, "");
  for (let i = 0; i < 3; i++) el("span", i < n ? "on" : "off", row, {}, "★");
  gsap.from(row.children, { scale: 0, rotation: -90, duration: 0.4, stagger: 0.12, ease: "back.out(3)" });
  sfx("magic");
  await wait(0.5);
  [...row.children].slice(0, n).forEach((s, i) => {
    const r = s.getBoundingClientRect(), p = toStage({ clientX: r.left, clientY: r.top });
    const f = el("div", "starfly", ui, { left: p.x, top: p.y }, "★");
    s.style.visibility = "hidden";
    gsap.to(f, { left: tgt.x, top: tgt.y - 20, scale: 0.6, duration: 0.5, delay: i * 0.08, ease: "power2.in", onComplete: () => {
      f.remove(); score.stars++; refreshHud(); sfx("star");
      if (i === n - 1) playFx("collect", tgt.x + 4, tgt.y + 6, { palette: "gold", scale: 1.6, parent: ui }); // glitter as the last star lands
    } });
  });
  gsap.to(row, { opacity: 0, duration: 0.3, delay: 0.9, onComplete: () => row.remove() });
  return n;
}
/** tip: short instruction shown on a tab at the top of the zone (undefined keeps the current one); low: the shorter zone of the table scenes */
export function actionZone(on = true, tip, low) {
  let z = document.getElementById("azone");
  if (!z) { z = el("div", "", null); z.id = "azone"; el("div", "aztip", z); }
  if (!z.isConnected) ui.insertBefore(z, ui.firstChild);
  if (on) z.classList.toggle("low", !!low);
  gsap.to(z, { opacity: on ? 1 : 0, duration: 0.4 });
  if (tip !== undefined) azTip(tip);
  return z;
}
export function azTip(t) {
  const e = document.querySelector("#azone .aztip");
  if (!e || e.innerHTML === t) return;
  e.innerHTML = t || "";
  if (t) gsap.fromTo(e, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
}
// guests stand in two groups (monsters | dragons) with a coloured rug under each group, so they are easy to count
export function crowd(list, { cx = 650, top = 720, size = 120, maxW = 520 } = {}) {
  const ms = list.filter((g) => g.dataset.k === "m"), ds = list.filter((g) => g.dataset.k === "d");
  const order = [...ms, ...ds], gapU = ms.length && ds.length ? 0.9 : 0;
  const U = Math.max(1, order.length - 1 + gapU), step = Math.min(size * 0.78, maxW / U);
  const xs = order.map((g, i) => cx - (U * step) / 2 + (i + (i >= ms.length ? gapU : 0)) * step);
  order.forEach((g, i) => {
    const back = i % 2 === 1, sz = back ? size * 0.86 : size;
    g.classList.toggle("back", back);
    g.style.zIndex = back ? 2 : 3;
    gsap.to(g, { left: xs[i] - sz / 2, top: top + (back ? -16 : 0) + (size - sz), width: sz, height: sz, x: 0, duration: 0.4 });
  });
  for (const [k, grp, from] of [["m", ms, 0], ["d", ds, ms.length]]) {
    let r = world.querySelector(".rug." + k);
    if (!grp.length) { r && r.remove(); continue; }
    const a = xs[from] - size * 0.42, b = xs[from + grp.length - 1] + size * 0.42, y = top + size - 14;
    if (!r) { r = el("div", "rug " + k, null); world.insertBefore(r, world.querySelector("img[data-k]")); gsap.set(r, { left: a, width: b - a, top: y }); }
    gsap.to(r, { left: a, width: b - a, top: y, opacity: 1, duration: 0.4 });
  }
}
// the party table is the stage for Parts 3 and the finale: big, centred in the open floor
export const TABLE = { cx: 700, top: 380, w: 820 };
export const TABLE_POP = 300; // success messages sit between the question card and the tabletop
/** where n items sit on the tabletop: one row, or two (the back row slightly smaller), each on the real surface */
export function onTable(n, { cx, top, w } = TABLE) {
  // measured on pr_party_table (1000 x 282): the flat top is a thin band, back edge y 4 (690 wide), front edge y 62 (900 wide)
  const k = w / 1000, widthAt = (y) => (690 + ((y - 4) / 58) * 210) * k * 0.9;
  const rows = n <= 12 ? [{ y: 40, c: n }] : (() => { const back = Math.round(n * 0.44); return [{ y: 22, c: back }, { y: 56, c: n - back }]; })();
  const sz = Math.min(64, ...rows.map((r) => widthAt(r.y) / r.c));
  const out = [];
  for (const r of rows) {
    const s = sz * (r.y < 30 ? 0.92 : 1), step = widthAt(r.y) / Math.max(r.c, widthAt(r.y) / (s * 1.05)), base = top + r.y * k;
    for (let i = 0; i < r.c; i++) out.push({ x: cx - ((r.c - 1) * step) / 2 + i * step - s / 2, y: base - s * 0.9, sz: s });
  }
  return out;
}
/** guests stand on both sides of the table: monsters left and dragons right (only monsters: split between the sides),
 *  in two rows when a side has more than 4, with a coloured rug under each group */
// feet: where the front row stands. In the Magic Doors hall the floor starts at y 570 (the wall base) and the
// table legs stand at 600, so the guests stand at 620: on the floor, just in front of the table
export function flank(list, { cx = 800, gap = 362, feet = 622, size = 126, sideW = 300 } = {}) {
  const top = feet - size;
  const ms = list.filter((g) => g.dataset.k === "m"), ds = list.filter((g) => g.dataset.k === "d");
  const half = Math.ceil(ms.length / 2), L = ds.length ? ms : ms.slice(0, half), R = ds.length ? ds : ms.slice(half);
  world.querySelectorAll(".rug").forEach((r) => r.remove());
  for (const [grp, gx] of [[L, cx - gap - sideW / 2], [R, cx + gap + sideW / 2]]) {
    if (!grp.length) continue;
    const front = grp.length > 4 ? grp.slice(0, Math.ceil(grp.length / 2)) : grp, back = grp.slice(front.length);
    const place = (row, y, sz, off, isBack) => {
      const step = Math.min(sz * 0.92, sideW / Math.max(1, row.length));
      row.forEach((g, i) => {
        g.classList.toggle("back", isBack); g.style.zIndex = isBack ? 2 : 3;
        gsap.to(g, { left: gx - ((row.length - 1) * step) / 2 + i * step + off - sz / 2, top: y, width: sz, height: sz, x: 0, duration: 0.45 });
      });
    };
    place(back, feet - 30 - size * 0.84, size * 0.84, size * 0.32, true); // a step further back, on the floor too
    place(front, top, size, 0, false);
    const r = el("div", "rug ground " + grp[0].dataset.k, null); // a dark contact shadow with a coloured rim
    world.insertBefore(r, world.querySelector("img[data-k]"));
    gsap.set(r, { left: gx - sideW / 2 - 24, width: sideW + 48, top: feet - 26, opacity: 1 });
  }
}
export function clearCrowd() { world.querySelectorAll(".rug").forEach((r) => r.remove()); }
// menu (voice / sound)
const mb = el("div", "icon", stage, { left: 16, top: 14, position: "absolute", zIndex: 70 }, "☰");
let menu = null;
mb.onpointerdown = (e) => {
  e.stopPropagation(); sfx("tap");
  if (menu) { menu.remove(); menu = null; return; }
  menu = el("div", "menu", stage, {}, "");
  const row = (label, key) => {
    const b = el("div", "mrow", menu, {}, `${label}<span>${settings[key] ? "On" : "Off"}</span>`);
    b.onpointerdown = (ev) => { ev.stopPropagation(); settings[key] = !settings[key]; b.lastChild.textContent = settings[key] ? "On" : "Off"; if (!settings.voice) hush(); musicRefresh(); };
  };
  row("Voice", "voice"); row("Music", "music"); row("Sounds", "sound"); row("Auto-play", "autoplay");
  const c = el("div", "mrow close", menu, {}, "Close");
  c.onpointerdown = (ev) => { ev.stopPropagation(); menu.remove(); menu = null; };
};
export function showMenu(on) { gsap.to(mb, { opacity: on ? 1 : 0, duration: 0.3 }); mb.style.pointerEvents = on ? "auto" : "none"; }

// ---------- one question card: title + question line + plan + values ----------
export function qbox() {
  // three rows at most: title + values, the plan, one short line (instruction or question)
  const box = el("div", "qbox", ui);
  const head = el("div", "qhead", box);
  const title = el("div", "qt", head);
  const vals = el("div", "qvals", head);
  const plan = el("div", "spellbar qplan", box);
  const sub = el("div", "qs", box);
  gsap.set(box, { opacity: 0 });
  const setSub = (s = "") => { sub.innerHTML = colorMD(s); if (s) gsap.fromTo(sub, { opacity: 0 }, { opacity: 1, duration: 0.3 }); };
  return { box, title, plan, vals, sub: setSub, show(t, s) { title.innerHTML = t; setSub(s); gsap.to(box, { opacity: 1, duration: 0.3 }); gsap.fromTo(title, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }); } };
}
/** uses: the letters the current plan needs ("m", "d", "md"); a value the question does not use is left out */
export function valPills(box, v, uses = "md") {
  box.innerHTML = "";
  if (v.m && uses.includes("m")) el("span", "vpill m", box, {}, `m = <b>${v.m}</b>`);
  if (v.d && uses.includes("d")) el("span", "vpill d", box, {}, `d = <b>${v.d}</b>`);
}
// soft CSS confetti (no pixel blocks over the painted art)
export function confetti(n = 60) {
  const cols = ["#ffc547", "#3fb8af", "#c684ff", "#ff8a3d", "#ff6b7d", "#9ff0e6"];
  for (let i = 0; i < n; i++) {
    const p = el("div", "conf", fxl, { left: Math.random() * W, top: -30, background: cols[i % cols.length], width: 10 + Math.random() * 8, height: 16 + Math.random() * 10 });
    gsap.to(p, { top: H + 40, x: (Math.random() - 0.5) * 300, rotation: Math.random() * 720, duration: 2.6 + Math.random() * 2, delay: Math.random() * 1.2, ease: "power1.in", onComplete: () => p.remove() });
  }
}
