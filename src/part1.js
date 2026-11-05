// PART 1 – Neel's Party List: the Friend Dial. Turn the dial, watch what changes, sort into Variable jar / Constant chest.
import { qbox, award, actionZone, azTip, setFore, gsap, el, img, ui, world, wait, sfx, say, card, popup, playFx, checklist, checkCur, checkDone, pointHand, setDim, onTap, react, toStage, closeBubble, C, camFocus, lightPool } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, mayaOut, praise, idleWatch } from "./common.js";

const ITEMS = [
  { name: "Number of friends", sub: "Neel has not decided yet.", icon: "gu_monster_green", f: (n) => n, ans: "v", who: "neel", line: "Number of friends coming to the party.",
    h1: "Has Neel decided how many friends will come?", h2: "It can be 5. It can be 10. Is it the same every time?",
    exp: "Neel has not decided yet. It can be 5 or 10. So the number of friends is a <span class=v>variable</span>.", pop: "The number of friends is a <b>variable</b>.", inact: "Take your time. Has Neel decided yet?" },
  { name: "Number of cakes", sub: "One big cake, however many friends come.", icon: "pr_cake", f: () => 1, ans: "c", who: "neel", line: "Number of cakes. I will cut one big cake, however many friends come.",
    h1: "Read it again: one big cake, however many friends come.", h2: "5 friends: 1 cake. 10 friends: still 1 cake. Does it change?",
    exp: "There is always 1 big cake, however many friends come. So the number of cakes is a <span class=c>constant</span>.", pop: "The number of cakes is a <b>constant</b>.", inact: "One big cake for everyone." },
  { name: "Number of plates", sub: "One plate for each friend.", icon: "pr_plate", f: (n) => n, ans: "v", who: "agni", line: "Number of plates. One plate for each friend.",
    h1: "If more friends come, do we need more plates?", h2: "5 friends need 5 plates. 10 friends need 10 plates.",
    exp: "One plate for each friend. If the friends change, the plates change too. So the number of plates is a <span class=v>variable</span>.", pop: "The number of plates is a <b>variable</b>.", inact: "One plate for each friend." },
  { name: "Number of lamps", sub: "The hall has 6 lamps.", icon: "pr_lamp", f: () => 6, ans: "c", who: "agni", line: "Number of lamps in the hall. The hall has 6 lamps.",
    h1: "Does the hall get more lamps when more friends come?", h2: "5 friends: 6 lamps. 8 friends: still 6 lamps.",
    exp: "The hall always has 6 lamps. It does not depend on the friends. So the number of lamps is a <span class=c>constant</span>.", pop: "The number of lamps is a <b>constant</b>.", inact: "Count the lamps as you turn the dial." },
  { name: "Sweets in one box", sub: "Every box has 10 sweets.", icon: "pr_sweet", f: () => 10, ans: "c", who: "neel", line: "Number of sweets in one box. Every box has 10 sweets.",
    h1: "Read it again: every box has 10 sweets.", h2: "Turn the dial. Does one box ever get more sweets?",
    exp: "Every box has 10 sweets. It never changes. So the sweets in a box is a <span class=c>constant</span>.", pop: "Sweets in one box is a <b>constant</b>.", inact: "Every box has 10 sweets." },
  { name: "Boxes of sweets", sub: "Enough boxes for all the friends.", icon: "pr_sweet_box", f: (n) => Math.ceil(n / 2), ans: "v", who: "neel", line: "Number of boxes of sweets. I need enough sweets for all my friends.",
    h1: "More friends need more sweets. Do they need more boxes?", h2: "Turn the dial up. Watch the boxes.",
    exp: "If more friends come, Neel needs more boxes. So the number of boxes is a <span class=v>variable</span>.", pop: "The number of boxes is a <b>variable</b>.", inact: "Watch the boxes as the friends change." },
  { name: "Balloons on the door", sub: "10 balloons to decorate the door.", icon: "pr_balloon", f: () => 10, ans: "c", who: "agni", line: "Number of balloons on the door. Neel puts 10 balloons on the door.",
    h1: "These balloons are only for the door. Do they depend on the friends?", h2: "2 friends: 10 balloons. 8 friends: still 10.",
    exp: "The door always gets 10 balloons. They do not depend on the friends. So this number is a <span class=c>constant</span>.", pop: "Balloons on the door: <b>constant</b>.", inact: "These balloons are for the door." },
  { name: "Balloons to give away", sub: "One balloon for each friend.", icon: "pr_balloon", hue: 140, f: (n) => n, ans: "v", who: "maya", line: "Number of balloons to give away. One balloon for each friend.",
    h1: "Now the balloons are for the friends. One for each friend.", h2: "Turn the dial. More friends, more balloons?",
    exp: "One balloon for each friend. If the friends change, these balloons change. Same balloons, but a different use! So this is a <span class=v>variable</span>.", pop: "Balloons to give away: <b>variable</b>.", inact: "One balloon for each friend." },
];

// read left to right: the dial (cause) beside the speaker, the display (effect) in the middle, jar + chest (decision) on the right
const ZONE = { x: 780, y: 190, w: 460, h: 280 };
const DIAL = { x: 610, y: 470, r: 105 }; // dial centre
const BIN = { v: [1175, 690], c: [1395, 710] }; // where things drop into the jar and the chest
let QB;
let friends = 4, dialTurns = 0, dialEl, knob, dialLbl, dialTip, flow, showBox, showCount, jar, chest, item;

function angleFor(n) { return (n - 2) * 40 - 120; }
function setFriends(n, quiet) {
  n = Math.max(2, Math.min(8, n));
  const changed = n !== friends;
  friends = n;
  gsap.to(knob, { rotation: angleFor(n), duration: 0.35, ease: "back.out(2)" });
  dialLbl.innerHTML = `<img src="assets/gu_monster_green.webp"> ${n}`;
  if (item) drawItem(changed && !quiet);
  if (changed && !quiet) { dialTurns++; sfx("pop"); }
}
function drawItem(flash) {
  const n = item.f(friends);
  const kids = [...showBox.children];
  const sz = n > 8 ? 70 : n > 4 ? 88 : n > 1 ? 110 : 190;
  const cols = n > 8 ? 5 : n > 4 ? 4 : Math.min(n, 3);
  while (kids.length < n) {
    const i = img(item.icon, showBox, { width: sz, height: sz, objectFit: "contain" });
    if (item.hue) i.style.filter = `hue-rotate(${item.hue}deg) saturate(2)`;
    else if (item.icon === "pr_balloon") i.style.filter = "hue-rotate(250deg) saturate(3)";
    kids.push(i);
    gsap.from(i, { scale: 0, duration: 0.35, ease: "back.out(2)" });
  }
  while (kids.length > n) { const k = kids.pop(); gsap.to(k, { scale: 0, duration: 0.2, onComplete: () => k.remove() }); }
  const rows = Math.ceil(n / cols);
  kids.forEach((k, i) => {
    const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    gsap.to(k, { width: sz, height: sz, left: ZONE.x + ZONE.w / 2 - (inRow * sz * 1.05) / 2 + c * sz * 1.05, top: ZONE.y + ZONE.h / 2 - (rows * sz) / 2 + r * sz, duration: 0.3 });
  });
  showCount.innerHTML = `<img src="assets/${item.icon}.webp" style="${item.hue ? `filter:hue-rotate(${item.hue}deg) saturate(2)` : item.icon === "pr_balloon" ? "filter:hue-rotate(250deg) saturate(3)" : ""}"> × ${n}`;
  if (flash) {
    const same = item.f(friends) === item.f(friends === 2 ? 3 : 2) && item.ans === "c";
    gsap.fromTo(showCount, { scale: 1.3, borderColor: same ? "#c9cbd8" : "#ffe066" }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    if (item.ans === "c") gsap.fromTo(showBox, { x: -5 }, { x: 0, duration: 0.3, ease: "elastic.out(1,.3)" });
  }
}

function buildScene() {
  sideChars();
  setFore(0);
  actionZone(true);
  // dial
  dialEl = el("div", "abs", ui, { left: DIAL.x - DIAL.r, top: DIAL.y - DIAL.r, width: 210, height: 210, cursor: "grab" });
  img("p1_dial_base", dialEl, { width: 210, height: 210, left: 0, top: 0 });
  knob = img("p1_dial_knob", dialEl, { width: 120, height: 120, left: 45, top: 45 });
  dialLbl = el("div", "dialBadge", ui, { left: DIAL.x - 50, top: DIAL.y - DIAL.r - 58 }, "");
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
    if (!drag) return;
    const p = toStage(e), a = Math.atan2(p.y - DIAL.y, p.x - DIAL.x);
    let da = ((a - drag.a0) * 180) / Math.PI;
    if (da > 180) da -= 360; if (da < -180) da += 360;
    const n = drag.n0 + Math.round(da / 40);
    if (Math.abs(da) > 12) drag.moved = true;
    if (n !== friends) setFriends(n);
  });
  dialEl.addEventListener("pointerup", () => {
    if (drag && !drag.moved) setFriends(friends >= 8 ? 2 : friends + 1);
    drag = null;
  });
  showBox = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  lightPool(ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h + 90, 760); // a warm pool of light on the floor under the display
  showCount = el("div", "itemCount", ui, { left: ZONE.x + ZONE.w / 2, top: ZONE.y + ZONE.h + 8 }, "");
  QB = qbox();
  // bins
  jar = el("div", "abs", ui, { left: BIN.v[0] - 75, top: 610, width: 150, height: 190, cursor: "pointer" });
  img("p1_variable_jar", jar, { width: 150, height: 190, left: 0, top: 0, objectFit: "contain" });
  el("div", "lbl binLbl", jar, { left: -10, top: 196, width: 170, color: "#ffe066" }, "VARIABLE");
  chest = el("div", "abs", ui, { left: BIN.c[0] - 85, top: 635, width: 170, height: 160, cursor: "pointer" });
  chest.im = img("p1_constant_chest_closed", chest, { width: 170, height: 160, left: 0, top: 0, objectFit: "contain" });
  el("div", "lbl binLbl", chest, { left: 0, top: 171, width: 170, color: "#d8dae6" }, "CONSTANT");
  gsap.set([jar, chest], { opacity: 0.6, pointerEvents: "none" });
}
function binsActive(on) {
  gsap.to([jar, chest], { opacity: on ? 1 : 0.6, duration: 0.3 });
  gsap.set([jar, chest], { pointerEvents: on ? "auto" : "none" });
  jar.classList.toggle("pulse", on); chest.classList.toggle("pulse", on);
}

function choose() {
  return new Promise((res) => {
    const h = (v) => () => { jar.onpointerdown = chest.onpointerdown = null; res(v); };
    jar.onpointerdown = (e) => { e.stopPropagation(); h("v")(); };
    chest.onpointerdown = (e) => { e.stopPropagation(); h("c")(); };
  });
}

async function success(it, tries = 0) {
  binsActive(false);
  const bin = it.ans === "v" ? jar : chest;
  const [bx, by] = BIN[it.ans];
  if (it.ans === "c") chest.im.src = "assets/p1_constant_chest_open.webp";
  sfx("good");
  const kids = [...showBox.children];
  kids.forEach((k, i) => {
    k.style.filter = it.ans === "v" ? "sepia(1) saturate(4) hue-rotate(-12deg) brightness(1.15)" : "grayscale(1) brightness(.9) contrast(1.1)";
    gsap.to(k, { left: bx - 30, top: by - 30, width: 60, height: 60, opacity: 0, duration: 0.55, delay: 0.25 + i * 0.04, ease: "power2.in" });
  });
  await wait(0.6);
  playFx(it.ans === "v" ? "collect" : "poof", bx, by + 40, { palette: it.ans === "v" ? "gold" : "stone", scale: 3 });
  gsap.fromTo(bin, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.4)" });
  await wait(0.4);
  if (it.ans === "c") chest.im.src = "assets/p1_constant_chest_closed.webp";
  showBox.innerHTML = "";
  QB.sub(`<span class="win">${it.pop} ✓</span>`);
  await award(tries, ZONE.x + ZONE.w / 2, 300, 1);
  await praise();
  await maya(it.exp, "happy");
  await mayaOut();
}
async function reject(choice) {
  const bin = choice === "v" ? jar : chest;
  sfx("boing");
  playFx("pow", BIN[choice][0], 680, { scale: 2, parent: ui });
  gsap.fromTo(bin, { rotation: -8 }, { rotation: 0, duration: 0.6, ease: "elastic.out(1.2,.2)" });
  gsap.fromTo([...showBox.children], { y: -20 }, { y: 0, duration: 0.5, ease: "bounce.out" });
  react("neel", "oops", 1.4);
}
async function demoDial() {
  for (const n of [3, 7, 3]) { setFriends(n); await wait(0.7); }
}

export async function runPart1(start = 1) {
  buildScene();
  checklist(ITEMS.map((i) => i.icon));
  for (let i = 0; i < start - 1; i++) checkDone(i);
  setDim(0.25);
  if (start <= 1) {
  await maya("Some numbers depend on how many friends come. If more friends come, they change. A number that can change is a <span class=v>variable</span>.", "explain");
  gsap.to(jar, { opacity: 1, scale: 1.12, yoyo: true, repeat: 1, duration: 0.4 });
  playFx("collect", BIN.v[0], 720, { palette: "gold", parent: ui });
  await maya("Some numbers stay the same, however many friends come. A number that stays the same is a <span class=c>constant</span>.", "cast");
  gsap.to(chest, { opacity: 1, scale: 1.12, yoyo: true, repeat: 1, duration: 0.4 });
  playFx("poof", BIN.c[0], 760, { palette: "stone", parent: ui });
  await maya("Turn the magic dial to change the friends. Watch what changes. Then put each thing in the jar or the chest!", "explain");
  await mayaOut();
  }
  gsap.to([dialEl, dialLbl, flow], { opacity: 1, duration: 0.4 });
  friends = 4; dialTurns = 0;

  for (let q = start - 1; q < ITEMS.length; q++) {
    const it = (item = ITEMS[q]);
    checkCur(q);
    setAnswer(it.ans === "v" ? "VARIABLE (jar)" : "CONSTANT (chest)");
    QB.show(it.name, it.sub);
    camFocus(ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h / 2);
    azTip("");
    setFriends(friends, true);
    drawItem(false);
    if (it.who === "maya") await maya(it.line, "explain");
    else await say(it.who, it.line, { auto: 0.1, wait: true });
    if (it.who === "maya") await mayaOut();
    // phase A: explore the dial
    dialTurns = 0;
    const need = q === 0 ? 2 : 1;
    gsap.to(dialTip, { opacity: 1, duration: 0.3 }); flow.classList.add("go");
    dialEl.classList.add("pulse");
    let hand = null;
    if (q === 0) hand = await pointHand(DIAL.x + 5, DIAL.y + 15, 0);
    const iw = idleWatch(14, async () => { await maya(it.inact + " Turn the dial.", "hint"); await mayaOut(); iw.arm(); });
    while (dialTurns < need) await wait(0.15);
    hand && hand.remove();
    await wait(0.6);
    dialEl.classList.remove("pulse");
    gsap.to(dialTip, { opacity: 0, duration: 0.3 }); flow.classList.remove("go");
    azTip("Did it change? Tap the <span style='color:#ffe066'>jar</span> or the <span style='color:#d8dae6'>chest</span>");
    binsActive(true);
    // phase B: choose
    let tries = 0;
    iw.stop();
    const iw2 = idleWatch(16, async () => { await maya(it.inact + " Tap Variable or Constant.", "hint"); await mayaOut(); iw2.arm(); });
    while (true) {
      const ch = await choose();
      iw2.arm();
      if (ch === it.ans) { iw2.stop(); azTip(""); await success(it, tries); break; }
      tries++;
      await reject(ch);
      if (tries === 1) { await maya("Not yet. Try again. " + it.h1, "hint"); await mayaOut(); }
      else if (tries === 2) { await maya("Not yet. Try again. " + it.h2, "hint"); await demoDial(); await mayaOut(); }
      else {
        iw2.stop();
        const b = [BIN[it.ans][0] - 10, BIN[it.ans][1] + 10];
        pointHand(b[0], b[1], 2.2);
        await maya("Let's see the answer together. " + it.exp, "explain");
        await mayaOut();
        azTip("");
        await success({ ...it, exp: "Now you know! Let's check the next thing." }, 3);
        break;
      }
    }
    checkDone(q);
    setDim(Math.max(0, 0.25 - (q + 1) * 0.03));
    closeBubble();
  }
  item = null;
  gsap.to([dialEl, dialLbl, dialTip, flow, jar, chest, showCount, QB.box], { opacity: 0, duration: 0.5 });
  actionZone(false);
  await wait(0.6);
}
