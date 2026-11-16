// EnGediScene.js
// Chapter 4 — The Caves of En Gedi. Spare Saul.

import gameState from '../systems/GameState.js';
import DIALOGUES from '../data/DialogueData.js';
import audioManager from '../systems/AudioManager.js';
import { touchInput } from '../systems/TouchInput.js';
import { addProps, addProp, hasProp, track, sortActor, sortTracked } from '../systems/World.js';

export default class EnGediScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EnGediScene' });
    this.player = null;
    this.cursors = null;
    this.moveSpeed = 100;
    this.chapterDone = false;
    this.dialogueTriggered = false;
  }

  create() {
    const { width, height } = this.scale;

    this.buildMap();

    // Player enters from the bottom-center (cave entrance)
    this.player = this.physics.add.sprite(480, 544, 'david_walk', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(this.registry.get('playerScale') ?? 3);
    track(this, this.player);

    this.playerShadow = this.add.ellipse(
      this.player.x, this.player.y + 20,
      28, 10, 0x000000, 0.35
    ).setDepth(4);

    this.physics.add.collider(this.player, this.wallLayer);
    // Blender-rendered stalagmites around the cave floor.
    const caveProps = addProps(this, [
      ['stalagmite', 110, 186], ['stalagmite', 850, 476], ['stalagmite', 130, 526],
      ['stalagmite', 860, 306], ['stalagmite', 330, 146], ['stalagmite', 620, 546],
      ['stalagmite', 300, 446], ['rock', 560, 130], ['rock', 180, 380],
    ]);
    if (this.propBodies) this.physics.add.collider(this.player, this.propBodies);
    // The art is lit for daylight; cool and darken it so the cave reads as a cave.
    if (this.registry.get('tiles3d')) {
      const CAVE_TINT = 0x7f86ad;
      this.groundLayer.setTint(CAVE_TINT);
      this.wallLayer.setTint(CAVE_TINT);
      caveProps.forEach(p => p && p.setTint(CAVE_TINT));
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 960, 640);
    this.physics.world.setBounds(0, 0, 960, 640);

    // Darken the scene for cave atmosphere
    this.cameras.main.setBackgroundColor('#050810');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.createDeepCaveTrigger();
    this.createCaveAtmosphere();

    gameState.checkpoint('EnGediScene', 4, 'The Cave of En Gedi');
    this.showChapterTitle('Chapter IV', 'The Cave of En Gedi');

    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
    this.scene.get('UIScene').events.emit('sceneChanged', 'EnGediScene');

    this.cameras.main.fadeIn(1500, 0, 0, 0);
    audioManager.playAmbientCave();

    this.events.on('resume', () => {
      if (gameState.isBeatComplete('spare_saul') && !this.chapterDone) {
        this.chapterDone = true;
        gameState.unlockPsalm('psalm_27');
        gameState.adjustHeart(15);
        this.showChapterComplete();
      }
    });
  }

  buildMap() {
    const map = this.make.tilemap({ key: 'en_gedi' });
    const tileset = map.addTilesetImage('tiles', 'tiles');
    this.groundLayer = map.createLayer('ground', tileset, 0, 0);
    this.wallLayer   = map.createLayer('walls',  tileset, 0, 0);
    this.wallLayer.setCollisionByExclusion([-1, 0]);
  }

  createDeepCaveTrigger() {
    // Zone at the top of the cave — deep chamber where Saul enters
    const triggerZone = this.add.zone(480, 128, 832, 160).setDepth(0);
    this.physics.world.enable(triggerZone);
    triggerZone.body.setAllowGravity(false);
    triggerZone.body.setImmovable(true);

    // Marker hint — blinks at the cave depth
    const hint = this.add.text(480, 170, '↑ Deep in the cave...', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#8a9a7a',
      backgroundColor: '#00000099',
      padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.2 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    this.physics.add.overlap(this.player, triggerZone, () => {
      if (!this.dialogueTriggered && !gameState.isBeatComplete('spare_saul')) {
        this.dialogueTriggered = true;
        hint.destroy();
        this.time.delayedCall(400, () => this.startDialogue('spare_saul'));
      }
    });
  }

  createCaveAtmosphere() {
    const { width, height } = this.scale;

    // Dripping water effect — slow falling drops
    for (let i = 0; i < 12; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(64, width - 64),
        Phaser.Math.Between(0, height),
        2, 6,
        0x334466,
        Phaser.Math.FloatBetween(0.3, 0.7)
      ).setDepth(18);

      this.tweens.add({
        targets: drop,
        y: drop.y + Phaser.Math.Between(40, 80),
        alpha: 0,
        duration: Phaser.Math.Between(1500, 3000),
        repeat: -1,
        delay: i * 300,
        onRepeat: () => {
          drop.setPosition(
            Phaser.Math.Between(64, width - 64),
            Phaser.Math.Between(-20, 0)
          );
          drop.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
        }
      });
    }

    // Torch near entrance — the only light source
    const torch = { x: 480, y: 530 };
    for (let i = 0; i < 5; i++) {
      const flame = this.add.circle(
        torch.x + Phaser.Math.Between(-3, 3),
        torch.y,
        4,
        0xff7722,
        Phaser.Math.FloatBetween(0.5, 0.9)
      ).setDepth(16);

      this.tweens.add({
        targets: flame,
        alpha: { from: 0.9, to: 0.1 },
        y: torch.y - Phaser.Math.Between(5, 14),
        duration: Phaser.Math.Between(300, 600),
        yoyo: true,
        repeat: -1,
        delay: i * 100
      });
    }
  }

  showChapterTitle(chapter, title) {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(50).setScrollFactor(0);

    const chText = this.add.text(width / 2, height * 0.42, chapter, {
      fontFamily: 'Georgia', fontSize: '16px', color: '#c9a84c', letterSpacing: 6
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setAlpha(0);

    const titleText = this.add.text(width / 2, height * 0.5, title, {
      fontFamily: 'Georgia', fontSize: '30px', color: '#f5e6c0'
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setAlpha(0);

    const sub = this.add.text(width / 2, height * 0.6,
      '"The LORD forbid that I should touch His anointed."\n— 1 Samuel 24:6',
      {
        fontFamily: 'Georgia', fontSize: '13px', color: '#8a9a7a',
        align: 'center', lineSpacing: 6, fontStyle: 'italic'
      }
    ).setOrigin(0.5).setDepth(51).setScrollFactor(0).setAlpha(0);

    const line = this.add.graphics().setDepth(51).setScrollFactor(0).setAlpha(0);
    line.lineStyle(1, 0xc9a84c, 0.5);
    line.lineBetween(width / 2 - 120, height * 0.47, width / 2 + 120, height * 0.47);

    this.tweens.add({ targets: [chText, line, titleText, sub], alpha: 1, duration: 900, delay: 400 });
    this.time.delayedCall(3200, () => {
      this.tweens.add({
        targets: [overlay, chText, titleText, line, sub],
        alpha: 0,
        duration: 700,
        onComplete: () => {
          overlay.destroy(); chText.destroy(); titleText.destroy();
          line.destroy(); sub.destroy();
        }
      });
    });
  }

  showChapterComplete() {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(60).setScrollFactor(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.92,
      duration: 1200,
      onComplete: () => {
        const title = this.add.text(width / 2, height * 0.3, '✦ Chapter IV Complete ✦', {
          fontFamily: 'Georgia', fontSize: '22px', color: '#c9a84c', letterSpacing: 3
        }).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        const verse = this.add.text(width / 2, height * 0.46,
          '"Saul lifted his voice and wept.\nAnd he said to David,\nYou are more righteous than I."\n— 1 Samuel 24:16-17',
          {
            fontFamily: 'Georgia', fontSize: '17px', color: '#f5e6c0',
            align: 'center', lineSpacing: 10, fontStyle: 'italic'
          }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        const psalm = this.add.text(width / 2, height * 0.72,
          '✦ Psalm 27 unlocked in your journal ✦',
          { fontFamily: 'Georgia', fontSize: '13px', color: '#c9a84c' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        const cont = this.add.text(width / 2, height * 0.86,
          '[ Click or press Space to continue ]',
          { fontFamily: 'Georgia', fontSize: '12px', color: '#8a7a60' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0);

        this.tweens.add({ targets: [title, verse, psalm, cont], alpha: 1, duration: 1000, delay: 300 });

        this.tweens.add({
          targets: cont,
          alpha: { from: 1, to: 0.2 },
          duration: 900, yoyo: true, repeat: -1,
          delay: 1500
        });

        this.time.delayedCall(600, () => {
          this.input.once('pointerdown', () => this.returnToTitle());
          this.input.keyboard.once('keydown-SPACE', () => this.returnToTitle());
        });
      }
    });
  }

  returnToTitle() {
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('EnGediScene');
      this.scene.stop('UIScene');
      this.scene.start('TitleScene');
    });
  }

  startDialogue(dialogueId) {
    this.player.setVelocity(0, 0);
    audioManager.stopAmbient();
    this.scene.launch('DialogueScene', {
      dialogueId,
      callerScene: 'EnGediScene'
    });
    this.scene.pause('EnGediScene');
  }

  update() {
    this.handlePlayerMovement();
    this.playerShadow.setPosition(this.player.x, this.player.y + 22);
    sortTracked(this);
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
}
