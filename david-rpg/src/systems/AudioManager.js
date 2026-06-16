// AudioManager.js — Web Audio API sound engine (no external libraries)

class AudioManager {
  constructor() {
    this._ctx = null;
    this._ambientNodes = null;
    this._combatActive = false;
    this._combatLoop = null;
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  // ── Overworld ambient — shared fade helper ──
  _startAmbient(osc1Type, osc1Freq, osc2Type, osc2Freq, osc2Vol, lfoFreq, lfoDepth, masterVol, fadeIn) {
    this.stopAmbient();
    const ctx = this._getCtx();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(masterVol, ctx.currentTime + fadeIn);
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = osc1Type;
    osc1.frequency.value = osc1Freq;
    osc1.connect(gain);
    osc1.start();

    const osc2 = ctx.createOscillator();
    osc2.type = osc2Type;
    osc2.frequency.value = osc2Freq;
    const g2 = ctx.createGain();
    g2.gain.value = osc2Vol;
    osc2.connect(g2);
    g2.connect(gain);
    osc2.start();

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = lfoFreq;
    const lfoG = ctx.createGain();
    lfoG.gain.value = lfoDepth;
    lfo.connect(lfoG);
    lfoG.connect(osc1.frequency);
    lfo.start();

    this._ambientNodes = { gain, osc1, osc2, lfo };
  }

  // Bethlehem — pastoral shepherd drone (A3 triangle + E4 fifth, slow pitch breath)
  playAmbientPastoral() {
    this._startAmbient('triangle', 220, 'sine', 330, 0.35, 0.12, 1.5, 0.055, 3);
  }

  // Valley of Elah — tense dissonance (C2 bass + C#2 minor 2nd)
  playAmbientTension() {
    this._startAmbient('sawtooth', 65, 'sine', 69, 0.5, 0.25, 3, 0.06, 2);
  }

  // Saul's Court — stately 4th interval (D3 + G3 triangle)
  playAmbientRegal() {
    this._startAmbient('triangle', 146.8, 'triangle', 196, 0.6, 0.1, 1, 0.05, 3);
  }

  // En Gedi cave — eerie low rumble with dissonant overtone (A1 + F#3)
  playAmbientCave() {
    this._startAmbient('sawtooth', 55, 'sine', 184, 0.25, 0.08, 0.8, 0.045, 4);
  }

  // Legacy alias kept for any callers
  playAmbientDesert() { this.playAmbientTension(); }

  stopAmbient() {
    if (!this._ambientNodes) return;
    const ctx = this._getCtx();
    const { gain, osc1, osc2, lfo } = this._ambientNodes;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => { try { osc1.stop(); osc2.stop(); lfo.stop(); } catch (_) {} }, 1600);
    this._ambientNodes = null;
  }

  // ── Combat percussion beat ──
  playCombatMusic() {
    this.stopAmbient();
    this.stopCombatMusic();
    const ctx = this._getCtx();

    const hit = (time, freq, dur, vol) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(time);
      o.stop(time + dur + 0.01);
    };

    const beat = 60 / 130; // 130 bpm
    const start = ctx.currentTime + 0.05;
    const bars = 4;

    for (let i = 0; i < bars * 4; i++) {
      const t = start + i * beat;
      if (i % 4 === 0)         hit(t, 75,  0.25, 0.18); // bass drum on 1
      if (i % 4 === 2)         hit(t, 60,  0.18, 0.12); // bass drum on 3
      if (i % 2 === 1)         hit(t, 200, 0.07, 0.07); // snare on 2 & 4
      if (i % 8 === 0)         hit(t, 110, beat * 1.8, 0.05); // tension drone
    }

    this._combatActive = true;
    this._combatLoop = setTimeout(() => {
      if (this._combatActive) this.playCombatMusic();
    }, bars * 4 * beat * 1000 + 60);
  }

  stopCombatMusic() {
    this._combatActive = false;
    if (this._combatLoop) { clearTimeout(this._combatLoop); this._combatLoop = null; }
  }

  // ── Scripture correct — triumphant C major arpeggio ──
  playScriptureCorrect() {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    [261.6, 329.6, 392, 523.2].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const on = t + i * 0.06;
      g.gain.setValueAtTime(0, on);
      g.gain.linearRampToValueAtTime(0.1, on + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, on + 1.0);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(on);
      o.stop(on + 1.1);
    });
  }

  // ── Hit impact ──
  playHit() {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.2);
  }

  // ── Heart meter gain — A major arpeggio ──
  playHeartUp() {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    [440, 554.4, 659.3].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const on = t + i * 0.08;
      g.gain.setValueAtTime(0, on);
      g.gain.linearRampToValueAtTime(0.08, on + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, on + 0.7);
      o.connect(g); g.connect(ctx.destination);
      o.start(on); o.stop(on + 0.8);
    });
  }
}

export default new AudioManager();
