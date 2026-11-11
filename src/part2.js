// PART 2 – Write the Party Plan: the Spell Cauldron. Brew a spell (expression) from orbs; the cauldron test-runs it.
import { qbox, colorMD, award, actionZone, azTip, afterTitle, host, SPOTS, solo, trio, pose, setFore, gsap, el, img, ui, world, wait, sfx, say, card, playFx, checklist, checkCur, checkDone, pointHand, onTap, react, C, closeBubble, button, camFocus, camTo, camPt, groundShadow, lightPool, lock, busy } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, praise, idleWatch, iconRow } from "./common.js";

// a small two-row table for the first questions: friends 1, 2, 3, m and what each needs
const tbl = (label, cells) => `<table class="qtab"><tr><th>Friends</th><td>1</td><td>2</td><td>3</td><td>m</td></tr><tr><th>${label}</th>${cells.map((c) => `<td>${c}</td>`).join("")}<td>?</td></tr></table>`;
// vals: the letters and numbers on the shelf. Every question also gets all three signs + − ×, so the signs on offer
// never give the answer away
const Q = [
  { name: "Chairs", vals: ["m", "1", "2"], sub: tbl("Chairs", ["1 + 1", "2 + 1", "3 + 1"]), who: "neel", line: "Chairs: one chair for each friend, and 1 extra chair for me. How many chairs?",
    icon: "pr_chair", f: (m) => m + 1, sol: ["m", "+", "1"], tests: [[1], [2], [3]], ans: "m + 1",
    h1: "Look at the table. What do we add to the number of friends each time?", h2: "\"Extra\" means add. For m friends, it is m and 1 more.", inact: "Look at the table. What do we always add?",
    exp: "One chair for each friend is m chairs. 1 extra chair for Neel means add 1. So the chairs are <b>m + 1</b>.", pop: "The chairs are m + 1." },
  { name: "Sweets", vals: ["m", "3", "5"], sub: tbl("Sweets", ["1 × 3 + 5 = 8", "2 × 3 + 5 = 11", "3 × 3 + 5 = 14"]), who: "agni", line: "Sweets: each friend gets 3 sweets, and I get 5 extra sweets. How many sweets do we need for m friends?",
    icon: "pr_sweet", f: (m) => 3 * m + 5, sol: ["3", "m", "+", "5"], tests: [[1], [2], [3]], ans: "3m + 5",
    h1: "Look at the table. Each time, we multiply the number of friends by 3, and then we add Agni's 5 sweets.", h2: "\"Each\" means multiply, so m friends get 3m sweets. \"Extra\" means add, so we add Agni's 5 sweets.", inact: "First multiply by 3, then add Agni's 5 sweets.",
    exp: "Each friend gets 3 sweets, so that is m × 3, which we write as 3m. Agni gets 5 extra sweets, and \"extra\" means add. So the sweets are <b>3m + 5</b>.", pop: "The sweets are 3m + 5." },
  { name: "Cups", vals: ["m", "2", "1"], sub: "m cups, 2 broke", who: "agni", line: "Cups: one cup for each friend. Oops! Neel broke 2 cups. How many cups are left?",
    icon: "pr_cup_broken", f: (m) => m - 2, sol: ["m", "−", "2"], tests: [[3], [4], [5]], ans: "m − 2",
    h1: "Neel had one cup for each friend, so m cups. Then 2 cups broke.", h2: "\"Broke\" means take away: broken cups are gone. If there were 10 cups and 2 broke, 10 − 2 = 8 cups are left.", inact: "2 cups broke. Do we add or take away?",
    exp: "There was one cup for each friend, so m cups. 2 cups broke, so we take away 2. Now there are <b>m − 2</b> cups.", pop: "The cups are m − 2." },
  { name: "Candles", vals: ["m", "4", "1"], sub: "Neel wrote: 4 + m", who: "neel", line: "Candles: 4 candles for each friend. I wrote 4 + m. Am I right?",
    icon: "pr_candle", f: (m) => 4 * m, sol: ["4", "m"], pre: ["4", "+", "m"], tests: [[1], [2], [3]], ans: "No, it is 4m",
    h1: "4 candles for each friend. Does \"each\" mean add or multiply?", h2: "\"Each\" means multiply. Try 5 friends. 4 + 5 = 9 candles. But 4 candles for each of 5 friends is 4 × 5 = 20 candles. Which one is right?", inact: "4 for each friend. Add or multiply?",
    exp: "4 candles for each friend means we multiply 4 by the number of friends. That is 4 × m, which we write as <b>4m</b>. So Neel is not right.", pop: "The candles are 4m." },
  { name: "Balloons", vals: ["m", "2", "3"], sub: "2 balloons for each friend, 3 balloons burst", who: "agni", line: "Balloons: 2 balloons for each friend. Oops! 3 balloons burst. How many balloons are left?",
    icon: "pr_balloon", f: (m) => 2 * m - 3, sol: ["2", "m", "−", "3"], tests: [[2], [3], [4]], ans: "2m − 3",
    h1: "Do it in two steps. First, balloons for the friends: 2 for each friend.", h2: "2 for each friend is 2m. Then 3 balloons burst. \"Burst\" means take away, so we take away 3.", inact: "First the friends' balloons, then take away the burst balloons.",
    exp: "First, 2 balloons for each friend is 2 × m, which we write as 2m. Then 3 balloons burst. Burst balloons are gone, so we take away 3. So we have <b>2m − 3</b> balloons.", pop: "The balloons are 2m − 3." },
  { beat: true },
  { example: true },
  { name: "Plates", vals: ["m", "d", "1"], sub: "one for each friend + 1 extra for Maya", who: "neel", line: "Plates: one plate for each friend, and 1 extra plate for Maya. How many plates?",
    icon: "pr_plate", f: (m, d) => m + d + 1, sol: ["m", "+", "d", "+", "1"], tests: [[1, 1], [2, 1], [2, 3]], ans: "m + d + 1",
    h1: "First, one plate for each friend. All the friends are m + d.", h2: "\"Extra\" means add. Add 1 plate for me.", inact: "One plate for each friend, and 1 extra for me.",
    exp: "One plate for each friend is m + d plates. 1 extra plate for me means add 1. So the plates are <b>m + d + 1</b>.", pop: "The plates are m + d + 1." },
  { name: "Cushions", vals: ["m", "d", "2", "1"], sub: "monsters: 1 cushion each · dragons: 2 cushions each", who: "agni", line: "Cushions: each monster needs 1 cushion. Dragons are big, so each dragon needs 2 cushions. How many cushions in all?",
    icon: "pr_cushion", f: (m, d) => m + 2 * d, sol: ["m", "+", "2", "d"], tests: [[1, 1], [2, 1], [2, 3]], ans: "m + 2d",
    h1: "Monster cushions: 1 for each monster is m. Dragon cushions: 2 for each dragon.", h2: "2 for each dragon is 2d. \"In all\" means add m and 2d.", inact: "1 cushion for each monster, 2 for each dragon.",
    exp: "Monsters need m cushions. Dragons need 2 × d = 2d cushions. \"In all\" means add. So the cushions are <b>m + 2d</b>.", pop: "The cushions are m + 2d." },
  { name: "Laddoos", vals: ["m", "d", "3", "2"], sub: "monsters: 3 laddoos each · dragons: 2 laddoos each", who: "neel", line: "Laddoos: each monster gets 3 laddoos and each dragon gets 2 laddoos. How many laddoos in total?",
    icon: "pr_laddoo", f: (m, d) => 3 * m + 2 * d, sol: ["3", "m", "+", "2", "d"], tests: [[1, 1], [2, 1], [2, 3]], ans: "3m + 2d",
    h1: "Monster laddoos: 3 for each monster is 3m.", h2: "Dragon laddoos: 2 for each dragon is 2d. \"Total\" means add.", inact: "3 for each monster, 2 for each dragon. \"Total\" means add.",
    exp: "Monsters get 3m laddoos. Dragons get 2d laddoos. \"Total\" means add. So the laddoos are <b>3m + 2d</b>.", pop: "The laddoos are 3m + 2d." },
  { duel: true, name: "Neel's shortcut", sub: "3m + 2d – or – 5md", who: "neel", line: "I think 3m + 2d is the same as 5md. Am I right?",
    icon: "pr_laddoo", f: (m, d) => 3 * m + 2 * d, pre: ["5", "m", "d"], tests: [[1, 1], [2, 1], [2, 3]], ans: "No, not the same",
    h1: "m is the number of monsters. d is the number of dragons. Are they the same thing?", h2: "Look at the cauldron. With 2 monsters and 1 dragon, 3m + 2d gives 8, but 5md gives 10. Are they the same?", inact: "Are m and d the same number?",
    exp: "m and d are different numbers, so we cannot join 3m and 2d together. <b>3m + 2d</b> is already as short as it can be. So Neel is not right.", pop: "You caught Neel's mistake. 3m + 2d is not 5md." },
];
// who praises each right answer (from the script)
const PRAISE = ["agni:yes", "neel:super", "neel:great", "agni:well", "neel:yes", "agni:great", "neel:well", "agni:yes", "agni:super"];
// md in a card (a bubble writes it as one word in one box by itself)
const MD = `<span class="mtxt">m</span><span class="dtxt">d</span>`;
const OPS = ["+", "−", "×"];

// ---------- expression helpers ----------
const isNum = (t) => /^[0-9]$/.test(t), isVar = (t) => t === "m" || t === "d", isOp = (t) => OPS.includes(t);
/** the spell as a function of m and d, or null if it is not a finished spell */
export function compile(tokens) {
  if (!tokens.length) return null;
  let s = "", prev = null;
  for (const t of tokens) {
    if (rule(prev, t)) return null;
    if (prev && isVar(t) && (isNum(prev) || isVar(prev))) s += "*"; // 3m, md: a number or letter next to a letter multiplies
    s += t === "×" ? "*" : t === "−" ? "-" : t;
    prev = t;
  }
  if (isOp(prev)) return null;
  try { const fn = new Function("m", "d", "return " + s); fn(1, 1); return fn; } catch (e) { return null; }
}
/** what is wrong with putting t after prev (null when it is fine). The shelf refuses these as they are tapped:
 *  the number goes first (2m, never m2), and two terms always have a sign between them (never 4m4m) */
function rule(prev, t) {
  if (isOp(t)) return !prev ? "Start with a number or a letter." : isOp(prev) ? "Put a number or a letter after each sign." : null;
  if (isNum(t) && isVar(prev)) return "We write the number first, like 2m. Put a sign before the next number.";
  if (isNum(t) && isNum(prev)) return "One number at a time. Put a sign between two numbers.";
  if (isVar(t) && prev === t) return "Put a sign between them.";
  return null;
}
export function show(tokens) {
  let h = "", prev = null;
  for (const t of tokens) {
    const cls = t === "m" ? "lm" : t === "d" ? "ld" : isNum(t) ? "ln" : "lo";
    const gap = isOp(t) || (prev && isOp(prev)) ? "&thinsp;" : "";
    h += `${gap}<span class="${cls}">${t}</span>`;
    prev = t;
  }
  return h;
}
function same(fn, f) {
  for (let m = 2; m <= 7; m++) for (let d = 0; d <= 5; d++) if (fn(m, d) !== f(m, d)) return false;
  return true;
}

// ---------- scene ----------
let QB, bar, tray, brewBtn, undoBtn, tokens = [], cauldron, liquid, orbs = {}, testBox, runId = 0, brewing = false;
const CX = 735;
const flies = new Set();
function render() {
  // empty: a dashed slot shows where the first orb will land
  bar.innerHTML = tokens.length ? show(tokens) : `<span class="slot"></span><span class="ph">tap an orb</span>`;
  // nothing to brew yet: Brew! stays dim and still, so the first tap goes to the orbs
  if (brewBtn) brewBtn.disabled = !tokens.length;
  if (undoBtn) undoBtn.classList.toggle("off", !tokens.length);
}
/** the old test results belong to the old spell: they go as soon as the spell changes */
function edited() {
  runId++;
  if (testBox) { const t = testBox; testBox = null; gsap.to(t, { opacity: 0, duration: 0.2, onComplete: () => t.remove() }); }
}
function clearFlies() { for (const f of flies) { gsap.killTweensOf(f); f.remove(); } flies.clear(); }
function orbAt(t, cls, x, y) {
  const o = el("div", "orb " + cls, tray, { left: x, top: y }, t);
  onTap(o, () => addToken(t, o));
  orbs[t] = o;
  return o;
}
// an orb that can't go there: it shakes, and Maya says why (only in her bubble, never twice on screen)
function refuse(o, why) {
  sfx("bad");
  gsap.fromTo(o, { x: -8 }, { x: 0, duration: 0.45, ease: "elastic.out(1.2,.3)" });
  gsap.fromTo(bar, { borderColor: "#ff5c6c" }, { borderColor: "#ffc547", duration: 0.9 });
  if (!busy()) maya(why, "hint");
}
function addToken(t, o) {
  if (t === "⌫") { if (!tokens.length) return; tokens.pop(); sfx("tap"); edited(); render(); return; }
  if (tokens.length >= 9) return;
  const why = rule(tokens[tokens.length - 1], t);
  if (why) { refuse(o, why); return; }
  sfx("pop");
  edited();
  tray.classList.remove("wave"); // the child has found the orbs: stop the "tap me" wave
  gsap.fromTo(o, { scale: 0.85 }, { scale: 1, duration: 0.3, ease: "back.out(3)", overwrite: "auto", clearProps: "transform" });
  // a copy of the orb flies into the cauldron and is always cleaned up, even if the question ends mid-flight
  const fly = el("div", o.className.replace(/ glow| wave/g, "") + " fly", ui, { left: parseFloat(o.style.left), top: parseFloat(o.style.top), width: o.offsetWidth, height: o.offsetHeight, pointerEvents: "none" }, o.innerHTML);
  flies.add(fly);
  const into = camPt(CX, 640); // the cauldron moves with the camera, the orbs do not
  const gone = () => { flies.delete(fly); fly.remove(); };
  gsap.to(fly, { left: into.x - 52, top: into.y - 50, scale: 0.4, opacity: 0.2, duration: 0.45, ease: "power2.in", onComplete: () => { gone(); playFx("collect", CX, 640, { palette: "teal", scale: 2 }); }, onInterrupt: gone });
  setTimeout(gone, 900); // and it is gone in any case: a copy can never be left on the shelf or the cauldron
  tokens.push(t);
  render();
  gsap.fromTo(bar.lastElementChild, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" });
}
function buildScene() {
  sideChars();
  setFore(0);
  cauldron = img("p2_cauldron", world, { left: CX - 210, top: 510, width: 420 });
  groundShadow(CX, 842, 370); lightPool(CX, 820, 780); // the cauldron stands on the floor in a pool of firelight
  liquid = el("div", "liquid", world, { left: CX - 136, top: 556, width: 272, height: 56 }); // the brew's surface, tinted while it tests
  // the brew bubbles while Part 2 lasts; they stop (and the last ones go) with the cauldron
  brewing = true;
  const bub = () => {
    if (!brewing || !cauldron.isConnected) return;
    const b = el("div", "abs cbub", world, { left: CX - 90 + Math.random() * 180, top: 560, width: 14, height: 14, borderRadius: "50%", border: "3px solid #9ff0e6", background: "rgba(159,240,230,.25)" });
    gsap.to(b, { top: 470 - Math.random() * 60, left: "+=" + (Math.random() * 40 - 20), opacity: 0, scale: 1.6, duration: 1.6 + Math.random(), ease: "power1.out", onComplete: () => b.remove() });
    setTimeout(bub, 260);
  };
  bub();
  bar = el("div", "spellbar", ui, { left: CX - 280, top: 396, width: 560 });
  tray = el("div", "abs tray", ui, { left: 0, top: 0, width: 1, height: 1 });
  QB = qbox();
  brewBtn = button("Brew!", 1385, 842, tray);
  undoBtn = el("div", "undo", tray, { left: 1150, top: 804 }, "⌫");
  undoBtn.title = "Undo";
  onTap(undoBtn, () => addToken("⌫", undoBtn));
  gsap.set([tray, bar], { opacity: 0 });
  render();
}
/** the end of Part 2: the cauldron stops brewing, and its bubbles go with it */
function endBrew() {
  brewing = false;
  world.querySelectorAll(".cbub").forEach((b) => { gsap.killTweensOf(b); b.remove(); });
}
// the ingredient shelf: letters and numbers on glowing pads (top row), the + − × stones below
const TRAY_X = 1290, ROW_V = 584, ROW_O = 700;
function setTray(vals) {
  const key = vals ? vals.join() : "";
  if (key && tray.dataset.vals === key) return; // already on the shelf (shown during the lesson)
  tray.dataset.vals = key;
  Object.values(orbs).forEach((o) => { gsap.killTweensOf(o); o.remove(); });
  tray.querySelectorAll(".pad").forEach((p) => p.remove());
  orbs = {};
  if (!vals) return;
  const list = [...vals, ...OPS];
  const row = (items, y, P, sz) => items.forEach((t, i) => {
    const x = TRAY_X - ((items.length - 1) * P) / 2 + i * P;
    el("div", "pad", tray, { left: x - sz * 0.55, top: y + sz - 12, width: sz * 1.1, height: 26 });
    const o = orbAt(t, t === "m" ? "m" : t === "d" ? "d" : isNum(t) ? "n" : "op", x - sz / 2, y);
    // fixed size, set before it shows; it fades in rather than growing from nothing, so it can never be left small
    Object.assign(o.style, { width: sz + "px", height: sz + "px" });
    o.style.setProperty("--i", String(list.indexOf(t)));
    gsap.fromTo(o, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", clearProps: "transform" });
  });
  row(vals, ROW_V, vals.length > 3 ? 124 : 130, 104);
  row(OPS, ROW_O, 124, 98);
  tray.classList.add("wave");
}
function addD() {
  playFx("starfall", CX, 520, { palette: "ember", scale: 2.5 }); // orange stars for d
  const o = el("div", "orb d", ui, { left: CX - 43, top: 300 }, "d"); o.style.transform = "scale(1.6)"; gsap.from(o, { scale: 0, rotation: 180, duration: 0.6, ease: "back.out(2)" }); setTimeout(() => gsap.to(o, { opacity: 0, duration: 0.4, onComplete: () => o.remove() }), 2500); }

// one test of the spell: the brew flashes (teal when it works, red when not), and a bubble pops at the rim into that
// many friends. Everything stays below the spell, so the spell can always be read
const RIM = [-150, 0, 150];
async function bubbleTest(m, d, ok, i) {
  if (i === 0) gsap.fromTo(liquid, { opacity: 0.95, background: ok ? "radial-gradient(ellipse,#9ff0c0,#3fd29a 50%,rgba(63,210,154,0) 72%)" : "radial-gradient(ellipse,#ffb0c0,#ff4d6d 50%,rgba(255,77,109,0) 72%)" }, { opacity: 0, duration: 0.9 });
  const at = camPt(CX + RIM[i % 3], 556), b = el("div", "tbub", ui, { left: at.x - 26, top: at.y - 26, width: 52, height: 52 });
  await gsap.fromTo(b, { scale: 0.3 }, { top: at.y - 56, scale: 1.2, duration: 0.3, ease: "power1.out" });
  sfx("pop");
  const kids = [...Array(m).fill("gu_monster_green"), ...Array(d).fill("gu_dragon_teal")];
  const n = kids.length;
  // the friends fan out sideways and down, never up over the spell
  kids.forEach((k, j) => {
    const a = Math.PI * (0.05 + (0.9 * (j + 0.5)) / n), f = img(k, ui, { left: at.x - 20, top: at.y - 60, width: 40, height: 40 }, "abs tfriend");
    gsap.to(f, { x: -Math.cos(a) * 64, y: Math.sin(a) * 34, duration: 0.3, ease: "back.out(2)" });
    gsap.to(f, { opacity: 0, duration: 0.25, delay: 0.5, onComplete: () => f.remove() });
  });
  b.remove();
  await wait(0.35);
}
// a spell that works: a column of light rises from the cauldron (behind the spell and the plaque, so both stay
// readable), then the plan writes itself in gold ink and goes off to the progress pill
async function spellWorks(q) {
  const beam = el("div", "beam", world, { left: CX - 75, top: 70, width: 150, height: 520 });
  sfx("magic");
  gsap.fromTo(beam, { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.4, ease: "power2.out", transformOrigin: "50% 100%" });
  gsap.to(beam, { opacity: 0, duration: 0.5, delay: 0.7, onComplete: () => beam.remove() });
  if (!q.sol) return;
  const ink = el("div", "ink", ui, { left: CX - 270, top: 250, width: 540 }, `<span class="inkline"><b>${q.name}</b> = ${show(q.sol)}</span><i class="quill">✦</i>`);
  const line = ink.querySelector(".inkline"), quill = ink.querySelector(".quill");
  gsap.from(ink, { y: 16, opacity: 0, duration: 0.25 });
  sfx("chalk");
  await gsap.fromTo(line, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "none", onUpdate() { quill.style.left = 30 + this.progress() * (line.offsetWidth) + "px"; } });
  quill.remove();
  await wait(0.4);
  // the written line joins Neel's plan: the question count, top right (nothing else is there)
  await gsap.to(ink, { left: 1290, top: 70, scale: 0.25, opacity: 0, duration: 0.5, ease: "power2.in" });
  ink.remove();
}
// the cauldron tests the spell with three numbers of friends, all at once (about 2 s); the three result lines land
// over it together, green ticks or red crosses, for a right spell as well as a wrong one
async function testRun(fn, q) {
  const id = ++runId;
  testBox?.remove();
  const two = q.tests[0].length === 2;
  testBox = el("div", "tests", ui, { left: CX, top: 206 });
  playFx("mana", CX, 640, { palette: "plum", scale: 3 });
  // a rune circle glows on the floor under the cauldron while the spell is tested
  const runes = playFx("runes", CX, 830, { palette: "plum", scale: 3, parent: world });
  world.appendChild(cauldron);
  sfx("magic");
  gsap.fromTo(cauldron, { scaleY: 0.9 }, { scaleY: 1, duration: 0.5, ease: "elastic.out(1,.3)", transformOrigin: "50% 100%" });
  const res = q.tests.map(([m, d = 0]) => { const need = q.f(m, d), got = fn ? fn(m, d) : NaN; return { m, d, need, got, ok: need === got }; });
  const rows = res.map((r) => {
    const who = two ? `<img src="assets/gu_monster_green.webp">${r.m} <img src="assets/gu_dragon_teal.webp">${r.d}` : `<img src="assets/gu_monster_green.webp">${r.m}`;
    const c = el("div", "chip " + (r.ok ? "ok" : "no"), testBox, {}, `${who} → <img src="assets/${q.icon}.webp">${isNaN(r.got) ? "?" : r.got} ${r.ok ? "✅" : `❌ <small>need ${r.need}</small>`}`);
    gsap.set(c, { opacity: 0 });
    return c;
  });
  await Promise.all(res.map(async (r, i) => {
    await wait(i * 0.3);
    if (id !== runId) return;
    await bubbleTest(r.m, r.d, r.ok, i);
  }));
  if (id === runId) {
    gsap.fromTo(rows, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" });
    sfx(res.every((r) => r.ok) ? "good" : "bad");
  }
  runes.stop();
  const allOk = res.every((r) => r.ok);
  if (!allOk && !q.duel) { react("neel", "oops"); playFx("smoke", CX, 640, { scale: 2, palette: "plum", dur: 1.2 }); }
  return allOk;
}
// the shelf sleeps while someone is talking, and says so on the zone's tab
let tipNow = "";
function shelf(on) {
  lock(tray, !on);
  azTip(on ? tipNow : "🔒 Listen first…");
}
// the play things step aside for a story beat, and come back after it
function tools(on) {
  gsap.killTweensOf([tray, bar, QB.box]);
  gsap.to([tray, bar, QB.box], { opacity: on ? 1 : 0, duration: on ? 0.4 : 0.3 });
  actionZone(on);
  if (!on) { azTip(""); edited(); }
}

async function beat() {
  // Agni crashes in: dragon friends are coming too. Neel is there to hear it, and Maya answers: all three on stage
  tools(false);
  await trio("trioGame");
  const sp = SPOTS.trioGame;
  pose("agni", "crash_in", false);
  sfx("whoosh");
  await gsap.from(C.agni.box, { x: 500, y: -300, rotation: 20, duration: 0.7, ease: "power2.out" });
  playFx("smoke", sp.seats.agni, sp.y - 10, { scale: 2, dur: 0.8 });
  await say("agni", "Wait! My dragon friends are also coming!", { p: "cheer" });
  await maya("Then we need a second letter. m is for monsters, so let's use d for dragons. d is the number of Agni's dragon friends.", "cast");
  addD();
  playFx("cast", CX, 420, { palette: "gold", scale: 2 });
  const c = card(`<p><img src="assets/gu_monster_green.webp"> <span class="mtxt">m</span> = number of Neel's monster friends</p><p><img src="assets/gu_dragon_teal.webp"> <span class="dtxt">d</span> = number of Agni's dragon friends</p>`, { left: 470, top: 14, width: 760 }, "card lesson defs");
  await maya("And don't forget me. I will need 1 extra of some things too!", "happy");
  await gsap.to(c, { opacity: 0, duration: 0.3 }); c.remove();
}
// m + d or md? Neel asks, Maya checks with real numbers. The board appears with Maya's first line, and each row
// shows up as the line that says it starts, never before
async function example() {
  solo("duoGame");
  let c = null;
  const row = (h, cls = "") => {
    if (!c) c = card(`<div class="tag">Maya explains</div>`, { left: 415, top: 14, width: 640 }, "card lesson ex");
    const r = el("p", cls, c, {}, h); gsap.from(r, { y: 10, opacity: 0, duration: 0.35 }); sfx("chalk"); return r;
  };
  const pics = (k, n) => Array.from({ length: n }, () => `<img src="assets/${k}.webp">`).join("");
  const line = (text, p, onStart) => say("maya", text, { p, onStart });
  await say("neel", "Maya, m monster friends and d dragon friends are coming. How many friends are coming in all? Can I write md?", { p: "unsure" });
  await line("Let's check with real numbers. Let's say 3 monsters and 2 dragons come.", "explain", () => row(`${pics("gu_monster_green", 3)} <b>+</b> ${pics("gu_dragon_teal", 2)}`, "pics"));
  row(`Count them: 3 + 2 = 5 friends`);
  await wait(0.8);
  await line("\"In all\" means we put the two groups together, so we add. m monsters and d dragons make m + d friends.", "cast", () => row(colorMD("m + d = 3 + 2 = 5 friends ✓"), "ok"));
  await line("Remember, when a letter sits right next to another letter or a number, it means multiply. So md means m × d.", "explain", () => row(`${MD} = ${colorMD("m × d")} = 3 × 2 = 6 ✗`, "no"));
  await say("neel", "Oh! md gives 6, but only 5 friends came. So md is wrong here.", { p: "oops" });
  await line("Yes! When we put two groups together, we add, so we write m + d. We write md only when we multiply m by d.", "happy", () => {
    const last = row(colorMD("Friends in all = m + d"), "big");
    gsap.fromTo(last, { scale: 1 }, { scale: 1.08, yoyo: true, repeat: 3, duration: 0.35 });
  });
  await gsap.to(c, { opacity: 0, duration: 0.3 }); c.remove();
  solo("game"); // back to one speaker for the questions
  tools(true);
}
// the lesson before the first question: one idea per line, the card shows the same words Maya says
async function tutorial() {
  await afterTitle();
  const ir = iconRow(Q.filter((q) => q.icon), 330); // under the narrator's bubble, never behind it
  await say("nar", "Maya and Agni have made a list of things they need for the party, but Neel has still not decided how many friends are coming. Let's help Maya and Agni find the exact number of things they need.");
  ir.remove();
  const t = card(`<div class="tag">Maya explains</div><h2>Number of sweets</h2><table class="ttab"><tr><th>Number of friends</th><th>Sweets</th></tr><tr><td>1</td><td>1 × 2 = 2</td></tr><tr><td>2</td><td>2 × 2 = 4</td></tr><tr><td>3</td><td>3 × 2 = 6</td></tr></table>`, { left: 470, top: 14, width: 760 }, "card lesson");
  await maya("We have to write a plan for m monster friends. Let me show you how. For example, let's find the number of sweets. Each friend gets 2 sweets.", "explain");
  // the general row (m friends, m × 2 = 2m) and the rule come with Maya's line that says them
  await say("maya", "For m friends, it is m × 2. We write it in short as 2m. A number next to a letter means multiply.", { p: "cast", onStart: () => {
    const tr = el("tr", "mrow", t.querySelector("tbody") || t.querySelector("table"), {}, colorMD("<td>m</td><td>m × 2 = <b>2m</b></td>"));
    gsap.fromTo(tr, { opacity: 0 }, { opacity: 1, duration: 0.4 }); sfx("chalk");
    const rule = el("p", "rule", t, {}, colorMD("2m means 2 × m: <b>a number next to a letter means multiply</b>"));
    gsap.from(rule, { y: 10, opacity: 0, duration: 0.35, delay: 1.6 });
  } });
  t.innerHTML = `<div class="tag">Maya explains</div><h2>Word clues</h2>`;
  const row = (h) => () => { const r = el("p", "clue", t, {}, h); gsap.from(r, { y: 10, opacity: 0, duration: 0.35 }); sfx("chalk"); };
  await say("maya", "Some words tell us to add: and, more, extra, plus, total, in all.", { p: "explain", onStart: row(`<b>+ add:</b> and, more, extra, plus, total, in all`) });
  await say("maya", "Some words tell us to multiply: each, every, per, times.", { p: "explain", onStart: row(`<b>× multiply:</b> each, every, per, times`) });
  await say("maya", "Some words tell us to take away: less, fewer, minus, left, broke, gone, said no.", { p: "explain", onStart: row(`<b>− take away:</b> less, fewer, minus, left, broke, gone, said no`) });
  // no word box stays on screen any more (Draft 2): Maya says the clue word in her hint when it helps
  await maya("Let's write the plan!", "happy");
  gsap.to(t, { opacity: 0, duration: 0.3, onComplete: () => t.remove() });
  // the spell bar and the first question's orbs are on screen (asleep) while Maya talks about them
  setTray(Q[0].vals);
  gsap.to([tray, bar], { opacity: 1, duration: 0.4 }); // not the question card yet: it has no question
  actionZone(true);
  shelf(false);
  // the party plan, written as spells: the cauldron tries each one with different numbers of friends
  await maya("Let's write each plan as a magic spell. The cauldron will test it with different numbers of friends.", "cast");
  await maya("Tap the orbs to brew a spell. Then tap <b>Brew!</b> and the cauldron will test it.", "explain");
}

export async function runPart2(start = 1) {
  buildScene();
  const QS = Q.filter((q) => q.icon);
  checklist(QS);
  for (let i = 0; i < start - 1; i++) checkDone(i);
  if (start <= 1) await tutorial();
  tools(true);
  lock(tray);

  let qi = 0;
  for (const q of Q) {
    if (q.beat) { if (qi >= start - 1) await beat(); continue; }
    if (q.example) { if (qi >= start - 1) await example(); continue; }
    if (qi < start - 1) { qi++; continue; }
    checkCur(qi);
    setAnswer(q.ans);
    tokens = q.pre ? [...q.pre] : [];
    edited(); clearFlies();
    render();
    setTray(q.duel ? null : q.vals);
    undoBtn.style.display = q.duel ? "none" : "";
    gsap.set(brewBtn, { autoAlpha: 1 });
    QB.show(q.name, q.sub);
    camFocus(CX, 640, 1.02);
    tipNow = q.pre ? "Tap Brew! to test Neel's spell" : "Tap the orbs, then Brew!";
    // the shelf sleeps while the question is read, and wakes when it is the child's turn
    shelf(false);
    await say(q.who, q.line, { p: q.who === "neel" && q.pre ? "happy" : undefined }); // Neel is sure of himself
    shelf(true);
    // the very first question: a hand shows the first tap
    if (qi === 0 && !tokens.length && orbs.m && tray.classList.contains("wave")) pointHand(parseFloat(orbs.m.style.left) + 50, parseFloat(orbs.m.style.top) + 55, 2.4);
    let tries = 0, solved = false, testedPre = false, revealed = false;
    const iw = idleWatch(18, () => maya("Take your time. " + q.inact, "hint"));
    iw.open();
    const brewTap = () => new Promise((r) => (brewBtn.onpointerdown = (e) => { e.stopPropagation(); brewBtn.onpointerdown = null; r(); }));
    if (q.duel) {
      brewBtn.classList.add("pulse");
      await brewTap();
      iw.pause(); shelf(false);
      brewBtn.classList.remove("pulse");
      await testRun(compile(tokens), q);
      await say("neel", "Hmm… it worked for 1 and 1. But not for the others!");
      brewBtn.disabled = true;
      gsap.set(brewBtn, { autoAlpha: 0 }); // only the two choices in the panel
      azTip("Is 3m + 2d the same as 5md?");
      // centred on their spots with xPercent (not a CSS translate, which a wiggle would fold away and move the button)
      const yes = el("div", "choice", ui, { left: 1290, top: 640 }, "Yes, the same");
      const no = el("div", "choice", ui, { left: 1290, top: 760 }, "No, not the same");
      gsap.set([yes, no], { xPercent: -50, yPercent: -50 });
      let pickNow = null;
      onTap(yes, () => pickNow && pickNow("y")); onTap(no, () => pickNow && pickNow("n"));
      while (!solved) {
        lock([yes, no], false); iw.open();
        const pick = await new Promise((r) => (pickNow = r));
        pickNow = null; iw.pause(); lock([yes, no]);
        if (pick === "n") { solved = true; break; }
        tries++; sfx("bad"); react("neel", "oops");
        // the wrong button stays where it is, with a cross on it while Maya helps
        yes.classList.add("wrong");
        const x = el("div", "nope", yes, {}, "✕");
        gsap.fromTo(yes, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2,.3)" });
        if (tries < 3) await maya("Not yet. Try again. " + (tries === 1 ? q.h1 : q.h2), "hint");
        else { no.classList.add("answer"); pointHand(1290 + 60, 760 + 30, 2); await maya(`Let's see the answer together. The answer is ${q.ans}. ` + q.exp, "explain"); revealed = solved = true; }
        x.remove(); yes.classList.remove("wrong");
      }
      yes.remove(); no.remove();
      // m and d orbs try to join… and bounce apart
      const a = el("div", "orb m", ui, { left: CX - 200, top: 300 }, "3m"), b = el("div", "orb d", ui, { left: CX + 120, top: 300 }, "2d");
      a.style.fontSize = b.style.fontSize = "34px";
      await gsap.to(a, { left: CX - 90, duration: 0.5, ease: "power2.in" }); gsap.to(b, { left: CX + 10, duration: 0.5, ease: "power2.in" });
      await wait(0.45); sfx("boing"); playFx("hit", CX, 340, { scale: 2 });
      gsap.to(a, { left: CX - 260, rotation: -30, duration: 0.6, ease: "back.out(2)" }); await gsap.to(b, { left: CX + 180, rotation: 30, duration: 0.6, ease: "back.out(2)" });
      tokens = ["3", "m", "+", "2", "d"]; render();
      brewBtn.disabled = true; // the question is over: Brew! stays off
      await wait(0.4); a.remove(); b.remove();
    } else {
      while (!solved) {
        brewBtn.classList.add("pulse");
        await brewTap();
        iw.pause(); shelf(false); clearFlies();
        brewBtn.classList.remove("pulse");
        const fn = compile(tokens);
        if (!fn) { sfx("bad"); await maya("That spell is not finished. Every + − or × needs something on both sides.", "hint"); shelf(true); iw.open(); continue; }
        const ok = (await testRun(fn, q)) && same(fn, q.f);
        if (ok) { solved = true; await wait(2); break; } // the green ticks stay up for a moment before the praise
        if (q.pre && !testedPre) { testedPre = true; await say("neel", "Oh no! My spell gives the wrong number of candles!", { p: "oops" }); tokens = []; render(); tipNow = "Tap the orbs, then Brew!"; shelf(true); iw.open(); continue; }
        tries++;
        if (tries === 1) await maya("Not yet. Try again. " + q.h1, "hint");
        else if (tries === 2) { await maya("Not yet. Try again. " + q.h2, "hint"); q.sol.forEach((t) => orbs[t]?.classList.add("glow")); }
        else {
          revealed = true;
          // as Maya starts the answer, the red results go and the right spell is in the slot
          await maya(`Let's see the answer together. The answer is ${q.ans}. ` + q.exp, "explain", () => {
            edited(); clearFlies();
            tokens = [...q.sol]; render();
            gsap.fromTo(bar, { scale: 1.12, boxShadow: "0 0 40px #7dffa8" }, { scale: 1, boxShadow: "0 0 0px #7dffa8", duration: 0.8 });
          });
          await testRun(compile(tokens), q); // and the cauldron shows it works
          await wait(2);
          solved = true;
          break;
        }
        shelf(true); iw.open();
      }
    }
    iw.stop();
    lock(tray); azTip("");
    brewBtn.disabled = true; brewBtn.classList.remove("pulse");
    clearFlies();
    Object.values(orbs).forEach((o) => o.classList.remove("glow"));
    // success
    sfx("good");
    playFx("collect", CX, 470, { palette: "gold", scale: 3 });
    playFx("starfall", CX, 600, { palette: "plum", scale: 2.5 }); // the spell works: purple stars rain into the cauldron
    gsap.fromTo(bar, { scale: 1.15, boxShadow: "0 0 40px #ffd76a" }, { scale: 1, boxShadow: "0 0 0px #ffd76a", duration: 0.8 });
    edited(); // the test results make way for the plan being written
    // the plan writes itself and the stars fly while the friends already say well done: no silent wait
    const shown = spellWorks(q.duel ? {} : q);
    QB.sub(`<span class="win">${q.pop} ✓</span>`);
    const stars = award(tries, CX + 40, 560, 2);
    if (!revealed) { await praise(PRAISE[qi]); await maya("Correct! " + q.exp, "happy"); }
    await Promise.all([shown, stars]);
    checkDone(qi++);
    edited();
    closeBubble();
  }
  endBrew();
  gsap.to([tray, bar, cauldron, liquid, QB.box], { opacity: 0, duration: 0.5 });
  actionZone(false);
  await wait(0.5);
}
