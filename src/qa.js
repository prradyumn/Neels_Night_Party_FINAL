// QA mode: press Q to open a panel to jump to any level / question, auto-skip dialogue, speed up, and see answers.
import { gsap, el, stage } from "./engine.js";

const KEY = "nnp_qa";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
export const qa = { on: !!saved.on, auto: !!saved.auto, fast: !!saved.fast, showAns: saved.showAns !== false, answer: "" };
function save() { try { localStorage.setItem(KEY, JSON.stringify({ on: qa.on, auto: qa.auto, fast: qa.fast, showAns: qa.showAns })); } catch (e) {} }
let drove = false;
function apply() {
  if (qa.on || drove) {
    window.__auto = qa.on && qa.auto ? 1 : 0;
    window.__speed = qa.on && qa.fast ? 2 : 1;
    gsap.globalTimeline.timeScale(window.__speed);
    drove = qa.on;
  }
  badge.style.display = qa.on ? "flex" : "none";
  ansChip.style.display = qa.on && qa.showAns && qa.answer ? "block" : "none";
}

/** Parts call this with the correct answer of the current question. */
export function setAnswer(a) {
  qa.answer = a == null ? "" : String(a);
  ansChip.innerHTML = `QA answer: <b>${qa.answer}</b>`;
  if (panel) panel.querySelector(".qaans").innerHTML = qa.answer ? `Current answer: <b>${qa.answer}</b>` : "No question on screen";
  apply();
}

/** Parse the QA jump from the address: #qa-p2-5 -> { at: "p2", n: 5 } */
export function qaJump() {
  const m = location.hash.match(/^#qa-(title|story|map|p1|p2|p3|fin|party|wizard)(?:-(\d+))?$/);
  return m ? { at: m[1], n: m[2] ? +m[2] : 1 } : null;
}
function go(at, n) {
  location.hash = `qa-${at}${n ? "-" + n : ""}`;
  location.reload();
}

const badge = el("div", "qabadge", stage, {}, "QA");
const ansChip = el("div", "qaans-chip", stage, {}, "");
badge.onpointerdown = (e) => { e.stopPropagation(); toggle(); };
let panel = null;

function row(parent, label, at, count) {
  const r = el("div", "qarow", parent);
  el("span", "qalbl", r, {}, label);
  if (!count) { const b = el("button", "qab", r, {}, "Go"); b.onpointerdown = (e) => { e.stopPropagation(); go(at); }; return; }
  for (let i = 1; i <= count; i++) { const b = el("button", "qab", r, {}, String(i)); b.onpointerdown = (e) => { e.stopPropagation(); go(at, i); }; }
}
function toggleRow(parent, label, key) {
  const r = el("label", "qatog", parent);
  r.innerHTML = `<span>${label}</span><b>${qa[key] ? "ON" : "OFF"}</b>`;
  r.onpointerdown = (e) => { e.stopPropagation(); qa[key] = !qa[key]; r.lastChild.textContent = qa[key] ? "ON" : "OFF"; save(); apply(); };
}
function open() {
  panel = el("div", "qapanel", stage);
  panel.onpointerdown = (e) => e.stopPropagation();
  el("div", "qahead", panel, {}, `<b>QA MODE</b><span>press Q to close</span>`);
  el("div", "qaans", panel, {}, qa.answer ? `Current answer: <b>${qa.answer}</b>` : "No question on screen");
  const t = el("div", "qasec", panel);
  toggleRow(t, "Auto-skip dialogue", "auto");
  toggleRow(t, "Speed ×2", "fast");
  toggleRow(t, "Show answer chip", "showAns");
  const j = el("div", "qasec", panel);
  el("div", "qasub", j, {}, "Jump to");
  row(j, "Title", "title"); row(j, "Story intro", "story"); row(j, "House map", "map");
  row(j, "Part 1 · Friend Dial", "p1", 8);
  row(j, "Part 2 · Spell Cauldron", "p2", 10);
  row(j, "Part 3 · Magic Doors", "p3", 8);
  row(j, "Finale · Shopping", "fin", 4);
  row(j, "Party dance", "party"); row(j, "Wizard card", "wizard");
  const off = el("button", "qab wide", panel, {}, "Turn QA mode off");
  off.onpointerdown = (e) => { e.stopPropagation(); qa.on = false; save(); apply(); close(); };
  gsap.from(panel, { x: 60, opacity: 0, duration: 0.25 });
}
function close() { panel?.remove(); panel = null; }
function toggle() {
  if (panel) { close(); return; }
  qa.on = true; save(); apply(); open();
}
addEventListener("keydown", (e) => {
  if (e.key === "q" || e.key === "Q") { if (e.target.closest && e.target.closest("input,textarea")) return; toggle(); }
  if (e.key === "Escape") close();
});
apply();
