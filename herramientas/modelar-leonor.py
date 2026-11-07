# Editor VR: Leonor ya casada (modelos/leonor.glb), la novia de la boda en el episodio 2: saya de lana verde oscuro,
# sin cola, con mangas largas, cinturón de cuero, y la toca rosa claro de las casadas: capucha abierta por delante y griñón al cuello.
# Los brazos, caídos a los lados. De pie, 1,72 m como la novia (la misma cabeza y el mismo esqueleto), origen entre los pies,
# mira hacia -y en Blender (+z en la escena), con reposo y andar (js/casa.js). Es un personaje: no va horneado.
# Uso: blender --background --python herramientas/modelar-leonor.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy, bmesh
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, animar, brazos, esqueleto, exportar, fotos_animadas, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
J = dict(cadera=(0, 0, 0.96), espalda=(0, 0, 1.08), pecho=(0, 0, 1.22), cuello=(0, 0.006, 1.39), cabeza=(0, 0.006, 1.46), hombro=(0.158, 0, 1.31), codo=(0.4, 0, 1.31), muneca=(0.63, 0, 1.31),
         anca=(0.08, 0, 0.88), rodilla=(0.09, 0, 0.5), tobillo=(0.09, 0, 0.08))
bpy.ops.wm.read_factory_settings(use_empty=True)

SAYA = material('Saya', (0.11, 0.15, 0.08))
CAMISA = material('Camisa', (0.55, 0.51, 0.42))
TOCA = material('Toca', (0.72, 0.4, 0.43))   # rosa claro, apagado
CUERO = material('Cuero', (0.07, 0.035, 0.015), 0.75)
HEBILLA = material('Hebilla', (0.2, 0.18, 0.15), 0.5, 0.8)
PIEL = material('Piel', (0.50, 0.30, 0.20), 0.7)
PELO = material('Pelo', (0.09, 0.045, 0.02), 0.8)
OJOS = material('Ojos', (0.012, 0.009, 0.006), 0.4)
LABIOS = material('Labios', (0.30, 0.08, 0.07), 0.6)

p = Pieza()
# la saya, hasta los pies, sin cola y con pliegues suaves
pliegues = lambda t, a: 1 + (t ** 1.3) * 0.07 * math.sin(a * 8 + 0.6) + (t ** 2) * 0.02 * math.sin(a * 15)
p.solevado([(0.97, 0.125, 0.095, 0), (0.84, 0.168, 0.13, 0.002), (0.62, 0.205, 0.175, 0.006), (0.38, 0.245, 0.215, 0.012), (0.14, 0.285, 0.255, 0.02), (0.03, 0.3, 0.27, 0.022)], SAYA, n=30, forma=pliegues)
# el cuerpo de la saya, cerrado hasta arriba, con el pecho un poco marcado
def pecho(t, a):
    a = (a + math.pi) % (2 * math.pi) - math.pi
    return 1 + 0.2 * math.exp(-((t - 0.5) / 0.18) ** 2) * (math.exp(-((a + 2.2) / 0.36) ** 2) + math.exp(-((a + 0.94) / 0.36) ** 2))
p.solevado([(0.96, 0.128, 0.098, 0), (1.06, 0.135, 0.097, 0), (1.15, 0.155, 0.11, -0.004), (1.22, 0.165, 0.117, -0.006), (1.285, 0.166, 0.111, -0.002), (1.335, 0.155, 0.093, 0.004)], SAYA, n=28, forma=pecho)
# el cuello de la camisa, que asoma, y el cuello de piel
p.solevado([(1.32, 0.138, 0.08, 0.004), (1.365, 0.1, 0.066, 0.006), (1.39, 0.062, 0.055, 0.006)], CAMISA, n=18)
p.solevado([(1.38, 0.05, 0.048, 0.006), (1.47, 0.043, 0.045, 0.006)], PIEL, n=12)
# el cinturón de cuero con su hebilla, y la punta que cuelga por delante
p.solevado([(0.955, 0.134, 0.103, 0), (0.99, 0.134, 0.103, 0), (0.995, 0.128, 0.098, 0)], CUERO, n=20)
p.bola((0, -0.106, 0.973), (0.022, 0.008, 0.02), HEBILLA, seg=(8, 4))
p.tubo([(0.012, -0.108, 0.96), (0.016, -0.125, 0.82), (0.012, -0.14, 0.7)], [0.012, 0.011, 0.01], CUERO, n=5)
# los pies, que asoman bajo la saya
for s in (-1, 1):
    p.tubo([(s * 0.09, -0.12, 0.04), (s * 0.09, -0.19, 0.03), (s * 0.09, -0.23, 0.025)], [0.045, 0.04, 0.024], CUERO, n=10)
# los brazos, en cruz, con manga larga de la saya y el puño de la camisa
for s in (-1, 1):
    p.bola((s * 0.158, 0, 1.31), (0.05, 0.052, 0.05), SAYA)
    p.tubo([(s * 0.158, 0, 1.31), (s * 0.4, 0, 1.31), (s * 0.6, 0, 1.31)], [0.047, 0.041, 0.04], SAYA, n=10)
    p.tubo([(s * 0.6, 0, 1.31), (s * 0.635, 0, 1.31)], [0.036, 0.034], CAMISA, n=10)
    p.bola((s * 0.67, 0, 1.31), (0.045, 0.034, 0.038), PIEL)

# la cabeza, la de la novia
c = 1.575
p.solevado([(c - 0.125, 0.018, 0.02, -0.035), (c - 0.1, 0.055, 0.06, -0.03), (c - 0.05, 0.078, 0.085, -0.012), (c, 0.087, 0.098, 0), (c + 0.05, 0.087, 0.1, 0.006), (c + 0.095, 0.068, 0.08, 0.008), (c + 0.122, 0.03, 0.035, 0.01)], PIEL, n=18)
p.bola((0, -0.096, c - 0.012), (0.011, 0.015, 0.021), PIEL, seg=(8, 5))
for s in (-1, 1):
    p.bola((s * 0.034, -0.086, c + 0.012), (0.012, 0.005, 0.008), OJOS, seg=(8, 4))
    p.tubo([(s * 0.018, -0.091, c + 0.04), (s * 0.036, -0.09, c + 0.043), (s * 0.052, -0.08, c + 0.034)], [0.0035, 0.004, 0.003], PELO, n=5)
    p.bola((s * 0.011, -0.091, c - 0.062), (0.014, 0.006, 0.0065), LABIOS, seg=(8, 4))
# el pelo, una raya fina que asoma en la frente bajo la toca
p.tubo([(-0.06, -0.083, c + 0.07), (-0.03, -0.094, c + 0.088), (0, -0.097, c + 0.092), (0.03, -0.094, c + 0.088), (0.06, -0.083, c + 0.07)], [0.008, 0.009, 0.009, 0.009, 0.008], PELO, n=6)
# la toca: una capucha de lienzo, abierta por delante para la cara (arriba casi cerrada, sobre la frente; a la altura
# de la cara, abierta de mejilla a mejilla) y por fuera de la cabeza, para que no la atraviese
N = 17
filas = [  # (alto, radio de lado, radio de fondo, hacia atrás, grados de la abertura a cada lado del frente)
    (c + 0.075, 0.118, 0.127, 0.01, 40), (c + 0.04, 0.12, 0.128, 0.01, 52), (c + 0.01, 0.12, 0.128, 0.012, 62), (c - 0.05, 0.115, 0.122, 0.016, 66),
    (c - 0.1, 0.104, 0.112, 0.022, 66), (c - 0.15, 0.098, 0.106, 0.026, 66)]
aros = []
for z, rx, ry, atras, abre in filas:
    a0, a1 = math.radians(-90 + abre), math.radians(270 - abre)
    aros.append([(rx * math.cos(a), atras + ry * math.sin(a), z) for a in [a0 + (a1 - a0) * k / (N - 1) for k in range(N)]])
# (dos hojas, la de fuera y la de dentro: en la escena solo se ve la cara de delante de cada una, así que la de fuera
# mira hacia fuera y la de dentro hacia la cabeza; si no, mirándole la cara se veía a través del forro. Se orientan
# después de hacer la malla: normals_make_consistent no sabe hacia dónde mira una hoja abierta)
hoja_fuera = len(p.c)
p.aros(aros, TOCA, arco=True)
hoja_dentro = len(p.c)
p.aros([[(x * 0.97, y * 0.97, z) for x, y, z in reversed(a)] for a in aros], TOCA, arco=True)
hoja_fin = len(p.c)
# arriba, cerrada sobre la frente y la coronilla
p.solevado([(c + 0.07, 0.119, 0.128, 0.01), (c + 0.1, 0.108, 0.118, 0.01), (c + 0.135, 0.08, 0.088, 0.012), (c + 0.155, 0.035, 0.04, 0.012), (c + 0.16, 0.005, 0.006, 0.012)], TOCA, n=20)
# el griñón: el lienzo que tapa el cuello y la barbilla por debajo y baja hasta los hombros, cerrado por delante
p.solevado([(1.35, 0.165, 0.108, 0.004), (1.39, 0.105, 0.085, 0.008), (c - 0.165, 0.085, 0.078, 0.012), (c - 0.125, 0.084, 0.076, 0.014), (c - 0.11, 0.07, 0.062, 0.02)], TOCA, n=24)

malla = p.malla('Leonor')
bm = bmesh.new(); bm.from_mesh(malla.data); bm.faces.ensure_lookup_table()
for i in range(hoja_fuera, hoja_fin):
    cara = bm.faces[i]
    centro = cara.calc_center_median()
    hacia_fuera = cara.normal.dot(centro - Vector((0, 0.012, centro.z))) > 0
    if hacia_fuera != (i < hoja_dentro):
        cara.normal_flip()
bm.to_mesh(malla.data); bm.free(); malla.data.update()
print(f'Leonor: {len(p.c)} caras')
arma = esqueleto(malla, J, sin_piernas=('Saya',))

# Las poses, como en modelar-moza.py: los brazos caídos, un poco hacia delante (con las manos juntas parecía que
# aún llevaba el ramo de la boda)
def brazo(lado, va=0):
    s = 1 if lado == 'I' else -1
    return brazos(lado, (s * 0.14, 0.26 * va, -0.96), (s * 0.12, 0.08 * va - 0.3, -0.95))
CAIDOS = {**brazo('I'), **brazo('D')}
# (las piernas, quietas y con su clave: sin ella, el reposo se queda con la pierna del último paso y la saya, torcida)
QUIETA = {h + l: (0, 0, 0) for h in ('muslo', 'espinilla', 'pie') for l in 'ID'}
animar(arma, 'reposo', [(1, {**CAIDOS, **QUIETA, 'pecho': (0, 0, 0)}), (48, {**CAIDOS, **QUIETA, 'pecho': (1.5, 0, 0)}), (96, {**CAIDOS, **QUIETA, 'pecho': (0, 0, 0)})])


# El paso en cuatro tiempos, como el de la moza: pierna delante apoyada y la otra atrás, y las dos cruzándose. Cada
# brazo va al revés que su pierna, y el tronco se gira a contra paso.
def tiempo(delante, cruce=False):
    a, b = ('I', 'D') if delante == 'I' else ('D', 'I')
    s = 1 if delante == 'I' else -1
    if cruce:
        piernas = {'muslo' + a: (6, 0, 0), 'espinilla' + a: (6, 0, 0), 'pie' + a: (-4, 0, 0), 'muslo' + b: (-14, 0, 0), 'espinilla' + b: (46, 0, 0), 'pie' + b: (10, 0, 0)}
        va = 0
    else:
        piernas = {'muslo' + a: (-22, 0, 0), 'espinilla' + a: (5, 0, 0), 'pie' + a: (-12, 0, 0), 'muslo' + b: (15, 0, 0), 'espinilla' + b: (20, 0, 0), 'pie' + b: (14, 0, 0)}
        va = s
    # (con la pierna izquierda delante, va delante el brazo derecho)
    return {**piernas, **brazo('I', va), **brazo('D', -va), 'cadera': (0, 0, 4 * va), 'espalda': (2, 0, 0), 'pecho': (0, 0, -6 * va)}


animar(arma, 'andar', [(1, tiempo('I')), (7, tiempo('I', True)), (13, tiempo('D')), (19, tiempo('D', True)), (25, tiempo('I'))])
exportar(CARPETA, 'leonor', arma, malla)
print('Leonor terminada')

if FOTOS:
    fotos_animadas(FOTOS, arma, [('reposo', 20), ('andar', 1), ('andar', 13)])
