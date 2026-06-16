// BootScene.js
// Loads all assets and transitions to Title

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 400, 12, 0x2a1f0e);
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 12, 0xc9a84c);
    bar.setOrigin(0, 0.5);

    const label = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#c9a84c',
      alpha: 0.7
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 400 * value;
    });

    this.load.on('complete', () => {
      label.setText('Ready');
    });

    // ── Placeholder graphics (painted at runtime) ──
    // In a real build these would be real sprite sheets / tilemaps.
    // We generate them here so the game runs without external files.

    this.createPlaceholderTextures();

    // ── Real sprites (gated by manifest.json — only present after generate-sprites.js) ──
    this.load.json('sprite_manifest', 'src/assets/sprites/manifest.json');
    ['south', 'north', 'west', 'east'].forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`david_${dir}_${i}`, `src/assets/sprites/david_${dir}_${i}.png`);
      }
    });
    this.load.image('david_img', 'src/assets/sprites/david_base.png');
    ['samuel', 'jonathan', 'saul', 'philistine', 'goliath', 'israelite'].forEach(k =>
      this.load.image(`${k}_img`, `src/assets/sprites/${k}_base.png`)
    );
    // Directional sprites (front + 3 consistent rotations) for 4-sided facing.
    ['samuel', 'saul', 'jonathan', 'philistine', 'israelite', 'jesse'].forEach(c =>
      ['south', 'north', 'west', 'east'].forEach(d =>
        this.load.image(`${c}_${d}`, `src/assets/sprites/${c}_${d}.png`)
      )
    );
    ['david', 'samuel', 'jonathan', 'saul', 'goliath',
     'jesse', 'eliab', 'abishai', 'israelite_soldier'].forEach(k =>
      this.load.image(`portrait_${k}`, `src/assets/portraits/${k}.png`)
    );
    ['stone', 'heart', 'faith_orb', 'goliath_sword'].forEach(k =>
      this.load.image(`${k}_img`, `src/assets/sprites/items/${k}.png`)
    );
  }

  createPlaceholderTextures() {
    // David sprite (16x16 tiles, 4 walk frames per direction)
    const davidGfx = this.make.graphics({ x: 0, y: 0, add: false });

    // Idle frame — simple pixel-art silhouette
    davidGfx.fillStyle(0xd4a464); // skin
    davidGfx.fillRect(6, 0, 4, 4);   // head
    davidGfx.fillStyle(0x8b4513); // tunic
    davidGfx.fillRect(5, 4, 6, 6);   // body
    davidGfx.fillStyle(0xd4a464);
    davidGfx.fillRect(4, 10, 2, 5);  // left leg
    davidGfx.fillRect(10, 10, 2, 5); // right leg
    davidGfx.fillRect(3, 4, 2, 4);   // left arm
    davidGfx.fillRect(11, 4, 2, 4);  // right arm
    // sling
    davidGfx.fillStyle(0xc9a84c);
    davidGfx.fillRect(11, 5, 3, 1);

    davidGfx.generateTexture('david', 16, 16);
    davidGfx.destroy();

    // Enemy — Philistine soldier (16x16)
    const enemyGfx = this.make.graphics({ x: 0, y: 0, add: false });
    enemyGfx.fillStyle(0x4a4a6a); // armor
    enemyGfx.fillRect(6, 0, 4, 4);   // head
    enemyGfx.fillRect(5, 4, 6, 7);   // body
    enemyGfx.fillStyle(0x6a6a8a);
    enemyGfx.fillRect(4, 10, 2, 5);
    enemyGfx.fillRect(10, 10, 2, 5);
    enemyGfx.fillRect(3, 4, 2, 4);
    enemyGfx.fillRect(11, 4, 2, 4);
    // spear
    enemyGfx.fillStyle(0xaaaaaa);
    enemyGfx.fillRect(12, 0, 1, 8);
    enemyGfx.generateTexture('enemy', 16, 16);
    enemyGfx.destroy();

    // Goliath (32x48 — big)
    const goliathGfx = this.make.graphics({ x: 0, y: 0, add: false });
    goliathGfx.fillStyle(0x3a3a5a);
    goliathGfx.fillRect(10, 0, 12, 10);  // head
    goliathGfx.fillRect(8, 10, 16, 20);  // body
    goliathGfx.fillStyle(0x7a7a9a);
    goliathGfx.fillRect(6, 30, 6, 18);
    goliathGfx.fillRect(20, 30, 6, 18);
    goliathGfx.fillRect(4, 10, 4, 14);
    goliathGfx.fillRect(24, 10, 4, 14);
    goliathGfx.fillStyle(0xcccccc); // sword
    goliathGfx.fillRect(26, 2, 3, 20);
    goliathGfx.generateTexture('goliath', 32, 48);
    goliathGfx.destroy();

    // Israelite soldier (16x16) — David's army, bronze/tan
    const isrGfx = this.make.graphics({ x: 0, y: 0, add: false });
    isrGfx.fillStyle(0xd4a464); // face
    isrGfx.fillRect(6, 0, 4, 4);    // head
    isrGfx.fillStyle(0x8a6a3a);     // bronze tunic
    isrGfx.fillRect(5, 4, 6, 7);    // body
    isrGfx.fillStyle(0xb89050);
    isrGfx.fillRect(4, 10, 2, 5);
    isrGfx.fillRect(10, 10, 2, 5);
    isrGfx.fillRect(3, 4, 2, 4);
    isrGfx.fillRect(11, 4, 2, 4);
    // spear
    isrGfx.fillStyle(0xcccccc);
    isrGfx.fillRect(3, 0, 1, 8);
    isrGfx.generateTexture('israelite', 16, 16);
    isrGfx.destroy();

    // Tileset — desert/earth tones (32x32 tile, we make 4 tiles in a row)
    const tileGfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Tile 0 — sand ground
    tileGfx.fillStyle(0xc2a05a);
    tileGfx.fillRect(0, 0, 32, 32);
    tileGfx.fillStyle(0xb8965a, 0.4);
    tileGfx.fillRect(4, 4, 6, 2);
    tileGfx.fillRect(18, 12, 4, 2);
    // Tile 1 — stone floor
    tileGfx.fillStyle(0x8a7a6a);
    tileGfx.fillRect(32, 0, 32, 32);
    tileGfx.fillStyle(0x6a5a4a);
    tileGfx.fillRect(32, 0, 16, 16);
    tileGfx.fillRect(48, 16, 16, 16);
    // Tile 2 — wall / rock
    tileGfx.fillStyle(0x5a4a3a);
    tileGfx.fillRect(64, 0, 32, 32);
    tileGfx.fillStyle(0x4a3a2a);
    tileGfx.fillRect(68, 4, 8, 8);
    tileGfx.fillRect(76, 16, 10, 6);
    // Tile 3 — grass
    tileGfx.fillStyle(0x5a7a3a);
    tileGfx.fillRect(96, 0, 32, 32);
    tileGfx.fillStyle(0x4a6a2a);
    tileGfx.fillRect(100, 8, 4, 8);
    tileGfx.fillRect(112, 4, 4, 10);
    // Tile 4 — water / stream
    tileGfx.fillStyle(0x2a5a8a);
    tileGfx.fillRect(128, 0, 32, 32);
    tileGfx.fillStyle(0x3a7aaa, 0.7);
    tileGfx.fillRect(130, 4, 10, 4);
    tileGfx.fillRect(144, 14, 12, 4);
    tileGfx.fillStyle(0x5aaacc, 0.4);
    tileGfx.fillRect(132, 22, 8, 3);
    // Tile 5 — dark dirt / valley floor
    tileGfx.fillStyle(0x7a6040);
    tileGfx.fillRect(160, 0, 32, 32);
    tileGfx.fillStyle(0x6a5030, 0.5);
    tileGfx.fillRect(164, 6, 8, 4);
    tileGfx.fillRect(178, 18, 6, 4);
    // Tile 6 — path (lighter sand)
    tileGfx.fillStyle(0xd4b87a);
    tileGfx.fillRect(192, 0, 32, 32);
    tileGfx.fillStyle(0xc0a060, 0.4);
    tileGfx.fillRect(196, 8, 6, 2);
    tileGfx.fillRect(208, 20, 8, 2);
    // Tile 7 — dark rocky border
    tileGfx.fillStyle(0x3a3028);
    tileGfx.fillRect(224, 0, 32, 32);
    tileGfx.fillStyle(0x2a2018);
    tileGfx.fillRect(228, 4, 8, 8);
    tileGfx.fillRect(240, 16, 10, 8);
    tileGfx.generateTexture('tiles', 256, 32);
    tileGfx.destroy();

    // Projectile — sling stone
    const stoneGfx = this.make.graphics({ x: 0, y: 0, add: false });
    stoneGfx.fillStyle(0xaaaaaa);
    stoneGfx.fillCircle(4, 4, 4);
    stoneGfx.generateTexture('stone', 8, 8);
    stoneGfx.destroy();

    // NPC — Samuel (elder figure)
    const samuelGfx = this.make.graphics({ x: 0, y: 0, add: false });
    samuelGfx.fillStyle(0xd4c0a0); // skin
    samuelGfx.fillRect(6, 0, 4, 4);
    samuelGfx.fillStyle(0xf0f0e0); // white robe
    samuelGfx.fillRect(5, 4, 6, 8);
    samuelGfx.fillStyle(0xe0e0d0); // beard
    samuelGfx.fillRect(5, 3, 6, 3);
    samuelGfx.fillStyle(0xd4c0a0);
    samuelGfx.fillRect(4, 12, 2, 4);
    samuelGfx.fillRect(10, 12, 2, 4);
    samuelGfx.fillStyle(0x8b6914); // staff
    samuelGfx.fillRect(12, 4, 1, 12);
    samuelGfx.generateTexture('samuel', 16, 16);
    samuelGfx.destroy();

    // NPC — King Saul (regal figure, purple robe, crown)
    const saulGfx = this.make.graphics({ x: 0, y: 0, add: false });
    saulGfx.fillStyle(0xc9a84c); // crown
    saulGfx.fillRect(5, 0, 6, 2);
    saulGfx.fillStyle(0xd4a464); // face
    saulGfx.fillRect(6, 2, 4, 3);
    saulGfx.fillStyle(0x5a2a6a); // purple royal robe
    saulGfx.fillRect(4, 5, 8, 8);
    saulGfx.fillStyle(0xc9a84c); // gold trim
    saulGfx.fillRect(4, 5, 8, 1);
    saulGfx.fillStyle(0xd4a464);
    saulGfx.fillRect(5, 13, 2, 3);
    saulGfx.fillRect(9, 13, 2, 3);
    saulGfx.generateTexture('saul', 16, 16);
    saulGfx.destroy();

    // Heart / health icon
    const heartGfx = this.make.graphics({ x: 0, y: 0, add: false });
    heartGfx.fillStyle(0xc0392b);
    heartGfx.fillCircle(4, 4, 4);
    heartGfx.fillCircle(12, 4, 4);
    heartGfx.fillTriangle(0, 5, 16, 5, 8, 16);
    heartGfx.generateTexture('heart', 16, 16);
    heartGfx.destroy();

    // Faith/Word orb
    const faithGfx = this.make.graphics({ x: 0, y: 0, add: false });
    faithGfx.fillStyle(0xc9a84c);
    faithGfx.fillCircle(8, 8, 8);
    faithGfx.fillStyle(0xfff5cc, 0.6);
    faithGfx.fillCircle(5, 5, 3);
    faithGfx.generateTexture('faith_orb', 16, 16);
    faithGfx.destroy();

    // David walk spritesheet — 64x64 (4 cols × 4 rows of 16×16)
    // Row 0=down, 1=up, 2=left, 3=right; Col 0-3 = walk phases
    const walkGfx = this.make.graphics({ x: 0, y: 0, add: false });

    const drawDavidFrame = (gfx, ox, oy, legPhase, dir) => {
      // Shared body
      gfx.fillStyle(0xd4a464); // skin tone
      gfx.fillRect(ox + 6, oy + 0, 4, 5);  // head
      gfx.fillStyle(0x8b4513); // tunic
      gfx.fillRect(ox + 5, oy + 5, 6, 5);
      gfx.fillStyle(0xd4a464);
      gfx.fillRect(ox + 3, oy + 5, 2, 4);  // left arm
      gfx.fillRect(ox + 11, oy + 5, 2, 4); // right arm

      // Legs — 0/2 = neutral, 1 = left fwd, 3 = right fwd
      gfx.fillStyle(0x6a3010);
      if (legPhase === 0 || legPhase === 2) {
        gfx.fillRect(ox + 5,  oy + 10, 2, 6);
        gfx.fillRect(ox + 9,  oy + 10, 2, 6);
      } else if (legPhase === 1) {
        gfx.fillRect(ox + 4,  oy + 10, 2, 6);
        gfx.fillRect(ox + 10, oy + 10, 2, 5);
      } else {
        gfx.fillRect(ox + 6,  oy + 10, 2, 5);
        gfx.fillRect(ox + 8,  oy + 10, 2, 6);
      }

      // Hair
      gfx.fillStyle(0x3d1f00);
      gfx.fillRect(ox + 6, oy + 0, 4, 2);

      if (dir === 0) {
        // South — full face: eyes + mouth
        gfx.fillStyle(0x2a1a00); // dark eyes
        gfx.fillRect(ox + 7, oy + 2, 1, 1);
        gfx.fillRect(ox + 9, oy + 2, 1, 1);
        gfx.fillStyle(0xa05030); // mouth
        gfx.fillRect(ox + 8, oy + 4, 1, 1);
        // sling in right hand
        gfx.fillStyle(0xc9a84c);
        gfx.fillRect(ox + 11, oy + 7, 3, 1);
      } else if (dir === 1) {
        // North — back of head, no face; hair + neck
        gfx.fillStyle(0x3d1f00);
        gfx.fillRect(ox + 5, oy + 0, 6, 3);
        gfx.fillStyle(0xd4a464);
        gfx.fillRect(ox + 7, oy + 4, 2, 1); // neck
      } else if (dir === 2) {
        // West — left profile: one eye, nose hint, sling trailing right
        gfx.fillStyle(0x2a1a00);
        gfx.fillRect(ox + 7, oy + 2, 1, 1); // eye
        gfx.fillStyle(0xc4946a); // nose bump
        gfx.fillRect(ox + 6, oy + 3, 1, 1);
        gfx.fillStyle(0xc9a84c); // sling trailing behind
        gfx.fillRect(ox + 11, oy + 5, 3, 1);
        gfx.fillRect(ox + 13, oy + 3, 1, 3);
      } else {
        // East — right profile: one eye, nose hint, sling forward
        gfx.fillStyle(0x2a1a00);
        gfx.fillRect(ox + 8, oy + 2, 1, 1); // eye
        gfx.fillStyle(0xc4946a);
        gfx.fillRect(ox + 9, oy + 3, 1, 1); // nose bump
        gfx.fillStyle(0xc9a84c); // sling extended forward
        gfx.fillRect(ox + 2,  oy + 5, 3, 1);
        gfx.fillRect(ox + 2,  oy + 3, 1, 3);
      }
    };

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        drawDavidFrame(walkGfx, col * 16, row * 16, col, row);
      }
    }

    walkGfx.generateTexture('david_walk', 64, 64);
    walkGfx.destroy();

    const walkTex = this.textures.get('david_walk');
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        walkTex.add(row * 4 + col, 0, col * 16, row * 16, 16, 16);
      }
    }

    // NOTE: procedural portraits are intentionally NOT generated here. Generating a
    // texture named `portrait_<key>` during preload collides with the real PNG load
    // (Phaser skips loading a key that already exists), leaving basic art on screen.
    // Every dialogue character now has a real PNG in src/assets/portraits/.
  }

  createPortraitTextures() {
    const W = 90, H = 180;
    const draw = (key, fn) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      fn(g);
      g.generateTexture(key, W, H);
      g.destroy();
    };

    // ─── David — young shepherd, warm earth tones ───
    draw('portrait_david', g => {
      g.fillStyle(0x140a04); g.fillRect(0, 0, W, H);
      g.lineStyle(1.5, 0xc9a84c, 0.6); g.strokeRect(2, 2, 86, 176);
      g.lineStyle(1, 0xc9a84c, 0.2); g.strokeRect(5, 5, 80, 170);
      // Tunic body
      g.fillStyle(0x7a3812); g.fillRect(16, 90, 58, 90);
      g.fillStyle(0x6a2e0a); g.fillRect(6, 102, 18, 78); g.fillRect(66, 102, 18, 78);
      g.fillStyle(0x4a2008); g.fillRect(12, 122, 66, 7); // belt
      // Sling cord
      g.fillStyle(0xc9a84c); g.fillRect(70, 106, 14, 2); g.fillRect(82, 96, 2, 18);
      // Neck
      g.fillStyle(0xd4a464); g.fillRect(33, 76, 24, 16);
      // Face
      g.fillStyle(0xd4a464);
      g.fillRect(26, 34, 38, 44); g.fillRect(22, 40, 6, 30); g.fillRect(62, 40, 6, 30);
      g.fillRect(28, 32, 34, 4); g.fillRect(28, 76, 34, 4);
      // Hair
      g.fillStyle(0x3d1f00);
      g.fillRect(24, 20, 42, 18); g.fillRect(18, 26, 10, 28); g.fillRect(62, 26, 10, 24);
      g.fillRect(22, 46, 4, 8); g.fillRect(64, 44, 4, 8);
      // Ears
      g.fillStyle(0xc4906a); g.fillRect(20, 44, 6, 10); g.fillRect(64, 44, 6, 10);
      // Eyebrows
      g.fillStyle(0x2a1200); g.fillRect(28, 40, 14, 3); g.fillRect(48, 40, 14, 3);
      // Eye whites
      g.fillStyle(0xfff0d0); g.fillRect(28, 44, 14, 8); g.fillRect(48, 44, 14, 8);
      // Irises (warm brown)
      g.fillStyle(0x6a3a18); g.fillRect(31, 45, 8, 6); g.fillRect(51, 45, 8, 6);
      // Pupils
      g.fillStyle(0x0e0804); g.fillRect(34, 46, 4, 4); g.fillRect(54, 46, 4, 4);
      // Eye shine
      g.fillStyle(0xffffff); g.fillRect(35, 46, 1, 1); g.fillRect(55, 46, 1, 1);
      // Nose
      g.fillStyle(0xb8885a);
      g.fillRect(40, 54, 4, 8); g.fillRect(34, 60, 5, 4); g.fillRect(45, 60, 5, 4);
      // Mouth — slight smile
      g.fillStyle(0x9a4a2a); g.fillRect(32, 68, 26, 6);
      g.fillStyle(0xb86040); g.fillRect(34, 68, 22, 3);
      g.fillStyle(0xfff0e0); g.fillRect(36, 69, 18, 2); // teeth hint
      // Chin
      g.fillStyle(0xba9060); g.fillRect(30, 74, 30, 5);
    });

    // ─── Saul — king, imposing, conflicted ───
    draw('portrait_saul', g => {
      g.fillStyle(0x08040e); g.fillRect(0, 0, W, H);
      g.lineStyle(1.5, 0xc9a84c, 0.7); g.strokeRect(2, 2, 86, 176);
      g.lineStyle(1, 0xc9a84c, 0.2); g.strokeRect(5, 5, 80, 170);
      // Royal robe
      g.fillStyle(0x4a0e6a); g.fillRect(10, 90, 70, 90);
      g.fillStyle(0x3a0858); g.fillRect(4, 102, 22, 78); g.fillRect(64, 102, 22, 78);
      // Gold robe trim
      g.fillStyle(0xc9a84c);
      g.fillRect(10, 90, 70, 4); g.fillRect(10, 90, 4, 90); g.fillRect(76, 90, 4, 90);
      // Chain armor chest
      g.fillStyle(0x808090); g.fillRect(22, 92, 46, 30);
      g.fillStyle(0x9898a8);
      g.fillRect(24, 94, 42, 4); g.fillRect(24, 100, 42, 4); g.fillRect(24, 106, 42, 4);
      // Neck
      g.fillStyle(0xc8a080); g.fillRect(32, 74, 26, 18);
      // Face
      g.fillStyle(0xc8a080);
      g.fillRect(22, 30, 46, 46); g.fillRect(18, 38, 6, 30); g.fillRect(66, 38, 6, 30);
      g.fillRect(24, 28, 42, 4); g.fillRect(24, 74, 42, 4);
      // Crown band
      g.fillStyle(0xc9a84c); g.fillRect(16, 16, 58, 18);
      // Crown points
      g.fillRect(16, 6, 9, 14); g.fillRect(30, 4, 10, 16); g.fillRect(45, 4, 10, 16); g.fillRect(60, 6, 9, 14);
      // Crown jewels
      g.fillStyle(0xff4040); g.fillRect(38, 8, 14, 10);
      g.fillStyle(0x4040ff); g.fillRect(21, 10, 6, 8);
      g.fillStyle(0x40c040); g.fillRect(63, 10, 6, 8);
      // Hair under crown
      g.fillStyle(0x3a3230); g.fillRect(16, 28, 10, 36); g.fillRect(64, 28, 10, 34);
      // Gray beard
      g.fillStyle(0x5a5050); g.fillRect(20, 62, 50, 36);
      g.fillStyle(0x6a6060); g.fillRect(24, 66, 42, 28);
      g.fillStyle(0x7a7070); g.fillRect(28, 70, 34, 20);
      // Heavy brows (furrowed)
      g.fillStyle(0x2a2020); g.fillRect(24, 38, 20, 5); g.fillRect(46, 38, 20, 5);
      // Eye whites
      g.fillStyle(0xfff0d8); g.fillRect(26, 44, 16, 8); g.fillRect(48, 44, 16, 8);
      // Irises (cold blue-gray)
      g.fillStyle(0x1a3050); g.fillRect(29, 45, 10, 6); g.fillRect(51, 45, 10, 6);
      // Pupils
      g.fillStyle(0x080c18); g.fillRect(33, 46, 4, 4); g.fillRect(55, 46, 4, 4);
      g.fillStyle(0xffffff); g.fillRect(34, 46, 1, 1); g.fillRect(56, 46, 1, 1);
      // Nose
      g.fillStyle(0xaa8870);
      g.fillRect(40, 52, 6, 10); g.fillRect(32, 60, 8, 5); g.fillRect(48, 60, 8, 5);
    });

    // ─── Jonathan — noble warrior, bronze armor, kind eyes ───
    draw('portrait_jonathan', g => {
      g.fillStyle(0x060810); g.fillRect(0, 0, W, H);
      g.lineStyle(1.5, 0xc9a84c, 0.55); g.strokeRect(2, 2, 86, 176);
      g.lineStyle(1, 0xc9a84c, 0.2); g.strokeRect(5, 5, 80, 170);
      // Bronze armor
      g.fillStyle(0x7a5020); g.fillRect(12, 86, 66, 94);
      g.fillStyle(0x5a3a10); g.fillRect(6, 98, 20, 82); g.fillRect(64, 98, 20, 82);
      // Armor highlights
      g.fillStyle(0xb07838);
      g.fillRect(12, 86, 66, 6); g.fillRect(12, 86, 6, 94); g.fillRect(72, 86, 6, 94);
      // Rivets
      g.fillStyle(0xd09048);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.fillRect(18 + c*14, 96 + r*18, 4, 4);
      // Shield glimpse (right side)
      g.fillStyle(0xc09040); g.fillRect(72, 88, 14, 66);
      g.fillStyle(0x8a6020); g.fillRect(74, 90, 10, 62);
      g.fillStyle(0xd0a050); g.fillRect(76, 116, 6, 8);
      // Neck
      g.fillStyle(0xd4a070); g.fillRect(32, 74, 26, 14);
      // Face
      g.fillStyle(0xd4a070);
      g.fillRect(24, 28, 42, 48); g.fillRect(20, 36, 6, 32); g.fillRect(64, 36, 6, 30);
      g.fillRect(26, 26, 38, 4); g.fillRect(26, 74, 38, 4);
      // Short dark hair
      g.fillStyle(0x1e1200);
      g.fillRect(22, 18, 46, 16); g.fillRect(18, 24, 8, 22); g.fillRect(64, 24, 8, 20);
      // Ears
      g.fillStyle(0xb88868); g.fillRect(18, 44, 6, 10); g.fillRect(66, 44, 6, 10);
      // Eyebrows
      g.fillStyle(0x1a1000); g.fillRect(26, 36, 16, 3); g.fillRect(48, 36, 16, 3);
      // Eye whites
      g.fillStyle(0xfff0d0); g.fillRect(26, 40, 16, 8); g.fillRect(48, 40, 16, 8);
      // Irises (green/hazel)
      g.fillStyle(0x3a5018); g.fillRect(29, 41, 10, 6); g.fillRect(51, 41, 10, 6);
      // Pupils
      g.fillStyle(0x0c1004); g.fillRect(33, 42, 4, 4); g.fillRect(55, 42, 4, 4);
      g.fillStyle(0xffffff); g.fillRect(34, 42, 1, 1); g.fillRect(56, 42, 1, 1);
      // Nose
      g.fillStyle(0xb88860);
      g.fillRect(40, 50, 4, 8); g.fillRect(34, 56, 5, 4); g.fillRect(45, 56, 5, 4);
      // Friendly mouth
      g.fillStyle(0x8a4828); g.fillRect(30, 64, 30, 7);
      g.fillStyle(0xa06040); g.fillRect(32, 65, 26, 3);
      g.fillStyle(0xfff0e0); g.fillRect(34, 66, 22, 2); // slight smile
      // Chin
      g.fillStyle(0xb89060); g.fillRect(28, 74, 34, 4);
    });

    // ─── Samuel — ancient prophet, white robes, anointing oil glow ───
    draw('portrait_samuel', g => {
      g.fillStyle(0x04060e); g.fillRect(0, 0, W, H);
      g.fillStyle(0xc9a84c, 0.06); g.fillRect(20, 2, 50, 40); // holy light hint
      g.lineStyle(1.5, 0xc9a84c, 0.6); g.strokeRect(2, 2, 86, 176);
      g.lineStyle(1, 0xc9a84c, 0.2); g.strokeRect(5, 5, 80, 170);
      // Priestly robe
      g.fillStyle(0xd4ccb4); g.fillRect(12, 90, 66, 90);
      g.fillStyle(0xc4bca4); g.fillRect(6, 104, 20, 76); g.fillRect(64, 104, 20, 76);
      // Blue priestly trim (ephod)
      g.fillStyle(0x3a5a9a);
      g.fillRect(12, 90, 66, 6); g.fillRect(12, 90, 6, 90); g.fillRect(72, 90, 6, 90);
      g.fillRect(16, 148, 58, 6);
      g.fillStyle(0xc9a84c); g.fillRect(14, 96, 62, 2); // gold thread
      // Staff
      g.fillStyle(0x4a2c0e); g.fillRect(74, 64, 7, 116);
      g.fillStyle(0x7a4c1e); g.fillRect(66, 64, 14, 5); g.fillRect(68, 58, 10, 8);
      // Neck
      g.fillStyle(0xc4a080); g.fillRect(32, 76, 26, 16);
      // Face (deeply aged)
      g.fillStyle(0xc4a080);
      g.fillRect(20, 34, 50, 44); g.fillRect(16, 42, 6, 28); g.fillRect(68, 42, 6, 26);
      g.fillRect(22, 32, 46, 4); g.fillRect(22, 76, 46, 4);
      // White flowing hair
      g.fillStyle(0xe8e2d0);
      g.fillRect(16, 16, 58, 22);
      g.fillRect(10, 22, 14, 36); g.fillRect(66, 22, 14, 34);
      g.fillRect(8, 36, 8, 20); g.fillRect(74, 36, 8, 18);
      // Long white beard
      g.fillStyle(0xe0d8c8); g.fillRect(16, 68, 58, 60);
      g.fillStyle(0xece4d4); g.fillRect(20, 76, 50, 52);
      g.fillStyle(0xf0e8d8); g.fillRect(26, 82, 38, 42);
      g.fillStyle(0xfaf2e2); g.fillRect(32, 90, 26, 30);
      // Heavy white eyebrows
      g.fillStyle(0xd0c8b0); g.fillRect(22, 44, 22, 5); g.fillRect(46, 44, 22, 5);
      // Eye whites
      g.fillStyle(0xfff0e0); g.fillRect(26, 50, 16, 8); g.fillRect(48, 50, 16, 8);
      // Irises (warm hazel, aged)
      g.fillStyle(0x604a20); g.fillRect(29, 51, 10, 6); g.fillRect(51, 51, 10, 6);
      // Pupils
      g.fillStyle(0x14080a); g.fillRect(33, 52, 4, 4); g.fillRect(55, 52, 4, 4);
      g.fillStyle(0xffffff); g.fillRect(34, 52, 1, 1); g.fillRect(56, 52, 1, 1);
      // Aged bags under eyes
      g.fillStyle(0xaa8868); g.fillRect(26, 58, 16, 3); g.fillRect(48, 58, 16, 3);
      // Nose
      g.fillStyle(0xaa8868);
      g.fillRect(39, 60, 6, 10); g.fillRect(32, 68, 8, 5); g.fillRect(50, 68, 8, 5);
      // Mouth (under beard)
      g.fillStyle(0xc8a888); g.fillRect(34, 74, 22, 5);
    });

    // ─── Goliath — giant, bronze helmet, fearsome ───
    draw('portrait_goliath', g => {
      g.fillStyle(0x020204); g.fillRect(0, 0, W, H);
      g.fillStyle(0x180404, 0.6); g.fillRect(0, 0, W, 70); // blood-red atmosphere
      g.lineStyle(1.5, 0x884422, 0.7); g.strokeRect(2, 2, 86, 176);
      g.lineStyle(1, 0x664411, 0.3); g.strokeRect(5, 5, 80, 170);
      // Scale armor body
      g.fillStyle(0x303040); g.fillRect(0, 78, 90, 102);
      g.fillStyle(0x202030); g.fillRect(-4, 90, 22, 90); g.fillRect(72, 90, 22, 90);
      // Scale pattern
      g.fillStyle(0x484858);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 6; c++) {
          g.fillRect(10 + c * 14 + (r % 2) * 7, 90 + r * 16, 12, 14);
        }
      }
      g.fillStyle(0x887040); g.fillRect(0, 78, 90, 6); // armor top rim
      // Shoulder spikes
      g.fillStyle(0x8090a0);
      g.fillRect(0, 78, 12, 8); g.fillRect(78, 78, 12, 8);
      g.fillRect(2, 74, 6, 8); g.fillRect(82, 74, 6, 8);
      // Bronze helmet
      g.fillStyle(0x8a6a30); g.fillRect(10, 18, 70, 66);
      g.fillStyle(0xb09040); g.fillRect(10, 16, 70, 10); g.fillRect(10, 16, 8, 68); g.fillRect(72, 16, 8, 68);
      // Cheek guards
      g.fillStyle(0x7a5a28); g.fillRect(10, 40, 12, 46); g.fillRect(68, 40, 12, 46);
      // Nose guard
      g.fillStyle(0x8a6a30); g.fillRect(40, 28, 10, 50);
      // Red war plume
      g.fillStyle(0xaa1c1c); g.fillRect(34, 2, 22, 20); g.fillRect(28, 6, 34, 14);
      g.fillStyle(0xcc2222); g.fillRect(36, 4, 18, 10);
      // Dark face under helmet
      g.fillStyle(0x7a5a40); g.fillRect(22, 28, 46, 54);
      g.fillStyle(0x1a0e08, 0.7); g.fillRect(10, 20, 14, 44); g.fillRect(66, 20, 14, 42);
      // Fierce red-tinted eyes
      g.fillStyle(0x882020); g.fillRect(26, 44, 18, 10); g.fillRect(46, 44, 18, 10);
      g.fillStyle(0x1c0808); g.fillRect(29, 45, 12, 8); g.fillRect(49, 45, 12, 8);
      g.fillStyle(0xcc1010); g.fillRect(34, 47, 4, 4); g.fillRect(54, 47, 4, 4);
      // Brow ridge
      g.fillStyle(0x5a3a20); g.fillRect(22, 38, 22, 7); g.fillRect(46, 38, 22, 7);
      // Broad nose
      g.fillStyle(0x6a4a2a);
      g.fillRect(38, 56, 8, 12); g.fillRect(28, 64, 12, 8); g.fillRect(50, 64, 12, 8);
      // Grimacing mouth
      g.fillStyle(0x2a1008); g.fillRect(28, 72, 34, 8);
      g.fillStyle(0x804020); g.fillRect(30, 73, 30, 4);
      // Chin strap
      g.fillStyle(0x7a5a28); g.fillRect(10, 80, 70, 6);
    });
  }

  createAnimations() {
    // David keeps unprefixed anim names (walk_down, idle_down, ...) for scene compatibility.
    this._buildActorAnims('david', '');
    // NPCs & enemies get prefixed anims (e.g. samuel_walk_down, philistine_idle_left).
    ['samuel', 'saul', 'jonathan', 'philistine', 'israelite', 'jesse'].forEach(c =>
      this._buildActorAnims(c, `${c}_`)
    );
  }

  _buildActorAnims(name, prefix) {
    const sheet = `${name}_walk`;
    if (!this.textures.exists(sheet)) return;
    const rows = ['down', 'up', 'left', 'right']; // matches sheet rows south/north/west/east
    rows.forEach((d, row) => {
      const wkey = `${prefix}walk_${d}`;
      if (!this.anims.exists(wkey)) {
        this.anims.create({
          key: wkey,
          frames: [0, 1, 2, 3].map(col => ({ key: sheet, frame: row * 4 + col })),
          frameRate: 8,
          repeat: -1
        });
      }
      const ikey = `${prefix}idle_${d}`;
      if (!this.anims.exists(ikey)) {
        this.anims.create({
          key: ikey,
          frames: [{ key: sheet, frame: row * 4 }],
          frameRate: 1,
          repeat: -1
        });
      }
    });
  }

  createTilemaps() {
    // ── Bethlehem Fields — 40 × 30 tiles (1280 × 960 px) ──
    // Tile IDs (1-based): 1=sand, 2=stone, 3=wall/rock, 4=grass, 5=water, 6=darkdirt, 7=path, 8=darkrock
    const BW = 40, BH = 30;
    const bethlehemGround = [];
    const bethlehemWalls  = [];

    for (let r = 0; r < BH; r++) {
      const gRow = [];
      const wRow = [];
      for (let c = 0; c < BW; c++) {
        // Border walls (row 0, row 29, col 0, col 39) except gap at cols 19-20 on row 0 (portal)
        const isBorderTop    = r === 0 && !(c === 19 || c === 20);
        const isBorderBottom = r === BH - 1;
        const isBorderLeft   = c === 0;
        const isBorderRight  = c === BW - 1;
        const isBorder = isBorderTop || isBorderBottom || isBorderLeft || isBorderRight;

        if (isBorder) {
          gRow.push(3); // wall tile on ground layer too (visual)
          wRow.push(3); // collideable
        } else if (r >= 2 && r <= 5 && c >= 10 && c <= 18) {
          // Rock cluster upper-left area
          gRow.push(3);
          wRow.push(3);
        } else if (r >= 8 && r <= 12 && c >= 25 && c <= 32) {
          // Rock cluster right side
          gRow.push(3);
          wRow.push(3);
        } else if (r >= 18 && r <= 22 && c >= 5 && c <= 10) {
          // Rock cluster lower-left
          gRow.push(3);
          wRow.push(3);
        } else if (r >= 14 && r <= 17 && c >= 14 && c <= 18) {
          // Grass patch (Samuel's meeting area)
          gRow.push(4);
          wRow.push(0);
        } else if (r >= 20 && r <= 26 && c >= 20 && c <= 30) {
          // Grass / sheep grazing area
          gRow.push(4);
          wRow.push(0);
        } else if ((r === 10 || r === 11) && c >= 15 && c <= 22) {
          // Path running through center
          gRow.push(7);
          wRow.push(0);
        } else {
          // Default sand
          gRow.push(1);
          wRow.push(0);
        }
      }
      bethlehemGround.push(gRow);
      bethlehemWalls.push(wRow);
    }

    const bethlehemData = {
      width: BW, height: BH, tilewidth: 32, tileheight: 32,
      orientation: 'orthogonal', renderorder: 'right-down',
      tilesets: [{
        firstgid: 1, name: 'tiles',
        tilewidth: 32, tileheight: 32,
        spacing: 0, margin: 0,
        columns: 8, imagewidth: 256, imageheight: 32,
        image: 'tiles'
      }],
      layers: [
        {
          type: 'tilelayer', name: 'ground',
          width: BW, height: BH, x: 0, y: 0, opacity: 1, visible: true,
          data: bethlehemGround.flat()
        },
        {
          type: 'tilelayer', name: 'walls',
          width: BW, height: BH, x: 0, y: 0, opacity: 1, visible: true,
          data: bethlehemWalls.flat()
        }
      ]
    };

    this.cache.tilemap.add('bethlehem', {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: bethlehemData
    });

    // ── Valley of Elah — 60 × 40 tiles (1920 × 1280 px) ──
    // Stream runs roughly cols 9-24, rows 16-19
    const VW = 60, VH = 40;
    const valleyGround = [];
    const valleyWater  = [];
    const valleyWalls  = [];

    for (let r = 0; r < VH; r++) {
      const gRow = [];
      const wRow = [];
      const waRow = [];
      for (let c = 0; c < VW; c++) {
        const isBorder = r === 0 || r === VH - 1 || c === 0 || c === VW - 1;

        // Stream zone: cols 9-24, rows 16-19
        const isStream = r >= 16 && r <= 19 && c >= 9 && c <= 24;
        // Stream banks (dark dirt border around stream)
        const isStreamBank = (r >= 15 && r <= 20 && c >= 8 && c <= 25) && !isStream;
        // Ridge walls left side
        const isLeftRidge  = c >= 2 && c <= 5 && r >= 5 && r <= 35;
        // Ridge walls right side
        const isRightRidge = c >= 52 && c <= 56 && r >= 5 && r <= 35;
        // Rock clusters center-field
        const isRock = (r >= 8 && r <= 11 && c >= 28 && c <= 33) ||
                       (r >= 24 && r <= 27 && c >= 14 && c <= 18) ||
                       (r >= 28 && r <= 31 && c >= 38 && c <= 44);

        if (isBorder || isLeftRidge || isRightRidge) {
          gRow.push(8); // dark rocky border tile
          wRow.push(0);
          waRow.push(8);
        } else if (isStream) {
          gRow.push(5); // water tile
          wRow.push(5); // water on water layer
          waRow.push(0);
        } else if (isStreamBank) {
          gRow.push(6); // dark dirt near stream
          wRow.push(0);
          waRow.push(0);
        } else if (isRock) {
          gRow.push(3);
          wRow.push(0);
          waRow.push(3);
        } else {
          // Valley floor — mix of dark dirt and sand
          const isDarkFloor = (r + c) % 7 < 2;
          gRow.push(isDarkFloor ? 6 : 1);
          wRow.push(0);
          waRow.push(0);
        }
      }
      valleyGround.push(gRow);
      valleyWater.push(wRow);
      valleyWalls.push(waRow);
    }

    const valleyData = {
      width: VW, height: VH, tilewidth: 32, tileheight: 32,
      orientation: 'orthogonal', renderorder: 'right-down',
      tilesets: [{
        firstgid: 1, name: 'tiles',
        tilewidth: 32, tileheight: 32,
        spacing: 0, margin: 0,
        columns: 8, imagewidth: 256, imageheight: 32,
        image: 'tiles'
      }],
      layers: [
        {
          type: 'tilelayer', name: 'ground',
          width: VW, height: VH, x: 0, y: 0, opacity: 1, visible: true,
          data: valleyGround.flat()
        },
        {
          type: 'tilelayer', name: 'water',
          width: VW, height: VH, x: 0, y: 0, opacity: 1, visible: true,
          data: valleyWater.flat()
        },
        {
          type: 'tilelayer', name: 'walls',
          width: VW, height: VH, x: 0, y: 0, opacity: 1, visible: true,
          data: valleyWalls.flat()
        }
      ]
    };

    this.cache.tilemap.add('valley', {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: valleyData
    });

    // ── Saul's Court — 30 × 20 tiles (960 × 640 px) ──
    // Interior stone palace court with throne area, pillars, and center carpet
    const SCW = 30, SCH = 20;
    const courtGround = [];
    const courtWalls  = [];

    for (let r = 0; r < SCH; r++) {
      const gRow = [];
      const wRow = [];
      for (let c = 0; c < SCW; c++) {
        const isBorder      = r === 0 || r === SCH - 1 || c === 0 || c === SCW - 1;
        const isThroneArea  = r >= 1 && r <= 3 && c >= 9 && c <= 20;
        const isPillar      = (c === 5 || c === 24) && (r === 4 || r === 10 || r === 15);
        const isCarpet      = c >= 13 && c <= 16 && r >= 4 && r <= 18;

        if (isBorder) {
          gRow.push(3); wRow.push(3);
        } else if (isPillar) {
          gRow.push(8); wRow.push(3);
        } else if (isThroneArea) {
          gRow.push(8); wRow.push(0);
        } else if (isCarpet) {
          gRow.push(7); wRow.push(0);
        } else {
          gRow.push(2); wRow.push(0);
        }
      }
      courtGround.push(gRow);
      courtWalls.push(wRow);
    }

    const courtData = {
      width: SCW, height: SCH, tilewidth: 32, tileheight: 32,
      orientation: 'orthogonal', renderorder: 'right-down',
      tilesets: [{
        firstgid: 1, name: 'tiles',
        tilewidth: 32, tileheight: 32,
        spacing: 0, margin: 0,
        columns: 8, imagewidth: 256, imageheight: 32,
        image: 'tiles'
      }],
      layers: [
        {
          type: 'tilelayer', name: 'ground',
          width: SCW, height: SCH, x: 0, y: 0, opacity: 1, visible: true,
          data: courtGround.flat()
        },
        {
          type: 'tilelayer', name: 'walls',
          width: SCW, height: SCH, x: 0, y: 0, opacity: 1, visible: true,
          data: courtWalls.flat()
        }
      ]
    };

    this.cache.tilemap.add('saul_court', {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: courtData
    });

    // ── En Gedi Cave — 30 × 20 tiles (960 × 640 px) ──
    // Dark cave interior. Player enters from bottom, walks north to deep cave chamber.
    const EW = 30, EH = 20;
    const caveGround = [];
    const caveWalls  = [];

    for (let r = 0; r < EH; r++) {
      const gRow = [];
      const wRow = [];
      for (let c = 0; c < EW; c++) {
        const isBorder   = r === 0 || r === EH - 1 || c === 0 || c === EW - 1;
        const isInterior = r >= 2 && r <= 17 && c >= 2 && c <= 27;
        const isPool     = r >= 3 && r <= 5 && c >= 22 && c <= 25;
        const isRock     = (r >= 6 && r <= 8 && c >= 5 && c <= 7) ||
                           (r >= 11 && r <= 13 && c >= 20 && c <= 22) ||
                           (r >= 9 && r <= 10 && c >= 13 && c <= 14);
        const isDark     = isInterior && !isPool && !isRock && ((r + c) % 5 < 2);

        if (isBorder) {
          gRow.push(8); wRow.push(8);
        } else if (!isInterior) {
          gRow.push(8); wRow.push(8);
        } else if (isRock) {
          gRow.push(3); wRow.push(3);
        } else if (isPool) {
          gRow.push(5); wRow.push(0);
        } else {
          gRow.push(isDark ? 6 : 2); wRow.push(0);
        }
      }
      caveGround.push(gRow);
      caveWalls.push(wRow);
    }

    const caveData = {
      width: EW, height: EH, tilewidth: 32, tileheight: 32,
      orientation: 'orthogonal', renderorder: 'right-down',
      tilesets: [{
        firstgid: 1, name: 'tiles',
        tilewidth: 32, tileheight: 32,
        spacing: 0, margin: 0,
        columns: 8, imagewidth: 256, imageheight: 32,
        image: 'tiles'
      }],
      layers: [
        {
          type: 'tilelayer', name: 'ground',
          width: EW, height: EH, x: 0, y: 0, opacity: 1, visible: true,
          data: caveGround.flat()
        },
        {
          type: 'tilelayer', name: 'walls',
          width: EW, height: EH, x: 0, y: 0, opacity: 1, visible: true,
          data: caveWalls.flat()
        }
      ]
    };

    this.cache.tilemap.add('en_gedi', {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: caveData
    });
  }

  upgradeToRealSprites() {
    // Player: 4 animation frames per direction (true walk cycle).
    this._buildActorSheet('david', 4);
    // NPCs & enemies: 1 consistent frame per direction (rotated, same character).
    ['samuel', 'saul', 'jonathan', 'philistine', 'israelite', 'jesse'].forEach(c =>
      this._buildActorSheet(c, 1)
    );

    // Primary front-facing textures used by scenes that don't animate the actor.
    this._faceTexture('david',     'david_south_0');
    this._faceTexture('samuel',    'samuel_south');
    this._faceTexture('saul',      'saul_south');
    this._faceTexture('jonathan',  'jonathan_south');
    this._faceTexture('jesse',     'jesse_south');
    this._faceTexture('enemy',     'philistine_south');
    this._faceTexture('israelite', 'israelite_south');

    this._replaceTexture('goliath',  'goliath_img',    64, 96);
    this._replaceTexture('stone',    'stone_img',      16, 16);
    this._replaceTexture('heart',    'heart_img',      16, 16);
    this._replaceTexture('faith_orb','faith_orb_img',  16, 16);
    this.registry.set('useRealSprites', true);
    this.registry.set('playerScale', 1);
    this.registry.set('npcScale', 1.0);
    this.registry.set('enemyScale', 1.0);
    this.registry.set('goliathScale', 2.2);
    this.registry.set('loadedPortraits', ['david', 'samuel', 'jonathan', 'saul', 'goliath']);
  }

  // Build a 4x4 (dir x frame) walk spritesheet `${name}_walk` from directional images.
  // framesPerDir 4 → `${name}_${dir}_${col}`; framesPerDir 1 → `${name}_${dir}` repeated.
  _buildActorSheet(name, framesPerDir) {
    const dirs = ['south', 'north', 'west', 'east'];
    const probe = framesPerDir === 4 ? `${name}_south_0` : `${name}_south`;
    if (!this.textures.exists(probe)) return;
    const sheetKey = `${name}_walk`;
    this.textures.remove(sheetKey);
    const canvas = this.textures.createCanvas(sheetKey, 256, 256);
    const ctx = canvas.getContext();
    dirs.forEach((dir, row) => {
      for (let col = 0; col < 4; col++) {
        let srcKey = framesPerDir === 4 ? `${name}_${dir}_${col}` : `${name}_${dir}`;
        if (!this.textures.exists(srcKey)) srcKey = framesPerDir === 4 ? `${name}_${dir}_0` : `${name}_south`;
        if (!this.textures.exists(srcKey)) srcKey = framesPerDir === 4 ? `${name}_south_0` : `${name}_south`;
        if (this.textures.exists(srcKey)) {
          ctx.drawImage(this.textures.get(srcKey).getSourceImage(), col * 64, row * 64, 64, 64);
        }
      }
    });
    canvas.refresh();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        canvas.add(row * 4 + col, 0, col * 64, row * 64, 64, 64);
      }
    }
  }

  // Copy a single directional source image into a flat texture `key` for static use.
  _faceTexture(key, srcKey, size = 64) {
    if (!this.textures.exists(srcKey)) return;
    this.textures.remove(key);
    const c = this.textures.createCanvas(key, size, size);
    c.getContext().drawImage(this.textures.get(srcKey).getSourceImage(), 0, 0, size, size);
    c.refresh();
  }

  _replaceTexture(key, srcKey, w, h) {
    if (!this.textures.exists(srcKey)) return;
    this.textures.remove(key);
    const canvas = this.textures.createCanvas(key, w, h);
    canvas.getContext().drawImage(
      this.textures.get(srcKey).getSourceImage(), 0, 0, w, h
    );
    canvas.refresh();
  }

  create() {
    this.registry.set('useRealSprites', false);
    this.registry.set('playerScale', 3);
    this.registry.set('npcScale', 3);
    this.registry.set('enemyScale', 2.5);
    this.registry.set('goliathScale', 4);
    this.registry.set('loadedPortraits', []);
    if (this.cache.json.exists('sprite_manifest')) {
      this.upgradeToRealSprites();
    } else {
      this.registry.set('useRealSprites', true);
      this.registry.set('loadedPortraits', ['david', 'samuel', 'jonathan', 'saul', 'goliath']);
    }
    this.createAnimations();
    this.createTilemaps();
    this.scene.start('TitleScene');
  }
}
