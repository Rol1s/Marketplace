import { SITE } from '@/config/site';

const titleVariants = {
  pipe: [
    (d: number, w: number) => `Труба ${d}×${w} мм — вес, характеристики по ГОСТ 10704-91`,
    (d: number, w: number) => `Труба стальная ${d}×${w} — сортамент, масса погонного метра`,
    (d: number, w: number) => `Труба электросварная ${d}×${w} мм — таблица веса, ГОСТ 10704-91`,
  ],
  channel: [
    (p: string) => `Швеллер ${p} — вес, размеры, характеристики | ГОСТ 8240-97`,
    (p: string) => `Швеллер ${p} — сортамент, масса, моменты инерции`,
  ],
  beam: [
    (p: string) => `Двутавр ${p} — вес, размеры, характеристики | ГОСТ 35087-2024`,
    (p: string) => `Двутавровая балка ${p} — сортамент, масса, моменты`,
  ],
  sheet: [
    (t: number, w: number, l: number) => `Лист стальной ${t}×${w}×${l} мм — вес, ГОСТ 19903-2015`,
    (t: number, w: number, l: number) => `Лист ${t} мм (${w}×${l}) — масса, характеристики`,
  ],
  angleEqual: [
    (s: string) => `Уголок равнополочный ${s} — вес, размеры | ГОСТ 8509-93`,
    (s: string) => `Уголок ${s} мм — масса, площадь сечения, сортамент`,
  ],
  angleUnequal: [
    (s: string) => `Уголок неравнополочный ${s} — вес, размеры | ГОСТ 8510-86`,
    (s: string) => `Уголок ${s} мм — масса, площадь сечения`,
  ],
  shpunt: [
    (t: string) => `Шпунт Ларсена ${t} — вес, характеристики, размеры`,
    (t: string) => `Шпунт ${t} — масса погонного метра, площадь`,
  ],
} as const;

function pickVariant<T>(variants: readonly T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return variants[Math.abs(hash) % variants.length];
}

export function pipeMeta(diameter: number, wallThickness: number, weight: number) {
  const title = pickVariant(titleVariants.pipe, `${diameter}x${wallThickness}`)(diameter, wallThickness);
  const description = `Труба стальная ${diameter}×${wallThickness} мм по ГОСТ 10704-91. Масса 1 метра — ${weight} кг. Таблица характеристик, калькулятор веса, связанные размеры.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function channelMeta(profile: string, weight: number, h: number) {
  const title = pickVariant(titleVariants.channel, profile)(profile);
  const description = `Швеллер ${profile} по ГОСТ 8240-97. Высота ${h} мм, масса ${weight} кг/м. Полная таблица характеристик, моменты инерции, калькулятор веса.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function beamMeta(profile: string, weight: number, h: number) {
  const title = pickVariant(titleVariants.beam, profile)(profile);
  const description = `Двутавр ${profile} по ГОСТ 35087-2024. Высота ${h} мм, масса ${weight} кг/м. Сортамент, моменты инерции и сопротивления, калькулятор.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function sheetMeta(thickness: number, width: number, length: number) {
  const title = pickVariant(titleVariants.sheet, `${thickness}-${width}x${length}`)(thickness, width, length);
  const weightKg = (thickness * width * length * 7.85) / 1_000_000;
  const description = `Лист стальной ${thickness}×${width}×${length} мм по ГОСТ 19903-2015. Масса листа — ${weightKg.toFixed(1)} кг. Характеристики, калькулятор веса.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function angleEqualMeta(size: string, mass: number) {
  const title = pickVariant(titleVariants.angleEqual, size)(size);
  const description = `Уголок равнополочный ${size} мм по ГОСТ 8509-93. Масса ${mass} кг/м. Размеры, площадь сечения, сортамент.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function angleUnequalMeta(size: string, mass: number) {
  const title = pickVariant(titleVariants.angleUnequal, size)(size);
  const description = `Уголок неравнополочный ${size} мм по ГОСТ 8510-86. Масса ${mass} кг/м. Размеры, площадь сечения, характеристики.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function shpuntMeta(type: string, weightTons: number) {
  const title = pickVariant(titleVariants.shpunt, type)(type);
  const weightKg = (weightTons * 1000).toFixed(1);
  const description = `Шпунт Ларсена ${type}. Масса ${weightKg} кг/м. Характеристики, область применения, аналоги.`;
  return { title: `${title} | ${SITE.name}`, description };
}
