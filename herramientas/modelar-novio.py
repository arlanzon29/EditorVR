# Editor VR: el novio de la boda, el tabernero de gala (modelos/novio.glb): túnica larga con cinturón y bolsa, capa
# corta con broche, calzas y botas, y una copa en la mano. En T-pose, 1,78 m, origen entre los pies, mira hacia -y en
# Blender (+z en la escena), con esqueleto y animaciones: reposo, andar, brindis y beso (js/boda.js).
# Uso: blender --background --python herramientas/modelar-novio.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, animar, brazos, esqueleto, exportar, fotos_animadas, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
J = dict(cadera=(0, 0, 1.0), espalda=(0, 0, 1.13), pecho=(0, 0, 1.27), cuello=(0, 0.004, 1.43), cabeza=(0, 0.004, 1.51), hombro=(0.2, 0, 1.35), codo=(0.46, 0, 1.35), muneca=(0.71, 0, 1.35),
         anca=(0.09, 0, 0.92), rodilla=(0.095, 0, 0.52), tobillo=(0.095, 0.005, 0.09))
bpy.ops.wm.read_factory_settings(use_empty=True)

TUNICA = material('Tunica', (0.085, 0.13, 0.05))
ADORNO = material('Adorno', (0.34, 0.27, 0.13))
CAPA = material('Capa', (0.17, 0.035, 0.03))
CALZAS = material('Calzas', (0.11, 0.09, 0.065))
CUERO = material('Cuero', (0.045, 0.024, 0.012), 0.75)
PIEL = material('Piel', (0.46, 0.27, 0.17), 0.7)
PELO = material('Pelo', (0.05, 0.028, 0.014), 0.8)
OJOS = material('Ojos', (0.012, 0.009, 0.006), 0.4)
LABIOS = material('Labios', (0.26, 0.09, 0.07), 0.6)
ORO = material('OroViejo', (0.42, 0.28, 0.10), 0.45, 0.7)
FLOR = material('Flor', (0.68, 0.60, 0.42))
HOJA = material('Hoja', (0.09, 0.17, 0.05))

cuerpo = Pieza()
# piernas y botas
for s in (-1, 1):
    cuerpo.tubo([(s * 0.09, 0, 0.9), (s * 0.095, 0, 0.55), (s * 0.095, 0.005, 0.28)], [0.082, 0.058, 0.05], CALZAS, n=10)
    cuerpo.tubo([(s * 0.095, 0.005, 0.33), (s * 0.095, 0.005, 0.09)], [0.058, 0.052], CUERO, n=10)
    cuerpo.tubo([(s * 0.095, 0.03, 0.05), (s * 0.095, -0.05, 0.045), (s * 0.095, -0.13, 0.035)], [0.058, 0.055, 0.03], CUERO, n=10)
# la túnica, hasta la rodilla, con vuelo y pliegues
pliegues = lambda t, a: 1 + t * 0.07 * math.sin(a * 8 + 0.4)
cuerpo.solevado([(1.03, 0.15, 0.115, 0), (0.86, 0.19, 0.15, 0), (0.68, 0.235, 0.195, 0.005), (0.5, 0.275, 0.24, 0.012)], TUNICA, n=28, forma=pliegues)
cuerpo.solevado([(0.535, 0.262, 0.228, 0.011), (0.5, 0.281, 0.245, 0.012)], ADORNO, n=28, forma=lambda t, a: 1.01 + 0.07 * math.sin(a * 8 + 0.4))
cuerpo.solevado([
    (1.0, 0.15, 0.113, 0),
    (1.14, 0.165, 0.118, 0),
    (1.27, 0.2, 0.128, 0),
    (1.37, 0.205, 0.115, 0.004),
    (1.415, 0.13, 0.08, 0.006),
], TUNICA, n=20)
# el cuello, el borde de la túnica y el cinturón, con hebilla y bolsa
cuerpo.solevado([(1.39, 0.09, 0.07, 0.006), (1.44, 0.05, 0.052, 0.006), (1.52, 0.046, 0.048, 0.006)], PIEL, n=12)
cuerpo.solevado([(1.4, 0.112, 0.08, 0.006), (1.425, 0.095, 0.068, 0.006)], ADORNO, n=20)
cuerpo.solevado([(0.985, 0.158, 0.122, 0), (1.03, 0.158, 0.122, 0), (1.035, 0.15, 0.115, 0)], CUERO, n=20)
cuerpo.bola((0, -0.122, 1.007), (0.032, 0.012, 0.03), ORO, seg=(8, 5))
cuerpo.bola((0.135, -0.09, 0.93), (0.05, 0.022, 0.065), CUERO, seg=(8, 5))
# los brazos, en cruz; la derecha lleva la copa
for s in (-1, 1):
    cuerpo.bola((s * 0.2, 0, 1.35), (0.06, 0.06, 0.056), TUNICA)
    cuerpo.tubo([(s * 0.2, 0, 1.35), (s * 0.46, 0, 1.35), (s * 0.71, 0, 1.35)], [0.052, 0.044, 0.04], TUNICA, n=10)
    cuerpo.bola((s * 0.755, 0, 1.35), (0.05, 0.036, 0.04), PIEL)
X, Y, Z = -0.77, -0.03, 1.35
for z0, z1, r0, r1 in [(-0.075, -0.065, 0.035, 0.028), (-0.065, 0.03, 0.01, 0.01), (0.03, 0.115, 0.022, 0.044)]:
    aros = [[(X + r * math.cos(2 * math.pi * k / 12), Y + r * math.sin(2 * math.pi * k / 12), Z + z) for k in range(12)] for z, r in ((z0, r0), (z1, r1))]
    cuerpo.aros(aros, ORO)
# la capa corta, a la espalda, desde los hombros, con el broche delante
aros, N = [], 15
for z, r, fondo in [(1.44, 0.11, 0.09), (1.37, 0.245, 0.15), (1.2, 0.285, 0.18), (0.98, 0.31, 0.22), (0.72, 0.325, 0.27)]:
    aro = []
    for s in range(N):
        u = s / (N - 1)
        a = math.pi * (-0.04 + 1.08 * u)
        o = 1 + 0.03 * math.sin(u * 22) * (1.5 - z)
        aro.append((r * o * math.cos(a), 0.012 + fondo * o * math.sin(a), z))
    aros.append(aro)
cuerpo.aros([[(x, y + 0.006, z) for x, y, z in a] for a in aros], CAPA, arco=True)
cuerpo.aros([list(reversed(a)) for a in aros], CAPA, arco=True)
cuerpo.bola((0.1, -0.07, 1.385), (0.024, 0.012, 0.024), ORO, seg=(8, 5))
cabeza = cuerpo
c = 1.63
cabeza.solevado([
    (c - 0.13, 0.025, 0.025, -0.035),
    (c - 0.1, 0.065, 0.068, -0.025),
    (c - 0.05, 0.085, 0.09, -0.01),
    (c, 0.092, 0.102, 0),
    (c + 0.05, 0.092, 0.104, 0.006),
    (c + 0.095, 0.073, 0.084, 0.008),
    (c + 0.125, 0.032, 0.036, 0.01),
], PIEL, n=18)
cabeza.bola((0, -0.1, c - 0.012), (0.014, 0.019, 0.026), PIEL, seg=(8, 5))
for s in (-1, 1):
    cabeza.bola((s * 0.037, -0.09, c + 0.012), (0.012, 0.005, 0.008), OJOS, seg=(8, 4))
    cabeza.tubo([(s * 0.018, -0.095, c + 0.04), (s * 0.038, -0.094, c + 0.043), (s * 0.056, -0.083, c + 0.034)], [0.005, 0.005, 0.0035], PELO, n=5)
    cabeza.bola((s * 0.091, 0.005, c + 0.002), (0.009, 0.018, 0.026), PIEL, seg=(6, 4))
cabeza.bola((0, -0.093, c - 0.06), (0.02, 0.006, 0.006), LABIOS, seg=(8, 4))
# el pelo corto, con flequillo, y la barba, que rodea la mandíbula
cabeza.solevado([
    (c - 0.035, 0.092, 0.094, 0.03),
    (c + 0.02, 0.098, 0.106, 0.014),
    (c + 0.07, 0.095, 0.108, 0.004),
    (c + 0.11, 0.075, 0.087, 0.006),
    (c + 0.135, 0.04, 0.046, 0.008),
    (c + 0.146, 0.01, 0.012, 0.008),
], PELO, n=18)
cabeza.tubo([(-0.075, -0.075, c + 0.078), (-0.03, -0.098, c + 0.074), (0.03, -0.098, c + 0.08), (0.075, -0.075, c + 0.072)], [0.009, 0.012, 0.012, 0.009], PELO, n=7)
cabeza.tubo([(-0.09, -0.012, c - 0.03), (-0.078, -0.052, c - 0.085), (-0.04, -0.082, c - 0.122), (0, -0.09, c - 0.138), (0.04, -0.082, c - 0.122), (0.078, -0.052, c - 0.085), (0.09, -0.012, c - 0.03)],
            [0.006, 0.012, 0.016, 0.02, 0.016, 0.012, 0.006], PELO, n=8)
cabeza.tubo([(-0.03, -0.097, c - 0.04), (0, -0.103, c - 0.034), (0.03, -0.097, c - 0.04)], [0.006, 0.008, 0.006], PELO, n=6)
# una corona de hojas y flores claras, como la de la novia pero más sencilla
aro = [(0.098 * math.cos(k * 2 * math.pi / 15), 0.008 + 0.11 * math.sin(k * 2 * math.pi / 15), c + 0.095 + 0.008 * math.sin(k * 2 * math.pi / 15)) for k in range(16)]
cabeza.tubo(aro, [0.007] * 16, HOJA, n=5)
for k in range(5):
    a = k * 2 * math.pi / 5 + 0.3
    cabeza.bola((0.1 * math.cos(a), 0.008 + 0.112 * math.sin(a), c + 0.098), 0.014, FLOR, seg=(7, 4))

malla = cuerpo.malla('Novio')
print(f'Novio: {len(cuerpo.c)} caras')
arma = esqueleto(malla, J, sin_brazo=('Capa',), sin_piernas=('Tunica', 'Adorno', 'Capa'))

# Las poses: los brazos, diciendo adónde apunta cada tramo (-y es hacia delante). El resto, en grados sobre los ejes
# del mundo en T-pose: x + inclina hacia delante el tronco; x - adelanta la pierna.
IZQUIERDO_ABAJO = brazos('I', (0.12, -0.05, -0.99), (0.1, -0.25, -0.96))
COPA_ABAJO = brazos('D', (-0.2, -0.1, -0.97), (0.15, -0.98, 0.05), 100)
reposo = {**IZQUIERDO_ABAJO, **COPA_ABAJO}
animar(arma, 'reposo', [(1, {**reposo, 'pecho': (0, 0, 0)}), (48, {**reposo, 'pecho': (1.5, 0, 0)}), (96, {**reposo, 'pecho': (0, 0, 0)})])
def paso(i, d):
    return {'musloI': (i * 26, 0, 0), 'espinillaI': (22 if i > 0 else 4, 0, 0), 'musloD': (d * 26, 0, 0), 'espinillaD': (22 if d > 0 else 4, 0, 0),
            **brazos('I', (0.12, 0.3 * i, -0.95), (0.1, 0.2 * i - 0.2, -0.96)), **COPA_ABAJO}
animar(arma, 'andar', [(1, paso(-1, 1)), (13, paso(1, -1)), (25, paso(-1, 1))])
ALZADA = {**IZQUIERDO_ABAJO, **brazos('D', (-0.55, -0.7, 0.35), (-0.1, -0.75, 0.65), 90)}
animar(arma, 'brindis', [(1, reposo), (14, ALZADA), (48, ALZADA), (60, reposo)])
BESO = {**brazos('D', (-0.3, 0.05, -0.95), (-0.45, -0.1, -0.88), 180), **brazos('I', (0.35, -0.75, -0.55), (-0.3, -0.9, 0)), 'espalda': (4, 0, 0), 'pecho': (5, 0, 0), 'cuello': (5, 0, 0), 'cabeza': (14, 0, 0)}
animar(arma, 'beso', [(1, reposo), (14, BESO), (48, BESO), (60, reposo)])
# Sentado a la mesa de la cena del episodio 2 (js/casa.js), con la jarra (la copa) en la mesa, y su brindis sentado. El
# modelo no baja: en la escena se pone 0,4 m más abajo, con la cadera a la altura del banco.
SENTADO_PIERNAS = {'musloI': (-88, 0, 0), 'musloD': (-88, 0, 0), 'espinillaI': (88, 0, 0), 'espinillaD': (88, 0, 0), 'pieI': (0, 0, 0), 'pieD': (0, 0, 0)}
COPA_EN_LA_MESA = brazos('D', (-0.15, -0.45, -0.88), (0.05, -0.99, 0.1), 100)
SENTADO = {**SENTADO_PIERNAS, **brazos('I', (0.12, -0.45, -0.88), (-0.08, -0.99, 0.05)), **COPA_EN_LA_MESA, 'espalda': (4, 0, 0)}
animar(arma, 'sentado', [(1, {**SENTADO, 'pecho': (0, 0, 0)}), (48, {**SENTADO, 'pecho': (1.5, 0, 0)}), (96, {**SENTADO, 'pecho': (0, 0, 0)})])
ALZADA_SENTADO = {**SENTADO, **brazos('D', (-0.55, -0.7, 0.35), (-0.1, -0.75, 0.65), 90)}
animar(arma, 'brindis-sentado', [(1, SENTADO), (14, ALZADA_SENTADO), (48, ALZADA_SENTADO), (60, SENTADO)])
exportar(CARPETA, 'novio', arma, malla)
print('Novio terminado')

if FOTOS:
    fotos_animadas(FOTOS, arma, [('reposo', 20), ('andar', 7), ('brindis', 30), ('beso', 30), ('sentado', 20), ('brindis-sentado', 30)])
