# CookStep — Journal de sessions

> Mettre à jour après chaque session Claude Code.
> Ce fichier remplace la mémoire entre sessions.

---

## Session 0 — Initialisation projet
**Date** : 18 mai 2026
**Outil** : Claude.ai (chat)
**Statut** : ✅ Terminée

### Ce qui a été fait
- Définition de la stack technique (Expo + Supabase + API Anthropic)
- Analyse concurrentielle (SideChef, Kitchen Stories, Preplo, Tasty)
- Création de la structure du dossier projet
- Rédaction de CLAUDE.md, BRIEF.md, SUPABASE.md, SESSIONS.md
- Décision : données cloud (Supabase) plutôt que local
- Décision : Android uniquement pour la v1
- Différenciation identifiée : IA conversationnelle + marché francophone
- Recettes : générées via Claude, importées en Supabase (~50 recettes)

### Décisions techniques prises
- Supabase pour le backend (pas de JSON local)
- Expo SDK 52 + Expo Router
- API Anthropic pour l'IA embarquée
- EAS Build + Google Play Console pour la publication

### Prochaine session
**Objectif** : Génération des 50 recettes de lancement (JSON prêt pour import Supabase)

---

## Session 1 — Initialisation Expo
**Date** : 18 mai 2026
**Outil** : Claude Code
**Objectif** : Init Expo SDK 52 + Expo Router, connexion Supabase, navigation skeleton, design system
**Statut** : ✅ Terminée

### Ce qui a été fait
- Initialisation du projet Expo SDK 52 + Expo Router v4
- Connexion Supabase (client avec AsyncStorage pour la persistance de session)
- Design system de base : Colors, Typography, Spacing
- Types TypeScript pour Recipe, Step, Ingredient, UserProfile, Favorite
- Navigation : 3 tabs (Explorer, Favoris, Profil) + écran Détail + mode Cuisine
- Store Zustand pour les recettes (fetch, recherche, filtre par catégorie)
- Hooks : useRecipe, useTimer, usePortions
- Composants : Button, RecipeCard
- Stub API Claude (suggestSubstitution, adjustPortions)

### Fichiers créés
- `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`
- `.env` (à remplir), `.gitignore`
- `constants/Colors.ts`, `constants/Typography.ts`, `constants/Spacing.ts`
- `types/index.ts`
- `lib/supabase.ts`, `lib/claude.ts`
- `stores/useRecipeStore.ts`
- `hooks/useRecipe.ts`, `hooks/useTimer.ts`, `hooks/usePortions.ts`
- `components/ui/Button.tsx`, `components/recipe/RecipeCard.tsx`
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/profile.tsx`
- `app/recipe/[id].tsx`, `app/cook/[id].tsx`

### Prochaine session
**Objectif** : Remplir `.env` avec les vraies clés Supabase → `npm install` → tester sur Android

---

_Template pour les prochaines sessions :_

## Session N — [Nom]
**Date** :
**Outil** : Claude Code / Claude.ai
**Objectif** :
**Statut** : 🔄 En cours / ✅ Terminée / ❌ Bloquée

### Ce qui a été fait
-

### Fichiers modifiés
-

### Problèmes rencontrés
-

### Prochaine session
**Objectif** :
