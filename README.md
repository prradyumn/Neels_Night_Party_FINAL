# Neel's Night Party

Algebra game for Class 6-7: variables vs constants (Friend Dial), writing expressions (Spell Cauldron),
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
| src/part2.js | Part 2 - Spell Cauldron (write expressions) |
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
