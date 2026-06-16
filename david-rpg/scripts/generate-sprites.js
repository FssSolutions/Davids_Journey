#!/usr/bin/env node
/**
 * Generates pixel art sprites and portraits using the PixelLab API.
 *
 * Usage: node scripts/generate-sprites.js
 * Requires Node.js 18+ (native fetch).
 * Set PIXELLAB_API_KEY in a .env file next to this project.
 *
 * Output locations:
 *   src/assets/sprites/david_{dir}_{frame}.png  — David walk animation (64×64 each)
 *   src/assets/sprites/{char}_base.png           — Static NPC / enemy sprites
 *   src/assets/sprites/items/{item}.png          — Item sprites
 *   src/assets/portraits/{char}.png              — Dialogue portraits (128×128)
 *   src/assets/sprites/manifest.json             — Signals the game to use real sprites
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const SPRITE_DIR  = path.join(ROOT, 'src', 'assets', 'sprites');
const PORTRAIT_DIR = path.join(ROOT, 'src', 'assets', 'portraits');
const ITEM_DIR    = path.join(ROOT, 'src', 'assets', 'sprites', 'items');

// ── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const API_KEY = process.env.PIXELLAB_API_KEY;
if (!API_KEY) {
  console.error('❌  PIXELLAB_API_KEY not found. Create a .env file:\n    PIXELLAB_API_KEY=your_key_here');
  process.exit(1);
}

const API_BASE = 'https://api.pixellab.ai/v1';
const HEADERS  = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` };

// ── Asset definitions ─────────────────────────────────────────────────────────

const ANIMATED_CHARS = [
  {
    key: 'david',
    baseDesc: 'young Israelite shepherd boy, simple brown linen tunic with leather belt, leather sling over left shoulder, short curly dark brown hair, sandals, brave kind expression, top-down RPG pixel art',
    baseSize: { width: 64, height: 64 },
    portrait: true,
    portraitDesc: 'close-up portrait of young David, Israelite shepherd boy, curly brown hair, simple tunic, determined kind face, pixel art RPG style, facing viewer',
  },
];

const STATIC_CHARS = [
  {
    key: 'samuel',
    desc: 'elderly Hebrew prophet, long flowing white robe, long white beard and white hair, tall wooden shepherd staff, wise serene expression, top-down RPG pixel art',
    size: { width: 32, height: 32 },
    portrait: true,
    portraitDesc: 'close-up portrait of elderly prophet Samuel, long white beard, white robe, kind wise face, pixel art RPG style, facing viewer',
  },
  {
    key: 'jonathan',
    desc: 'young Hebrew prince, polished bronze armor with blue decorative trim, quiver of arrows on back, short brown hair, loyal brave expression, top-down RPG pixel art',
    size: { width: 32, height: 32 },
    portrait: true,
    portraitDesc: 'close-up portrait of young Prince Jonathan, bronze armor with blue trim, kind loyal face, short brown hair, pixel art RPG style, facing viewer',
  },
  {
    key: 'saul',
    desc: 'tall Israelite king, ornate golden crown, deep purple and gold royal robe, imposing regal bearing, brooding expression, top-down RPG pixel art',
    size: { width: 32, height: 32 },
    portrait: true,
    portraitDesc: 'close-up portrait of King Saul of Israel, golden crown, purple and gold royal robes, troubled brooding expression, pixel art RPG style, facing viewer',
  },
  {
    key: 'philistine',
    desc: 'Philistine warrior soldier, bronze scale armor, bronze helmet with red feather plume, holding iron spear, aggressive intimidating stance, top-down RPG pixel art',
    size: { width: 32, height: 32 },
    portrait: false,
  },
  {
    key: 'goliath',
    desc: 'enormous giant Philistine champion warrior, massive full bronze armor, large ornate bronze helmet, carrying huge iron sword, towering menacing figure, top-down RPG pixel art',
    size: { width: 32, height: 48 },
    portrait: true,
    portraitDesc: 'close-up portrait of Goliath of Gath, enormous Philistine giant warrior, massive bronze helmet, intimidating face, pixel art RPG style, facing viewer',
  },
];

const ITEMS = [
  {
    key: 'stone',
    desc: 'single smooth round grey river stone, small, pixel art, no background',
    size: { width: 32, height: 32 },
  },
  {
    key: 'heart',
    desc: 'glowing red heart icon with warm golden outline, health symbol, pixel art, no background',
    size: { width: 32, height: 32 },
  },
  {
    key: 'faith_orb',
    desc: 'glowing golden orb with radiating divine light rays, faith power symbol, pixel art, no background',
    size: { width: 32, height: 32 },
  },
  {
    key: 'goliath_sword',
    desc: 'enormous iron sword with wide crossguard, ancient Philistine weapon, pixel art, no background',
    size: { width: 32, height: 64 },
  },
];

const WALK_DIRECTIONS = ['south', 'north', 'west', 'east'];
const N_FRAMES = 4;

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${endpoint} → HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function checkBalance() {
  const res = await fetch(`${API_BASE}/balance`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Balance check failed: ${res.status}`);
  return (await res.json()).usd ?? 0;
}

async function generateBaseSprite(desc, width, height, extra = {}) {
  const data = await apiPost('/generate-image-pixflux', {
    description: desc,
    image_size: { width, height },
    outline: 'single color black outline',
    shading: 'basic shading',
    detail: 'medium detail',
    view: 'low top-down',
    direction: 'south',
    no_background: true,
    ...extra,
  });
  return data.image; // Base64Image { base64, type }
}

async function generatePortrait(desc) {
  const data = await apiPost('/generate-image-pixflux', {
    description: desc,
    image_size: { width: 128, height: 128 },
    outline: 'single color black outline',
    shading: 'basic shading',
    detail: 'highly detailed',
    view: 'side',
    direction: 'south',
    no_background: false,
  });
  return data.image;
}

async function generateWalkAnimation(desc, referenceImage, direction) {
  const data = await apiPost('/animate-with-text', {
    description: desc,
    reference_image: referenceImage,
    image_size: { width: 64, height: 64 },
    view: 'low top-down',
    direction,
    action: 'walk',
    n_frames: N_FRAMES,
  });
  return data.images; // Base64Image[]
}

// ── File helpers ──────────────────────────────────────────────────────────────

function savePng(base64Image, filePath) {
  const b64 = typeof base64Image === 'string' ? base64Image : base64Image.base64;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function ok(msg)  { process.stdout.write(`  ✓ ${msg}\n`); }
function log(msg) { process.stdout.write(`${msg}\n`); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('🎨  David RPG — PixelLab Sprite Generator');
  log('==========================================\n');

  const balance = await checkBalance();
  log(`💰  Balance: $${balance.toFixed(4)} (subscription credits not reflected here — proceeding)`);


  const generated = [];

  // ── Animated characters ────────────────────────────────────────────────────
  for (const char of ANIMATED_CHARS) {
    log(`\n● ${char.key} (animated — base + 4 directions × ${N_FRAMES} frames)`);

    const basePath = path.join(SPRITE_DIR, `${char.key}_base.png`);
    let baseImg;
    if (exists(basePath)) {
      log(`  (skipping base — already exists)`);
      baseImg = { base64: fs.readFileSync(basePath).toString('base64'), type: 'base64' };
      generated.push(`${char.key}_base.png`);
    } else {
      baseImg = await generateBaseSprite(char.baseDesc, char.baseSize.width, char.baseSize.height);
      savePng(baseImg, basePath);
      ok(`${char.key}_base.png`);
      generated.push(`${char.key}_base.png`);
    }

    for (const dir of WALK_DIRECTIONS) {
      const frame0Path = path.join(SPRITE_DIR, `${char.key}_${dir}_0.png`);
      if (exists(frame0Path)) {
        log(`  (skipping ${dir} — already exists)`);
        for (let i = 0; i < N_FRAMES; i++) generated.push(`${char.key}_${dir}_${i}.png`);
        continue;
      }
      log(`  → animating ${dir}...`);
      const frames = await generateWalkAnimation(char.baseDesc, baseImg, dir);
      frames.forEach((frame, i) => {
        const fname = `${char.key}_${dir}_${i}.png`;
        savePng(frame, path.join(SPRITE_DIR, fname));
        generated.push(fname);
      });
      ok(`${char.key}_${dir}_0..${N_FRAMES - 1}.png`);
    }

    if (char.portrait) {
      const portraitPath = path.join(PORTRAIT_DIR, `${char.key}.png`);
      if (exists(portraitPath)) {
        log(`  (skipping portrait — already exists)`);
        generated.push(`portraits/${char.key}.png`);
      } else {
        log(`  → portrait...`);
        const portrait = await generatePortrait(char.portraitDesc);
        savePng(portrait, portraitPath);
        ok(`portraits/${char.key}.png`);
        generated.push(`portraits/${char.key}.png`);
      }
    }
  }

  // ── Static NPCs / enemies ──────────────────────────────────────────────────
  for (const char of STATIC_CHARS) {
    log(`\n● ${char.key} (static)`);
    const spritePath = path.join(SPRITE_DIR, `${char.key}_base.png`);
    if (exists(spritePath)) {
      log(`  (skipping base — already exists)`);
      generated.push(`${char.key}_base.png`);
    } else {
      const img = await generateBaseSprite(char.desc, char.size.width, char.size.height);
      savePng(img, spritePath);
      ok(`${char.key}_base.png`);
      generated.push(`${char.key}_base.png`);
    }

    if (char.portrait) {
      const portraitPath = path.join(PORTRAIT_DIR, `${char.key}.png`);
      if (exists(portraitPath)) {
        log(`  (skipping portrait — already exists)`);
        generated.push(`portraits/${char.key}.png`);
      } else {
        log(`  → portrait...`);
        const portrait = await generatePortrait(char.portraitDesc);
        savePng(portrait, portraitPath);
        ok(`portraits/${char.key}.png`);
        generated.push(`portraits/${char.key}.png`);
      }
    }
  }

  // ── Items ──────────────────────────────────────────────────────────────────
  log('\n● Items');
  for (const item of ITEMS) {
    const itemPath = path.join(ITEM_DIR, `${item.key}.png`);
    if (exists(itemPath)) {
      log(`  (skipping ${item.key} — already exists)`);
      generated.push(`items/${item.key}.png`);
      continue;
    }
    const img = await generateBaseSprite(item.desc, item.size.width, item.size.height, { no_background: true });
    savePng(img, itemPath);
    ok(`items/${item.key}.png`);
    generated.push(`items/${item.key}.png`);
  }

  // ── Manifest ───────────────────────────────────────────────────────────────
  const manifest = {
    generated: true,
    timestamp: new Date().toISOString(),
    playerFrameSize: 64,
    npcSpriteSize: 32,
    files: generated,
  };
  fs.writeFileSync(
    path.join(SPRITE_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  log(`\n🎉  Done! ${generated.length} files generated.`);
  log('   Refresh the game to see real sprites.\n');
}

main().catch(err => {
  console.error('\n💥  Error:', err.message);
  process.exit(1);
});
