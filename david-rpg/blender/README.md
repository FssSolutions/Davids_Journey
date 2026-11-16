# Blender art pipeline

Every sprite in the game is rendered from a 3D model. Nothing here needs the
Blender window open: the scripts build the models, rig and animate them, and
render the frames headless.

    3D model  →  rig + actions  →  tilted orthographic camera  →  pixel-art PNG  →  Phaser

## Rebuild the art

From the `david-rpg` folder, with Blender installed:

    blender -b -P blender/build_assets.py

or with the Python module (`pip install bpy`):

    python3 blender/build_assets.py

Add names to rebuild only part of it: `characters`, `tiles`, `props`, `items`,
or a single character such as `david`. A full build takes about four minutes.

    python3 blender/build_assets.py david tiles

## What it produces

| Output | Contents |
| --- | --- |
| `src/assets/sprites/{name}_sheet.png` | One sheet per character: 4 rows (south, north, west, east) x 12 columns (4 idle + 8 walk) |
| `src/assets/sprites/battle/{name}.png` | Large battle-screen sheets: 4 idle + 6 attack frames |
| `src/assets/sprites/tiles.png` | 16 ground tiles, 32px, including cliff-face tiles |
| `src/assets/sprites/props/*.png` | House, well, tree, tents, pillar, throne, sheep and so on |
| `src/assets/sprites/items/*.png` | Stone, heart, faith orb, Goliath's sword |
| `src/assets/sprites/manifest.json` | Frame sizes and prop footprints; the game reads this to load everything |
| `blender/models/**/*.blend` | The models themselves, ready to open in Blender |

## Files

- `common.py` — scene, light, materials, mesh helpers, the camera, and the
  pixel-art post-process (4x supersample, hard alpha edge, 1px outline).
- `characters.py` — the cast. `CHARACTERS` describes each one (colours, robe,
  beard, headgear, what they hold); the builder turns that into meshes parented
  to a 7-bone rig, then generates the `idle`, `walk` and `attack` actions.
- `props.py` — tiles, scenery and item icons.
- `build_assets.py` — entry point; renders everything and writes the manifest.

## Changing things

- **New look for a character:** edit its entry in `CHARACTERS` and rebuild.
- **New animation:** add a pose function next to `_pose_walk` in
  `characters.py`, register it as an action, and render it in
  `build_assets.py`.
- **New prop:** add a builder and a row in `PROPS` in `props.py`, rebuild, then
  place it in a scene with `addProp(this, 'name', x, y)` from
  `src/systems/World.js`. `x, y` is where it touches the ground.
- **Hand-made models:** open a file from `blender/models/` in Blender and edit
  it freely. The rig is a normal armature, so you can pose and keyframe it. Note
  that running the build script regenerates the `.blend` files from code, so
  save hand-edited models under a different name.

## Camera conventions

- Scenery is shot from 40 degrees above the horizon, characters from 30 so
  their faces stay readable.
- One ground tile is one Blender unit (32px). Characters face -Y.
- Dialogue portraits are still the 2D paintings in `src/assets/portraits/`.
