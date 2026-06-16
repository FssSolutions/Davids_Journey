// DialogueScene.js
// Renders branching dialogue with scripture callouts, portrait, and choices.

import DIALOGUES from '../data/DialogueData.js';
import SCRIPTURES from '../data/ScriptureData.js';
import gameState from '../systems/GameState.js';

const PANEL_HEIGHT = 200;
const PANEL_COLOR = 0x0e0905;
const BORDER_COLOR = 0xc9a84c;
const TEXT_COLOR = '#f0e8d0';
const SPEAKER_COLOR = '#c9a84c';
const SCRIPTURE_COLOR = '#ffe88a';

export default class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene' });
    this.currentNode = null;
    this.dialogue = null;
    this.callerScene = null;
    this.elements = [];
  }

  init(data) {
    this.dialogueId = data.dialogueId;
    this.callerScene = data.callerScene;
    this.dialogue = DIALOGUES[data.dialogueId];
    this.currentNode = this.dialogue?.nodes.find(n => n.id === 'start');
    this._pendingEmit = null;
  }

  create() {
    const { width, height } = this.scale;

    // Dim overlay
    this.overlay = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.45
    ).setDepth(0);

    // Panel background
    this.panelY = height - PANEL_HEIGHT;
    this.panel = this.add.graphics().setDepth(1);
    this.drawPanel(width, height);

    // Speaker name
    this.speakerText = this.add.text(
      28, this.panelY + 16,
      '',
      { fontFamily: 'Georgia', fontSize: '14px', color: SPEAKER_COLOR, fontStyle: 'bold' }
    ).setDepth(2);

    // Dialogue body text
    this.bodyText = this.add.text(
      28, this.panelY + 38,
      '',
      {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: TEXT_COLOR,
        wordWrap: { width: width - 60 },
        lineSpacing: 4
      }
    ).setDepth(2);

    // Scripture callout box (hidden by default)
    this.scriptureBox = this.add.graphics().setDepth(2).setAlpha(0);
    this.scriptureRef = this.add.text(
      width / 2, this.panelY + 90,
      '',
      { fontFamily: 'Georgia', fontSize: '11px', color: '#c9a84c', fontStyle: 'italic' }
    ).setOrigin(0.5).setDepth(3).setAlpha(0);
    this.scriptureText = this.add.text(
      width / 2, this.panelY + 108,
      '',
      {
        fontFamily: 'Georgia',
        fontSize: '13px',
        color: SCRIPTURE_COLOR,
        wordWrap: { width: width - 120 },
        align: 'center',
        lineSpacing: 3
      }
    ).setOrigin(0.5, 0).setDepth(3).setAlpha(0);

    // Continue indicator
    this.continueArrow = this.add.text(
      width - 28, height - 18,
      '▼ Continue',
      { fontFamily: 'Georgia', fontSize: '11px', color: '#8a7a60' }
    ).setOrigin(1, 1).setDepth(2);

    this.tweens.add({
      targets: this.continueArrow,
      alpha: { from: 1, to: 0.3 },
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // Portrait
    this._portraitImage = null;
    this._portraitBgGraphics = null;
    this._portraitActive = false;
    if (this.game.registry.get('useRealSprites')) {
      this._portraitBgGraphics = this.add.graphics().setDepth(2);
    }

    // Choice buttons container
    this.choiceButtons = [];

    // Advance on click / space / enter
    this.input.on('pointerdown', this.advance, this);
    this.input.keyboard.on('keydown-SPACE', this.advance, this);
    this.input.keyboard.on('keydown-ENTER', this.advance, this);

    // Render first node
    this.renderNode(this.currentNode);

    // Animate panel in
    this.tweens.add({
      targets: [this.panel, this.speakerText, this.bodyText],
      y: `-=${PANEL_HEIGHT * 0.05}`,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  drawPanel(width, height) {
    this.panel.clear();

    // Panel shadow
    this.panel.fillStyle(0x000000, 0.5);
    this.panel.fillRoundedRect(8, this.panelY + 4, width - 16, PANEL_HEIGHT - 4, 6);

    // Panel body
    this.panel.fillStyle(PANEL_COLOR, 0.97);
    this.panel.fillRoundedRect(6, this.panelY, width - 12, PANEL_HEIGHT, 6);

    // Gold border
    this.panel.lineStyle(1.5, BORDER_COLOR, 0.8);
    this.panel.strokeRoundedRect(6, this.panelY, width - 12, PANEL_HEIGHT, 6);

    // Top accent line
    this.panel.lineStyle(1, BORDER_COLOR, 0.3);
    this.panel.lineBetween(30, this.panelY + 32, width - 30, this.panelY + 32);
  }

  renderNode(node) {
    if (!node) {
      this.endDialogue();
      return;
    }

    this._updatePortrait(node.portrait ?? null);
    this.clearChoices();
    this.hideScripture();

    this.speakerText.setText(node.speaker || '');
    this.bodyText.setText('');

    // Typewriter effect
    let charIndex = 0;
    const fullText = node.text;
    if (this._typeTimer) this._typeTimer.remove();
    this._typeTimer = this.time.addEvent({
      delay: 28,
      repeat: fullText.length - 1,
      callback: () => {
        charIndex++;
        this.bodyText.setText(fullText.substring(0, charIndex));
      }
    });

    // Show scripture callout if this node references one
    if (node.scriptureId) {
      this.time.delayedCall(fullText.length * 28 + 200, () => {
        this.showScripture(node.scriptureId);
      });
    }

    // Show choices if this is a branch node
    if (node.choices?.length) {
      this.continueArrow.setAlpha(0);
      this.time.delayedCall(fullText.length * 28 + 400, () => {
        this.renderChoices(node.choices);
      });
    } else {
      this.continueArrow.setAlpha(1);
    }

    this.currentNode = node;
  }

  renderChoices(choices) {
    const { width, height } = this.scale;
    const startY = this.panelY + 38;
    const choiceX = this._portraitActive ? 118 : 36;

    // Push main text up
    this.bodyText.setY(this.panelY + 22);

    choices.forEach((choice, i) => {
      const btn = this.add.text(
        choiceX,
        startY + i * 36,
        `${i + 1}.  ${choice.text}`,
        {
          fontFamily: 'Georgia',
          fontSize: '13px',
          color: choice.isWrong ? '#8a6a6a' : '#d4c4a0',
          wordWrap: { width: width - choiceX - 36 }
        }
      ).setDepth(3).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        if (!choice.isWrong) btn.setColor('#c9a84c');
        btn.setX(choiceX + 8);
      });
      btn.on('pointerout', () => {
        btn.setColor(choice.isWrong ? '#8a6a6a' : '#d4c4a0');
        btn.setX(choiceX);
      });
      btn.on('pointerdown', () => this.selectChoice(choice));

      // Keyboard shortcut
      this.input.keyboard.once(`keydown-${i + 1}`, () => this.selectChoice(choice));

      this.choiceButtons.push(btn);
    });
  }

  selectChoice(choice) {
    // Apply heart effect
    if (choice.heartEffect) {
      gameState.adjustHeart(choice.heartEffect);
    }

    // Handle wrong answer teaching moment
    if (choice.isWrong) {
      this.showTeachingMoment(choice.wrongReason, () => {
        // Re-render same node for retry
        this.renderNode(this.currentNode);
      });
      return;
    }

    // Track correct scripture answer
    if (choice.scriptureId) {
      gameState.addToCodex(choice.scriptureId);
      gameState.recordScriptureAnswer(true);
    }

    // Unlock ability if any
    if (choice.unlocksAbility) {
      gameState.unlockAbility(choice.unlocksAbility);
      this.showAbilityUnlock(choice.unlocksAbility);
      return;
    }

    // Advance to next node
    const nextNode = this.dialogue.nodes.find(n => n.id === choice.next);
    this.renderNode(nextNode);
  }

  showScripture(scriptureId) {
    const { width } = this.scale;

    // Find in any scripture category
    const allScriptures = [
      ...SCRIPTURES.story,
      ...SCRIPTURES.combat
    ];
    const scripture = allScriptures.find(s => s.id === scriptureId);
    if (!scripture) return;

    // Draw callout box
    const boxH = 60;
    const boxY = this.panelY + 80;
    this.scriptureBox.clear();
    this.scriptureBox.fillStyle(0x1a1205, 0.95);
    this.scriptureBox.fillRoundedRect(16, boxY, width - 32, boxH, 4);
    this.scriptureBox.lineStyle(1, 0xc9a84c, 0.5);
    this.scriptureBox.strokeRoundedRect(16, boxY, width - 32, boxH, 4);

    this.scriptureRef.setY(boxY + 10).setText(`— ${scripture.reference}`);
    this.scriptureText.setY(boxY + 26).setText(`"${scripture.shortText || scripture.fullText}"`);

    this.tweens.add({
      targets: [this.scriptureBox, this.scriptureRef, this.scriptureText],
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeIn'
    });

    // Add to codex
    gameState.addToCodex(scriptureId);
  }

  hideScripture() {
    this.scriptureBox.setAlpha(0);
    this.scriptureRef.setAlpha(0);
    this.scriptureText.setAlpha(0);
  }

  showTeachingMoment(reason, onDone) {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(
      width / 2, height / 2,
      width - 80, 120,
      0x1a0505, 1
    ).setDepth(10).setStrokeStyle(1, 0xc03030);

    const title = this.add.text(
      width / 2, height / 2 - 28,
      '📖 Not quite right...',
      { fontFamily: 'Georgia', fontSize: '13px', color: '#ff8888' }
    ).setOrigin(0.5).setDepth(11);

    const msg = this.add.text(
      width / 2, height / 2 + 2,
      reason,
      {
        fontFamily: 'Georgia', fontSize: '12px', color: '#d4c0a0',
        wordWrap: { width: width - 140 }, align: 'center'
      }
    ).setOrigin(0.5).setDepth(11);

    const ok = this.add.text(
      width / 2, height / 2 + 38,
      '[ OK — try again ]',
      { fontFamily: 'Georgia', fontSize: '12px', color: '#c9a84c' }
    ).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    ok.on('pointerdown', () => {
      [bg, title, msg, ok].forEach(e => e.destroy());
      gameState.recordScriptureAnswer(false);
      this.clearChoices();
      onDone();
    });
  }

  showAbilityUnlock(abilityId) {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(
      width / 2, height / 2,
      320, 120,
      0x0a0e05, 1
    ).setDepth(10).setStrokeStyle(1.5, 0xc9a84c);

    const star = this.add.text(
      width / 2, height / 2 - 32,
      '✦ ABILITY UNLOCKED ✦',
      { fontFamily: 'Georgia', fontSize: '12px', color: '#c9a84c', letterSpacing: 4 }
    ).setOrigin(0.5).setDepth(11);

    const name = this.add.text(
      width / 2, height / 2 - 6,
      abilityId.replace(/_/g, ' ').toUpperCase(),
      { fontFamily: 'Georgia', fontSize: '20px', color: '#f5e6c0' }
    ).setOrigin(0.5).setDepth(11);

    const sub = this.add.text(
      width / 2, height / 2 + 26,
      'Tap to continue',
      { fontFamily: 'Georgia', fontSize: '11px', color: '#8a7a60' }
    ).setOrigin(0.5).setDepth(11);

    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => {
        [bg, star, name, sub].forEach(e => e.destroy());
        const nextNode = this.dialogue.nodes.find(
          n => n.id === this.currentNode.choices?.find(c => c.unlocksAbility === abilityId)?.next
        );
        this.renderNode(nextNode);
      });
    });
  }

  advance() {
    // If typewriter is still going, complete it
    if (this._typeTimer && this._typeTimer.getRepeatCount() > 0) {
      this._typeTimer.remove();
      this.bodyText.setText(this.currentNode.text);
      return;
    }

    // If there are choices, don't advance — wait for player to pick
    if (this.currentNode?.choices?.length) return;

    if (this.currentNode?.next) {
      const nextNode = this.dialogue.nodes.find(n => n.id === this.currentNode.next);
      if (this.currentNode.trigger) {
        this.handleTrigger(this.currentNode.trigger);
      }
      this.renderNode(nextNode);
    } else {
      // Terminal node — fire any triggers, then end
      if (this.currentNode?.trigger) {
        const selfEnded = this.handleTrigger(this.currentNode.trigger);
        if (!selfEnded) {
          if (this.currentNode?.trigger2) {
            this.handleTrigger(this.currentNode.trigger2);
          }
          this.endDialogue();
        }
      } else {
        this.endDialogue();
      }
    }
  }

  // Returns true if the trigger itself calls endDialogue (caller must not call it again)
  handleTrigger(trigger) {
    switch (trigger) {
      case 'unlock_psalm_23':
        gameState.unlockPsalm('psalm_23');
        gameState.setFlag('anointed');
        return false;
      case 'unlock_psalm_27':
        gameState.unlockPsalm('psalm_27');
        return false;
      case 'start_goliath_cinematic':
        // Emit AFTER the caller scene resumes (see endDialogue); a delayedCall on
        // this scene's clock would be lost when the scene stops mid-fade.
        this._pendingEmit = 'beginGoliathCinematic';
        this.endDialogue();
        return true;
      case 'begin_stone_gathering':
        this._pendingEmit = 'beginStoneGathering';
        this.endDialogue();
        return true;
      case 'heart_meter_major_increase':
        gameState.adjustHeart(15);
        return false;
      case 'covenant_with_jonathan':
        gameState.setFlag('jonathanCovenant', true);
        return false;
      default:
        return false;
    }
  }

  clearChoices() {
    this.choiceButtons.forEach(btn => btn.destroy());
    this.choiceButtons = [];
    this.input.keyboard.removeAllListeners('keydown-1');
    this.input.keyboard.removeAllListeners('keydown-2');
    this.input.keyboard.removeAllListeners('keydown-3');
    this.bodyText.setY(this.panelY + 38);
    this.continueArrow.setAlpha(1);
  }

  _updatePortrait(key) {
    if (!key || !this.game.registry.get('useRealSprites')) {
      this._hidePortrait();
      return;
    }
    const texKey = `portrait_${key}`;
    if (!this.textures.exists(texKey)) {
      this._hidePortrait();
      return;
    }
    this._portraitActive = true;
    if (this._portraitBgGraphics) {
      this._portraitBgGraphics.clear();
      this._portraitBgGraphics.fillStyle(0x0e0905, 0.97);
      this._portraitBgGraphics.fillRoundedRect(10, this.panelY + 8, 90, PANEL_HEIGHT - 16, 4);
      this._portraitBgGraphics.lineStyle(1.5, BORDER_COLOR, 0.7);
      this._portraitBgGraphics.strokeRoundedRect(10, this.panelY + 8, 90, PANEL_HEIGHT - 16, 4);
    }
    if (this._portraitImage) this._portraitImage.destroy();
    this._portraitImage = this.add.image(55, this.panelY + PANEL_HEIGHT / 2, texKey)
      .setDepth(3).setOrigin(0.5);
    const scaleX = 86 / this._portraitImage.width;
    const scaleY = (PANEL_HEIGHT - 20) / this._portraitImage.height;
    this._portraitImage.setScale(Math.min(scaleX, scaleY));
    this._shiftText(true);
  }

  _hidePortrait() {
    this._portraitActive = false;
    if (this._portraitBgGraphics) this._portraitBgGraphics.clear();
    if (this._portraitImage) { this._portraitImage.destroy(); this._portraitImage = null; }
    this._shiftText(false);
  }

  _shiftText(hasPortrait) {
    const { width } = this.scale;
    const x = hasPortrait ? 112 : 28;
    const wrapWidth = hasPortrait ? width - 132 : width - 60;
    this.speakerText.setX(x);
    this.bodyText.setX(x);
    this.bodyText.setWordWrapWidth(wrapWidth);
  }

  endDialogue() {
    if (this.dialogueId) {
      gameState.completeBeat(this.dialogueId);
    }

    const fadeTargets = [this.panel, this.speakerText, this.bodyText, this.overlay];
    if (this._portraitBgGraphics) fadeTargets.push(this._portraitBgGraphics);
    if (this._portraitImage) fadeTargets.push(this._portraitImage);

    this.tweens.add({
      targets: fadeTargets,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.scene.stop('DialogueScene');
        if (this.callerScene) {
          this.scene.resume(this.callerScene);
        }
        // Fire any queued signal on the persistent game emitter, after the
        // caller scene is active again so its handler runs in the right state.
        if (this._pendingEmit) {
          const ev = this._pendingEmit;
          this._pendingEmit = null;
          this.game.events.emit(ev);
        }
      }
    });
  }
}
