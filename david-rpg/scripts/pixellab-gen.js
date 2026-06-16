// pixellab-gen.js — generate a pixel-art PNG via the Pixel Lab v2 API.
// Usage:
//   PIXELLAB_KEY=xxx node scripts/pixellab-gen.js "<description>" <width> <height> <outPath> [bg]
//   bg = "transparent" (default) or "keep"
//
// Reads the key from PIXELLAB_KEY env var (falls back to first CLI arg pattern).

const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = process.env.PIXELLAB_KEY;
if (!KEY) { console.error('Missing PIXELLAB_KEY env var'); process.exit(1); }

const [, , description, wArg, hArg, outPath, bgArg] = process.argv;
if (!description || !outPath) {
  console.error('Usage: node pixellab-gen.js "<desc>" <w> <h> <out> [transparent|keep]');
  process.exit(1);
}
const width = parseInt(wArg, 10) || 64;
const height = parseInt(hArg, 10) || 64;
const noBackground = (bgArg || 'transparent') !== 'keep';

const body = JSON.stringify({
  description,
  image_size: { width, height },
  no_background: noBackground,
});

const req = https.request({
  hostname: 'api.pixellab.ai',
  path: '/v2/create-image-pixflux',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`);
      process.exit(1);
    }
    let json;
    try { json = JSON.parse(data); } catch (e) { console.error('Bad JSON:', data.slice(0, 300)); process.exit(1); }
    const b64 = json.image && json.image.base64;
    if (!b64) { console.error('No image in response:', JSON.stringify(json).slice(0, 300)); process.exit(1); }
    const raw = b64.replace(/^data:image\/png;base64,/, '');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(raw, 'base64'));
    const usd = json.usage && json.usage.usd;
    console.log(`OK  ${outPath}  ${width}x${height}  ($${usd ?? '?'})`);
  });
});
req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(body);
req.end();
