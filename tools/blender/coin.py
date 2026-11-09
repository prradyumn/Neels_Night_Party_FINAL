# The gold m coin, spinning about its upright axis: 12 frames from face-on to just before face-on again
# (both faces are the same, so the frames loop). The letter or number is drawn on it by the game.
import bpy, bmesh, math, sys
argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
def gold(name, col, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Metallic"].default_value = 1; b.inputs["Roughness"].default_value = rough
    return m
FACE, RIM = gold("face", (1, 0.7, 0.2), 0.32), gold("rim", (0.95, 0.55, 0.1), 0.22)
root = bpy.data.objects.new("coin", None); sc.collection.objects.link(root)
def add(o, m):
    o.data.materials.append(m); o.parent = root
    for f in o.data.polygons: f.use_smooth = True
# body: a thick disc, faces toward the camera (Y axis)
bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=0.16, vertices=96, rotation=(math.pi / 2, 0, 0)); add(bpy.context.object, FACE)
bv = bpy.context.object.modifiers.new("b", "BEVEL"); bv.width = 0.03; bv.segments = 3
# raised rim on both faces, and an inner bead ring
for s in (-1, 1):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.93, minor_radius=0.07, major_segments=96, minor_segments=12, rotation=(math.pi / 2, 0, 0), location=(0, s * 0.08, 0)); add(bpy.context.object, RIM)
    for i in range(36):
        a = i / 36 * 2 * math.pi
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, segments=10, ring_count=6, location=(0.78 * math.cos(a), s * 0.085, 0.78 * math.sin(a))); add(bpy.context.object, RIM)
bpy.ops.object.light_add(type="AREA", location=(-2, -3, 3)); k = bpy.context.object; k.data.energy = 600; k.data.size = 2; k.data.color = (1, 0.9, 0.75); k.rotation_euler = (math.radians(50), 0, math.radians(-35))
bpy.ops.object.light_add(type="AREA", location=(2.5, -2, -1)); f = bpy.context.object; f.data.energy = 200; f.data.color = (0.75, 0.6, 1); f.rotation_euler = (math.radians(110), 0, math.radians(50))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.35, 0.25, 0.5, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.7
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = 2.3; cam.location = (0, -6, 0); cam.rotation_euler = (math.pi / 2, 0, 0)
sc.render.engine = "CYCLES"; sc.cycles.samples = 40; sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = 240
sc.view_settings.view_transform = "Standard"
for i in range(12):
    root.rotation_euler = (0, 0, i / 12 * math.pi)
    sc.render.filepath = f"{OUT}_{i:02d}.png"; bpy.ops.render.render(write_still=True)
