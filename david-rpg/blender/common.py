"""Shared Blender helpers for the Son of Jesse asset pipeline.

Everything here runs headless: scene setup, materials, low-poly mesh
primitives, the Zelda-style tilted orthographic camera, and the pixel-art
post-process that turns a render into a crisp game sprite.
"""
import math
import os
import tempfile

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

# Camera looks down this many degrees from horizontal. ~40 gives the classic
# top-down-RPG view: you see the top of things and their front face.
ELEV = math.radians(40)
# Pixels per Blender unit in the final sprite. A tile (32px) is one unit wide.
PPU = 32
# Render at SS x the sprite size, then box-filter down: clean colours, and the
# alpha is thresholded afterwards so silhouettes stay hard-edged.
SS = 4
OUTLINE = (26, 16, 12, 255)

_TMP = os.path.join(tempfile.gettempdir(), f'soj_render_{os.getpid()}.png')


# ── Scene ────────────────────────────────────────────────────────────────

def reset_scene(samples=24):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = samples
    s.cycles.use_denoising = False
    s.cycles.max_bounces = 2
    s.render.film_transparent = True
    s.view_settings.view_transform = 'Standard'
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA'
    s.render.resolution_percentage = 100
    s.render.use_file_extension = False

    world = bpy.data.worlds.new('World')
    s.world = world
    try:
        world.use_nodes = True
    except Exception:
        pass
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.80, 0.84, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.85

    # Key light from the upper left, in front of the subject.
    sun = bpy.data.lights.new('Sun', 'SUN')
    sun.energy = 3.2
    sun.angle = math.radians(8)
    so = bpy.data.objects.new('Sun', sun)
    so.rotation_euler = (math.radians(48), 0, math.radians(-38))
    s.collection.objects.link(so)
    return s


def srgb(hexcol):
    """0xRRGGBB (sRGB) → linear RGBA tuple for Blender."""
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin((hexcol >> 16) & 255), lin((hexcol >> 8) & 255), lin(hexcol & 255), 1.0)


_mats = {}


def mat(hexcol, metallic=0.0, rough=0.9, emit=0.0):
    key = (hexcol, metallic, rough, emit)
    if key in _mats and _mats[key].name in bpy.data.materials:
        return _mats[key]
    m = bpy.data.materials.new(f'c_{hexcol:06x}')
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    col = srgb(hexcol)
    b.inputs['Base Color'].default_value = col
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in b.inputs:
        b.inputs['Specular IOR Level'].default_value = 0.2 if metallic == 0 else 0.5
    if emit:
        b.inputs['Emission Color'].default_value = col
        b.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = col
    _mats[key] = m
    return m


def clear_material_cache():
    _mats.clear()


# ── Mesh primitives (built with bmesh, no bpy.ops needed) ─────────────────

def _finish(name, bm, material, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _trs(loc, scale=(1, 1, 1), rot=None):
    m = Matrix.Translation(Vector(loc))
    if rot is not None:
        m = m @ rot
    return m @ Matrix.Diagonal((*scale, 1.0))


def sphere(name, loc, scale, material, rot=None, seg=16):
    if isinstance(scale, (int, float)):
        scale = (scale, scale, scale)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg * 5 // 8),
                              radius=1.0, matrix=_trs(loc, scale, rot))
    return _finish(name, bm, material)


def frustum(name, z0, z1, r0, r1, material, x=0.0, y=0.0, sx=1.0, sy=1.0, seg=16, smooth=True):
    """Vertical cone section from height z0 (radius r0) up to z1 (radius r1)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1,
                          depth=z1 - z0, matrix=_trs((x, y, (z0 + z1) / 2), (sx, sy, 1)))
    ob = _finish(name, bm, material, smooth=False)
    if smooth:
        for p in ob.data.polygons:
            p.use_smooth = len(p.vertices) == 4  # sides smooth, caps flat
    return ob


def rod(name, p0, p1, r, material, r1=None, seg=10):
    """Cylinder (or cone if r1 given) between two points."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r,
                          radius2=r if r1 is None else r1, depth=d.length,
                          matrix=Matrix.Translation((p0 + p1) / 2) @ rot)
    ob = _finish(name, bm, material, smooth=False)
    for p in ob.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return ob


def box(name, loc, size, material, rot=None, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=_trs(loc, size, rot))
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=1, affect='EDGES')
    return _finish(name, bm, material, smooth=False)


def rot_x(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'X')


def rot_y(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Y')


def rot_z(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Z')


def group(name, objects):
    """Parent a list of objects under one empty so they move/rotate together."""
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    for o in objects:
        o.parent = root
    return root


# ── Camera ────────────────────────────────────────────────────────────────

def make_camera(width, height, ground_px_from_bottom, elev=ELEV, ppu=PPU):
    """Tilted orthographic camera producing a width x height sprite in which the
    world origin (0,0,0) lands `ground_px_from_bottom` pixels above the bottom
    edge, centred horizontally."""
    s = bpy.context.scene
    old = s.camera
    if old is not None:
        bpy.data.objects.remove(old, do_unlink=True)
    cam = bpy.data.cameras.new('SpriteCam')
    cam.type = 'ORTHO'
    cam.ortho_scale = max(width, height) / ppu
    cam.clip_end = 200
    ob = bpy.data.objects.new('SpriteCam', cam)
    s.collection.objects.link(ob)
    s.camera = ob
    s.render.resolution_x = width * SS
    s.render.resolution_y = height * SS

    # Vertical centre of the frame, expressed as a height above the origin
    # along the camera's up axis.
    up_offset = (height / 2 - ground_px_from_bottom) / ppu
    up = Vector((0, math.sin(elev), math.cos(elev)))       # camera up in world
    back = Vector((0, -math.cos(elev), math.sin(elev)))    # from target to camera
    ob.location = up * up_offset + back * 50
    ob.rotation_euler = (math.pi / 2 - elev, 0, 0)
    return ob


# ── Render + pixel-art post-process ───────────────────────────────────────

def render_rgba():
    """Render the current frame; return float RGBA array (H, W, 4), top row first."""
    s = bpy.context.scene
    s.render.filepath = _TMP
    bpy.ops.render.render(write_still=True)
    from PIL import Image
    with Image.open(_TMP) as im:
        return np.asarray(im.convert('RGBA'), dtype=np.float32) / 255.0


def pixelize(hi, outline=True, levels=0):
    """Supersampled float RGBA → uint8 sprite: box downsample, hard alpha,
    optional colour posterise and 1px dark outline."""
    h, w = hi.shape[0] // SS, hi.shape[1] // SS
    a = hi[..., 3:4]
    pre = np.concatenate([hi[..., :3] * a, a], axis=2)
    pre = pre.reshape(h, SS, w, SS, 4).mean(axis=(1, 3))
    alpha = pre[..., 3]
    rgb = pre[..., :3] / np.maximum(alpha[..., None], 1e-6)
    solid = alpha >= 0.5
    if levels:
        rgb = np.round(rgb * levels) / levels
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., :3] = np.clip(rgb * 255 + 0.5, 0, 255).astype(np.uint8)
    out[..., 3] = np.where(solid, 255, 0)
    out[~solid] = 0
    if outline:
        pad = np.pad(solid, 1)
        near = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
        out[near & ~solid] = OUTLINE
    return out


def render_sprite(outline=True, levels=0):
    return pixelize(render_rgba(), outline=outline, levels=levels)


def save_png(arr, path):
    from PIL import Image
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(arr, 'RGBA').save(path, optimize=True)


def save_blend(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.file.pack_all() if bpy.data.images else None
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(path), compress=True, check_existing=False)
