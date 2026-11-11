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
- src/part2.js: Spell Cauldron (build expressions from orbs; Brew! tests 3 values at once and the 3 result lines land
  together; a right spell keeps its green ticks up 2 s before the praise; the 3rd wrong try puts the answer in the slot
  as Maya starts saying it). Controls Maya talks about are on screen (locked) while she says it, in every part
- src/part3.js: Magic Doors. Replies arrive as cards through the doors (no guests until the party), gold seals open
  independently, each right answer puts its things around the table and they stay; partyTable()/partyClear() for the party.
  Table places (layout()): nothing tall and no tag in front of the three doors (GAP: the wall between them).
  Chairs at both ends and behind the table, sweets/laddoo bowls in the gaps, low plate stacks in the middle,
  balloons high at the garland ends, cushions front right; the tabletop tags sit on the cloth. During a knock,
  clearDoor() fades whatever still overlaps that door and "Tap the door!" sits above it. When m or d changes, FORM works every group out
  again and restock() moves/adds/removes things, always with a Maya line (after Q6 and after Q8). Party: no tags,
  m = 4 / d = 7 never change, guests stand in loose groups at different depths with shadows
- src/finale.js: Party Day shopping. Not in the current script, so it is out of the flow (no room 4)
- src/map.js: level select (3 rooms, title fixed on screen) · src/qa.js: QA mode (press Q, or a #qa-p2-7 link);
  never remembered between visits, so players never see the badge or answers
- Set pieces: opening crane shot onto Neel's house (houseWindows/owlBlink in common.js), the m coin that spins through
  numbers (story, Part 3 seals, m 6 → 4), doors that swing open with light (part3 knockDoor), the cauldron test show and
  gold-ink plan (part2 bubbleTest/spellWorks), the jar that fills and the chest that locks (part1), the living map, and
  the arrival: friends walk up the path, the camera flies in through the round window to the party (main.js arrival()).
- src/common.js: praise cues, idleWatch (open()/pause(): nudges only while answers are open and nobody speaks),
  Party Plan scroll (dock/glow). No word box on screen in Parts 2-3: Maya says the clue word in her hint
- Dialogue (engine.js say()): lines are queued, never overlap; busy()/skipLine(); a bubble tap shows the whole line, the
  next tap moves on; into: el writes the words on a board (Part 1 chalkboard); onStart shows a board row with the line
  that says it, never before. partTitle() is not awaited: the part sets up under the card and its first line waits
  (afterTitle()). Bubbles keep "md" as one chip and a sum ("m + d") on one line (chipify). Timing lives in PACE.
  gsap.ticker.lagSmoothing(0): on a slow tablet animations keep clock time (they skip frames, never stretch).
- Inputs: lock(el) makes a control visibly asleep while someone talks; a tap on it wiggles and ends the line, or says
  why it is asleep (el._why). A tap made while a control was locked but delivered late (busy device) is dropped.
- setScene(name, {setup}): the old cast leaves behind the shut curtain; setup builds the new scene before it opens.
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
  Question progress ("Question x of N") top-right under the stars. Part 2: test results over the cauldron, under the
  card and above the spell; nothing animates over the spell. Part 3: equation bar (item = plan) top-centre, reply cards
  top-left (7 cards fit a row; numbered once counted), plan scroll docked top-right, answer gems bottom-right, smaller
  speaker bottom-left (SPOTS.table) whose side bubble grows upwards. Party: bubbles high (SPOTS.trioParty.ftop),
  monsters left and dragons right, one row each.
- No blue guest monster anywhere it could be read as a second Neel (gu_monster_blue).
- Keep the UI uncluttered and keep m purple / d orange everywhere.
- Keep assets WebP, total game under 20 MB. Re-encode from the lossless originals, never WebP from WebP:
  tools/optimize_images.py (sprite sheets q74, backgrounds at their drawn 2000 x 900).
- Smoothness: only the sprite sheet being played is displayed (a sheet decodes to about 38 MB); sheets are decoded
  ahead of use (warmChars, WARM in engine.js), backdrops decode behind the closed curtain, and a normal start loads only
  the title and story art (FIRST in main.js) before the rest loads one file at a time.
