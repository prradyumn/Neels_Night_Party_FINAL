// PART 3 – Neel Decides: the Magic Doors. Friends arrive, gold seals crack open to reveal numbers, items get delivered.
import { qbox, valPills, flank, spotOn, spotOff, host, hostSwap, hideChar, TABLE_POP, onTable, toStage, award, actionZone, azTip, setFocus, setFore, gsap, el, img, ui, world, wait, sfx, say, card, popup, playFx, checklist, checkCur, checkDone, pointHand, onTap, react, C, closeBubble, farLayer, camFocus, camTo, camPt, groundShadow, lightPool } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, mayaOut, praise, idleWatch, iconRow, planScroll, wordHelp } from "./common.js";
import { show } from "./part2.js";

// door centres in far-layer coordinates (layer is 2000 wide, offset -200)
const DOORS = [[524, 423], [934, 423], [1326, 423]];
const DOOR_D = 226;
const Q = [
  { name: "Chairs", plan: ["m", "+", "1"], who: "maya", line: "Chairs = m + 1. m is 6. How many chairs?", means: "a chair for each friend, plus 1 extra", icon: "pr_chair", ask: "How many chairs?", opts: [7, 6, 16], ans: 7,
    work: "6 + 1 = 7", h1: "Put 6 in place of m.", h2: "Work out 6 + 1. What do you get?", inact: "Put 6 in place of m.", pop: "Neel needs 7 chairs.", exp: "Put 6 in place of m: 6 + 1 = 7. So Neel needs 7 chairs." },
  { name: "Sweets", plan: ["3", "m", "+", "5"], who: "agni", line: "Sweets = 3m + 5. m is 6. How many sweets?", means: "3 sweets for each friend, plus 5 extra for Agni", icon: "pr_sweet", ask: "How many sweets?", opts: [18, 41, 23], ans: 23,
    work: "3 × 6 + 5 = 18 + 5 = 23", h1: "3m means 3 × m. First work out 3m, then add Agni's 5 sweets.", h2: "3 × 6 = 18. Now work out 18 + 5.", inact: "First 3 times 6, then add 5.", pop: "Neel needs 23 sweets.", exp: "3m means 3 × m. Put 6 in place of m: 3 × 6 = 18. Then add Agni's 5 sweets: 18 + 5 = 23 sweets. 3m does not mean 36." },
  { name: "Balloons", plan: ["2", "m", "−", "3"], who: "neel", line: "Balloons = 2m − 3. m is 6. How many balloons are left?", means: "2 balloons for each friend, 3 burst", icon: "pr_balloon", ask: "How many balloons are left?", opts: [15, 9, 6], ans: 9,
    work: "2 × 6 − 3 = 12 − 3 = 9", h1: "First work out 2m. Then take away 3.", h2: "2 × 6 = 12. Now work out 12 − 3.", inact: "First 2 times 6, then take away 3.", pop: "Neel has 9 balloons.", exp: "2m is 2 × 6 = 12. Then take away the 3 burst balloons: 12 − 3 = 9 balloons." },
  { name: "Friends in all", plan: ["m", "+", "d"], who: "agni", line: "And 4 of my dragon friends are coming, so d is 4! Friends in all = m + d. How many friends are coming in all?", means: "monster friends plus dragon friends", arrive: { d: 4 }, icon: "gu_dragon_teal", ask: "How many friends in all?", opts: [10, 24, 2], ans: 10,
    work: "6 + 4 = 10", h1: "Put 6 in place of m and 4 in place of d.", h2: "Work out 6 + 4. What do you get?", inact: "Put 6 for m and 4 for d.", pop: "There are 10 friends in all.", exp: "Put 6 in place of m and 4 in place of d: 6 + 4 = 10 friends in all." },
  { name: "Plates", plan: ["m", "+", "d", "+", "1"], who: "maya", line: "Plates = m + d + 1. m is 6 and d is 4. How many plates?", means: "a plate for every friend, plus 1 for Maya", words: true, icon: "pr_plate", ask: "How many plates?", opts: [10, 25, 11], ans: 11,
    work: "6 + 4 + 1 = 11", h1: "m is 6 and d is 4. Don't forget the 1 extra plate for Maya.", h2: "Work out 6 + 4 + 1. What do you get?", inact: "Don't forget Maya's extra plate.", pop: "Neel needs 11 plates.", exp: "Put 6 in place of m and 4 in place of d: 6 + 4 + 1 = 11 plates." },
  { name: "Two friends said no", plan: ["6", "−", "2"], change: true, who: "neel", line: "Oh no! 2 of my friends said no. Now how many monster friends are coming?", means: "6 friends were coming, 2 said no", words: true, icon: "gu_monster_sad", ask: "How many monster friends are coming now?", opts: [8, 4, 6], ans: 4,
    work: "6 − 2 = 4", h1: "\"Said no\" means they are not coming. So we take away.", h2: "Work out 6 − 2. What do you get?", inact: "\"Said no\" means take away.", pop: "Now 4 monster friends are coming.", exp: "6 friends were coming. 2 said no, so we take away 2: 6 − 2 = 4. Now m is 4. See? m can change!" },
  { name: "Cushions", plan: ["m", "+", "2", "d"], who: "agni", line: "Now m is 4 and d is 4. Cushions = m + 2d. How many cushions?", means: "1 for each monster, 2 for each dragon", icon: "pr_cushion", ask: "How many cushions?", opts: [12, 10, 16], ans: 12,
    work: "4 + 2 × 4 = 4 + 8 = 12", h1: "First work out 2d. Then add m.", h2: "2 × 4 = 8. Now work out 4 + 8.", inact: "First 2 times d, then add m.", pop: "Neel needs 12 cushions.", exp: "2d is 2 × 4 = 8. Add m: 4 + 8 = 12 cushions." },
  { name: "Laddoos", plan: ["3", "m", "+", "2", "d"], who: "agni", line: "Yay! 3 more dragon friends said yes. Now d is 4 + 3 = 7, and m is still 4. Laddoos = 3m + 2d. How many laddoos?", means: "3 for each monster, 2 for each dragon", arrive: { d: 3 }, icon: "pr_laddoo", ask: "How many laddoos?", opts: [20, 16, 26], ans: 26,
    work: "3 × 4 + 2 × 7 = 12 + 14 = 26", h1: "m is still 4. d is now 7.", h2: "3 × 4 = 12 and 2 × 7 = 14. Now work out 12 + 14.", inact: "m is 4 and d is 7 now.", pop: "Neel needs 26 laddoos.", exp: "3m is 3 × 4 = 12. 2d is 2 × 7 = 14. Add them: 12 + 14 = 26 laddoos. The plan still works, even when the numbers change!" },
];
// who praises each right answer (from the script)
const PRAISE = ["neel:yes", "neel:super", "agni:great", "neel:well", "neel:yes", "agni:super", "neel:great", "neel:well"];

let doors = [], guests = [], vals = { m: 0, d: 0 }, uses = "m", valBox, bar, table, tableItems, QB, words;
// the table is the centre of the scene: guests on both sides, the answers under it
const TABLE3 = { cx: 800, top: 392, w: 740 }, TX = TABLE3.cx;
const PICK = { cx: 870, top: 690 }; // answer panel, clear of the speaker's side bubble
const MON = ["gu_monster_green", "gu_monster_pink", "gu_monster_blue"], DRA = ["gu_dragon_teal", "gu_dragon_red"];

function buildScene() {
  sideChars("table");
  setFocus("table"); // the back wall steps back: blurred and dimmed, so the guests and the table stand out
  actionZone(false);
  setFore(0);
  const L = farLayer();
  doors = DOORS.map(([x, y]) => {
    const d = img("p3_door_closed", L, { left: x - DOOR_D / 2, top: y - DOOR_D / 2, width: DOOR_D, height: DOOR_D, cursor: "pointer" });
    d.style.filter = "brightness(.55) saturate(.8)";
    d.dataset.x = x - 200; d.dataset.y = y;
    return d;
  });
  table = img("pr_party_table", world, { left: TX - TABLE3.w / 2, top: TABLE3.top, width: TABLE3.w });
  groundShadow(TX, TABLE3.top + 204, TABLE3.w * 0.96, 46); lightPool(TX, TABLE3.top + 175, 1500, 380);
  tableItems = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  QB = qbox();
  QB.box.classList.add("eq"); // the big equation bar
  bar = QB.plan; valBox = QB.vals;
  words = wordHelp(QB.box); words.style.display = "none"; // the word helper, on the questions that need it
}
function drawVals() { valPills(valBox, vals, uses); gsap.set(valBox, { autoAlpha: 1 }); }
function layoutGuests() { flank(guests, { cx: TX, gap: 220, sideW: 280 }); } // at the table ends, clear of the speaker
/** a prompt beside the speaker that stays up while the child works (not read aloud) */
const prompt = (t) => host.cur && say(host.cur, t, { wait: false, voice: false });
async function knockDoor(di, kind, count) {
  const d = doors[di];
  d.classList.add("pulse");
  gsap.to(d, { filter: "brightness(1.15) saturate(1.1) drop-shadow(0 0 24px rgba(255,197,71,.8))", duration: 0.4 });
  sfx("knock");
  const knock = setInterval(() => { sfx("knock"); gsap.fromTo(d, { x: -4 }, { x: 4, duration: 0.05, repeat: 5, yoyo: true }); }, 2600);
  // the door is the only thing on stage: the card, the bubble and the speaker step away, the camera moves in close
  const who = host.cur;
  closeBubble();
  gsap.to(QB.box, { opacity: 0, duration: 0.3 });
  if (who) hideChar(who, 0.3);
  setFocus(false, 0.6); // the door must be crisp while it opens
  const dx = +d.dataset.x, dy = +d.dataset.y;
  await camTo({ x: dx, y: dy, s: 1.3, tx: (800 - dx) * 0.25, ty: (450 - dy) * 0.25, dur: 1 });
  const dp = camPt(dx, dy, "far");
  spotOn(dp.x, dp.y, 150 * 1.3);
  const h = await pointHand(dp.x + 30, dp.y + 30, 0);
  await new Promise((r) => onTap(d, r));
  clearInterval(knock); h.remove(); d.classList.remove("pulse");
  setTimeout(() => gsap.to(d, { filter: "brightness(.55) saturate(.8)", duration: 0.6 }), 2600);
  sfx("creak");
  d.src = "assets/p3_door_open.webp";
  const pf = playFx("portal", +d.dataset.x, +d.dataset.y + 70, { palette: kind === "m" ? "plum" : "gold", scale: 2 });
  for (let i = 0; i < count; i++) {
    const list = kind === "m" ? MON : DRA;
    const g = img(list[guests.filter((x) => x.dataset.k === kind).length % list.length], world, { left: +d.dataset.x - 65, top: +d.dataset.y - 40, width: 130, height: 130 });
    g.dataset.k = kind;
    guests.push(g);
    sfx("pop");
    gsap.from(g, { scale: 0.2, duration: 0.3 });
    vals[kind]++;
    drawVals();
    layoutGuests();
    await wait(0.32);
  }
  pf.stop();
  spotOff();
  setFocus("table", 0.8);
  camFocus(TX, 520, 1.04, 1.1); // follow the guests back to the table
  await wait(0.4);
  d.src = "assets/p3_door_closed.webp";
  gsap.to(QB.box, { opacity: 1, duration: 0.4 });
  if (who) await hostSwap(who);
}
async function leave(count) {
  const mons = guests.filter((g) => g.dataset.k === "m").slice(-count);
  const d = doors[0];
  for (const g of mons) {
    g.src = "assets/gu_monster_sad.webp";
    gsap.to(g, { left: +d.dataset.x - 65, top: +d.dataset.y - 40, opacity: 0, filter: "brightness(0)", duration: 0.9, ease: "power1.in" });
    guests.splice(guests.indexOf(g), 1);
    await wait(0.35);
  }
  await wait(0.6);
  mons.forEach((g) => g.remove());
  layoutGuests();
}
const OPS = ["+", "−", "×"];
const EQ_Q = `<span class="lo">&thinsp;=&thinsp;</span><span class="q">?</span>`;
function renderPlan(tokens) { bar.innerHTML = tokens.map((t) => OPS.includes(t) ? `&thinsp;${show([t])}&thinsp;` : (t === "m" || t === "d") ? `<span class="seal" data-k="${t}" style="display:inline-flex;width:92px;height:92px;align-items:center;justify-content:center;background:url(assets/p3_gold_seal.webp) center/contain no-repeat;color:${t === "m" ? "#6a2bc4" : "#d4520a"};text-shadow:0 2px 0 #fff3c4;font-size:56px;font-weight:900;cursor:pointer;margin:0 4px">${t}</span>` : show([t])).join(""); }
async function crackSeals() {
  const seals = [...bar.querySelectorAll(".seal")];
  for (const s of seals) {
    s.classList.add("pulse");
    const r = bar.getBoundingClientRect();
    await new Promise((res) => onTap(s, res));
    s.classList.remove("pulse");
    sfx("magic");
    s.style.backgroundImage = "url(assets/p3_gold_seal_cracked.webp)";
    s.textContent = "";
    const rr = s.getBoundingClientRect(), pp = toStage({ clientX: rr.left + rr.width / 2, clientY: rr.top + rr.height / 2 }), sx = pp.x, sy = pp.y;
    playFx("shatter", sx, sy + 30, { palette: "gold", scale: 2 });
    await wait(0.35);
    // the value flies out of its m = 6 pill into the seal, so the eye follows the substitution
    const pill = valBox.querySelector(".vpill." + s.dataset.k);
    if (pill) {
      const pr = pill.getBoundingClientRect(), a = toStage({ clientX: pr.left + pr.width / 2, clientY: pr.top + pr.height / 2 });
      const fly = el("div", "flynum " + s.dataset.k, ui, { left: a.x, top: a.y }, vals[s.dataset.k]);
      gsap.fromTo(pill, { scale: 1.25 }, { scale: 1, duration: 0.4 });
      await gsap.fromTo(fly, { scale: 0.6 }, { left: sx, top: sy, scale: 1.3, duration: 0.45, ease: "power2.inOut" });
      fly.remove();
    }
    s.style.background = "none";
    s.style.color = "#fff";
    // 2m with m = 6 reads 2 × 6, never "2 6" (which looks like twenty-six)
    const afterNum = s.previousElementSibling && s.previousElementSibling.classList.contains("ln");
    s.innerHTML = (afterNum ? '<span class="lo" style="margin:0 12px 0 6px">×</span>' : "") + vals[s.dataset.k];
    s.style.width = "auto";
    gsap.fromTo(s, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.5)" });
    await wait(0.4);
  }
}
async function deliver(n, need, icon) {
  tableItems.innerHTML = "";
  const spots = onTable(n, TABLE3);
  for (let i = 0; i < n; i++) {
    const { x, y, sz } = spots[i];
    const it = img(icon, tableItems, { left: x, top: y, width: sz, height: sz, objectFit: "contain" });
    if (icon === "pr_balloon") it.style.filter = `hue-rotate(${(i * 47) % 360}deg) saturate(3)`;
    const from = camPt(PICK.cx, PICK.top + 80);
    gsap.from(it, { left: from.x, top: from.y, scale: 0.3, opacity: 0, duration: 0.45, delay: i * 0.05, ease: "power2.out" });
  }
  await wait(0.5 + n * 0.05);
  if (n === need) return true;
  sfx("bad");
  if (n < need) {
    const g = guests.find((x) => x.dataset.k === "m") || guests[0];
    if (g) { const old = g.src; g.src = "assets/gu_monster_sad.webp"; setTimeout(() => (g.src = old), 2600); }
    popup(`${n} is not enough!`, 1.6, TABLE_POP);
  } else {
    gsap.to([...tableItems.children].slice(need), { y: -14, rotation: 12, yoyo: true, repeat: 3, duration: 0.15 });
    popup(`${n} is too many!`, 1.6, TABLE_POP);
  }
  await wait(1.7);
  tableItems.innerHTML = "";
  return false;
}
// the answers: three big gems in a pill panel under the table
function chooseNum(opts) {
  const panel = el("div", "pickbar", ui, { left: PICK.cx - 290, top: PICK.top, width: 580 });
  gsap.from(panel, { y: 40, opacity: 0, duration: 0.35, ease: "back.out(1.6)" });
  const ls = opts.map((v, i) => {
    const l = el("div", "lantern big", ui, { left: PICK.cx - 75 + (i - 1) * 180, top: PICK.top + 25 }, v);
    gsap.fromTo(l, { y: 0 }, { y: -10, yoyo: true, repeat: -1, duration: 1 + i * 0.2, ease: "sine.inOut" });
    gsap.from(l, { scale: 0, duration: 0.4, delay: i * 0.1, ease: "back.out(2)" });
    return l;
  });
  ls.panel = panel;
  return { ls, pick: () => new Promise((res) => ls.forEach((l, i) => (l.onpointerdown = (e) => { e.stopPropagation(); sfx("tap"); ls.forEach((x) => (x.onpointerdown = null)); res([opts[i], l]); }))) };
}

function spawnNow(kind, count) {
  const list = kind === "m" ? MON : DRA;
  for (let i = 0; i < count; i++) {
    const g = img(list[guests.filter((x) => x.dataset.k === kind).length % list.length], world, { left: 690, top: 720, width: 130, height: 130 });
    g.dataset.k = kind; guests.push(g); vals[kind]++;
  }
  drawVals(); layoutGuests();
}
export async function runPart3(start = 1) {
  buildScene();
  checklist(Q.map((q) => q.icon));
  for (let i = 0; i < start - 1; i++) checkDone(i);
  drawVals();
  if (start > 1) {
    spawnNow("m", start > 6 ? 4 : 6);
    if (start > 4) spawnNow("d", 4);
  } else {
    const ir = iconRow(Q);
    await say("nar", "Neel decides who is coming. Find the exact number of things.");
    ir.remove();
    QB.show("Neel has decided!");
    await say("neel", "I have decided! 6 monster friends are coming.", { p: "happy" });
    await knockDoor(0, "m", 6);
    QB.show("6 monster friends are here");
    // the party plan from Part 2 comes out again
    gsap.to(QB.box, { opacity: 0, duration: 0.3 });
    const sc = await planScroll({ left: 520, top: 96 });
    await maya("Look at our party plan. We wrote it when we did not know the number of friends. That is why we used m.", "explain");
    await maya("Now we know that m is 6. So we just put 6 in place of m, and then work it out.", "cast");
    await sc.roll();
    const ex = card(`<div class="tag">Maya explains</div><p>Glasses: ${show(["2", "m"])}</p><p>Put 6 in place of <span class="mtxt">m</span>: 2 × 6 = <b>12</b></p>`, { left: 560, top: 30, width: 680 }, "card lesson");
    await maya("For example, glasses: 2 for each friend is 2m. Put 6 in place of m: 2 × 6 = 12 glasses.", "explain");
    await maya("Now you try! Find the exact number of each thing on the plan.", "happy");
    await mayaOut();
    await gsap.to(ex, { opacity: 0, duration: 0.3 }); ex.remove();
  }

  for (let qi = start - 1; qi < Q.length; qi++) {
    const q = Q[qi];
    checkCur(qi);
    setAnswer(q.ans);
    if (q.arrive?.d) {
      bar.innerHTML = ""; uses = "d"; drawVals();
      QB.show(q.arrive.d === 4 ? "Someone is knocking!" : "More knocking!");
      await say("agni", q.arrive.d === 4 ? "Listen! Someone is knocking!" : "More knocking! Who is it?", { p: "shocked" });
      await knockDoor(2, "d", q.arrive.d);
    }
    uses = q.change ? "m" : q.plan.filter((t) => t === "m" || t === "d").join("");
    drawVals();
    const seals = q.change ? 0 : uses.length;
    QB.show(q.name, q.means);
    words.style.display = q.words ? "" : "none";
    camFocus(TX, 520);
    if (q.change) await leave(2);
    renderPlan(q.plan);
    if (q.change) { bar.insertAdjacentHTML("afterbegin", `<span class="lm">m</span><span class="lo">&thinsp;=&thinsp;</span>`); bar.insertAdjacentHTML("beforeend", EQ_Q); }
    gsap.fromTo(bar, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    if (q.who === "maya") { await maya(q.line, "explain"); await mayaOut(); }
    else await say(q.who, q.line);
    const iw = idleWatch(16, async () => { await maya("Take your time. " + q.inact, "hint"); await mayaOut(); iw.arm(); });
    if (!q.change) {
      prompt(seals > 1 ? "Tap the gold seals to see the numbers!" : "Tap the gold seal to see the number!");
      await crackSeals();
      gsap.to(valBox, { autoAlpha: 0, duration: 0.3 }); // the numbers are in the bar now
      bar.insertAdjacentHTML("beforeend", EQ_Q);
    }
    prompt(q.ask);
    const { ls, pick } = chooseNum(q.opts);
    let tries = 0;
    while (true) {
      const [v, l] = await pick();
      iw.arm();
      const ok = q.change ? v === q.ans : await deliver(v, q.ans, q.icon);
      if (ok) {
        if (q.change) { vals.m = 4; drawVals(); }
        break;
      }
      tries++;
      gsap.to(l, { opacity: 0.3, pointerEvents: "none", duration: 0.3 });
      if (q.change) { sfx("boing"); react("neel", "oops"); }
      if (tries < 3) { await maya("Not yet. Try again. " + (tries === 1 ? q.h1 : q.h2), "hint"); await mayaOut(); prompt(q.ask); }
      else {
        const good = ls[q.opts.indexOf(q.ans)];
        pointHand(parseFloat(good.style.left) + 50, parseFloat(good.style.top) + 60, 2);
        await maya(`Let's see the answer together. The answer is ${q.ans}. ` + q.exp, "explain");
        await mayaOut();
        if (!q.change) await deliver(q.ans, q.ans, q.icon); else { vals.m = 4; drawVals(); }
        break;
      }
    }
    iw.stop();
    ls.forEach((l) => gsap.to(l, { scale: 0, duration: 0.25, onComplete: () => l.remove() }));
    gsap.to(ls.panel, { opacity: 0, duration: 0.25, onComplete: () => ls.panel.remove() });
    closeBubble();
    actionZone(false);
    // combo working
    bar.innerHTML = `<span class="ln" style="font-size:56px">${q.work.replace(/= (\d+)$/, '= <span style="color:#ffe066">$1</span>')}</span>`;
    gsap.fromTo(bar, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: "back.out(2)" });
    sfx("good");
    playFx("collect", TX, 450, { palette: "gold", scale: 3 });
    QB.sub(`<span class="win">${q.pop} ✓</span>`);
    await award(tries, TX, 300, 3);
    if (tries < 3) { await praise(PRAISE[qi]); await maya("Correct! " + q.exp, "happy"); await mayaOut(); }
    checkDone(qi);
    closeBubble();
    await wait(0.3);
    tableItems.innerHTML = "";
  }
  gsap.to([QB.box, table], { opacity: 0, duration: 0.5 });
  actionZone(false);
}
