import "./style.css";
import "./qa.js";
import { confetti, camPt, camRest, camSet, ANIM_FILES, warmChars, setFore, score, showHud, music, curtainShut, curtainOpen, setTint, punch, shake, solo, trio, setFocus, gsap, $, el, img, ui, world, wait, sfx, say, setScene, placeChar, hideAllChars, pose, dance, partTitle, button, waitClick, playFx, preload, hideChecklist, setDim, C, closeBubble, camTo, W } from "./engine.js";
import { runPart1 } from "./part1.js";
import { runPart2 } from "./part2.js";
import { runPart3, partyTable, DOOR_XY } from "./part3.js";
import { houseMap } from "./map.js";
import { qaJump, setAnswer } from "./qa.js";
import { planScroll, lightsUp, houseWindows, owlBlink, coin } from "./common.js";

const ALL = ["bg_forest_far", "bg_forest_mid", "bg_forest_fore", "bg_hall_far", "bg_hall_mid", "bg_hall_fore", "bg_cauldron_far", "bg_cauldron_mid", "bg_cauldron_fore", "bg_doors_far", "bg_doors_mid", "bg_doors_fore",
  ...ANIM_FILES,
  "gu_monster_green", "gu_monster_pink", "gu_monster_blue", "gu_monster_sad", "gu_dragon_teal", "gu_dragon_red",
  "p1_dial_base", "p1_dial_knob", "p1_variable_jar", "p1_constant_chest_closed", "p1_constant_chest_open", "p2_cauldron", "p2_orb_m", "p2_orb_d", "p2_orb_number", "p2_rune_stone",
  "p3_door_closed", "p3_door_open", "fx_coin_spin", "pr_party_table_3d", "pr_bowl", "pr_cake", "pr_chair", "pr_sweet", "pr_balloon", "pr_plate", "pr_cushion", "pr_laddoo", "de_string_lights", "de_bunting", "cover_neel", "ui_panel_frame", "ui_button_pill", "ui_title_card", "ui_play_button", "ui_hint_hand"];


// what the title and the story need (the rest loads behind them)
const FIRST = ["bg_forest", "bg_hall", "ui_", "cover_neel", "fx_coin_spin", "gu_monster", "anim_neel_idle", "anim_neel_talk", "anim_neel_happy", "anim_agni_idle", "anim_agni_talk", "anim_agni_crash_in", "anim_agni_shocked", "anim_agni_cheer", "anim_maya_idle", "anim_maya_talk", "anim_maya_cast", "anim_maya_happy"];
function clearUI() { [...ui.children].forEach((c) => { if (c.id !== "bubble") c.remove(); }); world.innerHTML = ""; }

// ---------- staging helpers ----------
const headOf = (k) => [C[k].x, C[k].y - C[k].h * 0.78];
function speedLines(x, y) {
  const n = 14, rays = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return `<line x1="${200 + c * 120}" y1="${200 + s * 120}" x2="${200 + c * 190}" y2="${200 + s * 190}"/>`; }).join("");
  const sv = el("div", "speed", ui, { left: x - 200, top: y - 200, width: 400, height: 400 }, `<svg viewBox="0 0 400 400" width="400" height="400">${rays}</svg>`);
  gsap.timeline({ onComplete: () => sv.remove() }).fromTo(sv, { scale: 0.7, opacity: 0 }, { scale: 1.08, opacity: 1, duration: 0.18, ease: "power2.out" }).to(sv, { opacity: 0, scale: 1.2, duration: 0.45, delay: 0.25 });
}
// "we don't know the number yet": dark friend silhouettes keep changing count, then fold into the letter m
const MONS = ["gu_monster_green", "gu_monster_pink", "gu_monster_blue"];
function mysteryFriends(cx, cy) {
  const box = el("div", "abs", ui, { left: 0, top: 0, width: 1, height: 1 });
  const chip = el("div", "guess", box, { left: cx, top: cy + 70 }, "? friends");
  gsap.set(chip, { xPercent: -50 });
  let alive = true;
  const show = (n) => {
    box.querySelectorAll(".sil").forEach((s) => s.remove());
    const sils = Array.from({ length: n }, (_, i) => img(MONS[i % 3], box, { left: cx - ((n - 1) * 60) / 2 + i * 60 - 48, top: cy - 60 }, "sil"));
    gsap.from(sils, { scale: 0, duration: 0.25, stagger: 0.04, ease: "back.out(2)" });
    chip.textContent = `${n} friends?`;
    gsap.fromTo(chip, { scale: 1.2 }, { scale: 1, duration: 0.3 });
    sfx("pop");
  };
  (async () => { while (alive) for (const n of [3, 5, 8, 2, 6]) { if (!alive) return; show(n); await wait(0.9); } })();
  return {
    async collapse() {
      alive = false;
      await gsap.to(box.querySelectorAll(".sil"), { left: cx - 48, top: cy - 60, scale: 0.3, opacity: 0, duration: 0.45, stagger: 0.02, ease: "power2.in" });
      await gsap.to(chip, { opacity: 0, duration: 0.2 });
      box.remove();
    },
  };
}
// the gold m seal stamps down: screen shake, a gold ring ripples out, a purple glow keeps pulsing (m is purple)
function stampSeal(cx, cy) {
  const glow = el("div", "sealGlow", ui, { left: cx - 170, top: cy - 170, width: 340, height: 340 });
  const mc = coin(ui, { left: cx - 100, top: cy - 100, width: 200, height: 200 }, "m"), seal = mc.el;
  mc.face.style.fontSize = "120px";
  gsap.set(glow, { opacity: 0 });
  let rays = null;
  // the camera rushes in on the seal as it falls, then pulls back to show the room (the seal is UI, so it stays crisp)
  camTo({ x: cx, y: cy, s: 1.16, dur: 0.38, ease: "power3.in" });
  gsap.fromTo(seal, { scale: 2.4, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.38, ease: "power4.in", onComplete: () => {
    shake(12); sfx("knock"); sfx("magic");
    const ring = el("div", "ring", ui, { left: cx - 100, top: cy - 100, width: 200, height: 200 });
    gsap.fromTo(ring, { scale: 0.7, opacity: 1 }, { scale: 2.4, opacity: 0, duration: 0.7, ease: "power2.out", onComplete: () => ring.remove() });
    // the light goes behind the seal so the letter m stays readable
    const circle = playFx("cast", cx, cy + 20, { palette: "gold", scale: 3, parent: ui });
    rays = playFx("sunburst", cx, cy, { palette: "gold", scale: 4.4, parent: ui }); // slow gold rays behind the seal
    for (const fx of [circle, rays]) if (fx.el) ui.insertBefore(fx.el, seal);
    camTo({ x: cx, y: cy, s: 1, dur: 1.6, ease: "power2.inOut" });
    gsap.fromTo(glow, { opacity: 0.5, scale: 0.9 }, { opacity: 1, scale: 1.1, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" });
  } });
  return { done: wait(1.3), coin: mc, remove() { rays && rays.stop(); gsap.to([seal, glow], { scale: 0, opacity: 0, duration: 0.4, onComplete: () => { seal.remove(); glow.remove(); } }); } };
}
// scoreboard: m = ?, d = ? tiles. A new number pops in at once: a tile is never blank, not even for a moment
function board() {
  const b = el("div", "board", ui, {}, `<div class="tile m">m = <span class="num">?</span></div><div class="tile d">d = <span class="num">?</span></div>`);
  gsap.from(b.children, { y: -90, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(2)" });
  const flip = (k, v) => { const n = b.querySelector(`.tile.${k} .num`); n.textContent = v; gsap.fromTo(n, { scale: 1.5, color: "#ffe066" }, { scale: 1, color: "#ffffff", duration: 0.35, ease: "back.out(2)" }); sfx("pop"); };
  return { el: b, flip, hide() { gsap.to(b, { autoAlpha: 0, duration: 0.3 }); }, show() { gsap.to(b, { autoAlpha: 1, duration: 0.3 }); } };
}

// ---------- scenes ----------
/** ready: called once the title art is decoded (the curtain opens then, never mid-decode) */
async function title(ready) {
  music("calm");
  await setScene("forest", { fast: true, plain: true }); // the opening keeps only the moonlit sky and hills
  setDim(0);
  hideAllChars();
  // cover page: one still illustration of Neel (the full-resolution pose art), large, on the right
  const hero = img("cover_neel", ui, { left: 840, top: 160, width: 740, height: 740 });
  gsap.from(hero, { y: 300, opacity: 0, duration: 0.8, delay: 0.3, ease: "back.out(1.5)" });
  // the title card (moon, bat and lettering in one painted image) drops in, then floats gently
  const logo = img("ui_title_card", ui, { left: 50, top: 40, width: 780, height: 512 });
  gsap.from(logo, { y: -260, opacity: 0, duration: 0.9, ease: "bounce.out" });
  gsap.to(logo, { y: -10, rotation: -0.8, duration: 2.4, delay: 1, ease: "sine.inOut", yoyo: true, repeat: -1 });
  // round painted play button under the title card
  const play = img("ui_play_button", ui, { left: 440 - 105, top: 640 - 105, width: 210, height: 210 }, "abs playBtn pulse");
  play.alt = "Play";
  gsap.from(play, { scale: 0, duration: 0.6, delay: 0.7, ease: "back.out(2)" });
  await Promise.race([Promise.all([hero, logo, play, ...document.querySelectorAll("#Lfar .plate")].map((i) => (i.decode ? i.decode() : Promise.resolve()).catch(() => {}))), wait(0.8)]);
  ready && ready();
  const go = await new Promise((r) => {
    play.onpointerdown = (e) => { e.stopPropagation(); r(0); };
  });
  sfx("magic");
  gsap.killTweensOf(logo); logo.remove(); play.remove(); hero.remove();
  return go;
}

async function story() {
  music("calm");
  // outside Neel's house: the whole forest scene (the house is on the left), the three friends together on the path
  await setScene("forest", { fast: true });
  setFocus("story");
  // opening shot: the camera cranes down from the stars to Neel's house, its windows light up one by one,
  // the owl blinks. The last shot of the game comes back to this house
  const mid = $("#Lmid");
  const house = houseWindows(mid);
  owlBlink(mid);
  camSet({ x: W / 2, y: 0, s: 1.32 });
  gsap.from(mid.querySelector(".plate"), { y: 120, duration: 2.6, ease: "power2.out" });
  camTo({ s: 1, dur: 2.6, ease: "power2.inOut" });
  [0.7, 1.2, 1.7].forEach((t, i) => setTimeout(() => house.lit(i + 1), t * 1000));
  await wait(1.1);
  const arrive = trio("trio", { enter: true }); // their entrances play while the narrator starts
  await say("nar", "Welcome to Neel's Night Party!");
  sfx("owl");
  await arrive;
  await say("nar", "Neel wants to have a party next week, but he has not decided how many friends to invite. Maya and Agni are helping him plan the party.");
  sfx("whoosh");
  await setScene("hall");
  setDim(0.35, 0.01);
  await trio("trio"); // Agni is talking to Neel, so Neel is there too
  pose("agni", "shocked");
  // Agni's panic: a quick camera punch toward Agni with speed lines
  const hd = camPt(...headOf("agni"));
  punch(hd.x, hd.y); speedLines(hd.x, hd.y); sfx("boing");
  await say("agni", "Neel, have you still not decided how many guests are coming? Then how will we plan? How many plates? How many sweets?", { p: "shocked" });
  // the unknown number: friend silhouettes keep changing (top left), then become the letter m
  const SX = 350, SY = 250, mystery = mysteryFriends(SX, SY);
  await say("maya", "Don't worry. When we don't know a number, we can write it as a letter.", { p: "explain" });
  await mystery.collapse();
  const seal = stampSeal(SX, SY);
  await seal.done;
  await say("maya", "Neel's friends are monsters. So let's use the letter <b>m</b> for the number of monster friends.", { p: "cast" });
  const cap = el("div", "mcap", ui, { left: SX, top: SY + 120 }, `<span class="mtxt">m</span> = number of Neel's monster friends`);
  gsap.from(cap, { y: 14, opacity: 0, duration: 0.4 });
  await say("maya", "Let's say <b>m</b> monster friends are coming.", { p: "explain" });
  await say("agni", "But Maya, m is not a number.", { p: "shocked" });
  // the coin spins through numbers while Maya says it: m can be 3, 5, 8… and lands on m again
  seal.coin.spin(4, ["3", "5", "8", "m"], 3.4);
  await say("maya", "<b>m</b> is a <span class=v>variable</span> that represents a number. A variable is a number that is not fixed yet. It can change.", { p: "explain" });
  await say("maya", "When Neel decides who is coming, we can easily find the exact number of things we need.", { p: "happy" });
  await say("agni", "Hmm! A variable! Let's plan!", { p: "cheer" });
  seal.remove(); gsap.to(cap, { opacity: 0, duration: 0.3, onComplete: () => cap.remove() });
}

// the bridges between parts: all three friends stay on stage while they talk
async function bridge(lines, danceAll = true) {
  sfx("win");
  closeBubble();
  hideChecklist();
  [...ui.children].forEach((c) => { if (c.id !== "bubble") gsap.to(c, { opacity: 0, duration: 0.3 }); });
  setFocus(false);
  await trio("trio");
  if (danceAll) dance(lines[0][0]);
  for (const [w, t, p] of lines) await say(w, t, { p });
  ["neel", "agni", "maya"].forEach((k) => { if (C[k].loop) { C[k].loop = null; pose(k, "idle"); } });
  closeBubble();
}

async function part1(start = 1) {
  music("calm");
  clearUI();
  await setScene("hall");
  setTint("rgba(255,150,70,.10)"); // early evening
  partTitle("PART 1 OF 3", "Neel's Party List"); // the part sets up under the title card
  await runPart1(start);
  setAnswer("");
  // the hall lights up
  const lights = img("de_string_lights", $("#Lmid"), { left: 500, top: 0, width: 1000 });
  gsap.from(lights, { y: -200, duration: 0.8, ease: "bounce.out", onComplete: () => lightsUp($("#Lmid"), 500, 0, 1000) });
  setDim(0, 1.2);
  await bridge([["neel", "Thank you for helping me check my party list."], ["maya", "Great! Now you know that a number that can change is a <span class=v>variable</span>.", "happy"], ["maya", "And a number that stays the same is a <span class=c>constant</span>.", "explain"], ["agni", "Come on! Let's write the party plan!"]]);
  hideChecklist();
}
async function part2(start = 1) {
  music("calm");
  clearUI();
  await setScene("cauldron");
  setDim(0, 0.01);
  setTint("rgba(120,60,200,.10)"); // night falls
  playFx("campfire", 720, 505, { scale: 3, parent: $("#Lfar") });
  partTitle("PART 2 OF 3", "Write the Party Plan");
  await runPart2(start);
  setAnswer("");
  // Neel stands still on the floor for this one (no dance): he is holding his finished plan
  await bridge([["neel", "Yay! Good job. My party plan is ready!"]], false); // a standing pose: the "happy" one jumps
  // the plan the child wrote, on a scroll; Neel keeps it safe
  const sc = await planScroll();
  await say("nar", "Well done! Here is Neel's Party Plan.");
  await say("neel", "This is our party plan. I will keep it safe until I decide who is coming!");
  await sc.roll();
  closeBubble();
  hideChecklist();
}
// Part 3 ends with the party itself: no separate room on the map
async function part3(start = 1) {
  music("calm");
  clearUI();
  await setScene("doors");
  setDim(0, 0.01);
  setTint("rgba(20,30,120,.18)"); // deep night
  partTitle("PART 3 OF 3", "Neel Decides");
  await runPart3(start);
  setAnswer("");
  await bridge([["neel", "Yay! Now I know exactly what we need!"], ["agni", "Even when the numbers changed, the plan still worked!"], ["maya", "That is the magic of variables. m and d can be any number.", "celebrate"]], false);
  hideChecklist();
  await party();
}

// ---------- the party: the end of Part 3, around the table the child filled. The friends arrive now, once. ----------
const PARTY_MON = [["gu_monster_green", 0], ["gu_monster_pink", 0], ["gu_monster_green", -50], ["gu_monster_pink", 40]]; // [art, hue shift]: no blue monster, it looks like a second Neel
const PARTY_DRA = ["gu_dragon_teal", "gu_dragon_red"];
// outside Neel's house: the friends come up the path and knock, then the camera flies in through the round window
// (the game opened on this house; now it comes back to it)
async function arrival(quick) {
  clearUI();
  hideAllChars();
  await setScene("forest");
  setFocus(false); setDim(0); setTint("rgba(10,10,60,.12)");
  const mid = $("#Lmid");
  houseWindows(mid).lit(3, false);
  owlBlink(mid);
  const doorGlow = el("div", "winGlow", mid, { left: 622 - 110, top: 600 - 130, width: 220, height: 260 });
  gsap.set(doorGlow, { opacity: 0 });
  sfx("knock");
  const said = say("nar", "It's party day! Knock knock! The friends are here!");
  // 4 monsters and 7 dragons walk up the stone path to the door, getting smaller as they go, and step inside
  const walkers = [...PARTY_MON.map(([a, h]) => [a, h]), ...Array.from({ length: 7 }, (_, i) => [PARTY_DRA[i % 2], 0])];
  // along the stone path: from the front of the garden (big, close) up the steps to the door (small, far)
  const path = [[880, 880, 140], [600, 760, 96], [440, 640, 62]];
  const at = ([x, y, z]) => ({ left: x - z / 2, top: y - z, width: z, height: z });
  walkers.forEach(([art, hue], i) => {
    const g = img(art, world, at(path[0]));
    if (hue) g.style.filter = `hue-rotate(${hue}deg)`;
    const tl = gsap.timeline({ delay: i * (quick ? 0.12 : 0.36), onComplete: () => g.remove() });
    tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .to(g, { ...at(path[1]), duration: 1, ease: "none" }, 0)
      .to(g, { ...at(path[2]), duration: 0.8, ease: "none" })
      .to(g, { y: -14, duration: 0.15, yoyo: true, repeat: 11, ease: "sine.inOut" }, 0)
      .to(g, { opacity: 0, scale: 0.7, duration: 0.25 });
    if (i === 0) tl.call(() => { sfx("creak"); gsap.to(doorGlow, { opacity: 0.9, duration: 0.4 }); }, null, 1.7);
  });
  await Promise.all([said, wait(walkers.length * (quick ? 0.12 : 0.36) + 2.1)]);
  // in through the round window, with a flash of party light
  const win = camPt(650 - 200, 368);
  const flash = el("div", "flash", ui, {});
  sfx("whoosh");
  await Promise.all([camTo({ x: win.x, y: win.y, s: 2.4, dur: 1.1, ease: "power3.in" }), gsap.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.65 })]);
  return flash;
}
async function party(opt = {}) {
  const quick = !!opt.quick; // QA: straight to the dancing
  const flash = await arrival(quick);
  clearUI(); ui.appendChild(flash);
  await setScene("doors", { fast: true });
  partyTable(); // the table the child filled, everything on it
  gsap.to(flash, { opacity: 0, duration: 0.7, onComplete: () => flash.remove() });
  music("magic");
  setFore(0); // nothing in front of the guests
  setFocus(false); setDim(0, 0.6);
  setTint("rgba(255,90,180,.08)"); // party lights
  hideChecklist();
  const L = $("#Lmid");
  const lights = img("de_string_lights", L, { left: 500, top: 0, width: 1000 });
  gsap.from(lights, { y: -200, duration: 0.8, ease: "bounce.out", onComplete: () => lightsUp(L, 500, 0, 1000, false) });
  img("de_bunting", L, { left: 640, top: 150, width: 720 });
  await trio("trioParty");
  const sb = board();
  sfx("creak");
  // the guests come in through the doors and stand apart, so each one can be counted: 4 monsters on the left
  // and 7 dragons on the right, each group in one row, beside the table and clear of the friends in front
  const doorImg = [...$("#Lfar").querySelectorAll("img")].filter((i) => /p3_door/.test(i.src));
  doorImg.forEach((d) => (d.src = "assets/p3_door_open.webp"));
  const gs = [];
  const guest = (art, hue, x, feet, size, from, i) => {
    const g = img(art, world, { left: x - size / 2, top: feet - size, width: size, height: size });
    g.dataset.k = art.includes("dragon") ? "d" : "m";
    if (hue) g.style.filter = `hue-rotate(${hue}deg)`;
    gs.push(g);
    gsap.from(g, { left: from.x - size / 2, top: from.y - size / 2, scale: 0.4, opacity: 0, duration: 0.6, delay: i * 0.12, ease: "power2.out" });
    return g;
  };
  PARTY_MON.forEach(([a, h], i) => guest(a, h, 90 + i * 74, 575, 84, DOOR_XY[0], i));
  sb.flip("m", 4);
  if (!quick) await say("neel", "Look! 4 of my monster friends are here!", { p: "happy" });
  for (let i = 0; i < 7; i++) guest(PARTY_DRA[i % 2], 0, 1180 + i * 62, 572, 80, DOOR_XY[2], i);
  sb.flip("d", 7); // d is filled before Agni says it
  if (!quick) {
    await say("agni", "And 7 of my dragon friends are here too!", { p: "cheer" });
    await say("neel", "My friends changed their minds, but our plan still worked!", { p: "happy" });
    // "any number": the tiles flip through numbers while Maya says it, then settle back on 4 and 7
    const roll = setInterval(() => { sb.flip("m", 1 + Math.floor(Math.random() * 9)); sb.flip("d", 1 + Math.floor(Math.random() * 9)); }, 600);
    await say("maya", "That is because m and d can be any number. That is why we use variables. Well done!", { p: "celebrate" });
    clearInterval(roll); sb.flip("m", 4); sb.flip("d", 7);
    await say("neel", "Let's party!", { p: "happy" });
  }
  doorImg.forEach((d) => (d.src = "assets/p3_door_closed.webp"));
  closeBubble();
  sb.hide(); // the narrator's line takes the top centre
  await wait(0.3);
  // everyone dances: one Neel in the middle, Agni and Maya beside him, the guests bounce in their places
  sfx("cheer");
  showHud(false);
  ["agni", "neel", "maya"].forEach((k) => dance(k));
  gs.forEach((g, i) => gsap.to(g, { y: -24, duration: 0.3 + (i % 3) * 0.05, yoyo: true, repeat: -1, ease: "power1.out", delay: i * 0.07 }));
  // fireworks high on both sides, away from the narrator's line
  let shot = 0;
  const boom = () => {
    confetti(40); sfx("pop");
    const x = shot % 2 ? 1250 + Math.random() * 250 : 120 + Math.random() * 250;
    if (shot++ % 3 === 2) playFx("rocket", x, 640, { scale: 2 }); else playFx("firework", x, 150 + Math.random() * 130, { scale: 3 });
  };
  boom();
  const fireworks = setInterval(boom, 1700);
  await say("nar", "The party begins! Neel, Agni, Maya and all their friends dance all night.", { wait: false });
  // a small Play again in the corner: the party stays the picture
  await wait(1.2);
  const again = button("↻ Play again", 1390, 818);
  again.classList.add("small");
  again.style.translate = "none"; // placed by its corner: the pop-in scale below must not move it off the screen
  gsap.from(again, { scale: 0, duration: 0.4, ease: "back.out(2)" });
  await waitClick(again);
  clearInterval(fireworks);
  location.reload();
}

const RUN = { 1: part1, 2: part2, 3: part3 };
async function main() {
  const ld = $("#loader");
  const q = qaJump();
  const j = location.hash.match(/^#(p\d|end|map)$/);
  // a normal start waits only for the title and the story; the rest of the art loads in the background while the
  // story plays. A jump straight into a part waits for everything
  const first = q || j ? ALL : ALL.filter((n) => FIRST.some((f) => n.startsWith(f)));
  await preload(first, (p) => (ld.textContent = `Loading… ${Math.round(p * 100)}%`));
  // one file at a time, so loading in the background never causes a hitch on screen
  if (first !== ALL) (async () => { for (const n of ALL.filter((n) => !first.includes(n))) await preload([n]); })();
  await warmChars();
  // a normal start opens on the title like a stage: the curtain waits shut behind the loader
  if (!q && !j) curtainShut();
  ld.remove(); // gone at once, so it can never show through a title card
  const state = { done: {}, unlockAll: false };
  if (q) {
    state.unlockAll = true;
    showHud(true);
    if (q.at === "title") { await title(); await story(); }
    else if (q.at === "story") { await setScene("forest", { fast: true, plain: true }); await story(); }
    else if (q.at === "p1") { await part1(q.n); state.done[1] = true; }
    else if (q.at === "p2") { await part2(q.n); state.done[2] = true; }
    else if (q.at === "p3") { await part3(q.n); state.done[3] = true; }
    else if (q.at === "party") await party({ quick: true });
  } else if (j && j[1] === "end") { showHud(true); await party(); }
  else if (j && j[1] !== "map") { showHud(true); await RUN[({ p1: 1, p2: 2, p3: 3 })[j[1]]](); }
  else if (!j) {
    await title(() => curtainOpen());
    await story();
  } else state.unlockAll = true;
  while (true) {
    clearUI();
    setTint();
    music("magic");
    const r = await houseMap(state);
    if (state.done[r]) { score.stars -= score.room[r] || 0; score.room[r] = 0; }
    showHud(true);
    await RUN[r]();
    state.done[r] = true;
  }
}
main();
