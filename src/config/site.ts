export const SITE = {
  name: 'НикаМет',
  domain: 'nikamet.pro',
  url: 'https://nikamet.pro',
  description: 'ГОСТ-справочник металлопроката с калькулятором веса. Трубы, швеллеры, двутавры, листы, уголки, шпунт Ларсена.',
  locale: 'ru-RU',
} as const;

export const SECTIONS = [
  { slug: 'truby', name: 'Трубы', nameGen: 'труб' },
  { slug: 'shvellery', name: 'Швеллеры', nameGen: 'швеллеров' },
  { slug: 'dvutavry', name: 'Двутавры', nameGen: 'двутавров' },
  { slug: 'listy', name: 'Листы', nameGen: 'листов' },
  { slug: 'ugolki', name: 'Уголки', nameGen: 'уголков' },
  { slug: 'shpunt', name: 'Шпунт Ларсена', nameGen: 'шпунта' },
] as const;

export type SectionSlug = (typeof SECTIONS)[number]['slug'];
