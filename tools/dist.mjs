// dist: copy what the game needs at runtime into public/ (Vercel's output folder).
//   npm run dist   (runs the build first)
import { cpSync, rmSync, mkdirSync } from "fs";

const root = new URL("../", import.meta.url), out = new URL("../public/", import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
// assets/vo/takes/ holds every voice take (tools/make_voices_chatter.py): kept for re-making lines, never deployed
const skip = (p) => !/[\\/]assets[\\/]vo[\\/]takes([\\/]|$)/.test(p);
for (const f of ["index.html", "game.js", "game.css", "assets"]) cpSync(new URL(f, root), new URL(f, out), { recursive: true, filter: skip });
console.log("public/ ready");
