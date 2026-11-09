// House map: the level select. Four rooms joined by a path; Neel hops to the next room as the kid progresses.
import { gsap, el, img, ui, wait, sfx, setScene, setFocus, setDim, hideAllChars, onTap, pointHand, score, showHud, playFx, camUI, camTo, camPt, W, H, $ } from "./engine.js";
import { houseWindows, owlBlink } from "./common.js";

// three rooms: the party is the end of room 3, not a room of its own
export const ROOMS = [
  { id: 1, name: "Neel's Party List", icon: "p1_variable_jar", bg: "bg_hall_far", x: 420, y: 560, max: 24 },
  { id: 2, name: "Write the Party Plan", icon: "p2_cauldron", bg: "bg_cauldron_far", x: 820, y: 330, max: 27 },
  { id: 3, name: "Neel Decides", icon: "p3_door_closed", bg: "bg_doors_far", x: 1220, y: 560, max: 24 },
];

let neelAt = 0; // index of the room Neel stands at
let litWas = 0; // how many of the house windows were lit last time
// a locked room says which room opens it, just under the card
function lockedTip(c, cur) {
  c.querySelector(".locktip")?.remove();
  const t = el("div", "locktip", c, {}, `Finish room ${cur + 1} first!`);
  gsap.fromTo(t, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.25 });
  gsap.to(t, { opacity: 0, duration: 0.3, delay: 2, onComplete: () => t.remove() });
}
export async function houseMap(state) {
  await setScene("forest");
  hideAllChars();
  setFocus(true);
  setDim(0.25);
  showHud(true);
  // Neel's house lights one more window for every room finished
  const mid = $("#Lmid"), house = houseWindows(mid), lit = ROOMS.filter((r) => state.done[r.id]).length;
  house.lit(litWas, false);
  setTimeout(() => house.lit(lit), 900);
  litWas = lit;
  owlBlink(mid);
  const next = ROOMS.findIndex((r) => !state.done[r.id]);
  const cur = next === -1 ? ROOMS.length - 1 : next;
  const m = el("div", "map", camUI); // the map lives in the scene, so the camera can travel over it
  // the title stays fixed on screen: the camera's zoom never cuts it off
  const h1 = el("h1", "maptitle", ui, {}, "Neel's House");
  // path
  const pts = ROOMS.map((r) => [r.x, r.y]);
  const d = pts.map((p, i) => (i ? `Q ${(pts[i - 1][0] + p[0]) / 2} ${i % 2 ? p[1] + 160 : p[1] - 160} ${p[0]} ${p[1]}` : `M ${p[0]} ${p[1]}`)).join(" ");
  // the whole path is a faint dotted trail; the stretch walked so far is drawn in glowing gold, the new part drawing itself
  const walked = pts.slice(0, cur + 1).map((p, i) => (i ? `Q ${(pts[i - 1][0] + p[0]) / 2} ${i % 2 ? p[1] + 160 : p[1] - 160} ${p[0]} ${p[1]}` : `M ${p[0]} ${p[1]}`)).join(" ");
  m.insertAdjacentHTML("beforeend", `<svg width="1600" height="900" style="position:absolute;left:0;top:0;pointer-events:none"><path d="${d}" fill="none" stroke="rgba(255,197,71,.35)" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 30"/>${cur ? `<path class="walked" d="${walked}" pathLength="1" fill="none" stroke="#ffd76a" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 1"/>` : ""}</svg>`);
  const wp = m.querySelector(".walked");
  if (wp) gsap.fromTo(wp, { strokeDashoffset: neelAt === cur ? 0 : 1 - neelAt / Math.max(1, cur) }, { strokeDashoffset: 0, duration: 1.2, delay: 0.4, ease: "power2.inOut" });
  const cards = ROOMS.map((r, i) => {
    const locked = i > cur && !state.unlockAll, done = !!state.done[r.id];
    const c = el("div", "room" + (locked ? " locked" : "") + (done ? " done" : ""), m, { left: r.x - 150, top: r.y - 110 });
    el("div", "num", c, {}, String(r.id));
    const th = el("div", "th", c, { backgroundImage: `url(assets/${r.bg}.webp)` });
    img(r.icon, th, {}, "ic");
    if (locked) el("div", "lk", th, {}, "🔒");
    el("div", "nm", c, {}, r.name);
    // a finished room shows 1-3 stars instead of a raw score
    const got = score.room[r.id] || 0, rate = got >= r.max * 0.9 ? 3 : got >= r.max * 0.6 ? 2 : 1;
    el("div", "ss", c, {}, done ? "★".repeat(rate) + `<b>${"★".repeat(3 - rate)}</b>` : "");
    gsap.from(c, { y: 40, opacity: 0, duration: 0.45, delay: 0.1 + i * 0.08, ease: "back.out(1.6)" });
    return c;
  });
  // Neel token hops to the current room
  const tok = el("div", "abs", m, { width: 150, height: 153, left: ROOMS[neelAt].x - 285, top: ROOMS[neelAt].y - 60, background: "url(assets/anim_neel_happy.webp) 0 0/600% 600% no-repeat" });
  await wait(0.6);
  if (neelAt !== cur) {
    for (let k = neelAt + 1; k <= cur; k++) {
      sfx("whoosh");
      camTo({ x: ROOMS[k].x, y: ROOMS[k].y, s: 1.04, dur: 0.7 }); // follow Neel's token
      await gsap.to(tok, { left: ROOMS[k].x - 285, top: ROOMS[k].y - 60, duration: 0.7, ease: "power1.inOut" });
      gsap.fromTo(tok, { y: 0 }, { y: -50, duration: 0.2, yoyo: true, repeat: 1 });
    }
    neelAt = cur;
    playFx("collect", ROOMS[cur].x, ROOMS[cur].y + 40, { palette: "gold", scale: 3 });
    sfx("magic");
  }
  gsap.to(tok, { y: -14, duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
  cards[cur].classList.add("pulse");
  const rays = playFx("sunburst", ROOMS[cur].x, ROOMS[cur].y - 20, { palette: "gold", scale: 5.5 }); // the next room glows
  await camTo({ x: W / 2, y: H / 2, s: 1, dur: 0.8 }); // the whole house stays in view
  const hp = camPt(ROOMS[cur].x + 140, ROOMS[cur].y - 30);
  const hand = await pointHand(hp.x, hp.y, 0);
  const pick = await new Promise((res) => {
    cards.forEach((c, i) => onTap(c, () => {
      if (c.classList.contains("locked")) { sfx("boing"); gsap.fromTo(c, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2,.3)" }); lockedTip(c, cur); return; }
      sfx("tap"); res(ROOMS[i].id);
    }));
  });
  hand.remove(); rays.stop();
  // dive into the chosen room before the curtain closes
  const room = ROOMS.find((r) => r.id === pick);
  await camTo({ x: room.x, y: room.y, s: 1.35, dur: 0.55, ease: "power2.in" });
  await gsap.to([m, h1], { opacity: 0, duration: 0.3 });
  m.remove(); h1.remove();
  setFocus(false, 0.01);
  return pick;
}
