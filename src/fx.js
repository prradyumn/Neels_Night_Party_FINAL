// pixelfx wrapper: plays an effect on its own small canvas inside #fxl, scaled up crisp.
import { createFrame, clearFrame, createFx, composite } from "../pixelfx/src/core/index.js";
import * as confetti from "../pixelfx/src/fx/ui/confetti.js";
import * as collect from "../pixelfx/src/fx/pickups/collect-burst.js";
import * as mana from "../pixelfx/src/fx/arcane/mana-burst.js";
import * as cast from "../pixelfx/src/fx/arcane/magic-circle-cast.js";
import * as portal from "../pixelfx/src/fx/arcane/portal.js";
import * as poof from "../pixelfx/src/fx/spawn/poof.js";
import * as pow from "../pixelfx/src/fx/explosions/cartoon-pow.js";
import * as smoke from "../pixelfx/src/fx/explosions/smoke-bomb.js";
import * as firework from "../pixelfx/src/fx/explosions/firework-burst.js";
import * as bubbles from "../pixelfx/src/fx/water/bubbles.js";
import * as fireflies from "../pixelfx/src/fx/weather/fireflies.js";
import * as shatter from "../pixelfx/src/fx/ice/ice-shatter.js";
import * as hit from "../pixelfx/src/fx/impacts/blunt-hit.js";
import * as candle from "../pixelfx/src/fx/fire/candle.js";
import * as campfire from "../pixelfx/src/fx/fire/campfire.js";
import * as sunburst from "../pixelfx/src/fx/holy/sunburst.js";
import * as starfall from "../pixelfx/src/fx/arcane/star-fall.js";
import * as runes from "../pixelfx/src/fx/arcane/rune-circle.js";
import * as rocket from "../pixelfx/src/fx/explosions/firework-rocket.js";

const MODS = { confetti, collect, mana, cast, portal, poof, pow, smoke, firework, bubbles, fireflies, shatter, hit, candle, campfire, sunburst, starfall, runes, rocket };

export const PALS = {
  gold: ["#1e1206", "#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
  stone: ["#141420", "#2a2a3a", "#4a4c60", "#6c7088", "#8a8fa3", "#b0b4c6", "#d8dae6", "#ffffff"],
  teal: ["#06201e", "#0c3a38", "#145e5a", "#1f8a83", "#3fb8af", "#7fe0d6", "#c8fff8", "#ffffff"],
  plum: ["#140a26", "#2b1252", "#481c88", "#6b2cc0", "#9a48ec", "#c684ff", "#ecc8ff", "#ffffff"],
  ember: ["#1e0a04", "#4a1a06", "#8a320c", "#c85614", "#ff8a3d", "#ffb070", "#ffe0c0", "#ffffff"], // d is orange
};

let seed = 1;
/** play(name, x, y, {scale, palette, loop, under}) -> handle {stop(), el} ; resolves .done when finished */
export function playFx(name, x, y, o = {}) {
  const mod = MODS[name];
  const layer = o.parent || document.getElementById("fxl");
  if (!mod || !layer) return { stop() {}, done: Promise.resolve() };
  const meta = mod.meta;
  const [w, h] = meta.size, [ox, oy] = meta.origin;
  const sc = o.scale || 3;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  Object.assign(cv.style, { position: "absolute", left: x - ox * sc + "px", top: y - oy * sc + "px", width: w * sc + "px", height: h * sc + "px", imageRendering: "pixelated", pointerEvents: "none", zIndex: o.z || "" });
  layer.appendChild(cv);
  const ctx = cv.getContext("2d");
  const frame = createFrame(w, h);
  const opt = { x: ox, y: oy, seed: seed++ };
  if (o.palette) opt.palette = PALS[o.palette] || o.palette;
  const fx = createFx(mod, opt);
  const id = new ImageData(w, h);
  let last = performance.now(), stopped = false, resolve;
  const done = new Promise((r) => (resolve = r));
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000) * (window.__speed || 1);
    last = now;
    fx.update(dt);
    clearFrame(frame);
    fx.draw(frame);
    composite(frame, id.data, null);
    ctx.putImageData(id, 0, 0);
    if (fx.done() || (o.dur && fx.t > o.dur && (fx.stop(), false))) { cv.remove(); resolve(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return { el: cv, done, stop() { if (!stopped) { stopped = true; fx.stop(); } } };
}
