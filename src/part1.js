// PART 1 – Neel's Party List: the Friend Dial. Turn the dial, watch what changes, sort into Variable jar / Constant chest.
import { qbox, award, actionZone, azTip, afterTitle, setFore, gsap, el, img, ui, world, wait, sfx, say, playFx, checklist, checkCur, checkDone, pointHand, setDim, toStage, closeBubble, camFocus, lightPool, lock, speakAgain } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, praise, idleWatch, iconRow } from "./common.js";

const ITEMS = [
  { name: "Number of friends", sub: "Neel has not decided yet.", icon: "gu_monster_green", f: (n) => n, there: (n) => `${n} friends`, ans: "v", who: "neel", line: "Number of friends coming to the party.",
    h1: "Has Neel decided how many friends will come?",
    exp: "Neel has not decided yet, so the number of friends can change. So the number of friends is a <span class=v>variable</span>.", pop: "The number of friends is a <b>variable</b>.", inact: "Has Neel decided yet?" },
  { name: "Number of cakes", sub: "1 big cake", icon: "pr_cake", f: () => 1, there: (n, s) => `there is ${s ? "still " : ""}1 big cake`, ans: "c", who: "neel", line: "Number of cakes. I will cut one big cake, no matter how many friends come.",
    h1: "Listen again: one big cake, no matter how many friends come.",
    exp: "There is always 1 big cake, no matter how many friends come. So the number of cakes is a <span class=c>constant</span>.", pop: "The number of cakes is a <b>constant</b>.", inact: "One big cake for everyone." },
  { name: "Number of plates", sub: "one plate for each friend", icon: "pr_plate", f: (n) => n, there: (n) => `Neel needs ${n} plates`, ans: "v", who: "agni", line: "Number of plates. One plate for each friend.",
    h1: "If more friends come, do we need more plates?",
    exp: "One plate for each friend. If the number of friends changes, the plates change too. So the number of plates is a <span class=v>variable</span>.", pop: "The number of plates is a <b>variable</b>.", inact: "One plate for each friend." },
  { name: "Number of lamps in the hall", sub: "6 lamps in the hall", icon: "pr_lamp", f: () => 6, there: (n, s) => `there are ${s ? "still " : ""}6 lamps in the hall`, ans: "c", who: "agni", line: "Number of lamps in the hall. The hall has 6 lamps.",
    h1: "Does the hall get more lamps when more friends come?",
    exp: "The hall always has 6 lamps. It does not depend on the friends. So the number of lamps is a <span class=c>constant</span>.", pop: "The number of lamps is a <b>constant</b>.", inact: "Does the hall get more lamps?" },
  { name: "Number of sweets in one box", sub: "every box has 10 sweets", icon: "pr_sweet", f: () => 10, there: (n, s) => `there are ${s ? "still " : ""}10 sweets in a box`, ans: "c", who: "neel", line: "Number of sweets in one box. Every box has 10 sweets.",
    h1: "Listen again: every box has 10 sweets.",
    exp: "Every box has 10 sweets. It never changes. So the number of sweets in a box is a <span class=c>constant</span>.", pop: "The number of sweets in a box is a <b>constant</b>.", inact: "Every box has 10 sweets." },
  { name: "Number of boxes of sweets", sub: "enough boxes for all friends", icon: "pr_sweet_box", f: (n) => Math.ceil(n / 5), there: (n) => (n === 1 ? "Neel needs 1 box" : `Neel needs ${n} boxes`), ans: "v", who: "neel", line: "Number of boxes of sweets. I need enough sweets for all my friends.",
    h1: "More friends need more sweets. Do they need more boxes?",
    exp: "If more friends come, Neel needs more boxes. So the number of boxes is a <span class=v>variable</span>.", pop: "The number of boxes of sweets is a <b>variable</b>.", inact: "More friends, more boxes?" },
  { name: "Number of balloons on the door", sub: "10 balloons on the door", icon: "pr_balloon", f: () => 10, there: (n, s) => `there are ${s ? "still " : ""}10 balloons on the door`, ans: "c", who: "agni", line: "Number of balloons on the door. Neel puts 10 balloons on the door to decorate it.",
    h1: "These balloons are only for the door. Do they depend on the friends?",
    exp: "The door always gets 10 balloons. They do not depend on the friends. So this number is a <span class=c>constant</span>.", pop: "The number of balloons on the door is a <b>constant</b>.", inact: "These balloons are only for the door." },
  { name: "Number of balloons to give away", sub: "one balloon for each friend", icon: "pr_balloon", hue: 140, f: (n) => n, there: (n) => `Neel gives away ${n} balloons`, ans: "v", who: "maya", line: "Number of balloons to give away. Neel gives one balloon to each friend.",
    h1: "Now the balloons are for the friends. One for each friend.",
    exp: "One balloon for each friend. If the friends change, these balloons change. So this number is a <span class=v>variable</span>. Same balloons, but a different use!", pop: "The number of balloons to give away is a <b>variable</b>.", inact: "One balloon for each friend." },
];
// who praises each right answer (from the script)
const PRAISE = ["agni:yes", "agni:super", "neel:great", "neel:well", "agni:yes", "agni:super", "neel:great", "neel:well"];
const ANS = { v: "Variable (it can change)", c: "Constant (it stays the same)" };

// read left to right: the dial (cause) beside the speaker, the display (effect) in the middle, jar + chest (decision) on the right
const ZONE = { x: 780, y: 190, w: 460, h: 280 };
const DIAL = { x: 610, y: 470, r: 105 }; // dial centre
const BIN = { v: [1175, 690], c: [1395, 710] }; // where things drop into the jar and the chest
let QB;
let friends = 4, dialTurns = 0, dialEl, knob, dialLbl, dialTip, flow, showBox, showCount, jar, chest, item, jarLvl, vars = 0;

function angleFor(n) { return (n - 2) * 40 - 120; }
// friends is the one number behind the dial, its badge, the things on display and their count chip
function setFriends(n, quiet) {
  n = Math.max(2, Math.min(8, n));
  const changed = n !== friends;
  friends = n;
  gsap.to(knob, { rotation: angleFor(n), duration: 0.35, ease: "back.out(2)" });
  dialLbl.innerHTML = `<img src="assets/gu_monster_green.webp"> ${n}`;
  if (item) drawItem(changed && !quiet);
  if (changed && !quiet) { dialTurns++; sfx("pop"); }
}
const tint = (it) => (it.hue ? `hue-rotate(${it.hue}deg) saturate(2)` : it.icon === "pr_balloon" ? "hue-rotate(250deg) saturate(3)" : "");
function drawItem(flash) {
  const n = item.f(friends);
  // things on their way out are not counted, so the picture always shows exactly n
  const kids = [...showBox.children].filter((k) => !k._gone);
  const sz = n > 8 ? 70 : n > 4 ? 88 : n > 1 ? 110 : 190;
  const cols = n > 8 ? 5 : n > 4 ? 4 : Math.min(n, 3);
  while (kids.length < n) {
    const i = img(item.icon, showBox, { width: sz, height: sz, objectFit: "contain", left: ZONE.x + ZONE.w / 2, top: ZONE.y + ZONE.h / 2 });
    i.style.filter = tint(item);
    kids.push(i);
    gsap.from(i, { scale: 0, duration: 0.3, ease: "back.out(2)" });
  }
  while (kids.length > n) { const k = kids.pop(); k._gone = true; gsap.killTweensOf(k); gsap.to(k, { scale: 0, opacity: 0, duration: 0.18, onComplete: () => k.remove() }); }
  const rows = Math.ceil(n / cols);
  kids.forEach((k, i) => {
    const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    gsap.to(k, { width: sz, height: sz, left: ZONE.x + ZONE.w / 2 - (inRow * sz * 1.05) / 2 + c * sz * 1.05, top: ZONE.y + ZONE.h / 2 - (rows * sz) / 2 + r * sz, duration: 0.3 });
  });
  showCount.innerHTML = `<img src="assets/${item.icon}.webp" style="filter:${tint(item)}"> × ${n}`;
  if (flash) {
    gsap.fromTo(showCount, { scale: 1.3 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    if (item.ans === "c") gsap.fromTo(showBox, { x: -5 }, { x: 0, duration: 0.3, ease: "elastic.out(1,.3)" });
  }
}

function buildScene() {
  sideChars();
  setFore(0);
  actionZone(true);
  // dial
  dialEl = el("div", "abs dial", ui, { left: DIAL.x - DIAL.r, top: DIAL.y - DIAL.r, width: 210, height: 210, cursor: "grab" });
  img("p1_dial_base", dialEl, { width: 210, height: 210, left: 0, top: 0 });
  knob = img("p1_dial_knob", dialEl, { width: 120, height: 120, left: 45, top: 45 });
  dialLbl = el("div", "dialBadge", ui, { left: DIAL.x - 50, top: DIAL.y - DIAL.r - 62 }, "");
  dialTip = el("div", "dialTip", ui, { left: DIAL.x, top: DIAL.y + DIAL.r + 12 }, "Turn the dial");
  // a gold arrow from the dial to the display: turning the dial changes what you see
  flow = el("div", "flowArrow", ui, { left: DIAL.x + DIAL.r + 14, top: ZONE.y + ZONE.h / 2 + 40 }, "");
  gsap.set([dialEl, dialLbl, dialTip, flow], { opacity: 0 });
  let drag = null;
  dialEl.dataset.tap = 1;
  dialEl.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    const p = toStage(e);
    drag = { a0: Math.atan2(p.y - DIAL.y, p.x - DIAL.x), n0: friends, moved: false };
    dialEl.setPointerCapture(e.pointerId);
  });
  dialEl.addEventListener("pointermove", (e) => {
    if (!drag || dialEl.classList.contains("locked")) return;
    const p = toStage(e), a = Math.atan2(p.y - DIAL.y, p.x - DIAL.x);
    let da = ((a - drag.a0) * 180) / Math.PI;
    if (da > 180) da -= 360; if (da < -180) da += 360;
    const n = drag.n0 + Math.round(da / 40);
    if (Math.abs(da) > 12) drag.moved = true;
    if (n !== friends) setFriends(n);
  });
  dialEl.addEventListener("pointerup", () => {
    if (drag && !drag.moved && !dialEl.classList.contains("locked")) setFriends(friends >= 8 ? 2 : friends + 1);
    drag = null;
  });
  showBox = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  lightPool(ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h + 90, 760); // a warm pool of light on the floor under the display
  showCount = el("div", "itemCount", ui, { left: ZONE.x + ZONE.w / 2, top: ZONE.y + ZONE.h + 8 }, "");
  QB = qbox();
  // bins: the jar or chest and its label are one tap target
  jar = el("div", "abs bin", ui, { left: BIN.v[0] - 90, top: 596, width: 180, height: 290, cursor: "pointer" });
  // golden light inside the glass: it rises a step with every variable the child puts in
  img("p1_variable_jar", jar, { width: 150, height: 190, left: 15, top: 14, objectFit: "contain" });
  const fill = el("div", "jarFill", jar, { left: 37, top: 84, width: 106, height: 88 }); // in front of the glass, as light
  jarLvl = el("div", "lvl", fill, {});
  vars = 0;
  el("div", "lbl binLbl", jar, { left: 0, top: 210, width: 180, color: "#ffe066" }, "VARIABLE<small>it can change</small>");
  chest = el("div", "abs bin", ui, { left: BIN.c[0] - 100, top: 596, width: 200, height: 290, cursor: "pointer" });
  chest.im = img("p1_constant_chest_closed", chest, { width: 170, height: 160, left: 15, top: 39, objectFit: "contain" });
  el("div", "lbl binLbl", chest, { left: 0, top: 210, width: 200, color: "#eef0f8" }, "CONSTANT<small>it stays the same</small>");
  lock([dialEl, jar, chest]);
}
/** which controls the child can use right now; the rest are visibly asleep */
function inputs({ dial = false, bins = false } = {}) {
  lock(dialEl, !dial);
  lock([jar, chest], !bins);
  jar.classList.toggle("pulse", bins); chest.classList.toggle("pulse", bins);
}

function choose() {
  return new Promise((res) => {
    const h = (v) => () => { jar.onpointerdown = chest.onpointerdown = null; res(v); };
    jar.onpointerdown = (e) => { e.stopPropagation(); h("v")(); };
    chest.onpointerdown = (e) => { e.stopPropagation(); h("c")(); };
  });
}

async function success(it, tries = 0, q = 0) {
  inputs();
  const bin = it.ans === "v" ? jar : chest;
  const [bx, by] = BIN[it.ans];
  if (it.ans === "c") chest.im.src = "assets/p1_constant_chest_open.webp";
  sfx("good");
  const kids = [...showBox.children].filter((k) => !k._gone);
  kids.forEach((k, i) => {
    k.style.filter = it.ans === "v" ? "sepia(1) saturate(4) hue-rotate(-12deg) brightness(1.15)" : "grayscale(1) brightness(.9) contrast(1.1)";
    gsap.to(k, { left: bx - 30, top: by - 30, width: 60, height: 60, opacity: 0, duration: 0.55, delay: 0.25 + i * 0.04, ease: "power2.in" });
  });
  await wait(0.6);
  playFx(it.ans === "v" ? "collect" : "poof", bx, by + 40, { palette: it.ans === "v" ? "gold" : "stone", scale: 3 });
  gsap.fromTo(bin, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.4)" });
  await wait(0.4);
  if (it.ans === "c") {
    // the lid snaps shut and the lock sparks
    chest.im.src = "assets/p1_constant_chest_closed.webp";
    sfx("knock");
    gsap.fromTo(chest.im, { scaleY: 0.86, scaleX: 1.08 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "elastic.out(1.2,.35)", transformOrigin: "50% 100%" });
    playFx("collect", bx, by - 10, { palette: "gold", scale: 2.2, parent: ui });
    const lk = el("div", "lockpop", chest, {}, "🔒");
    gsap.fromTo(lk, { y: 10, scale: 0.4, opacity: 0 }, { y: -30, scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.5)" });
    gsap.to(lk, { opacity: 0, y: -50, duration: 0.4, delay: 0.9, onComplete: () => lk.remove() });
  } else {
    vars++;
    gsap.to(jarLvl, { height: Math.min(100, vars * 25) + "%", duration: 0.8, ease: "elastic.out(1,.6)" });
    gsap.fromTo(jarLvl, { filter: "brightness(2)" }, { filter: "brightness(1)", duration: 0.9 });
  }
  showBox.innerHTML = "";
  QB.sub(`<span class="win">${it.pop} ✓</span>`);
  await award(tries, ZONE.x + ZONE.w / 2, 300, 1);
  if (tries >= 3) return; // Maya has just shown the answer
  await praise(PRAISE[q]);
  await maya("Correct! " + it.exp, "happy");
}
// a wrong pick: a small shake, a red glow and a cross on that bin. No bang: it is a "try again", not a prize
function wrongMark(choice) {
  const bin = choice === "v" ? jar : chest;
  sfx("bad");
  bin.classList.add("wrong");
  const x = el("div", "nope", bin, {}, "✕");
  gsap.from(x, { scale: 0, duration: 0.25, ease: "back.out(3)" });
  gsap.fromTo(bin, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2,.25)" });
  return () => { bin.classList.remove("wrong"); gsap.to(x, { opacity: 0, duration: 0.25, onComplete: () => x.remove() }); };
}
// the second clue uses numbers the child can see: Maya turns the dial herself and reads both values
async function liveClue(it) {
  const a = friends;
  let b = a <= 5 ? a + 3 : a - 3;
  if (it.ans === "v" && it.f(a) === it.f(b)) b = it.f(a) === it.f(2) ? 8 : 2; // a value where it really changes (boxes)
  await maya("Not yet. Try again. Watch the dial.", "hint");
  setFriends(b, true);
  gsap.fromTo([dialLbl, showCount], { scale: 1.25 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  await wait(0.8);
  // whole sentences, with the numbers on the dial (Draft 2): "When 2 friends come, there are 6 lamps. When 5 friends
  // come, there are still 6 lamps. Did the number change?"
  const k = it.ans === "c";
  await maya(it === ITEMS[0] ? `It was ${a} friends. Now it is ${b} friends. Did the number change?`
    : `When ${a} friends come, ${it.there(it.f(a))}. When ${b} friends come, ${it.there(it.f(b), k)}. Did the number change?`, "hint");
}

// Maya explains on the chalkboard with no speech bubble: the board writes her words as she says them,
// and each new idea wipes the board first, so only one idea is up at a time
async function chalkboard() {
  const b = el("div", "chalk", ui, { left: 470, top: 104, width: 950 }, `<div class="tag">Maya explains</div><div class="page"></div><div class="nx">tap ▶</div><div class="rp" title="Hear again">🔊</div>`);
  const page = b.querySelector(".page");
  let last = "";
  b.querySelector(".rp").onpointerdown = (e) => { e.stopPropagation(); sfx("tap"); speakAgain(last, "maya"); };
  gsap.from(b, { y: -30, opacity: 0, duration: 0.4 });
  const write = async (head, text, p, cls = "") => {
    if (page.children.length) { await gsap.to([...page.children], { opacity: 0, duration: 0.25 }); page.innerHTML = ""; }
    const h = el("h3", cls, page, {}, head);
    gsap.from(h, { opacity: 0, y: 8, duration: 0.3 }); sfx("chalk");
    last = text;
    await say("maya", text, { p, into: page });
  };
  await write("Variable and Constant", "Let's learn two new words: variable and constant.", "explain");
  gsap.fromTo(jar, { scale: 1 }, { scale: 1.12, yoyo: true, repeat: 1, duration: 0.4 });
  await write("VARIABLE", "A <span class=v>variable</span> is a number that can change.", "cast", "v");
  await write("Example of a variable", "The number of invitation cards is a variable. Neel gives one card to each friend. If 5 friends come, he needs 5 cards. If 10 friends come, he needs 10 cards.", "explain", "v");
  gsap.fromTo(chest, { scale: 1 }, { scale: 1.12, yoyo: true, repeat: 1, duration: 0.4 });
  await write("CONSTANT", "A <span class=c>constant</span> is a number that stays the same.", "cast", "c");
  await write("Example of a constant", "The number of tables is a constant. Neel has 1 table. If 5 friends come, there is 1 table. If 10 friends come, there is still 1 table.", "explain", "c");
  await gsap.to(b, { opacity: 0, y: -20, duration: 0.4 });
  b.remove();
}

export async function runPart1(start = 1) {
  buildScene();
  checklist(ITEMS);
  for (let i = 0; i < start - 1; i++) checkDone(i);
  setDim(0.25);
  if (start <= 1) {
    await afterTitle();
    const row = iconRow(ITEMS);
    await say("nar", "There are 8 things on Neel's party list. Let's check whether each one is a variable or a constant.");
    row.remove();
    await chalkboard();
    // the instruction follows the order of the activity: dial first, then the jar or the chest
    await maya("Now help Neel check his party list. Turn the dial to change the number of friends. Did the number change? Put it in the jar for Variable or the chest for Constant.", "explain");
  }
  gsap.to([dialEl, dialLbl, flow], { opacity: 1, duration: 0.4 });
  friends = 4; dialTurns = 0;

  for (let q = start - 1; q < ITEMS.length; q++) {
    const it = (item = ITEMS[q]);
    inputs();
    checkCur(q);
    setAnswer(it.ans === "v" ? "VARIABLE (jar)" : "CONSTANT (chest)");
    QB.show(it.name, it.sub);
    camFocus(ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h / 2, 1.02);
    azTip("");
    setFriends(friends, true);
    drawItem(false);
    await say(it.who, it.line);
    // phase A: explore the dial. The jar and the chest are visibly asleep, and say why when tapped
    dialTurns = 0;
    const need = q === 0 ? 2 : 1, left = () => need - dialTurns;
    const turnTip = () => (left() > 1 ? `Turn the dial ${left()} times` : "Turn the dial");
    inputs({ dial: true });
    azTip("🔒 Turn the dial first");
    jar._why = chest._why = () => maya(left() > 1 ? "Turn the dial two times." : need > 1 ? "Turn the dial one more time." : "Turn the dial first.", "hint");
    dialTip.textContent = turnTip();
    gsap.to(dialTip, { opacity: 1, duration: 0.3 }); flow.classList.add("go");
    dialEl.classList.add("pulse");
    let hand = null;
    if (q === 0) hand = await pointHand(DIAL.x + 5, DIAL.y + 15, 0);
    const iw = idleWatch(14, () => maya(it.inact + " Turn the dial.", "hint"));
    iw.open();
    while (dialTurns < need) { if (dialTip.textContent !== turnTip()) dialTip.textContent = turnTip(); await wait(0.15); }
    jar._why = chest._why = null;
    iw.stop();
    hand && hand.remove();
    await wait(0.5);
    dialEl.classList.remove("pulse");
    gsap.to(dialTip, { opacity: 0, duration: 0.3 }); flow.classList.remove("go");
    azTip("Did it change? Tap the jar or the chest"); // both words alike: neither colour may point at the answer
    // phase B: choose. Wrong once: a clue. Twice: a clue with the numbers on the dial. Three times: the answer
    let tries = 0;
    const iw2 = idleWatch(16, () => maya("Take your time. " + it.inact + " Tap Variable or Constant.", "hint"));
    inputs({ dial: true, bins: true });
    iw2.open();
    while (true) {
      const ch = await choose();
      iw2.pause();
      inputs();
      if (ch === it.ans) { azTip(""); await success(it, tries, q); break; }
      tries++;
      const clear = wrongMark(ch);
      if (tries === 1) await maya("Not yet. Try again. " + it.h1, "hint");
      else if (tries === 2) await liveClue(it);
      clear();
      if (tries >= 3) {
        const bin = it.ans === "v" ? jar : chest, [bx, by] = BIN[it.ans];
        bin.classList.add("answer");
        pointHand(bx - 10, by + 10, 2.4);
        await maya(`Let's see the answer together. The answer is ${ANS[it.ans]}. ` + it.exp, "explain");
        bin.classList.remove("answer");
        azTip("");
        await success(it, 3, q);
        break;
      }
      inputs({ dial: true, bins: true });
      iw2.open();
    }
    iw2.stop();
    checkDone(q);
    setDim(Math.max(0, 0.25 - (q + 1) * 0.03));
    closeBubble();
  }
  item = null;
  inputs();
  gsap.to([dialEl, dialLbl, dialTip, flow, jar, chest, showCount, QB.box], { opacity: 0, duration: 0.5 });
  actionZone(false);
  await wait(0.6);
}
