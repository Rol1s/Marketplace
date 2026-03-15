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
  rebar: [
    (d: number, cls: string) => `Арматура ${d} мм ${cls} — вес, характеристики | ГОСТ 34028-2016`,
    (d: number, cls: string) => `Арматура ⌀${d} класс ${cls} — сортамент, масса погонного метра`,
  ],
  profileTubeSquare: [
    (s: number, w: number) => `Профильная труба ${s}×${s}×${w} — вес, характеристики | ГОСТ 8639-82`,
    (s: number, w: number) => `Труба квадратная ${s}×${s}×${w} мм — сортамент, масса`,
  ],
  profileTubeRect: [
    (a: number, b: number, w: number) => `Профильная труба ${a}×${b}×${w} — вес, размеры | ГОСТ 8645-68`,
    (a: number, b: number, w: number) => `Труба прямоугольная ${a}×${b}×${w} мм — масса, характеристики`,
  ],
  roundBar: [
    (d: number) => `Круг стальной ⌀${d} мм — вес, характеристики | ГОСТ 2590-2006`,
    (d: number) => `Круг горячекатаный ${d} мм — сортамент, масса погонного метра`,
  ],
  squareBar: [
    (s: number) => `Квадрат стальной ${s}×${s} мм — вес, размеры | ГОСТ 2591-88`,
    (s: number) => `Квадрат горячекатаный ${s} мм — сортамент, масса`,
  ],
  pipeSeamless: [
    (d: number, w: number) => `Труба бесшовная ${d}×${w} мм — вес, ГОСТ 8732-78`,
    (d: number, w: number) => `Труба бесшовная горячедеформированная ${d}×${w} — сортамент, масса`,
  ],
  pipeVgp: [
    (dn: number, t: string) => `Труба ВГП ДУ${dn} ${t} — вес, характеристики | ГОСТ 3262-75`,
    (dn: number, t: string) => `Труба водогазопроводная ДУ${dn} ${t} — масса, сортамент`,
  ],
  stripSteel: [
    (w: number, t: number) => `Полоса стальная ${w}×${t} мм — вес, характеристики | ГОСТ 103-2006`,
    (w: number, t: number) => `Полоса горячекатаная ${w}×${t} мм — масса, сортамент`,
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

export function pipeSeamlessMeta(diameter: number, wallThickness: number, weight: number) {
  const title = pickVariant(titleVariants.pipeSeamless, `${diameter}x${wallThickness}`)(diameter, wallThickness);
  const description = `Труба бесшовная горячедеформированная ${diameter}×${wallThickness} мм по ГОСТ 8732-78. Масса 1 м — ${weight} кг. Сортамент, характеристики.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function pipeVgpMeta(nominalBore: number, type: string, weight: number) {
  const title = pickVariant(titleVariants.pipeVgp, `${nominalBore}-${type}`)(nominalBore, type);
  const description = `Труба водогазопроводная ДУ${nominalBore} ${type} по ГОСТ 3262-75. Масса 1 м — ${weight} кг. Сортамент, размеры.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function rebarMeta(diameter: number, rebarClass: string, weight: number) {
  const title = pickVariant(titleVariants.rebar, `${diameter}-${rebarClass}`)(diameter, rebarClass);
  const description = `Арматура ⌀${diameter} мм класс ${rebarClass} по ГОСТ 34028-2016. Масса 1 метра — ${weight} кг. Сортамент, площадь сечения, применение.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function profileTubeSquareMeta(size: number, wallThickness: number, weight: number) {
  const title = pickVariant(titleVariants.profileTubeSquare, `${size}x${wallThickness}`)(size, wallThickness);
  const description = `Профильная труба квадратная ${size}×${size}×${wallThickness} мм по ГОСТ 8639-82. Масса 1 м — ${weight} кг. Сортамент, характеристики.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function profileTubeRectMeta(a: number, b: number, wallThickness: number, weight: number) {
  const title = pickVariant(titleVariants.profileTubeRect, `${a}x${b}x${wallThickness}`)(a, b, wallThickness);
  const description = `Профильная труба прямоугольная ${a}×${b}×${wallThickness} мм по ГОСТ 8645-68. Масса 1 м — ${weight} кг. Сортамент, характеристики.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function roundBarMeta(diameter: number, weight: number) {
  const title = pickVariant(titleVariants.roundBar, `${diameter}`)(diameter);
  const description = `Круг стальной горячекатаный ⌀${diameter} мм по ГОСТ 2590-2006. Масса 1 м — ${weight} кг. Сортамент, площадь сечения, применение.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function squareBarMeta(side: number, weight: number) {
  const title = pickVariant(titleVariants.squareBar, `${side}`)(side);
  const description = `Квадрат стальной горячекатаный ${side}×${side} мм по ГОСТ 2591-88. Масса 1 м — ${weight} кг. Сортамент, характеристики.`;
  return { title: `${title} | ${SITE.name}`, description };
}

export function stripSteelMeta(width: number, thickness: number, weight: number) {
  const title = pickVariant(titleVariants.stripSteel, `${width}x${thickness}`)(width, thickness);
  const description = `Полоса стальная горячекатаная ${width}×${thickness} мм по ГОСТ 103-2006. Масса 1 м — ${weight} кг. Сортамент, характеристики.`;
  return { title: `${title} | ${SITE.name}`, description };
}
