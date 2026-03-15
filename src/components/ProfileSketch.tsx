interface Props {
  category: 'dvutavry' | 'shvellery' | 'truby';
  h?: number;
  b?: number;
  s?: number;
  t?: number;
  diameter?: number;
  wall?: number;
}

const W = 160;
const H = 160;
const CX = W / 2;
const CY = H / 2;

function IBeamSketch({ h, b, s, t }: { h: number; b: number; s: number; t: number }) {
  const scale = Math.min(60 / h, 60 / b) * 2;
  const hh = h * scale / 2;
  const bb = b * scale / 2;
  const ss = s * scale / 2;
  const tt = t * scale;

  return (
    <g>
      {/* Top flange */}
      <rect x={CX - bb} y={CY - hh} width={bb * 2} height={tt} fill="#e0e7ff" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Bottom flange */}
      <rect x={CX - bb} y={CY + hh - tt} width={bb * 2} height={tt} fill="#e0e7ff" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Web */}
      <rect x={CX - ss} y={CY - hh + tt} width={ss * 2} height={hh * 2 - tt * 2} fill="#e0e7ff" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Dimensions */}
      <DimV x={CX + bb + 12} y1={CY - hh} y2={CY + hh} label={`h=${h}`} />
      <DimH y={CY + hh + 14} x1={CX - bb} x2={CX + bb} label={`b=${b}`} />
    </g>
  );
}

function ChannelSketch({ h, b, s, t }: { h: number; b: number; s: number; t: number }) {
  const scale = Math.min(60 / h, 60 / b) * 2;
  const hh = h * scale / 2;
  const bb = b * scale;
  const ss = s * scale;
  const tt = t * scale;

  const x0 = CX - bb / 2;

  return (
    <g>
      {/* Web (left) */}
      <rect x={x0} y={CY - hh} width={ss} height={hh * 2} fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
      {/* Top flange */}
      <rect x={x0} y={CY - hh} width={bb} height={tt} fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
      {/* Bottom flange */}
      <rect x={x0} y={CY + hh - tt} width={bb} height={tt} fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
      <DimV x={x0 + bb + 12} y1={CY - hh} y2={CY + hh} label={`h=${h}`} />
      <DimH y={CY + hh + 14} x1={x0} x2={x0 + bb} label={`b=${b}`} />
    </g>
  );
}

function PipeSketch({ diameter, wall }: { diameter: number; wall: number }) {
  const r = 50;
  const ri = r * (1 - 2 * wall / diameter);

  return (
    <g>
      <circle cx={CX} cy={CY} r={r} fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={ri} fill="white" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
      <DimH y={CY + r + 14} x1={CX - r} x2={CX + r} label={`D=${diameter}`} />
      {/* Wall thickness annotation */}
      <line x1={CX + ri} y1={CY} x2={CX + r} y2={CY} stroke="#d97706" strokeWidth="2" />
      <text x={CX + r + 4} y={CY + 4} fontSize="8" fill="#92400e">s={wall}</text>
    </g>
  );
}

function DimV({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke="#666" strokeWidth="0.5" />
      <line x1={x - 3} y1={y1} x2={x + 3} y2={y1} stroke="#666" strokeWidth="0.8" />
      <line x1={x - 3} y1={y2} x2={x + 3} y2={y2} stroke="#666" strokeWidth="0.8" />
      <text x={x + 5} y={(y1 + y2) / 2 + 3} fontSize="8" fill="#666">{label}</text>
    </g>
  );
}

function DimH({ y, x1, x2, label }: { y: number; x1: number; x2: number; label: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#666" strokeWidth="0.5" />
      <line x1={x1} y1={y - 3} x2={x1} y2={y + 3} stroke="#666" strokeWidth="0.8" />
      <line x1={x2} y1={y - 3} x2={x2} y2={y + 3} stroke="#666" strokeWidth="0.8" />
      <text x={(x1 + x2) / 2} y={y + 12} textAnchor="middle" fontSize="8" fill="#666">{label}</text>
    </g>
  );
}

export default function ProfileSketch({ category, h, b, s, t, diameter, wall }: Props) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[160px]" style={{ maxHeight: H }}>
      {category === 'dvutavry' && h && b && s && t && (
        <IBeamSketch h={h} b={b} s={s} t={t} />
      )}
      {category === 'shvellery' && h && b && s && t && (
        <ChannelSketch h={h} b={b} s={s} t={t} />
      )}
      {category === 'truby' && diameter && wall && (
        <PipeSketch diameter={diameter} wall={wall} />
      )}
    </svg>
  );
}
