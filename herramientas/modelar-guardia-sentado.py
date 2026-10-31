# Editor VR: saca el guardia sentado del guardia de pie (modelos/guardia.glb), doblándole las piernas, con
# la lanza de pie a un lado, el escudo en el suelo y una silla. Deja modelos/guardia-sentado.glb y su .blend.
# Uso: blender --background --python herramientas/modelar-guardia-sentado.py -- <carpeta modelos>
import os, sys
import bmesh, bpy

CARPETA = sys.argv[sys.argv.index('--') + 1]
CADERA, RODILLA, ASIENTO = 0.95, 0.5, 0.47   # alturas en el modelo de pie, y la del asiento
BAJA = CADERA - ASIENTO
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(CARPETA, 'guardia.glb'))
cuerpo = bpy.data.objects['GuardiaCuerpo']
cabeza = bpy.data.objects['GuardiaCabeza']
cabeza.location.z -= BAJA


def doblar(y, z):
    if z >= RODILLA:   # el muslo, hacia delante (-y en Blender)
        t = CADERA - z
        return -t, ASIENTO - y
    # la espinilla, otra vez hacia abajo
    return y - (CADERA - RODILLA), z


bm = bmesh.new()
bm.from_mesh(cuerpo.data)
vistos = set()
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
    xs, ys, zs = [v.co.x for v in isla], [v.co.y for v in isla], [v.co.z for v in isla]
    if min(xs) < -0.27 and max(xs) < -0.2 and (max(zs) > 1.6 or max(zs) - min(zs) > 0.5):
        continue   # el asta de la lanza: se queda de pie, en el suelo
    if min(xs) > 0.13 and max(ys) < -0.1 and max(zs) < 1.3:
        for v in isla:
            v.co.z -= min(zs)   # el escudo, apoyado en el suelo, al lado
        continue
    brazo = max(abs(min(xs)), abs(max(xs))) > 0.2 and min(zs) > 0.85
    if min(zs) >= CADERA - 0.02 or brazo:
        for v in isla:
            v.co.z -= BAJA   # el tronco y los brazos bajan enteros
        continue
    for v in isla:
        if v.co.z >= CADERA:
            v.co.z -= BAJA
        else:
            v.co.y, v.co.z = doblar(v.co.y, v.co.z)
bm.to_mesh(cuerpo.data)
bm.free()


# la silla, de la misma madera que el asta
def caja(vs, cs, c, t):
    n = len(vs)
    for dx in (-1, 1):
        for dy in (-1, 1):
            for dz in (-1, 1):
                vs.append((c[0] + dx * t[0] / 2, c[1] + dy * t[1] / 2, c[2] + dz * t[2] / 2))
    cs += [[n, n + 1, n + 3, n + 2], [n + 4, n + 6, n + 7, n + 5], [n, n + 4, n + 5, n + 1], [n + 2, n + 3, n + 7, n + 6], [n, n + 2, n + 6, n + 4], [n + 1, n + 5, n + 7, n + 3]]


vs, cs = [], []
caja(vs, cs, (0, 0.03, ASIENTO - 0.05), (0.46, 0.4, 0.05))
for dx in (-0.18, 0.18):
    for dy in (-0.14, 0.2):
        caja(vs, cs, (dx, dy, (ASIENTO - 0.07) / 2), (0.05, 0.05, ASIENTO - 0.07))
# respaldo: dos postes y dos travesaños, detrás de la espalda
for dx in (-0.18, 0.18):
    caja(vs, cs, (dx, 0.2, ASIENTO + 0.28), (0.05, 0.05, 0.62))
for dz in (0.3, 0.52):
    caja(vs, cs, (0, 0.2, ASIENTO + dz), (0.4, 0.04, 0.09))
malla = bpy.data.meshes.new('Silla')
malla.from_pydata(vs, [], cs)
malla.update()
asta = next(m for m in cuerpo.data.materials if m.name.startswith('Asta'))
malla.materials.append(asta)
silla = bpy.data.objects.new('Silla', malla)
silla.parent = bpy.data.objects['Guardia']
bpy.context.scene.collection.objects.link(silla)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, 'guardia-sentado.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, 'guardia-sentado.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Guardia sentado terminado')
