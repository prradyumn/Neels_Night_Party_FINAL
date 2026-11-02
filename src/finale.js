// FINALE – Party Day shopping run: with the real numbers (m = 4, d = 7) the kid packs the exact amount of each thing.
import { qbox, valPills, crowd, TABLE, TABLE_POP, onTable, clearCrowd, gsap, el, img, ui, world, wait, sfx, say, card, popup, playFx, checklist, checkCur, checkDone, onTap, react, closeBubble, button, award, actionZone, setFore, camFocus, groundShadow, lightPool } from "./engine.js";
import { setAnswer } from "./qa.js";
import { sideChars, maya, praise } from "./common.js";

const ITEMS = [
  { name: "Chairs", plan: "m + 1", icon: "pr_chair", v: 5, h1: "Put 4 in place of m.", step: "4 + 1 = ?", work: "4 + 1 = 5", line: "Chairs = m + 1. How many chairs do we need now?" },
  { name: "Plates", plan: "m + d + 1", icon: "pr_plate", v: 12, h1: "m is 4 and d is 7. Don't forget Maya's plate.", step: "4 + 7 + 1 = ?", work: "4 + 7 + 1 = 12", line: "Plates = m + d + 1. How many plates?" },
  { name: "Cushions", plan: "m + 2d", icon: "pr_cushion", v: 18, h1: "First work out 2d. d is 7.", step: "4 + 2 × 7 = 4 + 14 = ?", work: "4 + 2 × 7 = 4 + 14 = 18", line: "Cushions = m + 2d. Dragons need 2 each!" },
  { name: "Laddoos", plan: "3m + 2d", icon: "pr_laddoo", v: 26, h1: "3m is 3 × 4. 2d is 2 × 7. Then add.", step: "3 × 4 + 2 × 7 = 12 + 14 = ?", work: "3 × 4 + 2 × 7 = 12 + 14 = 26", line: "Laddoos = 3m + 2d. The last one!" },
];

export async function runFinale(guests, start = 1) {
  sideChars();
  setFore(0);
  checklist(ITEMS.map((i) => i.icon));
  for (let i = 0; i < start - 1; i++) checkDone(i);
  // guests line up in front of the table
  const TX = TABLE.cx;
  const table = img("pr_party_table", world, { left: TX - TABLE.w / 2, top: TABLE.top, width: TABLE.w });
  groundShadow(TX, TABLE.top + 226, TABLE.w * 0.96, 50); lightPool(TX, TABLE.top + 190, 1150, 330);
  gsap.from(table, { y: 200, opacity: 0, duration: 0.5 });
  crowd(guests, { cx: TX, top: 664, size: 100, maxW: 560 });
  const QB = qbox(), bar = QB.plan, pills = QB.box;
  const pile = el("div", "abs", world, { left: 0, top: 0, width: 1, height: 1 });
  if (start <= 1) await say("neel", "Now we know the real numbers: 4 monsters and 7 dragons. Let's get everything ready!", { p: "happy" });

  // stepper in the action zone: −5 −1 [n] +1 +5
  actionZone(true, "Set the number, then Pack it!", true);
  const st = el("div", "stepper", ui, { left: 1052, top: 646 });
  const less5 = el("div", "sb sm", st, {}, "−5"), minus = el("div", "sb", st, {}, "−1"), val = el("div", "val", st, {}, "0"), plus = el("div", "sb", st, {}, "+1"), five = el("div", "sb sm", st, {}, "+5");
  const pack = button("Pack it!", 1290, 822);
  let n = 0, it = null;
  const draw = () => {
    val.textContent = n;
    pack.disabled = n === 0;
    const kids = [...pile.children], spots = onTable(n);
    while (kids.length < n) { const k = img(it.icon, pile, { objectFit: "contain" }); gsap.from(k, { scale: 0, duration: 0.25, ease: "back.out(3)" }); kids.push(k); }
    while (kids.length > n) kids.pop().remove();
    kids.forEach((k, i) => { const { x, y, sz } = spots[i]; Object.assign(k.style, { left: x + "px", top: y + "px", width: sz + "px", height: sz + "px" }); });
  };
  const bump = (d) => { n = Math.max(0, Math.min(30, n + d)); sfx("pop"); draw(); gsap.fromTo(val, { scale: 1.2 }, { scale: 1, duration: 0.25 }); };
  onTap(less5, () => bump(-5)); onTap(minus, () => bump(-1)); onTap(plus, () => bump(1)); onTap(five, () => bump(5));

  for (let q = start - 1; q < ITEMS.length; q++) {
    it = ITEMS[q];
    setAnswer(it.v); n = 0; pile.innerHTML = ""; draw();
    checkCur(q);
    QB.show(it.name, `How many ${it.name.toLowerCase()}?`);
    camFocus(TX, 520);
    valPills(QB.vals, { m: 4, d: 7 }, it.plan);
    bar.innerHTML = `<span class="ln" style="font-size:40px">${it.plan.replace(/m/g, '<span class="lm">m</span>').replace(/d/g, '<span class="ld">d</span>')}</span>`;
    await say(q % 2 ? "agni" : "neel", it.line);
    let tries = 0;
    while (true) {
      pack.classList.add("pulse");
      await new Promise((r) => (pack.onpointerdown = (e) => { e.stopPropagation(); r(); }));
      pack.classList.remove("pulse");
      if (n === it.v) break;
      tries++;
      sfx("bad");
      if (n < it.v) { const g = guests[(q * 3) % guests.length], old = g.src; g.src = "assets/gu_monster_sad.webp"; setTimeout(() => (g.src = old), 2400); popup("Not enough!", 1.1, TABLE_POP); }
      else { gsap.to([...pile.children].slice(it.v), { y: -14, rotation: 14, yoyo: true, repeat: 3, duration: 0.14 }); popup("Too many!", 1.1, TABLE_POP); }
      await wait(1.2);
      if (tries === 1) await maya("Not yet. " + it.h1, "hint");
      else if (tries === 2) { bar.innerHTML = `<span class="ln" style="font-size:36px">${it.step}</span>`; await maya("Let's work it out step by step. Look at the plan.", "hint"); }
      else { n = it.v; draw(); await maya("Here it is: " + it.work + ".", "explain"); break; }
    }
    bar.innerHTML = `<span class="ln" style="font-size:36px">${it.work.replace(/= (\d+)$/, '= <span style="color:#ffe066">$1</span>')}</span>`;
    sfx("good");
    playFx("collect", TX, 450, { palette: "gold", scale: 3 });
    gsap.fromTo(pile.children, { y: -10 }, { y: 0, duration: 0.4, stagger: 0.02, ease: "bounce.out" });
    QB.sub(`<span class="win">${it.v} ${it.name.toLowerCase()} packed! ✓</span>`);
    await award(tries, TX, 285, 4);
    await praise();
    checkDone(q);
    closeBubble();
    await wait(0.4);
  }
  gsap.to([st, pack, bar, pills, table, pile], { opacity: 0, duration: 0.4 });
  actionZone(false);
  await wait(0.4);
  [st, pack, pills].forEach((e) => e.remove());
  clearCrowd();
}
