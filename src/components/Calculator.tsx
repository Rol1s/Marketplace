import { useState, type ChangeEvent } from 'react';
import { pipeWeight, sheetWeight, channelWeight } from '@lib/calculator';

interface CalculatorProps {
  type: 'pipe' | 'sheet' | 'profile';
  defaults?: {
    diameter?: number;
    wallThickness?: number;
    thickness?: number;
    width?: number;
    length?: number;
    massPerMeter?: number;
  };
}

function formatResult(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(3)} т`;
  return `${kg.toFixed(2)} кг`;
}

export default function Calculator({ type, defaults = {} }: CalculatorProps) {
  const [diameter, setDiameter] = useState(defaults.diameter ?? 159);
  const [wallThickness, setWallThickness] = useState(defaults.wallThickness ?? 6);
  const [thickness, setThickness] = useState(defaults.thickness ?? 10);
  const [width, setWidth] = useState(defaults.width ?? 1500);
  const [length, setLength] = useState(defaults.length ?? 6000);
  const [massPerMeter, setMassPerMeter] = useState(defaults.massPerMeter ?? 18.4);
  const [profileLength, setProfileLength] = useState(6);
  const [pipeLength, setPipeLength] = useState(1);
  const [qty, setQty] = useState(1);

  const num = (e: ChangeEvent<HTMLInputElement>) => Number(e.target.value) || 0;

  let result = 0;
  if (type === 'pipe') {
    result = pipeWeight(diameter, wallThickness, pipeLength) * qty;
  } else if (type === 'sheet') {
    result = sheetWeight(thickness, width, length) * qty;
  } else {
    result = channelWeight(massPerMeter, profileLength) * qty;
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-lg font-bold text-primary mb-4">
        Калькулятор веса
        {type === 'pipe' && ' трубы'}
        {type === 'sheet' && ' листа'}
        {type === 'profile' && ' профиля'}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {type === 'pipe' && (
          <>
            <label className="block">
              <span className="text-sm text-text-muted">Диаметр, мм</span>
              <input
                type="number"
                value={diameter}
                onChange={(e) => setDiameter(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-muted">Толщина стенки, мм</span>
              <input
                type="number"
                value={wallThickness}
                onChange={(e) => setWallThickness(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-muted">Длина, м</span>
              <input
                type="number"
                value={pipeLength}
                onChange={(e) => setPipeLength(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </>
        )}

        {type === 'sheet' && (
          <>
            <label className="block">
              <span className="text-sm text-text-muted">Толщина, мм</span>
              <input
                type="number"
                value={thickness}
                onChange={(e) => setThickness(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-muted">Ширина, мм</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-muted">Длина, мм</span>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </>
        )}

        {type === 'profile' && (
          <>
            <label className="block">
              <span className="text-sm text-text-muted">Масса 1 м, кг</span>
              <input
                type="number"
                step="0.01"
                value={massPerMeter}
                onChange={(e) => setMassPerMeter(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-muted">Длина, м</span>
              <input
                type="number"
                value={profileLength}
                onChange={(e) => setProfileLength(num(e))}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="text-sm text-text-muted">Количество</span>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(num(e))}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      <div className="bg-white rounded-lg border-2 border-primary p-4 text-center">
        <div className="text-sm text-text-muted mb-1">Масса</div>
        <div className="text-3xl font-bold text-primary">{formatResult(result)}</div>
        {result >= 1000 && (
          <div className="text-sm text-text-muted mt-1">{result.toFixed(2)} кг</div>
        )}
      </div>
    </div>
  );
}
