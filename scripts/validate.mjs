import { readFileSync, readdirSync } from 'node:fs';
import { buildDynamicUrls } from './route-catalog.mjs';

const dataDir = new URL('../src/data/', import.meta.url);
const errors = [];
const warnings = [];
const collections = new Map();

for (const name of readdirSync(dataDir).filter((file) => file.endsWith('.json')).sort()) {
  try {
    const rows = JSON.parse(readFileSync(new URL(name, dataDir), 'utf8'));
    if (!Array.isArray(rows)) {
      errors.push(`${name}: root value must be an array`);
      continue;
    }
    if (rows.length === 0) warnings.push(`${name}: collection is empty`);
    if (rows.some((row) => row == null || typeof row !== 'object')) {
      errors.push(`${name}: every record must be an object`);
    }
    collections.set(name, rows);
  } catch (error) {
    errors.push(`${name}: invalid JSON (${error.message})`);
  }
}

const routeDataFiles = [
  'angles-equal.json',
  'angles-unequal.json',
  'beams-8239.json',
  'channels-bent.json',
  'channels.json',
  'cities.json',
  'comparisons.json',
  'pipes-seamless-hot.json',
  'pipes-vgp.json',
  'pipes.json',
  'profile-tubes-rect.json',
  'profile-tubes-square.json',
  'rebar.json',
  'round-bars.json',
  'sheets.json',
  'shpunt.json',
  'square-bars.json',
  'steel-grades.json',
  'strip-steel.json',
  'tolerances.json',
];

for (const name of routeDataFiles) {
  const rows = collections.get(name) ?? [];
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (typeof row.slug !== 'string' || !/^[a-z0-9][a-z0-9.-]*$/.test(row.slug)) {
      errors.push(`${name}[${index}]: invalid slug ${JSON.stringify(row.slug)}`);
      continue;
    }
    if (seen.has(row.slug)) errors.push(`${name}: duplicate route slug ${row.slug}`);
    seen.add(row.slug);
  }
}

const beams = collections.get('beams.json') ?? [];
const uniqueBeamCount = new Set(beams.map((beam) => beam.slug)).size;
if (uniqueBeamCount !== beams.length) {
  warnings.push(`beams.json: ${beams.length - uniqueBeamCount} overlapping revisions collapse to canonical profile URLs`);
}

const grades = collections.get('steel-grades.json') ?? [];
for (const [index, grade] of grades.entries()) {
  if (!Array.isArray(grade.products) || grade.products.length === 0) {
    errors.push(`steel-grades.json[${index}]: products must be a non-empty array`);
  }
}

const pipes = collections.get('pipes.json') ?? [];
for (const pipe of pipes) {
  const calculated = 0.02466 * pipe.wallThickness * (pipe.diameter - pipe.wallThickness);
  const absoluteDifference = Math.abs(calculated - pipe.weightPerMeter);
  if (!Number.isFinite(absoluteDifference) || absoluteDifference > 0.011) {
    errors.push(`pipes.json: ${pipe.slug} weight ${pipe.weightPerMeter} differs from formula result ${calculated.toFixed(2)}`);
  }
}

const densityChecks = [
  ['beams.json', 'area', 'weightPerMeter', 0.785],
  ['channels.json', 'area', 'weight', 0.785],
  ['angles-equal.json', 'crossSectionAreaMm2', 'massPerMeterKg', 0.00785],
  ['angles-unequal.json', 'crossSectionAreaMm2', 'massPerMeterKg', 0.00785],
];
for (const [name, areaKey, weightKey, factor] of densityChecks) {
  for (const item of collections.get(name) ?? []) {
    const expected = item[areaKey] * factor;
    const difference = Math.abs(expected - item[weightKey]) / item[weightKey];
    if (!Number.isFinite(difference) || difference > 0.03) {
      errors.push(`${name}: ${item.slug} ${weightKey} ${item[weightKey]} conflicts with section area ${item[areaKey]}`);
    }
  }
}

const site = process.env.PUBLIC_SITE_URL || 'https://marketplace-kappa-neon.vercel.app';
const dynamicUrls = buildDynamicUrls(site);
if (new Set(dynamicUrls).size !== dynamicUrls.length) errors.push('dynamic route catalog contains duplicates');
if (dynamicUrls.length < 45000) errors.push(`dynamic route catalog unexpectedly small: ${dynamicUrls.length}`);

for (const required of ['../src/pages/privacy.astro', '../src/pages/robots.txt.ts', '../src/pages/llms.txt.ts']) {
  try {
    readFileSync(new URL(required, import.meta.url), 'utf8');
  } catch {
    errors.push(`missing required file: ${required}`);
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
} else {
  const records = [...collections.values()].reduce((sum, rows) => sum + rows.length, 0);
  console.log(`OK ${collections.size} datasets, ${records} records, ${dynamicUrls.length} dynamic URLs validated`);
}
