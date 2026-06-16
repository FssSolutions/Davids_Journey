// pixellab-animate.js — generate a walk-cycle from a reference sprite via /v1/animate-with-text.
// Produces n_frames frames for ONE direction, written as <outPrefix>_0.png .. _N.png.
//
// Usage:
//   PIXELLAB_KEY=xxx node scripts/pixellab-animate.js <refImage> "<charDesc>" <direction> <action> <nFrames> <outPrefix>
//
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = process.env.PIXELLAB_KEY;
if (!KEY) { console.error('Missing PIXELLAB_KEY env var'); process.exit(1); }

const [, , refImage, desc, direction, action, nArg, outPrefix] = process.argv;
if (!refImage || !desc || !direction || !outPrefix) {
  console.error('Usage: node pixellab-animate.js <refImage> "<desc>" <direction> <action> <nFrames> <outPrefix>');
  process.exit(1);
}
const nFrames = parseInt(nArg, 10) || 4;
const refB64 = fs.readFileSync(refImage).toString('base64');

const body = JSON.stringify({
  description: desc,
  action: action || 'walking',
  image_size: { width: 64, height: 64 },
  reference_image: { type: 'base64', base64: refB64 },
  n_frames: nFrames,
  view: 'side',
  direction,
  image_guidance_scale: 1.4,
});

const req = https.request({
  hostname: 'api.pixellab.ai',
  path: '/v1/animate-with-text',
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
      console.error(`HTTP ${res.statusCode}: ${data.slice(0, 600)}`);
      process.exit(1);
    }
    let json;
    try { json = JSON.parse(data); } catch (e) { console.error('Bad JSON:', data.slice(0, 300)); process.exit(1); }
    const images = json.images;
    if (!Array.isArray(images) || !images.length) {
      console.error('No images in response:', JSON.stringify(json).slice(0, 300)); process.exit(1);
    }
    fs.mkdirSync(path.dirname(outPrefix), { recursive: true });
    images.forEach((img, i) => {
      const b64 = (img.base64 || '').replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(`${outPrefix}_${i}.png`, Buffer.from(b64, 'base64'));
    });
    console.log(`OK  ${outPrefix}_0..${images.length - 1}.png  (${direction} ${action})`);
  });
});
req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(body);
req.end();
