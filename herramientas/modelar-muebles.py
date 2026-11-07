# Editor VR: los muebles de tu casa terminada (episodio 2, js/casa.js casa-muebles): mesa de caballetes, banco, cama,
# arcón y estante, cada uno en modelos/mueble-<nombre>.glb, en pocas piezas (una por material). Son fijos: van
# horneados con la casa terminada (MODELOS_HORNEADOS, js/rendimiento.js). Origen en el suelo, en el centro; el frente
# mira hacia -y en Blender (+z en la escena); lo largo de la mesa y del banco, a lo largo de x; la cama, a lo largo de y,
# con la cabecera en +y (hacia -z en la escena).
# Uso: blender --background --python herramientas/modelar-muebles.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None


def nuevo():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return dict(
        madera=material('Madera', (0.2, 0.12, 0.065)),
        oscura=material('MaderaOscura', (0.09, 0.055, 0.03)),
        hierro=material('Hierro', (0.045, 0.043, 0.04), 0.55, 0.7),
        paja=material('Paja', (0.42, 0.34, 0.19)),
        manta=material('Manta', (0.17, 0.055, 0.04)),
        lino=material('Lino', (0.58, 0.54, 0.44)),
        barro=material('Barro', (0.3, 0.13, 0.06), 0.8),
        loza=material('Loza', (0.5, 0.46, 0.38), 0.6),
        cuero=material('Cuero', (0.16, 0.08, 0.04), 0.7),
        verde=material('PanoVerde', (0.11, 0.16, 0.08)),
    )


def caja(p, m, cx, cy, cz, w, d, h, inclina=0.0):
    """Una caja de w × d × h con el centro abajo en (cx, cy, cz). inclina: lo que se desplaza en x la cara de arriba."""
    x0, x1, y0, y1 = -w / 2, w / 2, -d / 2, d / 2
    abajo = [(cx + x0, cy + y0, cz), (cx + x1, cy + y0, cz), (cx + x1, cy + y1, cz), (cx + x0, cy + y1, cz)]
    arriba = [(x + inclina, y, cz + h) for x, y, _ in abajo]
    p.aros([abajo, arriba], m)


def exportar_mueble(nombre, p):
    malla = p.malla('Mueble_' + nombre)
    bpy.ops.object.select_all(action='DESELECT')
    malla.select_set(True)
    bpy.context.view_layer.objects.active = malla
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, f'mueble-{nombre}.blend'), compress=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, f'mueble-{nombre}.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
    print(f'{nombre}: {len(p.c)} caras')
    if FOTOS:
        foto(nombre, malla)


def foto(nombre, malla):
    e = bpy.context.scene
    motores = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    e.render.engine = next((m for m in motores if 'EEVEE' in m), motores[0])
    e.render.resolution_x, e.render.resolution_y = 480, 360
    mundo = bpy.data.worlds.new('Mundo'); mundo.use_nodes = True
    next(n for n in mundo.node_tree.nodes if n.type == 'BACKGROUND').inputs[0].default_value = (0.55, 0.62, 0.7, 1)
    e.world = mundo
    sol = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN')); sol.data.energy = 3; sol.rotation_euler = (0.9, 0.2, 0.5)
    e.collection.objects.link(sol)
    cam = bpy.data.objects.new('C', bpy.data.cameras.new('C')); e.collection.objects.link(cam); e.camera = cam; cam.data.lens = 35
    centro = Vector((0, 0, 0.45))
    cam.location = (1.6, -2.4, 1.6)
    cam.rotation_euler = (centro - cam.location).to_track_quat('-Z', 'Y').to_euler()
    os.makedirs(FOTOS, exist_ok=True)
    e.render.filepath = os.path.join(FOTOS, nombre + '.png')
    bpy.ops.render.render(write_still=True)


# --- la mesa de caballetes: tres tablones sobre dos caballetes en A, con un travesaño largo ---
M = nuevo(); p = Pieza()
L, F, ALTO = 1.6, 0.9, 0.78
for k, y in enumerate((-0.3, 0, 0.3)):
    caja(p, M['madera'], 0, y, ALTO - 0.05, L, 0.29, 0.05)
for x in (-0.6, 0.6):
    caja(p, M['oscura'], x, 0, ALTO - 0.11, 0.09, F - 0.08, 0.06)           # el travesaño de arriba del caballete
    for s in (-1, 1):                                                          # las dos patas, abiertas hacia los lados
        caja(p, M['oscura'], x - 0.04, s * 0.32, 0, 0.08, 0.08, ALTO - 0.11)
        p.tubo([(x, s * 0.32, 0.02), (x, s * 0.05, ALTO - 0.12)], [0.03, 0.03], M['oscura'], n=4)   # el tornapunta
caja(p, M['oscura'], 0, 0, 0.22, L - 0.2, 0.07, 0.08)                          # el travesaño largo, abajo
for x in (-0.6, 0.6):
    caja(p, M['hierro'], x, -F / 2 + 0.005, ALTO - 0.05, 0.05, 0.012, 0.05)     # clavos de hierro en el canto
exportar_mueble('mesa', p)

# --- el banco: un tablón grueso sobre dos tablas de pie con su muesca, y un travesaño ---
M = nuevo(); p = Pieza()
caja(p, M['madera'], 0, 0, 0.4, 1.4, 0.3, 0.06)
for x in (-0.55, 0.55):
    caja(p, M['oscura'], x, 0, 0, 0.05, 0.26, 0.4)
    caja(p, M['oscura'], x, 0, 0, 0.07, 0.3, 0.06)                             # el pie, algo más ancho
caja(p, M['oscura'], 0, 0, 0.16, 1.1, 0.05, 0.06)
exportar_mueble('banco', p)

# --- la cama: armazón de vigas con patas, cabecero de tablas, jergón de paja, sábana, manta y almohada ---
M = nuevo(); p = Pieza()
A, LARGO = 0.95, 2.0
for s in (-1, 1):
    caja(p, M['oscura'], s * (A / 2 - 0.05), 0, 0.12, 0.1, LARGO, 0.16)        # los largueros
for y in (-LARGO / 2 + 0.05, LARGO / 2 - 0.05):
    caja(p, M['oscura'], 0, y, 0.12, A, 0.1, 0.16)                             # los travesaños
for sx in (-1, 1):
    caja(p, M['oscura'], sx * (A / 2 - 0.05), -LARGO / 2 + 0.05, 0, 0.12, 0.12, 0.42)   # patas de los pies
    caja(p, M['oscura'], sx * (A / 2 - 0.05), LARGO / 2 - 0.05, 0, 0.12, 0.12, 0.95)    # postes de la cabecera
for k in range(4):                                                             # el cabecero, de tablas
    caja(p, M['madera'], -A / 2 + 0.16 + k * 0.21, LARGO / 2 - 0.05, 0.3, 0.19, 0.04, 0.55)
caja(p, M['oscura'], 0, LARGO / 2 - 0.05, 0.82, A - 0.1, 0.07, 0.07)
# el jergón, de paja, un poco abultado: un solevado con las esquinas redondeadas
def jergon(t, a):
    return 1 + 0.06 * math.cos(2 * a) ** 2
for z, (rx, ry) in ((0.28, (0.4, 0.93)),):
    p.solevado([(0.27, 0.4, 0.94, 0), (0.33, 0.42, 0.96, 0), (0.4, 0.41, 0.95, 0), (0.43, 0.37, 0.9, 0)], M['paja'], n=24, forma=jergon)
# la sábana asomando, la manta doblada que cae por los lados, y la almohada en la cabecera
caja(p, M['lino'], 0, 0.6, 0.43, 0.82, 0.75, 0.03)                           # (solo asoma hacia la cabecera)
mantas = []
for y, z in ((-0.99, 0.475), (-0.4, 0.485), (0.3, 0.485)):
    mantas.append([(x * 0.48, y, z - (0.16 if abs(x) > 0.95 else 0.02 if abs(x) > 0.8 else 0.0)) for x in (-1.0, -0.86, -0.5, 0, 0.5, 0.86, 1.0)])
p.aros([[(x, y, z + 0.015) for x, y, z in a] for a in mantas], M['manta'], arco=True)
p.aros([list(reversed(a)) for a in mantas], M['manta'], arco=True)
caja(p, M['manta'], 0, 0.3, 0.48, 0.9, 0.12, 0.035)                         # el embozo, doblado
p.tubo([(-0.32, 0.78, 0.5), (0, 0.8, 0.51), (0.32, 0.78, 0.5)], [0.07, 0.08, 0.07], M['lino'], n=10)   # la almohada
exportar_mueble('cama', p)

# --- el arcón: caja de tablas con la tapa algo mayor, tres flejes de hierro, cerradura y patas ---
M = nuevo(); p = Pieza()
AN, FO, AL = 0.9, 0.5, 0.42
caja(p, M['madera'], 0, 0, 0.05, AN, FO, AL - 0.05)
caja(p, M['madera'], 0, 0, AL, AN + 0.03, FO + 0.03, 0.06)
for x in (-AN / 2 + 0.06, AN / 2 - 0.06):
    caja(p, M['oscura'], x, 0, 0, 0.08, FO - 0.02, 0.06)                       # las patas, en dos listones
for x in (-0.3, 0, 0.3):
    caja(p, M['hierro'], x, -FO / 2 - 0.012, 0.06, 0.05, 0.012, AL - 0.02)      # flejes por delante
    caja(p, M['hierro'], x, 0, AL + 0.06, 0.05, FO + 0.05, 0.01)                # y por encima de la tapa
caja(p, M['hierro'], 0, -FO / 2 - 0.022, AL - 0.17, 0.1, 0.012, 0.13)          # la cerradura
p.bola((0, -FO / 2 - 0.03, AL - 0.11), 0.018, M['oscura'], seg=(6, 4))
exportar_mueble('arcon', p)

# --- el estante: dos baldas con escuadras, contra la pared (en +y), con jarras, un cuenco y dos libros ---
M = nuevo(); p = Pieza()
AN = 1.2
for z in (0.0, 0.42):
    caja(p, M['madera'], 0, 0, z, AN, 0.25, 0.04)
for x in (-0.5, 0.5):
    caja(p, M['oscura'], x, 0.1, -0.22, 0.04, 0.05, 0.68)                      # los listones contra la pared
    p.tubo([(x, 0.11, -0.18), (x, -0.08, -0.01)], [0.018, 0.018], M['oscura'], n=4)   # las escuadras
# en la de abajo: dos jarras de barro y un cuenco
for x, r, h in ((-0.4, 0.07, 0.2), (-0.22, 0.05, 0.14)):
    perfil = [(0.04, r * 0.7), (0.06, r), (h * 0.6, r * 1.05), (h * 0.85, r * 0.6), (h, r * 0.65)]
    p.aros([[(x + rr * math.cos(2 * math.pi * k / 12), rr * math.sin(2 * math.pi * k / 12), z) for k in range(12)] for z, rr in perfil], M['barro'])
p.aros([[(0.05 + rr * math.cos(2 * math.pi * k / 14), rr * math.sin(2 * math.pi * k / 14), z) for k in range(14)] for z, rr in ((0.04, 0.05), (0.06, 0.08), (0.1, 0.1))], M['loza'], tapas=(True, False))
# en la de arriba: dos libros tumbados y uno de pie
caja(p, M['cuero'], 0.3, 0, 0.46, 0.22, 0.16, 0.05)
caja(p, M['verde'], 0.31, 0, 0.51, 0.2, 0.15, 0.04)
caja(p, M['cuero'], 0.05, 0.02, 0.46, 0.05, 0.17, 0.24)
exportar_mueble('estante', p)
print('Muebles terminados')
