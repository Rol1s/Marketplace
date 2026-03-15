import type { Beam, Channel, Pipe } from './types';
import { beamDeflection } from './loads';

const G = 9.81;
const SIGMA_ST3 = 210; // МПа
const E_STEEL = 2.06e5; // МПа

export type TaskType = 'floor' | 'column' | 'fence' | 'pipeline' | 'piles';
export type CalcMode = 'bending' | 'buckling' | 'pressure';

export interface WizardInput {
  task: TaskType;
  spanM?: number;
  loadKgM2?: number;
  spacingM?: number;
  pressureMPa?: number;
  heightM?: number;
  axialForceKN?: number;
}

export interface ProfileResult {
  profile: string;
  slug: string;
  category: 'dvutavry' | 'shvellery' | 'truby';
  calcMode: CalcMode;
  keyMetric: number;
  keyMetricLabel: string;
  weight: number;
  safetyFactor: number;
  deflectionMm: number;
  deflectionLimitMm: number;
  deflectionOk: boolean;
  status: 'ok' | 'excess' | 'undersize';
  url: string;
}

function requiredWx(spanM: number, loadKgM: number): number {
  const qN = loadKgM * G;
  const M = (qN * spanM * spanM) / 8;
  const sigmaPa = SIGMA_ST3 * 1e6;
  return (M / sigmaPa) * 1e6;
}

function overallStatus(sf: number, deflOk: boolean): 'ok' | 'excess' | 'undersize' {
  if (sf < 1.0 || !deflOk) return 'undersize';
  if (sf >= 1.5 && deflOk) return 'excess';
  return 'ok';
}

function bucklingStatus(sf: number): 'ok' | 'excess' | 'undersize' {
  if (sf < 1.0) return 'undersize';
  if (sf >= 2.0) return 'excess';
  return 'ok';
}

function pipeInertiaMm4(D: number, wall: number): number {
  const d = D - 2 * wall;
  return (Math.PI / 64) * (D ** 4 - d ** 4);
}

function eulerCriticalForceKN(Imm4: number, lengthM: number, mu: number = 1): number {
  const Lmm = lengthM * 1000 * mu;
  return (Math.PI ** 2 * E_STEEL * Imm4) / (Lmm ** 2) / 1000;
}

// ─── Bending: floor, fence ─────────────────────────────────

export function selectBeamsBending(beams: Beam[], input: WizardInput): ProfileResult[] {
  const span = input.spanM || 6;
  const loadKgM2 = input.loadKgM2 || 400;
  const spacing = input.spacingM || 1;
  const loadKgM = loadKgM2 * spacing;
  const deflRatio = input.task === 'floor' ? 250 : 200;

  return beams
    .filter((b) => b.Wx > 0 && b.Ix > 0)
    .map((b) => {
      const totalLoadKgM = loadKgM + b.weightPerMeter;
      const sf = b.Wx / requiredWx(span, totalLoadKgM);
      const deflMm = beamDeflection(b.Ix, span, totalLoadKgM);
      const deflLimitMm = (span * 1000) / deflRatio;
      return {
        profile: `Двутавр ${b.profile}`,
        slug: b.slug,
        category: 'dvutavry' as const,
        calcMode: 'bending' as const,
        keyMetric: b.Wx,
        keyMetricLabel: 'Wx, см³',
        weight: b.weightPerMeter,
        safetyFactor: sf,
        deflectionMm: deflMm,
        deflectionLimitMm: deflLimitMm,
        deflectionOk: deflMm <= deflLimitMm,
        status: overallStatus(sf, deflMm <= deflLimitMm),
        url: `/dvutavry/${b.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 0.8)
    .sort((a, b) => a.weight - b.weight);
}

export function selectChannelsBending(channels: Channel[], input: WizardInput): ProfileResult[] {
  const span = input.spanM || 4;
  const loadKgM2 = input.loadKgM2 || 300;
  const spacing = input.spacingM || 1;
  const loadKgM = loadKgM2 * spacing;
  const deflRatio = input.task === 'floor' ? 250 : 200;

  return channels
    .filter((c) => c.Wx > 0 && c.Ix > 0)
    .map((c) => {
      const totalLoadKgM = loadKgM + c.weight;
      const sf = c.Wx / requiredWx(span, totalLoadKgM);
      const deflMm = beamDeflection(c.Ix, span, totalLoadKgM);
      const deflLimitMm = (span * 1000) / deflRatio;
      return {
        profile: `Швеллер ${c.profile}`,
        slug: c.slug,
        category: 'shvellery' as const,
        calcMode: 'bending' as const,
        keyMetric: c.Wx,
        keyMetricLabel: 'Wx, см³',
        weight: c.weight,
        safetyFactor: sf,
        deflectionMm: deflMm,
        deflectionLimitMm: deflLimitMm,
        deflectionOk: deflMm <= deflLimitMm,
        status: overallStatus(sf, deflMm <= deflLimitMm),
        url: `/shvellery/${c.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 0.8)
    .sort((a, b) => a.weight - b.weight);
}

// ─── Buckling: column, piles ───────────────────────────────

export function selectPipesBuckling(pipes: Pipe[], input: WizardInput): ProfileResult[] {
  const height = input.heightM || 3;
  const axialKN = input.axialForceKN || 100;
  const mu = input.task === 'piles' ? 2.0 : 1.0;

  return pipes
    .filter((p) => p.diameter >= 57)
    .map((p) => {
      const Imm4 = pipeInertiaMm4(p.diameter, p.wallThickness);
      const NcrKN = eulerCriticalForceKN(Imm4, height, mu);
      const sf = NcrKN / axialKN;
      return {
        profile: `Труба ${p.diameter}×${p.wallThickness}`,
        slug: p.slug,
        category: 'truby' as const,
        calcMode: 'buckling' as const,
        keyMetric: NcrKN,
        keyMetricLabel: 'N_cr, кН',
        weight: p.weightPerMeter,
        safetyFactor: sf,
        deflectionMm: 0,
        deflectionLimitMm: 0,
        deflectionOk: true,
        status: bucklingStatus(sf),
        url: `/truby/${p.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 0.8)
    .sort((a, b) => a.weight - b.weight);
}

export function selectBeamsBuckling(beams: Beam[], input: WizardInput): ProfileResult[] {
  const height = input.heightM || 3;
  const axialKN = input.axialForceKN || 100;

  return beams
    .filter((b) => b.Ix > 0 && b.Iy > 0)
    .map((b) => {
      const IminCm4 = Math.min(b.Ix, b.Iy);
      const IminMm4 = IminCm4 * 1e4;
      const NcrKN = eulerCriticalForceKN(IminMm4, height);
      const sf = NcrKN / axialKN;
      return {
        profile: `Двутавр ${b.profile}`,
        slug: b.slug,
        category: 'dvutavry' as const,
        calcMode: 'buckling' as const,
        keyMetric: NcrKN,
        keyMetricLabel: 'N_cr, кН',
        weight: b.weightPerMeter,
        safetyFactor: sf,
        deflectionMm: 0,
        deflectionLimitMm: 0,
        deflectionOk: true,
        status: bucklingStatus(sf),
        url: `/dvutavry/${b.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 0.8)
    .sort((a, b) => a.weight - b.weight);
}

// ─── Pressure: pipeline ────────────────────────────────────

export function selectPipesPressure(pipes: Pipe[], input: WizardInput): ProfileResult[] {
  const pressure = input.pressureMPa || 1.0;

  return pipes
    .filter((p) => p.diameter >= 57)
    .map((p) => {
      const maxP = (2 * p.wallThickness * SIGMA_ST3) / p.diameter;
      const sf = maxP / pressure;
      return {
        profile: `Труба ${p.diameter}×${p.wallThickness}`,
        slug: p.slug,
        category: 'truby' as const,
        calcMode: 'pressure' as const,
        keyMetric: maxP,
        keyMetricLabel: 'P_max, МПа',
        weight: p.weightPerMeter,
        safetyFactor: sf,
        deflectionMm: 0,
        deflectionLimitMm: 0,
        deflectionOk: true,
        status: sf >= 1.5 ? 'excess' as const : sf >= 1.0 ? 'ok' as const : 'undersize' as const,
        url: `/truby/${p.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 1.0)
    .sort((a, b) => a.weight - b.weight);
}

// ─── Top-level dispatcher ──────────────────────────────────

export function runWizard(
  beams: Beam[],
  channels: Channel[],
  pipes: Pipe[],
  input: WizardInput,
): ProfileResult[] {
  switch (input.task) {
    case 'floor':
      return [...selectBeamsBending(beams, input), ...selectChannelsBending(channels, input)]
        .sort((a, b) => a.weight - b.weight)
        .slice(0, 20);

    case 'fence':
      return [...selectChannelsBending(channels, input), ...selectBeamsBending(beams, input)]
        .sort((a, b) => a.weight - b.weight)
        .slice(0, 15);

    case 'column':
      return [...selectPipesBuckling(pipes, input), ...selectBeamsBuckling(beams, input)]
        .sort((a, b) => a.weight - b.weight)
        .slice(0, 20);

    case 'piles':
      return selectPipesBuckling(pipes, input).slice(0, 15);

    case 'pipeline':
      return selectPipesPressure(pipes, input).slice(0, 15);
  }
}
