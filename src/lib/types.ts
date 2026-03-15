export interface Pipe {
  slug: string;
  diameter: number;
  wallThickness: number;
  weightPerMeter: number;
  gost: string;
}

export interface Channel {
  slug: string;
  profile: string;
  h: number;
  b: number;
  s: number;
  t: number;
  rNotMore: number;
  r: number;
  area: number;
  weight: number;
  Ix: number;
  Wx: number;
  ix: number;
  Iy: number;
  Wy: number;
  iy: number;
  Xo: number;
  Zo: number;
  gost: string;
}

export interface ChannelCalc {
  gost: string;
  profile: string;
  heightMm: number;
  widthMm: number;
  wallThicknessMm: number;
  flangeThicknessMm: number;
  massPerMeterKg: number;
  crossSectionAreaMm2: number;
}

export interface Beam {
  slug: string;
  profile: string;
  h: number;
  b: number;
  s: number;
  t: number;
  area: number;
  weightPerMeter: number;
  Ix: number;
  Wx: number;
  ix: number;
  Iy: number;
  Wy: number;
  iy: number;
  gost: string;
}

export interface BeamGostEntry {
  profile: string;
  gost: string;
  weightPerMeterKg: number;
}

export interface Sheet {
  slug: string;
  thickness: number;
  width: number;
  length: number;
  gost: string;
  type: string;
}

export interface AngleEqual {
  slug: string;
  gost: string;
  size: string;
  aMm: number;
  bMm: number;
  thicknessMm: number;
  crossSectionAreaMm2: number;
  massPerMeterKg: number;
}

export interface AngleUnequal {
  slug: string;
  gost: string;
  size: string;
  aMm: number;
  bMm: number;
  thicknessMm: number;
  crossSectionAreaMm2: number;
  massPerMeterKg: number;
}

export interface SheetPile {
  slug: string;
  type: string;
  displayName: string;
  weightPerMeterTons: number;
  areaPerMeterM2: number;
}

export interface SteelGrade {
  slug: string;
  name: string;
  nameGen: string;
  density: number;
  tensileStrength: string;
  yieldStrength: string;
  elongation: string;
  description: string;
  products: string[];
}

export interface City {
  slug: string;
  name: string;
  namePrep: string;
  region: string;
  address: string;
}

export interface Rebar {
  slug: string;
  diameter: number;
  crossSectionArea: number;
  weightPerMeter: number;
  gost: string;
  rebarClass: string;
}

export interface ProfileTubeSquare {
  slug: string;
  size: number;
  wallThickness: number;
  weightPerMeter: number;
  area: number;
  gost: string;
}

export interface ProfileTubeRect {
  slug: string;
  sizeA: number;
  sizeB: number;
  wallThickness: number;
  weightPerMeter: number;
  area: number;
  gost: string;
}

export interface RoundBar {
  slug: string;
  diameter: number;
  crossSectionArea: number;
  weightPerMeter: number;
  gost: string;
}

export interface SquareBar {
  slug: string;
  side: number;
  crossSectionArea: number;
  weightPerMeter: number;
  gost: string;
}

export interface StripSteel {
  slug: string;
  width: number;
  thickness: number;
  weightPerMeter: number;
  gost: string;
}

export interface BeamClassic {
  slug: string;
  profile: string;
  h: number;
  b: number;
  s: number;
  t: number;
  area: number;
  weightPerMeter: number;
  gost: string;
}

export interface ChannelBent {
  slug: string;
  profile: string;
  h: number;
  b: number;
  s: number;
  t: number;
  area: number;
  weight: number;
  gost: string;
}

export interface PipeSeamless {
  slug: string;
  diameter: number;
  wallThickness: number;
  weightPerMeter: number;
  gost: string;
}

export interface PipeVgp {
  slug: string;
  nominalBore: number;
  outerDiameter: number;
  wallThickness: number;
  weightPerMeter: number;
  gost: string;
  type: string;
}

export interface GostPageMeta {
  title: string;
  description: string;
  h1: string;
  breadcrumbs: { label: string; href: string }[];
  canonical: string;
}
