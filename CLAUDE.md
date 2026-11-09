# Neel's Night Party

A browser game that teaches Class 6–7 algebra (variables vs constants, writing expressions,
substitution). Plain JS + GSAP 3.12.5, bundled with esbuild into game.js / game.css. No framework.

Run: open index.html, or `npm run serve`. Edit in src/, then `npm run watch` (or `npm run build`).
Run `npm install` once first (node_modules/ is not checked in).
Never hand-edit game.js / game.css; they are build outputs.
Deploy: Vercel runs `npm run dist` (vercel.json), which builds and copies index.html, game.js, game.css and assets/ into public/.

## Structure
- src/main.js: flow (title → story → house map → rooms 1–4 → ending → wizard card). Script source of truth:
  the Game sheet (Neel's Night Party - Game.csv); the Story sheet is the older draft
- src/engine.js: 1600×900 scaled stage, 3-layer parallax, sprite-sheet characters,
  speech bubbles, stars/HUD, synth SFX, browser TTS, curtain scene transition
  (src/curtain.svg, imported as text; left/right/valance groups moved as 3 layers)
- Camera (engine.js): #cam holds backgrounds, world, characters and effects; #ui, HUD and curtain stay fixed.
  camTo/camFocus/camRest/punch/shake move it; camPt(x, y, layer) converts a scene point to screen (use it to aim
  UI at scene objects). Put UI-anchored effects in ui (playFx parent: ui), scene effects in the default #fxl.
- src/part1.js: Friend Dial (sort items into Variable jar / Constant chest)
- src/part2.js: Spell Cauldron (build expressions from orbs, test-run with m/d values)
- src/part3.js: Magic Doors (crack gold seals to substitute m, d; pick answer)
- src/finale.js: Party Day shopping. Not in the current script, so it is out of the flow (room 4 = ending only)
- src/map.js: level select · src/qa.js: QA mode (press Q, jump via #qa-p2-7)
- src/common.js: one-character-on-screen helpers, per-question praise cues, idle hints, Party Plan scroll, word helper
- src/fx.js + pixelfx/: pixel particle effects (MIT, vendored)
- Audio: src/sfx/*.mp3 (bundled as data URLs via esbuild's mp3 loader) and assets/audio/*.mp3 music;
  all CC0, sources in assets/audio/CREDITS.txt. sfx(type) plays a recording when loaded, else the synth;
  music("calm"|"magic") crossfades and starts on the first tap; it ducks while TTS speaks
- assets/: 67 WebP files. anim_* = Ludo sprite sheets, 36 frames in a 6×6 grid,
  sizes in src/anim_meta.json; bg_<scene>_far/mid/fore = parallax layers

## Layout rules
- Speaking character bottom-left, question card top-centre. When two characters talk to each other (story, bridges,
  Part 2 beat and m + d example, ending) both stay on screen: solo("duo") / solo("duoGame"); questions stay one speaker.
  All tappable controls in the bottom-right action zone, ★ counter top-right.
  Exception, Part 3 (Magic Doors): equation bar top-centre, guests flank the table (monsters left, dragons right),
  answer gems in a panel under the table, smaller speaker bottom-left with the bubble beside them (SPOTS.table).
- Keep the UI uncluttered and keep m purple / d orange everywhere.
- Keep assets WebP, total game under 20 MB.
