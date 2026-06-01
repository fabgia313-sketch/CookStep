export type Difficulty = 'facile' | 'moyen' | 'difficile';

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  duration_min: number | null;
  difficulty: Difficulty | null;
  portions: number;
  category: string | null;
  created_at: string;
}

export interface Step {
  id: string;
  recipe_id: string;
  order_num: number;
  instruction: string;
  duration_sec: number | null;
  image_url: string | null;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface Favorite {
  user_id: string;
  recipe_id: string;
  created_at: string;
}

export interface RecipeWithDetails extends Recipe {
  steps: Step[];
  ingredients: Ingredient[];
}
