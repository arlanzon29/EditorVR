# Editor VR: modela la barca y la deja en modelos/barca.glb y modelos/barca.blend.
# Uso: blender --background --python herramientas/modelar-barca.py -- <carpeta modelos>
# Barca de remos de 4,8 m: casco de tablas solapadas en dos tonos, roda en la proa, espejo en la popa,
# cuadernas, bancadas, regala, toletes y remos. Sin mástil: el centro queda libre para ir de pie.
# Origen en el centro, a la altura del agua; la proa mira hacia +z en la escena (-y en Blender).
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


CLARO = material('TablaClara', (0.16, 0.085, 0.04))
OSCURO = material('TablaOscura', (0.1, 0.05, 0.025))
DENTRO = material('Interior', (0.2, 0.12, 0.065))
HERRAJE = material('Herraje', (0.025, 0.02, 0.018))

LARGO, MANGA = 4.8, 1.55
N, TRACAS = 22, 6   # secciones a lo largo, y tablas de la quilla a la borda en cada lado


def forma(t):
    """t: 0 en la proa, 1 en el espejo de popa. Devuelve media manga, altura de la borda y del fondo."""
    proa = 1 - t
    manga = MANGA / 2 * min(1, math.sin(min(1, t / 0.62) * math.pi / 2) ** 0.75) * (1 - 0.32 * max(0, (t - 0.62) / 0.38) ** 2)
    borda = 0.5 + 0.34 * proa ** 3 + 0.06 * t ** 3
    fondo = -0.16 + 0.62 * max(0, (0.32 - t) / 0.32) ** 2 + 0.1 * max(0, (t - 0.8) / 0.2) ** 2
    return manga, borda, fondo


def punto(t, s, encoge=1.0, sube=0.0):
    """s: de -1 (borda de un lado) a 1 (la del otro), pasando por la quilla en 0."""
    manga, borda, fondo = forma(t)
    y = (t - 0.5) * LARGO
    x = manga * encoge * math.sin(s * math.pi / 2)
    z = fondo + sube + (borda - fondo - sube) * abs(s) ** 1.45
    return (x, y, z)


vs, cs, mats = [], [], []


def cara(puntos, indice):
    n = len(vs)
    vs.extend(puntos)
    cs.append(list(range(n, n + len(puntos))))
    mats.append(indice)


def caja(c, t, indice):
    x, y, z = c
    a, b, d = t[0] / 2, t[1] / 2, t[2] / 2
    p = [(x - a, y - b, z - d), (x + a, y - b, z - d), (x + a, y + b, z - d), (x - a, y + b, z - d), (x - a, y - b, z + d), (x + a, y - b, z + d), (x + a, y + b, z + d), (x - a, y + b, z + d)]
    for q in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (0, 4, 7, 3)):
        cara([p[k] for k in q], indice)


def barra(p, q, ancho, indice, canto=None):
    """Prisma de sección rectangular de p a q."""
    canto = canto or ancho
    d = [q[i] - p[i] for i in range(3)]
    largo = math.sqrt(sum(c * c for c in d))
    d = [c / largo for c in d]
    ref = (0, 0, 1) if abs(d[2]) < 0.9 else (1, 0, 0)
    u = (d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0])
    m = math.sqrt(sum(c * c for c in u))
    u = [c / m for c in u]
    v = (d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0])
    def esq(o, a, b):
        return tuple(o[i] + u[i] * a * ancho / 2 + v[i] * b * canto / 2 for i in range(3))
    A = [esq(p, *k) for k in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    B = [esq(q, *k) for k in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for i in range(4):
        j = (i + 1) % 4
        cara([A[i], A[j], B[j], B[i]], indice)
    cara(A[::-1], indice)
    cara(B, indice)


# El casco por fuera: cada traca, de un tono, un poco montada sobre la de abajo
for lado in (-1, 1):
    for k in range(TRACAS):
        s0, s1 = k / TRACAS, (k + 1) / TRACAS
        solape = 1.018 if k % 2 else 1.0
        for i in range(N):
            t0, t1 = i / N, (i + 1) / N
            a = punto(t0, lado * s0, solape)
            b = punto(t1, lado * s0, solape)
            c = punto(t1, lado * s1, solape)
            d = punto(t0, lado * s1, solape)
            cara([a, b, c, d] if lado > 0 else [d, c, b, a], 0 if k % 2 else 1)

# El casco por dentro, un poco más estrecho, y la regala que une los dos por arriba
for lado in (-1, 1):
    for k in range(TRACAS):
        s0, s1 = k / TRACAS, (k + 1) / TRACAS
        for i in range(N):
            t0, t1 = i / N, (i + 1) / N
            a = punto(t0, lado * s0, 0.93, 0.04)
            b = punto(t1, lado * s0, 0.93, 0.04)
            c = punto(t1, lado * s1, 0.93, 0.04)
            d = punto(t0, lado * s1, 0.93, 0.04)
            cara([d, c, b, a] if lado > 0 else [a, b, c, d], 2)
    for i in range(N):
        t0, t1 = i / N, (i + 1) / N
        fuera0, fuera1 = punto(t0, lado, 1.05), punto(t1, lado, 1.05)
        dentro0, dentro1 = punto(t0, lado, 0.9, 0.04), punto(t1, lado, 0.9, 0.04)
        g = 0.035
        arriba = lambda p: (p[0], p[1], p[2] + g)
        cara([arriba(fuera0), arriba(fuera1), arriba(dentro1), arriba(dentro0)] if lado < 0 else [arriba(dentro0), arriba(dentro1), arriba(fuera1), arriba(fuera0)], 3 if False else 1)
        cara([fuera0, arriba(fuera0), arriba(fuera1), fuera1] if lado > 0 else [fuera1, arriba(fuera1), arriba(fuera0), fuera0], 1)

# Roda: la pieza curva de la proa, que sobresale, y la quilla por debajo
anterior = None
for i in range(0, 13):
    t = 0.32 * i / 12
    _, _, f = forma(t)
    p = (0, (t - 0.5) * LARGO - 0.02, f - 0.02)
    if anterior:
        barra(anterior, p, 0.08, 1, 0.08)
    anterior = p
_, b0, f0 = forma(0)
barra((0, -LARGO / 2 - 0.02, f0 - 0.02), (0, -LARGO / 2 - 0.09, b0 + 0.1), 0.09, 1, 0.09)
barra((0, -LARGO * 0.18, -0.2), (0, LARGO * 0.5, -0.09), 0.07, 1, 0.07)

# Espejo de popa: la tabla plana que cierra por detrás
puntos_popa = [punto(1, s / 8) for s in range(-8, 9)]
cara([(x, y + 0.012, z) for x, y, z in puntos_popa][::-1], 1)
cara([(x, y - 0.02, z) for x, y, z in puntos_popa], 2)

# Cuadernas, por dentro
for t in (0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9):
    ultimo = None
    for s in range(-6, 7):
        p = punto(t, s / 6, 0.91, 0.055)
        if ultimo:
            barra(ultimo, p, 0.05, 1, 0.035)
        ultimo = p

# Tablas del suelo, bancadas y toletes
_, _, f_medio = forma(0.5)
for k in range(-3, 4):
    caja((k * 0.13, 0.1, f_medio + 0.24), (0.115, 2.5, 0.025), 2)
for t, alto in ((0.34, 0.33), (0.58, 0.33), (0.84, 0.36)):
    manga, borda, fondo = forma(t)
    caja((0, (t - 0.5) * LARGO, alto), (manga * 1.75, 0.24, 0.045), 2)
    for lado in (-1, 1):
        caja((lado * manga * 0.82, (t - 0.5) * LARGO, alto - 0.08), (0.04, 0.2, 0.12), 1)
    caja((0, (t - 0.5) * LARGO, alto / 2 - 0.02), (0.06, 0.06, alto), 1)
t_remo = 0.56
manga_r, borda_r, _ = forma(t_remo)
for lado in (-1, 1):
    x = lado * manga_r
    y = (t_remo - 0.5) * LARGO
    # dos toletes de hierro, y el remo apoyado entre ellos, con la pala en el agua
    for dy in (-0.05, 0.05):
        caja((x, y + dy, borda_r + 0.1), (0.025, 0.025, 0.14), 3)
    p0 = (x - lado * 0.75, y + 0.3, borda_r + 0.2)
    p1 = (x + lado * 1.55, y - 0.28, -0.13)
    barra(p0, (x, y, borda_r + 0.085), 0.04, 0, 0.04)
    barra((x, y, borda_r + 0.085), p1, 0.04, 0, 0.04)
    # pala
    barra(p1, (p1[0] + lado * 0.55, p1[1] - 0.09, p1[2] - 0.12), 0.17, 1, 0.02)

# Cuerda de amarre, enrollada a proa, y una argolla
for k in range(14):
    a0, a1 = k / 14 * math.tau, (k + 1) / 14 * math.tau
    for r, z in ((0.1, 0), (0.075, 0.025)):
        cz = forma(0.2)[2] + 0.11 + z
        barra((math.cos(a0) * r, -1.42 + math.sin(a0) * r, cz), (math.cos(a1) * r, -1.42 + math.sin(a1) * r, cz), 0.022, 2, 0.022)

malla = bpy.data.meshes.new('Barca')
malla.from_pydata(vs, [], cs)
malla.update()
for m in (CLARO, OSCURO, DENTRO, HERRAJE):
    malla.materials.append(m)
for p, m in zip(malla.polygons, mats):
    p.material_index = m
    p.use_smooth = False
o = bpy.data.objects.new('Barca', malla)
bpy.context.scene.collection.objects.link(o)
# une los vértices repetidos, sin perder los cantos
bpy.context.view_layer.objects.active = o
o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0005)
bpy.ops.object.mode_set(mode='OBJECT')

os.makedirs(SALIDA, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SALIDA, 'barca.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, 'barca.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Barca terminada', len(malla.polygons), 'caras')
