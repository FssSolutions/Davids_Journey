import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/PIXELLAB_API_KEY=(.+)/)[1].trim();
const res = await fetch('https://api.pixellab.ai/v1/balance', {
  headers: { 'Authorization': `Bearer ${key}` }
});
console.log('Status:', res.status);
console.log('Body:', JSON.stringify(await res.json(), null, 2));
