import type { Pipe, Channel, Beam, BeamGostEntry, Sheet, AngleEqual, AngleUnequal, SheetPile, SteelGrade, City } from './types';

import pipesData from '@data/pipes.json';
import channelsData from '@data/channels.json';
import beamsData from '@data/beams.json';
import beamsAllGostsData from '@data/beams-all-gosts.json';
import sheetsData from '@data/sheets.json';
import anglesEqualData from '@data/angles-equal.json';
import anglesUnequalData from '@data/angles-unequal.json';
import shpuntData from '@data/shpunt.json';
import steelGradesData from '@data/steel-grades.json';
import citiesData from '@data/cities.json';

export function getPipes(): Pipe[] {
  return pipesData as Pipe[];
}

export function getChannels(): Channel[] {
  return channelsData as Channel[];
}

export function getBeams(): Beam[] {
  return beamsData as Beam[];
}

export function getBeamsAllGosts(): BeamGostEntry[] {
  return beamsAllGostsData as BeamGostEntry[];
}

export function getSheets(): Sheet[] {
  return sheetsData as Sheet[];
}

export function getAnglesEqual(): AngleEqual[] {
  return anglesEqualData as AngleEqual[];
}

export function getAnglesUnequal(): AngleUnequal[] {
  return anglesUnequalData as AngleUnequal[];
}

export function getSheetPiles(): SheetPile[] {
  return shpuntData as SheetPile[];
}

export function getPipesByDiameter(diameter: number): Pipe[] {
  return getPipes().filter((p) => p.diameter === diameter);
}

export function getBeamGostsForProfile(profile: string): BeamGostEntry[] {
  return getBeamsAllGosts().filter((e) => e.profile === profile);
}

export function getUniquePipeDiameters(): number[] {
  return [...new Set(getPipes().map((p) => p.diameter))].sort((a, b) => a - b);
}

export function getSteelGrades(): SteelGrade[] {
  return steelGradesData as SteelGrade[];
}

export function getSteelGradesForProduct(productType: string): SteelGrade[] {
  return getSteelGrades().filter((g) => g.products.includes(productType));
}

export function getCities(): City[] {
  return citiesData as City[];
}
