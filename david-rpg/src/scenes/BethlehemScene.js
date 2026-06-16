// BethlehemScene.js
// Chapter 1 — The fields of Bethlehem.
// David tends sheep, Samuel arrives, the anointing happens.

import gameState from '../systems/GameState.js';
import DIALOGUES from '../data/DialogueData.js';
import audioManager from '../systems/AudioManager.js';
import { touchInput } from '../systems/TouchInput.js';

export default class BethlehemScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BethlehemScene' });
    this.player = null;
    this.cursors = null;
    this.npcs = [];
    this.moveSpeed = 120;
  }

  create() {
    const { width, height } = this.scale;

    // ── Tilemap ──
    this.buildMap();

    // ── Player (David) ──
    this.player = this.physics.add.sprite(640, 740, 'david_walk', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(this.registry.get('playerScale') ?? 3);
    this.player.setDepth(5);
    this.valleyPortalShown = false;

    // Player shadow
    this.playerShadow = this.add.ellipse(
      this.player.x, this.player.y + 20,
      28, 10, 0x000000, 0.25
    ).setDepth(4);

    this.physics.add.collider(this.player, this.wallLayer);

    // ── Camera ──
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 1280, 960);
    this.physics.world.setBounds(0, 0, 1280, 960);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    // ── NPCs ──
    this.spawnSamuel(460, 340);
    this.spawnJesse(560, 360);
    this.spawnSheep();

    // ── Interaction zones ──
    this.interactZones = [];

    // ── Chapter title card ──
    gameState.checkpoint('BethlehemScene', 1, 'The Anointing');
    this.showChapterTitle('Chapter I', 'The Anointing');

    // ── Ambient particles (dust/wind) ──
    this.createAmbience(width, height);

    // ── UI scene (HUD) ──
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    this.scene.get('UIScene').events.emit('sceneChanged', 'BethlehemScene');

    // Fade in
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    audioManager.playAmbientPastoral();

    // Resume event — check if anointing is done and show valley portal
    this.events.on('resume', () => {
      if (gameState.isBeatComplete('samuel_arrives') && !this.valleyPortalShown) {
        this.valleyPortalShown = true;
        this.showValleyPortal();
      }
    });
  }

  buildMap() {
    const map = this.make.tilemap({ key: 'bethlehem' });
    const tileset = map.addTilesetImage('tiles', 'tiles');
    this.groundLayer = map.createLayer('ground', tileset, 0, 0);
    this.wallLayer   = map.createLayer('walls',  tileset, 0, 0);
    this.wallLayer.setCollisionByExclusion([-1, 0]);
  }

  spawnSamuel(x, y) {
    const samuel = this.physics.add.sprite(x, y, 'samuel');
    samuel.setScale(this.registry.get('npcScale') ?? 3);
    samuel.setDepth(5);
    samuel.setImmovable(true);
    if (this.anims.exists('samuel_idle_down')) samuel.play('samuel_idle_down');
    samuel.name = 'samuel';

    // Gentle idle bob
    this.tweens.add({
      targets: samuel,
      y: y - 3,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Interaction label
    const label = this.add.text(x, y - 36, '[E] Talk', {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#c9a84c',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    samuel.interactLabel = label;
    samuel.dialogueId = 'samuel_arrives';

    this.npcs.push(samuel);
  }

  spawnJesse(x, y) {
    const jesse = this.add.sprite(x, y, 'jesse');
    jesse.setScale(this.registry.get('npcScale') ?? 3);
    jesse.setDepth(5);
    if (this.anims.exists('jesse_idle_down')) jesse.play('jesse_idle_down');

    this.add.ellipse(x, y + 22, 26, 9, 0x000000, 0.25).setDepth(4);

    this.add.text(x, y - 36, 'Jesse', {
      fontFamily: 'Georgia', fontSize: '10px', color: '#cbb68a',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    // Gentle idle bob
    this.tweens.add({
      targets: jesse, y: y - 3, duration: 2100,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  spawnSheep() {
    const sheepPositions = [
      { x: 700, y: 720 },
      { x: 760, y: 780 },
      { x: 580, y: 755 },
    ];

    sheepPositions.forEach(pos => {
      const sg = this.add.graphics();
      sg.fillStyle(0xf0ece0);
      sg.fillEllipse(0, 0, 28, 20);
      sg.fillStyle(0xd4c8b0);
      sg.fillCircle(10, -8, 8); // head
      sg.setPosition(pos.x, pos.y).setDepth(4);

      // Sheep wander
      this.time.addEvent({
        delay: Phaser.Math.Between(2000, 5000),
        loop: true,
        callback: () => {
          const nx = pos.x + Phaser.Math.Between(-30, 30);
          const ny = pos.y + Phaser.Math.Between(-20, 20);
          this.tweens.add({ targets: sg, x: nx, y: ny, duration: 1500, ease: 'Sine.easeInOut' });
        }
      });
    });
  }

  createAmbience(width, height) {
    // Dust motes drifting
    for (let i = 0; i < 15; i++) {
      const mote = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        1,
        0xf0d090,
        Phaser.Math.FloatBetween(0.1, 0.4)
      ).setDepth(20);

      this.tweens.add({
        targets: mote,
        x: mote.x + Phaser.Math.Between(-60, 60),
        y: mote.y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        onComplete: () => {
          mote.setPosition(
            Phaser.Math.Between(0, width),
            Phaser.Math.Between(height * 0.5, height)
          );
          mote.setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
          this.tweens.add({
            targets: mote,
            x: mote.x + Phaser.Math.Between(-60, 60),
            y: mote.y - 60,
            alpha: 0,
            duration: Phaser.Math.Between(3000, 6000),
            repeat: -1
          });
        }
      });
    }
  }

  showChapterTitle(chapter, title) {
    const { width, height } = this.scale;
    const cam = this.cameras.main;

    const overlay = this.add.rectangle(
      cam.scrollX + width / 2,
      cam.scrollY + height / 2,
      width, height, 0x000000, 0.7
    ).setDepth(50).setScrollFactor(0);

    const chText = this.add.text(width / 2, height * 0.42, chapter, {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#c9a84c',
      letterSpacing: 6
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setAlpha(0);

    const titleText = this.add.text(width / 2, height * 0.5, title, {
      fontFamily: 'Georgia',
      fontSize: '36px',
      color: '#f5e6c0',
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
        onComplete: () => { overlay.destroy(); chText.destroy(); titleText.destroy(); line.destroy(); }
      });
    });
  }

  update() {
    this.handlePlayerMovement();
    this.handleNPCInteraction();
    this.playerShadow.setPosition(this.player.x, this.player.y + 22);
  }

  handlePlayerMovement() {
    const speed = this.moveSpeed;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;

    // Touch joystick (adds on top of keyboard)
    vx += touchInput.vx * speed;
    vy += touchInput.vy * speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    // Directional walk animations
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

  handleNPCInteraction() {
    this.npcs.forEach(npc => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        npc.x, npc.y
      );

      const inRange = dist < 80;
      if (npc.interactLabel) {
        this.tweens.add({
          targets: npc.interactLabel,
          alpha: inRange ? 1 : 0,
          duration: 200
        });
      }

      const triggered = inRange && (
        Phaser.Input.Keyboard.JustDown(this.interactKey) ||
        touchInput.actionPressed
      );

      if (triggered) {
        touchInput.actionPressed = false;
        if (!gameState.isBeatComplete(npc.dialogueId)) {
          this.startDialogue(npc.dialogueId);
        }
      }
    });
  }

  startDialogue(dialogueId) {
    this.player.setVelocity(0, 0);
    audioManager.stopAmbient();
    this.scene.launch('DialogueScene', {
      dialogueId,
      callerScene: 'BethlehemScene'
    });
    this.scene.pause('BethlehemScene');
  }

  showValleyPortal() {
    const portalX = 640;  // gap at cols 19-20 = x 608-672, center = 640
    const portalY = 60;

    // Blinking marker arrow
    const arrow = this.add.text(portalX, portalY, '▲ Valley of Elah', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#ff8844',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 4 },
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Trigger zone matches the 2-tile gap in the top wall
    const zone = this.add.zone(portalX, portalY + 20, 64, 80).setDepth(20);
    this.physics.world.enable(zone);

    this.physics.add.overlap(this.player, zone, () => {
      if (this.scene.isActive('ValleyScene')) return;
      audioManager.stopAmbient();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('BethlehemScene');
        this.scene.start('ValleyScene');
      });
    });
  }
}
