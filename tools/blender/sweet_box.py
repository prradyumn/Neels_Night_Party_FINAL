# a mithai box for Part 1's "boxes of sweets" (review 2: a sweet box, not a gift box): an open pink box with gold trim
# and lining and six laddoos in paper cups, seen from a little above so the sweets show.
#   blender -b --python tools/blender/sweet_box.py -- out.png
import bpy, bmesh, math, sys
argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, col, metal=0.0, rough=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Metallic"].default_value = metal; b.inputs["Roughness"].default_value = rough
    return m
PINK, GOLD, PAPER = mat("pink", (0.82, 0.12, 0.36), 0, 0.55), mat("gold", (1.0, 0.74, 0.2), 0.55, 0.3), mat("paper", (0.98, 0.78, 0.3), 0.3, 0.6)
LAD = mat("laddoo", (1.0, 0.45, 0.04), 0, 0.75)
# a little bump on the laddoos: they are made of tiny grains
nt = LAD.node_tree; tex = nt.nodes.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 160
bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 1.0
nt.links.new(tex.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])

def box(name, size, loc, m, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = size; o.data.materials.append(m)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("b", "BEVEL"); bev.width = 0.004; bev.segments = 2
    if rot: o.rotation_euler = rot
    return o

W, D, H, T = 0.62, 0.42, 0.12, 0.016
box("bottom", (W, D, T), (0, 0, T / 2), PINK)
box("front", (W, T, H), (0, -D / 2 + T / 2, H / 2), PINK)
box("back", (W, T, H), (0, D / 2 - T / 2, H / 2), PINK)
box("left", (T, D, H), (-W / 2 + T / 2, 0, H / 2), PINK)
box("right", (T, D, H), (W / 2 - T / 2, 0, H / 2), PINK)
box("lining", (W - 2 * T, D - 2 * T, 0.004), (0, 0, T + 0.002), PAPER)
for y in (-D / 2 + 0.004, D / 2 - 0.004):  # gold trim along the top edges
    box("trim", (W + 0.004, 0.012, 0.012), (0, y, H), GOLD)
for x in (-W / 2 + 0.004, W / 2 - 0.004):
    box("trim", (0.012, D + 0.004, 0.012), (x, 0, H), GOLD)
# a gold band on the front, like a mithai box from the sweet shop (no lid in the picture: the sweets must show)
box("band", (W + 0.002, 0.004, 0.026), (0, -D / 2 - 0.001, H * 0.55), GOLD)
# six laddoos in gold paper cups, 3 x 2
for i in range(3):
    for j in range(2):
        x, y = (i - 1) * 0.19, (j - 0.5) * 0.19
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.075, depth=0.04, location=(x, y, T + 0.02))
        cup = bpy.context.object; cup.data.materials.append(GOLD)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.074, location=(x, y, T + 0.075))
        l = bpy.context.object; l.data.materials.append(LAD); bpy.ops.object.shade_smooth()
bpy.ops.object.light_add(type="AREA", location=(-1.2, -1.6, 2.2)); k = bpy.context.object; k.data.energy = 90; k.data.size = 1.2; k.data.color = (1, 0.85, 0.7); k.rotation_euler = (math.radians(40), 0, math.radians(-35))
bpy.ops.object.light_add(type="AREA", location=(1.4, -0.6, 1.2)); f = bpy.context.object; f.data.energy = 45; f.data.color = (0.7, 0.6, 1); f.rotation_euler = (math.radians(60), 0, math.radians(60))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.22, 0.17, 0.35, 1)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
el = math.radians(34); dist = 2.0
cam.location = (0.18, -dist * math.cos(el), 0.12 + dist * math.sin(el)); cam.rotation_euler = (math.pi / 2 - el, 0, math.radians(5))
sc.render.engine = "CYCLES"; sc.cycles.samples = 64; sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = 640
sc.view_settings.view_transform = "Standard"
sc.render.filepath = OUT; bpy.ops.render.render(write_still=True)
