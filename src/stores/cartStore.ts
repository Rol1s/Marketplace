import { persistentAtom } from '@nanostores/persistent';

export type CartUnit = 'м' | 'шт' | 'т' | 'кг';

export interface CartItem {
  id: string;
  category: string;
  name: string;
  gost: string;
  weightPerMeter: number;
  unit: CartUnit;
  quantity: number;
  pricePerTon?: number;
}

export const $cart = persistentAtom<CartItem[]>('metal-cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function addToCart(item: CartItem): void {
  const current = $cart.get();
  const idx = current.findIndex((i) => i.id === item.id && i.category === item.category);
  if (idx >= 0) {
    const updated = [...current];
    updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity, unit: item.unit };
    $cart.set(updated);
  } else {
    $cart.set([...current, item]);
  }
}

export function removeFromCart(id: string, category: string): void {
  $cart.set($cart.get().filter((i) => !(i.id === id && i.category === category)));
}

export function updateQuantity(id: string, category: string, quantity: number): void {
  $cart.set(
    $cart.get().map((i) => (i.id === id && i.category === category ? { ...i, quantity } : i)),
  );
}

export function clearCart(): void {
  $cart.set([]);
}

export function calcItemWeight(item: CartItem): number {
  switch (item.unit) {
    case 'м':
      return item.weightPerMeter * item.quantity;
    case 'шт':
      return item.weightPerMeter * 6 * item.quantity;
    case 'т':
      return item.quantity * 1000;
    case 'кг':
      return item.quantity;
  }
}

export function calcTotalWeight(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calcItemWeight(item), 0);
}
