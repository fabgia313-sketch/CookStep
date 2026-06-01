# CookStep — Configuration Supabase

## Création du projet
1. Aller sur https://supabase.com → New project
2. Nom : `cookstep`
3. Région : Europe West (Frankfurt) — pour les utilisateurs francophones
4. Conserver l'URL et la clé API `anon` → les mettre dans `.env`

## Variables d'environnement (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxxxxx
```

## Schéma SQL (à exécuter dans Supabase SQL Editor)

```sql
-- Recettes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  duration_min integer,
  difficulty text check (difficulty in ('facile', 'moyen', 'difficile')),
  portions integer default 4,
  category text,
  created_at timestamp default now()
);

-- Étapes
create table steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  order_num integer not null,
  instruction text not null,
  duration_sec integer,
  image_url text
);

-- Ingrédients
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text
);

-- Favoris
create table favorites (
  user_id uuid references auth.users(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete cascade,
  created_at timestamp default now(),
  primary key (user_id, recipe_id)
);

-- Row Level Security
alter table favorites enable row level security;
create policy "Users can manage their own favorites"
  on favorites for all using (auth.uid() = user_id);
```

## Authentification
- Activer : Email/Password + Google OAuth dans Supabase Dashboard → Auth → Providers
- Redirect URL pour Expo Android : `cookstep://auth/callback`

## Import des recettes
Les recettes sont générées via Claude et importées en JSON.
Script d'import disponible dans `/scripts/import-recipes.ts`
