import { buildDynamicUrls } from './route-catalog.mjs';

const base = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4322').replace(/\/$/, '');
const sampleSize = Number(process.env.SMOKE_SAMPLE_SIZE || 200);
const dynamicPaths = buildDynamicUrls('https://route-catalog.invalid').map((url) => new URL(url).pathname);
const sampledPaths = Array.from({ length: Math.min(sampleSize, dynamicPaths.length) }, (_, index) => {
  const position = Math.floor(index * (dynamicPaths.length - 1) / Math.max(1, sampleSize - 1));
  return dynamicPaths[position];
});
const paths = [...new Set([
  '/',
  '/sortament/',
  '/calculator/',
  '/podbor/',
  '/smeta',
  '/privacy/',
  '/kontakty/',
  '/robots.txt',
  '/llms.txt',
  ...sampledPaths,
])];

const failures = [];
for (let offset = 0; offset < paths.length; offset += 20) {
  const batch = paths.slice(offset, offset + 20);
  const results = await Promise.all(batch.map(async (path) => {
    try {
      const response = await fetch(`${base}${path}`, { redirect: 'follow' });
      const body = await response.text();
      return { path, status: response.status, length: body.length };
    } catch (error) {
      return { path, status: 0, length: 0, error: error.message };
    }
  }));

  for (const result of results) {
    if (result.status !== 200 || result.length === 0) failures.push(result);
  }
}

const missing = await fetch(`${base}/definitely-not-a-real-route-xyz/`, { redirect: 'follow' });
if (missing.status !== 404) failures.push({ path: '/definitely-not-a-real-route-xyz/', status: missing.status });

if (failures.length > 0) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log(`OK ${paths.length} representative routes and the 404 path`);
}
