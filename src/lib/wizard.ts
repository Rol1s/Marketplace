import type { Beam, Channel, Pipe } from './types';

const G = 9.81;
const SIGMA_ST3 = 210; // МПа

export type TaskType = 'floor' | 'column' | 'fence' | 'pipeline' | 'piles';

export interface WizardInput {
  task: TaskType;
  spanM?: number;
  loadKgM2?: number;
  spacingM?: number;
  diameterMm?: number;
  pressureMPa?: number;
  heightM?: number;
}

export interface ProfileResult {
  profile: string;
  slug: string;
  category: 'dvutavry' | 'shvellery' | 'truby';
  Wx: number;
  weight: number;
  safetyFactor: number;
  status: 'ok' | 'excess' | 'undersize';
  url: string;
}

function requiredWx(spanM: number, loadKgM: number): number {
  const qN = loadKgM * G;
  const M = (qN * spanM * spanM) / 8;
  const sigmaPa = SIGMA_ST3 * 1e6;
  return (M / sigmaPa) * 1e6; // cm³
}

export function selectBeams(beams: Beam[], input: WizardInput): ProfileResult[] {
  const span = input.spanM || 6;
  const loadKgM2 = input.loadKgM2 || 400;
  const spacing = input.spacingM || 1;
  const loadKgM = loadKgM2 * spacing;
  const wxReq = requiredWx(span, loadKgM);

  return beams
    .filter((b) => b.Wx > 0)
    .map((b) => {
      const totalLoadKgM = loadKgM + b.weightPerMeter;
      const wxReqTotal = requiredWx(span, totalLoadKgM);
      const sf = b.Wx / wxReqTotal;
      return {
        profile: `Двутавр ${b.profile}`,
        slug: b.slug,
        category: 'dvutavry' as const,
        Wx: b.Wx,
        weight: b.weightPerMeter,
        safetyFactor: sf,
        status: sf >= 1.5 ? 'excess' as const : sf >= 1.0 ? 'ok' as const : 'undersize' as const,
        url: `/dvutavry/${b.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 0.8)
    .sort((a, b) => a.weight - b.weight);
}

export function selectChannels(channels: Channel[], input: WizardInput): ProfileResult[] {
  const span = input.spanM || 4;
  const loadKgM2 = input.loadKgM2 || 300;
  const spacing = input.spacingM || 1;
  const loadKgM = loadKgM2 * spacing;

  return channels
    .filter((c) => c.Wx > 0)
    .map((c) => {
      const totalLoadKgM = loadKgM + c.weight;
      const wxReqTotal = requiredWx(span, totalLoadKgM);
      const sf = c.Wx / wxReqTotal;
      return {
        profile: `Швеллер ${c.profile}`,
        slug: c.slug,
        category: 'shvellery' as const,
        Wx: c.Wx,
        weight: c.weight,
        safetyFactor: sf,
        status: sf >= 1.5 ? 'excess' as const : sf >= 1.0 ? 'ok' as const : 'undersize' as const,
        url: `/shvellery/${c.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 0.8)
    .sort((a, b) => a.weight - b.weight);
}

export function selectPipes(pipes: Pipe[], input: WizardInput): ProfileResult[] {
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
        Wx: maxP,
        weight: p.weightPerMeter,
        safetyFactor: sf,
        status: sf >= 1.5 ? 'excess' as const : sf >= 1.0 ? 'ok' as const : 'undersize' as const,
        url: `/truby/${p.slug}/`,
      };
    })
    .filter((r) => r.safetyFactor >= 1.0)
    .sort((a, b) => a.weight - b.weight);
}
