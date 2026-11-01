# Editor VR: la moza de la jarra (modelos/moza.glb): vestido de lana, delantal, cofia, trenza y una jarra de barro en la
# mano. En T-pose, 1,70 m, origen entre los pies, mira hacia -y en Blender (+z en la escena), con esqueleto y animaciones:
# reposo y un andar de cuatro tiempos, con las piernas, los brazos y el tronco a contra paso (js/poblado.js).
# Uso: blender --background --python herramientas/modelar-moza.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, animar, brazos, esqueleto, exportar, fotos_animadas, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
J = dict(cadera=(0, 0, 0.95), espalda=(0, 0, 1.07), pecho=(0, 0, 1.21), cuello=(0, 0.006, 1.38), cabeza=(0, 0.006, 1.45), hombro=(0.155, 0, 1.3), codo=(0.39, 0, 1.3), muneca=(0.62, 0, 1.3),
         anca=(0.08, 0, 0.87), rodilla=(0.085, 0, 0.49), tobillo=(0.085, 0, 0.08))
bpy.ops.wm.read_factory_settings(use_empty=True)

VESTIDO = material('Vestido', (0.17, 0.11, 0.07))
MANGA = material('Manga', (0.42, 0.37, 0.27))
DELANTAL = material('Delantal', (0.52, 0.47, 0.36))
COFIA = material('Cofia', (0.6, 0.56, 0.45))
CINTA = material('Cinta', (0.2, 0.07, 0.05))
CUERO = material('Cuero', (0.045, 0.024, 0.012), 0.75)
BARRO = material('Barro', (0.3, 0.13, 0.06), 0.8)
PIEL = material('Piel', (0.5, 0.3, 0.2), 0.7)
PELO = material('Pelo', (0.16, 0.07, 0.025), 0.8)
OJOS = material('Ojos', (0.012, 0.009, 0.006), 0.4)
LABIOS = material('Labios', (0.3, 0.09, 0.08), 0.6)

p = Pieza()
# la falda, más estrecha que la de la novia y sin cola, hasta los tobillos
pliegues = lambda t, a: 1 + (t ** 1.3) * 0.07 * math.sin(a * 8 + 0.6)
p.solevado([(0.96, 0.125, 0.095, 0), (0.84, 0.165, 0.13, 0), (0.62, 0.2, 0.17, 0.005), (0.38, 0.235, 0.205, 0.01), (0.14, 0.27, 0.24, 0.015)], VESTIDO, n=28, forma=pliegues)
# el corpiño, con el pecho un poco marcado, y la camisa, de cuello redondo
def pecho(t, a):
    a = (a + math.pi) % (2 * math.pi) - math.pi
    return 1 + 0.16 * math.exp(-((t - 0.5) / 0.2) ** 2) * (math.exp(-((a + 2.2) / 0.36) ** 2) + math.exp(-((a + 0.94) / 0.36) ** 2))
p.solevado([(0.95, 0.128, 0.098, 0), (1.05, 0.133, 0.096, 0), (1.14, 0.152, 0.108, -0.004), (1.21, 0.162, 0.115, -0.005), (1.28, 0.163, 0.108, -0.002), (1.33, 0.15, 0.09, 0.004)], VESTIDO, n=28, forma=pecho)
p.solevado([(1.32, 0.135, 0.078, 0.004), (1.36, 0.1, 0.066, 0.006), (1.385, 0.06, 0.054, 0.006)], MANGA, n=18)
p.solevado([(1.37, 0.05, 0.048, 0.006), (1.46, 0.042, 0.044, 0.006)], PIEL, n=12)
# el delantal, por delante, y la cinta de la cintura
aros = []
for z, r in ((1.0, 0.145), (0.75, 0.2), (0.45, 0.25), (0.2, 0.285)):
    fondo = {1.0: 0.109, 0.75: 0.158, 0.45: 0.222, 0.2: 0.262}[z]
    aros.append([(r * math.cos(a), fondo * 1.03 * math.sin(a), z) for a in [math.radians(205 + k * 13) for k in range(11)]])
p.aros([[(x, y - 0.004, z) for x, y, z in a] for a in aros], DELANTAL, arco=True)
p.aros([list(reversed(a)) for a in aros], DELANTAL, arco=True)
p.solevado([(0.975, 0.136, 0.106, 0), (1.01, 0.136, 0.106, 0), (1.014, 0.13, 0.1, 0)], CINTA, n=20)
# los pies
for s in (-1, 1):
    p.tubo([(s * 0.085, 0.02, 0.05), (s * 0.085, -0.05, 0.045), (s * 0.085, -0.13, 0.035)], [0.052, 0.05, 0.028], CUERO, n=10)
    p.tubo([(s * 0.085, 0, 0.3), (s * 0.085, 0, 0.09)], [0.04, 0.036], CUERO, n=8)
# los brazos, en cruz; la derecha lleva la jarra
for s in (-1, 1):
    p.bola((s * 0.155, 0, 1.3), (0.05, 0.052, 0.05), MANGA)
    p.tubo([(s * 0.155, 0, 1.3), (s * 0.39, 0, 1.3), (s * 0.59, 0, 1.3)], [0.046, 0.04, 0.036], MANGA, n=10)
    p.tubo([(s * 0.59, 0, 1.3), (s * 0.63, 0, 1.3)], [0.031, 0.031], PIEL, n=8)
    p.bola((s * 0.665, 0, 1.3), (0.045, 0.034, 0.036), PIEL)
# la jarra, panzuda, colgando de la mano por el asa
JX, JY, JZ = -0.68, 0, 1.3
perfil = [(-0.27, 0.05), (-0.25, 0.082), (-0.19, 0.098), (-0.13, 0.088), (-0.08, 0.052), (-0.05, 0.05), (-0.03, 0.058)]
p.aros([[(JX + r * math.cos(2 * math.pi * k / 14), JY + r * math.sin(2 * math.pi * k / 14), JZ + z) for k in range(14)] for z, r in perfil], BARRO)
p.tubo([(JX, JY + 0.085, JZ - 0.2), (JX, JY + 0.1, JZ - 0.1), (JX, JY + 0.03, JZ - 0.02), (JX, JY, JZ - 0.02)], [0.012, 0.012, 0.012, 0.012], BARRO, n=6)

# la cabeza, con la misma medida que la de la novia
c = 1.56
p.solevado([(c - 0.125, 0.018, 0.02, -0.035), (c - 0.1, 0.055, 0.06, -0.03), (c - 0.05, 0.078, 0.085, -0.012), (c, 0.087, 0.098, 0), (c + 0.05, 0.087, 0.1, 0.006), (c + 0.095, 0.068, 0.08, 0.008), (c + 0.122, 0.03, 0.035, 0.01)], PIEL, n=18)
p.bola((0, -0.096, c - 0.012), (0.011, 0.015, 0.021), PIEL, seg=(8, 5))
for s in (-1, 1):
    p.bola((s * 0.034, -0.086, c + 0.012), (0.012, 0.005, 0.008), OJOS, seg=(8, 4))
    p.tubo([(s * 0.018, -0.091, c + 0.04), (s * 0.036, -0.09, c + 0.043), (s * 0.052, -0.08, c + 0.034)], [0.0035, 0.004, 0.003], PELO, n=5)
    p.bola((s * 0.011, -0.091, c - 0.062), (0.014, 0.006, 0.0065), LABIOS, seg=(8, 4))
# la cofia, con su vuelta en la frente, y el pelo que asoma, con una trenza por la espalda
p.solevado([(c - 0.02, 0.094, 0.096, 0.03), (c + 0.04, 0.1, 0.106, 0.018), (c + 0.09, 0.088, 0.094, 0.012), (c + 0.125, 0.056, 0.06, 0.008), (c + 0.14, 0.012, 0.014, 0.006)], COFIA, n=18)
p.tubo([(-0.09, -0.045, c + 0.03), (-0.05, -0.088, c + 0.066), (0, -0.098, c + 0.075), (0.05, -0.088, c + 0.066), (0.09, -0.045, c + 0.03)], [0.012, 0.014, 0.014, 0.014, 0.012], COFIA, n=6)
for s in (-1, 1):
    p.tubo([(s * 0.05, -0.083, c + 0.05), (s * 0.08, -0.06, c + 0.02), (s * 0.088, -0.03, c - 0.02)], [0.012, 0.011, 0.006], PELO, n=6)
for k in range(7):
    p.bola((0.012 * (-1) ** k, 0.098 + 0.004 * k, c - 0.03 - k * 0.055), (0.024 - k * 0.0012, 0.022, 0.034), PELO, seg=(7, 4))
p.solevado([(c - 0.42, 0.012, 0.012, 0.128), (c - 0.385, 0.018, 0.018, 0.126)], CINTA, n=8)

malla = p.malla('Moza')
print(f'Moza: {len(p.c)} caras')
arma = esqueleto(malla, J, sin_piernas=('Vestido', 'Delantal'), en_mano=('Barro',))

# Las poses, como en modelar-novio.py. La jarra, en la derecha, con el brazo casi caído y siempre de pie.
JARRA = brazos('D', (-0.2, 0, -0.98), (-0.32, -0.45, -0.83), 180)
IZQUIERDO = brazos('I', (0.14, 0, -0.99), (0.1, -0.25, -0.96))
reposo = {**JARRA, **IZQUIERDO}
animar(arma, 'reposo', [(1, {**reposo, 'pecho': (0, 0, 0)}), (48, {**reposo, 'pecho': (1.5, 0, 0)}), (96, {**reposo, 'pecho': (0, 0, 0)})])


# El paso, en cuatro tiempos: pierna delante apoyada y la otra atrás, y las dos cruzándose, con la de detrás doblada al
# pasar. El brazo libre va al revés que su pierna y el tronco se gira a contra paso.
def tiempo(delante, cruce=False):
    a, b = ('I', 'D') if delante == 'I' else ('D', 'I')
    s = 1 if delante == 'I' else -1
    if cruce:
        piernas = {'muslo' + a: (6, 0, 0), 'espinilla' + a: (6, 0, 0), 'pie' + a: (-4, 0, 0), 'muslo' + b: (-14, 0, 0), 'espinilla' + b: (46, 0, 0), 'pie' + b: (10, 0, 0)}
        va = 0
    else:
        piernas = {'muslo' + a: (-22, 0, 0), 'espinilla' + a: (5, 0, 0), 'pie' + a: (-12, 0, 0), 'muslo' + b: (15, 0, 0), 'espinilla' + b: (20, 0, 0), 'pie' + b: (14, 0, 0)}
        va = s
    # (el brazo izquierdo va adelante cuando la pierna derecha va adelante)
    return {**piernas, **JARRA, **brazos('I', (0.14, 0.26 * va, -0.96), (0.12, 0.08 * va - 0.3, -0.95)),
            'cadera': (0, 0, 4 * va), 'espalda': (2, 0, 0), 'pecho': (0, 0, -6 * va)}


animar(arma, 'andar', [(1, tiempo('I')), (7, tiempo('I', True)), (13, tiempo('D')), (19, tiempo('D', True)), (25, tiempo('I'))])
exportar(CARPETA, 'moza', arma, malla)
print('Moza terminada')

if FOTOS:
    fotos_animadas(FOTOS, arma, [('reposo', 20), ('andar', 1), ('andar', 7)])
