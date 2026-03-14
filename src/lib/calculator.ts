const STEEL_DENSITY = 7850; // kg/m³

export function pipeWeight(diameterMm: number, wallMm: number, lengthM: number = 1): number {
  return (Math.PI * (diameterMm - wallMm) * wallMm * STEEL_DENSITY * lengthM) / 1_000_000;
}

export function sheetWeight(thicknessMm: number, widthMm: number, lengthMm: number): number {
  return (thicknessMm * widthMm * lengthMm * STEEL_DENSITY) / 1_000_000_000;
}

export function channelWeight(massPerMeterKg: number, lengthM: number = 1): number {
  return massPerMeterKg * lengthM;
}

export function beamWeight(massPerMeterKg: number, lengthM: number = 1): number {
  return massPerMeterKg * lengthM;
}

export function angleWeight(massPerMeterKg: number, lengthM: number = 1): number {
  return massPerMeterKg * lengthM;
}

export function sheetPileWeight(weightPerMeterTons: number, lengthM: number = 1): number {
  return weightPerMeterTons * 1000 * lengthM;
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} т`;
  return `${kg.toFixed(2)} кг`;
}
