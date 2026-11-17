# Neel's Night Party

A browser game that teaches Class 6–7 algebra (variables vs constants, writing expressions,
substitution). Plain JS + GSAP 3.12.5, bundled with esbuild into game.js / game.css. No framework.

Run: open index.html, or `npm run serve`. Edit in src/, then `npm run watch` (or `npm run build`).
Run `npm install` once first (node_modules/ is not checked in).
Never hand-edit game.js / game.css; they are build outputs.
Deploy: Vercel runs `npm run dist` (vercel.json), which builds and copies index.html, game.js, game.css and assets/ into public/.

## Structure
- src/main.js: flow (title → story at Neel's house → house map → rooms 1–3; room 3 ends with the party; no Play again button: the party stays the picture).
  Script source of truth: the Game sheet (Neel's Night Party - Game.csv) plus the review notes
  (Neels_Night_Party_Review_Notes.pdf); the Story sheet is the older draft. Review 2 (Nov 2026) changed lines in the
  code, ahead of the sheet: the premise is "Neel has invited his friends, but the replies have not come yet" (Part 3's
  knocks bring the replies), Part 1's dial demo, Part 2's plain words (tiles, Check, magic pot, plan, never spell/orb/
  brew/cauldron/seal). Any other new line needs the sheet.
- src/engine.js: 1600×900 scaled stage, 3-layer parallax, sprite-sheet characters,
  speech bubbles, stars/HUD, synth SFX, browser TTS, curtain scene transition
  (src/curtain.svg, imported as text; left/right/valance groups moved as 3 layers)
- Parallax never follows the cursor (it made the picture shake while a child aimed): the layers only sway slowly and
  move with the camera.
- Camera (engine.js): #cam holds backgrounds, world, characters and effects; #ui, HUD and curtain stay fixed.
  camTo/camFocus/camRest/punch/shake move it; camPt(x, y, layer) converts a scene point to screen (use it to aim
  UI at scene objects). Put UI-anchored effects in ui (playFx parent: ui), scene effects in the default #fxl.
- src/part1.js: Friend Dial: turn the dial, watch the table, tap the Variable or Constant button (review 2: plain
  buttons, no jar or chest). Neel's party list (.plist) is introduced big in the middle, then stays top-right as the
  level's progress (current item lit, a checked one ticked with its word). The chalkboard has one board per word
  (heading VARIABLE / CONSTANT): the meaning, then an example acted out under the words (example(): friends and cards,
  or friends and one table; each step starts when the board writes its number, atWord). Then Maya shows the dial with
  chairs (dialDemo; chairs are not on the list). The things on display stand on a small table (TB, two staggered rows
  when there are more than 4). The dial's badge says its value in words ("4 friends"). The buttons open with the
  question: the dial is optional ("Turn the dial to check"), never a gate; hint 2 still turns it to show the numbers
- src/part2.js: Write the Party Plan (build expressions from tiles: plain keys, m purple, d orange, numbers teal, signs
  gold; Check tests 3 values at once in the magic pot (the cauldron art) and the 3 result lines land
  together; a right spell keeps its green ticks up 2 s before the praise; the 3rd wrong try puts the answer in the slot
  as Maya starts saying it). Controls Maya talks about are on screen (locked) while she says it, in every part
- src/part3.js: Magic Doors. Replies arrive as cards through the doors (no guests until the party). The plan's letters
  (.seal: a plain m or d in a dashed box, review 2) open one by one when tapped. Each question is solved on a chalkboard
  over the hall (BOARD: the plan's letters, answer gems, "x is not enough"
  for a wrong gem; the table never shows a wrong number). The empty table slides out while the board is up (it would cut it in half) and comes back as the board lifts (boardIn/boardOut); when solved the board lifts, the worked plan goes to the top
  and the things drop onto the table. They show only while they are talked about (hideGroups() at each question start):
  their own question, a recount (restock() brings a hidden kind back before it changes: chairs, sweets, balloons after
  Q6; plates, cushions after Q8) and the party. The string-light garland over the table is hung for the party only;
  partyTable()/partyClear() for the party.
  Size: the table and its things are one group (tg), 1.3x from the table's feet and 60 px right while the level is played,
  1x at the party (BIG); the Part 3 speakers are 15% bigger (SPOTS.table, trioTable). A knock (knockDoor) slides the table
  group away, the camera moves in on the door (DOORZ) and spotOn() dims the rest; it all comes back after the replies.
  Table places (layout()): nothing tall and no tag in front of the three doors (GAP: the wall between them).
  Chairs stand on the floor at the table's scale: the two end chairs on the floor halfway back (TB.foot - 24, 190 px
  tall), the rest behind the table so only their backrests show over the tabletop. Sweets/laddoo bowls in the gaps, low
  plate stacks in the middle, balloons high over the table ends, cushions front right. No count tags on the table: the
  board and the worked plan show the numbers. During a knock,
  "Tap the door!" sits above the door. When m or d changes, FORM works every group out
  again and restock() moves/adds/removes things while a sheet line talks about the plan (after Q6: "Now m is 4…";
  after Q8: Maya's "…The plan still works, even when the numbers change!"). No new lines beyond review 2's. Party: no tags,
  m = 4 / d = 7 never change, guests stand in loose groups at different depths with shadows
- src/finale.js: Party Day shopping. Not in the current script, so it is out of the flow (no room 4)
- src/map.js: level select (3 rooms, title fixed on screen) · src/qa.js: QA mode (press Q, or a #qa-p2-7 link);
  no badge or answer chip on screen (the Q panel shows the current answer); never remembered between visits
- Set pieces: the opening at Neel's house, at its painted size (no camera zoom: the art stays sharp): the windows'
  glow comes up (houseWindows(layer, false): no dark patches), Neel steps out of his lit doorway and walks down the path
  to his seat (main.js neelFromDoor), Agni and Maya arrive on theirs (trio({hold}) + entrance(k)); then the hall's
  "how many?" table (planTable: cake, plates, sweets, balloons, each with a ?, gone when Maya answers; the hall's fore
  layer is hidden for it), the letter m written plainly (review 2: no coin, no glow; common.js coin() is a plain
  letter that rolls through numbers: story, m 6 → 4), doors that swing open with light (part3 knockDoor), the magic pot
  test show and gold-ink plan (part2 bubbleTest/spellWorks), the party list that ticks off (part1), the living map, and
  the arrival: friends walk up the path, the camera flies in through the round window to the party (main.js arrival()).
- src/common.js: praise cues, idleWatch (open()/pause(): nudges only while answers are open and nobody speaks),
  Party Plan scroll (dock/glow). No word clues card or word box (Draft 4): Maya says the clue word in her hint.
  No speaker names on the dialogue box (Draft 4): the bubble's tail shows who speaks. No "hear again" speaker and no
  "tap" label on any bubble or board (review 2): a tap still moves on. say(..., {voiceOnly: true}) plays a line with no
  words on screen (the opening narrator); without a recording, or if it won't play, the line is shown as usual
- Dialogue (engine.js say()): lines are queued, never overlap; busy()/skipLine(); a bubble tap shows the whole line, the
  next tap moves on; into: el writes the words on a board (Part 1 chalkboard); onStart shows a board row with the line
  that says it, never before. partTitle() is not awaited: the part sets up under the card and its first line waits
  (afterTitle()). Bubbles keep "md" as one chip and a sum ("m + d") on one line (chipify). Timing lives in PACE.
  gsap.ticker.lagSmoothing(0): on a slow tablet animations keep clock time (they skip frames, never stretch).
- Inputs: lock(el) makes a control visibly asleep while someone talks; a tap on it wiggles and ends the line, or says
  why it is asleep (el._why). A tap made while a control was locked but delivered late (busy device) is dropped.
- setScene(name, {setup}): the old cast leaves behind the shut curtain; setup builds the new scene before it opens.
- Quiet rooms: the three level rooms (hall, cauldron, doors) open with setScene(name, {quiet: true}): only the back wall
  (far plate, sharp, never blurred) shows while the level is played; the mid and fore prop plates wait hidden. bridge()
  calls setQuiet(false): the props come back when the level ends. Story, map, arrival and party show every layer.
- Hints in every part: wrong 1 = clue, wrong 2 = clue with the numbers on screen, wrong 3 = answer (highlighted).
- Feedback looks the same in every part (engine.js markRight / markWrong): right = green glow + a tick badge that pops;
  wrong = a gentle orange shake + orange glow + a cross badge (orange is the try-again colour, never red); a wrong-number
  popup uses popup(..., "popup hint"). Motion: UI comes in and goes out with MOTION (uiIn: rise 16 px + fade, 0.35 s,
  power2.out; uiOut: fade + 10 px up, 0.3 s): card(), popup(), azTip, the question card, door tips.
- Touch targets are 64 px or more (the plan tab, the Variable / Constant buttons, the tiles).
- Map (map.js): each room is a round lit window like the house's round window (.room.win), a gold SVG lock when locked;
  the house's own windows light up as rooms are finished (an unlit one is a dim pane, never a black hole).
- src/fx.js: painted-light effects, no pixel art: playFx(name, x, y, {palette, scale, parent, dur}) draws soft glows,
  sparks, twinkles and smoke/dust puffs (lumps lit top-left, shaded below) at full resolution on a small canvas, one rAF
  loop for all; turning pieces (sunburst rays, rune circle, portal swirl) are drawn once and moved with transforms.
  Loops stop on stop() or when their layer is cleared. The hearth fire (campfire) draws its own logs: the painted hearth
  is empty. Character contact shadows stay on the floor and shrink when a character jumps; confetti tumbles in 3D
- Audio: src/sfx/*.mp3 (bundled as data URLs via esbuild's mp3 loader) and assets/audio/*.mp3 music;
  all CC0, sources in assets/audio/CREDITS.txt. sfx(type) plays a recording when loaded, else the synth;
  music("calm"|"magic") crossfades and starts on the first tap; it ducks while TTS speaks
- Voice-over: assets/vo/en/<id>.ogg (Chatterbox clones of synthetic MeloTTS reference clips, tools/vo_refs/), ids from
  tools/vo_lines.mjs, listed in src/vo_manifest.json; README "Voices" has the commands and each speaker's settings
  (tools/voice_cast.json). An edited line gets a new id: re-record it. assets/vo/takes/ is never deployed.
- assets/: WebP files (plus audio). Art no longer used is kept in tools/unused_art/ (jar, chest, orbs, the m coin).
  pr_sweet_box (an open mithai box of laddoos, review 2) is a Blender render: tools/blender/sweet_box.py. pr_party_table_3d (the Part 3 table) and pr_bowl are Blender renders made at the hall floor's
  angle (about 11 degrees), shadow baked in: tools/blender/table.py, bowl.py, finish.py
  (`blender -b --python tools/blender/table.py -- out.png 96 11`, then `python3 tools/blender/finish.py out.png assets/pr_party_table_3d.webp 1100`). anim_* = Ludo sprite sheets, 36 frames in a 6×6 grid,
  sizes in src/anim_meta.json; bg_<scene>_far/mid/fore = parallax layers

## Layout rules
- Speaking character bottom-left, question card top-centre. When two characters talk to each other (story, bridges,
  Part 2 beat and m + d example, ending) both stay on screen: solo("duo") / solo("duoGame"); questions stay one speaker.
  All tappable controls in the bottom-right action zone. No HUD: no ★ counter, no question number, no ☰ menu
  (stars are still counted in score for the map; award() lets them glitter where the answer was given).
  The three friends together (story, bridges, Part 2 dragon beat, Part 3 intro, party) use trio(): SPOTS.trio*.
  Part 2: the card keeps the whole word problem (q.sub) for the whole question; test results over the cauldron,
  under the card (below its bottom edge) and above the spell; nothing animates over the spell. Part 3: equation bar (item = plan) top-centre,
  reply cards top-left (7 cards fit a row; numbered once counted; only the counts, .rsvp.mini, during a question that is
  not about the replies: knocks and the "two said no" question show every card), the plan folds to a tab in the
  top-right corner (.scroll.tab, a tap opens it for 6 s), only the current question's count tag on the table (a tag shows again
  while its count changes), no "d = 4" chip during a knock (the replies count), answer gems on the board under the plan, smaller
  speaker bottom-left (SPOTS.table) whose side bubble grows upwards. Party: bubbles high (SPOTS.trioParty.ftop),
  monsters left and dragons right, one row each.
- No blue guest monster anywhere it could be read as a second Neel (gu_monster_blue).
- Algebra letters look like a maths book: m and d in italic STIX Two Text (Google Fonts, with Baloo 2), 1.12em, everywhere
  (bubble chips, cards, the plan bar, tiles, the plan's letters, value pills); numbers and words stay Baloo 2.
- Level ends: bridge(lines, dance, recap) shows a "What we learned" card on the left (RECAP in main.js, Parts 1 and 3;
  Part 2 ends with the Party Plan scroll). On-screen text only, in the words the friends say.
- Keep the UI uncluttered and keep m purple / d orange everywhere. No panels behind controls (the action zone, the
  answer gems and the test rows have no frame; tips are text with a shadow); the question card
  is a plain rounded glass card; a control with nothing to do is hidden (undo with an empty spell).
- Keep assets WebP, total game under 20 MB. Re-encode from the lossless originals, never WebP from WebP:
  tools/optimize_images.py (sprite sheets q74, backgrounds at their drawn 2000 x 900).
- Smoothness: only the sprite sheet being played is displayed (a sheet decodes to about 38 MB); sheets are decoded
  ahead of use (warmChars, WARM in engine.js), backdrops decode behind the closed curtain, and a normal start loads only
  the title art (TITLE in main.js, about 1.8 MB) before the title shows; the story's first scene (STORY_NOW) loads
  while the title is up (Play waits for it only on a slow link), then the rest one file at a time, poses first.
  vercel.json caches assets/ for a day (stale-while-revalidate a week).
- Animation cost: loops that never stop animate only transform/opacity/translate/scale (CSS keyframes, so the GPU
  runs them): no animated filter, box-shadow or border-color (.pulse holds its glow still and only scales; the orb shine
  is an ::after that fades). No GSAP repeat:-1 for simple bobs or glows (use .bobbing / .breathe). No mix-blend-mode
  on things that stay on screen (.pool, .bulbGlow, .flicker, fx sprites): the camera always drifts, so a blend is redone
  every frame. The hearth fire draws at 30 fps and 1x resolution (SLOW in fx.js). img() decodes async.
  Fonts load without blocking the first paint (preload + onload in index.html).
