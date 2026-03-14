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

export interface GostPageMeta {
  title: string;
  description: string;
  h1: string;
  breadcrumbs: { label: string; href: string }[];
  canonical: string;
}
