import { C, say, react, closeBubble, gsap, wait, sfx, pose, host, hostSwap, setFocus, solo, el, ui, colorMD, card } from "./engine.js";

// Gameplay layout: ONE character at a time on the left (whoever speaks). Background in focus-blur.
export function sideChars(spot = "game") {
  solo(spot);
  hostSwap("neel");
  setFocus(true);
}
export async function mayaIn(p = "explain") { await hostSwap("maya"); pose("maya", p); }
export async function mayaOut() {}
export async function maya(text, p = "explain") {
  await mayaIn(p);
  await say("maya", text, { p });
}
// the script gives each question its praise: "agni:yes" = Agni says "Yes! That is right."
const PRAISE = { yes: "Yes! That is right.", super: "Super! You got it right.", great: "Great job! That is correct.", well: "Well done! You got it." };
const ROTATE = ["agni:yes", "neel:super", "agni:great", "neel:well"];
let pi = 0;
export async function praise(cue = ROTATE[pi++ % ROTATE.length]) {
  const [who, key] = cue.split(":"), line = PRAISE[key];
  await hostSwap(who);
  react(who, who === "agni" ? "cheer" : "happy", 1.6);
  sfx("cheer");
  await say(who, line, { wait: false, auto: 1.1 });
}
export function idleWatch(sec, fn) {
  let t = null, live = true;
  const arm = () => { clearTimeout(t); if (live) t = setTimeout(() => live && fn(), sec * 1000); };
  const h = () => arm();
  document.getElementById("stage").addEventListener("pointerdown", h);
  arm();
  return { stop() { live = false; clearTimeout(t); document.getElementById("stage").removeEventListener("pointerdown", h); }, arm };
}
export { closeBubble, wait };

// Neel's Party Plan: written at the end of Part 2, read again at the start of Part 3
export const PLAN = [["Chairs", "m + 1"], ["Sweets", "3m + 5"], ["Cups", "m − 2"], ["Candles", "4m"], ["Balloons", "2m − 3"], ["Friends in all", "m + d"], ["Plates", "m + d + 1"], ["Cushions", "m + 2d"], ["Laddoos", "3m + 2d"]];
/** the scroll unrolls, then its lines appear one at a time */
export async function planScroll(at = { left: 110, top: 150 }) {
  const sc = el("div", "scroll", ui, at, `<h2>Neel's Party Plan</h2>`);
  sfx("magic");
  await gsap.fromTo(sc, { scaleY: 0.05, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.5, ease: "back.out(1.4)" });
  for (const [k, v] of PLAN) {
    const r = el("div", "pl", sc, {}, `<span>${k}</span><b>=</b><span>${colorMD(v)}</span>`);
    gsap.from(r, { x: -20, opacity: 0, duration: 0.3 });
    sfx("pop");
    await wait(0.32);
  }
  return {
    el: sc,
    async roll() { await gsap.to(sc, { scaleY: 0.05, opacity: 0, duration: 0.45, ease: "power2.in" }); sc.remove(); },
  };
}
/** the word helper: which words mean add, multiply, take away */
export function wordHelp(parent) {
  return el("div", "words", parent, {}, `<span><b>+</b> add: and · more · extra · plus · total · in all</span><span><b>×</b> multiply: each · every · per · times</span><span><b>−</b> take away: less · fewer · minus · left · broke · gone · said no</span>`);
}

// the things on the list, grey, while the narrator introduces the part
export function iconRow(list) {
  const r = card(list.map((it) => `<img src="assets/${it.icon}.webp">`).join(""), { left: "50%", top: 230, translate: "-50% 0" }, "card icons");
  return { remove: () => gsap.to(r, { opacity: 0, duration: 0.3, onComplete: () => r.remove() }) };
}
