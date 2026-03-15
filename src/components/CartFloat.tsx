import { useStore } from '@nanostores/react';
import { $cart, calcTotalWeight } from '@/stores/cartStore';

export default function CartFloat() {
  const items = useStore($cart);

  if (items.length === 0) return null;

  const totalKg = calcTotalWeight(items);
  const totalDisplay = totalKg >= 1000
    ? `${(totalKg / 1000).toFixed(2)} т`
    : `${totalKg.toFixed(1)} кг`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-900 text-white shadow-2xl border-t border-blue-700">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-amber-400 text-blue-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {items.length}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-semibold">{items.length} поз.</span>
            <span className="text-blue-300 mx-1">·</span>
            <span className="text-blue-200">{totalDisplay}</span>
          </div>
        </div>

        <a
          href="/smeta"
          className="bg-amber-400 text-blue-900 font-bold px-5 py-2 rounded-lg text-sm hover:bg-amber-300 transition-colors"
        >
          Открыть смету →
        </a>
      </div>
    </div>
  );
}
