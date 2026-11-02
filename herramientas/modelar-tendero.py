# Editor VR: el tendero del mercado del poblado (modelos/tendero.glb): túnica parda hasta la rodilla, algo de tripa,
# delantal de lino con bolsillo, cinturón con la bolsa del dinero, calzas y botas, sombrero de fieltro y bigote. En
# T-pose, 1,74 m, origen entre los pies, mira hacia -y en Blender (+z en la escena), con esqueleto y animaciones:
# reposo (las manos juntas delante), andar y ofrecer (tiende la mano derecha, al hablarle: js/oficios.js).
# Uso: blender --background --python herramientas/modelar-tendero.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, animar, brazos, esqueleto, exportar, fotos_animadas, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
J = dict(cadera=(0, 0, 0.98), espalda=(0, 0, 1.1), pecho=(0, 0, 1.24), cuello=(0, 0.004, 1.4), cabeza=(0, 0.004, 1.48), hombro=(0.2, 0, 1.32), codo=(0.45, 0, 1.32), muneca=(0.69, 0, 1.32),
         anca=(0.09, 0, 0.9), rodilla=(0.095, 0, 0.51), tobillo=(0.095, 0.005, 0.09))
bpy.ops.wm.read_factory_settings(use_empty=True)

TUNICA = material('Tunica', (0.16, 0.09, 0.045))
LINO = material('Lino', (0.42, 0.37, 0.28))
CALZAS = material('Calzas', (0.08, 0.075, 0.06))
CUERO = material('Cuero', (0.045, 0.024, 0.012), 0.75)
FIELTRO = material('Fieltro', (0.07, 0.085, 0.05))
PIEL = material('Piel', (0.48, 0.29, 0.18), 0.7)
PELO = material('Pelo', (0.09, 0.07, 0.05), 0.8)
OJOS = material('Ojos', (0.012, 0.009, 0.006), 0.4)
LABIOS = material('Labios', (0.26, 0.09, 0.07), 0.6)
HIERRO = material('Hierro', (0.22, 0.21, 0.2), 0.5, 0.6)

cuerpo = Pieza()
# piernas y botas
for s in (-1, 1):
    cuerpo.tubo([(s * 0.09, 0, 0.88), (s * 0.095, 0, 0.54), (s * 0.095, 0.005, 0.28)], [0.084, 0.06, 0.052], CALZAS, n=10)
    cuerpo.tubo([(s * 0.095, 0.005, 0.33), (s * 0.095, 0.005, 0.09)], [0.06, 0.054], CUERO, n=10)
    cuerpo.tubo([(s * 0.095, 0.03, 0.05), (s * 0.095, -0.05, 0.045), (s * 0.095, -0.13, 0.035)], [0.06, 0.056, 0.03], CUERO, n=10)
# la túnica, hasta la rodilla
pliegues = lambda t, a: 1 + t * 0.06 * math.sin(a * 7 + 0.4)
cuerpo.solevado([(1.0, 0.17, 0.15, -0.01), (0.84, 0.2, 0.17, 0), (0.66, 0.235, 0.205, 0.005), (0.5, 0.265, 0.235, 0.01)], TUNICA, n=28, forma=pliegues)
# el tronco, con tripa (más hondo por delante a la altura del cinturón)
cuerpo.solevado([
    (0.98, 0.17, 0.15, -0.01),
    (1.08, 0.19, 0.17, -0.025),
    (1.2, 0.205, 0.145, -0.01),
    (1.33, 0.205, 0.118, 0.004),
    (1.39, 0.13, 0.08, 0.006),
], TUNICA, n=20)
# el cuello, el cinturón con hebilla, y la bolsa del dinero colgando
cuerpo.solevado([(1.36, 0.09, 0.07, 0.006), (1.41, 0.05, 0.052, 0.006), (1.49, 0.046, 0.048, 0.006)], PIEL, n=12)
cuerpo.solevado([(1.035, 0.19, 0.17, -0.025), (1.075, 0.192, 0.172, -0.025)], CUERO, n=20)
cuerpo.bola((0, -0.198, 1.055), (0.03, 0.012, 0.028), HIERRO, seg=(8, 5))
cuerpo.bola((-0.15, -0.11, 0.97), (0.055, 0.03, 0.07), CUERO, seg=(8, 5))
# el delantal de lino, por delante, del cinturón a la rodilla, con su bolsillo
aros, N = [], 11
for z, r, fondo in [(1.05, 0.15, 0.19), (0.85, 0.19, 0.205), (0.6, 0.22, 0.235), (0.48, 0.225, 0.25)]:
    aro = []
    for s in range(N):
        u = s / (N - 1)
        a = math.pi * (1.2 + 0.6 * u)
        aro.append((r * math.cos(a), fondo * math.sin(a) * 1.04, z))
    aros.append(aro)
cuerpo.aros(aros, LINO, arco=True)
cuerpo.aros([list(reversed(a)) for a in aros], LINO, arco=True)
cuerpo.bola((0.06, -0.225, 0.78), (0.07, 0.012, 0.055), LINO, seg=(8, 5))
# los brazos, en cruz, con las mangas remangadas
for s in (-1, 1):
    cuerpo.bola((s * 0.2, 0, 1.32), (0.062, 0.062, 0.058), TUNICA)
    cuerpo.tubo([(s * 0.2, 0, 1.32), (s * 0.45, 0, 1.32), (s * 0.55, 0, 1.32)], [0.056, 0.048, 0.05], TUNICA, n=10)
    cuerpo.tubo([(s * 0.55, 0, 1.32), (s * 0.69, 0, 1.32)], [0.04, 0.036], PIEL, n=10)
    cuerpo.bola((s * 0.735, 0, 1.32), (0.05, 0.036, 0.042), PIEL)
cabeza = cuerpo
c = 1.6
cabeza.solevado([
    (c - 0.13, 0.03, 0.03, -0.035),
    (c - 0.1, 0.072, 0.074, -0.025),
    (c - 0.05, 0.092, 0.095, -0.01),
    (c, 0.095, 0.104, 0),
    (c + 0.05, 0.093, 0.104, 0.006),
    (c + 0.095, 0.073, 0.084, 0.008),
    (c + 0.125, 0.032, 0.036, 0.01),
], PIEL, n=18)
cabeza.bola((0, -0.104, c - 0.012), (0.016, 0.021, 0.028), PIEL, seg=(8, 5))
for s in (-1, 1):
    cabeza.bola((s * 0.037, -0.092, c + 0.012), (0.012, 0.005, 0.008), OJOS, seg=(8, 4))
    cabeza.tubo([(s * 0.018, -0.097, c + 0.04), (s * 0.038, -0.096, c + 0.043), (s * 0.056, -0.085, c + 0.034)], [0.006, 0.006, 0.004], PELO, n=5)
    cabeza.bola((s * 0.094, 0.005, c + 0.002), (0.009, 0.018, 0.026), PIEL, seg=(6, 4))
cabeza.bola((0, -0.095, c - 0.068), (0.02, 0.006, 0.006), LABIOS, seg=(8, 4))
# el bigote, caído, y el pelo que asoma bajo el sombrero
cabeza.tubo([(-0.055, -0.088, c - 0.07), (-0.03, -0.102, c - 0.048), (0, -0.106, c - 0.044), (0.03, -0.102, c - 0.048), (0.055, -0.088, c - 0.07)],
            [0.005, 0.011, 0.012, 0.011, 0.005], PELO, n=7)
cabeza.solevado([(c - 0.03, 0.097, 0.1, 0.02), (c + 0.03, 0.1, 0.108, 0.01), (c + 0.06, 0.098, 0.106, 0.006)], PELO, n=18)
# el sombrero de fieltro: el ala y la copa redondeada
cabeza.solevado([(c + 0.055, 0.16, 0.165, 0.004), (c + 0.07, 0.165, 0.17, 0.004), (c + 0.075, 0.1, 0.105, 0.004)], FIELTRO, n=22)
cabeza.solevado([(c + 0.07, 0.1, 0.106, 0.006), (c + 0.13, 0.095, 0.1, 0.008), (c + 0.17, 0.07, 0.074, 0.01), (c + 0.19, 0.02, 0.022, 0.01)], FIELTRO, n=18)

malla = cuerpo.malla('Tendero')
print(f'Tendero: {len(cuerpo.c)} caras')
arma = esqueleto(malla, J, sin_piernas=('Tunica', 'Lino'))

# Las poses: los brazos, diciendo adónde apunta cada tramo (-y es hacia delante)
# (las piernas, rectas: si no, se quedan como las dejó andar)
RECTAS = {'musloI': (0, 0, 0), 'espinillaI': (0, 0, 0), 'musloD': (0, 0, 0), 'espinillaD': (0, 0, 0)}
JUNTAS = {**RECTAS, **brazos('I', (0.1, -0.25, -0.96), (-0.55, -0.7, -0.45)), **brazos('D', (-0.1, -0.25, -0.96), (0.55, -0.7, -0.45))}
animar(arma, 'reposo', [(1, {**JUNTAS, 'pecho': (0, 0, 0)}), (48, {**JUNTAS, 'pecho': (1.5, 0, 0)}), (96, {**JUNTAS, 'pecho': (0, 0, 0)})])
def paso(i, d):
    return {'musloI': (i * 24, 0, 0), 'espinillaI': (20 if i > 0 else 4, 0, 0), 'musloD': (d * 24, 0, 0), 'espinillaD': (20 if d > 0 else 4, 0, 0),
            **brazos('I', (0.12, 0.3 * i, -0.95), (0.1, 0.2 * i - 0.2, -0.96)), **brazos('D', (-0.12, 0.3 * d, -0.95), (-0.1, 0.2 * d - 0.2, -0.96))}
animar(arma, 'andar', [(1, paso(-1, 1)), (13, paso(1, -1)), (25, paso(-1, 1))])
OFRECE = {**brazos('I', (0.1, -0.25, -0.96), (-0.55, -0.7, -0.45)), **brazos('D', (-0.25, -0.6, -0.75), (-0.05, -0.95, -0.25), 90), 'cabeza': (6, 0, 0)}
animar(arma, 'ofrecer', [(1, JUNTAS), (14, OFRECE), (48, OFRECE), (60, JUNTAS)])
exportar(CARPETA, 'tendero', arma, malla)
print('Tendero terminado')

if FOTOS:
    fotos_animadas(FOTOS, arma, [('reposo', 20), ('ofrecer', 30)])
