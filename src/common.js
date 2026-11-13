import { C, say, react, closeBubble, gsap, wait, sfx, pose, host, hostSwap, setFocus, solo, el, img, ui, colorMD, card, busy, skipLine } from "./engine.js";

// Gameplay layout: ONE character at a time on the left (whoever speaks). Background in focus-blur.
export function sideChars(spot = "game") {
  solo(spot);
  hostSwap("neel");
  setFocus(true);
}
export async function mayaIn(p = "explain") { await hostSwap("maya"); pose("maya", p); }
export async function mayaOut() {}
// say() swaps the speaker in inside its queue, so Maya never steps on stage while someone else is still talking
export const maya = (text, p = "explain", onStart) => say("maya", text, { p, onStart });
// the script gives each question its praise: "agni:yes" = Agni says "Yes! That is right."
const PRAISE = { yes: "Yes! That is right.", super: "Super! You got it right.", great: "Great job! That is correct.", well: "Well done! You got it." };
const ROTATE = ["agni:yes", "neel:super", "agni:great", "neel:well"];
let pi = 0;
export async function praise(cue = ROTATE[pi++ % ROTATE.length]) {
  const [who, key] = cue.split(":"), line = PRAISE[key];
  sfx("cheer");
  await say(who, line, { wait: false, auto: 1.1, p: who === "agni" ? "cheer" : "happy" });
}
/** "Take your time" nudges. They only count down while the answer controls are open (open()) and nobody is speaking.
 *  The controls stay usable during a nudge;
 *  pause() stops the count (the child answered, feedback is playing) and cuts a nudge that is being read. */
export function idleWatch(sec, fn) {
  let t = null, live = true, open = false, nudging = false;
  const arm = () => { clearTimeout(t); if (live && open) t = setTimeout(fire, sec * 1000); };
  const fire = async () => {
    if (!live || !open) return;
    if (busy()) { arm(); return; } // someone is talking: wait for the next quiet stretch
    nudging = true;
    await fn();
    nudging = false;
    arm();
  };
  // the child acting is the best answer to a nudge: it stops, and the count starts again
  const h = () => { if (nudging) skipLine(); arm(); };
  const st = document.getElementById("stage");
  st.addEventListener("pointerdown", h, true); // capture: the controls stop their own taps from bubbling
  return {
    open() { open = true; arm(); },
    pause() { open = false; clearTimeout(t); if (nudging) skipLine(); },
    stop() { live = open = false; clearTimeout(t); if (nudging) skipLine(); st.removeEventListener("pointerdown", h, true); },
    arm,
  };
}
export { closeBubble, wait };

// Neel's Party Plan: written at the end of Part 2, read again at the start of Part 3
export const PLAN = [["Chairs", "m + 1"], ["Sweets", "3m + 5"], ["Cups", "m − 2"], ["Candles", "4m"], ["Balloons", "2m − 3"], ["Friends in all", "m + d"], ["Plates", "m + d + 1"], ["Cushions", "m + 2d"], ["Laddoos", "3m + 2d"]];
/** the scroll unrolls, then its lines appear one at a time. dock() moves it to the side of the table scene, where it
 *  stays open; glow(name) lights the line in use */
export async function planScroll(at = { left: 110, top: 150 }) {
  const sc = el("div", "scroll", ui, at, `<h2>Neel's Party Plan</h2>`);
  sfx("magic");
  await gsap.fromTo(sc, { scaleY: 0.05, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.5, ease: "back.out(1.4)" });
  for (const [k, v] of PLAN) {
    const r = el("div", "pl", sc, {}, `<span>${k}</span><b>=</b><span>${colorMD(v)}</span>`);
    r.dataset.k = k;
    gsap.from(r, { x: -20, opacity: 0, duration: 0.3 });
    sfx("pop");
    await wait(0.18);
  }
  // docked, the scroll folds to a small tab under the stars (the line being worked on is in the equation bar);
  // a tap opens the whole plan for a look, and it folds again by itself
  let shut;
  const fold = (open) => { sc.classList.toggle("open", open); clearTimeout(shut); if (open) shut = setTimeout(() => fold(false), 6000); };
  sc.addEventListener("pointerdown", (e) => { if (!sc.classList.contains("tab")) return; e.stopPropagation(); sfx("tap"); fold(!sc.classList.contains("open")); });
  return {
    el: sc,
    async roll() { await gsap.to(sc, { scaleY: 0.05, opacity: 0, duration: 0.45, ease: "power2.in" }); sc.remove(); },
    async dock(to) {
      await gsap.to(sc, { opacity: 0, scale: 0.9, duration: 0.25 });
      sc.classList.add("docked", "tab");
      Object.assign(sc.style, { left: to.left + "px", top: to.top + "px" });
      await gsap.to(sc, { opacity: 1, scale: 1, duration: 0.3 });
    },
    glow(k) { sc.querySelectorAll(".pl").forEach((r) => r.classList.toggle("on", r.dataset.k === k)); },
  };
}
// the things on the list, grey, while the narrator introduces the part (top: lower it under a long narrator line)
export function iconRow(list, top = 230) {
  const r = card(list.map((it) => `<img src="assets/${it.icon}.webp">`).join(""), { left: "50%", top, translate: "-50% 0" }, "card icons");
  return { remove: () => gsap.to(r, { opacity: 0, duration: 0.3, onComplete: () => r.remove() }) };
}

// string lights switch on one bulb at a time (bulb centres measured on de_string_lights, 839 px wide)
const BULBS = [[40, 82], [108, 117], [181, 142], [263, 162], [344, 175], [428, 180], [506, 175], [584, 163], [660, 147], [733, 120], [800, 85]];
const BULB_COLS = ["#ffd66b", "#ff8ad8", "#7ff0e0", "#ffb070", "#c9a2ff"];
const bulb = (parent, left, top, k, i) => el("div", "bulbGlow", parent, { left: left + BULBS[i][0] * k - 50, top: top + BULBS[i][1] * k - 50, width: 100, height: 100, background: `radial-gradient(circle,#fffbe8 0 14%,${BULB_COLS[i % BULB_COLS.length]} 32%,transparent 68%)`, animationDelay: `${-i * 0.37}s` });
export function lightsUp(parent, left, top, width, rays = true) {
  const k = width / 839;
  if (rays) el("div", "rays", parent, { left: left + width / 2 - 520, top: -560, width: 1040, height: 1040 });
  const gs = BULBS.map((_, i) => bulb(parent, left, top, k, i));
  gsap.from(gs, { scale: 0.2, duration: 0.3, stagger: 0.09, ease: "back.out(3)", onStart: () => sfx("magic") });
}
/** a garland over the party table that fills as the party gets ready: light(f) lights that share (0..1) of the bulbs */
export function garland(parent, left, top, width) {
  const k = width / 839, g = img("de_string_lights", parent, { left, top, width });
  let lit = 0;
  return {
    el: g,
    light(f) {
      const to = Math.round(f * BULBS.length);
      for (; lit < to; lit++) { const b = bulb(parent, left, top, k, lit); gsap.from(b, { scale: 0.2, opacity: 0, duration: 0.4, delay: (lit % 3) * 0.12, ease: "back.out(3)" }); }
      sfx("magic");
    },
  };
}

/** the gold m coin (tools/blender/coin.py: 12 frames of half a turn). spin(turns, labels): the label changes each
 *  time the coin is edge-on, so a new letter or number is never seen appearing */
export function coin(parent, style, label = "m") {
  const c = el("div", "coin", parent, style), face = el("span", "cface", c, {}, label);
  const draw = (a) => {
    const fr = Math.floor(((((a % 0.5) + 0.5) % 0.5) / 0.5) * 12) % 12;
    c.style.backgroundPosition = `${(fr / 11) * 100}% 0`;
    face.style.transform = `scaleX(${Math.max(0.02, Math.abs(Math.cos(a * 2 * Math.PI)))})`;
  };
  draw(0);
  return {
    el: c, face,
    set(l) { face.innerHTML = l; },
    spin(turns = 1, labels = [], dur = 0.7 * turns) {
      const o = { a: 0 }; let half = 0;
      sfx("whoosh");
      return gsap.to(o, { a: turns, duration: dur, ease: "power2.inOut", onUpdate: () => {
        const h = Math.floor(o.a * 2 + 0.5);
        if (h !== half) { half = h; if (labels[h - 1] != null) face.innerHTML = labels[h - 1]; }
        draw(o.a);
      }, onComplete: () => draw(0) });
    },
  };
}

// ---------- Neel's house (forest mid layer, its own 2000 x 900 coordinates) ----------
const WINDOWS = [{ x: 392, y: 268, w: 50, h: 66 }, { x: 348, y: 575, w: 60, h: 80 }, { x: 650, y: 368, w: 128, h: 128 }];
/** the windows go dark; lit(n) lights the first n with a warm glow (the opening shot, and the map as rooms are done) */
export function houseWindows(layer) {
  const ws = WINDOWS.map((w) => ({
    off: el("div", "winOff", layer, { left: w.x - w.w / 2, top: w.y - w.h / 2, width: w.w, height: w.h }),
    glow: el("div", "winGlow", layer, { left: w.x - w.w * 1.4, top: w.y - w.h * 1.4, width: w.w * 2.8, height: w.h * 2.8 }),
  }));
  gsap.set(ws.map((w) => w.glow), { opacity: 0 });
  let n = 0;
  return {
    lit(to, animate = true) {
      for (; n < Math.min(to, ws.length); n++) {
        const w = ws[n], d = animate ? 0.5 : 0;
        gsap.to(w.off, { opacity: 0, duration: d });
        gsap.fromTo(w.glow, { opacity: animate ? 1 : 0.55, scale: animate ? 0.6 : 1 }, { opacity: 0.55, scale: 1, duration: animate ? 0.9 : 0, ease: "power2.out", onComplete: () => gsap.to(w.glow, { opacity: 0.35, duration: 1.4 + Math.random(), yoyo: true, repeat: -1, ease: "sine.inOut" }) });
        if (animate) sfx("pop");
      }
    },
  };
}
/** the owl in the tree blinks now and then */
export function owlBlink(layer) {
  const lids = [[240, 233], [266, 233]].map(([x, y]) => el("div", "lid", layer, { left: x - 13, top: y - 13, width: 26, height: 26 }));
  gsap.set(lids, { scaleY: 0, transformOrigin: "50% 0%" });
  const blink = () => gsap.to(lids, { scaleY: 1, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.in" });
  blink();
  const t = setInterval(() => { if (!lids[0].isConnected) return clearInterval(t); blink(); if (Math.random() < 0.4) setTimeout(blink, 260); }, 3600);
}
