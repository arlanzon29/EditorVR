# Editor VR: el candelabro de pie del menú (modelos/candelabro.glb), de hierro forjado: tres patas curvas con su pie,
# vara con nudos, dos brazos que suben en curva y, en la punta de la vara y de cada brazo, un platillo con su vela.
# Piezas: Hierro, Cera y las tres llamas aparte (Llama0, Llama1, Llama2: tiemblan; su origen, en la base de la llama).
# Mide 1,9 m hasta las llamas; origen en el suelo, en el eje; los brazos, a lo largo de x. Lo usa js/menu.js (candelabro).
# Uso: blender --background --python herramientas/modelar-candelabro.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, fotos, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
HIERRO = material('Hierro', (0.035, 0.032, 0.03), 0.5, 0.7)
CERA = material('Cera', (0.62, 0.57, 0.46), 0.9)
LLAMA = material('Llama', (0.95, 0.6, 0.2), 0.5)

ARRIBA = 1.62               # donde acaba la vara
BRAZO = 0.26                # lo que se abren los brazos
VELAS = [(-BRAZO, 1.56), (0, ARRIBA), (BRAZO, 1.56)]   # (x, altura del platillo): la del medio, en la punta de la vara
VELA = 0.18


def solevado_en(p, x, secciones, m, n):
    """Un solevado (que se hace en el eje) corrido a x."""
    i = len(p.v)
    p.solevado(secciones, m, n=n)
    p.v[i:] = [(vx + x, vy, vz) for vx, vy, vz in p.v[i:]]


hierro = Pieza()
# las patas: salen de abajo de la vara, se abren en curva hasta el suelo y acaban en una bolita
for k in range(3):
    a = k * 2 * math.pi / 3 + math.pi / 2
    c, s = math.cos(a), math.sin(a)
    hierro.tubo([(0.02 * c, 0.02 * s, 0.3), (0.08 * c, 0.08 * s, 0.2), (0.16 * c, 0.16 * s, 0.09), (0.23 * c, 0.23 * s, 0.035)], [0.018, 0.016, 0.014, 0.012], HIERRO, n=8)
    hierro.bola((0.24 * c, 0.24 * s, 0.025), (0.03, 0.03, 0.022), HIERRO, seg=(8, 5))
# la vara, hasta el platillo de arriba, con un nudo abajo, otro a media altura y otro donde salen los brazos
hierro.tubo([(0, 0, 0.26), (0, 0, ARRIBA)], [0.02, 0.016], HIERRO, n=10)
for z, r in [(0.3, 0.045), (0.85, 0.035), (1.32, 0.04)]:
    hierro.bola((0, 0, z), (r, r, r * 0.8), HIERRO, seg=(10, 6))
# los brazos: del nudo de arriba, en curva hacia fuera y hacia arriba, hasta debajo de su platillo
for l in (-1, 1):
    hierro.tubo([(0, 0, 1.33), (l * 0.1, 0, 1.36), (l * 0.2, 0, 1.43), (l * BRAZO, 0, 1.5), (l * BRAZO, 0, VELAS[0][1])],
                [0.014, 0.013, 0.012, 0.012, 0.012], HIERRO, n=8)
cera = Pieza()
for x, z in VELAS:
    # el platillo, con su borde, apoyado en la punta del brazo o de la vara
    solevado_en(hierro, x, [(z - 0.012, 0.025, 0.025, 0), (z, 0.06, 0.06, 0), (z + 0.012, 0.062, 0.062, 0)], HIERRO, 14)
    solevado_en(hierro, x, [(z + 0.004, 0.058, 0.058, 0), (z + 0.016, 0.066, 0.066, 0)], HIERRO, 14)
    # la vela, de pie en el platillo, con un goterón de cera a un lado
    solevado_en(cera, x, [(z + 0.008, 0.024, 0.024, 0), (z + VELA, 0.022, 0.022, 0), (z + VELA + 0.008, 0.012, 0.012, 0)], CERA, 10)
    cera.bola((x + 0.021, 0, z + VELA - 0.04), (0.008, 0.008, 0.02), CERA, seg=(6, 4))

objetos = [hierro.malla('Hierro'), cera.malla('Cera')]
# las llamas: una gota alargada encima de cada vela, con el origen en su base para estirarla desde ahí
for k, (x, z) in enumerate(VELAS):
    base = z + VELA + 0.01
    p = Pieza()
    p.bola((x, 0, base + 0.032), (0.014, 0.014, 0.034), LLAMA, seg=(8, 6))
    objetos.append(p.malla(f'Llama{k}', (x, 0, base)))
for o in objetos:
    print(f'{o.name}: {len(o.data.polygons)} caras')
    o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, 'candelabro.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, 'candelabro.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Candelabro terminado')
if FOTOS:
    fotos(FOTOS)
