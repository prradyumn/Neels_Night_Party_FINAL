import "./style.css";
import "./qa.js";
import { confetti, camPt, camTo, camRest, camSway, ANIM_FILES, score, showHud, showMenu, music, curtainShut, curtainOpen, curtainFrame, setTint, punch, shake, solo, hostSwap, crowd, host, setFocus, gsap, $, el, img, ui, world, wait, sfx, say, setScene, placeChar, hideAllChars, enterChar, hideChar, pose, dance, react, partTitle, button, waitClick, playFx, preload, settings, hush, hideChecklist, setDim, C, closeBubble, W } from "./engine.js";
import { runPart1 } from "./part1.js";
import { runPart2 } from "./part2.js";
import { runPart3 } from "./part3.js";
import { houseMap, ROOMS } from "./map.js";
import { qaJump, setAnswer } from "./qa.js";
import { planScroll } from "./common.js";

const ALL = ["bg_forest_far", "bg_forest_mid", "bg_forest_fore", "bg_hall_far", "bg_hall_mid", "bg_hall_fore", "bg_cauldron_far", "bg_cauldron_mid", "bg_cauldron_fore", "bg_doors_far", "bg_doors_mid", "bg_doors_fore",
  ...ANIM_FILES,
  "gu_monster_green", "gu_monster_pink", "gu_monster_blue", "gu_monster_sad", "gu_dragon_teal", "gu_dragon_red",
  "p1_dial_base", "p1_dial_knob", "p1_variable_jar", "p1_constant_chest_closed", "p1_constant_chest_open", "p2_cauldron", "p2_orb_m", "p2_orb_d", "p2_orb_number", "p2_rune_stone",
  "p3_door_closed", "p3_door_open", "p3_gold_seal", "p3_gold_seal_cracked", "pr_party_table", "pr_cake", "cover_neel", "ui_panel_frame", "ui_button_pill", "ui_title_card", "ui_play_button", "ui_hint_hand"];


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
  const seal = el("div", "abs", ui, { left: cx - 100, top: cy - 100, width: 200, height: 200, background: "url(assets/p3_gold_seal.webp) center/contain no-repeat", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, fontWeight: 800, color: "#7a3a00" }, "m");
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
  return { done: wait(1.3), remove() { rays && rays.stop(); gsap.to([seal, glow], { scale: 0, opacity: 0, duration: 0.4, onComplete: () => { seal.remove(); glow.remove(); } }); } };
}
// string lights switch on one bulb at a time (bulb centres measured on de_string_lights, 839 px wide)
const BULBS = [[40, 82], [108, 117], [181, 142], [263, 162], [344, 175], [428, 180], [506, 175], [584, 163], [660, 147], [733, 120], [800, 85]];
function lightsUp(parent, left, top, width, rays = true) {
  const k = width / 839, cols = ["#ffd66b", "#ff8ad8", "#7ff0e0", "#ffb070", "#c9a2ff"];
  if (rays) el("div", "rays", parent, { left: left + width / 2 - 520, top: -560, width: 1040, height: 1040 });
  const gs = BULBS.map(([x, y], i) => el("div", "bulbGlow", parent, { left: left + x * k - 50, top: top + y * k - 50, width: 100, height: 100, background: `radial-gradient(circle,#fffbe8 0 14%,${cols[i % cols.length]} 32%,transparent 68%)`, animationDelay: `${-i * 0.37}s` }));
  gsap.from(gs, { scale: 0.2, duration: 0.3, stagger: 0.09, ease: "back.out(3)", onStart: () => sfx("magic") });
}
// scoreboard: m = ?, d = ? tiles that flip to a number
function board() {
  const b = el("div", "board", ui, {}, `<div class="tile m">m = <span class="num">?</span></div><div class="tile d">d = <span class="num">?</span></div>`);
  gsap.from(b.children, { y: -90, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(2)" });
  const flip = (k, v) => { const n = b.querySelector(`.tile.${k} .num`); gsap.to(n, { rotationX: 90, duration: 0.14, ease: "power1.in", onComplete: () => { n.textContent = v; gsap.fromTo(n, { rotationX: -90 }, { rotationX: 0, duration: 0.28, ease: "back.out(2)" }); } }); sfx("pop"); };
  return { el: b, flip, hide() { gsap.to(b, { autoAlpha: 0, duration: 0.3 }); }, show() { gsap.to(b, { autoAlpha: 1, duration: 0.3 }); } };
}

// ---------- scenes ----------
async function title() {
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
  const go = await new Promise((r) => {
    play.onpointerdown = (e) => { e.stopPropagation(); r(0); };
  });
  sfx("magic");
  gsap.killTweensOf(logo); logo.remove(); play.remove(); hero.remove();
  return go;
}

async function story() {
  music("calm");
  solo();
  await hostSwap("neel");
  await say("nar", "Welcome to Neel's Night Party!");
  sfx("owl");
  await say("nar", "Neel is throwing a party but he has not decided who all will he invite. Maya and Agni are helping him plan the party.");
  sfx("whoosh");
  await setScene("hall");
  setDim(0.35, 0.01);
  solo("duo"); // Agni and Maya talk: both stay on screen
  await hostSwap("agni");
  pose("agni", "shocked");
  // Agni's panic: a quick camera punch toward Agni with speed lines
  const hd = camPt(...headOf("agni"));
  punch(hd.x, hd.y); speedLines(hd.x, hd.y); sfx("boing");
  await say("agni", "Neel, you have not decided the number of guests coming? Then how will we plan? How many plates? How many sweets?", { p: "shocked" });
  // the unknown number: friend silhouettes keep changing (top left, above Agni), then become the letter m
  const SX = 350, SY = 250, mystery = mysteryFriends(SX, SY);
  await say("maya", "Don't worry. When we don't know a number, we can write it as a letter.", { p: "explain" });
  await mystery.collapse();
  const seal = stampSeal(SX, SY);
  await seal.done;
  await say("maya", "Neel's friends are monsters. So let's use the letter <b>m</b>, for number of monsters.", { p: "cast" });
  const cap = el("div", "mcap", ui, { left: SX, top: SY + 120 }, `<span class="mtxt">m</span> = number of Neel's monster friends`);
  gsap.from(cap, { y: 14, opacity: 0, duration: 0.4 });
  await say("maya", "Let's say <b>m</b> monster friends are coming.", { p: "explain" });
  await say("agni", "But Maya, m is not a number.", { p: "shocked" });
  await say("maya", "<b>m</b> is a <span class=v>variable</span> that represents a number. A variable is a number that is not fixed yet and can change.", { p: "explain" });
  await say("maya", "When Neel decides who is coming, we can easily find the exact number of things we need.", { p: "happy" });
  await say("agni", "Hmm! Variable! Let's plan!", { p: "cheer" });
  seal.remove(); gsap.to(cap, { opacity: 0, duration: 0.3, onComplete: () => cap.remove() });
}

function group(first) {
  setFocus(false);
  solo("duo");
  return hostSwap(first);
}
async function bridge(lines, danceAll = true) {
  sfx("win");
  closeBubble();
  hideChecklist();
  [...ui.children].forEach((c) => { if (c.id !== "bubble") gsap.to(c, { opacity: 0, duration: 0.3 }); });
  await group(lines[0][0]);
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
  await partTitle("PART 1 OF 3", "Neel's Party List");
  await runPart1(start);
  setAnswer("");
  // the hall lights up
  const lights = img("de_string_lights", $("#Lmid"), { left: 500, top: 0, width: 1000 });
  gsap.from(lights, { y: -200, duration: 0.8, ease: "bounce.out", onComplete: () => lightsUp($("#Lmid"), 500, 0, 1000) });
  setDim(0, 1.2);
  await bridge([["neel", "Thank you for helping to check my party list."], ["maya", "Great! Now you know that the number that can change is a <span class=v>variable</span>.", "happy"], ["maya", "And the numbers that stay the same are <span class=c>constants</span>.", "explain"], ["agni", "Come on! Let's write the party plan!"]]);
  hideChecklist();
}
async function part2(start = 1) {
  music("calm");
  clearUI();
  await setScene("cauldron");
  setDim(0, 0.01);
  setTint("rgba(120,60,200,.10)"); // night falls
  playFx("campfire", 720, 505, { scale: 3, parent: $("#Lfar") });
  await partTitle("PART 2 OF 3", "Write the Party Plan");
  await runPart2(start);
  setAnswer("");
  await bridge([["neel", "Yay! Good job. My party plan is ready!", "happy"]]);
  // the plan the child wrote, on a scroll; Neel keeps it safe
  const sc = await planScroll();
  await say("nar", "Well done! Here is Neel's Party Plan.");
  await say("neel", "This is our party plan. I will keep it safe until I decide who is coming!", { p: "happy" });
  await sc.roll();
  closeBubble();
  hideChecklist();
}
async function part3(start = 1) {
  music("calm");
  clearUI();
  await setScene("doors");
  setDim(0, 0.01);
  setTint("rgba(20,30,120,.18)"); // deep night
  await partTitle("PART 3 OF 3", "Neel Decides");
  await runPart3(start);
  setAnswer("");
  await bridge([["neel", "Yay! Now I know exactly what we need!"], ["agni", "Even when the numbers changed, the plan still worked!"], ["maya", "That is the magic of variables. m and d can be any number.", "celebrate"]]);
  hideChecklist();
}
async function ending(opt = {}) {
  music("calm");
  const skip = !!(opt.fin || opt.party || opt.wizard);
  clearUI();
  await setScene("hall");
  setDim(0, 0.01);
  setTint("rgba(255,90,180,.08)"); // party lights
  const L = $("#Lmid");
  img("de_string_lights", L, { left: 500, top: 0, width: 1000 });
  img("de_bunting", L, { left: 640, top: 190, width: 720 });
  lightsUp(L, 500, 0, 1000, false);
  hideAllChars();
  solo("duo");
  await hostSwap("neel");
  const sb = board();
  sfx("knock");
  if (!skip) await say("nar", "It's party day! Knock knock! The friends are here!");
  sfx("creak");
  // the guests stand behind the three friends: monsters on the left, dragons on the right
  const MON = ["gu_monster_green", "gu_monster_pink", "gu_monster_blue", "gu_monster_green"], DRA = ["gu_dragon_teal", "gu_dragon_red"];
  const gs = [];
  for (let i = 0; i < 4; i++) { const g = img(MON[i], world, { left: 150 + i * 105, top: 470, width: 130, height: 130 }); g.dataset.k = "m"; gs.push(g); gsap.from(g, { x: -600, opacity: 0, duration: 0.5, delay: i * 0.1 }); }
  crowd(gs, { cx: 420, top: 500, size: 130, maxW: 600 });
  sb.flip("m", 4);
  if (!skip) await say("neel", "Look! 4 of my monster friends are here!", { p: "happy" });
  for (let i = 0; i < 7; i++) { const g = img(DRA[i % 2], world, { left: 960 + i * 78, top: 470, width: 130, height: 130 }); g.dataset.k = "d"; gs.push(g); gsap.from(g, { x: 900, opacity: 0, duration: 0.5, delay: i * 0.08 }); }
  crowd(gs, { cx: 420, top: 500, size: 130, maxW: 600 });
  sb.flip("d", 7);
  if (!skip) {
    await say("agni", "And 7 of my dragon friends are here too!", { p: "cheer" });
    await say("neel", "My friends changed their minds, but our plan still worked!", { p: "happy" });
  }
  hideChecklist();
  if (!opt.wizard) {
    // "any number": the tiles flip through numbers while Maya says it, then settle back on 4 and 7
    const roll = setInterval(() => { sb.flip("m", 1 + Math.floor(Math.random() * 9)); sb.flip("d", 1 + Math.floor(Math.random() * 9)); }, 600);
    await say("maya", "That is because m and d can be any number. That is why we use variables. Well done!", { p: "celebrate" });
    clearInterval(roll); sb.flip("m", 4); sb.flip("d", 7);
    music("magic");
    await say("neel", "Let's party!", { p: "happy" });
  }
  closeBubble();
  sb.hide(); // the narrator's line takes the top centre, once the tiles have gone
  await wait(0.35);
  // the party: fireworks and confetti, then the curtain frames the stage for the end card
  sfx("cheer");
  // Neel, Agni and Maya all dance
  host.on = false;
  [["agni", 830, 470, true], ["neel", 1090, 520, false], ["maya", 1360, 520, true]].forEach(([k, x, sz, fl]) => { if (!C[k].visible) { placeChar(k, x, 895, sz, { flip: fl }); gsap.from(C[k].box, { opacity: 0, y: 40, duration: 0.4 }); } dance(k); });
  camSway();
  gs.forEach((g, i) => gsap.to(g, { y: -30, duration: 0.3 + (i % 3) * 0.05, yoyo: true, repeat: -1, ease: "power1.out", delay: i * 0.07 }));
  // fireworks on the left of the stage (Neel dances on the right): shell bursts and rockets take turns
  let shot = 0;
  const boom = () => {
    confetti(50); sfx("pop");
    if (shot++ % 2) playFx("rocket", 250 + Math.random() * 650, 760, { scale: 2 });
    else playFx("firework", 250 + Math.random() * 650, 130 + Math.random() * 150, { scale: 3 });
  };
  boom();
  const t = setInterval(boom, 1600);
  if (!opt.wizard) await say("nar", "The party begins! Neel, Agni, Maya and all their friends dance all night.", { wait: false, auto: 3.5 });
  curtainFrame();
  music("magic"); sfx("win");
  // the score lives on the card now, so the HUD, menu and scoreboard step aside
  showHud(false); showMenu(false);
  camRest(1.2);
  const wz = el("div", "wizard", ui, {}, `<h2>Variable Wizard!</h2><div class="big"><span class="gold">★</span> <span id="wzs">0</span> <span style="font-size:36px;color:#8f84b8">/ ${score.max}</span></div><ul><li>A <b style="color:#ffe066">variable</b> can change: <span class="mtxt">m</span>, <span class="dtxt">d</span></li><li>A <b class="cst">constant</b> stays the same</li><li>Put numbers in place of letters to find the exact amount</li></ul>`);
  gsap.from(wz, { scale: 0.5, opacity: 0, duration: 0.6, ease: "back.out(1.8)" });
  // gold stars rain down either side of the card
  playFx("starfall", 300, 840, { palette: "gold", scale: 2.6 }); setTimeout(() => playFx("starfall", 1300, 840, { palette: "gold", scale: 2.6 }), 350);
  // the title stamps on like a seal, the star pops as the score counts up
  gsap.fromTo(wz.querySelector("h2"), { scale: 2.6, rotation: -12, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.4, delay: 0.5, ease: "power4.in", onComplete: () => { shake(8); sfx("knock"); } });
  const wzc = { v: 0 }, wzs = wz.querySelector("#wzs"), star = wz.querySelector(".gold");
  let shown = 0;
  gsap.to(wzc, { v: score.stars, duration: 1.6, delay: 1, ease: "power2.out", onUpdate: () => {
    const v = Math.round(wzc.v);
    if (v === shown) return;
    shown = v; wzs.textContent = v;
    if (v % 5 === 0) { gsap.fromTo(star, { scale: 1.35 }, { scale: 1, duration: 0.25, ease: "back.out(3)" }); sfx("pop"); }
  } });
  const again = button("↻ Play again", 0, 0, wz);
  Object.assign(again.style, { position: "relative", left: "auto", top: "auto", translate: "none", display: "inline-flex", marginTop: "26px" });
  await waitClick(again);
  clearInterval(t);
  location.reload();
}

const RUN = { 1: part1, 2: part2, 3: part3, 4: ending };
async function main() {
  const ld = $("#loader");
  await preload(ALL, (p) => (ld.textContent = `Loading… ${Math.round(p * 100)}%`));
  const q = qaJump();
  const j = location.hash.match(/^#(p\d|end|map)$/);
  // a normal start opens on the title like a stage: the curtain waits shut behind the loader
  if (!q && !j) curtainShut();
  gsap.to(ld, { opacity: 0, duration: 0.4, onComplete: () => ld.remove() });
  const state = { done: {}, unlockAll: false };
  if (q) {
    state.unlockAll = true;
    showHud(true);
    if (q.at === "title") { const go = await title(); if (go !== 9) await story(); }
    else if (q.at === "story") { await setScene("forest", { fast: true, plain: true }); await story(); }
    else if (q.at === "p1") { await part1(q.n); state.done[1] = true; }
    else if (q.at === "p2") { await part2(q.n); state.done[2] = true; }
    else if (q.at === "p3") { await part3(q.n); state.done[3] = true; }
    else if (q.at === "fin") await ending({ fin: q.n });
    else if (q.at === "party") await ending({ party: true });
    else if (q.at === "wizard") await ending({ wizard: true });
  } else if (j && j[1] !== "map") { showHud(true); await RUN[({ p1: 1, p2: 2, p3: 3, end: 4 })[j[1]]](); }
  else if (!j) {
    const t = title();
    wait(0.5).then(() => curtainOpen());
    const go = await t;
    if (go === 9) state.unlockAll = true;
    else await story();
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
