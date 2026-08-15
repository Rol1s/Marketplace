export function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join('/');
  return value ?? '';
}

export function findBySlug<T extends { slug: string }>(
  items: T[],
  value: string | string[] | undefined
): T | undefined {
  const slug = paramValue(value);
  return items.find((item) => item.slug === slug);
}
