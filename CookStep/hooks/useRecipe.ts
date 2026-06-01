import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RecipeWithDetails } from '@/types';

export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('recipes')
        .select('*, steps(*), ingredients(*)')
        .eq('id', id)
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setRecipe({
          ...data,
          steps: (data.steps ?? []).sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num),
        } as RecipeWithDetails);
      }

      setLoading(false);
    }

    if (id) load();
  }, [id]);

  return { recipe, loading, error };
}
