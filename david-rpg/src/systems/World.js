// World.js
// Helpers that give the flat top-down map its 2.5D feel:
//  • y-sorting — whatever stands lower on screen is drawn in front, so David
//    can walk behind a tree or a house and in front of it;
//  • props — Blender-rendered scenery (see blender/props.py) placed by the
//    point where it touches the ground, with an optional solid footprint.

const ACTOR_LAYER = 5;      // actors and props share depths 5.0 – 5.99
const FOOT_OFFSET = 23;     // feet sit this far below the centre of a 64px actor frame

/** Depth for something whose ground-contact point is at world y. */
export function depthAt(y) {
  return ACTOR_LAYER + Math.max(0, y) / 10000;
}

/** Sort a centred actor sprite once (for things that never move). */
export function sortActor(sprite, footOffset = FOOT_OFFSET) {
  sprite.setDepth(depthAt(sprite.y + footOffset * sprite.scaleY));
  return sprite;
}

/** Register a moving actor; call sortTracked(scene) from the scene's update(). */
export function track(scene, sprite, footOffset = FOOT_OFFSET) {
  if (!scene._ySorted) scene._ySorted = [];
  scene._ySorted.push({ sprite, footOffset });
  sortActor(sprite, footOffset);
  return sprite;
}

export function sortTracked(scene) {
  const list = scene._ySorted;
  if (!list) return;
  for (let i = list.length - 1; i >= 0; i--) {
    const { sprite, footOffset } = list[i];
    if (!sprite.active) { list.splice(i, 1); continue; }
    sprite.setDepth(depthAt(sprite.y + footOffset * sprite.scaleY));
  }
}

/** True once the Blender-rendered scenery has been loaded. */
export function hasProp(scene, name) {
  return scene.textures.exists(`prop_${name}`);
}

/**
 * Place a prop so that its base rests on (x, y).
 * Returns the image, or null if the art is missing. Solid props get a static
 * physics body covering only their footprint, and are added to scene.propBodies
 * (create a collider between that group and the player).
 */
export function addProp(scene, name, x, y, opts = {}) {
  const key = `prop_${name}`;
  if (!scene.textures.exists(key)) return null;
  const meta = (scene.registry.get('props') || {})[name] || {};
  const tex = scene.textures.get(key).getSourceImage();
  const originY = 1 - (meta.ground ?? 0) / tex.height;
  const img = scene.add.image(x, y, key).setOrigin(0.5, originY).setDepth(depthAt(y));
  if (opts.flipX) img.setFlipX(true);

  if (meta.solid && opts.solid !== false) {
    if (!scene.propBodies) scene.propBodies = scene.physics.add.staticGroup();
    const [w, h] = meta.solid;
    const block = scene.add.zone(x, y - h / 2 + 4, w, h);
    scene.physics.add.existing(block, true);
    scene.propBodies.add(block);
  }
  return img;
}

/** Place many props from a list of [name, x, y, opts?] rows. */
export function addProps(scene, rows) {
  return rows.map(([name, x, y, opts]) => addProp(scene, name, x, y, opts));
}
