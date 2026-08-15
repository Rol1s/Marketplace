import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../.vercel/output/config.json', import.meta.url);

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://cdn.jsdelivr.net; object-src 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

const config = JSON.parse(await readFile(configPath, 'utf8'));
const headerRoute = {
  src: '^/(.*)$',
  headers: securityHeaders,
  continue: true,
};

config.routes = [
  headerRoute,
  ...config.routes.filter((route) => route.src !== headerRoute.src || !route.headers?.['Content-Security-Policy']),
];

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
