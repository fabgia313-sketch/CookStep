# CookStep — CLAUDE.md
> Fichier de contexte principal pour Claude Code. À lire en entier avant chaque session.

## Présentation du projet
Application mobile de cuisine guidée, étape par étape, pour Android uniquement.
Ton : ludique, chaleureux, accessible. Pas corporate, pas froid.
Objectif : aider n'importe qui à cuisiner avec confiance, les mains libres.

## Stack technique
- **Framework mobile** : Expo SDK 52 + React Native
- **Navigation** : Expo Router (file-based)
- **Langage** : TypeScript strict
- **State management** : Zustand
- **Base de données cloud** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth (email + Google)
- **IA embarquée** : API Anthropic (claude-sonnet-4-20250514)
- **Animations** : react-native-reanimated
- **Icônes** : Lucide React Native
- **Build & deploy** : EAS Build + Google Play Console

## Architecture des dossiers
```
cookstep/
├── app/                    # Écrans (Expo Router)
│   ├── (tabs)/             # Navigation principale
│   │   ├── index.tsx       # Accueil / Explorer
│   │   ├── favorites.tsx   # Favoris
│   │   └── profile.tsx     # Profil utilisateur
│   ├── recipe/[id].tsx     # Détail d'une recette
│   ├── cook/[id].tsx       # Mode cuisine étape par étape
│   └── _layout.tsx
├── components/             # Composants réutilisables
│   ├── ui/                 # Boutons, cards, timers...
│   └── recipe/             # Composants spécifiques recettes
├── hooks/                  # Hooks custom
│   ├── useTimer.ts
│   ├── useRecipe.ts
│   └── usePortions.ts
├── lib/
│   ├── supabase.ts         # Client Supabase
│   └── claude.ts           # Appels API Anthropic
├── stores/                 # Stores Zustand
├── types/                  # Types TypeScript globaux
└── constants/              # Couleurs, typo, spacing
```

## Design system
- **Couleur primaire** : #FF6B35 (orange chaud)
- **Fond** : #FFFBF5 (blanc crème)
- **Texte** : #1A1A1A
- **Accent vert** : #4CAF50 (succès, validation)
- **Typographie** : Nunito (arrondie, ludique)
- **Border radius** : généreux (16–24px)
- **Icônes** : Lucide React Native

## Conventions de code
- Toujours gérer l'état offline gracieusement
- Safe area insets sur tous les écrans
- Toujours gérer les états de permission (non demandé / refusé / accordé)
- Aucun `console.log` en production
- Composants fonctionnels uniquement (pas de classes)
- Nommage : PascalCase composants, camelCase fonctions/variables

## Modèle de données Supabase
```sql
recipes         (id, title, description, image_url, duration_min, difficulty, portions, category, created_at)
steps           (id, recipe_id, order_num, instruction, duration_sec, image_url)
ingredients     (id, recipe_id, name, quantity, unit)
users           (id, email, name, avatar_url)
favorites       (user_id, recipe_id, created_at)
```

## Fonctionnalités IA (API Anthropic)
- Suggestion de substitution d'ingrédient ("je n'ai pas de beurre")
- Ajustement intelligent des portions
- Assistant mains-libres pendant la cuisson

## Concurrents à surveiller
- **Preplo** : extraction IA depuis TikTok, bon cook mode, iOS seulement
- **SideChef** : leader mondial, centré US, interface chargée
- **Kitchen Stories** : beau visuellement, pas d'IA

## Notre différenciation
- IA conversationnelle pendant la cuisson
- Ton vraiment ludique
- Marché francophone sous-servi
- Recettes ajoutables par l'utilisateur, structurées automatiquement par IA

## Règles de session Claude Code
- 1 session = 1 feature ou 1 écran (ne pas mélanger)
- Toujours commencer par lire ce fichier
- Clore chaque session avec un résumé des fichiers modifiés
- Ne jamais modifier la structure de dossiers sans accord explicite
