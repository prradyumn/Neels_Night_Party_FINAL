# soft elliptical falloff on the baked shadow, crop to the table, save as WebP
from PIL import Image, ImageChops, ImageDraw, ImageFilter
import sys
src, out, maxw = sys.argv[1], sys.argv[2], int(sys.argv[3])
t = Image.open(src).convert("RGBA")
a = t.split()[3]
solid = a.point(lambda v: 255 if v > 200 else 0).getbbox()  # the table itself
x0, y0, x1, y1 = solid
mask = Image.new("L", t.size, 0); d = ImageDraw.Draw(mask)
cx, w = (x0 + x1) / 2, (x1 - x0)
d.ellipse((cx - w * 0.58, y1 - 60, cx + w * 0.58, y1 + 40), fill=255)
d.rectangle((x0 - 4, y0 - 4, x1 + 4, y1 - 20), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(18))
# only the soft shadow fades; the table itself keeps its full alpha
solidmask = a.point(lambda v: 255 if v > 200 else 0)
t.putalpha(ImageChops.lighter(ImageChops.multiply(a, mask), ImageChops.multiply(a, solidmask)))
bb = t.split()[3].point(lambda v: 255 if v > 4 else 0).getbbox()
t = t.crop(bb)
if t.width > maxw: t = t.resize((maxw, round(t.height * maxw / t.width)), Image.LANCZOS)
t.save(out, "WEBP", quality=88, method=6)
print(out, t.size, "solid table box in crop:", (x0 - bb[0], y0 - bb[1], x1 - bb[0], y1 - bb[1]))
