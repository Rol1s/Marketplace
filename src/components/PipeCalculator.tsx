import { useState, useMemo } from 'react';
import { pipeWeight, formatWeight } from '@lib/calculator';

interface WallOption {
  wallThickness: number;
  weightPerMeter: number;
  slug: string;
}

interface PipeCalculatorProps {
  diameter: number;
  wallThickness: number;
  weightPerMeter: number;
  availableWalls?: WallOption[];
}

const TRAILERS = [
  { id: 'standard', name: 'Стандарт (13.6 м)', lengthM: 13.6, widthMm: 2450, heightMm: 2700, maxTons: 20 },
  { id: 'long16', name: 'Площадка (16 м)', lengthM: 16, widthMm: 2500, heightMm: 2500, maxTons: 20 },
  { id: 'long18', name: 'Негабарит (18 м)', lengthM: 18, widthMm: 2500, heightMm: 2300, maxTons: 20 },
] as const;

const SQRT3_2 = Math.sqrt(3) / 2;

interface LoadingResult {
  mode: 'hex' | 'grid';
  rowCounts: number[];
  pipesBySpace: number;
  pipesByWeight: number;
  maxPipes: number;
  limitedBy: 'weight' | 'space';
  bottomRowCount: number;
  totalRows: number;
}

function calcLoading(
  D: number,
  pipeLengthM: number,
  weightPerPipeKg: number,
  trailer: typeof TRAILERS[number],
): LoadingResult | null {
  if (pipeLengthM > trailer.lengthM || pipeLengthM <= 0 || D <= 0 || weightPerPipeKg <= 0) return null;

  const W = trailer.widthMm;
  const H = trailer.heightMm;
  const bottomRow = Math.floor(W / D);
  if (bottomRow === 0) return null;

  // --- HEX PACKING (pyramid, pipes nestle in gaps) ---
  const hexOffsetCount = Math.floor((W - D / 2) / D);
  const hexVertStep = D * SQRT3_2;
  const hexMaxRows = 1 + Math.floor((H - D) / hexVertStep);
  const hexRowCounts: number[] = [];
  let hexTotal = 0;
  for (let i = 0; i < hexMaxRows; i++) {
    const count = i % 2 === 0 ? bottomRow : hexOffsetCount;
    hexRowCounts.push(count);
    hexTotal += count;
  }

  // --- GRID PACKING (with wooden blocks/wedges) ---
  const gridRows = Math.floor(H / D);
  const gridTotal = bottomRow * gridRows;
  const gridRowCounts: number[] = Array(gridRows).fill(bottomRow);

  // Grid with blocks is only practical for 1-2 pipes across (manageable blocking).
  // For 3+ across, pyramid (hex) is the industry standard — pipes naturally nestle.
  const gridViable = bottomRow <= 2 && gridTotal > hexTotal;
  const rowCounts = gridViable ? gridRowCounts : hexRowCounts;
  const pipesBySpace = gridViable ? gridTotal : hexTotal;
  const mode = gridViable ? 'grid' as const : 'hex' as const;

  const pipesByWeight = Math.floor((trailer.maxTons * 1000) / weightPerPipeKg);
  const maxPipes = Math.min(pipesBySpace, pipesByWeight);
  const limitedBy = pipesByWeight < pipesBySpace ? 'weight' : 'space';

  return {
    mode,
    rowCounts,
    pipesBySpace,
    pipesByWeight,
    maxPipes,
    limitedBy,
    bottomRowCount: bottomRow,
    totalRows: rowCounts.length,
  };
}

function TrailerSvg({ rowCounts, pipesToDraw, maxPipes, diameterMm, trailerWidthMm, trailerHeightMm, trailerLengthM, mode }: {
  rowCounts: number[];
  pipesToDraw: number;
  maxPipes: number;
  diameterMm: number;
  trailerWidthMm: number;
  trailerHeightMm: number;
  trailerLengthM: number;
  mode: 'hex' | 'grid';
}) {
  const svgW = 420;
  const svgH = 280;
  const padL = 42;
  const padR = 20;
  const padTop = 24;
  const padBot = 48;
  const usableW = svgW - padL - padR;
  const usableH = svgH - padTop - padBot;
  const scaleX = usableW / trailerWidthMm;
  const scaleY = usableH / trailerHeightMm;
  const scale = Math.min(scaleX, scaleY);
  const trW = trailerWidthMm * scale;
  const trH = trailerHeightMm * scale;
  const offsetX = padL + (usableW - trW) / 2;
  const offsetY = padTop + (usableH - trH);
  const pipeR = Math.max((diameterMm * scale) / 2, 2);
  const hexVertStep = diameterMm * SQRT3_2 * scale;
  const gridVertStep = diameterMm * scale;

  const totalSlots = rowCounts.reduce((s, c) => s + c, 0);
  const slotsToShow = Math.min(totalSlots, maxPipes);

  let slotIdx = 0;
  const circles: JSX.Element[] = [];

  for (let row = 0; row < rowCounts.length && slotIdx < slotsToShow; row++) {
    const isOffset = mode === 'hex' && row % 2 === 1;
    const countInRow = rowCounts[row];
    const xStart = isOffset ? offsetX + pipeR * 2 : offsetX + pipeR;
    const vertStep = mode === 'hex' ? hexVertStep : gridVertStep;

    for (let col = 0; col < countInRow && slotIdx < slotsToShow; col++) {
      const cx = xStart + col * pipeR * 2;
      const cy = offsetY + trH - pipeR - row * vertStep;
      const isFilled = slotIdx < pipesToDraw;
      circles.push(
        <circle key={`${row}-${col}`} cx={cx} cy={cy} r={Math.max(pipeR - 0.5, 1)}
          fill={isFilled ? '#3b82f6' : 'none'}
          stroke={isFilled ? '#1e40af' : '#94a3b8'}
          strokeWidth={pipeR > 4 ? 1 : 0.5}
          opacity={isFilled ? 0.9 : 0.35}
          strokeDasharray={isFilled ? 'none' : (pipeR > 4 ? '2,2' : '1,1')}
        />
      );
      slotIdx++;
    }
  }

  const blocks: JSX.Element[] = [];
  if (mode === 'grid' && pipeR > 8) {
    for (let row = 1; row < rowCounts.length; row++) {
      for (let col = 0; col < rowCounts[0]; col++) {
        const bx = offsetX + col * pipeR * 2 + pipeR * 0.3;
        const by = offsetY + trH - row * gridVertStep - 2;
        blocks.push(
          <rect key={`b-${row}-${col}`} x={bx} y={by} width={pipeR * 1.4} height="4"
            fill="#b45309" stroke="#92400e" strokeWidth="0.5" rx="1" opacity="0.5" />
        );
      }
    }
  }

  const filledPct = slotsToShow > 0 ? Math.round((pipesToDraw / slotsToShow) * 100) : 0;
  const barY = offsetY + trH + 28;
  const barW = trW;
  const barH = 6;
  const filledW = barW * Math.min(pipesToDraw / slotsToShow, 1);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-lg mx-auto">
      <defs>
        <linearGradient id="trBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {/* Trailer body */}
      <rect x={offsetX} y={offsetY} width={trW} height={trH}
        fill="url(#trBg)" stroke="#475569" strokeWidth="2" rx="3" />
      {/* Floor */}
      <line x1={offsetX} y1={offsetY + trH} x2={offsetX + trW} y2={offsetY + trH}
        stroke="#334155" strokeWidth="3" />
      {/* Wheels */}
      <rect x={offsetX - 5} y={offsetY + trH} width="10" height="12" rx="3" fill="#334155" />
      <rect x={offsetX + trW - 5} y={offsetY + trH} width="10" height="12" rx="3" fill="#334155" />
      <line x1={offsetX - 14} y1={offsetY + trH + 12} x2={offsetX + trW + 14} y2={offsetY + trH + 12}
        stroke="#cbd5e1" strokeWidth="1" />

      {blocks}
      {circles}

      {/* Width dim */}
      <line x1={offsetX} y1={offsetY + trH + 18} x2={offsetX + trW} y2={offsetY + trH + 18}
        stroke="#94a3b8" strokeWidth="0.5" markerStart="url(#arw)" markerEnd="url(#arw)" />
      <text x={offsetX + trW / 2} y={offsetY + trH + 25} textAnchor="middle" fill="#64748b" fontSize="8">
        {trailerWidthMm} мм × {trailerLengthM} м
      </text>

      {/* Height dim */}
      <line x1={offsetX - 10} y1={offsetY} x2={offsetX - 10} y2={offsetY + trH}
        stroke="#94a3b8" strokeWidth="0.5" />
      <line x1={offsetX - 14} y1={offsetY} x2={offsetX - 6} y2={offsetY}
        stroke="#94a3b8" strokeWidth="0.5" />
      <line x1={offsetX - 14} y1={offsetY + trH} x2={offsetX - 6} y2={offsetY + trH}
        stroke="#94a3b8" strokeWidth="0.5" />
      <text x={offsetX - 14} y={offsetY + trH / 2} textAnchor="middle" fill="#64748b" fontSize="8"
        transform={`rotate(-90, ${offsetX - 14}, ${offsetY + trH / 2})`}>
        {trailerHeightMm} мм
      </text>

      {/* Fill bar */}
      <rect x={offsetX} y={barY} width={barW} height={barH} rx="3" fill="#e2e8f0" />
      <rect x={offsetX} y={barY} width={filledW} height={barH} rx="3"
        fill={filledPct >= 100 ? '#ef4444' : filledPct > 70 ? '#f59e0b' : '#3b82f6'} />

      {/* Title */}
      <text x={svgW / 2} y={14} textAnchor="middle" fill="#1e3a5f" fontSize="11" fontWeight="bold">
        Сечение кузова — {mode === 'hex' ? 'пирамидная' : 'сеточная'} укладка
      </text>
      {/* Legend */}
      <circle cx={offsetX} cy={barY + barH + 12} r="4" fill="#3b82f6" opacity="0.9" />
      <text x={offsetX + 8} y={barY + barH + 15} fill="#475569" fontSize="8">
        Ваш заказ: {pipesToDraw} шт
      </text>
      <circle cx={offsetX + trW / 2} cy={barY + barH + 12} r="4" fill="none" stroke="#94a3b8" strokeDasharray="2,2" />
      <text x={offsetX + trW / 2 + 8} y={barY + barH + 15} fill="#94a3b8" fontSize="8">
        Свободно: {Math.max(0, slotsToShow - pipesToDraw)} шт
      </text>
    </svg>
  );
}

export default function PipeCalculator({ diameter, wallThickness, weightPerMeter, availableWalls = [] }: PipeCalculatorProps) {
  const [selectedWall, setSelectedWall] = useState(wallThickness);
  const [pipeLengthStr, setPipeLengthStr] = useState('');
  const [qtyStr, setQtyStr] = useState('');
  const [trailerId, setTrailerId] = useState('standard');

  const currentWpm = availableWalls.find((w) => w.wallThickness === selectedWall)?.weightPerMeter
    ?? (selectedWall === wallThickness ? weightPerMeter : 0);

  const pipeLength = Number(pipeLengthStr) || 0;
  const qty = Math.max(0, Math.round(Number(qtyStr) || 0));

  const weightPerPipe = useMemo(() =>
    pipeWeight(diameter, selectedWall, pipeLength),
    [diameter, selectedWall, pipeLength]
  );

  const totalWeight = weightPerPipe * qty;

  const trailer = TRAILERS.find((t) => t.id === trailerId) ?? TRAILERS[0];
  const loading = useMemo(() =>
    calcLoading(diameter, pipeLength, weightPerPipe, trailer),
    [diameter, pipeLength, weightPerPipe, trailer]
  );

  const trucksNeeded = loading && loading.maxPipes > 0 ? Math.ceil(qty / loading.maxPipes) : 0;
  const pipesInLastTruck = loading && loading.maxPipes > 0 ? qty % loading.maxPipes || loading.maxPipes : 0;
  const pipesToShow = loading ? Math.min(qty, loading.maxPipes) : 0;
  const shownWeight = pipesToShow * weightPerPipe;
  const fitsInOne = loading ? qty <= loading.maxPipes : false;

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-lg font-bold text-primary mb-4">
          Калькулятор веса трубы {diameter}×{selectedWall}
        </h3>

        {availableWalls.length > 1 && (
          <div className="mb-4">
            <span className="text-sm text-text-muted block mb-2">Стенка, мм</span>
            <div className="flex flex-wrap gap-1.5">
              {availableWalls.map((w) => (
                <button key={w.wallThickness}
                  onClick={() => setSelectedWall(w.wallThickness)}
                  className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
                    selectedWall === w.wallThickness
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'bg-white border-border hover:border-primary text-text'
                  }`}>
                  {w.wallThickness}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm text-text-muted">Длина трубы, м</span>
            <input type="number" step="0.1" min="0.1" value={pipeLengthStr}
              onChange={(e) => setPipeLengthStr(e.target.value)}
              placeholder="11.7"
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-sm text-text-muted">Количество, шт</span>
            <input type="number" min="0" value={qtyStr}
              onChange={(e) => setQtyStr(e.target.value)}
              placeholder="10"
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-border p-3 text-center">
            <div className="text-xs text-text-muted">1 труба</div>
            <div className="text-lg font-bold text-primary">{formatWeight(weightPerPipe)}</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-3 text-center">
            <div className="text-xs text-text-muted">{qty} шт</div>
            <div className="text-lg font-bold text-accent">{formatWeight(totalWeight)}</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-3 text-center">
            <div className="text-xs text-text-muted">Масса п.м.</div>
            <div className="text-lg font-bold text-primary">{currentWpm || weightPerMeter} кг</div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="border-t border-border/50 pt-4 mb-4">
          <h4 className="text-sm font-semibold text-text-muted mb-3">Обратный расчёт: в 1 тонне</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-text-muted">Метров в 1 тонне</div>
              <div className="text-lg font-bold text-primary">
                {(currentWpm || weightPerMeter) > 0 ? (1000 / (currentWpm || weightPerMeter)).toFixed(2) : '—'} м
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-text-muted">Штук по {pipeLength} м в 1 тонне</div>
              <div className="text-lg font-bold text-accent">
                {weightPerPipe > 0 ? Math.floor(1000 / weightPerPipe) : '—'} шт
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-lg font-bold text-primary mb-4">
          Погрузка {qty} шт в шаланду
        </h3>
        <div className="mb-4">
          <span className="text-sm text-text-muted block mb-2">Тип кузова</span>
          <div className="flex flex-wrap gap-2">
            {TRAILERS.map((t) => (
              <button key={t.id}
                onClick={() => setTrailerId(t.id)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  trailerId === t.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border hover:border-primary text-text'
                }`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {loading === null ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700">
              Труба {pipeLength} м не помещается в кузов {trailer.lengthM} м.
              {pipeLength > 13.6 && pipeLength <= 16 && ' Попробуйте удлинённый кузов (16 м).'}
              {pipeLength > 16 && pipeLength <= 18 && ' Попробуйте негабарит (18 м).'}
              {pipeLength > 18 && ' Требуется спецтранспорт.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-text-muted">Макс. в кузов</div>
                <div className="text-2xl font-bold text-primary">{loading.maxPipes}</div>
                <div className="text-xs text-text-muted">шт</div>
              </div>
              <div className="bg-white rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-text-muted">Ваш заказ</div>
                <div className={`text-2xl font-bold ${fitsInOne ? 'text-green-600' : 'text-amber-600'}`}>{qty}</div>
                <div className="text-xs text-text-muted">шт ({formatWeight(totalWeight)})</div>
              </div>
              <div className="bg-white rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-text-muted">Машин нужно</div>
                <div className={`text-2xl font-bold ${trucksNeeded > 1 ? 'text-amber-600' : 'text-primary'}`}>{trucksNeeded}</div>
                <div className="text-xs text-text-muted">шт</div>
              </div>
              <div className="bg-white rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-text-muted">Вес в машине</div>
                <div className="text-2xl font-bold text-accent">{(shownWeight / 1000).toFixed(2)}</div>
                <div className="text-xs text-text-muted">т из {trailer.maxTons} т</div>
              </div>
            </div>

            {fitsInOne ? (
              <div className="text-sm rounded-lg p-3 mb-4 bg-green-50 border border-green-200 text-green-800">
                {qty} шт ({formatWeight(totalWeight)}) — помещается в 1 машину.
                {loading.limitedBy === 'weight'
                  ? ` Ограничение по весу: макс. ${loading.pipesByWeight} шт (${trailer.maxTons} т).`
                  : ` Ограничение по габаритам: макс. ${loading.pipesBySpace} шт.`
                }
              </div>
            ) : (
              <div className="text-sm rounded-lg p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-800">
                {qty} шт не влезет в 1 машину (макс. {loading.maxPipes} шт).
                Нужно <strong>{trucksNeeded} машин</strong>: {trucksNeeded > 1 && `${trucksNeeded - 1} полных (${loading.maxPipes} шт) + последняя ${pipesInLastTruck} шт.`}
              </div>
            )}

            <TrailerSvg
              rowCounts={loading.rowCounts}
              pipesToDraw={pipesToShow}
              maxPipes={loading.maxPipes}
              diameterMm={diameter}
              trailerWidthMm={trailer.widthMm}
              trailerHeightMm={trailer.heightMm}
              trailerLengthM={trailer.lengthM}
              mode={loading.mode}
            />

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 text-text-muted font-medium">Параметр</th>
                    <th className="text-right py-1.5 text-text-muted font-medium">Значение</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/50"><td className="py-1.5">Кузов</td><td className="text-right">{trailer.lengthM} × {(trailer.widthMm / 1000).toFixed(1)} × {(trailer.heightMm / 1000).toFixed(1)} м</td></tr>
                  <tr className="border-b border-border/50"><td className="py-1.5">Труба</td><td className="text-right">⌀{diameter}×{selectedWall}, {pipeLength} м</td></tr>
                  <tr className="border-b border-border/50"><td className="py-1.5">Масса 1 трубы</td><td className="text-right font-medium">{formatWeight(weightPerPipe)}</td></tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5">Укладка</td>
                    <td className="text-right">
                      {loading.mode === 'hex'
                        ? `пирамида, ${loading.totalRows} рядов (${loading.rowCounts.join(' + ')} шт)`
                        : `сетка ${loading.bottomRowCount}×${loading.totalRows} с подкладками`
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-border/50"><td className="py-1.5">Макс. по габаритам</td><td className="text-right">{loading.pipesBySpace} шт</td></tr>
                  <tr className="border-b border-border/50"><td className="py-1.5">Макс. по весу ({trailer.maxTons} т)</td><td className="text-right">{loading.pipesByWeight} шт</td></tr>
                  <tr className="border-b border-border/50"><td className="py-1.5">Макс. в 1 машину</td><td className="text-right font-medium">{loading.maxPipes} шт ({formatWeight(loading.maxPipes * weightPerPipe)})</td></tr>
                  {trucksNeeded > 1 && (
                    <tr className="border-b border-border/50"><td className="py-1.5">Машин для {qty} шт</td><td className="text-right font-medium text-amber-600">{trucksNeeded} машин</td></tr>
                  )}
                  <tr className="font-bold"><td className="py-1.5">Ваш заказ</td><td className="text-right text-primary">{qty} шт ({formatWeight(totalWeight)})</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
