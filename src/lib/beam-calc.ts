/**
 * Beam structural analysis engine.
 * Support schemes: simply-supported, cantilever, fixed-fixed, fixed-pinned.
 * Outputs: M(x), Q(x), f(x) arrays for diagram plotting.
 */

const G = 9.81;
const E_STEEL = 2.06e5; // МПа
const SIGMA_ST3 = 210;  // МПа

export type SupportScheme = 'simple' | 'cantilever' | 'fixed-fixed' | 'fixed-pinned';

export interface BeamCalcInput {
  scheme: SupportScheme;
  spanM: number;
  qKgM: number;         // distributed load in kgf/m (already factored)
  IxCm4: number;
  WxCm3: number;
  deflRatio: number;     // 200, 250, etc.
}

export interface DiagramPoint {
  x: number;  // meters from left
  M: number;  // kN·m (bending moment)
  Q: number;  // kN (shear force)
  f: number;  // mm (deflection, positive downward)
}

export interface BeamCalcResult {
  Mmax: number;          // kN·m
  Qmax: number;          // kN
  fmax: number;          // mm
  fLimit: number;        // mm
  sigmaMax: number;      // МПа
  sigmaAllow: number;    // МПа
  strengthSF: number;    // safety factor by strength
  deflectionSF: number;  // safety factor by deflection
  strengthOk: boolean;
  deflectionOk: boolean;
  diagram: DiagramPoint[];
}

/**
 * M, Q, f for simply-supported beam with uniform load.
 * M(x) = q·x·(L-x)/2, Q(x) = q·(L/2 - x), f(x) = q·x/(24EI)·(L³ - 2Lx² + x³)
 */
function calcSimple(L: number, qNm: number, EI: number, n: number): DiagramPoint[] {
  const pts: DiagramPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * L;
    const M = (qNm * x * (L - x)) / 2;
    const Q = qNm * (L / 2 - x);
    const f = (qNm * x * (L ** 3 - 2 * L * x ** 2 + x ** 3)) / (24 * EI);
    pts.push({ x, M: M / 1000, Q: Q / 1000, f: f * 1000 });
  }
  return pts;
}

/**
 * Cantilever (fixed at left, free at right), load from left.
 * M(x) = -q/2·(L-x)², Q(x) = q·(L-x), f(x) = q/(24EI)·(x⁴ - 4L·x³ + 6L²·x²)
 */
function calcCantilever(L: number, qNm: number, EI: number, n: number): DiagramPoint[] {
  const pts: DiagramPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * L;
    const M = -(qNm / 2) * (L - x) ** 2;
    const Q = qNm * (L - x);
    const f = (qNm / (24 * EI)) * (x ** 4 - 4 * L * x ** 3 + 6 * L ** 2 * x ** 2);
    pts.push({ x, M: M / 1000, Q: Q / 1000, f: f * 1000 });
  }
  return pts;
}

/**
 * Fixed-fixed beam with uniform load.
 * M(x) = q·L²/12 · (6x/L - 6(x/L)² - 1), Q(x) = q·(L/2 - x)
 * f(x) = q·x²·(L-x)² / (384·EI) × correction... exact:
 * f(x) = q/(384EI) · x² · (L - x)² × (but max at mid = qL⁴/(384EI))
 */
function calcFixedFixed(L: number, qNm: number, EI: number, n: number): DiagramPoint[] {
  const pts: DiagramPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * L;
    const xi = x / L;
    const M = (qNm * L ** 2 / 12) * (6 * xi - 6 * xi ** 2 - 1);
    const Q = qNm * (L / 2 - x);
    const f = (qNm * x ** 2 * (L - x) ** 2) / (24 * EI * L ** 2) * L ** 2;
    pts.push({ x, M: M / 1000, Q: Q / 1000, f: f * 1000 });
  }
  return pts;
}

/**
 * Fixed-pinned beam: fixed at left, pinned at right.
 * Ra = 3qL/8, Rb = 5qL/8, Ma = -qL²/8
 * M(x) = -qL²/8 + 5qLx/8 - qx²/2
 * Q(x) = 5qL/8 - qx
 * f_max ≈ qL⁴/(185EI) at x ≈ 0.4215L
 */
function calcFixedPinned(L: number, qNm: number, EI: number, n: number): DiagramPoint[] {
  const pts: DiagramPoint[] = [];
  const Rb = (5 * qNm * L) / 8;
  const Ma = -(qNm * L ** 2) / 8;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * L;
    const M = Ma + Rb * x - (qNm * x ** 2) / 2;
    const Q = Rb - qNm * x;
    const f = (qNm * x / (48 * EI)) * (3 * L ** 3 - 5 * L * x ** 2 + 2 * x ** 3) / L * x;
    pts.push({ x, M: M / 1000, Q: Q / 1000, f: Math.abs(f) * 1000 });
  }
  return pts;
}

const SCHEME_FORMULAS: Record<SupportScheme, {
  Mmax: (q: number, L: number) => number;
  Qmax: (q: number, L: number) => number;
  fmax: (q: number, L: number, EI: number) => number;
  calc: (L: number, q: number, EI: number, n: number) => DiagramPoint[];
  muBuckling: number;
}> = {
  simple: {
    Mmax: (q, L) => q * L ** 2 / 8,
    Qmax: (q, L) => q * L / 2,
    fmax: (q, L, EI) => (5 * q * L ** 4) / (384 * EI),
    calc: calcSimple,
    muBuckling: 1.0,
  },
  cantilever: {
    Mmax: (q, L) => q * L ** 2 / 2,
    Qmax: (q, L) => q * L,
    fmax: (q, L, EI) => (q * L ** 4) / (8 * EI),
    calc: calcCantilever,
    muBuckling: 2.0,
  },
  'fixed-fixed': {
    Mmax: (q, L) => q * L ** 2 / 12,
    Qmax: (q, L) => q * L / 2,
    fmax: (q, L, EI) => (q * L ** 4) / (384 * EI),
    calc: calcFixedFixed,
    muBuckling: 0.5,
  },
  'fixed-pinned': {
    Mmax: (q, L) => q * L ** 2 / 8,
    Qmax: (q, L) => (5 * q * L) / 8,
    fmax: (q, L, EI) => (q * L ** 4) / (185 * EI),
    calc: calcFixedPinned,
    muBuckling: 0.7,
  },
};

export const SCHEME_LABELS: Record<SupportScheme, string> = {
  simple: 'Шарнир — шарнир',
  cantilever: 'Консоль (заделка — свободный)',
  'fixed-fixed': 'Заделка — заделка',
  'fixed-pinned': 'Заделка — шарнир',
};

export function runBeamCalc(input: BeamCalcInput): BeamCalcResult {
  const { scheme, spanM, qKgM, IxCm4, WxCm3, deflRatio } = input;
  const formulas = SCHEME_FORMULAS[scheme];

  const qNm = qKgM * G;
  const EI = E_STEEL * 1e6 * IxCm4 * 1e-8; // Pa·m⁴ = N·m²

  const MmaxNm = formulas.Mmax(qNm, spanM);
  const QmaxN = formulas.Qmax(qNm, spanM);
  const fmaxM = formulas.fmax(qNm, spanM, EI);
  const fLimitM = spanM / deflRatio;

  const MmaxKNm = MmaxNm / 1000;
  const QmaxKN = QmaxN / 1000;
  const fmaxMm = fmaxM * 1000;
  const fLimitMm = fLimitM * 1000;

  const WxM3 = WxCm3 * 1e-6;
  const sigmaMax = MmaxNm / WxM3 / 1e6; // МПа
  const sigmaAllow = SIGMA_ST3;

  const strengthSF = sigmaAllow / sigmaMax;
  const deflectionSF = fLimitMm / fmaxMm;

  const diagram = formulas.calc(spanM, qNm, EI, 50);

  return {
    Mmax: MmaxKNm,
    Qmax: QmaxKN,
    fmax: fmaxMm,
    fLimit: fLimitMm,
    sigmaMax,
    sigmaAllow,
    strengthSF,
    deflectionSF,
    strengthOk: strengthSF >= 1.0,
    deflectionOk: deflectionSF >= 1.0,
    diagram,
  };
}

export function getMuBuckling(scheme: SupportScheme): number {
  return SCHEME_FORMULAS[scheme].muBuckling;
}
