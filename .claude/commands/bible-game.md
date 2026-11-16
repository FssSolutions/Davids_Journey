# Son of Jesse — Session Context

This is a 2D top-down Biblical RPG built with Phaser.js 3.60 (CDN, no build tool, ES modules). Served from `david-rpg/` via `python -m http.server`. No npm, no bundler. Working directory: `C:\Users\compu\Documents\Bible Game`.

## What's fully built

- Title screen, Bethlehem overworld (WASD, NPC interaction, sheep, particles)
- Full branching dialogue system with typewriter effect, scripture callouts, choice buttons
- Three dialogue trees: `samuel_arrives`, `goliath_challenge`, `spare_saul`
- Turn-based combat (sling, faith_strike, shield, heal) with Philistine and Goliath enemies
- Scripture memory mini-game (fill-in-the-blanks) that unlocks combat abilities
- Loot drops — Philistines drop `faith_orb`, Goliath drops his sword via cinematic
- Psalm Journal (P key) — Psalm 23 unlocks via `samuel_arrives`, Psalm 27 via `spare_saul`
- Codex viewer (click verse counter) — populated when player encounters scripture nodes
- Heart Meter (0–100) — moral choices affect it; tied to `GameState`
- Full HUD: HP bar, Heart Meter, ability icons, codex counter
- Inventory UI — Faith Orb shows as `✨ Faith Orb`
- Procedural portrait art for David, Saul, Jonathan, Samuel, Goliath (90×180px, Phaser Graphics)

## Key files

- `src/scenes/BootScene.js` — asset loading, procedural textures/portraits, animations, tilemaps
- `src/scenes/BethlehemScene.js` — Chapter 1 overworld
- `src/scenes/DialogueScene.js` — dialogue engine with portrait support
- `src/scenes/CombatScene.js` — turn-based combat + loot
- `src/scenes/UIScene.js` — persistent HUD overlay
- `src/systems/GameState.js` — singleton state (health, flags, inventory, psalms, codex)
- `src/data/DialogueData.js` — all dialogue trees
- `src/data/ScriptureData.js` — verses, psalms, memory mini-game entries

## Portrait / sprite art system

- Portraits display in dialogue panels. `useRealSprites = true` set unconditionally in `BootScene.create()`
- Real PNG portraits can replace procedural art by dropping files into `src/assets/portraits/{name}.png` (david, saul, jonathan, samuel, goliath)
- **Blender pipeline (2.5D look)**: all sprites, tiles, props and items are rendered from 3D models by `python3 blender/build_assets.py` (needs `pip install bpy`, or run with `blender -b -P`). See `david-rpg/blender/README.md`
- Character sheets: `src/assets/sprites/{name}_sheet.png` — 4 rows (south/north/west/east) x 12 cols (4 idle + 8 walk). Battle sheets in `sprites/battle/`
- `src/assets/sprites/manifest.json` is written by the build and drives loading in `BootScene`
- Scenery is placed with `addProp(scene, name, x, y)` and actors are depth-sorted with `track` / `sortTracked` from `src/systems/World.js`
- Dialogue portraits are still 2D PNGs in `src/assets/portraits/` (the old Pixel Lab scripts in `scripts/` only matter for those now)

## Up next

1. **Audio** — background music (Bethlehem ambient, combat, title) and SFX (sling, hit, page turn, scripture unlock). Use Phaser Web Audio. Assets go in `src/assets/audio/`
2. **Chapter 2** — Valley of Elah scene: new overworld, soldier NPCs, Goliath taunting, connects to Goliath combat. New dialogue tree `valley_of_elah`. Triggered after `goliath_challenge` completes in Bethlehem
3. **Tiled maps** — replace procedural tilemaps with proper Tiled editor `.tmj` exports. Phaser's tilemap loader is partially wired in BootScene. Map files go in `src/assets/maps/`
