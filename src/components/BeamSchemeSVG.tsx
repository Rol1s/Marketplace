import type { SupportScheme } from '@/lib/beam-calc';

interface Props {
  scheme: SupportScheme;
  spanM: number;
  qLabel: string;
}

const W = 400;
const H = 120;
const PAD = 40;
const BEAM_Y = 60;
const BEAM_LEN = W - 2 * PAD;

function PinnedSupport({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x - 8},${y + 14} ${x + 8},${y + 14}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1={x - 10} y1={y + 16} x2={x + 10} y2={y + 16} stroke="currentColor" strokeWidth="1.5" />
    </g>
  );
}

function FixedSupport({ x, y, side }: { x: number; y: number; side: 'left' | 'right' }) {
  const dir = side === 'left' ? -1 : 1;
  return (
    <g>
      <line x1={x} y1={y - 16} x2={x} y2={y + 16} stroke="currentColor" strokeWidth="2" />
      {[-12, -4, 4, 12].map((dy) => (
        <line key={dy} x1={x} y1={y + dy} x2={x + dir * 8} y2={y + dy + 6} stroke="currentColor" strokeWidth="1" />
      ))}
    </g>
  );
}

function LoadArrows({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const n = 8;
  const step = (x2 - x1) / n;
  const arrows: JSX.Element[] = [];
  for (let i = 0; i <= n; i++) {
    const cx = x1 + i * step;
    arrows.push(
      <g key={i}>
        <line x1={cx} y1={y - 24} x2={cx} y2={y - 4} stroke="#2563eb" strokeWidth="1" />
        <polygon points={`${cx},${y - 2} ${cx - 3},${y - 8} ${cx + 3},${y - 8}`} fill="#2563eb" />
      </g>
    );
  }
  return (
    <g>
      <line x1={x1} y1={y - 24} x2={x2} y2={y - 24} stroke="#2563eb" strokeWidth="1.5" />
      {arrows}
    </g>
  );
}

export default function BeamSchemeSVG({ scheme, spanM, qLabel }: Props) {
  const bx1 = PAD;
  const bx2 = PAD + BEAM_LEN;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" style={{ maxHeight: 120 }}>
      {/* Beam line */}
      <line x1={bx1} y1={BEAM_Y} x2={bx2} y2={BEAM_Y} stroke="currentColor" strokeWidth="3" />

      {/* Load arrows */}
      <LoadArrows x1={bx1} x2={bx2} y={BEAM_Y} />
      <text x={(bx1 + bx2) / 2} y={BEAM_Y - 28} textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="bold">{qLabel}</text>

      {/* Supports */}
      {scheme === 'simple' && (
        <>
          <PinnedSupport x={bx1} y={BEAM_Y} />
          <PinnedSupport x={bx2} y={BEAM_Y} />
        </>
      )}
      {scheme === 'cantilever' && (
        <FixedSupport x={bx1} y={BEAM_Y} side="left" />
      )}
      {scheme === 'fixed-fixed' && (
        <>
          <FixedSupport x={bx1} y={BEAM_Y} side="left" />
          <FixedSupport x={bx2} y={BEAM_Y} side="right" />
        </>
      )}
      {scheme === 'fixed-pinned' && (
        <>
          <FixedSupport x={bx1} y={BEAM_Y} side="left" />
          <PinnedSupport x={bx2} y={BEAM_Y} />
        </>
      )}

      {/* Dimension line */}
      <line x1={bx1} y1={BEAM_Y + 24} x2={bx2} y2={BEAM_Y + 24} stroke="currentColor" strokeWidth="0.8" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
      <line x1={bx1} y1={BEAM_Y + 4} x2={bx1} y2={BEAM_Y + 28} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1={bx2} y1={BEAM_Y + 4} x2={bx2} y2={BEAM_Y + 28} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <text x={(bx1 + bx2) / 2} y={BEAM_Y + 38} textAnchor="middle" fontSize="11" fontWeight="bold">L = {spanM} м</text>

      <defs>
        <marker id="dimArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,1 L6,3 L0,5" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}
