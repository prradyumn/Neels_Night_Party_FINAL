import { C, say, react, closeBubble, gsap, wait, sfx, pose, host, hostSwap, setFocus, solo } from "./engine.js";

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
const PRAISE = [["agni", "Yes! That is right."], ["neel", "Super! You got it right."], ["agni", "Great job! That is correct."], ["neel", "Well done! You got it."]];
let pi = 0;
export async function praise() {
  const [who, line] = PRAISE[pi++ % PRAISE.length];
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
