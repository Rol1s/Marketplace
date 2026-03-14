import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const CSV_DIR = path.resolve(import.meta.dirname, '../../gosts_data_manual');
const OUT_DIR = path.resolve(import.meta.dirname, '../src/data');

function readCsv<T>(filename: string): T[] {
  const filepath = path.join(CSV_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    cast: (value, context) => {
      const stringColumns = ['profile', 'gost', 'gost_number', 'type', 'size', 'display_name'];
      if (context.header) return value;
      if (stringColumns.includes(context.column as string)) return value;
      const num = Number(value);
      return isNaN(num) ? value : num;
    },
  }) as T[];
}

function slugify(str: string | undefined | null): string {
  if (!str) return 'unknown';
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё\-_.x]/gi, '')
    .replace(/[а-яё]/gi, (ch) => {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      };
      return map[ch.toLowerCase()] ?? ch;
    })
    .replace(/\.+/g, '.')
    .replace(/-+/g, '-');
}

function writeJson(filename: string, data: unknown): void {
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  -> ${filename} (${Array.isArray(data) ? data.length : '?'} records)`);
}

// --- Pipes ---
function importPipes() {
  const raw = readCsv<{
    diameter: number;
    wall_thickness: number;
    weight_per_meter: number;
    gost_number: string;
  }>('gost_10704-91_pipes_FULL.csv');

  const pipes = raw.map((r) => ({
    slug: `${r.diameter}x${r.wall_thickness}`,
    diameter: r.diameter,
    wallThickness: r.wall_thickness,
    weightPerMeter: r.weight_per_meter,
    gost: r.gost_number,
  }));

  writeJson('pipes.json', pipes);
}

// --- Channels ---
function importChannels() {
  const raw = readCsv<{
    profile: string; h: number; b: number; s: number; t: number;
    R_not_more: number; r: number; area: number; weight: number;
    Ix: number; Wx: number; ix: number; Iy: number; Wy: number; iy: number;
    Xo: number; Zo: number; gost_number: string;
  }>('gost_8240-97_channels_FULL.csv');

  const channels = raw.map((r) => ({
    slug: slugify(r.profile),
    profile: r.profile,
    h: r.h, b: r.b, s: r.s, t: r.t,
    rNotMore: r.R_not_more, r: r.r,
    area: r.area, weight: r.weight,
    Ix: r.Ix, Wx: r.Wx, ix: r.ix,
    Iy: r.Iy, Wy: r.Wy, iy: r.iy,
    Xo: r.Xo, Zo: r.Zo,
    gost: r.gost_number,
  }));

  writeJson('channels.json', channels);
}

// --- Beams ---
function importBeams() {
  const raw = readCsv<{
    profile: string; h: number; b: number; s: number; t: number;
    area: number; weight_per_meter: number;
    Ix: number; Wx: number; ix: number; Iy: number; Wy: number; iy: number;
    gost_number: string;
  }>('gost_35087-2024_beams_FULL.csv');

  const beams = raw.map((r) => ({
    slug: slugify(r.profile),
    profile: r.profile,
    h: r.h, b: r.b, s: r.s, t: r.t,
    area: r.area, weightPerMeter: r.weight_per_meter,
    Ix: r.Ix, Wx: r.Wx, ix: r.ix,
    Iy: r.Iy, Wy: r.Wy, iy: r.iy,
    gost: r.gost_number,
  }));

  writeJson('beams.json', beams);
}

// --- Beams all GOSTs ---
function importBeamsAllGosts() {
  const raw = readCsv<{
    profile: string; gost: string; weight_per_meter_kg: number;
  }>('balk_types_all_gosts.csv');

  const entries = raw.map((r) => ({
    profile: r.profile,
    gost: r.gost,
    weightPerMeterKg: r.weight_per_meter_kg,
  }));

  writeJson('beams-all-gosts.json', entries);
}

// --- Sheets ---
function importSheets() {
  const raw = readCsv<{
    thickness: number; width: number; length: number;
    gost_number: string; type: string;
  }>('gost_19903-2015_sheets_FULL.csv');

  const sheets = raw.map((r) => ({
    slug: `${r.thickness}-${r.width}x${r.length}`,
    thickness: r.thickness,
    width: r.width,
    length: r.length,
    gost: r.gost_number,
    type: r.type,
  }));

  writeJson('sheets.json', sheets);
}

// --- Angles equal ---
function importAnglesEqual() {
  const raw = readCsv<{
    gost: string; size: string; A_mm: number; B_mm: number;
    thickness_mm: number; cross_section_area_mm2: number; mass_per_meter_kg: number;
  }>('gost_8509-93_angles_equal.csv');

  const angles = raw.map((r) => ({
    slug: slugify(r.size),
    gost: r.gost,
    size: r.size,
    aMm: r.A_mm, bMm: r.B_mm,
    thicknessMm: r.thickness_mm,
    crossSectionAreaMm2: r.cross_section_area_mm2,
    massPerMeterKg: r.mass_per_meter_kg,
  }));

  writeJson('angles-equal.json', angles);
}

// --- Angles unequal ---
function importAnglesUnequal() {
  const raw = readCsv<{
    gost: string; size: string; A_mm: number; B_mm: number;
    thickness_mm: number; cross_section_area_mm2: number; mass_per_meter_kg: number;
  }>('gost_8510-86_angles_unequal.csv');

  const angles = raw.map((r) => ({
    slug: slugify(r.size),
    gost: r.gost,
    size: r.size,
    aMm: r.A_mm, bMm: r.B_mm,
    thicknessMm: r.thickness_mm,
    crossSectionAreaMm2: r.cross_section_area_mm2,
    massPerMeterKg: r.mass_per_meter_kg,
  }));

  writeJson('angles-unequal.json', angles);
}

// --- Sheet piles ---
function importSheetPiles() {
  const raw = readCsv<{
    type: string; display_name: string;
    weight_per_meter_tons: number; area_per_meter_m2: number;
  }>('sheet_pile_types.csv');

  const piles = raw.map((r) => ({
    slug: slugify(r.type),
    type: r.type,
    displayName: r.display_name,
    weightPerMeterTons: r.weight_per_meter_tons,
    areaPerMeterM2: r.area_per_meter_m2,
  }));

  writeJson('shpunt.json', piles);
}

// --- Main ---
function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Importing CSV data...\n');

  importPipes();
  importChannels();
  importBeams();
  importBeamsAllGosts();
  importSheets();
  importAnglesEqual();
  importAnglesUnequal();
  importSheetPiles();

  console.log('\nDone!');
}

main();
