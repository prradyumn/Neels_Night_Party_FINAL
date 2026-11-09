# Neel's Night Party

A browser game that teaches Class 6–7 algebra (variables vs constants, writing expressions,
substitution). Plain JS + GSAP 3.12.5, bundled with esbuild into game.js / game.css. No framework.

Run: open index.html, or `npm run serve`. Edit in src/, then `npm run watch` (or `npm run build`).
Run `npm install` once first (node_modules/ is not checked in).
Never hand-edit game.js / game.css; they are build outputs.
Deploy: Vercel runs `npm run dist` (vercel.json), which builds and copies index.html, game.js, game.css and assets/ into public/.

## Structure
- src/main.js: flow (title → story at Neel's house → house map → rooms 1–3; room 3 ends with the party, then Play again).
  Script source of truth: the Game sheet (Neel's Night Party - Game.csv) plus the review notes
  (Neels_Night_Party_Review_Notes.pdf); the Story sheet is the older draft
- src/engine.js: 1600×900 scaled stage, 3-layer parallax, sprite-sheet characters,
  speech bubbles, stars/HUD, synth SFX, browser TTS, curtain scene transition
  (src/curtain.svg, imported as text; left/right/valance groups moved as 3 layers)
- Camera (engine.js): #cam holds backgrounds, world, characters and effects; #ui, HUD and curtain stay fixed.
  camTo/camFocus/camRest/punch/shake move it; camPt(x, y, layer) converts a scene point to screen (use it to aim
  UI at scene objects). Put UI-anchored effects in ui (playFx parent: ui), scene effects in the default #fxl.
- src/part1.js: Friend Dial (sort items into Variable jar / Constant chest)
- src/part2.js: Spell Cauldron (build expressions from orbs, test-run with m/d values)
- src/part3.js: Magic Doors. Replies arrive as cards through the doors (no guests until the party), gold seals open
  independently, each right answer puts its things around the table and they stay; partyTable()/partyClear() for the party
- src/finale.js: Party Day shopping. Not in the current script, so it is out of the flow (no room 4)
- src/map.js: level select (3 rooms, title fixed on screen) · src/qa.js: QA mode (press Q, or a #qa-p2-7 link);
  never remembered between visits, so players never see the badge or answers
- Set pieces: opening crane shot onto Neel's house (houseWindows/owlBlink in common.js), the m coin that spins through
  numbers (story, Part 3 seals, m 6 → 4), doors that swing open with light (part3 knockDoor), the cauldron test show and
  gold-ink plan (part2 bubbleTest/spellWorks), the jar that fills and the chest that locks (part1), the living map, and
  the arrival: friends walk up the path, the camera flies in through the round window to the party (main.js arrival()).
- src/common.js: praise cues, idleWatch (open()/pause(): nudges only while answers are open and nobody speaks),
  Party Plan scroll (dock/glow), word helper
- Dialogue (engine.js say()): lines are queued, never overlap; busy()/skipLine(); a bubble tap shows the whole line, the
  next tap moves on; into: el writes the words on a board (Part 1 chalkboard). Timing lives in PACE.
- Inputs: lock(el) makes a control visibly asleep while someone talks; a tap on it wiggles and ends the line.
- Hints in every part: wrong 1 = clue, wrong 2 = clue with the numbers on screen, wrong 3 = answer (highlighted).
- src/fx.js + pixelfx/: pixel particle effects (MIT, vendored)
- Audio: src/sfx/*.mp3 (bundled as data URLs via esbuild's mp3 loader) and assets/audio/*.mp3 music;
  all CC0, sources in assets/audio/CREDITS.txt. sfx(type) plays a recording when loaded, else the synth;
  music("calm"|"magic") crossfades and starts on the first tap; it ducks while TTS speaks
- assets/: 72 WebP files (plus audio). fx_coin_spin (the gold m coin, 12 frames; common.js coin()) is a Blender render too
  (tools/blender/coin.py). pr_party_table_3d (the Part 3 table) and pr_bowl are Blender renders made at the hall floor's
  angle (about 11 degrees), shadow baked in: tools/blender/table.py, bowl.py, finish.py
  (`blender -b --python tools/blender/table.py -- out.png 96 11`, then `python3 tools/blender/finish.py out.png assets/pr_party_table_3d.webp 1100`). anim_* = Ludo sprite sheets, 36 frames in a 6×6 grid,
  sizes in src/anim_meta.json; bg_<scene>_far/mid/fore = parallax layers

## Layout rules
- Speaking character bottom-left, question card top-centre. When two characters talk to each other (story, bridges,
  Part 2 beat and m + d example, ending) both stay on screen: solo("duo") / solo("duoGame"); questions stay one speaker.
  All tappable controls in the bottom-right action zone, ★ counter top-right.
  The three friends together (story, bridges, Part 2 dragon beat, Part 3 intro, party) use trio(): SPOTS.trio*.
  Question progress ("Question x of N") top-right under the stars. Part 2: word helper top-right, test results over
  the cauldron. Part 3: equation bar (item = plan) top-centre, reply cards top-left, plan scroll docked top-right,
  word helper bottom-right, answer gems under the table, smaller speaker bottom-left (SPOTS.table).
- No blue guest monster anywhere it could be read as a second Neel (gu_monster_blue).
- Keep the UI uncluttered and keep m purple / d orange everywhere.
- Keep assets WebP, total game under 20 MB. Re-encode from the lossless originals, never WebP from WebP:
  tools/optimize_images.py (sprite sheets q74, backgrounds at their drawn 2000 x 900).
- Smoothness: only the sprite sheet being played is displayed (a sheet decodes to about 38 MB); sheets are decoded
  ahead of use (warmChars, WARM in engine.js), backdrops decode behind the closed curtain, and a normal start loads only
  the title and story art (FIRST in main.js) before the rest loads one file at a time.
