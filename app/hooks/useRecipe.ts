import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { RecipeWithDetails } from '@/types';

interface UseRecipeResult {
  recipe: RecipeWithDetails | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => void;
}

export function useRecipe(id: string): UseRecipeResult {
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        if (!cancelled) { setIsOffline(true); setLoading(false); }
        return;
      }
      if (!cancelled) setIsOffline(false);

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*, steps(*), ingredients(*)')
        .eq('id', id)
        .single();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setRecipe({
          ...data,
          steps: (data.steps ?? []).sort(
            (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
          ),
        } as RecipeWithDetails);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [id, tick]);

  return { recipe, loading, error, isOffline, refetch };
}
