# Editor VR: lo común de los personajes de Blender hechos a base de aros (modelar-novia.py, modelar-novio.py):
# los materiales, la clase que junta sus piezas y las fotos para revisarlos.
import math, os
import bpy
from mathutils import Euler, Quaternion, Vector


def material(nombre, color, rugosidad=0.9, metal=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    pbr = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    pbr.inputs['Base Color'].default_value = (*color, 1)
    pbr.inputs['Roughness'].default_value = rugosidad
    pbr.inputs['Metallic'].default_value = metal
    return m


class Pieza:
    """Va juntando vértices y caras con su material; al final, una malla."""
    def __init__(self):
        self.v, self.c, self.m, self.mats = [], [], [], []

    def _mat(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def aros(self, aros, m, tapas=(True, True), arco=None):
        """aros: lista de listas de puntos, todas igual de largas. Cerrados, salvo con arco."""
        i, n, cerrado = len(self.v), len(aros[0]), arco is None
        for a in aros:
            self.v += [tuple(p) for p in a]
        k = self._mat(m)
        for f in range(len(aros) - 1):
            for s in range(n if cerrado else n - 1):
                a, b = i + f * n + s, i + f * n + (s + 1) % n
                self.c.append((a, b, b + n, a + n)); self.m.append(k)
        if cerrado and tapas[0]:
            self.c.append(tuple(i + s for s in reversed(range(n)))); self.m.append(k)
        if cerrado and tapas[1]:
            self.c.append(tuple(i + (len(aros) - 1) * n + s for s in range(n))); self.m.append(k)

    def solevado(self, secciones, m, n=16, forma=None, tapas=(True, True)):
        """secciones: (z, radio x, radio y, centro y). forma(t, a): cuánto se multiplica el radio, para los pliegues."""
        aros = []
        for j, (z, rx, ry, cy) in enumerate(secciones):
            t = j / (len(secciones) - 1)
            aro = []
            for s in range(n):
                a = 2 * math.pi * s / n
                f = forma(t, a) if forma else 1
                aro.append((rx * f * math.cos(a), cy + ry * f * math.sin(a), z))
            aros.append(aro)
        self.aros(aros, m, tapas)

    def bola(self, c, r, m, seg=(10, 7)):
        rx, ry, rz = r if isinstance(r, tuple) else (r, r, r)
        n, f = seg
        aros = []
        for j in range(1, f):
            th = math.pi * j / f
            aros.append([(c[0] + rx * math.sin(th) * math.cos(2 * math.pi * s / n), c[1] + ry * math.sin(th) * math.sin(2 * math.pi * s / n), c[2] + rz * math.cos(th)) for s in range(n)])
        aros.reverse()   # de abajo arriba, como los solevados
        i = len(self.v)
        self.aros(aros, m, tapas=(False, False))
        k = self._mat(m)
        abajo, arriba = len(self.v), len(self.v) + 1
        self.v += [(c[0], c[1], c[2] - rz), (c[0], c[1], c[2] + rz)]
        for s in range(n):
            self.c.append((abajo, i + (s + 1) % n, i + s)); self.m.append(k)
            t = i + (f - 2) * n
            self.c.append((arriba, t + s, t + (s + 1) % n)); self.m.append(k)

    def tubo(self, puntos, radios, m, n=8):
        """Por un camino de puntos, con su radio en cada uno."""
        aros = []
        for j, p in enumerate(puntos):
            p = Vector(p)
            d = (Vector(puntos[min(j + 1, len(puntos) - 1)]) - Vector(puntos[max(j - 1, 0)])).normalized()
            u = d.cross(Vector((0.3, 0.1, 1))).normalized()
            w = d.cross(u)
            aros.append([tuple(p + radios[j] * (math.cos(2 * math.pi * s / n) * u + math.sin(2 * math.pi * s / n) * w)) for s in range(n)])
        self.aros(aros, m)

    def malla(self, nombre, origen=(0, 0, 0)):
        o = Vector(origen)
        d = bpy.data.meshes.new(nombre)
        d.from_pydata([tuple(Vector(p) - o) for p in self.v], [], self.c)
        for m in self.mats:
            d.materials.append(m)
        for f, k in zip(d.polygons, self.m):
            f.material_index = k
            f.use_smooth = True
        d.update()
        obj = bpy.data.objects.new(nombre, d)
        obj.location = o
        bpy.context.collection.objects.link(obj)
        # que todas las caras miren hacia fuera
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        obj.select_set(False)
        return obj


def esqueleto(malla, j, sin_brazo=(), sin_piernas=(), en_mano=()):
    """Arma y pesos de un personaje en T-pose que mira hacia -y. j: dónde están las articulaciones. Los pesos salen de la
    distancia a cada hueso, entre los que le tocan a cada parte. sin_brazo y sin_piernas: materiales (capa, velo); en_mano:
    materiales de lo que lleva en la mano, que va rígido con ella."""
    bpy.ops.object.select_all(action='DESELECT')
    datos = bpy.data.armatures.new('Esqueleto')
    arma = bpy.data.objects.new('Esqueleto', datos)
    bpy.context.collection.objects.link(arma)
    bpy.context.view_layer.objects.active = arma
    arma.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    huesos = {}
    def hueso(nombre, a, b, padre=None):
        h = datos.edit_bones.new(nombre)
        h.head, h.tail = a, b
        if padre:
            h.parent = huesos[padre]
        huesos[nombre] = h
    hueso('cadera', j['cadera'], j['espalda'])
    hueso('espalda', j['espalda'], j['pecho'], 'cadera')
    hueso('pecho', j['pecho'], j['cuello'], 'espalda')
    hueso('cuello', j['cuello'], j['cabeza'], 'pecho')
    hueso('cabeza', j['cabeza'], (j['cabeza'][0], j['cabeza'][1], j['cabeza'][2] + 0.2), 'cuello')
    for s, lado in ((1, 'I'), (-1, 'D')):     # (I: x positivas, su izquierda; D: x negativas)
        m_ = lambda p: (s * p[0], p[1], p[2])
        hueso('brazo' + lado, m_(j['hombro']), m_(j['codo']), 'pecho')
        hueso('antebrazo' + lado, m_(j['codo']), m_(j['muneca']), 'brazo' + lado)
        hueso('mano' + lado, m_(j['muneca']), m_((j['muneca'][0] + 0.08, j['muneca'][1], j['muneca'][2])), 'antebrazo' + lado)
        hueso('muslo' + lado, m_(j['anca']), m_(j['rodilla']), 'cadera')
        hueso('espinilla' + lado, m_(j['rodilla']), m_(j['tobillo']), 'muslo' + lado)
        hueso('pie' + lado, m_(j['tobillo']), m_((j['tobillo'][0], j['tobillo'][1] - 0.13, j['tobillo'][2] - 0.04)), 'espinilla' + lado)
    segmentos = {h.name: (h.head.copy(), h.tail.copy()) for h in datos.edit_bones}
    bpy.ops.object.mode_set(mode='OBJECT')

    grupos = {n: malla.vertex_groups.new(name=n) for n in segmentos}
    def distancia(p, a, b):
        ab = b - a
        t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
        return (a + ab * t - p).length
    mat_de = {}
    for f in malla.data.polygons:
        for v in f.vertices:
            mat_de[v] = malla.data.materials[f.material_index].name
    TRONCO, BRAZOS, PIERNAS = ('cadera', 'espalda', 'pecho'), ('brazo', 'antebrazo', 'mano'), ('muslo', 'espinilla', 'pie')
    munecax = j['muneca'][0]
    for v in malla.data.vertices:
        p, mat = v.co, mat_de.get(v.index, '')
        lado = 'I' if p.x > 0 else 'D'
        if mat in en_mano:
            sirven = ['mano' + lado]
        elif p.z > j['cuello'][2] + 0.03 and abs(p.x) < 0.3 and mat not in sin_brazo:
            sirven = ['cabeza'] if p.z > j['cabeza'][2] + 0.01 else ['cabeza', 'cuello']
        elif abs(p.x) > munecax:
            sirven = ['mano' + lado]         # la mano y lo que lleva
        elif mat not in sin_brazo and abs(p.x) > j['hombro'][0] - 0.03 and p.z > j['hombro'][2] - 0.13:
            sirven = ['pecho'] + [b + lado for b in BRAZOS[:2]]
        elif mat in sin_brazo:
            sirven = list(TRONCO) + (['cuello'] if p.z > j['pecho'][2] else [])
        else:
            sirven = list(TRONCO) + ['cuello']
            if p.z < j['anca'][2] + 0.1:
                sirven += [b + lado for b in PIERNAS] if mat not in sin_piernas else ['muslo' + lado, 'espinilla' + lado]
        pesos = sorted(((1 / max(distancia(p, *segmentos[n]), 0.015) ** 4, n) for n in sirven), reverse=True)[:3]
        total = sum(w for w, _ in pesos)
        for w, n in pesos:
            grupos[n].add([v.index], w / total, 'REPLACE')
    malla.parent = arma
    malla.modifiers.new('Esqueleto', 'ARMATURE').object = arma
    return arma


def brazos(lado, d_brazo, d_antebrazo, giro_mano=None):
    """La pose de un brazo diciendo hacia dónde apunta cada tramo, en el mundo. giro_mano: grados alrededor de la vertical
    de la mano, que queda de pie (para que la copa o el ramo no se tuerzan); sin él, sigue al antebrazo."""
    resto = Vector((1 if lado == 'I' else -1, 0, 0))
    q1 = resto.rotation_difference(Vector(d_brazo).normalized())
    q2 = resto.rotation_difference(Vector(d_antebrazo).normalized())
    pose = {'brazo' + lado: q1, 'antebrazo' + lado: q1.inverted() @ q2}
    pose['mano' + lado] = Quaternion() if giro_mano is None else q2.inverted() @ Quaternion((0, 0, 1), math.radians(giro_mano))
    return pose


def animar(arma, nombre, claves, cuadros=24):
    """Una animación. claves: [(cuadro, {hueso: giro})]. El giro: un cuaternión (ver brazos) o, en grados, en x, y, z,
    sobre los ejes del mundo en T-pose."""
    arma.animation_data_create()
    accion = bpy.data.actions.new(nombre)
    arma.animation_data.action = accion
    huesos = [b for _, pose in claves for b in pose]
    for b in arma.pose.bones:
        b.rotation_mode = 'QUATERNION'
    for cuadro, pose in claves:
        for b in set(huesos):
            hueso = arma.pose.bones[b]
            v = pose.get(b, (0, 0, 0))
            q = v if isinstance(v, Quaternion) else Euler([math.radians(a) for a in v], 'XYZ').to_quaternion()
            r = hueso.bone.matrix_local.to_quaternion()
            hueso.rotation_quaternion = r.inverted() @ q @ r
            hueso.keyframe_insert('rotation_quaternion', frame=cuadro)
    pista = arma.animation_data.nla_tracks.new()
    pista.name = nombre
    pista.strips.new(nombre, int(claves[0][0]), accion)
    arma.animation_data.action = None
    return accion


def exportar(carpeta, nombre, arma, malla):
    bpy.ops.object.select_all(action='DESELECT')
    arma.select_set(True); malla.select_set(True)
    bpy.context.view_layer.objects.active = arma
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(carpeta, nombre + '.blend'), compress=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(carpeta, nombre + '.glb'), export_format='GLB', use_selection=True, export_materials='EXPORT',
                              export_animations=True, export_animation_mode='ACTIONS', export_skins=True, export_force_sampling=True, export_frame_step=1)


def fotos_animadas(carpeta, arma, acciones):
    """Una foto de cada animación, a mitad, de frente y de lado."""
    os.makedirs(carpeta, exist_ok=True)
    e = bpy.context.scene
    motores = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    e.render.engine = next((m for m in motores if 'EEVEE' in m), motores[0])
    e.render.resolution_x, e.render.resolution_y = 420, 560
    mundo = bpy.data.worlds.new('Mundo'); mundo.use_nodes = True
    fondo = next(n for n in mundo.node_tree.nodes if n.type == 'BACKGROUND')
    fondo.inputs[0].default_value = (0.55, 0.62, 0.7, 1)
    e.world = mundo
    sol = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN'))
    sol.data.energy = 3; sol.rotation_euler = (0.9, 0.2, 0.5)
    bpy.context.collection.objects.link(sol)
    camara = bpy.data.objects.new('Camara', bpy.data.cameras.new('Camara'))
    bpy.context.collection.objects.link(camara)
    e.camera = camara
    camara.data.lens = 40
    for p in arma.animation_data.nla_tracks:
        p.mute = True
    for nombre, cuadro in acciones:
        arma.animation_data.action = bpy.data.actions[nombre]
        if hasattr(arma.animation_data, 'action_slot') and bpy.data.actions[nombre].slots:
            arma.animation_data.action_slot = bpy.data.actions[nombre].slots[0]
        e.frame_set(cuadro)
        for vista, x, y in (('frente', 0.3, -3.3), ('lado', 3.0, -1.2)):
            camara.location = (x, y, 1.15)
            camara.rotation_euler = (Vector((0, 0, 0.9)) - camara.location).to_track_quat('-Z', 'Y').to_euler()
            e.render.filepath = os.path.join(carpeta, f'{nombre}{cuadro}-{vista}.png')
            bpy.ops.render.render(write_still=True)


def fotos(carpeta):
    os.makedirs(carpeta, exist_ok=True)
    e = bpy.context.scene
    motores = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    e.render.engine = next((m for m in motores if 'EEVEE' in m), motores[0])
    e.render.resolution_x, e.render.resolution_y = 500, 760
    mundo = bpy.data.worlds.new('Mundo'); mundo.use_nodes = True
    fondo = next(n for n in mundo.node_tree.nodes if n.type == 'BACKGROUND')
    fondo.inputs[0].default_value = (0.55, 0.62, 0.7, 1); fondo.inputs[1].default_value = 0.9
    e.world = mundo
    sol = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN'))
    sol.data.energy = 3; sol.rotation_euler = (0.9, 0.2, 0.5)
    bpy.context.collection.objects.link(sol)
    bpy.ops.mesh.primitive_plane_add(size=8)
    camara = bpy.data.objects.new('Camara', bpy.data.cameras.new('Camara'))
    bpy.context.collection.objects.link(camara)
    e.camera = camara
    for nombre, x, y, z, mira, lente in [('frente', 0, -3.4, 1.1, 0.88, 45), ('lado', 2.4, -2.4, 1.2, 0.88, 45), ('atras', 0.9, 3.3, 1.2, 0.85, 45), ('cara', 0.25, -1, 1.6, 1.53, 60)]:
        camara.location = (x, y, z)
        camara.data.lens = lente
        camara.rotation_euler = (Vector((0, 0, mira)) - camara.location).to_track_quat('-Z', 'Y').to_euler()
        e.render.filepath = os.path.join(carpeta, nombre + '.png')
        bpy.ops.render.render(write_still=True)
