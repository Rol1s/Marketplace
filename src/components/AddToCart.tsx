import { useState } from 'react';
import { addToCart, type CartUnit } from '@/stores/cartStore';

interface Props {
  id: string;
  category: string;
  name: string;
  gost: string;
  weightPerMeter: number;
}

const UNITS: { value: CartUnit; label: string }[] = [
  { value: 'м', label: 'метры' },
  { value: 'шт', label: 'штуки (6м)' },
  { value: 'т', label: 'тонны' },
];

export default function AddToCart({ id, category, name, gost, weightPerMeter }: Props) {
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<CartUnit>('м');
  const [added, setAdded] = useState(false);

  function handleAdd() {
    const q = parseFloat(qty);
    if (!q || q <= 0) return;
    addToCart({ id, category, name, gost, weightPerMeter, unit, quantity: q });
    setAdded(true);
    setQty('');
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        Добавить в смету
      </h4>

      <div className="flex gap-2 items-end">
        <label className="flex-1">
          <span className="text-xs text-blue-700">Количество</span>
          <input
            type="number"
            min="0.1"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
            className="mt-1 block w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
          />
        </label>

        <label>
          <span className="text-xs text-blue-700">Единица</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as CartUnit)}
            className="mt-1 block rounded-md border border-blue-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </label>

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
        >
          {added ? '✓ Добавлено' : 'В смету'}
        </button>
      </div>

      {added && (
        <p className="text-xs text-blue-600 mt-2 font-medium animate-pulse">
          Позиция добавлена в смету. Открыть <a href="/smeta" className="underline font-bold">смету →</a>
        </p>
      )}
    </div>
  );
}
