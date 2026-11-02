# Editor VR: el ciervo del bosque (modelos/ciervo.glb). Cuerpo, cuello con la cabeza, astas aparte (la cierva no las
# lleva) y cuatro patas, cada una con su pivote donde se mueve: el cuello en la cruz y las patas arriba, en el hombro
# y en la cadera. Mira hacia -y (en el juego, +z). Lo mueve js/animales.js (ciervo).
# Uso: blender --background --python herramientas/modelar-ciervo.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, fotos, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
PIEL = material('Piel', (0.36, 0.22, 0.12), 0.95)
CLARA = material('Clara', (0.72, 0.62, 0.48), 0.95)
OSCURO = material('Oscuro', (0.06, 0.045, 0.035), 0.6)
ASTA = material('Asta', (0.5, 0.42, 0.3), 0.8)

# dónde se mueve cada cosa
CRUZ = (0, -0.5, 1.2)
PATAS = {'PataDI': (-0.13, -0.48, 0.98), 'PataDD': (0.13, -0.48, 0.98), 'PataTI': (-0.13, 0.48, 1.0), 'PataTD': (0.13, 0.48, 1.0)}


def tumbado(p, secciones, m, n=14):
    """Un solevado a lo largo de y: secciones (y, medio ancho, medio alto, z del centro)."""
    aros = []
    for y, rx, rz, cz in secciones:
        aros.append([(rx * math.cos(2 * math.pi * s / n), y, cz + rz * math.sin(2 * math.pi * s / n)) for s in range(n)])
    p.aros(aros, m)


def cuerpo():
    p = Pieza()
    # del pecho (delante, -y) a la grupa; la tripa algo más baja que el lomo
    tumbado(p, [(-0.74, 0.08, 0.1, 1.06), (-0.66, 0.16, 0.2, 1.04), (-0.45, 0.2, 0.26, 1.03), (-0.15, 0.21, 0.26, 1.03),
                (0.2, 0.2, 0.24, 1.05), (0.48, 0.18, 0.22, 1.08), (0.66, 0.13, 0.16, 1.1), (0.74, 0.06, 0.08, 1.12)], PIEL)
    # la grupa clara y el rabo
    p.bola((0, 0.69, 1.12), (0.1, 0.035, 0.12), CLARA)
    p.tubo([(0, 0.74, 1.2), (0, 0.8, 1.13), (0, 0.82, 1.04)], [0.04, 0.035, 0.015], CLARA, n=6)
    # la tripa, más clara por debajo
    p.bola((0, -0.05, 0.82), (0.15, 0.4, 0.06), CLARA)
    return p.malla('Cuerpo')


def cuello():
    p = Pieza()
    # del pecho a la nuca, hacia delante y arriba
    p.tubo([(0, -0.52, 1.12), (0, -0.66, 1.36), (0, -0.78, 1.58), (0, -0.84, 1.68)], [0.13, 0.1, 0.08, 0.075], PIEL, n=10)
    # la cabeza: cráneo, hocico, nariz, ojos y orejas
    p.bola((0, -0.88, 1.7), (0.085, 0.12, 0.085), PIEL)
    p.tubo([(0, -0.92, 1.69), (0, -1.02, 1.64), (0, -1.1, 1.6)], [0.07, 0.055, 0.042], PIEL, n=10)
    p.bola((0, -1.12, 1.6), (0.04, 0.03, 0.035), OSCURO, seg=(8, 5))
    for l in (-1, 1):
        p.bola((l * 0.07, -0.93, 1.73), 0.017, OSCURO, seg=(6, 4))
        p.tubo([(l * 0.07, -0.84, 1.77), (l * 0.15, -0.83, 1.82), (l * 0.2, -0.82, 1.84)], [0.03, 0.035, 0.012], PIEL, n=6)
    # la garganta clara
    p.bola((0, -0.9, 1.6), (0.05, 0.07, 0.03), CLARA, seg=(8, 5))
    return p.malla('Cuello', CRUZ)


def astas():
    p = Pieza()
    for l in (-1, 1):
        base = (l * 0.05, -0.82, 1.78)
        p.tubo([base, (l * 0.14, -0.78, 1.95), (l * 0.22, -0.72, 2.12), (l * 0.26, -0.66, 2.3)], [0.025, 0.022, 0.018, 0.01], ASTA, n=6)
        # las puntas: hacia delante y hacia arriba
        for (a, b) in [((l * 0.13, -0.79, 1.92), (l * 0.16, -0.95, 1.98)), ((l * 0.2, -0.74, 2.08), (l * 0.24, -0.86, 2.2)),
                       ((l * 0.24, -0.69, 2.22), (l * 0.33, -0.7, 2.36))]:
            p.tubo([a, b], [0.014, 0.006], ASTA, n=5)
    return p.malla('Astas', CRUZ)


def pata(nombre):
    x, y, z = PATAS[nombre]
    p = Pieza()
    if y < 0:   # delante: recta, con la rodilla marcada
        p.tubo([(x, y, z), (x, y - 0.02, 0.62), (x, y, 0.5), (x, y + 0.01, 0.12)], [0.075, 0.05, 0.045, 0.032], PIEL, n=8)
    else:       # detrás: muslo fuerte y el corvejón hacia atrás
        p.tubo([(x, y, z), (x, y + 0.06, 0.72), (x, y + 0.12, 0.5), (x, y + 0.06, 0.12)], [0.11, 0.075, 0.045, 0.032], PIEL, n=8)
    pie = y + (0.01 if y < 0 else 0.06)
    p.bola((x, pie - 0.01, 0.06), (0.04, 0.05, 0.06), OSCURO, seg=(8, 5))
    return p.malla(nombre, (x, y, z))


objetos = [cuerpo(), cuello()]
cu, a = objetos[1], astas()
a.parent = cu
a.location = (0, 0, 0)   # (el mismo origen que el cuello)
objetos.append(a)
for nombre in PATAS:
    objetos.append(pata(nombre))
for o in objetos:
    print(f'{o.name}: {len(o.data.polygons)} caras')
    o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, 'ciervo.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, 'ciervo.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Ciervo terminado')
if FOTOS:
    fotos(FOTOS)
