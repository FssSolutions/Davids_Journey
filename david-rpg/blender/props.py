"""Scenery for Son of Jesse: ground tiles, props and item icons.

Everything is modelled procedurally and rendered through the same tilted
orthographic camera as the characters, so the whole world shares one
perspective and one light.
"""
import math
import os
import random

import bpy
import numpy as np

from common import (ELEV, box, clear_material_cache, frustum, make_camera, mat, render_sprite,
                    reset_scene, rod, rot_x, rot_y, rot_z, save_blend, save_png, sphere)

TILE = 32
# How deep a strip of ground one tile covers when seen from the tilted camera.
DEPTH = 1.0 / math.sin(ELEV)


# ══ Tiles ═══════════════════════════════════════════════════════════════

def _ground(col, z=0.0):
    return box('ground', (0, 0, z - 0.05), (6, 6, 0.1), mat(col))


def _scatter(rng, n, fn, xr=0.36, y0=-0.55, y1=0.45):
    for _ in range(n):
        fn(rng.uniform(-xr, xr), rng.uniform(y0, y1))


def _pebbles(rng, n, cols, size=0.05):
    def one(x, y):
        s = size * rng.uniform(0.6, 1.3)
        sphere('pebble', (x, y, s * 0.3), (s, s * rng.uniform(0.8, 1.3), s * 0.6), mat(rng.choice(cols)), seg=8)
    _scatter(rng, n, one)


def _patches(rng, n, col, size=0.16):
    def one(x, y):
        sphere('patch', (x, y, 0.0), (size * rng.uniform(0.6, 1.2), size * rng.uniform(0.9, 1.6), 0.012),
               mat(col), seg=10)
    _scatter(rng, n, one, xr=0.3, y0=-0.45, y1=0.4)


def _tufts(rng, n, cols):
    def one(x, y):
        for _ in range(3):
            dx, dy = rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04)
            h = rng.uniform(0.08, 0.16)
            rod('tuft', (x + dx, y + dy, 0), (x + dx * 2.2, y + dy, h), 0.028, mat(rng.choice(cols)), r1=0.0, seg=5)
    _scatter(rng, n, one, xr=0.38, y0=-0.6, y1=0.5)


def _lumps(rng, col_a, col_b, z):
    """Cobbled rock surface: overlapping flattened boulders."""
    for i in range(7):
        x = rng.uniform(-0.33, 0.33)
        y = rng.uniform(-0.5, 0.42)
        r = rng.uniform(0.11, 0.17)
        sphere('lump', (x, y, z), (r, r * 1.5, 0.05), mat(col_a if i % 2 else col_b), seg=10)


def _cliff(top_col, top_a, top_b, face_col, face_dark, rng):
    """Raised rock mass seen at its south edge: top surface plus a front face."""
    h = 0.62
    y_front = -DEPTH / 2
    box('cliff_top', (0, y_front + 3, h - 0.05), (6, 6, 0.1), mat(top_col))
    box('cliff_face', (0, y_front + 0.03, h / 2 - 0.02), (6, 0.06, h), mat(face_col))
    # Ledges give the face horizontal strata; all span the full width so the tile repeats cleanly.
    box('ledge', (0, y_front - 0.01, h * 0.62), (6, 0.07, 0.035), mat(face_dark))
    box('ledge', (0, y_front - 0.01, h * 0.27), (6, 0.07, 0.03), mat(face_dark))
    box('lip', (0, y_front + 0.0, h - 0.02), (6, 0.1, 0.05), mat(top_a))
    for x in (-0.27, 0.12, 0.38):
        box('crack', (x, y_front - 0.012, h * 0.45 + rng.uniform(-0.08, 0.08)), (0.03, 0.05, rng.uniform(0.14, 0.24)),
            mat(face_dark))
    box('floor_shadow', (0, y_front - 3, -0.05), (6, 6, 0.1), mat(face_dark))
    for i in range(4):
        x, y, r = rng.uniform(-0.33, 0.33), rng.uniform(y_front + 0.2, y_front + 0.62), rng.uniform(0.1, 0.15)
        sphere('lump', (x, y, h), (r, r * 1.5, 0.05), mat(top_a if i % 2 else top_b), seg=10)


def _tile_sand(rng, rich=False, base=0xcaa661, dark=0xc39f5c, light=0xd1ae6b):
    _ground(base)
    _patches(rng, 2, dark)
    _patches(rng, 1, light, 0.1)
    if rich:
        _pebbles(rng, 3, [0xa98c5a, 0xe0c690], 0.04)


def _tile_stone(rng, col=0x9a8c7c, worn=False):
    _ground(0x5d5248)
    g = 0.03
    box('paver', (0, 0, 0.02), (1.0 - g, DEPTH - g * 1.5, 0.06), mat(col), bevel=0.014)
    if worn:
        sphere('worn', (rng.uniform(-0.15, 0.15), rng.uniform(-0.2, 0.2), 0.05), (0.22, 0.3, 0.004), mat(0x8c7f72), seg=10)


def _tile_wall(rng):
    _ground(0x77614c)
    _lumps(rng, 0x806a54, 0x6f5a47, 0.0)


def _tile_grass(rng, rich=False, base=0x5f8f3d):
    _ground(base)
    _patches(rng, 2, 0x5a8839)
    _tufts(rng, 6 if rich else 2, [0x6fa544, 0x4f7a31, 0x7fb352])
    if rich:
        for col in (0xf2e9c0, 0xe8c64a):
            sphere('flower', (rng.uniform(-0.3, 0.3), rng.uniform(-0.5, 0.4), 0.05), 0.035, mat(col), seg=6)


def _tile_water(rng):
    box('water', (0, 0, -0.05), (6, 6, 0.1), mat(0x2f72ad, rough=0.35))
    for _ in range(3):
        x, y = rng.uniform(-0.25, 0.25), rng.uniform(-0.5, 0.45)
        sphere('ripple', (x, y, 0.0), (rng.uniform(0.1, 0.2), 0.035, 0.006), mat(0x7fc0e8, emit=0.3), seg=10)
    for _ in range(2):
        x, y = rng.uniform(-0.3, 0.3), rng.uniform(-0.5, 0.45)
        sphere('deep', (x, y, 0.0), (0.18, 0.12, 0.004), mat(0x2a6aa3), seg=10)


def _tile_dirt(rng, rich=False, base=0x9a7d52):
    _ground(base)
    _patches(rng, 2, 0x8f734a)
    if rich:
        _pebbles(rng, 3, [0x6f5a40, 0xb0966c], 0.04)


def _tile_path(rng):
    _ground(0xdcc388)
    _patches(rng, 2, 0xd3b97c, 0.12)
    _pebbles(rng, 2, [0xb9a070, 0xeedcae], 0.04)


def _tile_darkrock(rng):
    _ground(0x4a3e34)
    _lumps(rng, 0x53463b, 0x41362e, 0.0)


def _tile_carpet(rng):
    _ground(0x8c1f2e)
    box('weave', (0, 0, 0.0), (0.3, 0.3 * DEPTH, 0.012), mat(0xa32a3a), rot=rot_z(45))
    box('weave_gem', (0, 0, 0.004), (0.1, 0.1 * DEPTH, 0.012), mat(0xd9aa3c), rot=rot_z(45))


def _tile_dais(rng):
    _ground(0x3d342c)
    box('slab', (0, 0, 0.02), (0.94, DEPTH - 0.09, 0.06), mat(0x7a6857), bevel=0.02)


# Order = tile id - 1. The first eight keep the ids the maps already use.
TILES = [
    ('sand', _tile_sand), ('stone', _tile_stone), ('wall', _tile_wall), ('grass', _tile_grass),
    ('water', _tile_water), ('dirt', _tile_dirt), ('path', _tile_path), ('darkrock', _tile_darkrock),
    ('wall_face', lambda r: _cliff(0x77614c, 0x806a54, 0x6f5a47, 0x5b4838, 0x40322a, r)),
    ('darkrock_face', lambda r: _cliff(0x4a3e34, 0x53463b, 0x41362e, 0x352b25, 0x231c18, r)),
    ('carpet', _tile_carpet), ('dais', _tile_dais),
    ('sand_b', lambda r: _tile_sand(r, rich=True)), ('grass_b', lambda r: _tile_grass(r, rich=True)),
    ('dirt_b', lambda r: _tile_dirt(r, rich=True)), ('stone_b', lambda r: _tile_stone(r, 0x93867a, worn=True)),
]
TILE_COLS = 8


def build_tiles(sprites_dir, models_dir):
    rows = (len(TILES) + TILE_COLS - 1) // TILE_COLS
    sheet = np.zeros((rows * TILE, TILE_COLS * TILE, 4), dtype=np.uint8)
    for i, (name, fn) in enumerate(TILES):
        reset_scene(samples=32)
        clear_material_cache()
        fn(random.Random(1000 + i))
        make_camera(TILE, TILE, TILE // 2)
        img = render_sprite(outline=False)
        img[..., 3] = 255
        r, c = divmod(i, TILE_COLS)
        sheet[r * TILE:(r + 1) * TILE, c * TILE:(c + 1) * TILE] = img
    save_png(sheet, os.path.join(sprites_dir, 'tiles.png'))
    print(f'[blender] tiles: {len(TILES)}')
    return {'file': 'tiles.png', 'columns': TILE_COLS, 'rows': rows,
            'ids': {name: i + 1 for i, (name, _) in enumerate(TILES)}}


# ══ Props ═══════════════════════════════════════════════════════════════
# Each builder models the prop standing on the origin, front towards -Y.

def _prop_sheep(rng):
    wool, face = mat(0xf2eee2), mat(0x3a3028)
    sphere('body', (0, 0, 0.36), (0.36, 0.26, 0.24), wool)
    for i in range(10):
        a = rng.uniform(0, math.tau)
        sphere('fluff', (math.cos(a) * 0.26 + rng.uniform(-.05, .05), math.sin(a) * 0.17, 0.36 + rng.uniform(-0.08, 0.16)),
               rng.uniform(0.11, 0.15), wool, seg=10)
    sphere('fluff_top', (-0.05, 0, 0.55), 0.16, wool, seg=10)
    sphere('head', (0.40, 0, 0.46), (0.13, 0.10, 0.11), face)
    sphere('poll', (0.33, 0, 0.56), 0.09, wool, seg=10)
    for s in (1, -1):
        sphere('ear', (0.36, s * 0.11, 0.50), (0.04, 0.06, 0.03), face, seg=8)
        for x in (0.2, -0.2):
            rod('leg', (x, s * 0.12, 0.25), (x, s * 0.12, 0.0), 0.04, face, seg=6)
    sphere('tail', (-0.37, 0, 0.42), 0.07, wool, seg=8)


def _prop_tree(rng):
    bark = mat(0x5e442c)
    rod('trunk', (0, 0, 0), (0.06, 0, 0.75), 0.17, bark, r1=0.11, seg=8)
    rod('branch', (0.06, 0, 0.7), (-0.32, 0.05, 1.25), 0.09, bark, r1=0.05, seg=6)
    rod('branch', (0.06, 0, 0.7), (0.38, -0.05, 1.2), 0.09, bark, r1=0.05, seg=6)
    rod('root', (0, 0, 0.12), (-0.24, -0.1, 0.0), 0.07, bark, r1=0.03, seg=6)
    rod('root', (0, 0, 0.12), (0.22, -0.12, 0.0), 0.07, bark, r1=0.03, seg=6)
    greens = [0x6f8f4f, 0x5d7c43, 0x809f5c, 0x52703b]
    blobs = [(-0.42, 0.05, 1.45, 0.42), (0.42, -0.02, 1.4, 0.44), (0.0, 0.1, 1.75, 0.5), (-0.15, -0.25, 1.4, 0.36),
             (0.2, 0.3, 1.5, 0.4), (-0.6, 0.0, 1.2, 0.28), (0.66, 0.05, 1.2, 0.27), (0.05, -0.05, 2.05, 0.33)]
    for i, (x, y, z, r) in enumerate(blobs):
        sphere('leaves', (x, y, z), (r, r, r * 0.8), mat(greens[i % 4]), seg=12)


def _prop_bush(rng):
    for i, (x, y, z, r) in enumerate([(-0.2, 0, 0.2, 0.26), (0.2, 0.03, 0.22, 0.28), (0, -0.05, 0.36, 0.26), (0, 0.15, 0.3, 0.25)]):
        sphere('bush', (x, y, z), (r, r, r * 0.85), mat([0x5d7c43, 0x6f8f4f, 0x7a9a55, 0x52703b][i]), seg=12)


def _prop_rock(rng):
    for i, (x, y, z, sx, sy, sz) in enumerate([(0, 0, 0.2, 0.42, 0.32, 0.3), (0.3, 0.05, 0.12, 0.25, 0.22, 0.18),
                                               (-0.28, -0.08, 0.1, 0.2, 0.18, 0.15), (0.05, 0.1, 0.38, 0.25, 0.22, 0.2)]):
        ob = sphere('rock', (x, y, z), (sx, sy, sz), mat([0x8d8273, 0x7a6f62, 0x9a8f80, 0x857a6c][i]), seg=7)
        for p in ob.data.polygons:
            p.use_smooth = False


def _prop_house(rng):
    wall, wall_d, roof = mat(0xd3b88c), mat(0xb99b6e), mat(0xc4a878)
    W, D, H = 2.5, 1.7, 1.45
    box('walls', (0, 0, H / 2), (W, D, H), wall, bevel=0.03)
    box('roof', (0, 0, H + 0.02), (W - 0.24, D - 0.24, 0.05), roof)
    for x, y, sx, sy in ((0, -D / 2 + 0.07, W + 0.08, 0.14), (0, D / 2 - 0.07, W + 0.08, 0.14),
                         (-W / 2 + 0.07, 0, 0.14, D + 0.08), (W / 2 - 0.07, 0, 0.14, D + 0.08)):
        box('parapet', (x, y, H + 0.1), (sx, sy, 0.22), wall_d, bevel=0.02)
    box('door', (-0.45, -D / 2 - 0.01, 0.42), (0.46, 0.06, 0.84), mat(0x4a3220))
    box('lintel', (-0.45, -D / 2 - 0.03, 0.88), (0.62, 0.08, 0.09), mat(0x6b4a2c))
    box('step', (-0.45, -D / 2 - 0.16, 0.03), (0.7, 0.3, 0.07), mat(0x9a8468), bevel=0.01)
    box('window', (0.62, -D / 2 - 0.01, 0.85), (0.34, 0.06, 0.34), mat(0x2a1f18))
    box('sill', (0.62, -D / 2 - 0.04, 0.66), (0.44, 0.08, 0.06), mat(0x6b4a2c))
    for x in (-0.95, -0.2, 0.25, 1.0):
        rod('beam', (x, -D / 2 + 0.05, H - 0.2), (x, -D / 2 - 0.1, H - 0.2), 0.045, mat(0x6b4a2c), seg=6)
    # Storage jars beside the door.
    frustum('jar', 0, 0.3, 0.11, 0.15, mat(0xa9683c), x=0.05, y=-D / 2 - 0.2)
    frustum('jar_neck', 0.3, 0.38, 0.15, 0.08, mat(0xa9683c), x=0.05, y=-D / 2 - 0.2)
    frustum('jar', 0, 0.22, 0.09, 0.12, mat(0x8d5632), x=0.3, y=-D / 2 - 0.24)
    # Awning cloth on poles over the window side.
    box('awning', (0.62, -D / 2 - 0.3, 1.2), (0.8, 0.62, 0.03), mat(0x9a4a32), rot=rot_x(-18))
    for x in (0.26, 0.98):
        rod('awning_pole', (x, -D / 2 - 0.56, 0), (x, -D / 2 - 0.56, 1.1), 0.025, mat(0x6b4a2c), seg=6)


def _prop_well(rng):
    stone_a, stone_b = mat(0x9a9082), mat(0x857b6e)
    frustum('well', 0, 0.38, 0.46, 0.44, stone_a, seg=14)
    for i in range(10):
        a = math.radians(i * 36)
        box('capstone', (math.cos(a) * 0.42, math.sin(a) * 0.42, 0.4), (0.2, 0.26, 0.09),
            stone_b if i % 2 else stone_a, rot=rot_z(i * 36 + 90), bevel=0.015)
    frustum('water', 0.3, 0.33, 0.33, 0.33, mat(0x1f4f7a, rough=0.2), seg=14)
    wood = mat(0x6b4a2c)
    for x in (-0.5, 0.5):
        rod('post', (x, 0, 0), (x, 0, 1.15), 0.04, wood, seg=6)
    rod('bar', (-0.56, 0, 1.1), (0.56, 0, 1.1), 0.04, wood, seg=6)
    rod('rope', (0, 0, 1.1), (0, 0, 0.62), 0.012, mat(0xc9b48a), seg=5)
    frustum('bucket', 0.48, 0.64, 0.08, 0.1, mat(0x7d5a36), seg=8)


def _tent(cloth, stripe, flap):
    def build(rng):
        frustum('tent', 0, 1.25, 1.0, 0.07, mat(cloth), seg=8, smooth=False)
        frustum('tent_band', 0.0, 0.16, 1.02, 0.94, mat(stripe), seg=8, smooth=False)
        frustum('tent_band', 0.62, 0.74, 0.535, 0.45, mat(stripe), seg=8, smooth=False)
        rod('pole', (0, 0, 1.2), (0, 0, 1.5), 0.025, mat(0x5e442c), seg=6)
        box('pennant', (0.1, 0, 1.43), (0.22, 0.02, 0.11), mat(stripe))
        # Dark doorway on the front panel, leaning with the tent wall.
        box('door', (0, -0.63, 0.36), (0.36, 0.05, 0.74), mat(flap), rot=rot_x(-36))
        for s in (1, -1):
            rod('guy', (s * 0.75, -0.75, 0.42), (s * 1.12, -1.05, 0.0), 0.012, mat(0xc9b48a), seg=4)
            rod('peg', (s * 1.12, -1.05, 0.0), (s * 1.14, -1.07, 0.1), 0.02, mat(0x5e442c), seg=4)
    return build


def _prop_pillar(rng):
    stone, cap = mat(0xb8ab98), mat(0xd9b24a, metallic=0.7, rough=0.4)
    box('plinth', (0, 0, 0.09), (0.74, 0.74, 0.18), mat(0x8f8373), bevel=0.02)
    frustum('base', 0.18, 0.3, 0.33, 0.27, stone, seg=14)
    frustum('shaft', 0.3, 2.3, 0.26, 0.22, stone, seg=14)
    for z in (0.34, 2.24):
        frustum('ring', z, z + 0.06, 0.285, 0.285, cap, seg=14)
    frustum('capital', 2.3, 2.5, 0.22, 0.38, stone, seg=14)
    box('abacus', (0, 0, 2.56), (0.84, 0.84, 0.12), mat(0x8f8373), bevel=0.02)


def _prop_throne(rng):
    stone, gold, cloth = mat(0x7d7064), mat(0xe6b93a, metallic=0.85, rough=0.3), mat(0x6a2d86)
    box('dais', (0, 0.05, 0.08), (2.0, 1.3, 0.16), mat(0x5c5148), bevel=0.02)
    box('step', (0, -0.55, 0.04), (1.4, 0.4, 0.08), mat(0x6b5f54), bevel=0.02)
    box('seat', (0, 0.05, 0.42), (0.86, 0.72, 0.52), stone, bevel=0.03)
    box('cushion', (0, -0.02, 0.71), (0.7, 0.56, 0.08), cloth, bevel=0.03)
    box('back', (0, 0.36, 1.05), (0.9, 0.16, 1.5), stone, bevel=0.03)
    box('back_panel', (0, 0.27, 1.15), (0.62, 0.04, 1.0), cloth)
    for s in (1, -1):
        box('arm', (s * 0.5, 0.02, 0.72), (0.16, 0.7, 0.34), stone, bevel=0.02)
        sphere('arm_knob', (s * 0.5, -0.32, 0.93), 0.09, gold, seg=10)
        rod('finial', (s * 0.4, 0.36, 1.8), (s * 0.4, 0.36, 2.05), 0.07, gold, r1=0.0, seg=6)
    box('crest', (0, 0.36, 1.84), (0.5, 0.18, 0.1), gold, bevel=0.02)
    sphere('crest_gem', (0, 0.26, 1.6), 0.08, mat(0xc02a3a, rough=0.2, emit=0.4), seg=10)


def _prop_brazier(rng):
    bronze = mat(0xb07a35, metallic=0.8, rough=0.4)
    for i in range(3):
        a = math.radians(i * 120 + 90)
        rod('leg', (math.cos(a) * 0.2, math.sin(a) * 0.2, 0), (math.cos(a) * 0.07, math.sin(a) * 0.07, 0.6), 0.025, bronze, seg=6)
    frustum('bowl', 0.56, 0.74, 0.1, 0.24, bronze, seg=12)
    sphere('coals', (0, 0, 0.74), (0.19, 0.19, 0.06), mat(0xff7a22, emit=3.0), seg=10)


def _prop_stalagmite(rng):
    cols = [0x6a5f58, 0x574d47, 0x7a6f66]
    for i, (x, y, r, h) in enumerate([(0, 0, 0.22, 1.05), (-0.3, -0.06, 0.15, 0.6), (0.27, 0.04, 0.17, 0.75), (0.08, -0.2, 0.11, 0.38)]):
        ob = rod('spire', (x, y, 0), (x + rng.uniform(-.04, .04), y, h), r, mat(cols[i % 3]), r1=0.015, seg=7)
        for p in ob.data.polygons:
            p.use_smooth = False


# name → (builder, width px, height px, ground px from bottom, solid footprint (w, h) px or None,
#         optional pixels-per-unit to render larger than the default 32)
PROPS = {
    'sheep':           (_prop_sheep, 40, 36, 8, None),
    'tree':            (_prop_tree, 72, 96, 12, (20, 12)),
    'bush':            (_prop_bush, 40, 32, 9, None),
    'rock':            (_prop_rock, 40, 32, 10, (30, 12)),
    'house':           (_prop_house, 144, 164, 36, (110, 54), 44),
    'well':            (_prop_well, 48, 56, 14, (30, 16)),
    'tent_israelite':  (_tent(0xe2d4b0, 0x8a5a34, 0x3a2a1e), 110, 110, 32, (74, 34), 42),
    'tent_philistine': (_tent(0x7d2334, 0x2c2c34, 0x1c1418), 110, 110, 32, (74, 34), 42),
    'pillar':          (_prop_pillar, 36, 96, 10, (28, 14)),
    'throne':          (_prop_throne, 76, 92, 22, (60, 24)),
    'brazier':         (_prop_brazier, 24, 34, 7, None),
    'stalagmite':      (_prop_stalagmite, 36, 44, 9, (24, 10)),
}


def build_props(sprites_dir, models_dir):
    meta = {}
    for name, (fn, w, h, ground, solid, *rest) in PROPS.items():
        reset_scene(samples=32)
        clear_material_cache()
        fn(random.Random(sum(map(ord, name))))
        make_camera(w, h, ground, ppu=rest[0] if rest else 32)
        save_png(render_sprite(), os.path.join(sprites_dir, 'props', f'{name}.png'))
        save_blend(os.path.join(models_dir, 'props', f'{name}.blend'))
        meta[name] = {'file': f'props/{name}.png', 'width': w, 'height': h, 'ground': ground}
        if solid:
            meta[name]['solid'] = list(solid)
    print(f'[blender] props: {len(meta)}')
    return meta


# ══ Items (HUD / pickup icons) ══════════════════════════════════════════

def _item_stone(rng):
    ob = sphere('stone', (0, 0, 0.3), (0.38, 0.3, 0.26), mat(0x9a9a98, rough=0.6), seg=9)
    sphere('stone_hi', (-0.1, -0.12, 0.42), (0.16, 0.1, 0.08), mat(0xbdbdb9, rough=0.5), seg=8)
    return ob


def _item_heart(rng):
    red = mat(0xd3303a, rough=0.3)
    for s in (1, -1):
        sphere('lobe', (s * 0.19, 0, 0.56), (0.25, 0.17, 0.25), red, seg=14)
    rod('point', (0, 0, 0.5), (0, 0, 0.08), 0.385, red, r1=0.0, seg=14).scale = (1, 0.42, 1)
    sphere('shine', (-0.22, -0.16, 0.66), (0.07, 0.03, 0.09), mat(0xffc9c9, emit=1.0), seg=8)


def _item_faith_orb(rng):
    sphere('orb', (0, 0, 0.47), 0.27, mat(0xffd54a, emit=1.6), seg=16)
    sphere('core', (-0.07, -0.2, 0.55), (0.1, 0.05, 0.1), mat(0xfff6cc, emit=3.0), seg=10)
    for i in range(8):
        a = math.radians(i * 45)
        d = 0.34
        rod('ray', (math.cos(a) * d, 0, 0.47 + math.sin(a) * d),
            (math.cos(a) * (d + 0.13), 0, 0.47 + math.sin(a) * (d + 0.13)), 0.05, mat(0xf2a52a, emit=1.2), r1=0.0, seg=5)


def _item_sword(rng):
    steel = mat(0xc9d0d6, metallic=0.9, rough=0.3)
    box('blade', (0, 0, 1.05), (0.17, 0.035, 1.35), steel)
    rod('tip', (0, 0, 1.72), (0, 0, 1.92), 0.085, steel, r1=0.0, seg=4).scale = (1, 0.25, 1)
    box('fuller', (0, -0.02, 1.05), (0.04, 0.01, 1.2), mat(0x8d949c, metallic=0.9, rough=0.4))
    box('guard', (0, 0, 0.36), (0.5, 0.07, 0.07), mat(0xc08a3a, metallic=0.8, rough=0.4), bevel=0.01)
    rod('grip', (0, 0, 0.1), (0, 0, 0.34), 0.04, mat(0x4a321e), seg=6)
    sphere('pommel', (0, 0, 0.07), 0.065, mat(0xc08a3a, metallic=0.8, rough=0.4), seg=8)


# name → (builder, width, height, ground px, pixels per unit)
ITEMS = {
    'stone': (_item_stone, 32, 32, 7, 34),
    'heart': (_item_heart, 32, 32, 4, 34),
    'faith_orb': (_item_faith_orb, 32, 32, 2, 30),
    'goliath_sword': (_item_sword, 32, 64, 2, 31),
}


def build_items(sprites_dir, models_dir):
    meta = {}
    for name, (fn, w, h, ground, ppu) in ITEMS.items():
        reset_scene(samples=32)
        clear_material_cache()
        fn(random.Random(7))
        bpy.context.view_layer.update()
        make_camera(w, h, ground, elev=math.radians(12), ppu=ppu)
        save_png(render_sprite(), os.path.join(sprites_dir, 'items', f'{name}.png'))
        save_blend(os.path.join(models_dir, 'items', f'{name}.blend'))
        meta[name] = {'file': f'items/{name}.png', 'width': w, 'height': h}
    print(f'[blender] items: {len(meta)}')
    return meta
