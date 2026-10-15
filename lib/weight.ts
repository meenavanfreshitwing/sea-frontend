// Weight helpers shared by cart/checkout: 500 gram -> "500 g", 1500 gram -> "1.5 kg"

const UNIT_LABEL: Record<string, string> = { gram: 'g', kg: 'kg', ml: 'ml', liter: 'L', piece: 'pc' };

const trim = (n: number) => (Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2))));

export const formatWeight = (weight?: number, unit = 'gram'): string => {
  if (!weight || weight <= 0) return '';
  if (unit === 'gram' && weight >= 1000) return `${trim(weight / 1000)} kg`;
  if (unit === 'ml' && weight >= 1000) return `${trim(weight / 1000)} L`;
  if (unit === 'piece') return `${trim(weight)} ${weight > 1 ? 'pcs' : 'pc'}`;
  return `${trim(weight)} ${UNIT_LABEL[unit] || unit}`;
};

/** Weight of one pack for a cart item (stored on the item, or on its variant). */
export const itemWeight = (item: {
  weight?: number;
  weightUnit?: string;
  selectedVariant?: { weight?: number; weightUnit?: string };
}): { weight: number; unit: string } | null => {
  const weight = item.weight || item.selectedVariant?.weight || 0;
  if (weight <= 0) return null;
  return { weight, unit: item.weightUnit || item.selectedVariant?.weightUnit || 'gram' };
};

/** Total weight of all items, in grams (only gram/kg items are counted). */
export const totalGrams = (items: Array<Parameters<typeof itemWeight>[0] & { quantity: number }>) =>
  items.reduce((sum, item) => {
    const w = itemWeight(item);
    if (!w) return sum;
    if (w.unit === 'gram') return sum + w.weight * item.quantity;
    if (w.unit === 'kg') return sum + w.weight * 1000 * item.quantity;
    return sum;
  }, 0);
