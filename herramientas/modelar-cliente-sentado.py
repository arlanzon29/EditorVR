# Editor VR: saca el cliente de la posada del guardia sentado (modelos/guardia-sentado.glb), quitándole el
# yelmo, la lanza, el escudo y los adornos dorados. Los colores de la ropa los pone js/posada.js.
# Uso: blender --background --python herramientas/modelar-cliente-sentado.py -- <carpeta modelos>
import os, sys
import bmesh, bpy

CARPETA = sys.argv[sys.argv.index('--') + 1]
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

bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, 'cliente-sentado.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, 'cliente-sentado.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Cliente sentado terminado')
