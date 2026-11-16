// ValleyScene.js
// Chapter 2 — The Valley of Elah.
// David must gather 5 smooth stones from the stream, then confront Goliath.

import gameState from '../systems/GameState.js';
import audioManager from '../systems/AudioManager.js';
import { touchInput } from '../systems/TouchInput.js';
import { addProps, addProp, hasProp, track, sortActor, sortTracked } from '../systems/World.js';

const MAP_W = 1920;
const MAP_H = 1280;

const STREAM_X = MAP_W * 0.15;
const STREAM_Y = MAP_H * 0.42;
const STREAM_W = 500;
const STREAM_H = 120;

export default class ValleyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ValleyScene' });
    this.player = null;
    this.enemies = [];
    this.goliath = null;
    this.inCombat = false;
    this._currentCombatEnemy = null;
    this.moveSpeed = 140;
    this._cinematicPlaying = false;
    this._stonesCollected = false;
    this._saulArmorDone = false;
    this._goliathApproached = false;
  }

  create() {
    this.inCombat = false;
    this._currentCombatEnemy = null;
    this._cinematicPlaying = false;
    this._stonesCollected = gameState.hasItem('smooth_stone', 5);
    this._saulArmorDone = gameState.isBeatComplete('saul_armor');
    this._goliathApproached = false;

    this.buildMap();
    this.spawnPlayer();
    this.physics.add.collider(this.player, this.wallLayer);
    this.spawnArmies();
    this.spawnEnemies();
    this.spawnGoliath();
    this.spawnSoldierNPC();
    this.spawnSaulNPC();
    this.spawnStonePickups();
    this.setupCamera();
    this.setupInput();
    this.setupCollisions();

    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    audioManager.playAmbientTension();
    gameState.checkpoint('ValleyScene', 2, 'Valley of Elah');
    this.showChapterTitle('Chapter II', 'Valley of Elah');

    // Flow (1 Samuel 17): speak with King Saul (east) → gather 5 smooth stones
    // from the brook (west) → face Goliath (north). Guide to the current step.
    this.time.delayedCall(3200, () => {
      if (!this._saulArmorDone) {
        this.showMessage('King Saul has sent for you. Speak with him\nto the east — walk up and press [E].', '#c9a84c', 3600);
      } else if (!this._stonesCollected) {
        this.showMessage('Gather 5 smooth stones from the brook to the west.\nWalk over each glowing stone to pick it up.', '#a0c8b0', 3600);
      }
    });

    // Saul's armor scene completing reveals the stones at the brook (1 Sam 17:40).
    this.game.events.once('beginStoneGathering', () => {
      this._saulArmorDone = true;
      if (this._saulPrompt) this._saulPrompt.setVisible(false);
      if (this._saulLabel) this._saulLabel.setVisible(false);
      this.revealStonePickups();
      this.showMessage('"Go, and the LORD be with you."\nNow gather 5 smooth stones from the brook, to the west.', '#a0c8b0', 3600);
    });

    // Cinematic signal from dialogue
    this.game.events.once('beginGoliathCinematic', () => {
      this.playGoliathCinematic();
    });

    // Resume after regular enemy combat
    this.events.on('resume', () => {
      if (!this._cinematicPlaying) {
        this.inCombat = false;
        this._removeEnemy(this._currentCombatEnemy);
        this._currentCombatEnemy = null;
      }
    });
  }

  buildMap() {
    const map = this.make.tilemap({ key: 'valley' });
    const tileset = map.addTilesetImage('tiles', 'tiles');
    this.groundLayer = map.createLayer('ground', tileset, 0, 0);
    this.waterLayer  = map.createLayer('water',  tileset, 0, 0);
    this.wallLayer   = map.createLayer('walls',  tileset, 0, 0);
    this.wallLayer.setCollisionByExclusion([-1, 0]);
  }

  // Five smooth stones lie along the water's edge as collectible items.
  // Walk over a glowing stone to pick it up (no key press needed).
  spawnStonePickups() {
    this.stonePickups = [];

    // A soft "~ Stream ~" marker over the water.
    this._streamLabel = this.add.text(
      STREAM_X + STREAM_W / 2, STREAM_Y - 26, '~  Stream  ~',
      { fontFamily: 'Georgia', fontSize: '13px', color: '#a0c8b0',
        stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5, 1).setDepth(8);

    if (this._stonesCollected) return; // already gathered this playthrough

    // Spots sit along the visible water band (x≈300-760, y≈540-630).
    const spots = [
      { x: 360, y: 600 }, { x: 460, y: 558 }, { x: 560, y: 616 },
      { x: 660, y: 560 }, { x: 745, y: 606 },
    ];
    spots.forEach((p, i) => {
      const glow = this.add.circle(p.x, p.y + 2, 13, 0x8fd0ff, 0.22).setDepth(4);
      const stone = this.physics.add.sprite(p.x, p.y, 'stone')
        .setScale(2.4).setDepth(5).setTint(0xd6dde6);
      stone.glow = glow;

      const label = this.add.text(p.x, p.y - 22, 'smooth stone', {
        fontFamily: 'Georgia', fontSize: '9px', color: '#bfe0ff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(6);
      stone.plabel = label;

      // Gentle bob + shimmering glow so it reads as a pickup.
      this.tweens.add({
        targets: [stone, label], y: '-=6', duration: 900 + i * 70,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: glow, alpha: { from: 0.22, to: 0.5 }, scale: { from: 1, to: 1.35 },
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      this.stonePickups.push(stone);
      this.physics.add.overlap(this.player, stone, () => this.collectStone(stone));
    });

    // Stones only appear at the brook AFTER David has spoken with Saul (1 Sam 17:40).
    if (!this._saulArmorDone) {
      this.stonePickups.forEach(s => {
        s.setVisible(false);
        if (s.glow) s.glow.setVisible(false);
        if (s.plabel) s.plabel.setVisible(false);
      });
      this._streamLabel.setVisible(false);
    }
  }

  // Make the brook's stones appear once Saul's scene is done.
  revealStonePickups() {
    if (this._streamLabel) this._streamLabel.setVisible(true);
    (this.stonePickups || []).forEach(s => {
      if (!s.active) return;
      s.setVisible(true);
      if (s.glow) s.glow.setVisible(true);
      if (s.plabel) s.plabel.setVisible(true);
    });
  }

  collectStone(stone) {
    if (!stone.active || !stone.visible || this._cinematicPlaying || this.inCombat) return;
    if (!this._saulArmorDone) return; // stones are gathered only after speaking with Saul

    this.tweens.killTweensOf(stone);
    if (stone.glow) { stone.glow.destroy(); stone.glow = null; }
    if (stone.plabel) { stone.plabel.destroy(); stone.plabel = null; }
    this.stonePickups = (this.stonePickups || []).filter(s => s !== stone);

    this._stoneCount = (this._stoneCount || 0) + 1;
    gameState.addItem('smooth_stone', 1);
    if (audioManager.playHeartUp) audioManager.playHeartUp();

    // Stone pops up and fades as it goes into the bag.
    this.tweens.add({
      targets: stone, y: stone.y - 44, alpha: 0, scale: 0.6,
      duration: 460, ease: 'Back.easeIn',
      onComplete: () => stone.active && stone.destroy()
    });

    if (this._stoneCount >= 5) {
      this._stonesCollected = true;
      this.time.delayedCall(800, () => {
        this.showMessage('Five smooth stones — each one a prayer.\nNow face Goliath at the north end of the valley.', '#c9a84c', 3600);
      });
    } else {
      this.showMessage(`Smooth stone gathered  (${this._stoneCount}/5)`, '#a0c8b0', 1300);
    }
  }

  spawnPlayer() {
    this.player = this.physics.add.sprite(
      MAP_W / 2, MAP_H * 0.78, 'david_walk', 0
    );
    this.player.setCollideWorldBounds(true);
    this.player.setScale(this.registry.get('playerScale') ?? 3);
    track(this, this.player);

    this.playerShadow = this.add.ellipse(
      this.player.x, this.player.y + 22,
      28, 10, 0x000000, 0.25
    ).setDepth(4);
  }

  spawnEnemies() {
    const positions = [
      { x: MAP_W * 0.25, y: MAP_H * 0.35 },
      { x: MAP_W * 0.45, y: MAP_H * 0.28 },
      { x: MAP_W * 0.65, y: MAP_H * 0.32 },
      { x: MAP_W * 0.30, y: MAP_H * 0.55 },
      { x: MAP_W * 0.72, y: MAP_H * 0.50 },
      { x: MAP_W * 0.55, y: MAP_H * 0.42 },
    ];

    const tex = this.textures.exists('philistine_walk') ? 'philistine_walk' : 'enemy';
    positions.forEach(pos => {
      const enemy = this.physics.add.sprite(pos.x, pos.y, tex);
      enemy.setScale(this.registry.get('enemyScale') ?? 2.5);
      track(this, enemy);
      enemy.enemyType = 'philistine';
      if (this.anims.exists('philistine_idle_down')) enemy.play('philistine_idle_down');

      const label = this.add.text(pos.x, pos.y - 28, '⚔', { fontSize: '14px' })
        .setDepth(6).setOrigin(0.5);
      enemy.label = label;

      this.enemies.push(enemy);
      this.startEnemyPatrol(enemy, pos);
    });
  }

  startEnemyPatrol(enemy, origin) {
    const radius = 120;
    const wander = () => {
      if (!enemy.active) return;
      const tx = origin.x + Phaser.Math.Between(-radius, radius);
      const ty = origin.y + Phaser.Math.Between(-radius, radius);
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, tx, ty);
      const duration = (dist / 60) * 1000;

      // Face the direction of travel while walking
      const dx = tx - enemy.x, dy = ty - enemy.y;
      const dir = Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
      if (this.anims.exists(`philistine_walk_${dir}`)) enemy.play(`philistine_walk_${dir}`, true);

      this.tweens.add({
        targets: enemy,
        x: tx,
        y: ty,
        duration: Math.max(800, duration),
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          if (enemy.active && enemy.label) enemy.label.setPosition(enemy.x, enemy.y - 28);
        },
        onComplete: () => {
          if (!enemy.active) return;
          if (this.anims.exists(`philistine_idle_${dir}`)) enemy.play(`philistine_idle_${dir}`, true);
          this.time.delayedCall(Phaser.Math.Between(800, 2000), wander);
        }
      });
    };

    this.time.delayedCall(Phaser.Math.Between(0, 1500), wander);
  }

  // Fully tear down a patrolling enemy (sprite, label, and any active tweens)
  // so a paused/in-flight wander tween can't fire callbacks on a dead sprite.
  _removeEnemy(enemy) {
    if (!enemy) return;
    this.tweens.killTweensOf(enemy);
    if (enemy.label) { enemy.label.destroy(); enemy.label = null; }
    this.enemies = this.enemies.filter(e => e !== enemy);
    if (enemy.active) enemy.destroy();
  }

  spawnGoliath() {
    this.goliath = this.physics.add.sprite(MAP_W / 2, MAP_H * 0.18, 'goliath');
    this.goliath.setScale(this.registry.get('goliathScale') ?? 4);
    // Blender sheet frame is 128x160 with the feet 14px above the bottom edge.
    sortActor(this.goliath, 66);
    if (this.anims.exists('goliath_idle_down')) this.goliath.play('goliath_idle_down');
    this.goliath.enemyType = 'goliath';

    this.tweens.add({
      targets: this.goliath,
      x: this.goliath.x + 12,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this._goliathLabel = this.add.text(MAP_W / 2, MAP_H * 0.18 - 90, 'GOLIATH OF GATH', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
      letterSpacing: 3
    }).setOrigin(0.5).setDepth(7);

    this._goliathTaunt = this.add.text(MAP_W / 2, MAP_H * 0.18 - 64,
      '"Come to me, and I will give your flesh to the birds!"', {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: '#d4a0a0',
      fontStyle: 'italic',
      wordWrap: { width: 340 },
      align: 'center'
    }).setOrigin(0.5).setDepth(7);
  }

  // Decorative armies facing off across the valley (1 Sam 17:21).
  spawnArmies() {
    this.israeliteArmy = [];
    this.philistineArmy = [];

    const unitScale = this.registry.get('enemyScale') ?? 1;

    // Israelite ranks drawn up behind David (south), trembling with fear.
    const isrCount = 11;
    const isrY = MAP_H * 0.92;
    for (let i = 0; i < isrCount; i++) {
      const baseX = MAP_W * 0.5 + (i - (isrCount - 1) / 2) * 120;
      const baseY = isrY + (i % 2) * 34;
      const unit = sortActor(this.add.sprite(baseX, baseY, 'israelite').setScale(unitScale));
      if (this.anims.exists('israelite_idle_up')) unit.play({ key: 'israelite_idle_up', startFrame: i % 4 });
      // nervous, shivering jitter
      this.tweens.add({
        targets: unit,
        x: baseX + Phaser.Math.Between(-3, 3),
        y: baseY + Phaser.Math.Between(-2, 2),
        duration: Phaser.Math.Between(150, 280),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 500)
      });
      this.israeliteArmy.push(unit);
    }

    // Philistine ranks flanking Goliath (north), swaying menacingly.
    const isrY2 = MAP_H * 0.08;
    [-1, 1].forEach(side => {
      for (let i = 0; i < 4; i++) {
        const baseX = MAP_W * 0.5 + side * (220 + i * 100);
        const baseY = isrY2 + (i % 2) * 30;
        const unit = sortActor(this.add.sprite(baseX, baseY, 'enemy').setScale(unitScale));
        if (this.anims.exists('philistine_idle_down')) unit.play({ key: 'philistine_idle_down', startFrame: i % 4 });
        this.tweens.add({
          targets: unit,
          x: baseX + side * 7,
          duration: Phaser.Math.Between(1800, 2600),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.philistineArmy.push(unit);
      }
    });
  }

  // Talkable Israelite soldier near David's start — conveys the 40-day standoff.
  spawnSoldierNPC() {
    this._soldierTalked = false;
    this.soldierNPC = this.add.sprite(
      MAP_W * 0.5 - 150, MAP_H * 0.74, 'israelite'
    ).setScale(this.registry.get('enemyScale') ?? 1);
    sortActor(this.soldierNPC);
    if (this.anims.exists('israelite_idle_down')) this.soldierNPC.play('israelite_idle_down');

    this.add.ellipse(
      this.soldierNPC.x, this.soldierNPC.y + 22, 26, 9, 0x000000, 0.25
    ).setDepth(4);

    this._soldierPrompt = this.add.text(
      this.soldierNPC.x, this.soldierNPC.y - 40,
      '! Speak  [E]',
      { fontFamily: 'Georgia', fontSize: '12px', color: '#c9a84c',
        stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setDepth(7).setVisible(false);

    this.tweens.add({
      targets: this._soldierPrompt,
      y: this.soldierNPC.y - 46,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  talkToSoldier() {
    if (this.inCombat || this._cinematicPlaying) return;
    this._soldierTalked = true;
    if (this._soldierPrompt) this._soldierPrompt.setVisible(false);
    this.player.setVelocity(0, 0);
    this.scene.pause('ValleyScene');
    this.scene.launch('DialogueScene', {
      dialogueId: 'valley_soldiers',
      callerScene: 'ValleyScene'
    });
  }

  // Talkable King Saul — launches the armor scene that unlocks stone gathering.
  spawnSaulNPC() {
    this.saulNPC = this.add.sprite(
      MAP_W * 0.5 + 150, MAP_H * 0.74, 'saul'
    ).setScale((this.registry.get('npcScale') ?? 1) * 1.3);
    sortActor(this.saulNPC);
    if (this.anims.exists('saul_idle_down')) this.saulNPC.play('saul_idle_down');

    this.add.ellipse(
      this.saulNPC.x, this.saulNPC.y + 22, 28, 9, 0x000000, 0.25
    ).setDepth(4);

    this._saulLabel = this.add.text(
      this.saulNPC.x, this.saulNPC.y - 44, 'KING SAUL',
      { fontFamily: 'Georgia', fontSize: '11px', color: '#c9a84c',
        stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setDepth(7);

    this._saulPrompt = this.add.text(
      this.saulNPC.x, this.saulNPC.y - 30, '! Speak  [E]',
      { fontFamily: 'Georgia', fontSize: '12px', color: '#f5e6c0',
        stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setDepth(7).setVisible(false);

    this.tweens.add({
      targets: this._saulPrompt, y: this.saulNPC.y - 36,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // If the armor scene is already done, retire Saul's prompt/label.
    if (this._saulArmorDone) {
      this._saulLabel.setVisible(false);
    }
  }

  talkToSaul() {
    if (this.inCombat || this._cinematicPlaying || this._saulArmorDone) return;
    this._launchSaulArmor();
  }

  _launchSaulArmor() {
    if (this._saulArmorDone || this.inCombat || this._cinematicPlaying) return;
    if (this.scene.isActive('DialogueScene')) return;
    if (this._saulPrompt) this._saulPrompt.setVisible(false);
    if (this.player) this.player.setVelocity(0, 0);
    this.scene.pause('ValleyScene');
    this.scene.launch('DialogueScene', {
      dialogueId: 'saul_armor',
      callerScene: 'ValleyScene'
    });
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  // Blender-rendered scenery: the two war camps facing each other across the valley.
  buildCamps() {
    addProps(this, [
      // Israelite camp (south)
      ['tent_israelite', 340, 1100], ['tent_israelite', 470, 1156],
      ['tent_israelite', 1450, 1100], ['tent_israelite', 1580, 1156],
      // Philistine camp (north)
      ['tent_philistine', 300, 176], ['tent_philistine', 410, 104],
      ['tent_philistine', 1620, 176], ['tent_philistine', 1510, 104],
      ['tree', 1560, 566], ['tree', 250, 330], ['tree', 700, 1056], ['tree', 1250, 770], ['tree', 1380, 300],
      ['bush', 262, 500], ['bush', 836, 664], ['bush', 1180, 1090], ['bush', 620, 330],
      ['rock', 1120, 706], ['rock', 700, 250], ['rock', 880, 760],
    ]);
    if (this.propBodies) this.physics.add.collider(this.player, this.propBodies);
  }

  setupCollisions() {
    this.buildCamps();
    // Regular philistine combat
    this.enemies.forEach(enemy => {
      this.physics.add.overlap(this.player, enemy, () => {
        this.triggerCombat('philistine', enemy);
      });
    });

    // Stones are gathered via the [E] prompt at the stream (see update()).

    // Goliath approach
    this.physics.add.overlap(this.player, this.goliath, () => {
      this.tryApproachGoliath();
    });
  }

  tryApproachGoliath() {
    if (this._goliathApproached || this._cinematicPlaying || this.inCombat) return;

    if (!this._saulArmorDone) {
      this.showMessage('Speak with King Saul first —\nhe waits to the east of where you began.', '#d4a0a0', 2600);
      return;
    }

    if (!this._stonesCollected) {
      this.showMessage('Gather 5 smooth stones from the brook\nto the west before facing Goliath.', '#d4a0a0', 2600);
      return;
    }

    // All conditions met — start confrontation dialogue
    this._goliathApproached = true;
    this.inCombat = true; // Prevent re-triggering

    this.time.delayedCall(200, () => {
      this.scene.pause('ValleyScene');
      this.scene.launch('DialogueScene', {
        dialogueId: 'goliath_valley_confrontation',
        callerScene: 'ValleyScene'
      });
    });
  }

  triggerCombat(enemyType, enemySprite) {
    if (this.inCombat || this._cinematicPlaying) return;
    this.inCombat = true;
    this._currentCombatEnemy = enemySprite;

    this.cameras.main.flash(200, 255, 80, 80);

    this.time.delayedCall(200, () => {
      this.scene.launch('CombatScene', {
        enemy: enemyType,
        callerScene: 'ValleyScene'
      });
      this.scene.pause('ValleyScene');
    });
  }

  showMessage(text, color, duration) {
    const { width, height } = this.scale;
    const msg = this.add.text(width / 2, height * 0.15, text, {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: color || '#f0e8d0',
      align: 'center',
      lineSpacing: 5,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0);

    this.tweens.add({ targets: msg, alpha: 1, duration: 300 });
    this.time.delayedCall(duration - 400, () => {
      this.tweens.add({
        targets: msg,
        alpha: 0,
        duration: 400,
        onComplete: () => msg.destroy()
      });
    });
  }

  // ── Goliath Cinematic (1 Samuel 17:48-51) ──
  playGoliathCinematic() {
    if (this._cinematicPlaying) return;
    this._cinematicPlaying = true;

    // Freeze movement
    this.player.setVelocity(0, 0);
    this.inCombat = true;

    const { width, height } = this.scale;

    // Stop Goliath sway tween
    this.tweens.killTweensOf(this.goliath);

    // Step 1: Narrative overlay
    this.time.delayedCall(200, () => {
      this.showCinematicCard(
        '"As the Philistine moved closer to attack him,\nDavid ran quickly toward the battle line to meet him."',
        '1 Samuel 17:48',
        1800,
        () => this.cinematicStep2()
      );
    });
  }

  cinematicStep2() {
    // David runs toward Goliath
    this.player.anims.play('walk_up', true);
    const targetX = this.goliath.x;
    const targetY = this.goliath.y + 160;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);

    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: Math.max(1200, dist / 0.22),
      ease: 'Linear',
      onUpdate: () => {
        this.playerShadow.setPosition(this.player.x, this.player.y + 22);
      },
      onComplete: () => this.cinematicStep3()
    });
  }

  cinematicStep3() {
    // David reaches into bag and slings the stone
    this.player.anims.play('idle_up', true);

    const { width, height } = this.scale;

    // Stone projectile arc
    const stone = this.add.circle(this.player.x, this.player.y - 10, 4, 0xd0c8b0).setDepth(20);

    this.tweens.add({
      targets: stone,
      x: this.goliath.x,
      y: this.goliath.y,
      duration: 380,
      ease: 'Linear',
      onComplete: () => {
        stone.destroy();
        this.cinematicGoliathFalls();
      }
    });

    // Arc path — add vertical tween layered on top
    this.tweens.add({
      targets: stone,
      y: this.player.y - 80,
      duration: 190,
      yoyo: true,
      ease: 'Sine.easeOut'
    });

    // Screen flash on impact
    this.time.delayedCall(380, () => {
      this.cameras.main.flash(120, 255, 255, 220);
      this.cameras.main.shake(300, 0.012);
    });
  }

  cinematicGoliathFalls() {
    const { width, height } = this.scale;

    // Stone hits forehead — Goliath stumbles
    this.tweens.add({
      targets: this.goliath,
      angle: 90,
      y: this.goliath.y + 60,
      alpha: 0.7,
      duration: 700,
      ease: 'Cubic.easeIn'
    });

    // Hide Goliath labels
    if (this._goliathLabel) this._goliathLabel.setVisible(false);
    if (this._goliathTaunt) this._goliathTaunt.setVisible(false);

    this.showCinematicCard(
      '"He struck the Philistine on the forehead. The stone sank into\nhis forehead, and he fell facedown on the ground."',
      '1 Samuel 17:49',
      2200,
      () => this.cinematicDavidTakesHead()
    );
  }

  cinematicDavidTakesHead() {
    // David runs and stands over the fallen giant.
    this.tweens.add({
      targets: this.player,
      x: this.goliath.x - 22,
      y: this.goliath.y + 34,
      duration: 600,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.playerShadow.setPosition(this.player.x, this.player.y + 22);
      },
      onComplete: () => this._beheadGoliath()
    });
  }

  // David draws Goliath's own sword, raises it, and strikes — the head falls.
  _beheadGoliath() {
    const gx = this.goliath.x, gy = this.goliath.y;

    // Build a sword that pivots at David's hand.
    const sword = this.add.container(this.player.x + 12, this.player.y - 26).setDepth(20);
    const blade = this.add.rectangle(0, -20, 5, 42, 0xe8e8f0).setOrigin(0.5, 1);
    const guard = this.add.rectangle(0, 0, 20, 5, 0xc9a84c);
    const hilt  = this.add.rectangle(0, 9, 5, 15, 0x6a4a2a);
    sword.add([hilt, guard, blade]);
    sword.setRotation(-0.5);

    // Raise high...
    this.tweens.add({
      targets: sword, rotation: -2.3, y: this.player.y - 52,
      duration: 520, ease: 'Sine.easeOut',
      onComplete: () => {
        // ...then strike down across the neck.
        this.tweens.add({
          targets: sword, rotation: 1.3, x: gx, y: gy - 8,
          duration: 150, ease: 'Quad.easeIn',
          onComplete: () => {
            this.cameras.main.flash(120, 255, 255, 255);
            this.cameras.main.shake(320, 0.014);

            // White slash streak.
            const streak = this.add.rectangle(gx, gy - 14, 78, 4, 0xffffff, 0.95)
              .setDepth(21).setAngle(-22);
            this.tweens.add({
              targets: streak, alpha: 0, scaleX: 1.7, duration: 320,
              onComplete: () => streak.destroy()
            });

            this._spawnGoliathHead(gx, gy - 28);

            // Sword fades; Goliath's body settles and fades.
            this.tweens.add({ targets: sword, alpha: 0, duration: 600, delay: 250,
              onComplete: () => sword.destroy() });
            this.tweens.add({ targets: this.goliath, alpha: 0, y: gy + 10, duration: 900, delay: 200 });

            gameState.addItem('goliath_sword', 1);

            this.time.delayedCall(750, () => {
              this.showCinematicCard(
                '"David ran and stood over him, took the Philistine\'s sword,\nand with it killed him and cut off his head.\nWhen the Philistines saw their champion was dead, they fled."',
                '1 Samuel 17:51',
                2800,
                () => this.cinematicPhilistinesFlee()
              );
            });
          }
        });
      }
    });
  }

  // A severed helmeted head that arcs away and tumbles to the ground.
  _spawnGoliathHead(x, y) {
    const head = this.add.container(x, y).setDepth(22);
    const skull  = this.add.circle(0, 1, 9, 0x6a5a4a);
    const helmet = this.add.circle(0, -4, 9, 0x44446a);
    const beard  = this.add.rectangle(0, 7, 12, 6, 0x2a2218);
    head.add([helmet, skull, beard]);

    this.tweens.add({
      targets: head, x: x - 64, y: y - 46, angle: -200,
      duration: 480, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: head, y: y + 130, angle: -380, alpha: 0.25,
          duration: 700, ease: 'Quad.easeIn',
          onComplete: () => head.destroy()
        });
      }
    });
  }

  cinematicPhilistinesFlee() {
    this.showCinematicCard(
      '"When the Philistines saw that their hero was dead,\nthey turned and ran."',
      '1 Samuel 17:51',
      2000,
      () => this.showGoliathVictory()
    );

    // Enemies scatter
    this.enemies.forEach((e, i) => {
      if (e.active) {
        this.tweens.add({
          targets: e,
          x: e.x + Phaser.Math.Between(-600, 600),
          y: e.y - Phaser.Math.Between(200, 600),
          alpha: 0,
          duration: 1200,
          delay: i * 100,
          onComplete: () => e.destroy()
        });
      }
    });

    // Philistine army turns and flees north
    (this.philistineArmy || []).forEach((u, i) => {
      if (!u.active) return;
      this.tweens.killTweensOf(u);
      this.tweens.add({
        targets: u,
        x: u.x + Phaser.Math.Between(-300, 300),
        y: u.y - Phaser.Math.Between(300, 700),
        alpha: 0,
        duration: 1400,
        delay: i * 60,
        onComplete: () => u.destroy()
      });
    });

    // Israelite army surges forward, no longer trembling
    (this.israeliteArmy || []).forEach((u, i) => {
      if (!u.active) return;
      this.tweens.killTweensOf(u);
      this.tweens.add({
        targets: u,
        y: u.y - Phaser.Math.Between(300, 500),
        duration: 1600,
        delay: i * 50,
        ease: 'Cubic.easeIn'
      });
    });
  }

  showCinematicCard(text, reference, holdMs, onDone) {
    const { width, height } = this.scale;

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(55);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, height * 0.62, width, height * 0.22);

    const ref = this.add.text(width / 2, height * 0.64, reference, {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: '#c9a84c',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(56).setAlpha(0);

    const body = this.add.text(width / 2, height * 0.67, text, {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#f5e6c0',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: width - 80 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(56).setAlpha(0);

    this.tweens.add({ targets: [ref, body], alpha: 1, duration: 400 });

    this.time.delayedCall(holdMs, () => {
      this.tweens.add({
        targets: [overlay, ref, body],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          overlay.destroy(); ref.destroy(); body.destroy();
          if (onDone) onDone();
        }
      });
    });
  }

  showGoliathVictory() {
    const { width, height } = this.scale;

    gameState.setFlag('killedGoliath');
    gameState.completeBeat('goliath_fight');
    gameState.adjustHeart(20);
    gameState.addToCodex('david_goliath_declaration');

    const overlay = this.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.82
    ).setDepth(60).setScrollFactor(0);

    const title = this.add.text(width / 2, height * 0.30, '✦ THE BATTLE IS THE LORD\'S ✦', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#c9a84c',
      stroke: '#000000',
      strokeThickness: 3,
      letterSpacing: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0);

    const verse = this.add.text(width / 2, height * 0.44,
      '"It is not by sword or spear that the LORD saves —\nfor the battle is the LORD\'s."\n— 1 Samuel 17:47', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#f5e6c0',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0);

    const sub = this.add.text(width / 2, height * 0.62,
      'The Israelites surge forward.\nAll of Israel celebrates.\nDavid\'s name is known in all the land.', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#8a9a7a',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0);

    this.tweens.add({
      targets: [title, verse, sub],
      alpha: 1,
      duration: 1200,
      ease: 'Sine.easeIn',
      delay: 300
    });

    this.time.delayedCall(5000, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('ValleyScene');
        this.scene.start('SaulCourtScene');
      });
    });
  }

  showChapterTitle(chapter, title) {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.7
    ).setDepth(50).setScrollFactor(0);

    const chText = this.add.text(width / 2, height * 0.42, chapter, {
      fontFamily: 'Georgia', fontSize: '16px', color: '#c9a84c', letterSpacing: 6
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setAlpha(0);

    const titleText = this.add.text(width / 2, height * 0.5, title, {
      fontFamily: 'Georgia', fontSize: '36px', color: '#f5e6c0'
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setAlpha(0);

    const line = this.add.graphics().setDepth(51).setScrollFactor(0).setAlpha(0);
    line.lineStyle(1, 0xc9a84c, 0.6);
    line.lineBetween(width / 2 - 120, height * 0.47, width / 2 + 120, height * 0.47);

    this.tweens.add({ targets: [chText, line, titleText], alpha: 1, duration: 800, delay: 300 });
    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: [overlay, chText, titleText, line],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          overlay.destroy(); chText.destroy(); titleText.destroy(); line.destroy();
        }
      });
    });
  }

  update() {
    if (this.inCombat || this._cinematicPlaying) return;
    this.handleMovement();
    this.playerShadow.setPosition(this.player.x, this.player.y + 22);
    sortTracked(this);
    this.handleInteractions();
  }

  handleInteractions() {
    const px = this.player.x, py = this.player.y;
    const dist = (x, y) => Phaser.Math.Distance.Between(px, py, x, y);
    const pressed = Phaser.Input.Keyboard.JustDown(this.interactKey);

    // King Saul — David is sent for first (1 Sam 17:31); talkable until his scene is done.
    const nearSaul = this.saulNPC && this.saulNPC.active && !this._saulArmorDone &&
      dist(this.saulNPC.x, this.saulNPC.y) < 100;
    if (this._saulPrompt) this._saulPrompt.setVisible(nearSaul);

    // Israelite soldier
    const nearSoldier = this.soldierNPC && this.soldierNPC.active &&
      dist(this.soldierNPC.x, this.soldierNPC.y) < 90;
    if (this._soldierPrompt) this._soldierPrompt.setVisible(nearSoldier && !nearSaul);

    if (!pressed) return;
    // One action per press, nearest-intent priority
    if (nearSaul)         this.talkToSaul();
    else if (nearSoldier) this.talkToSoldier();
  }

  handleMovement() {
    const speed = this.moveSpeed;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;

    vx += touchInput.vx * speed;
    vy += touchInput.vy * speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vy) >= Math.abs(vx)) {
        this.player.anims.play(vy < 0 ? 'walk_up' : 'walk_down', true);
      } else {
        this.player.anims.play(vx < 0 ? 'walk_left' : 'walk_right', true);
      }
      this.player.setScale(this.registry.get('playerScale') ?? 3);
    } else {
      this.player.anims.play('idle_down', true);
    }
  }
}
