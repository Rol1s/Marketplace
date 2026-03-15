import type { DiagramPoint } from '@/lib/beam-calc';

interface Props {
  diagram: DiagramPoint[];
  spanM: number;
}

const W = 400;
const CH = 80;
const PAD_X = 40;
const PAD_Y = 16;
const PLOT_W = W - 2 * PAD_X;

interface ChartDef {
  label: string;
  unit: string;
  color: string;
  fill: string;
  getValue: (p: DiagramPoint) => number;
}

const CHARTS: ChartDef[] = [
  { label: 'M', unit: 'кН·м', color: '#2563eb', fill: '#2563eb20', getValue: (p) => p.M },
  { label: 'Q', unit: 'кН', color: '#16a34a', fill: '#16a34a20', getValue: (p) => p.Q },
  { label: 'f', unit: 'мм', color: '#dc2626', fill: '#dc262620', getValue: (p) => p.f },
];

function SingleChart({ chart, diagram, spanM }: { chart: ChartDef; diagram: DiagramPoint[]; spanM: number }) {
  const vals = diagram.map(chart.getValue);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.001);
  const maxVal = Math.max(...vals);
  const minVal = Math.min(...vals);

  const plotH = CH - 2 * PAD_Y;
  const zeroY = PAD_Y + (maxAbs / (2 * maxAbs)) * plotH;

  const points = diagram.map((p, i) => {
    const x = PAD_X + (p.x / spanM) * PLOT_W;
    const y = PAD_Y + ((maxAbs - chart.getValue(p)) / (2 * maxAbs)) * plotH;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `${PAD_X},${zeroY} ${points} ${PAD_X + PLOT_W},${zeroY}`;

  const peakIdx = vals.reduce((best, v, i) => Math.abs(v) > Math.abs(vals[best]) ? i : best, 0);
  const peakX = PAD_X + (diagram[peakIdx].x / spanM) * PLOT_W;
  const peakY = PAD_Y + ((maxAbs - vals[peakIdx]) / (2 * maxAbs)) * plotH;
  const peakVal = vals[peakIdx];

  return (
    <svg viewBox={`0 0 ${W} ${CH}`} className="w-full" style={{ maxHeight: CH }}>
      {/* Zero axis */}
      <line x1={PAD_X} y1={zeroY} x2={PAD_X + PLOT_W} y2={zeroY} stroke="#999" strokeWidth="0.5" strokeDasharray="4 2" />

      {/* Filled area */}
      <polygon points={fillPoints} fill={chart.fill} />

      {/* Curve */}
      <polyline points={points} fill="none" stroke={chart.color} strokeWidth="1.5" />

      {/* Peak annotation */}
      <circle cx={peakX} cy={peakY} r="3" fill={chart.color} />
      <text
        x={peakX + (peakX > W / 2 ? -6 : 6)}
        y={peakY + (peakVal >= 0 ? -8 : 14)}
        textAnchor={peakX > W / 2 ? 'end' : 'start'}
        fontSize="9"
        fontWeight="bold"
        fill={chart.color}
      >
        {Math.abs(peakVal).toFixed(2)} {chart.unit}
      </text>

      {/* Label */}
      <text x={8} y={PAD_Y + 4} fontSize="11" fontWeight="bold" fill={chart.color}>{chart.label}</text>

      {/* Left axis ticks */}
      <line x1={PAD_X} y1={PAD_Y} x2={PAD_X} y2={CH - PAD_Y} stroke="#ccc" strokeWidth="0.5" />
    </svg>
  );
}

export default function EpureDiagram({ diagram, spanM }: Props) {
  if (!diagram || diagram.length === 0) return null;

  return (
    <div className="space-y-1">
      {CHARTS.map((c) => (
        <SingleChart key={c.label} chart={c} diagram={diagram} spanM={spanM} />
      ))}
    </div>
  );
}
