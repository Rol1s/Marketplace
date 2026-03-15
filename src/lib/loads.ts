/**
 * Load capacity calculations for beams, channels, and pipes.
 * Strength check:  q_max = 8·Wx·Ry / L²
 * Deflection check: f = 5·q·L⁴ / (384·E·I), limit = L/200 (L/250 for floors)
 */

const SIGMA_ST3 = 210; // МПа — расчётное сопротивление Ст3 (Ry)
const E_STEEL = 2.06e5; // МПа — модуль упругости стали
const G = 9.81;

export function beamMaxLoad(WxCm3: number, spanM: number, sigmaMP: number = SIGMA_ST3): number {
  const WxM3 = WxCm3 * 1e-6;
  const sigmaPa = sigmaMP * 1e6;
  const qNm = (8 * WxM3 * sigmaPa) / (spanM * spanM);
  return qNm / G;
}

export function beamMaxLoadPerM2(WxCm3: number, spanM: number, spacingM: number, sigmaMP: number = SIGMA_ST3): number {
  return beamMaxLoad(WxCm3, spanM, sigmaMP) / spacingM;
}

/**
 * Deflection of a simply-supported beam under uniform load (мм).
 * f = 5·q·L⁴ / (384·E·I)
 */
export function beamDeflection(IxCm4: number, spanM: number, qKgM: number): number {
  const qNm = qKgM * G;
  const L = spanM;
  const IM4 = IxCm4 * 1e-8;
  const EPa = E_STEEL * 1e6;
  const fM = (5 * qNm * L ** 4) / (384 * EPa * IM4);
  return fM * 1000; // мм
}

/**
 * Max load (кг/м) that keeps deflection within limit (L/ratio, default L/200).
 */
export function beamMaxLoadByDeflection(IxCm4: number, spanM: number, ratio: number = 200): number {
  const fLimitM = spanM / ratio;
  const IM4 = IxCm4 * 1e-8;
  const EPa = E_STEEL * 1e6;
  const qNm = (fLimitM * 384 * EPa * IM4) / (5 * spanM ** 4);
  return qNm / G;
}

/**
 * Combined: minimum of strength-based and deflection-based max load (кг/м).
 */
export function beamMaxLoadCombined(WxCm3: number, IxCm4: number, spanM: number, ratio: number = 200): {
  byStrength: number;
  byDeflection: number;
  governing: number;
  limitedBy: 'strength' | 'deflection';
} {
  const byStrength = beamMaxLoad(WxCm3, spanM);
  const byDeflection = beamMaxLoadByDeflection(IxCm4, spanM, ratio);
  const governing = Math.min(byStrength, byDeflection);
  return { byStrength, byDeflection, governing, limitedBy: byStrength <= byDeflection ? 'strength' : 'deflection' };
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

export interface LoadCellData {
  spacing: number;
  qKgM2Strength: number;
  qKgM2Deflection: number;
  qKgM2: number;
  limitedBy: 'strength' | 'deflection';
}

export interface LoadTableRow {
  span: number;
  qKgMStrength: number;
  qKgMDeflection: number;
  qKgM: number;
  limitedBy: 'strength' | 'deflection';
  deflectionMm: number;
  deflectionLimitMm: number;
  loads: LoadCellData[];
}

export function generateLoadTable(WxCm3: number, IxCm4: number = 0, deflectionRatio: number = 200): LoadTableRow[] {
  const hasIx = IxCm4 > 0;
  return SPANS.map((span) => {
    const combo = hasIx
      ? beamMaxLoadCombined(WxCm3, IxCm4, span, deflectionRatio)
      : { byStrength: beamMaxLoad(WxCm3, span), byDeflection: Infinity, governing: beamMaxLoad(WxCm3, span), limitedBy: 'strength' as const };

    const deflMm = hasIx ? beamDeflection(IxCm4, span, combo.governing) : 0;
    const deflLimitMm = (span * 1000) / deflectionRatio;

    return {
      span,
      qKgMStrength: combo.byStrength,
      qKgMDeflection: combo.byDeflection,
      qKgM: combo.governing,
      limitedBy: combo.limitedBy,
      deflectionMm: deflMm,
      deflectionLimitMm: deflLimitMm,
      loads: SPACINGS.map((spacing) => {
        const qS = combo.byStrength / spacing;
        const qD = hasIx ? combo.byDeflection / spacing : Infinity;
        return {
          spacing,
          qKgM2Strength: qS,
          qKgM2Deflection: qD,
          qKgM2: Math.min(qS, qD),
          limitedBy: qS <= qD ? 'strength' : 'deflection',
        };
      }),
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
