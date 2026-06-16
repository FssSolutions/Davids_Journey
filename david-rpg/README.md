# Son of Jesse — Biblical RPG
### A Phaser.js 2D Top-Down RPG built with Claude Code

---

## Quick Start

```bash
# Option 1: Python (built into macOS/Linux)
cd david-rpg
python3 -m http.server 8080
# Open: http://localhost:8080

# Option 2: Node (if you have it)
npx serve .
```

> ⚠️ Must be served via HTTP — ES modules don't work via file:// protocol.

---

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move David |
| E | Interact with NPCs |
| Space / Enter | Advance dialogue |
| 1 / 2 / 3 | Select dialogue choices |
| Click | Everything else |

---

## Project Structure

```
david-rpg/
├── index.html                  # Entry point
└── src/
    ├── main.js                 # Phaser config + scene registry
    ├── scenes/
    │   ├── BootScene.js        # Asset loading + placeholder textures
    │   ├── TitleScene.js       # Cinematic title screen
    │   ├── BethlehemScene.js   # Chapter 1 overworld (playable)
    │   ├── DialogueScene.js    # NPC conversations + scripture callouts
    │   ├── CombatScene.js      # Turn-based combat + faith abilities
    │   ├── ScriptureScene.js   # Memory mini-game (fill-in-blanks)
    │   └── UIScene.js          # Persistent HUD (HP, Heart Meter, Codex)
    ├── systems/
    │   └── GameState.js        # Singleton state (health, heart, unlocks, save)
    └── data/
        ├── ScriptureData.js    # All Bible verses + gameplay mappings
        └── DialogueData.js     # Branching story dialogue trees
```

---

## Core Systems

### ❤ Heart Meter (1 Samuel 16:7)
The central moral tracking system. God looks at the heart.
- Righteous choices → heart grows (faithful, pure)
- Sin choices → heart diminishes (wavering, troubled)
- Affects NPC dialogue, Psalm unlocks, and story outcomes

### ⚔ Scripture Combat Abilities
Players memorize real Bible verses to unlock combat powers:
- **Psalm 28:7** → Shield of Faith (block all damage 3 turns)
- **1 Samuel 17:45** → Faith Strike (double damage)
- **Psalm 23:1-3** → Shepherd's Rest (full heal)
- **Isaiah 40:31** → Eagle's Wings (speed boost)
- **Psalm 119:105** → Revealed Path (map reveal)

### 📖 Scripture Codex
Every verse encountered in the game is logged here with:
- Full text + reference
- Story context (why David used this)
- Chapter/reflection question

### 🌿 Psalm Journal
Major chapters unlock full Psalm texts with reflection questions.
Psalm 23 → Chapter 1 | Psalm 27 → Chapter 3 | Psalm 51 → Chapter 5

---

## Story Arc (Planned Chapters)

| Chapter | Location | Key Beat | Scripture Focus |
|---------|----------|----------|-----------------|
| 1 | Bethlehem Fields | The Anointing | 1 Sam 16:7 |
| 2 | Valley of Elah | Goliath | 1 Sam 17 |
| 3 | Saul's Court | Jonathan's Covenant | 1 Sam 18 |
| 4 | Wilderness of Judah | Spare Saul (Cave) | 1 Sam 24 |
| 5 | Jerusalem | Bathsheba / Nathan | 2 Sam 12, Ps 51 |
| 6 | Jerusalem | Absalom's Rebellion | 2 Sam 15-18 |
| 7 | Final | Legacy & Restoration | Psalm 23, 27 |

---

## What's Built (Prototype)

- ✅ Cinematic title screen with starry night, scripture verse
- ✅ Bethlehem overworld — movement, NPC interaction, sheep
- ✅ Full branching dialogue system with scripture callouts
- ✅ Samuel's anointing scene (full dialogue tree)
- ✅ Goliath pre-battle dialogue with scripture quiz
- ✅ Spare Saul moral choice (En Gedi cave)
- ✅ Turn-based combat with Faith Strike, Sling, Shield, Heal
- ✅ Scripture memory mini-game (fill in the blanks)
- ✅ Persistent HUD: HP, Heart Meter, Ability bar, Codex counter
- ✅ Game state (save/load, flags, codex, psalms)
- ✅ Teaching moments — wrong answers get gentle correction with the real verse

## Next Steps (Claude Code Tasks)

- [ ] Tiled map integration (real tilemap JSON)
- [ ] Sprite sheet animations (walk cycles for David/NPCs)
- [ ] Valley of Elah combat level
- [ ] Audio — ambient desert, Hebrew-inspired battle music
- [ ] Psalm Journal UI screen
- [ ] Scripture Codex viewer
- [ ] Chapter 2 complete loop
- [ ] Mobile touch controls

---

*"The battle is the LORD's." — 1 Samuel 17:47*
