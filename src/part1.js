// PART 1 – Neel's Party List: the Friend Dial. Turn the dial, watch what changes, then tap Variable or Constant (review 2:
// plain buttons, no jar or chest). The party list stays in the top-right corner and ticks off each thing: the level's progress.
import { qbox, award, actionZone, azTip, afterTitle, setFore, gsap, el, img, ui, world, wait, sfx, say, playFx, pointHand, setDim, toStage, closeBubble, camFocus, lightPool, lock, markRight, markWrong } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, praise, idleWatch } from "./common.js";

const ITEMS = [
  { name: "Number of friends", sub: "The replies have not come yet.", icon: "gu_monster_green", f: (n) => n, there: (n) => `${n} friends`, ans: "v", who: "neel", line: "Number of friends coming to the party.",
    h1: "Do we know yet how many friends will come?",
    exp: "The replies have not come yet, so the number of friends can change. So the number of friends is a <span class=v>variable</span>.", pop: "The number of friends is a <b>variable</b>.", inact: "Have the replies come yet?" },
  { name: "Number of cakes", sub: "1 big cake", icon: "pr_cake", f: () => 1, there: (n, s) => `there is ${s ? "still " : ""}1 big cake`, ans: "c", who: "neel", line: "Number of cakes. I will cut one big cake, no matter how many friends come.",
    h1: "Listen again: one big cake, no matter how many friends come.",
    exp: "There is always 1 big cake, no matter how many friends come. So the number of cakes is a <span class=c>constant</span>.", pop: "The number of cakes is a <b>constant</b>.", inact: "One big cake for everyone." },
  { name: "Number of plates", sub: "one plate for each friend", icon: "pr_plate", f: (n) => n, there: (n) => `Neel needs ${n} plates`, ans: "v", who: "agni", line: "Number of plates. One plate for each friend.",
    h1: "If more friends come, do we need more plates?",
    exp: "One plate for each friend. If the number of friends changes, the plates change too. So the number of plates is a <span class=v>variable</span>.", pop: "The number of plates is a <b>variable</b>.", inact: "One plate for each friend." },
  { name: "Number of lamps in the hall", sub: "6 lamps in the hall", icon: "pr_lamp", f: () => 6, there: (n, s) => `there are ${s ? "still " : ""}6 lamps in the hall`, ans: "c", who: "agni", line: "Number of lamps in the hall. The hall has 6 lamps.",
    h1: "Does the hall get more lamps when more friends come?",
    exp: "The hall always has 6 lamps. It does not depend on the number of friends. So the number of lamps is a <span class=c>constant</span>.", pop: "The number of lamps is a <b>constant</b>.", inact: "Does the hall get more lamps?" },
  { name: "Number of sweets in one box", sub: "every box has 10 sweets", icon: "pr_sweet", f: () => 10, there: (n, s) => `there are ${s ? "still " : ""}10 sweets in a box`, ans: "c", who: "neel", line: "Number of sweets in one box. Every box has 10 sweets.",
    h1: "Listen again: every box has 10 sweets.",
    exp: "Every box has 10 sweets. It never changes. So the number of sweets in a box is a <span class=c>constant</span>.", pop: "The number of sweets in a box is a <b>constant</b>.", inact: "Every box has 10 sweets." },
  { name: "Number of boxes of sweets", sub: "enough boxes for all friends", icon: "pr_sweet_box", f: (n) => Math.ceil(n / 5), there: (n) => (n === 1 ? "Neel needs 1 box" : `Neel needs ${n} boxes`), ans: "v", who: "neel", line: "Number of boxes of sweets. I need enough sweets for all my friends.",
    h1: "More friends need more sweets. Do they need more boxes?",
    exp: "If more friends come, Neel needs more boxes. So the number of boxes is a <span class=v>variable</span>.", pop: "The number of boxes of sweets is a <b>variable</b>.", inact: "More friends, more boxes?" },
  { name: "Number of balloons on the door", sub: "10 balloons on the door", icon: "pr_balloon", f: () => 10, there: (n, s) => `there are ${s ? "still " : ""}10 balloons on the door`, ans: "c", who: "agni", line: "Number of balloons on the door. Neel puts 10 balloons on the door to decorate it.",
    h1: "These balloons are only for the door. Do they depend on the number of friends?",
    exp: "The door always gets 10 balloons. They do not depend on the number of friends. So this number is a <span class=c>constant</span>.", pop: "The number of balloons on the door is a <b>constant</b>.", inact: "These balloons are only for the door." },
  { name: "Number of balloons to give away", sub: "one balloon for each friend", icon: "pr_balloon", hue: 140, f: (n) => n, there: (n) => `Neel gives away ${n} balloons`, ans: "v", who: "maya", line: "Number of balloons to give away. Neel gives one balloon to each friend.",
    h1: "Now the balloons are for the friends. One for each friend.",
    exp: "One balloon for each friend. If the friends change, these balloons change. So this number is a <span class=v>variable</span>. Same balloons, but a different use!", pop: "The number of balloons to give away is a <b>variable</b>.", inact: "One balloon for each friend." },
];
// who praises each right answer (from the script)
const PRAISE = ["agni:yes", "agni:super", "neel:great", "neel:well", "agni:yes", "agni:super", "neel:great", "neel:well"];
const ANS = { v: "Variable (it can change)", c: "Constant (it stays the same)" };
// each thing's name on the party list
const SHORT = ["Friends", "Cakes", "Plates", "Lamps in the hall", "Sweets in one box", "Boxes of sweets", "Balloons on the door", "Balloons to give away"];
// the dial is shown with chairs first: one chair for each friend (not a thing on the list, so it gives no answer away)
const DEMO = { icon: "pr_chair", f: (n) => n, ans: "v" };

// read left to right: the dial (cause) beside the speaker, the display (effect) in the middle, the two buttons (decision) on the right
const ZONE = { x: 780, y: 190, w: 460, h: 280 };
// the things stand on a small party table under the display (the Part 3 table, drawn smaller): two rows on the tabletop,
// the back row a little higher. TB: the table's centre and the floor line under its feet
const TB = { cx: 925, foot: 588, k: 0.6 }; // far enough left that the tip over the buttons clears the table leg
const ROW = { back: TB.foot - 281 * TB.k + 4, front: TB.foot - 281 * TB.k + 30 }; // where the things in each row stand
const DIAL = { x: 572, y: 470, r: 105 }; // dial centre
const BTN = { v: [1160, 700], c: [1420, 700] }; // the centres of the Variable and Constant buttons
let QB;
let friends = 4, dialTurns = 0, dialEl, knob, dialLbl, dialTip, flow, showBox, showCount, btnV, btnC, item, list;

function angleFor(n) { return (n - 2) * 40 - 120; }
// friends is the one number behind the dial, its badge, the things on display and their count chip
function setFriends(n, quiet) {
  n = Math.max(2, Math.min(8, n));
  const changed = n !== friends;
  friends = n;
  gsap.to(knob, { rotation: angleFor(n), duration: 0.35, ease: "back.out(2)" });
  dialLbl.innerHTML = `<img src="assets/gu_monster_green.webp"> ${n} friends`; // the dial's value, said in words
  if (item) drawItem(changed && !quiet);
  if (changed && !quiet) { dialTurns++; sfx("pop"); }
}
const tint = (it) => (it.hue ? `hue-rotate(${it.hue}deg) saturate(2)` : it.icon === "pr_balloon" ? "hue-rotate(250deg) saturate(3)" : "");
function drawItem(flash) {
  const n = item.f(friends);
  // things on their way out are not counted, so the picture always shows exactly n
  const kids = [...showBox.children].filter((k) => !k._gone);
  const sz = n > 8 ? 70 : n > 4 ? 88 : n > 1 ? 110 : 190;
  const cols = n > 8 ? 5 : n > 4 ? 4 : n; // up to 4 stand in one row
  while (kids.length < n) {
    const i = img(item.icon, showBox, { width: sz, height: sz, objectFit: "contain", objectPosition: "50% 100%", left: TB.cx, top: ROW.front - sz });
    i.style.filter = tint(item);
    kids.push(i);
    gsap.from(i, { scale: 0, duration: 0.3, ease: "back.out(2)" });
  }
  while (kids.length > n) { const k = kids.pop(); k._gone = true; gsap.killTweensOf(k); gsap.to(k, { scale: 0, opacity: 0, duration: 0.18, onComplete: () => k.remove() }); }
  const rows = Math.ceil(n / cols);
  kids.forEach((k, i) => {
    const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    // one row stands at the front. Two rows: the back row is shifted half a place, so every thing peeks out and can be counted
    const back = rows > 1 && r === 0, foot = back ? ROW.back : ROW.front, w = sz * 1.05;
    gsap.to(k, { width: sz, height: sz, left: TB.cx - (inRow * w) / 2 + c * w + (back ? -w / 4 : rows > 1 ? w / 4 : 0), top: foot - sz, duration: 0.3 });
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
  dialLbl = el("div", "dialBadge", ui, { left: DIAL.x, top: DIAL.y - DIAL.r - 62 }, "");
  gsap.set(dialLbl, { xPercent: -50 }); // centred on the dial, however long the text
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
  lightPool(TB.cx, TB.foot - 10, 820); // a warm pool of light on the floor under the table
  img("pr_party_table_3d", world, { left: TB.cx - 462 * TB.k, top: TB.foot - 282 * TB.k, width: 961 * TB.k });
  showBox = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  showCount = el("div", "itemCount", ui, { left: TB.cx, top: ROW.front + 36 }, ""); // on the tablecloth, under the things
  QB = qbox();
  // two plain buttons (review 2): the word and what it means
  btnV = el("div", "vcbtn v", ui, { left: BTN.v[0] - 120, top: BTN.v[1] - 62, width: 240, height: 124 }, "Variable<small>it can change</small>");
  btnC = el("div", "vcbtn c", ui, { left: BTN.c[0] - 120, top: BTN.c[1] - 62, width: 240, height: 124 }, "Constant<small>it stays the same</small>");
  lock([dialEl, btnV, btnC]);
  buildList();
}
// Neel's party list as a list (review 2): coloured pictures and names. It is introduced big in the middle, then stays in
// the top-right corner as the level's progress (the speaker's bubble uses the left): the thing being checked is lit, a checked one gets a tick and its word
function buildList() {
  list = el("div", "plist", ui, { left: 1200, top: 20 }, `<h3>Neel's Party List</h3>` +
    ITEMS.map((it, i) => `<div class="pl"><img src="assets/${it.icon}.webp" style="filter:${tint(it)}"><span>${SHORT[i]}</span><b class="st"></b></div>`).join(""));
}
const rows = () => [...list.querySelectorAll(".pl")];
function listCur(q) { rows().forEach((r, i) => r.classList.toggle("cur", i === q)); }
function listDone(q, ans) {
  const r = rows()[q];
  r.classList.remove("cur"); r.classList.add("done");
  r.querySelector(".st").innerHTML = `✓ <i class="${ans}">${ans === "v" ? "Variable" : "Constant"}</i>`;
  gsap.fromTo(r.querySelector(".st"), { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" });
}
/** which controls the child can use right now; the rest are visibly asleep */
function inputs({ dial = false, bins = false } = {}) {
  lock(dialEl, !dial);
  lock([btnV, btnC], !bins);
  btnV.classList.toggle("pulse", bins); btnC.classList.toggle("pulse", bins);
}

function choose() {
  return new Promise((res) => {
    const h = (v) => () => { btnV.onpointerdown = btnC.onpointerdown = null; res(v); };
    btnV.onpointerdown = (e) => { e.stopPropagation(); h("v")(); };
    btnC.onpointerdown = (e) => { e.stopPropagation(); h("c")(); };
  });
}

async function success(it, tries = 0, q = 0) {
  inputs();
  const btn = it.ans === "v" ? btnV : btnC, [bx, by] = BTN[it.ans];
  sfx("good");
  markRight(btn);
  // the things on the table go into the right word
  const kids = [...showBox.children].filter((k) => !k._gone);
  kids.forEach((k, i) => gsap.to(k, { left: bx - 30, top: by - 30, width: 60, height: 60, opacity: 0, duration: 0.55, delay: 0.25 + i * 0.04, ease: "power2.in" }));
  await wait(0.6);
  playFx("collect", bx, by, { palette: "gold", scale: 2.4, parent: ui });
  listDone(q, it.ans);
  showBox.innerHTML = "";
  QB.sub(`<span class="win">${it.pop} ✓</span>`);
  await award(tries, ZONE.x + ZONE.w / 2, 300, 1);
  if (tries >= 3) return; // Maya has just shown the answer
  await praise(PRAISE[q]);
  await maya("Correct! " + it.exp, "happy");
}
// a wrong pick: a small shake, an orange glow and a cross on that button. No bang: it is a "try again", not a prize
function wrongMark(choice) { return markWrong(choice === "v" ? btnV : btnC); }
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

// Maya explains on the chalkboard with no speech bubble: the board writes her words as she says them. Each word has its
// own board (heading VARIABLE or CONSTANT): what it means, then an example that is acted out under the words (review 2)
async function chalkboard() {
  const b = el("div", "chalk", ui, { left: 420, top: 104, width: 760 }, /* beside the party list */ `<div class="tag">Maya explains</div><div class="page"></div>`);
  const page = b.querySelector(".page");
  gsap.from(b, { y: -30, opacity: 0, duration: 0.4 });
  const write = async (head, text, p, cls = "", onStart) => {
    if (head) {
      if (page.children.length) { await gsap.to([...page.children], { opacity: 0, duration: 0.25 }); page.innerHTML = ""; }
      const h = el("h3", cls, page, {}, head);
      gsap.from(h, { opacity: 0, y: 8, duration: 0.3 }); sfx("chalk");
    }
    await say("maya", text, { p, into: page, onStart });
  };
  await write("Variable and Constant", "Let's learn two new words: variable and constant.", "explain");
  gsap.fromTo(btnV, { scale: 1 }, { scale: 1.12, yoyo: true, repeat: 1, duration: 0.4 });
  await write("VARIABLE", "A <span class=v>variable</span> is a number that can change.", "cast", "v");
  await write(null, "The number of invitation cards is a variable. Neel gives one card to each friend. If 5 friends come, he needs 5 cards. If 10 friends come, he needs 10 cards.", "explain", "v", () => example(page, "v"));
  await wait(0.6);
  gsap.fromTo(btnC, { scale: 1 }, { scale: 1.12, yoyo: true, repeat: 1, duration: 0.4 });
  await write("CONSTANT", "A <span class=c>constant</span> is a number that stays the same.", "cast", "c");
  await write(null, "The number of tables is a constant. Neel has 1 table. If 5 friends come, there is 1 table. If 10 friends come, there is still 1 table.", "explain", "c", () => example(page, "c"));
  await wait(0.6);
  await gsap.to(b, { opacity: 0, y: -20, duration: 0.4 });
  b.remove();
}
// the example acted out under its words: friends come (5, then 10) and the cards come with them (a variable), or the one
// table stays one table (a constant). Each step starts when the board has written its number
const FRIEND = `<img src="assets/gu_monster_green.webp">`, CARD = `<i class="icard"></i>`, TABLE = `<img class="extab" src="assets/pr_party_table_3d.webp">`;
function example(page, kind) {
  const said = page.querySelector(".said:last-child");
  const s = el("div", "exstrip", page, {}, `<div class="exrow"><b class="exl"></b><div class="exi"></div></div><div class="exrow"><b class="exl"></b><div class="exi"></div></div>`);
  const [fr, th] = s.querySelectorAll(".exrow");
  const fill = (row, n, html, label) => {
    const box = row.querySelector(".exi"), have = box.children.length;
    for (let k = have; k < n; k++) gsap.from(el("span", "exk", box, {}, html), { scale: 0, duration: 0.25, delay: (k - have) * 0.07, ease: "back.out(2.5)" });
    row.querySelector(".exl").textContent = label;
    gsap.fromTo(row.querySelector(".exl"), { scale: 1.25 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  };
  const thing = kind === "v" ? (n) => fill(th, n, CARD, `${n} cards`) : () => fill(th, 1, TABLE, "1 table");
  atWord(said, "5", () => { fill(fr, 5, FRIEND, "5 friends"); thing(5); });
  atWord(said, "10", () => { fill(fr, 10, FRIEND, "10 friends"); thing(10); if (kind === "c") gsap.fromTo(th.querySelector(".exk"), { y: 0 }, { y: -10, yoyo: true, repeat: 1, duration: 0.25 }); });
}
/** run fn when the board has written the word (a tap that shows the whole line runs it at once) */
function atWord(box, word, fn) {
  const w = [...box.querySelectorAll(".w")].find((x) => x.textContent.trim() === word);
  if (!w) return fn();
  const t = setInterval(() => { if (!w.isConnected) clearInterval(t); else if (+getComputedStyle(w).opacity > 0.5) { clearInterval(t); fn(); } }, 80);
}
// the dial, shown before the child uses it (review 2): Maya turns it, and the chairs on the table follow it
async function dialDemo() {
  gsap.to([dialEl, dialLbl, flow], { opacity: 1, duration: 0.4 });
  item = DEMO;
  setFriends(4, true);
  drawItem(false);
  await maya("This is the friend dial. It shows how many friends are coming.", "explain");
  // the dial turns only while Maya says it: a line that ends early (a tap) stops the turning, so it never runs on into
  // the first question
  let turning = false;
  const turn = async () => {
    turning = true;
    lock(dialEl, false); // awake while Maya turns it
    pointHand(DIAL.x + 30, DIAL.y + 40, 4.4);
    for (const n of [5, 6, 7, 8, 6]) { await wait(0.75); if (!turning) return; setFriends(n); }
  };
  await maya("Watch the table: one chair for each friend. When the dial turns, the number of friends changes, and the number of chairs changes too.", "explain", () => { turn(); });
  turning = false;
  lock(dialEl);
  setFriends(4);
  await maya("So, if a number changes when the friends change, it is a <span class=v>variable</span>. If it stays the same, it is a <span class=c>constant</span>.", "explain");
  [...showBox.children].forEach((k) => gsap.to(k, { scale: 0, opacity: 0, duration: 0.25, onComplete: () => k.remove() }));
  showCount.innerHTML = "";
  item = null;
}

export async function runPart1(start = 1) {
  buildScene();
  for (let i = 0; i < start - 1; i++) listDone(i, ITEMS[i].ans);
  setDim(0.25);
  if (start <= 1) {
    await afterTitle();
    // the list comes in big in the middle while it is introduced, then moves to its corner
    const lr = list.getBoundingClientRect(), sr = document.querySelector("#stage").getBoundingClientRect(), k = sr.width / 1600;
    gsap.set(list, { x: 800 - (1200 + lr.width / k / 2), y: 450 - (20 + lr.height / k / 2), scale: 1.45 });
    gsap.from(list, { opacity: 0, duration: 0.4 });
    await say("nar", "There are 8 things on Neel's party list. Let's check whether each one is a variable or a constant.");
    await gsap.to(list, { x: 0, y: 0, scale: 1, duration: 0.7, ease: "power3.inOut" });
    await chalkboard();
    await dialDemo();
    // the instruction follows the order of the activity: dial first, then a button. The dial is on screen (asleep)
    // while Maya says so
    setFriends(friends, true);
    await maya("Now help Neel check his party list. Turn the dial and watch the table. Then tap Variable or Constant.", "explain");
  }
  gsap.to([dialEl, dialLbl, flow], { opacity: 1, duration: 0.4 });
  friends = 4; dialTurns = 0;

  for (let q = start - 1; q < ITEMS.length; q++) {
    const it = (item = ITEMS[q]);
    inputs();
    listCur(q);
    setAnswer(it.ans === "v" ? "VARIABLE" : "CONSTANT");
    QB.show(it.name, it.sub);
    camFocus(ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h / 2, 1.02);
    azTip("");
    setFriends(friends, true);
    drawItem(false);
    await say(it.who, it.line);
    // the dial is there to check with, never a gate (Draft 4): a child who already knows taps a button
    // at once; anyone can still turn the dial first and watch what changes
    dialTurns = 0;
    dialTip.textContent = "Turn the dial to check";
    gsap.to(dialTip, { opacity: 1, duration: 0.3 }); flow.classList.add("go");
    if (q === 0) dialEl.classList.add("pulse"); // the first time only, so the dial is noticed
    azTip("Tap Variable or Constant"); // both words alike: neither colour may point at the answer
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
      azTip("🔒 Listen first…"); // the buttons are asleep while Maya helps
      const clear = wrongMark(ch);
      if (tries === 1) await maya("Not yet. Try again. " + it.h1, "hint");
      else if (tries === 2) await liveClue(it);
      clear();
      if (tries >= 3) {
        const bin = it.ans === "v" ? btnV : btnC, [bx, by] = BTN[it.ans];
        bin.classList.add("answer");
        pointHand(bx - 10, by + 10, 2.4);
        await maya(`Let's see the answer together. The answer is ${ANS[it.ans]}. ` + it.exp, "explain");
        bin.classList.remove("answer");
        azTip("");
        await success(it, 3, q);
        break;
      }
      inputs({ dial: true, bins: true });
      azTip("Tap Variable or Constant");
      iw2.open();
    }
    iw2.stop();
    dialEl.classList.remove("pulse");
    gsap.to(dialTip, { opacity: 0, duration: 0.3 }); flow.classList.remove("go");
    setDim(Math.max(0, 0.25 - (q + 1) * 0.03));
    closeBubble();
  }
  item = null;
  inputs();
  gsap.to([dialEl, dialLbl, dialTip, flow, btnV, btnC, showCount, QB.box, list], { opacity: 0, duration: 0.5 });
  actionZone(false);
  await wait(0.6);
}
