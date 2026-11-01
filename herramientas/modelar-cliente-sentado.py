# Editor VR: saca el cliente de la posada del guardia sentado (modelos/guardia-sentado.glb), quitándole el
# yelmo, la lanza, el escudo y los adornos dorados, y con el brazo derecho aparte (BrazoD, pivote en el hombro), para
# que pueda alzar una copa. Los colores de la ropa los pone js/taberna.js.
# Uso: blender --background --python herramientas/modelar-cliente-sentado.py -- <carpeta modelos> [foto]
import os, sys
import bmesh, bpy

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTO = args[0], args[1] if len(args) > 1 else None
HOMBRO = (-0.22, 0, 0.9)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(CARPETA, 'guardia-sentado.glb'))


def quitar_islas(objeto, quitar):
    bm = bmesh.new()
    bm.from_mesh(objeto.data)
    bm.verts.ensure_lookup_table()
    vistos, sobran = set(), []
    for inicial in bm.verts:
        if inicial.index in vistos:
            continue
        pila, isla = [inicial], []
        while pila:
            v = pila.pop()
            if v.index in vistos:
                continue
            vistos.add(v.index)
            isla.append(v)
            pila += [e.other_vert(v) for e in v.link_edges]
        nombres = {objeto.data.materials[f.material_index].name for v in isla for f in v.link_faces}
        if quitar(isla, nombres):
            sobran += isla
    bmesh.ops.delete(bm, geom=sobran, context='VERTS')
    bm.to_mesh(objeto.data)
    bm.free()


NOMBRES_ARMAS = ('Yelmo', 'Asta', 'OroViejo')


def es_arma(isla, nombres):
    if any(n.startswith(NOMBRES_ARMAS) for n in nombres):
        return True
    xs, ys, zs = [v.co.x for v in isla], [v.co.y for v in isla], [v.co.z for v in isla]
    # el escudo, en el suelo a un lado (ver modelar-guardia-sentado.py)
    return min(xs) > 0.13 and max(ys) < -0.1 and max(zs) < 1.1 and min(zs) < 0.05


quitar_islas(bpy.data.objects['GuardiaCuerpo'], es_arma)
quitar_islas(bpy.data.objects['GuardiaCabeza'], lambda isla, nombres: any(n.startswith(('Yelmo', 'Malla')) for n in nombres))



# El brazo: las piezas sueltas de ese lado, del hombro a la mano
def es_brazo(isla, nombres):
    xs, ys, zs = [v.co.x for v in isla], [v.co.y for v in isla], [v.co.z for v in isla]
    return max(xs) < -0.12 and min(zs) >= 0.49 and min(ys) > -0.28 and nombres <= {'Malla', 'Cuero'}


cuerpo = bpy.data.objects['GuardiaCuerpo']
brazo = cuerpo.copy()
brazo.data = cuerpo.data.copy()
brazo.name = brazo.data.name = 'BrazoD'
bpy.context.collection.objects.link(brazo)
quitar_islas(cuerpo, es_brazo)
quitar_islas(brazo, lambda isla, nombres: not es_brazo(isla, nombres))
print('Brazo:', len(brazo.data.vertices), 'vértices; x', min(v.co.x for v in brazo.data.vertices), 'z', min(v.co.z for v in brazo.data.vertices))
for v in brazo.data.vertices:
    v.co.x -= HOMBRO[0]; v.co.y -= HOMBRO[1]; v.co.z -= HOMBRO[2]
brazo.location = HOMBRO

bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, 'cliente-sentado.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, 'cliente-sentado.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Cliente sentado terminado')

# una foto con el brazo alzado, para revisarlo
if FOTO:
    from math import radians
    from mathutils import Vector
    brazo.rotation_mode = 'XYZ'
    brazo.rotation_euler = (-1.7, 0, 0)
    e = bpy.context.scene
    motores = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    e.render.engine = next((m for m in motores if 'EEVEE' in m), motores[0])
    e.render.resolution_x, e.render.resolution_y = 600, 600
    mundo = bpy.data.worlds.new('M'); mundo.use_nodes = True
    fondo = next(n for n in mundo.node_tree.nodes if n.type == 'BACKGROUND')
    fondo.inputs[0].default_value = (0.6, 0.65, 0.7, 1)
    e.world = mundo
    cam = bpy.data.objects.new('C', bpy.data.cameras.new('C'))
    bpy.context.collection.objects.link(cam)
    e.camera = cam
    cam.location = (-1.6, -2, 1.3)
    cam.rotation_euler = (Vector((0, 0, 0.8)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    e.render.filepath = FOTO
    bpy.ops.render.render(write_still=True)
