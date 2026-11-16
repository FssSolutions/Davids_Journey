"""Build every game sprite from 3D models with Blender.

Run from the david-rpg folder, either with Blender itself:

    blender -b -P blender/build_assets.py -- [what ...]

or with the `bpy` Python module (pip install bpy):

    python3 blender/build_assets.py [what ...]

`what` is any of: characters, tiles, props, items, or a single character name
(david, saul, ...). With no arguments everything is rebuilt.

Outputs go to src/assets/ (PNG sprites + manifest.json) and blender/models/
(.blend files you can open and edit).
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import characters as chars  # noqa: E402
import props  # noqa: E402
from common import (clear_material_cache, make_camera, render_sprite, reset_scene,  # noqa: E402
                    save_blend, save_png)

ROOT = os.path.dirname(HERE)
SPRITES = os.path.join(ROOT, 'src', 'assets', 'sprites')
MODELS = os.path.join(HERE, 'models')

# Sheet rows. The angle is the armature's Z rotation: facing -Y is south.
DIRECTIONS = [('south', 0), ('north', 180), ('west', -90), ('east', 90)]
# w, h, ground px from bottom, pixels per unit
FRAME = {'default': (64, 64, 9, 34), 'goliath': (128, 160, 14, 51)}
# Characters are shot from a lower angle than the scenery so faces stay readable.
CHAR_ELEV = math.radians(30)
# Battle screen: w, h, ground px, pixels per unit, facing angle (David looks right, foes look left).
BATTLE_FRAME = {
    'david': (176, 176, 16, 80, 42),
    'philistine': (176, 176, 16, 80, -42),
    'goliath': (256, 288, 20, 96, -42),
}


def build_character(name):
    reset_scene()
    clear_material_cache()
    arm, actions = chars.build_character(name)
    w, h, ground, ppu = FRAME.get(name, FRAME['default'])
    make_camera(w, h, ground, elev=CHAR_ELEV, ppu=ppu)
    scene = bpy.context.scene

    cols = chars.IDLE_FRAMES + chars.WALK_FRAMES
    sheet = np.zeros((h * len(DIRECTIONS), w * cols, 4), dtype=np.uint8)
    for row, (_, angle) in enumerate(DIRECTIONS):
        arm.rotation_euler = (0, 0, math.radians(angle))
        col = 0
        for anim, n in (('idle', chars.IDLE_FRAMES), ('walk', chars.WALK_FRAMES)):
            chars.set_action(arm, actions[anim])
            for f in range(n):
                scene.frame_set(f + 1)
                sheet[row * h:(row + 1) * h, col * w:(col + 1) * w] = render_sprite()
                col += 1
    save_png(sheet, os.path.join(SPRITES, f'{name}_sheet.png'))

    meta = {'frameWidth': w, 'frameHeight': h}
    if 'attack' in actions:
        meta['battle'] = build_battle(name, arm, actions)

    # Leave the .blend facing south with the walk cycle loaded and ready to play.
    arm.rotation_euler = (0, 0, 0)
    chars.set_action(arm, actions['walk'])
    scene.frame_start, scene.frame_end = 1, chars.WALK_FRAMES
    scene.render.fps = 12
    scene.frame_set(1)
    save_blend(os.path.join(MODELS, f'{name}.blend'))
    print(f'[blender] {name}: {cols} frames x {len(DIRECTIONS)} directions')
    return meta


def build_battle(name, arm, actions):
    """Large three-quarter view sheet for the combat screen: idle then attack."""
    w, h, ground, ppu, angle = BATTLE_FRAME[name]
    make_camera(w, h, ground, elev=math.radians(20), ppu=ppu)
    scene = bpy.context.scene
    arm.rotation_euler = (0, 0, math.radians(angle))
    cols = chars.IDLE_FRAMES + chars.ATTACK_FRAMES
    sheet = np.zeros((h, w * cols, 4), dtype=np.uint8)
    col = 0
    for anim, n in (('idle', chars.IDLE_FRAMES), ('attack', chars.ATTACK_FRAMES)):
        chars.set_action(arm, actions[anim])
        for f in range(n):
            scene.frame_set(f + 1)
            sheet[:, col * w:(col + 1) * w] = render_sprite()
            col += 1
    save_png(sheet, os.path.join(SPRITES, 'battle', f'{name}.png'))
    return {'file': f'battle/{name}.png', 'frameWidth': w, 'frameHeight': h,
            'idleFrames': chars.IDLE_FRAMES, 'attackFrames': chars.ATTACK_FRAMES}


def write_manifest(extra):
    path = os.path.join(SPRITES, 'manifest.json')
    data = {}
    if os.path.exists(path):
        try:
            with open(path) as f:
                data = json.load(f)
        except Exception:
            data = {}
    if data.get('generator') != 'blender':
        data = {}
    data.update({
        'generator': 'blender',
        'directions': [d for d, _ in DIRECTIONS],
        'idleFrames': chars.IDLE_FRAMES,
        'walkFrames': chars.WALK_FRAMES,
    })
    for k, v in extra.items():
        data.setdefault(k, {}).update(v)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write('\n')


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    what = argv or ['characters', 'tiles', 'props', 'items']
    extra = {}
    names = list(chars.CHARACTERS) if 'characters' in what else [w for w in what if w in chars.CHARACTERS]
    for name in names:
        extra.setdefault('characters', {})[name] = build_character(name)
    if 'tiles' in what:
        extra['tiles'] = props.build_tiles(SPRITES, MODELS)
    if 'props' in what:
        extra['props'] = props.build_props(SPRITES, MODELS)
    if 'items' in what:
        extra['items'] = props.build_items(SPRITES, MODELS)
    write_manifest(extra)


if __name__ == '__main__':
    main()
