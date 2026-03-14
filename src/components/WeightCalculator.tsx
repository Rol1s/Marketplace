import { useState, useMemo } from 'react';

interface WeightCalculatorProps {
  productName: string;
  weightPerUnit: number;
  unitLabel?: string;
  mode: 'length' | 'piece';
  defaultLength?: number;
}

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(3) + ' т';
  return n.toFixed(2) + ' кг';
}

export default function WeightCalculator({
  productName,
  weightPerUnit,
  unitLabel = 'кг/м',
  mode,
  defaultLength = 6,
}: WeightCalculatorProps) {
  const [lengthStr, setLengthStr] = useState(String(defaultLength));
  const [qtyStr, setQtyStr] = useState('10');

  const length = Number(lengthStr) || 0;
  const qty = Math.max(0, Math.round(Number(qtyStr) || 0));

  const result = useMemo(() => {
    const oneUnit = mode === 'length' ? weightPerUnit * length : weightPerUnit;
    const total = oneUnit * qty;
    return { oneUnit, total };
  }, [weightPerUnit, length, qty, mode]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary">
        Калькулятор веса: {productName}
      </h3>

      <div className={`grid gap-4 ${mode === 'length' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {mode === 'length' && (
          <label className="block">
            <span className="text-sm text-text-muted">Длина, м</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={lengthStr}
              onChange={(e) => setLengthStr(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm text-text-muted">
            {mode === 'piece' ? 'Количество листов' : 'Количество, шт'}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={qtyStr}
            onChange={(e) => setQtyStr(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      <div className={`grid gap-3 ${mode === 'length' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {mode === 'length' && (
          <div className="bg-surface rounded-lg p-3 text-center border border-border/50">
            <div className="text-xs text-text-muted">1 шт</div>
            <div className="text-lg font-bold text-primary">{fmt(result.oneUnit)}</div>
          </div>
        )}
        <div className="bg-surface rounded-lg p-3 text-center border border-border/50">
          <div className="text-xs text-text-muted">
            {qty} {mode === 'piece' ? 'лист.' : 'шт'}
          </div>
          <div className="text-lg font-bold text-accent">{fmt(result.total)}</div>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center border border-border/50">
          <div className="text-xs text-text-muted">Масса {mode === 'piece' ? '1 листа' : '1 м'}</div>
          <div className="text-lg font-bold text-primary">{weightPerUnit} {unitLabel}</div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4 mt-2">
        <h4 className="text-sm font-semibold text-text-muted mb-3">Обратный расчёт: в 1 тонне</h4>
        <div className={`grid gap-3 ${mode === 'length' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {mode === 'length' ? (
            <>
              <div className="bg-surface rounded-lg p-3 text-center border border-border/50">
                <div className="text-xs text-text-muted">Метров в 1 тонне</div>
                <div className="text-lg font-bold text-primary">
                  {weightPerUnit > 0 ? (1000 / weightPerUnit).toFixed(2) : '—'} м
                </div>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center border border-border/50">
                <div className="text-xs text-text-muted">Штук по {length} м в 1 тонне</div>
                <div className="text-lg font-bold text-accent">
                  {weightPerUnit > 0 && length > 0
                    ? Math.floor(1000 / (weightPerUnit * length))
                    : '—'} шт
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface rounded-lg p-3 text-center border border-border/50">
              <div className="text-xs text-text-muted">Листов в 1 тонне</div>
              <div className="text-lg font-bold text-primary">
                {weightPerUnit > 0 ? Math.floor(1000 / weightPerUnit) : '—'} шт
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
