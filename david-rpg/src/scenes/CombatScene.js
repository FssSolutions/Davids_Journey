// CombatScene.js
// Turn-based combat with scripture abilities.
// "The battle is the LORD's" — abilities are unlocked by knowing scripture.

import gameState from '../systems/GameState.js';
import SCRIPTURES from '../data/ScriptureData.js';
import audioManager from '../systems/AudioManager.js';

const ENEMIES = {
  philistine: {
    name: 'Philistine Warrior',
    sprite: 'enemy',
    maxHp: 40,
    attack: 8,
    xpReward: 20,
    loot: 'faith_orb',
    scale: 1.3,
    battleScale: 1,
    taunt: 'The gods of Philistia will crush you!'
  },
  goliath: {
    name: 'Goliath of Gath',
    sprite: 'goliath',
    maxHp: 120,
    attack: 22,
    xpReward: 100,
    loot: 'goliath_sword',
    scale: 1.6,
    battleScale: 1.05,
    taunt: 'Come to me and I\'ll give your flesh to the birds!'
  }
};

export default class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatScene' });
    this.playerHp = 0;
    this.enemyHp = 0;
    this.turnState = 'player'; // 'player' | 'enemy' | 'animating'
    this.selectedAbility = null;
  }

  init(data) {
    this.enemyKey = data.enemy || 'philistine';
    this.callerScene = data.callerScene || null;
    this.enemyData = ENEMIES[this.enemyKey];
    this.playerHp = gameState.get().health;
    this.enemyHp = this.enemyData.maxHp;
    // Reset per-battle state — the scene instance is reused across encounters.
    this.turnState = 'player';
    this.playerShieldActive = 0;
    this.selectedAbility = null;
  }

  create() {
    const { width, height } = this.scale;

    // ── Background — Valley of Elah ──
    this.buildBackground(width, height);

    // ── Enemy sprite ──
    // Blender battle sheets (large three-quarter renders with idle + attack) when present.
    this.enemyBattleKey = `battle_${this.enemyKey}`;
    this.hasBattleArt = this.textures.exists(this.enemyBattleKey) && this.textures.exists('battle_david');
    if (this.hasBattleArt) {
      this.enemySprite = this.add.sprite(width * 0.65, height * 0.40, this.enemyBattleKey, 0)
        .setScale(this.enemyData.battleScale).setDepth(5);
      this.enemySprite.play(`${this.enemyBattleKey}_idle`);
    } else {
      this.enemySprite = this.add.sprite(
        width * 0.65, height * 0.38,
        this.enemyData.sprite
      ).setScale(this.enemyData.scale).setDepth(5);
    }

    // Idle bounce
    this.tweens.add({
      targets: this.enemySprite,
      y: this.enemySprite.y - 6,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Enemy name tag
    this.add.text(width * 0.65, height * 0.18, this.enemyData.name, {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#f0d0d0',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6);

    // Enemy HP bar
    this.enemyHpBg = this.add.rectangle(width * 0.65, height * 0.23, 180, 12, 0x2a1a1a).setDepth(6);
    this.enemyHpBar = this.add.rectangle(width * 0.65 - 90, height * 0.23, 180, 12, 0xc0392b).setDepth(7).setOrigin(0, 0.5);
    this.enemyHpText = this.add.text(width * 0.65, height * 0.23, `${this.enemyHp}/${this.enemyData.maxHp}`, {
      fontFamily: 'Georgia', fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(8);

    // ── Player sprite (left side) ──
    if (this.hasBattleArt) {
      this.playerSprite = this.add.sprite(width * 0.3, height * 0.50, 'battle_david', 0).setDepth(5);
      this.playerSprite.play('battle_david_idle');
    } else {
      this.playerSprite = this.add.sprite(
        width * 0.3, height * 0.48,
        'david'
      ).setScale(this.game.registry.get('useRealSprites') ? 1 : 3.5).setDepth(5);
    }

    this.add.text(width * 0.3, height * 0.26, 'David', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#c9a84c',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6);

    // Player HP bar
    this.playerHpBg = this.add.rectangle(width * 0.3, height * 0.31, 180, 12, 0x1a2a1a).setDepth(6);
    this.playerHpBar = this.add.rectangle(width * 0.3 - 90, height * 0.31, 180, 12, 0x27ae60).setDepth(7).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(width * 0.3, height * 0.31, `${this.playerHp}/${gameState.get().maxHealth}`, {
      fontFamily: 'Georgia', fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(8);

    // ── Battle log ──
    this.battleLog = this.add.text(
      width / 2, height * 0.62,
      '',
      {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#d4c4a0',
        align: 'center',
        wordWrap: { width: width - 80 }
      }
    ).setOrigin(0.5).setDepth(6);

    // ── Action panel ──
    this.buildActionPanel(width, height);

    // ── Enemy taunt ──
    this.showSpeechBubble(this.enemySprite.x, this.enemySprite.y - 60, this.enemyData.taunt);

    this.cameras.main.fadeIn(600, 0, 0, 0);
    audioManager.playCombatMusic();
  }

  buildBackground(width, height) {
    const bg = this.add.graphics();
    // Sky
    bg.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x4a5a2a, 0x4a5a2a, 1);
    bg.fillRect(0, 0, width, height * 0.65);
    // Ground
    bg.fillStyle(0x7a6a4a);
    bg.fillRect(0, height * 0.65, width, height * 0.35);
    // Distant hills
    bg.fillStyle(0x3a4a2a);
    bg.fillEllipse(200, height * 0.65, 400, 120);
    bg.fillEllipse(700, height * 0.65, 360, 100);
    // Rocks
    bg.fillStyle(0x5a4a3a);
    bg.fillEllipse(100, height * 0.72, 60, 30);
    bg.fillEllipse(820, height * 0.75, 80, 35);
  }

  buildActionPanel(width, height) {
    const panelY = height * 0.72;
    const panelH = height * 0.28;

    const panel = this.add.graphics().setDepth(8);
    panel.fillStyle(0x0e0905, 0.96);
    panel.fillRoundedRect(8, panelY, width - 16, panelH - 8, 6);
    panel.lineStyle(1.5, 0xc9a84c, 0.6);
    panel.strokeRoundedRect(8, panelY, width - 16, panelH - 8, 6);

    // Turn indicator
    this.turnIndicator = this.add.text(
      width / 2, panelY + 14,
      'Your Turn — Choose an Action',
      { fontFamily: 'Georgia', fontSize: '13px', color: '#c9a84c', letterSpacing: 2 }
    ).setOrigin(0.5).setDepth(9);

    // Shield counter (hidden until shield is active)
    this.shieldCounter = this.add.text(
      16, panelY + 14,
      '',
      { fontFamily: 'Georgia', fontSize: '13px', color: '#88aaff' }
    ).setDepth(9).setAlpha(0);

    // ── Action buttons ──
    const actions = [
      { label: '🪨 Sling Stone',    key: 'sling',   x: width * 0.18, desc: 'Basic attack (1 Sam 17)' },
      { label: '⚔️  Faith Strike',  key: 'faith',   x: width * 0.38, desc: 'Psalm 28:7 (needs ability)' },
      { label: '🛡️  Shield of Faith', key: 'shield', x: width * 0.62, desc: 'Block for 3 turns' },
      { label: '💚 Shepherd\'s Rest', key: 'heal',   x: width * 0.82, desc: 'Heal (Psalm 23:1-3)' },
    ];

    this.actionButtons = [];

    actions.forEach(action => {
      // Only Faith Strike is gated behind scripture memory; sling, shield (block),
      // and heal are always available so the player always has a defensive option.
      const hasAbility = action.key === 'faith'
        ? gameState.hasAbility('faith_strike')
        : true;

      const btn = this.add.text(
        action.x, panelY + 46,
        action.label,
        {
          fontFamily: 'Georgia',
          fontSize: '12px',
          color: hasAbility ? '#f0e8d0' : '#5a4a3a',
          backgroundColor: '#1a1205',
          padding: { x: 8, y: 6 }
        }
      ).setOrigin(0.5).setDepth(9);

      const desc = this.add.text(
        action.x, panelY + 68,
        action.desc,
        { fontFamily: 'Georgia', fontSize: '10px', color: '#6a5a4a' }
      ).setOrigin(0.5).setDepth(9);

      if (hasAbility) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setColor('#c9a84c').setScale(1.05));
        btn.on('pointerout',  () => btn.setColor('#f0e8d0').setScale(1));
        btn.on('pointerdown', () => this.executePlayerAction(action.key));
      }

      // Scripture verse ability unlock prompt
      if (!hasAbility && action.key === 'faith') {
        const unlock = this.add.text(
          action.x, panelY + 84,
          'Memorize Psalm 28:7 to unlock',
          { fontFamily: 'Georgia', fontSize: '9px', color: '#c9a84c', fontStyle: 'italic' }
        ).setOrigin(0.5).setDepth(9).setInteractive({ useHandCursor: true });

        unlock.on('pointerdown', () => {
          this.scene.launch('ScriptureScene', {
            scriptureId: 'strength_and_shield',
            onSuccess: 'unlock_faith_strike',
            callerScene: 'CombatScene'
          });
          this.scene.pause('CombatScene');
        });
      }

      this.actionButtons.push(btn);
    });
  }

  executePlayerAction(action) {
    if (this.turnState !== 'player') return;
    this.turnState = 'animating';

    let damage = 0;
    let logMessage = '';
    let special = false;

    switch (action) {
      case 'sling':
        damage = Phaser.Math.Between(10, 18);
        logMessage = `David hurls a stone! Hit for ${damage} damage.`;
        this.animateSlingStone();
        break;

      case 'faith':
        damage = Phaser.Math.Between(20, 30);
        special = true;
        logMessage = `Faith Strike! "I come against you in the name of the LORD!" — ${damage} damage!`;
        this.animateFaithStrike();
        break;

      case 'shield':
        logMessage = 'David prays and takes a defensive stance. (Shield active for 3 turns)';
        this.playerShieldActive = 3;
        this._updateShieldCounter();
        this.animateDefend();
        break;

      case 'heal':
        const healAmt = Phaser.Math.Between(20, 35);
        this.playerHp = Math.min(gameState.get().maxHealth, this.playerHp + healAmt);
        gameState.heal(healAmt);
        logMessage = `"The LORD is my shepherd, I lack nothing." Restored ${healAmt} HP.`;
        this.animateHeal();
        break;
    }

    if (damage > 0) {
      this.time.delayedCall(400, () => {
        this.enemyHp = Math.max(0, this.enemyHp - damage);
        this.updateEnemyHpBar();

        if (this.enemyHp <= 0) {
          if (this.enemyKey === 'goliath') {
            gameState.setFlag('killedGoliath');
            gameState.completeBeat('goliath_fight');
          }
          this.endCombat(true);
          return;
        }
      });
    }

    this.battleLog.setText(logMessage);
    if (special) {
      this.battleLog.setColor('#ffe88a');
    } else {
      this.battleLog.setColor('#d4c4a0');
    }

    this.time.delayedCall(1200, () => {
      this.enemyTurn();
    });
  }

  enemyTurn() {
    // Don't let a defeated enemy (or a finished battle) take a turn — the player's
    // killing blow resolves on a delay, so this call may already be obsolete.
    if (this.turnState === 'over' || this.enemyHp <= 0 || this.playerHp <= 0) return;
    this.turnState = 'enemy';
    this.turnIndicator.setText('Enemy Turn...');

    this.time.delayedCall(600, () => {
      let damage = this.enemyData.attack;

      if (this.playerShieldActive > 0) {
        damage = Math.floor(damage * 0.3);
        this.playerShieldActive--;
        this._updateShieldCounter();
        this.battleLog.setText(
          `${this.enemyData.name} attacks! David\'s faith blocks most of it — ${damage} damage.`
        );
      } else {
        // Random enemy action
        const roll = Math.random();
        if (roll < 0.2) {
          this.battleLog.setText(`${this.enemyData.name} taunts David! "Is that the best Israel has?"`);
          this.showSpeechBubble(this.enemySprite.x, this.enemySprite.y - 60, 'Come closer, little shepherd!');
          damage = 0;
        } else {
          damage += Phaser.Math.Between(-3, 5);
          this.battleLog.setText(`${this.enemyData.name} attacks! ${damage} damage.`);
          this.playBattleAnim(this.enemySprite, this.enemyBattleKey);
        }
      }

      if (damage > 0) {
        this.playerHp = Math.max(0, this.playerHp - damage);
        gameState.damage(damage);
        this.updatePlayerHpBar();
        this.animatePlayerHit();

        if (this.playerHp <= 0) {
          this.endCombat(false);
          return;
        }
      }

      this.time.delayedCall(700, () => {
        this.turnState = 'player';
        this.turnIndicator.setText('Your Turn — Choose an Action');
        this.battleLog.setColor('#d4c4a0');
      });
    });
  }

  // ── Animations ──

  // Play a battle sheet's one-shot attack, then drop back to its idle loop.
  playBattleAnim(sprite, key) {
    if (!this.hasBattleArt || !sprite.active) return;
    sprite.play(`${key}_attack`);
    sprite.chain(`${key}_idle`);
  }

  animateSlingStone() {
    // With battle art David winds up first; the stone leaves as his arm comes forward.
    this.playBattleAnim(this.playerSprite, 'battle_david');
    const release = this.hasBattleArt ? 280 : 0;
    this.time.delayedCall(release, () => {
      const stone = this.add.image(
        this.playerSprite.x + (this.hasBattleArt ? 36 : 20),
        this.playerSprite.y - (this.hasBattleArt ? 30 : 0), 'stone').setDepth(10);
      this.tweens.add({
        targets: stone,
        x: this.enemySprite.x,
        y: this.enemySprite.y,
        duration: 350,
        ease: 'Sine.easeIn',
        onComplete: () => {
          stone.destroy();
          this.hitFlash(this.enemySprite);
        }
      });
    });
  }

  animateFaithStrike() {
    // Golden aura burst
    const aura = this.add.circle(this.playerSprite.x, this.playerSprite.y, 5, 0xc9a84c, 0.9).setDepth(10);
    this.tweens.add({
      targets: aura,
      scaleX: 20, scaleY: 20,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => aura.destroy()
    });

    this.time.delayedCall(300, () => {
      const flash = this.add.rectangle(
        this.scale.width / 2, this.scale.height / 2,
        this.scale.width, this.scale.height,
        0xc9a84c, 0.2
      ).setDepth(15);
      this.tweens.add({
        targets: flash, alpha: 0, duration: 400,
        onComplete: () => flash.destroy()
      });
      this.hitFlash(this.enemySprite, 0xc9a84c);
    });
  }

  animateDefend() {
    const shield = this.add.circle(this.playerSprite.x, this.playerSprite.y, 30, 0x4488ff, 0.3).setDepth(4);
    this.tweens.add({
      targets: shield,
      scaleX: 1.3, scaleY: 1.3,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: 2,
      onComplete: () => shield.destroy()
    });
  }

  animateHeal() {
    const orb = this.add.image(this.playerSprite.x, this.playerSprite.y + 40, 'faith_orb').setDepth(10).setAlpha(0);
    this.tweens.add({
      targets: orb,
      y: this.playerSprite.y - 20,
      alpha: 1,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: orb, alpha: 0, duration: 300, onComplete: () => orb.destroy() });
      }
    });
  }

  animatePlayerHit() {
    audioManager.playHit();
    this.tweens.add({
      targets: this.playerSprite,
      x: this.playerSprite.x - 12,
      duration: 80,
      yoyo: true,
      repeat: 2
    });
    this.playerSprite.setTint(0xff6666);
    this.time.delayedCall(300, () => this.playerSprite.clearTint());
  }

  hitFlash(sprite, color = 0xffffff) {
    audioManager.playHit();
    sprite.setTint(color);
    this.tweens.add({
      targets: sprite,
      x: sprite.x + 10,
      duration: 60,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        sprite.clearTint();
        sprite.setX(sprite.x);
      }
    });
  }

  showSpeechBubble(x, y, text) {
    const bubble = this.add.graphics().setDepth(12);
    bubble.fillStyle(0xf5f5f5, 0.95);
    bubble.fillRoundedRect(x - 100, y - 30, 200, 40, 8);
    bubble.fillTriangle(x - 10, y + 10, x + 10, y + 10, x, y + 24);

    const txt = this.add.text(x, y - 10, text, {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#1a0a00',
      wordWrap: { width: 180 },
      align: 'center'
    }).setOrigin(0.5).setDepth(13);

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: [bubble, txt], alpha: 0, duration: 400,
        onComplete: () => { bubble.destroy(); txt.destroy(); }
      });
    });
  }

  updateEnemyHpBar() {
    const pct = this.enemyHp / this.enemyData.maxHp;
    this.tweens.add({ targets: this.enemyHpBar, width: 180 * pct, duration: 300 });
    this.enemyHpText.setText(`${this.enemyHp}/${this.enemyData.maxHp}`);
  }

  updatePlayerHpBar() {
    const pct = this.playerHp / gameState.get().maxHealth;
    this.tweens.add({ targets: this.playerHpBar, width: 180 * pct, duration: 300 });
    this.playerHpText.setText(`${this.playerHp}/${gameState.get().maxHealth}`);
  }

  _updateShieldCounter() {
    if (!this.shieldCounter) return;
    if (this.playerShieldActive > 0) {
      this.shieldCounter.setText(`🛡 ${this.playerShieldActive}`);
      this.shieldCounter.setAlpha(1);
    } else {
      this.shieldCounter.setAlpha(0);
    }
  }

  endCombat(playerWon) {
    this.turnState = 'over';
    audioManager.stopCombatMusic();

    const { width, height } = this.scale;

    this.time.delayedCall(600, () => {
      const overlay = this.add.rectangle(
        width / 2, height / 2,
        width, height, 0x000000, 0.7
      ).setDepth(20);

      const result = this.add.text(
        width / 2, height * 0.4,
        playerWon ? 'Victory!' : 'David fell...',
        {
          fontFamily: 'Georgia',
          fontSize: '48px',
          color: playerWon ? '#c9a84c' : '#c03030',
          stroke: '#000000',
          strokeThickness: 4
        }
      ).setOrigin(0.5).setDepth(21);

      const sub = this.add.text(
        width / 2, height * 0.54,
        playerWon
          ? '"The battle is the LORD\'s." — 1 Samuel 17:47'
          : 'David trusted God and rose again...',
        { fontFamily: 'Georgia', fontSize: '14px', color: '#d4c4a0', align: 'center' }
      ).setOrigin(0.5).setDepth(21);

      if (playerWon && this.enemyKey !== 'goliath' && this.enemyData.loot) {
        gameState.addItem(this.enemyData.loot, 1);
        const lootName = this.enemyData.loot.replace(/_/g, ' ');
        const lootText = this.add.text(
          width / 2, height * 0.60,
          `✶ Found: ${lootName} ✶`,
          { fontFamily: 'Georgia', fontSize: '14px', color: '#c9a84c' }
        ).setOrigin(0.5).setDepth(21).setAlpha(0);
        this.tweens.add({ targets: lootText, alpha: 1, duration: 600, delay: 400 });
      }

      const btn = this.add.text(
        width / 2, height * 0.72,
        playerWon ? 'Continue Journey ›' : 'Try Again',
        { fontFamily: 'Georgia', fontSize: '18px', color: '#c9a84c' }
      ).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        if (!playerWon) gameState.heal(gameState.get().maxHealth);

        // Emit result so ValleyScene can react on resume
        this.game.events.emit('combatResult', { won: playerWon, enemy: this.enemyKey });

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          if (this.callerScene === 'ValleyScene') {
            const goliathWon = this.enemyKey === 'goliath' && playerWon;
            if (goliathWon) {
              this.scene.stop('ValleyScene');
              this.scene.stop('CombatScene');
              this.scene.start('SaulCourtScene');
              this.scene.launch('UIScene');
            } else {
              this.scene.stop('CombatScene');
              this.scene.resume('ValleyScene');
            }
          } else {
            this.scene.start('BethlehemScene');
            this.scene.launch('UIScene');
          }
        });
      });
    });
  }
}
