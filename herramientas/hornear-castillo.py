# Editor VR: hornea la luz de todo el castillo a partir de lo que saca exportarCastillo (js/rendimiento.js).
# Se calcula todo junto, para que la luz pase de unas estancias a otras, y cada estancia queda con su modelo.
# Uso: blender --background --python herramientas/hornear-castillo.py -- <castillo.json> <carpeta de salida> [muestras] [escala de tamaños]
# Deja <sala>.glb (dos capas de coordenadas: textura y luz), <sala>-luz.jpg y castillo.blend.
import base64, json, os, sys
import bpy
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
ENTRADA, SALIDA = args[0], args[1]
MUESTRAS = int(args[2]) if len(args) > 2 else 256
ESCALA_LADO = float(args[3]) if len(args) > 3 else 1
ESCALA_LUZ = 2   # como en js/rendimiento.js: la imagen guarda la luz dividida por esto
VATIOS = 130     # por cada unidad de fuerza de las luces de la escena (ajustado a ojo, mirando el resultado)


# coordenadas de la escena (y hacia arriba) a las de Blender (z hacia arriba)
def b(x, y, z):
    return (x, -z, y)


bpy.ops.wm.read_factory_settings(use_empty=True)
os.makedirs(SALIDA, exist_ok=True)
datos = json.load(open(ENTRADA, encoding='utf-8'))
escena = bpy.context.scene

imagenes = {}
for uuid, url in datos['imagenes'].items():
    ruta = os.path.join(SALIDA, f'{uuid[:8]}.png')
    with open(ruta, 'wb') as f:
        f.write(base64.b64decode(url.split(',')[1]))
    imagen = bpy.data.images.load(ruta)
    imagen.pack()
    imagen.name = 'textura-' + uuid[:8]   # malla horneada: las reconoce por el nombre para no repetirlas
    os.remove(ruta)
    imagenes[uuid] = imagen


def crear_malla(nombre, m):
    """Malla con los vértices repetidos unidos (para que el desplegado no salga triángulo a triángulo);
    coordenadas, colores y normales van por esquina, así que no se pierde nada."""
    pos, nor, uv, col = m['pos'], m['nor'], m['uv'], m['col']
    indice, vertices, caras, esquinas = {}, [], [], []
    for t in range(0, len(pos) // 3, 3):
        cara = []
        for k in (t, t + 1, t + 2):
            p = b(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2])
            clave = tuple(round(c, 4) for c in p)
            if clave not in indice:
                indice[clave] = len(vertices)
                vertices.append(p)
            cara.append(indice[clave])
        if len(set(cara)) == 3:
            caras.append(cara)
            esquinas += [t, t + 1, t + 2]
    malla = bpy.data.meshes.new(nombre)
    malla.from_pydata(vertices, [], caras)
    capa = malla.uv_layers.new(name='UVMap')
    color = malla.color_attributes.new('Color', 'FLOAT_COLOR', 'CORNER')
    normales = []
    for l, k in enumerate(esquinas):
        capa.data[l].uv = (uv[k * 2], uv[k * 2 + 1])
        color.data[l].color = (col[k * 3], col[k * 3 + 1], col[k * 3 + 2], 1)
        normales.append(b(nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2]))
    malla.update()
    malla.normals_split_custom_set(normales)
    malla.uv_layers.new(name='Luz')
    malla.uv_layers.active = malla.uv_layers['Luz']
    objeto = bpy.data.objects.new(nombre, malla)
    escena.collection.objects.link(objeto)
    return objeto


def material(nombre, m, destino):
    """Color real (para que la luz rebote con su color) y, como nodo activo, la imagen donde se hornea."""
    mat = bpy.data.materials.new(('Llama-' if m['emisivo'] else 'Material-') + nombre)
    mat.use_nodes = True
    arbol = mat.node_tree
    pbr = next(n for n in arbol.nodes if n.type == 'BSDF_PRINCIPLED')
    pbr.inputs['Roughness'].default_value = 1
    atributo = arbol.nodes.new('ShaderNodeVertexColor')
    atributo.layer_name = 'Color'
    if m['imagen']:
        tex = arbol.nodes.new('ShaderNodeTexImage')
        tex.image = imagenes[m['imagen']]
        coords = arbol.nodes.new('ShaderNodeUVMap')
        coords.uv_map = 'UVMap'
        arbol.links.new(coords.outputs[0], tex.inputs['Vector'])
        por = arbol.nodes.new('ShaderNodeVectorMath')
        por.operation = 'MULTIPLY'
        arbol.links.new(tex.outputs[0], por.inputs[0])
        arbol.links.new(atributo.outputs[0], por.inputs[1])
        arbol.links.new(por.outputs[0], pbr.inputs['Base Color'])
    else:
        arbol.links.new(atributo.outputs[0], pbr.inputs['Base Color'])
    nodo = arbol.nodes.new('ShaderNodeTexImage')
    nodo.image = destino
    nodo.name = 'DestinoLuz'
    for n in arbol.nodes:
        n.select = False
    nodo.select = True
    arbol.nodes.active = nodo
    return mat


def area_de(m):
    p = np.array(m['pos']).reshape(-1, 3, 3)
    return float(np.linalg.norm(np.cross(p[:, 1] - p[:, 0], p[:, 2] - p[:, 0]), axis=1).sum() / 2) if len(p) else 0


def lado_de(area):
    # unos 50 píxeles por metro, y no más de 2048 (cada imagen de 2048 son 16 MB en el Quest)
    for lado in (256, 512, 1024):
        if area * 50 * 50 < lado * lado:
            return int(lado * ESCALA_LADO)
    return int(2048 * ESCALA_LADO)


salas = {}
for sala, mallas in datos['salas'].items():
    if not mallas:
        continue
    # la piel de fuera coincide con la cara de dentro de los muros (la de la sala 2, en el mismo plano):
    # separarla 5 mm, o los rayos chocan con esa otra cara y sale negra
    if sala == 'exterior':
        for m in mallas:
            m['pos'] = [p + n * 0.005 for p, n in zip(m['pos'], m['nor'])]
    lado = lado_de(sum(area_de(m) for m in mallas))
    destino = bpy.data.images.new(f'Luz-{sala}', lado, lado, alpha=False, float_buffer=True)
    piezas = []
    for i, m in enumerate(mallas):
        o = crear_malla(f'{sala}-{i}', m)
        o.data.materials.append(material(f'{sala}-{i}', m, destino))
        piezas.append(o)
    salas[sala] = {'piezas': piezas, 'destino': destino, 'lado': lado}
    print(f'{sala}: {sum(len(m["pos"]) for m in mallas) // 9} triángulos, luz de {lado}')
    # desplegar todas las piezas de la estancia en su imagen de luz
    bpy.ops.object.select_all(action='DESELECT')
    for o in piezas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = piezas[0]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, area_weight=0, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')

# el suelo de fuera (la hierba no se hornea, pero la luz rebota en ella y tapa el cielo de abajo)
bpy.ops.mesh.primitive_plane_add(size=400, location=b(5, -0.05, 0))
tierra = bpy.data.materials.new('Tierra')
tierra.use_nodes = True
next(n for n in tierra.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = (0.13, 0.17, 0.07, 1)
bpy.context.object.data.materials.append(tierra)

for i, l in enumerate(datos['luces']):
    x, y, z = l['pos']
    # la de la hoguera está en el fondo de la chimenea: adelantarla, para que salga a la sala
    if abs(x + 6.4) < 0.5 and abs(z - 13.9) < 0.5:
        z = 13.3
    luz = bpy.data.lights.new(f'Luz{i}', 'POINT')
    # según su alcance: en la escena la luz se corta allí; aquí sigue, y en un pasillo quemaría el techo
    luz.energy = l['fuerza'] * VATIOS * (l['alcance'] / 8) ** 2
    luz.color = l['color']
    luz.shadow_soft_size = 0.3
    o = bpy.data.objects.new(f'Luz{i}', luz)
    o.location = b(x, y, z)
    escena.collection.objects.link(o)

# el sol, bajo, entra por las ventanas del oeste; y el cielo
sol = bpy.data.lights.new('Sol', 'SUN')
sol.energy = 3
sol.color = (1, 0.93, 0.8)
sol.angle = 0.03
objeto_sol = bpy.data.objects.new('Sol', sol)
objeto_sol.rotation_euler = (1.0, 0, 1.75)
escena.collection.objects.link(objeto_sol)
mundo = bpy.data.worlds.new('Cielo')
mundo.use_nodes = True
fondo = next(n for n in mundo.node_tree.nodes if n.type == 'BACKGROUND')
fondo.inputs[0].default_value = (0.55, 0.75, 1, 1)
fondo.inputs[1].default_value = 1.0
escena.world = mundo

# hornear solo la luz, sin el color de cada pieza (el color ya lo pone su textura en la escena)
escena.render.engine = 'CYCLES'
preferencias = bpy.context.preferences.addons['cycles'].preferences
preferencias.compute_device_type = 'CUDA'   # (OPTIX no compila con el controlador de este portátil y sale todo negro)
preferencias.refresh_devices()
for d in preferencias.devices:
    d.use = d.type == 'CUDA'
escena.cycles.device = 'GPU'
escena.cycles.samples = MUESTRAS
escena.cycles.bake_type = 'DIFFUSE'
escena.render.bake.use_pass_direct = True
escena.render.bake.use_pass_indirect = True
escena.render.bake.use_pass_color = False
escena.render.bake.margin = 6
escena.render.image_settings.file_format = 'JPEG'
escena.render.image_settings.quality = 92

for sala, s in salas.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in s['piezas']:
        o.select_set(True)
    bpy.context.view_layer.objects.active = s['piezas'][0]
    bpy.ops.object.bake(type='DIFFUSE')
    lado = s['lado']
    px = np.empty(lado * lado * 4, dtype=np.float32)
    s['destino'].pixels.foreach_get(px)
    rgb = px.reshape(-1, 4)
    print(f'Luz de {sala}: media {rgb[:, :3].mean():.3f}, máximo {rgb[:, :3].max():.3f}')
    if rgb[:, :3].max() == 0:
        raise RuntimeError('La luz ha salido negra: el horneado ha fallado')
    # en 8 bits: dividida por ESCALA_LUZ y en sRGB, para que las sombras no salgan a saltos
    lineal = np.clip(rgb[:, :3] / ESCALA_LUZ, 0, 1)
    rgb[:, :3] = np.where(lineal <= 0.0031308, lineal * 12.92, 1.055 * np.power(lineal, 1 / 2.4) - 0.055)
    rgb[:, 3] = 1
    salida = bpy.data.images.new(f'Final-{sala}', lado, lado, alpha=False)
    salida.colorspace_settings.name = 'Non-Color'
    salida.pixels.foreach_set(rgb.ravel())
    salida.filepath_raw = os.path.join(SALIDA, f'{sala}-luz.jpg')
    salida.file_format = 'JPEG'
    salida.save(quality=92)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SALIDA, 'castillo.blend'), compress=True)

# para exportar: solo textura en el color base (el color de vértice va aparte)
for sala, s in salas.items():
    for o in s['piezas']:
        arbol = o.data.materials[0].node_tree
        pbr = next(n for n in arbol.nodes if n.type == 'BSDF_PRINCIPLED')
        arbol.nodes.remove(arbol.nodes['DestinoLuz'])
        por = next((n for n in arbol.nodes if n.type == 'VECT_MATH'), None)
        for enlace in list(pbr.inputs['Base Color'].links):
            arbol.links.remove(enlace)
        if por:
            tex = next(n for n in arbol.nodes if n.type == 'TEX_IMAGE')
            arbol.links.new(tex.outputs[0], pbr.inputs['Base Color'])
            arbol.nodes.remove(por)
        pbr.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bpy.ops.object.select_all(action='DESELECT')
    for o in s['piezas']:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, f'{sala}.glb'), export_format='GLB',
                              use_selection=True, export_normals=False, export_vertex_color='ACTIVE',
                              export_image_format='JPEG', export_image_quality=85, export_materials='EXPORT')
print('Horneado terminado')
