// Painted-light effects: soft glows, sparks, twinkles, and smoke and dust lit from above, drawn at full resolution
// so they sit inside the painted scenes. playFx(name, x, y, {palette, scale, parent, z, dur}): x, y is the effect's
// origin in its layer (the floor for things that stand on it), scale 3 is the normal size.
// One requestAnimationFrame loop runs every effect; an effect whose layer has been cleared stops by itself.
// Turning, pulsing pieces (rays, rune circle, portal swirl) are drawn once and moved with GPU transforms.
import { gsap } from "gsap";

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const PALS = {
  gold: { hot: "#fff6d2", main: "#ffc94a", deep: "#d8730f", smoke: "#5e4630" },
  stone: { hot: "#f4eee8", main: "#d2c8d8", deep: "#5e5470", smoke: "#b6a9c0" },
  teal: { hot: "#e6fffb", main: "#62e3d6", deep: "#16857f", smoke: "#2f5f68" },
  plum: { hot: "#f6e6ff", main: "#c684ff", deep: "#6b2cc0", smoke: "#6e4c92" },
  ember: { hot: "#fff0dc", main: "#ff9a4a", deep: "#cf4a10", smoke: "#5a3226" }, // d is orange
  white: { hot: "#ffffff", main: "#fff1b0", deep: "#ffb84a", smoke: "#8a8098" },
};
const BURST = ["#ffd35a", "#ff6fa8", "#62e3d6", "#ffe9a8", "#ff9a4a", "#9be86a"]; // bright on the purple night

// ---------- textures, drawn once and cached ----------
const TEX = new Map();
function tex(key, size, draw) {
  let c = TEX.get(key);
  if (!c) { c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size); TEX.set(key, c); }
  return c;
}
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function radial(g, s, stops) {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [o, c] of stops) r.addColorStop(o, c);
  g.fillStyle = r; g.fillRect(0, 0, s, s);
}
// a soft light: white-hot centre, coloured halo
const glow = (c) => tex("g" + c, 128, (g, s) => radial(g, s, [[0, "#fff"], [0.14, rgba(c, 1)], [0.4, rgba(c, 0.5)], [0.7, rgba(c, 0.14)], [1, rgba(c, 0)]]));
// coloured light with no white centre (flames, big soft glows)
const soft = (c) => tex("f" + c, 128, (g, s) => radial(g, s, [[0, rgba(c, 1)], [0.4, rgba(c, 0.55)], [0.75, rgba(c, 0.14)], [1, rgba(c, 0)]]));
// a glowing point for sparks and embers
const dot = (c) => tex("d" + c, 64, (g, s) => radial(g, s, [[0, "#fff"], [0.3, rgba(c, 1)], [0.55, rgba(c, 0.4)], [1, rgba(c, 0)]]));
// a solid soft-edged speck (grit, not light)
const blob = (c) => tex("b" + c, 32, (g, s) => radial(g, s, [[0, rgba(c, 1)], [0.5, rgba(c, 0.9)], [1, rgba(c, 0)]]));
// a four-point twinkle with a coloured halo
const star = (c) => tex("s" + c, 96, (g, s) => {
  radial(g, s, [[0, rgba(c, 0.55)], [0.25, rgba(c, 0.2)], [0.5, rgba(c, 0)]]);
  g.translate(s / 2, s / 2);
  for (const [a, len, w] of [[0, 1, 0.075], [Math.PI / 2, 1, 0.075], [Math.PI / 4, 0.5, 0.06], [-Math.PI / 4, 0.5, 0.06]]) {
    g.save(); g.rotate(a); g.scale(1, w);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, (s / 2) * len);
    r.addColorStop(0, "#fff"); r.addColorStop(0.35, rgba(c, 0.9)); r.addColorStop(1, rgba(c, 0));
    g.fillStyle = r; g.beginPath(); g.arc(0, 0, (s / 2) * len, 0, TAU); g.fill(); g.restore();
  }
});
// a seeded random, so each smoke puff variant always has the same shape
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
const mix = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), c = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
// a puff of smoke or dust: a cluster of rounded lumps, each lit from the top left and shaded underneath
const puff = (c, v = 0) => tex("p" + c + v, 128, (g, s) => {
  const r = rng(7 + v * 101), lit = mix(c, "#ffffff", 0.42), dark = mix(c, "#000000", 0.38), lumps = [];
  for (let i = 0; i < 7; i++) { const a = r() * TAU, d = r() * s * 0.15; lumps.push([s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d * 0.75 + s * 0.04, s * (0.17 + r() * 0.13)]); }
  lumps.sort((p, q) => q[1] - p[1]); // the lower lumps first, the upper ones over them
  for (const [x, y, rad] of lumps) {
    const gr = g.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.1, x, y, rad);
    gr.addColorStop(0, rgba(lit, 0.9)); gr.addColorStop(0.42, rgba(c, 0.85)); gr.addColorStop(0.72, rgba(mix(c, dark, 0.5), 0.55)); gr.addColorStop(1, rgba(dark, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
  }
});
// a column of light: bright in the middle, soft at the sides, fading upwards
const column = (c, h) => tex("c" + c + h, 128, (g, s) => {
  const x = g.createLinearGradient(0, 0, s, 0);
  x.addColorStop(0, rgba(c, 0)); x.addColorStop(0.22, rgba(c, 0.4)); x.addColorStop(0.4, rgba(h, 0.85)); x.addColorStop(0.5, rgba(h, 1)); x.addColorStop(0.6, rgba(h, 0.85)); x.addColorStop(0.78, rgba(c, 0.4)); x.addColorStop(1, rgba(c, 0));
  g.fillStyle = x; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = "destination-in";
  const y = g.createLinearGradient(0, 0, 0, s);
  y.addColorStop(0, "rgba(0,0,0,0)"); y.addColorStop(0.55, "rgba(0,0,0,.75)"); y.addColorStop(1, "#000");
  g.fillStyle = y; g.fillRect(0, 0, s, s);
});
// light rays from a centre, soft-edged (each ray is three passes, wide and faint to narrow and bright)
const rays = (P, n, w, v) => tex("r" + P.main + n + v, 512, (g, s) => {
  const r = rng(3 + v), c = s / 2;
  g.globalCompositeOperation = "lighter";
  const gr = g.createRadialGradient(c, c, 0, c, c, c);
  gr.addColorStop(0, rgba(P.hot, 0.9)); gr.addColorStop(0.14, rgba(P.main, 0.5)); gr.addColorStop(0.55, rgba(P.main, 0.14)); gr.addColorStop(1, rgba(P.main, 0));
  g.fillStyle = gr;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.2, ww = w * (0.6 + r() * 0.8), len = c * (0.75 + r() * 0.25);
    for (const [k, al] of [[1.7, 0.18], [1, 0.3], [0.45, 0.5]]) {
      g.globalAlpha = al; g.beginPath(); g.moveTo(c, c); g.arc(c, c, len, a - ww * k, a + ww * k); g.closePath(); g.fill();
    }
  }
});
// rune marks: a few strokes each, the same every time
const GLYPHS = (() => { const r = rng(42), out = []; for (let i = 0; i < 18; i++) { const n = 2 + ((r() * 2) | 0), s = []; for (let j = 0; j < n; j++) s.push([r() - 0.5, r() * 1.4 - 0.7, r() - 0.5, r() * 1.4 - 0.7]); out.push(s); } return out; })();
function circleArt(g, R, P, w, glyphs = true, k = 1) {
  const line = (lw, path) => {
    g.lineWidth = lw * 3.2; g.strokeStyle = rgba(P.main, 0.22); path(); g.stroke();
    g.lineWidth = lw; g.strokeStyle = rgba(P.hot, 0.95); g.stroke();
  };
  line(w * 1.6, () => { g.beginPath(); g.arc(0, 0, R, 0, TAU); });
  line(w, () => { g.beginPath(); g.arc(0, 0, R * 0.82, 0, TAU); });
  line(w * 0.9, () => { g.beginPath(); for (let t = 0; t < 2; t++) for (let i = 0; i <= 3; i++) { const a = (i / 3) * TAU + t * Math.PI - Math.PI / 2; const fn = i ? "lineTo" : "moveTo"; g[fn](Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); } });
  line(w * 0.8, () => { g.beginPath(); g.arc(0, 0, R * 0.4, 0, TAU); });
  if (!glyphs) return;
  const gs = R * 0.11;
  GLYPHS.forEach((st, i) => {
    const a = (i / GLYPHS.length) * TAU;
    g.save(); g.rotate(a); g.translate(R * 0.91, 0); g.rotate(Math.PI / 2);
    line(w * 0.7 * k, () => { g.beginPath(); for (const [x1, y1, x2, y2] of st) { g.moveTo(x1 * gs, y1 * gs); g.lineTo(x2 * gs, y2 * gs); } });
    g.restore();
  });
}
const runeDisc = (P) => tex("u" + P.main, 768, (g, s) => { g.translate(s / 2, s / 2); g.globalCompositeOperation = "lighter"; circleArt(g, s * 0.45, P, 5); });
// a vortex: three spiral arms of light around a bright eye
const swirl = (P) => tex("w" + P.main, 384, (g, s) => {
  const c = s / 2;
  g.globalCompositeOperation = "lighter";
  for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 90; i++) {
    const u = i / 90, a = (arm / 3) * TAU + u * 2.6 * Math.PI, r = u * c * 0.95, rad = 3 + u * 22;
    g.globalAlpha = 0.3 * (1 - u * 0.7);
    g.drawImage(glow(i % 3 ? P.main : P.hot), c + Math.cos(a) * r - rad, c + Math.sin(a) * r - rad, rad * 2, rad * 2);
  }
  g.globalAlpha = 1;
  g.drawImage(glow(P.hot), c - c * 0.35, c - c * 0.35, c * 0.7, c * 0.7);
});
// the hearth fire's logs on a bed of coals (the painted hearth is empty)
const logs = () => tex("logs", 512, (g, s) => {
  const k = s / 340;
  g.scale(k, k);
  const coal = (x, y, r) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "#ffcf6a"); gr.addColorStop(0.35, "#ff7a22"); gr.addColorStop(0.7, "#8a2408"); gr.addColorStop(1, "rgba(60,16,6,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  // the ash bed and its glowing coals
  g.fillStyle = "rgba(30,14,10,.85)"; g.beginPath(); g.ellipse(170, 252, 120, 16, 0, 0, TAU); g.fill();
  const r = rng(11);
  for (let i = 0; i < 16; i++) coal(80 + r() * 180, 240 + r() * 14, 7 + r() * 10);
  const log = (x, y, len, th, a, end) => {
    g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, -th / 2, 0, th / 2);
    gr.addColorStop(0, "#a86a3c"); gr.addColorStop(0.25, "#6e4022"); gr.addColorStop(0.7, "#3a1f10"); gr.addColorStop(1, "#1a0c06");
    g.fillStyle = gr; g.beginPath(); g.roundRect(-len / 2, -th / 2, len, th, th / 2); g.fill();
    g.strokeStyle = "rgba(20,8,4,.55)"; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const yy = -th / 2 + th * (0.25 + i * 0.17); g.beginPath(); g.moveTo(-len / 2 + 12 + r() * 20, yy); g.lineTo(len / 2 - 14 - r() * 20, yy + (r() - 0.5) * 4); g.stroke(); }
    // char and glowing cracks on the underside, nearest the fire
    g.strokeStyle = "rgba(255,120,40,.85)"; g.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { const xx = -len * 0.25 + r() * len * 0.5; g.beginPath(); g.moveTo(xx, th * 0.3); g.lineTo(xx + 8 + r() * 10, th * 0.12); g.lineTo(xx + 14 + r() * 8, th * 0.32); g.stroke(); }
    // the cut end: rings of wood, lit orange at the edge
    const ex = end * (len / 2 - 3), er = th / 2;
    const eg = g.createRadialGradient(ex, 0, 0, ex, 0, er);
    eg.addColorStop(0, "#c08a56"); eg.addColorStop(0.55, "#8a5530"); eg.addColorStop(0.85, "#ff8a3a"); eg.addColorStop(1, "#5a2410");
    g.fillStyle = eg; g.beginPath(); g.ellipse(ex, 0, er * 0.42, er, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(70,35,15,.6)"; g.lineWidth = 1; g.beginPath(); g.ellipse(ex, 0, er * 0.22, er * 0.55, 0, 0, TAU); g.stroke();
    g.restore();
  };
  log(120, 222, 190, 34, 0.32, -1);
  log(222, 222, 190, 34, -0.32, 1);
  log(172, 240, 210, 30, 0.04, 1);
});

// ---------- particles ----------
function part(o) {
  return Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 1, t: 0, delay: 0, s0: 20, s1: 20, a: 1, fin: 0.1, fo: 1, rot: 0, vr: 0, add: true, str: 0, sy: 1, tw: 0, ck: 0, wob: 0, wf: 0, ph: Math.random() * TAU, grow: 0, tail: 0, tr: 0, hold: 0 }, o);
}
function step(p, dt) {
  if (p.delay > 0) { p.delay -= dt; return true; }
  p.t += dt;
  if (p.t >= p.life) return false;
  if (p.orb) { const o = p.orb; o.a += o.w * dt; o.r = Math.max(0, o.r + o.dr * dt); p.x = o.cx + Math.cos(o.a) * o.r; p.y = o.cy + Math.sin(o.a) * o.r * o.sy; return true; }
  if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
  p.vy += p.g * dt;
  p.x += p.vx * dt; p.y += p.vy * dt;
  if (p.wob) p.x += Math.sin(p.ph + p.t * p.wf) * p.wob * dt;
  p.rot += p.vr * dt;
  return true;
}

// ---------- one effect ----------
class Fx {
  constructor(root, k, P) { this.root = root; this.k = k; this.P = P; this.parts = []; this.layers = []; this.emits = []; this.sprites = []; this.t = 0; this.end = 1; this.tail = 0.6; this.stopping = false; this.fade = 1; }
  add(o) { const p = part(o); this.parts.push(p); return p; }
  /** run fn(n) for each particle due, perSec per second between t0 and t1, while the effect has not been stopped */
  rate(perSec, t0, t1, fn) { let acc = 0; this.emits.push((dt, t) => { if (this.stopping || t < t0 || t > t1) return; acc += perSec * dt; while (acc >= 1) { acc--; fn(); } }); }
  /** an expanding ring of light (sy < 1 lies it on the floor) */
  ring(x, y, r0, r1, dur, w, col, sy = 1, t0 = 0, a = 1) {
    this.layers.push((g, t) => {
      const u = (t - t0) / dur;
      if (u < 0 || u > 1) return;
      const r = r0 + (r1 - r0) * (1 - (1 - u) ** 3);
      g.globalCompositeOperation = "lighter"; g.globalAlpha = (1 - u) * a;
      g.beginPath(); g.ellipse(x, y, r, r * sy, 0, 0, TAU);
      g.strokeStyle = rgba(col, 0.3); g.lineWidth = w * 3 * (1 - u) + 1; g.stroke();
      g.strokeStyle = col; g.lineWidth = w * (1 - u) + 0.5; g.stroke();
    });
  }
  /** a texture shown as its own element (r = its half size), moved with transforms instead of redrawn */
  sprite(src, r, x = 0, y = 0, sy = 1) {
    const c = document.createElement("canvas");
    c.width = src.width; c.height = src.height; c.getContext("2d").drawImage(src, 0, 0);
    Object.assign(c.style, { position: "absolute", left: x - r + "px", top: y - r + "px", width: 2 * r + "px", height: 2 * r + "px" });
    let el = c;
    if (sy !== 1) { el = document.createElement("div"); Object.assign(el.style, { position: "absolute", left: 0, top: 0, transform: `scaleY(${sy})`, transformOrigin: `${x}px ${y}px` }); el.appendChild(c); }
    this.root.insertBefore(el, this.cv || null);
    this.sprites.push(c);
    return c;
  }
  stop() {
    if (this.stopping) return;
    this.stopping = true;
    this.end = Math.min(this.end, this.t + this.tail);
    if (this.sprites.length) gsap.to(this.sprites, { opacity: 0, duration: this.tail, overwrite: "auto" });
  }
  tick(dt) {
    this.t += dt;
    const t = this.t;
    if (this.dur && t > this.dur) this.stop();
    if (this.stopping) this.fade = clamp((this.end - t) / this.tail, 0, 1);
    for (const e of this.emits) e(dt, t);
    const old = this.parts, hurry = this.stopping ? dt * 0.8 : 0; // stopped: what is left fades a little faster
    this.parts = [];
    for (const p of old) {
      if (hurry && !p.delay) p.t += hurry;
      if (step(p, dt)) {
        this.parts.push(p);
        if (p.tr && !p.delay && Math.random() < p.tr * dt) this.add({ x: p.x, y: p.y, vx: p.vx * 0.1, vy: p.vy * 0.1, g: 50 * this.k, life: rnd(0.3, 0.55), tex: dot(p.trc), s0: 11 * this.k, s1: 2, tw: 30, fin: 0.02 });
      } else if (p.die) p.die(p);
    }
    const g = this.ctx;
    if (g) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, this.cv.width, this.cv.height);
      const R = this.res, bx = -this.box[0] * R, by = -this.box[1] * R;
      for (const l of this.layers) { g.setTransform(R, 0, 0, R, bx, by); g.globalAlpha = 1; l(g, t, this.fade); }
      for (const p of this.parts) draw(g, p, R, bx, by, this.fade);
    }
    return !(t >= this.end && (!this.parts.length || t > this.end + 3));
  }
}
function draw(g, p, R, bx, by, fade) {
  if (p.delay > 0) return;
  const u = p.t / p.life;
  let a = p.a * fade * Math.min(1, u / p.fin) * (u < p.hold ? 1 : (1 - (u - p.hold) / (1 - p.hold)) ** p.fo);
  if (p.tw) a *= 0.6 + 0.4 * Math.sin(p.ph + p.t * p.tw);
  if (p.ck && u > p.ck && Math.random() < 0.45) a *= 0.2; // crackle at the end of a firework spark
  if (a <= 0.004) return;
  const s = p.s0 + (p.s1 - p.s0) * (p.grow ? 1 - (1 - u) ** 2 : u);
  g.globalCompositeOperation = p.add ? "lighter" : "source-over";
  let t = p.tex;
  if (p.texs) { const f = Math.min(u, 0.999) * (p.texs.length - 1), i = f | 0; t = p.texs[i]; if (p.texs[i + 1]) { const w = f - i; quad(g, p.x, p.y, p.rot, s, s * p.sy, R, bx, by); g.globalAlpha = a * w; g.drawImage(p.texs[i + 1], -0.5, -0.5, 1, 1); a *= 1 - w; } }
  if (p.str || p.tail) {
    const sp = Math.hypot(p.vx, p.vy) || 1, ang = Math.atan2(p.vy, p.vx);
    if (p.str) { quad(g, p.x, p.y, ang, Math.max(s, sp * p.str), s, R, bx, by); g.globalAlpha = a; g.drawImage(t, -0.5, -0.5, 1, 1); return; }
    const len = sp * p.tail;
    quad(g, p.x - Math.cos(ang) * len * 0.45, p.y - Math.sin(ang) * len * 0.45, ang, len, s * 0.5, R, bx, by); g.globalAlpha = a * 0.85; g.drawImage(p.tt, -0.5, -0.5, 1, 1);
  }
  quad(g, p.x, p.y, p.rot, s, s * p.sy, R, bx, by);
  g.globalAlpha = a;
  g.drawImage(t, -0.5, -0.5, 1, 1);
}
// position a unit square: centred at (x, y), turned by r, w by h
function quad(g, x, y, r, w, h, R, bx, by) {
  const c = Math.cos(r), s = Math.sin(r);
  g.setTransform(R * c * w, R * s * w, -R * s * h, R * c * h, bx + R * x, by + R * y);
}

// ---------- the effects ----------
// l, t, r, b around the origin at scale 3: the canvas each one draws in (none: it only uses sprites)
const BOX = {
  collect: [-300, -340, 300, 220], poof: [-320, -240, 320, 70], smoke: [-340, -560, 340, 110], cast: [-240, -500, 240, 100],
  firework: [-440, -430, 440, 480], rocket: [-440, -960, 440, 60], campfire: [-230, -440, 230, 90], mana: [-290, -660, 290, 100],
  runes: [-240, -260, 240, 60], starfall: [-380, -600, 380, 140], hit: [-260, -260, 260, 260], portal: [-170, -290, 170, 80], sunburst: null,
};

function sparkle(fx, x, y, P, n = 6, big = 1) {
  const k = fx.k;
  fx.add({ x, y, tex: glow(P.main), s0: 30 * k * big, s1: 110 * k * big, life: 0.3, a: 0.8, fin: 0.05 });
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(140, 300) * k * big; fx.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 4, g: 120 * k, life: rnd(0.3, 0.5), tex: dot(P.hot), s0: 14 * k, s1: 3 * k, str: 0.05, fin: 0.02 }); }
}
function burst(fx, x, y, col) {
  const k = fx.k;
  fx.add({ x, y, tex: soft(col), s0: 160 * k, s1: 720 * k, life: 0.7, a: 0.45, fin: 0.02, fo: 1.6 }); // the sky lights up
  fx.add({ x, y, tex: glow("#ffffff"), s0: 60 * k, s1: 200 * k, life: 0.18, a: 1, fin: 0.02 });
  const n = 80, two = pick(BURST);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(-0.05, 0.05), v = (i % 4 === 3 ? rnd(0.3, 0.75) : rnd(0.88, 1)) * 420 * k;
    fx.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 1.5, g: 160 * k, life: rnd(1.4, 2), tex: dot(i % 5 ? col : two), s0: 26 * k, s1: 7 * k, str: 0.1, fin: 0.01, fo: 0.8, ck: 0.7, tr: 8, trc: "#fff4d0" });
  }
  for (let i = 0; i < 5; i++) fx.add({ x: x + rnd(-40, 40) * k, y: y + rnd(-40, 40) * k, vy: -rnd(5, 20) * k, tex: puff("#6a6078", i % 4), add: false, a: 0.12, s0: 80 * k, s1: 280 * k, grow: 1, life: rnd(1.8, 2.4), delay: 0.2, rot: rnd(0, TAU), vr: rnd(-0.3, 0.3) });
}

const FX = {
  // a pickup: a flash, a ring of light, sparks flying out and twinkles drifting up
  collect(fx, P, k) {
    const cy = -30 * k;
    fx.add({ y: cy, tex: glow(P.main), s0: 120 * k, s1: 380 * k, life: 0.45, a: 1, fin: 0.03, fo: 2 });
    fx.add({ y: cy, tex: glow(P.hot), s0: 80 * k, s1: 180 * k, life: 0.25, a: 1, fin: 0.02 });
    fx.add({ y: cy, tex: soft(P.main), s0: 220 * k, s1: 90 * k, life: 0.9, a: 0.45, fin: 0.05 }); // afterglow
    fx.ring(0, cy, 24 * k, 190 * k, 0.55, 8 * k, P.main);
    fx.ring(0, cy, 16 * k, 120 * k, 0.5, 4 * k, P.hot, 1, 0.08);
    for (let i = 0; i < 26; i++) { const a = rnd(0, TAU), v = rnd(320, 700) * k; fx.add({ y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2.6, g: 320 * k, life: rnd(0.6, 1), tex: dot(i % 3 ? P.main : P.hot), s0: 22 * k, s1: 6 * k, str: 0.07, fin: 0.01 }); }
    for (let i = 0; i < 12; i++) { const a = rnd(0, TAU), v = rnd(60, 230) * k; fx.add({ y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100 * k, drag: 1.8, g: -20 * k, life: rnd(1, 1.5), delay: rnd(0, 0.15), tex: star(P.main), s0: 58 * k, s1: 16 * k, rot: rnd(0, TAU), vr: rnd(-3, 3), tw: 16, fin: 0.06 }); }
    fx.end = 1.5;
  },
  // dust kicked up along the floor, with grit thrown out
  poof(fx, P, k) {
    for (let i = 0; i < 20; i++) { const side = i % 2 ? 1 : -1; fx.add({ x: rnd(-30, 30) * k, y: rnd(-18, 4) * k, vx: side * rnd(70, 320) * k, vy: -rnd(20, 110) * k, drag: 2.6, g: -10 * k, life: rnd(1, 1.6), tex: puff(P.smoke, i % 4), add: false, s0: 54 * k, s1: rnd(130, 190) * k, grow: 1, a: rnd(0.7, 0.9), fin: 0.06, hold: 0.25, fo: 1.4, rot: rnd(-0.3, 0.3), vr: rnd(-0.5, 0.5), sy: 0.72 }); }
    for (let i = 0; i < 10; i++) fx.add({ x: rnd(-40, 40) * k, y: -4 * k, vx: rnd(-260, 260) * k, vy: -rnd(160, 380) * k, g: 1400 * k, life: rnd(0.35, 0.6), tex: blob(P.deep), add: false, s0: 11 * k, s1: 7 * k, fin: 0.01, fo: 0.5 });
    fx.end = 1.5;
  },
  // a puff of thick smoke that rolls upwards, with a few sparks inside
  smoke(fx, P, k) {
    const puffs = (n, v0, v1) => { for (let i = 0; i < n; i++) { const a = rnd(-Math.PI * 0.9, -Math.PI * 0.1), v = rnd(v0, v1) * k; fx.add({ x: rnd(-40, 40) * k, y: rnd(-20, 0) * k, vx: Math.cos(a) * v * 0.7, vy: Math.sin(a) * v - 150 * k, drag: 1.5, g: -150 * k, life: rnd(1.4, 2.1), tex: puff(P.smoke, (Math.random() * 4) | 0), add: false, s0: 60 * k, s1: rnd(150, 210) * k, grow: 1, a: rnd(0.85, 1), fin: 0.05, hold: 0.35, fo: 1.3, rot: rnd(-0.4, 0.4), vr: rnd(-0.4, 0.4) }); } };
    puffs(14, 60, 300);
    fx.rate(26, 0, 0.4, () => puffs(1, 40, 160));
    for (let i = 0; i < 6; i++) fx.add({ x: rnd(-20, 20) * k, y: -20 * k, vx: rnd(-120, 120) * k, vy: -rnd(100, 260) * k, drag: 2, life: rnd(0.6, 1), tex: dot(P.main), s0: 18 * k, s1: 4 * k, tw: 25 });
    fx.end = 0.4;
  },
  // a magic circle draws itself on the floor and fires a column of light (at 1.52 s), then fades
  cast(fx, P, k) {
    const R = 150 * k, SY = 0.34, FLASH = 1.52, END = 3.9;
    fx.layers.push((g, t, fade) => {
      const f = fade * (t < END - 1 ? 1 : clamp(END - t, 0, 1)), e = 1 - (1 - clamp(t / 1.2, 0, 1)) ** 3;
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.85 * f * (0.85 + 0.15 * Math.sin(t * 6));
      g.drawImage(glow(P.main), -R * 1.35, -R * 1.35 * SY, R * 2.7, R * 2.7 * SY); // the floor lit by the circle
      g.save(); g.scale(1, SY); g.rotate(t * 0.35);
      const line = (lw, path) => { g.lineWidth = lw * 3.2; g.strokeStyle = rgba(P.main, 0.22); path(); g.stroke(); g.lineWidth = lw; g.strokeStyle = rgba(P.hot, 0.95); g.stroke(); };
      g.globalAlpha = f;
      line(4 * k, () => { g.beginPath(); g.arc(0, 0, R, 0, TAU * e); });
      line(2 * k, () => { g.beginPath(); g.arc(0, 0, R * 0.82, 0, -TAU * e, true); });
      g.globalAlpha = f * clamp((t - 0.4) / 0.6, 0, 1);
      if (g.globalAlpha > 0) circleArt(g, R, P, 2.2 * k, true, 1);
      g.restore();
      const c = t - FLASH; // the column of light she arrives on
      if (c > -0.25 && c < 1.1) {
        g.globalAlpha = f * (c < 0 ? (c + 0.25) / 0.25 : (1 - c / 1.1) ** 1.5);
        const w = R * (c < 0 ? 1.3 : 1.9), h = 520 * k;
        g.drawImage(column(P.main, P.hot), -w / 2, -h, w, h);
      }
    });
    fx.add({ delay: FLASH - 0.05, tex: glow(P.hot), s0: 200 * k, s1: 440 * k, life: 0.5, a: 0.9, sy: 0.45, fin: 0.05 });
    fx.rate(26, 0.2, 3, () => { const a = rnd(0, TAU), r = R * rnd(0.3, 1); fx.add({ x: Math.cos(a) * r, y: Math.sin(a) * r * SY, vy: -rnd(50, 160) * k, wob: 30 * k, wf: 4, life: rnd(0.9, 1.6), tex: dot(P.main), s0: rnd(12, 24) * k, s1: 3 * k, tw: 12 }); });
    fx.end = END;
  },
  // slow soft rays turning behind something (loops until stopped)
  sunburst(fx, P, k) {
    const R = 192 * k;
    const a = fx.sprite(rays(P, 16, 0.1, 0), R), b = fx.sprite(rays(P, 11, 0.05, 1), R * 0.92), c = fx.sprite(glow(P.main), R * 0.6);
    gsap.fromTo([a, b, c], { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" });
    gsap.to(a, { rotation: 360, duration: 40, repeat: -1, ease: "none" });
    gsap.to(b, { rotation: -360, duration: 28, repeat: -1, ease: "none" });
    gsap.to(c, { opacity: 0.7, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.5 });
    fx.end = Infinity;
  },
  // a firework shell bursting in the sky: sparks with drag and gravity, glitter trails, a crackle, drifting smoke
  firework(fx, P, k, o) {
    burst(fx, 0, 0, o.palette ? P.main : pick(BURST));
    fx.end = 2;
  },
  // a rocket climbs from the ground on a spark trail and bursts
  rocket(fx, P, k, o) {
    const H = rnd(480, 560) * k, T = 0.95, col = o.palette ? P.main : pick(BURST), r = { x: 0, y: 0 };
    let boomed = false;
    fx.emits.push((dt, t) => {
      if (t <= T) { const u = t / T; r.x = Math.sin(u * 9) * 6 * k; r.y = -H * (1 - (1 - u) ** 2.2); }
      else if (!boomed) { boomed = true; burst(fx, r.x, r.y, col); }
    });
    fx.rate(70, 0, T, () => fx.add({ x: r.x + rnd(-3, 3) * k, y: r.y, vx: rnd(-40, 40) * k, vy: rnd(40, 140) * k, g: 300 * k, drag: 2, life: rnd(0.3, 0.6), tex: dot("#ffc070"), s0: 18 * k, s1: 3 * k, tw: 30 }));
    fx.rate(18, 0, T, () => fx.add({ x: r.x, y: r.y, vy: rnd(10, 40) * k, life: 1.2, tex: puff("#6b6070", (Math.random() * 4) | 0), add: false, a: 0.2, s0: 20 * k, s1: 80 * k, grow: 1, rot: rnd(0, TAU) }));
    fx.layers.push((g, t) => { if (t > T) return; g.globalCompositeOperation = "lighter"; g.drawImage(glow("#fff1c0"), r.x - 34 * k, r.y - 34 * k, 68 * k, 68 * k); });
    fx.end = T + 2;
  },
  // a log fire in the hearth: flames that rise, narrow and redden, coals that breathe, embers, a little smoke,
  // and its light on the floor (loops while its scene is up)
  campfire(fx, P, k) {
    const LW = 300 * k, wob = (t) => 0.82 + 0.1 * Math.sin(t * 13) + 0.06 * Math.sin(t * 7.3 + 1) + 0.04 * Math.sin(t * 23);
    const FL = [soft("#ffd77a"), soft("#ff9a2e"), soft("#f0520f"), soft("#8a2206")];
    fx.layers.push((g, t, f) => {
      const w = wob(t) * f;
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.4 * w; g.drawImage(soft("#ff9a3c"), -300 * k, -110 * k, 600 * k, 160 * k); // light on the hearth floor
      g.globalAlpha = 0.22 * w; g.drawImage(soft("#ff8a30"), -190 * k, -250 * k, 380 * k, 320 * k); // the glow of the fire
      g.globalCompositeOperation = "source-over"; g.globalAlpha = f;
      g.drawImage(logs(), -LW / 2, -LW * 0.78, LW, LW);
      g.globalCompositeOperation = "lighter"; g.globalAlpha = (0.35 + 0.25 * Math.sin(t * 3.1)) * f; // the coals breathe
      g.drawImage(soft("#ff6a1a"), -120 * k, -42 * k, 240 * k, 50 * k);
    });
    fx.rate(70, 0, Infinity, () => { const x = (Math.random() + Math.random() - 1) * 60 * k; fx.add({ x, y: -24 * k, vx: -x * 1.1, vy: -rnd(160, 280) * k, wob: 50 * k, wf: rnd(5, 9), life: rnd(0.55, 0.95), texs: FL, s0: rnd(62, 84) * k, s1: 14 * k, sy: 1.5, a: 0.33, fin: 0.12, fo: 0.8 }); });
    fx.rate(7, 0, Infinity, () => fx.add({ x: rnd(-30, 30) * k, y: -50 * k, vy: -rnd(90, 200) * k, wob: 40 * k, wf: 3, life: rnd(1.4, 2.4), tex: dot("#ffb050"), s0: 7 * k, s1: 2 * k, tw: 20, fin: 0.05 }));
    fx.rate(3, 0, Infinity, () => fx.add({ x: rnd(-10, 10) * k, y: -150 * k, vx: rnd(-10, 20) * k, vy: -rnd(50, 90) * k, g: -10 * k, life: 2.5, tex: puff("#3a3040", (Math.random() * 4) | 0), add: false, a: 0.14, s0: 30 * k, s1: 140 * k, grow: 1, rot: rnd(0, TAU), vr: rnd(-0.4, 0.4) }));
    fx.end = Infinity;
  },
  // the cauldron surges: a ring of light, motes and coloured vapour rising in a twist
  mana(fx, P, k) {
    fx.add({ y: -20 * k, tex: glow(P.main), s0: 120 * k, s1: 380 * k, life: 0.5, a: 0.8, sy: 0.6, fin: 0.04 });
    fx.ring(0, -10 * k, 30 * k, 250 * k, 0.7, 10 * k, P.main, 0.32);
    for (let i = 0; i < 40; i++) { const x = rnd(-110, 110) * k; fx.add({ x, y: -10 * k, vx: x * 0.4, vy: -rnd(260, 560) * k, drag: 1.4, wob: 50 * k, wf: rnd(3, 6), life: rnd(0.8, 1.4), delay: rnd(0, 0.35), tex: dot(i % 3 ? P.main : P.hot), s0: rnd(26, 44) * k, s1: 5 * k, tw: 14 }); }
    for (let i = 0; i < 16; i++) { const x = rnd(-80, 80) * k; fx.add({ x, y: -10 * k, vx: x * 1.2, vy: -rnd(500, 800) * k, drag: 2.2, g: 200 * k, life: rnd(0.5, 0.8), tex: dot(P.hot), s0: 20 * k, s1: 5 * k, str: 0.06, fin: 0.01 }); }
    for (let i = 0; i < 12; i++) fx.add({ x: rnd(-40, 40) * k, y: -20 * k, vy: -rnd(260, 380) * k, drag: 0.8, wob: 220 * k, wf: 6, ph: (i / 12) * TAU, life: rnd(0.9, 1.3), delay: rnd(0, 0.3), tex: star(P.main), s0: 44 * k, s1: 12 * k, rot: rnd(0, TAU), vr: 4 });
    for (let i = 0; i < 9; i++) fx.add({ x: rnd(-70, 70) * k, y: -20 * k, vy: -rnd(120, 220) * k, drag: 0.8, life: rnd(1, 1.4), tex: puff(P.main, i % 4), a: 0.32, s0: 80 * k, s1: 280 * k, grow: 1, rot: rnd(0, TAU), vr: rnd(-1, 1) });
    fx.end = 1.8;
  },
  // a rune circle glowing on the floor, turning slowly, with motes rising off it (loops until stopped)
  runes(fx, P, k) {
    const R = 175 * k, SY = 0.32, cy = -10 * k;
    const under = fx.sprite(glow(P.main), R * 1.3, 0, cy, SY), disc = fx.sprite(runeDisc(P), R / 0.9, 0, cy, SY);
    gsap.fromTo([under, disc], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" });
    gsap.to(disc, { rotation: 360, duration: 14, repeat: -1, ease: "none" });
    gsap.to(under, { opacity: 0.55, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.6 });
    fx.rate(22, 0.2, Infinity, () => { const a = rnd(0, TAU), r = R * rnd(0.75, 1); fx.add({ x: Math.cos(a) * r, y: cy + Math.sin(a) * r * SY, vy: -rnd(60, 150) * k, wob: 20 * k, wf: 4, life: rnd(0.8, 1.4), tex: dot(P.main), s0: rnd(8, 14) * k, s1: 2 * k, tw: 14 }); });
    fx.end = Infinity;
  },
  // shooting stars fall in on glowing tails, each landing in a little sparkle
  starfall(fx, P, k) {
    for (let i = 0; i < 13; i++) {
      const T = rnd(0.5, 0.75), tx = rnd(-70, 70) * k, ty = rnd(-30, 20) * k, sx = tx + rnd(-260, 260) * k, sy = rnd(-560, -380) * k;
      fx.add({ x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy) / T, life: T, delay: i * 0.07 + rnd(0, 0.1), tex: star(P.main), tt: glow(P.main), tail: 0.22, s0: rnd(60, 76) * k, s1: 40 * k, rot: rnd(0, TAU), vr: rnd(-6, 6), fin: 0.15, fo: 0, die: (p) => sparkle(fx, p.x, p.y, P, 6, 1.2) });
    }
    fx.end = 1.6;
  },
  // a bump: a white flash, a shock ring, sparks and a few spinning stars
  hit(fx, P, k) {
    fx.add({ tex: glow("#fff1b0"), s0: 90 * k, s1: 360 * k, life: 0.24, a: 1, fin: 0.02 });
    fx.ring(0, 0, 10 * k, 190 * k, 0.34, 11 * k, "#fff4d6");
    for (let i = 0; i < 16; i++) { const a = rnd(0, TAU), v = rnd(600, 1000) * k; fx.add({ vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 6, life: rnd(0.28, 0.45), tex: dot(i % 2 ? "#ffd35a" : "#ffffff"), s0: 24 * k, s1: 7 * k, str: 0.06, fin: 0.01 }); }
    for (let i = 0; i < 3; i++) fx.add({ vx: (i - 1) * rnd(140, 220) * k, vy: -rnd(220, 320) * k, g: 900 * k, life: 0.75, tex: star("#ffe066"), s0: 60 * k, s1: 40 * k, rot: rnd(0, TAU), vr: rnd(6, 10), fin: 0.05 });
    fx.end = 0.8;
  },
  // a vortex of light in a doorway, with sparks spiralling into it (loops until stopped)
  portal(fx, P, k) {
    const cy = -105 * k, R = 175 * k;
    const a = fx.sprite(swirl(P), R, 0, cy), b = fx.sprite(swirl(P), R * 0.7, 0, cy), c = fx.sprite(glow(P.hot), R * 0.55, 0, cy);
    gsap.fromTo([a, b, c], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" });
    gsap.to(a, { rotation: -360, duration: 1.8, repeat: -1, ease: "none" });
    gsap.to(b, { rotation: 360, duration: 3, repeat: -1, ease: "none" });
    gsap.to(c, { scale: 1.2, duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
    fx.rate(50, 0, Infinity, () => { const r = R * rnd(0.7, 0.95), life = rnd(0.6, 0.9); fx.add({ orb: { cx: 0, cy, r, a: rnd(0, TAU), w: -rnd(4, 6), dr: -r / life, sy: 1 }, life, tex: dot(Math.random() < 0.3 ? P.hot : P.main), s0: rnd(16, 26) * k, s1: 4 * k, fin: 0.2 }); });
    fx.layers.push((g, t, f) => { g.globalCompositeOperation = "lighter"; g.globalAlpha = f * (0.55 + 0.15 * Math.sin(t * 5)); g.beginPath(); g.arc(0, cy, R * 0.8, 0, TAU); g.lineWidth = 14 * k; g.strokeStyle = rgba(P.main, 0.35); g.stroke(); g.lineWidth = 4 * k; g.strokeStyle = P.hot; g.stroke(); });
    fx.end = Infinity;
  },
};
// effects that keep going until stop() is called (or their layer is cleared)
const TAILS = { sunburst: 0.6, runes: 0.5, portal: 0.4, campfire: 0.8 };
// the hearth fire burns for a whole part, far back: 30 frames a second and 1x resolution are plenty for soft flames
const SLOW = { campfire: { fps: 30, res: 1 } };

// ---------- the loop ----------
const live = new Set();
let last = 0, running = false;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000) * (window.__speed || 1);
  last = now;
  for (const fx of live) {
    if (!fx.root.isConnected) { finish(fx); continue; }
    let step = dt;
    if (fx.every) { fx.acc += dt; if (fx.acc < fx.every) continue; step = fx.acc; fx.acc = 0; }
    if (!fx.tick(step)) finish(fx);
  }
  if (live.size) requestAnimationFrame(loop); else running = false;
}
function finish(fx) {
  live.delete(fx);
  gsap.killTweensOf(fx.sprites);
  fx.root.remove();
  fx.resolve();
}

/** play(name, x, y, {scale, palette, parent, z, dur}) -> {el, done, stop()} ; done resolves when it has finished */
export function playFx(name, x, y, o = {}) {
  const make = FX[name];
  const layer = o.parent || document.getElementById("fxl");
  if (!make || !layer) return { stop() {}, done: Promise.resolve() };
  const k = (o.scale || 3) / 3;
  const P = (typeof o.palette === "string" ? PALS[o.palette] : o.palette) || (name === "hit" ? PALS.white : name === "smoke" ? PALS.stone : PALS.gold);
  const root = document.createElement("div");
  root.dataset.fx = name;
  Object.assign(root.style, { position: "absolute", left: x + "px", top: y + "px", width: 0, height: 0, pointerEvents: "none", zIndex: o.z || "" });
  const fx = new Fx(root, k, P);
  fx.done = new Promise((r) => (fx.resolve = r));
  fx.dur = o.dur;
  fx.tail = TAILS[name] || 0.5;
  if (SLOW[name]) { fx.every = 1 / SLOW[name].fps - 0.002; fx.acc = 0; }
  const box = BOX[name];
  if (box) {
    const [l, t, r, b] = box.map((v) => v * k);
    // sharp on the screen it is shown on, a little less for big effects (they are soft light anyway)
    const stageS = document.getElementById("stage")?._s || 1;
    const res = clamp(stageS * (window.devicePixelRatio || 1) * 1.1, 0.6, SLOW[name]?.res || ((r - l) * (b - t) > 300000 ? 1.25 : 2));
    const cv = document.createElement("canvas");
    cv.width = Math.ceil((r - l) * res); cv.height = Math.ceil((b - t) * res);
    Object.assign(cv.style, { position: "absolute", left: l + "px", top: t + "px", width: r - l + "px", height: b - t + "px" });
    root.appendChild(cv);
    Object.assign(fx, { cv, ctx: cv.getContext("2d"), res, box: [l, t, r, b] });
  }
  make(fx, P, k, o);
  layer.appendChild(root);
  live.add(fx);
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  return { el: root, done: fx.done, stop: () => fx.stop() };
}
