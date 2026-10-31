# Editor VR: modela la barca y la deja en modelos/barca.glb y modelos/barca.blend.
# Uso: blender --background --python herramientas/modelar-barca.py -- <carpeta modelos>
# Barca de remos de 4,6 m: casco de tablas, bancadas, remos y un poste para los carteles. Origen en el
# centro, a la altura del agua; la proa mira hacia +z. Una pieza por material.
import math, os, sys
import bpy

SALIDA = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(nombre, color):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    pbr = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    pbr.inputs['Base Color'].default_value = (*color, 1)
    pbr.inputs['Roughness'].default_value = 1
    return m


CASCO = material('Casco', (0.11, 0.06, 0.03))
TABLAS = material('Tablas', (0.2, 0.12, 0.06))
OSCURO = material('Oscuro', (0.05, 0.03, 0.02))


def crear(nombre, vertices, caras, mat):
    malla = bpy.data.meshes.new(nombre)
    malla.from_pydata(vertices, [], caras)
    malla.update()
    malla.materials.append(mat)
    for p in malla.polygons:
        p.use_smooth = False
    o = bpy.data.objects.new(nombre, malla)
    bpy.context.scene.collection.objects.link(o)
    return o


# Casco: secciones a lo largo de la barca (en Blender, y hacia atrás y -y hacia la proa al exportar).
# Cada sección: 5 puntos de la borda de un lado, por el fondo, a la borda del otro.
N, LARGO, ANCHO = 12, 4.6, 1.5
fuera, dentro = [], []
for i in range(N + 1):
    t = i / N
    y = (t - 0.5) * LARGO
    # manga: se estrecha hacia las puntas; las bordas suben en proa y popa
    manga = ANCHO / 2 * (1 - abs(2 * t - 1) ** 2.2) ** 0.8 + 0.015
    borda = 0.5 + 0.28 * abs(2 * t - 1) ** 3
    fondo = -0.15 + 0.3 * abs(2 * t - 1) ** 3
    seccion = [(-manga, borda), (-manga * 0.9, 0.22), (0, fondo), (manga * 0.9, 0.22), (manga, borda)]
    fuera.append([(x, y, z) for x, z in seccion])
    k = 0.9
    dentro.append([(x * k, y, max(z, fondo + 0.07) if j else z) for j, (x, z) in enumerate(seccion)])
vs, cs = [], []
for sec in fuera + dentro:
    vs += sec
por = 5
total = N + 1
for capa, invertir in ((0, False), (total, True)):
    for i in range(N):
        for j in range(por - 1):
            a, b = (capa + i) * por + j, (capa + i + 1) * por + j
            cara = [a, a + 1, b + 1, b]
            cs.append(cara[::-1] if invertir else cara)
# la borda, uniendo fuera y dentro
for i in range(N):
    for j in (0, por - 1):
        a, b, c, d = i * por + j, (i + 1) * por + j, (total + i + 1) * por + j, (total + i) * por + j
        cs.append([a, b, c, d] if j == 0 else [d, c, b, a])
casco = crear('Casco', vs, cs, CASCO)


def caja(lista, cara, cx, cy, cz, sx, sy, sz):
    n = len(lista)
    for dx in (-1, 1):
        for dy in (-1, 1):
            for dz in (-1, 1):
                lista.append((cx + dx * sx / 2, cy + dy * sy / 2, cz + dz * sz / 2))
    cara += [[n, n + 1, n + 3, n + 2], [n + 4, n + 6, n + 7, n + 5], [n, n + 4, n + 5, n + 1], [n + 2, n + 3, n + 7, n + 6], [n, n + 2, n + 6, n + 4], [n + 1, n + 5, n + 7, n + 3]]


# tablas del suelo, bancadas y poste
v2, c2 = [], []
for y in (-1.2, -0.3, 0.7):
    caja(v2, c2, 0, y, 0.33, 1.25 * (1 - abs(y) * 0.12), 0.26, 0.05)
for i in range(7):
    caja(v2, c2, (i - 3) * 0.14, 0, 0.0, 0.12, 3.2, 0.03)
crear('Bancadas', v2, c2, TABLAS)
v3, c3 = [], []
caja(v3, c3, 0, 0, 1.1, 0.1, 0.1, 2.2)              # poste de los carteles
for lado in (-1, 1):
    # remos: la pala en el agua
    angulo = lado * 0.5
    for i in range(10):
        t = i / 9
        caja(v3, c3, lado * (0.65 + 1.7 * t), -0.3 + 0.25 * t, 0.42 - 0.72 * t, 0.17, 0.05, 0.05)
    caja(v3, c3, lado * 2.45, -0.03, -0.32, 0.5, 0.2, 0.03)
crear('Remos', v3, c3, OSCURO)

bpy.ops.object.select_all(action='SELECT')
os.makedirs(SALIDA, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SALIDA, 'barca.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, 'barca.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Barca terminada')
