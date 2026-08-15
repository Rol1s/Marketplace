import { readFileSync } from 'node:fs';

const dataDir = new URL('../src/data/', import.meta.url);

function readJson(name) {
  return JSON.parse(readFileSync(new URL(name, dataDir), 'utf8'));
}

function uniqueBySlug(items) {
  return [...new Map(items.map((item) => [item.slug, item])).values()];
}

export function buildDynamicUrls(site) {
  const base = site.replace(/\/$/, '');
  const pipes = uniqueBySlug(readJson('pipes.json'));
  const channels = uniqueBySlug(readJson('channels.json'));
  const beams = uniqueBySlug(readJson('beams.json'));
  const sheets = uniqueBySlug(readJson('sheets.json'));
  const anglesEqual = uniqueBySlug(readJson('angles-equal.json'));
  const anglesUnequal = uniqueBySlug(readJson('angles-unequal.json'));
  const piles = uniqueBySlug(readJson('shpunt.json'));
  const grades = uniqueBySlug(readJson('steel-grades.json'));
  const cities = uniqueBySlug(readJson('cities.json'));
  const urls = new Set();
  const add = (path) => urls.add(`${base}${path}`);
  const gradesFor = (product) => grades.filter((grade) => grade.products.includes(product));

  for (const grade of grades) add(`/marki-stali/${grade.slug}/`);

  const gradeRoutes = [
    ['truby', pipes, '/truby'],
    ['shvellery', channels, '/shvellery'],
    ['dvutavry', beams, '/dvutavry'],
    ['listy', sheets, '/listy'],
    ['shpunt', piles, '/shpunt'],
  ];

  for (const [product, items, prefix] of gradeRoutes) {
    for (const item of items) {
      for (const grade of gradesFor(product)) add(`${prefix}/${item.slug}/${grade.slug}/`);
    }
  }

  for (const angle of anglesEqual) {
    for (const grade of gradesFor('ugolki')) {
      add(`/ugolki/ravnopolochnye/${angle.slug}/${grade.slug}/`);
    }
  }
  for (const angle of anglesUnequal) {
    for (const grade of gradesFor('ugolki')) {
      add(`/ugolki/neravnopolochnye/${angle.slug}/${grade.slug}/`);
    }
  }

  const vusPipes = pipes.filter((pipe) => pipe.diameter >= 219 && pipe.diameter <= 1420);
  const cityRoutes = [
    ['truby', vusPipes],
    ['shvellery', channels],
    ['dvutavry', beams],
    ['listy', sheets],
    ['shpunt', piles],
    ['ugolki', [...anglesEqual, ...anglesUnequal]],
  ];

  for (const city of cities) {
    add(`/${city.slug}/`);
    add(`/${city.slug}/bu-metall/`);

    for (const [section, items] of cityRoutes) {
      for (const item of items) add(`/${city.slug}/${section}/${item.slug}/`);
    }
    for (const pipe of vusPipes) add(`/${city.slug}/bu-metall/truby/${pipe.slug}/`);
    for (const pipe of vusPipes) add(`/${city.slug}/truby/${pipe.slug}/vus/`);
  }

  return [...urls];
}
