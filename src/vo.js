// Voice-over lookup, shared by the game (engine.js) and the recorder (tools/vo_lines.mjs).
// A spoken line is played as one or more recorded segments: openers such as "Not yet. Try again." are recorded once
// and played before the hint they introduce, so each hint is recorded once, not once per opener.
// Recordings live at assets/vo/<id>.mp3, where id hashes (speaker, segment text).

export const PREFIXES = ["Not yet. Try again. ", "Let's see the answer together. ", "Let's see it together. ", "Take your time. ", "Not yet. ", "Here it is: "];
export const SUFFIXES = [" Turn the dial.", " Tap Variable or Constant."];

/** the text a recording is keyed on: no HTML, single spaces */
export const clean = (t) => t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** split a line into the segments it is recorded as */
export function segments(text) {
  let t = clean(text);
  const out = [];
  for (const p of PREFIXES) if (t.startsWith(p) && t.length > p.length) { out.push(p.trim()); t = t.slice(p.length); break; }
  let tail = null;
  for (const s of SUFFIXES) if (t.endsWith(s) && t.length > s.length) { tail = s.trim(); t = t.slice(0, -s.length); break; }
  out.push(t);
  if (tail) out.push(tail);
  return out;
}

/** file id for (speaker, segment): 32-bit FNV-1a, hex */
export function voId(who, seg) {
  let h = 0x811c9dc5;
  const s = `${who}|${seg}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return `${who}_${h.toString(16).padStart(8, "0")}`;
}
