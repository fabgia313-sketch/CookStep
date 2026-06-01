import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  fetchRecipes: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  filteredRecipes: () => Recipe[];
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  error: null,
  isOffline: false,
  searchQuery: '',
  selectedCategory: null,

  fetchRecipes: async () => {
    set({ loading: true, error: null });

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      set({ isOffline: true, loading: false });
      // On garde les recettes déjà en mémoire si disponibles
      return;
    }

    set({ isOffline: false });

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ recipes: data ?? [], loading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  filteredRecipes: () => {
    const { recipes, searchQuery, selectedCategory } = get();
    return recipes.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  },
}));
