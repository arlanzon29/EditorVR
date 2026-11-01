# Editor VR: la novia de la boda (modelos/novia.glb): vestido largo con cola, corpiño, cinturón, velo, corona
# de flores y ramo. De pie, 1,72 m, origen entre los pies, mira hacia -y en Blender (+z en la escena). Las piezas
# se llaman como las del guardia, para que las mueva el mismo componente: GuardiaCuerpo y GuardiaCabeza (con el
# pivote en el cuello). Es un personaje: no va horneado.
# Uso: blender --background --python herramientas/modelar-novia.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, animar, brazos, esqueleto, exportar, fotos_animadas, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
J = dict(cadera=(0, 0, 0.96), espalda=(0, 0, 1.08), pecho=(0, 0, 1.22), cuello=(0, 0.006, 1.39), cabeza=(0, 0.006, 1.46), hombro=(0.158, 0, 1.31), codo=(0.4, 0, 1.31), muneca=(0.63, 0, 1.31),
         anca=(0.08, 0, 0.88), rodilla=(0.09, 0, 0.5), tobillo=(0.09, 0, 0.08))
bpy.ops.wm.read_factory_settings(use_empty=True)


TELA = material('Vestido', (0.62, 0.57, 0.46))
TELA2 = material('Corpino', (0.55, 0.50, 0.40))
VELO = material('Velo', (0.78, 0.75, 0.66))
PIEL = material('Piel', (0.50, 0.30, 0.20), 0.7)
PELO = material('Pelo', (0.09, 0.045, 0.02), 0.8)
OJOS = material('Ojos', (0.012, 0.009, 0.006), 0.4)
LABIOS = material('Labios', (0.30, 0.08, 0.07), 0.6)
ORO = material('OroViejo', (0.42, 0.28, 0.10), 0.45, 0.7)
FLOR = material('Flor', (0.46, 0.17, 0.20))
FLOR2 = material('FlorClara', (0.68, 0.60, 0.42))
HOJA = material('Hoja', (0.09, 0.17, 0.05))


cuerpo = Pieza()
# la falda: se abre hacia abajo, con pliegues cada vez más marcados y la cola hacia atrás (+y)
pliegues = lambda t, a: 1 + (t ** 1.3) * 0.085 * math.sin(a * 9 + 0.6) + (t ** 2) * 0.03 * math.sin(a * 17)
cuerpo.solevado([
    (0.97, 0.125, 0.095, 0),
    (0.86, 0.165, 0.125, 0.004),
    (0.70, 0.205, 0.165, 0.012),
    (0.50, 0.255, 0.225, 0.03),
    (0.30, 0.315, 0.30, 0.06),
    (0.12, 0.38, 0.40, 0.12),
    (0.02, 0.43, 0.53, 0.20),
], TELA, n=36, forma=pliegues)
# el corpiño, algo más oscuro, y el escote. El pecho: dos abultamientos por delante, a media altura
def pecho(t, a):
    a = (a + math.pi) % (2 * math.pi) - math.pi     # (por delante, a = -90°)
    alto = math.exp(-((t - 0.5) / 0.17) ** 2)
    return 1 + 0.32 * alto * (math.exp(-((a + 2.2) / 0.36) ** 2) + math.exp(-((a + 0.94) / 0.36) ** 2))


cuerpo.solevado([
    (0.96, 0.128, 0.098, 0),
    (1.06, 0.135, 0.097, 0),
    (1.15, 0.155, 0.11, -0.004),
    (1.22, 0.166, 0.118, -0.006),
    (1.285, 0.168, 0.112, -0.002),
    (1.335, 0.158, 0.095, 0.004),
    (1.365, 0.12, 0.072, 0.006),
], TELA2, n=28, forma=pecho)
# hombros y cuello, de piel, saliendo del escote
cuerpo.solevado([(1.35, 0.11, 0.07, 0.006), (1.385, 0.085, 0.058, 0.006), (1.415, 0.05, 0.05, 0.006), (1.47, 0.043, 0.045, 0.006)], PIEL, n=12)
# el borde del escote y el cinturón, con su caída por delante
cuerpo.solevado([(1.352, 0.135, 0.083, 0.005), (1.372, 0.122, 0.075, 0.005), (1.378, 0.11, 0.068, 0.005)], ORO, n=20)
cuerpo.solevado([(0.955, 0.134, 0.103, 0), (0.985, 0.134, 0.103, 0), (0.99, 0.128, 0.098, 0)], ORO, n=20)
cuerpo.tubo([(0, -0.106, 0.97), (0.006, -0.135, 0.8), (-0.004, -0.17, 0.6), (0, -0.215, 0.44)], [0.012, 0.01, 0.01, 0.009], ORO, n=6)
cuerpo.bola((0, -0.218, 0.425), (0.02, 0.012, 0.03), ORO, seg=(8, 5))
# el borde de abajo de la falda
cuerpo.solevado([(0.075, 0.4025, 0.4585, 0.156), (0.04, 0.42, 0.504, 0.184)], ORO, n=36, forma=lambda t, a: 1.012 + 0.08 * math.sin(a * 9 + 0.6) + 0.027 * math.sin(a * 17))
# los brazos, en cruz, con manga larga; la derecha lleva el ramo: un manojo de tallos y flores en corona
for s in (-1, 1):
    cuerpo.bola((s * 0.158, 0, 1.31), (0.05, 0.052, 0.05), TELA2)
    cuerpo.tubo([(s * 0.158, 0, 1.31), (s * 0.4, 0, 1.31), (s * 0.63, 0, 1.31)], [0.047, 0.041, 0.04], TELA2, n=10)
    cuerpo.bola((s * 0.67, 0, 1.31), (0.045, 0.034, 0.038), PIEL)
RX, RY, RZ = -0.71, -0.02, 1.31
cuerpo.tubo([(RX, RY, RZ + 0.03), (RX, RY, RZ - 0.1), (RX, RY, RZ - 0.18)], [0.014, 0.017, 0.012], HOJA, n=8)
cuerpo.bola((RX, RY, RZ + 0.11), (0.036, 0.03, 0.033), FLOR, seg=(8, 5))
for k in range(6):
    a = k * math.pi / 3
    cuerpo.bola((RX + 0.065 * math.cos(a), RY + 0.05 * math.sin(a), RZ + 0.075), (0.036, 0.033, 0.03), FLOR if k % 2 else FLOR2, seg=(8, 5))
for k in range(5):
    a = k * 2 * math.pi / 5 + 0.3
    cuerpo.bola((RX + 0.1 * math.cos(a), RY + 0.08 * math.sin(a), RZ + 0.05), (0.04, 0.03, 0.012), HOJA, seg=(6, 4))
# el velo largo, a la espalda: arranca en la nuca y cae hasta los pies, sobre la cola
aros, N = [], 15
tramos = [(1.5, 0.075, 0.075), (1.36, 0.14, 0.135), (1.14, 0.2, 0.155), (0.9, 0.235, 0.205), (0.65, 0.27, 0.27), (0.4, 0.3, 0.36), (0.18, 0.31, 0.47)]
for z, r, fondo in tramos:
    aro = []
    for s in range(N):
        u = s / (N - 1)
        a = math.pi * (0.12 + 0.76 * u)     # por detrás y por los lados, sin tapar por delante
        o = 1 + 0.035 * math.sin(u * 19) * (1.5 - z)
        aro.append((r * o * math.cos(a), 0.01 + (fondo + 0.012) * o * math.sin(a), z))
    aros.append(aro)
exterior = [[(x, y + 0.006, z) for x, y, z in a] for a in aros]
cuerpo.aros(exterior, VELO, arco=True)
cuerpo.aros([list(reversed(a)) for a in aros], VELO, arco=True)
cabeza = cuerpo
c = 1.575   # centro de la cabeza
cabeza.solevado([
    (c - 0.125, 0.018, 0.02, -0.035),   # barbilla
    (c - 0.1, 0.055, 0.06, -0.03),
    (c - 0.05, 0.078, 0.085, -0.012),
    (c, 0.087, 0.098, 0),
    (c + 0.05, 0.087, 0.1, 0.006),
    (c + 0.095, 0.068, 0.08, 0.008),
    (c + 0.122, 0.03, 0.035, 0.01),
], PIEL, n=18)
# la nariz, las orejas, los ojos, las cejas y los labios
cabeza.bola((0, -0.096, c - 0.012), (0.011, 0.015, 0.021), PIEL, seg=(8, 5))
for s in (-1, 1):
    cabeza.bola((s * 0.034, -0.086, c + 0.012), (0.012, 0.005, 0.008), OJOS, seg=(8, 4))
    cabeza.tubo([(s * 0.018, -0.091, c + 0.04), (s * 0.036, -0.09, c + 0.043), (s * 0.052, -0.08, c + 0.034)], [0.0035, 0.004, 0.003], PELO, n=5)
    cabeza.bola((s * 0.011, -0.091, c - 0.062), (0.014, 0.006, 0.0065), LABIOS, seg=(8, 4))
    cabeza.bola((s * 0.086, 0.005, c + 0.002), (0.008, 0.017, 0.024), PIEL, seg=(6, 4))
# el pelo: casquete con raya en medio, recogido en un moño bajo y dos mechones que enmarcan la cara
cabeza.solevado([
    (c - 0.06, 0.07, 0.078, 0.042),
    (c - 0.01, 0.092, 0.092, 0.034),
    (c + 0.05, 0.097, 0.1, 0.022),
    (c + 0.1, 0.082, 0.087, 0.012),
    (c + 0.126, 0.05, 0.055, 0.008),
    (c + 0.138, 0.012, 0.014, 0.006),
], PELO, n=18)
cabeza.bola((0, 0.078, c - 0.055), (0.044, 0.033, 0.042), PELO)
for s in (-1, 1):
    cabeza.tubo([(s * 0.06, -0.07, c + 0.075), (s * 0.085, -0.05, c + 0.03), (s * 0.088, -0.03, c - 0.03), (s * 0.072, -0.025, c - 0.085)], [0.016, 0.014, 0.011, 0.006], PELO, n=7)
# la parte alta del velo, que se mueve con la cabeza
aros = []
for z, r in [(c + 0.13, 0.05), (c + 0.1, 0.099), (c + 0.04, 0.113), (c - 0.03, 0.112), (c - 0.1, 0.095)]:
    aro = []
    for s in range(N):
        a = math.pi * (0.04 + 0.92 * s / (N - 1))
        aro.append((r * math.cos(a), 0.016 + r * 1.06 * math.sin(a), z))
    aros.append(aro)
cabeza.aros(aros, VELO, arco=True)
cabeza.aros([[(x, y - 0.004, z) for x, y, z in reversed(a)] for a in aros], VELO, arco=True)
# la corona: un aro de hojas con flores alrededor de la cabeza
aro = [(0.093 * math.cos(k * 2 * math.pi / 15), 0.012 + 0.103 * math.sin(k * 2 * math.pi / 15), c + 0.085 + 0.01 * math.sin(k * 2 * math.pi / 15)) for k in range(16)]
cabeza.tubo(aro, [0.007] * 16, HOJA, n=5)
for k in range(10):
    a = k * 2 * math.pi / 10 + 0.3
    cabeza.bola((0.095 * math.cos(a), 0.012 + 0.105 * math.sin(a), c + 0.088 + 0.01 * math.sin(a)), 0.018, FLOR2 if k % 2 else FLOR, seg=(7, 4))
malla = cuerpo.malla('Novia')
print(f'Novia: {len(cuerpo.c)} caras')
arma = esqueleto(malla, J, sin_brazo=('Velo',), sin_piernas=('Vestido', 'Velo', 'OroViejo'))

# Las poses, como en modelar-novio.py. Las dos manos delante, a la cintura, con el ramo en medio.
RAMO_D = brazos('D', (-0.25, -0.25, -0.93), (0.55, -0.8, -0.1), 123)
RAMO = {**RAMO_D, **brazos('I', (0.25, -0.25, -0.93), (-0.55, -0.8, -0.05))}
animar(arma, 'reposo', [(1, {**RAMO, 'pecho': (0, 0, 0)}), (48, {**RAMO, 'pecho': (1.5, 0, 0)}), (96, {**RAMO, 'pecho': (0, 0, 0)})])
def paso(i, d):
    return {**RAMO, 'musloI': (i * 18, 0, 0), 'espinillaI': (14 if i > 0 else 3, 0, 0), 'musloD': (d * 18, 0, 0), 'espinillaD': (14 if d > 0 else 3, 0, 0)}
animar(arma, 'andar', [(1, paso(-1, 1)), (13, paso(1, -1)), (25, paso(-1, 1))])
BESO = {**brazos('D', (-0.3, 0.05, -0.95), (-0.45, -0.1, -0.88), 180), **brazos('I', (0.35, -0.75, -0.4), (-0.2, -0.9, 0.3)), 'espalda': (4, 0, 0), 'pecho': (5, 0, 0), 'cuello': (-4, 6, 5), 'cabeza': (-12, 16, 12)}
animar(arma, 'beso', [(1, RAMO), (14, BESO), (48, BESO), (60, RAMO)])
exportar(CARPETA, 'novia', arma, malla)
print('Novia terminada')

if FOTOS:
    fotos_animadas(FOTOS, arma, [('reposo', 20), ('andar', 7), ('beso', 30)])
