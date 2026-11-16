"""Procedural, rigged low-poly characters for Son of Jesse.

Each character is assembled from simple meshes parented to the bones of a
small armature (root, torso, head, arm.L/R, leg.L/R), so the result is a real
rig you can open in Blender and re-pose or re-animate. `idle` and `walk`
Actions are generated in code.

Characters face -Y (towards the camera = "south"); their left side is +X.
"""
import math

import bpy
from mathutils import Matrix, Quaternion, Vector

from common import box, frustum, mat, rod, rot_x, rot_y, rot_z, sphere

IDLE_FRAMES = 4
WALK_FRAMES = 8

SKIN = 0xd9a577
SKIN_PALE = 0xe3b98f
SKIN_TAN = 0xc48a5a
WOOD = 0x6b4526
BRONZE = 0xc08a3a
GOLD = 0xe6b93a
IRON = 0x8d949c
LEATHER = 0x7a5232

# ── Character definitions ────────────────────────────────────────────────
# robe: 'tunic' (knee length, legs visible) or 'long' (ankle length).
CHARACTERS = {
    'david': dict(
        skin=SKIN, hair=0x6b3f22, hair_style='curly', robe='tunic',
        robe_col=0xc9a24a, sash=0x8a4b22, sleeves=False, held_r='sling', feet=0x7a5232,
    ),
    'samuel': dict(
        skin=SKIN_PALE, hair=0xe8e6df, hair_style='long', beard=0xe8e6df, beard_len=1.7,
        robe='long', robe_col=0xe9dfc2, sash=0x7a4a2a, sleeves=True, held_r='staff',
        cloak=0xcbbf9d, feet=0x7a5232,
    ),
    'jesse': dict(
        skin=SKIN_TAN, hair=0x9a958c, hair_style='hood', hood=0x5e3d28, beard=0xd9d5cc,
        beard_len=1.3, robe='long', robe_col=0x8a5f3c, sash=0xc9b28a, sleeves=True,
        held_r='crook', feet=0x5a3a22,
    ),
    'saul': dict(
        skin=SKIN_TAN, hair=0x1d1612, hair_style='long', beard=0x1d1612, beard_len=1.0,
        robe='long', robe_col=0x6a2d86, sash=GOLD, sleeves=True, cloak=0x3d1750,
        headgear='crown', trim=GOLD, feet=0x4a2f1c,
    ),
    'jonathan': dict(
        skin=SKIN, hair=0x7a4a26, hair_style='short', robe='tunic', robe_col=0x35619a,
        sash=LEATHER, sleeves=False, armor=BRONZE, headgear='headband', band=GOLD,
        held_r='sword', greaves=LEATHER, feet=0x5a3a22,
    ),
    'israelite': dict(
        skin=SKIN_TAN, hair=0x3a2616, hair_style='short', robe='tunic', robe_col=0x8a6238,
        sash=0x4f3520, sleeves=False, armor=LEATHER, headgear='helmet', helm=BRONZE,
        held_r='spear', greaves=LEATHER, feet=0x5a3a22,
    ),
    'philistine': dict(
        skin=SKIN_TAN, hair=0x1d1612, hair_style='short', beard=0x1d1612, beard_len=0.7,
        robe='tunic', robe_col=0x7d2334, sash=0x2c2c34, sleeves=False, armor=IRON,
        headgear='plume', helm=IRON, plume=0xb3202e, held_r='sword', held_l='shield',
        shield=0x8f1f4a, greaves=IRON, feet=0x3a2a20,
    ),
    'goliath': dict(
        skin=SKIN_TAN, hair=0x1d1612, hair_style='short', beard=0x1d1612, beard_len=1.2,
        robe='tunic', robe_col=0x7d1f1f, sash=0x3a2416, sleeves=False, armor=BRONZE,
        headgear='plume', helm=BRONZE, plume=0xb3202e, held_r='sword', held_l='shield',
        shield=BRONZE, greaves=BRONZE, feet=0x3a2a20, pauldrons=True,
        # Giant proportions: taller legs/torso, smaller head relative to body.
        giant=True,
    ),
}


class Builder:
    """Collects parts and attaches each to a bone of the armature."""

    def __init__(self, name, spec):
        self.name = name
        self.s = spec
        self.parts = []  # (object, bone)
        g = spec.get('giant', False)
        # Key heights (Blender units; a ground tile is 1 unit wide).
        self.hip = 0.62 if g else 0.42
        self.shoulder = 1.42 if g else 0.90
        self.head_z = 1.82 if g else 1.24
        self.head_r = 0.29 if g else 0.30
        self.half_w = 0.40 if g else 0.275       # shoulder half-width
        self.leg_x = 0.18 if g else 0.125
        self.bulk = 1.45 if g else 1.0
        self.arm_len = 0.62 if g else 0.40

    def add(self, ob, bone):
        self.parts.append((ob, bone))
        return ob

    # ── body ──
    def body(self):
        s, B = self.s, self.bulk
        skin = mat(s['skin'])
        robe = mat(s['robe_col'])
        long_robe = s['robe'] == 'long'
        hem = 0.07 if long_robe else self.hip - 0.10
        leg_col = mat(s['greaves'], metallic=0.6 if s['greaves'] in (BRONZE, IRON) else 0, rough=0.5) \
            if s.get('greaves') else skin

        for side, bone in ((1, 'leg.L'), (-1, 'leg.R')):
            x = side * self.leg_x
            self.add(rod(f'leg{bone[-2:]}', (x, 0, self.hip), (x, 0, 0.09), 0.085 * B, leg_col), bone)
            self.add(sphere(f'foot{bone[-2:]}', (x, -0.045, 0.065),
                            (0.10 * B, 0.155 * B, 0.07), mat(s['feet'])), bone)

        # Robe / tunic: a flattened cone section from the hem up to the shoulders.
        r_hem = (0.31 if long_robe else 0.29) * B
        self.add(frustum('robe', hem, self.shoulder + 0.04, r_hem, 0.19 * B, robe, sy=0.82), 'torso')
        self.add(sphere('shoulders', (0, 0, self.shoulder + 0.02),
                        (self.half_w * 0.98, 0.19 * B, 0.13), robe), 'torso')
        # Sash / belt.
        zs = self.hip + 0.13
        t = (zs - hem) / (self.shoulder + 0.04 - hem)
        rs = r_hem + (0.19 * B - r_hem) * t + 0.015
        sash_metal = 0.7 if s['sash'] == GOLD else 0
        self.add(frustum('sash', zs - 0.04, zs + 0.04, rs + 0.006, rs, mat(s['sash'], metallic=sash_metal, rough=0.5),
                         sy=0.82), 'torso')
        if s.get('trim'):
            self.add(frustum('hem_trim', hem, hem + 0.05, r_hem + 0.012, r_hem + 0.008,
                             mat(s['trim'], metallic=0.7, rough=0.4), sy=0.82), 'torso')
            self.add(box('front_trim', (0, -0.215 * B, (hem + self.shoulder) / 2 + 0.02),
                         (0.07, 0.05, self.shoulder - hem - 0.12), mat(s['trim'], metallic=0.7, rough=0.4),
                         rot=rot_x(-7)), 'torso')

        # Chest armour sits over the upper torso.
        if s.get('armor'):
            metal = s['armor'] in (BRONZE, IRON)
            am = mat(s['armor'], metallic=0.75 if metal else 0, rough=0.42 if metal else 0.9)
            self.add(frustum('cuirass', zs + 0.04, self.shoulder + 0.05, rs + 0.02, 0.205 * B, am, sy=0.86), 'torso')
            self.add(sphere('cuirass_top', (0, 0, self.shoulder + 0.03),
                            (self.half_w * 1.0, 0.205 * B, 0.135), am), 'torso')
            if s.get('pauldrons'):
                for side in (1, -1):
                    self.add(sphere('pauldron', (side * (self.half_w + 0.03), 0, self.shoulder + 0.04),
                                    (0.17, 0.17, 0.12), am), 'torso')

        # Cloak hangs behind the body.
        if s.get('cloak'):
            self.add(frustum('cloak', hem + 0.02, self.shoulder + 0.03, r_hem * 1.12, 0.21 * B,
                             mat(s['cloak']), y=0.085, sy=0.62), 'torso')

        # Arms + hands.
        sleeve = robe if s.get('sleeves') else skin
        for side, bone in ((1, 'arm.L'), (-1, 'arm.R')):
            x0 = side * self.half_w
            x1 = side * (self.half_w + 0.035)
            z1 = self.shoulder - self.arm_len
            self.add(rod(f'arm{bone[-2:]}', (x0, 0, self.shoulder), (x1, 0, z1), 0.078 * B, sleeve, r1=0.07 * B), bone)
            self.add(sphere(f'hand{bone[-2:]}', (x1, 0, z1 - 0.03), 0.085 * B, skin), bone)

    # ── head ──
    def head(self):
        s = self.s
        z, r = self.head_z, self.head_r
        skin = mat(s['skin'])
        dark = mat(0x1a1210)
        self.add(sphere('head', (0, 0, z), (r, r * 0.95, r * 0.96), skin, seg=20), 'head')
        for side in (1, -1):
            self.add(sphere('eye', (side * r * 0.38, -r * 0.865, z - 0.005), (0.052, 0.025, 0.075), dark), 'head')
            self.add(sphere('ear', (side * r * 0.97, 0.0, z - 0.01), (0.04, 0.06, 0.075), skin), 'head')

        hair = mat(s['hair'])
        style = s.get('hair_style', 'short')
        if style in ('short', 'curly', 'long'):
            self.add(sphere('hair', (0, r * 0.17, z + r * 0.17), (r * 1.06, r * 1.04, r * 1.0), hair, seg=20), 'head')
        if style == 'curly':
            # A ring of curls around the crown plus a fringe over the forehead.
            for i in range(9):
                a = math.radians(i * 40)
                self.add(sphere('curl', (math.cos(a) * r * 0.88, r * 0.12 + math.sin(a) * r * 0.86, z + r * 0.42),
                                r * 0.36, hair, seg=10), 'head')
            for x in (-0.5, 0.0, 0.5):
                self.add(sphere('fringe', (x * r, -r * 0.62, z + r * 0.74), r * 0.27, hair, seg=10), 'head')
            self.add(sphere('curl_top', (0, r * 0.1, z + r * 0.92), r * 0.42, hair, seg=10), 'head')
        if style == 'long':
            self.add(sphere('hair_back', (0, r * 0.62, z - r * 0.62), (r * 0.92, r * 0.5, r * 1.05), hair), 'head')
        if style == 'hood':
            hood = mat(s['hood'])
            self.add(sphere('hood', (0, r * 0.2, z + r * 0.16), (r * 1.13, r * 1.12, r * 1.08), hood, seg=20), 'head')
            self.add(sphere('hood_back', (0, r * 0.6, z - r * 0.7), (r * 1.0, r * 0.55, r * 1.0), hood), 'head')

        if s.get('beard'):
            L = s.get('beard_len', 1.0)
            bm_ = mat(s['beard'])
            self.add(sphere('beard', (0, -r * 0.62, z - r * (0.55 + 0.22 * L)),
                            (r * 0.66, r * 0.42, r * 0.5 * L), bm_), 'head')
            for side in (1, -1):
                self.add(sphere('sideburn', (side * r * 0.66, -r * 0.42, z - r * 0.38),
                                (r * 0.3, r * 0.42, r * 0.5), bm_), 'head')

        gear = s.get('headgear')
        top = z + r * 0.96
        if gear == 'crown':
            g = mat(GOLD, metallic=0.85, rough=0.3)
            self.add(frustum('crown', top - 0.13, top + 0.03, r * 0.80, r * 0.86, g), 'head')
            for i in range(6):
                a = math.radians(i * 60 + 30)
                self.add(rod('crown_point', (math.cos(a) * r * 0.80, math.sin(a) * r * 0.80, top + 0.02),
                             (math.cos(a) * r * 0.84, math.sin(a) * r * 0.84, top + 0.15), 0.05, g, r1=0.0, seg=6), 'head')
            self.add(sphere('crown_gem', (0, -r * 0.84, top - 0.05), 0.045, mat(0xc02a3a, rough=0.2, emit=0.4)), 'head')
        elif gear == 'headband':
            self.add(frustum('headband', z + r * 0.33, z + r * 0.52, r * 1.09, r * 1.06,
                             mat(s['band'], metallic=0.8, rough=0.35)), 'head')
        elif gear in ('helmet', 'plume'):
            hm = mat(s['helm'], metallic=0.8, rough=0.38)
            # Set back and up on the head so the face stays visible from the front.
            self.add(sphere('helmet', (0, r * 0.26, z + r * 0.30), (r * 1.12, r * 1.10, r * 1.0), hm, seg=20), 'head')
            self.add(frustum('helmet_rim', z + r * 0.40, z + r * 0.52, r * 1.12, r * 1.08, hm, y=r * 0.20), 'head')
            if gear == 'helmet':
                self.add(sphere('helmet_knob', (0, r * 0.26, z + r * 1.32), 0.055, hm), 'head')
            else:
                # Cheek guards + a tall crest running front to back.
                for side in (1, -1):
                    self.add(sphere('cheek', (side * r * 0.86, -r * 0.3, z - r * 0.25),
                                    (r * 0.22, r * 0.4, r * 0.5), hm), 'head')
                self.add(sphere('plume', (0, r * 0.30, z + r * 1.38), (0.065, r * 1.0, r * 0.5), mat(s['plume'])), 'head')

    # ── held items ──
    def items(self):
        s = self.s
        B = self.bulk
        hz = self.shoulder - self.arm_len - 0.03
        rx = -(self.half_w + 0.035)   # right hand x
        lx = self.half_w + 0.035
        wood = mat(WOOD)
        steel = mat(0xc9d0d6, metallic=0.9, rough=0.25)
        r = s.get('held_r')
        if r in ('staff', 'crook', 'spear'):
            x, y = rx - 0.03, -0.11
            top = self.head_z + (0.42 if r != 'spear' else 0.30)
            self.add(rod(r, (x, y, 0.02), (x, y, top), 0.028 * B, wood, seg=8), 'arm.R')
            if r == 'crook':
                pts = [(x, y, top), (x + 0.07, y, top + 0.12), (x + 0.18, y, top + 0.12), (x + 0.23, y, top + 0.0)]
                for a, b in zip(pts, pts[1:]):
                    self.add(rod('crook_hook', a, b, 0.028, wood, seg=8), 'arm.R')
            if r == 'staff':
                self.add(sphere('staff_knob', (x, y, top + 0.02), 0.055, wood, seg=10), 'arm.R')
            if r == 'spear':
                self.add(rod('spear_tip', (x, y, top), (x, y, top + 0.24 * B), 0.06 * B, steel, r1=0.0, seg=6), 'arm.R')
        elif r == 'sword':
            x, y = rx - 0.02, -0.10
            self.add(box('sword_blade', (x, y - 0.20 * B, hz + 0.19 * B), (0.05 * B, 0.02, 0.52 * B), steel,
                         rot=rot_x(-42)), 'arm.R')
            self.add(box('sword_guard', (x, y - 0.03, hz + 0.02), (0.16 * B, 0.04, 0.035),
                         mat(BRONZE, metallic=0.8, rough=0.4), rot=rot_x(-42)), 'arm.R')
        elif r == 'sling':
            cord = mat(0x4a321e)
            self.add(rod('sling_cord', (rx, -0.02, hz), (rx - 0.02, -0.03, hz - 0.22), 0.014, cord, seg=6), 'arm.R')
            self.add(sphere('sling_pouch', (rx - 0.02, -0.03, hz - 0.24), (0.05, 0.04, 0.035), cord, seg=8), 'arm.R')

        if s.get('held_l') == 'shield':
            col = s['shield']
            metal = col in (BRONZE, IRON)
            sm = mat(col, metallic=0.75 if metal else 0, rough=0.4 if metal else 0.8)
            R = 0.30 * B
            c = (lx + 0.02, -0.15 * B, hz + 0.16)
            face = rot_x(90)
            self.add(_disc('shield', c, R, 0.05, sm, face), 'arm.L')
            self.add(_disc('shield_rim', (c[0], c[1] - 0.012, c[2]), R * 0.82, 0.05,
                           mat(0x3a2a22) if not metal else sm, face), 'arm.L')
            self.add(_disc('shield_face', (c[0], c[1] - 0.022, c[2]), R * 0.70, 0.05, sm, face), 'arm.L')
            self.add(sphere('shield_boss', (c[0], c[1] - 0.05, c[2]), (R * 0.26, 0.05, R * 0.26),
                            mat(0xd9dde2, metallic=0.9, rough=0.25), seg=10), 'arm.L')
        if self.s.get('giant'):
            # Goliath's javelin is slung across his back (1 Sam 17:6).
            self.add(rod('javelin', (-0.45, 0.24, 0.5), (0.5, 0.24, 1.75), 0.03, wood, seg=6), 'torso')
            self.add(rod('javelin_tip', (0.5, 0.24, 1.75), (0.6, 0.24, 1.9), 0.06, steel, r1=0.0, seg=6), 'torso')

    # ── armature ──
    def rig(self):
        arm_data = bpy.data.armatures.new(f'{self.name}_rig')
        arm = bpy.data.objects.new(self.name, arm_data)
        bpy.context.scene.collection.objects.link(arm)
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='EDIT')
        eb = arm_data.edit_bones

        def bone(name, head, tail, parent=None):
            b = eb.new(name)
            b.head, b.tail = head, tail
            if parent:
                b.parent = eb[parent]
            return b

        hw, lx = self.half_w, self.leg_x
        bone('root', (0, 0, 0), (0, 0.25, 0))
        bone('torso', (0, 0, self.hip), (0, 0, self.shoulder), 'root')
        bone('head', (0, 0, self.shoulder + 0.04), (0, 0, self.head_z + self.head_r), 'torso')
        bone('arm.L', (hw, 0, self.shoulder), (hw + 0.035, 0, self.shoulder - self.arm_len), 'torso')
        bone('arm.R', (-hw, 0, self.shoulder), (-hw - 0.035, 0, self.shoulder - self.arm_len), 'torso')
        bone('leg.L', (lx, 0, self.hip), (lx, 0, 0.05), 'root')
        bone('leg.R', (-lx, 0, self.hip), (-lx, 0, 0.05), 'root')
        bpy.ops.object.mode_set(mode='OBJECT')
        arm_data.display_type = 'STICK'
        arm.show_in_front = True

        bpy.context.view_layer.update()
        for ob, bname in self.parts:
            pb = arm.pose.bones[bname]
            world = ob.matrix_world.copy()
            ob.parent = arm
            ob.parent_type = 'BONE'
            ob.parent_bone = bname
            parent_m = arm.matrix_world @ pb.matrix @ Matrix.Translation((0, pb.bone.length, 0))
            ob.matrix_parent_inverse = parent_m.inverted()
            ob.matrix_basis = world
        for pb in arm.pose.bones:
            pb.rotation_mode = 'QUATERNION'
        return arm


def _disc(name, loc, radius, depth, material, rot):
    import bmesh
    from common import _finish, _trs
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=18, radius1=radius, radius2=radius,
                          depth=depth, matrix=_trs(loc, (1, 1, 1), rot))
    return _finish(name, bm, material, smooth=False)


# ── Animation ────────────────────────────────────────────────────────────

def _swing(arm, bone, deg_x, deg_y=0.0, deg_z=0.0):
    """Rotate a pose bone by angles given about the character's own axes
    (X = side to side axis, so a negative X swing moves a limb forwards)."""
    pb = arm.pose.bones[bone]
    rest = pb.bone.matrix_local.to_3x3()
    world = (Matrix.Rotation(math.radians(deg_z), 3, 'Z')
             @ Matrix.Rotation(math.radians(deg_y), 3, 'Y')
             @ Matrix.Rotation(math.radians(deg_x), 3, 'X'))
    pb.rotation_quaternion = (rest.inverted() @ world @ rest).to_quaternion()


def _key(arm, frame):
    for pb in arm.pose.bones:
        pb.keyframe_insert('rotation_quaternion', frame=frame)
    root = arm.pose.bones['root']
    root.keyframe_insert('location', frame=frame)
    arm.pose.bones['head'].keyframe_insert('location', frame=frame)


def _pose_walk(arm, spec, t):
    """t in [0,1): one full stride. t=0 is the passing pose (legs together)."""
    ph = math.sin(2 * math.pi * t)
    long_robe = spec['robe'] == 'long'
    giant = spec.get('giant')
    leg = 16 if long_robe else (26 if giant else 34)
    arm_amp = 14 if long_robe else 28
    # A hand carrying a staff / spear / shield stays steadier.
    r_amp = 5 if spec.get('held_r') in ('staff', 'crook', 'spear') else arm_amp
    l_amp = 6 if spec.get('held_l') == 'shield' else arm_amp
    _swing(arm, 'leg.L', -leg * ph)
    _swing(arm, 'leg.R', leg * ph)
    _swing(arm, 'arm.L', l_amp * ph, deg_y=-4)
    _swing(arm, 'arm.R', -r_amp * ph, deg_y=4)
    _swing(arm, 'torso', 0, deg_y=2.5 * ph, deg_z=4 * ph)
    _swing(arm, 'head', 0, deg_y=-2.0 * ph, deg_z=-3 * ph)
    _swing(arm, 'root', 0)
    # Body drops slightly when the legs are spread, rises as they pass.
    root = arm.pose.bones['root']
    rest = root.bone.matrix_local.to_3x3()
    root.location = rest.inverted() @ Vector((0, 0, -0.045 * ph * ph))
    arm.pose.bones['head'].location = (0, 0, 0)


def _pose_idle(arm, spec, t):
    """Gentle breathing: head dips a pixel, arms ease out."""
    b = (1 - math.cos(2 * math.pi * t)) / 2   # 0 → 1 → 0
    for bone in ('leg.L', 'leg.R', 'torso', 'root'):
        _swing(arm, bone, 0)
    _swing(arm, 'arm.L', 0, deg_y=-4 - 3 * b)
    _swing(arm, 'arm.R', 0, deg_y=4 + 3 * b)
    _swing(arm, 'head', 2.0 * b)
    arm.pose.bones['root'].location = (0, 0, 0)
    head = arm.pose.bones['head']
    head.location = head.bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, -0.035 * b))


def _lerp_keys(keys, t):
    """Piecewise-linear lookup in a list of evenly spaced key tuples, t in [0,1]."""
    x = min(max(t, 0.0), 1.0) * (len(keys) - 1)
    i = min(int(x), len(keys) - 2)
    f = x - i
    return tuple(a + (b - a) * f for a, b in zip(keys[i], keys[i + 1]))


def _pose_sling(arm, spec, t):
    """David whirls the sling overhead and lets the stone fly (plays once)."""
    #        arm.R x   torso z  torso x  arm.L x
    keys = [(20,        14,      2,       -10),
            (-150,      18,      4,       -30),
            (-205,      10,      2,       -40),
            (-150,      -6,     -4,       -20),
            (-80,      -20,    -10,        25),
            (-35,      -14,     -6,        15)]
    ax, tz, tx, lx = _lerp_keys(keys, t)
    _swing(arm, 'arm.R', ax, deg_y=6)
    _swing(arm, 'arm.L', lx, deg_y=-8)
    _swing(arm, 'torso', tx, deg_z=tz)
    _swing(arm, 'head', 0, deg_z=-tz * 0.6)
    _swing(arm, 'leg.L', -14 if t > 0.4 else 0)
    _swing(arm, 'leg.R', 12 if t > 0.4 else 0)
    _swing(arm, 'root', 0)
    arm.pose.bones['root'].location = (0, 0, 0)
    arm.pose.bones['head'].location = (0, 0, 0)


def _pose_strike(arm, spec, t):
    """Weapon arm rises, then chops down in front (plays once)."""
    keys = [(-20, 4, 0), (-140, 12, 4), (-165, 14, 5), (-55, -14, -9), (-40, -8, -5)]
    ax, tz, tx = _lerp_keys(keys, t)
    _swing(arm, 'arm.R', ax, deg_y=5)
    _swing(arm, 'arm.L', 8, deg_y=-6)
    _swing(arm, 'torso', tx, deg_z=tz)
    _swing(arm, 'head', 0, deg_z=-tz * 0.5)
    _swing(arm, 'leg.L', -16 if t > 0.55 else 0)
    _swing(arm, 'leg.R', 10 if t > 0.55 else 0)
    _swing(arm, 'root', 0)
    arm.pose.bones['root'].location = (0, 0, 0)
    arm.pose.bones['head'].location = (0, 0, 0)


ATTACK_FRAMES = 6
# Characters that appear on the battle screen, and which attack they use.
BATTLE = {'david': _pose_sling, 'philistine': _pose_strike, 'goliath': _pose_strike}


def _make_action(arm, name, n, pose_fn, spec, loop=True):
    act = bpy.data.actions.new(f'{arm.name}_{name}')
    act.use_fake_user = True
    arm.animation_data.action = act
    if loop:
        for i in range(n + 1):       # extra key so the loop closes in Blender's timeline
            pose_fn(arm, spec, (i % n) / n)
            _key(arm, i + 1)
    else:
        for i in range(n):
            pose_fn(arm, spec, i / (n - 1))
            _key(arm, i + 1)
    if hasattr(act, 'slots') and act.slots:
        arm.animation_data.action_slot = act.slots[0]
    act.use_frame_range = True
    act.frame_start, act.frame_end = 1, (n + 1 if loop else n)
    if hasattr(act, 'use_cyclic'):
        act.use_cyclic = loop
    return act


def set_action(arm, act):
    arm.animation_data.action = act
    if hasattr(act, 'slots') and act.slots:
        arm.animation_data.action_slot = act.slots[0]


def build_character(name):
    """Build mesh parts + rig + actions. Returns (armature, {name: action})."""
    spec = CHARACTERS[name]
    b = Builder(name, spec)
    b.body()
    b.head()
    b.items()
    arm = b.rig()
    arm.animation_data_create()
    actions = {
        'idle': _make_action(arm, 'idle', IDLE_FRAMES, _pose_idle, spec),
        'walk': _make_action(arm, 'walk', WALK_FRAMES, _pose_walk, spec),
    }
    if name in BATTLE:
        actions['attack'] = _make_action(arm, 'attack', ATTACK_FRAMES, BATTLE[name], spec, loop=False)
    return arm, actions
