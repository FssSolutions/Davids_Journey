// SaulCourtScene.js
// Chapter 3 — Saul's Palace Court. Jonathan's Covenant.

import gameState from '../systems/GameState.js';
import DIALOGUES from '../data/DialogueData.js';
import audioManager from '../systems/AudioManager.js';
import { touchInput } from '../systems/TouchInput.js';

export default class SaulCourtScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SaulCourtScene' });
    this.player = null;
    this.cursors = null;
    this.npcs = [];
    this.moveSpeed = 120;
    this.harpPlaying = false;
    this.chapterDone = false;
  }

  create() {
    const { width, height } = this.scale;

    this.buildMap();

    // Player spawns near bottom-center of court (entrance area)
    this.player = this.physics.add.sprite(480, 560, 'david_walk', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(this.registry.get('playerScale') ?? 3);
    this.player.setDepth(5);

    this.playerShadow = this.add.ellipse(
      this.player.x, this.player.y + 20,
      28, 10, 0x000000, 0.25
    ).setDepth(4);

    this.physics.add.collider(this.player, this.wallLayer);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 960, 640);
    this.physics.world.setBounds(0, 0, 960, 640);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    this.spawnJonathan(400, 352);
    this.spawnSaul(480, 80);
    this.spawnGuards();
    this.createAmbience();

    gameState.checkpoint('SaulCourtScene', 3, 'The Covenant');
    this.showChapterTitle('Chapter III', 'The Covenant');

    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
    this.scene.get('UIScene').events.emit('sceneChanged', 'SaulCourtScene');

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    audioManager.playAmbientRegal();

    this.events.on('resume', () => {
      if (gameState.isBeatComplete('jonathan_covenant') && !this.harpPlaying) {
        this.harpPlaying = true;
        this.doHarpScene();
      } else if (gameState.isBeatComplete('jonathan_warns') && !this.chapterDone) {
        this.chapterDone = true;
        this.transitionToEnGedi();
      }
    });
  }

  buildMap() {
    const map = this.make.tilemap({ key: 'saul_court' });
    const tileset = map.addTilesetImage('tiles', 'tiles');
    this.groundLayer = map.createLayer('ground', tileset, 0, 0);
    this.wallLayer   = map.createLayer('walls',  tileset, 0, 0);
    this.wallLayer.setCollisionByExclusion([-1, 0]);
  }

  spawnJonathan(x, y) {
    const jonathan = this.physics.add.sprite(x, y, 'jonathan');
    jonathan.setScale(this.registry.get('npcScale') ?? 3);
    jonathan.setDepth(5);
    jonathan.setImmovable(true);
    if (this.anims.exists('jonathan_idle_down')) jonathan.play('jonathan_idle_down');
    jonathan.name = 'jonathan';

    this.tweens.add({
      targets: jonathan,
      y: y - 4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const label = this.add.text(x, y - 40, '[E] Jonathan', {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#aaccff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    jonathan.interactLabel = label;
    jonathan.dialogueId = 'jonathan_covenant';
    this.npcs.push(jonathan);
  }

  spawnSaul(x, y) {
    const saul = this.add.sprite(x, y, 'saul');
    saul.setScale((this.registry.get('npcScale') ?? 3) * 4 / 3);
    saul.setDepth(5);
    if (this.anims.exists('saul_idle_down')) saul.play('saul_idle_down');
    this.saulSprite = saul;
    this._saulHome = { x, y };

    this._saulBob = this.tweens.add({
      targets: saul,
      y: y - 2,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  spawnGuards() {
    const positions = [
      { x: 160, y: 200 }, { x: 800, y: 200 },
      { x: 160, y: 340 }, { x: 800, y: 340 },
      { x: 160, y: 480 }, { x: 800, y: 480 },
    ];
    positions.forEach(pos => {
      this.add.sprite(pos.x, pos.y, 'israelite')
        .setScale((this.registry.get('npcScale') ?? 3) * 5 / 6).setDepth(4);
    });
  }

  createAmbience() {
    // Torch flicker at pillar positions
    const torchPositions = [
      { x: 160, y: 128 }, { x: 768, y: 128 },
      { x: 160, y: 320 }, { x: 768, y: 320 },
      { x: 160, y: 480 }, { x: 768, y: 480 },
    ];
    torchPositions.forEach(pos => {
      for (let i = 0; i < 3; i++) {
        const flame = this.add.circle(
          pos.x + Phaser.Math.Between(-2, 2),
          pos.y - 8,
          3,
          0xff9933,
          Phaser.Math.FloatBetween(0.4, 0.9)
        ).setDepth(15);

        this.tweens.add({
          targets: flame,
          alpha: { from: 0.9, to: 0.1 },
          y: pos.y - 8 - Phaser.Math.Between(4, 10),
          duration: Phaser.Math.Between(350, 700),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: i * 120
        });
      }
    });
  }

  doHarpScene() {
    const { width, height } = this.scale;
    this.inCinematic = true;
    this.player.setVelocity(0, 0);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(40).setScrollFactor(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.65,
      duration: 900,
      onComplete: () => {
        const text = this.add.text(width / 2, height * 0.42,
          'The Spirit of the LORD had departed from Saul,\nand a harmful spirit — which God permitted — tormented him.\nBut when David played his harp, Saul found relief.',
          {
            fontFamily: 'Georgia', fontSize: '18px', color: '#f5e6c0',
            align: 'center', lineSpacing: 10
          }
        ).setOrigin(0.5).setDepth(41).setScrollFactor(0).setAlpha(0);

        const verse = this.add.text(width / 2, height * 0.64,
          '"Whenever the harmful spirit was upon Saul, David took the lyre\nand played, and Saul was refreshed, and the harmful spirit\ndeparted from him."\n— 1 Samuel 16:23',
          {
            fontFamily: 'Georgia', fontSize: '13px', color: '#c9a84c',
            align: 'center', lineSpacing: 6, fontStyle: 'italic'
          }
        ).setOrigin(0.5).setDepth(41).setScrollFactor(0).setAlpha(0);

        this.tweens.add({ targets: [text, verse], alpha: 1, duration: 1000, delay: 200 });

        this.time.delayedCall(4800, () => {
          this.tweens.add({
            targets: [overlay, text, verse],
            alpha: 0,
            duration: 700,
            onComplete: () => {
              overlay.destroy(); text.destroy(); verse.destroy();
              // The evil spirit rushes on Saul — he hurls his spear at David.
              this.doSaulSpearScene();
            }
          });
        });
      }
    });
  }

  // The evil spirit rushes on Saul; he hurls his spear at David, who evades twice.
  doSaulSpearScene() {
    this.inCinematic = true;
    this.player.setVelocity(0, 0);
    this.player.anims.play('idle_down', true);

    const saul = this.saulSprite;
    // David stands before the throne (as if playing the harp).
    this.tweens.add({
      targets: this.player, x: saul.x - 28, y: saul.y + 150,
      duration: 700, ease: 'Sine.easeInOut',
      onUpdate: () => this.playerShadow.setPosition(this.player.x, this.player.y + 22),
      onComplete: () => {
        this.time.delayedCall(500, () => {
          if (this._saulBob) this._saulBob.stop();
          saul.setTint(0xff6a6a); // troubled
          this.tweens.add({ targets: saul, x: saul.x + 3, duration: 60, yoyo: true, repeat: 6 });
          this.cameras.main.shake(400, 0.005);

          this.throwSpear(() => {
            this.time.delayedCall(450, () => {
              this.throwSpear(() => {
                saul.clearTint();
                saul.setPosition(this._saulHome.x, this._saulHome.y);
                this.showCourtCard(
                  '"And Saul hurled the spear, for he thought, I will pin David to the wall.\nBut David evaded him twice."',
                  '1 Samuel 18:11', 3000,
                  () => this.endSpearScene()
                );
              });
            });
          });
        });
      }
    });
  }

  throwSpear(onDone) {
    const saul = this.saulSprite;
    const fromX = saul.x, fromY = saul.y + 18;
    const targetX = this.player.x, targetY = this.player.y;

    const spear = this.add.container(fromX, fromY).setDepth(15);
    const shaft = this.add.rectangle(0, 0, 46, 4, 0x8a6a3a);
    const tip   = this.add.rectangle(25, 0, 9, 6, 0xcfd2d6);
    spear.add([shaft, tip]);
    const ang = Phaser.Math.Angle.Between(fromX, fromY, targetX, targetY);
    spear.setRotation(ang);

    // Saul's throwing lunge.
    this.tweens.add({ targets: saul, y: saul.y - 6, duration: 120, yoyo: true });

    // Spear flies past where David stood and sticks beyond him.
    const overX = targetX + Math.cos(ang) * 130;
    const overY = targetY + Math.sin(ang) * 130;
    this.tweens.add({
      targets: spear, x: overX, y: overY, duration: 430, ease: 'Quad.easeIn',
      onComplete: () => {
        this.cameras.main.shake(120, 0.006);
        this.tweens.add({
          targets: spear, angle: spear.angle + 4, duration: 80, yoyo: true, repeat: 2,
          onComplete: () => this.tweens.add({
            targets: spear, alpha: 0, duration: 600, delay: 500,
            onComplete: () => spear.destroy()
          })
        });
        if (onDone) onDone();
      }
    });

    // David lunges aside just before impact.
    this.time.delayedCall(230, () => {
      const dodge = (this.player.x <= saul.x) ? -44 : 44;
      this.player.anims.play(dodge < 0 ? 'walk_left' : 'walk_right', true);
      this.tweens.add({
        targets: this.player, x: this.player.x + dodge, duration: 180, ease: 'Quad.easeOut',
        onUpdate: () => this.playerShadow.setPosition(this.player.x, this.player.y + 22),
        onComplete: () => this.player.anims.play('idle_down', true)
      });
    });
  }

  endSpearScene() {
    this.inCinematic = false;
    const jonathan = this.npcs.find(n => n.name === 'jonathan');
    if (jonathan) {
      jonathan.dialogueId = 'jonathan_warns';
      if (jonathan.interactLabel) {
        jonathan.interactLabel.setText('[E] Jonathan');
        jonathan.interactLabel.setColor('#ffaaaa');
      }
    }
  }

  showCourtCard(text, reference, holdMs, onDone) {
    const { width, height } = this.scale;
    const bar = this.add.graphics().setScrollFactor(0).setDepth(55);
    bar.fillStyle(0x000000, 0.72);
    bar.fillRect(0, height * 0.60, width, height * 0.26);

    const ref = this.add.text(width / 2, height * 0.62, reference, {
      fontFamily: 'Georgia', fontSize: '11px', color: '#c9a84c', fontStyle: 'italic'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(56).setAlpha(0);

    const body = this.add.text(width / 2, height * 0.66, text, {
      fontFamily: 'Georgia', fontSize: '15px', color: '#f5e6c0',
      align: 'center', lineSpacing: 6, wordWrap: { width: width - 100 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(56).setAlpha(0);

    this.tweens.add({ targets: [bar, ref, body], alpha: 1, duration: 400 });
    this.time.delayedCall(holdMs, () => {
      this.tweens.add({
        targets: [bar, ref, body], alpha: 0, duration: 400,
        onComplete: () => { bar.destroy(); ref.destroy(); body.destroy(); if (onDone) onDone(); }
      });
    });
  }

  transitionToEnGedi() {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(60).setScrollFactor(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.92,
      duration: 1000,
      onComplete: () => {
        const skip = this.add.text(width / 2, height * 0.38,
          'Years pass in the wilderness.',
          { fontFamily: 'Georgia', fontSize: '20px', color: '#8a9a7a', align: 'center' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        const text = this.add.text(width / 2, height * 0.5,
          'David flees from Saul\'s wrath.\nHe hides in the caves of En Gedi...',
          { fontFamily: 'Georgia', fontSize: '22px', color: '#f5e6c0', align: 'center', lineSpacing: 10 }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        const verse = this.add.text(width / 2, height * 0.68,
          '"When Saul took three thousand men... to search for David among the crags of the wild goats."\n— 1 Samuel 24:2',
          { fontFamily: 'Georgia', fontSize: '12px', color: '#c9a84c', align: 'center', lineSpacing: 6, fontStyle: 'italic' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        this.tweens.add({ targets: [skip, text, verse], alpha: 1, duration: 900, delay: 200 });

        this.time.delayedCall(4000, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('SaulCourtScene');
            this.scene.start('EnGediScene');
          });
        });
      }
    });
  }

  showChapterTitle(chapter, title) {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(50).setScrollFactor(0);

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
        onComplete: () => { overlay.destroy(); chText.destroy(); titleText.destroy(); line.destroy(); }
      });
    });
  }

  update() {
    if (this.inCinematic) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 22);
      return;
    }
    this.handlePlayerMovement();
    this.handleNPCInteraction();
    this.playerShadow.setPosition(this.player.x, this.player.y + 22);
  }

  handlePlayerMovement() {
    const speed = this.moveSpeed;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;

    vx += touchInput.vx * speed;
    vy += touchInput.vy * speed;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
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

  handleNPCInteraction() {
    this.npcs.forEach(npc => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, npc.x, npc.y
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

      if (triggered && npc.dialogueId) {
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
      callerScene: 'SaulCourtScene'
    });
    this.scene.pause('SaulCourtScene');
  }
}
