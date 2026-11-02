// PART 2 – Write the Party Plan: the Spell Cauldron. Brew a spell (expression) from orbs; the cauldron test-runs it.
import { qbox, colorMD, award, actionZone, azTip, host, setFore, gsap, el, img, ui, world, wait, sfx, say, card, popup, playFx, checklist, checkCur, checkDone, pointHand, onTap, react, C, closeBubble, enterChar, placeChar, hideChar, button, camFocus, camTo, camPt, groundShadow, lightPool } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, mayaOut, mayaIn, praise, idleWatch } from "./common.js";

const Q = [
  { name: "Chairs", tray: ["m","+","×","1","2"], sub: "One chair for each friend, and 1 extra chair for Neel.", who: "neel", line: "Chairs: one chair for each friend, and 1 extra chair for me. How many chairs for m friends?",
    icon: "pr_chair", f: (m) => m + 1, sol: ["m", "+", "1"], tests: [[1], [2], [3]],
    h1: "Look at the test. Each time, we take the number of friends and add 1.", h2: "Extra means add. Try m, then +, then 1.",
    exp: "One chair for each friend is m chairs. 1 extra chair for Neel means add 1. So the chairs are <b>m + 1</b>.", pop: "The chairs are m + 1" },
  { name: "Sweets", tray: ["m","+","×","3","1"], sub: "Each friend gets 3 sweets.", who: "agni", line: "Sweets: each friend gets 3 sweets. How many sweets for m friends?",
    icon: "pr_sweet", f: (m) => 3 * m, sol: ["3", "m"], tests: [[1], [2], [3]],
    h1: "Each time, we multiply the number of friends by 3.", h2: "Each means multiply. A number next to a letter means multiply: 3m.",
    exp: "Each friend gets 3 sweets, so we multiply: m × 3. We write it short as <b>3m</b>.", pop: "The sweets are 3m" },
  { name: "Cups", tray: ["m","+","−","2","1"], sub: "One cup for each friend. Oops! Neel broke 2 cups.", who: "agni", line: "Cups: one cup for each friend. Oops! Neel broke 2 cups. How many cups are left?",
    icon: "pr_cup_broken", f: (m) => m - 2, sol: ["m", "−", "2"], tests: [[3], [4], [5]],
    h1: "Neel had one cup for each friend, so m cups. Then 2 cups broke.", h2: "Broke means take away. Try m − 2.",
    exp: "There was one cup for each friend, so m cups. 2 cups broke, so we take away 2. Now there are <b>m − 2</b> cups.", pop: "The cups are m − 2" },
  { name: "Candles", tray: ["m","+","×","4","1"], sub: "4 candles for each friend. Neel wrote 4 + m. Is he right?", who: "neel", line: "Candles: 4 candles for each friend. I wrote 4 + m. Am I right? Tap Brew to test my spell!",
    icon: "pr_candle", f: (m) => 4 * m, sol: ["4", "m"], pre: ["4", "+", "m"], tests: [[1], [2], [3]],
    h1: "4 candles for each friend. Does each mean add or multiply?", h2: "Each means multiply. Clear Neel's spell and try 4m.",
    exp: "4 candles for each friend means 4 × m, which we write as <b>4m</b>. So Neel was not right.", pop: "The candles are 4m" },
  { name: "Balloons", tray: ["m","+","×","2","5"], sub: "2 balloons for each friend, and 5 more for the door.", who: "agni", line: "Balloons: 2 balloons for each friend, and 5 more for the door. How many balloons?",
    icon: "pr_balloon", f: (m) => 2 * m + 5, sol: ["2", "m", "+", "5"], tests: [[1], [2], [3]],
    h1: "Do it in two steps. First, balloons for the friends: 2 for each friend.", h2: "First 2m. Then add 5 for the door.",
    exp: "2 balloons for each friend is 2m. Then we add 5 for the door. So we need <b>2m + 5</b> balloons.", pop: "The balloons are 2m + 5" },
  { beat: true },
  { name: "Friends in all", tray: ["m","d","+","×","1"], sub: "m monster friends and d dragon friends.", who: "maya", line: "m monster friends and d dragon friends are coming. How many friends in all?",
    icon: "gu_dragon_teal", f: (m, d) => m + d, sol: ["m", "+", "d"], tests: [[1, 1], [2, 1], [2, 3]],
    h1: "In all means add the two groups.", h2: "Monsters plus dragons: m + d.",
    exp: "In all means add. m monsters and d dragons make <b>m + d</b> friends in all.", pop: "The friends in all are m + d" },
  { name: "Plates", tray: ["m","d","+","×","1"], sub: "One plate for each friend, and 1 extra plate for Maya.", who: "neel", line: "Plates: one plate for each friend, and 1 extra plate for Maya. How many plates?",
    icon: "pr_plate", f: (m, d) => m + d + 1, sol: ["m", "+", "d", "+", "1"], tests: [[1, 1], [2, 1], [2, 3]],
    h1: "First, one plate for each friend. All the friends are m + d.", h2: "m + d, then add 1 for Maya.",
    exp: "One plate for each friend is m + d plates. 1 extra for Maya means add 1. So the plates are <b>m + d + 1</b>.", pop: "The plates are m + d + 1" },
  { name: "Cushions", tray: ["m","d","+","2","1"], sub: "Each monster needs 1 cushion. Each dragon needs 2.", who: "agni", line: "Cushions: each monster needs 1 cushion. Dragons are big, so each dragon needs 2 cushions. How many in all?",
    icon: "pr_cushion", f: (m, d) => m + 2 * d, sol: ["m", "+", "2", "d"], tests: [[1, 1], [2, 1], [2, 3]],
    h1: "Monster cushions: 1 for each monster is m. Dragon cushions: 2 for each dragon.", h2: "m for monsters, 2d for dragons. Add them.",
    exp: "Monsters need m cushions. Dragons need 2d cushions. In all means add. So the cushions are <b>m + 2d</b>.", pop: "The cushions are m + 2d" },
  { name: "Laddoos", tray: ["m","d","+","3","2"], sub: "Each monster gets 3 laddoos. Each dragon gets 2.", who: "neel", line: "Laddoos: each monster gets 3 laddoos and each dragon gets 2 laddoos. How many in total?",
    icon: "pr_laddoo", f: (m, d) => 3 * m + 2 * d, sol: ["3", "m", "+", "2", "d"], tests: [[1, 1], [2, 1], [2, 3]],
    h1: "Monster laddoos: 3 for each monster is 3m.", h2: "3m for monsters, 2d for dragons. Total means add.",
    exp: "Monsters get 3m laddoos. Dragons get 2d laddoos. Total means add. So the laddoos are <b>3m + 2d</b>.", pop: "The laddoos are 3m + 2d" },
  { duel: true, name: "Neel's shortcut", sub: "Neel thinks 3m + 2d is the same as 5md.", who: "neel", line: "I think 3m + 2d is the same as 5md. Am I right? Tap Brew to test my spell!",
    icon: "pr_laddoo", f: (m, d) => 3 * m + 2 * d, pre: ["5", "m", "d"], tests: [[1, 1], [2, 1], [2, 3]],
    h1: "m is the number of monsters. d is the number of dragons. Are they the same thing?",
    exp: "m and d are different numbers, so we cannot join 3m and 2d together. <b>3m + 2d</b> is already as short as it can be. Neel is not right.", pop: "You caught Neel's mistake!" },
];

// ---------- expression helpers ----------
const isNum = (t) => /^[0-9]$/.test(t), isVar = (t) => t === "m" || t === "d", isOp = (t) => ["+", "×", "−"].includes(t);
export function compile(tokens) {
  if (!tokens.length) return null;
  let s = "", prev = null;
  for (const t of tokens) {
    if (prev && (isVar(t) && (isNum(prev) || isVar(prev)))) s += "*";
    if (prev && isNum(t) && isVar(prev)) return null;
    s += t === "×" ? "*" : t === "−" ? "-" : t;
    prev = t;
  }
  if (/^[*+]|[*+\-]$|[*+\-]{2}/.test(s)) return null;
  try { const fn = new Function("m", "d", "return " + s); fn(1, 1); return fn; } catch (e) { return null; }
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
let QB, bar, tray, brewBtn, undoBtn, tokens = [], cauldron, orbs = {}, testBox;
const CX = 735;
function render() {
  bar.innerHTML = tokens.length ? show(tokens) : `<span class="ph">your spell</span>`;
  // nothing to brew yet: Brew! stays dim and still, so the first tap goes to the orbs
  if (brewBtn) brewBtn.disabled = !tokens.length;
  if (undoBtn) undoBtn.classList.toggle("off", !tokens.length);
}
function orbAt(t, cls, x, y, label) {
  const o = el("div", "orb " + cls, tray, { left: x, top: y }, label ?? t);
  onTap(o, () => addToken(t, o));
  orbs[t] = o;
  return o;
}
function addToken(t, o) {
  if (t === "⌫") { tokens.pop(); sfx("tap"); render(); return; }
  if (tokens.length >= 9) return;
  sfx("pop");
  const r = o.getBoundingClientRect();
  const fly = el("div", o.className.replace(" glow", ""), ui, { left: parseFloat(o.style.left), top: parseFloat(o.style.top), pointerEvents: "none" }, o.innerHTML);
  const into = camPt(CX, 640); // the cauldron moves with the camera, the orbs do not
  gsap.to(fly, { left: into.x - 52, top: into.y - 50, scale: 0.4, duration: 0.45, ease: "power2.in", onComplete: () => { fly.remove(); playFx("collect", CX, 640, { palette: "teal", scale: 2 }); } });
  tokens.push(t);
  render();
  gsap.fromTo(bar.lastElementChild, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" });
}
function buildScene() {
  sideChars();
  setFore(0);
  cauldron = img("p2_cauldron", world, { left: CX - 210, top: 510, width: 420 });
  groundShadow(CX, 842, 370); lightPool(CX, 820, 780); // the cauldron stands on the floor in a pool of firelight
  const bub = () => {
    if (!cauldron.isConnected) return;
    const b = el("div", "abs", world, { left: CX - 90 + Math.random() * 180, top: 560, width: 14, height: 14, borderRadius: "50%", border: "3px solid #9ff0e6", background: "rgba(159,240,230,.25)" });
    gsap.to(b, { top: 470 - Math.random() * 60, left: "+=" + (Math.random() * 40 - 20), opacity: 0, scale: 1.6, duration: 1.6 + Math.random(), ease: "power1.out", onComplete: () => b.remove() });
    setTimeout(bub, 260);
  };
  bub();
  bar = el("div", "spellbar", ui, { left: CX - 280, top: 396, width: 560 });
  tray = el("div", "abs", ui, { left: 0, top: 0, width: 1, height: 1 });
  QB = qbox();
  brewBtn = button("Brew!", 1360, 800, tray);
  undoBtn = el("div", "undo", tray, { left: 1112, top: 762 }, "⌫");
  undoBtn.title = "Undo";
  onTap(undoBtn, () => addToken("⌫", undoBtn));
  gsap.set([tray, bar], { opacity: 0 });
  render();
}
function setTray(list) {
  Object.values(orbs).forEach((o) => o.remove());
  orbs = {};
  if (!list) return;
  const n = list.length, P = 112, x0 = 1290 - ((n - 1) * P) / 2 - 52;
  list.forEach((t, i) => {
    const o = orbAt(t, t === "m" ? "m" : t === "d" ? "d" : /\d/.test(t) ? "n" : "op", x0 + i * P, 610);
    gsap.fromTo(o, { scale: 0 }, { scale: 1, duration: 0.35, delay: i * 0.05, ease: "back.out(2)", immediateRender: true });
  });
}
function addD() {
  playFx("starfall", CX, 520, { palette: "ember", scale: 2.5 }); // orange stars for d
  const o = el("div", "orb d", ui, { left: CX - 43, top: 300 }, "d"); o.style.transform = "scale(1.6)"; gsap.from(o, { scale: 0, rotation: 180, duration: 0.6, ease: "back.out(2)" }); setTimeout(() => gsap.to(o, { opacity: 0, duration: 0.4, onComplete: () => o.remove() }), 2500); }

async function testRun(fn, q) {
  camTo({ x: CX, y: 620, s: 1.09, dur: q.tests.length * 0.55 + 0.8, ease: "power1.inOut" }); // lean in while the spell is tested
  testBox?.remove();
  const two = q.tests[0].length === 2;
  testBox = el("div", "chips", ui, { left: CX - 400, top: 300, width: 800 });
  playFx("mana", CX, 640, { palette: "plum", scale: 3 });
  // a rune circle glows on the floor under the cauldron while the spell is tested
  const runes = playFx("runes", CX, 830, { palette: "plum", scale: 3, parent: world });
  world.appendChild(cauldron);
  sfx("magic");
  gsap.fromTo(cauldron, { scaleY: 0.9 }, { scaleY: 1, duration: 0.5, ease: "elastic.out(1,.3)", transformOrigin: "50% 100%" });
  let allOk = true;
  for (const t of q.tests) {
    const [m, d = 0] = t, need = q.f(m, d), got = fn ? fn(m, d) : NaN, ok = need === got;
    allOk = allOk && ok;
    const who = two ? `<img src="assets/gu_monster_green.webp">${m} <img src="assets/gu_dragon_teal.webp">${d}` : `<img src="assets/gu_monster_green.webp">${m}`;
    const r = el("div", "chip " + (ok ? "ok" : "no"), testBox, {}, `${who} → <img src="assets/${q.icon}.webp">${isNaN(got) ? "?" : got} ${ok ? "✅" : `❌ <small>need ${need}</small>`}`);
    gsap.from(r, { scale: 0.5, opacity: 0, duration: 0.3, ease: "back.out(2)" });
    sfx(ok ? "pop" : "bad");
    await wait(0.55);
  }
  runes.stop();
  camFocus(CX, 640, 1.05, 0.8);
  if (!allOk) { react("neel", "oops", 1.6); playFx("smoke", CX, 640, { scale: 2, palette: "plum", dur: 1.2 }); }
  return allOk;
}

async function beat() {
  // Agni crashes in: dragon friends are coming too.
  for (const k of ["neel", "maya"]) hideChar(k, 0.1);
  placeChar("agni", 150, 885, 270, { p: "crash_in" });
  sfx("whoosh");
  host.cur = "agni";
  await gsap.from(C.agni.box, { x: -500, y: -300, rotation: -20, duration: 0.7, ease: "power2.out" });
  playFx("smoke", 150, 880, { scale: 2, dur: 0.8 });
  await say("agni", "Wait! My dragon friends are also coming!", { p: "cheer" });
  await maya("Then we need a second letter. m is for monsters, so let's use d for dragons. d is the number of Agni's dragon friends.", "cast");
  addD();
  playFx("cast", CX, 420, { palette: "gold", scale: 2 });
  await maya("And don't forget me. I will need 1 extra of some things too!", "happy");
  await mayaOut();
}

export async function runPart2(start = 1) {
  buildScene();
  checklist(Q.filter((q) => !q.beat).map((q) => q.icon));
  for (let i = 0; i < start - 1; i++) checkDone(i);
  if (start <= 1) {
  // Maya explains one idea per bubble; the lesson card (top centre) shows the same idea
  const tbl = card(`<h2>2 sweets each</h2><p>1 → 2 &nbsp; 2 → 4 &nbsp; 3 → 6</p>`, { left: 500, top: 14, width: 600 }, "card lesson");
  await maya("Now we write a plan for m monster friends. Each friend gets 2 sweets.", "explain");
  const row = (h) => { const r = el("p", "", tbl, {}, h); gsap.from(r, { y: 10, opacity: 0, duration: 0.35 }); };
  row(colorMD("m friends → m × 2 = 2m"));
  await maya("For m friends it is m × 2. We write it short as 2m. A number next to a letter means multiply.", "cast");
  tbl.innerHTML = `<h2>Word clues</h2>`;
  row(`<b>each</b> → ×`);
  await maya("Words give clues. <b>Each</b> means multiply.", "explain");
  row(`<b>extra</b> → +`);
  await maya("<b>Extra</b> means add.", "explain");
  row(`<b>broke</b> → −`);
  await maya("<b>Broke</b> means take away.", "explain");
  gsap.to(tbl, { opacity: 0, duration: 0.3, onComplete: () => tbl.remove() });
  await maya("Tap the orbs to brew a spell. Then tap <b>Brew!</b> and the cauldron will test it.", "explain");
  await mayaOut();
  }
  actionZone(true);
  gsap.to([tray, bar], { opacity: 1, duration: 0.4 });

  let qi = 0;
  for (const q of Q) {
    if (q.beat) { if (qi >= start - 1) await beat(); continue; }
    if (qi < start - 1) { qi++; continue; }
    checkCur(qi);
    setAnswer(q.duel ? "No, different" : q.sol.join(" "));
    tokens = q.pre ? [...q.pre] : [];
    render();
    setTray(q.duel ? null : q.tray);
    undoBtn.style.display = q.duel ? "none" : "";
    QB.show(q.name, q.sub);
    camFocus(CX, 640);
    azTip(q.pre ? "Tap Brew! to test Neel's spell" : "Tap the orbs, then Brew!");
    if (q.who === "maya") { await maya(q.line, "explain"); await mayaOut(); }
    else await say(q.who, q.line, { p: q.who === "neel" && q.pre ? "unsure" : undefined });
    let tries = 0, solved = false, testedPre = false;
    const iw = idleWatch(18, async () => { await maya("Take your time. " + q.h1, "hint"); await mayaOut(); iw.arm(); });
    if (q.duel) {
      brewBtn.classList.add("pulse");
      await new Promise((r) => (brewBtn.onpointerdown = (e) => { e.stopPropagation(); r(); }));
      brewBtn.classList.remove("pulse"); brewBtn.onpointerdown = null;
      await testRun(compile(tokens), q);
      await say("neel", "Hmm… it worked for 1 and 1. But not for the others!", { p: "unsure" });
      brewBtn.disabled = true;
      azTip("Is 3m + 2d the same as 5md?");
      const yes = el("div", "choice", ui, { left: 1030, top: 640 }, "Yes, same");
      const no = el("div", "choice", ui, { left: 1290, top: 640 }, "No, different");
      while (!solved) {
        const pick = await new Promise((r) => { onTap(yes, () => r("y")); onTap(no, () => r("n")); });
        if (pick === "n") solved = true;
        else { tries++; sfx("boing"); react("neel", "oops"); await maya(tries > 1 ? "Look at the test: 2 monsters and 1 dragon need 8, but 5md makes 10. They are different!" : "Not yet. " + q.h1, "hint"); await mayaOut(); }
      }
      yes.remove(); no.remove();
      // m and d orbs try to join… and bounce apart
      const a = el("div", "orb m", ui, { left: CX - 200, top: 300 }, "3m"), b = el("div", "orb d", ui, { left: CX + 120, top: 300 }, "2d");
      a.style.fontSize = b.style.fontSize = "34px";
      await gsap.to(a, { left: CX - 90, duration: 0.5, ease: "power2.in" }); gsap.to(b, { left: CX + 10, duration: 0.5, ease: "power2.in" });
      await wait(0.45); sfx("boing"); playFx("hit", CX, 340, { scale: 2 });
      gsap.to(a, { left: CX - 260, rotation: -30, duration: 0.6, ease: "back.out(2)" }); await gsap.to(b, { left: CX + 180, rotation: 30, duration: 0.6, ease: "back.out(2)" });
      tokens = ["3", "m", "+", "2", "d"]; render();
      await wait(0.4); a.remove(); b.remove();
    } else {
      while (!solved) {
        brewBtn.classList.add("pulse");
        await new Promise((r) => (brewBtn.onpointerdown = (e) => { e.stopPropagation(); r(); }));
        brewBtn.onpointerdown = null; brewBtn.classList.remove("pulse");
        iw.arm();
        const fn = compile(tokens);
        if (!fn) { sfx("boing"); playFx("pow", CX, 460, { scale: 2 }); await maya("That spell is not finished. Every + or × needs something on both sides.", "hint"); await mayaOut(); continue; }
        const ok = (await testRun(fn, q)) && same(fn, q.f);
        if (ok) { solved = true; break; }
        if (q.pre && !testedPre) { testedPre = true; await say("neel", "Oh no! My spell gives the wrong number of candles!", { p: "oops" }); tokens = []; render(); azTip("Tap the orbs, then Brew!"); continue; }
        tries++;
        if (tries === 1) { await maya("Not yet. Try again. " + q.h1, "hint"); await mayaOut(); }
        else if (tries === 2) { await maya("Not yet. " + q.h2, "hint"); q.sol.forEach((t) => orbs[t]?.classList.add("glow")); await mayaOut(); }
        else {
          await maya("Let's brew it together.", "cast");
          tokens = [];
          render();
          for (const t of q.sol) { const o = orbs[t]; pointHand(parseFloat(o.style.left) + 40, parseFloat(o.style.top) + 40, 0.6); addToken(t, o); await wait(0.75); }
          await testRun(compile(tokens), q);
          solved = true;
        }
      }
    }
    iw.stop();
    Object.values(orbs).forEach((o) => o.classList.remove("glow"));
    // success
    sfx("good");
    playFx("collect", CX, 470, { palette: "gold", scale: 3 });
    playFx("starfall", CX, 600, { palette: "plum", scale: 2.5 }); // the spell works: purple stars rain into the cauldron
    gsap.fromTo(bar, { scale: 1.15, boxShadow: "0 0 40px #ffd76a" }, { scale: 1, boxShadow: "0 0 0px #ffd76a", duration: 0.8 });
    popup(q.pop, 1.8);
    await award(tries, CX, 300, 2);
    await praise();
    await maya(q.exp, "happy");
    await mayaOut();
    checkDone(qi++);
    testBox?.remove(); testBox = null;
    closeBubble();
  }
  gsap.to([tray, bar, cauldron, QB.box], { opacity: 0, duration: 0.5 });
  actionZone(false);
  await wait(0.5);
}
