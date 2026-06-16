// pixellab-rotate.js — rotate a character to a new facing using Pixel Lab /v1/rotate.
// Keeps the SAME character identity by using a reference image instead of a fresh prompt.
//
// Usage:
//   PIXELLAB_KEY=xxx node scripts/pixellab-rotate.js <fromImage> <fromDir> <toDir> <out> [size]
//   dirs: north south east west north-east north-west south-east south-west
//   size default 64
//
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = process.env.PIXELLAB_KEY;
if (!KEY) { console.error('Missing PIXELLAB_KEY env var'); process.exit(1); }

const [, , fromImage, fromDir, toDir, outPath, sizeArg] = process.argv;
if (!fromImage || !fromDir || !toDir || !outPath) {
  console.error('Usage: node pixellab-rotate.js <fromImage> <fromDir> <toDir> <out> [size]');
  process.exit(1);
}
const size = parseInt(sizeArg, 10) || 64;

const refB64 = fs.readFileSync(fromImage).toString('base64');

const body = JSON.stringify({
  image_size: { width: size, height: size },
  from_image: { type: 'base64', base64: refB64 },
  from_view: 'side',
  to_view: 'side',
  from_direction: fromDir,
  to_direction: toDir,
  image_guidance_scale: 3.0,
});

const req = https.request({
  hostname: 'api.pixellab.ai',
  path: '/v1/rotate',
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
    console.log(`OK  ${outPath}  ${size}x${size}  (${fromDir}->${toDir})`);
  });
});
req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(body);
req.end();
