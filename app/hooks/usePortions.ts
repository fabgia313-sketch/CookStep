import { useState } from 'react';
import { Ingredient } from '@/types';

export function usePortions(baseIngredients: Ingredient[], basePortions: number) {
  const [portions, setPortions] = useState(basePortions);
  const ratio = portions / basePortions;

  const adjustedIngredients = baseIngredients.map((ing) => ({
    ...ing,
    quantity: ing.quantity != null ? Math.round(ing.quantity * ratio * 10) / 10 : null,
  }));

  const increase = () => setPortions((p) => Math.min(p + 1, 20));
  const decrease = () => setPortions((p) => Math.max(p - 1, 1));

  return { portions, adjustedIngredients, increase, decrease };
}
