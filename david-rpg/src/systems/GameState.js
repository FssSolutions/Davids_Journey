// GameState.js
// Singleton that tracks all persistent game data.
// Heart Meter, unlocked scriptures, abilities, chapter progress, Psalm journal.

const DEFAULT_STATE = {
  // Player vitals
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,

  // The Heart Meter (1 Samuel 16:7 — God looks at the heart)
  // 0–100. Rises with righteous choices, falls with sin/selfishness.
  // Affects NPC dialogue, available Psalms, Absalom arc intensity.
  heartMeter: 50,

  // Unlocked scripture abilities (combat)
  abilities: [],

  // Scripture codex — all verses the player has encountered
  codex: [],

  // Psalm journal — unlocked Psalms
  psalms: [],

  // Completed story beats
  completedBeats: [],

  // Chapter progress
  chapter: 1,
  chapterName: 'The Anointing',

  // Scene to resume from when the player chooses "Continue"
  currentScene: 'BethlehemScene',

  // Flags
  flags: {
    anointed: false,
    killedGoliath: false,
    sparedSaul: false,
    jonathanCovenant: false,
  },

  // Stats (for end-of-chapter review)
  faithStrikes: 0,
  wrongScriptureAnswers: 0,
  rightScriptureAnswers: 0,

  // Inventory
  inventory: [],
};

class GameState {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this._listeners = [];
  }

  get() {
    return this.state;
  }

  // ── Heart Meter ──
  adjustHeart(amount) {
    this.state.heartMeter = Phaser.Math.Clamp(
      this.state.heartMeter + amount,
      0,
      100
    );
    this._emit('heartChanged', this.state.heartMeter);
  }

  getHeartLevel() {
    const h = this.state.heartMeter;
    if (h >= 80) return 'pure';       // gold
    if (h >= 60) return 'faithful';   // green
    if (h >= 40) return 'wavering';   // yellow
    if (h >= 20) return 'troubled';   // orange
    return 'hardened';                // red
  }

  getHeartColor() {
    const colors = {
      pure:     0xc9a84c,
      faithful: 0x4caf50,
      wavering: 0xf5c518,
      troubled: 0xff8c00,
      hardened: 0xc0392b,
    };
    return colors[this.getHeartLevel()];
  }

  // ── Health ──
  damage(amount) {
    this.state.health = Math.max(0, this.state.health - amount);
    this._emit('healthChanged', this.state.health);
    if (this.state.health <= 0) this._emit('playerDied');
  }

  heal(amount) {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
    this._emit('healthChanged', this.state.health);
  }

  // ── Abilities ──
  unlockAbility(abilityId) {
    if (!this.state.abilities.includes(abilityId)) {
      this.state.abilities.push(abilityId);
      this._emit('abilityUnlocked', abilityId);
    }
  }

  hasAbility(abilityId) {
    return this.state.abilities.includes(abilityId);
  }

  // ── Codex ──
  addToCodex(scriptureId) {
    if (!this.state.codex.includes(scriptureId)) {
      this.state.codex.push(scriptureId);
      this._emit('codexUpdated', scriptureId);
    }
  }

  // ── Psalms ──
  unlockPsalm(psalmId) {
    if (!this.state.psalms.includes(psalmId)) {
      this.state.psalms.push(psalmId);
      this._emit('psalmUnlocked', psalmId);
    }
  }

  // ── Story flags ──
  setFlag(key, value = true) {
    this.state.flags[key] = value;
    this._emit('flagSet', { key, value });
  }

  getFlag(key) {
    return this.state.flags[key];
  }

  completeBeat(beatId) {
    if (!this.state.completedBeats.includes(beatId)) {
      this.state.completedBeats.push(beatId);
    }
  }

  isBeatComplete(beatId) {
    return this.state.completedBeats.includes(beatId);
  }

  // ── Inventory ──
  addItem(id, qty = 1) {
    const existing = this.state.inventory.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else this.state.inventory.push({ id, qty });
    this._emit('inventoryChanged', this.state.inventory);
  }

  removeItem(id, qty = 1) {
    const existing = this.state.inventory.find(i => i.id === id);
    if (!existing) return false;
    existing.qty -= qty;
    if (existing.qty <= 0)
      this.state.inventory = this.state.inventory.filter(i => i.id !== id);
    this._emit('inventoryChanged', this.state.inventory);
    return true;
  }

  hasItem(id, qty = 1) {
    const existing = this.state.inventory.find(i => i.id === id);
    return existing ? existing.qty >= qty : false;
  }

  // ── Scripture tracking ──
  recordScriptureAnswer(correct) {
    if (correct) this.state.rightScriptureAnswers++;
    else this.state.wrongScriptureAnswers++;
  }

  // ── Event system ──
  on(event, callback) {
    this._listeners.push({ event, callback });
  }

  off(event, callback) {
    this._listeners = this._listeners.filter(
      l => !(l.event === event && l.callback === callback)
    );
  }

  _emit(event, data) {
    this._listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }

  // ── Save / Load (localStorage) ──
  save() {
    try {
      localStorage.setItem('son_of_jesse_save', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('son_of_jesse_save');
      if (saved) {
        this.state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
        return true;
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
    return false;
  }

  // True if a saved game exists in this browser.
  hasSave() {
    try {
      return !!localStorage.getItem('son_of_jesse_save');
    } catch (e) {
      return false;
    }
  }

  // Record the active chapter scene and persist — call at the start of each
  // chapter so "Continue" resumes from that chapter with all progress so far.
  checkpoint(sceneKey, chapter, chapterName) {
    this.state.currentScene = sceneKey;
    if (chapter != null) this.state.chapter = chapter;
    if (chapterName) this.state.chapterName = chapterName;
    this.save();
  }

  reset() {
    this.state = { ...DEFAULT_STATE };
    try {
      localStorage.removeItem('son_of_jesse_save');
    } catch (e) {
      console.warn('Save clear failed:', e);
    }
  }
}

// Export as singleton
export const gameState = new GameState();
export default gameState;
