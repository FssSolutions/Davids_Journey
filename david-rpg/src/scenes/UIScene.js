// UIScene.js
// Persistent HUD — runs on top of all gameplay scenes.
// Shows: health bar, heart meter, active abilities, scripture codex count.

import gameState from '../systems/GameState.js';
import SCRIPTURES from '../data/ScriptureData.js';
import { touchInput } from '../systems/TouchInput.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.elements = {};

    // ── Health Bar (top left) ──
    this.buildHealthBar(width, height);

    // ── Heart Meter (top center) ──
    this.buildHeartMeter(width, height);

    // ── Ability icons (bottom right) ──
    this.buildAbilityBar(width, height);

    // ── Codex counter (top right) ──
    this.buildCodexCounter(width, height);

    // ── Listen for state changes ──
    gameState.on('healthChanged', () => this.refreshHealth());
    gameState.on('heartChanged', () => this.refreshHeart());
    gameState.on('abilityUnlocked', () => this.refreshAbilities());
    gameState.on('codexUpdated', () => this.refreshCodex());

    // Initial render
    this.refreshHealth();
    this.refreshHeart();
    this.refreshCodex();

    // ── Psalm Journal ──
    this._psalmJournalOpen = false;
    this._psalmOverlay = null;
    this.input.keyboard.on('keydown-P', () => this.togglePsalmJournal());

    // ── ESC Menu ──
    this._pauseMenuOpen = false;
    this._pauseOverlay = null;
    this.input.keyboard.on('keydown-ESC', () => this.togglePauseMenu());

    // ── Inventory ──
    this._inventoryOpen = false;
    this._inventoryOverlay = null;
    this.input.keyboard.on('keydown-I', () => this.toggleInventory());

    // ── Touch controls ──
    this.buildTouchControls(width, height);
  }

  buildHealthBar(width, height) {
    const x = 16;
    const y = 14;

    // Label
    this.add.text(x, y, 'HP', {
      fontFamily: 'Georgia', fontSize: '11px', color: '#8a7a60'
    }).setScrollFactor(0).setDepth(100);

    // Background
    this.elements.hpBg = this.add.rectangle(
      x + 26 + 80, y + 5, 160, 10, 0x2a1a1a
    ).setScrollFactor(0).setDepth(100);

    // Bar fill
    this.elements.hpBar = this.add.rectangle(
      x + 26, y + 5, 160, 10, 0x27ae60
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

    // Text
    this.elements.hpText = this.add.text(x + 26 + 160 + 6, y, '', {
      fontFamily: 'Georgia', fontSize: '11px', color: '#8aaa8a'
    }).setScrollFactor(0).setDepth(101);
  }

  buildHeartMeter(width, height) {
    const cx = width / 2;
    const y = 14;

    // Label
    this.add.text(cx, y, '❤ Heart', {
      fontFamily: 'Georgia', fontSize: '11px', color: '#c9a84c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Background bar
    this.elements.heartBg = this.add.rectangle(
      cx, y + 14, 140, 8, 0x2a1a0a
    ).setScrollFactor(0).setDepth(100);

    // Heart fill
    this.elements.heartBar = this.add.rectangle(
      cx - 70, y + 14, 140, 8, 0xc9a84c
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

    // Level label
    this.elements.heartLevel = this.add.text(cx, y + 24, '', {
      fontFamily: 'Georgia', fontSize: '9px', color: '#8a7a60', fontStyle: 'italic'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  buildAbilityBar(width, height) {
    // Rendered dynamically in refreshAbilities
    this.elements.abilityContainer = [];
  }

  buildCodexCounter(width, height) {
    this.elements.codexText = this.add.text(
      width - 14, 14,
      '📖 0 verses',
      { fontFamily: 'Georgia', fontSize: '11px', color: '#8a7a60' }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    this.elements.codexText.setInteractive({ useHandCursor: true });
    this.elements.codexText.on('pointerover', () =>
      this.elements.codexText.setColor('#c9a84c')
    );
    this.elements.codexText.on('pointerout', () =>
      this.elements.codexText.setColor('#8a7a60')
    );
    this.elements.codexText.on('pointerdown', () => this.toggleCodex());

    // ── Codex state ──
    this._codexOpen = false;
    this._codexOverlay = null;
  }

  refreshHealth() {
    const { health, maxHealth } = gameState.get();
    const pct = health / maxHealth;

    this.elements.hpBar.width = 160 * pct;
    this.elements.hpText.setText(`${health}/${maxHealth}`);

    // Color shift based on HP
    const color = pct > 0.6 ? 0x27ae60 : pct > 0.3 ? 0xf39c12 : 0xc0392b;
    this.elements.hpBar.setFillStyle(color);
  }

  refreshHeart() {
    const { heartMeter } = gameState.get();
    const pct = heartMeter / 100;

    this.elements.heartBar.width = 140 * pct;
    this.elements.heartBar.setFillStyle(gameState.getHeartColor());
    this.elements.heartLevel.setText(gameState.getHeartLevel().toUpperCase());

    // Pulse on change
    this.tweens.add({
      targets: this.elements.heartBar,
      scaleY: 1.4,
      duration: 200,
      yoyo: true
    });
  }

  refreshAbilities() {
    // Clear old icons
    this.elements.abilityContainer.forEach(el => el.destroy());
    this.elements.abilityContainer = [];

    const { abilities } = gameState.get();
    const { width, height } = this.scale;

    const abilityLabels = {
      faith_strike: '⚡',
      shield:       '🛡',
      reveal_map:   '👁',
      player_heal:  '💚',
      player_speed_buff: '🦅',
    };

    abilities.forEach((id, i) => {
      const icon = this.add.text(
        width - 14 - i * 34, height - 14,
        abilityLabels[id] || '✦',
        { fontSize: '20px' }
      ).setOrigin(1, 1).setScrollFactor(0).setDepth(100);

      this.elements.abilityContainer.push(icon);
    });
  }

  refreshCodex() {
    const count = gameState.get().codex.length;
    this.elements.codexText.setText(`📖 ${count} verse${count !== 1 ? 's' : ''}`);
  }

  togglePsalmJournal() {
    if (this._psalmJournalOpen) {
      this.closePsalmJournal();
    } else {
      this.buildPsalmJournal();
    }
  }

  closePsalmJournal() {
    if (this._psalmOverlay) {
      this._psalmOverlay.forEach(el => el.destroy());
      this._psalmOverlay = null;
    }
    this._psalmJournalOpen = false;
    this.input.keyboard.removeListener('keydown-ESC', this._escHandler);
  }

  buildPsalmJournal() {
    const { width, height } = this.scale;
    const els = [];

    // Dim backdrop
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(150).setInteractive();
    els.push(backdrop);

    // Scroll parchment
    const scrollW = Math.min(560, width - 40);
    const scrollH = height - 80;
    const sx = width / 2;
    const sy = height / 2;

    const parchment = this.add.graphics().setScrollFactor(0).setDepth(151);
    parchment.fillStyle(0x2a1f0e, 0.97);
    parchment.fillRoundedRect(sx - scrollW / 2, sy - scrollH / 2, scrollW, scrollH, 8);
    parchment.lineStyle(2, 0xc9a84c, 0.8);
    parchment.strokeRoundedRect(sx - scrollW / 2, sy - scrollH / 2, scrollW, scrollH, 8);
    // Inner decorative border
    parchment.lineStyle(1, 0xc9a84c, 0.25);
    parchment.strokeRoundedRect(sx - scrollW / 2 + 8, sy - scrollH / 2 + 8, scrollW - 16, scrollH - 16, 6);
    els.push(parchment);

    // Title
    const title = this.add.text(sx, sy - scrollH / 2 + 22, '📖 Psalm Journal', {
      fontFamily: 'Georgia', fontSize: '18px', color: '#c9a84c', letterSpacing: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);
    els.push(title);

    const divider = this.add.graphics().setScrollFactor(0).setDepth(152);
    divider.lineStyle(1, 0xc9a84c, 0.4);
    divider.lineBetween(sx - scrollW / 2 + 24, sy - scrollH / 2 + 42, sx + scrollW / 2 - 24, sy - scrollH / 2 + 42);
    els.push(divider);

    const unlockedIds = gameState.get().psalms;
    const unlockedPsalms = SCRIPTURES.psalms.filter(p => unlockedIds.includes(p.id));

    if (unlockedPsalms.length === 0) {
      const empty = this.add.text(sx, sy, 'No Psalms unlocked yet.\nComplete story chapters to discover them.', {
        fontFamily: 'Georgia', fontSize: '14px', color: '#8a7a60',
        align: 'center', lineSpacing: 6
      }).setOrigin(0.5).setScrollFactor(0).setDepth(152);
      els.push(empty);
    } else {
      let yOff = sy - scrollH / 2 + 60;
      const lineH = 20;

      unlockedPsalms.forEach((psalm, idx) => {
        if (idx > 0) {
          const sep = this.add.graphics().setScrollFactor(0).setDepth(152);
          sep.lineStyle(1, 0x5a4a2a, 0.5);
          sep.lineBetween(sx - scrollW / 2 + 30, yOff - 6, sx + scrollW / 2 - 30, yOff - 6);
          els.push(sep);
        }

        const chLabel = this.add.text(sx - scrollW / 2 + 24, yOff, `Chapter ${psalm.unlockChapter}`, {
          fontFamily: 'Georgia', fontSize: '10px', color: '#8a7a60', fontStyle: 'italic'
        }).setScrollFactor(0).setDepth(152);
        els.push(chLabel);
        yOff += 16;

        const psalmTitle = this.add.text(sx - scrollW / 2 + 24, yOff, `Psalm ${psalm.number} — ${psalm.title}`, {
          fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c', fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(152);
        els.push(psalmTitle);
        yOff += 22;

        psalm.lines.forEach(line => {
          const lineText = this.add.text(sx - scrollW / 2 + 30, yOff, line, {
            fontFamily: 'Georgia', fontSize: '12px', color: '#f0e8d0',
            wordWrap: { width: scrollW - 60 }, lineSpacing: 2
          }).setScrollFactor(0).setDepth(152);
          els.push(lineText);
          yOff += lineH;
        });

        yOff += 10;

        const reflLabel = this.add.text(sx - scrollW / 2 + 30, yOff, '✦ Reflect:', {
          fontFamily: 'Georgia', fontSize: '10px', color: '#c9a84c'
        }).setScrollFactor(0).setDepth(152);
        els.push(reflLabel);
        yOff += 14;

        const refl = this.add.text(sx - scrollW / 2 + 30, yOff, psalm.reflectionQuestion, {
          fontFamily: 'Georgia', fontSize: '11px', color: '#a09070', fontStyle: 'italic',
          wordWrap: { width: scrollW - 60 }, lineSpacing: 3
        }).setScrollFactor(0).setDepth(152);
        els.push(refl);
        yOff += refl.height + 18;
      });
    }

    // Close hint
    const closeHint = this.add.text(sx, sy + scrollH / 2 - 18, '[P] or [ESC] Close', {
      fontFamily: 'Georgia', fontSize: '11px', color: '#5a4a30'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);
    els.push(closeHint);

    this._psalmOverlay = els;
    this._psalmJournalOpen = true;

    this._escHandler = () => this.closePsalmJournal();
    this.input.keyboard.once('keydown-ESC', this._escHandler);

    // Tap backdrop to close
    backdrop.on('pointerdown', () => this.closePsalmJournal());
  }

  // ── Scripture Codex Viewer ──

  toggleCodex() {
    if (this._codexOpen) {
      this.closeCodex();
    } else {
      this.buildCodexViewer();
    }
  }

  closeCodex() {
    if (this._codexOverlay) {
      this._codexOverlay.forEach(el => el.destroy());
      this._codexOverlay = null;
    }
    this._codexOpen = false;
  }

  buildCodexViewer() {
    const { width, height } = this.scale;
    const els = [];

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78)
      .setScrollFactor(0).setDepth(200).setInteractive();
    els.push(backdrop);

    const panelW = Math.min(600, width - 40);
    const panelH = height - 60;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.graphics().setScrollFactor(0).setDepth(201);
    panel.fillStyle(0x0b0805, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);
    panel.lineStyle(1.5, 0xc9a84c, 0.8);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);
    panel.lineStyle(1, 0xc9a84c, 0.2);
    panel.strokeRoundedRect(px - panelW / 2 + 7, py - panelH / 2 + 7, panelW - 14, panelH - 14, 6);
    els.push(panel);

    els.push(this.add.text(px, py - panelH / 2 + 20, '📖  SCRIPTURE CODEX', {
      fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c', letterSpacing: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

    const codexIds = gameState.get().codex;

    // Gather all scriptures from all arrays
    const allScriptures = [
      ...SCRIPTURES.story,
      ...SCRIPTURES.combat,
      ...SCRIPTURES.memory
    ];

    const unlocked = codexIds
      .map(id => allScriptures.find(s => s.id === id))
      .filter(Boolean);

    if (unlocked.length === 0) {
      els.push(this.add.text(px, py,
        'No verses recorded yet.\nEncounter scriptures in the story to fill this codex.', {
        fontFamily: 'Georgia', fontSize: '13px', color: '#5a4a30',
        fontStyle: 'italic', align: 'center', lineSpacing: 6
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202));
    } else {
      // Sub-header: count
      els.push(this.add.text(px, py - panelH / 2 + 38,
        `${unlocked.length} of ${allScriptures.length} verses discovered`, {
        fontFamily: 'Georgia', fontSize: '10px', color: '#5a4a30', fontStyle: 'italic'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

      const divider = this.add.graphics().setScrollFactor(0).setDepth(202);
      divider.lineStyle(1, 0xc9a84c, 0.3);
      divider.lineBetween(px - panelW / 2 + 22, py - panelH / 2 + 50, px + panelW / 2 - 22, py - panelH / 2 + 50);
      els.push(divider);

      let yOff = py - panelH / 2 + 62;
      const lx = px - panelW / 2 + 22;
      const textW = panelW - 44;

      unlocked.forEach((scripture, idx) => {
        if (idx > 0) {
          const sep = this.add.graphics().setScrollFactor(0).setDepth(202);
          sep.lineStyle(1, 0x3a2a10, 0.8);
          sep.lineBetween(lx, yOff - 4, lx + textW, yOff - 4);
          els.push(sep);
        }

        // Reference
        const refText = this.add.text(lx, yOff, scripture.reference, {
          fontFamily: 'Georgia', fontSize: '11px', color: '#c9a84c', fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(202);
        els.push(refText);
        yOff += 17;

        // Short text (the verse)
        const verseText = this.add.text(lx, yOff, `"${scripture.shortText || scripture.fullText}"`, {
          fontFamily: 'Georgia', fontSize: '12px', color: '#f0e8d0',
          fontStyle: 'italic', wordWrap: { width: textW }, lineSpacing: 3
        }).setScrollFactor(0).setDepth(202);
        els.push(verseText);
        yOff += verseText.height + 5;

        // Context note
        if (scripture.context) {
          const ctxText = this.add.text(lx, yOff, scripture.context, {
            fontFamily: 'Georgia', fontSize: '10px', color: '#7a6a4a',
            wordWrap: { width: textW }, lineSpacing: 2
          }).setScrollFactor(0).setDepth(202);
          els.push(ctxText);
          yOff += ctxText.height + 14;
        } else {
          yOff += 14;
        }
      });
    }

    els.push(this.add.text(px, py + panelH / 2 - 14, 'Click anywhere to close', {
      fontFamily: 'Georgia', fontSize: '10px', color: '#4a3a20'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

    backdrop.on('pointerdown', () => this.closeCodex());

    this._codexOverlay = els;
    this._codexOpen = true;
  }

  // ── Pause / ESC Menu ──

  togglePauseMenu() {
    if (this._inventoryOpen) { this.closeInventory(); return; }
    if (this._psalmJournalOpen) { this.closePsalmJournal(); return; }
    if (this._pauseMenuOpen) {
      this.closePauseMenu();
    } else {
      this.buildPauseMenu();
    }
  }

  closePauseMenu() {
    if (this._pauseOverlay) {
      this._pauseOverlay.forEach(el => el.destroy());
      this._pauseOverlay = null;
    }
    this._pauseMenuOpen = false;
  }

  buildPauseMenu() {
    const { width, height } = this.scale;
    const els = [];

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
      .setScrollFactor(0).setDepth(200).setInteractive();
    els.push(backdrop);

    const panelW = 380;
    const panelH = 420;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.graphics().setScrollFactor(0).setDepth(201);
    panel.fillStyle(0x0e0a05, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);
    panel.lineStyle(1.5, 0xc9a84c, 0.8);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);
    els.push(panel);

    els.push(this.add.text(px, py - panelH / 2 + 22, 'MENU', {
      fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c', letterSpacing: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

    // Controls list
    const controls = [
      ['WASD / Arrows', 'Move David'],
      ['E', 'Interact with NPCs'],
      ['P', 'Psalm Journal'],
      ['I', 'Inventory'],
      ['ESC', 'This menu'],
    ];

    let yOff = py - panelH / 2 + 58;
    controls.forEach(([key, desc]) => {
      els.push(this.add.text(px - 80, yOff, key, {
        fontFamily: 'Georgia', fontSize: '12px', color: '#c9a84c'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(202));
      els.push(this.add.text(px - 66, yOff, desc, {
        fontFamily: 'Georgia', fontSize: '12px', color: '#d4c4a0'
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(202));
      yOff += 22;
    });

    // Divider
    const div = this.add.graphics().setScrollFactor(0).setDepth(202);
    div.lineStyle(1, 0xc9a84c, 0.25);
    div.lineBetween(px - panelW / 2 + 24, yOff + 4, px + panelW / 2 - 24, yOff + 4);
    els.push(div);
    yOff += 18;

    // Resume button
    const resumeBtn = this.add.text(px, yOff, '[ Resume ]', {
      fontFamily: 'Georgia', fontSize: '14px', color: '#f0e8d0',
      backgroundColor: '#1a1205', padding: { x: 16, y: 6 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(202).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover', () => resumeBtn.setColor('#c9a84c'));
    resumeBtn.on('pointerout',  () => resumeBtn.setColor('#f0e8d0'));
    resumeBtn.on('pointerdown', () => this.closePauseMenu());
    els.push(resumeBtn);
    yOff += 44;

    // Save button
    const saveBtn = this.add.text(px, yOff, '[ Save Game ]', {
      fontFamily: 'Georgia', fontSize: '13px', color: '#8aaa8a',
      backgroundColor: '#050e05', padding: { x: 14, y: 5 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(202).setInteractive({ useHandCursor: true });
    saveBtn.on('pointerover', () => saveBtn.setColor('#4aca6a'));
    saveBtn.on('pointerout',  () => saveBtn.setColor('#8aaa8a'));
    saveBtn.on('pointerdown', () => {
      gameState.save();
      const flash = this.add.text(px, saveBtn.y - 20, '✦ Saved!', {
        fontFamily: 'Georgia', fontSize: '12px', color: '#4aca6a'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(203);
      this.tweens.add({ targets: flash, alpha: 0, y: flash.y - 16, duration: 1400, onComplete: () => flash.destroy() });
    });
    els.push(saveBtn);
    yOff += 44;

    // Load button
    const loadBtn = this.add.text(px, yOff, '[ Load Game ]', {
      fontFamily: 'Georgia', fontSize: '13px', color: '#8a8aaa',
      backgroundColor: '#05050e', padding: { x: 14, y: 5 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(202).setInteractive({ useHandCursor: true });
    loadBtn.on('pointerover', () => loadBtn.setColor('#6a8aca'));
    loadBtn.on('pointerout',  () => loadBtn.setColor('#8a8aaa'));
    loadBtn.on('pointerdown', () => {
      gameState.load();
      this.refreshHealth();
      this.refreshHeart();
      this.refreshCodex();
      this.refreshAbilities();
      this.closePauseMenu();
    });
    els.push(loadBtn);
    yOff += 44;

    // Quit to title
    const quitBtn = this.add.text(px, yOff, '[ Quit to Title ]', {
      fontFamily: 'Georgia', fontSize: '12px', color: '#8a6a6a',
      backgroundColor: '#0e0505', padding: { x: 12, y: 5 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(202).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerover', () => quitBtn.setColor('#c03030'));
    quitBtn.on('pointerout',  () => quitBtn.setColor('#8a6a6a'));
    quitBtn.on('pointerdown', () => {
      this.closePauseMenu();
      this.scene.stop('UIScene');
      this.scene.stop('ValleyScene');
      this.scene.stop('BethlehemScene');
      this.scene.stop('DialogueScene');
      this.scene.start('TitleScene');
    });
    els.push(quitBtn);

    els.push(this.add.text(px, py + panelH / 2 - 14, '[ESC] Close', {
      fontFamily: 'Georgia', fontSize: '10px', color: '#4a3a20'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

    backdrop.on('pointerdown', () => this.closePauseMenu());

    this._pauseOverlay = els;
    this._pauseMenuOpen = true;
  }

  // ── Inventory ──

  toggleInventory() {
    if (this._inventoryOpen) {
      this.closeInventory();
    } else {
      this.buildInventoryUI();
    }
  }

  closeInventory() {
    if (this._inventoryOverlay) {
      this._inventoryOverlay.forEach(el => el.destroy());
      this._inventoryOverlay = null;
    }
    this._inventoryOpen = false;
  }

  buildInventoryUI() {
    const { width, height } = this.scale;
    const els = [];

    const itemIcons = {
      smooth_stone: '🪨',
      staff:        '🪵',
      sling:        '⚡',
      faith_orb:    '✨',
      goliath_sword:'⚔',
    };
    const itemNames = {
      smooth_stone: 'Smooth Stone',
      staff:        'Shepherd\'s Staff',
      sling:        'Sling',
      faith_orb:    'Faith Orb',
      goliath_sword:'Sword of Goliath',
    };

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
      .setScrollFactor(0).setDepth(200).setInteractive();
    els.push(backdrop);

    const panelW = 400;
    const panelH = 320;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.graphics().setScrollFactor(0).setDepth(201);
    panel.fillStyle(0x0e0a05, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);
    panel.lineStyle(1.5, 0xc9a84c, 0.8);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);
    els.push(panel);

    els.push(this.add.text(px, py - panelH / 2 + 22, 'INVENTORY', {
      fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c', letterSpacing: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

    const inventory = gameState.get().inventory;

    if (inventory.length === 0) {
      els.push(this.add.text(px, py, 'Your bag is empty.', {
        fontFamily: 'Georgia', fontSize: '14px', color: '#5a4a30', fontStyle: 'italic'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202));
    } else {
      let yOff = py - panelH / 2 + 56;
      inventory.forEach(item => {
        const icon = itemIcons[item.id] || '✦';
        const name = itemNames[item.id] || item.id.replace(/_/g, ' ');

        els.push(this.add.text(px - panelW / 2 + 24, yOff, icon, {
          fontSize: '22px'
        }).setScrollFactor(0).setDepth(202));

        els.push(this.add.text(px - panelW / 2 + 58, yOff + 2, name, {
          fontFamily: 'Georgia', fontSize: '14px', color: '#f0e8d0'
        }).setScrollFactor(0).setDepth(202));

        els.push(this.add.text(px + panelW / 2 - 24, yOff + 2, `x${item.qty}`, {
          fontFamily: 'Georgia', fontSize: '13px', color: '#c9a84c'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(202));

        yOff += 38;
      });
    }

    els.push(this.add.text(px, py + panelH / 2 - 14, '[I] or [ESC] Close', {
      fontFamily: 'Georgia', fontSize: '10px', color: '#4a3a20'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202));

    backdrop.on('pointerdown', () => this.closeInventory());
    this.input.keyboard.once('keydown-ESC', () => this.closeInventory());

    this._inventoryOverlay = els;
    this._inventoryOpen = true;
  }

  buildTouchControls(width, height) {
    if (!this.sys.game.device.input.touch) return;

    const baseX = 90;
    const baseY = height - 110;
    const baseR = 55;
    const thumbR = 26;

    // Joystick base
    const jBase = this.add.circle(baseX, baseY, baseR, 0xffffff, 0.12)
      .setScrollFactor(0).setDepth(200).setStrokeStyle(1, 0xffffff, 0.3);
    const jThumb = this.add.circle(baseX, baseY, thumbR, 0xffffff, 0.30)
      .setScrollFactor(0).setDepth(201);

    let joystickPointerId = null;
    let joystickOrigin = { x: baseX, y: baseY };

    this.input.on('pointerdown', (ptr) => {
      if (ptr.x < width / 2 && joystickPointerId === null) {
        joystickPointerId = ptr.id;
        joystickOrigin = { x: ptr.x, y: ptr.y };
        jBase.setPosition(ptr.x, ptr.y);
        jThumb.setPosition(ptr.x, ptr.y);
      }
    });

    this.input.on('pointermove', (ptr) => {
      if (ptr.id !== joystickPointerId) return;
      const dx = ptr.x - joystickOrigin.x;
      const dy = ptr.y - joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, baseR);
      const angle = Math.atan2(dy, dx);

      jThumb.setPosition(
        joystickOrigin.x + Math.cos(angle) * clamped,
        joystickOrigin.y + Math.sin(angle) * clamped
      );

      touchInput.vx = (clamped / baseR) * Math.cos(angle);
      touchInput.vy = (clamped / baseR) * Math.sin(angle);
    });

    this.input.on('pointerup', (ptr) => {
      if (ptr.id !== joystickPointerId) return;
      joystickPointerId = null;
      jBase.setPosition(baseX, baseY);
      jThumb.setPosition(baseX, baseY);
      touchInput.vx = 0;
      touchInput.vy = 0;
    });

    // Action button (right side)
    const actX = width - 70;
    const actY = height - 90;
    const actBtn = this.add.circle(actX, actY, 36, 0xc9a84c, 0.20)
      .setScrollFactor(0).setDepth(200).setStrokeStyle(2, 0xc9a84c, 0.5)
      .setInteractive();
    const actLabel = this.add.text(actX, actY, 'E', {
      fontFamily: 'Georgia', fontSize: '18px', color: '#c9a84c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    actBtn.on('pointerdown', () => {
      touchInput.actionPressed = true;
      actBtn.setFillStyle(0xc9a84c, 0.45);
    });
    actBtn.on('pointerup', () => {
      actBtn.setFillStyle(0xc9a84c, 0.20);
    });
    actBtn.on('pointerout', () => {
      touchInput.actionPressed = false;
      actBtn.setFillStyle(0xc9a84c, 0.20);
    });

    // Journal [P] button — above action button
    const jrnX = width - 70;
    const jrnY = height - 174;
    const jrnBtn = this.add.circle(jrnX, jrnY, 28, 0x8a6030, 0.20)
      .setScrollFactor(0).setDepth(200).setStrokeStyle(1.5, 0xc9a84c, 0.45)
      .setInteractive();
    this.add.text(jrnX, jrnY, 'P', {
      fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    jrnBtn.on('pointerdown', () => {
      jrnBtn.setFillStyle(0x8a6030, 0.45);
      this.togglePsalmJournal();
    });
    jrnBtn.on('pointerup',  () => jrnBtn.setFillStyle(0x8a6030, 0.20));
    jrnBtn.on('pointerout', () => jrnBtn.setFillStyle(0x8a6030, 0.20));

    // Menu [≡] button — left of action button
    const menuX = width - 150;
    const menuY = height - 90;
    const menuBtn = this.add.circle(menuX, menuY, 28, 0x334466, 0.20)
      .setScrollFactor(0).setDepth(200).setStrokeStyle(1.5, 0x6688bb, 0.45)
      .setInteractive();
    this.add.text(menuX, menuY, '≡', {
      fontFamily: 'Georgia', fontSize: '18px', color: '#aabbdd'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    menuBtn.on('pointerdown', () => {
      menuBtn.setFillStyle(0x334466, 0.45);
      this.togglePauseMenu();
    });
    menuBtn.on('pointerup',  () => menuBtn.setFillStyle(0x334466, 0.20));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x334466, 0.20));
  }
}
