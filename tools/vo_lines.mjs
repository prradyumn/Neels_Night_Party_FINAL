// vo_lines: list every line a character speaks, with its speaker, and the segments they are recorded as
// (tools/vo_lines.json). Every full utterance is listed, including the hint lines built from an opener
// ("Not yet. Try again. ") plus a hint; src/vo.js splits them into shared segments.
//   node tools/vo_lines.mjs
import { readFileSync, writeFileSync } from "fs";
import { clean, segments, voId } from "../src/vo.js";

const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const lines = new Map();
const add = (who, text) => { text = clean(text); if (text) lines.set(`${who}|${text}`, { who, text }); };

// a `const NAME = [ ... ];` data table, evaluated as JavaScript (only literals and small arrow functions)
function table(file, name) {
  const s = src(file), i = s.indexOf(`const ${name} = [`);
  if (i < 0) throw new Error(`${name} not found in ${file}`);
  let depth = 0, j = s.indexOf("[", i);
  for (let k = j; k < s.length; k++) { if (s[k] === "[") depth++; else if (s[k] === "]" && --depth === 0) return Function(`return ${s.slice(j, k + 1)}`)(); }
}
// literal calls: say("who", "text" ...) and maya("text" ...)
function calls(file) {
  const s = src(file);
  for (const m of s.matchAll(/\bsay\("(\w+)",\s*"((?:[^"\\]|\\.)*)"/g)) add(m[1], m[2]);
  for (const m of s.matchAll(/\bmaya\("((?:[^"\\]|\\.)*)"/g)) add("maya", m[1]);
  for (const m of s.matchAll(/\["(neel|agni|maya)",\s*"((?:[^"\\]|\\.)*)"/g)) add(m[1], m[2]);   // bridge and praise lines
}
["main.js", "part1.js", "part2.js", "part3.js", "finale.js", "common.js"].forEach(calls);

// Part 1: the speaker's line, Maya's explanation, hints and nudges
for (const it of table("part1.js", "ITEMS")) {
  add(it.who, it.line);
  add("maya", it.exp);
  add("maya", "Let's see the answer together. " + it.exp);
  for (const h of [it.h1, it.h2]) add("maya", "Not yet. Try again. " + h);
  add("maya", it.inact + " Turn the dial.");
  add("maya", it.inact + " Tap Variable or Constant.");
}
add("maya", "Now you know! Let's check the next thing.");
// Part 2
for (const q of table("part2.js", "Q")) {
  if (q.beat) continue;
  add(q.who, q.line);
  add("maya", q.exp);
  add("maya", "Take your time. " + q.h1);
  add("maya", "Not yet. Try again. " + q.h1);
  add("maya", "Not yet. " + q.h1);
  if (q.h2) add("maya", "Not yet. " + q.h2);
}
// Part 3
for (const q of table("part3.js", "Q")) {
  add(q.who, q.line);
  add("maya", q.exp);
  add("maya", "Take your time. " + q.h1);
  add("maya", "Not yet. Try again. " + q.h1);
  add("maya", "Let's see it together. " + q.exp);
}
add("agni", "Listen! Someone is knocking!");
add("agni", "More knocking! Who is it?");
// Finale: Neel and Agni take turns asking
table("finale.js", "ITEMS").forEach((it, q) => {
  add(q % 2 ? "agni" : "neel", it.line);
  add("maya", "Not yet. " + it.h1);
  add("maya", "Here it is: " + it.work + ".");
});

const segs = new Map();
for (const { who, text } of lines.values()) for (const seg of segments(text)) segs.set(voId(who, seg), { id: voId(who, seg), who, text: seg });
const out = [...segs.values()];
writeFileSync(new URL("./vo_lines.json", import.meta.url), JSON.stringify(out, null, 1));
const by = out.reduce((a, l) => ((a[l.who] = (a[l.who] || 0) + 1), a), {});
console.log(lines.size, "lines ->", out.length, "recordings", by, "words", out.reduce((n, l) => n + l.text.split(" ").length, 0));
