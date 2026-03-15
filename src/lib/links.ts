import type { Pipe, Channel, Beam, Sheet, AngleEqual, AngleUnequal, SheetPile, Rebar, ProfileTubeSquare, ProfileTubeRect, RoundBar, SquareBar, StripSteel } from './types';

interface LinkItem {
  label: string;
  href: string;
}

export function relatedPipes(pipes: Pipe[], currentSlug: string, diameter: number): LinkItem[] {
  return pipes
    .filter((p) => p.diameter === diameter && p.slug !== currentSlug)
    .slice(0, 20)
    .map((p) => ({
      label: `${p.diameter}×${p.wallThickness}`,
      href: `/truby/${p.slug}/`,
    }));
}

export function nearbyPipes(pipes: Pipe[], currentDiameter: number): LinkItem[] {
  const diameters = [...new Set(pipes.map((p) => p.diameter))].sort((a, b) => a - b);
  const idx = diameters.indexOf(currentDiameter);
  const nearby = diameters.slice(Math.max(0, idx - 3), idx + 4).filter((d) => d !== currentDiameter);
  return nearby.map((d) => ({
    label: `Труба ⌀${d}`,
    href: `/truby/${d}x${pipes.find((p) => p.diameter === d)!.wallThickness}/`,
  }));
}

export function relatedChannels(channels: Channel[], currentSlug: string): LinkItem[] {
  return channels
    .filter((c) => c.slug !== currentSlug)
    .slice(0, 15)
    .map((c) => ({
      label: `Швеллер ${c.profile}`,
      href: `/shvellery/${c.slug}/`,
    }));
}

export function relatedBeams(beams: Beam[], currentSlug: string): LinkItem[] {
  return beams
    .filter((b) => b.slug !== currentSlug)
    .slice(0, 15)
    .map((b) => ({
      label: `Двутавр ${b.profile}`,
      href: `/dvutavry/${b.slug}/`,
    }));
}

export function relatedSheets(sheets: Sheet[], currentSlug: string): LinkItem[] {
  return sheets
    .filter((s) => s.slug !== currentSlug)
    .slice(0, 15)
    .map((s) => ({
      label: `Лист ${s.thickness}×${s.width}×${s.length}`,
      href: `/listy/${s.slug}/`,
    }));
}

export function relatedAngles(angles: (AngleEqual | AngleUnequal)[], currentSlug: string, basePath: string): LinkItem[] {
  return angles
    .filter((a) => a.slug !== currentSlug)
    .slice(0, 15)
    .map((a) => ({
      label: `Уголок ${a.size}`,
      href: `${basePath}${a.slug}/`,
    }));
}

export function relatedSheetPiles(piles: SheetPile[], currentSlug: string): LinkItem[] {
  return piles
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 15)
    .map((p) => ({
      label: p.displayName,
      href: `/shpunt/${p.slug}/`,
    }));
}

export function relatedRebar(items: Rebar[], currentSlug: string): LinkItem[] {
  return items
    .filter((r) => r.slug !== currentSlug)
    .slice(0, 15)
    .map((r) => ({
      label: `⌀${r.diameter} ${r.rebarClass}`,
      href: `/armatura/${r.slug}/`,
    }));
}

export function relatedProfileTubesSquare(items: ProfileTubeSquare[], currentSlug: string): LinkItem[] {
  return items
    .filter((t) => t.slug !== currentSlug)
    .slice(0, 15)
    .map((t) => ({
      label: `${t.size}×${t.size}×${t.wallThickness}`,
      href: `/profilnaya-truba/kvadratnaya/${t.slug}/`,
    }));
}

export function relatedProfileTubesRect(items: ProfileTubeRect[], currentSlug: string): LinkItem[] {
  return items
    .filter((t) => t.slug !== currentSlug)
    .slice(0, 15)
    .map((t) => ({
      label: `${t.sizeA}×${t.sizeB}×${t.wallThickness}`,
      href: `/profilnaya-truba/pryamougolnaya/${t.slug}/`,
    }));
}

export function relatedRoundBars(items: RoundBar[], currentSlug: string): LinkItem[] {
  return items
    .filter((r) => r.slug !== currentSlug)
    .slice(0, 15)
    .map((r) => ({
      label: `⌀${r.diameter} мм`,
      href: `/krug/${r.slug}/`,
    }));
}

export function relatedSquareBars(items: SquareBar[], currentSlug: string): LinkItem[] {
  return items
    .filter((s) => s.slug !== currentSlug)
    .slice(0, 15)
    .map((s) => ({
      label: `${s.side}×${s.side} мм`,
      href: `/kvadrat/${s.slug}/`,
    }));
}

export function relatedStripSteel(items: StripSteel[], currentSlug: string): LinkItem[] {
  return items
    .filter((s) => s.slug !== currentSlug)
    .slice(0, 15)
    .map((s) => ({
      label: `${s.width}×${s.thickness} мм`,
      href: `/polosa/${s.slug}/`,
    }));
}
