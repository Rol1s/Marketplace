/**
 * Load capacity calculations for beams, channels, and pipes.
 * Based on standard structural engineering formulas.
 */

const SIGMA_ST3 = 210; // МПа — расчётное сопротивление Ст3 (Ry)
const G = 9.81;

/**
 * Max distributed load for a simply-supported beam (кг/м).
 * q_max = 8 * Wx * [σ] / L² (convert cm³→m³, MPa→Pa, result→kgf/m)
 */
export function beamMaxLoad(WxCm3: number, spanM: number, sigmaMP: number = SIGMA_ST3): number {
  const WxM3 = WxCm3 * 1e-6;
  const sigmaPa = sigmaMP * 1e6;
  const qNm = (8 * WxM3 * sigmaPa) / (spanM * spanM);
  return qNm / G;
}

/**
 * Max distributed load per m² for a beam at given spacing (кг/м²).
 */
export function beamMaxLoadPerM2(WxCm3: number, spanM: number, spacingM: number, sigmaMP: number = SIGMA_ST3): number {
  return beamMaxLoad(WxCm3, spanM, sigmaMP) / spacingM;
}

/**
 * Max internal pressure for a pipe (МПа) — thin-wall Barlow formula.
 * P = 2 * s * [σ] / D
 */
export function pipeMaxPressure(diameterMm: number, wallMm: number, sigmaMP: number = SIGMA_ST3): number {
  return (2 * wallMm * sigmaMP) / diameterMm;
}

/**
 * Max axial compressive force for a pipe column (кН) — Euler buckling.
 * Simplified: N_cr = π² * E * I / L², I = π/64 * (D⁴ - d⁴)
 */
export function pipeEulerBuckling(diameterMm: number, wallMm: number, lengthM: number): number {
  const E = 2.06e5; // МПа
  const D = diameterMm;
  const d = diameterMm - 2 * wallMm;
  const I = (Math.PI / 64) * (D ** 4 - d ** 4); // мм⁴
  const Lmm = lengthM * 1000;
  const Ncr = (Math.PI ** 2 * E * I) / (Lmm ** 2); // Н
  return Ncr / 1000; // кН
}

export const SPANS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const SPACINGS = [0.5, 1, 1.5, 2, 2.5, 3];

export interface LoadTableRow {
  span: number;
  qKgM: number;
  loads: { spacing: number; qKgM2: number }[];
}

export function generateLoadTable(WxCm3: number): LoadTableRow[] {
  return SPANS.map((span) => {
    const qKgM = beamMaxLoad(WxCm3, span);
    return {
      span,
      qKgM,
      loads: SPACINGS.map((spacing) => ({
        spacing,
        qKgM2: qKgM / spacing,
      })),
    };
  });
}

export interface PressureTableRow {
  diameter: number;
  wall: number;
  pressure: number;
  testPressure: number;
}

export function generatePressureRow(diameterMm: number, wallMm: number): PressureTableRow {
  const p = pipeMaxPressure(diameterMm, wallMm);
  return {
    diameter: diameterMm,
    wall: wallMm,
    pressure: p,
    testPressure: p * 1.25,
  };
}
