# Editor VR: peinados para la gente que lleva el modelo calvo (modelos/pelos.glb): Pelo1 corto con flequillo, Pelo2
# melena por los hombros, Pelo3 corona de fraile y Pelo4 rizado. Hechos de mechones, sobre una base. Medidos para una
# cabeza de radio 1 con el origen en su centro y la cara hacia -y; js/taberna.js (cliente) los ajusta a cada cabeza.
# Uso: blender --background --python herramientas/modelar-pelos.py -- <carpeta modelos> [carpeta para las fotos]
import math, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from piezas_modelo import Pieza, fotos, material

args = sys.argv[sys.argv.index('--') + 1:]
CARPETA, FOTOS = args[0], args[1] if len(args) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
PELO = material('Pelo', (0.09, 0.05, 0.025), 0.75)
R = 1.05   # por encima de la piel


def sobre_cabeza(th, phi, r=R):
    """th: vuelta alrededor (-90° es la cara); phi: desde la coronilla (90°, a media cabeza)."""
    return (r * math.sin(phi) * math.cos(th), r * math.sin(phi) * math.sin(th), r * math.cos(phi))


def frente(th):
    """1 de frente a la cara, 0 en la nuca."""
    return (math.cos(th + math.pi / 2) + 1) / 2


def base(p, hasta, cara):
    """El casquete debajo de los mechones, para que no se vea la calva entre ellos; deja libre la cara."""
    aros = []
    for j in range(7):
        t = (j + 0.0001) / 6
        aro = []
        for s in range(18):
            th = 2 * math.pi * s / 18 - math.pi
            f = frente(th) ** 3
            aro.append(sobre_cabeza(th, math.radians(hasta + (cara - hasta) * f) * t, R - 0.015))
        aros.append(aro)
    aros.reverse()
    p.aros(aros, PELO, tapas=(False, True))


def mechon(p, th, phi0, phi1, grueso=0.11, n=5, caida=0.0, ondas=0.0, fase=0.0):
    """Un mechón que baja pegado a la cabeza de phi0 a phi1 y, con caida, sigue recto hacia abajo."""
    puntos, radios, TR = [], [], 6
    for k in range(TR):
        t = k / (TR - 1)
        phi = phi0 + (phi1 - phi0) * t
        th2 = th + ondas * math.sin(t * 5 + fase)
        puntos.append(sobre_cabeza(th2, phi, R + 0.025 + 0.03 * math.sin(t * math.pi)))
        radios.append(grueso * (0.55 + 0.45 * math.sin(math.pi * min(1, t * 0.8 + 0.2))))
    if caida:
        x, y, z = puntos[-1]
        for k in range(1, 4):
            t = k / 3
            puntos.append((x * (1 + 0.04 * t) + ondas * 0.3 * math.sin(t * 4 + fase), y * (1 + 0.04 * t), z - caida * t))
            radios.append(grueso * (1 - 0.5 * t))
    else:
        radios[-1] *= 0.35
    p.tubo(puntos, radios, PELO, n=n)


def corto():
    p = Pieza()
    base(p, 108, 40)
    for k in range(30):
        th = 2 * math.pi * k / 30 + 0.05 * math.sin(k * 7)
        f = frente(th)
        fin = math.radians((112 - 66 * f ** 2) + 5 * math.sin(k * 3.3))
        mechon(p, th, math.radians(8 + 5 * (k % 3)), fin, grueso=0.13, ondas=0.05, fase=k)
    return p


def melena():
    p = Pieza()
    base(p, 118, 44)
    for k in range(40):
        th = 2 * math.pi * k / 40 + 0.04 * math.sin(k * 5)
        f = frente(th)
        if f > 0.82:        # el flequillo, abierto en medio
            mechon(p, th, math.radians(10), math.radians(48), grueso=0.12, ondas=0.1, fase=k)
        else:
            mechon(p, th, math.radians(8 + 4 * (k % 3)), math.radians(100), grueso=0.14, caida=1.05 + 0.22 * math.sin(k * 2.7) - 0.45 * f, ondas=0.05, fase=k)
    return p


def fraile():
    """Un aro de pelo y la coronilla pelada."""
    p = Pieza()
    aros = []
    for phi in (40, 62, 86, 108):
        aros.append([sobre_cabeza(2 * math.pi * s / 20 - math.pi, math.radians(phi - (phi - 40) * 0.75 * frente(2 * math.pi * s / 20 - math.pi)), R - 0.015) for s in range(20)])
    aros.reverse()
    p.aros(aros, PELO, tapas=(False, False))
    for k in range(26):
        th = 2 * math.pi * k / 26
        fin = math.radians(108 - 44 * frente(th) ** 2 + 4 * math.sin(k * 4.1))
        mechon(p, th, math.radians(36), fin, grueso=0.12, ondas=0.03, fase=k)
    return p


def rizado():
    p = Pieza()
    base(p, 104, 42)
    # bolitas por toda la cabeza, sin bajar por la cara
    for fila, (phi, cuantas) in enumerate([(12, 5), (32, 11), (52, 15), (72, 16), (92, 15), (110, 11)]):
        for k in range(cuantas):
            th = 2 * math.pi * (k + 0.5 * (fila % 2)) / cuantas
            if phi + 40 * frente(th) ** 2 > 96 and frente(th) > 0.45:
                continue
            x, y, z = sobre_cabeza(th, math.radians(phi + 5 * math.sin(k * 3)), R + 0.035)
            p.bola((x, y, z), 0.17 + 0.03 * math.sin(k * 5 + fila), PELO, seg=(7, 4))
    return p


objetos = []
for nombre, hacer in (('Pelo1', corto), ('Pelo2', melena), ('Pelo3', fraile), ('Pelo4', rizado)):
    p = hacer()
    print(f'{nombre}: {len(p.c)} caras')
    objetos.append(p.malla(nombre))
for o in objetos:
    o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CARPETA, 'pelos.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(CARPETA, 'pelos.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT')
print('Pelos terminados')

# las fotos: cada peinado sobre una cabeza, en fila, de frente y de lado
if FOTOS:
    piel = material('PielFoto', (0.5, 0.3, 0.2), 0.7)
    for i, o in enumerate(objetos):
        x, z = (-0.42 if i % 2 == 0 else 0.42), (1.3 if i < 2 else 0.5)
        o.scale = (0.3, 0.3, 0.3); o.location = (x, 0, z)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(x, 0, z))
        bpy.context.object.data.materials.append(piel)
        bpy.ops.object.shade_smooth()
    fotos(FOTOS)
