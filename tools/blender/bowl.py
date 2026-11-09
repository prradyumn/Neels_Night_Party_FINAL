# a footed gold bowl for heaps of sweets and laddoos, from the same camera angle as the party table
import bpy, bmesh, math, sys
argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
m = bpy.data.materials.new("gold"); m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.95, 0.5, 0.08, 1); b.inputs["Metallic"].default_value = 1; b.inputs["Roughness"].default_value = 0.32
prof = [(0, 0), (0.09, 0), (0.1, 0.015), (0.05, 0.03), (0.04, 0.07), (0.07, 0.085), (0.16, 0.11), (0.22, 0.17), (0.235, 0.19), (0.22, 0.19), (0.205, 0.175), (0.15, 0.125), (0.0, 0.11)]
bm = bmesh.new(); seg = 48; rings = []
for r, z in prof: rings.append([bm.verts.new((r * math.cos(a * 2 * math.pi / seg), r * math.sin(a * 2 * math.pi / seg), z)) for a in range(seg)])
for i in range(len(rings) - 1):
    for a in range(seg): bm.faces.new((rings[i][a], rings[i][(a + 1) % seg], rings[i + 1][(a + 1) % seg], rings[i + 1][a]))
me = bpy.data.meshes.new("bowl"); bm.to_mesh(me); o = bpy.data.objects.new("bowl", me); sc.collection.objects.link(o); o.data.materials.append(m)
for f in o.data.polygons: f.use_smooth = True
bpy.ops.object.light_add(type="AREA", location=(-1.2, -1.6, 2.2)); k = bpy.context.object; k.data.energy = 60; k.data.size = 1; k.data.color = (1, 0.8, 0.6); k.rotation_euler = (math.radians(40), 0, math.radians(-35))
bpy.ops.object.light_add(type="AREA", location=(1.4, 0.8, 1.2)); f = bpy.context.object; f.data.energy = 40; f.data.color = (0.6, 0.5, 1); f.rotation_euler = (math.radians(60), 0, math.radians(120))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.2, 0.15, 0.35, 1)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
el = math.radians(11); dist = 1.6
cam.location = (0, -dist * math.cos(el), 0.1 + dist * math.sin(el)); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
sc.render.engine = "CYCLES"; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = 500
sc.view_settings.view_transform = "Standard"
sc.render.filepath = OUT; bpy.ops.render.render(write_still=True)
