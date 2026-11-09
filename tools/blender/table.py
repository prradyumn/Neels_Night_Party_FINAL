# Party table for the hall of doors: a blue cloth with gold swags over a wooden table, seen from about 9 degrees
# above the floor (the angle the hall's floor is painted at), shadow baked onto a transparent background.
import bpy, bmesh, math, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/table.png"
SAMPLES = int(argv[1]) if len(argv) > 1 else 64
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
L, D, H = 2.4, 0.95, 0.76          # table length, depth, height (m)
CL, CD = L + 0.12, D + 0.12        # cloth top size
HEM = 0.36                          # hem height at the swag points
def mat(name, col, rough=0.7, metal=0.0, emit=None, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if sheen: b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Tint"].default_value = (0.6, 0.65, 1, 1)
    return m
CLOTH = mat("cloth", (0.012, 0.018, 0.62), 0.55, sheen=0.15)
GOLD = mat("gold", (1.0, 0.66, 0.16), 0.3, 1.0)
WOOD = mat("wood", (0.3, 0.09, 0.02), 0.4)
def obj(name, me, m):
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); o.data.materials.append(m); return o
# cloth top
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co = Vector((v.co.x * CL, v.co.y * CD, H + 0.01 + v.co.z * 0.03))
me = bpy.data.meshes.new("top"); bm.to_mesh(me); top = obj("top", me, CLOTH)
bv = top.modifiers.new("b", "BEVEL"); bv.width = 0.025; bv.segments = 4
# skirt: one strip per side, hanging from the top edge, with a scalloped hem and soft folds
SW = 0.42  # swag width
def hem_z(t):  # t along the side in metres from its start; lowest in the middle of each swag
    u = (t % SW) / SW
    return HEM - 0.075 * math.sin(math.pi * u)
def side(p0, p1, out):
    n = int((p1 - p0).length / 0.01)
    bm = bmesh.new(); rows = 14; grid = []
    for i in range(n + 1):
        t = i / n; p = p0.lerp(p1, t); s = t * (p1 - p0).length
        fold = 0.03 * math.sin(s / SW * math.pi * 2 * 2) + 0.008 * math.sin(s * 37)
        col = []
        zb = hem_z(s)
        for j in range(rows + 1):
            k = j / rows; z = H + 0.02 - (H + 0.02 - zb) * k
            q = p + out * (0.004 + fold * k * k + 0.02 * k)
            col.append(bm.verts.new((q.x, q.y, z)))
        grid.append(col)
    for i in range(n):
        for j in range(rows): bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    me = bpy.data.meshes.new("skirt"); bm.to_mesh(me); o = obj("skirt", me, CLOTH)
    o.modifiers.new("s", "SOLIDIFY").thickness = 0.01
    for f in o.data.polygons: f.use_smooth = True
    # gold trim along the hem, and a gold drop at each swag point
    pts = []
    for i in range(0, n + 1, 2):
        t = i / n; p = p0.lerp(p1, t); s = t * (p1 - p0).length
        q = p + out * (0.004 + 0.03 * math.sin(s / SW * math.pi * 4) + 0.008 * math.sin(s * 37) + 0.026)
        pts.append((q.x, q.y, hem_z(s)))
    cu = bpy.data.curves.new("trim", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.014; cu.bevel_resolution = 3
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, c in enumerate(pts): sp.points[i].co = (*c, 1)
    obj("trim", cu, GOLD)
    k = 0.0
    while k <= (p1 - p0).length + 1e-6:
        p = p0 + (p1 - p0).normalized() * k + out * 0.05
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.028, location=(p.x, p.y, HEM - 0.03), segments=8, ring_count=4)
        dd = bpy.context.object; dd.scale = (0.75, 0.75, 1.5); dd.rotation_euler = (0, 0, math.pi / 4); dd.data.materials.append(GOLD)
        k += SW
hx, hy = CL / 2, CD / 2
side(Vector((-hx, -hy, 0)), Vector((hx, -hy, 0)), Vector((0, -1, 0)))   # front (toward the camera)
side(Vector((hx, -hy, 0)), Vector((hx, hy, 0)), Vector((1, 0, 0)))      # right end
side(Vector((-hx, hy, 0)), Vector((-hx, -hy, 0)), Vector((-1, 0, 0)))   # left end
side(Vector((hx, hy, 0)), Vector((-hx, hy, 0)), Vector((0, 1, 0)))      # back
pts = [(-hx - 0.006, -hy - 0.006), (hx + 0.006, -hy - 0.006), (hx + 0.006, hy + 0.006), (-hx - 0.006, hy + 0.006), (-hx - 0.006, -hy - 0.006)]
cu = bpy.data.curves.new("pipe", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.012; cu.bevel_resolution = 3
sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts): sp.points[i].co = (x, y, H + 0.03, 1)
obj("pipe", cu, GOLD)
# turned wooden legs with gold feet, showing below the cloth
prof = [(0.0, 0.0), (0.05, 0.0), (0.055, 0.025), (0.04, 0.05), (0.03, 0.09), (0.045, 0.14), (0.03, 0.2), (0.026, 0.28), (0.04, 0.33), (0.0, 0.33)]
for sx in (-1, 1):
    for sy in (-1, 1):
        bm = bmesh.new(); seg = 24; rings = []
        for r, z in prof: rings.append([bm.verts.new((r * math.cos(a * 2 * math.pi / seg), r * math.sin(a * 2 * math.pi / seg), z)) for a in range(seg)])
        for i in range(len(rings) - 1):
            for a in range(seg): bm.faces.new((rings[i][a], rings[i][(a + 1) % seg], rings[i + 1][(a + 1) % seg], rings[i + 1][a]))
        me = bpy.data.meshes.new("leg"); bm.to_mesh(me); lg = obj("leg", me, WOOD)
        for f in lg.data.polygons: f.use_smooth = True
        lg.location = (sx * (L / 2 - 0.12), sy * (D / 2 - 0.1), 0)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.012, location=(lg.location.x, lg.location.y, 0.03))
        bpy.context.object.data.materials.append(GOLD)
# floor that only catches the shadow
bpy.ops.mesh.primitive_plane_add(size=12); fl = bpy.context.object; fl.is_shadow_catcher = True
# light: warm key from the front left (the lanterns), cool purple from the right, a soft sky
bpy.ops.object.light_add(type="AREA", location=(-1.6, -2.0, 3.4)); k = bpy.context.object; k.data.energy = 260; k.data.size = 1.2; k.data.color = (1, 0.78, 0.55)
k.rotation_euler = (math.radians(45), 0, math.radians(-40))
bpy.ops.object.light_add(type="AREA", location=(3, 1.5, 2.2)); f = bpy.context.object; f.data.energy = 70; f.data.size = 3; f.data.color = (0.6, 0.5, 1)
f.rotation_euler = (math.radians(60), 0, math.radians(120))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.12, 0.1, 0.25, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45
# camera: about 9 degrees above the floor plane at the table, like the painted hall
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50
el = math.radians(float(argv[2]) if len(argv) > 2 else 11); dist = 7.2
cam.location = (0, -dist * math.cos(el), 0.45 + dist * math.sin(el))
cam.rotation_euler = (math.pi / 2 - el, 0, 0)
sc.render.engine = "CYCLES"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
try: sc.cycles.device = "CPU"
except Exception: pass
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = 1500, 700
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
