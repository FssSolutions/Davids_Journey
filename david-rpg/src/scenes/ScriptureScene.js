// ScriptureScene.js
// Scripture memory mini-game — fill in the blanks to unlock abilities.
// Fast, rewarding, never punishing. Learning through repetition and play.

import SCRIPTURES from '../data/ScriptureData.js';
import gameState from '../systems/GameState.js';
import audioManager from '../systems/AudioManager.js';

export default class ScriptureScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ScriptureScene' });
  }

  init(data) {
    this.scriptureId = data.scriptureId;
    this.onSuccess = data.onSuccess;
    this.callerScene = data.callerScene;

    // Find the scripture
    const all = [...SCRIPTURES.combat, ...SCRIPTURES.memory];
    this.scripture = all.find(s => s.id === this.scriptureId);
  }

  create() {
    const { width, height } = this.scale;

    // Dim background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(0);

    // Card
    const cardW = width - 80;
    const cardH = 340;
    const cardX = 40;
    const cardY = (height - cardH) / 2;

    const card = this.add.graphics().setDepth(1);
    card.fillStyle(0x0e0a05, 0.98);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 10);
    card.lineStyle(1.5, 0xc9a84c, 0.8);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 10);

    // Header
    this.add.text(width / 2, cardY + 22, '📖 SCRIPTURE MEMORY', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#c9a84c',
      letterSpacing: 5
    }).setOrigin(0.5).setDepth(2);

    this.add.text(width / 2, cardY + 42, this.scripture.reference, {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#f5e6c0',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(2);

    // Divider
    const div = this.add.graphics().setDepth(2);
    div.lineStyle(1, 0xc9a84c, 0.3);
    div.lineBetween(cardX + 30, cardY + 58, cardX + cardW - 30, cardY + 58);

    // Verse with blanks
    if (this.scripture.blanks) {
      this.renderFillInBlanks(cardX, cardY, cardW, cardH);
    } else {
      this.renderRecognition(cardX, cardY, cardW, cardH);
    }

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  renderFillInBlanks(cardX, cardY, cardW, cardH) {
    const { width, height } = this.scale;

    // Show full verse with blanked-out words
    const blanks = this.scripture.blanks;
    let displayText = this.scripture.fullText;

    blanks.forEach(blank => {
      const underline = '_'.repeat(blank.length);
      displayText = displayText.replace(blank, `[${underline}]`);
    });

    this.add.text(width / 2, cardY + 90, displayText, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#d4c4a0',
      wordWrap: { width: cardW - 60 },
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5, 0).setDepth(2);

    // Word bank — shuffled
    this.add.text(width / 2, cardY + 200, 'Tap the missing words in order:', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#8a7a60',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(2);

    // Build shuffled word options (correct + decoys)
    const decoys = ['peace', 'glory', 'power', 'wisdom', 'mercy', 'grace'];
    const allWords = [...blanks];
    while (allWords.length < 6) {
      const decoy = decoys[Phaser.Math.Between(0, decoys.length - 1)];
      if (!allWords.includes(decoy)) allWords.push(decoy);
    }
    Phaser.Utils.Array.Shuffle(allWords);

    this.answersGiven = [];
    this.wordButtons = [];

    const cols = 3;
    const btnW = (cardW - 60) / cols;
    allWords.forEach((word, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = cardX + 30 + col * btnW + btnW / 2;
      const by = cardY + 238 + row * 38;

      const btn = this.add.text(bx, by, word, {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#f0e8d0',
        backgroundColor: '#1a1205',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#c9a84c').setScale(1.05));
      btn.on('pointerout',  () => btn.setColor('#f0e8d0').setScale(1.0));
      btn.on('pointerdown', () => this.selectWord(word, btn, blanks));

      this.wordButtons.push({ btn, word });
    });

    // Answer slots
    this.answerSlots = blanks.map((blank, i) => {
      const slot = this.add.text(
        cardX + 30 + i * (cardW / blanks.length) + cardW / (blanks.length * 2),
        cardY + 170,
        '___',
        { fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c' }
      ).setOrigin(0.5).setDepth(2);
      return slot;
    });
  }

  selectWord(word, btn, blanks) {
    if (this.answersGiven.length >= blanks.length) return;

    const expectedWord = blanks[this.answersGiven.length];

    if (word === expectedWord) {
      // Correct!
      this.answersGiven.push(word);
      btn.setColor('#4caf50').setInteractive(false);
      this.answerSlots[this.answersGiven.length - 1].setText(word).setColor('#4caf50');

      if (this.answersGiven.length === blanks.length) {
        this.onMemorySuccess();
      }
    } else {
      // Wrong — brief red flash, then allow retry
      gameState.recordScriptureAnswer(false);
      btn.setColor('#c03030');
      this.time.delayedCall(400, () => btn.setColor('#f0e8d0'));
      this.cameras.main.shake(150, 0.005);
    }
  }

  renderRecognition(cardX, cardY, cardW, cardH) {
    // Alternative: show 3 references, player picks which matches the verse shown
    const { width } = this.scale;

    this.add.text(width / 2, cardY + 80, `"${this.scripture.shortText}"`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#ffe88a',
      wordWrap: { width: cardW - 60 },
      align: 'center',
      lineSpacing: 6,
      fontStyle: 'italic'
    }).setOrigin(0.5, 0).setDepth(2);

    this.add.text(width / 2, cardY + 175, 'Which verse is this?', {
      fontFamily: 'Georgia', fontSize: '13px', color: '#8a7a60'
    }).setOrigin(0.5).setDepth(2);

    // Build options
    const fakeRefs = ['Psalm 46:10', 'Proverbs 3:5', 'Isaiah 41:10'];
    const refs = [this.scripture.reference, ...fakeRefs.slice(0, 2)];
    Phaser.Utils.Array.Shuffle(refs);

    refs.forEach((ref, i) => {
      const btn = this.add.text(
        width / 2,
        cardY + 210 + i * 38,
        ref,
        {
          fontFamily: 'Georgia',
          fontSize: '15px',
          color: '#d4c4a0',
          backgroundColor: '#1a1205',
          padding: { x: 20, y: 8 }
        }
      ).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#c9a84c'));
      btn.on('pointerout',  () => btn.setColor('#d4c4a0'));
      btn.on('pointerdown', () => {
        if (ref === this.scripture.reference) {
          gameState.recordScriptureAnswer(true);
          btn.setColor('#4caf50');
          this.time.delayedCall(600, () => this.onMemorySuccess());
        } else {
          gameState.recordScriptureAnswer(false);
          btn.setColor('#c03030');
          this.time.delayedCall(300, () => btn.setColor('#d4c4a0'));
        }
      });
    });
  }

  onMemorySuccess() {
    const { width, height } = this.scale;

    audioManager.playScriptureCorrect();

    // Unlock the ability
    if (this.onSuccess === 'unlock_faith_strike') {
      gameState.unlockAbility('faith_strike');
    }
    gameState.addToCodex(this.scriptureId);
    gameState.recordScriptureAnswer(true);

    // Success flash
    const flash = this.add.rectangle(
      width / 2, height / 2,
      width, height, 0xc9a84c, 0.15
    ).setDepth(10);
    this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

    const msg = this.add.text(width / 2, height / 2, '✓ Committed to Memory!', {
      fontFamily: 'Georgia',
      fontSize: '26px',
      color: '#c9a84c',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    this.tweens.add({ targets: msg, alpha: 1, y: height / 2 - 10, duration: 400 });

    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('ScriptureScene');
        if (this.callerScene) {
          this.scene.resume(this.callerScene);
        }
      });
    });
  }
}
