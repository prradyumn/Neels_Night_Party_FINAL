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
function table(file, name, scope = {}) {
  const s = src(file), i = s.indexOf(`const ${name} = [`);
  if (i < 0) throw new Error(`${name} not found in ${file}`);
  let depth = 0, j = s.indexOf("[", i);
  for (let k = j; k < s.length; k++) { if (s[k] === "[") depth++; else if (s[k] === "]" && --depth === 0) return Function("tbl", ...Object.keys(scope), `return ${s.slice(j, k + 1)}`)(() => "", ...Object.values(scope)); } // tbl: Part 2's card table, not spoken
}
// literal calls: say("who", "text" ...) and maya("text" ...)
const lit = (s) => JSON.parse(`"${s}"`); // the string as JavaScript reads it (\" -> ")
function calls(file) {
  const s = src(file);
  for (const m of s.matchAll(/\bsay\("(\w+)",\s*"((?:[^"\\]|\\.)*)"/g)) add(m[1], lit(m[2]));
  for (const m of s.matchAll(/\bmaya\("((?:[^"\\]|\\.)*)"/g)) add("maya", lit(m[1]));
  for (const m of s.matchAll(/\["(neel|agni|maya)",\s*"((?:[^"\\]|\\.)*)"/g)) add(m[1], lit(m[2]));   // bridge and praise lines
}
["main.js", "part1.js", "part2.js", "part3.js", "common.js"].forEach(calls);
// Part 2: Maya's m + d example (line("...")) and why an orb can't go there (rule())
{
  const s = src("part2.js"), r = s.slice(s.indexOf("function rule("), s.indexOf("export function show("));
  for (const m of s.matchAll(/\bline\("((?:[^"\\]|\\.)*)"/g)) add("maya", lit(m[1]));
  for (const m of r.matchAll(/"((?:[^"\\]|\\.)*\.)"/g)) add("maya", lit(m[1]));
}

// Part 1: the speaker's line, Maya's explanation, hints, the answer shown, nudges
const ANS1 = { v: "Variable (it can change)", c: "Constant (it stays the same)" };
const ITEMS1 = table("part1.js", "ITEMS");
for (const it of ITEMS1) {
  add(it.who, it.line);
  add("maya", "Correct! " + it.exp);
  add("maya", `Let's see the answer together. The answer is ${ANS1[it.ans]}. ` + it.exp);
  add("maya", "Not yet. Try again. " + it.h1);
  // the second clue reads the dial (2 to 8) and the value Maya turns it to: every one is recorded.
  // Keep in step with part1.js liveClue.
  for (let a = 2; a <= 8; a++) {
    let b = a <= 5 ? a + 3 : a - 3;
    if (it.ans === "v" && it.f(a) === it.f(b)) b = it.f(a) === it.f(2) ? 8 : 2;
    add("maya", it === ITEMS1[0] ? `It was ${a} friends. Now it is ${b} friends. Did the number change?`
      : `When ${a} friends come, ${it.there(it.f(a))}. When ${b} friends come, ${it.there(it.f(b), it.ans === "c")}. Did the number change?`);
  }
  add("maya", it.inact + " Turn the dial.");
  add("maya", "Take your time. " + it.inact + " Tap Variable or Constant.");
}
// Part 2
for (const q of table("part2.js", "Q")) {
  if (q.beat || q.example) continue;
  add(q.who, q.line);
  add("maya", "Correct! " + q.exp);
  add("maya", "Take your time. " + q.inact);
  add("maya", "Not yet. Try again. " + q.h1);
  if (q.h2) add("maya", "Not yet. Try again. " + q.h2);
  add("maya", `Let's see the answer together. The answer is ${q.ans}. ` + q.exp);
}
// Part 3: the hints are worked from the values m and d have at that question
const P3V = [{ m: 6, d: 0 }, { m: 6, d: 0 }, { m: 6, d: 0 }, { m: 6, d: 4 }, { m: 6, d: 4 }, { m: 6, d: 4 }, { m: 4, d: 4 }, { m: 4, d: 7 }];
for (const [i, q] of table("part3.js", "Q", { tens: (a, b) => `${a - (a % 10)} + ${b - (b % 10)} is ${a - (a % 10) + b - (b % 10)}, and ${a % 10} + ${b % 10} is ${(a % 10) + (b % 10)}` }).entries()) {
  const v = P3V[i];
  add(q.who, q.line);
  add("maya", "Correct! " + q.exp);
  add("maya", "Take your time. " + q.inact(v));
  add("maya", "Not yet. Try again. " + q.h1(v));
  add("maya", "Not yet. Try again. " + q.h2(v));
  add("maya", `Let's see the answer together. The answer is ${q.ans}. ` + q.exp);
}
add("agni", "Listen! Someone is knocking!");
add("agni", "More knocking! Who is it?");

const segs = new Map();
for (const { who, text } of lines.values()) for (const seg of segments(text)) segs.set(voId(who, seg), { id: voId(who, seg), who, text: seg });
const out = [...segs.values()];
writeFileSync(new URL("./vo_lines.json", import.meta.url), JSON.stringify(out, null, 1));
const by = out.reduce((a, l) => ((a[l.who] = (a[l.who] || 0) + 1), a), {});
console.log(lines.size, "lines ->", out.length, "recordings", by, "words", out.reduce((n, l) => n + l.text.split(" ").length, 0));
