import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types';

interface FavoritesState {
  favoriteIds: string[];
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchFavorites: (userId: string) => Promise<void>;
  toggle: (recipeId: string, userId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: [],
  recipes: [],
  loading: false,
  error: null,

  fetchFavorites: async (userId) => {
    set({ loading: true, error: null });

    const { data: favData, error: favError } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userId);

    if (favError) { set({ loading: false, error: favError.message }); return; }

    const ids = (favData ?? []).map((f) => f.recipe_id as string);

    if (ids.length === 0) { set({ favoriteIds: [], recipes: [], loading: false }); return; }

    const { data: recipesData, error: recipesError } = await supabase
      .from('recipes').select('*').in('id', ids);

    if (recipesError) { set({ loading: false, error: recipesError.message }); return; }

    set({ favoriteIds: ids, recipes: (recipesData as Recipe[]) ?? [], loading: false });
  },

  toggle: async (recipeId, userId) => {
    const { favoriteIds, recipes } = get();
    const isFav = favoriteIds.includes(recipeId);

    if (isFav) {
      set({
        favoriteIds: favoriteIds.filter((id) => id !== recipeId),
        recipes: recipes.filter((r) => r.id !== recipeId),
      });
      await supabase.from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId);
    } else {
      set({ favoriteIds: [...favoriteIds, recipeId] });
      const { error } = await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId });
      if (!error) {
        const { data } = await supabase.from('recipes').select('*').eq('id', recipeId).single();
        if (data) set((s) => ({ recipes: [...s.recipes, data as Recipe] }));
      } else {
        set({ favoriteIds });
      }
    }
  },

  isFavorite: (recipeId) => get().favoriteIds.includes(recipeId),
  clear: () => set({ favoriteIds: [], recipes: [], error: null }),
}));
