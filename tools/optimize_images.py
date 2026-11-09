#!/usr/bin/env python3
"""optimize_images: re-encode the heavy WebPs straight from the lossless originals (never WebP from WebP).

    python3 tools/optimize_images.py <sprite_png_dir> <image_pack_png_dir>

sprite_png_dir: the unzipped Ludo sheets (agni/, maya/, neel/ with anim_*.png), from
_source_originals/ludo_spritesheets/*.zip. image_pack_png_dir: _source_originals/image_pack/assets.
Sprite sheets keep their size (the characters are shown at about 1:1 on a full-size stage); backgrounds are
resized to the 2000 x 900 they are drawn at. A new file is kept only if it is smaller than the current one.
Needs cwebp (brew install webp) and Pillow.
"""
import glob, os, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
SPRITES, PACK = sys.argv[1], sys.argv[2]

def encode(src, dst, q, alpha_q=80, size=None):
    tmp = tempfile.mkdtemp()
    if size:
        p = os.path.join(tmp, "r.png")
        Image.open(src).convert("RGBA").resize(size, Image.LANCZOS).save(p)
        src = p
    out = os.path.join(tmp, "o.webp")
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-alpha_q", str(alpha_q), "-m", "6", "-sharp_yuv", "-mt", src, "-o", out], check=True)
    old, new = os.path.getsize(dst) if os.path.exists(dst) else 1 << 40, os.path.getsize(out)
    if new < old:
        os.replace(out, dst)
        print(f"{os.path.basename(dst):32s} {old // 1024:6d}K -> {new // 1024:6d}K")
    else:
        print(f"{os.path.basename(dst):32s} kept ({old // 1024}K, new would be {new // 1024}K)")

for png in sorted(glob.glob(os.path.join(SPRITES, "*", "anim_*.png"))):
    encode(png, os.path.join(ASSETS, os.path.basename(png)[:-4] + ".webp"), 74)
for png in sorted(glob.glob(os.path.join(PACK, "bg_*.png"))):
    encode(png, os.path.join(ASSETS, os.path.basename(png)[:-4] + ".webp"), 80, size=(2000, 900))
# the title card is drawn at 780 x 512: 1.5x that is plenty for sharp screens
tc = os.path.join(PACK, "ui_title_card.png")
if os.path.exists(tc):
    encode(tc, os.path.join(ASSETS, "ui_title_card.webp"), 84, size=(1170, 768))
