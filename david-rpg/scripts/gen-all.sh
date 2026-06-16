#!/usr/bin/env bash
# Full character art generation pipeline. Writes temp files prefixed _gen_ for review.
# Requires PIXELLAB_KEY in env.
set -e
cd "$(dirname "$0")/.."
S=src/assets/sprites
P=src/assets/portraits
pix() { node scripts/pixellab-gen.js "$1" "$2" "$3" "$4" "${5:-transparent}"; }
rot() { node scripts/pixellab-rotate.js "$1" south "$2" "$3" 64; }
anim() { node scripts/pixellab-animate.js "$1" "$2" "$3" walking 4 "$4"; }

STYLE="16-bit top-down RPG character sprite, full body, facing the viewer front view, plain background"

echo "== DAVID walk cycles (4 dirs x 4 frames) =="
DDESC="young shepherd boy David, tan tunic, brown curly hair, leather sling pouch"
anim "$S/_new_david_south.png" "$DDESC" south "$S/_gen_david_south"
anim "$S/_rot_david_north.png" "$DDESC" north "$S/_gen_david_north"
anim "$S/_rot_david_east.png"  "$DDESC" east  "$S/_gen_david_east"
anim "$S/_rot_david_west.png"  "$DDESC" west  "$S/_gen_david_west"

echo "== NPC + enemy directional sprites (front + 3 rotations) =="
gen_char() { # name, prompt
  local n="$1"; local prompt="$2"
  pix "$prompt, $STYLE" 64 64 "$S/_gen_${n}_south.png"
  rot "$S/_gen_${n}_south.png" north "$S/_gen_${n}_north.png"
  rot "$S/_gen_${n}_south.png" east  "$S/_gen_${n}_east.png"
  rot "$S/_gen_${n}_south.png" west  "$S/_gen_${n}_west.png"
}
gen_char samuel    "old prophet Samuel, long grey beard, flowing cream and white robe, wooden staff, kind wise face"
gen_char saul      "King Saul of Israel, tall man, bronze crown, dark beard, royal purple robe with gold trim, leather armor"
gen_char jonathan  "Jonathan prince of Israel, young man, short brown hair, bronze armor over blue tunic, sword at hip, noble face"
gen_char philistine "Philistine warrior, bronze scale armor, dark crested helmet, round shield, short sword, fierce"
gen_char israelite "Israelite foot soldier, bronze helmet, leather and cloth armor, short spear, brown tunic"

echo "== Portraits (128x128, dark background) =="
PSTYLE="detailed pixel art character portrait, head and shoulders, dark background"
pix "portrait of Jesse of Bethlehem, elderly shepherd father, grey beard, kind weathered face, brown head covering, $PSTYLE" 128 128 "$P/_gen_jesse.png" keep
pix "portrait of Eliab eldest son of Jesse, strong young soldier, short dark beard, proud stern face, bronze armor, $PSTYLE" 128 128 "$P/_gen_eliab.png" keep
pix "portrait of Abishai, fierce young Israelite warrior, short black hair, intense eyes, leather armor, $PSTYLE" 128 128 "$P/_gen_abishai.png" keep
pix "portrait of a frightened Israelite soldier, young man, bronze helmet, nervous sweating face, $PSTYLE" 128 128 "$P/_gen_israelite_soldier.png" keep

echo "== DONE =="
