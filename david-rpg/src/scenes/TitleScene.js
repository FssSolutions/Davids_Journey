// TitleScene.js
// Cinematic title screen — starry sky, animated title, scripture verse

import gameState from '../systems/GameState.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
    this.stars = [];
  }

  create() {
    const { width, height } = this.scale;

    // ── Background gradient (night sky) ──
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x020408, 0x020408, 0x0a0e1a, 0x0a0e1a, 1);
    sky.fillRect(0, 0, width, height);

    // ── Stars ──
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.75);
      const size = Math.random() < 0.15 ? 2 : 1;
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0);
      const star = this.add.rectangle(x, y, size, size, 0xffffff, alpha);
      this.stars.push(star);

      // Twinkle
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(1200, 3500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // ── Ground silhouette (hills of Bethlehem) ──
    const ground = this.add.graphics();
    ground.fillStyle(0x0e0905);
    ground.fillTriangle(0, height, 220, height * 0.65, 440, height);
    ground.fillTriangle(280, height, 520, height * 0.58, 760, height);
    ground.fillTriangle(600, height, 820, height * 0.62, width, height);
    ground.fillRect(0, height * 0.82, width, height * 0.18);

    // ── Subtitle eyebrow ──
    const eyebrow = this.add.text(width / 2, height * 0.25, 'A BIBLICAL EPIC', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#c9a84c',
      letterSpacing: 8,
      alpha: 0
    }).setOrigin(0.5);

    // ── Main Title ──
    const title = this.add.text(width / 2, height * 0.38, 'Son of Jesse', {
      fontFamily: 'Georgia',
      fontSize: '72px',
      color: '#f5e6c0',
      stroke: '#2a1a05',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 12, fill: true },
      alpha: 0
    }).setOrigin(0.5);

    // ── Divider ──
    const divider = this.add.graphics().setAlpha(0);
    divider.lineStyle(1, 0xc9a84c, 0.6);
    divider.lineBetween(width / 2 - 160, height * 0.49, width / 2 + 160, height * 0.49);

    // Small cross / star of david in center of divider
    divider.lineStyle(1, 0xc9a84c, 0.9);
    divider.lineBetween(width / 2 - 6, height * 0.49 - 6, width / 2 + 6, height * 0.49 + 6);
    divider.lineBetween(width / 2 + 6, height * 0.49 - 6, width / 2 - 6, height * 0.49 + 6);

    // ── Scripture verse ──
    const verse = this.add.text(
      width / 2,
      height * 0.54,
      '"The LORD does not look at the things people look at.\nPeople look at the outward appearance,\nbut the LORD looks at the heart."\n— 1 Samuel 16:7',
      {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#d4c4a0',
        align: 'center',
        lineSpacing: 6,
        alpha: 0
      }
    ).setOrigin(0.5);

    // ── Menu options ──
    const menuY = height * 0.76;
    const hasSave = gameState.hasSave();

    const startScene = (sceneKey) => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(sceneKey);
        this.scene.launch('UIScene');
      });
    };

    const menuItems = [
      {
        label: hasSave ? 'New Game' : 'Begin Journey',
        enabled: true,
        action: () => { gameState.reset(); startScene('BethlehemScene'); }
      },
      {
        // Only selectable when a save exists; resume that chapter.
        label: hasSave ? 'Continue' : 'Continue (no save)',
        enabled: hasSave,
        action: () => {
          if (gameState.load()) startScene(gameState.get().currentScene || 'BethlehemScene');
        }
      },
      { label: 'Scripture Codex', enabled: false, action: null },
    ];

    const menuTexts = menuItems.map((item, i) => {
      const t = this.add.text(width / 2, menuY + i * 36, item.label, {
        fontFamily: 'Georgia',
        fontSize: '18px',
        color: item.enabled ? '#f5e6c0' : '#6a5a48',
        alpha: 0
      }).setOrigin(0.5).setInteractive({ useHandCursor: item.enabled });

      if (item.enabled && item.action) {
        t.on('pointerover', () => t.setColor('#c9a84c').setScale(1.05));
        t.on('pointerout',  () => t.setColor('#f5e6c0').setScale(1));
        t.on('pointerdown', () => item.action());
      }

      return t;
    });

    // ── Cinematic reveal sequence ──
    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: eyebrow, alpha: 0.8, duration: 1200 });
    });
    this.time.delayedCall(800, () => {
      this.tweens.add({ targets: title, alpha: 1, y: height * 0.37, duration: 1400, ease: 'Sine.easeOut' });
    });
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: divider, alpha: 1, duration: 800 });
    });
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: verse, alpha: 1, duration: 1000 });
    });
    this.time.delayedCall(2600, () => {
      menuTexts.forEach((t, i) => {
        this.tweens.add({ targets: t, alpha: 1, duration: 600, delay: i * 150 });
      });
    });

    // Ambient gold glow pulse behind title
    const glow = this.add.circle(width / 2, height * 0.37, 200, 0xc9a84c, 0.04);
    glow.setDepth(-1);
    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.01,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
  }
}
