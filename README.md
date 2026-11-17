# Neel's Night Party

Algebra game for Class 6-7: variables vs constants (Friend Dial), writing expressions (Write the Party Plan),
substitution (Magic Doors) and a Party Day shopping finale.

## Play
Open `index.html` in Chrome/Edge (internet only needed for the Google font).
Or run a local server: `npm run serve` then open http://localhost:8080

## QA mode
Press **Q** anywhere: jump to any part/question, auto-skip dialogue, speed x2, show the correct answer.
Direct links: `index.html#qa-p2-7` (Part 2, Q7), `#qa-p3-1`, `#qa-fin-2`, `#qa-map`, `#qa-wizard`.

## Edit the code
```
npm install        # once
npm run watch      # rebuilds game.js + game.css on every save
npm run build      # minified production build
```
`game.js` and `game.css` are build outputs - edit files in `src/`, not these.

## Folder
| Path | What it is |
|---|---|
| index.html | page that loads game.js + game.css |
| src/main.js | flow: title, story, house map, rooms, ending, wizard card |
| src/engine.js | stage, parallax, sprite animation, speech bubbles, stars/HUD, sounds |
| src/part1.js | Part 1 - Friend Dial (variable / constant) |
| src/part2.js | Part 2 - Write the Party Plan (write expressions with tiles, tested in the magic pot) |
| src/part3.js | Part 3 - Magic Doors (substitution) |
| src/finale.js | Party Day shopping finale |
| src/map.js | house map / level select |
| src/qa.js | QA mode (press Q) |
| src/fx.js | wrapper for pixelfx effects |
| src/common.js | shared helpers (one character on screen, praise, idle hints) |
| src/style.css | all styles |
| src/anim_meta.json | frame size / count / speed of each sprite sheet |
| pixelfx/ | vendored pixelfx effects library (MIT, see pixelfx/LICENSE) |
| assets/ | 67 WebP images: 17 Ludo sprite sheets (anim_*), 12 parallax layers (bg_*), guests, props, UI |

## Voices (Indian English, open source: MeloTTS + Chatterbox, all on this Mac, no API key)
Every spoken line is a recording: `assets/vo/en/<id>.ogg` (Ogg Opus, 24 kbps), listed in `src/vo_manifest.json`
(bundled into game.js, so run `npm run build` after recording). A line, or a browser that can't play Ogg Opus, without a
recording uses the browser's voice. The method is the one used for Sonar Defence:

1. **Lines:** `node tools/vo_lines.mjs` lists every line with its speaker and id (`tools/vo_lines.json`; the id hashes
   speaker + text, so an edited line gets a new id and is recorded again). Openers such as "Not yet. Try again." are
   recorded once and played before the hint (`src/vo.js`). Part 1's dial clue is recorded for every dial value (2 to 8).
2. **Reference voice:** one synthetic clip per speaker (8-12 s, one mood), `tools/vo_refs/<who>.wav`: MeloTTS (MIT) speaks
   the speaker's `ref_text`, then Rubber Band shifts the pitch. No real person's voice. Settings: `tools/voice_cast.json`.
3. **Lines:** Chatterbox (Resemble AI, MIT) clones that clip for every line. The text sent to it has numbers, signs and
   the letters written out ("3m + 2d" -> "three em plus two dee", "12 − 3" -> "twelve minus three").
4. **Check:** Whisper (small.en) transcribes every take and it must match the script word for word (names and the
   letters m/d may be spelled either way). Up to 6 takes per line, seed 1..6; the first that matches goes in. If none
   matches, the closest goes in and the run lists it as "please listen".
5. **Output:** every line is loudness-normalised to the same target (ffmpeg loudnorm, two passes, -18 LUFS, true peak
   -1.5 dB) and encoded Ogg Opus at 24 kbps (`--reencode` rebuilds every file from its take). All takes stay in `assets/vo/takes/` (git-ignored, never deployed: `tools/dist.mjs`
   skips it) with `done.json` (take, seed, what Whisper heard), so a stopped run carries on.

| Speaker | Who | MeloTTS speaker, speed | Pitch shift | Chatterbox exaggeration, cfg |
|---|---|---|---|---|
| agni | dragon (female), warm confident guide | EN_INDIA, 0.7 | -2 semitones | 0.55, 0.4 |
| maya | witch, playful and a little mischievous | EN_INDIA, 0.72 | +1 | 0.65, 0.4 |
| neel | yeti, big, gentle, slow, goofy | EN_INDIA, 0.66 | -10 | 0.4, 0.3 |
| nar | narrator, calm storyteller | EN_INDIA, 0.7 | -4 (formants kept) | 0.45, 0.3, tempo 0.9 |

Pitched for Grade 7: friendly, not babyish (mild shifts, exaggeration under the cartoon end). Chatterbox copies the
reference's pace, so the clips are slow on purpose (about 135-145 words a minute); lower cfg = slower still,
and `tempo` in voice_cast.json time-stretches a speaker's takes (Rubber Band, same pitch) when cfg is not enough.

```sh
brew install rubberband                                       # once (Homebrew's ffmpeg has no rubberband filter)
~/melo/bin/python tools/make_voice_refs.py                    # the reference clips (--only neel for one)
~/chatter/bin/python tools/make_voices_chatter.py --sample    # one line per speaker -> assets/vo/takes/samples/
~/chatter/bin/python tools/make_voices_chatter.py             # every line not recorded yet (slow; resumable)
~/chatter/bin/python tools/make_voices_chatter.py --only maya_f3aee7b8 --force             # remake one line
~/chatter/bin/python tools/make_voices_chatter.py --only maya_f3aee7b8 --force --seed0 6   # ... with new seeds
~/chatter/bin/python tools/make_voices_chatter.py --who neel --force                       # one speaker again
npm run build
```
After changing a speaker's settings in `tools/voice_cast.json`, remake their reference clip, then their lines (`--who`).

**Kept offline** (Resemble retired Chatterbox in Aug 2026, and its code downloads its weights when it runs):
chatterbox-tts 0.1.7 and resemble-perth 1.0.1 (the watermark library, its model is inside the wheel) are saved as
wheels in `~/chatter/wheels`; the English weights (Hugging Face ResembleAI/chatterbox, revision 5bb1f6e) are copied to
`~/chatter/weights/chatterbox-5bb1f6e` and loaded from there (`CHATTERBOX_WEIGHTS` to move them). Pinned environments:
`tools/voice_requirements.txt` (~/chatter) and `tools/voice_refs_requirements.txt` (~/melo). Every Chatterbox recording
carries Perth's inaudible watermark; the credits say "Voices generated with AI" (`assets/audio/CREDITS.txt`).
